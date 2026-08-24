import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Switch,
  Text, TextInput, View, Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  BarChart3, Bell, Banknote, Car, ChartPie, Check, ChevronRight, CircleEllipsis,
  CalendarDays, Copy, ExternalLink, Fingerprint, Gamepad2, History, Home, Leaf, Plus, ReceiptText,
  Pencil, Settings, ShieldCheck, ShoppingCart, Sparkles, Sun, Trash2, TrendingUp, X
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const STORE_KEY = '@flujo/v1';
const COLORS = {
  bg: '#07111F', card: '#0E1C2C', card2: '#122438', mint: '#82F2BC',
  mintDark: '#1C9E73', gold: '#F4C96B', text: '#F4F7FA', muted: '#8FA3B8',
  danger: '#FF7B86', line: '#1D3247'
};
const THEMES = {
  menta: {
    ...COLORS, mint: '#82F2BC', mintDark: '#1C9E73', gold: '#F4C96B',
    bg: '#07111F', card: '#0E1C2C', card2: '#122438', line: '#1D3247'
  },
  oceano: {
    ...COLORS, mint: '#67D8FF', mintDark: '#147EA5', gold: '#A8C7FF',
    bg: '#06131E', card: '#0B2131', card2: '#102B3D', line: '#174058'
  },
  violeta: {
    ...COLORS, mint: '#C5A3FF', mintDark: '#7750B8', gold: '#FFCA80',
    bg: '#100B1D', card: '#1B1330', card2: '#251A3D', line: '#392858'
  },
  coral: {
    ...COLORS, mint: '#FF9E8F', mintDark: '#B95046', gold: '#FFD37D',
    bg: '#180D12', card: '#27151B', card2: '#341C23', line: '#4D2832'
  }
};

const ICONS = {
  add: Plus, 'bar-chart': BarChart3, calendar: CalendarDays, car: Car, cart: ShoppingCart,
  checkmark: Check, 'chevron-forward': ChevronRight, close: X,
  'finger-print': Fingerprint, 'game-controller': Gamepad2, home: Home,
  leaf: Leaf, notifications: Bell, 'pie-chart': ChartPie, receipt: ReceiptText,
  settings: Settings, shield: ShieldCheck, 'shield-checkmark': ShieldCheck,
  sparkles: Sparkles, sunny: Sun, time: History, 'trending-up': TrendingUp,
  cash: Banknote
  , copy: Copy, edit: Pencil, 'external-link': ExternalLink, trash: Trash2
};

function Icon({ name, size = 24, color = COLORS.text }) {
  const normalized = String(name || '').replace(/-outline$/, '');
  const Glyph = ICONS[normalized] || CircleEllipsis;
  return <Glyph width={size} height={size} color={color} strokeWidth={2.2} />;
}

const seed = {
  salary: 0,
  carry: 0,
  goal: 0,
  biometric: false,
  theme: 'menta',
  fixed: [],
  expenses: [],
  periods: [],
  activeCycleStart: null,
  planningNext: false
};

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
});
const money = (n) => copFormatter.format(Number(n || 0));

const parseMoney = (value) => Number(String(value).replace(/\D/g, '')) || 0;
const formatMoneyInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? new Intl.NumberFormat('es-CO').format(Number(digits)) : '';
};

function cycleFor(date = new Date(), forcedStart = null) {
  if (forcedStart) {
    const start = new Date(forcedStart);
    const nextPayday = new Date(start.getFullYear(), start.getMonth() + 2, 0);
    const end = new Date(nextPayday);
    end.setDate(end.getDate() - 1);
    return { start, end, id: `${start.getFullYear()}-${start.getMonth() + 1}` };
  }
  const y = date.getFullYear();
  const m = date.getMonth();
  const payday = (year, month) => new Date(year, month + 1, 0);
  const thisPayday = payday(y, m);
  const daysToPayday = Math.ceil((thisPayday - date) / 86400000);
  // Up to three days before payday, prepare the next month's budget.
  // During the rest of the month, keep showing the active budget.
  const start = date >= thisPayday || daysToPayday <= 3
    ? thisPayday
    : payday(y, m - 1);
  const nextPayday = payday(start.getFullYear(), start.getMonth() + 1);
  const end = new Date(nextPayday);
  end.setDate(end.getDate() - 1);
  return { start, end, id: `${start.getFullYear()}-${start.getMonth() + 1}` };
}

const shortDate = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
const daysBetween = (a, b) => Math.max(1, Math.ceil((b - a) / 86400000) + 1);

const Header = React.memo(function Header({ title, subtitle }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.eyebrow}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Image source={require('./assets/finanzas-icon-v2.png')} style={styles.logo} />
    </View>
  );
});

const Stat = React.memo(function Stat({ label, value, tone = 'normal' }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'mint' && { color: COLORS.mint }]}>{value}</Text>
    </View>
  );
});

const Empty = React.memo(function Empty({ icon, text }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={28} color={COLORS.muted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
});

function MoneyField({ label, value, onChange, placeholder = '0' }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.moneyInputWrap}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(formatMoneyInput(text))}
          placeholder={placeholder}
          placeholderTextColor="#50677C"
          keyboardType="numeric"
          style={styles.moneyInput}
        />
      </View>
    </View>
  );
}

