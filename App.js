import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Animated, BackHandler, Image, Modal, Pressable, ScrollView, StyleSheet, Switch,
Text, TextInput, View, Linking, useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  BarChart3, Bell, Banknote, Car, ChartPie, Check, ChevronRight, CircleEllipsis,
  CalendarDays, Copy, ExternalLink, Fingerprint, Gamepad2, History, Home, Leaf, Plus, ReceiptText,
  Pencil, Settings, ShieldCheck, ShoppingCart, Sparkles, Sun, Trash2, TrendingUp, X, EllipsisVertical
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
  , copy: Copy, edit: Pencil, 'external-link': ExternalLink, trash: Trash2, options: EllipsisVertical
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
  , payDay: 31, salaryPlanVersion: 1
};

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
});
const money = (n) => copFormatter.format(Number(n || 0));
const PAYMENT_CATEGORIES = { Arriendo: '#B399FF', Servicios: '#529BFF', Deudas: '#FF6666', Alimentación: '#FFA447', Transporte: '#40D8DE', Sueldo: '#A3DB45', Ahorro: '#F2D34F', Ocio: '#EF82CD', Otros: '#A4ADBB' };
const PAGE_ORDER = ['inicio', 'plan', 'calendar', 'history', 'settings'];
const predictCategory = (name) => {
  const text = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rules = [
    ['Arriendo', /\b(arriendo|alquiler|renta|arrendamiento)\b/],
    ['Deudas', /\b(deuda|credito|prestamo|tarjeta|cuota|hipoteca|nu|bancolombia|davivienda|bbva|icetex|sistecredito|addi)\b/],
    ['Ahorro', /\b(ahorro|ahorros|inversion|inversiones|colchon|emergencia|cdt|alcancia)\b/],
    ['Sueldo', /\b(sueldo|salario|nomina|pago laboral|honorarios)\b/],
    ['Servicios', /\b(agua|luz|gas|energia|electricidad|electrohuila|enel|epm|celsia|internet|wifi|telefono|celular|movil|claro|movistar|tigo|wom|acueducto|aseo|administracion)\b/],
    ['Alimentación', /\b(mercado|comida|alimentacion|supermercado|almuerzo|desayuno|cena|restaurante|domicilio|despensa|exito|d1|ara|jumbo)\b/],
    ['Transporte', /\b(transporte|gasolina|combustible|diesel|uber|didi|taxi|bus|pasaje|parqueadero|peaje|moto|carro|soat)\b/],
    ['Ocio', /\b(ocio|netflix|spotify|cine|disney|hbo|max|prime|juego|videojuego|concierto|gimnasio|gym|vacaciones)\b/]
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'Otros';
};
const normalizeCategory = (category) => category === 'Comida' ? 'Alimentación' : PAYMENT_CATEGORIES[category] ? category : 'Otros';
const categoryAmountsFor = (fixed, expenses, goal) => [...fixed, ...expenses].reduce((totals, item) => {
  const label = normalizeCategory(item.category);
  totals[label] = (totals[label] || 0) + item.amount;
  return totals;
}, { Ahorro: Number(goal) || 0 });
const BUDGET_GROUPS = { needs: 'Necesidades', wants: 'Gustos', savings: 'Ahorro' };
const budgetGroupFor = (item) => item.category === 'Ahorro' ? 'savings' : ['Arriendo', 'Servicios', 'Deudas', 'Alimentación', 'Comida', 'Transporte'].includes(item.category) ? 'needs' : 'wants';
const budgetTotalsFor = (fixed, expenses, goal) => [...fixed, ...expenses].reduce((totals, item) => { totals[budgetGroupFor(item)] += Number(item.amount) || 0; return totals; }, { needs: 0, wants: 0, savings: Number(goal) || 0 });

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
const planPaymentDate = (start, item) => {
  if (item.paymentTiming === 'payday') return new Date(start);
  if (item.paymentTiming === 'nextday') return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const month = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return new Date(month.getFullYear(), month.getMonth(), Math.min(item.dueDay || 1, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()));
};
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
      <SafeAreaView style={styles.sheetSafeArea} edges={['top']}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable onPress={onClose}><Icon name="close" size={24} color={COLORS.text} /></Pressable>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </SafeAreaView>
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
  const [referenceCopied, setReferenceCopied] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [category, setCategory] = useState('Alimentación');
  const [planFilter, setPlanFilter] = useState('pending');
  const [planSearch, setPlanSearch] = useState('');
  const [paymentAction, setPaymentAction] = useState(null);
  const [expenseMenu, setExpenseMenu] = useState(false);
  const expenseMenuRef = useRef(null);
  const [expenseMenuAnchor, setExpenseMenuAnchor] = useState({ x: 20, y: 100 });
  const [paymentTiming, setPaymentTiming] = useState('payday');
  const [deadlineDay, setDeadlineDay] = useState('');
  const [calendarOffset, setCalendarOffset] = useState(1);
  const [fixedCategory, setFixedCategory] = useState('Otros');
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [budgetGroup, setBudgetGroup] = useState('auto');
  const fabProgress = useRef(new Animated.Value(0)).current;
  const pageRef = useRef(null);
  const pagePosition = useRef(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  useEffect(() => {
    const index = PAGE_ORDER.indexOf(tab);
    if (index >= 0 && Math.abs(pagePosition.current - index * screenWidth) > 1) {
      pageRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    }
  }, [tab, screenWidth, loaded, locked]);
  useEffect(() => {
    Animated.timing(fabProgress, { toValue: fabOpen ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  }, [fabOpen, fabProgress]);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (fabOpen) { setFabOpen(false); return true; }
      if (expenseMenu) { setExpenseMenu(false); return true; }
      if (tab !== 'inicio') { setTab('inicio'); return true; }
      return false;
    });
    return () => back.remove();
  }, [tab, fabOpen, expenseMenu]);
  const cycle = cycleFor(new Date(), data.activeCycleStart);
  const activeTheme = THEMES[data.theme] || THEMES.menta;
  Object.assign(COLORS, activeTheme);
  styles = createStyles(activeTheme);
  const budgetMonth = new Date(cycle.start.getFullYear(), cycle.start.getMonth(), 1)
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
      if (!saved.activeCycleStart) {
        const base = raw ? cycleFor(new Date()).start : new Date();
        saved.activeCycleStart = new Date(base.getFullYear(), base.getMonth(), Math.min(saved.payDay, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate())).toISOString();
      }
      delete saved.salaryReceived;
      const classifyExisting = saved.categoryDetectionVersion !== 1;
      saved.fixed = saved.fixed.map((item) => {
        const detected = classifyExisting ? predictCategory(item.name || '') : 'Otros';
        return { ...item, category: detected !== 'Otros' ? detected : normalizeCategory(item.category), budgetGroup: 'auto' };
      });
      saved.categoryDetectionVersion = 1;
      saved.expenses = saved.expenses.map((item) => ({ ...item, category: normalizeCategory(item.category) }));
      for (const item of saved.fixed) {
        if (item.active === false) {
          item.active = true;
          item.notificationIds = await schedulePaymentReminders(item.name, item.amount, item.dueDay, new Date(saved.activeCycleStart), item.paymentTiming || 'other');
        }
      }
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
      promptMessage: 'Finanzas Personales',
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
  const usedPct = totalBase ? ((fixedTotal + variableSpent + data.goal) / totalBase) * 100 : 0;
  const distributionAmounts = categoryAmountsFor(activeFixed, currentExpenses, data.goal);
  const distributionBase = Math.max(totalBase, fixedTotal + variableSpent + data.goal, 1);
  const distribution = Object.entries(PAYMENT_CATEGORIES).map(([label, color]) => ({ label, color, amount: distributionAmounts[label] || 0 }))
    .filter((part) => part.amount > 0)
    .map((part) => ({ ...part, percent: totalBase > 0 ? part.amount / totalBase * 100 : 0, width: part.amount / distributionBase * 100 }));
  const spendingStart = new Date() < cycle.start ? cycle.start : new Date();
  const remainingDays = daysBetween(spendingStart, cycle.end);
  const daily = Math.max(0, available / remainingDays);
  const fixedDate = (item) => {
    return planPaymentDate(cycle.start, item);
  };
  const paymentStatus = (item) => {
    if (item.active === false) return { text: 'Sin incluir', color: COLORS.muted };
    if (fixedPaidAmount(item) >= item.amount) return { text: 'Pagado', color: COLORS.mint };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const date = fixedDate(item); date.setHours(0, 0, 0, 0);
    const deadline = item.deadlineDay ? planPaymentDate(cycle.start, { dueDay: item.deadlineDay }) : null;
    const partial = fixedPaidAmount(item) > 0 ? ' · Pago parcial' : '';
    if (deadline && deadline < today) return { text: 'Factura vencida' + partial, color: COLORS.danger };
    if (date < today) return { text: (deadline ? 'Pago planeado atrasado' : 'Vencido') + partial, color: COLORS.danger };
    if (+date === +today) return { text: 'Hoy' + partial, color: COLORS.gold };
    return { text: 'Próximo' + partial, color: '#72B8FF' };
  };
  const paymentGroup = (item) => +fixedDate(item) === +new Date(cycle.start.getFullYear(), cycle.start.getMonth(), cycle.start.getDate()) ? 'Día del sueldo' : +fixedDate(item) === +new Date(cycle.start.getFullYear(), cycle.start.getMonth(), cycle.start.getDate() + 1) ? 'Día siguiente' : 'Otras fechas';
  const pendingFixed = activeFixed.filter((item) => fixedPaidAmount(item) < item.amount)
    .sort((a, b) => fixedDate(a) - fixedDate(b) || a.name.localeCompare(b.name));
  const completedFixed = activeFixed.filter((item) => fixedPaidAmount(item) >= item.amount);
  const visibleFixed = (planFilter === 'pending' ? pendingFixed : planFilter === 'paid' ? completedFixed : [...activeFixed].sort((a, b) => fixedDate(a) - fixedDate(b)))
    .filter((item) => item.name.toLocaleLowerCase().includes(planSearch.trim().toLocaleLowerCase()));
  const pendingTotal = Math.max(0, fixedTotal - paidFixed);

  const closeSheet = () => {
    setPaymentAction(null); setExpenseMenu(false);
    setPaymentTiming('payday'); setDeadlineDay('');
    setFixedCategory('Otros'); setCategoryManuallySet(false);
    setBudgetGroup('auto');
    setSheet(null); setAmount(''); setName(''); setDueDay(''); setCategory('Alimentación');
    setInstallmentsTotal(''); setInstallmentsPaid(''); setSelectedFixed(null); setSelectedExpense(null);
    setPaymentUrl('');
    setPaymentReference('');
  };

  const schedulePaymentReminders = async (expenseName, value, day, cycleStart = cycle.start, timing = 'other') => {
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Recordatorios desactivados', 'Puedes activar las notificaciones de Flujo desde los ajustes del teléfono.');
      return [];
    }
    const ids = [];
    const now = new Date();
    const paymentDate = planPaymentDate(cycleStart, { dueDay: day, paymentTiming: timing });
    paymentDate.setHours(9, 0, 0, 0);
    for (const daysBefore of [1, 0]) {
      const triggerDate = new Date(paymentDate);
      triggerDate.setDate(triggerDate.getDate() - daysBefore);
      if (triggerDate <= now) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: daysBefore ? `Mañana paga ${expenseName}` : `Hoy paga ${expenseName}`,
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
        category, budgetGroup, date: new Date().toISOString(), period: cycle.id
      }, ...d.expenses]
    }));
    closeSheet();
  };

  const openExpenseEditor = (item) => {
    setSelectedExpense(item);
    setAmount(formatMoneyInput(item.amount));
    setName(item.name || '');
    setCategory(item.category || 'Otros');
    setBudgetGroup(item.budgetGroup || 'auto');
    setSheet('editExpense');
  };

  const updateExpense = () => {
    const value = parseMoney(amount);
    if (!selectedExpense || !value) return Alert.alert('Falta el valor', 'Escribe cuánto gastaste.');
    setData((d) => ({
      ...d,
      expenses: d.expenses.map((item) => item.id === selectedExpense.id
        ? { ...item, amount: value, name: name.trim() || category, category, budgetGroup }
        : item)
    }));
    closeSheet();
  };

  const addFixed = async () => {
    const value = parseMoney(amount);
    const day = paymentTiming === 'other' ? Number(dueDay) : 1;
    const totalInstallments = Number(installmentsTotal) || 0;
    const alreadyPaid = Number(installmentsPaid) || 0;
    if (!value || !name.trim() || day < 1 || day > 31) {
      return Alert.alert('Completa los datos', 'Agrega nombre, valor y un día de pago entre 1 y 31.');
    }
    if (totalInstallments && alreadyPaid >= totalInstallments) {
      return Alert.alert('Revisa las cuotas', 'Las cuotas pagadas deben ser menores al total.');
    }
    if (deadlineDay && (Number(deadlineDay) < 1 || Number(deadlineDay) > 31)) return Alert.alert('Revisa el vencimiento', 'Usa un día entre 1 y 31.');
    const notificationIds = await schedulePaymentReminders(name.trim(), value, day, cycle.start, paymentTiming);
    setData((d) => ({
      ...d, fixed: [...d.fixed, {
        id: Date.now().toString(), name: name.trim(), amount: value,
        dueDay: day, category: fixedCategory, budgetGroup: 'auto', paymentTiming, deadlineDay: Number(deadlineDay) || null, paid: false, paidAmount: 0, notificationIds, active: true,
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
    setFixedCategory(selectedFixed.category || 'Otros'); setCategoryManuallySet(false);
    setBudgetGroup(selectedFixed.budgetGroup || 'auto');
    setPaymentTiming(selectedFixed.paymentTiming || 'other'); setDeadlineDay(selectedFixed.deadlineDay ? String(selectedFixed.deadlineDay) : '');
    setInstallmentsTotal(selectedFixed.installmentsTotal ? String(selectedFixed.installmentsTotal) : '');
    setInstallmentsPaid(selectedFixed.installmentsPaid ? String(selectedFixed.installmentsPaid) : '');
    setPaymentUrl(selectedFixed.paymentUrl || '');
    setPaymentReference(selectedFixed.paymentReference || '');
    setSheet('editFixed');
  };

  const updateFixed = async () => {
    const value = parseMoney(amount);
    const day = paymentTiming === 'other' ? Number(dueDay) : 1;
    const totalInstallments = Number(installmentsTotal) || 0;
    const alreadyPaid = Number(installmentsPaid) || 0;
    if (!selectedFixed || !value || !name.trim() || day < 1 || day > 31) {
      return Alert.alert('Completa los datos', 'Agrega nombre, valor y un día de pago entre 1 y 31.');
    }
    if (totalInstallments && alreadyPaid >= totalInstallments) {
      return Alert.alert('Revisa las cuotas', 'Las cuotas pagadas deben ser menores al total.');
    }
    if (deadlineDay && (Number(deadlineDay) < 1 || Number(deadlineDay) > 31)) return Alert.alert('Revisa el vencimiento', 'Usa un día entre 1 y 31.');
    await Promise.all((selectedFixed.notificationIds || []).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    ));
    const notificationIds = selectedFixed.active === false
      ? []
      : await schedulePaymentReminders(name.trim(), value, day, cycle.start, paymentTiming);
    setData((d) => ({
      ...d,
      fixed: d.fixed.map((item) => item.id === selectedFixed.id ? {
        ...item, name: name.trim(), amount: value, category: fixedCategory, budgetGroup: 'auto', dueDay: day, paymentTiming, deadlineDay: Number(deadlineDay) || null,
        paidAmount: Math.min(item.paidAmount || 0, value),
        paid: (item.paidAmount || 0) >= value,
        installmentsTotal: totalInstallments, installmentsPaid: alreadyPaid,
        paymentUrl: paymentUrl.trim(), paymentReference: paymentReference.trim(), notificationIds
      } : item)
    }));
    closeSheet();
  };

  const saveSetup = async () => {
    const value = parseMoney(amount);
    if (!value) return Alert.alert('Falta tu sueldo', 'Ingresa el sueldo del período.');
    const payday = Number(dueDay) || data.payDay;
    const start = new Date(cycle.start.getFullYear(), cycle.start.getMonth(), Math.min(payday, new Date(cycle.start.getFullYear(), cycle.start.getMonth() + 1, 0).getDate()));
    const updatedFixed = [];
    for (const item of data.fixed) {
      await Promise.all((item.notificationIds || []).map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
      const notificationIds = item.active === false || fixedPaidAmount(item) >= item.amount ? [] : await schedulePaymentReminders(item.name, item.amount, item.dueDay, start, item.paymentTiming || 'other');
      updatedFixed.push({ ...item, notificationIds });
    }
    setData((d) => ({ ...d, salary: value, payDay: payday, activeCycleStart: start.toISOString(), fixed: updatedFixed }));
    closeSheet();
  };

  const openFixedPayment = (item) => {
    setSelectedFixed(item);
    setAmount('');
    setSheet('payFixed');
  };

  const markFixedPaid = () => {
    const remaining = Math.max(0, selectedFixed.amount - fixedPaidAmount(selectedFixed));
    if (!remaining) return;
    setConfirmDialog({
      title: 'Marcar como pagado',
      message: `Registrarás el pago de ${money(remaining)} para completar ${selectedFixed.name}.`,
      confirmLabel: 'Confirmar pago',
      onConfirm: () => {
        setData((d) => ({ ...d, fixed: d.fixed.map((x) => x.id !== selectedFixed.id ? x : {
          ...x, paid: true, paidAmount: x.amount,
          installmentsPaid: Math.min(x.installmentsTotal || 0, (x.installmentsPaid || 0) + (x.installmentsTotal && !x.installmentAdvanced ? 1 : 0)),
          installmentAdvanced: Boolean(x.installmentsTotal || x.installmentAdvanced)
        }) }));
        setConfirmDialog(null);
        closeSheet();
      }
    });
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

  const correctFixedPayment = () => {
    const value = parseMoney(amount);
    if (!selectedFixed) return;
    if (value > selectedFixed.amount) return Alert.alert('Monto no válido', 'El total pagado no puede superar el valor del gasto.');
    setData((d) => ({ ...d, fixed: d.fixed.map((x) => {
      if (x.id !== selectedFixed.id) return x;
      const completed = value >= x.amount;
      const baseInstallments = Math.max(0, (x.installmentsPaid || 0) - (x.installmentAdvanced ? 1 : 0));
      const advance = Boolean(completed && x.installmentsTotal && baseInstallments < x.installmentsTotal);
      return { ...x, paidAmount: value, paid: completed,
        installmentsPaid: x.installmentsTotal ? baseInstallments + (advance ? 1 : 0) : (x.installmentsPaid || 0),
        installmentAdvanced: advance };
    }) }));
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
    setReferenceCopied(true);
    setTimeout(() => setReferenceCopied(false), 1600);
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
    title: 'Cerrar este sueldo',
    message: `Guardaremos los pagos realizados y los pendientes en el historial. El siguiente plan comienza con su propio sueldo, sin trasladar dinero. Tus gastos fijos se repetirán con sus pagos reiniciados.`,
    confirmLabel: 'Cerrar plan',
    onConfirm: async () => {
      await Promise.all(data.fixed.flatMap((item) => (item.notificationIds || []).map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
      )));
      const nextMonth = new Date(cycle.start.getFullYear(), cycle.start.getMonth() + 1, 1);
      const nextStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(data.payDay, new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()));
      const nextFixed = [];
      for (const item of data.fixed) {
        const notificationIds = await schedulePaymentReminders(item.name, item.amount, item.dueDay, nextStart, item.paymentTiming || 'other');
        nextFixed.push({ ...item, active: true, paid: false, paidAmount: 0, installmentAdvanced: false, notificationIds });
      }
      setData((d) => ({
        ...d,
        carry: 0,
        activeCycleStart: nextStart.toISOString(),
        planningNext: true,
        periods: [{
          id: `${cycle.id}-${Date.now()}`, label: `Sueldo de ${budgetMonth} · ${shortDate(cycle.start)}`,
          income: totalBase, spent: paidFixed + variableSpent, saved: Math.max(0, totalBase - paidFixed - variableSpent),
          fixed: d.fixed.map((x) => ({ name: x.name, amount: x.amount, paidAmount: fixedPaidAmount(x), active: x.active !== false }))
        }, ...d.periods],
        fixed: nextFixed
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
      <Pressable accessibilityRole="button" accessibilityLabel="Desbloquear con huella" style={({ pressed }) => [styles.fingerprintButton, pressed && { opacity: .7, transform: [{ scale: .95 }] }]} onPress={unlock}>
        <Icon name="finger-print" size={40} color={COLORS.mint} />
      </Pressable>
    </SafeAreaView>
  );

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.homeHeading}><Text style={styles.homeTitle}>Finanzas Personales</Text><Image source={require('./assets/finanzas-icon-v2.png')} style={styles.logo} /></View>
      {!data.salary ? (
        <Pressable style={styles.welcome} onPress={() => setSheet('salary')}>
          <View style={styles.welcomeIcon}><Icon name="sparkles" size={22} color={COLORS.gold} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Comienza con tu sueldo</Text>
            <Text style={styles.welcomeText}>Configura el sueldo esperado y prepara los pagos que harás al cobrar.</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.muted} />
        </Pressable>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>DISPONIBLE</Text>
            <Text style={styles.heroAmount}>{money(available)}</Text>
          </View>
          {!!distribution.length && <View style={styles.distributionCard}>
            <Text style={styles.distributionTitle}>Distribución del sueldo</Text>
            <View accessible accessibilityLabel={distribution.map((part) => `${part.label}: ${part.percent.toFixed(1)} por ciento, ${money(part.amount)}`).join('. ')} style={styles.distributionBar}>
              {distribution.map((part) => <View key={part.label} style={[styles.distributionSegment, { width: `${part.width}%`, backgroundColor: part.color }]}>
              </View>)}
            </View>
            <View style={styles.distributionLegend}>
              {distribution.map((part) => <View key={part.label} style={styles.distributionLegendItem}>
                <View style={[styles.distributionDot, { backgroundColor: part.color }]} />
                <View style={{ flexShrink: 1 }}><Text style={styles.distributionLabel}>{part.label}</Text><Text style={styles.distributionHint}>{Math.round(part.percent)}%</Text></View>
              </View>)}
            </View>
            {available < 0 && <Text style={[styles.fixedHint, { color: COLORS.danger, marginTop: 10 }]}>Excedes tu ingreso en {money(-available)}. La barra se ajusta al total comprometido; los porcentajes se calculan sobre el ingreso.</Text>}
            {available > 0 && <Text style={[styles.distributionHint, { marginTop: 8 }]}>El espacio sin color es el saldo libre. Porcentajes sobre tu ingreso.</Text>}
          </View>}
          <View style={styles.row}>
            <Pressable style={styles.overviewTile} onPress={() => { setPlanFilter('pending'); setTab('plan'); }}>
              <Text style={styles.fixedHint}>POR PAGAR · {pendingFixed.length}</Text>
              <Text style={styles.overviewAmount}>{money(pendingTotal)}</Text>
              <Text style={styles.link}>Ver pendientes ›</Text>
            </Pressable>
            <Pressable style={styles.overviewTile} onPress={() => { setPlanFilter('paid'); setTab('plan'); }}>
              <Text style={styles.fixedHint}>PAGADO · {completedFixed.length}</Text>
              <Text style={styles.overviewAmount}>{money(paidFixed)}</Text>
              <Text style={styles.link}>Ver pagos ›</Text>
            </Pressable>
          </View>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Próximos pagos</Text>
            <Pressable onPress={() => { setPlanFilter('pending'); setTab('plan'); }}><Text style={styles.link}>Ver todos</Text></Pressable>
          </View>
          {pendingFixed.length ? <View style={styles.summaryCard}>{pendingFixed.slice(0, 3).map((item) => (
            <Pressable key={item.id} style={styles.compactPayment} onPress={() => openFixedPayment(item)}>
              <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.fixedName}>{item.name}</Text><Text style={[styles.fixedHint, { color: paymentStatus(item).color }]}>{shortDate(fixedDate(item))} · {paymentStatus(item).text}</Text></View>
              <Text style={styles.summaryValue}>{money(item.amount - fixedPaidAmount(item))}</Text>
              <Icon name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>
          ))}</View> : <Empty icon="checkmark" text="Todo al día. No tienes pagos pendientes incluidos en este mes." />}
        </>
      )}
      <View style={{ height: 110 }} />
    </ScrollView>
  );

  const renderPlan = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="Plan de pagos" subtitle={`SUELDO DE ${budgetMonth} · ${shortDate(cycle.start)}`} />
      <View style={styles.planHero}>
        <Text style={styles.planHeroLabel}>POR PAGAR CON ESTE SUELDO</Text>
        <Text style={styles.planHeroValue}>{money(pendingTotal)}</Text>
        <Text style={styles.planHeroSub}>{pendingFixed.length} pendientes · {money(paidFixed)} abonados</Text>
        <View style={styles.progressBg}><View style={[styles.progress, { width: `${fixedTotal ? Math.min(100, paidFixed / fixedTotal * 100) : 0}%` }]} /></View>
      </View>
      <View style={styles.sectionTop}>
        <Text style={styles.sectionTitle}>Incluidos este mes</Text>
      </View>
      <View style={styles.planFilters}>
        {[['pending', 'Pendientes', pendingFixed.length], ['paid', 'Pagados', completedFixed.length], ['all', 'Todos', activeFixed.length]].map(([id, label, count]) => (
          <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: planFilter === id }} style={[styles.planFilter, planFilter === id && styles.chipOn]} onPress={() => setPlanFilter(id)}>
            <Text style={[styles.chipText, planFilter === id && styles.chipTextOn]}>{label} ({count})</Text>
          </Pressable>
        ))}
      </View>
      <TextInput style={styles.textInput} value={planSearch} onChangeText={setPlanSearch} placeholder="Buscar gasto por nombre" placeholderTextColor={COLORS.muted} accessibilityLabel="Buscar gasto por nombre" />
      {!visibleFixed.length ? <Empty icon="home-outline" text={planSearch ? 'No encontramos ese gasto en este filtro.' : !activeFixed.length ? 'Agrega gastos del mes o crea uno nuevo para empezar tu plan.' : planFilter === 'paid' ? 'Aquí aparecerán los gastos que completes.' : 'No tienes gastos pendientes en este filtro.'} /> :
        <View style={styles.summaryCard}>
          {visibleFixed.map((item) => {
            const isActive = item.active !== false;
            const itemPaid = fixedPaidAmount(item);
            const remaining = Math.max(0, item.amount - itemPaid);
            const completed = remaining === 0;
            const installmentsLeft = item.installmentsTotal
              ? Math.max(0, item.installmentsTotal - (item.installmentsPaid || 0))
              : null;
            return (
            <View key={item.id}>
            {(visibleFixed.indexOf(item) === 0 || paymentGroup(visibleFixed[visibleFixed.indexOf(item) - 1]) !== paymentGroup(item)) && <Text style={[styles.detailSectionLabel, { marginTop: 16 }]}>{paymentGroup(item)}</Text>}
            <Pressable style={[styles.compactPayment, { borderLeftWidth: 3, borderLeftColor: PAYMENT_CATEGORIES[item.category] || PAYMENT_CATEGORIES.Otros, paddingLeft: 10 }]} onPress={() => openFixedPayment(item)}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.fixedName}>{item.name}</Text>
                <Text style={[styles.fixedHint, { color: PAYMENT_CATEGORIES[item.category] || PAYMENT_CATEGORIES.Otros }]}>{item.category || 'Otros'}</Text>
                <Text style={[styles.fixedHint, { color: paymentStatus(item).color }]}>{shortDate(fixedDate(item))}{paymentStatus(item).text.startsWith('Próximo') ? '' : ` · ${paymentStatus(item).text}`}</Text>
                {installmentsLeft !== null && <Text style={styles.installmentText}>{installmentsLeft} cuotas pendientes</Text>}
              </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryValue}>{money(item.amount)}</Text>
                  {(completed || itemPaid > 0) && <Text style={[styles.remainingLabel, { color: completed ? COLORS.mint : COLORS.muted }]}>{completed ? 'Pagado' : `Pendiente ${money(remaining)}`}</Text>}
                </View>
              <Icon name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>
            </View>
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
      <Pressable style={styles.outlineButton} onPress={endPeriod}><Text style={styles.outlineText}>Cerrar sueldo y preparar el siguiente</Text></Pressable>
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
      {!data.periods.length ? <Empty icon="bar-chart-outline" text="Tu primer resumen aparecerá cuando cierres el período." /> :
        data.periods.map((p) => (
          <View key={p.id} style={styles.periodCard}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: expandedPeriods.includes(p.id) }} style={styles.historyHeading} onPress={() => setExpandedPeriods((ids) => ids.includes(p.id) ? ids.filter((id) => id !== p.id) : [...ids, p.id])}>
              <View style={{ flex: 1 }}><Text style={styles.periodLabel}>{p.label}</Text><Text style={styles.fixedHint}>{expandedPeriods.includes(p.id) ? 'Ocultar detalle' : 'Ver detalle'}</Text></View>
              <View style={{ transform: [{ rotate: expandedPeriods.includes(p.id) ? '90deg' : '0deg' }] }}><Icon name="chevron-forward" size={20} color={COLORS.muted} /></View>
            </Pressable>
            {expandedPeriods.includes(p.id) && <>
            <View style={styles.periodStats}>
              <Stat label="Ingresos" value={money(p.income)} />
              <Stat label="Gastado" value={money(p.spent)} />
            </View>
            <View style={styles.savedLine}><Text style={styles.savedLabel}>Sobrante y ahorro</Text><Text style={styles.savedValue}>{money(p.saved)}</Text></View>
            {(p.fixed || []).filter((item) => item.active !== false).map((item, index) => <View key={index} style={styles.compactPayment}><View style={{ flex: 1 }}><Text style={styles.fixedName}>{item.name}</Text><Text style={styles.fixedHint}>{money(item.paidAmount || 0)} pagados · {Math.max(0, item.amount - (item.paidAmount || 0)) ? 'Quedó pendiente' : 'Pagado'}</Text></View><Text style={styles.summaryValue}>{money(Math.max(0, item.amount - (item.paidAmount || 0)))}</Text></View>)}
            </>}
          </View>
        ))
      }
      <View style={{ height: 110 }} />
    </ScrollView>
  );

  const renderCalendar = () => {
    const monthDate = new Date(cycle.start.getFullYear(), cycle.start.getMonth() + calendarOffset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const today = new Date();
    const todayInCalendar = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;
    const billsByDay = activeFixed.reduce((acc, item) => {
      const date = fixedDate(item);
      if (date.getFullYear() !== year || date.getMonth() !== month) return acc;
      const day = date.getDate();
      (acc[day] ||= []).push(item);
      return acc;
    }, {});
    const upcoming = [...activeFixed].sort((a, b) => fixedDate(a) - fixedDate(b));
    const selectedDayBills = selectedCalendarDay ? (billsByDay[selectedCalendarDay] || []) : [];
    const todayLabel = today.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).toUpperCase();
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Calendario" subtitle={`SUELDO DE ${budgetMonth}`} />
        <View style={styles.chips}>{[0, 1].map((offset) => <Pressable key={offset} onPress={() => { setCalendarOffset(offset); setSelectedCalendarDay(null); }} style={[styles.chip, calendarOffset === offset && styles.chipOn]}><Text style={[styles.chipText, calendarOffset === offset && styles.chipTextOn]}>{new Date(cycle.start.getFullYear(), cycle.start.getMonth() + offset, 1).toLocaleDateString('es-CO', { month: 'long' })}</Text></Pressable>)}</View>
        <View style={styles.todayPill}>
          <View style={styles.todayPillDot} />
          <Text style={styles.todayPillText}>HOY · {todayLabel}</Text>
          {todayInCalendar === null && <Text style={styles.todayPillHint}>Planificando otro mes</Text>}
        </View>
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>{['L','M','M','J','V','S','D'].map((d, i) => <Text key={`${d}-${i}`} style={styles.weekDay}>{d}</Text>)}</View>
          <View style={styles.calendarGrid}>
            {Array.from({ length: mondayOffset }).map((_, i) => <View key={`blank-${i}`} style={styles.dayCell} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <Pressable
                key={day}
                disabled={!billsByDay[day]?.length}
                onPress={() => setSelectedCalendarDay(selectedCalendarDay === day ? null : day)}
                style={[styles.dayCell, billsByDay[day]?.length && styles.dayCellDue, todayInCalendar === day && styles.dayCellToday, selectedCalendarDay === day && styles.dayCellSelected]}
              >
                <Text style={[styles.dayNumber, billsByDay[day]?.length && styles.dayNumberDue, todayInCalendar === day && styles.dayNumberToday]}>{day}</Text>
                {!!billsByDay[day]?.length && <View style={styles.calendarDots}>{[...new Set(billsByDay[day].map((item) => normalizeCategory(item.category)))].slice(0, 4).map((label) => <View key={label} style={[styles.calendarDot, { backgroundColor: PAYMENT_CATEGORIES[label] }]} />)}</View>}
              </Pressable>
            ))}
          </View>
        </View>
        {!!selectedDayBills.length && (
          <View style={styles.calendarPreview}>
            <View style={styles.calendarPreviewTop}>
              <View><Text style={styles.calendarPreviewEyebrow}>PAGOS PROGRAMADOS</Text><Text style={styles.calendarPreviewTitle}>{selectedCalendarDay} de {monthDate.toLocaleDateString('es-CO', { month: 'long' })}</Text></View>
              <Pressable style={styles.calendarPreviewClose} onPress={() => setSelectedCalendarDay(null)}><Icon name="close" size={18} color={COLORS.muted} /></Pressable>
            </View>
            {selectedDayBills.map((item) => {
              const remaining = Math.max(0, item.amount - fixedPaidAmount(item));
              return (
                <Pressable key={item.id} style={styles.calendarPreviewRow} onPress={() => openFixedPayment(item)}>
                  <View style={[styles.calendarPreviewIcon, { backgroundColor: PAYMENT_CATEGORIES[normalizeCategory(item.category)] + '20' }]}><Icon name="receipt" size={19} color={PAYMENT_CATEGORIES[normalizeCategory(item.category)]} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.fixedName}>{item.name}</Text><Text style={styles.fixedHint}>{normalizeCategory(item.category)} · {remaining ? `${money(remaining)} pendientes` : 'Pagado'}</Text></View>
                  <Icon name="chevron-forward" size={18} color={COLORS.muted} />
                </Pressable>
              );
            })}
          </View>
        )}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Próximos pagos</Text>
        {!upcoming.length ? <Empty icon="calendar" text="Agrega gastos fijos para ver sus fechas en el calendario." /> : upcoming.map((item) => {
          const remaining = Math.max(0, item.amount - fixedPaidAmount(item));
          return <Pressable key={item.id} style={[styles.calendarBill, { borderLeftWidth: 3, borderLeftColor: PAYMENT_CATEGORIES[normalizeCategory(item.category)], paddingLeft: 10 }]} onPress={() => openFixedPayment(item)}>
            <View style={[styles.calendarDate, { backgroundColor: PAYMENT_CATEGORIES[normalizeCategory(item.category)] + '20' }]}><Text style={styles.calendarDateDay}>{fixedDate(item).getDate()}</Text><Text style={[styles.calendarDateMonth, { color: PAYMENT_CATEGORIES[normalizeCategory(item.category)] }]}>{fixedDate(item).toLocaleDateString('es-CO',{month:'short'}).toUpperCase()}</Text></View>
            <View style={{flex:1}}><Text style={styles.fixedName}>{item.name}</Text><Text style={[styles.fixedHint, { color: paymentStatus(item).color }]}>{normalizeCategory(item.category)} · {paymentStatus(item).text} · {money(remaining)}</Text></View>
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
      <Pressable style={styles.settingRow} onPress={() => { setAmount(formatMoneyInput(data.salary)); setDueDay(String(data.payDay)); setSheet('salary'); }}>
        <View style={styles.settingIcon}><Icon name="cash-outline" size={20} color={COLORS.gold} /></View>
        <View style={{ flex: 1 }}><Text style={styles.fixedName}>Sueldo y día de cobro</Text><Text style={styles.fixedHint}>{money(data.salary)} · Día {data.payDay}</Text></View>
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
      {tab === 'moves' ? screens.moves() : <ScrollView ref={pageRef} horizontal pagingEnabled decelerationRate="fast" disableIntervalMomentum snapToInterval={screenWidth} nestedScrollEnabled directionalLockEnabled showsHorizontalScrollIndicator={false} scrollEnabled={!sheet && !fabOpen} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} onLayout={() => { pagePosition.current = Math.max(0, PAGE_ORDER.indexOf(tab)) * screenWidth; pageRef.current?.scrollTo({ x: pagePosition.current, animated: false }); }} onMomentumScrollEnd={(event) => { pagePosition.current = event.nativeEvent.contentOffset.x; const index = Math.max(0, Math.min(PAGE_ORDER.length - 1, Math.round(pagePosition.current / screenWidth))); React.startTransition(() => setTab(PAGE_ORDER[index])); }}>
        {PAGE_ORDER.map((page) => <View key={page} style={{ width: screenWidth, flexShrink: 0, height: '100%' }} accessibilityElementsHidden={tab !== page} importantForAccessibility={tab === page ? 'auto' : 'no-hide-descendants'}>{screens[page]()}</View>)}
      </ScrollView>}
      <View style={styles.nav}>
        {[
          ['inicio', 'home', 'Inicio'], ['plan', 'pie-chart', 'Plan'],
          ['calendar', 'calendar', 'Calendario'], ['history', 'time', 'Historial'], ['settings', 'settings', 'Ajustes']
        ].map(([key, icon, label]) => (
          <Pressable key={key} style={styles.navItem} onPress={() => { setFabOpen(false); setTab(key); }}>
            <Icon name={tab === key ? icon : `${icon}-outline`} size={22} color={tab === key ? COLORS.mint : COLORS.muted} />
            <Text style={[styles.navLabel, tab === key && styles.navLabelOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab !== 'settings' && <>
        {fabOpen && <Pressable accessibilityLabel="Cerrar opciones" style={styles.fabBackdrop} onPress={() => setFabOpen(false)} />}
        <Animated.View pointerEvents={fabOpen ? 'auto' : 'none'} accessibilityElementsHidden={!fabOpen} importantForAccessibility={fabOpen ? 'auto' : 'no-hide-descendants'} style={[styles.fabOptions, { opacity: fabProgress, transform: [{ translateY: fabProgress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <Pressable accessibilityRole="button" style={styles.fabOption} onPress={() => { setFabOpen(false); closeSheet(); setSheet('fixed'); }}><Text style={styles.fabOptionLabel}>Gasto fijo</Text><View style={[styles.fabOptionIcon, { backgroundColor: COLORS.gold }]}><Icon name="receipt" size={22} color={COLORS.bg} /></View></Pressable>
          <Pressable accessibilityRole="button" style={styles.fabOption} onPress={() => { setFabOpen(false); closeSheet(); setSheet('expense'); }}><Text style={styles.fabOptionLabel}>Gasto</Text><View style={styles.fabOptionIcon}><Icon name="cart" size={22} color={COLORS.bg} /></View></Pressable>
        </Animated.View>
        <Pressable accessibilityRole="button" accessibilityLabel={fabOpen ? 'Cerrar opciones de gasto' : 'Agregar gasto'} accessibilityState={{ expanded: fabOpen }} style={[styles.fab, { elevation: 12, zIndex: 12 }]} onPress={() => setFabOpen((open) => !open)}>
          <Animated.View style={{ transform: [{ rotate: fabProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}><Icon name="add" size={30} color={COLORS.bg} /></Animated.View>
        </Pressable>
      </>}
      <Sheet visible={sheet === 'expense' || sheet === 'editExpense'} onClose={closeSheet} title={sheet === 'editExpense' ? "Editar gasto" : "Registrar gasto"}>
        <MoneyField label="¿Cuánto gastaste?" value={amount} onChange={setAmount} />
        <Text style={styles.inputLabel}>Descripción opcional</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ej. Almuerzo" placeholderTextColor="#50677C" style={styles.textInput} />
        <Text style={styles.inputLabel}>Categoría</Text>
        <View style={styles.chips}>
          {Object.entries(PAYMENT_CATEGORIES).map(([label, color]) => <Pressable key={label} onPress={() => setCategory(label)} style={[styles.chip, { borderWidth: 1, borderColor: category === label ? color : COLORS.line, backgroundColor: category === label ? color + '25' : COLORS.card2 }]}><Text style={[styles.chipText, { color }]}>{label}</Text></Pressable>)}
        </View>
        <Pressable style={styles.primaryButton} onPress={sheet === 'editExpense' ? updateExpense : addExpense}><Text style={styles.primaryText}>{sheet === 'editExpense' ? 'Guardar cambios' : 'Guardar gasto'}</Text></Pressable>
      </Sheet>
      <Sheet visible={sheet === 'fixed' || sheet === 'editFixed'} onClose={closeSheet} title={sheet === 'editFixed' ? "Editar gasto fijo" : "Nuevo gasto fijo"}>
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput value={name} onChangeText={(value) => { setName(value); if (!categoryManuallySet) setFixedCategory(predictCategory(value)); }} placeholder="Ej. Arriendo" placeholderTextColor="#50677C" style={styles.textInput} />
        <MoneyField label="Valor mensual" value={amount} onChange={setAmount} />
        <Text style={styles.inputLabel}>Tipo de gasto</Text>
        <Text style={styles.sheetNote}>{categoryManuallySet ? 'Categoría elegida manualmente.' : `Categoría sugerida por el nombre: ${fixedCategory}. Puedes corregirla.`}</Text>
        <View style={styles.chips}>{Object.entries(PAYMENT_CATEGORIES).map(([label, color]) => <Pressable key={label} style={[styles.chip, { borderWidth: 1, borderColor: fixedCategory === label ? color : COLORS.line, backgroundColor: fixedCategory === label ? color + '25' : COLORS.card2 }]} onPress={() => { setFixedCategory(label); setCategoryManuallySet(true); }}><Text style={[styles.chipText, { color }]}>{label}</Text></Pressable>)}</View>
        <Text style={styles.inputLabel}>Cuándo lo vas a pagar</Text>
        <View style={styles.chips}>{[['payday', 'Día del sueldo'], ['nextday', 'Día siguiente'], ['other', 'Otra fecha']].map(([id, label]) => <Pressable key={id} onPress={() => setPaymentTiming(id)} style={[styles.chip, paymentTiming === id && styles.chipOn]}><Text style={[styles.chipText, paymentTiming === id && styles.chipTextOn]}>{label}</Text></Pressable>)}</View>
        {paymentTiming === 'other' && <>
        <Text style={styles.inputLabel}>Día del mes siguiente al sueldo</Text>
        <TextInput
          value={dueDay}
          onChangeText={(v) => setDueDay(v.replace(/\D/g, '').slice(0, 2))}
          placeholder="Ej. 15"
          placeholderTextColor="#50677C"
          keyboardType="number-pad"
          maxLength={2}
          style={styles.textInput}
        />
        </>}
        <Text style={styles.inputLabel}>Día límite de la factura (opcional, mes siguiente)</Text>
        <TextInput value={deadlineDay} onChangeText={(v) => setDeadlineDay(v.replace(/\D/g, '').slice(0, 2))} placeholder="Ej. 10 · distinto del día que planeas pagar" placeholderTextColor={COLORS.muted} keyboardType="number-pad" style={styles.textInput} />
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
      <Sheet visible={sheet === 'payFixed'} onClose={closeSheet} title={selectedFixed?.name || 'Detalle del gasto'}>
        {selectedFixed && <>
          <View style={styles.detailHeading}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fixedHint, { color: paymentStatus(selectedFixed).color }]}>{shortDate(fixedDate(selectedFixed))} · {paymentStatus(selectedFixed).text}</Text>
              {!!selectedFixed.deadlineDay && <Text style={styles.fixedHint}>Factura vence: {shortDate(planPaymentDate(cycle.start, { dueDay: selectedFixed.deadlineDay }))}</Text>}
              <Text style={styles.fixedHint}>{money(fixedPaidAmount(selectedFixed))} pagados</Text>
            </View>
            <Pressable ref={expenseMenuRef} accessibilityRole="button" accessibilityLabel="Opciones del gasto" accessibilityState={{ expanded: expenseMenu }} style={styles.detailMenuButton} onPress={() => expenseMenuRef.current?.measureInWindow((x, y, width, height) => { setExpenseMenuAnchor({ x: Math.max(12, Math.min(screenWidth - 272, x + width - 260)), y: Math.max(12, Math.min(screenHeight - 180, y + height + 6)) }); setExpenseMenu(true); })}><Icon name="options" size={23} color={COLORS.text} /></Pressable>
          </View>
          <View style={styles.paymentSummary}>
            <Stat label="Valor total" value={money(selectedFixed.amount)} />
            <Stat label="Pendiente" value={money(Math.max(0, selectedFixed.amount - fixedPaidAmount(selectedFixed)))} />
          </View>
          {selectedFixed.active !== false && <View style={styles.detailPanel}>
            <Text style={styles.detailSectionLabel}>PAGO</Text>
            {!paymentAction ? <>
              {fixedPaidAmount(selectedFixed) < selectedFixed.amount && <Pressable style={styles.primaryButton} onPress={() => { setAmount(''); setPaymentAction('add'); }}><Text style={styles.primaryText}>Registrar pago</Text></Pressable>}
              {fixedPaidAmount(selectedFixed) > 0 && <Pressable style={fixedPaidAmount(selectedFixed) >= selectedFixed.amount ? styles.primaryButton : styles.editButton} onPress={() => { setAmount(formatMoneyInput(fixedPaidAmount(selectedFixed))); setPaymentAction('correct'); }}><Text style={fixedPaidAmount(selectedFixed) >= selectedFixed.amount ? styles.primaryText : styles.editButtonText}>Corregir pago</Text></Pressable>}
            </> : <>
              <MoneyField label={paymentAction === 'correct' ? 'Total pagado acumulado' : 'Monto de este pago'} value={amount} onChange={setAmount} />
              <Text style={styles.sheetNote}>{paymentAction === 'correct' ? 'Reemplaza el total registrado. Escribe 0 para volver a pendiente; las cuotas se ajustarán automáticamente.' : 'Este monto se sumará a tus abonos anteriores.'}</Text>
              {paymentAction === 'add' && <Pressable style={styles.editButton} onPress={() => setAmount(formatMoneyInput(selectedFixed.amount - fixedPaidAmount(selectedFixed)))}><Text style={styles.editButtonText}>Pagar restante: {money(selectedFixed.amount - fixedPaidAmount(selectedFixed))}</Text></Pressable>}
              <Pressable style={styles.primaryButton} onPress={paymentAction === 'correct' ? correctFixedPayment : addFixedPayment}><Text style={styles.primaryText}>{paymentAction === 'correct' ? 'Guardar corrección' : 'Guardar pago'}</Text></Pressable>
              <Pressable style={styles.editButton} onPress={() => { setPaymentAction(null); setAmount(''); }}><Text style={styles.editButtonText}>Cancelar</Text></Pressable>
            </>}
          </View>}
          {(!!selectedFixed.paymentReference || !!selectedFixed.paymentUrl) && <Text style={styles.detailSectionLabel}>DATOS PARA PAGAR</Text>}
          {!!selectedFixed.paymentReference && (
            <View style={styles.referenceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.referenceLabel}>REFERENCIA DE PAGO</Text>
                <Text style={styles.referenceValue} selectable>{selectedFixed.paymentReference}</Text>
              </View>
              <Pressable style={styles.copyButton} onPress={() => copyPaymentReference(selectedFixed.paymentReference)}>
                <Icon name={referenceCopied ? "checkmark" : "copy"} size={18} color={COLORS.mint} />
                <Text style={styles.copyText}>{referenceCopied ? 'Copiado' : 'Copiar'}</Text>
              </Pressable>
            </View>
          )}
          {!!selectedFixed.paymentUrl && (
            <Pressable style={styles.editButton} onPress={() => openPaymentUrl(selectedFixed.paymentUrl)}>
              <Icon name="external-link" size={19} color={COLORS.mint} />
              <Text style={styles.editButtonText}>Abrir enlace de pago</Text>
            </Pressable>
          )}
        </>}
      </Sheet>
      <Modal visible={expenseMenu && sheet === 'payFixed'} transparent statusBarTranslucent animationType="fade" onRequestClose={() => setExpenseMenu(false)}>
        <Pressable style={styles.expenseMenuOverlay} accessibilityLabel="Cerrar menú de opciones" onPress={() => setExpenseMenu(false)}>
          <View accessibilityViewIsModal style={[styles.expensePopup, { top: expenseMenuAnchor.y, left: expenseMenuAnchor.x }]}>
            <Pressable accessibilityRole="button" style={styles.expensePopupItem} onPress={() => { setExpenseMenu(false); openFixedEditor(); }}><Icon name="edit" size={21} color={COLORS.text} /><Text style={styles.expensePopupText}>Editar gasto</Text></Pressable>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: COLORS.line }} />
            <Pressable accessibilityRole="button" style={styles.expensePopupItem} onPress={() => { setExpenseMenu(false); deleteFixed(); }}><Icon name="trash" size={21} color={COLORS.danger} /><Text style={[styles.expensePopupText, { color: COLORS.danger }]}>Eliminar gasto</Text></Pressable>
          </View>
        </Pressable>
      </Modal>
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
        <Text style={styles.inputLabel}>Día en que recibes el sueldo</Text>
        <View style={styles.chips}>{[30, 31].map((day) => <Pressable key={day} onPress={() => setDueDay(String(day))} style={[styles.chip, (Number(dueDay) || data.payDay) === day && styles.chipOn]}><Text style={[styles.chipText, (Number(dueDay) || data.payDay) === day && styles.chipTextOn]}>Día {day}</Text></Pressable>)}</View>
        <MoneyField label="¿Cuánto recibes cada período?" value={amount} onChange={setAmount} />
        <Text style={styles.sheetNote}>Prepara los pagos del sueldo de {budgetMonth}. Puedes pagar al cobrar, al día siguiente o en otra fecha. En meses cortos se usa el último día disponible.</Text>
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
  homeHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  homeTitle: { flex: 1, color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  eyebrow: { color: COLORS.mint, fontSize: 11, letterSpacing: 1.7, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  logo: { width: 44, height: 44, borderRadius: 14 },
  hero: { backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.line },
  heroLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  heroAmount: { color: COLORS.text, fontSize: 32, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
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
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, flexDirection: 'row', backgroundColor: COLORS.card, borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 8, paddingBottom: 6 },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '600' },
  navLabelOn: { color: COLORS.mint },
  fab: { position: 'absolute', right: 20, bottom: 76, width: 58, height: 58, borderRadius: 20, backgroundColor: COLORS.mint, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.mint, shadowOpacity: .35, shadowRadius: 12, elevation: 8 },
  fabBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055', elevation: 9, zIndex: 9 },
  fabOptions: { position: 'absolute', right: 24, bottom: 150, gap: 14, elevation: 10, zIndex: 10 },
  fabOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minHeight: 48 },
  fabOptionLabel: { color: COLORS.text, backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, fontWeight: '700', fontSize: 14 },
  fabOptionIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: COLORS.mint, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheetSafeArea: { flex: 1 },
  sheet: { maxHeight: '92%', backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 22 },
  sheetScroll: { flexShrink: 1 },
  sheetContent: { paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 4, backgroundColor: '#3B5166', alignSelf: 'center', marginBottom: 16 },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
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
  distributionCard: { marginTop: 14, marginBottom: 12, padding: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20 },
  distributionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  distributionBar: { height: 26, borderRadius: 15, overflow: 'hidden', flexDirection: 'row', backgroundColor: COLORS.line },
  distributionSegment: { height: 26, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.card },
  distributionPercent: { color: '#07111F', fontSize: 11, fontWeight: '800' },
  distributionLegend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  distributionLegendItem: { minWidth: '28%', flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  distributionDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  distributionLabel: { color: COLORS.text, fontSize: 11 },
  distributionHint: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  budgetCard: { marginTop: 16, backgroundColor: COLORS.card, padding: 18, borderRadius: 22 },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  budgetStrip: { flexDirection: 'row', overflow: 'hidden', borderRadius: 6 },
  budgetTrack: { height: 8, borderRadius: 8, backgroundColor: COLORS.line },
  budgetMarker: { position: 'absolute', top: -3, width: 2, height: 14, backgroundColor: COLORS.text },
  historyHeading: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12 },
  choiceCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16, backgroundColor: COLORS.card2, marginBottom: 12, minHeight: 74 },
  detailHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailMenuButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line },
  expenseMenuOverlay: { flex: 1, backgroundColor: '#00000020' },
  expensePopup: { position: 'absolute', width: 260, borderRadius: 16, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line, paddingVertical: 6, elevation: 16, shadowColor: '#000000', shadowOpacity: .3, shadowRadius: 16 },
  expensePopupItem: { minHeight: 56, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  expensePopupText: { fontSize: 15, fontWeight: '600', color: COLORS.text, flexShrink: 1 },
  detailPanel: { padding: 16, borderRadius: 18, backgroundColor: COLORS.card2, marginBottom: 18 },
  detailSectionLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 14 },
  overviewTile: { flex: 1, padding: 16, borderRadius: 18, backgroundColor: COLORS.card, gap: 8 },
  overviewAmount: { color: COLORS.text, fontSize: 19, fontWeight: '800' },
  compactPayment: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingVertical: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  includeButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 15, backgroundColor: COLORS.mint + '12', marginBottom: 16 },
  planFilters: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  planFilter: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.card2 },
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
  todayPill: { alignSelf: 'flex-start', minHeight: 32, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.gold + '14', borderWidth: 1, borderColor: COLORS.gold + '32', marginBottom: 12 },
  todayPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.gold },
  todayPillText: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: .7 },
  todayPillHint: { color: COLORS.muted, fontSize: 9, marginLeft: 2 },
  calendarCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: COLORS.line },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { width: '14.285%', color: COLORS.muted, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.285%', height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  dayCellDue: { backgroundColor: COLORS.mint + '16' },
  dayCellToday: { borderWidth: 2, borderColor: COLORS.gold, backgroundColor: COLORS.gold + '12' },
  dayCellSelected: { borderWidth: 2, borderColor: COLORS.mint, backgroundColor: COLORS.mint + '22' },
  dayNumber: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  dayNumberDue: { color: COLORS.text, fontWeight: '900' },
  dayNumberToday: { color: COLORS.gold, fontWeight: '900' },
  calendarDots: { flexDirection: 'row', gap: 3, marginTop: 3 },
  calendarDot: { width: 5, height: 5, borderRadius: 3 },
  calendarPreview: { marginTop: 12, borderRadius: 20, padding: 15, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.mint + '30' },
  calendarPreviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  calendarPreviewEyebrow: { color: COLORS.mint, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  calendarPreviewTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  calendarPreviewClose: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  calendarPreviewRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  calendarPreviewIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.mint + '12', marginRight: 10 },
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
  fingerprintButton: { marginTop: 28, width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.mint + '55', alignItems: 'center', justifyContent: 'center' },
  lockText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9, marginBottom: 28 }
  });
}
