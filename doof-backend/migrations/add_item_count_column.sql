-- Migration: Add item_count column and synchronization
-- This adds the missing item_count column and creates triggers to keep it in sync

-- Add the item_count column
ALTER TABLE lists ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lists_item_count ON lists(item_count);

-- Function to update list item count
CREATE OR REPLACE FUNCTION update_list_item_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE lists 
        SET item_count = (
            SELECT COUNT(*) 
            FROM listitems 
            WHERE list_id = NEW.list_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.list_id;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE lists 
        SET item_count = (
            SELECT COUNT(*) 
            FROM listitems 
            WHERE list_id = OLD.list_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.list_id;
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE (if list_id changes)
    IF TG_OP = 'UPDATE' THEN
        -- Update count for old list if list_id changed
        IF OLD.list_id != NEW.list_id THEN
            UPDATE lists 
            SET item_count = (
                SELECT COUNT(*) 
                FROM listitems 
                WHERE list_id = OLD.list_id
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.list_id;
        END IF;
        
        -- Update count for new list
        UPDATE lists 
        SET item_count = (
            SELECT COUNT(*) 
            FROM listitems 
            WHERE list_id = NEW.list_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.list_id;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_list_item_count_insert ON listitems;
DROP TRIGGER IF EXISTS trigger_update_list_item_count_update ON listitems;
DROP TRIGGER IF EXISTS trigger_update_list_item_count_delete ON listitems;

-- Create triggers
CREATE TRIGGER trigger_update_list_item_count_insert
    AFTER INSERT ON listitems
    FOR EACH ROW
    EXECUTE FUNCTION update_list_item_count();

CREATE TRIGGER trigger_update_list_item_count_update
    AFTER UPDATE ON listitems
    FOR EACH ROW
    EXECUTE FUNCTION update_list_item_count();

CREATE TRIGGER trigger_update_list_item_count_delete
    AFTER DELETE ON listitems
    FOR EACH ROW
    EXECUTE FUNCTION update_list_item_count();

-- Initialize all existing lists with correct item counts
UPDATE lists 
SET item_count = (
    SELECT COUNT(*) 
    FROM listitems 
    WHERE listitems.list_id = lists.id
),
updated_at = CURRENT_TIMESTAMP;

-- Log the results
DO $$
DECLARE
    updated_count INTEGER;
    total_items INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count FROM lists;
    SELECT SUM(item_count) INTO total_items FROM lists;
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE 'Updated % lists with accurate item counts', updated_count;
    RAISE NOTICE 'Total items across all lists: %', COALESCE(total_items, 0);
END
$$; 