import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';

// Round avatar: shows the photo if there is one, otherwise orange initials.
// Works offline (no placeholder website needed).

export function initialsFor(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

export default function Avatar({ name, uri, size = 60, style }) {
  const [broken, setBroken] = useState(false);
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !broken) {
    return <Image source={{ uri }} style={[circle, style]} onError={() => setBroken(true)} />;
  }

  return (
    <View
      style={[circle, { backgroundColor: '#FF6A00', alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: size * 0.38 }}>{initialsFor(name)}</Text>
    </View>
  );
}
