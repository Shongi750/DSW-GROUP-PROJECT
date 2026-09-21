const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

export function getWeekDays(date = new Date()) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return {
      key: toDateKey(current),
      day: current.getDate(),
      weekday: WEEKDAYS[index],
      isToday: toDateKey(current) === toDateKey(new Date()),
    };
  });
}

export function daysWithSessions(history = []) {
  return new Set(history.map((item) => item.date));
}
