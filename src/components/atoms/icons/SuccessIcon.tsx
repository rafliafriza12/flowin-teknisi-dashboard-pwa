import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const SuccessIcon: React.FC<IconProps> = ({ className }) => {
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
        fill="#40C4AA"
        fillOpacity="0.2"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M80 50C80 66.5685 66.5685 80 50 80C33.4315 80 20 66.5685 20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50ZM62.091 40.909C62.9697 41.7877 62.9697 43.2123 62.091 44.091L47.091 59.091C46.2123 59.9697 44.7877 59.9697 43.909 59.091L37.909 53.091C37.0303 52.2123 37.0303 50.7877 37.909 49.909C38.7877 49.0303 40.2123 49.0303 41.091 49.909L45.5 54.318L52.2045 47.6135L58.909 40.909C59.7877 40.0303 61.2123 40.0303 62.091 40.909Z"
        fill="#40C4AA"
      />
    </svg>
  );
};

export default SuccessIcon;
