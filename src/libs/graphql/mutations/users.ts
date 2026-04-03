// User Mutations

export const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
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
