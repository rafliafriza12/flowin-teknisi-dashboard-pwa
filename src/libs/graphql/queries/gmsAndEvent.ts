export const GMS_AND_EVENTS = `
  query GmsAndEvents {
    gmsAndEvents {
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

export const GMS_AND_EVENT = `
  query GmsAndEvent($gmsAndEventId: ID!) {
    gmsAndEvent(id: $gmsAndEventId) {
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

export const PUBLISHED_GMS_AND_EVENTS = `
  query PublishedGmsAndEvents {
    publishedGMSAndEvents {
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

export const GMS_AND_EVENT_SETTINGS = `
  query GmsAndEventSettings {
    gmsAndEventSettings {
      id
      categories
    }
  }
`;
