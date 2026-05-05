/**
 * OfflineSyncProvider Tests
 *
 * Validates Requirements:
 * - 9.1 Red pill shown when offline
 * - 9.2 Blue pill shown when online with pending items
 * - 9.4 Amber pill shown when items have errors
 * - 9.5 Success toast shown after sync completes
 * - 9.6 Spinner shown while syncing
 * - 9.7 Error pill opens PendingItemsModal
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { OfflineSyncProvider } from "./OfflineSyncProvider";
import type { OfflineSyncState } from "@/hooks/useOfflineSync";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/hooks/useOfflineSync");
vi.mock("@/hooks/useAnalyticsSync", () => ({ useAnalyticsSync: vi.fn() }));
vi.mock("@/libs/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock("@/components/organisms/ConflictResolutionModal", () => ({
  default: () => null,
}));
vi.mock("@/components/organisms/ServiceWorkerUpdateBanner", () => ({
  default: () => null,
}));
vi.mock("@/components/organisms/ServiceWorkerUnregisterWarning", () => ({
  default: () => null,
}));
vi.mock("@/components/organisms/PendingItemsModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="pending-modal">
        <button onClick={onClose}>Tutup Modal</button>
      </div>
    ) : null,
}));

import { useOfflineSync } from "@/hooks/useOfflineSync";
import { showToast } from "@/libs/toast";

const mockUseOfflineSync = vi.mocked(useOfflineSync);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeState(
  overrides: Partial<OfflineSyncState> = {},
): OfflineSyncState {
  return {
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    syncNow: vi.fn(),
    errorItems: [],
    retryItem: vi.fn(),
    deleteItem: vi.fn(),
    refreshCount: vi.fn().mockResolvedValue(undefined),
    resolveConflict: vi.fn(),
    dismissConflict: vi.fn(),
    ...overrides,
  };
}

function renderProvider(state: OfflineSyncState) {
  mockUseOfflineSync.mockReturnValue(state);
  return render(
    <OfflineSyncProvider>
      <span>child</span>
    </OfflineSyncProvider>,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("OfflineSyncProvider — banner states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── No banner ──────────────────────────────────────────────────────────────

  it("renders no banner when online with no pending and not syncing", () => {
    renderProvider(
      makeState({ isOnline: true, pendingCount: 0, isSyncing: false }),
    );
    expect(screen.queryByText(/koneksi|tersimpan|gagal|inkron/i)).toBeNull();
  });

  it("always renders children", () => {
    renderProvider(makeState());
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  // ── Offline pill (req 9.1) ─────────────────────────────────────────────────

  it("shows offline pill when isOnline is false", () => {
    renderProvider(makeState({ isOnline: false, pendingCount: 0 }));
    expect(
      screen.getByText(/Tidak ada koneksi — data disimpan offline/),
    ).toBeInTheDocument();
  });

  it("offline pill is not clickable (pointer-events-none)", () => {
    renderProvider(makeState({ isOnline: false }));
    const el = screen.getByText(/Tidak ada koneksi/);
    expect(el.closest("[class*='pointer-events-none']")).toBeInTheDocument();
  });

  // ── Pending pill (req 9.2) ─────────────────────────────────────────────────

  it("shows blue pending pill when online with pending items and no errors", () => {
    renderProvider(
      makeState({ isOnline: true, pendingCount: 3, errorItems: [] }),
    );
    expect(screen.getByText(/3 data tersimpan offline/)).toBeInTheDocument();
  });

  it("shows Sync button in pending pill", () => {
    renderProvider(
      makeState({ isOnline: true, pendingCount: 2, errorItems: [] }),
    );
    expect(screen.getByText("Sync")).toBeInTheDocument();
  });

  it("Sync button calls syncNow", () => {
    const syncNow = vi.fn();
    renderProvider(
      makeState({ isOnline: true, pendingCount: 1, errorItems: [], syncNow }),
    );
    fireEvent.click(screen.getByText("Sync"));
    expect(syncNow).toHaveBeenCalledTimes(1);
  });

  // ── Syncing pill (req 9.6) ─────────────────────────────────────────────────

  it("shows syncing spinner when isSyncing is true", () => {
    renderProvider(
      makeState({ isOnline: true, pendingCount: 2, isSyncing: true }),
    );
    expect(
      screen.getByText(/Menyinkronkan 2 data offline\.\.\./),
    ).toBeInTheDocument();
  });

  it("shows progress label with stage 'uploading_images'", () => {
    renderProvider(
      makeState({
        isOnline: true,
        pendingCount: 3,
        isSyncing: true,
        syncProgress: {
          total: 3,
          completed: 1,
          failed: 0,
          current: {
            itemId: "e1",
            workOrderId: "WO-001",
            stage: "uploading_images",
            progress: 45,
          },
        },
      }),
    );
    expect(
      screen.getByText(/Uploading gambar 2\/3 \(45%\)/),
    ).toBeInTheDocument();
  });

  it("shows progress label with stage 'syncing'", () => {
    renderProvider(
      makeState({
        isOnline: true,
        pendingCount: 3,
        isSyncing: true,
        syncProgress: {
          total: 3,
          completed: 0,
          failed: 0,
          current: {
            itemId: "e1",
            workOrderId: "WO-001",
            stage: "syncing_data",
          },
        },
      }),
    );
    expect(screen.getByText(/Menyinkronkan data 1\/3/)).toBeInTheDocument();
  });

  // ── Error pill (req 9.4 + 9.7) ────────────────────────────────────────────

  it("shows amber error pill when errorItems.length > 0", () => {
    const errorItems = [
      {
        id: "e1",
        workOrderId: "WO-1",
        jenisPekerjaan: "x",
        type: "kirim_hasil" as const,
        status: "error" as const,
        retryCount: 1,
        createdAt: Date.now(),
        progresPayload: {},
        pendingImages: [],
        errorMessage: "timeout",
      },
    ];
    renderProvider(makeState({ isOnline: true, pendingCount: 1, errorItems }));
    expect(
      screen.getByText(/1 data gagal disinkronkan — Tap untuk detail/),
    ).toBeInTheDocument();
  });

  it("error pill is a button (clickable)", () => {
    const errorItems = [
      {
        id: "e1",
        workOrderId: "WO-1",
        jenisPekerjaan: "x",
        type: "kirim_hasil" as const,
        status: "error" as const,
        retryCount: 0,
        createdAt: Date.now(),
        progresPayload: {},
        pendingImages: [],
      },
    ];
    renderProvider(makeState({ isOnline: true, pendingCount: 1, errorItems }));
    const pill = screen.getByRole("button", { name: /gagal disinkronkan/i });
    expect(pill).toBeInTheDocument();
  });

  it("clicking error pill opens PendingItemsModal", () => {
    const errorItems = [
      {
        id: "e1",
        workOrderId: "WO-1",
        jenisPekerjaan: "x",
        type: "kirim_hasil" as const,
        status: "error" as const,
        retryCount: 0,
        createdAt: Date.now(),
        progresPayload: {},
        pendingImages: [],
      },
    ];
    renderProvider(makeState({ isOnline: true, pendingCount: 1, errorItems }));

    expect(screen.queryByTestId("pending-modal")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /gagal disinkronkan/i }),
    );
    expect(screen.getByTestId("pending-modal")).toBeInTheDocument();
  });

  it("modal can be closed via onClose", () => {
    const errorItems = [
      {
        id: "e1",
        workOrderId: "WO-1",
        jenisPekerjaan: "x",
        type: "kirim_hasil" as const,
        status: "error" as const,
        retryCount: 0,
        createdAt: Date.now(),
        progresPayload: {},
        pendingImages: [],
      },
    ];
    renderProvider(makeState({ isOnline: true, pendingCount: 1, errorItems }));
    fireEvent.click(
      screen.getByRole("button", { name: /gagal disinkronkan/i }),
    );
    fireEvent.click(screen.getByText("Tutup Modal"));
    expect(screen.queryByTestId("pending-modal")).toBeNull();
  });

  // ── Success toast (req 9.5) ────────────────────────────────────────────────

  it("fires success toast when sync finishes with no pending and no errors", async () => {
    // Start: isSyncing=true, pendingCount=2
    const { rerender } = renderProvider(
      makeState({
        isOnline: true,
        isSyncing: true,
        pendingCount: 2,
        errorItems: [],
      }),
    );

    // Transition: sync done, all clear
    mockUseOfflineSync.mockReturnValue(
      makeState({
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
        errorItems: [],
      }),
    );

    act(() => {
      rerender(
        <OfflineSyncProvider>
          <span>child</span>
        </OfflineSyncProvider>,
      );
    });

    await waitFor(() =>
      expect(showToast.success).toHaveBeenCalledWith(
        "Semua data berhasil disinkronkan",
      ),
    );
  });

  it("does NOT fire success toast when sync finishes but errors remain", async () => {
    const errorItems = [
      {
        id: "e1",
        workOrderId: "WO-1",
        jenisPekerjaan: "x",
        type: "kirim_hasil" as const,
        status: "error" as const,
        retryCount: 1,
        createdAt: Date.now(),
        progresPayload: {},
        pendingImages: [],
      },
    ];

    const { rerender } = renderProvider(
      makeState({
        isOnline: true,
        isSyncing: true,
        pendingCount: 1,
        errorItems,
      }),
    );

    mockUseOfflineSync.mockReturnValue(
      makeState({
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
        errorItems,
      }),
    );

    act(() => {
      rerender(
        <OfflineSyncProvider>
          <span>child</span>
        </OfflineSyncProvider>,
      );
    });

    // small delay to let effects run
    await new Promise((r) => setTimeout(r, 10));
    expect(showToast.success).not.toHaveBeenCalled();
  });

  // ── Modal auto-close ───────────────────────────────────────────────────────

  it("auto-closes PendingItemsModal when errorItems becomes empty", async () => {
    const errorItems = [
      {
        id: "e1",
        workOrderId: "WO-1",
        jenisPekerjaan: "x",
        type: "kirim_hasil" as const,
        status: "error" as const,
        retryCount: 0,
        createdAt: Date.now(),
        progresPayload: {},
        pendingImages: [],
      },
    ];

    const { rerender } = renderProvider(
      makeState({ isOnline: true, pendingCount: 1, errorItems }),
    );

    // Open modal
    fireEvent.click(
      screen.getByRole("button", { name: /gagal disinkronkan/i }),
    );
    expect(screen.getByTestId("pending-modal")).toBeInTheDocument();

    // All errors resolved
    mockUseOfflineSync.mockReturnValue(
      makeState({ isOnline: true, pendingCount: 0, errorItems: [] }),
    );

    act(() => {
      rerender(
        <OfflineSyncProvider>
          <span>child</span>
        </OfflineSyncProvider>,
      );
    });

    await waitFor(() =>
      expect(screen.queryByTestId("pending-modal")).toBeNull(),
    );
  });
});
