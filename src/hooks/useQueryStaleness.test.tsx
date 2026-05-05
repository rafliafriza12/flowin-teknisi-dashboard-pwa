import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQueryStaleness } from "./useQueryStaleness";
import type { ReactNode } from "react";

describe("useQueryStaleness", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should return loading state when query has not been fetched", () => {
    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current).toEqual({
      lastFetchedAt: null,
      isStale: false,
      staleness: "fresh",
      message: "Memuat data...",
    });
  });

  it("should return fresh state for data less than 1 minute old", () => {
    const now = Date.now();

    // Set query state dengan data yang baru saja di-update (30 detik yang lalu)
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 30 * 1000; // 30 detik yang lalu
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.staleness).toBe("fresh");
    expect(result.current.message).toBe("Baru saja diperbarui");
    expect(result.current.isStale).toBe(false);
    expect(result.current.lastFetchedAt).toBe(now - 30 * 1000);
  });

  it("should return recent state for data between 1 minute and 1 hour old", () => {
    const now = Date.now();

    // Set query state dengan data 15 menit yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 15 * 60 * 1000; // 15 menit yang lalu
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.staleness).toBe("recent");
    expect(result.current.message).toBe("Diperbarui 15 menit yang lalu");
    expect(result.current.isStale).toBe(false);
  });

  it("should return stale state for data between 1 hour and 6 hours old", () => {
    const now = Date.now();

    // Set query state dengan data 3 jam yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 3 * 60 * 60 * 1000; // 3 jam yang lalu
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.staleness).toBe("stale");
    expect(result.current.message).toBe("Diperbarui 3 jam yang lalu");
    expect(result.current.isStale).toBe(true);
  });

  it("should return very_stale state for data more than 6 hours old", () => {
    const now = Date.now();

    // Set query state dengan data 12 jam yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 12 * 60 * 60 * 1000; // 12 jam yang lalu
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.staleness).toBe("very_stale");
    expect(result.current.message).toBe(
      "Data sudah outdated - Refresh saat online",
    );
    expect(result.current.isStale).toBe(true);
  });

  it("should mark data as stale when older than 1 hour", () => {
    const now = Date.now();

    // Set query state dengan data tepat 1 jam + 1 detik yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - (60 * 60 * 1000 + 1000); // 1 jam 1 detik
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.isStale).toBe(true);
  });

  it("should handle edge case at exactly 1 minute boundary", () => {
    const now = Date.now();

    // Set query state dengan data tepat 1 menit yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 60 * 1000; // Tepat 1 menit
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.staleness).toBe("recent");
    expect(result.current.message).toBe("Diperbarui 1 menit yang lalu");
  });

  it("should handle edge case at exactly 1 hour boundary", () => {
    const now = Date.now();

    // Set query state dengan data tepat 1 jam yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 60 * 60 * 1000; // Tepat 1 jam
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.staleness).toBe("stale");
    expect(result.current.message).toBe("Diperbarui 1 jam yang lalu");
  });

  it("should handle edge case at exactly 6 hours boundary", () => {
    const now = Date.now();

    // Set query state dengan data tepat 6 jam yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 6 * 60 * 60 * 1000; // Tepat 6 jam
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.staleness).toBe("very_stale");
    expect(result.current.message).toBe(
      "Data sudah outdated - Refresh saat online",
    );
  });

  it("should work with different query keys", () => {
    const now = Date.now();

    // Set multiple queries
    queryClient.setQueryData(["workOrder", "123"], { data: "test1" });
    queryClient.setQueryData(["profile"], { data: "test2" });

    const queryState1 = queryClient.getQueryState(["workOrder", "123"]);
    const queryState2 = queryClient.getQueryState(["profile"]);

    if (queryState1) {
      queryState1.dataUpdatedAt = now - 5 * 60 * 1000; // 5 menit
    }
    if (queryState2) {
      queryState2.dataUpdatedAt = now - 2 * 60 * 60 * 1000; // 2 jam
    }

    const { result: result1 } = renderHook(
      () => useQueryStaleness(["workOrder", "123"]),
      { wrapper },
    );
    const { result: result2 } = renderHook(() => useQueryStaleness(["profile"]), {
      wrapper,
    });

    expect(result1.current.staleness).toBe("recent");
    expect(result2.current.staleness).toBe("stale");
  });

  it("should calculate minutes correctly for recent data", () => {
    const now = Date.now();

    // Test dengan 45 menit yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 45 * 60 * 1000;
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.message).toBe("Diperbarui 45 menit yang lalu");
  });

  it("should calculate hours correctly for stale data", () => {
    const now = Date.now();

    // Test dengan 5 jam yang lalu
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 5 * 60 * 60 * 1000;
    }

    const { result } = renderHook(() => useQueryStaleness(["test-query"]), {
      wrapper,
    });

    expect(result.current.message).toBe("Diperbarui 5 jam yang lalu");
  });
});
