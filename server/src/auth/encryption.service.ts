import { Injectable, Scope } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable({ scope: Scope.REQUEST })
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private iv = crypto.randomBytes(16);
  private key = crypto.randomBytes(32);

  constructor() {}

  async encrypt(text: string) {
    let cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), this.iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return encrypted.toString('hex');
  }

  async decrypt(encryptedData: string): Promise<string> {
    let encryptedText = Buffer.from(encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), this.iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
