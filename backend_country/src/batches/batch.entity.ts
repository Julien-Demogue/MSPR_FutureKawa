import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DefaultEntity } from '../utils/default.entity';
import { Warehouse } from '../warehouses/warehouse.entity';

@Entity('batches')
export class Batch extends DefaultEntity {
    @Column({ name: 'id_warehouse' })
    id_warehouse!: number;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'id_warehouse' })
    warehouse!: Warehouse;
}