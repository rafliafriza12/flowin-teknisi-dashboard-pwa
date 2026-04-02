import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const VoiceMailIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 15 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.4375 10.8354C4.9908 10.8354 6.25 9.57625 6.25 8.02295C6.25 6.46965 4.9908 5.21045 3.4375 5.21045C1.8842 5.21045 0.625 6.46965 0.625 8.02295C0.625 9.57625 1.8842 10.8354 3.4375 10.8354Z"
        className="strokeCurrent"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        stroke="currentColor"

      />
      <path
        d="M11.5625 10.8354C13.1158 10.8354 14.375 9.57625 14.375 8.02295C14.375 6.46965 13.1158 5.21045 11.5625 5.21045C10.0092 5.21045 8.75 6.46965 8.75 8.02295C8.75 9.57625 10.0092 10.8354 11.5625 10.8354Z"
        className="strokeCurrent"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        stroke="currentColor"
      />
      <path
        d="M3.4375 8.17578H11.5625"
        className="strokeCurrent"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        stroke="currentColor"
      />
    </svg>
  );
};

export default VoiceMailIcon;
