export const GET_SETTINGS = `
  query GetSettings {
    settings {
      id
      general {
        defaultLanguage
        timezone
        dateFormat
        timeFormat
      }
      notifications {
        systemNotification
        reviewNotification
        emailAlerts
        digestFrequency
      }
      integrations {
        analystics
        crm
      }
    }
  }
`;
