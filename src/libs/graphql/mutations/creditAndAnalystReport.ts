export const CREATE_CREDIT_AND_ANALYST_REPORT = `
    mutation CreateCreditAndAnalystReport($input: CreateCreditAndAnalystReport!) {
      createCreditAndAnalystReport(input: $input) {
        id
        reportName { en id }
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const UPDATE_CREDIT_AND_ANALYST_REPORT = `
    mutation UpdateCreditAndAnalystReport($updateCreditAndAnalystReportId: ID!, $input: UpdateCreditAndAnalystReport!) {
      updateCreditAndAnalystReport(id: $updateCreditAndAnalystReportId, input: $input) {
        id
        reportName { en id }
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const DELETE_CREDIT_AND_ANALYST_REPORT = `
    mutation DeleteCreditAndAnalystReport($deleteCreditAndAnalystReportId: ID!) {
      deleteCreditAndAnalystReport(id: $deleteCreditAndAnalystReportId)
    }
`;
