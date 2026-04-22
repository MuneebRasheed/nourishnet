import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import LocationPin from '../assets/svgs/LocationPin';
import {
  fetchPlacePredictions,
  fetchPlaceDetails,
  isGoogleMapsConfigured,
  reverseGeocode,
  type PlacePrediction,
} from '../lib/googleMaps';

export type RecipientLocationFieldProps = {
  address: string;
  onAddressChange: (value: string) => void;
  /** Call when user edits text so parent can clear stale coordinates. */
  onCoordinatesCleared: () => void;
  /** Called when a place is chosen from suggestions or from GPS. */
  onLocationResolved: (payload: { address: string; lat: number; lng: number }) => void;
  hasResolvedCoordinates: boolean;
  /** Default: "Address*" */
  fieldLabel?: string;
  /** Placeholder when Google Maps is configured. */
  placeholderWhenMaps?: string;
  /** Placeholder when maps key is not set. */
  placeholderFallback?: string;
  hintResolved?: string;
  hintPickSuggestion?: string;
};

export function RecipientLocationField({
  address,
  onAddressChange,
  onCoordinatesCleared,
  onLocationResolved,
  hasResolvedCoordinates,
  fieldLabel = 'Address*',
  placeholderWhenMaps = 'Search for your address',
  placeholderFallback = 'Enter your address',
  hintResolved = 'Location saved with map coordinates.',
  hintPickSuggestion = 'Pick a suggestion or use current location so we can save your area.',
}: RecipientLocationFieldProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const textColor = isDark ? palette.white : colors.text;
  const inputBg = isDark ? colors.requestBtnBg : colors.inputFieldBg;
  const placeholderColor = colors.textSecondary;

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetchRef = useRef(false);

  const runAutocomplete = useCallback(async (q: string) => {
    if (!isGoogleMapsConfigured() || q.trim().length < 2) {
      setPredictions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const list = await fetchPlacePredictions(q);
      setPredictions(list.slice(0, 6));
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (hasResolvedCoordinates) {
      setPredictions([]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runAutocomplete(address);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address, hasResolvedCoordinates, runAutocomplete]);

  const selectPrediction = async (p: PlacePrediction) => {
    Keyboard.dismiss();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPredictions([]);
    const details = await fetchPlaceDetails(p.place_id);
    if (!details) return;
    skipNextFetchRef.current = true;
    onLocationResolved(details);
  };

  const useCurrentLocation = async () => {
    if (!isGoogleMapsConfigured()) return;
    setLoadingGps(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPredictions([]);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          'Location permission',
          'Allow location access to fill in your address from GPS.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const resolved = await reverseGeocode(latitude, longitude);
      if (!resolved) return;
      skipNextFetchRef.current = true;
      onLocationResolved(resolved);
    } finally {
      setLoadingGps(false);
    }
  };

  const mapsReady = isGoogleMapsConfigured();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            fontFamily: fontFamilies.interMedium,
            fontSize: fonts.subhead,
            color: textColor,
          },
        ]}
      >
        {fieldLabel}
      </Text>
      <View style={[styles.inputRow, { backgroundColor: inputBg }]}>
        <View style={styles.iconWrapLeft}>
          <LocationPin width={20} height={20} color={colors.textSecondary} />
        </View>
        <TextInput
          style={[
            styles.input,
            { fontSize: fonts.subhead, color: textColor },
          ]}
          placeholder={mapsReady ? placeholderWhenMaps : placeholderFallback}
          placeholderTextColor={placeholderColor}
          value={address}
          onChangeText={(t) => {
            onAddressChange(t);
            onCoordinatesCleared();
          }}
          autoCorrect={false}
        />
        {loadingSuggestions ? (
          <View style={styles.iconWrapRight}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      </View>

      {mapsReady ? (
        <Pressable
          onPress={useCurrentLocation}
          disabled={loadingGps}
          style={({ pressed }) => [
            styles.gpsRow,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          {loadingGps ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="navigate" size={18} color={colors.primary} />
          )}
          <Text
            style={[
              styles.gpsLabel,
              { color: colors.primary, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption },
            ]}
          >
            Use current location
          </Text>
        </Pressable>
      ) : null}

      {hasResolvedCoordinates ? (
        <Text
          style={[
            styles.hint,
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption - 1 },
          ]}
        >
          {hintResolved}
        </Text>
      ) : mapsReady ? (
        <Text
          style={[
            styles.hint,
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption - 1 },
          ]}
        >
          {hintPickSuggestion}
        </Text>
      ) : null}

      {predictions.length > 0 && !hasResolvedCoordinates ? (
        <View
          style={[
            styles.suggestions,
            {
              backgroundColor: inputBg,
              borderColor: isDark ? colors.borderColor : palette.roleCardbg,
            },
          ]}
        >
          {predictions.map((p) => (
            <Pressable
              key={p.place_id}
              onPress={() => selectPrediction(p)}
              style={({ pressed }) => [
                styles.suggestionRow,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <Text
                style={[
                  styles.suggestionText,
                  { color: textColor, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
                ]}
                numberOfLines={2}
              >
                {p.description}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconWrapLeft: {
    paddingLeft: 16,
    justifyContent: 'center',
  },
  iconWrapRight: {
    paddingRight: 16,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.inter,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  gpsLabel: {},
  hint: {
    marginTop: 8,
    lineHeight: 18,
  },
  suggestions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionText: {
    flex: 1,
  },
});
