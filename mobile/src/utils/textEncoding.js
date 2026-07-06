export const repairMojibakeText = (value) => {
  if (typeof value !== 'string' || !/[ÃÂà]/.test(value)) {
    return value;
  }

  try {
    const encodedBytes = value
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('');

    return decodeURIComponent(encodedBytes);
  } catch {
    return value;
  }
};
