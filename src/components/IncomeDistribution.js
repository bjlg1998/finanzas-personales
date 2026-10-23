import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { money } from '../domain/money';
import { legendColumns } from './distributionLayout';
export default function IncomeDistribution({
  distribution,
  available
}) {
  const {
    styles,
    colors
  } = useTheme();
  const {
    width,
    fontScale
  } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const columns = legendColumns(measuredWidth || width - 74, fontScale);
  if (!distribution.length) return null;
  return <View style={styles.distributionCard}>
    <Text style={styles.distributionTitle}>Distribución de ingresos</Text>
    <View accessible accessibilityLabel={distribution.map(part => `${part.label}: ${part.percent.toFixed(1)} por ciento, ${money(part.amount)}`).join('. ')} style={styles.distributionBar}>
      {distribution.map(part => <View key={part.label} style={[styles.distributionSegment, {
        width: `${part.width}%`,
        backgroundColor: part.color
      }]} />)}
    </View>
    <View style={styles.distributionLegend} onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}>
      {distribution.map(part => <View key={part.label} style={[styles.distributionLegendItem, {
        width: `${100 / columns}%`
      }]}>
        <View style={[styles.distributionDot, {
          backgroundColor: part.color
        }]} />
        <View style={{
          flex: 1
        }}><Text style={styles.distributionLabel}>{part.label}</Text><Text style={styles.distributionHint}>{Math.round(part.percent)}%</Text></View>
      </View>)}
    </View>
    {available < 0 && <Text style={[styles.fixedHint, {
      color: colors.danger,
      marginTop: 10
    }]}>Excedes tu ingreso en {money(-available)}. Los porcentajes se calculan sobre tu ingreso; la barra se ajusta al total comprometido.</Text>}
  </View>;
}
