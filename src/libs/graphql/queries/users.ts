// User Queries
export const GET_USERS = `
  query Users {
    users {
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

export const GET_USER_BY_ID = `
  query GetUserById($id: ID!) {
    user(id: $id) {
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
