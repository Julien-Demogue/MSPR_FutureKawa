/**
 * Application roles - used for role-based access control
 */
export enum AppRole {
    ADMIN = 'ADMIN',
    DIRECTION = 'DIRECTION',
    BRAZIL = 'BRAZIL',
    ECUADOR = 'ECUADOR',
    COLOMBIA = 'COLOMBIA',
    USER = 'USER',
}

/** Rôles "pays" : un compte avec l'un de ces rôles ne doit voir que les données de son pays */
export const COUNTRY_ROLES = [AppRole.BRAZIL, AppRole.ECUADOR, AppRole.COLOMBIA];

/** Tous les rôles applicatifs — pour les routes accessibles à n'importe quel compte connecté */
export const ALL_ROLES = Object.values(AppRole);