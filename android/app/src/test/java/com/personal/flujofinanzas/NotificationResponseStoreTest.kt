package com.personal.flujofinanzas

import android.app.Application
import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import java.util.concurrent.TimeUnit
import java.util.concurrent.ExecutionException

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28], application = Application::class)
class NotificationResponseStoreTest {
  @Test fun writeReadAndClearRemainOrderedWithoutBlockingTheCaller() {
    val context = RuntimeEnvironment.getApplication()
    NotificationResponseStore.save(context, "first")
    NotificationResponseStore.save(context, "last")
    assertEquals("last", NotificationResponseStore.read(context).get(5, TimeUnit.SECONDS))
    NotificationResponseStore.clear(context)
    assertNull(NotificationResponseStore.read(context).get(5, TimeUnit.SECONDS))
  }

  @Test fun persistenceIsNeverAccessedOnTheCallingThread() {
    val caller = Thread.currentThread()
    val context = object : ContextWrapper(RuntimeEnvironment.getApplication()) {
      override fun getSharedPreferences(name: String, mode: Int): SharedPreferences {
        check(Thread.currentThread() !== caller) { "Disk access on the caller thread" }
        return super.getSharedPreferences(name, mode)
      }
    }
    NotificationResponseStore.save(context, "response").get(5, TimeUnit.SECONDS)
    assertEquals("response", NotificationResponseStore.read(context).get(5, TimeUnit.SECONDS))
    NotificationResponseStore.clear(context).get(5, TimeUnit.SECONDS)
  }

  @Test fun aStorageFailureIsReportedAndDoesNotPoisonFollowingOperations() {
    val context = RuntimeEnvironment.getApplication()
    NotificationResponseStore.save(context, "previous").get(5, TimeUnit.SECONDS)
    val failingContext = object : ContextWrapper(context) {
      override fun getSharedPreferences(name: String, mode: Int): SharedPreferences {
        throw IllegalStateException("Simulated storage failure")
      }
    }
    assertThrows(ExecutionException::class.java) {
      NotificationResponseStore.save(failingContext, "replacement").get(5, TimeUnit.SECONDS)
    }
    assertEquals("previous", NotificationResponseStore.read(context).get(5, TimeUnit.SECONDS))
    NotificationResponseStore.clear(context).get(5, TimeUnit.SECONDS)
  }
}
