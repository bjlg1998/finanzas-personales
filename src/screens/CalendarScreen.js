import TabScrollView from '../components/TabScrollView';
import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Empty, Header, Icon } from '../components/ui';
import { PAYMENT_CATEGORIES, normalizeCategory } from '../domain/categories';
import { Pressable, Text, View } from 'react-native';
import { money } from '../domain/money';
function CalendarScreen(props) {
  const {
    activeFixed,
    budgetMonth,
    calendarOffset,
    cycle,
    fixedDate,
    fixedPaidAmount,
    openFixedPayment,
    paymentStatus,
    selectedCalendarDay,
    setCalendarOffset,
    setSelectedCalendarDay
  } = props;
  const {
    styles,
    colors: COLORS
  } = useTheme();
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
  const selectedDayBills = selectedCalendarDay ? billsByDay[selectedCalendarDay] || [] : [];
  const todayLabel = today.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short'
  }).toUpperCase();
  return <TabScrollView active={props.isActive} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Calendario" subtitle={`SUELDO DE ${budgetMonth}`} />
        <View style={styles.chips}>{[0, 1].map(offset => <Pressable key={offset} onPress={() => {
        setCalendarOffset(offset);
        setSelectedCalendarDay(null);
      }} style={[styles.chip, calendarOffset === offset && styles.chipOn]}><Text style={[styles.chipText, calendarOffset === offset && styles.chipTextOn]}>{new Date(cycle.start.getFullYear(), cycle.start.getMonth() + offset, 1).toLocaleDateString('es-CO', {
            month: 'long'
          })}</Text></Pressable>)}</View>
        <View style={styles.todayPill}>
          <View style={styles.todayPillDot} />
          <Text style={styles.todayPillText}>HOY · {todayLabel}</Text>
          {todayInCalendar === null && <Text style={styles.todayPillHint}>Planificando otro mes</Text>}
        </View>
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <Text key={`${d}-${i}`} style={styles.weekDay}>{d}</Text>)}</View>
          <View style={styles.calendarGrid}>
            {Array.from({
          length: mondayOffset
        }).map((_, i) => <View key={`blank-${i}`} style={styles.dayCell} />)}
            {Array.from({
          length: daysInMonth
        }, (_, i) => i + 1).map(day => <Pressable key={day} disabled={!billsByDay[day]?.length} onPress={() => setSelectedCalendarDay(selectedCalendarDay === day ? null : day)} style={[styles.dayCell, billsByDay[day]?.length && styles.dayCellDue, todayInCalendar === day && styles.dayCellToday, selectedCalendarDay === day && styles.dayCellSelected]}>
                <Text style={[styles.dayNumber, billsByDay[day]?.length && styles.dayNumberDue, todayInCalendar === day && styles.dayNumberToday]}>{day}</Text>
                {!!billsByDay[day]?.length && <View style={styles.calendarDots}>{[...new Set(billsByDay[day].map(item => normalizeCategory(item.category)))].slice(0, 4).map(label => <View key={label} style={[styles.calendarDot, {
              backgroundColor: PAYMENT_CATEGORIES[label]
            }]} />)}</View>}
              </Pressable>)}
          </View>
        </View>
        {!!selectedDayBills.length && <View style={styles.calendarPreview}>
            <View style={styles.calendarPreviewTop}>
              <View><Text style={styles.calendarPreviewEyebrow}>PAGOS PROGRAMADOS</Text><Text style={styles.calendarPreviewTitle}>{selectedCalendarDay} de {monthDate.toLocaleDateString('es-CO', {
              month: 'long'
            })}</Text></View>
              <Pressable style={styles.calendarPreviewClose} onPress={() => setSelectedCalendarDay(null)}><Icon name="close" size={18} color={COLORS.muted} /></Pressable>
            </View>
            {selectedDayBills.map(item => {
        const remaining = Math.max(0, item.amount - fixedPaidAmount(item));
        return <Pressable key={item.id} style={styles.calendarPreviewRow} onPress={() => openFixedPayment(item)}>
                  <View style={[styles.calendarPreviewIcon, {
            backgroundColor: PAYMENT_CATEGORIES[normalizeCategory(item.category)] + '20'
          }]}><Icon name="receipt" size={19} color={PAYMENT_CATEGORIES[normalizeCategory(item.category)]} /></View>
                  <View style={{
            flex: 1
          }}><Text style={styles.fixedName}>{item.name}</Text><Text style={styles.fixedHint}>{normalizeCategory(item.category)} · {remaining ? `${money(remaining)} pendientes` : 'Pagado'}</Text></View>
                  <Icon name="chevron-forward" size={18} color={COLORS.muted} />
                </Pressable>;
      })}
          </View>}
        <Text style={[styles.sectionTitle, {
      marginTop: 24,
      marginBottom: 12
    }]}>Próximos pagos</Text>
        {!upcoming.length ? <Empty icon="calendar" text="Agrega gastos fijos para ver sus fechas en el calendario." /> : upcoming.map(item => {
      const remaining = Math.max(0, item.amount - fixedPaidAmount(item));
      return <Pressable key={item.id} style={[styles.calendarBill, {
        borderLeftWidth: 3,
        borderLeftColor: PAYMENT_CATEGORIES[normalizeCategory(item.category)],
        paddingLeft: 10
      }]} onPress={() => openFixedPayment(item)}>
            <View style={[styles.calendarDate, {
          backgroundColor: PAYMENT_CATEGORIES[normalizeCategory(item.category)] + '20'
        }]}><Text style={styles.calendarDateDay}>{fixedDate(item).getDate()}</Text><Text style={[styles.calendarDateMonth, {
            color: PAYMENT_CATEGORIES[normalizeCategory(item.category)]
          }]}>{fixedDate(item).toLocaleDateString('es-CO', {
              month: 'short'
            }).toUpperCase()}</Text></View>
            <View style={{
          flex: 1
        }}><Text style={styles.fixedName}>{item.name}</Text><Text style={[styles.fixedHint, {
            color: paymentStatus(item).color
          }]}>{normalizeCategory(item.category)} · {paymentStatus(item).text} · {money(remaining)}</Text></View>
            <Icon name="chevron-forward" size={19} color={COLORS.muted} />
          </Pressable>;
    })}
        <View style={{
      height: 110
    }} />
      </TabScrollView>;
}
export default React.memo(CalendarScreen);
