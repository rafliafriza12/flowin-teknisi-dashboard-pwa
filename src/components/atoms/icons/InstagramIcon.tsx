import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const InstagramIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 16 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.3187 1.229H5.17483C3.47825 1.229 2.10291 2.60435 2.10291 4.30093V10.4448C2.10291 12.1414 3.47825 13.5167 5.17483 13.5167H11.3187C13.0153 13.5167 14.3906 12.1414 14.3906 10.4448V4.30093C14.3906 2.60435 13.0153 1.229 11.3187 1.229Z"
        className="strokeCurrent"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.7043 6.98574C10.7801 7.49706 10.6928 8.01927 10.4547 8.47809C10.2166 8.93691 9.83995 9.30898 9.37823 9.54138C8.9165 9.77378 8.39326 9.85467 7.88291 9.77255C7.37257 9.69043 6.90111 9.44947 6.5356 9.08396C6.17008 8.71845 5.92913 8.24699 5.84701 7.73665C5.76489 7.2263 5.84578 6.70305 6.07818 6.24133C6.31058 5.77961 6.68265 5.40292 7.14147 5.16485C7.60029 4.92677 8.1225 4.83943 8.63382 4.91526C9.15539 4.9926 9.63825 5.23564 10.0111 5.60847C10.3839 5.98131 10.627 6.46417 10.7043 6.98574Z"
        className="strokeCurrent"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6259 3.99365H11.6324"
        className="strokeCurrent"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default InstagramIcon;
