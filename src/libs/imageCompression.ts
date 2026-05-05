/**
 * Image Compression Utility
 * Compresses images using Canvas API before storing in IndexedDB or uploading
 *
 * **Validates: Requirements 3.6**
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  quality?: number;
}

/**
 * Compress an image file to reduce size before storage/upload
 *
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum target size in MB (default: 2MB)
 * @returns Promise<File> - Compressed image file or original if compression fails
 *
 * Features:
 * - Resizes images to max width 1920px while maintaining aspect ratio
 * - Converts to JPEG with 85% quality
 * - Preserves original filename and timestamp
 * - Falls back to original file on error
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 5,
): Promise<File> {
  // Validate input
  if (!file) {
    throw new Error("No file provided");
  }

  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    console.warn("File is not an image, returning original file");
    return file;
  }

  // If file is already smaller than target, return original
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= maxSizeBytes) {
    return file;
  }

  try {
    return await compressImageInternal(file, {
      maxSizeMB,
      maxWidth: 1920,
      quality: 0.85,
    });
  } catch (error) {
    console.error("Image compression failed, returning original file:", error);
    // Fallback to original file on error
    return file;
  }
}

/**
 * Internal compression implementation
 */
async function compressImageInternal(
  file: File,
  options: Required<CompressionOptions>,
): Promise<File> {
  const { maxWidth, quality } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;

          // Resize if width exceeds max
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob from canvas"));
                return;
              }

              // Create new File with preserved filename and timestamp
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: file.lastModified,
              });

              resolve(compressedFile);
            },
            "image/jpeg",
            quality,
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      // Load image from file data
      const result = e.target?.result;
      if (typeof result === "string") {
        img.src = result;
      } else {
        reject(new Error("Failed to read file as data URL"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get compression info for a file
 * Useful for displaying compression results to users
 */
export function getCompressionInfo(
  originalFile: File,
  compressedFile: File,
): {
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercentage: number;
  wasCompressed: boolean;
} {
  const savedBytes = originalFile.size - compressedFile.size;
  const savedPercentage =
    originalFile.size > 0
      ? Math.round((savedBytes / originalFile.size) * 100)
      : 0;

  return {
    originalSize: originalFile.size,
    compressedSize: compressedFile.size,
    savedBytes,
    savedPercentage,
    wasCompressed: savedBytes > 0,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
