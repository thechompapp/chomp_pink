-- Migration: Fix item count synchronization
-- This creates triggers to automatically update lists.item_count when listitems are added/removed

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

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_list_item_count_insert ON listitems;
DROP TRIGGER IF EXISTS trigger_update_list_item_count_update ON listitems;
DROP TRIGGER IF EXISTS trigger_update_list_item_count_delete ON listitems;

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

-- Fix existing stale data by recalculating all item counts
UPDATE lists 
SET item_count = (
    SELECT COUNT(*) 
    FROM listitems 
    WHERE listitems.list_id = lists.id
),
updated_at = CURRENT_TIMESTAMP;

-- Log the fix
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated item counts for % lists', updated_count;
END
$$; 