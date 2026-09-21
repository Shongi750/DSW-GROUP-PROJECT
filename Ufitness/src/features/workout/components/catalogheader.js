import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SearchBar from './searchbar';
import ShortcutRow from './shortcutrow';
import { programShortcuts } from '../data/programs';

export default function CatalogHeader({
  placeholder,
  activeId,
  onQueryChange,
}) {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');

  const update = (value) => {
    setQuery(value);
    onQueryChange?.(value);
  };

  return (
    <View className="mb-1">
      <SearchBar value={query} onChangeText={update} placeholder={placeholder} />
      <ShortcutRow
        items={programShortcuts}
        activeId={activeId}
        onPress={(item) => {
          if (item.id !== activeId) {
            navigation.navigate(item.screen, item.screen === 'Exercises' ? {} : undefined);
          }
        }}
      />
    </View>
  );
}
