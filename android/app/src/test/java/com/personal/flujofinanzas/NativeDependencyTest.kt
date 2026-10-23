package com.personal.flujofinanzas

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okio.Buffer
import okio.GzipSink
import okio.GzipSource
import okio.buffer
import org.junit.Assert.assertEquals
import org.junit.Test

/** Real OkHttp/Okio binary compatibility; no mocks, no network and no emulator. */
class NativeDependencyTest {
  @Test fun okHttpWritesRequestBodyThroughUpgradedOkio() {
    val buffer = Buffer()
    "finanzas".toRequestBody("text/plain".toMediaType()).writeTo(buffer)
    assertEquals("finanzas", buffer.readUtf8())
  }

  @Test fun gzipRoundTripUsesRealOkioImplementation() {
    val output = Buffer()
    GzipSink(output).buffer().use { it.writeUtf8("Referencia 123456") }
    GzipSource(output).buffer().use { assertEquals("Referencia 123456", it.readUtf8()) }
  }
}
