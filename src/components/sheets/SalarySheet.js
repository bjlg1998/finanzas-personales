import { useTheme } from "../../theme/ThemeProvider";
import { MoneyField, Sheet } from "../../components/ui";
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { formatMoneyInput } from '../../domain/money';
export default function SalarySheet({
  sheet,
  closeSheet,
  setDueDay,
  dueDay,
  data,
  amount,
  setAmount,
  budgetMonth,
  saveSetup
}) {
  const {
    styles,
    colors
  } = useTheme();
  const [extraAmount, setExtraAmount] = useState(() => formatMoneyInput(data.extraIncome));
  const [extraLabel, setExtraLabel] = useState(data.extraIncomeLabel || '');
  const [recurring, setRecurring] = useState(Boolean(data.extraIncomeRecurring));
  useEffect(() => {
    if (sheet !== 'salary') return;
    setExtraAmount(formatMoneyInput(data.extraIncome));
    setExtraLabel(data.extraIncomeLabel || '');
    setRecurring(Boolean(data.extraIncomeRecurring));
  }, [sheet, data.extraIncome, data.extraIncomeLabel, data.extraIncomeRecurring]);
  return <Sheet visible={sheet === 'salary'} onClose={closeSheet} title="Tu sueldo">
        <Text style={styles.inputLabel}>Día en que recibes el sueldo</Text>
        <View style={styles.chips}>{[30, 31].map(day => <Pressable key={day} onPress={() => setDueDay(String(day))} style={[styles.chip, (Number(dueDay) || data.payDay) === day && styles.chipOn]}><Text style={[styles.chipText, (Number(dueDay) || data.payDay) === day && styles.chipTextOn]}>Día {day}</Text></Pressable>)}</View>
        <MoneyField label="¿Cuánto recibes cada período?" value={amount} onChange={setAmount} />
        <Text style={styles.detailSectionLabel}>DINERO EXTRA</Text>
        <MoneyField label="Ingreso adicional para este plan" value={extraAmount} onChange={setExtraAmount} />
        <Text style={styles.inputLabel}>De dónde viene (opcional)</Text>
        <TextInput value={extraLabel} onChangeText={setExtraLabel} placeholder="Ej. Trabajo adicional o bono" placeholderTextColor={colors.muted} style={styles.textInput} maxLength={100} />
        <View style={styles.settingRow}>
          <View style={{
        flex: 1
      }}><Text style={styles.fixedName}>Repetir cada sueldo</Text><Text style={styles.fixedHint}>{recurring ? 'Se incluirá también en los siguientes planes.' : 'Solo cuenta en este plan; se reinicia al cerrarlo.'}</Text></View>
          <Switch accessibilityLabel="Repetir ingreso extra cada sueldo" value={recurring} onValueChange={setRecurring} trackColor={{
        false: colors.line,
        true: colors.mintDark
      }} thumbColor={recurring ? colors.mint : colors.muted} />
        </View>
        <Text style={styles.sheetNote}>Prepara los pagos del sueldo de {budgetMonth}. Puedes pagar al cobrar, al día siguiente o en otra fecha. En meses cortos se usa el último día disponible.</Text>
        <Pressable style={styles.primaryButton} onPress={() => saveSetup({
      amount: extraAmount,
      label: extraLabel,
      recurring
    })}><Text style={styles.primaryText}>Guardar ingresos</Text></Pressable>
      </Sheet>;
}
