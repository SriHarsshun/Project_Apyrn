import { RolesGuard } from '../../src/common/guards/roles.guard';
import { CompanyContextGuard } from '../../src/common/guards/company-context.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('Guards', () => {
  let rolesGuard: RolesGuard;
  let companyContextGuard: CompanyContextGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    companyContextGuard = new CompanyContextGuard();
  });

  describe('RolesGuard', () => {
    it('allows when no roles required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = { getHandler: jest.fn(), getClass: jest.fn() } as any as ExecutionContext;
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('allows when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({ getRequest: () => ({ user: { role: Role.ADMIN } }) }),
      } as any as ExecutionContext;
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('denies when user lacks required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({ getRequest: () => ({ user: { role: Role.VIEWER } }) }),
      } as any as ExecutionContext;
      expect(() => rolesGuard.canActivate(context)).toThrow();
    });
  });

  describe('CompanyContextGuard', () => {
    it('allows when companyId present', () => {
      const context = {
        switchToHttp: () => ({ getRequest: () => ({ user: { companyId: '123' } }) }),
      } as any as ExecutionContext;
      expect(companyContextGuard.canActivate(context)).toBe(true);
    });

    it('denies when companyId missing', () => {
      const context = {
        switchToHttp: () => ({ getRequest: () => ({ user: {} }) }),
      } as any as ExecutionContext;
      expect(() => companyContextGuard.canActivate(context)).toThrow();
    });
  });
});
