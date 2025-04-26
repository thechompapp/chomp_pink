-- migrations/create_list_items_table.sql
CREATE TABLE IF NOT EXISTS list_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('dish', 'restaurant')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items (list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_item_id ON list_items (item_id);