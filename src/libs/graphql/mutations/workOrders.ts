// ─── Work Order Mutations ─────────────────────────────────────────────────────

const MUTATION_RESPONSE_FIELDS = `
  success
  message
  workOrder {
    id
    idKoneksiData
    jenisPekerjaan
    teknisiPenanggungJawab {
      id
      namaLengkap
      nip
      divisi
    }
    tim {
      id
      namaLengkap
      nip
      divisi
    }
    statusTim
    catatanTim
    status
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
  }
`;

// ─── Respon Awal ──────────────────────────────────────────────────────────────

export const TERIMA_PEKERJAAN = `
  mutation TerimaPekerjaan($input: TerimaPekerjaanInput!) {
    terimaPekerjaan(input: $input) {
      ${MUTATION_RESPONSE_FIELDS}
    }
  }
`;

export const AJUKAN_PENOLAKAN = `
  mutation AjukanPenolakan($input: AjukanPenolakanInput!) {
    ajukanPenolakan(input: $input) {
      ${MUTATION_RESPONSE_FIELDS}
    }
  }
`;

// ─── Tim ──────────────────────────────────────────────────────────────────────

export const AJUKAN_TIM = `
  mutation AjukanTim($input: AjukanTimInput!) {
    ajukanTim(input: $input) {
      ${MUTATION_RESPONSE_FIELDS}
    }
  }
`;

export const KERJA_SENDIRI = `
  mutation KerjaSendiri($input: KerjaSendiriInput!) {
    kerjaSendiri(input: $input) {
      ${MUTATION_RESPONSE_FIELDS}
    }
  }
`;

// ─── Pengerjaan ───────────────────────────────────────────────────────────────

export const SIMPAN_PROGRES = `
  mutation SimpanProgres($input: SimpanProgresInput!) {
    simpanProgres(input: $input) {
      ${MUTATION_RESPONSE_FIELDS}
    }
  }
`;

export const KIRIM_HASIL = `
  mutation KirimHasil($input: KirimHasilInput!) {
    kirimHasil(input: $input) {
      ${MUTATION_RESPONSE_FIELDS}
    }
  }
`;
