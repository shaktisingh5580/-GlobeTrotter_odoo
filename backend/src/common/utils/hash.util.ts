import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export class HashUtil {
  static async hashPassword(password: string, rounds: number = 12): Promise<string> {
    return bcrypt.hash(password, rounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateRandomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  static generateShareToken(length: number = 16): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }
}
