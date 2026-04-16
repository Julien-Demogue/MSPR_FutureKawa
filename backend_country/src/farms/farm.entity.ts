import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DefaultEntity } from '../utils/default.entity';
import { Country } from '../countries/country.entity';

@Entity('farms')
export class Farm extends DefaultEntity {
    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ name: 'id_country' })
    id_country!: number;

    @ManyToOne(() => Country)
    @JoinColumn({ name: 'id_country' })
    country!: Country;
}