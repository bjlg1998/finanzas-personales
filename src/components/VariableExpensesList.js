import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Empty, Icon } from './ui';
import { Pressable, Text, View } from 'react-native';
import { money } from '../domain/money';
function VariableExpensesList(props) {
  const {
    currentExpenses,
    openExpenseEditor,
    removeExpense
  } = props;
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <>
      <View style={styles.filterRow}>
        <View style={styles.activeFilter}><Text style={styles.activeFilterText}>Este período</Text></View>
        <Text style={styles.filterText}>{currentExpenses.length} movimientos</Text>
      </View>
      {!currentExpenses.length ? <Empty icon="receipt-outline" text="Aún no tienes gastos variables en este período." /> : currentExpenses.map(item => <Pressable key={item.id} style={styles.move} onPress={() => openExpenseEditor(item)} onLongPress={() => removeExpense(item.id)}>
            <View style={styles.moveIcon}><Icon name={item.category === 'Transporte' ? 'car-outline' : item.category === 'Ocio' ? 'game-controller-outline' : 'cart-outline'} size={20} color={COLORS.mint} /></View>
            <View style={{
        flex: 1
      }}>
              <Text style={styles.fixedName}>{item.name}</Text>
              <Text style={styles.fixedHint}>{item.category} · {new Date(item.date).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short'
          })}</Text>
            </View>
            <Text style={styles.expenseValue}>−{money(item.amount)}</Text>
            <Pressable style={styles.deleteMini} onPress={() => removeExpense(item.id)}>
              <Icon name="trash" size={18} color={COLORS.danger} />
            </Pressable>
          </Pressable>)}
      <View style={{
      height: 16
    }} />
    </>;
}
export default React.memo(VariableExpensesList);
