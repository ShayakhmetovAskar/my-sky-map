CREATE TABLE stars (
    id SERIAL PRIMARY KEY,
    ra DOUBLE PRECISION NOT NULL,      -- Прямое восхождение
    dec DOUBLE PRECISION NOT NULL,     -- Склонение
    phot_g_mean_mag DOUBLE PRECISION,  -- Видимая звёздная величина (G-band)
    phot_bp_mean_mag DOUBLE PRECISION, -- Звёздная величина (BP-band)
    phot_rp_mean_mag DOUBLE PRECISION  -- Звёздная величина (RP-band)
);