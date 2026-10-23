package com.personal.flujofinanzas

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.core.app.NotificationManagerCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

class FinanceNativeModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "FinanceNative"
  companion object {
    const val RESPONSE_EXTRA = "finance_notification_response"
    fun captureIntent(application: MainApplication, intent: Intent?) {
      val response = intent?.getStringExtra(RESPONSE_EXTRA) ?: return
      NotificationResponseStore.save(application, response).whenComplete { _, error ->
        if (error != null) {
          Log.e("FinanceNative", "No se pudo guardar la interacción de notificación", error)
        } else Handler(Looper.getMainLooper()).post {
          intent.removeExtra(RESPONSE_EXTRA)
          val reactContext = application.reactHost.currentReactContext ?: return@post
          val payload = Arguments.createMap().apply { putString("responseJson", response) }
          reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("FinanceNotificationResponse", payload)
        }
      }
    }
  }
  @ReactMethod fun addListener(event: String) {}
  @ReactMethod fun removeListeners(count: Double) {}
  @ReactMethod fun canAuthenticate(promise: Promise) {
    promise.resolve(BiometricManager.from(context).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS)
  }
  @ReactMethod fun authenticate(promise: Promise) {
    val activity = currentActivity as? FragmentActivity
    if (activity == null) { promise.reject("NO_ACTIVITY", "No hay actividad disponible"); return }
    activity.runOnUiThread {
      val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(context), object: BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) { promise.resolve(true) }
        override fun onAuthenticationError(code: Int, message: CharSequence) { promise.resolve(false) }
      })
      val builder = BiometricPrompt.PromptInfo.Builder().setTitle("Finanzas Personales")
      builder.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
      prompt.authenticate(builder.build())
    }
  }
  @ReactMethod fun copyText(value: String, promise: Promise) {
    try {
      (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Referencia de pago", value))
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("CLIPBOARD", error) }
  }
  @ReactMethod fun configureNotifications(promise: Promise) {
    try { PaymentAlarms.configure(context); promise.resolve(null) }
    catch (error: Exception) { promise.reject("CHANNEL", error) }
  }
  @ReactMethod fun notificationsEnabled(promise: Promise) { promise.resolve(NotificationManagerCompat.from(context).areNotificationsEnabled()) }
  @ReactMethod fun scheduledNotifications(promise: Promise) {
    try { promise.resolve(PaymentAlarms.list(context).toString()) }
    catch (error: Exception) { promise.reject("REMINDERS", error) }
  }
  @ReactMethod fun scheduleNotification(id: String, date: Double, title: String, body: String, data: String, promise: Promise) {
    try {
      require(date.isFinite() && date > 0)
      PaymentAlarms.schedule(context, JSONObject().put("identifier", id).put("date", date.toLong())
        .put("content", JSONObject().put("title", title).put("body", body).put("data", JSONObject(data))))
      promise.resolve(id)
    } catch (error: Exception) { promise.reject("SCHEDULE", error) }
  }
  @ReactMethod fun cancelNotification(id: String, promise: Promise) {
    try { PaymentAlarms.cancel(context, id); promise.resolve(null) }
    catch (error: Exception) { promise.reject("CANCEL", error) }
  }
  @ReactMethod fun lastNotificationResponse(promise: Promise) {
    NotificationResponseStore.read(context).whenComplete { value, error ->
      if (error == null) promise.resolve(value) else promise.reject("RESPONSE", error)
    }
  }
  @ReactMethod fun clearNotificationResponse(promise: Promise) {
    NotificationResponseStore.clear(context).whenComplete { _, error ->
      if (error == null) promise.resolve(null) else promise.reject("RESPONSE", error)
    }
  }
}
