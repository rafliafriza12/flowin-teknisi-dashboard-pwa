import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Container({ children, className = "", id }: ContainerProps) {
  return (
    <div
      id={id ?? ""}
      className={`px-4 sm:px-6 lg:px-[80px] lg:py-3 ${className}`}
    >
      {children}
    </div>
  );
}
