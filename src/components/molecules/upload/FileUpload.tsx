"use client";

import React, { useState, useRef, useCallback } from "react";
import PDFIcon from "@/components/atoms/icons/PDFIcon";
import TrashIcon from "@/components/atoms/icons/TrashIcon";
import EditIcon from "@/components/atoms/icons/EditIcon";
import {
  uploadToCloudinary,
  validateDocumentFile,
  UploadOptions,
} from "@/libs/cloudinary";
import { showErrorToast, showToast } from "@/libs/toast";
import UploadIcon from "@/components/atoms/icons/UploadIcon";
import XIcon from "@/components/atoms/icons/XIcon";

const MAX_FILE_SIZE_MB = 5;

interface FileUploadProps {
  value?: string;
  fileName?: string;
  onChange: (url: string, fileName?: string) => void;
  onDelete?: () => void;
  folder?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  className?: string;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  fileName,
  onChange,
  onDelete,
  folder = "bumi-resource/documents",
  maxSizeMB = MAX_FILE_SIZE_MB,
  label = "File Upload",
  description = "Upload your document here.",
  className = "",
  accept = ".pdf",
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadingFileSize, setUploadingFileSize] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setProgress(0);
    setUploadingFileName("");
    setUploadingFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast.info("Upload cancelled");
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDocumentFile(file, maxSizeMB);
    if (!validation.valid) {
      showErrorToast(new Error(validation.error));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setUploadingFileName(file.name);
    setUploadingFileSize(formatFileSize(file.size));

    try {
      setUploading(true);
      setProgress(0);

      const uploadOptions: UploadOptions = {
        folder,
        resourceType: "raw",
        tags: ["document", "cms"],
      };

      const result = await uploadToCloudinary(
        file,
        uploadOptions,
        (p) => setProgress(p),
        abortController.signal
      );

      onChange(result.secure_url, file.name);
      showToast.success("File uploaded successfully");
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
      setUploadingFileName("");
      setUploadingFileSize("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      onChange("", "");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const getFileExtension = (url: string) => {
    const parts = url.split(".");
    return parts[parts.length - 1].toUpperCase();
  };

  return (
    <>
      <div className={`flex flex-col gap-2 h-full ${className}`}>
        {label && (
          <label className="text-sm font-medium text-neutral-03">{label}</label>
        )}
        {description && <p className="text-xs text-grey">{description}</p>}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          /* Uploading state — linear progress bar */
          <div className="w-full h-full p-4 rounded-xl border border-grey-stroke flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg border border-grey-stroke flex items-center justify-center shrink-0">
                <PDFIcon className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-03 truncate">
                  {uploadingFileName}
                </p>
                <p className="text-xs text-grey">{uploadingFileSize}</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="w-9 h-9 rounded-lg bg-grey-lightest hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                title="Cancel upload"
              >
                <XIcon className="w-4 h-4 text-neutral-03" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-grey-stroke rounded-full overflow-hidden">
                <div
                  className="h-full bg-moss-stone rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-03 shrink-0 w-10 text-right">
                {progress}%
              </span>
            </div>
          </div>
        ) : value ? (
          <div className="w-full h-full p-4 rounded-xl border border-grey-stroke flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg border border-grey-stroke flex items-center justify-center shrink-0">
                <PDFIcon className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-03 truncate">
                  {fileName || "Uploaded file"}
                </p>
                <p className="text-xs text-grey">
                  {value ? getFileExtension(value) : "Document"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleEdit}
                  className="w-9 h-9 rounded-lg bg-grey-lightest hover:bg-moss-stone/10 flex items-center justify-center transition-colors"
                  type="button"
                  title="Edit"
                >
                  <EditIcon className="w-5 h-5 text-moss-stone" />
                </button>
                <button
                  onClick={handleDelete}
                  className="w-9 h-9 rounded-lg bg-grey-lightest hover:bg-red-50 flex items-center justify-center transition-colors"
                  type="button"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className={`w-full h-full p-6 rounded-xl border-2 border-dashed border-grey-stroke bg-grey-lightest hover:border-moss-stone hover:bg-moss-stone/5 transition-colors cursor-pointer flex`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center gap-3 m-auto">
              <UploadIcon className="w-12 h-12" />
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm font-medium text-neutral-03">
                  Drag your file or{" "}
                  <span className="underline text-charcoal-green-lighter">
                    browse
                  </span>
                </span>
                <span className="text-xs text-grey">
                  Max {maxSizeMB}MB file are allowed.
                </span>
              </div>
            </div>
          </label>
        )}
      </div>
    </>
  );
};
