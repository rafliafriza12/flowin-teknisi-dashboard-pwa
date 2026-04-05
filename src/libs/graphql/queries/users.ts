// User Queries
export const GET_USERS = `
  query Users {
    users {
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

export const GET_USERS_SEARCH = `
  query UsersSearch($search: String) {
    users(search: $search) {
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

export const GET_USER_BY_ID = `
  query GetUserById($id: ID!) {
    user(id: $id) {
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
