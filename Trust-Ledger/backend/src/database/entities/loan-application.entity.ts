import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('loan_applications')
export class LoanApplication {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  applicationId: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 128 })
  applicantName: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  customerName: string;

  @Column({ type: 'varchar', length: 64 })
  product: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  amount: string;

  @Column({ type: 'int', nullable: true })
  creditScore: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  kycSource: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  credentialId: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  dob: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  employmentStatus: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  annualIncome: string;

  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  loanTerm: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  existingDebts: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  targetBank: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  shareConsent: boolean;

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
