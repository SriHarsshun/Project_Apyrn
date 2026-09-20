import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('handleRequest throws if err or no user', () => {
    expect(() => guard.handleRequest(new UnauthorizedException(), null, null, {} as any)).toThrow(UnauthorizedException);
    expect(() => guard.handleRequest(null, null, null, {} as any)).toThrow(UnauthorizedException);
  });

  it('handleRequest returns user', () => {
    expect(guard.handleRequest(null, { id: 'u1' }, null, {} as any)).toEqual({ id: 'u1' });
  });
});
