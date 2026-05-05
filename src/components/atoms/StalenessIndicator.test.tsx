import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StalenessIndicator from "./StalenessIndicator";
import type { ReactNode } from "react";

// Mock OfflineSyncProvider
vi.mock("@/providers/OfflineSyncProvider", () => ({
  useOfflineSyncContext: vi.fn(),
}));

import { useOfflineSyncContext } from "@/providers/OfflineSyncProvider";

describe("StalenessIndicator", () => {
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

  it("should not render when online", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: true,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const { container } = render(
      <StalenessIndicator queryKey={["test-query"]} />,
      { wrapper },
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render timestamp message when offline with fresh data", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 30 * 1000; // 30 detik yang lalu
    }

    render(<StalenessIndicator queryKey={["test-query"]} />, { wrapper });

    expect(screen.getByText("Baru saja diperbarui")).toBeInTheDocument();
  });

  it("should render timestamp message when offline with recent data", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 15 * 60 * 1000; // 15 menit yang lalu
    }

    render(<StalenessIndicator queryKey={["test-query"]} />, { wrapper });

    expect(
      screen.getByText("Diperbarui 15 menit yang lalu"),
    ).toBeInTheDocument();
  });

  it("should show amber warning badge for stale data (> 1 hour)", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 3 * 60 * 60 * 1000; // 3 jam yang lalu
    }

    render(<StalenessIndicator queryKey={["test-query"]} />, { wrapper });

    expect(screen.getByText("Diperbarui 3 jam yang lalu")).toBeInTheDocument();
    expect(screen.getByText("Data mungkin tidak akurat")).toBeInTheDocument();

    // Check for amber color class
    const badge = screen.getByText("Data mungkin tidak akurat");
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-800");
  });

  it("should show red error badge for very stale data (> 6 hours)", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 12 * 60 * 60 * 1000; // 12 jam yang lalu
    }

    render(<StalenessIndicator queryKey={["test-query"]} />, { wrapper });

    expect(
      screen.getByText("Data sudah outdated - Refresh saat online"),
    ).toBeInTheDocument();
    expect(screen.getByText("Data sudah outdated")).toBeInTheDocument();

    // Check for red color class
    const badge = screen.getByText("Data sudah outdated");
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");
  });

  it("should not show warning badge for fresh data", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 30 * 1000; // 30 detik yang lalu
    }

    render(<StalenessIndicator queryKey={["test-query"]} />, { wrapper });

    expect(screen.getByText("Baru saja diperbarui")).toBeInTheDocument();
    expect(
      screen.queryByText("Data mungkin tidak akurat"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("⚠️ Data sudah outdated"),
    ).not.toBeInTheDocument();
  });

  it("should not show warning badge for recent data (< 1 hour)", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 45 * 60 * 1000; // 45 menit yang lalu
    }

    render(<StalenessIndicator queryKey={["test-query"]} />, { wrapper });

    expect(
      screen.getByText("Diperbarui 45 menit yang lalu"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Data mungkin tidak akurat"),
    ).not.toBeInTheDocument();
  });

  it("should accept custom className prop", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["test-query"], { data: "test" });
    const queryState = queryClient.getQueryState(["test-query"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 30 * 1000;
    }

    const { container } = render(
      <StalenessIndicator queryKey={["test-query"]} className="custom-class" />,
      { wrapper },
    );

    const element = container.firstChild as HTMLElement;
    expect(element.className).toContain("custom-class");
  });

  it("should work with different query keys", () => {
    vi.mocked(useOfflineSyncContext).mockReturnValue({
      isOnline: false,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: undefined,
      errorItems: [],
      syncNow: vi.fn(),
      refreshCount: vi.fn(),
      retryItem: vi.fn(),
      deleteItem: vi.fn(),
    });

    const now = Date.now();
    queryClient.setQueryData(["workOrder", "123"], { data: "test" });
    const queryState = queryClient.getQueryState(["workOrder", "123"]);
    if (queryState) {
      queryState.dataUpdatedAt = now - 2 * 60 * 60 * 1000; // 2 jam yang lalu
    }

    render(<StalenessIndicator queryKey={["workOrder", "123"]} />, { wrapper });

    expect(screen.getByText("Diperbarui 2 jam yang lalu")).toBeInTheDocument();
    expect(screen.getByText("Data mungkin tidak akurat")).toBeInTheDocument();
  });
});
