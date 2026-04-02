export const CREDIT_AND_ANALYST_REPORTS = `
    query CreditAndAnalystReports {
      creditAndAnalystReports {
        id
        reportName { en id }
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const CREDIT_AND_ANALYST_REPORT = `
    query CreditAndAnalystReport($creditAndAnalystReportId: ID!) {
      creditAndAnalystReport(id: $creditAndAnalystReportId) {
        id
        reportName { en id }
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const PUBLISHED_CREDIT_AND_ANALYST_REPORTS = `
    query PublishedCreditAndAnalystReports {
      publishedCreditAndAnalystReports {
        id
        reportName { en id }
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;
