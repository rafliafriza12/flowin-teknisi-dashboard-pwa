import { cn } from "@/libs/utils";

interface IEmailInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const EmailInput: React.FC<IEmailInputProps> = ({ className, ...props }) => {
  return (
    <input
      type="email"
      placeholder="Enter your email..."
      className={cn(
        "block w-full h-11 rounded-lg border text-sm bg-white px-4",
        "border-grey-stroke shadow-sm",
        "placeholder:text-gray-400",
        "focus:outline-none focus:border-moss-stone focus:ring-2 focus:ring-moss-stone/20",
        "transition-all duration-200",
        "disabled:bg-grey-lightest disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
};

export default EmailInput;
