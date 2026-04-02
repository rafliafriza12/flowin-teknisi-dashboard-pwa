export const UPDATE_HOME_PAGE_DATA = `
    mutation UpdateHomePage($input: UpdateHomePageInput!){
        updateHomePage(input: $input){
            hero {
                headline { en id }
                subHeadline1 {
                    title { en id }
                    description { en id }
                }
                subHeadline2 {
                    title { en id }
                    description { en id }
                }
                subHeadline3 {
                    title { en id }
                    description { en id }
                }
                subHeadline4 {
                    title { en id }
                    description { en id }
                }
            }
            stats {
                stat1 {
                    value
                    description { en id }
                    unit { en id }
                }
                stat2 {
                    value
                    description { en id }
                    unit { en id }
                }
                stat3 {
                    value
                    description { en id }
                    unit { en id }
                }
                stat4 {
                    value
                    description { en id }
                    unit { en id }
                }
                stat5 {
                    value
                    description { en id }
                    unit { en id }
                }
            }
            journey {
                headline { en id }
                journeys {
                    title { en id }
                    description { en id }
                    link
                    buttonLabel { en id }
                }
            }
            aboutUs {
                title { en id }
                headline { en id }
                subheadline { en id }
                description { en id }
                backgroundImageUrl
            }
            whatWeDo {
                headline { en id }
                subheadline { en id }
                business {
                    title { en id }
                    description { en id }
                    imageUrl
                    buttonLink
                    buttonLabel { en id }
                }
            }
            esg {
                headline { en id }
                subHeadline { en id }
                items {
                    title { en id }
                    description { en id }
                    imageUrl
                    buttonLink
                    buttonLabel { en id }
                }
            }
            media {
                headline { en id }
                subHeadline { en id }
            }
            contact {
                headline { en id }
                subHeadline { en id }
            }
            contactList {
                name { en id }
                detail { en id }
                link
            }
        }
    }
`;
