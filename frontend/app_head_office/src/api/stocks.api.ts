import { headOfficeApi } from './axios.config';
import { AppRole } from '../constants/roles.constant';
import { COUNTRY_NAME_BY_ROLE, roleForCountryName } from '../constants/countries.constant';
import type {
  Alert, Batch, Country, Farm, Statement, StatementType, Status,
  StatusValue, Warehouse,
} from '../types/backend-country.types';
export type { StatusValue } from '../types/backend-country.types';

// ---------------------------------------------------------------------------
// Périodes disponibles pour les graphiques
// ---------------------------------------------------------------------------
export type HistoryRange = '1h' | '6h' | '1d' | '7d' | '60d';
export const HISTORY_RANGES: HistoryRange[] = ['1h', '6h', '1d', '7d', '60d'];
export const DEFAULT_HISTORY_RANGE: HistoryRange = '60d';

export interface HistoryPoint {
  date: string;
  temperature: number;
  // null quand aucune mesure n'existe pour cet instant → connectNulls
  // interpolera sans descendre à 0
  humidite: number | null;
}

export interface ComputedLot {
  id: number;
  batchId: string;
  displayId: string;
  countryRole: AppRole | undefined;
  countryName: string;
  warehouseId: number;
  warehouseName: string;
  status: StatusValue | null;
  alertReasons: string[];
  temp: number | null;
  humidity: number | null;
  storedAt: Date;
}

const RANGE_TO_MS: Record<HistoryRange, number> = {
  '1h':  1 * 60 * 60 * 1000,
  '6h':  6 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d':  7 * 24 * 60 * 60 * 1000,
  '60d': 60 * 24 * 60 * 60 * 1000,
};

/** Format jj/mm/aaaa fixe (indépendant de la locale du navigateur). */
export function formatStoredDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Assez large pour couvrir la fenêtre "60 jours" tant qu'il n'y a pas
 *  de filtre par entrepôt côté API. */
const HISTORY_FETCH_COUNT = 2000;

async function getCountries(): Promise<Country[]> {
  const { data } = await headOfficeApi.get<Country[]>('/backend_country/countries');
  return data;
}

async function getFarms(): Promise<Farm[]> {
  const { data } = await headOfficeApi.get<Farm[]>('/backend_country/farms');
  return data;
}

async function getWarehouses(): Promise<Warehouse[]> {
  const { data } = await headOfficeApi.get<Warehouse[]>('/backend_country/warehouses');
  return data;
}

async function getBatches(): Promise<Batch[]> {
  const { data } = await headOfficeApi.get<Batch[]>('/backend_country/batches');
  return data;
}

async function getStatuses(): Promise<Status[]> {
  const { data } = await headOfficeApi.get<Status[]>('/backend_country/statuses');
  return data;
}

async function getAlerts(): Promise<Alert[]> {
  const { data } = await headOfficeApi.get<Alert[]>('/backend_country/alerts');
  return data;
}

async function getStatementsByType(type: StatementType, count = HISTORY_FETCH_COUNT): Promise<Statement[]> {
  const { data } = await headOfficeApi.get<Statement[]>('/backend_country/statements/type', {
    params: { type, count },
  });
  return data;
}

function latestByKey<T extends { created_at: string }>(
  items: T[],
  keyOf: (item: T) => number,
): Map<number, T> {
  const latest = new Map<number, T>();
  for (const item of items) {
    const key = keyOf(item);
    const current = latest.get(key);
    if (!current || new Date(item.created_at).getTime() > new Date(current.created_at).getTime()) {
      latest.set(key, item);
    }
  }
  return latest;
}

export async function fetchStockOverview(): Promise<ComputedLot[]> {
  const [countries, farms, warehouses, batches, statuses, alerts, temperatures, humidities] =
    await Promise.all([
      getCountries(), getFarms(), getWarehouses(), getBatches(),
      getStatuses(), getAlerts(),
      getStatementsByType('TEMPERATURE'),
      getStatementsByType('HUMIDITY'),
    ]);

  const countryById = new Map(countries.map((c) => [c.id, c]));
  const farmById = new Map(farms.map((f) => [f.id, f]));
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));
  const latestStatusByBatch = latestByKey(statuses, (s) => s.id_batch);
  const latestTempByWarehouse = latestByKey(temperatures, (s) => s.id_warehouse);
  const latestHumidityByWarehouse = latestByKey(humidities, (s) => s.id_warehouse);

  const alertsByStatus = new Map<number, Alert[]>();
  for (const alert of alerts) {
    const list = alertsByStatus.get(alert.id_status) ?? [];
    list.push(alert);
    alertsByStatus.set(alert.id_status, list);
  }

  return batches.map((batch): ComputedLot => {
    const warehouse = warehouseById.get(batch.id_warehouse);
    const farm = warehouse ? farmById.get(warehouse.id_farm) : undefined;
    const country = farm ? countryById.get(farm.id_country) : undefined;
    const latestStatus = latestStatusByBatch.get(batch.id) ?? null;

    return {
      id: batch.id,
      batchId: batch.uuid,
      displayId: `#${batch.id}`,
      countryRole: country ? roleForCountryName(country.name) : undefined,
      countryName: country?.name ?? '—',
      warehouseId: warehouse?.id ?? -1,
      warehouseName: warehouse?.name ?? '—',
      status: latestStatus?.value ?? null,
      alertReasons:
        latestStatus && latestStatus.value === 'ALERT'
          ? (alertsByStatus.get(latestStatus.id) ?? []).map((a) => a.value)
          : [],
      temp: warehouse ? latestTempByWarehouse.get(warehouse.id)?.value ?? null : null,
      humidity: warehouse ? latestHumidityByWarehouse.get(warehouse.id)?.value ?? null : null,
      storedAt: new Date(batch.created_at),
    };
  });
}

export function visibleLotsFor(role: AppRole | undefined, lots: ComputedLot[]): ComputedLot[] {
  const isCountryRole = role && COUNTRY_NAME_BY_ROLE[role];
  return isCountryRole ? lots.filter((lot) => lot.countryRole === role) : lots;
}

export async function fetchWarehouseHistory(
  warehouseId: number,
  range: HistoryRange,
): Promise<HistoryPoint[]> {
  const [temperatures, humidities] = await Promise.all([
    getStatementsByType('TEMPERATURE'),
    getStatementsByType('HUMIDITY'),
  ]);

  const since = Date.now() - RANGE_TO_MS[range];
  const inWindow = (s: Statement) =>
    s.id_warehouse === warehouseId && new Date(s.created_at).getTime() >= since;

  const tempPoints = temperatures
    .filter(inWindow)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const humidityByTime = new Map(
    humidities.filter(inWindow).map((s) => [s.created_at, s.value]),
  );

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Granularité horaire pour les 3 périodes intraday
    return range === '1h' || range === '6h' || range === '1d'
      ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
      : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  return tempPoints.map((s) => ({
    date: formatDate(s.created_at),
    temperature: s.value,
    // null au lieu de 0 quand aucune mesure humidité ne correspond à cet instant :
    // combiné avec connectNulls sur le <Line>, la courbe interpolera proprement
    // sans jamais descendre à 0.
    humidite: humidityByTime.get(s.created_at) ?? null,
  }));
}