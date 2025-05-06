import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { EncryptionService } from './encryption.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockEncryptionService = {
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockHttpContext;

    beforeEach(() => {
      mockHttpContext = {
        getRequest: jest.fn(),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      };

      mockExecutionContext = {
        switchToHttp: () => mockHttpContext,
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        getType: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };
    });

    it('should throw UnauthorizedException when no access token found', async () => {
      const mockRequest = {
        cookies: {},
      };
      mockHttpContext.getRequest.mockReturnValue(mockRequest);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('No access token found')
      );
    });

    it('should throw UnauthorizedException when no access token IV found', async () => {
      const mockRequest = {
        cookies: {
          accessToken: 'token',
        },
      };
      mockHttpContext.getRequest.mockReturnValue(mockRequest);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('No access token found')
      );
    });

    it('should throw UnauthorizedException when decryption fails', async () => {
      const mockRequest = {
        cookies: {
          accessToken: 'encrypted-token',
          accessTokenIv: 'iv',
        },
      };
      mockHttpContext.getRequest.mockReturnValue(mockRequest);
      mockEncryptionService.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid access token')
      );
    });

    it('should allow request when valid tokens are present', async () => {
      const mockRequest = {
        cookies: {
          accessToken: 'encrypted-token',
          accessTokenIv: 'iv',
          hd: 'domain.com',
          email: 'test@domain.com',
        },
      };
      mockHttpContext.getRequest.mockReturnValue(mockRequest);
      mockEncryptionService.decrypt.mockResolvedValue('decrypted-token');

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest['accessToken']).toBe('decrypted-token');
      expect(mockRequest['hd']).toBe('domain.com');
      expect(mockRequest['email']).toBe('test@domain.com');
    });
  });
});
