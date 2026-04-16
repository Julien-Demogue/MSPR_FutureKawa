import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { DefaultEntity } from "../utils/default.entity";
import { Batch } from "../batches/batch.entity";
import { Alert } from "../alerts/alert.entity";

@Entity('statuses')
export class Status extends DefaultEntity {
    @Column({ type: 'enum', enum: ['OK', 'ALERT', 'EXPIRED', 'SENT'] })
    value!: 'OK' | 'ALERT' | 'EXPIRED' | 'SENT';

    @Column({ name: 'id_batch' })
    id_batch!: number;

    @ManyToOne(() => Batch)
    @JoinColumn({ name: 'id_batch' })
    batch!: Batch;

    @OneToMany(() => Alert, alert => alert.status)
    alerts!: Alert[];
}