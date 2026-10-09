import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';

// Wikimedia (meal photos) returns 403 to Android's default okhttp User-Agent, so every
// meal fell back to FOOD_FALLBACK (one picture). Send an identifying UA with every image.
export const IMAGE_HEADERS = { 'User-Agent': 'UFitness/1.0 (https://ufitness.app; ufitness-app)' };

export const FOOD_FALLBACK =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

export default function SafeImage({ uri, fallback = FOOD_FALLBACK, style, resizeMode = 'cover', ...rest }) {
  const [src, setSrc] = useState(uri || fallback || FOOD_FALLBACK);

  useEffect(() => {
    setSrc(uri || fallback || FOOD_FALLBACK);
  }, [uri, fallback]);

  return (
    <Image
      {...rest}
      source={{ uri: src || FOOD_FALLBACK, headers: /^https?:/i.test(src || '') ? IMAGE_HEADERS : undefined }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (src && src !== fallback && fallback) {
          setSrc(fallback);
          return;
        }
        if (src !== FOOD_FALLBACK) setSrc(FOOD_FALLBACK);
      }}
    />
  );
}
