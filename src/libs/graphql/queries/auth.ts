// Auth Queries
export const GET_ME = `
  query Me {
    me {
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
