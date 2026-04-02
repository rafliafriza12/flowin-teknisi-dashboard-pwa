export const CREATE_PRESENTATION_AND_INSIGHT = `
  mutation CreatePresentationAndInsight($input: CreatePresentationAndInsight!) {
    createPresentationAndInsight(input: $input) {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PRESENTATION_AND_INSIGHT = `
  mutation UpdatePresentationAndInsight($updatePresentationAndInsightId: ID!, $input: UpdatePresentationAndInsight!) {
    updatePresentationAndInsight(id: $updatePresentationAndInsightId, input: $input) {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_PRESENTATION_AND_INSIGHT = `
  mutation DeletePresentationAndInsight($deletePresentationAndInsightId: ID!) {
    deletePresentationAndInsight(id: $deletePresentationAndInsightId)
  }
`;
