import React, { useEffect } from 'react';
import { useApp } from '../../../context/AppContext';

export default function AdminGate({ navigation, children }) {
  const { canSeeCampusAdmin } = useApp();

  useEffect(() => {
    if (!canSeeCampusAdmin && navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  }, [canSeeCampusAdmin, navigation]);

  if (!canSeeCampusAdmin) return null;
  return children;
}
