import { cn } from "@/libs/utils";
import { IconProps } from "@/types/iconProps";

const TwoUserGroupIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="7.50081" cy="4.99999" r="3.33333" className="fill-current" />
      <ellipse
        cx="7.50081"
        cy="14.1675"
        rx="5.83333"
        ry="3.33333"
        className="fill-current"
      />
      <path
        d="M17.4996 14.167C17.4996 15.5478 15.8033 16.667 13.7322 16.667C14.3424 16.0001 14.762 15.1629 14.762 14.1682C14.762 13.1723 14.3414 12.3344 13.7301 11.6671C15.8012 11.6671 17.4996 12.7863 17.4996 14.167Z"
        className="fill-current"
      />
      <path
        d="M14.9996 5.00061C14.9996 6.38132 13.8803 7.50061 12.4996 7.50061C12.1985 7.50061 11.9099 7.44739 11.6426 7.34984C12.0368 6.65643 12.262 5.85435 12.262 4.99968C12.262 4.14564 12.0372 3.34411 11.6435 2.65106C11.9105 2.55371 12.1989 2.50061 12.4996 2.50061C13.8803 2.50061 14.9996 3.6199 14.9996 5.00061Z"
        className="fill-current"
      />
    </svg>
  );
};

export default TwoUserGroupIcon;
