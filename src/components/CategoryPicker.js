import { Pressable, Text, View } from 'react-native';
import { PAYMENT_CATEGORIES } from '../domain/categories';
import { useTheme } from '../theme/ThemeProvider';
export default function CategoryPicker({
  value,
  onChange
}) {
  const {
    styles,
    colors
  } = useTheme();
  return <View style={styles.chips}>
    {Object.entries(PAYMENT_CATEGORIES).map(([label, color]) => <Pressable key={label} accessibilityRole="button" accessibilityState={{
      selected: value === label
    }} onPress={() => onChange(label)} style={[styles.chip, {
      borderWidth: 1,
      borderColor: value === label ? color : colors.line,
      backgroundColor: value === label ? color + '25' : colors.card2
    }]}>
        <Text style={[styles.chipText, {
        color
      }]}>{label}</Text>
      </Pressable>)}
  </View>;
}
