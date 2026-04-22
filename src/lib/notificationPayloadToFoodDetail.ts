import type { ImageSourcePropType } from 'react-native';
import type { FoodDetailItem } from '../screens/FoodDetailScreen';
import { haversineMeters } from './geoFeed';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function shortLocation(address: string, maxChars = 18): string {
  const trimmed = address.trim();
  if (!trimmed) return 'Unknown location';
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trimEnd()}...`;
}

function formatPostedAgo(createdAt: string): string {
  if (!createdAt) return '';
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Builds `FoodDetailScreen` params from persisted `new_food_available` notification `data` JSON.
 */
export function newFoodNotificationDataToFoodDetailItem(
  data: Record<string, unknown>,
  recipientLat: number | null,
  recipientLng: number | null,
  defaultImage: ImageSourcePropType
): FoodDetailItem | null {
  const id = str(data.listingId);
  if (!id) return null;

  const title = str(data.title) || 'Listing';
  const imageUrl = str(data.imageUrl);
  const pickupAddress = str(data.pickupAddress);
  const startTime = str(data.startTime);
  const endTime = str(data.endTime);
  const quantity = str(data.quantity);
  const quantityUnit = str(data.quantityUnit) || 'Portions';
  const createdAt = str(data.createdAt);

  const plat = data.pickupLatitude != null ? Number(data.pickupLatitude) : null;
  const plng = data.pickupLongitude != null ? Number(data.pickupLongitude) : null;

  let distanceText = shortLocation(pickupAddress);
  if (
    recipientLat != null &&
    recipientLng != null &&
    plat != null &&
    plng != null &&
    Number.isFinite(plat) &&
    Number.isFinite(plng)
  ) {
    const meters = haversineMeters(plat, plng, recipientLat, recipientLng);
    if (Number.isFinite(meters)) distanceText = `${(meters / 1000).toFixed(1)} km`;
  }

  const dietaryTags = Array.isArray(data.dietaryTags)
    ? (data.dietaryTags as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];
  const allergens = Array.isArray(data.allergens)
    ? (data.allergens as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  return {
    id,
    image: imageUrl ? { uri: imageUrl } : defaultImage,
    title,
    source: 'Provider',
    distance: distanceText,
    postedAgo: createdAt ? formatPostedAgo(createdAt) : '',
    portions: `${quantity} ${quantityUnit}`.trim(),
    timeSlot: `${startTime} - ${endTime}`.trim(),
    dietaryTags: dietaryTags.length ? dietaryTags : undefined,
    isLive: true,
    pickupAddress: pickupAddress || undefined,
    pickupTimeNote: '',
    pickupInstructions: str(data.note) || undefined,
    quantity: parseInt(quantity, 10) || 0,
    allergens: allergens.length ? allergens : undefined,
    foodType: str(data.foodType) || undefined,
  };
}
