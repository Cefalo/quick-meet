export const toMs = (time: string): number => {
  const timeUnitMap: { [key: string]: number } = {
    h: 3600000, // 1 hour = 3600000 ms
    d: 86400000, // 1 day = 86400000 ms
    m: 60000, // 1 minute = 60000 ms
    s: 1000, // 1 second = 1000 ms
  };

  const match = time.match(/^(\d+)([a-zA-Z]+)$/);

  if (!match) {
    throw new Error('Invalid time format');
  }

  const [, amount, unit] = match;
  const value = parseInt(amount, 10);

  if (!timeUnitMap[unit]) {
    throw new Error(`Unknown time unit: ${unit}`);
  }

  return value * timeUnitMap[unit];
};
