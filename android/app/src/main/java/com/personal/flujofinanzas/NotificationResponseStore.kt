package com.personal.flujofinanzas

import android.content.Context
import java.util.concurrent.CompletableFuture
import java.util.concurrent.Executors

/** Durable notification interactions, serialized off the UI and React bridge threads. */
object NotificationResponseStore {
  private const val STORE = "finance_notification_interaction"
  private val io = Executors.newSingleThreadExecutor { task ->
    Thread(task, "FinanceNotificationResponses").apply { isDaemon = true }
  }

  fun save(context: Context, response: String): CompletableFuture<Void> = CompletableFuture.runAsync({
    check(context.getSharedPreferences(STORE, Context.MODE_PRIVATE).commitTransaction { putString("last", response) }) {
      "No se pudo guardar la interacción"
    }
  }, io)

  fun read(context: Context): CompletableFuture<String?> = CompletableFuture.supplyAsync({
    context.getSharedPreferences(STORE, Context.MODE_PRIVATE).getString("last", null)
  }, io)

  fun clear(context: Context): CompletableFuture<Void> = CompletableFuture.runAsync({
    check(context.getSharedPreferences(STORE, Context.MODE_PRIVATE).commitTransaction { remove("last") }) {
      "No se pudo limpiar la interacción"
    }
  }, io)
}
