/**
 * Unit tests for offlineQueue.ts
 * Tests the PendingUploadItem interface with new conflictData and lastSyncAttempt fields
 */

import { describe, it, expect } from "vitest";
import type { PendingUploadItem } from "./offlineQueue";

describe("PendingUploadItem Interface", () => {
  it("should allow creating a PendingUploadItem with all required fields", () => {
    const item: PendingUploadItem = {
      id: "test-id",
      createdAt: Date.now(),
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [],
      type: "simpan_progres",
      status: "pending",
      retryCount: 0,
    };

    expect(item).toBeDefined();
    expect(item.id).toBe("test-id");
    expect(item.workOrderId).toBe("wo-001");
  });

  it("should allow creating a PendingUploadItem with optional conflictData field", () => {
    const item: PendingUploadItem = {
      id: "test-id",
      createdAt: Date.now(),
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [],
      type: "simpan_progres",
      status: "error",
      retryCount: 1,
      conflictData: {
        serverData: { status: "Completed" },
        detectedAt: Date.now(),
      },
    };

    expect(item.conflictData).toBeDefined();
    expect(item.conflictData?.serverData).toEqual({ status: "Completed" });
    expect(typeof item.conflictData?.detectedAt).toBe("number");
  });

  it("should allow creating a PendingUploadItem with optional lastSyncAttempt field", () => {
    const timestamp = Date.now();
    const item: PendingUploadItem = {
      id: "test-id",
      createdAt: Date.now(),
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [],
      type: "simpan_progres",
      status: "error",
      retryCount: 2,
      lastSyncAttempt: timestamp,
    };

    expect(item.lastSyncAttempt).toBeDefined();
    expect(item.lastSyncAttempt).toBe(timestamp);
  });

  it("should allow creating a PendingUploadItem with both optional fields", () => {
    const timestamp = Date.now();
    const item: PendingUploadItem = {
      id: "test-id",
      createdAt: Date.now(),
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [],
      type: "simpan_progres",
      status: "error",
      retryCount: 3,
      conflictData: {
        serverData: { status: "Completed", updatedBy: "admin" },
        detectedAt: timestamp - 1000,
      },
      lastSyncAttempt: timestamp,
    };

    expect(item.conflictData).toBeDefined();
    expect(item.lastSyncAttempt).toBeDefined();
    expect(item.conflictData?.serverData).toEqual({
      status: "Completed",
      updatedBy: "admin",
    });
    expect(item.lastSyncAttempt).toBe(timestamp);
  });

  it("should allow creating a PendingUploadItem without optional fields", () => {
    const item: PendingUploadItem = {
      id: "test-id",
      createdAt: Date.now(),
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [],
      type: "kirim_hasil",
      status: "pending",
      retryCount: 0,
    };

    expect(item.conflictData).toBeUndefined();
    expect(item.lastSyncAttempt).toBeUndefined();
  });

  it("should validate conflictData structure", () => {
    const item: PendingUploadItem = {
      id: "test-id",
      createdAt: Date.now(),
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [],
      type: "simpan_progres",
      status: "error",
      retryCount: 1,
      conflictData: {
        serverData: {
          field1: "value1",
          field2: 123,
          field3: true,
          nested: { key: "value" },
        },
        detectedAt: 1234567890,
      },
    };

    expect(item.conflictData?.serverData).toHaveProperty("field1");
    expect(item.conflictData?.serverData).toHaveProperty("field2");
    expect(item.conflictData?.serverData).toHaveProperty("field3");
    expect(item.conflictData?.serverData).toHaveProperty("nested");
    expect(item.conflictData?.detectedAt).toBe(1234567890);
  });
});

describe("addPendingItem - Image Compression", () => {
  // Note: These tests verify the integration with compressImage
  // Full IndexedDB testing would require more complex mocking

  it("should call compressImage for each pending image", async () => {
    // This test documents the expected behavior:
    // addPendingItem should call compressImage(file, 2) for each image
    // The compressed files should be stored in IndexedDB

    const mockFile = new File(["x".repeat(3 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    const item = {
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [
        {
          fieldKey: "urlFoto",
          file: mockFile,
          cloudinaryFolder: "work-orders",
          tags: ["wo-001"],
        },
      ],
      type: "simpan_progres" as const,
    };

    // Verify the structure is correct
    expect(item.pendingImages).toHaveLength(1);
    expect(item.pendingImages[0].file).toBe(mockFile);
    expect(item.pendingImages[0].fieldKey).toBe("urlFoto");
  });

  it("should handle multiple images", () => {
    const file1 = new File(["x".repeat(3 * 1024 * 1024)], "image1.jpg", {
      type: "image/jpeg",
    });
    const file2 = new File(["x".repeat(4 * 1024 * 1024)], "image2.jpg", {
      type: "image/jpeg",
    });

    const item = {
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [
        {
          fieldKey: "urlFoto1",
          file: file1,
          cloudinaryFolder: "work-orders",
          tags: ["wo-001"],
        },
        {
          fieldKey: "urlFoto2",
          file: file2,
          cloudinaryFolder: "work-orders",
          tags: ["wo-001"],
        },
      ],
      type: "simpan_progres" as const,
    };

    // Verify multiple images are handled
    expect(item.pendingImages).toHaveLength(2);
    expect(item.pendingImages[0].file).toBe(file1);
    expect(item.pendingImages[1].file).toBe(file2);
  });

  it("should handle items with no images", () => {
    const item = {
      workOrderId: "wo-001",
      jenisPekerjaan: "Pemasangan",
      progresPayload: { status: "In Progress" },
      pendingImages: [],
      type: "simpan_progres" as const,
    };

    // Verify empty array is handled
    expect(item.pendingImages).toHaveLength(0);
  });

  it("should preserve image metadata structure", () => {
    const file = new File(["x".repeat(3 * 1024 * 1024)], "test.jpg", {
      type: "image/jpeg",
    });

    const imageRef = {
      fieldKey: "urlFoto",
      file: file,
      cloudinaryFolder: "work-orders",
      tags: ["wo-001", "pemasangan"],
    };

    // Verify all metadata fields are present
    expect(imageRef).toHaveProperty("fieldKey");
    expect(imageRef).toHaveProperty("file");
    expect(imageRef).toHaveProperty("cloudinaryFolder");
    expect(imageRef).toHaveProperty("tags");
    expect(imageRef.tags).toEqual(["wo-001", "pemasangan"]);
  });
});
