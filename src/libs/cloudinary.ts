/**
 * Cloudinary Upload Utility
 * Handles file uploads to Cloudinary with proper error handling
 */

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  width?: number;
  height?: number;
  bytes: number;
}

export interface UploadOptions {
  folder?: string;
  resourceType?: "image" | "raw" | "video" | "auto";
  transformation?: string;
  tags?: string[];
}

/**
 * Upload a file to Cloudinary with real-time progress tracking and cancellation support
 * @param file - File to upload
 * @param options - Upload options (folder, resourceType, etc.)
 * @param onProgress - Callback for real-time upload progress (0-100)
 * @param abortSignal - AbortSignal to cancel the upload
 * @returns Promise with Cloudinary response containing secure_url
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {},
  onProgress?: (progress: number) => void,
  abortSignal?: AbortSignal,
): Promise<CloudinaryUploadResponse> {
  const {
    folder = "floein",
    resourceType = "auto",
    transformation,
    tags = [],
  } = options;

  // Validate file
  if (!file) {
    throw new Error("No file provided");
  }

  // Get cloud name and upload preset from environment variables
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing");
  }

  // Create form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  if (tags.length > 0) {
    formData.append("tags", tags.join(","));
  }

  if (transformation) {
    formData.append("transformation", transformation);
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  return new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    const onAbort = () => {
      xhr.abort();
    };

    if (abortSignal) {
      if (abortSignal.aborted) {
        reject(new DOMException("Upload cancelled", "AbortError"));
        return;
      }
      abortSignal.addEventListener("abort", onAbort);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      abortSignal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          reject(new Error("Failed to parse Cloudinary response"));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(
            new Error(
              errorData.error?.message || "Failed to upload file to Cloudinary",
            ),
          );
        } catch {
          reject(new Error("Failed to upload file to Cloudinary"));
        }
      }
    });

    xhr.addEventListener("error", () => {
      abortSignal?.removeEventListener("abort", onAbort);
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      abortSignal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Upload cancelled", "AbortError"));
    });

    xhr.open("POST", url);
    xhr.send(formData);
  });
}

/**
 * Delete a file from Cloudinary
 * Note: This requires server-side implementation due to authentication
 * @param publicId - Public ID of the file to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete file from Cloudinary");
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

/**
 * Validate image file before upload
 * @param file - File to validate
 * @param maxSizeInMB - Maximum file size in MB (default: 5MB)
 * @param allowedTypes - Allowed MIME types
 */
export function validateImageFile(
  file: File,
  maxSizeInMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"],
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validate document file before upload
 * @param file - File to validate
 * @param maxSizeInMB - Maximum file size in MB (default: 10MB)
 * @param allowedTypes - Allowed MIME types
 */
export function validateDocumentFile(
  file: File,
  maxSizeInMB = 5,
  allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX`,
    };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit`,
    };
  }

  return { valid: true };
}
