import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './ui';
import { useTheme } from '../theme/ThemeProvider';
export default function AppDialog({
  visible,
  title,
  message,
  actions,
  icon = 'notifications',
  danger = false,
  onDismiss
}) {
  const {
    styles,
    colors
  } = useTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
    <SafeAreaView style={{
      flex: 1
    }} edges={['top', 'bottom']}>
      <Pressable style={styles.confirmOverlay} onPress={onDismiss}>
        <View accessibilityViewIsModal style={[styles.confirmCard, {
          maxHeight: '85%',
          width: '100%',
          maxWidth: 460,
          alignSelf: 'center'
        }]} onStartShouldSetResponder={() => true}>
          <ScrollView style={{
            flexGrow: 0,
            width: '100%'
          }} contentContainerStyle={{
            alignItems: 'center'
          }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[styles.confirmIcon, danger && styles.confirmIconDanger]}><Icon name={icon} size={26} color={danger ? colors.danger : colors.mint} /></View>
            <Text accessibilityRole="header" style={styles.confirmTitle}>{title}</Text>
            <Text style={styles.confirmMessage}>{message}</Text>
            <View style={{
              gap: 10,
              width: '100%'
            }}>
              {actions.map((action, index) => <Pressable key={index} accessibilityRole="button" onPress={action.onPress} style={[action.style === 'cancel' ? styles.confirmCancel : styles.confirmAccept, {
                flex: 0,
                minHeight: 50,
                height: undefined,
                paddingVertical: 12,
                paddingHorizontal: 16
              }, action.style === 'destructive' && styles.confirmAcceptDanger]}>
                <Text style={action.style === 'cancel' ? styles.confirmCancelText : styles.confirmAcceptText}>{action.text}</Text>
              </Pressable>)}
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </SafeAreaView>
  </Modal>;
}
