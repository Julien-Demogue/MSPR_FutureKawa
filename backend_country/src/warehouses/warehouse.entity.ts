import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DefaultEntity } from '../utils/default.entity';
import { Farm } from '../farms/farm.entity';

@Entity('warehouses')
export class Warehouse extends DefaultEntity {
    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ name: 'id_farm' })
    id_farm!: number;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: 'id_farm' })
    farm!: Farm;
}