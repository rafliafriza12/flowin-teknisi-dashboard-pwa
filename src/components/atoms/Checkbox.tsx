import { cn } from "@/libs/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = ({
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  className,
}: CheckboxProps) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
        checked || indeterminate
          ? "bg-moss-stone border-moss-stone"
          : "bg-neutral-01 border-grey-stroke hover:border-moss-stone",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {indeterminate ? (
        <svg
          className="w-3 h-3 text-neutral-01"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 6h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        checked && (
          <svg
            className="w-3 h-3 text-neutral-01"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )
      )}
    </button>
  );
};
