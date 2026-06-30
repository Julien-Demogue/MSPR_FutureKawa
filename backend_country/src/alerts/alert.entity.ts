import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DefaultEntity } from '../utils/entities/default.entity';
import { Status } from '../statuses/status.entity';
import { Statement } from '../statements/statement.entity';

@Entity('alerts')
export class Alert extends DefaultEntity {
    @Column({ type: 'varchar', length: 255 })
    value!: string;

    @Column({ name: 'id_status' })
    id_status!: number;

    @Column({ name: 'id_statement' })
    id_statement!: number;

    @ManyToOne(() => Status)
    @JoinColumn({ name: 'id_status' })
    status!: Status;

    @ManyToOne(() => Statement)
    @JoinColumn({ name: 'id_statement' })
    statement!: Statement;
}