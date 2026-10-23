const {
  validateFinanceData,
  migrateFinanceData
} = require('../data/migrations');

// Keep the original key so installed versions retain their existing records.
const STORE_KEY = '@flujo/v1';
const BACKUP_KEY = '@flujo/v1/backup';
function createFinanceRepository(storage) {
  let queue = Promise.resolve();
  let lastValidRaw = null;
  function parse(raw) {
    return validateFinanceData(JSON.parse(raw));
  }
  async function load() {
    const raw = await storage.getItem(STORE_KEY);
    if (!raw) {
      const backup = await storage.getItem(BACKUP_KEY);
      if (backup) {
        lastValidRaw = backup;
        return {
          data: migrateFinanceData(parse(backup)),
          recovered: true
        };
      }
      return {
        data: migrateFinanceData(null),
        recovered: false
      };
    }
    try {
      const parsed = parse(raw);
      lastValidRaw = raw;
      return {
        data: migrateFinanceData(parsed),
        recovered: false
      };
    } catch (error) {
      if (error.code === 'FUTURE_SCHEMA') throw error;
      const backup = await storage.getItem(BACKUP_KEY);
      if (!backup) throw error;
      const parsed = parse(backup);
      lastValidRaw = backup;
      return {
        data: migrateFinanceData(parsed),
        recovered: true
      };
    }
  }
  function save(data) {
    let raw;
    try {
      raw = JSON.stringify(validateFinanceData(data));
    } catch (error) {
      return Promise.reject(error);
    }
    const operation = queue.catch(() => {}).then(async () => {
      if (lastValidRaw && lastValidRaw !== raw) await storage.setItem(BACKUP_KEY, lastValidRaw);
      await storage.setItem(STORE_KEY, raw);
      lastValidRaw = raw;
    });
    queue = operation;
    return operation;
  }
  return {
    load,
    save
  };
}
module.exports = {
  STORE_KEY,
  BACKUP_KEY,
  createFinanceRepository
};
