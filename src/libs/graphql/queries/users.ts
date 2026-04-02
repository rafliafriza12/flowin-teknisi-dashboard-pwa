// User Queries
export const GET_USERS = `
  query Users {
    users {
        id
        profilePictureUrl
        fullname
        username
        email
        role
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
        role
        isActive
        lastOnline
        createdAt
        updatedAt
    }
  }
`;

export const GET_USERS_BY_ROLE = `
  query GetUsersByRole($role: String!) {
      usersByRole(role: $role){
        id
        profilePictureUrl
        fullname
        username
        email
        role
        isActive
        lastOnline
        createdAt
        updatedAt}
  }
`;

export const USER_SETTINGS = `
  query UserSettings {
    userSettings {
      id
      roles
    }
  }
`;
