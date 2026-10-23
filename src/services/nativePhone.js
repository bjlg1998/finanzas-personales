import { NativeModules } from 'react-native';
export function phoneModule() {
  const module = NativeModules.FinanceNative;
  if (!module) throw new Error('El módulo Android FinanceNative no está instalado. Actualiza el APK.');
  return module;
}
export const copyText = text => phoneModule().copyText(text);
