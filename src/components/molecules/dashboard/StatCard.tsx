import { Heading3 } from "@/components/atoms/Typography";
import { DashboardStatType } from "@/constant/dashboard/stat";

export const StatCard = (props: DashboardStatType) => {
  return (
    <div className="bg-neutral-01 flex flex-col gap-6 p-4 rounded-2xl">
      <div className="flex w-full gap-2 items-center">
        <div className="rounded-md bg-moss-stone p-1.5">{props.icon}</div>
        <p className="text-sm font-medium text-neutral-02">{props.title}</p>
      </div>
      <div>
        <Heading3>{props.value}</Heading3>
      </div>
      <div className="flex gap-1.5">
        <p className={`text-xs font-medium ${props.indicator === "up" ? "text-success" : "text-error"}`}>
          {props.indicator === "up" ? "↑" : "↓"} {props.progress}
        </p>
        <p className="text-xs text-grey font-normal">{props.description}</p>
      </div>
    </div>
  );
};
