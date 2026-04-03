// Auth Queries
export const GET_ME = `
  query Me {
    me {
      id
        namaLengkap
        nip
        email
        noHp
        pekerjaanSekarang
        divisi
        isActive
    }
  }
`;
