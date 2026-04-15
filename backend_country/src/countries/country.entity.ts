import { Column, Entity } from 'typeorm';
import { DefaultEntity } from '../utils/default.entity';

@Entity('countries')
export class Country extends DefaultEntity { 
    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    temperature_ideal!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    temperature_tolerance_degrees!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    humidity_ideal!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    humidity_tolerance_percents!: number;
}