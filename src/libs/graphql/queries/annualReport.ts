export const ANNUAL_REPORTS = `
    query AnnualReports {
      annualReports {
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


export const ANNUAL_REPORT = `
    query AnnualReport($annualReportId: ID!) {
      annualReport(id: $annualReportId) {
        id
        coverImageUrl
        reportName { en id }
        year
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;
