import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ledger_events')
export class LedgerEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  credentialId: string;

  @Column({ type: 'varchar', length: 32 })
  action: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  txHash: string;

  @Column({ type: 'int', nullable: true })
  blockNumber: number;

  @Column({ type: 'varchar', length: 128 })
  actor: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  timestamp: Date;
}
