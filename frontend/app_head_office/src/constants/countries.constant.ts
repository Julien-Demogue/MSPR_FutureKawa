import { AppRole } from './roles.constant';

/**
 * Convention d'intégration avec backend_country : Country.name doit correspondre
 * exactement à ces valeurs pour qu'un rôle pays puisse être rattaché à un pays.
 */
export const COUNTRY_NAME_BY_ROLE: Partial<Record<AppRole, string>> = {
  [AppRole.BRAZIL]: 'Brazil',
  [AppRole.ECUADOR]: 'Ecuador',
  [AppRole.COLOMBIA]: 'Colombia',
};

export function roleForCountryName(name: string): AppRole | undefined {
  const entry = Object.entries(COUNTRY_NAME_BY_ROLE).find(([, countryName]) => countryName === name);
  return entry?.[0] as AppRole | undefined;
}
