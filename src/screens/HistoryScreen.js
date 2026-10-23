import TabScrollView from '../components/TabScrollView';
import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Empty, Header, Icon, Stat } from '../components/ui';
import { Pressable, Text, View } from 'react-native';
import { money } from '../domain/money';
function HistoryScreen(props) {
  const {
    data,
    expandedPeriods,
    setExpandedPeriods
  } = props;
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <TabScrollView active={props.isActive} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Header title="Historial" subtitle="TU PROGRESO" />
      {!data.periods.length ? <Empty icon="bar-chart-outline" text="Tu primer resumen aparecerá cuando cierres el período." /> : data.periods.map(p => <View key={p.id} style={styles.periodCard}>
            <Pressable accessibilityRole="button" accessibilityState={{
        expanded: expandedPeriods.includes(p.id)
      }} style={styles.historyHeading} onPress={() => setExpandedPeriods(ids => ids.includes(p.id) ? ids.filter(id => id !== p.id) : [...ids, p.id])}>
              <View style={{
          flex: 1
        }}><Text style={styles.periodLabel}>{p.label}</Text><Text style={styles.fixedHint}>{expandedPeriods.includes(p.id) ? 'Ocultar detalle' : 'Ver detalle'}</Text></View>
              <View style={{
          transform: [{
            rotate: expandedPeriods.includes(p.id) ? '90deg' : '0deg'
          }]
        }}><Icon name="chevron-forward" size={20} color={COLORS.muted} /></View>
            </Pressable>
            {expandedPeriods.includes(p.id) && <>
            <View style={styles.periodStats}>
              <Stat label="Ingresos" value={money(p.income)} />
              <Stat label="Gastado" value={money(p.spent)} />
            </View>
            <View style={styles.savedLine}><Text style={styles.savedLabel}>Sobrante y ahorro</Text><Text style={styles.savedValue}>{money(p.saved)}</Text></View>
            {(p.fixed || []).filter(item => item.active !== false).map((item, index) => <View key={index} style={styles.compactPayment}><View style={{
            flex: 1
          }}><Text style={styles.fixedName}>{item.name}</Text><Text style={styles.fixedHint}>{money(item.paidAmount || 0)} pagados · {Math.max(0, item.amount - (item.paidAmount || 0)) ? 'Quedó pendiente' : 'Pagado'}</Text></View><Text style={styles.summaryValue}>{money(Math.max(0, item.amount - (item.paidAmount || 0)))}</Text></View>)}
            </>}
          </View>)}
      <View style={{
      height: 110
    }} />
    </TabScrollView>;
}
export default React.memo(HistoryScreen);
