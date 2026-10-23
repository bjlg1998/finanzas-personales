import React from 'react';
import { View, Text, Image, TextInput, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { formatMoneyInput } from '../domain/money';
import { BarChart3, Bell, Banknote, Car, ChartPie, Check, ChevronRight, CircleEllipsis, CalendarDays, Copy, ExternalLink, Fingerprint, Gamepad2, History, Home, Leaf, Plus, ReceiptText, Pencil, Settings, ShieldCheck, ShoppingCart, Sparkles, Sun, Trash2, TrendingUp, X, EllipsisVertical } from 'lucide-react-native';
const ICONS = {
  add: Plus,
  'bar-chart': BarChart3,
  calendar: CalendarDays,
  car: Car,
  cart: ShoppingCart,
  checkmark: Check,
  'chevron-forward': ChevronRight,
  close: X,
  'finger-print': Fingerprint,
  'game-controller': Gamepad2,
  home: Home,
  leaf: Leaf,
  notifications: Bell,
  'pie-chart': ChartPie,
  receipt: ReceiptText,
  settings: Settings,
  shield: ShieldCheck,
  'shield-checkmark': ShieldCheck,
  sparkles: Sparkles,
  sunny: Sun,
  time: History,
  'trending-up': TrendingUp,
  cash: Banknote,
  copy: Copy,
  edit: Pencil,
  'external-link': ExternalLink,
  trash: Trash2,
  options: EllipsisVertical
};
function Icon({
  name,
  size = 24,
  color
}) {
  const {
    colors: COLORS
  } = useTheme();
  const normalized = String(name || '').replace(/-outline$/, '');
  const Glyph = ICONS[normalized] || CircleEllipsis;
  return <Glyph width={size} height={size} color={color || COLORS.text} strokeWidth={2.2} />;
}
const Header = React.memo(function Header({
  title,
  subtitle
}) {
  const {
    styles
  } = useTheme();
  return <View style={styles.header}>
      <View style={{
      flex: 1,
      paddingRight: 12
    }}>
        <Text style={styles.eyebrow}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Image source={require('../../assets/finanzas-icon-v2.png')} style={styles.logo} />
    </View>;
});
const Stat = React.memo(function Stat({
  label,
  value,
  tone = 'normal'
}) {
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'mint' && {
      color: COLORS.mint
    }]}>{value}</Text>
    </View>;
});
const Empty = React.memo(function Empty({
  icon,
  text
}) {
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <View style={styles.empty}>
      <Icon name={icon} size={28} color={COLORS.muted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>;
});
function MoneyField({
  label,
  value,
  onChange,
  placeholder = '0'
}) {
  const {
    styles
  } = useTheme();
  return <View style={{
    marginBottom: 16
  }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.moneyInputWrap}>
        <Text style={styles.currency}>$</Text>
        <TextInput value={value} onChangeText={text => onChange(formatMoneyInput(text))} placeholder={placeholder} placeholderTextColor="#50677C" keyboardType="numeric" style={styles.moneyInput} />
      </View>
    </View>;
}
function Sheet({
  visible,
  onClose,
  title,
  children
}) {
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheetSafeArea} edges={['top']}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable onPress={onClose}><Icon name="close" size={24} color={COLORS.text} /></Pressable>
            </View>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </SafeAreaView>
    </Modal>;
}
export { Icon, Header, Stat, Empty, MoneyField, Sheet };
