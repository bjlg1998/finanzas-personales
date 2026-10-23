import TabScrollView from '../components/TabScrollView';
import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Empty, Icon } from '../components/ui';
import { Image, Pressable, Text, View } from 'react-native';
import { money } from '../domain/money';
import { shortDate } from '../domain/dates';
import IncomeDistribution from '../components/IncomeDistribution';
function HomeScreen(props) {
  const {
    available,
    completedFixed,
    data,
    distribution,
    fixedDate,
    fixedPaidAmount,
    openFixedPayment,
    paidFixed,
    paymentStatus,
    pendingFixed,
    pendingTotal,
    setPlanFilter,
    setSheet,
    setTab
  } = props;
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <TabScrollView active={props.isActive} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.homeHeading}><Text style={styles.homeTitle}>Finanzas Personales</Text><Image source={require('../../assets/finanzas-icon-v2.png')} style={styles.logo} /></View>
      {!data.salary ? <Pressable style={styles.welcome} onPress={() => setSheet('salary')}>
          <View style={styles.welcomeIcon}><Icon name="sparkles" size={22} color={COLORS.gold} /></View>
          <View style={{
        flex: 1
      }}>
            <Text style={styles.welcomeTitle}>Comienza con tu sueldo</Text>
            <Text style={styles.welcomeText}>Configura el sueldo esperado y prepara los pagos que harás al cobrar.</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.muted} />
        </Pressable> : <>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>DISPONIBLE</Text>
            <Text style={[styles.heroAmount, {
          color: available >= 0 ? '#24BE83' : COLORS.danger
        }]}>{money(available)}</Text>
          </View>
          <IncomeDistribution distribution={distribution} available={available} />
          <View style={styles.row}>
            <Pressable style={styles.overviewTile} onPress={() => {
          setPlanFilter('pending');
          setTab('plan');
        }}>
              <Text style={styles.fixedHint}>POR PAGAR · {pendingFixed.length}</Text>
              <Text style={styles.overviewAmount}>{money(pendingTotal)}</Text>
              <Text style={styles.link}>Ver pendientes ›</Text>
            </Pressable>
            <Pressable style={styles.overviewTile} onPress={() => {
          setPlanFilter('paid');
          setTab('plan');
        }}>
              <Text style={styles.fixedHint}>PAGADO · {completedFixed.length}</Text>
              <Text style={styles.overviewAmount}>{money(paidFixed)}</Text>
              <Text style={styles.link}>Ver pagos ›</Text>
            </Pressable>
          </View>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Próximos pagos</Text>
            <Pressable onPress={() => {
          setPlanFilter('pending');
          setTab('plan');
        }}><Text style={styles.link}>Ver todos</Text></Pressable>
          </View>
          {pendingFixed.length ? <View style={styles.summaryCard}>{pendingFixed.slice(0, 3).map(item => <Pressable key={item.id} style={styles.compactPayment} onPress={() => openFixedPayment(item)}>
              <View style={{
            flex: 1
          }}><Text numberOfLines={1} style={styles.fixedName}>{item.name}</Text><Text style={[styles.fixedHint, {
              color: paymentStatus(item).color
            }]}>{shortDate(fixedDate(item))} · {paymentStatus(item).text}</Text></View>
              <Text style={styles.summaryValue}>{money(item.amount - fixedPaidAmount(item))}</Text>
              <Icon name="chevron-forward" size={16} color={COLORS.muted} />
            </Pressable>)}</View> : <Empty icon="checkmark" text="Todo al día. No tienes pagos pendientes incluidos en este mes." />}
        </>}
      <View style={{
      height: 110
    }} />
    </TabScrollView>;
}
export default React.memo(HomeScreen);
