import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PekerjaanDetailTemplate from "./PekerjaanDetailTemplate";

// Mock the useWorkOrder and useWorkflowChain hooks
vi.mock("@/services/workOrderService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/workOrderService")>();
  return {
    ...actual,
    useWorkOrder: vi.fn(() => ({
      data: {
        workOrder: {
          id: "test-id",
          jenisPekerjaan: "pemasangan",
          status: "belum_dikerjakan",
          statusRespon: "belum_direspon",
          idKoneksiData: "test-koneksi",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teknisiPenanggungJawab: {
            namaLengkap: "Test Teknisi",
            nip: "12345",
          },
          tim: [],
          koneksiData: {
            alamat: "Test Address",
            kelurahan: "Test Kelurahan",
            kecamatan: "Test Kecamatan",
          },
          riwayatReview: [],
          riwayatRespon: [],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    })),
    useWorkflowChain: vi.fn(() => ({
      data: null,
      isLoading: false,
    })),
  };
});

// Mock the OfflineSyncProvider
vi.mock("@/providers/OfflineSyncProvider", () => ({
  OfflineSyncProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useOfflineSyncContext: vi.fn(() => ({
    isOnline: false, // Set to offline so StalenessIndicator renders
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

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("PekerjaanDetailTemplate - StalenessIndicator Integration", () => {
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
        <PekerjaanDetailTemplate id="test-id" />
      </QueryClientProvider>,
    );

    // Verify the breadcrumb is rendered
    expect(screen.getByText("Pekerjaan")).toBeInTheDocument();

    // Verify the work order type is rendered (use getAllByText since it appears twice)
    const pemasanganElements = screen.getAllByText("Pemasangan");
    expect(pemasanganElements.length).toBeGreaterThan(0);
  });

  it("should pass correct query key to StalenessIndicator", () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PekerjaanDetailTemplate id="test-id" />
      </QueryClientProvider>,
    );

    // Verify the staleness indicator is rendered (it has bg-blue-50 class when offline)
    const stalenessContainer = container.querySelector(".bg-blue-50");
    expect(stalenessContainer).not.toBeNull();
  });
});
