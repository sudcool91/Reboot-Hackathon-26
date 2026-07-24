import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('kyc_credentials')
export class KycCredential {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  credentialId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  customerId: string;

  @Column({ type: 'varchar', length: 8 })
  avatar: string;

  @Column({ type: 'varchar', length: 128 })
  customerName: string;

  @Column({ type: 'varchar', length: 64 })
  issuer: string;

  @Column({ type: 'varchar', length: 32 })
  expiresOn: string;

  @Column({ type: 'varchar', length: 32, default: 'Active' })
  status: string;

  @Column({ type: 'simple-array', default: '' })
  sharedWith: string[];

  @Column({ type: 'varchar', length: 128, nullable: true })
  txHash: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  did: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
