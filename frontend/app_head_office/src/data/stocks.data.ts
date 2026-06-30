import { AppRole } from '../constants/roles.constant';

// ---------------------------------------------------------------------------
// Règles métier (issues du cahier des charges MSPR, section "Surveillance IoT")
// ---------------------------------------------------------------------------
export const IDEAL_CONDITIONS: Partial<Record<AppRole, { temp: number; humidity: number }>> = {
  [AppRole.BRAZIL]: { temp: 29, humidity: 55 },
  [AppRole.ECUADOR]: { temp: 31, humidity: 60 },
  [AppRole.COLOMBIA]: { temp: 26, humidity: 80 },
};
export const TEMP_TOLERANCE = 3; // °C
export const HUMIDITY_TOLERANCE = 2; // %
export const MAX_STORAGE_DAYS = 365;

export type LotStatus = 'Normal' | 'Alert';
/** Clé i18n (sous alertReasons.*) plutôt que texte en dur, pour rester traduisible. */
export type AlertReasonKey = 'outOfTolerance' | 'tooOld';

export interface RawLot {
  id: string;
  variety: string;
  weight: number;
  temp: number;
  humidity: number;
  /** Date de stockage au format jj/mm/aaaa */
  date: string;
}

export interface Warehouse {
  id: string;
  name: string;
  region: string;
  lots: RawLot[];
}

export interface CountryStock {
  role: AppRole;
  warehouses: Warehouse[];
}

export interface ComputedLot extends RawLot {
  status: LotStatus;
  reasonKeys: AlertReasonKey[];
  warehouseId: string;
  warehouseName: string;
  countryRole: AppRole;
}

export function parseStoredDate(d: string): Date {
  const [day, month, year] = d.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function daysSinceStorage(d: string): number {
  const diffMs = Date.now() - parseStoredDate(d).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isOutOfTolerance(role: AppRole, temp: number, humidity: number): boolean {
  const ideal = IDEAL_CONDITIONS[role];
  if (!ideal) return false;
  return Math.abs(temp - ideal.temp) > TEMP_TOLERANCE || Math.abs(humidity - ideal.humidity) > HUMIDITY_TOLERANCE;
}

/** Calcule le statut d'un lot à partir des règles ci-dessus : rien n'est jamais stocké en dur, ni en français ni en anglais. */
export function computeLotStatus(role: AppRole, lot: RawLot): { status: LotStatus; reasonKeys: AlertReasonKey[] } {
  const reasonKeys: AlertReasonKey[] = [];
  if (isOutOfTolerance(role, lot.temp, lot.humidity)) reasonKeys.push('outOfTolerance');
  if (daysSinceStorage(lot.date) > MAX_STORAGE_DAYS) reasonKeys.push('tooOld');
  return { status: reasonKeys.length > 0 ? 'Alert' : 'Normal', reasonKeys };
}

// ---------------------------------------------------------------------------
// Historique généré (stand-in en attendant le vrai relevé MQTT / backend_country)
// ---------------------------------------------------------------------------
export type HistoryRange = '1d' | '7d' | '60d';
export const HISTORY_RANGES: HistoryRange[] = ['1d', '7d', '60d'];
export const DEFAULT_HISTORY_RANGE: HistoryRange = '60d';

export interface HistoryPoint {
  date: string;
  temperature: number;
  humidite: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Génère un historique à partir de la valeur de référence du lot, sur la période demandée.
 * "1d" donne une granularité horaire (24 points), "7d"/"60d" une granularité journalière.
 * STAND-IN tant que le broker MQTT / backend_country n'envoie pas de vrai historique :
 * à remplacer par un fetch réel le jour venu (même forme de données en sortie, donc les
 * composants graphiques n'auront pas à changer).
 */
export function generateHistory(baseTemp: number, baseHumidity: number, range: HistoryRange = DEFAULT_HISTORY_RANGE): HistoryPoint[] {
  const now = new Date();

  if (range === '1d') {
    return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now);
      d.setHours(d.getHours() - (23 - i), 0, 0, 0);
      const wobble = Math.sin(i / 3) * 0.8;
      return {
        date: `${pad(d.getHours())}:00`,
        temperature: Math.round((baseTemp + wobble) * 10) / 10,
        humidite: Math.round((baseHumidity + wobble * 1.3) * 10) / 10,
      };
    });
  }

  const points = range === '7d' ? 7 : 60;
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (points - 1 - i));
    const wobble = Math.sin(i / 2) * 1.2;
    return {
      date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
      temperature: Math.round((baseTemp + wobble) * 10) / 10,
      humidite: Math.round((baseHumidity + wobble * 1.5) * 10) / 10,
    };
  });
}

