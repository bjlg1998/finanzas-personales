import { phoneModule } from './nativePhone';
export async function canUseBiometrics() {
  return phoneModule().canAuthenticate();
}
export async function authenticate() {
  if (!(await canUseBiometrics())) return {
    success: false,
    unavailable: true
  };
  return {
    success: await phoneModule().authenticate()
  };
}
