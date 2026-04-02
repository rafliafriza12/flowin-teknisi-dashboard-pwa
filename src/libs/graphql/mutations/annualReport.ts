export const CREATE_ANNUAL_REPORT = `
  mutation CreateAnnualReport($input: CreateAnnualReport!) {
    createAnnualReport(input: $input) {
      id
      reportName { en id }
      year
      reportDocumentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ANNUAL_REPORT = `
  mutation UpdateAnnualReport($updateAnnualReportId: ID!, $input: UpdateAnnualReport!) {
    updateAnnualReport(id: $updateAnnualReportId, input: $input) {
      id
      reportName { en id }
      year
      reportDocumentUrl
      publish
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ANNUAL_REPORT = `
  mutation DeleteAnnualReport($deleteAnnualReportId: ID!) {
    deleteAnnualReport(id: $deleteAnnualReportId)
  }
`;
