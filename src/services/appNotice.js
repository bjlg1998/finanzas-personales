// Observable queue: usable by persistence and hooks without importing native UI.
function createNoticeCenter() {
  let sequence = 0;
  const queue = [];
  const listeners = new Set();
  const emit = () => listeners.forEach(listener => listener());
  const getSnapshot = () => queue[0] || null;
  return {
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    show(title, message, actions = [{
      text: 'Entendido'
    }], options = {}) {
      const id = ++sequence;
      queue.push({
        id,
        title,
        message,
        actions: actions.length ? actions : [{
          text: 'Entendido'
        }],
        tone: options.tone || 'info',
        cancelable: options.cancelable === true
      });
      emit();
      return id;
    },
    dismiss(id) {
      if (getSnapshot()?.id !== id) return false;
      queue.shift();
      emit();
      return true;
    }
  };
}
const appNotice = createNoticeCenter();
module.exports = {
  appNotice,
  createNoticeCenter
};
