import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import {
  createMockRegisterDto,
  createMockLoginDto,
  createMockUser,
} from '../factories/user.factory';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: any;
  let jwtService: any;

  beforeEach(async () => {
    authRepository = {
      findUserByEmail: jest.fn(),
      createUserWithCompany: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'AUTH_REPOSITORY', useValue: authRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('creates user+company, hashes password, returns JWT', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      const user = createMockUser();
      authRepository.createUserWithCompany.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const dto = createMockRegisterDto();
      const result = await service.register(dto);

      expect(result).toEqual({ accessToken: 'token', user: expect.any(Object) });
      expect(authRepository.createUserWithCompany).toHaveBeenCalled();
    });

    it('throws ConflictException if email exists', async () => {
      authRepository.findUserByEmail.mockResolvedValue(createMockUser());

      const dto = createMockRegisterDto();
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('validates credentials, returns JWT', async () => {
      const user = createMockUser();
      authRepository.findUserByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('token');

      const dto = createMockLoginDto();
      const result = await service.login(dto);

      expect(result).toEqual({ accessToken: 'token', user: expect.any(Object) });
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const user = createMockUser();
      authRepository.findUserByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = createMockLoginDto();
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      const dto = createMockLoginDto();
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
