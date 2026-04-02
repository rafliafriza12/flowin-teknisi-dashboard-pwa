export const CREATE_GALLERY = `
  mutation CreateGallery($input: CreateGallery!) {
    createGallery(input: $input) {
      id
      galleryName { en id }
      descriptions { en id }
      fileType
      fileDocumentUrl
      fileUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_GALLERY = `
  mutation UpdateGallery($updateGalleryId: ID!, $input: UpdateGallery!) {
    updateGallery(id: $updateGalleryId, input: $input) {
      id
      galleryName { en id }
      descriptions { en id }
      fileType
      fileDocumentUrl
      fileUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_GALLERY = `
  mutation DeleteGallery($deleteGalleryId: ID!) {
    deleteGallery(id: $deleteGalleryId)
  }
`;
