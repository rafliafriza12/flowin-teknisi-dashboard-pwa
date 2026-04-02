import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const ImagePlusIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-6 h-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 10H16M16 10H19M16 10V7M16 10V13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 11C2 7.70017 2 6.05025 2.87868 5.02513C3.75736 4 5.17157 4 8 4H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 14C2 10.2288 2 8.34315 3.17157 7.17157C4.11438 6.22876 5.52043 6.03769 8 6.01031"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 17.5L3.75159 15.9882C4.66286 15.1814 6.03628 15.2007 6.92249 16.0317L11.5 20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 22C17.175 19.8944 18.3158 18.8078 19.1069 18.0011C20.5856 16.5019 20.5856 14.0769 19.1069 12.5777C17.6282 11.0785 15.2718 11.0785 13.7931 12.5777C13.0031 13.3844 11.925 14.4722 10 16.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default ImagePlusIcon;
