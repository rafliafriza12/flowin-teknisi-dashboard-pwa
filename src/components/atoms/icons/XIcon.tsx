import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const XIcon: React.FC<IconProps> = ({ className }) => {
  return (
    // <svg
    //   className={cn("w-4 h-4", className)}
    //   viewBox="0 0 15 16"
    //   xmlns="http://www.w3.org/2000/svg"
    // >
    //   <path
    //     d="M3.4375 10.8354C4.9908 10.8354 6.25 9.57625 6.25 8.02295C6.25 6.46965 4.9908 5.21045 3.4375 5.21045C1.8842 5.21045 0.625 6.46965 0.625 8.02295C0.625 9.57625 1.8842 10.8354 3.4375 10.8354Z"
    //     className="strokeCurrent"
    //     strokeWidth="0.7"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //     fill="currentColor"
    //     stroke="currentColor"

    //   />
    //   <path
    //     d="M11.5625 10.8354C13.1158 10.8354 14.375 9.57625 14.375 8.02295C14.375 6.46965 13.1158 5.21045 11.5625 5.21045C10.0092 5.21045 8.75 6.46965 8.75 8.02295C8.75 9.57625 10.0092 10.8354 11.5625 10.8354Z"
    //     className="strokeCurrent"
    //     strokeWidth="0.7"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //     fill="currentColor"
    //     stroke="currentColor"
    //   />
    //   <path
    //     d="M3.4375 8.17578H11.5625"
    //     className="strokeCurrent"
    //     strokeWidth="0.7"
    //     strokeLinecap="round"
    //     strokeLinejoin="round"
    //     fill="currentColor"
    //     stroke="currentColor"
    //   />
    // </svg>
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_141_27872)">
        <path
          d="M12.0002 10.5867L16.9502 5.63672L18.3642 7.05072L13.4142 12.0007L18.3642 16.9507L16.9502 18.3647L12.0002 13.4147L7.05023 18.3647L5.63623 16.9507L10.5862 12.0007L5.63623 7.05072L7.05023 5.63672L12.0002 10.5867Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_141_27872">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default XIcon;
