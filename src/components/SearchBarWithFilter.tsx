import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import SerachBulb from '../assets/svgs/SerachBulb';
import SearchTab from '../assets/svgs/SearchTab';
import SerachIcon from '../assets/svgs/SerachIcon';
interface SearchBarWithFilterProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFilterPress?: () => void;
  style?: ViewStyle;
}

export default function SearchBarWithFilter({
  placeholder = 'Enter here',
  value = '',
  onChangeText,
  onFilterPress,
  style,
}: SearchBarWithFilterProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.inputWrap, { backgroundColor: colors.inputFieldBg,  }]}>
        <SearchTab width={20} height={20} color={colors.text} />
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: fontFamilies.inter,
              fontSize: fonts.body,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
        />
      </View> 
     
      <TouchableOpacity
        onPress={onFilterPress}
        activeOpacity={0.8}
        style={[styles.filterBtn, { backgroundColor: colors.inputFieldBg,  }]}
      >
        <SerachBulb width={22} height={22} fill={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,

    gap: 10,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
   
    alignItems: 'center',
    justifyContent: 'center',
  },
});
