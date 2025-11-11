import { Router, type Request, type Response } from 'express';
import { getSimulationById, listSimulations } from '@/combat/simulations/demoSimulation';
import { logger } from '@/utils/logger';

const router = Router();

router.get('/simulations', (_req: Request, res: Response) => {
  try {
    const scenarios = listSimulations();
    res.json({
      success: true,
      data: scenarios,
    });
  } catch (error) {
    logger.error('Failed to list combat simulations', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list combat simulations',
    });
  }
});

router.get('/simulations/:simulationId', async (req: Request, res: Response) => {
  try {
    const { simulationId } = req.params;

    if (!simulationId) {
      res.status(400).json({
        success: false,
        error: 'Simulation ID is required',
      });
      return;
    }

    const simulation = await getSimulationById(simulationId);

    if (!simulation) {
      res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
      return;
    }

    res.json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    logger.error('Failed to generate combat simulation', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate combat simulation',
    });
  }
});

export default router;
