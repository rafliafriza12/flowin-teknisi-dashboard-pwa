export const CREATE_GMS_AND_EVENT = `
  mutation CreateGmsAndEvent($input: CreateGMSAndEvent!) {
    createGMSAndEvent(input: $input) {
      id
      documentName { en id }
      documentUrl
      schedule
      category
      publish
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_GMS_AND_EVENT = `
  mutation UpdateGmsAndEvent($updateGmsAndEventId: ID!, $input: UpdateGMSAndEvent!) {
    updateGMSAndEvent(id: $updateGmsAndEventId, input: $input) {
      id
      documentName { en id }
      documentUrl
      schedule
      category
      publish
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_GMS_AND_EVENT = `
  mutation DeleteGmsAndEvent($deleteGmsAndEventId: ID!) {
    deleteGMSAndEvent(id: $deleteGmsAndEventId)
  }
`;

export const ADD_GMS_CATEGORY = `
  mutation AddGMSCategory($category: String!) {
    addGMSCategory(category: $category) {
      id
      categories
    }
  }
`;

export const REMOVE_GMS_CATEGORY = `
  mutation RemoveGMSCategory($category: String!) {
    removeGMSCategory(category: $category) {
      id
      categories
    }
  }
`;

export const UPDATE_GMS_CATEGORY = `
  mutation UpdateGMSCategory($oldCategory: String!, $newCategory: String!) {
    updateGMSCategory(oldCategory: $oldCategory, newCategory: $newCategory) {
      settings {
        id
        categories
      }
      affectedCount
    }
  }
`;

export const DELETE_GMS_CATEGORY_WITH_CASCADE = `
  mutation DeleteGMSCategoryWithCascade($category: String!) {
    deleteGMSCategoryWithCascade(category: $category) {
      settings {
        id
        categories
      }
      affectedCount
    }
  }
`;
