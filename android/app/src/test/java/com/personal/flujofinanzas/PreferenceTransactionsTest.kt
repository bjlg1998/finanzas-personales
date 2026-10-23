package com.personal.flujofinanzas

import android.content.SharedPreferences
import java.lang.reflect.Proxy
import org.junit.Assert.*
import org.junit.Test

class PreferenceTransactionsTest {
  @Test fun transactionPreservesDiskFailureAndCommitsExactlyOnce() {
    val calls = mutableListOf<String>()
    val editor = Proxy.newProxyInstance(SharedPreferences.Editor::class.java.classLoader,
      arrayOf(SharedPreferences.Editor::class.java)) { proxy, method, _ ->
      calls.add(method.name)
      if (method.name == "commit") false else proxy
    } as SharedPreferences.Editor
    val preferences = Proxy.newProxyInstance(SharedPreferences::class.java.classLoader,
      arrayOf(SharedPreferences::class.java)) { _, method, _ ->
      check(method.name == "edit")
      editor
    } as SharedPreferences
    assertFalse(preferences.commitTransaction { putString("last", "test") })
    assertEquals(listOf("putString", "commit"), calls)
  }
}
