import { cn } from "@/libs/utils";
import { ReactNode } from "react";

interface TableProps {
  children?: ReactNode;
  className?: string;
}

export const Table = ({ children, className }: TableProps) => {
  return (
    <div className="w-full border border-grey-stroke rounded-lg">
      <div className="w-full overflow-x-auto">
        <table className={cn("w-full border-collapse", className)}>
          {children}
        </table>
      </div>
    </div>
  );
};

export const TableHeader = ({ children, className }: TableProps) => {
  return (
    <thead className={cn("bg-grey-light", className)}>{children}</thead>
  );
};

export const TableBody = ({ children, className }: TableProps) => {
  return <tbody className={className}>{children}</tbody>;
};

export const TableRow = ({
  children,
  className,
  onClick,
}: TableProps & { onClick?: () => void }) => {
  return (
    <tr
      className={cn(
        "border-b border-grey-stroke transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({
  children,
  className,
  sortable,
  onSort,
}: TableProps & {
  sortable?: boolean;
  onSort?: () => void;
}) => {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-neutral-02",
        sortable && "cursor-pointer select-none hover:text-neutral-02",
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <svg
            className="w-3 h-3"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 3L8 5H4L6 3Z"
              fill="currentColor"
              opacity="0.5"
            />
            <path
              d="M6 9L4 7H8L6 9Z"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
        )}
      </div>
    </th>
  );
};

export const TableCell = ({ children, className }: TableProps) => {
  return (
    <td className={cn("px-4 py-4 text-sm text-neutral-02 relative", className)}>
      {children}
    </td>
  );
};
