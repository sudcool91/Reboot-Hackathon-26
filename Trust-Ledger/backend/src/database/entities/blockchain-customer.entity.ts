import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('blockchain_customers')
export class BlockchainCustomer {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  customerID: string;

  @Column({ type: 'varchar', length: 128 })
  fullName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  dateOfBirth: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  nationalID: string;

  @Column({ type: 'varchar', length: 128, default: 'LloydsBankingGroup' })
  issuingBank: string;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  kycStatus: string;

  @Column({ type: 'boolean', default: false })
  consentGranted: boolean;

  @Column({ type: 'varchar', length: 256, nullable: true })
  documentHash: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  fabricTxId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  fabricCreatedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
