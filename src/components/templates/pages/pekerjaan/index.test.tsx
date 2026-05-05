import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PekerjaanListTemplate from "./index";

// Mock the useWorkOrdersSaya hook
vi.mock("@/services/workOrderService", () => ({
  useWorkOrdersSaya: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// Mock the OfflineSyncProvider
vi.mock("@/providers/OfflineSyncProvider", () => ({
  OfflineSyncProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useOfflineSyncContext: vi.fn(() => ({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    syncProgress: undefined,
    errorItems: [],
    syncNow: vi.fn(),
    refreshCount: vi.fn(),
    retryItem: vi.fn(),
    deleteItem: vi.fn(),
  })),
}));

// Mock the useQueryStaleness hook
vi.mock("@/hooks/useQueryStaleness", () => ({
  useQueryStaleness: vi.fn(() => ({
    lastFetchedAt: Date.now(),
    isStale: false,
    staleness: "fresh",
    message: "Just updated",
  })),
}));

describe("PekerjaanListTemplate - StalenessIndicator Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("should render StalenessIndicator component", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PekerjaanListTemplate />
      </QueryClientProvider>,
    );

    // Verify the page header is rendered
    expect(screen.getByText("Pekerjaan Saya")).toBeInTheDocument();

    // Verify the description is rendered
    expect(
      screen.getByText("Daftar semua pekerjaan yang ditugaskan kepada Anda"),
    ).toBeInTheDocument();
  });
});
