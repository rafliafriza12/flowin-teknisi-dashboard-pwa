export const PRESENTATION_AND_INSIGHTS = `
  query PresentationAndInsights {
    presentationAndInsights {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const PRESENTATION_AND_INSIGHT = `
  query PresentationAndInsight($presentationAndInsightId: ID!) {
    presentationAndInsight(id: $presentationAndInsightId) {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const PUBLISHED_PRESENTATION_AND_INSIGHTS = `
  query PublishedPresentationAndInsights {
    publishedPresentationAndInsights {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;
