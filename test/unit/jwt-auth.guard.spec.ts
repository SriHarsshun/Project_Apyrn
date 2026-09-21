import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '../../src/common/exceptions/app.exception';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('handleRequest throws if err or no user', () => {
    expect(() =>
      guard.handleRequest(new UnauthorizedException('Auth failed'), null, null, {} as any),
    ).toThrow(UnauthorizedException);
    expect(() => guard.handleRequest(null, null, null, {} as ExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('handleRequest returns user', () => {
    expect(guard.handleRequest(null, { id: 'u1' }, null, {} as any)).toEqual({ id: 'u1' });
  });
});
