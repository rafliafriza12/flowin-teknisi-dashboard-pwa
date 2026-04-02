export const CREATE_SUPPORTING_DOCUMENT = `
  mutation CreateSupportingDocument($input: CreateSupportingDocument!) {
    createSupportingDocument(input: $input) {
      id
      documentName { en id }
      description { en id }
      documentUrl
      documentCategory
      publish
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SUPPORTING_DOCUMENT = `
  mutation UpdateSupportingDocument($updateSupportingDocumentId: ID!, $input: UpdateSupportingDocument!) {
    updateSupportingDocument(id: $updateSupportingDocumentId, input: $input) {
      id
      documentName { en id }
      description { en id }
      documentUrl
      documentCategory
      publish
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_SUPPORTING_DOCUMENT = `
  mutation DeleteSupportingDocument($deleteSupportingDocumentId: ID!) {
    deleteSupportingDocument(id: $deleteSupportingDocumentId)
  }
`;

export const ADD_DOCUMENT_CATEGORY = `
  mutation AddDocumentCategory($category: String!) {
    addDocumentCategory(category: $category) {
      id
      categories
    }
  }
`;

export const REMOVE_DOCUMENT_CATEGORY = `
  mutation RemoveDocumentCategory($category: String!) {
    removeDocumentCategory(category: $category) {
      id
      categories
    }
  }
`;

export const UPDATE_DOCUMENT_CATEGORY = `
  mutation UpdateDocumentCategory($oldCategory: String!, $newCategory: String!) {
    updateDocumentCategory(oldCategory: $oldCategory, newCategory: $newCategory) {
      settings {
        id
        categories
      }
      affectedCount
    }
  }
`;

export const DELETE_DOCUMENT_CATEGORY_WITH_CASCADE = `
  mutation DeleteDocumentCategoryWithCascade($category: String!) {
    deleteDocumentCategoryWithCascade(category: $category) {
      settings {
        id
        categories
      }
      affectedCount
    }
  }
`;
