export const UPDATE_ABOUT_US_PAGE_DATA = `
    mutation UpdateAboutUsPage($input: UpdateAboutUsPageInput!) {
    updateAboutUsPage(input: $input) {
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
