"use client";

import { useEffect, useRef } from "react";
import XIcon from "@/components/atoms/icons/XIcon";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-md",
  maxHeight = "max-h-[80vh]",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className={`relative w-full ${maxWidth} ${maxHeight} bg-white rounded-2xl shadow-2xl overflow-y-auto`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-grey-lightest rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <XIcon className="w-5 h-5 text-grey" />
        </button>

        {children}
      </div>
    </div>
  );
};

export default AlertModal;
