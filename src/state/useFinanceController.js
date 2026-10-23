import { usePeriodActions } from './usePeriodActions';
import { usePaymentLinks } from './usePaymentLinks';
import { useFixedPaymentActions } from './useFixedPaymentActions';
import { useSalaryActions } from './useSalaryActions';
import { useFixedExpenseActions } from './useFixedExpenseActions';
import { useExpenseActions } from './useExpenseActions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, useWindowDimensions } from 'react-native';
import { useFinanceData } from './FinanceProvider';
import { usePaymentNotifications } from './usePaymentNotifications';
import { THEMES } from '../theme/palettes';
import { PAGE_ORDER } from '../navigation/pages';
import { cycleFor, planPaymentDate } from '../domain/dates';
import { selectPlanSummary, paymentStatusFor } from '../domain/selectors';
import { fixedPaidAmount } from '../domain/payments';
import { useAppSecurity } from './useAppSecurity';
import { useNotificationNavigation } from './useNotificationNavigation';
import { orderedPlan } from '../domain/planOrdering';
export function useFinanceController() {
  const {
    data,
    setData,
    loaded,
    loadError,
    reload
  } = useFinanceData();
  usePaymentNotifications(data, loaded);
  const {
    locked,
    unlock
  } = useAppSecurity(data.biometric, loaded);
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
  const [expenseMenuAnchor, setExpenseMenuAnchor] = useState({
    x: 20,
    y: 100
  });
  const [paymentTiming, setPaymentTiming] = useState('payday');
  const [deadlineDay, setDeadlineDay] = useState('');
  const [calendarOffset, setCalendarOffset] = useState(1);
  const [fixedCategory, setFixedCategory] = useState('Otros');
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState([]);
  const [fabOpen, setFabOpen] = useState(false);
  const fabProgress = useRef(new Animated.Value(0)).current;
  const pageRef = useRef(null);
  const pagePosition = useRef(0);
  const {
    width: screenWidth,
    height: screenHeight
  } = useWindowDimensions();
  useEffect(() => {
    const index = PAGE_ORDER.indexOf(tab);
    if (index >= 0 && Math.abs(pagePosition.current - index * screenWidth) > 1) {
      pageRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true
      });
    }
  }, [tab, screenWidth, loaded, locked]);
  useEffect(() => {
    Animated.timing(fabProgress, {
      toValue: fabOpen ? 1 : 0,
      duration: 160,
      useNativeDriver: true
    }).start();
  }, [fabOpen, fabProgress]);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (fabOpen) {
        setFabOpen(false);
        return true;
      }
      if (expenseMenu) {
        setExpenseMenu(false);
        return true;
      }
      if (tab !== 'inicio') {
        setTab('inicio');
        return true;
      }
      return false;
    });
    return () => back.remove();
  }, [tab, fabOpen, expenseMenu]);
  const cycle = useMemo(() => cycleFor(new Date(), data.activeCycleStart), [data.activeCycleStart]);
  const COLORS = THEMES[data.theme] || THEMES.menta;
  const budgetMonth = new Date(cycle.start.getFullYear(), cycle.start.getMonth(), 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  });
  const {
    currentExpenses,
    activeFixed,
    fixedTotal,
    paidFixed,
    available,
    distribution,
    pendingFixed,
    completedFixed,
    pendingTotal
  } = useMemo(() => selectPlanSummary(data, cycle), [data, cycle]);
  const fixedDate = useCallback(item => {
    return planPaymentDate(cycle.start, item);
  }, [cycle]);
  const paymentStatus = useCallback(item => {
    const status = paymentStatusFor(item, cycle.start);
    return {
      text: status.text,
      color: status.tone === 'upcoming' ? '#72B8FF' : COLORS[status.tone]
    };
  }, [COLORS, cycle]);
  const visibleFixed = useMemo(() => orderedPlan(activeFixed, planFilter, planSearch, data.planOrder || 'added', fixedDate), [activeFixed, planFilter, planSearch, data.planOrder, fixedDate]);
  const closeSheet = useCallback(() => {
    setPaymentAction(null);
    setExpenseMenu(false);
    setPaymentTiming('payday');
    setDeadlineDay('');
    setFixedCategory('Otros');
    setCategoryManuallySet(false);
    setSheet(null);
    setAmount('');
    setName('');
    setDueDay('');
    setCategory('Alimentación');
    setInstallmentsTotal('');
    setInstallmentsPaid('');
    setSelectedFixed(null);
    setSelectedExpense(null);
    setPaymentUrl('');
    setPaymentReference('');
  }, [setAmount, setCategory, setCategoryManuallySet, setDeadlineDay, setDueDay, setExpenseMenu, setFixedCategory, setInstallmentsPaid, setInstallmentsTotal, setName, setPaymentAction, setPaymentReference, setPaymentTiming, setPaymentUrl, setSelectedExpense, setSelectedFixed, setSheet]);
  const {
    addExpense,
    openExpenseEditor,
    updateExpense
  } = useExpenseActions({
    amount,
    setData,
    name,
    category,
    cycle,
    closeSheet,
    setSelectedExpense,
    setAmount,
    setName,
    setCategory,
    setSheet,
    selectedExpense
  });
  const {
    addFixed,
    openFixedEditor,
    updateFixed
  } = useFixedExpenseActions({
    amount,
    paymentTiming,
    dueDay,
    installmentsTotal,
    installmentsPaid,
    name,
    deadlineDay,
    setData,
    fixedCategory,
    paymentUrl,
    paymentReference,
    closeSheet,
    selectedFixed,
    setName,
    setAmount,
    setDueDay,
    setFixedCategory,
    setCategoryManuallySet,
    setPaymentTiming,
    setDeadlineDay,
    setInstallmentsTotal,
    setInstallmentsPaid,
    setPaymentUrl,
    setPaymentReference,
    setSheet
  });
  const {
    saveSetup
  } = useSalaryActions({
    amount,
    dueDay,
    data,
    cycle,
    setData,
    closeSheet
  });
  const {
    openFixedPayment,
    addFixedPayment,
    correctFixedPayment
  } = useFixedPaymentActions({
    setSelectedFixed,
    setAmount,
    setSheet,
    selectedFixed,
    amount,
    setData,
    closeSheet
  });
  const {
    openPaymentUrl,
    copyPaymentReference
  } = usePaymentLinks({
    setReferenceCopied
  });
  useNotificationNavigation(data, loaded, openFixedPayment, setTab);
  const {
    deleteFixed,
    removeExpense,
    endPeriod
  } = usePeriodActions({
    selectedFixed,
    setConfirmDialog,
    setData,
    closeSheet,
    setTab
  });
  return {
    activeFixed,
    addExpense,
    addFixed,
    addFixedPayment,
    amount,
    available,
    budgetMonth,
    calendarOffset,
    category,
    categoryManuallySet,
    closeSheet,
    completedFixed,
    confirmDialog,
    copyPaymentReference,
    correctFixedPayment,
    currentExpenses,
    cycle,
    data,
    deadlineDay,
    deleteFixed,
    distribution,
    dueDay,
    endPeriod,
    expandedPeriods,
    expenseMenu,
    expenseMenuAnchor,
    expenseMenuRef,
    fabOpen,
    fabProgress,
    fixedCategory,
    fixedDate,
    fixedPaidAmount,
    fixedTotal,
    installmentsPaid,
    installmentsTotal,
    loadError,
    loaded,
    locked,
    name,
    openExpenseEditor,
    openFixedEditor,
    openFixedPayment,
    openPaymentUrl,
    pagePosition,
    pageRef,
    paidFixed,
    paymentAction,
    paymentReference,
    paymentStatus,
    paymentTiming,
    paymentUrl,
    pendingFixed,
    pendingTotal,
    planFilter,
    planSearch,
    referenceCopied,
    reload,
    removeExpense,
    saveSetup,
    screenHeight,
    screenWidth,
    selectedCalendarDay,
    selectedFixed,
    setAmount,
    setCalendarOffset,
    setCategory,
    setCategoryManuallySet,
    setConfirmDialog,
    setData,
    setDeadlineDay,
    setDueDay,
    setExpandedPeriods,
    setExpenseMenu,
    setExpenseMenuAnchor,
    setFabOpen,
    setFixedCategory,
    setInstallmentsPaid,
    setInstallmentsTotal,
    setName,
    setPaymentAction,
    setPaymentReference,
    setPaymentTiming,
    setPaymentUrl,
    setPlanFilter,
    setPlanSearch,
    setSelectedCalendarDay,
    setSheet,
    setTab,
    sheet,
    tab,
    unlock,
    updateExpense,
    updateFixed,
    visibleFixed
  };
}
