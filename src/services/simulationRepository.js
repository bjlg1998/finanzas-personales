const {
  validateSimulation
} = require('../domain/simulation');
const SIMULATION_KEY = '@flujo/simulations/v1';
function createSimulationRepository(storage) {
  let queue = Promise.resolve();
  return {
    async load() {
      await queue.catch(() => {});
      const raw = await storage.getItem(SIMULATION_KEY);
      return raw === null ? {
        version: 1,
        scenarios: []
      } : validateSimulation(JSON.parse(raw));
    },
    save(data) {
      let raw;
      try {
        raw = JSON.stringify(validateSimulation(data));
      } catch (error) {
        return Promise.reject(error);
      }
      const operation = queue.catch(() => {}).then(() => storage.setItem(SIMULATION_KEY, raw));
      queue = operation;
      return operation;
    }
  };
}
module.exports = {
  SIMULATION_KEY,
  createSimulationRepository
};
