"use client";

import { useState, useRef, useEffect } from "react";
import XIcon from "@/components/atoms/icons/XIcon";
import { ImageUpload } from "@/components/molecules/upload/ImageUpload";
import ConfirmDeleteModal from "@/components/molecules/ConfirmDeleteModal";
import {
  IUser,
  ICreateUserInput,
  IUpdateUserInput,
} from "@/types/user";
import { Heading4 } from "@/components/atoms/Typography";
import EyeIcon from "@/components/atoms/icons/EyeIcon";
import EyeOffIcon from "@/components/atoms/icons/EyeOffIcon";
import Image from "next/image";

const roleToDisplay = (role: string): string => {
  return role.replace(/_/g, " ");
};

interface RoleOption {
  name: string;
  displayName: string;
}

interface UserModalCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ICreateUserInput) => Promise<void>;
  onDelete?: never;
  mode: "create";
  initialData?: never;
  roles: RoleOption[];
}

interface UserModalEditProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IUpdateUserInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  mode: "edit";
  initialData: IUser;
  roles: RoleOption[];
}

interface UserModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: never;
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
  mode: "view";
  initialData: IUser;
  roles: RoleOption[];
}

type UserModalProps =
  | UserModalCreateProps
  | UserModalEditProps
  | UserModalViewProps;

