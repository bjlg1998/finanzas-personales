import { NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import { phoneModule } from './nativePhone';
import { createReminderSynchronizer } from './reminderSynchronizer';
export async function configureNotifications() {
  await phoneModule().configureNotifications();
}
export async function requestPaymentNotifications() {
  await configureNotifications();
  if (Number(Platform.Version) >= 33) return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) === PermissionsAndroid.RESULTS.GRANTED;
  return phoneModule().notificationsEnabled();
}
export const paymentNotificationPermission = async () => (await phoneModule().notificationsEnabled()) ? 'granted' : 'denied';
export function observePaymentNotificationResponses(callback) {
  let active = true;
  const deliver = response => {
    if (active && response) callback(response);
  };
  const deliverRaw = raw => {
    let response;
    try {
      response = JSON.parse(raw);
    } catch {
      return;
    }
    deliver(response);
  };
  const subscription = new NativeEventEmitter(phoneModule()).addListener('FinanceNotificationResponse', payload => deliverRaw(payload.responseJson));
  phoneModule().lastNotificationResponse().then(raw => {
    if (raw) deliverRaw(raw);
  }).catch(() => {});
  return () => {
    active = false;
    subscription.remove();
  };
}
export const clearPaymentNotificationResponse = () => phoneModule().clearNotificationResponse();
export const synchronizePaymentNotifications = createReminderSynchronizer({
  configure: configureNotifications,
  list: async () => JSON.parse(await phoneModule().scheduledNotifications()),
  cancel: id => phoneModule().cancelNotification(id),
  hasPermission: () => phoneModule().notificationsEnabled(),
  schedule: item => phoneModule().scheduleNotification(item.key, item.date.getTime(), item.title, item.body, JSON.stringify({
    type: 'payment',
    expenseId: item.expenseId,
    cycleStart: item.cycleStart,
    reminderKey: item.key
  }))
});
