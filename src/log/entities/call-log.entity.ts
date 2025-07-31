import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class CallLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  apiKey: string;

  @Column()
  appName: string;

  @Column()
  method: string;

  @Column()
  endpoint: string;

  @Column('text')
  requestBody: string;

  @Column('text', { nullable: true })
  responseBody: string;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ nullable: true })
  responseTime: number;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}