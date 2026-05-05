/**
 * Example usage of useQueryStaleness hook
 *
 * This file demonstrates how to use the useQueryStaleness hook
 * to display data staleness indicators in your components.
 */

import { useQuery } from "@tanstack/react-query";
import { useQueryStaleness } from "./useQueryStaleness";
import { useOnlineStatus } from "./useOfflineSync";

// Example 1: Basic usage with work order detail
export function WorkOrderDetailExample({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["workOrder", id],
    queryFn: () => fetchWorkOrder(id),
  });

  const staleness = useQueryStaleness(["workOrder", id]);
  const isOnline = useOnlineStatus();

  return (
    <div>
      {/* Show staleness indicator when offline */}
      {!isOnline && (
        <div className="bg-amber-50 p-2 text-sm border-b border-amber-200">
          <span className="text-amber-700">{staleness.message}</span>
          {staleness.staleness === "very_stale" && (
            <span className="ml-2 text-red-600">
              ⚠️ Data mungkin tidak akurat
            </span>
          )}
        </div>
      )}

      {/* Your component content */}
      <div className="p-4">
        <h1>{data?.title}</h1>
        {/* ... rest of component */}
      </div>
    </div>
  );
}

// Example 2: Conditional rendering based on staleness
export function WorkOrderListExample() {
  const { data } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => fetchWorkOrders(),
  });

  const staleness = useQueryStaleness(["workOrders"]);
  const isOnline = useOnlineStatus();

  // Show warning for very stale data
  if (!isOnline && staleness.staleness === "very_stale") {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-red-800">Data Outdated</h3>
          <p className="text-red-700">{staleness.message}</p>
          <p className="text-sm text-red-600 mt-2">
            Silakan refresh saat koneksi tersedia untuk mendapatkan data
            terbaru.
          </p>
        </div>
        {/* Still show the data, but with warning */}
        <WorkOrderList data={data} />
      </div>
    );
  }

  return <WorkOrderList data={data} />;
}

// Example 3: Using staleness info in a status badge
export function DataStatusBadge({ queryKey }: { queryKey: string[] }) {
  const staleness = useQueryStaleness(queryKey);
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null; // Don't show badge when online
  }

  const badgeColors = {
    fresh: "bg-green-100 text-green-800",
    recent: "bg-blue-100 text-blue-800",
    stale: "bg-amber-100 text-amber-800",
    very_stale: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeColors[staleness.staleness]}`}
    >
      {staleness.message}
    </span>
  );
}

// Example 4: Pull-to-refresh with staleness check
export function RefreshableWorkOrderList() {
  const { data, refetch } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => fetchWorkOrders(),
  });

  const staleness = useQueryStaleness(["workOrders"]);
  const isOnline = useOnlineStatus();

  const handleRefresh = async () => {
    if (!isOnline) {
      // Show toast: "Tidak dapat refresh - Anda sedang offline"
      return;
    }

    await refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold">Daftar Pekerjaan</h2>
          {!isOnline && (
            <p className="text-sm text-gray-600">{staleness.message}</p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={!isOnline}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      <WorkOrderList data={data} />
    </div>
  );
}

// Mock functions (replace with actual implementations)
declare function fetchWorkOrder(id: string): Promise<any>;
declare function fetchWorkOrders(): Promise<any>;
declare function WorkOrderList({ data }: { data: any }): React.ReactElement;
