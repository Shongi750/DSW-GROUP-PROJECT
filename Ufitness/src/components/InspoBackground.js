import React from 'react';
import { PhotoBackdrop } from './PhotoShell';

/**
 * App-wide photo plate — pass `plate` so tabs don't share one image.
 * @param {'home'|'meals'|'workout'|'community'|'profile'|'auth'} [plate]
 */
export default function InspoBackground({ plate = 'home' }) {
  return <PhotoBackdrop plate={plate} />;
}
