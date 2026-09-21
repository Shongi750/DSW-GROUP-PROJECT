export const GENDER_OPTIONS = [
  { id: 'female', label: 'Female', icon: 'woman-outline' },
  { id: 'male', label: 'Male', icon: 'man-outline' },
  { id: 'nonbinary', label: 'Non-binary', icon: 'people-outline' },
  { id: 'unspecified', label: 'Prefer not to say', icon: 'remove-circle-outline' },
];

export function genderLabel(id) {
  return GENDER_OPTIONS.find((item) => item.id === id)?.label || '';
}
