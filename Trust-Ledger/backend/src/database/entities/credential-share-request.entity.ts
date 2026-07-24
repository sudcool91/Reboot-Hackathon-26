import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('credential_share_requests')
export class CredentialShareRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  credentialId: string;

  @Column({ type: 'varchar', length: 128 })
  customerName: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  customerEmail: string;

  @Column({ type: 'varchar', length: 128 })
  targetBank: string;

  // 'pending' | 'approved' | 'rejected'
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: string;

  // 'manual' | 'product_application'
  @Column({ type: 'varchar', length: 32, default: 'manual', nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  adminRemark: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  decidedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  decidedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
