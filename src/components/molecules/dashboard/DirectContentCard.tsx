import ArrowIcon from "@/components/atoms/icons/ArrowIcon";
import DownloadIcon from "@/components/atoms/icons/DownloadIcon";
import { Heading5 } from "@/components/atoms/Typography";
import { DirectContentDataType } from "@/constant/dashboard/directContent";
import Link from "next/link";
import { ReactNode } from "react";

interface DirectContentCardProps {
  name: string;
  url: string;
  variant: "link" | "download";
  children: ReactNode;
}

export const DirectContentCard = (props: DirectContentCardProps) => {
  return (
    <div className="rounded-lg flex flex-col gap-6 p-4 pt-0 bg-neutral-01 h-72 relative">
      <div className="w-full flex justify-between items-center sticky top-0 bg-neutral-01 pb-4 pt-4 z-10 border-b border-grey-stroke">
        <Heading5>{props.name}</Heading5>
        <Link
          href={props.url}
          className="rounded-lg border border-grey-stroke p-2 flex hover:bg-black/5 duration-200"
        >
          {props.variant === "link" ? <ArrowIcon /> : <DownloadIcon />}
        </Link>
      </div>
      <div className="overflow-y-auto thin-scrollbar">{props.children}</div>
    </div>
  );
};
