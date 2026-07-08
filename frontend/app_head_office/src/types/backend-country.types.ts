/** Formes renvoyées par /backend_country/* (proxy de backend_head_office vers backend_country). */

export interface Country {
  id: number;
  uuid: string;
  name: string;
  temperature_ideal: number;
  temperature_tolerance_degrees: number;
  humidity_ideal: number;
  humidity_tolerance_percents: number;
}

export interface Farm {
  id: number;
  uuid: string;
  name: string;
  id_country: number;
}

export interface Warehouse {
  id: number;
  uuid: string;
  name: string;
  id_farm: number;
}

export interface Batch {
  id: number;
  uuid: string;
  id_warehouse: number;
  created_at: string;
}

export type StatusValue = 'OK' | 'ALERT' | 'EXPIRED' | 'SENT' | 'DESTROYED';

export interface Status {
  id: number;
  uuid: string;
  value: StatusValue;
  id_batch: number;
  created_at: string;
}

export type StatementType = 'TEMPERATURE' | 'HUMIDITY';

export interface Statement {
  id: number;
  uuid: string;
  value: number;
  type: StatementType;
  id_warehouse: number;
  created_at: string;
}

export interface Alert {
  id: number;
  uuid: string;
  value: string;
  id_status: number;
  id_statement: number;
}
