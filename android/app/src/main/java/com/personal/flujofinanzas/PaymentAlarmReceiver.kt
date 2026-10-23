package com.personal.flujofinanzas

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.net.toUri
import org.json.JSONArray
import org.json.JSONObject

/** Persistent one-shot reminders. Take-before-delivery prevents repeated broadcasts. */
object PaymentAlarms {
  private const val STORE = "finance_native_reminders_v1"
  private fun preferences(context: Context) = context.getSharedPreferences(STORE, Context.MODE_PRIVATE)
  fun configure(context: Context) {
    if (Build.VERSION.SDK_INT >= 26) {
      val channel = NotificationChannel("pagos", "Recordatorios de pagos", NotificationManager.IMPORTANCE_HIGH)
      channel.enableVibration(true)
      channel.vibrationPattern = longArrayOf(0, 250, 250, 250)
      context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }
  private fun pending(context: Context, id: String): PendingIntent = PendingIntent.getBroadcast(
    context, 0,
    Intent(context, PaymentAlarmReceiver::class.java).setAction("FINANCE_PAYMENT")
      .setData(("finanzas://payment/" + Uri.encode(id)).toUri()).putExtra("id", id),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )
  @Synchronized fun schedule(context: Context, record: JSONObject) {
    val id = record.getString("identifier")
    val date = record.getLong("date")
    if (date <= System.currentTimeMillis()) return
    if (!preferences(context).commitTransaction { putString(id, record.toString()) }) throw IllegalStateException("No se pudo guardar el recordatorio")
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    // Inexact alarms respect Android battery policy and require no exact-alarm privilege.
    manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, date, pending(context, id))
  }
  @Synchronized fun cancel(context: Context, id: String) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(pending(context, id))
    if (!preferences(context).commitTransaction { remove(id) }) throw IllegalStateException("No se pudo cancelar el recordatorio")
  }
  @Synchronized fun list(context: Context): JSONArray {
    val result = JSONArray()
    for ((_, value) in preferences(context).all) if (value is String) {
      result.put(JSONObject(value))
    }
    return result
  }
  @Synchronized fun take(context: Context, id: String): JSONObject? {
    val value = preferences(context).getString(id, null) ?: return null
    if (!preferences(context).commitTransaction { remove(id) }) return null
    return JSONObject(value)
  }
  fun restore(context: Context) {
    configure(context)
    val records = list(context)
    for (i in 0 until records.length()) {
      val record = records.getJSONObject(i)
      if (record.getLong("date") > System.currentTimeMillis()) schedule(context, record)
      // Do not remove past-due entries here: process startup can be caused by the
      // alarm itself. The receiver must still be able to atomically take its entry.
    }
  }
}

class PaymentAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra("id") ?: return
    val record = PaymentAlarms.take(context, id) ?: return
    PaymentAlarms.configure(context)
    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
    val content = record.getJSONObject("content")
    val response = JSONObject().put("notification", JSONObject().put("request", record)).toString()
    val launch = Intent(context, MainActivity::class.java)
      .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      .setData(("finanzas://open/" + Uri.encode(id)).toUri())
      .putExtra(FinanceNativeModule.RESPONSE_EXTRA, response)
    val tap = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val notification = NotificationCompat.Builder(context, "pagos")
      .setSmallIcon(R.drawable.notification_payment)
      .setContentTitle(content.getString("title"))
      .setContentText(content.getString("body"))
      .setStyle(NotificationCompat.BigTextStyle().bigText(content.getString("body")))
      .setContentIntent(tap).setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setDefaults(NotificationCompat.DEFAULT_ALL).build()
    try { NotificationManagerCompat.from(context).notify(id, 0, notification) }
    catch (_: SecurityException) { /* Permission may be revoked between checking and delivery. */ }
  }
}

class PaymentBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
      PaymentAlarms.restore(context)
    }
  }
}
