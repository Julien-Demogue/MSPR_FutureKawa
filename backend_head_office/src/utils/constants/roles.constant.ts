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