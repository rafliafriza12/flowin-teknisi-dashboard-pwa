export const UPDATE_BUSINESS_OPERATION_PAGE_DATA = `
    mutation UpdateBusinessOperationPage($input: UpdateBusinessOperationPageInput!) {
        updateBusinessOperationPage(input: $input) {
            hero {
                headline { en id }
            }
            operationMap {
                headline { en id }
            }
            subsidiaries {
                headline { en id }
                description { en id }
                category {
                    coal {
                        name { en id }
                        imageUrl
                    }
                    nonCoal {
                        name { en id }
                        imageUrl
                    }
                }
            }
            ourCustomers {
                headline { en id }
            }
            coalQuality {
                headline { en id }
                description { en id }
            }
            reservesResources {
                headline { en id }
                description { en id }
                totalCoalReserves
                totalCoalResources
                resourcesAndReserves {
                    lastDataUpdate
                    data {
                        location { en id }
                        coalResources
                        coalReserves
                    }
                }
            }
        }
    }
`;
