export const UPDATE_INVESTOR_RELATION_PAGE_DATA = `
    mutation UpdateInvestorRelationPage($input: UpdateInvestorRelationPageInput!) {
        updateInvestorRelationPage(input: $input) {
            hero {
                headline { en id }
            }
            report {
                financialStatement {
                    headline { en id }
                    description { en id }
                }
                annualAndSustainabilityReport {
                    headline { en id }
                    description { en id }
                }
                creditAndAnalystReport {
                    headline { en id }
                    description { en id }
                }
            }
            corporateAction {
                headline { en id }
            }
            gmsAndEvent {
                headline { en id }
                description { en id }
            }
            disclosure {
                headline { en id }
                description { en id }
            }
            presentation {
                headline { en id }
            }
        }
    }
`;
