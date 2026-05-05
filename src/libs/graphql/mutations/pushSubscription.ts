/**
 * Push Subscription GraphQL Mutations
 *
 * Mutations for registering and unregistering push notification subscriptions.
 *
 * **Validates: Requirements 4.3, 4.7**
 */

// Register Push Subscription - Protected (requires token)
export const REGISTER_PUSH_SUBSCRIPTION = `
  mutation RegisterPushSubscription($input: PushSubscriptionInput!) {
    registerPushSubscription(input: $input) {
      success
      message
    }
  }
`;

// Unregister Push Subscription - Protected (requires token)
export const UNREGISTER_PUSH_SUBSCRIPTION = `
  mutation UnregisterPushSubscription($endpoint: String!) {
    unregisterPushSubscription(endpoint: $endpoint) {
      success
      message
    }
  }
`;
