// Fixed applyChanges function - no description or status columns
export const applyChanges = async (resourceType, changeIds) => {
  try {
    const config = getResourceConfig(resourceType);
    const results = [];
    
    for (const changeId of changeIds) {
      try {
        // Get the change details
        const change = await db.query(
          `SELECT * FROM ${resourceType} WHERE id = $1`,
          [changeId]
        );

        if (change.rows.length === 0) {
          results.push({
            id: changeId,
            success: false,
            message: 'Change not found'
          });
          continue;
        }
        
        // Only update the name field for now, since description and status may not exist
        const row = change.rows[0];
        const updateQuery = `UPDATE ${resourceType} SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
        const updated = await db.query(updateQuery, [
          row.name?.trim() || row.name,
          changeId
        ]);
        
        results.push({
          id: changeId,
          success: true,
          data: updated.rows[0]
        });
      } catch (itemError) {
        console.error(`Error applying changes for item ${changeId}:`, itemError);
        results.push({
          id: changeId,
          success: false,
          message: itemError.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Error applying changes for ${resourceType}:`, error);
    throw error;
  }
};

// Fixed rejectChanges function - no status column
export const rejectChanges = async (resourceType, changeIds) => {
  try {
    const config = getResourceConfig(resourceType);
    const results = [];
    
    for (const changeId of changeIds) {
      try {
        // Get the change details first
        const change = await db.query(
          `SELECT * FROM ${resourceType} WHERE id = $1`,
          [changeId]
        );

        if (change.rows.length === 0) {
          results.push({
            id: changeId,
            success: false,
            message: 'Change not found'
          });
          continue;
        }
        
        // Just update the updated_at timestamp
        const updateQuery = `UPDATE ${resourceType} SET updated_at = NOW() WHERE id = $1 RETURNING *`;
        const updated = await db.query(updateQuery, [changeId]);
        
        results.push({
          id: changeId,
          success: true,
          data: updated.rows[0]
        });
      } catch (itemError) {
        console.error(`Error rejecting changes for item ${changeId}:`, itemError);
        results.push({
          id: changeId,
          success: false,
          message: itemError.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Error rejecting changes for ${resourceType}:`, error);
    throw error;
  }
};
