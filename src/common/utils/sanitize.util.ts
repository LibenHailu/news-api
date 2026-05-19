import { Types } from 'mongoose';

const SENSITIVE_KEYS = new Set(['password', '__v']);

function isObjectId(value: unknown): value is Types.ObjectId {
  return value instanceof Types.ObjectId;
}

export function sanitizeResponse<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResponse(item)) as T;
  }

  if (value instanceof Date) {
    return value;
  }

  if (isObjectId(value)) {
    return value.toString() as T;
  }

  if (typeof value === 'object') {
    const maybeDoc = value as unknown as {
      toJSON?: () => unknown;
      toObject?: () => unknown;
    };

    if (typeof maybeDoc.toJSON === 'function') {
      const json = maybeDoc.toJSON();
      if (json !== value) {
        return sanitizeResponse(json) as T;
      }
    }

    if (typeof maybeDoc.toObject === 'function') {
      return sanitizeResponse(maybeDoc.toObject()) as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) {
        continue;
      }
      result[key] = sanitizeResponse(val);
    }
    return result as T;
  }

  return value;
}
