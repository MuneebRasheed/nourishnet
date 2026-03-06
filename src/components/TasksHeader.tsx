import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type TasksHeaderProps = {
  title: string;
  isDark: boolean;
  paddingTop: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export function TasksHeader({
  title,
  isDark,
  paddingTop,
  showBackButton = true,
  onBackPress,
}: TasksHeaderProps) {
  const colors = getColors(isDark);
  const fontSizes = useAppFontSizes();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.wrapper, { paddingTop, backgroundColor: colors.background,  borderBottomColor: colors.borderColor, }]}>
      <View style={styles.row}>
        {showBackButton ? (
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: fontSizes.title,
              fontFamily: fontFamilies.interBold,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.backPlaceholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    paddingVertical: 14,
  
   
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  backPlaceholder: {
    width: 32,
  },
  title: {
    flex: 1,
   
  },
});
