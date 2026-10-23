import { useNotificationSettings } from '../state/useNotificationSettings';
import { Pressable, Text, View } from 'react-native';
import { Icon } from './ui';
import { useTheme } from '../theme/ThemeProvider';
export default function PaymentNotificationSettings({
  data
}) {
  const {
    styles,
    colors
  } = useTheme();
  const {
    permission,
    busy,
    configure
  } = useNotificationSettings(data);
  return <Pressable accessibilityRole="button" disabled={busy} style={styles.settingRow} onPress={configure}>
    <View style={styles.settingIcon}><Icon name="notifications" size={21} color={colors.gold} /></View>
    <View style={{
      flex: 1
    }}><Text style={styles.fixedName}>Recordatorios de pagos</Text><Text style={styles.fixedHint}>{busy ? 'Actualizando…' : permission === 'granted' ? 'Permiso concedido · 9:00 a. m. · Toca para actualizar' : permission === null ? 'Consultar permisos y actualizar avisos' : 'Desactivados · Toca para activar'}</Text></View>
    <Icon name="chevron-forward" size={20} color={colors.muted} />
  </Pressable>;
}
