const {
  reminderSpecs
} = require('../domain/reminders');

/** Serialized, idempotent reconciliation, with an injectable native adapter. */
function createReminderSynchronizer(adapter) {
  let queue = Promise.resolve();
  return function synchronize(data) {
    const task = queue.catch(() => {}).then(async () => {
      await adapter.configure();
      const existing = await adapter.list();
      const desired = reminderSpecs(data, adapter.now ? adapter.now() : new Date());
      const desiredKeys = new Set(desired.map(item => item.key));
      const retained = new Set();
      const legacyIds = new Set(data.fixed.flatMap(item => item.notificationIds || []));
      for (const notification of existing) {
        const meta = notification.content.data || {};
        if (meta.type !== 'payment' && !legacyIds.has(notification.identifier)) continue;
        if (meta.reminderKey && desiredKeys.has(meta.reminderKey) && !retained.has(meta.reminderKey)) retained.add(meta.reminderKey);else await adapter.cancel(notification.identifier);
      }
      if (!(await adapter.hasPermission())) return;
      for (const item of desired) if (!retained.has(item.key)) await adapter.schedule(item);
    });
    queue = task;
    return task;
  };
}
module.exports = {
  createReminderSynchronizer
};
