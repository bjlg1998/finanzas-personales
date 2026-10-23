import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { FinanceProvider } from './src/state/FinanceProvider';
import { useFinanceController } from './src/state/useFinanceController';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import AppShell from './src/components/AppShell';
import AppNoticeHost from './src/components/AppNoticeHost';
function ThemedApp({
  model
}) {
  const {
    styles
  } = useTheme();
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar barStyle="light-content" />
    <AppShell {...model} />
    <AppNoticeHost />
  </SafeAreaView>;
}
function FinanceApp() {
  const model = useFinanceController();
  return <ThemeProvider theme={model.data.theme}><ThemedApp model={model} /></ThemeProvider>;
}
export default function App() {
  return <SafeAreaProvider><FinanceProvider><FinanceApp /></FinanceProvider></SafeAreaProvider>;
}
