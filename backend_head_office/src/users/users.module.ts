import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Role } from '../roles/role.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, Role]), RolesModule],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }
