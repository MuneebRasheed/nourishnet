import type { ProviderListing } from '../../store/providerListingsStore';

/** Newest non-cancelled listing by `createdAt` (template for “repost from previous”). */
export function findMostRecentListingForRepost(listings: ProviderListing[]): ProviderListing | null {
  const usable = listings.filter((l) => l.status !== 'cancelled');
  if (usable.length === 0) return null;
  return usable.reduce((a, b) =>
    new Date(a.createdAt).getTime() >= new Date(b.createdAt).getTime() ? a : b
  );
}
