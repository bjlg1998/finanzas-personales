import { useTheme } from "../../theme/ThemeProvider";
import { Icon, MoneyField, Sheet } from "../../components/ui";
import { Pressable, Text, TextInput, View } from 'react-native';
import { predictCategory } from "../../domain/categories";
import CategoryPicker from '../CategoryPicker';
export default function FixedExpenseFormSheet({
  sheet,
  closeSheet,
  name,
  setName,
  categoryManuallySet,
  setFixedCategory,
  amount,
  setAmount,
  fixedCategory,
  setCategoryManuallySet,
  setPaymentTiming,
  paymentTiming,
  dueDay,
  setDueDay,
  deadlineDay,
  setDeadlineDay,
  installmentsTotal,
  setInstallmentsTotal,
  installmentsPaid,
  setInstallmentsPaid,
  paymentUrl,
  setPaymentUrl,
  paymentReference,
  setPaymentReference,
  updateFixed,
  addFixed
}) {
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <Sheet visible={sheet === 'fixed' || sheet === 'editFixed'} onClose={closeSheet} title={sheet === 'editFixed' ? "Editar gasto fijo" : "Nuevo gasto fijo"}>
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput value={name} onChangeText={value => {
      setName(value);
      if (!categoryManuallySet) setFixedCategory(predictCategory(value));
    }} placeholder="Ej. Arriendo" placeholderTextColor="#50677C" style={styles.textInput} />
        <MoneyField label="Valor mensual" value={amount} onChange={setAmount} />
        <Text style={styles.inputLabel}>Tipo de gasto</Text>
        <Text style={styles.sheetNote}>{categoryManuallySet ? 'Categoría elegida manualmente.' : `Categoría sugerida por el nombre: ${fixedCategory}. Puedes corregirla.`}</Text>
        <CategoryPicker value={fixedCategory} onChange={label => {
      setFixedCategory(label);
      setCategoryManuallySet(true);
    }} />
        <Text style={styles.inputLabel}>Cuándo lo vas a pagar</Text>
        <View style={styles.chips}>{[['payday', 'Día del sueldo'], ['nextday', 'Día siguiente'], ['other', 'Otra fecha']].map(([id, label]) => <Pressable key={id} onPress={() => setPaymentTiming(id)} style={[styles.chip, paymentTiming === id && styles.chipOn]}><Text style={[styles.chipText, paymentTiming === id && styles.chipTextOn]}>{label}</Text></Pressable>)}</View>
        {paymentTiming === 'other' && <>
        <Text style={styles.inputLabel}>Día del mes siguiente al sueldo</Text>
        <TextInput value={dueDay} onChangeText={v => setDueDay(v.replace(/\D/g, '').slice(0, 2))} placeholder="Ej. 15" placeholderTextColor="#50677C" keyboardType="number-pad" maxLength={2} style={styles.textInput} />
        </>}
        <Text style={styles.inputLabel}>Día límite de la factura (opcional, mes siguiente)</Text>
        <TextInput value={deadlineDay} onChangeText={v => setDeadlineDay(v.replace(/\D/g, '').slice(0, 2))} placeholder="Ej. 10 · distinto del día que planeas pagar" placeholderTextColor={COLORS.muted} keyboardType="number-pad" style={styles.textInput} />
        <Text style={styles.inputLabel}>Cuotas totales (opcional)</Text>
        <TextInput value={installmentsTotal} onChangeText={v => setInstallmentsTotal(v.replace(/\D/g, '').slice(0, 3))} placeholder="Ej. 12" placeholderTextColor="#50677C" keyboardType="number-pad" style={styles.textInput} />
        {!!installmentsTotal && <>
          <Text style={styles.inputLabel}>Cuotas que ya pagaste</Text>
          <TextInput value={installmentsPaid} onChangeText={v => setInstallmentsPaid(v.replace(/\D/g, '').slice(0, 3))} placeholder="Ej. 3" placeholderTextColor="#50677C" keyboardType="number-pad" style={styles.textInput} />
        </>}
        <Text style={styles.inputLabel}>Enlace para pagar (opcional)</Text>
        <TextInput value={paymentUrl} onChangeText={setPaymentUrl} placeholder="Ej. https://pagos.empresa.com" placeholderTextColor="#50677C" keyboardType="url" autoCapitalize="none" autoCorrect={false} style={styles.textInput} />
        <Text style={styles.inputLabel}>Referencia de pago (opcional)</Text>
        <TextInput value={paymentReference} onChangeText={setPaymentReference} placeholder="Ej. 1045872639" placeholderTextColor="#50677C" autoCapitalize="characters" autoCorrect={false} style={styles.textInput} />
        <View style={styles.reminderNote}>
          <Icon name="notifications-outline" size={19} color={COLORS.gold} />
          <Text style={styles.reminderText}>Te avisaré a las 9:00 a. m. un día antes y el mismo día. Si eliges 31, en meses más cortos usaré el último día.</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={sheet === 'editFixed' ? updateFixed : addFixed}><Text style={styles.primaryText}>{sheet === 'editFixed' ? 'Guardar cambios' : 'Agregar al plan'}</Text></Pressable>
      </Sheet>;
}
