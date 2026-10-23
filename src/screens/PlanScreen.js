import TabScrollView from '../components/TabScrollView';
import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Empty, Header, Icon, Sheet } from '../components/ui';
import VariableExpensesList from '../components/VariableExpensesList';
import { PAYMENT_CATEGORIES } from '../domain/categories';
import { Pressable, Text, TextInput, View } from 'react-native';
import { formatMoneyInput, money } from '../domain/money';
import { shortDate } from '../domain/dates';
import PlanOrderSheet from '../components/PlanOrderSheet';
import { PLAN_ORDER_OPTIONS } from '../domain/planOrdering';
function PlanScreen(props) {
  const {
    activeFixed,
    budgetMonth,
    completedFixed,
    currentExpenses,
    openExpenseEditor,
    removeExpense,
    cycle,
    data,
    endPeriod,
    fixedDate,
    fixedPaidAmount,
    fixedTotal,
    openFixedPayment,
    paidFixed,
    paymentStatus,
    pendingFixed,
    pendingTotal,
    planFilter,
    planSearch,
    setAmount,
    setData,
    setPlanFilter,
    setPlanSearch,
    setSheet,
    visibleFixed
  } = props;
  const {
    styles,
    colors: COLORS
  } = useTheme();
  const [orderOpen, setOrderOpen] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const order = data.planOrder || 'added';
  return <><TabScrollView active={props.isActive} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="Plan de pagos" subtitle={`SUELDO DE ${budgetMonth} · ${shortDate(cycle.start)}`} />
      <View style={styles.planHero}>
        <Text style={styles.planHeroLabel}>POR PAGAR CON ESTE SUELDO</Text>
        <Text style={styles.planHeroValue}>{money(pendingTotal)}</Text>
        <Text style={styles.planHeroSub}>{pendingFixed.length} pendientes · {money(paidFixed)} abonados</Text>
        <View style={styles.progressBg}><View style={[styles.progress, {
            width: `${fixedTotal ? Math.min(100, paidFixed / fixedTotal * 100) : 0}%`
          }]} /></View>
      </View>
      <View style={styles.sectionTop}>
        <Text style={styles.sectionTitle}>Incluidos este mes</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Ordenar gastos" style={styles.copyButton} onPress={() => setOrderOpen(true)}><Icon name="options" size={18} color={COLORS.mint} /><Text style={styles.copyText}>Ordenar</Text></Pressable>
      </View>
      <Text style={styles.fixedHint}>{PLAN_ORDER_OPTIONS.find(([id]) => id === order)?.[1] || 'Orden de registro'}</Text>
      <View style={styles.planFilters}>
        {[['pending', 'Pendientes', pendingFixed.length], ['paid', 'Pagados', completedFixed.length], ['all', 'Todos', activeFixed.length]].map(([id, label, count]) => <Pressable key={id} accessibilityRole="button" accessibilityState={{
          selected: planFilter === id
        }} style={[styles.planFilter, planFilter === id && styles.chipOn]} onPress={() => setPlanFilter(id)}>
            <Text style={[styles.chipText, planFilter === id && styles.chipTextOn]}>{label} ({count})</Text>
          </Pressable>)}
      </View>
      <TextInput style={styles.textInput} value={planSearch} onChangeText={setPlanSearch} placeholder="Buscar gasto por nombre" placeholderTextColor={COLORS.muted} accessibilityLabel="Buscar gasto por nombre" />
      {!visibleFixed.length ? <Empty icon="home-outline" text={planSearch ? 'No encontramos ese gasto en este filtro.' : !activeFixed.length ? 'Agrega gastos del mes o crea uno nuevo para empezar tu plan.' : planFilter === 'paid' ? 'Aquí aparecerán los gastos que completes.' : 'No tienes gastos pendientes en este filtro.'} /> : <View style={styles.summaryCard}>
          {visibleFixed.map(item => {
          const itemPaid = fixedPaidAmount(item);
          const remaining = Math.max(0, item.amount - itemPaid);
          const completed = remaining === 0;
          const installmentsLeft = item.installmentsTotal ? Math.max(0, item.installmentsTotal - (item.installmentsPaid || 0)) : null;
          return <View key={item.id}>
            <Pressable style={[styles.compactPayment, {
              borderLeftWidth: 3,
              borderLeftColor: PAYMENT_CATEGORIES[item.category] || PAYMENT_CATEGORIES.Otros,
              paddingLeft: 10
            }]} onPress={() => openFixedPayment(item)}>
              <View style={{
                flex: 1
              }}>
                <Text numberOfLines={1} style={styles.fixedName}>{item.name}</Text>
                <Text style={[styles.fixedHint, {
                  color: PAYMENT_CATEGORIES[item.category] || PAYMENT_CATEGORIES.Otros
                }]}>{item.category || 'Otros'}</Text>
                <Text style={[styles.fixedHint, {
                  color: paymentStatus(item).color
                }]}>{shortDate(fixedDate(item))}{paymentStatus(item).text.startsWith('Próximo') ? '' : ` · ${paymentStatus(item).text}`}</Text>
                {installmentsLeft !== null && <Text style={styles.installmentText}>{installmentsLeft} cuotas pendientes</Text>}
              </View>
                <View style={{
                alignItems: 'flex-end'
              }}>
                  <Text style={styles.summaryValue}>{money(item.amount)}</Text>
                  {(completed || itemPaid > 0) && <Text style={[styles.remainingLabel, {
                  color: completed ? COLORS.mint : COLORS.muted
                }]}>{completed ? 'Pagado' : `Pendiente ${money(remaining)}`}</Text>}
                </View>
              <Icon name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>
            </View>;
        })}
          <Text style={styles.paidLine}>{money(paidFixed)} pagados de {money(fixedTotal)}</Text>
        </View>}
      <Pressable style={styles.settingRow} onPress={() => setVariablesOpen(true)} accessibilityRole="button">
        <Icon name="receipt" size={21} color={COLORS.mint} />
        <View style={{
          flex: 1,
          marginLeft: 12
        }}><Text style={styles.fixedName}>Gastos variables</Text><Text style={styles.fixedHint}>{currentExpenses.length} en este plan · Ver, editar o eliminar</Text></View>
        <Icon name="chevron-forward" size={18} color={COLORS.muted} />
      </Pressable>
      <Text style={[styles.sectionTitle, {
        marginTop: 26,
        marginBottom: 12
      }]}>Meta de ahorro</Text>
      <Pressable style={styles.goalCard} onPress={() => {
        setAmount(formatMoneyInput(data.goal));
        setSheet('goal');
      }}>
        <View style={styles.goalIcon}><Icon name="leaf" size={22} color={COLORS.mint} /></View>
        <View style={{
          flex: 1
        }}><Text style={styles.fixedName}>Mi colchón</Text><Text style={styles.fixedHint}>Separado antes de gastar</Text></View>
        <Text style={styles.goalValue}>{money(data.goal)}</Text>
      </Pressable>
      <Pressable style={styles.outlineButton} onPress={endPeriod}><Text style={styles.outlineText}>Cerrar sueldo y preparar el siguiente</Text></Pressable>
      <View style={{
        height: 110
      }} />
    </TabScrollView><PlanOrderSheet visible={orderOpen} value={order} onClose={() => setOrderOpen(false)} onChange={planOrder => setData(d => ({
      ...d,
      planOrder
    }))} />
    <Sheet visible={variablesOpen} onClose={() => setVariablesOpen(false)} title="Gastos variables">
      <VariableExpensesList currentExpenses={currentExpenses} openExpenseEditor={item => {
        setVariablesOpen(false);
        openExpenseEditor(item);
      }} removeExpense={id => {
        setVariablesOpen(false);
        removeExpense(id);
      }} />
    </Sheet></>;
}
export default React.memo(PlanScreen);
