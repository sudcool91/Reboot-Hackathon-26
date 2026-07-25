import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('kyc_requests')
export class KycRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  customerName: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  dob: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  nationality: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  // Comma-separated list of uploaded doc keys
  @Column({ type: 'text', nullable: true })
  uploadedDocs: string;

  // 'pending' | 'approved' | 'rejected'
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: string;

  // Set when admin decides
  @Column({ type: 'varchar', length: 128, nullable: true })
  credentialId: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  txHash: string;

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
