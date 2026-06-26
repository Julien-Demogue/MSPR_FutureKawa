import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DefaultEntity } from '../utils/entities/default.entity';
import { Role } from '../roles/role.entity';

@Entity('users')
export class User extends DefaultEntity {
    @Column({ type: 'varchar', length: 100, nullable: true })
    first_name!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    last_name!: string;

    @Column({ type: 'varchar', length: 150, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    password!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    refresh_token?: string;

    @Column({ type: 'datetime', nullable: true })
    last_login?: Date;

    @Column({ name: 'id_role' })
    id_role!: number;

    @ManyToOne(() => Role)
    @JoinColumn({ name: 'id_role' })
    role!: Role;
}
