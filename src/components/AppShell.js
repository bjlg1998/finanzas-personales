import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import ExpenseSheets from './ExpenseSheets';
import { Animated, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Icon } from '../components/ui';
import { PAGE_ORDER } from '../navigation/pages';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import PlanScreen from '../screens/PlanScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
export default function AppShell(props) {
  const {
    activeFixed,
    available,
    budgetMonth,
    calendarOffset,
    closeSheet,
    completedFixed,
    currentExpenses,
    cycle,
    data,
    distribution,
    endPeriod,
    expandedPeriods,
    fabOpen,
    fabProgress,
    fixedDate,
    fixedPaidAmount,
    fixedTotal,
    loadError,
    loaded,
    locked,
    openExpenseEditor,
    openFixedPayment,
    pagePosition,
    pageRef,
    paidFixed,
    paymentStatus,
    pendingFixed,
    pendingTotal,
    planFilter,
    planSearch,
    reload,
    removeExpense,
    screenWidth,
    selectedCalendarDay,
    setAmount,
    setCalendarOffset,
    setData,
    setDueDay,
    setExpandedPeriods,
    setFabOpen,
    setPlanFilter,
    setPlanSearch,
    setSelectedCalendarDay,
    setSheet,
    setTab,
    sheet,
    tab,
    unlock,
    visibleFixed
  } = props;
  const {
    styles,
    colors: COLORS
  } = useTheme();
  if (loadError) return <View style={styles.center}><Text style={styles.fixedName}>{loadError}</Text><Pressable style={styles.editButton} onPress={reload}><Text style={styles.editButtonText}>Reintentar carga</Text></Pressable></View>;
  if (!loaded) return <View style={styles.center}><Image source={require('../../assets/finanzas-icon-v2.png')} style={styles.splashLogo} /></View>;
  if (locked) return <SafeAreaView style={styles.lock}>
      <Image source={require('../../assets/finanzas-icon-v2.png')} style={styles.lockLogo} />
      <Text style={styles.lockTitle}>Tu dinero, solo tuyo.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Desbloquear con huella" style={({
      pressed
    }) => [styles.fingerprintButton, pressed && {
      opacity: .7,
      transform: [{
        scale: .95
      }]
    }]} onPress={unlock}>
        <Icon name="finger-print" size={40} color={COLORS.mint} />
      </Pressable>
    </SafeAreaView>;
  const screens = {
    inicio: <HomeScreen available={available} completedFixed={completedFixed} data={data} distribution={distribution} fixedDate={fixedDate} fixedPaidAmount={fixedPaidAmount} openFixedPayment={openFixedPayment} paidFixed={paidFixed} paymentStatus={paymentStatus} pendingFixed={pendingFixed} pendingTotal={pendingTotal} setPlanFilter={setPlanFilter} setSheet={setSheet} setTab={setTab} />,
    plan: <PlanScreen currentExpenses={currentExpenses} openExpenseEditor={openExpenseEditor} removeExpense={removeExpense} setData={setData} activeFixed={activeFixed} budgetMonth={budgetMonth} completedFixed={completedFixed} cycle={cycle} data={data} endPeriod={endPeriod} fixedDate={fixedDate} fixedPaidAmount={fixedPaidAmount} fixedTotal={fixedTotal} openFixedPayment={openFixedPayment} paidFixed={paidFixed} paymentStatus={paymentStatus} pendingFixed={pendingFixed} pendingTotal={pendingTotal} planFilter={planFilter} planSearch={planSearch} setAmount={setAmount} setPlanFilter={setPlanFilter} setPlanSearch={setPlanSearch} setSheet={setSheet} visibleFixed={visibleFixed} />,
    history: <HistoryScreen data={data} expandedPeriods={expandedPeriods} setExpandedPeriods={setExpandedPeriods} />,
    calendar: <CalendarScreen activeFixed={activeFixed} budgetMonth={budgetMonth} calendarOffset={calendarOffset} cycle={cycle} fixedDate={fixedDate} fixedPaidAmount={fixedPaidAmount} openFixedPayment={openFixedPayment} paymentStatus={paymentStatus} selectedCalendarDay={selectedCalendarDay} setCalendarOffset={setCalendarOffset} setSelectedCalendarDay={setSelectedCalendarDay} />,
    settings: <SettingsScreen data={data} cycle={cycle} setAmount={setAmount} setData={setData} setDueDay={setDueDay} setSheet={setSheet} />
  };
  return <View style={styles.app}>
      <ScrollView ref={pageRef} horizontal pagingEnabled decelerationRate="fast" disableIntervalMomentum snapToInterval={screenWidth} nestedScrollEnabled directionalLockEnabled showsHorizontalScrollIndicator={false} scrollEnabled={!sheet && !fabOpen} style={{
      flex: 1
    }} contentContainerStyle={{
      flexGrow: 1
    }} onLayout={() => {
      pagePosition.current = Math.max(0, PAGE_ORDER.indexOf(tab)) * screenWidth;
      pageRef.current?.scrollTo({
        x: pagePosition.current,
        animated: false
      });
    }} onMomentumScrollEnd={event => {
      pagePosition.current = event.nativeEvent.contentOffset.x;
      const index = Math.max(0, Math.min(PAGE_ORDER.length - 1, Math.round(pagePosition.current / screenWidth)));
      React.startTransition(() => setTab(PAGE_ORDER[index]));
    }}>
        {PAGE_ORDER.map(page => <View key={page} style={{
        width: screenWidth,
        flexShrink: 0,
        height: '100%'
      }} accessibilityElementsHidden={tab !== page} importantForAccessibility={tab === page ? 'auto' : 'no-hide-descendants'}>{React.cloneElement(screens[page], {
          isActive: tab === page
        })}</View>)}
      </ScrollView>
      <View style={styles.nav}>
        {[['inicio', 'home', 'Inicio'], ['plan', 'pie-chart', 'Plan'], ['calendar', 'calendar', 'Calendario'], ['history', 'time', 'Historial'], ['settings', 'settings', 'Ajustes']].map(([key, icon, label]) => <Pressable key={key} style={styles.navItem} onPress={() => {
        setFabOpen(false);
        setTab(key);
      }}>
            <Icon name={tab === key ? icon : `${icon}-outline`} size={22} color={tab === key ? COLORS.mint : COLORS.muted} />
            <Text style={[styles.navLabel, tab === key && styles.navLabelOn]}>{label}</Text>
          </Pressable>)}
      </View>
      {tab !== 'settings' && <>
        {fabOpen && <Pressable accessibilityLabel="Cerrar opciones" style={styles.fabBackdrop} onPress={() => setFabOpen(false)} />}
        <Animated.View pointerEvents={fabOpen ? 'auto' : 'none'} accessibilityElementsHidden={!fabOpen} importantForAccessibility={fabOpen ? 'auto' : 'no-hide-descendants'} style={[styles.fabOptions, {
        opacity: fabProgress,
        transform: [{
          translateY: fabProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0]
          })
        }]
      }]}>
          <Pressable accessibilityRole="button" style={styles.fabOption} onPress={() => {
          setFabOpen(false);
          closeSheet();
          setSheet('fixed');
        }}><Text style={styles.fabOptionLabel}>Gasto fijo</Text><View style={[styles.fabOptionIcon, {
            backgroundColor: COLORS.gold
          }]}><Icon name="receipt" size={22} color={COLORS.bg} /></View></Pressable>
          <Pressable accessibilityRole="button" style={styles.fabOption} onPress={() => {
          setFabOpen(false);
          closeSheet();
          setSheet('expense');
        }}><Text style={styles.fabOptionLabel}>Gasto</Text><View style={styles.fabOptionIcon}><Icon name="cart" size={22} color={COLORS.bg} /></View></Pressable>
        </Animated.View>
        <Pressable accessibilityRole="button" accessibilityLabel={fabOpen ? 'Cerrar opciones de gasto' : 'Agregar gasto'} accessibilityState={{
        expanded: fabOpen
      }} style={[styles.fab, {
        elevation: 12,
        zIndex: 12
      }]} onPress={() => setFabOpen(open => !open)}>
          <Animated.View style={{
          transform: [{
            rotate: fabProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '45deg']
            })
          }]
        }}><Icon name="add" size={30} color={COLORS.bg} /></Animated.View>
        </Pressable>
      </>}

      <ExpenseSheets {...props} />
    </View>;
}
