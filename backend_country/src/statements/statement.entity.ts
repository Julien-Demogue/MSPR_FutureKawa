import { DefaultEntity } from "../utils/default.entity";
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Warehouse } from "../warehouses/warehouse.entity";

@Entity('statements')
export class Statement extends DefaultEntity {
    @Column({ type: 'decimal', precision: 5, scale: 2 })
    temperature!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    humidity!: number;

    @Column({ name: 'id_warehouse' })
    id_warehouse!: number;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'id_warehouse' })
    warehouse!: Warehouse;
}