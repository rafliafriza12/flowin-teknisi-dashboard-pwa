"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useGraphQLQuery,
  useGraphQLSignedMutation,
  queryKeys,
} from "@/libs/graphql";
import {
  GET_WORK_ORDERS_SAYA,
  GET_WORK_ORDER_BY_ID,
  GET_WORKFLOW_CHAIN,
  GET_WORK_ORDERS_BY_KONEKSI_DATA,
} from "@/libs/graphql/queries";
import {
  TERIMA_PEKERJAAN,
  AJUKAN_PENOLAKAN,
  AJUKAN_TIM,
  KERJA_SENDIRI,
  SIMPAN_PROGRES,
  KIRIM_HASIL,
} from "@/libs/graphql/mutations";
import type {
  IWorkOrder,
  IWorkOrderListResponse,
  IWorkOrderMutationResponse,
  IWorkflowChainItem,
  IWorkOrderFilterInput,
  ITerimaPekerjaanInput,
  IAjukanPenolakanInput,
  IAjukanTimInput,
  IKerjaSendiriInput,
  ISimpanProgresInput,
  IKirimHasilInput,
} from "@/types/workOrder";

// Re-export types
export type {
  IWorkOrder,
  IWorkOrderListResponse,
  IWorkOrderMutationResponse,
  IWorkflowChainItem,
};

// ─── Response wrapper types ───────────────────────────────────────────────────

interface WorkOrdersSayaResponse {
  workOrdersSaya: IWorkOrderListResponse;
}

interface WorkOrderDetailResponse {
  workOrder: IWorkOrder | null;
}

interface WorkflowChainResponse {
  workflowChain: IWorkflowChainItem[];
}

interface WorkOrdersByKoneksiDataResponse {
  workOrdersByKoneksiData: IWorkOrder[];
}

// ─── Query Hooks ──────────────────────────────────────────────────────────────

/**
 * Ambil daftar work order milik teknisi yang sedang login.
 */
export function useWorkOrdersSaya(
  filters?: IWorkOrderFilterInput & { page?: number; limit?: number },
) {
  const { page, limit, ...filter } = filters || {};
  const variables: Record<string, unknown> = {};

  if (Object.keys(filter).length > 0) {
    variables.filter = filter;
  }
  if (page || limit) {
    variables.pagination = { page: page || 1, limit: limit || 20 };
  }

  return useGraphQLQuery<WorkOrdersSayaResponse>(
    queryKeys.workOrders.sayaFiltered(filters as Record<string, unknown>),
    GET_WORK_ORDERS_SAYA,
    variables as Record<string, unknown>,
  );
}

/**
 * Ambil detail satu work order berdasarkan ID.
 */
export function useWorkOrder(id: string) {
  return useGraphQLQuery<WorkOrderDetailResponse>(
    queryKeys.workOrders.detail(id),
    GET_WORK_ORDER_BY_ID,
    { id },
    {
      enabled: !!id,
    },
  );
}

/**
 * Ambil rantai workflow untuk satu koneksi data.
 */
export function useWorkflowChain(idKoneksiData: string) {
  return useGraphQLQuery<WorkflowChainResponse>(
    queryKeys.workOrders.workflowChain(idKoneksiData),
    GET_WORKFLOW_CHAIN,
    { idKoneksiData },
    {
      enabled: !!idKoneksiData,
    },
  );
}

/**
 * Ambil semua work order untuk satu koneksi data.
 */
export function useWorkOrdersByKoneksiData(idKoneksiData: string) {
  return useGraphQLQuery<WorkOrdersByKoneksiDataResponse>(
    queryKeys.workOrders.byKoneksiData(idKoneksiData),
    GET_WORK_ORDERS_BY_KONEKSI_DATA,
    { idKoneksiData },
    {
      enabled: !!idKoneksiData,
    },
  );
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

/**
 * Invalidate semua query work order terkait setelah mutasi.
 */
function useInvalidateWorkOrders() {
  const queryClient = useQueryClient();

  return (workOrder?: IWorkOrder) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workOrders.all });
    if (workOrder?.idKoneksiData) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workOrders.workflowChain(workOrder.idKoneksiData),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.workOrders.byKoneksiData(workOrder.idKoneksiData),
      });
    }
  };
}

/**
 * Terima pekerjaan (gate utama).
 */
export function useTerimaPekerjaan() {
  const invalidate = useInvalidateWorkOrders();

  return useGraphQLSignedMutation<
    { terimaPekerjaan: IWorkOrderMutationResponse },
    { input: ITerimaPekerjaanInput }
  >(TERIMA_PEKERJAAN, {
    onSuccess: (data) => {
      invalidate(data.terimaPekerjaan.workOrder);
    },
  });
}

/**
 * Ajukan penolakan pekerjaan.
 */
export function useAjukanPenolakan() {
  const invalidate = useInvalidateWorkOrders();

  return useGraphQLSignedMutation<
    { ajukanPenolakan: IWorkOrderMutationResponse },
    { input: IAjukanPenolakanInput }
  >(AJUKAN_PENOLAKAN, {
    onSuccess: (data) => {
      invalidate(data.ajukanPenolakan.workOrder);
    },
  });
}

/**
 * Ajukan anggota tim.
 */
export function useAjukanTim() {
  const invalidate = useInvalidateWorkOrders();

  return useGraphQLSignedMutation<
    { ajukanTim: IWorkOrderMutationResponse },
    { input: IAjukanTimInput }
  >(AJUKAN_TIM, {
    onSuccess: (data) => {
      invalidate(data.ajukanTim.workOrder);
    },
  });
}

/**
 * Kerja sendiri tanpa tim.
 */
export function useKerjaSendiri() {
  const invalidate = useInvalidateWorkOrders();

  return useGraphQLSignedMutation<
    { kerjaSendiri: IWorkOrderMutationResponse },
    { input: IKerjaSendiriInput }
  >(KERJA_SENDIRI, {
    onSuccess: (data) => {
      invalidate(data.kerjaSendiri.workOrder);
    },
  });
}

/**
 * Simpan progres pekerjaan (draft).
 */
export function useSimpanProgres() {
  const invalidate = useInvalidateWorkOrders();

  return useGraphQLSignedMutation<
    { simpanProgres: IWorkOrderMutationResponse },
    { input: ISimpanProgresInput }
  >(SIMPAN_PROGRES, {
    onSuccess: (data) => {
      invalidate(data.simpanProgres.workOrder);
    },
  });
}

/**
 * Kirim hasil pekerjaan untuk di-review admin.
 */
export function useKirimHasil() {
  const invalidate = useInvalidateWorkOrders();

  return useGraphQLSignedMutation<
    { kirimHasil: IWorkOrderMutationResponse },
    { input: IKirimHasilInput }
  >(KIRIM_HASIL, {
    onSuccess: (data) => {
      invalidate(data.kirimHasil.workOrder);
    },
  });
}
