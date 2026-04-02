export const PRESS_RELEASE_MEDIAS = `
  query PressReleaseMedias {
    pressReleaseMedias {
      id
      mediaName { en id }
      mediaDocumentUrl
      publicationYear
      publish
      createdAt
      updatedAt
    }
  }
`;

export const PUBLISHED_PRESS_RELEASE_MEDIAS = `
  query PublishedPressReleaseMedias {
    publishedPressReleaseMedias {
      id
      mediaName { en id }
      mediaDocumentUrl
      publicationYear
      publish
      createdAt
      updatedAt
    }
  }
`;

export const PRESS_RELEASE_MEDIA = `
  query PressReleaseMedia($pressReleaseMediaId: ID!) {
    pressReleaseMedia(id: $pressReleaseMediaId) {
      id
      mediaName { en id }
      mediaDocumentUrl
      publicationYear
      publish
      createdAt
      updatedAt
    }
  }
`;
