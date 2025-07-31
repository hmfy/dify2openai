import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class DifyApp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  difyApiUrl: string;

  @Column()
  @Exclude()
  difyApiKey: string;

  @Column({ unique: true, nullable: true })
  generatedApiKey: string;

  @Column({ default: 'Chat' })
  botType: string;

  @Column({ nullable: true })
  inputVariable: string;

  @Column({ nullable: true })
  outputVariable: string;

  @Column()
  modelName: string;

  @Column({ default: true })
  isEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
