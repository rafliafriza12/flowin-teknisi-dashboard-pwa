import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const YoutubeIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 16 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_435_859)">
        <path
          d="M14.9273 3.94433C14.8502 3.65275 14.6933 3.38559 14.4724 3.16984C14.2515 2.95409 13.9744 2.79739 13.6692 2.71556C12.5537 2.45752 8.09189 2.45752 8.09189 2.45752C8.09189 2.45752 3.63009 2.45752 2.51464 2.74014C2.20935 2.82196 1.93225 2.97867 1.71135 3.19442C1.49044 3.41017 1.33355 3.67733 1.25651 3.96891C1.05237 5.04135 0.952512 6.12928 0.958195 7.21901C0.950919 8.31694 1.05078 9.41316 1.25651 10.4937C1.34144 10.7762 1.50185 11.0332 1.72224 11.2398C1.94263 11.4465 2.21556 11.5958 2.51464 11.6733C3.63009 11.9559 8.09189 11.9559 8.09189 11.9559C8.09189 11.9559 12.5537 11.9559 13.6692 11.6733C13.9744 11.5915 14.2515 11.4348 14.4724 11.219C14.6933 11.0033 14.8502 10.7361 14.9273 10.4445C15.1298 9.38016 15.2297 8.30053 15.2256 7.21901C15.2329 6.12107 15.133 5.02485 14.9273 3.94433Z"
          className="strokeCurrent"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.63275 9.22804L10.3617 7.219L6.63275 5.20996V9.22804Z"
          className="strokeCurrent"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_435_859">
          <rect
            width="15.5644"
            height="14.7453"
            fill="white"
            transform="translate(0.309692)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default YoutubeIcon;
