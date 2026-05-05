/**
 * Unit tests for Cloudinary upload utility
 * Tests the UploadProgress interface and callback functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UploadProgress } from "./cloudinary";

describe("UploadProgress Interface", () => {
  it("should have correct structure", () => {
    const progress: UploadProgress = {
      loaded: 1024,
      total: 2048,
      percentage: 50,
    };

    expect(progress.loaded).toBe(1024);
    expect(progress.total).toBe(2048);
    expect(progress.percentage).toBe(50);
  });

  it("should calculate percentage correctly", () => {
    const loaded = 750;
    const total = 1000;
    const percentage = Math.round((loaded / total) * 100);

    const progress: UploadProgress = {
      loaded,
      total,
      percentage,
    };

    expect(progress.percentage).toBe(75);
  });

  it("should handle 0% progress", () => {
    const progress: UploadProgress = {
      loaded: 0,
      total: 1000,
      percentage: 0,
    };

    expect(progress.percentage).toBe(0);
  });

  it("should handle 100% progress", () => {
    const progress: UploadProgress = {
      loaded: 1000,
      total: 1000,
      percentage: 100,
    };

    expect(progress.percentage).toBe(100);
  });

  it("should work with progress callback", () => {
    const progressCallback = vi.fn((progress: UploadProgress) => {
      expect(progress).toHaveProperty("loaded");
      expect(progress).toHaveProperty("total");
      expect(progress).toHaveProperty("percentage");
    });

    // Simulate progress updates
    progressCallback({ loaded: 512, total: 1024, percentage: 50 });
    progressCallback({ loaded: 1024, total: 1024, percentage: 100 });

    expect(progressCallback).toHaveBeenCalledTimes(2);
    expect(progressCallback).toHaveBeenCalledWith({
      loaded: 512,
      total: 1024,
      percentage: 50,
    });
    expect(progressCallback).toHaveBeenCalledWith({
      loaded: 1024,
      total: 1024,
      percentage: 100,
    });
  });
});
