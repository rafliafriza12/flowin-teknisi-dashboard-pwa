export const CREATE_CORPORATE_ACTION = `
  mutation CreateCorporateAction($input: CreateCorporateAction!) {
      createCorporateAction(input: $input) {
        id
        documentName { en id }
        documentFileUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const UPDATE_CORPORATE_ACTION = `
  mutation UpdateCorporateAction($updateCorporateActionId: ID!, $input: UpdateCorporateAction!) {
    updateCorporateAction(id: $updateCorporateActionId, input: $input) {
      id
      documentName { en id }
      documentFileUrl
      publish
      createdAt
      updatedAt
    }
  } 
`;

export const DELETE_CORPORATE_ACTION = `
  mutation DeleteCorporateAction($deleteCorporateActionId: ID!) {
    deleteCorporateAction(id: $deleteCorporateActionId)
  }
`;
