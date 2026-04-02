"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import EditIcon from "@/components/atoms/icons/EditIcon";
import CircularProgress from "@/components/atoms/CircularProgress";
import {
  uploadToCloudinary,
  validateImageFile,
  UploadOptions,
} from "@/libs/cloudinary";
import { showErrorToast, showToast } from "@/libs/toast";
import UploadIcon from "@/components/atoms/icons/UploadIcon";

const MAX_FILE_SIZE_MB = 5;

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  dimensions?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = "bumi-resource/governance",
  aspectRatio = "aspect-5/6",
  maxSizeMB = MAX_FILE_SIZE_MB,
  label = "Media Upload",
  description = "Add your image here.",
  dimensions,
  className = "",
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast.info("Upload cancelled");
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.valid) {
      showErrorToast(new Error(validation.error));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setUploading(true);
      setProgress(0);

      const uploadOptions: UploadOptions = {
        folder,
        resourceType: "image",
        tags: ["governance", "cms"],
      };

      const result = await uploadToCloudinary(
        file,
        uploadOptions,
        (p) => setProgress(p),
        abortController.signal
      );

      onChange(result.secure_url);
      showToast.success("Image uploaded successfully");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Upload error:", error);
      showErrorToast(error);
    } finally {
      abortControllerRef.current = null;
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEdit = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-neutral-03">{label}</label>
      )}
      {description && <p className="text-xs text-grey">{description}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {uploading ? (
        /* Uploading state — circular progress */
        <div
          className={`w-full ${aspectRatio} rounded-xl border-2 border-dashed border-grey-stroke bg-grey-lightest flex flex-col items-center justify-center gap-4`}
        >
          <CircularProgress progress={progress} size={60} strokeWidth={4} />
          <p className="text-xs font-medium text-neutral-03">Uploading...</p>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-1.5 rounded-lg border border-moss-stone text-moss-stone text-xs font-medium hover:bg-moss-stone/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : value ? (
        <div
          className={`w-full ${aspectRatio} rounded-xl overflow-hidden border border-grey-stroke relative group`}
        >
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 flex gap-2 transition-opacity">
            <button
              onClick={handleEdit}
              className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white/95 flex items-center justify-center transition-colors shadow-md"
              type="button"
              title="Change image"
            >
              <EditIcon className="text-moss-stone" />
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`w-full ${aspectRatio} rounded-xl border-2 border-dashed border-grey-stroke bg-grey-lightest hover:border-moss-stone hover:bg-moss-stone/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3`}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="w-12 h-12 text-charcoal-green-lighter" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-neutral-03">
              Drag your file or{" "}
              <span className="underline text-charcoal-green-lighter">
                browse
              </span>
            </span>
            <span className="text-xs text-grey">
              Max {maxSizeMB}MB files are allowed
            </span>
            {dimensions && (
              <span className="text-xs text-grey">{dimensions}</span>
            )}
          </div>
        </label>
      )}
    </div>
  );
};
