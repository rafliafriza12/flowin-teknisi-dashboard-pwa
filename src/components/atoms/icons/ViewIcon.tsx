import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const ViewIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4 text-moss-stone", className)}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
};

export default ViewIcon;
