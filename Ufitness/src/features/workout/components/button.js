import React from 'react';
import SharedPrimaryButton from '../../../components/PrimaryButton';

/** Thin wrapper — workout screens keep the icon API, shared styling. */
export default function PrimaryButton({ title = 'Start', onPress, icon = 'play', disabled, variant, style }) {
  return (
    <SharedPrimaryButton
      title={title}
      onPress={onPress}
      icon={icon}
      disabled={disabled}
      variant={variant}
      style={[{ marginTop: 0 }, style]}
    />
  );
}
