import { cn } from "@/libs/utils";
import { useState, useRef, useEffect } from "react";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const TableActions = ({
  onView,
  onEdit,
  onDelete,
  className,
}: TableActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const dropdownHeight = 350;
      
      setOpenUpward(spaceBelow < dropdownHeight);
    }
  }, [isOpen]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1 hover:bg-grey-stroke rounded-lg transition-colors"
      >
        <svg
          className="w-4 h-4 text-grey rotate-90"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute right-0 w-32 bg-neutral-01 border border-grey-stroke rounded-lg shadow-lg z-50 py-1",
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {onView && (
            <button
              onClick={() => {
                onView();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs text-neutral-02 hover:bg-grey-lightest transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="8"
                  cy="8"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              View
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs text-neutral-02 hover:bg-grey-lightest transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs text-error hover:bg-error/10 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
