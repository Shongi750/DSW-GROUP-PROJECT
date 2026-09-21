import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';

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
      source={{ uri: src || FOOD_FALLBACK }}
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
