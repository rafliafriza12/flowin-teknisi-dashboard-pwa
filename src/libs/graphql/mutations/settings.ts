export const UPDATE_SETTINGS = `
  mutation UpdateSettings($input: UpdateSettingsInput!) {
    updateSettings(input: $input) {
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

export const UPDATE_GENERAL_SETTINGS = `
  mutation UpdateGeneralSettings($input: GeneralSettingsInput!) {
    updateGeneralSettings(input: $input) {
      id
      general {
        defaultLanguage
        timezone
        dateFormat
        timeFormat
      }
    }
  }
`;

export const UPDATE_NOTIFICATION_SETTINGS = `
  mutation UpdateNotificationSettings($input: NotificationSettingsInput!) {
    updateNotificationSettings(input: $input) {
      id
      notifications {
        systemNotification
        reviewNotification
        emailAlerts
        digestFrequency
      }
    }
  }
`;

export const UPDATE_INTEGRATION_SETTINGS = `
  mutation UpdateIntegrationSettings($input: IntegrationSettingsInput!) {
    updateIntegrationSettings(input: $input) {
      id
      integrations {
        analystics
        crm
      }
    }
  }
`;
