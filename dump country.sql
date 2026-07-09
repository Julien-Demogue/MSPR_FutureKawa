INSERT INTO `countries` (`id`, `name`, `temperature_ideal`, `temperature_tolerance_degrees`, `humidity_ideal`, `humidity_tolerance_percents`, `uuid`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Brazil', 28.00, 5.00, 65.00, 10.00,'0f578b24-6db3-4d6b-93bd-076ad39d4af6', '2026-06-19 13:40:29.530845', '2026-06-19 14:42:00.634165', NULL);


INSERT INTO `farms` (`id`, `name`, `id_country`, `uuid`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'rio de janero', 1, 'b421bb0d-a32d-4251-8a80-1292734021fe', '2026-06-19 13:40:48.063253', '2026-06-19 14:42:26.676880', NULL);

INSERT INTO `warehouses` (`id`, `name`, `id_farm`, `uuid`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'no 1', 1, '59777034-fc17-40d6-a003-5178796aceaf', '2026-06-19 13:40:59.340392', '2026-06-19 14:42:41.338281', NULL);

INSERT INTO `batches` (`id_warehouse`, `uuid`) VALUES 
(1, 'f1e7c8a0-3d4b-4f5e-9c2b-1a2b3c4d5e6f');