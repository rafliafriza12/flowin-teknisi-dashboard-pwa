// Get all roles
export const GET_ROLES = `
  query GetRoles {
    roles {
      id
      name
      displayName
      description
      permissions {
        readAllContent
        writeAllContent
        deleteAllContent
        categoryManagement
        roleManagement
        userManagement
        generalSettings
        notificationSettings
        integrationSettings
      }
      isSystem
      userCount
      createdAt
      updatedAt
    }
  }
`;

// Get role by ID
export const GET_ROLE = `
  query GetRole($id: ID!) {
    role(id: $id) {
      id
      name
      displayName
      description
      permissions {
        readAllContent
        writeAllContent
        deleteAllContent
        categoryManagement
        roleManagement
        userManagement
        generalSettings
        notificationSettings
        integrationSettings
      }
      isSystem
      userCount
      createdAt
      updatedAt
    }
  }
`;

// Get role by name
export const GET_ROLE_BY_NAME = `
  query GetRoleByName($name: String!) {
    roleByName(name: $name) {
      id
      name
      displayName
      description
      permissions {
        readAllContent
        writeAllContent
        deleteAllContent
        categoryManagement
        roleManagement
        userManagement
        generalSettings
        notificationSettings
        integrationSettings
      }
      isSystem
      userCount
      createdAt
      updatedAt
    }
  }
`;
