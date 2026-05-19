import { UserRole } from '../../user/entities/user.entity';

/** Normalize DB/JWT role strings (handles legacy values like "AUTHOR"). */
export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') {
    return null;
  }
  const value = role.trim().toLowerCase();
  if (value === 'author' || value === 'writer') {
    return UserRole.AUTHOR;
  }
  if (value === 'reader') {
    return UserRole.READER;
  }
  return null;
}

export function isAuthor(role: unknown): boolean {
  return normalizeRole(role) === UserRole.AUTHOR;
}

export function isReader(role: unknown): boolean {
  return normalizeRole(role) === UserRole.READER;
}
