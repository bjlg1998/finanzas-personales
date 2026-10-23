import { useTheme } from "../../theme/ThemeProvider";
import { MoneyField, Sheet } from "../../components/ui";
import { Pressable, Text } from 'react-native';
import { parseMoney } from "../../domain/money";
export default function SavingsGoalSheet({
  sheet,
  closeSheet,
  amount,
  setAmount,
  setData
}) {
  const {
    styles
  } = useTheme();
  return <Sheet visible={sheet === 'goal'} onClose={closeSheet} title="Meta de ahorro">
        <MoneyField label="¿Cuánto quieres separar?" value={amount} onChange={setAmount} />
        <Text style={styles.sheetNote}>Este dinero se descuenta del disponible para ayudarte a no gastarlo.</Text>
        <Pressable style={styles.primaryButton} onPress={() => {
      setData(d => ({
        ...d,
        goal: parseMoney(amount)
      }));
      closeSheet();
    }}><Text style={styles.primaryText}>Guardar meta</Text></Pressable>
      </Sheet>;
}
