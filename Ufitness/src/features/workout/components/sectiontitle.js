import React from 'react';
import { Text } from 'react-native';
import { colors } from '../constants/theme';

export default function SectionTitle({ children, className = '' }) {
  return (
    <Text className={`mb-3 mt-7 text-xl font-bold text-ink ${className}`} style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 28, marginBottom: 12 }}>
      {children}
    </Text>
  );
}
