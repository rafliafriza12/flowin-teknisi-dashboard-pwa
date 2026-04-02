export const CREATE_DISCLOSURE = `
  mutation CreateDisclosure($input: CreateDisclosure!) {
    createDisclosure(input: $input) {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_DISCLOSURE = `
  mutation UpdateDisclosure($updateDisclosureId: ID!, $input: UpdateDisclosure!) {
    updateDisclosure(id: $updateDisclosureId, input: $input) {
      id
      documentName { en id }
      documentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_DISCLOSURE = `
  mutation DeleteDisclosure($deleteDisclosureId: ID!) {
    deleteDisclosure(id: $deleteDisclosureId)
  }
`;
