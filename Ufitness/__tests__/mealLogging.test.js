// Meal logging helpers with the AsyncStorage mock (cloud saves are mocked).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../src/lib/cloudCache', () => ({
  fetchCloudDoc: jest.fn(async () => null),
  saveCloudDoc: jest.fn(async () => true),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCloudDoc, saveCloudDoc } from '../src/lib/cloudCache';
import { loadEatenToday, logEatenMeal } from '../src/features/meals/lib/eaten';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test('logging meals adds up kcal, protein and carbs for today', async () => {
  await logEatenMeal('u1', { id: 'pap', title: 'Pap & wors', kcal: '650', protein: 30, carbs: 80 });
  const summary = await logEatenMeal('u1', { id: 'oats', title: 'Oats', kcal: 300, protein: 10, carbs: 50 });
  expect(summary.items.map((item) => item.title)).toEqual(['Pap & wors', 'Oats']);
  expect(summary).toMatchObject({ kcal: 950, protein: 40, carbs: 130 });
  expect(saveCloudDoc).toHaveBeenCalledTimes(2);
  expect(saveCloudDoc.mock.calls[1][0]).toBe('eaten');

  const again = await loadEatenToday('u1');
  expect(again.kcal).toBe(950);
});

test('the same meal is not logged twice', async () => {
  await logEatenMeal('u1', { id: 'pap', kcal: 650 });
  const summary = await logEatenMeal('u1', { id: 'pap', kcal: 650 });
  expect(summary.items).toHaveLength(1);
  expect(saveCloudDoc).toHaveBeenCalledTimes(1);
});

test('bad numbers count as 0 and guests stay on the device', async () => {
  const summary = await logEatenMeal('', { title: 'Snack', kcal: 'abc' });
  expect(summary.kcal).toBe(0);
  expect(summary.items[0].title).toBe('Snack');
  expect(saveCloudDoc).not.toHaveBeenCalled();
});

test('a new phone pulls today from the cloud copy', async () => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  fetchCloudDoc.mockResolvedValueOnce({ [today]: [{ id: 'x', title: 'Chakalaka', kcal: 200, protein: 8, carbs: 30 }] });
  const summary = await loadEatenToday('u2');
  expect(fetchCloudDoc).toHaveBeenCalledWith('eaten', 'u2');
  expect(summary).toMatchObject({ kcal: 200, protein: 8, carbs: 30 });
  expect(JSON.parse(await AsyncStorage.getItem('ufitness.eaten.v1.u2'))[today]).toHaveLength(1);
});
