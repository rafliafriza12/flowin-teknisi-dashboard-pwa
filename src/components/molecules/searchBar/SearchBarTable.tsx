import SearchIcon from "../../atoms/icons/SearchIcon";
import CommandF from "../../atoms/icons/CommandF";
import { cn } from "@/libs/utils";

interface SearchBarTableProps {
  className?: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const SearchBarTable = (props: SearchBarTableProps) => {
  return (
    <div
      className={cn(
        "w-64 h-9 border border-grey-stroke rounded-lg bg-grey-lightest flex gap-2 items-center p-2",
        props.className
      )}
    >
      <SearchIcon className="w-4 h-4 text-grey" />
      <input
        type="text"
        className="text-xs outline-none bg-transparent flex-1"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange?.(e.target.value)}
      />
    </div>
  );
};
