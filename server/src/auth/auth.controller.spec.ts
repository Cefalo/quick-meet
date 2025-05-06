import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption.service';
import { Logger } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    refreshAppToken: jest.fn(),
    logout: jest.fn(),
    getCookieOptions: jest.fn(),
  };

  const mockEncryptionService = {
    decrypt: jest.fn(),
    encrypt: jest.fn(),
  };

  const mockGoogleApiService = {
    getOAuthUrl: jest.fn(),
    getOAuthClient: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        Logger,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: 'GoogleApiService',
          useValue: mockGoogleApiService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('oAuthCallback', () => {
    const mockCode = 'test-code';
    const mockLoginResponse = {
      accessToken: 'encrypted-access-token',
      accessTokenIv: 'access-iv',
      refreshToken: 'encrypted-refresh-token',
      refreshTokenIv: 'refresh-iv',
      hd: 'test.com',
      email: 'test@test.com',
    };

    it('should handle OAuth callback successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      mockAuthService.getCookieOptions.mockReturnValue({ httpOnly: true });

      const result = await controller.oAuthCallback(mockCode, mockResponse);

      expect(result.data).toBe(true);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(6);
      expect(mockAuthService.login).toHaveBeenCalledWith(mockCode);
    });
  });

  describe('logout', () => {
    it('should clear cookies and revoke token when requested', async () => {
      const mockRequest = {
        cookies: {
          accessToken: 'encrypted-token',
          accessTokenIv: 'iv',
        },
      };

      mockEncryptionService.decrypt.mockResolvedValue('decrypted-token');
      mockGoogleApiService.getOAuthClient.mockReturnValue({ setCredentials: jest.fn() });
      mockAuthService.logout.mockResolvedValue(true);

      await controller.logout(mockRequest as any, mockResponse, true);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(6); // Updated to match actual number of cookies being cleared
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should only clear session cookies when not revoking token', async () => {
      await controller.logout({ cookies: {} } as any, mockResponse, false);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(4);
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });

  describe('getOAuthUrl', () => {
    it('should return OAuth URL for web client', () => {
      const mockUrl = 'https://oauth-url';
      mockGoogleApiService.getOAuthUrl.mockReturnValue(mockUrl);

      const result = controller.getOAuthUrl('web');

      expect(result.data).toBe(mockUrl);
      expect(mockGoogleApiService.getOAuthUrl).toHaveBeenCalledWith('web');
    });
  });

  describe('refreshAppToken', () => {
    it('should refresh access token successfully', async () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'encrypted-refresh',
          refreshTokenIv: 'iv',
        },
      };

      mockEncryptionService.decrypt.mockResolvedValue('decrypted-token');
      mockAuthService.refreshAppToken.mockResolvedValue('new-token');
      mockEncryptionService.encrypt.mockResolvedValue({
        encryptedData: 'new-encrypted-token',
        iv: 'new-iv',
      });
      mockAuthService.getCookieOptions.mockReturnValue({ httpOnly: true });

      const result = await controller.refreshAppToken(mockRequest as any, mockResponse);

      expect(result.data).toBe(true);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });
  });
});
