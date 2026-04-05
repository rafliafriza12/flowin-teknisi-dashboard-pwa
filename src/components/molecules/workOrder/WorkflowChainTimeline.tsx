"use client";

import StatusBadge from "@/components/atoms/StatusBadge";
import {
  IWorkflowChainItem,
  LABEL_JENIS_PEKERJAAN,
  LABEL_CHAIN_STATUS,
  WARNA_CHAIN_STATUS,
} from "@/types/workOrder";

interface WorkflowChainTimelineProps {
  chain: IWorkflowChainItem[];
}

const WorkflowChainTimeline: React.FC<WorkflowChainTimelineProps> = ({
  chain,
}) => {
  return (
    <div className="bg-white rounded-xl border border-grey-stroke p-4">
      <h3 className="text-sm font-semibold text-neutral-03 mb-4">
        Rantai Workflow
      </h3>
      <div className="relative">
        {chain.map((item, index) => {
          const isLast = index === chain.length - 1;
          const isActive = item.chainStatus === "aktif";

          return (
            <div key={item.jenisPekerjaan} className="flex gap-3">
              {/* Timeline dot & line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                    item.chainStatus === "selesai"
                      ? "bg-green-500 border-green-500"
                      : isActive
                        ? "bg-blue-500 border-blue-500"
                        : item.chainStatus === "dibatalkan"
                          ? "bg-red-400 border-red-400"
                          : "bg-gray-200 border-gray-300"
                  }`}
                />
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-6 ${
                      item.chainStatus === "selesai"
                        ? "bg-green-300"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-blue-700" : "text-neutral-03"
                    }`}
                  >
                    {item.urutan}. {LABEL_JENIS_PEKERJAAN[item.jenisPekerjaan]}
                  </span>
                  <StatusBadge
                    label={LABEL_CHAIN_STATUS[item.chainStatus]}
                    colorClass={WARNA_CHAIN_STATUS[item.chainStatus]}
                  />
                </div>
                {item.workOrder && (
                  <>
                    <p className="text-xs text-grey mt-0.5">
                      <strong>ID Pekerjaan</strong>: {item.workOrder.id}
                    </p>
                    <p className="text-xs text-grey mt-0.5">
                      <strong>Penanggung Jawab</strong>:{" "}
                      {item.workOrder.teknisiPenanggungJawab?.namaLengkap}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowChainTimeline;
