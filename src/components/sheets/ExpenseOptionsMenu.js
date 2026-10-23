import { useTheme } from "../../theme/ThemeProvider";
import { Icon } from "../../components/ui";
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
export default function ExpenseOptionsMenu({
  expenseMenu,
  sheet,
  setExpenseMenu,
  expenseMenuAnchor,
  openFixedEditor,
  deleteFixed
}) {
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <Modal visible={expenseMenu && sheet === 'payFixed'} transparent statusBarTranslucent animationType="fade" onRequestClose={() => setExpenseMenu(false)}>
        <Pressable style={styles.expenseMenuOverlay} accessibilityLabel="Cerrar menú de opciones" onPress={() => setExpenseMenu(false)}>
          <View accessibilityViewIsModal style={[styles.expensePopup, {
        top: expenseMenuAnchor.y,
        left: expenseMenuAnchor.x
      }]}>
            <Pressable accessibilityRole="button" style={styles.expensePopupItem} onPress={() => {
          setExpenseMenu(false);
          openFixedEditor();
        }}><Icon name="edit" size={21} color={COLORS.text} /><Text style={styles.expensePopupText}>Editar gasto</Text></Pressable>
            <View style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: COLORS.line
        }} />
            <Pressable accessibilityRole="button" style={styles.expensePopupItem} onPress={() => {
          setExpenseMenu(false);
          deleteFixed();
        }}><Icon name="trash" size={21} color={COLORS.danger} /><Text style={[styles.expensePopupText, {
            color: COLORS.danger
          }]}>Eliminar gasto</Text></Pressable>
          </View>
        </Pressable>
      </Modal>;
}
