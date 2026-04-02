export const CORPORATE_ACTIONS = `
    query CorporateActions {
      corporateActions {
        id
        documentName { en id }
        documentFileUrl
        publish
        createdAt
        updatedAt
      }
    }
`;


export const CORPORATE_ACTION = `
    query CorporateAction($corporateActionId: ID!) {
      corporateAction(id: $corporateActionId) {
        id
        documentName { en id }
        documentFileUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const PUBLISHED_CORPORATE_ACTIONS = `
    query PublishedCorporateActions {
      publishedCorporateActions {
        id
        documentName { en id }
        documentFileUrl
        publish
        createdAt
        updatedAt
      }
    }
`;
