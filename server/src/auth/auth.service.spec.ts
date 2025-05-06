import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import appConfig from '../config/env/app.config';

const mockConfig = {
  environment: 'development',
  appPort: 8080,
  encryptionKey: 'test-key',
  oAuthClientSecret: 'test-secret',
  oAuthClientId: 'test-id',
  oAuthRedirectUrl: 'test-url',
};

describe('AuthService', () => {
  let service: AuthService;

  const mockGoogleApiService = {
    getOAuthClient: jest.fn(),
    getToken: jest.fn(),
    getCalendarResources: jest.fn(),
    listPeople: jest.fn(),
  };

  const mockJwtService = {
    decode: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        Logger,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'GoogleApiService',
          useValue: mockGoogleApiService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const mockCode = 'test-code';
    const mockTokens = {
      tokens: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        id_token: 'test-id-token',
      },
    };
    const mockUserInfo = {
      hd: 'test.com',
      email: 'test@test.com',
    };
    const mockEncrypted = {
      encryptedData: 'encrypted',
      iv: 'iv',
    };

    it('should successfully login user', async () => {
      mockGoogleApiService.getOAuthClient.mockReturnValue({});
      mockGoogleApiService.getToken.mockResolvedValue(mockTokens);
      mockJwtService.decode.mockReturnValue(mockUserInfo);
      mockEncryptionService.encrypt.mockResolvedValue(mockEncrypted);
      mockGoogleApiService.getCalendarResources.mockResolvedValue({ items: [] });
      mockGoogleApiService.listPeople.mockResolvedValue([]);

      const result = await service.login(mockCode);

      expect(result).toEqual({
        accessToken: mockEncrypted.encryptedData,
        accessTokenIv: mockEncrypted.iv,
        refreshToken: mockEncrypted.encryptedData,
        refreshTokenIv: mockEncrypted.iv,
        hd: mockUserInfo.hd,
        email: mockUserInfo.email,
      });
    });
  });

  describe('refreshAppToken', () => {
    it('should throw error if no refresh token provided', async () => {
      await expect(service.refreshAppToken()).rejects.toThrow("Couldn't rotate token. No refresh token");
    });

    it('should throw unauthorized if refresh fails', async () => {
      const mockClient = {
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn().mockRejectedValue(new Error('Refresh failed')),
      };
      mockGoogleApiService.getOAuthClient.mockReturnValue(mockClient);

      await expect(service.refreshAppToken('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return new access token on successful refresh', async () => {
      const mockClient = {
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn().mockResolvedValue({
          credentials: {
            access_token: 'new-access-token',
          },
        }),
      };
      mockGoogleApiService.getOAuthClient.mockReturnValue(mockClient);

      const result = await service.refreshAppToken('token');
      expect(result).toBe('new-access-token');
    });
  });

  describe('getFloors', () => {
    it('should return sorted unique floors', async () => {
      const mockRooms = [{ floor: 'F2' }, { floor: 'F1' }, { floor: 'F3' }, { floor: 'F1' }];

      mockCacheManager.get.mockResolvedValue(mockRooms);

      const result = await service.getFloors({} as any);
      expect(result).toEqual(['F1', 'F2', 'F3']);
    });
  });

  describe('getCookieOptions', () => {
    it('should return secure cookie options in production', () => {
      mockConfig.environment = 'production';
      const options = service.getCookieOptions();
      expect(options.secure).toBe(true);
    });

    it('should return non-secure cookie options in development', () => {
      mockConfig.environment = 'development';
      const options = service.getCookieOptions();
      expect(options.secure).toBe(false);
    });
  });
});
