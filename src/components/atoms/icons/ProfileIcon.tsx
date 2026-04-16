import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const ProfileIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 10.4167C12.0711 10.4167 13.75 8.73782 13.75 6.66667C13.75 4.59551 12.0711 2.91667 10 2.91667C7.92893 2.91667 6.25 4.59551 6.25 6.66667C6.25 8.73782 7.92893 10.4167 10 10.4167Z"
        className="fill-current"
      />
      <path
        d="M3.33337 16.25C3.33337 13.4885 6.31821 11.25 10 11.25C13.6819 11.25 16.6667 13.4885 16.6667 16.25C16.6667 16.5952 16.3869 16.875 16.0417 16.875H3.95837C3.61319 16.875 3.33337 16.5952 3.33337 16.25Z"
        className="fill-current"
      />
    </svg>
  );
};

export default ProfileIcon;
