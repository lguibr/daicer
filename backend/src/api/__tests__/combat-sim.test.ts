import express from 'express';
import request from 'supertest';
import combatSimRouter from '../combat-sim';

const app = express();
app.use(express.json());
app.use('/api/combat', combatSimRouter);

describe('Combat Simulation API', () => {
  it('lists available combat simulations', async () => {
    const response = await request(app).get('/api/combat/simulations');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const scenarios = response.body.data as Array<{ id: string; title: string; description: string; focus: string }>;
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThanOrEqual(1);
    expect(scenarios.some((scenario) => scenario.id === 'demo-classic')).toBe(true);
  });

  it('returns deterministic demo simulation data', async () => {
    const response = await request(app).get('/api/combat/simulations/demo-classic');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const simulation = response.body.data;
    expect(simulation.id).toBe('demo-classic');
    expect(simulation.seed).toBe(1337);
    expect(Array.isArray(simulation.steps)).toBe(true);
    expect(simulation.steps.length).toBeGreaterThan(0);

    const firstStep = simulation.steps[0];
    expect(firstStep).toHaveProperty('state');
    expect(firstStep.state.characters.length).toBeGreaterThan(0);
  });

  it('returns 404 for unknown simulations', async () => {
    const response = await request(app).get('/api/combat/simulations/unknown-id');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