const UserModal: React.FC<UserModalProps> = (props) => {
  const { isOpen, onClose, mode, initialData, roles = [] } = props;
  const onDelete = "onDelete" in props ? props.onDelete : undefined;
  const onEdit =
    mode === "view" && "onEdit" in props ? props.onEdit : undefined;

  const modalRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    initialData?.profilePictureUrl || ""
  );
  const [fullname, setFullname] = useState(initialData?.fullname || "");
  const [username, setUsername] = useState(initialData?.username || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState<string>(
    initialData?.role || ""
  );
  const [password, setPassword] = useState("");

  // Dropdown state
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Set default role when roles are available
  useEffect(() => {
    if (roles.length > 0 && !role && !initialData?.role) {
      setRole(roles[0].name);
    }
  }, [roles, role, initialData?.role]);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasSpecialChar: false,
  });

  // Validate password in realtime
  useEffect(() => {
    if (mode === "view" || !password) {
      setPasswordValidation({
        minLength: false,
        hasUppercase: false,
        hasSpecialChar: false,
      });
      return;
    }

    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    setPasswordValidation({
      minLength,
      hasUppercase,
      hasSpecialChar,
    });
  }, [password, mode]);

  // Check if password is valid
  const isPasswordValid =
    mode === "edit" && !password
      ? true // Password optional in edit mode
      : passwordValidation.minLength &&
        passwordValidation.hasUppercase &&
        passwordValidation.hasSpecialChar;

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setProfilePictureUrl(initialData?.profilePictureUrl || "");
      setFullname(initialData?.fullname || "");
      setUsername(initialData?.username || "");
      setEmail(initialData?.email || "");
      setRole(initialData?.role || (roles.length > 0 ? roles[0].name : ""));
      setPassword("");
      setShowPassword(false);
    }
  }, [isOpen, initialData, roles]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalRef.current && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "view") return;

    if (mode === "create") {
      if (!profilePictureUrl || !fullname || !username || !email || !password) {
        return;
      }
      const createProps = props as UserModalCreateProps;
      setIsSubmitting(true);
      try {
        const data: ICreateUserInput = {
          profilePictureUrl,
          fullname,
          username,
          email,
          password,
          role,
        };
        await createProps.onSubmit(data);
        handleClose();
      } catch (error) {
        console.error("Error submitting user:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === "edit") {
      if (!profilePictureUrl || !fullname || !username || !email) {
        return;
      }
      const editProps = props as UserModalEditProps;
      setIsSubmitting(true);
      try {
        const data: IUpdateUserInput = {
          profilePictureUrl,
          fullname,
          username,
          email,
          role,
          ...(password && { password }),
        };
        await editProps.onSubmit(data);
        handleClose();
      } catch (error) {
        console.error("Error submitting user:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setProfilePictureUrl("");
      setFullname("");
      setUsername("");
      setEmail("");
      setRole(roles.length > 0 ? roles[0].name : "");
      setPassword("");
      setShowPassword(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
      handleClose();
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get display name for a role
  const getRoleDisplayName = (roleName: string): string => {
    const roleObj = roles.find((r) => r.name === roleName);
    return roleObj ? roleObj.displayName : roleToDisplay(roleName);
  };

  const isFormValid =
    mode === "create"
      ? profilePictureUrl && fullname && username && email && password && isPasswordValid
      : profilePictureUrl && fullname && username && email && (password ? isPasswordValid : true);

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Add New User";
      case "edit":
        return "Edit User";
      case "view":
        return "View User";
      default:
        return "User";
    }
  };

  const isViewMode = mode === "view";

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-grey-stroke">
          <Heading4>{getTitle()}</Heading4>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-grey-lightest rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Profile Picture Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-03">
                Photo Profile Upload
              </label>
              <p className="text-xs text-grey mb-3">Add your image here.</p>
              {isViewMode ? (
                <div className="aspect-square rounded-xl overflow-hidden border border-grey-stroke relative w-full">
                  {profilePictureUrl ? (
                    <Image
                      src={profilePictureUrl}
                      alt={fullname}
                      fill
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-grey-lightest text-grey text-4xl font-medium">
                      {fullname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <ImageUpload
                  value={profilePictureUrl}
                  onChange={setProfilePictureUrl}
                  folder="bumi-resource/users/profiles"
                  aspectRatio="aspect-square"
                  label=""
                  description=""
                  className="w-full"
                />
              )}
              <p className="text-xs text-grey mt-2">
                Only support .jpg or .png files
              </p>
            </div>

            {/* Right Column - Form Fields */}
            <div className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-03">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Enter full name..."
                  className={`w-full px-3 py-2 border border-grey-stroke rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-moss-stone/20 focus:border-moss-stone transition-colors ${
                    isViewMode
                      ? "bg-grey-lightest text-grey cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isSubmitting || isViewMode}
                  required={!isViewMode}
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-03">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Enter username..."
                  className={`w-full px-3 py-2 border border-grey-stroke rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-moss-stone/20 focus:border-moss-stone transition-colors ${
                    isViewMode
                      ? "bg-grey-lightest text-grey cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isSubmitting || isViewMode}
                  required={!isViewMode}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-03">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email..."
                  className={`w-full px-3 py-2 border border-grey-stroke rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-moss-stone/20 focus:border-moss-stone transition-colors ${
                    isViewMode
                      ? "bg-grey-lightest text-grey cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isSubmitting || isViewMode}
                  required={!isViewMode}
                />
              </div>

              {/* Role - Custom Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-03">
                  Role
                </label>
                {isViewMode ? (
                  <input
                    type="text"
                    value={getRoleDisplayName(role)}
                    className="w-full px-3 py-2 border border-grey-stroke rounded-lg text-sm bg-grey-lightest text-grey cursor-not-allowed"
                    disabled
                  />
                ) : (
                  <div className="relative" ref={roleDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-full px-3 py-2 border border-grey-stroke rounded-lg text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-moss-stone/20 focus:border-moss-stone transition-colors flex items-center justify-between"
                      disabled={isSubmitting}
                    >
                      <span className={role ? "text-neutral-03" : "text-grey"}>
                        {role ? getRoleDisplayName(role) : "Select role..."}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${isRoleDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-grey-stroke rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {roles.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-grey text-center">
                            No roles available. Create roles in Settings.
                          </div>
                        ) : (
                          roles.map((r) => (
                            <button
                              key={r.name}
                              type="button"
                              onClick={() => {
                                setRole(r.name);
                                setIsRoleDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-sm text-left hover:bg-grey-lightest transition-colors ${
                                role === r.name
                                  ? "bg-moss-stone/10 text-moss-stone"
                                  : "text-neutral-03"
                              }`}
                            >
                              {r.displayName}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-03">
                  Password{" "}
                  {mode === "edit" && (
                    <span className="text-grey text-xs">
                      (leave empty to keep current)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={isViewMode ? "••••••••" : password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === "edit"
                        ? "Enter new password..."
                        : "Enter password..."
                    }
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      isViewMode
                        ? "bg-grey-lightest text-grey cursor-not-allowed border-grey-stroke"
                        : password && !isPasswordValid
                        ? "border-error focus:ring-error/20 focus:border-error"
                        : "border-grey-stroke focus:ring-moss-stone/20 focus:border-moss-stone"
                    }`}
                    disabled={isSubmitting || isViewMode}
                    required={mode === "create"}
                  />
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-grey hover:text-neutral-03"
                    >
                      {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  )}
                </div>

                {/* Password Validation Hints - Only show when password is being entered */}
                {!isViewMode && (mode === "create" || password) && (
                  <div className="mt-3 space-y-1.5 p-3 bg-grey-lightest rounded-lg">
                    <p className="text-xs font-medium text-neutral-03 mb-2">
                      Password must contain:
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordValidation.minLength
                            ? "bg-success"
                            : "bg-grey-stroke"
                        }`}
                      >
                        {passwordValidation.minLength && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          passwordValidation.minLength
                            ? "text-success font-medium"
                            : "text-grey"
                        }`}
                      >
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordValidation.hasUppercase
                            ? "bg-success"
                            : "bg-grey-stroke"
                        }`}
                      >
                        {passwordValidation.hasUppercase && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          passwordValidation.hasUppercase
                            ? "text-success font-medium"
                            : "text-grey"
                        }`}
                      >
                        One uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordValidation.hasSpecialChar
                            ? "bg-success"
                            : "bg-grey-stroke"
                        }`}
                      >
                        {passwordValidation.hasSpecialChar && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          passwordValidation.hasSpecialChar
                            ? "text-success font-medium"
                            : "text-grey"
                        }`}
                      >
                        One special character (!@#$%^&*...)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-3 mt-6 pt-6 border-t border-grey-stroke">
            {/* Delete Button - Left side, only in view/edit mode with onDelete */}
            {(mode === "view" || mode === "edit") && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-sm font-medium text-error hover:text-error/80 hover:bg-error/5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
            {/* Spacer when no delete button */}
            {(mode === "create" || !onDelete) && <div />}

            {/* Cancel and Save/Edit buttons - Right side */}
            <div className="flex items-center gap-3">
              {mode === "view" ? (
                <>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="px-6 py-2 bg-moss-stone text-white rounded-lg text-sm font-medium hover:bg-moss-stone/90 transition-colors"
                    >
                      Edit User
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting || isDeleting}
                    className="px-4 py-2 text-sm font-medium text-grey hover:text-neutral-03 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting || isDeleting}
                    className="px-6 py-2 bg-moss-stone text-white rounded-lg text-sm font-medium hover:bg-moss-stone/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        itemName={fullname}
      />
    </div>
  );
};

export default UserModal;
