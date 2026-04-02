export const SUSTAINABILITY_REPORTS = `
    query SustainabilityReports {
      sustainabilityReports {
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

export const SUSTAINABILITY_REPORT = `
    query SustainabilityReport($sustainabilityReportId: ID!) {
      sustainabilityReport(id: $sustainabilityReportId) {
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

export const PUBLISHED_SUSTAINABILITY_REPORTS = `
    query PublishedSustainabilityReports {
      publishedSustainabilityReports {
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

export const SUSTAINABILITY_REPORT_SETTINGS = `
    query SustainabilityReportSettings {
      sustainabilityReportSettings {
        id
        reportTypes
      }
    }
`;
