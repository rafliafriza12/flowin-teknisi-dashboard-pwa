import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const SearchIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.58317 2.29169C5.55609 2.29169 2.2915 5.55628 2.2915 9.58335C2.2915 13.6104 5.55609 16.875 9.58317 16.875C13.6102 16.875 16.8748 13.6104 16.8748 9.58335C16.8748 5.55628 13.6102 2.29169 9.58317 2.29169ZM1.0415 9.58335C1.0415 4.86592 4.86574 1.04169 9.58317 1.04169C14.3006 1.04169 18.1248 4.86592 18.1248 9.58335C18.1248 11.7171 17.3424 13.6681 16.0489 15.1652L18.7751 17.8914C19.0192 18.1355 19.0192 18.5312 18.7751 18.7753C18.531 19.0194 18.1353 19.0194 17.8912 18.7753L15.165 16.0491C13.668 17.3426 11.7169 18.125 9.58317 18.125C4.86574 18.125 1.0415 14.3008 1.0415 9.58335Z"
        className="fill-current"
      />
    </svg>
  );
};

export default SearchIcon;
