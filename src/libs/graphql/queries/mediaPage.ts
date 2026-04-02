export const GET_MEDIA_PAGE_DATA = `
    query MediaPage {
        mediaPage {
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
