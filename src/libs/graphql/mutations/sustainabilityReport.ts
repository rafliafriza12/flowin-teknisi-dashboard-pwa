export const CREATE_SUSTAINABILITY_REPORT = `
    mutation CreateSustainabilityReport($input: CreateSustainabilityReport!) {
      createSustainabilityReport(input: $input) {
        id
        reportName { en id }
        year
        reportType
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const UPDATE_SUSTAINABILITY_REPORT = `
    mutation UpdateSustainabilityReport($updateSustainabilityReportId: ID!, $input: UpdateSustainabilityReport!) {
      updateSustainabilityReport(id: $updateSustainabilityReportId, input: $input) {
        id
        reportName { en id }
        year
        reportType
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const DELETE_SUSTAINABILITY_REPORT = `
    mutation DeleteSustainabilityReport($deleteSustainabilityReportId: ID!) {
      deleteSustainabilityReport(id: $deleteSustainabilityReportId)
    }
`;

export const ADD_REPORT_TYPE = `
    mutation AddReportType($reportType: String!) {
      addReportType(reportType: $reportType) {
        id
        reportTypes
      }
    }
`;

export const REMOVE_REPORT_TYPE = `
    mutation RemoveReportType($reportType: String!) {
      removeReportType(reportType: $reportType) {
        id
        reportTypes
      }
    }
`;

export const UPDATE_REPORT_TYPE = `
    mutation UpdateReportType($oldReportType: String!, $newReportType: String!) {
      updateReportType(oldReportType: $oldReportType, newReportType: $newReportType) {
        settings {
          id
          reportTypes
        }
        affectedCount
      }
    }
`;

export const DELETE_REPORT_TYPE_WITH_CASCADE = `
    mutation DeleteReportTypeWithCascade($reportType: String!) {
      deleteReportTypeWithCascade(reportType: $reportType) {
        settings {
          id
          reportTypes
        }
        affectedCount
      }
    }
`;