function Sheet({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.sheetTop}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose}><Icon name="close" size={24} color={COLORS.text} /></Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AppContent() {
  const [data, setData] = useState(seed);
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState('inicio');
  const [sheet, setSheet] = useState(null);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [installmentsTotal, setInstallmentsTotal] = useState('');
  const [installmentsPaid, setInstallmentsPaid] = useState('');
  const [selectedFixed, setSelectedFixed] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [category, setCategory] = useState('Comida');
  const cycle = cycleFor(new Date(), data.activeCycleStart);
  const activeTheme = THEMES[data.theme] || THEMES.menta;
  Object.assign(COLORS, activeTheme);
  styles = createStyles(activeTheme);
  const budgetMonth = new Date(cycle.start.getFullYear(), cycle.start.getMonth() + 1, 1)
    .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  useEffect(() => {
    Notifications.setNotificationChannelAsync('pagos', {
      name: 'Recordatorios de pagos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: COLORS.mint
    });
    AsyncStorage.getItem(STORE_KEY).then(async (raw) => {
      const saved = raw ? { ...seed, ...JSON.parse(raw) } : seed;
      setData(saved);
      setLoaded(true);
      if (saved.biometric) {
        setLocked(true);
        await unlock();
      }
    });
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const unlock = async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    if (!available) {
      Alert.alert('Biometría no disponible', 'Este teléfono no tiene biometría configurada.');
      setLocked(false);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Flujo',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar clave del teléfono'
    });
    setLocked(!result.success);
  };

  const currentExpenses = useMemo(() =>
    data.expenses.filter((e) => e.period === cycle.id), [data.expenses, cycle.id]);
  const variableSpent = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const activeFixed = data.fixed.filter((e) => e.active !== false);
  const fixedTotal = activeFixed.reduce((sum, e) => sum + e.amount, 0);
  const fixedPaidAmount = (e) => Math.min(e.amount, e.paidAmount ?? (e.paid ? e.amount : 0));
  const paidFixed = activeFixed.reduce((sum, e) => sum + fixedPaidAmount(e), 0);
  const available = data.salary + data.carry - fixedTotal - variableSpent - data.goal;
  const totalBase = data.salary + data.carry;
  const usedPct = totalBase ? Math.min(100, ((fixedTotal + variableSpent + data.goal) / totalBase) * 100) : 0;
  const spendingStart = new Date() < cycle.start ? cycle.start : new Date();
  const remainingDays = daysBetween(spendingStart, cycle.end);
  const daily = Math.max(0, available / remainingDays);

  const closeSheet = () => {
    setSheet(null); setAmount(''); setName(''); setDueDay(''); setCategory('Comida');
    setInstallmentsTotal(''); setInstallmentsPaid(''); setSelectedFixed(null); setSelectedExpense(null);
    setPaymentUrl('');
    setPaymentReference('');
  };

  const schedulePaymentReminders = async (expenseName, value, day, cycleStart = cycle.start) => {
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Recordatorios desactivados', 'Puedes activar las notificaciones de Flujo desde los ajustes del teléfono.');
      return [];
    }
    const ids = [];
    const now = new Date();
    const base = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 1);
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const paymentDate = new Date(base.getFullYear(), base.getMonth(), Math.min(day, lastDay), 9, 0, 0);
    for (const daysBefore of [1, 0]) {
      const triggerDate = new Date(paymentDate);
      triggerDate.setDate(triggerDate.getDate() - daysBefore);
      if (triggerDate <= now) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: daysBefore ? `Mañana vence ${expenseName}` : `Hoy vence ${expenseName}`,
          body: `Pago programado por ${money(value)}.`,
          sound: 'default',
          data: { type: 'payment', expenseName, period: `${cycleStart.getFullYear()}-${cycleStart.getMonth() + 1}` }
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate, channelId: 'pagos' }
      });
      ids.push(id);
    }
    return ids;
  };

  const addExpense = () => {
    const value = parseMoney(amount);
    if (!value) return Alert.alert('Falta el valor', 'Escribe cuánto gastaste.');
    setData((d) => ({
      ...d,
      expenses: [{
        id: Date.now().toString(), amount: value, name: name || category,
        category, date: new Date().toISOString(), period: cycle.id
      }, ...d.expenses]
    }));
    closeSheet();
  };

  const openExpenseEditor = (item) => {
    setSelectedExpense(item);
    setAmount(formatMoneyInput(item.amount));
    setName(item.name || '');
    setCategory(item.category || 'Otros');
    setSheet('editExpense');
  };

  const updateExpense = () => {
    const value = parseMoney(amount);
    if (!selectedExpense || !value) return Alert.alert('Falta el valor', 'Escribe cuánto gastaste.');
    setData((d) => ({
      ...d,
      expenses: d.expenses.map((item) => item.id === selectedExpense.id
        ? { ...item, amount: value, name: name.trim() || category, category }
        : item)
    }));
    closeSheet();
  };

  const addFixed = async () => {
    const value = parseMoney(amount);
    const day = Number(dueDay);
    const totalInstallments = Number(installmentsTotal) || 0;
    const alreadyPaid = Number(installmentsPaid) || 0;
    if (!value || !name.trim() || day < 1 || day > 31) {
      return Alert.alert('Completa los datos', 'Agrega nombre, valor y un día de pago entre 1 y 31.');
    }
    if (totalInstallments && alreadyPaid >= totalInstallments) {
      return Alert.alert('Revisa las cuotas', 'Las cuotas pagadas deben ser menores al total.');
    }
    const notificationIds = await schedulePaymentReminders(name.trim(), value, day);
    setData((d) => ({
      ...d, fixed: [...d.fixed, {
        id: Date.now().toString(), name: name.trim(), amount: value,
        dueDay: day, paid: false, paidAmount: 0, notificationIds, active: true,
        installmentsTotal: totalInstallments, installmentsPaid: alreadyPaid,
        installmentAdvanced: false, paymentUrl: paymentUrl.trim(),
        paymentReference: paymentReference.trim()
      }]
    }));
    closeSheet();
  };

  const openFixedEditor = () => {
    if (!selectedFixed) return;
    setName(selectedFixed.name || '');
    setAmount(formatMoneyInput(selectedFixed.amount));
    setDueDay(String(selectedFixed.dueDay || ''));
    setInstallmentsTotal(selectedFixed.installmentsTotal ? String(selectedFixed.installmentsTotal) : '');
    setInstallmentsPaid(selectedFixed.installmentsPaid ? String(selectedFixed.installmentsPaid) : '');
    setPaymentUrl(selectedFixed.paymentUrl || '');
    setPaymentReference(selectedFixed.paymentReference || '');
    setSheet('editFixed');
  };

  const updateFixed = async () => {
    const value = parseMoney(amount);
    const day = Number(dueDay);
    const totalInstallments = Number(installmentsTotal) || 0;
    const alreadyPaid = Number(installmentsPaid) || 0;
    if (!selectedFixed || !value || !name.trim() || day < 1 || day > 31) {
      return Alert.alert('Completa los datos', 'Agrega nombre, valor y un día de pago entre 1 y 31.');
    }
    if (totalInstallments && alreadyPaid >= totalInstallments) {
      return Alert.alert('Revisa las cuotas', 'Las cuotas pagadas deben ser menores al total.');
    }
    await Promise.all((selectedFixed.notificationIds || []).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    ));
    const notificationIds = selectedFixed.active === false
      ? []
      : await schedulePaymentReminders(name.trim(), value, day);
    setData((d) => ({
      ...d,
      fixed: d.fixed.map((item) => item.id === selectedFixed.id ? {
        ...item, name: name.trim(), amount: value, dueDay: day,
        paidAmount: Math.min(item.paidAmount || 0, value),
        paid: (item.paidAmount || 0) >= value,
        installmentsTotal: totalInstallments, installmentsPaid: alreadyPaid,
        paymentUrl: paymentUrl.trim(), paymentReference: paymentReference.trim(), notificationIds
      } : item)
    }));
    closeSheet();
  };

  const saveSetup = () => {
    const value = parseMoney(amount);
    if (!value) return Alert.alert('Falta tu sueldo', 'Ingresa el sueldo del período.');
    setData((d) => ({ ...d, salary: value }));
    closeSheet();
  };

  const openFixedPayment = (item) => {
    setSelectedFixed(item);
    setAmount('');
    setSheet('payFixed');
  };

  const toggleFixedActive = async (item, enabled) => {
    await Promise.all((item.notificationIds || []).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    ));
    const notificationIds = enabled
      ? await schedulePaymentReminders(item.name, item.amount, item.dueDay)
      : [];
    setData((d) => ({
      ...d,
      fixed: d.fixed.map((x) => x.id === item.id
        ? { ...x, active: enabled, notificationIds, paid: false, paidAmount: 0, installmentAdvanced: false }
        : x)
    }));
    setSelectedFixed((current) => current?.id === item.id
      ? { ...current, active: enabled, notificationIds, paid: false, paidAmount: 0, installmentAdvanced: false }
      : current);
  };

  const addFixedPayment = () => {
    const value = parseMoney(amount);
    if (!selectedFixed || !value) return Alert.alert('Falta el abono', 'Ingresa el valor que pagaste.');
    const currentPaid = fixedPaidAmount(selectedFixed);
    const remaining = Math.max(0, selectedFixed.amount - currentPaid);
    if (value > remaining) return Alert.alert('El abono supera el pendiente', `El saldo restante es ${money(remaining)}.`);
    setData((d) => ({
      ...d,
      fixed: d.fixed.map((x) => {
        if (x.id !== selectedFixed.id) return x;
        const newPaid = currentPaid + value;
        const completed = newPaid >= x.amount;
        const shouldAdvance = completed && x.installmentsTotal && !x.installmentAdvanced;
        return {
          ...x, paidAmount: newPaid, paid: completed,
          installmentsPaid: Math.min(x.installmentsTotal || 0, (x.installmentsPaid || 0) + (shouldAdvance ? 1 : 0)),
          installmentAdvanced: Boolean(shouldAdvance || x.installmentAdvanced)
        };
      })
    }));
    closeSheet();
  };

  const openPaymentUrl = async (rawUrl) => {
    if (!rawUrl) return;
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('No se pudo abrir el enlace', 'Revisa que la dirección esté escrita correctamente.');
    }
  };

  const copyPaymentReference = async (reference) => {
    await Clipboard.setStringAsync(reference);
    Alert.alert('Referencia copiada', 'Ya puedes pegarla en la página o aplicación de pago.');
  };

  const deleteFixed = () => {
    if (!selectedFixed) return;
    setConfirmDialog({
      title: 'Eliminar gasto fijo',
      message: `Se eliminará ${selectedFixed.name} y también se cancelarán sus recordatorios.`,
      confirmLabel: 'Sí, eliminar', danger: true,
      onConfirm: async () => {
          await Promise.all((selectedFixed.notificationIds || []).map((id) =>
            Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
          ));
          setData((d) => ({ ...d, fixed: d.fixed.filter((x) => x.id !== selectedFixed.id) }));
          setConfirmDialog(null);
          closeSheet();
      }
    });
  };

  const removeExpense = (id) => setConfirmDialog({
    title: 'Eliminar movimiento',
    message: 'Este gasto desaparecerá del período y el dinero volverá a tu disponible.',
    confirmLabel: 'Eliminar gasto', danger: true,
    onConfirm: () => {
      setData((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) }));
      setConfirmDialog(null);
    }
  });

  const endPeriod = () => setConfirmDialog({
    title: 'Cerrar y planificar el siguiente',
    message: `Guardaremos este período y ${money(Math.max(0, available))} pasarán al siguiente. Tus gastos fijos quedarán disponibles, pero desactivados para que elijas cuáles incluir.`,
    confirmLabel: 'Cerrar período',
    onConfirm: async () => {
      await Promise.all(data.fixed.flatMap((item) => (item.notificationIds || []).map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
      )));
      const nextStart = new Date(cycle.start.getFullYear(), cycle.start.getMonth() + 2, 0);
      setData((d) => ({
        ...d,
        carry: Math.max(0, available),
        activeCycleStart: nextStart.toISOString(),
        planningNext: true,
        periods: [{
          id: `${cycle.id}-${Date.now()}`, label: `${shortDate(cycle.start)} — ${shortDate(cycle.end)}`,
          income: totalBase, spent: fixedTotal + variableSpent, saved: Math.max(0, available) + d.goal,
          fixed: d.fixed.map((x) => ({ name: x.name, amount: x.amount, paidAmount: fixedPaidAmount(x), active: x.active !== false }))
        }, ...d.periods],
        fixed: d.fixed.map((x) => ({
          ...x, active: false, paid: false, paidAmount: 0, installmentAdvanced: false, notificationIds: []
        }))
      }));
      setConfirmDialog(null);
      setTab('plan');
    }
  });

  if (!loaded) return <View style={styles.center}><Image source={require('./assets/finanzas-icon-v2.png')} style={styles.splashLogo} /></View>;
  if (locked) return (
    <SafeAreaView style={styles.lock}>
      <Image source={require('./assets/finanzas-icon-v2.png')} style={styles.lockLogo} />
      <Text style={styles.lockTitle}>Tu dinero, solo tuyo.</Text>
      <Text style={styles.lockText}>Flujo está protegido con la seguridad de tu teléfono.</Text>
      <Pressable style={styles.primaryButton} onPress={unlock}>
        <Icon name="finger-print" size={22} color={COLORS.bg} />
        <Text style={styles.primaryText}>Desbloquear</Text>
      </Pressable>
    </SafeAreaView>
  );

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="Tu flujo" subtitle={`PRESUPUESTO DE ${budgetMonth} · ${shortDate(cycle.start)} — ${shortDate(cycle.end)}`} />
      {!data.salary ? (
        <Pressable style={styles.welcome} onPress={() => setSheet('salary')}>
          <View style={styles.welcomeIcon}><Icon name="sparkles" size={22} color={COLORS.gold} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Comienza con tu sueldo</Text>
            <Text style={styles.welcomeText}>Configura el dinero que recibiste para organizar este período.</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.muted} />
        </Pressable>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>DISPONIBLE HASTA EL {cycle.end.getDate()}</Text>
            <Text style={styles.heroAmount}>{money(available)}</Text>
            <View style={styles.progressBg}><View style={[styles.progress, { width: `${usedPct}%` }]} /></View>
            <View style={styles.heroFoot}>
              <Text style={styles.heroFootText}>{Math.round(usedPct)}% asignado</Text>
              <Text style={styles.heroFootText}>{remainingDays} días restantes</Text>
            </View>
          </View>
          <View style={styles.dailyCard}>
            <View style={styles.dailyIcon}><Icon name="sunny-outline" size={24} color={COLORS.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyLabel}>{new Date() < cycle.start ? `Presupuesto diario desde el ${shortDate(cycle.start)}` : 'Puedes gastar hoy'}</Text>
              <Text style={styles.dailyAmount}>{money(daily)}</Text>
              <Text style={styles.dailyHint}>Disponible ÷ {remainingDays} días, después de gastos fijos y ahorro.</Text>
            </View>
            <View style={styles.pill}><Text style={styles.pillText}>EN RITMO</Text></View>
          </View>
          <View style={styles.row}>
            <Stat label="Pagos pendientes" value={`${activeFixed.filter((x) => !x.paid).length}`} />
            <Stat label="Gastado este período" value={money(variableSpent)} />
          </View>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Resumen del período</Text>
            <Pressable onPress={() => setTab('plan')}><Text style={styles.link}>Ver plan</Text></Pressable>
          </View>
          <View style={styles.summaryCard}>
            {[
              ['Gastos fijos', fixedTotal, 'home-outline', COLORS.gold],
              ['Gastos variables', variableSpent, 'cart-outline', COLORS.danger],
              ['Meta de ahorro', data.goal, 'leaf-outline', COLORS.mint]
            ].map(([label, val, icon, color], index) => (
              <Pressable style={styles.summaryRow} key={label} onPress={() => setTab(index === 1 ? 'moves' : 'plan')}>
                <View style={[styles.smallIcon, { backgroundColor: color + '18' }]}><Icon name={icon} size={18} color={color} /></View>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{money(val)}</Text>
                <Icon name="chevron-forward" size={16} color={COLORS.muted} />
              </Pressable>
            ))}
          </View>
        </>
      )}
      <View style={{ height: 110 }} />
    </ScrollView>
  );

  const renderPlan = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="Mi plan" subtitle="DINERO CON PROPÓSITO" />
      <View style={styles.planHero}>
        <Text style={styles.planHeroLabel}>COMPROMETIDO</Text>
        <Text style={styles.planHeroValue}>{money(fixedTotal + data.goal)}</Text>
        <Text style={styles.planHeroSub}>de {money(totalBase)} disponibles</Text>
      </View>
      <View style={styles.sectionTop}>
        <Text style={styles.sectionTitle}>Gastos fijos</Text>
        <Pressable style={styles.addMini} onPress={() => setSheet('fixed')}>
          <Icon name="add" size={18} color={COLORS.bg} /><Text style={styles.addMiniText}>Agregar</Text>
        </Pressable>
      </View>
      {data.planningNext && (
        <View style={styles.planningNote}>
          <Icon name="calendar" size={21} color={COLORS.mint} />
          <Text style={styles.planningNoteText}>Estás preparando {budgetMonth}. Activa solo los gastos que quieras incluir; puedes abrir cualquiera para modificarlo.</Text>
        </View>
      )}
      {!data.fixed.length ? <Empty icon="home-outline" text="Agrega arriendo, servicios, cuotas y suscripciones." /> :
        <View style={styles.summaryCard}>
          {data.fixed.map((item) => {
            const isActive = item.active !== false;
            const itemPaid = fixedPaidAmount(item);
            const remaining = Math.max(0, item.amount - itemPaid);
            const completed = remaining === 0;
            const installmentsLeft = item.installmentsTotal
              ? Math.max(0, item.installmentsTotal - (item.installmentsPaid || 0))
              : null;
            return (
            <Pressable key={item.id} style={[styles.fixedRow, !isActive && styles.fixedRowInactive]} onPress={() => openFixedPayment(item)}>
              <View style={[styles.check, isActive && completed && styles.checkOn]}>
                {isActive && completed && <Icon name="checkmark" size={15} color={COLORS.bg} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fixedName, isActive && completed && styles.done, !isActive && styles.inactiveText]}>{item.name}</Text>
                <Text style={styles.fixedHint}>{!isActive ? `Desactivado · vence el ${item.dueDay || '—'}` : completed ? 'Pagado' : `${money(itemPaid)} abonados · vence el ${item.dueDay || '—'}`}</Text>
                {installmentsLeft !== null && <Text style={styles.installmentText}>{installmentsLeft} cuotas pendientes</Text>}
              </View>
              {data.planningNext ? (
                <Switch value={isActive} onValueChange={(enabled) => toggleFixedActive(item, enabled)} trackColor={{ false: COLORS.line, true: COLORS.mintDark }} thumbColor={isActive ? COLORS.mint : COLORS.muted} />
              ) : (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryValue}>{money(remaining)}</Text>
                  <Text style={styles.remainingLabel}>restante</Text>
                </View>
              )}
            </Pressable>
          )})}
          <Text style={styles.paidLine}>{money(paidFixed)} pagados de {money(fixedTotal)}</Text>
        </View>
      }
      <Text style={[styles.sectionTitle, { marginTop: 26, marginBottom: 12 }]}>Meta de ahorro</Text>
      <Pressable style={styles.goalCard} onPress={() => { setAmount(formatMoneyInput(data.goal)); setSheet('goal'); }}>
        <View style={styles.goalIcon}><Icon name="leaf" size={22} color={COLORS.mint} /></View>
        <View style={{ flex: 1 }}><Text style={styles.fixedName}>Mi colchón</Text><Text style={styles.fixedHint}>Separado antes de gastar</Text></View>
        <Text style={styles.goalValue}>{money(data.goal)}</Text>
      </Pressable>
      <Pressable style={styles.outlineButton} onPress={endPeriod}><Text style={styles.outlineText}>Cerrar período y pasar saldo</Text></Pressable>
      <View style={{ height: 110 }} />
    </ScrollView>
  );

  const renderMoves = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="Movimientos" subtitle="LO QUE HA PASADO" />
      <View style={styles.filterRow}>
        <View style={styles.activeFilter}><Text style={styles.activeFilterText}>Este período</Text></View>
        <Text style={styles.filterText}>{currentExpenses.length} movimientos</Text>
      </View>
      {!currentExpenses.length ? <Empty icon="receipt-outline" text="Aún no tienes gastos variables en este período." /> :
        currentExpenses.map((item) => (
          <Pressable key={item.id} style={styles.move} onPress={() => openExpenseEditor(item)} onLongPress={() => removeExpense(item.id)}>
            <View style={styles.moveIcon}><Icon name={item.category === 'Transporte' ? 'car-outline' : item.category === 'Ocio' ? 'game-controller-outline' : 'cart-outline'} size={20} color={COLORS.mint} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fixedName}>{item.name}</Text>
              <Text style={styles.fixedHint}>{item.category} · {new Date(item.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</Text>
            </View>
            <Text style={styles.expenseValue}>−{money(item.amount)}</Text>
            <Pressable style={styles.deleteMini} onPress={() => removeExpense(item.id)}>
              <Icon name="trash" size={18} color={COLORS.danger} />
            </Pressable>
          </Pressable>
        ))
      }
      <View style={{ height: 110 }} />
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="Historial" subtitle="TU PROGRESO" />
      <View style={styles.insight}>
        <Icon name="trending-up" size={24} color={COLORS.mint} />
        <View style={{ flex: 1 }}><Text style={styles.insightTitle}>Construye tu tendencia</Text><Text style={styles.insightText}>Al cerrar cada período verás cuánto gastaste, ahorraste y pasaste al mes siguiente.</Text></View>
      </View>
      {!data.periods.length ? <Empty icon="bar-chart-outline" text="Tu primer resumen aparecerá cuando cierres el período." /> :
        data.periods.map((p) => (
          <View key={p.id} style={styles.periodCard}>
            <Text style={styles.periodLabel}>{p.label}</Text>
            <View style={styles.periodStats}>
              <Stat label="Ingresos" value={money(p.income)} />
              <Stat label="Gastado" value={money(p.spent)} />
            </View>
            <View style={styles.savedLine}><Text style={styles.savedLabel}>Ahorrado y trasladado</Text><Text style={styles.savedValue}>{money(p.saved)}</Text></View>
          </View>
        ))
      }
      <View style={{ height: 110 }} />
    </ScrollView>
  );

  const renderCalendar = () => {
    const monthDate = new Date(cycle.start.getFullYear(), cycle.start.getMonth() + 1, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const today = new Date();
    const todayInCalendar = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;
    const billsByDay = activeFixed.reduce((acc, item) => {
      const day = Math.min(item.dueDay || 1, daysInMonth);
      (acc[day] ||= []).push(item);
      return acc;
    }, {});
    const upcoming = [...activeFixed].sort((a, b) => (a.dueDay || 32) - (b.dueDay || 32));
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Calendario" subtitle={`PAGOS DE ${budgetMonth}`} />
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>{['L','M','M','J','V','S','D'].map((d, i) => <Text key={`${d}-${i}`} style={styles.weekDay}>{d}</Text>)}</View>
          <View style={styles.calendarGrid}>
            {Array.from({ length: mondayOffset }).map((_, i) => <View key={`blank-${i}`} style={styles.dayCell} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <View key={day} style={[styles.dayCell, billsByDay[day]?.length && styles.dayCellDue, todayInCalendar === day && styles.dayCellToday]}>
                <Text style={[styles.dayNumber, billsByDay[day]?.length && styles.dayNumberDue, todayInCalendar === day && styles.dayNumberToday]}>{day}</Text>
                {!!billsByDay[day]?.length && <View style={styles.calendarDot} />}
              </View>
            ))}
          </View>
        </View>
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Próximos pagos</Text>
        {!upcoming.length ? <Empty icon="calendar" text="Agrega gastos fijos para ver sus fechas en el calendario." /> : upcoming.map((item) => {
          const remaining = Math.max(0, item.amount - fixedPaidAmount(item));
          return <Pressable key={item.id} style={styles.calendarBill} onPress={() => openFixedPayment(item)}>
            <View style={styles.calendarDate}><Text style={styles.calendarDateDay}>{item.dueDay}</Text><Text style={styles.calendarDateMonth}>{monthDate.toLocaleDateString('es-CO',{month:'short'}).toUpperCase()}</Text></View>
            <View style={{flex:1}}><Text style={styles.fixedName}>{item.name}</Text><Text style={styles.fixedHint}>{remaining ? `${money(remaining)} pendientes` : 'Pagado'}</Text></View>
            <Icon name="chevron-forward" size={19} color={COLORS.muted} />
          </Pressable>;
        })}
        <View style={{height:110}} />
      </ScrollView>
    );
  };

  const renderSettings = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Ajustes" subtitle="TU ESPACIO PRIVADO" />
      <Pressable style={styles.settingRow} onPress={() => { setAmount(formatMoneyInput(data.salary)); setSheet('salary'); }}>
        <View style={styles.settingIcon}><Icon name="cash-outline" size={20} color={COLORS.gold} /></View>
        <View style={{ flex: 1 }}><Text style={styles.fixedName}>Sueldo mensual</Text><Text style={styles.fixedHint}>{money(data.salary)}</Text></View>
        <Icon name="chevron-forward" color={COLORS.muted} size={20} />
      </Pressable>
      <View style={styles.settingRow}>
        <View style={styles.settingIcon}><Icon name="finger-print" size={22} color={COLORS.mint} /></View>
        <View style={{ flex: 1 }}><Text style={styles.fixedName}>Proteger con huella</Text><Text style={styles.fixedHint}>Usa la seguridad del teléfono</Text></View>
        <Switch
          value={data.biometric}
          trackColor={{ false: '#30455A', true: COLORS.mintDark }}
          thumbColor={data.biometric ? COLORS.mint : '#DCE5ED'}
          onValueChange={async (v) => {
            if (v) {
              const ok = await LocalAuthentication.hasHardwareAsync();
              const enrolled = await LocalAuthentication.isEnrolledAsync();
              if (!ok || !enrolled) return Alert.alert('Configura tu huella', 'Primero registra una huella o biometría en los ajustes del teléfono.');
            }
            setData((d) => ({ ...d, biometric: v }));
          }}
        />
      </View>
      <Pressable style={styles.settingRow} onPress={() => setSheet('theme')}>
        <View style={styles.settingIcon}><Icon name="sparkles" size={20} color={COLORS.mint} /></View>
        <View style={{ flex: 1 }}><Text style={styles.fixedName}>Tema de color</Text><Text style={styles.fixedHint}>{data.theme.charAt(0).toUpperCase() + data.theme.slice(1)}</Text></View>
        <Icon name="chevron-forward" color={COLORS.muted} size={20} />
      </Pressable>
      <View style={styles.privacy}><Icon name="shield-checkmark" size={20} color={COLORS.mint} /><Text style={styles.privacyText}>Tus datos viven en este teléfono. Finanzas Personales no necesita cuenta ni envía tu información financiera a internet.</Text></View>
    </ScrollView>
  );

  const screens = { inicio: renderHome, plan: renderPlan, moves: renderMoves, calendar: renderCalendar, history: renderHistory, settings: renderSettings };

  return (
    <View style={styles.app}>
      {screens[tab]()}
      <View style={styles.nav}>
        {[
          ['inicio', 'home', 'Inicio'], ['plan', 'pie-chart', 'Plan'],
          ['calendar', 'calendar', 'Calendario'], ['history', 'time', 'Historial'], ['settings', 'settings', 'Ajustes']
        ].map(([key, icon, label]) => (
          <Pressable key={key} style={styles.navItem} onPress={() => setTab(key)}>
            <Icon name={tab === key ? icon : `${icon}-outline`} size={22} color={tab === key ? COLORS.mint : COLORS.muted} />
            <Text style={[styles.navLabel, tab === key && styles.navLabelOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab !== 'settings' && (
        <Pressable style={styles.fab} onPress={() => setSheet('expense')}>
          <Icon name="add" size={30} color={COLORS.bg} />
        </Pressable>
      )}

      <Sheet visible={sheet === 'expense' || sheet === 'editExpense'} onClose={closeSheet} title={sheet === 'editExpense' ? "Editar gasto" : "Registrar gasto"}>
        <MoneyField label="¿Cuánto gastaste?" value={amount} onChange={setAmount} />
        <Text style={styles.inputLabel}>Descripción opcional</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ej. Almuerzo" placeholderTextColor="#50677C" style={styles.textInput} />
        <Text style={styles.inputLabel}>Categoría</Text>
        <View style={styles.chips}>
          {['Comida', 'Transporte', 'Ocio', 'Otros'].map((c) => <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}><Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text></Pressable>)}
        </View>
        <Pressable style={styles.primaryButton} onPress={sheet === 'editExpense' ? updateExpense : addExpense}><Text style={styles.primaryText}>{sheet === 'editExpense' ? 'Guardar cambios' : 'Guardar gasto'}</Text></Pressable>
      </Sheet>
      <Sheet visible={sheet === 'fixed' || sheet === 'editFixed'} onClose={closeSheet} title={sheet === 'editFixed' ? "Editar gasto fijo" : "Nuevo gasto fijo"}>
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ej. Arriendo" placeholderTextColor="#50677C" style={styles.textInput} />
        <MoneyField label="Valor mensual" value={amount} onChange={setAmount} />
        <Text style={styles.inputLabel}>Día de pago</Text>
        <TextInput
          value={dueDay}
          onChangeText={(v) => setDueDay(v.replace(/\D/g, '').slice(0, 2))}
          placeholder="Ej. 15"
          placeholderTextColor="#50677C"
          keyboardType="number-pad"
          maxLength={2}
          style={styles.textInput}
        />
        <Text style={styles.inputLabel}>Cuotas totales (opcional)</Text>
        <TextInput
          value={installmentsTotal}
          onChangeText={(v) => setInstallmentsTotal(v.replace(/\D/g, '').slice(0, 3))}
          placeholder="Ej. 12"
          placeholderTextColor="#50677C"
          keyboardType="number-pad"
          style={styles.textInput}
        />
        {!!installmentsTotal && <>
          <Text style={styles.inputLabel}>Cuotas que ya pagaste</Text>
          <TextInput
            value={installmentsPaid}
            onChangeText={(v) => setInstallmentsPaid(v.replace(/\D/g, '').slice(0, 3))}
            placeholder="Ej. 3"
            placeholderTextColor="#50677C"
            keyboardType="number-pad"
            style={styles.textInput}
          />
        </>}
        <Text style={styles.inputLabel}>Enlace para pagar (opcional)</Text>
        <TextInput
          value={paymentUrl}
          onChangeText={setPaymentUrl}
          placeholder="Ej. https://pagos.empresa.com"
          placeholderTextColor="#50677C"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.textInput}
        />
        <Text style={styles.inputLabel}>Referencia de pago (opcional)</Text>
        <TextInput
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Ej. 1045872639"
          placeholderTextColor="#50677C"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.textInput}
        />
        <View style={styles.reminderNote}>
          <Icon name="notifications-outline" size={19} color={COLORS.gold} />
          <Text style={styles.reminderText}>Te avisaré a las 9:00 a. m. un día antes y el mismo día. Si eliges 31, en meses más cortos usaré el último día.</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={sheet === 'editFixed' ? updateFixed : addFixed}><Text style={styles.primaryText}>{sheet === 'editFixed' ? 'Guardar cambios' : 'Agregar al plan'}</Text></Pressable>
      </Sheet>
      <Sheet visible={sheet === 'payFixed'} onClose={closeSheet} title={selectedFixed?.active === false ? selectedFixed.name : selectedFixed ? `Abonar a ${selectedFixed.name}` : 'Registrar abono'}>
        {selectedFixed && <>
          {selectedFixed.active === false && (
            <View style={styles.activationRow}>
              <View style={{ flex: 1 }}><Text style={styles.fixedName}>Incluir en {budgetMonth}</Text><Text style={styles.fixedHint}>Al activarlo contará en tu presupuesto y se crearán sus avisos.</Text></View>
              <Switch value={false} onValueChange={() => toggleFixedActive(selectedFixed, true)} trackColor={{ false: COLORS.line, true: COLORS.mintDark }} thumbColor={COLORS.muted} />
            </View>
          )}
          <View style={styles.paymentSummary}>
            <Stat label="Valor total" value={money(selectedFixed.amount)} />
            <Stat label="Pendiente" value={money(Math.max(0, selectedFixed.amount - fixedPaidAmount(selectedFixed)))} />
          </View>
          {selectedFixed.active !== false && <>
            <MoneyField label="¿Cuánto pagaste?" value={amount} onChange={setAmount} />
            <Text style={styles.sheetNote}>Puedes registrar varios abonos hasta completar el gasto. El saldo seguirá visible como pendiente.</Text>
          </>}
          {!!selectedFixed.paymentReference && (
            <View style={styles.referenceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.referenceLabel}>REFERENCIA DE PAGO</Text>
                <Text style={styles.referenceValue} selectable>{selectedFixed.paymentReference}</Text>
              </View>
              <Pressable style={styles.copyButton} onPress={() => copyPaymentReference(selectedFixed.paymentReference)}>
                <Icon name="copy" size={18} color={COLORS.mint} />
                <Text style={styles.copyText}>Copiar</Text>
              </Pressable>
            </View>
          )}
          {!!selectedFixed.paymentUrl && (
            <Pressable style={styles.payLinkButton} onPress={() => openPaymentUrl(selectedFixed.paymentUrl)}>
              <Icon name="external-link" size={19} color={COLORS.bg} />
              <Text style={styles.primaryText}>Ir a pagar</Text>
            </Pressable>
          )}
          <Pressable style={styles.editButton} onPress={openFixedEditor}>
            <Icon name="edit" size={18} color={COLORS.mint} />
            <Text style={styles.editButtonText}>Editar gasto fijo</Text>
          </Pressable>
          {selectedFixed.active !== false && <Pressable style={styles.primaryButton} onPress={addFixedPayment}><Text style={styles.primaryText}>Guardar abono</Text></Pressable>}
          <Pressable style={styles.deleteButton} onPress={deleteFixed}>
            <Icon name="trash" size={18} color={COLORS.danger} />
            <Text style={styles.deleteButtonText}>Eliminar gasto fijo</Text>
          </Pressable>
        </>}
      </Sheet>
      <Sheet visible={sheet === 'theme'} onClose={closeSheet} title="Elige tus colores">
        <View style={styles.themeGrid}>
          {Object.entries(THEMES).map(([key, palette]) => (
            <Pressable key={key} style={[styles.themeOption, data.theme === key && { borderColor: palette.mint }]} onPress={() => { setData((d) => ({ ...d, theme: key })); closeSheet(); }}>
              <View style={[styles.themeSwatch, { backgroundColor: palette.bg }]}>
                <View style={[styles.themeDot, { backgroundColor: palette.mint }]} />
                <View style={[styles.themeDot, { backgroundColor: palette.gold }]} />
              </View>
              <Text style={styles.themeName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
      <Modal visible={!!confirmDialog} transparent animationType="fade" onRequestClose={() => setConfirmDialog(null)}>
        <Pressable style={styles.confirmOverlay} onPress={() => setConfirmDialog(null)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <View style={[styles.confirmIcon, confirmDialog?.danger && styles.confirmIconDanger]}><Icon name={confirmDialog?.danger ? "trash" : "calendar"} size={25} color={confirmDialog?.danger ? COLORS.danger : COLORS.mint} /></View>
            <Text style={styles.confirmTitle}>{confirmDialog?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmDialog?.message}</Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancel} onPress={() => setConfirmDialog(null)}><Text style={styles.confirmCancelText}>Cancelar</Text></Pressable>
              <Pressable style={[styles.confirmAccept, confirmDialog?.danger && styles.confirmAcceptDanger]} onPress={confirmDialog?.onConfirm}><Text style={styles.confirmAcceptText}>{confirmDialog?.confirmLabel}</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Sheet visible={sheet === 'salary'} onClose={closeSheet} title="Tu sueldo">
        <MoneyField label="¿Cuánto recibes cada período?" value={amount} onChange={setAmount} />
        <Text style={styles.sheetNote}>Este pago financiará {budgetMonth}. El período va del {shortDate(cycle.start)} al {shortDate(cycle.end)}. Si un mes no tiene día 31, se usa el último día disponible.</Text>
        <Pressable style={styles.primaryButton} onPress={saveSetup}><Text style={styles.primaryText}>Guardar sueldo</Text></Pressable>
      </Sheet>
      <Sheet visible={sheet === 'goal'} onClose={closeSheet} title="Meta de ahorro">
        <MoneyField label="¿Cuánto quieres separar?" value={amount} onChange={setAmount} />
        <Text style={styles.sheetNote}>Este dinero se descuenta del disponible para ayudarte a no gastarlo.</Text>
        <Pressable style={styles.primaryButton} onPress={() => { setData((d) => ({ ...d, goal: parseMoney(amount) })); closeSheet(); }}><Text style={styles.primaryText}>Guardar meta</Text></Pressable>
      </Sheet>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="light" />
        <AppContent />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

let styles = createStyles(COLORS);
function createStyles(colors) {
  Object.assign(COLORS, colors);
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  app: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  splashLogo: { width: 100, height: 100, borderRadius: 26 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  eyebrow: { color: COLORS.mint, fontSize: 11, letterSpacing: 1.7, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  logo: { width: 44, height: 44, borderRadius: 14 },
  hero: { backgroundColor: COLORS.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: COLORS.line },
  heroLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  heroAmount: { color: COLORS.text, fontSize: 37, fontWeight: '800', letterSpacing: -1.5, marginVertical: 14 },
  progressBg: { height: 7, borderRadius: 9, backgroundColor: '#22384C', overflow: 'hidden' },
  progress: { height: 7, borderRadius: 9, backgroundColor: COLORS.mint },
  heroFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  heroFootText: { color: COLORS.muted, fontSize: 12 },
  dailyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10253A', borderRadius: 18, padding: 16, marginTop: 12 },
  dailyIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F4C96B18', marginRight: 12 },
  dailyLabel: { color: COLORS.muted, fontSize: 12 },
  dailyAmount: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  dailyHint: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 4, maxWidth: 230 },
  pill: { backgroundColor: '#82F2BC18', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8 },
  pillText: { color: COLORS.mint, fontSize: 9, fontWeight: '900', letterSpacing: .7 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 15 },
  statLabel: { color: COLORS.muted, fontSize: 11, marginBottom: 5 },
  statValue: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  link: { color: COLORS.mint, fontSize: 13, fontWeight: '700' },
  summaryCard: { backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  smallIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  summaryValue: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  welcome: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line },
  welcomeIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F4C96B18', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  welcomeTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  welcomeText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, flexDirection: 'row', backgroundColor: '#0A1725F5', borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '600' },
  navLabelOn: { color: COLORS.mint },
  fab: { position: 'absolute', right: 20, bottom: 92, width: 58, height: 58, borderRadius: 20, backgroundColor: COLORS.mint, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.mint, shadowOpacity: .35, shadowRadius: 12, elevation: 8 },
  overlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 4, backgroundColor: '#3B5166', alignSelf: 'center', marginBottom: 16 },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  sheetTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  inputLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  moneyInputWrap: { height: 56, borderRadius: 15, backgroundColor: COLORS.card2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.line },
  currency: { color: COLORS.mint, fontWeight: '800', fontSize: 22, marginRight: 8 },
  moneyInput: { flex: 1, color: COLORS.text, fontSize: 23, fontWeight: '800' },
  textInput: { height: 52, borderRadius: 15, backgroundColor: COLORS.card2, color: COLORS.text, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.line, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  chip: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12, backgroundColor: COLORS.card2 },
  chipOn: { backgroundColor: COLORS.mint },
  chipText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  chipTextOn: { color: COLORS.bg },
  primaryButton: { height: 54, borderRadius: 16, backgroundColor: COLORS.mint, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryText: { color: COLORS.bg, fontSize: 15, fontWeight: '900' },
  sheetNote: { color: COLORS.muted, lineHeight: 19, fontSize: 12, marginBottom: 20 },
  reminderNote: { flexDirection: 'row', gap: 10, padding: 13, borderRadius: 13, backgroundColor: '#F4C96B10', marginBottom: 18 },
  reminderText: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 17 },
  planHero: { borderRadius: 22, padding: 20, backgroundColor: COLORS.card },
  planHeroLabel: { color: COLORS.mint, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  planHeroValue: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginTop: 7 },
  planHeroSub: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  addMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.mint, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  addMiniText: { color: COLORS.bg, fontSize: 11, fontWeight: '900' },
  empty: { padding: 28, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', gap: 10 },
  emptyText: { color: COLORS.muted, textAlign: 'center', lineHeight: 19, maxWidth: 250 },
  fixedRow: { flexDirection: 'row', alignItems: 'center', minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  fixedRowInactive: { opacity: .72 },
  inactiveText: { color: COLORS.muted },
  planningNote: { flexDirection: 'row', gap: 11, padding: 14, borderRadius: 16, backgroundColor: COLORS.mint + '10', borderWidth: 1, borderColor: COLORS.mint + '28', marginBottom: 12 },
  planningNoteText: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 17 },
  activationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: COLORS.mint + '10', marginBottom: 14 },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: '#496076', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: COLORS.mint, borderColor: COLORS.mint },
  fixedName: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  fixedHint: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  done: { textDecorationLine: 'line-through', color: COLORS.muted },
  paidLine: { color: COLORS.muted, fontSize: 11, textAlign: 'center', paddingVertical: 12 },
  installmentText: { color: COLORS.mint, fontSize: 10, fontWeight: '700', marginTop: 3 },
  remainingLabel: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  goalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 18, padding: 16 },
  goalIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#82F2BC18', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  goalValue: { color: COLORS.mint, fontWeight: '800' },
  outlineButton: { height: 50, borderRadius: 15, borderWidth: 1, borderColor: COLORS.mintDark, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  outlineText: { color: COLORS.mint, fontWeight: '800', fontSize: 13 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  activeFilter: { backgroundColor: COLORS.mint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  activeFilterText: { color: COLORS.bg, fontSize: 11, fontWeight: '900' },
  filterText: { color: COLORS.muted, fontSize: 11 },
  move: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line, flexDirection: 'row', alignItems: 'center' },
  moveIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#82F2BC12', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expenseValue: { color: COLORS.danger, fontSize: 14, fontWeight: '800' },
  deleteMini: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 6, backgroundColor: COLORS.danger + '12' },
  insight: { flexDirection: 'row', gap: 13, backgroundColor: '#0D2B2B', borderRadius: 18, padding: 16, marginBottom: 16 },
  insightTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  insightText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  periodCard: { padding: 18, borderRadius: 20, backgroundColor: COLORS.card, marginBottom: 12 },
  periodLabel: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  periodStats: { flexDirection: 'row', gap: 8 },
  savedLine: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14 },
  savedLabel: { color: COLORS.muted, fontSize: 12 },
  savedValue: { color: COLORS.mint, fontWeight: '800' },
  settingRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  settingIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, marginRight: 12 },
  privacy: { marginTop: 24, borderRadius: 17, padding: 16, backgroundColor: '#0D2B2B', flexDirection: 'row', gap: 11 },
  privacyText: { flex: 1, color: COLORS.muted, lineHeight: 18, fontSize: 11 },
  paymentSummary: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  payLinkButton: { height: 50, borderRadius: 15, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
  editButton: { height: 48, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
  editButtonText: { color: COLORS.mint, fontSize: 13, fontWeight: '800' },
  referenceCard: { minHeight: 70, borderRadius: 15, padding: 13, backgroundColor: COLORS.card2, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  referenceLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  referenceValue: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 5 },
  copyButton: { height: 38, borderRadius: 11, paddingHorizontal: 11, backgroundColor: COLORS.mint + '12', flexDirection: 'row', alignItems: 'center', gap: 6 },
  copyText: { color: COLORS.mint, fontSize: 11, fontWeight: '800' },
  deleteButton: { height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  deleteButtonText: { color: COLORS.danger, fontSize: 13, fontWeight: '800' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  themeOption: { width: '47%', padding: 10, borderRadius: 16, backgroundColor: COLORS.card2, borderWidth: 2, borderColor: 'transparent' },
  themeSwatch: { height: 64, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  themeDot: { width: 20, height: 20, borderRadius: 10 },
  themeName: { color: COLORS.text, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  calendarCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: COLORS.line },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { width: '14.285%', color: COLORS.muted, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.285%', height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  dayCellDue: { backgroundColor: COLORS.mint + '16' },
  dayCellToday: { borderWidth: 2, borderColor: COLORS.gold, backgroundColor: COLORS.gold + '12' },
  dayNumber: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  dayNumberDue: { color: COLORS.text, fontWeight: '900' },
  dayNumberToday: { color: COLORS.gold, fontWeight: '900' },
  calendarDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.mint, marginTop: 3 },
  calendarBill: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  calendarDate: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  calendarDateDay: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  calendarDateMonth: { color: COLORS.mint, fontSize: 8, fontWeight: '900' },
  confirmOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end', padding: 14 },
  confirmCard: { backgroundColor: COLORS.card, borderRadius: 28, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  confirmIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.mint + '16', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmIconDanger: { backgroundColor: COLORS.danger + '16' },
  confirmTitle: { color: COLORS.text, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  confirmMessage: { color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 20, maxWidth: 310 },
  confirmActions: { flexDirection: 'row', gap: 10, width: '100%' },
  confirmCancel: { flex: 1, height: 50, borderRadius: 16, backgroundColor: COLORS.card2, alignItems: 'center', justifyContent: 'center' },
  confirmCancelText: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  confirmAccept: { flex: 1, height: 50, borderRadius: 16, backgroundColor: COLORS.mint, alignItems: 'center', justifyContent: 'center' },
  confirmAcceptDanger: { backgroundColor: COLORS.danger },
  confirmAcceptText: { color: COLORS.bg, fontSize: 13, fontWeight: '900' },
  lock: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 30 },
  lockLogo: { width: 100, height: 100, borderRadius: 28, marginBottom: 28 },
  lockTitle: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  lockText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9, marginBottom: 28 }
  });
}
