export const adminController = {
  async analyzeDataForCleanup(req: Request, res: Response) {
    try {
      const { resourceType } = req.params;
      const changes = await adminService.analyzeDataForCleanup(resourceType);
      res.json({ changes });
    } catch (error) {
      console.error('[adminController] Error analyzing data:', error);
      res.status(500).json({ error: 'Failed to analyze data' });
    }
  },

  async applyCleanupChanges(req: Request, res: Response) {
    try {
      const { resourceType } = req.params;
      const { changeIds } = req.body;
      const result = await adminService.applyCleanupChanges(resourceType, changeIds);
      res.json(result);
    } catch (error) {
      console.error('[adminController] Error applying changes:', error);
      res.status(500).json({ error: 'Failed to apply changes' });
    }
  },

  async rejectCleanupChanges(req: Request, res: Response) {
    try {
      const { resourceType } = req.params;
      const { changeIds } = req.body;
      const result = await adminService.rejectCleanupChanges(resourceType, changeIds);
      res.json(result);
    } catch (error) {
      console.error('[adminController] Error rejecting changes:', error);
      res.status(500).json({ error: 'Failed to reject changes' });
    }
  }
}; 