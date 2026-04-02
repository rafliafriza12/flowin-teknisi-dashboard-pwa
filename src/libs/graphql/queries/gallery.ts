export const GALLERIES = `
  query Galleries {
    galleries {
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

export const PUBLISHED_GALLERIES = `
  query PublishedGalleries {
    publishedGalleries {
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

export const GALLERY = `
  query Gallery($galleryId: ID!) {
    gallery(id: $galleryId) {
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
