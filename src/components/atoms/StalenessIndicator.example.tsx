/**
 * Example usage of StalenessIndicator component
 * 
 * This file demonstrates how to integrate the StalenessIndicator
 * into your pages to show data staleness when offline.
 */

import { useQuery } from "@tanstack/react-query";
import StalenessIndicator from "./StalenessIndicator";

// Example 1: Basic usage in a work order detail page
export function WorkOrderDetailExample({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["workOrder", id],
    queryFn: () => fetchWorkOrder(id),
  });

  return (
    <div>
      {/* Show staleness indicator at the top of the page */}
      <StalenessIndicator queryKey={["workOrder", id]} />
      
      <h1>Work Order Detail</h1>
      {/* ... rest of your component */}
    </div>
  );
}

// Example 2: Usage with custom styling
export function WorkOrderListExample() {
  const { data } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => fetchWorkOrders(),
  });

  return (
    <div>
      {/* Add custom className for styling */}
      <StalenessIndicator 
        queryKey={["workOrders"]} 
        className="mb-4 p-3 bg-gray-50 rounded-lg"
      />
      
      <h1>Work Orders</h1>
      {/* ... rest of your component */}
    </div>
  );
}

// Example 3: Usage in a header component
export function PageHeaderWithStaleness({ 
  title, 
  queryKey 
}: { 
  title: string; 
  queryKey: unknown[];
}) {
  return (
    <div className="border-b pb-4 mb-6">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <StalenessIndicator queryKey={queryKey} />
    </div>
  );
}

// Example 4: Multiple staleness indicators for different queries
export function DashboardExample() {
  const { data: workOrders } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => fetchWorkOrders(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  return (
    <div>
      <section>
        <h2>Work Orders</h2>
        <StalenessIndicator queryKey={["workOrders"]} />
        {/* Work orders content */}
      </section>

      <section>
        <h2>Profile</h2>
        <StalenessIndicator queryKey={["profile"]} />
        {/* Profile content */}
      </section>
    </div>
  );
}

// Mock fetch functions (replace with actual implementations)
async function fetchWorkOrder(id: string) {
  return { id, title: "Work Order" };
}

async function fetchWorkOrders() {
  return [{ id: "1", title: "Work Order 1" }];
}

async function fetchProfile() {
  return { name: "User" };
}
