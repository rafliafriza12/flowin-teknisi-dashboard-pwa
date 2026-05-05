/**
 * Tests for useOfflineFormSubmit Hook
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2**
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useOfflineFormSubmit } from "./useOfflineFormSubmit";
import * as offlineQueue from "@/libs/offlineQueue";
import * as cloudinary from "@/libs/cloudinary";
import * as imageCompression from "@/libs/imageCompression";
import * as graphqlActions from "@/libs/graphql/actions";
import * as toast from "@/libs/toast";

// Mock dependencies
vi.mock("./useOfflineSync", () => ({
  useOfflineSync: vi.fn(() => ({
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

vi.mock("@/libs/offlineQueue");
vi.mock("@/libs/cloudinary");
vi.mock("@/libs/imageCompression");
vi.mock("@/libs/graphql/actions");
vi.mock("@/libs/toast");

describe("useOfflineFormSubmit", () => {
  const mockOptions = {
    workOrderId: "wo-123",
    jenisPekerjaan: "Pemasangan Baru",
    type: "simpan_progres" as const,
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
  const mockPayload = { status: "In Progress", notes: "Working on it" };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(imageCompression.compressImage).mockResolvedValue(mockFile);
    vi.mocked(cloudinary.uploadToCloudinary).mockResolvedValue({
      secure_url: "https://cloudinary.com/test.jpg",
      public_id: "test",
      format: "jpg",
      resource_type: "image",
      bytes: 1024,
    });
    vi.mocked(graphqlActions.graphqlAction).mockResolvedValue({
      simpanProgres: { success: true, message: "Success" },
    });
    vi.mocked(offlineQueue.addPendingItem).mockResolvedValue("pending-123");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Online Submission", () => {
    it("should submit directly when online", async () => {
      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      expect(result.current.isSubmitting).toBe(false);

      await act(async () => {
        await result.current.submit(mockPayload, [
          { fieldKey: "urlJaringan", file: mockFile },
        ]);
      });

      // Should upload to Cloudinary
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({
          folder: "floein/work_orders/pemasangan_baru",
          resourceType: "image",
          tags: ["wo-123", "Pemasangan Baru"],
        }),
      );

      // Should call GraphQL mutation
      expect(graphqlActions.graphqlAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            workOrderId: "wo-123",
          }),
        }),
        expect.anything(),
      );

      // Should show success toast
      expect(toast.showToast.success).toHaveBeenCalledWith(
        "Data berhasil disimpan",
      );

      // Should call onSuccess callback
      expect(mockOptions.onSuccess).toHaveBeenCalled();

      // Should not add to offline queue
      expect(offlineQueue.addPendingItem).not.toHaveBeenCalled();
    });

    it("should compress images larger than 2MB before upload", async () => {
      const largeFile = new File(["x".repeat(3 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(largeFile, "size", { value: 3 * 1024 * 1024 });

      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      await act(async () => {
        await result.current.submit(mockPayload, [
          { fieldKey: "urlJaringan", file: largeFile },
        ]);
      });

      // Should compress the image
      expect(imageCompression.compressImage).toHaveBeenCalledWith(largeFile, 2);
    });

    it("should not compress images smaller than 2MB", async () => {
      const smallFile = new File(["small"], "small.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(smallFile, "size", { value: 1024 * 1024 });

      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      await act(async () => {
        await result.current.submit(mockPayload, [
          { fieldKey: "urlJaringan", file: smallFile },
        ]);
      });

      // Should not compress the image
      expect(imageCompression.compressImage).not.toHaveBeenCalled();
    });

    it("should call kirimHasil mutation when type is kirim_hasil", async () => {
      const kirimHasilOptions = {
        ...mockOptions,
        type: "kirim_hasil" as const,
      };

      const { result } = renderHook(() =>
        useOfflineFormSubmit(kirimHasilOptions),
      );

      await act(async () => {
        await result.current.submit(mockPayload, []);
      });

      // Should call both simpanProgres and kirimHasil
      expect(graphqlActions.graphqlAction).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple images", async () => {
      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      const images = [
        { fieldKey: "urlGambar_0", file: mockFile },
        { fieldKey: "urlGambar_1", file: mockFile },
        { fieldKey: "urlJaringan", file: mockFile },
      ];

      await act(async () => {
        await result.current.submit(mockPayload, images);
      });

      // Should upload all images
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalledTimes(3);
    });

    it("should handle errors and call onError callback", async () => {
      const error = new Error("Upload failed");
      vi.mocked(cloudinary.uploadToCloudinary).mockRejectedValue(error);

      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      await act(async () => {
        await result.current.submit(mockPayload, [
          { fieldKey: "urlJaringan", file: mockFile },
        ]);
      });

      // Should call onError callback
      expect(mockOptions.onError).toHaveBeenCalledWith(error);

      // Should show error toast
      expect(toast.showErrorToast).toHaveBeenCalledWith(error);

      // Should not call onSuccess
      expect(mockOptions.onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Offline Submission", () => {
    beforeEach(async () => {
      // Mock offline state
      const useOfflineSyncModule = await import("./useOfflineSync");
      vi.mocked(useOfflineSyncModule.useOfflineSync).mockReturnValue({
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
    });

    it("should queue item when offline", async () => {
      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      await act(async () => {
        await result.current.submit(mockPayload, [
          { fieldKey: "urlJaringan", file: mockFile },
        ]);
      });

      // Should add to offline queue
      expect(offlineQueue.addPendingItem).toHaveBeenCalledWith({
        workOrderId: "wo-123",
        jenisPekerjaan: "Pemasangan Baru",
        progresPayload: mockPayload,
        pendingImages: expect.arrayContaining([
          expect.objectContaining({
            fieldKey: "urlJaringan",
            file: mockFile,
            cloudinaryFolder: "floein/work_orders/pemasangan_baru",
            tags: ["wo-123", "Pemasangan Baru"],
          }),
        ]),
        type: "simpan_progres",
      });

      // Should show offline toast
      expect(toast.showToast.info).toHaveBeenCalledWith(
        "Data disimpan offline, akan disinkronkan saat online",
      );

      // Should call onSuccess callback
      expect(mockOptions.onSuccess).toHaveBeenCalled();

      // Should not upload to Cloudinary
      expect(cloudinary.uploadToCloudinary).not.toHaveBeenCalled();

      // Should not call GraphQL mutation
      expect(graphqlActions.graphqlAction).not.toHaveBeenCalled();
    });

    it("should compress images before queueing", async () => {
      const largeFile = new File(["x".repeat(3 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(largeFile, "size", { value: 3 * 1024 * 1024 });

      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      await act(async () => {
        await result.current.submit(mockPayload, [
          { fieldKey: "urlJaringan", file: largeFile },
        ]);
      });

      // Should compress before queueing
      expect(imageCompression.compressImage).toHaveBeenCalledWith(largeFile, 2);
    });

    it("should refresh pending count after queueing", async () => {
      const useOfflineSyncModule = await import("./useOfflineSync");
      const mockRefreshCount = vi.fn();
      vi.mocked(useOfflineSyncModule.useOfflineSync).mockReturnValue({
        isOnline: false,
        pendingCount: 0,
        isSyncing: false,
        syncProgress: undefined,
        errorItems: [],
        syncNow: vi.fn(),
        refreshCount: mockRefreshCount,
        retryItem: vi.fn(),
        deleteItem: vi.fn(),
      });

      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      await act(async () => {
        await result.current.submit(mockPayload, []);
      });

      // Should refresh count
      expect(mockRefreshCount).toHaveBeenCalled();
    });
  });

  describe("isSubmitting State", () => {
    it("should set isSubmitting to true during submission", async () => {
      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      expect(result.current.isSubmitting).toBe(false);

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.submit(mockPayload, []);
      });

      // Should be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      await act(async () => {
        await submitPromise;
      });

      // Should be done submitting
      expect(result.current.isSubmitting).toBe(false);
    });

    it("should reset isSubmitting even on error", async () => {
      vi.mocked(cloudinary.uploadToCloudinary).mockRejectedValue(
        new Error("Upload failed"),
      );

      const { result } = renderHook(() => useOfflineFormSubmit(mockOptions));

      await act(async () => {
        await result.current.submit(mockPayload, [
          { fieldKey: "urlJaringan", file: mockFile },
        ]);
      });

      // Should reset isSubmitting
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe("Cloudinary Folder Generation", () => {
    it("should generate correct folder path for different jenis pekerjaan", async () => {
      const testCases = [
        {
          jenisPekerjaan: "Pemasangan Baru",
          expected: "floein/work_orders/pemasangan_baru",
        },
        {
          jenisPekerjaan: "Maintenance",
          expected: "floein/work_orders/maintenance",
        },
        {
          jenisPekerjaan: "Pengawasan Jaringan",
          expected: "floein/work_orders/pengawasan_jaringan",
        },
      ];

      for (const testCase of testCases) {
        const options = {
          ...mockOptions,
          jenisPekerjaan: testCase.jenisPekerjaan,
        };
        const { result } = renderHook(() => useOfflineFormSubmit(options));

        await act(async () => {
          await result.current.submit(mockPayload, [
            { fieldKey: "urlJaringan", file: mockFile },
          ]);
        });

        expect(cloudinary.uploadToCloudinary).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            folder: testCase.expected,
          }),
        );

        vi.clearAllMocks();
      }
    });
  });
});
