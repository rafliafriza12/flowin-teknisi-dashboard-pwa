import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const LinkedinIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.83017 4.91504C10.8078 4.91504 11.7455 5.30342 12.4368 5.99474C13.1281 6.68605 13.5165 7.62368 13.5165 8.60135V12.9021H11.0589V8.60135C11.0589 8.27546 10.9295 7.96292 10.699 7.73248C10.4686 7.50204 10.1561 7.37258 9.83017 7.37258C9.50428 7.37258 9.19174 7.50204 8.9613 7.73248C8.73086 7.96292 8.6014 8.27546 8.6014 8.60135V12.9021H6.14386V8.60135C6.14386 7.62368 6.53224 6.68605 7.22356 5.99474C7.91487 5.30342 8.8525 4.91504 9.83017 4.91504Z"
        className="strokeCurrent"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.6863 5.5293H1.22876V12.9019H3.6863V5.5293Z"
        className="strokeCurrent"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.45753 3.68655C3.13616 3.68655 3.6863 3.13641 3.6863 2.45778C3.6863 1.77914 3.13616 1.229 2.45753 1.229C1.7789 1.229 1.22876 1.77914 1.22876 2.45778C1.22876 3.13641 1.7789 3.68655 2.45753 3.68655Z"
        className="strokeCurrent"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LinkedinIcon;
