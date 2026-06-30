import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto'; // <-- Module natif Node.js pour générer les UUID
import { AppRole } from '../utils/constants/roles.constant';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
    const password = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');

    // 1. Vérifier si l'admin existe
    const adminExists = await this.userRepository.findOne({ where: { email } });
    if (adminExists) return;

    // 2. Récupérer ou créer le rôle Admin
    let adminRole = await this.roleRepository.findOne({ where: { label: AppRole.ADMIN } });
    if (!adminRole) {
        adminRole = this.roleRepository.create({ 
          uuid: crypto.randomUUID(), 
          label: AppRole.ADMIN 
        });
        await this.roleRepository.save(adminRole);
    }

    // 3. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password!, 10);

    // 4. Créer l'utilisateur
    const admin = this.userRepository.create({
      uuid: crypto.randomUUID(), // <-- On force le UUID manuellement ici aussi
      email,
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'FutureKawa',
      role: adminRole,
    });

    await this.userRepository.save(admin);
    console.log('✅ Admin et Rôle initialisés avec succès.');
  }
}