import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const TwitterIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 17 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_435_857)">
        <path
          d="M15.6612 1.84309C15.0401 2.2581 14.3525 2.57551 13.6248 2.7831C13.2342 2.35765 12.7152 2.05609 12.1378 1.91923C11.5604 1.78237 10.9526 1.81679 10.3965 2.01786C9.8405 2.21892 9.36305 2.57692 9.02876 3.04343C8.69448 3.50994 8.51949 4.06246 8.52747 4.62626V5.24064C7.38778 5.26864 6.25848 5.02918 5.24013 4.54359C4.22179 4.058 3.34601 3.34135 2.6908 2.45748C2.6908 2.45748 0.0967321 7.98695 5.93339 10.4445C4.59779 11.3034 3.00673 11.734 1.39377 11.6733C7.23043 14.7452 14.3641 11.6733 14.3641 4.60783C14.3635 4.43669 14.3462 4.26598 14.3122 4.09789C14.9741 3.4795 15.4412 2.69875 15.6612 1.84309Z"
          className="strokeCurrent"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_435_857">
          <rect
            width="15.5644"
            height="14.7453"
            fill="white"
            transform="translate(0.745239)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default TwitterIcon;
