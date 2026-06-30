/**
 * Rôles applicatifs FutureKawa.
 * Doit rester synchronisé avec backend_head_office/src/utils/constants/roles.constant.ts
 *
 * Les libellés affichés ne sont plus stockés ici : chaque valeur de cet enum
 * correspond directement à une clé sous "roles" dans les fichiers de traduction
 * (src/i18n/fr.json, src/i18n/en.json). Utiliser t(`roles.${role}`) pour l'affichage.
 */
export enum AppRole {
  ADMIN = 'ADMIN',
  DIRECTION = 'DIRECTION',
  BRAZIL = 'BRAZIL',
  ECUADOR = 'ECUADOR',
  COLOMBIA = 'COLOMBIA',
}

/** Rôles "pays" : l'utilisateur ne doit voir que les données de son propre pays */
export const COUNTRY_ROLES: AppRole[] = [AppRole.BRAZIL, AppRole.ECUADOR, AppRole.COLOMBIA];

/**
 * Convertit un label de rôle renvoyé par l'API (casse non garantie) en AppRole.
 * Renvoie undefined si le label ne correspond à aucun rôle connu côté front.
 */
export function parseAppRole(label?: string | null): AppRole | undefined {
  if (!label) return undefined;
  const upper = label.toUpperCase();
  return (Object.values(AppRole) as string[]).includes(upper) ? (upper as AppRole) : undefined;
}