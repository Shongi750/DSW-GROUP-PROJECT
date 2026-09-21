function avatarUri(seed, extras) {
  const params = new URLSearchParams({
    seed,
    size: '256',
    earringsProbability: '0',
    featuresProbability: '0',
    ...extras,
  });
  return `https://api.dicebear.com/9.x/adventurer/png?${params.toString()}`;
}

export const DEFAULT_AVATAR = avatarUri('Ufitness', {
  hair: 'short10',
  skinColor: '9e5622',
  hairColor: '0e0e0e',
});

export const PROFILE_AVATARS = [
  { id: 'thabo', uri: avatarUri('Thabo', { hair: 'short16', skinColor: '9e5622', hairColor: '0e0e0e' }) },
  { id: 'sipho', uri: avatarUri('Sipho', { hair: 'short08', skinColor: '763900', hairColor: '0e0e0e', features: 'mustache', featuresProbability: '100' }) },
  { id: 'kai', uri: avatarUri('Kai', { hair: 'short04', skinColor: '9e5622', hairColor: '0e0e0e', glasses: 'variant01', glassesProbability: '100' }) },
  { id: 'lerato', uri: avatarUri('Lerato', { hair: 'long08', skinColor: '9e5622', hairColor: '0e0e0e' }) },
  { id: 'nomsa', uri: avatarUri('Nomsa', { hair: 'long20', skinColor: 'ecad80', hairColor: 'ac6511' }) },
  { id: 'aya', uri: avatarUri('Aya', { hair: 'long12', skinColor: '763900', hairColor: '0e0e0e' }) },
];
