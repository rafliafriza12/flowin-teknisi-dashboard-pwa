import { IUser } from "./user";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type JenisPekerjaan =
  | "survei"
  | "rab"
  | "pemasangan"
  | "pengawasan_pemasangan"
  | "pengawasan_setelah_pemasangan"
  | "penyelesaian_laporan";

export type StatusPekerjaan =
  | "menunggu_respon"
  | "menunggu_tim"
  | "tim_diajukan"
  | "ditugaskan"
  | "sedang_dikerjakan"
  | "dikirim"
  | "revisi"
  | "selesai"
  | "dibatalkan";

export type StatusTim = "belum_diajukan" | "diajukan" | "disetujui" | "ditolak";

export type StatusRespon =
  | "belum_direspon"
  | "diterima"
  | "penolakan_diajukan"
  | "penolakan_diterima"
  | "penolakan_ditolak";

export type ChainStatus = "selesai" | "aktif" | "belum_dibuat" | "dibatalkan";

export type StatusPengajuan = "PENDING" | "APPROVED" | "REJECTED";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IPelanggan {
  id: string;
  namaLengkap: string;
  email: string;
  noHp: string;
  alamat?: string | null;
}

export interface IKoneksiData {
  id: string;
  pelanggan?: IPelanggan | null;
  statusPengajuan: StatusPengajuan;
  nik: string;
  noKK: string;
  imb: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  luasBangunan: number;
  tanggalVerifikasi?: string | null;
  alasanPenolakan?: string | null;
  nikUrl: string;
  kkUrl: string;
  imbUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRiwayatReview {
  status: string;
  catatan?: string | null;
  oleh: IUser;
  tanggal: string;
}

export interface IRiwayatRespon {
  aksi: string;
  alasan?: string | null;
  oleh: IUser;
  tanggal: string;
}

export interface IWorkOrder {
  id: string;
  idKoneksiData: string;
  koneksiData?: IKoneksiData | null;
  jenisPekerjaan: JenisPekerjaan;
  teknisiPenanggungJawab: IUser;
  tim: IUser[];
  statusTim: StatusTim;
  catatanTim?: string | null;
  status: StatusPekerjaan;
  // Workflow Chain
  workOrderSebelumnya?: IWorkOrder | null;
  // Respon Awal
  statusRespon: StatusRespon;
  alasanPenolakan?: string | null;
  catatanReviewPenolakan?: string | null;
  riwayatRespon: IRiwayatRespon[];
  // Referensi Dokumen
  idSurvei?: string | null;
  idRAB?: string | null;
  idPemasangan?: string | null;
  idPengawasanPemasangan?: string | null;
  idPengawasanSetelahPemasangan?: string | null;
  idPenyelesaianLaporan?: string | null;
  // Review
  catatanReview?: string | null;
  riwayatReview: IRiwayatReview[];
  createdAt: string;
  updatedAt: string;
}

export interface IWorkflowChainItem {
  jenisPekerjaan: JenisPekerjaan;
  workOrder: IWorkOrder | null;
  chainStatus: ChainStatus;
  urutan: number;
  bisaDibuat: boolean;
}

// ─── Progres Data (pre-fill form revisi) ─────────────────────────────────────

export interface IKoordinatProgres {
  longitude: number;
  latitude: number;
}

export interface IProgresData {
  jenisPekerjaan: JenisPekerjaan;
  // Survei
  koordinat?: IKoordinatProgres | null;
  urlJaringan?: string | null;
  diameterPipa?: number | null;
  urlPosisiBak?: string | null;
  posisiMeteran?: string | null;
  jumlahPenghuni?: number | null;
  standar?: boolean | null;
  // RAB
  totalBiaya?: number | null;
  urlRab?: string | null;
  // Pemasangan
  seriMeteran?: string | null;
  fotoRumah?: string | null;
  fotoMeteran?: string | null;
  fotoMeteranDanRumah?: string | null;
  // Pengawasan / Penyelesaian
  urlGambar?: string[] | null;
  // Shared
  catatan?: string | null;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface IPageInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IWorkOrderListResponse {
  data: IWorkOrder[];
  pagination: IPageInfo;
}

export interface IWorkOrderMutationResponse {
  success: boolean;
  message: string;
  workOrder: IWorkOrder;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface ITerimaPekerjaanInput {
  workOrderId: string;
}

export interface IAjukanPenolakanInput {
  workOrderId: string;
  alasan: string;
}

export interface IAjukanTimInput {
  workOrderId: string;
  anggotaTim: string[];
}

export interface IKerjaSendiriInput {
  workOrderId: string;
}

export interface ISimpanProgresInput {
  workOrderId: string;
  data: string;
}

export interface IKirimHasilInput {
  workOrderId: string;
}

export interface IWorkOrderFilterInput {
  status?: StatusPekerjaan;
  jenisPekerjaan?: JenisPekerjaan;
  statusTim?: StatusTim;
  statusRespon?: StatusRespon;
  teknisiPenanggungJawab?: string;
  idKoneksiData?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const LABEL_JENIS_PEKERJAAN: Record<JenisPekerjaan, string> = {
  survei: "Survei",
  rab: "RAB",
  pemasangan: "Pemasangan",
  pengawasan_pemasangan: "Pengawasan Pemasangan",
  pengawasan_setelah_pemasangan: "Pengawasan Setelah Pemasangan",
  penyelesaian_laporan: "Penyelesaian Laporan",
};

export const LABEL_STATUS_PEKERJAAN: Record<StatusPekerjaan, string> = {
  menunggu_respon: "Menunggu Respon",
  menunggu_tim: "Menunggu Tim",
  tim_diajukan: "Tim Diajukan",
  ditugaskan: "Ditugaskan",
  sedang_dikerjakan: "Sedang Dikerjakan",
  dikirim: "Dikirim",
  revisi: "Revisi",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const LABEL_STATUS_RESPON: Record<StatusRespon, string> = {
  belum_direspon: "Belum Direspon",
  diterima: "Diterima",
  penolakan_diajukan: "Penolakan Diajukan",
  penolakan_diterima: "Penolakan Diterima",
  penolakan_ditolak: "Penolakan Ditolak",
};

export const LABEL_STATUS_TIM: Record<StatusTim, string> = {
  belum_diajukan: "Belum Diajukan",
  diajukan: "Diajukan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export const LABEL_CHAIN_STATUS: Record<ChainStatus, string> = {
  selesai: "Selesai",
  aktif: "Aktif",
  belum_dibuat: "Belum Dibuat",
  dibatalkan: "Dibatalkan",
};

export const WARNA_STATUS_PEKERJAAN: Record<StatusPekerjaan, string> = {
  menunggu_respon: "bg-yellow-100 text-yellow-800",
  menunggu_tim: "bg-orange-100 text-orange-800",
  tim_diajukan: "bg-blue-100 text-blue-800",
  ditugaskan: "bg-indigo-100 text-indigo-800",
  sedang_dikerjakan: "bg-cyan-100 text-cyan-800",
  dikirim: "bg-purple-100 text-purple-800",
  revisi: "bg-red-100 text-red-800",
  selesai: "bg-green-100 text-green-800",
  dibatalkan: "bg-gray-100 text-gray-500",
};

export const WARNA_STATUS_RESPON: Record<StatusRespon, string> = {
  belum_direspon: "bg-yellow-100 text-yellow-800",
  diterima: "bg-green-100 text-green-800",
  penolakan_diajukan: "bg-orange-100 text-orange-800",
  penolakan_diterima: "bg-red-100 text-red-800",
  penolakan_ditolak: "bg-red-100 text-red-700",
};

export const WARNA_CHAIN_STATUS: Record<ChainStatus, string> = {
  selesai: "bg-green-100 text-green-800",
  aktif: "bg-blue-100 text-blue-800",
  belum_dibuat: "bg-gray-100 text-gray-500",
  dibatalkan: "bg-red-100 text-red-500",
};
