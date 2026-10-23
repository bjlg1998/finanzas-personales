package com.personal.flujofinanzas

import android.app.AlarmManager
import android.app.Application
import android.app.NotificationManager
import android.content.Context
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

/** Executes Android storage/alarm APIs on the JVM; no emulator or financial data. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28], application = Application::class)
class PaymentAlarmsTest {
  private lateinit var context: Context
  private val future get() = System.currentTimeMillis() + 86_400_000L
  private fun record(id: String = "light", date: Long = future) = JSONObject()
    .put("identifier", id).put("date", date)
    .put("content", JSONObject().put("title", "Pago").put("body", "Pendiente"))

  @Before fun prepare() {
    context = RuntimeEnvironment.getApplication()
    context.getSharedPreferences("finance_native_reminders_v1", Context.MODE_PRIVATE).edit().clear().commit()
  }

  @Test fun schedulingSameIdentifierReplacesInsteadOfDuplicating() {
    PaymentAlarms.schedule(context, record())
    PaymentAlarms.schedule(context, record(date = future + 1000))
    assertEquals(1, PaymentAlarms.list(context).length())
    assertEquals(1, shadowOf(context.getSystemService(AlarmManager::class.java)).scheduledAlarms.size)
  }

  @Test fun cancellationRemovesStorageAndSystemAlarm() {
    PaymentAlarms.schedule(context, record())
    PaymentAlarms.cancel(context, "light")
    PaymentAlarms.cancel(context, "light")
    assertEquals(0, PaymentAlarms.list(context).length())
    assertTrue(shadowOf(context.getSystemService(AlarmManager::class.java)).scheduledAlarms.isEmpty())
  }

  @Test fun reminderCanOnlyBeTakenOnce() {
    PaymentAlarms.schedule(context, record())
    assertNotNull(PaymentAlarms.take(context, "light"))
    assertNull(PaymentAlarms.take(context, "light"))
    assertNull(PaymentAlarms.take(context, "unknown"))
  }

  @Test fun startupRestoreDoesNotConsumeAlarmThatStartedTheProcess() {
    val prefs = context.getSharedPreferences("finance_native_reminders_v1", Context.MODE_PRIVATE)
    prefs.edit().putString("light", record(date = System.currentTimeMillis() - 1000).toString()).commit()
    PaymentAlarms.restore(context)
    assertNotNull(PaymentAlarms.take(context, "light"))
  }

  @Test fun repeatedRestoreKeepsOneAlarmPerReminder() {
    PaymentAlarms.schedule(context, record("light"))
    PaymentAlarms.schedule(context, record("water"))
    repeat(3) { PaymentAlarms.restore(context) }
    assertEquals(2, PaymentAlarms.list(context).length())
    assertEquals(2, shadowOf(context.getSystemService(AlarmManager::class.java)).scheduledAlarms.size)
  }

  @Test fun pastDatesAreNotScheduled() {
    PaymentAlarms.schedule(context, record(date = System.currentTimeMillis() - 1000))
    assertEquals(0, PaymentAlarms.list(context).length())
    assertTrue(shadowOf(context.getSystemService(AlarmManager::class.java)).scheduledAlarms.isEmpty())
  }

  @Test fun notificationChannelIsIdempotentAndHighImportance() {
    repeat(2) { PaymentAlarms.configure(context) }
    val manager = context.getSystemService(NotificationManager::class.java)
    assertEquals(1, manager.notificationChannels.size)
    assertEquals(NotificationManager.IMPORTANCE_HIGH, manager.getNotificationChannel("pagos").importance)
  }
}
