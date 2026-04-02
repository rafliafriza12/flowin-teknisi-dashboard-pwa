export const FINANCIAL_STATEMENTS = `
    query FinancialStatements {
      financialStatements {
        id
        reportName { en id }
        financialCategory
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const FINANCIAL_STATEMENT = `
    query FinancialStatement($financialStatementId: ID!) {
      financialStatement(id: $financialStatementId) {
        id
        reportName { en id }
        financialCategory
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const PUBLISHED_FINANCIAL_STATEMENTS = `
    query PublishedFinancialStatements {
      publishedFinancialStatements {
        id
        reportName { en id }
        financialCategory
        reportDocumentUrl
        publish
        createdAt
        updatedAt
      }
    }
`;

export const FINANCIAL_STATEMENT_SETTINGS = `
    query FinancialStatementSettings {
      financialStatementSettings {
        id
        categories
      }
    }
`;
