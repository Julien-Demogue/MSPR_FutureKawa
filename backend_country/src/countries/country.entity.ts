import { Column, Entity } from 'typeorm';
import { DefaultEntity } from '../utils/default.entity';

@Entity('countries')
export class Country extends DefaultEntity { 
    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'number'})
    temperature_ideal!: number;

    @Column({ type: 'number' })
    temperature_tolerance_degrees!: number;

    @Column({ type: 'number' })
    humidity_ideal!: number;

    @Column({ type: 'number' })
    humidity_tolerance_percent!: number;
}