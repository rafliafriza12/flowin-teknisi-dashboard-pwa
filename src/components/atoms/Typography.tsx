import { ReactNode } from "react";
import { cn } from "@/libs/utils";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function Heading1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn("text-4xl md:text-5xl lg:text-6xl font-bold", className)}>
      {children}
    </h1>
  );
}

export function Heading2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("text-3xl md:text-4xl lg:text-5xl font-bold", className)}>
      {children}
    </h2>
  );
}

export function Heading3({ children, className }: TypographyProps) {
  return <h3 className={cn("text-3xl font-medium", className)}>{children}</h3>;
}

export function Heading4({ children, className }: TypographyProps) {
  return <h4 className={cn("text-2xl font-medium", className)}>{children}</h4>;
}

export function Heading5({ children, className }: TypographyProps) {
  return <h5 className={cn("text-xl font-medium", className)}>{children}</h5>;
}

export function Heading6({ children, className }: TypographyProps) {
  return <h5 className={cn("text-lg font-medium", className)}>{children}</h5>;
}

export function Paragraph({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-base md:text-lg leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function ContentLabel({ children, className }: TypographyProps) {
  return <p className={cn("text-sm font-medium", className)}>{children}</p>;
}

export function BodyMediumRegular({
  children,
  className = "",
}: TypographyProps) {
  return <p className={`text-base leading-[160%]  ${className}`}>{children}</p>;
}

export function BodyMediumMedium({
  children,
  className = "",
}: TypographyProps) {
  return (
    <p className={`text-base font-medium leading-[160%]  ${className}`}>
      {children}
    </p>
  );
}

export function BodySmallMedium({ children, className = "" }: TypographyProps) {
  return (
    <p className={`text-sm leading-[155%] font-medium  ${className}`}>
      {children}
    </p>
  );
}
