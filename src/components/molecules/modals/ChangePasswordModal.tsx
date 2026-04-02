"use client";

import { useState, useRef, useEffect } from "react";
import { Heading4 } from "@/components/atoms/Typography";
import XIcon from "@/components/atoms/icons/XIcon";
import EyeIcon from "@/components/atoms/icons/EyeIcon";
import EyeOffIcon from "@/components/atoms/icons/EyeOffIcon";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoading?: boolean;
  apiError?: string | null;
  onClearError?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  apiError = null,
  onClearError,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasSpecialChar: false,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
      setPasswordValidation({
        minLength: false,
        hasUppercase: false,
        hasSpecialChar: false,
      });
    }
  }, [isOpen]);

  // Validate new password as user types
  useEffect(() => {
    setPasswordValidation({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
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
  }, [isOpen, onClose, isLoading]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalRef.current && !isLoading) {
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!oldPassword.trim()) {
      newErrors.oldPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (
      !passwordValidation.minLength ||
      !passwordValidation.hasUppercase ||
      !passwordValidation.hasSpecialChar
    ) {
      newErrors.newPassword = "Password does not meet requirements";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await onSubmit(oldPassword, newPassword);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-grey-stroke">
          <Heading4>Change Password</Heading4>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-grey-lightest rounded-lg transition-colors disabled:opacity-50"
          >
            <XIcon className="w-5 h-5 text-grey" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (errors.oldPassword) {
                    setErrors((prev) => ({ ...prev, oldPassword: undefined }));
                  }
                  // Clear API error when user starts typing
                  if (apiError && onClearError) {
                    onClearError();
                  }
                }}
                disabled={isLoading}
                placeholder="Enter current password"
                className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
                  errors.oldPassword || apiError
                    ? "border-error focus:ring-error"
                    : "border-grey-stroke focus:ring-moss-stone"
                } disabled:bg-grey-lightest disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey hover:text-grey-dark transition-colors"
              >
                {showOldPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeOffIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="mt-1 text-xs text-error">{errors.oldPassword}</p>
            )}
            {apiError && !errors.oldPassword && (
              <p className="mt-1 text-xs text-error">{apiError}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              New Password 
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                disabled={isLoading}
                placeholder="Enter new password"
                className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
                  errors.newPassword
                    ? "border-error focus:ring-error"
                    : "border-grey-stroke focus:ring-moss-stone"
                } disabled:bg-grey-lightest disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey hover:text-grey-dark transition-colors"
              >
                {showNewPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeOffIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-error">{errors.newPassword}</p>
            )}

            {/* Password Requirements */}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-grey mb-1">Password requirements:</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    passwordValidation.minLength ? "bg-success" : "bg-grey-stroke"
                  }`}
                />
                <span
                  className={`text-xs ${
                    passwordValidation.minLength ? "text-success" : "text-grey"
                  }`}
                >
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    passwordValidation.hasUppercase ? "bg-success" : "bg-grey-stroke"
                  }`}
                />
                <span
                  className={`text-xs ${
                    passwordValidation.hasUppercase ? "text-success" : "text-grey"
                  }`}
                >
                  At least 1 uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    passwordValidation.hasSpecialChar ? "bg-success" : "bg-grey-stroke"
                  }`}
                />
                <span
                  className={`text-xs ${
                    passwordValidation.hasSpecialChar ? "text-success" : "text-grey"
                  }`}
                >
                  At least 1 special character
                </span>
              </div>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm New Password 
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                disabled={isLoading}
                placeholder="Confirm new password"
                className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
                  errors.confirmPassword
                    ? "border-error focus:ring-error"
                    : "border-grey-stroke focus:ring-moss-stone"
                } disabled:bg-grey-lightest disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey hover:text-grey-dark transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeOffIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-error">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-grey-stroke text-neutral-02 rounded-lg text-sm font-medium hover:bg-grey-lightest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-moss-stone text-white rounded-lg text-sm font-medium hover:bg-moss-stone/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
