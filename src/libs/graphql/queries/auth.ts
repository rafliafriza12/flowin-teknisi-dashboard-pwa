// Auth Queries
export const GET_ME = `
  query Me {
    me {
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
