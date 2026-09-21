import { Platform } from 'react-native';

export const TAB_ROOT = {
  Community: 'Feed',
  Profile: 'ProfileHome',
};

export function nestedStackScreenOptions(colors = {}) {
  return {
    headerShown: false,
    animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
    freezeOnBlur: true,
    headerStyle: colors.tabBar ? { backgroundColor: colors.tabBar } : undefined,
    headerTintColor: colors.text,
    headerTitleStyle: colors.text ? { color: colors.text } : undefined,
    contentStyle: { flex: 1, backgroundColor: colors.background },
  };
}

export function nestedStackProps(colors) {
  return {
    detachInactiveScreens: true,
    screenOptions: nestedStackScreenOptions(colors),
  };
}

function nestScreens(screens, params) {
  let payload = params;
  for (let index = screens.length - 1; index >= 0; index -= 1) {
    const next = {
      screen: screens[index],
      initial: false,
    };
    if (payload !== undefined) {
      next.params = payload;
    }
    payload = next;
  }
  return payload;
}

export function openTab(navigation, tabName) {
  const root = TAB_ROOT[tabName];
  if (root) {
    navigation.navigate(tabName, { screen: root });
    return;
  }
  navigation.navigate(tabName);
}

export function openNested(navigation, path, params) {
  if (!path?.length) return;
  const [tab, ...screens] = path;
  if (!screens.length) {
    openTab(navigation, tab);
    return;
  }
  navigation.navigate(tab, nestScreens(screens, params));
}

export function resetTabListener(tabName) {
  return ({ navigation }) => ({
    tabPress: () => {
      openTab(navigation, tabName);
    },
  });
}
