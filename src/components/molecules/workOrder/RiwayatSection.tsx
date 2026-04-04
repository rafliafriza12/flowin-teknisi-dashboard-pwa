"use client";

import { IWorkOrder } from "@/types/workOrder";
import { formatDate } from "@/libs/utils";

interface RiwayatSectionProps {
  workOrder: IWorkOrder;
}

const RiwayatSection: React.FC<RiwayatSectionProps> = ({ workOrder }) => {
  const hasRiwayatReview = workOrder.riwayatReview.length > 0;
  const hasRiwayatRespon = workOrder.riwayatRespon.length > 0;

  if (!hasRiwayatReview && !hasRiwayatRespon) return null;

  return (
    <div className="bg-white rounded-xl border border-grey-stroke p-4">
      <h3 className="text-sm font-semibold text-neutral-03 mb-4">Riwayat</h3>

      {/* Riwayat Respon */}
      {hasRiwayatRespon && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-grey mb-2">Respon</h4>
          <div className="space-y-2">
            {workOrder.riwayatRespon.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-neutral-03 capitalize">
                      {item.aksi.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-grey">
                      oleh {item.oleh.namaLengkap}
                    </span>
                  </div>
                  {item.alasan && (
                    <p className="text-xs text-grey mt-0.5">{item.alasan}</p>
                  )}
                  <p className="text-[10px] text-grey mt-0.5">
                    {formatDate(item.tanggal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Review */}
      {hasRiwayatReview && (
        <div>
          <h4 className="text-xs font-medium text-grey mb-2">Review Admin</h4>
          <div className="space-y-2">
            {workOrder.riwayatReview.map((item, index) => {
              const isApproved = item.status === "disetujui";
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded-lg ${
                    isApproved ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      isApproved ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium capitalize ${
                          isApproved ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-grey">
                        oleh {item.oleh.namaLengkap}
                      </span>
                    </div>
                    {item.catatan && (
                      <p className="text-xs text-grey mt-0.5">{item.catatan}</p>
                    )}
                    <p className="text-[10px] text-grey mt-0.5">
                      {formatDate(item.tanggal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatSection;
