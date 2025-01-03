import { Inject, Injectable, InternalServerErrorException, Scope } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import appConfig from 'src/config/env/app.config';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor(@Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>) {
    this.key = Buffer.from(this.config.encryptionKey, 'hex');

    if (this.key.length !== 32) {
      throw new InternalServerErrorException('Invalid ENCRYPTION_KEY: Must be 32 bytes.');
    }
  }

  async encrypt(text: string) {
    const iv = crypto.randomBytes(16);

    let cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
  }

  async decrypt(encryptedData: string, iv: string): Promise<string> {
    const ivBuffer = Buffer.from(iv, 'hex');

    let encryptedText = Buffer.from(encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), ivBuffer);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
