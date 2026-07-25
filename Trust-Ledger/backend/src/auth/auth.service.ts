import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Seed default users on startup
  async onModuleInit() {
    await this.seedDefaultUsers();
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
      },
      {
        username: 'customer',
        password: 'customer123',
        role: 'customer',
        name: 'Rohan Sharma',
        initials: 'RS',
        title: 'Personal Banking Customer',
        email: 'rohan.sharma@email.com',
        credentialId: 'KYC-RS-88213',
      },
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
    // Return safe user object (no password)
    const { password: _p, ...safe } = user;
    return safe;
  }

  async register(data: Partial<User>) {
    const exists = await this.userRepo.findOne({ where: { username: data.username } });
    if (exists) return { error: 'Username already taken' };
    const user = this.userRepo.create(data);
    const saved = await this.userRepo.save(user);
    const { password: _p, ...safe } = saved;
    return safe;
  }

  async getAll() {
    const users = await this.userRepo.find();
    return users.map(({ password: _p, ...u }) => u);
  }
}
