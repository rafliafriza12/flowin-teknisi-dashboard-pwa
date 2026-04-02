export const UPDATE_CAREER_PAGE_DATA = `
    mutation UpdateCareerPage($input: UpdateCareerPageInput!) {
        updateCareerPage(input: $input) {
            hero {
                headline { en id }
            }
            whyJoinUs {
                headline { en id }
                description { en id }
                contentList {
                    headline { en id }
                    description { en id }
                    imageUrl
                }
            }
            hiring {
                headline { en id }
                description { en id }
            }
            ctaBanner {
                headline { en id }
                description { en id }
            }
        }
    }
`;
