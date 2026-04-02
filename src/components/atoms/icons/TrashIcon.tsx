import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const TrashIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-5 h-5", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 9L18.2841 18.3068C18.1238 20.3908 18.0437 21.4328 17.2507 22.0706C16.4577 22.7085 15.4081 22.7085 13.309 22.7085H10.691C8.59188 22.7085 7.54232 22.7085 6.74933 22.0706C5.95633 21.4328 5.87623 20.3908 5.71591 18.3068L5 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3 6H21M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 11V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 11V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default TrashIcon;
