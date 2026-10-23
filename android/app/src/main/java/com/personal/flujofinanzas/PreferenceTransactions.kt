package com.personal.flujofinanzas

import android.content.SharedPreferences

/** Unlike Core KTX edit(commit=true), preserve commit's success/failure result. */
internal fun SharedPreferences.commitTransaction(change: SharedPreferences.Editor.() -> Unit): Boolean {
  val transaction = edit()
  transaction.change()
  return transaction.commit()
}
