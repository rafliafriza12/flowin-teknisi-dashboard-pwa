export const GET_SUSTAINABILITY_PAGE_DATA = `
    query SustainabilityPage {
        sustainabilityPage {
            hero {
                headline { en id }
            }
            policy {
                headline { en id }
                description { en id }
                documentList {
                    name { en id }
                    fileUrl
                }
            }
            strategy {
                headline { en id }
                quote { en id }
                description { en id }
                bumiCsrFlagship {
                    quote { en id }
                    description { en id }
                }
            }
            awareness {
                headline { en id }
                awarenessList {
                    description { en id }
                }
            }
            esgAndHumanRightsReport {
                headline { en id }
                description { en id }
            }
            environmentPreservation {
                headline { en id }
                description { en id }
                imageUrl
            }
        }
    }
`;
