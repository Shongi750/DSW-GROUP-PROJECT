import React from 'react';
import { Text } from 'react-native';
import { useTheme, display, spacing } from '../../../context/ThemeContext';

export default function SectionTitle({ children, className = '', style }) {
  const { colors } = useTheme();
  return (
    <Text
      className={className}
      style={[
        {
          ...display,
          color: colors.text,
          fontSize: 22,
          marginTop: 32,
          marginBottom: spacing.card,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
