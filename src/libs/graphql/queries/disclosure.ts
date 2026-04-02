export const DISCLOSURES = `
  query Disclosures {
    disclosures {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const DISCLOSURE = `
  query Disclosure($disclosureId: ID!) {
    disclosure(id: $disclosureId) {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const PUBLISHED_DISCLOSURES = `
  query PublishedDisclosures {
    publishedDisclosures {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;
