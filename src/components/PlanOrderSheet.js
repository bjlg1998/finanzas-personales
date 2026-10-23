import { Pressable, Text, View } from 'react-native';
import { Sheet, Icon } from './ui';
import { useTheme } from '../theme/ThemeProvider';
import { PLAN_ORDER_OPTIONS } from '../domain/planOrdering';
export default function PlanOrderSheet({
  visible,
  value,
  onChange,
  onClose
}) {
  const {
    styles,
    colors
  } = useTheme();
  return <Sheet visible={visible} onClose={onClose} title="Ordenar lista">
    <Text style={styles.sheetNote}>Elige cómo ver tus gastos, sin separarlos en grupos. Tu elección se guarda.</Text>
    {PLAN_ORDER_OPTIONS.map(([id, label]) => <Pressable key={id} accessibilityRole="radio" accessibilityState={{
      checked: value === id
    }} style={styles.settingRow} onPress={() => {
      onChange(id);
      onClose();
    }}>
      <Text style={[styles.fixedName, {
        flex: 1
      }]}>{label}</Text>
      <View style={{
        width: 24
      }}>{value === id && <Icon name="checkmark" size={22} color={colors.mint} />}</View>
    </Pressable>)}
  </Sheet>;
}
