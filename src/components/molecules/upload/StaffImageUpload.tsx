"use client";

import React from "react";
import Image from "next/image";
import EditIcon from "@/components/atoms/icons/EditIcon";
import TrashIcon from "@/components/atoms/icons/TrashIcon";

interface StaffImageUploadProps {
  imageUrl: string;
  name: string;
  position: string;
  onImageChange?: (url: string) => void;
  onEdit?: () => void;
  onDelete: () => void;
  folder?: string;
}

export const StaffImageUpload: React.FC<StaffImageUploadProps> = ({
  imageUrl,
  name,
  position,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">{/* Photo */}
      <div className="w-full aspect-3/4 rounded-xl overflow-hidden relative group">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name || "Staff member"}
            fill
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-grey-lightest flex items-center justify-center">
            <span className="text-grey text-sm">No image</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white/95 flex items-center justify-center transition-colors shadow-md"
              type="button"
              title="Edit staff details"
            >
              <EditIcon className="text-moss-stone" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white/95 flex items-center justify-center transition-colors shadow-md"
            type="button"
            title="Delete staff"
          >
            <TrashIcon className="text-error" />
          </button>
        </div>
      </div>
      
      {/* Info */}
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-normal text-neutral-03">
          {name || "Unnamed"}
        </h4>
        <p className="text-xs text-moss-stone">{position || "No position"}</p>
      </div>
    </div>
  );
};
