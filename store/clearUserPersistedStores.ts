import { useAuthStore } from './authStore';
import { useProviderListingsStore } from './providerListingsStore';
import { useRequestedListingsStore } from './requestedListingsStore';
import { useNotificationInboxStore } from './notificationInboxStore';
import { useRecipientFeedStore } from './recipientFeedStore';
import { useProviderImpactStore } from './providerImpactStore';
import { useListingRequestsCacheStore } from './listingRequestsCacheStore';
import { useAnalyticsSummaryStore } from './analyticsSummaryStore';

/**
 * Clears user-scoped local cache so a new login starts fresh.
 * Keeps app-level preferences (theme/settings) intact.
 */
export async function clearUserPersistedStores(): Promise<void> {
  useAuthStore.getState().clearAuth();
  useProviderListingsStore.getState().clearAll();
  useRequestedListingsStore.getState().setRequestedIds([]);
  useNotificationInboxStore.getState().reset();
  useRecipientFeedStore.getState().clearAll();
  useProviderImpactStore.getState().clearAll();
  useListingRequestsCacheStore.getState().clearAll();
  useAnalyticsSummaryStore.getState().clearAll();

  await Promise.allSettled([
    useAuthStore.persist.clearStorage(),
    useProviderListingsStore.persist.clearStorage(),
    useRequestedListingsStore.persist.clearStorage(),
    useNotificationInboxStore.persist.clearStorage(),
    useRecipientFeedStore.persist.clearStorage(),
    useProviderImpactStore.persist.clearStorage(),
    useListingRequestsCacheStore.persist.clearStorage(),
    useAnalyticsSummaryStore.persist.clearStorage(),
  ]);
}
