import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private static readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private static readonly PHONE_RE = /^\+?[0-9()\-\s]+$/;
  private static readonly DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Seed default users on startup
  async onModuleInit() {
    await this.seedDefaultUsers();
    await this.dropCustomerContactConstraint();
    await this.purgeAdminKycArtifacts();
  }

  private async dropCustomerContactConstraint() {
    try {
      await this.userRepo.query(
        `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_customer_phone_dob_chk`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not drop users customer phone/dob DB constraint: ${msg}`);
    }
  }

  private async purgeAdminKycArtifacts() {
    const adminEmail = 'admin@lloyds.co.uk';
    const adminName = 'Lloyds Admin';

    try {
      const clearedUsers = await this.userRepo.query(
        `UPDATE users
         SET "credentialId" = NULL
         WHERE role = 'admin' OR LOWER(username) = 'admin'
         RETURNING id`,
      );

      const deletedCreds = await this.userRepo.query(
        `DELETE FROM kyc_credentials
         WHERE LOWER(email) = LOWER($1) OR LOWER("customerName") = LOWER($2)
         RETURNING "credentialId"`,
        [adminEmail, adminName],
      );

      const deletedReqs = await this.userRepo.query(
        `DELETE FROM kyc_requests
         WHERE LOWER(email) = LOWER($1) OR LOWER("customerName") = LOWER($2)
         RETURNING id`,
        [adminEmail, adminName],
      );

      const deletedShares = await this.userRepo.query(
        `DELETE FROM credential_share_requests
         WHERE LOWER("customerEmail") = LOWER($1) OR LOWER("customerName") = LOWER($2)
         RETURNING id`,
        [adminEmail, adminName],
      );

      const userCount = Array.isArray(clearedUsers) ? clearedUsers.length : 0;
      const credCount = Array.isArray(deletedCreds) ? deletedCreds.length : 0;
      const reqCount = Array.isArray(deletedReqs) ? deletedReqs.length : 0;
      const shareCount = Array.isArray(deletedShares) ? deletedShares.length : 0;

      if (userCount || credCount || reqCount || shareCount) {
        this.logger.warn(
          `Purged admin KYC artifacts: users=${userCount}, credentials=${credCount}, requests=${reqCount}, shares=${shareCount}`,
        );
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to purge admin KYC artifacts: ${msg}`);
    }
  }

  private async seedDefaultUsers() {
    const defaults = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Lloyds Admin',
        initials: 'LA',
        title: 'Senior Loan Admin',
        email: 'admin@lloyds.co.uk',
        branch: 'London - Canary Wharf',
      }
    ];

    for (const d of defaults) {
      const exists = await this.userRepo.findOne({ where: { username: d.username } });
      if (!exists) {
        await this.userRepo.save(this.userRepo.create(d));
      }
    }
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || user.password !== password) {
      return null;
    }
    // Fetch phone + dob via raw query to guarantee fresh values from DB
    const rows = await this.userRepo.query(
      'SELECT phone, dob FROM users WHERE id = $1', [user.id]
    );
    const extra = rows?.[0] ?? {};
    const { password: _p, ...safe } = user;
    return { ...safe, phone: extra.phone ?? null, dob: extra.dob ?? null };
  }

  private validatePhone(phone: string): string | null {
    if (!AuthService.PHONE_RE.test(phone)) {
      return 'Phone must contain digits, spaces, +, - or parentheses only';
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      return 'Phone must be 7-15 digits';
    }
    return null;
  }

  private validateDob(dob: string): string | null {
    if (!AuthService.DOB_RE.test(dob)) return 'DOB must be in YYYY-MM-DD format';

    const d = new Date(`${dob}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return 'DOB is invalid';

    const [y, m, day] = dob.split('-').map(Number);
    if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
      return 'DOB is invalid';
    }

    const today = new Date();
    let age = today.getUTCFullYear() - y;
    const birthdayNotPassed =
      today.getUTCMonth() + 1 < m ||
      (today.getUTCMonth() + 1 === m && today.getUTCDate() < day);
    if (birthdayNotPassed) age -= 1;

    if (age < 18) return 'Customer must be at least 18 years old';
    if (age > 120) return 'DOB appears invalid';
    return null;
  }

  async register(data: Partial<User> & { phone?: string; dob?: string }) {
    const username = data.username?.trim();
    this.logger.log(
      `Register request: username=${data.username || ''}, role=${data.role || 'customer'}, email=${data.email || ''}, phoneProvided=${!!data.phone}, dobProvided=${!!data.dob}`,
    );

    if (!username) {
      this.logger.warn('Register rejected: missing username');
      return { error: 'Username is required' };
    }

    const email = data.email?.trim().toLowerCase() || '';
    const phone = data.phone?.trim() || '';
    const dob = data.dob?.trim() || '';

    if (email && !AuthService.EMAIL_RE.test(email)) {
      this.logger.warn(`Register rejected for ${username}: invalid email format`);
      return { error: 'Valid email required' };
    }

    if (phone) {
      const phoneErr = this.validatePhone(phone);
      if (phoneErr) {
        this.logger.warn(`Register rejected for ${username}: ${phoneErr}`);
        return { error: phoneErr };
      }
    }

    if (dob) {
      const dobErr = this.validateDob(dob);
      if (dobErr) {
        this.logger.warn(`Register rejected for ${username}: ${dobErr}`);
        return { error: dobErr };
      }
    }

    const exists = await this.userRepo.findOne({ where: { username: data.username } });
    if (exists) {
      this.logger.warn(`Register rejected for ${username}: username already taken`);
      return { error: 'Username already taken' };
    }
    const user = this.userRepo.create({
      ...data,
      username,
      email: email || data.email,
      phone: phone || undefined,
      dob: dob || undefined,
    });
    const saved = await this.userRepo.save(user);

    // Persist phone + dob explicitly via raw SQL — ensures they land in DB
    // even when the TypeORM entity-metadata cache is stale between restarts.
    await this.userRepo.query(
      'UPDATE users SET phone = $1, dob = $2 WHERE id = $3',
      [phone || null, dob || null, saved.id],
    );

    const persistedRows = await this.userRepo.query(
      'SELECT phone, dob FROM users WHERE id = $1',
      [saved.id],
    );
    const persisted = persistedRows?.[0] ?? {};

    this.logger.log(
      `Register success: username=${saved.username}, id=${saved.id}, phone=${persisted.phone || phone || 'null'}, dob=${persisted.dob || dob || 'null'}`,
    );

    const { password: _p, ...safe } = saved;
    return {
      ...safe,
      phone: persisted.phone || phone || null,
      dob: persisted.dob || dob || null,
    };
  }

  async getAll() {
    // Raw query guarantees all columns (phone, dob) are included
    const rows: any[] = await this.userRepo.query(
      `SELECT id, username, role, name, initials, title, email, branch,
              "credentialId", "createdAt", phone, dob
       FROM users ORDER BY id`
    );
    return rows;
  }
}
