-- Default categories, seeded idempotently on every startup (safe to re-run).
-- Renamed from import.sql: Hibernate only auto-runs import.sql when
-- ddl-auto is create/create-drop, so with ddl-auto=update it silently
-- never ran. Spring Boot's own SQL init (see application.yml,
-- spring.sql.init.mode: always) runs data.sql on every startup instead.

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Groceries', 'Supermarket and food supplies', 'shopping-basket', '#0f6e5c', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Groceries');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Dining Out', 'Restaurants, cafes, and takeout', 'coffee', '#c99a44', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dining Out');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Transportation', 'Gas, public transit, parking, and maintenance', 'car', '#b3402f', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Shopping', 'Clothing, electronics, and general purchases', 'shopping-bag', '#1a8f5f', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Shopping');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Rent & Housing', 'Rent, mortgage, and home repairs', 'home', '#59645d', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Rent & Housing');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Utilities', 'Electricity, water, gas, internet, and phone', 'zap', '#8b968f', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Utilities');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Healthcare', 'Doctor visits, dental, and prescriptions', 'heart-pulse', '#b3402f', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Entertainment', 'Movies, concerts, streaming, and hobbies', 'film', '#0f6e5c', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Education', 'Tuition, books, and courses', 'book-open', '#c99a44', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Education');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Insurance', 'Health, auto, and life insurance premiums', 'shield', '#1a8f5f', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Insurance');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Personal Care', 'Grooming, gym, salons, and spa', 'scissors', '#59645d', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Personal Care');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Travel', 'Flights, hotels, and vacations', 'plane', '#b3402f', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Travel');

INSERT INTO categories (name, description, icon, color, is_default, is_active, created_at, updated_at)
SELECT 'Miscellaneous', 'Other uncategorized expenses', 'more-horizontal', '#8b968f', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Miscellaneous');
