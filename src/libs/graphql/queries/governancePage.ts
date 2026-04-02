export const GET_GOVERNANCE_PAGE_DATA = `
    query GovernancePage {
        governancePage {
          hero {
            headline { en id }
          }
          ourTeam {
            boardOfCommissioner {
              imageUrl
              name
              position { en id }
            }
            boardOfDirectors {
              imageUrl
              name
              position { en id }
            }
          }
          committees {
            headline { en id }
            bocCommittees {
              divisionName
              description { en id }
              staffList {
                imageUrl
                name
                position { en id }
              }
            }
            bodCommittees {
              divisionName
              description { en id }
              staffList {
                imageUrl
                name
                position { en id }
              }
            }
          }
          corporateSecretary {
            description { en id }
            imageUrl
            name
            experienceList {
              experience1 {
                position { en id }
                year
              }
              experience2 {
                position { en id }
                year
              }
              experience3 {
                position { en id }
                year
              }
            }
          }
          policyAndSupportingDocument {
            headline { en id }
            description { en id }
          }
          whistleBlowing {
            headline { en id }
          }
          faq {
            headline { en id }
            description { en id }
            questionAndAnswerList {
              answer { en id }
              question { en id }
            }
          }
          supportingProfession {
            headline { en id }
            professionalServiceList {
              address1 {
                address { en id }
                ext
                fax
                name { en id }
                phone
              }
              address2 {
                address { en id }
                ext
                fax
                name { en id }
                phone
              }
              address3 {
                address { en id }
                ext
                fax
                name { en id }
                phone
              }
            }
          }
        }
    }
`;
