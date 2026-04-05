// ─── Work Order Fragment ──────────────────────────────────────────────────────

const WORK_ORDER_FIELDS = `
  id
  idKoneksiData
  koneksiData {
    id
    pelanggan {
      id
      namaLengkap
      email
      noHp
      alamat
    }
    statusPengajuan
    nik
    noKK
    imb
    alamat
    kelurahan
    kecamatan
    luasBangunan
    tanggalVerifikasi
    alasanPenolakan
    createdAt
  }
  jenisPekerjaan
  teknisiPenanggungJawab {
    id
    namaLengkap
    nip
    email
    noHp
    divisi
  }
  tim {
    id
    namaLengkap
    nip
    email
    noHp
    divisi
  }
  statusTim
  catatanTim
  status
  workOrderSebelumnya {
    id
    jenisPekerjaan
    status
  }
  statusRespon
  alasanPenolakan
  catatanReviewPenolakan
  riwayatRespon {
    aksi
    alasan
    oleh {
      id
      namaLengkap
    }
    tanggal
  }
  idSurvei
  idRAB
  idPemasangan
  idPengawasanPemasangan
  idPengawasanSetelahPemasangan
  idPenyelesaianLaporan
  catatanReview
  riwayatReview {
    status
    catatan
    oleh {
      id
      namaLengkap
    }
    tanggal
  }
  createdAt
  updatedAt
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const GET_WORK_ORDERS_SAYA = `
  query WorkOrdersSaya($filter: WorkOrderFilterInput, $pagination: PaginationInput) {
    workOrdersSaya(filter: $filter, pagination: $pagination) {
      data {
        ${WORK_ORDER_FIELDS}
      }
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

export const GET_WORK_ORDER_BY_ID = `
  query WorkOrder($id: ID!) {
    workOrder(id: $id) {
      ${WORK_ORDER_FIELDS}
    }
  }
`;

export const GET_WORKFLOW_CHAIN = `
  query WorkflowChain($idKoneksiData: ID!) {
    workflowChain(idKoneksiData: $idKoneksiData) {
      jenisPekerjaan
      workOrder {
        id
        status
        statusRespon
        teknisiPenanggungJawab {
          namaLengkap
        }
        createdAt
        updatedAt
      }
      chainStatus
      urutan
      bisaDibuat
    }
  }
`;

export const GET_WORK_ORDERS_BY_KONEKSI_DATA = `
  query WorkOrdersByKoneksiData($idKoneksiData: ID!) {
    workOrdersByKoneksiData(idKoneksiData: $idKoneksiData) {
      ${WORK_ORDER_FIELDS}
    }
  }
`;

export const GET_PROGRES_WORK_ORDER = `
  query ProgresWorkOrder($workOrderId: ID!) {
    progresWorkOrder(workOrderId: $workOrderId) {
      jenisPekerjaan
      koordinat { longitude latitude }
      urlJaringan
      diameterPipa
      urlPosisiBak
      posisiMeteran
      jumlahPenghuni
      standar
      totalBiaya
      urlRab
      seriMeteran
      fotoRumah
      fotoMeteran
      fotoMeteranDanRumah
      urlGambar
      catatan
    }
  }
`;
