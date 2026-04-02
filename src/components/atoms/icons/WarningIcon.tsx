import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const WarningIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="100"
        height="100"
        rx="50"
        fill="#FFB300"
        fillOpacity="0.15"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29.9351 46.2845C38.6902 30.7615 43.0678 23 50 23C56.9322 23 61.3098 30.7615 70.0648 46.2845L71.1558 48.2188C78.4313 61.1183 82.069 67.5681 78.7812 72.284C75.4935 77 67.3593 77 51.091 77H48.909C32.6407 77 24.5065 77 21.2188 72.284C17.931 67.5681 21.5687 61.1183 28.8442 48.2188L29.9351 46.2845ZM50 35.75C51.2426 35.75 52.25 36.7574 52.25 38V53C52.25 54.2426 51.2426 55.25 50 55.25C48.7574 55.25 47.75 54.2426 47.75 53V38C47.75 36.7574 48.7574 35.75 50 35.75ZM50 65C51.6569 65 53 63.6569 53 62C53 60.3431 51.6569 59 50 59C48.3431 59 47 60.3431 47 62C47 63.6569 48.3431 65 50 65Z"
        fill="#FFB300"
      />
    </svg>
  );
};

export default WarningIcon;
