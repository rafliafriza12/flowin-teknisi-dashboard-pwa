export const UPDATE_MEDIA_PAGE_DATA = `
    mutation UpdateMediaPage($input: UpdateMediaPageInput!) {
        updateMediaPage(input: $input) {
            hero {
                headline { en id }
            }
            mediaKit {
                headline { en id }
                contentList {
                    whoWeAre { en id }
                    ourLeadership { en id }
                    boilerplate { en id }
                    assets {
                        name { en id }
                        fileUrl
                    }
                }
            }
        }
    }

`;
