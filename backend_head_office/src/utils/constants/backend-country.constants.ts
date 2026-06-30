export const base_url = 'http://localhost:3000/';

export const country_url = `${base_url}countries/`;
export const alert_url = `${base_url}alerts/`;
export const batch_url = `${base_url}batches/`;
export const farm_url = `${base_url}farms/`;
export const statement_url = `${base_url}statements/`;
export const status_url = `${base_url}statuses/`;
export const warehouse_url = `${base_url}warehouses/`;

export const getDefaultHeaders = () => ({
    'x-api-key': process.env.COUNTRY_API_SECRET,
});