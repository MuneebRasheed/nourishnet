import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

const DEFAULT_CATEGORIES = ['All', 'Prepared Meals', 'Baked Goods', 'Dairy' , 'Produce', 'Pantry', 'Other'];

interface CategoryChipsProps {
  categories?: string[];
  /** Single selection: pass a string. Multi-selection: pass string[] and set multiSelect */
  selected?: string | string[];
  onSelect?: (category: string) => void;
  /** When true, selected is string[] and multiple chips can be active */
  multiSelect?: boolean;
  /** When true, chips wrap to multiple rows with spacing (e.g. for "select all that apply" forms) */
  wrap?: boolean;
}

export default function CategoryChips({
  categories = DEFAULT_CATEGORIES,
  selected = 'All',
  onSelect,
  multiSelect = false,
  wrap = false,
}: CategoryChipsProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const isActive = (cat: string) =>
    multiSelect && Array.isArray(selected)
      ? selected.includes(cat)
      : selected === cat;

  const chipContent = categories.map((cat) => {
    const active = isActive(cat);
    return (
      <TouchableOpacity
        key={cat}
        onPress={() => onSelect?.(cat)}
        activeOpacity={0.8}
        style={[
          styles.chip,
          styles.chipPill,
          {
         
           
            backgroundColor: active ? colors.primary : (isDark ? colors.inputFieldBg : palette.white),
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            {
              color: active ? palette.white : colors.text,
              fontFamily: fontFamilies.interSemiBold,
              fontSize: fonts.subhead,
            },
          ]}
        >
          {cat}
        </Text>
      </TouchableOpacity>
    );
  });

  if (wrap) {
    return (
      <View style={styles.wrapContainer}>
        {chipContent}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {chipContent}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16
,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipPill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 100,
  },
  chipText: {},
});
