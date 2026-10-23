import AppDialog from '../AppDialog';
export default function ConfirmationDialog({
  confirmDialog,
  setConfirmDialog
}) {
  return <AppDialog visible={!!confirmDialog} title={confirmDialog?.title} message={confirmDialog?.message} danger={confirmDialog?.danger} icon={confirmDialog?.danger ? 'trash' : 'calendar'} onDismiss={() => setConfirmDialog(null)} actions={[{
    text: confirmDialog?.confirmLabel,
    style: confirmDialog?.danger ? 'destructive' : 'default',
    onPress: confirmDialog?.onConfirm
  }, {
    text: 'Cancelar',
    style: 'cancel',
    onPress: () => setConfirmDialog(null)
  }]} />;
}
