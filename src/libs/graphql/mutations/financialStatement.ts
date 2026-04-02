export const CREATE_FINANCIAL_STATEMENT = `
    mutation CreateFinancialStatement($input: CreateFinancialStatement!) {
      createFinancialStatement(input: $input) {
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

export const UPDATE_FINANCIAL_STATEMENT = `
    mutation UpdateFinancialStatement($updateFinancialStatementId: ID!, $input: UpdateFinancialStatement!) {
      updateFinancialStatement(id: $updateFinancialStatementId, input: $input) {
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

export const DELETE_FINANCIAL_STATEMENT = `
    mutation DeleteFinancialStatement($deleteFinancialStatementId: ID!) {
      deleteFinancialStatement(id: $deleteFinancialStatementId)
    }
`;

export const ADD_FINANCIAL_CATEGORY = `
    mutation AddFinancialCategory($category: String!) {
      addFinancialCategory(category: $category) {
        id
        categories
      }
    }
`;

export const REMOVE_FINANCIAL_CATEGORY = `
    mutation RemoveFinancialCategory($category: String!) {
      removeFinancialCategory(category: $category) {
        id
        categories
      }
    }
`;

export const UPDATE_FINANCIAL_CATEGORY = `
    mutation UpdateFinancialCategory($oldCategory: String!, $newCategory: String!) {
      updateFinancialCategory(oldCategory: $oldCategory, newCategory: $newCategory) {
        settings {
          id
          categories
        }
        affectedCount
      }
    }
`;

export const DELETE_FINANCIAL_CATEGORY_WITH_CASCADE = `
    mutation DeleteFinancialCategoryWithCascade($category: String!) {
      deleteFinancialCategoryWithCascade(category: $category) {
        settings {
          id
          categories
        }
        affectedCount
      }
    }
`;
