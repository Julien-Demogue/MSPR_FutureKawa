import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn, DeleteDateColumn, BaseEntity } from 'typeorm';

export abstract class DefaultEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    uuid!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at!: Date;

    @DeleteDateColumn({ type: 'timestamptz', nullable: true })
    deleted_at?: Date;

    @VersionColumn({ type: 'int', default: 1 })
    version!: number;
}