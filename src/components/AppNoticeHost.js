import { useSyncExternalStore } from 'react';
import AppDialog from './AppDialog';
import { appNotice } from '../services/appNotice';
export default function AppNoticeHost() {
  const notice = useSyncExternalStore(appNotice.subscribe, appNotice.getSnapshot, appNotice.getSnapshot);
  if (!notice) return null;
  const dismiss = () => {
    if (notice.cancelable) appNotice.dismiss(notice.id);
  };
  const run = async action => {
    if (!appNotice.dismiss(notice.id)) return;
    try {
      await action.onPress?.();
    } catch {
      appNotice.show('No se pudo completar la acción', 'Intenta nuevamente. Tus datos no se han borrado.');
    }
  };
  return <AppDialog visible title={notice.title} message={notice.message} onDismiss={dismiss} icon={notice.tone === 'success' ? 'checkmark' : 'notifications'} actions={notice.actions.map(action => ({
    ...action,
    onPress: () => run(action)
  }))} />;
}
