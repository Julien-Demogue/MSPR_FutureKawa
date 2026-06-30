import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { DefaultEntity } from '../utils/entities/default.entity';
import { Batch } from "../batches/batch.entity";
import { Alert } from "../alerts/alert.entity";

@Entity('statuses')
export class Status extends DefaultEntity {
    @Column({ type: 'enum', enum: ['OK', 'ALERT', 'EXPIRED', 'SENT', 'DESTROYED'] })
    value!: 'OK' | 'ALERT' | 'EXPIRED' | 'SENT' | 'DESTROYED';

    @Column({ name: 'id_batch' })
    id_batch!: number;

    @ManyToOne(() => Batch)
    @JoinColumn({ name: 'id_batch' })
    batch!: Batch;

    @OneToMany(() => Alert, alert => alert.status)
    alerts!: Alert[];
}