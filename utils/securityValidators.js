import { HttpError } from '@/lib/server/errors';

export const ensureSafeUserId = (value, { allowEmpty = false } = {}) => {
  if (typeof value !== 'string') throw new HttpError(400, 'Invalid user identifier');
  const text = value.trim();
  if (allowEmpty && !text) return '';
  if (!/^[A-Za-z0-9@._-]{1,128}$/.test(text)) throw new HttpError(400, 'Invalid user identifier');
  return text;
};

export const coerceStringField = (value, { maxLength = 256, allowEmpty = false } = {}) => {
  if (value === undefined || value === null) {
    if (allowEmpty) return '';
    throw new HttpError(400, 'Value is required');
  }
  if (typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value))) {
    throw new HttpError(400, 'Invalid text value');
  }
  const text = String(value).trim();
  if ((!allowEmpty && !text) || text.length > maxLength)
    throw new HttpError(400, 'Invalid text length');
  return text;
};

export const coerceNumberField = (value, { min = 0, max = 1e9, integer = false } = {}) => {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())
  )
    throw new HttpError(400, 'Invalid numeric value');
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number < min ||
    number > max ||
    (integer && !Number.isSafeInteger(number))
  ) {
    throw new HttpError(400, 'Numeric value out of range');
  }
  return number;
};

export const safeImageUrl = (value) => {
  if (!value) return null;
  const text = coerceStringField(value, { maxLength: 1024 });
  if (text.startsWith('/images/') && !text.includes('..')) return text;
  try {
    const url = new URL(text);
    if (
      url.protocol === 'https:' &&
      url.hostname === 'images.ygoprodeck.com' &&
      !url.username &&
      !url.password
    )
      return url.href;
  } catch {
    /* Invalid URL. */
  }
  throw new HttpError(400, 'Invalid card image URL');
};