// ---------------------------------------------------------------------------
// Données mockées (à remplacer par l'API backend_country).
// Volontairement structurées Pays -> Entrepôt -> Lots comme le sera la vraie
// réponse API. Seules les valeurs brutes (temp/humidité/date) sont stockées :
// le statut est toujours calculé, jamais écrit à la main.
// ---------------------------------------------------------------------------
export const MOCK_STOCKS: CountryStock[] = [
  {
    role: AppRole.BRAZIL,
    warehouses: [
      {
        id: 'BR-SI', name: 'Fazenda Santa Inês', region: 'Minas Gerais',
        lots: [
          { id: 'BRA-MG-2026-001', variety: 'Bourbon', weight: 4000, temp: 28, humidity: 56, date: '10/02/2026' },
          { id: 'BRA-MG-2026-002', variety: 'Catuaí', weight: 3200, temp: 27.5, humidity: 54, date: '05/03/2026' },
          { id: 'BRA-MG-2025-045', variety: 'Mundo Novo', weight: 2700, temp: 28, humidity: 55, date: '01/05/2025' },
        ],
      },
      {
        id: 'BR-AL', name: 'Fazenda Alegria', region: 'Minas Gerais',
        lots: [
          { id: 'BRA-AL-2026-003', variety: 'Robusta', weight: 1500, temp: 34, humidity: 65, date: '12/02/2026' },
          { id: 'BRA-AL-2026-004', variety: 'Arabica', weight: 2200, temp: 28.5, humidity: 56, date: '20/01/2026' },
        ],
      },
    ],
  },
  {
    role: AppRole.ECUADOR,
    warehouses: [
      {
        id: 'EC-PA', name: 'Finca El Páramo', region: 'Loja',
        lots: [
          { id: 'ECU-LJ-2026-001', variety: 'Typica', weight: 2800, temp: 30, humidity: 60, date: '15/01/2026' },
          { id: 'ECU-LJ-2026-002', variety: 'Caturra', weight: 1900, temp: 36, humidity: 68, date: '02/02/2026' },
        ],
      },
      {
        id: 'EC-SU', name: 'Hacienda Sumaco', region: 'Napo',
        lots: [
          { id: 'ECU-NP-2026-001', variety: 'Sidra', weight: 3100, temp: 31.5, humidity: 61, date: '28/02/2026' },
        ],
      },
    ],
  },
  {
    role: AppRole.COLOMBIA,
    warehouses: [
      {
        id: 'CO-ES', name: 'Finca La Esperanza', region: 'Huila',
        lots: [
          { id: 'COL-HU-2026-001', variety: 'Castillo', weight: 2600, temp: 25, humidity: 79, date: '08/02/2026' },
          { id: 'COL-HU-2026-002', variety: 'Caturra', weight: 2100, temp: 30, humidity: 70, date: '18/02/2026' },
        ],
      },
      {
        id: 'CO-LL', name: 'Hacienda Las Lajas', region: 'Nariño',
        lots: [
          { id: 'COL-NA-2026-001', variety: 'Variedad Colombia', weight: 3300, temp: 24, humidity: 80, date: '25/01/2026' },
        ],
      },
    ],
  },
];

export function visibleCountriesFor(role: AppRole | undefined): CountryStock[] {
  const isCountryRole = role && IDEAL_CONDITIONS[role];
  return isCountryRole ? MOCK_STOCKS.filter((c) => c.role === role) : MOCK_STOCKS;
}

export function flattenLots(countries: CountryStock[]): ComputedLot[] {
  return countries.flatMap((c) =>
    c.warehouses.flatMap((w) =>
      w.lots.map((lot) => ({
        ...lot,
        ...computeLotStatus(c.role, lot),
        warehouseId: w.id,
        warehouseName: w.name,
        countryRole: c.role,
      })),
    ),
  );
}