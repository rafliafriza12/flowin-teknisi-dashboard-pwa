export const SUPPORTING_DOCUMENTS = `
  query SupportingDocuments {
    supportingDocuments {
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

export const SUPPORTING_DOCUMENT = `
  query SupportingDocument($supportingDocumentId: ID!) {
    supportingDocument(id: $supportingDocumentId) {
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

export const PUBLISHED_SUPPORTING_DOCUMENTS = `
  query PublishedSupportingDocuments {
    publishedSupportingDocuments {
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

export const SUPPORTING_DOCUMENT_SETTINGS = `
  query SupportingDocumentSettings {
    supportingDocumentSettings {
      id
      categories
    }
  }
`;
