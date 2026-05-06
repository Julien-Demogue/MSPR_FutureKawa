import { Column, Entity, OneToMany } from 'typeorm';
import { DefaultEntity } from '../utils/entities/default.entity';
import { User } from '../users/user.entity';

@Entity('roles')
export class Role extends DefaultEntity {
    @Column({ type: 'varchar', length: 100 })
    label!: string;

    @OneToMany(() => User, (user) => user.role)
    users?: User[];
}
