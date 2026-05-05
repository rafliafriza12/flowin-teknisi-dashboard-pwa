/**
 * Example usage of Image Compression Utility
 * Demonstrates how to use compressImage in a React component
 */

import { useState } from "react";
import {
  compressImage,
  getCompressionInfo,
  formatFileSize,
} from "./imageCompression";

export function ImageCompressionExample() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    setIsCompressing(true);

    try {
      // Compress image with 2MB target size
      const compressed = await compressImage(file, 2);
      setCompressedFile(compressed);
    } catch (error) {
      console.error("Compression failed:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const compressionInfo =
    originalFile && compressedFile
      ? getCompressionInfo(originalFile, compressedFile)
      : null;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Image Compression Example</h2>

      <div>
        <label className="block mb-2">
          Select an image to compress:
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block mt-1"
          />
        </label>
      </div>

      {isCompressing && (
        <div className="text-blue-600">Compressing image...</div>
      )}

      {compressionInfo && (
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <h3 className="font-semibold">Compression Results:</h3>
          <div>
            <strong>Original Size:</strong>{" "}
            {formatFileSize(compressionInfo.originalSize)}
          </div>
          <div>
            <strong>Compressed Size:</strong>{" "}
            {formatFileSize(compressionInfo.compressedSize)}
          </div>
          {compressionInfo.wasCompressed ? (
            <>
              <div>
                <strong>Saved:</strong>{" "}
                {formatFileSize(compressionInfo.savedBytes)} (
                {compressionInfo.savedPercentage}%)
              </div>
              <div className="text-green-600">
                ✓ Image successfully compressed
              </div>
            </>
          ) : (
            <div className="text-gray-600">
              Image was already small enough, no compression needed
            </div>
          )}
        </div>
      )}

      {compressedFile && (
        <div className="space-y-2">
          <h3 className="font-semibold">Preview:</h3>
          <img
            src={URL.createObjectURL(compressedFile)}
            alt="Compressed preview"
            className="max-w-md border rounded"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Example: Using with offline queue
 */
export async function exampleOfflineQueueUsage(file: File) {
  // Compress image before adding to offline queue
  const compressedImage = await compressImage(file, 2);

  // Now store in IndexedDB or offline queue
  console.log("Storing compressed image:", {
    name: compressedImage.name,
    size: compressedImage.size,
    type: compressedImage.type,
  });

  // The compressed file can be stored in IndexedDB as part of PendingImageRef
  return compressedImage;
}

/**
 * Example: Using with Cloudinary upload
 */
export async function exampleCloudinaryUpload(file: File) {
  // Compress before upload to save bandwidth
  const compressedImage = await compressImage(file, 2);

  const info = getCompressionInfo(file, compressedImage);
  console.log(
    `Uploading ${formatFileSize(info.compressedSize)} instead of ${formatFileSize(info.originalSize)}`,
  );

  // Now upload to Cloudinary
  // await uploadToCloudinary(compressedImage, { folder: 'work-orders' });

  return compressedImage;
}
