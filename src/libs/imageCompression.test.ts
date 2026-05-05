/**
 * Unit tests for Image Compression Utility
 * Tests compression logic, error handling, and edge cases
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  compressImage,
  getCompressionInfo,
  formatFileSize,
} from "./imageCompression";

// Mock canvas and image APIs
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";
  width = 0;
  height = 0;

  constructor() {
    // Simulate image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

class MockCanvas {
  width = 0;
  height = 0;

  getContext() {
    return {
      drawImage: vi.fn(),
    };
  }

  toBlob(callback: (blob: Blob | null) => void, type: string, quality: number) {
    // Create a mock blob
    const blob = new Blob(["mock image data"], { type });
    setTimeout(() => callback(blob), 0);
  }
}

// Setup global mocks
beforeEach(() => {
  global.Image = MockImage as any;
  global.document = {
    createElement: (tag: string) => {
      if (tag === "canvas") {
        return new MockCanvas() as any;
      }
      return {} as any;
    },
  } as any;

  global.FileReader = class MockFileReader {
    onload: ((e: any) => void) | null = null;
    onerror: (() => void) | null = null;

    readAsDataURL(file: File) {
      setTimeout(() => {
        if (this.onload) {
          this.onload({
            target: { result: "data:image/jpeg;base64,mockdata" },
          });
        }
      }, 0);
    }
  } as any;
});

describe("compressImage", () => {
  it("should return original file if already smaller than maxSizeMB", async () => {
    const smallFile = new File(["small"], "small.jpg", {
      type: "image/jpeg",
    });

    const result = await compressImage(smallFile, 2);

    expect(result).toBe(smallFile);
  });

  it("should return original file if not an image", async () => {
    const textFile = new File(["text content"], "document.txt", {
      type: "text/plain",
    });

    const result = await compressImage(textFile, 2);

    expect(result).toBe(textFile);
  });

  it("should throw error if no file provided", async () => {
    await expect(compressImage(null as any, 2)).rejects.toThrow(
      "No file provided",
    );
  });

  it("should compress large image file", async () => {
    // Create a large mock file (3MB)
    const largeData = new Uint8Array(3 * 1024 * 1024);
    const largeFile = new File([largeData], "large.jpg", {
      type: "image/jpeg",
      lastModified: 1234567890,
    });

    // Mock image with dimensions
    global.Image = class MockImageWithDimensions {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      width = 2400;
      height = 1800;

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;

    const result = await compressImage(largeFile, 2);

    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe("large.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.lastModified).toBe(1234567890);
  });

  it("should preserve filename and timestamp", async () => {
    const largeData = new Uint8Array(3 * 1024 * 1024);
    const originalFile = new File([largeData], "photo_2024.jpg", {
      type: "image/jpeg",
      lastModified: 1609459200000,
    });

    global.Image = class MockImageWithDimensions {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      width = 2400;
      height = 1800;

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;

    const result = await compressImage(originalFile, 2);

    expect(result.name).toBe("photo_2024.jpg");
    expect(result.lastModified).toBe(1609459200000);
  });

  it("should handle image load error gracefully", async () => {
    const largeData = new Uint8Array(3 * 1024 * 1024);
    const largeFile = new File([largeData], "corrupt.jpg", {
      type: "image/jpeg",
    });

    // Mock image that fails to load
    global.Image = class MockFailingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      width = 0;
      height = 0;

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 0);
      }
    } as any;

    const result = await compressImage(largeFile, 2);

    // Should fallback to original file
    expect(result).toBe(largeFile);
  });

  it("should handle FileReader error gracefully", async () => {
    const largeData = new Uint8Array(3 * 1024 * 1024);
    const largeFile = new File([largeData], "test.jpg", {
      type: "image/jpeg",
    });

    // Mock FileReader that fails
    global.FileReader = class MockFailingFileReader {
      onload: ((e: any) => void) | null = null;
      onerror: (() => void) | null = null;

      readAsDataURL(file: File) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 0);
      }
    } as any;

    const result = await compressImage(largeFile, 2);

    // Should fallback to original file
    expect(result).toBe(largeFile);
  });

  it("should resize image wider than 1920px", async () => {
    const largeData = new Uint8Array(3 * 1024 * 1024);
    const largeFile = new File([largeData], "wide.jpg", {
      type: "image/jpeg",
    });

    let canvasWidth = 0;
    let canvasHeight = 0;

    global.Image = class MockWideImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      width = 3840; // 4K width
      height = 2160; // 4K height

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;

    global.document = {
      createElement: (tag: string) => {
        if (tag === "canvas") {
          return {
            get width() {
              return canvasWidth;
            },
            set width(value: number) {
              canvasWidth = value;
            },
            get height() {
              return canvasHeight;
            },
            set height(value: number) {
              canvasHeight = value;
            },
            getContext: () => ({
              drawImage: vi.fn(),
            }),
            toBlob: (
              callback: (blob: Blob | null) => void,
              type: string,
              quality: number,
            ) => {
              const blob = new Blob(["mock"], { type });
              setTimeout(() => callback(blob), 0);
            },
          } as any;
        }
        return {} as any;
      },
    } as any;

    await compressImage(largeFile, 2);

    // Should resize to max width 1920px
    expect(canvasWidth).toBe(1920);
    // Height should be proportionally scaled (2160 * 1920 / 3840 = 1080)
    expect(canvasHeight).toBe(1080);
  });

  it("should not resize image smaller than 1920px", async () => {
    const largeData = new Uint8Array(3 * 1024 * 1024);
    const largeFile = new File([largeData], "small-res.jpg", {
      type: "image/jpeg",
    });

    let canvasWidth = 0;
    let canvasHeight = 0;

    global.Image = class MockSmallImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";
      width = 1280;
      height = 720;

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;

    global.document = {
      createElement: (tag: string) => {
        if (tag === "canvas") {
          return {
            get width() {
              return canvasWidth;
            },
            set width(value: number) {
              canvasWidth = value;
            },
            get height() {
              return canvasHeight;
            },
            set height(value: number) {
              canvasHeight = value;
            },
            getContext: () => ({
              drawImage: vi.fn(),
            }),
            toBlob: (
              callback: (blob: Blob | null) => void,
              type: string,
              quality: number,
            ) => {
              const blob = new Blob(["mock"], { type });
              setTimeout(() => callback(blob), 0);
            },
          } as any;
        }
        return {} as any;
      },
    } as any;

    await compressImage(largeFile, 2);

    // Should keep original dimensions
    expect(canvasWidth).toBe(1280);
    expect(canvasHeight).toBe(720);
  });
});

describe("getCompressionInfo", () => {
  it("should calculate compression info correctly", () => {
    const originalFile = new File([new Uint8Array(1000000)], "original.jpg", {
      type: "image/jpeg",
    });
    const compressedFile = new File(
      [new Uint8Array(500000)],
      "compressed.jpg",
      {
        type: "image/jpeg",
      },
    );

    const info = getCompressionInfo(originalFile, compressedFile);

    expect(info.originalSize).toBe(1000000);
    expect(info.compressedSize).toBe(500000);
    expect(info.savedBytes).toBe(500000);
    expect(info.savedPercentage).toBe(50);
    expect(info.wasCompressed).toBe(true);
  });

  it("should handle no compression case", () => {
    const file = new File([new Uint8Array(1000)], "file.jpg", {
      type: "image/jpeg",
    });

    const info = getCompressionInfo(file, file);

    expect(info.originalSize).toBe(1000);
    expect(info.compressedSize).toBe(1000);
    expect(info.savedBytes).toBe(0);
    expect(info.savedPercentage).toBe(0);
    expect(info.wasCompressed).toBe(false);
  });

  it("should handle zero-size files", () => {
    const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });

    const info = getCompressionInfo(emptyFile, emptyFile);

    expect(info.originalSize).toBe(0);
    expect(info.compressedSize).toBe(0);
    expect(info.savedBytes).toBe(0);
    expect(info.savedPercentage).toBe(0);
    expect(info.wasCompressed).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("should format bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(500)).toBe("500 Bytes");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1048576)).toBe("1 MB");
    expect(formatFileSize(2621440)).toBe("2.5 MB");
    expect(formatFileSize(1073741824)).toBe("1 GB");
  });

  it("should handle large numbers", () => {
    const result = formatFileSize(5368709120); // 5GB
    expect(result).toBe("5 GB");
  });

  it("should round to 2 decimal places", () => {
    const result = formatFileSize(1234567); // ~1.18 MB
    expect(result).toBe("1.18 MB");
  });
});
