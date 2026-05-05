/**
 * PendingItemsModal Tests
 *
 * Validates Requirements 9.7:
 * - Display list of failed items with error status
 * - Retry and delete actions per item
 * - Delete confirmation flow
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PendingItemsModal from "./PendingItemsModal";
import type { PendingUploadItem } from "@/libs/offlineQueue";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeItem(
  overrides: Partial<PendingUploadItem> = {},
): PendingUploadItem {
  return {
    id: "item-1",
    workOrderId: "WO-001",
    jenisPekerjaan: "perbaikan",
    type: "kirim_hasil",
    status: "error",
    retryCount: 2,
    createdAt: Date.now(),
    progresPayload: {},
    pendingImages: [],
    errorMessage: "Network timeout",
    ...overrides,
  };
}

const defaultProps = {
  isOpen: true,
  items: [],
  onRetry: vi.fn(),
  onDelete: vi.fn(),
  onClose: vi.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PendingItemsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onRetry.mockResolvedValue(undefined);
    defaultProps.onDelete.mockResolvedValue(undefined);
  });

  // ── Visibility ─────────────────────────────────────────────────────────────

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <PendingItemsModal {...defaultProps} isOpen={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders modal overlay when isOpen is true", () => {
    render(<PendingItemsModal {...defaultProps} />);
    expect(screen.getByText("Data Gagal Disinkronkan")).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it("shows empty state when items array is empty", () => {
    render(<PendingItemsModal {...defaultProps} items={[]} />);
    expect(screen.getByText("Semua item berhasil")).toBeInTheDocument();
  });

  // ── Item rendering ─────────────────────────────────────────────────────────

  it("renders item with workOrderId", () => {
    const item = makeItem({ workOrderId: "WO-999" });
    render(<PendingItemsModal {...defaultProps} items={[item]} />);
    expect(screen.getByText(/WO-999/)).toBeInTheDocument();
  });

  it("shows 'Kirim Hasil' label for type kirim_hasil", () => {
    const item = makeItem({ type: "kirim_hasil" });
    render(<PendingItemsModal {...defaultProps} items={[item]} />);
    expect(screen.getByText("Kirim Hasil")).toBeInTheDocument();
  });

  it("shows 'Simpan Progres' label for type simpan_progres", () => {
    const item = makeItem({ type: "simpan_progres" });
    render(<PendingItemsModal {...defaultProps} items={[item]} />);
    expect(screen.getByText("Simpan Progres")).toBeInTheDocument();
  });

  it("shows error message when present", () => {
    const item = makeItem({ errorMessage: "Koneksi terputus saat upload" });
    render(<PendingItemsModal {...defaultProps} items={[item]} />);
    expect(
      screen.getByText("Koneksi terputus saat upload"),
    ).toBeInTheDocument();
  });

  it("shows retry count per item", () => {
    const item = makeItem({ retryCount: 3 });
    render(<PendingItemsModal {...defaultProps} items={[item]} />);
    expect(screen.getByText(/Percobaan: 3x/)).toBeInTheDocument();
  });

  it("shows item count in subtitle", () => {
    const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
    render(<PendingItemsModal {...defaultProps} items={items} />);
    expect(screen.getByText(/2 item gagal/)).toBeInTheDocument();
  });

  // ── Retry action ───────────────────────────────────────────────────────────

  it("calls onRetry with item id when 'Coba Ulang' clicked", async () => {
    const item = makeItem({ id: "item-retry-1" });
    render(<PendingItemsModal {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByText("Coba Ulang"));
    await waitFor(() =>
      expect(defaultProps.onRetry).toHaveBeenCalledWith("item-retry-1"),
    );
  });

  it("shows loading text while retrying", async () => {
    let resolveRetry: () => void;
    const slowRetry = vi.fn(
      () => new Promise<void>((res) => (resolveRetry = res)),
    );

    const item = makeItem({ id: "r1" });
    render(
      <PendingItemsModal
        {...defaultProps}
        onRetry={slowRetry}
        items={[item]}
      />,
    );

    fireEvent.click(screen.getByText("Coba Ulang"));

    await waitFor(() =>
      expect(screen.getByText("Mencoba...")).toBeInTheDocument(),
    );

    // Resolve and clean up
    resolveRetry!();
    await waitFor(() =>
      expect(screen.getByText("Coba Ulang")).toBeInTheDocument(),
    );
  });

  // ── Delete confirmation flow ───────────────────────────────────────────────

  it("shows confirmation buttons after 'Hapus' is clicked", () => {
    const item = makeItem();
    render(<PendingItemsModal {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByText("Hapus"));

    expect(screen.getByText("Ya, hapus")).toBeInTheDocument();
    expect(screen.getByText("Batal")).toBeInTheDocument();
  });

  it("hides normal action buttons while confirming", () => {
    const item = makeItem();
    render(<PendingItemsModal {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByText("Hapus"));

    expect(screen.queryByText("Coba Ulang")).not.toBeInTheDocument();
    expect(screen.queryByText("Hapus")).not.toBeInTheDocument();
  });

  it("calls onDelete with item id when 'Ya, hapus' confirmed", async () => {
    const item = makeItem({ id: "del-1" });
    render(<PendingItemsModal {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByText("Hapus"));
    fireEvent.click(screen.getByText("Ya, hapus"));

    await waitFor(() =>
      expect(defaultProps.onDelete).toHaveBeenCalledWith("del-1"),
    );
  });

  it("cancels delete confirmation when 'Batal' is clicked", () => {
    const item = makeItem();
    render(<PendingItemsModal {...defaultProps} items={[item]} />);

    fireEvent.click(screen.getByText("Hapus"));
    fireEvent.click(screen.getByText("Batal"));

    expect(screen.getByText("Coba Ulang")).toBeInTheDocument();
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
  });

  // ── Close actions ──────────────────────────────────────────────────────────

  it("calls onClose when 'Tutup' footer button is clicked", () => {
    render(<PendingItemsModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Tutup"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when header X button is clicked", () => {
    render(<PendingItemsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Tutup"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // ── Multiple items ─────────────────────────────────────────────────────────

  it("confirms only the clicked item, not others", () => {
    const items = [
      makeItem({ id: "a", workOrderId: "WO-001" }),
      makeItem({ id: "b", workOrderId: "WO-002" }),
    ];
    render(<PendingItemsModal {...defaultProps} items={items} />);

    const hapusButtons = screen.getAllByText("Hapus");
    fireEvent.click(hapusButtons[0]);

    // Only first item enters confirm mode
    expect(screen.getByText("Ya, hapus")).toBeInTheDocument();
    // Second item still shows normal buttons — check Coba Ulang still exists
    const cobaButtons = screen.getAllByText("Coba Ulang");
    expect(cobaButtons).toHaveLength(1); // second item still shows it
  });
});
