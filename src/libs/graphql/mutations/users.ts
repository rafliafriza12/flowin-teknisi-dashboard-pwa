// User Mutations
export const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
        id
        profilePictureUrl
        fullname
        username
        email
        isActive
        lastOnline
        createdAt
        updatedAt
    }
  }
`;

export const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
        id
        profilePictureUrl
        fullname
        username
        email
        isActive
        lastOnline
        createdAt
        updatedAt
    }
  }
`;

export const DELETE_USER = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
        success
        message
    }
  }
`;

export const TOGGLE_USER_STATUS = `
  mutation ToggleUserStatus($id: ID!) {
    toggleUserStatus(id: $id) {
        success
        message
    }
}
`;
