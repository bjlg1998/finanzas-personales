import TabScrollView from '../components/TabScrollView';
import { appNotice } from '../services/appNotice';
import React, { useState } from 'react';
import SalarySimulatorScreen from './SalarySimulatorScreen';
import { useTheme } from '../theme/ThemeProvider';
import { Pressable, Switch, Text, View } from 'react-native';
import { Header, Icon } from '../components/ui';
import { canUseBiometrics } from '../services/biometrics';
import { formatMoneyInput, money } from '../domain/money';
import PaymentNotificationSettings from '../components/PaymentNotificationSettings';
function SettingsScreen(props) {
  const {
    data,
    setAmount,
    setData,
    setDueDay,
    setSheet
  } = props;
  const {
    styles,
    colors: COLORS
  } = useTheme();
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  return <TabScrollView active={props.isActive} contentContainerStyle={styles.content}>
      <Header title="Ajustes" subtitle="TU ESPACIO PRIVADO" />
      <Pressable style={styles.settingRow} onPress={() => {
      setAmount(formatMoneyInput(data.salary));
      setDueDay(String(data.payDay));
      setSheet('salary');
    }}>
        <View style={styles.settingIcon}><Icon name="cash-outline" size={20} color={COLORS.gold} /></View>
        <View style={{
        flex: 1
      }}><Text style={styles.fixedName}>Sueldo e ingresos extra</Text><Text style={styles.fixedHint}>{money(data.salary)} · Día {data.payDay}{data.extraIncome ? ` · Extra ${money(data.extraIncome)}` : ''}</Text></View>
        <Icon name="chevron-forward" color={COLORS.muted} size={20} />
      </Pressable>
      <View style={styles.settingRow}>
        <View style={styles.settingIcon}><Icon name="finger-print" size={22} color={COLORS.mint} /></View>
        <View style={{
        flex: 1
      }}><Text style={styles.fixedName}>Proteger con huella</Text><Text style={styles.fixedHint}>Usa la seguridad del teléfono</Text></View>
        <Switch value={data.biometric} trackColor={{
        false: '#30455A',
        true: COLORS.mintDark
      }} thumbColor={data.biometric ? COLORS.mint : '#DCE5ED'} onValueChange={async v => {
        if (v) {
          const ok = await canUseBiometrics();
          if (!ok) return appNotice.show('Configura tu huella', 'Primero registra una huella o biometría en los ajustes del teléfono.');
        }
        setData(d => ({
          ...d,
          biometric: v
        }));
      }} />
      </View>
      <PaymentNotificationSettings data={data} />
      <Pressable style={styles.settingRow} onPress={() => setSimulatorOpen(true)} accessibilityRole="button">
        <View style={styles.settingIcon}><Icon name="trending-up" size={22} color={COLORS.mint} /></View>
        <View style={{
        flex: 1
      }}><Text style={styles.fixedName}>Simulador de próximos sueldos</Text><Text style={styles.fixedHint}>Proyecta pagos y cuotas sin cambiar tu plan</Text></View>
        <Icon name="chevron-forward" color={COLORS.muted} size={20} />
      </Pressable>
      <Pressable style={styles.settingRow} onPress={() => setSheet('theme')}>
        <View style={styles.settingIcon}><Icon name="sparkles" size={20} color={COLORS.mint} /></View>
        <View style={{
        flex: 1
      }}><Text style={styles.fixedName}>Tema de color</Text><Text style={styles.fixedHint}>{data.theme.charAt(0).toUpperCase() + data.theme.slice(1)}</Text></View>
        <Icon name="chevron-forward" color={COLORS.muted} size={20} />
      </Pressable>
      <View style={styles.privacy}><Icon name="shield-checkmark" size={20} color={COLORS.mint} /><Text style={styles.privacyText}>Tus datos viven en este teléfono. Finanzas Personales no necesita cuenta ni envía tu información financiera a internet.</Text></View>
      {simulatorOpen && <SalarySimulatorScreen data={data} cycle={props.cycle} onClose={() => setSimulatorOpen(false)} />}
    </TabScrollView>;
}
export default React.memo(SettingsScreen);
