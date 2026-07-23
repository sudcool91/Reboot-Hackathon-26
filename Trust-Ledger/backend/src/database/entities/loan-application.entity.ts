import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('loan_applications')
export class LoanApplication {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  applicationId: string;

  @Column({ type: 'varchar', length: 8 })
  avatar: string;

  @Column({ type: 'varchar', length: 128 })
  applicantName: string;

  @Column({ type: 'varchar', length: 64 })
  product: string;

  @Column({ type: 'varchar', length: 32 })
  amount: string;

  @Column({ type: 'int', nullable: true })
  creditScore: number | null;

  @Column({ type: 'varchar', length: 64 })
  kycSource: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  credentialId: string;

  @Column({ type: 'varchar', length: 32, default: 'Pending docs' })
  status: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  decision: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  decidedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
