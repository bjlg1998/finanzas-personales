import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, MoneyField, Sheet } from '../components/ui';
import AppDialog from '../components/AppDialog';
import { useTheme } from '../theme/ThemeProvider';
import { useSalarySimulation } from '../state/useSalarySimulation';
import { allocatedInstallments, distributeSimulatedPayment, emptyScenario, remainingInstallments, simulationMonth, simulationSalaryDate, simulationTotals, toggleSimulatedPayment } from '../domain/simulation';
import { formatMoneyInput, money, parseMoney } from '../domain/money';
function ScenarioPayment({
  payment,
  onAmount,
  onRemove
}) {
  const {
    styles,
    colors
  } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState('');
  return <View style={{
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    gap: 8
  }}>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar monto simulado de ${payment.name}`} onPress={() => {
        setDraftAmount(formatMoneyInput(payment.amount));
        setEditing(value => !value);
      }} style={{
        flex: 1,
        minHeight: 48,
        justifyContent: 'center'
      }}>
        <Text style={styles.fixedName}>{payment.name}</Text>
        <Text style={styles.fixedHint}>{money(payment.amount)} · Toca para ajustar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${payment.name} de esta simulación`} onPress={onRemove} style={{
        padding: 12
      }}><Icon name="close" color={colors.muted} size={22} /></Pressable>
    </View>
    {editing && <>
      <MoneyField label="Monto solo para este sueldo" value={draftAmount} onChange={setDraftAmount} />
      <Pressable style={styles.primaryButton} disabled={!Number.isSafeInteger(parseMoney(draftAmount)) || parseMoney(draftAmount) <= 0} onPress={() => {
        onAmount(parseMoney(draftAmount));
        setEditing(false);
      }}><Text style={styles.primaryText}>Aplicar monto</Text></Pressable>
    </>}
  </View>;
}
export default function SalarySimulatorScreen({
  data,
  cycle,
  onClose
}) {
  const {
    styles,
    colors
  } = useTheme();
  const {
    simulation,
    status,
    error,
    change,
    retry
  } = useSalarySimulation();
  const [offset, setOffset] = useState(1);
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const [editingSaved, setEditingSaved] = useState(null);
  const [savedAmount, setSavedAmount] = useState('');
  const scroll = React.useRef(null);
  const dates = useMemo(() => [0, 1, 2].map(index => simulationSalaryDate(cycle.start, offset + index, data.payDay)), [cycle.start, offset, data.payDay]);
  const scenarios = dates.map(date => simulation?.scenarios.find(value => value.month === simulationMonth(date)) || emptyScenario(date, data));
  const scenario = scenarios[selected];
  const fromMonth = simulationMonth(simulationSalaryDate(cycle.start, 1, data.payDay));
  const totals = simulationTotals(scenario);
  // Saved expenses already have stable rows in the catalog. Duplicating them above
  // the catalog changes its position every time a payment is selected.
  const additionalPayments = scenario.payments.filter(payment => !data.fixed.some(item => item.id === payment.sourceId));
  const monthLabel = date => date.toLocaleDateString('es-CO', {
    month: 'short',
    year: 'numeric'
  });
  const patchScenario = update => change(document => {
    const existing = document.scenarios.find(value => value.month === scenario.month) || scenario;
    return {
      ...document,
      scenarios: [...document.scenarios.filter(value => value.month !== scenario.month), update(existing)]
    };
  });
  const toggle = item => change(document => {
    const withMonth = document.scenarios.some(value => value.month === scenario.month) ? document : {
      ...document,
      scenarios: [...document.scenarios, scenario]
    };
    return toggleSimulatedPayment(withMonth, scenario.month, item, fromMonth);
  });
  const repeat = item => change(document => distributeSimulatedPayment(document, scenarios, item, fromMonth));
  const overallocated = data.fixed.filter(item => {
    const remaining = remainingInstallments(item);
    return remaining !== null && simulation && allocatedInstallments(simulation, item.id, fromMonth) > remaining;
  });
  const panel = {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 8
  };
  const button = {
    minHeight: 48,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.card2,
    justifyContent: 'center',
    alignItems: 'center'
  };
  const enabled = Boolean(simulation);
  const close = () => {
    if (status === 'saving') return;
    if (status === 'saveError') {
      setConfirmExit(true);
      return;
    }
    onClose();
  };
  return <Modal visible animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: colors.bg
    }} edges={['top', 'bottom']}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12
      }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver a Ajustes" accessibilityState={{
          disabled: status === 'saving'
        }} style={button} onPress={close}><Icon name="close" size={24} /></Pressable>
        <View style={{
          flex: 1
        }}><Text accessibilityRole="header" style={styles.fixedName}>Próximos sueldos</Text><Text style={styles.fixedHint}>Simulador · No cambia tu plan</Text></View>
      </View>
      <ScrollView ref={scroll} maintainVisibleContentPosition={{ minIndexForVisible: 0 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{
        padding: 20,
        paddingBottom: 36
      }}>
        <Text style={[styles.sheetNote, {
          marginBottom: 16
        }]}>Elige qué pagar con cada sueldo, incluso si lo pagas al inicio del mes siguiente. Nada se repite automáticamente ni genera recordatorios.</Text>
        {!!error && <View accessibilityLiveRegion="polite" style={panel}><Text style={{
            color: colors.danger
          }}>{error}</Text>{(status === 'saveError' || status === 'loadError') && <Pressable style={button} onPress={retry}><Text style={styles.fixedName}>Reintentar</Text></Pressable>}</View>}
        {!enabled ? <Text style={styles.fixedHint}>{status === 'loading' ? 'Cargando simulaciones…' : 'Tus datos reales siguen intactos.'}</Text> : <>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver sueldos anteriores" disabled={offset === 1} onPress={() => {
              setOffset(value => value - 1);
              setSelected(0);
            }} style={[button, {
              opacity: offset === 1 ? .4 : 1
            }]}><Text style={styles.chipText}>Anterior</Text></Pressable>
            <Text style={styles.fixedHint}>Tres sueldos</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver sueldos siguientes" disabled={offset >= 118} onPress={() => {
              setOffset(value => value + 1);
              setSelected(0);
            }} style={button}><Text style={styles.chipText}>Siguiente</Text></Pressable>
          </View>
          <View style={{
            flexDirection: 'row',
            gap: 8,
            marginBottom: 16
          }}>
            {scenarios.map((value, index) => {
              const balance = simulationTotals(value).available;
              return <Pressable key={value.month} accessibilityRole="button" accessibilityState={{
                selected: index === selected
              }} onPress={() => {
                setSelected(index);
                setFormError('');
              }} style={{
                flex: 1,
                padding: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: index === selected ? colors.mint : colors.line,
                backgroundColor: colors.card,
                gap: 8
              }}>
                <Text style={styles.fixedHint}>{monthLabel(dates[index])}</Text><Text style={{
                  color: balance < 0 ? colors.danger : colors.mint,
                  fontWeight: '700',
                  fontSize: 14
                }}>{money(balance)}</Text><Text style={styles.fixedHint}>{value.payments.length} pagos</Text>
              </Pressable>;
            })}
          </View>
          <View style={panel}>
            <Text style={styles.fixedName}>Sueldo del {dates[selected].toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</Text>
            <Text style={styles.fixedHint}>Estimación independiente · Sin arrastrar sobrantes</Text>
            <MoneyField label="Sueldo estimado" value={formatMoneyInput(scenario.salary)} onChange={value => patchScenario(current => ({
              ...current,
              salary: parseMoney(value)
            }))} />
            <MoneyField label="Dinero extra estimado" value={formatMoneyInput(scenario.extra)} onChange={value => patchScenario(current => ({
              ...current,
              extra: parseMoney(value)
            }))} />
            <Text style={styles.fixedHint}>Ingreso: {money(totals.income)} · Pagos: {money(totals.payments)}</Text>
            <Text accessibilityLiveRegion="polite" style={{
              color: totals.available < 0 ? colors.danger : colors.mint,
              fontSize: 23,
              fontWeight: '700'
            }}>{totals.available < 0 ? 'Te faltarían' : 'Quedaría disponible'} {money(Math.abs(totals.available))}</Text>
          </View>
          {overallocated.length > 0 && <View style={panel}><Text style={{
              color: colors.gold
            }}>Revisa las cuotas de {overallocated.map(item => item.name).join(', ')}: tus pagos reales cambiaron y ahora hay más cuotas simuladas que pendientes. Puedes quitarlas abajo; no las borramos automáticamente.</Text></View>}
          <View style={panel}>
            <Text style={styles.fixedName}>Otros pagos simulados</Text>
            <Text style={styles.fixedHint}>Selecciona y ajusta tus gastos guardados en la lista de abajo. Aquí puedes agregar pagos hipotéticos.</Text>
            {additionalPayments.map(payment => <ScenarioPayment key={`${scenario.month}:${payment.id}`} payment={payment} onAmount={amount => patchScenario(current => ({
              ...current,
              payments: current.payments.map(value => value.id === payment.id ? {
                ...value,
                amount
              } : value)
            }))} onRemove={() => patchScenario(current => ({
              ...current,
              payments: current.payments.filter(value => value.id !== payment.id)
            }))} />)}
            <Pressable accessibilityRole="button" style={button} onPress={() => setCustomOpen(value => !value)}><Text style={{
                color: colors.mint,
                fontWeight: '700'
              }}>{customOpen ? 'Cancelar' : '+ Pago hipotético'}</Text></Pressable>
            {customOpen && <>
              <Text style={styles.inputLabel}>Nombre del pago</Text>
              <TextInput accessibilityLabel="Nombre del pago hipotético" value={customName} onChangeText={setCustomName} maxLength={100} placeholder="Ej. Viaje o compra futura" placeholderTextColor={colors.muted} style={styles.textInput} />
              <MoneyField label="Valor estimado" value={customAmount} onChange={setCustomAmount} />
              {!!formError && <Text style={{
                color: colors.danger
              }}>{formError}</Text>}
              <Pressable style={styles.primaryButton} onPress={() => {
                const amount = parseMoney(customAmount);
                if (!customName.trim() || !Number.isSafeInteger(amount) || amount <= 0) {
                  setFormError('Escribe un nombre y un valor mayor que cero.');
                  return;
                }
                const id = `custom:${Date.now()}:${Math.random().toString(36).slice(2)}`;
                patchScenario(current => ({
                  ...current,
                  payments: [...current.payments, {
                    id,
                    sourceId: null,
                    name: customName.trim(),
                    amount
                  }]
                }));
                setCustomName('');
                setCustomAmount('');
                setCustomOpen(false);
                setFormError('');
              }}><Text style={styles.primaryText}>Agregar a la simulación</Text></Pressable>
            </>}
          </View>
          <View style={panel}>
            <Text style={styles.fixedName}>Elegir gastos guardados</Text>
            <Text style={styles.fixedHint}>Una selección equivale a una cuota. Ajusta el monto aquí: solo cambia para este sueldo simulado, no el gasto real.</Text>
            <TextInput accessibilityLabel="Buscar gasto para simular" value={search} onChangeText={setSearch} placeholder="Buscar gasto" placeholderTextColor={colors.muted} style={styles.textInput} />
            {data.fixed.filter(item => item.name.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))).map(item => {
              const payment = scenario.payments.find(payment => payment.sourceId === item.id);
              const included = Boolean(payment);
              const remaining = remainingInstallments(item);
              const assigned = allocatedInstallments(simulation, item.id, fromMonth);
              const exhausted = remaining !== null && assigned >= remaining;
              return <View key={item.id} style={{
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingVertical: 12,
                gap: 8
              }}>
                <Pressable accessibilityRole="checkbox" accessibilityState={{
                  checked: included,
                  disabled: !included && exhausted
                }} disabled={!included && exhausted} onPress={() => toggle(item)} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 56,
                  opacity: !included && exhausted ? .5 : 1
                }}>
                  <View style={{
                    borderWidth: 1,
                    borderColor: included ? colors.mint : colors.muted,
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>{included && <Icon name="checkmark" size={20} color={colors.mint} />}</View>
                  <View style={{
                    flex: 1
                  }}><Text style={styles.fixedName}>{item.name}</Text><Text style={styles.fixedHint}>{money(payment?.amount ?? item.amount)}{remaining !== null ? ` · ${remaining} cuotas pendientes · ${assigned} distribuidas` : ' · Tú eliges cuándo incluirlo'}</Text></View>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Ajustar monto simulado de ${item.name}`} disabled={!included && exhausted} style={[button, { opacity: !included && exhausted ? .4 : 1 }]} onPress={() => {
                  setEditingSaved(item);
                  setSavedAmount(formatMoneyInput(payment?.amount ?? item.amount));
                }}><Text style={{ color: colors.mint }}>Ajustar monto · {money(payment?.amount ?? item.amount)}</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={exhausted} style={[button, { opacity: exhausted ? .4 : 1 }]} onPress={() => repeat(item)}><Text style={{
                    color: colors.mint
                  }}>{remaining !== null ? 'Repartir cuotas en estos 3 sueldos' : 'Incluir en estos 3 sueldos'}</Text></Pressable>
              </View>;
            })}
            {!data.fixed.length && <Text style={styles.fixedHint}>Aún no tienes gastos guardados. Puedes simular con pagos hipotéticos.</Text>}
          </View>
          <View style={{ minHeight: 80 }}><Text accessibilityLiveRegion="polite" style={styles.fixedHint}>{status === 'saving' ? 'Guardando en este teléfono…' : status === 'saveError' ? 'Cambios sin guardar' : 'Simulación guardada en este teléfono. No se aplica al plan real.'}</Text></View>
          <Pressable style={[button, {
            marginTop: 12
          }]} onPress={() => scroll.current?.scrollTo({
            y: 0,
            animated: true
          })}><Text style={styles.chipText}>Ver resumen</Text></Pressable>
        </>}
      </ScrollView>
      <Sheet visible={Boolean(editingSaved)} title={editingSaved?.name || 'Monto simulado'} onClose={() => setEditingSaved(null)}>
        <Text style={styles.sheetNote}>Solo para el sueldo de {monthLabel(dates[selected])}. Si aún no está seleccionado, se incluirá al aplicar el monto. El gasto real no cambia.</Text>
        <MoneyField label="Monto estimado para este sueldo" value={savedAmount} onChange={setSavedAmount} />
        <Pressable style={styles.primaryButton} disabled={!Number.isSafeInteger(parseMoney(savedAmount)) || parseMoney(savedAmount) <= 0} onPress={() => {
          const item = editingSaved;
          const amount = parseMoney(savedAmount);
          change(document => {
            const current = document.scenarios.find(value => value.month === scenario.month) || scenario;
            const withMonth = document.scenarios.some(value => value.month === scenario.month) ? document : { ...document, scenarios: [...document.scenarios, current] };
            if (!current.payments.some(payment => payment.sourceId === item.id)) return toggleSimulatedPayment(withMonth, scenario.month, { ...item, amount }, fromMonth);
            return { ...withMonth, scenarios: withMonth.scenarios.map(value => value.month !== scenario.month ? value : { ...value, payments: value.payments.map(payment => payment.sourceId === item.id ? { ...payment, amount } : payment) }) };
          });
          setEditingSaved(null);
        }}><Text style={styles.primaryText}>Aplicar a este sueldo</Text></Pressable>
      </Sheet>
      <AppDialog visible={confirmExit} title="Hay cambios sin guardar" message="Puedes reintentar el guardado. Si sales ahora, los últimos cambios de la simulación podrían perderse; tu plan real no se afecta." onDismiss={() => setConfirmExit(false)} actions={[{
        text: 'Seguir aquí',
        style: 'cancel',
        onPress: () => setConfirmExit(false)
      }, {
        text: 'Salir sin guardar',
        style: 'destructive',
        onPress: onClose
      }]} />
    </SafeAreaView>
  </Modal>;
}
