import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DefaultEntity } from '../utils/entities/default.entity';
import { Country } from '../countries/country.entity';
import { Warehouse } from '../warehouses/warehouse.entity';

@Entity('farms')
export class Farm extends DefaultEntity {
    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ name: 'id_country' })
    id_country!: number;

    @ManyToOne(() => Country)
    @JoinColumn({ name: 'id_country' })
    country!: Country;

    @OneToMany(() => Warehouse, warehouse => warehouse.farm)
    warehouses!: Warehouse[];
}