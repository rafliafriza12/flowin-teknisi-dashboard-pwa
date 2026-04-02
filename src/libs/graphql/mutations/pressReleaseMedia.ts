export const CREATE_PRESS_RELEASE_MEDIA = `
  mutation CreatePressReleaseMedia($input: CreatePressReleaseMedia!) {
    createPressReleaseMedia(input: $input) {
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

export const UPDATE_PRESS_RELEASE_MEDIA = `
  mutation UpdatePressReleaseMedia($updatePressReleaseMediaId: ID!, $input: UpdatePressReleaseMedia!) {
    updatePressReleaseMedia(id: $updatePressReleaseMediaId, input: $input) {
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

export const DELETE_PRESS_RELEASE_MEDIA = `
  mutation DeletePressReleaseMedia($deletePressReleaseMediaId: ID!) {
    deletePressReleaseMedia(id: $deletePressReleaseMediaId)
  }
`;
