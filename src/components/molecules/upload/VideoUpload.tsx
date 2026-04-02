"use client";

import React, { useState, useRef, useCallback } from "react";
import EditIcon from "@/components/atoms/icons/EditIcon";
import CircularProgress from "@/components/atoms/CircularProgress";
import {
  uploadToCloudinary,
  UploadOptions,
} from "@/libs/cloudinary";
import { showErrorToast, showToast } from "@/libs/toast";

const MAX_FILE_SIZE_MB = 5;

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  folder?: string;
  aspectRatio?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  showDelete?: boolean;
}

// Validate video file
const validateVideoFile = (
  file: File,
  maxSizeMB: number
): { valid: boolean; error?: string } => {
  const allowedTypes = ["video/mp4", "video/x-matroska", "video/webm"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed types: MP4, MKV, WebM",
    };
  }

  const maxSizeInBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
};

// Helper to get video thumbnail from Cloudinary URL
export const getVideoThumbnail = (videoUrl: string): string => {
  if (!videoUrl) return "";
  
  if (videoUrl.includes("cloudinary.com")) {
    return videoUrl
      .replace("/video/upload/", "/video/upload/so_0,w_400,h_300,c_fill,f_jpg,q_auto/")
      .replace(/\.(mp4|mkv|webm|mov)$/i, ".jpg");
  }
  
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    const videoId = extractYouTubeId(videoUrl);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  }
  
  if (videoUrl.includes("vimeo.com")) {
    return "";
  }
  
  return "";
};

const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const VideoUpload: React.FC<VideoUploadProps> = ({
  value,
  onChange,
  onDelete,
  folder = "bumi-resource/gallery/videos",
  aspectRatio = "aspect-video",
  maxSizeMB = MAX_FILE_SIZE_MB,
  label = "Video Upload",
  description = "Add your video here.",
  className = "",
  disabled = false,
  showDelete = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

    const validation = validateVideoFile(file, maxSizeMB);
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
        resourceType: "video",
        tags: ["gallery", "video", "cms"],
      };

      const result = await uploadToCloudinary(
        file,
        uploadOptions,
        (p) => setProgress(p),
        abortController.signal
      );

      onChange(result.secure_url);
      showToast.success("Video uploaded successfully");
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    } else {
      onChange("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
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
        accept="video/mp4,video/x-matroska,video/webm"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading || disabled}
      />

      {uploading ? (
        /* Uploading state — circular progress */
        <div
          className={`w-full ${aspectRatio} rounded-xl border-2 border-dashed border-grey-stroke bg-grey-lightest flex flex-col items-center justify-center gap-4`}
        >
          <CircularProgress progress={progress} size={120} strokeWidth={8} />
          <p className="text-sm font-medium text-neutral-03">Uploading...</p>
          <button
            type="button"
            onClick={handleCancel}
            className="px-8 py-2.5 rounded-xl border border-moss-stone text-moss-stone text-sm font-medium hover:bg-moss-stone/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : value ? (
        <div
          className={`w-full ${aspectRatio} rounded-xl overflow-hidden border border-grey-stroke relative group bg-black`}
        >
          {/* Video Player */}
          <video
            ref={videoRef}
            src={value}
            className="w-full h-full object-contain"
            onEnded={handleVideoEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
          />

          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/40"
              type="button"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <svg
                  className="w-8 h-8 text-moss-stone ml-1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </div>
            </button>
          )}

          {isPlaying && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 cursor-pointer"
              type="button"
            />
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={handleEdit}
              disabled={disabled}
              className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors disabled:opacity-50 shadow-md"
              type="button"
              title="Change video"
            >
              <EditIcon className="text-moss-stone" />
            </button>
            {showDelete && (
              <button
                onClick={handleDelete}
                disabled={disabled}
                className="w-10 h-10 rounded-lg bg-white/90 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50 shadow-md"
                type="button"
                title="Delete video"
              >
                <svg
                  className="w-5 h-5 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Video indicator badge */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            Video
          </div>
        </div>
      ) : (
        <label
          className={`w-full ${aspectRatio} rounded-xl border-2 border-dashed border-grey-stroke bg-grey-lightest hover:border-moss-stone hover:bg-moss-stone/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 rounded-full bg-charcoal-green-lighter/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-charcoal-green-lighter"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="6"
                width="12"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M9 10v4M7 12h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-neutral-03">
              Drag your video or{" "}
              <span className="text-moss-stone underline">browse</span>
            </span>
            <span className="text-xs text-grey">
              Max {maxSizeMB}MB files are allowed
            </span>
            <span className="text-xs text-grey">
              Supported: MP4, MKV, WebM
            </span>
          </div>
        </label>
      )}
    </div>
  );
};
