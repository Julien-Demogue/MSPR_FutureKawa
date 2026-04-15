import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, DeleteDateColumn, BaseEntity, ForeignKey, Column } from 'typeorm';

export abstract class DefaultEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'uuid', unique: true })
    uuid!: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deleted_at?: Date;

    @VersionColumn({ type: 'int', default: 1 })
    version!: number;
}