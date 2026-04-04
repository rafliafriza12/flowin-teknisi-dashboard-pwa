"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import {
  GRAPHQL_ENDPOINT,
  type GraphQLResponse,
  isAuthErr,
  isForbidErr,
} from "./utils";
import { generateSignatureHash } from "./signatureHash";

// ============ REFRESH TOKEN (SERVER-SIDE) ============

/**
 * Refresh access token menggunakan refresh token dari cookies.
 * Cookies diperbarui server-side — browser menerima Set-Cookie header.
 */
async function refreshTokenAction(): Promise<string> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.INTERNAL_API_SECRET || "",
    },
    body: JSON.stringify({
      query: `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            accessToken
            refreshToken
          }
        }
      `,
      variables: { refreshToken },
    }),
  });

  if (!response.ok) {
    throw new Error(`Refresh request failed: ${response.status}`);
  }

  const json: GraphQLResponse<{
    refreshToken: { accessToken: string; refreshToken: string };
  }> = await response.json();

  if (json?.errors?.length) {
    const msg = json.errors.map((e) => e.message).join(", ");
    throw new Error(`Refresh token error: ${msg}`);
  }

  const data = json?.data?.refreshToken;
  if (!data?.accessToken) {
    throw new Error("Failed to refresh token");
  }

  const secure = process.env.NODE_ENV === "production";

  // Set cookies baru — browser akan menerima via Set-Cookie header
  cookieStore.set("access_token", data.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 menit (sesuai JWT exp)
  });
  cookieStore.set("refresh_token", data.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
  });

  return data.accessToken;
}

// Set cookies pada login/register
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 menit (sesuai JWT exp)
  });
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
  });
}

// Clear cookies pada logout
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

// ============ SERVER ACTIONS ============

/**
 * Server Action: GraphQL request WITH authentication.
 *
 * - Membaca access token dari cookies (server-side via next/headers)
 * - Otomatis refresh token jika UNAUTHENTICATED
 * - Redirect ke /login jika refresh gagal
 * - Jika `signPayload` diberikan, generate HMAC-SHA256 signature dan kirim via `x-signature` header
 *
 * Gunakan untuk semua protected queries & mutations.
 */
export async function graphqlAction<T>(
  query: string,
  variables?: Record<string, unknown>,
  signPayload?: unknown,
): Promise<T> {
  const makeRequest = async (
    overrideToken?: string,
  ): Promise<GraphQLResponse<T>> => {
    const cookieStore = await cookies();
    const token = overrideToken ?? cookieStore.get("access_token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": process.env.INTERNAL_API_SECRET || "",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Tambahkan signature hash jika ada payload yang perlu di-sign
    if (signPayload !== undefined) {
      headers["x-signature"] = generateSignatureHash(signPayload);
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    let result: GraphQLResponse<T>;
    try {
      result = await response.json();
    } catch (e) {
      if (response.status === 401) {
        return {
          errors: [
            {
              message: "Unauthorized",
              extensions: { code: "UNAUTHENTICATED", statusCode: 401 },
            },
          ],
        };
      }
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      throw new Error("Failed to parse JSON");
    }

    if (response.status === 401 && !result.errors?.length) {
      return {
        errors: [
          {
            message: "Unauthorized",
            extensions: { code: "UNAUTHENTICATED", statusCode: 401 },
          },
        ],
      };
    }

    if (!response.ok && !result.errors?.length) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return result;
  };

  let result = await makeRequest();

  // Auto-refresh jika token expired (UNAUTHENTICATED dari GraphQL atau HTTP 401)
  if (result.errors?.length && isAuthErr(result.errors)) {
    let refreshed = false;
    try {
      const newToken = await refreshTokenAction();
      result = await makeRequest(newToken);
      refreshed = true;
    } catch (err) {
      // Biarkan redirect error Next.js tetap propagate (jangan di-swallow)
      if (isRedirectError(err)) throw err;
      // Refresh token expired/invalid → redirect ke login
    }
    if (!refreshed) {
      redirect("/login");
    }
  }

  if (result.errors?.length) {
    const first = result.errors[0];
    const msg = result.errors.map((e) => e.message).join(", ");

    const err = Object.assign(new Error(msg), {
      code: first.extensions?.code,
      statusCode: first.extensions?.statusCode,
      details: first.extensions?.details,
      isForbiddenError: isForbidErr(result.errors),
      isAuthError: isAuthErr(result.errors),
    });

    throw err;
  }

  if (!result.data) {
    throw new Error("No data returned from GraphQL");
  }

  return result.data;
}

/**
 * Server Action: GraphQL request WITHOUT authentication (Public).
 *
 * Tidak ada token di header, tidak ada auto refresh.
 * Gunakan untuk: login, register, forgot password.
 */
export async function graphqlPublicAction<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.INTERNAL_API_SECRET || "",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  let result: GraphQLResponse<T>;
  try {
    result = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    throw new Error("Failed to parse GraphQL response");
  }

  if (result.errors?.length) {
    const msg = result.errors.map((e) => e.message).join(", ");
    throw new Error(`GraphQL Error: ${msg}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  if (!result.data) {
    throw new Error("No data returned from GraphQL");
  }

  return result.data;
}
