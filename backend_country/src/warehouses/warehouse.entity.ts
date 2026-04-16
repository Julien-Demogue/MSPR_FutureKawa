import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DefaultEntity } from '../utils/default.entity';
import { Farm } from '../farms/farm.entity';
import { Batch } from '../batches/batch.entity';

@Entity('warehouses')
export class Warehouse extends DefaultEntity {
    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ name: 'id_farm' })
    id_farm!: number;

    @ManyToOne(() => Farm)
    @JoinColumn({ name: 'id_farm' })
    farm!: Farm;

    @OneToMany(() => Batch, batch => batch.warehouse)
    batches!: Batch[];
}