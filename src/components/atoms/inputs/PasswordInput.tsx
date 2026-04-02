import { cn } from "@/libs/utils";
interface IPasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput: React.FC<IPasswordInputProps> = ({
  className,
  ...props
}) => {
  return (
    <input
      type="password"
      className={cn(
        "block w-full rounded-md border text-sm border-gray-300 shadow bg-white/5 px-3 py-1.5 placeholder:text-sm placeholder:text-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-moss-stone sm:text-sm/6",
        className
      )}
      {...props}
      placeholder="Password ..."
    />
  );
};

export default PasswordInput;
