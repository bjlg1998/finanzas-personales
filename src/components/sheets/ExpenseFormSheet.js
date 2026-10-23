import { useTheme } from "../../theme/ThemeProvider";
import { MoneyField, Sheet } from "../../components/ui";
import { Pressable, Text, TextInput } from 'react-native';
import CategoryPicker from '../CategoryPicker';
export default function ExpenseFormSheet({
  sheet,
  closeSheet,
  amount,
  setAmount,
  name,
  setName,
  setCategory,
  category,
  updateExpense,
  addExpense
}) {
  const {
    styles
  } = useTheme();
  return <Sheet visible={sheet === 'expense' || sheet === 'editExpense'} onClose={closeSheet} title={sheet === 'editExpense' ? "Editar gasto" : "Registrar gasto"}>
        <MoneyField label="¿Cuánto gastaste?" value={amount} onChange={setAmount} />
        <Text style={styles.inputLabel}>Descripción opcional</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ej. Almuerzo" placeholderTextColor="#50677C" style={styles.textInput} />
        <Text style={styles.inputLabel}>Categoría</Text>
        <CategoryPicker value={category} onChange={setCategory} />
        <Pressable style={styles.primaryButton} onPress={sheet === 'editExpense' ? updateExpense : addExpense}><Text style={styles.primaryText}>{sheet === 'editExpense' ? 'Guardar cambios' : 'Guardar gasto'}</Text></Pressable>
      </Sheet>;
}
