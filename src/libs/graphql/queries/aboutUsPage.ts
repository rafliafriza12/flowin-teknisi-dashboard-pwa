export const GET_ABOUT_US_PAGE_DATA = `
    query AboutUsPage {
        aboutUsPage {
            hero {
                headline { en id }
            }
            visionMission {
                headline { en id }
                description { en id }
                vision { en id }
                mission {
                    headline { en id }
                    list { en id }
                }
            }
            corporatePhilosophy {
                headline { en id }
                mainContent { en id }
                list { en id }
            }
            ownership {
                headline { en id }
            }
            shareholderStructure {
                headline { en id }
            }
        }
    }
    
`;
