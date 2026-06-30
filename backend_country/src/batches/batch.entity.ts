import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DefaultEntity } from '../utils/entities/default.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { Status } from '../statuses/status.entity';

@Entity('batches')
export class Batch extends DefaultEntity {
    @Column({ name: 'id_warehouse' })
    id_warehouse!: number;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'id_warehouse' })
    warehouse!: Warehouse;

    @OneToMany(() => Status, status => status.batch)
    statuses!: Status[];
}