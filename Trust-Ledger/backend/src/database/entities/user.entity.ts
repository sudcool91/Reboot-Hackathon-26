import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 128 })
  password: string; // stored as plain for demo; in prod use bcrypt

  @Column({ type: 'varchar', length: 16, default: 'customer' })
  role: string; // 'admin' | 'customer'

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  initials: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  branch: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  dob: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  credentialId: string;

  @CreateDateColumn()
  createdAt: Date;
}
