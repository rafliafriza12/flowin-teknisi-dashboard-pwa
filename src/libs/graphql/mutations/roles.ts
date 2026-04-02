// Create a new role
export const CREATE_ROLE = `
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
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

// Update an existing role
export const UPDATE_ROLE = `
  mutation UpdateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      role {
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
      affectedUsersCount
    }
  }
`;

// Delete a role
export const DELETE_ROLE = `
  mutation DeleteRole($id: ID!, $fallbackRoleName: String) {
    deleteRole(id: $id, fallbackRoleName: $fallbackRoleName) {
      success
      affectedUsersCount
    }
  }
`;

// Initialize default roles
export const INITIALIZE_DEFAULT_ROLES = `
  mutation InitializeDefaultRoles {
    initializeDefaultRoles
  }
`;
