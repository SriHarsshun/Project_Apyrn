import { Role, User } from '@prisma/client';
import * as crypto from 'crypto';

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    companyId: crypto.randomUUID(),
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    role: Role.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockRegisterDto(overrides?: any) {
  return {
    companyName: 'Test Company',
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    ...overrides,
  };
}

export function createMockLoginDto(overrides?: any) {
  return {
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  };
}
