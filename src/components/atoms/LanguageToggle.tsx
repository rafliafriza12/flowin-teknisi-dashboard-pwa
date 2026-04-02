"use client";

import React from "react";

export type Language = "id" | "en";

interface LanguageToggleProps {
  activeLanguage: Language;
  onLanguageChange: (language: Language) => void;
  className?: string;
  size?: "sm" | "md";
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  activeLanguage,
  onLanguageChange,
  className = "",
  size = "md",
}) => {
  const paddingClass = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      className={`flex items-center bg-grey-lightest shadow-black/10 shadow-inner rounded-lg p-1 relative ${className}`}
    >
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white border border-moss-stone/60 shadow-sm rounded-md transition-transform duration-300 ease-in-out ${
          activeLanguage === "en" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <button
        type="button"
        onClick={() => onLanguageChange("id")}
        className={`${paddingClass} ${textClass} font-medium rounded-md transition-colors duration-200 relative z-10 ${
          activeLanguage === "id"
            ? "text-moss-stone"
            : "text-grey hover:text-neutral-02"
        }`}
      >
        🇮🇩 ID
      </button>
      <button
        type="button"
        onClick={() => onLanguageChange("en")}
        className={`${paddingClass} ${textClass} font-medium rounded-md transition-colors duration-200 relative z-10 ${
          activeLanguage === "en"
            ? "text-moss-stone"
            : "text-grey hover:text-neutral-02"
        }`}
      >
        🇬🇧 EN
      </button>
    </div>
  );
};

export default LanguageToggle;
