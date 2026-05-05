/**
 * Analytics GraphQL Mutations
 *
 * Mutations for syncing notification analytics events to the server.
 *
 * **Validates: Requirements 14.4, 14.5**
 */

// Send batch of analytics events - Protected (requires token)
export const SEND_ANALYTICS_EVENTS = `
  mutation SendAnalyticsEvents($input: AnalyticsEventsInput!) {
    sendAnalyticsEvents(input: $input) {
      success
      message
      syncedCount
    }
  }
`;
