import { cn } from "@/libs/utils";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (items: number) => void;
  className?: string;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 5,
  onItemsPerPageChange,
  className,
}: TablePaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      className={cn("flex items-center justify-between gap-4 py-4", className)}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-02">Show Data</span>
        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-grey-stroke font-semibold rounded-lg bg-neutral-01 text-neutral-02 focus:outline-none focus:ring-1 focus:ring-moss-stone"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 hover:bg-grey-lightest rounded-full border border-grey-stroke transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4 text-neutral-02 rotate-180"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.27325 4L3.33325 4.94L6.38659 8L3.33325 11.06L4.27325 12L8.27325 8L4.27325 4Z"
              fill="currentColor"
            />
            <path
              d="M8.66656 4L7.72656 4.94L10.7799 8L7.72656 11.06L8.66656 12L12.6666 8L8.66656 4Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 hover:bg-grey-lightest rounded-full border border-grey-stroke transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4 text-neutral-02 rotate-180"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.94 4L6 4.94L9.05333 8L6 11.06L6.94 12L10.94 8L6.94 4Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={index} className="px-3 py-1.5 text-xs text-grey">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page as number)}
              className={cn(
                "min-w-6 px-3 py-1.5 text-xs transition-colors rounded-full border border-grey-stroke",
                currentPage === page
                  ? "bg-moss-stone text-neutral-01 font-medium"
                  : "text-neutral-02 hover:bg-grey-lightest"
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-grey-lightest rounded-full border border-grey-stroke transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4 text-neutral-02"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.94 4L6 4.94L9.05333 8L6 11.06L6.94 12L10.94 8L6.94 4Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-grey-lightest rounded-full border border-grey-stroke transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4 text-neutral-02"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.27325 4L3.33325 4.94L6.38659 8L3.33325 11.06L4.27325 12L8.27325 8L4.27325 4Z"
              fill="currentColor"
            />
            <path
              d="M8.66656 4L7.72656 4.94L10.7799 8L7.72656 11.06L8.66656 12L12.6666 8L8.66656 4Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
