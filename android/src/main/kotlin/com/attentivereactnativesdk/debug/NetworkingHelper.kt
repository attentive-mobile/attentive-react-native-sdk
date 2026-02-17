package com.attentivereactnativesdk.debug

import android.util.Log
import okhttp3.*
import okhttp3.logging.HttpLoggingInterceptor
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Networking helper for debugging HTTP requests made by the Attentive SDK.
 * 
 * This class provides:
 * - HTTP request/response logging
 * - Network call tracking for debugging
 * - Integration with the debug overlay
 * 
 * Note: This is for debugging purposes only and should be disabled in production builds.
 */
class NetworkingHelper(private val debugHelper: AttentiveDebugHelper) {
    
    companion object {
        private const val TAG = "AttentiveNetworking"
        
        /**
         * Creates an OkHttpClient with logging interceptor for debugging network calls.
         * This can be used to wrap network requests and log all traffic.
         * 
         * @param enableLogging Whether to enable detailed HTTP logging
         * @return Configured OkHttpClient instance
         */
        fun createDebugClient(enableLogging: Boolean = true): OkHttpClient {
            val builder = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
            
            if (enableLogging) {
                val loggingInterceptor = HttpLoggingInterceptor { message ->
                    Log.d(TAG, "🌐 [HTTP] $message")
                }.apply {
                    level = HttpLoggingInterceptor.Level.BODY
                }
                
                builder.addInterceptor(loggingInterceptor)
            }
            
            return builder.build()
        }
    }
    
    /**
     * Logs a network request for debugging purposes.
     * 
     * @param url The request URL
     * @param method The HTTP method (GET, POST, etc.)
     * @param headers Request headers
     * @param body Request body (if any)
     */
    fun logRequest(
        url: String,
        method: String,
        headers: Map<String, String>? = null,
        body: String? = null
    ) {
        Log.i(TAG, "📤 [Network Request]")
        Log.i(TAG, "   Method: $method")
        Log.i(TAG, "   URL: $url")
        
        headers?.let {
            Log.d(TAG, "   Headers:")
            it.forEach { (key, value) ->
                Log.d(TAG, "      $key: $value")
            }
        }
        
        body?.let {
            Log.d(TAG, "   Body: $it")
        }
        
        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["request_method"] = method
            debugData["request_url"] = url
            headers?.let { debugData["headers_count"] = it.size.toString() }
            body?.let { debugData["body_length"] = it.length.toString() }
            
            debugHelper.showDebugInfo("Network Request", debugData)
        }
    }
    
    /**
     * Logs a network response for debugging purposes.
     * 
     * @param url The request URL
     * @param statusCode HTTP status code
     * @param headers Response headers
     * @param body Response body (if any)
     * @param durationMs Request duration in milliseconds
     */
    fun logResponse(
        url: String,
        statusCode: Int,
        headers: Map<String, String>? = null,
        body: String? = null,
        durationMs: Long? = null
    ) {
        val statusEmoji = when {
            statusCode in 200..299 -> "✅"
            statusCode in 300..399 -> "↪️"
            statusCode in 400..499 -> "⚠️"
            statusCode >= 500 -> "❌"
            else -> "❓"
        }
        
        Log.i(TAG, "📥 [Network Response] $statusEmoji")
        Log.i(TAG, "   URL: $url")
        Log.i(TAG, "   Status: $statusCode")
        durationMs?.let { Log.i(TAG, "   Duration: ${it}ms") }
        
        headers?.let {
            Log.d(TAG, "   Headers:")
            it.forEach { (key, value) ->
                Log.d(TAG, "      $key: $value")
            }
        }
        
        body?.let {
            Log.d(TAG, "   Body: ${it.take(500)}${if (it.length > 500) "..." else ""}")
        }
        
        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["response_status"] = statusCode.toString()
            debugData["response_url"] = url
            debugData["status_emoji"] = statusEmoji
            headers?.let { debugData["headers_count"] = it.size.toString() }
            body?.let { debugData["body_length"] = it.length.toString() }
            durationMs?.let { debugData["duration_ms"] = it.toString() }
            
            debugHelper.showDebugInfo("Network Response", debugData)
        }
    }
    
    /**
     * Logs a network error for debugging purposes.
     * 
     * @param url The request URL
     * @param error The error that occurred
     * @param durationMs Request duration in milliseconds (if applicable)
     */
    fun logError(
        url: String,
        error: Throwable,
        durationMs: Long? = null
    ) {
        Log.e(TAG, "❌ [Network Error]")
        Log.e(TAG, "   URL: $url")
        Log.e(TAG, "   Error: ${error.message}")
        durationMs?.let { Log.e(TAG, "   Duration: ${it}ms") }
        Log.e(TAG, "   Exception:", error)
        
        if (debugHelper.isDebuggingEnabled()) {
            val debugData = mutableMapOf<String, Any>()
            debugData["error_url"] = url
            debugData["error_message"] = error.message ?: "Unknown error"
            debugData["error_type"] = error.javaClass.simpleName
            durationMs?.let { debugData["duration_ms"] = it.toString() }
            
            debugHelper.showDebugInfo("Network Error", debugData)
        }
    }
    
    /**
     * Creates an interceptor that can be added to OkHttpClient for automatic logging.
     * This is useful for transparently logging all SDK network calls.
     * 
     * @return An OkHttp Interceptor for network logging
     */
    fun createLoggingInterceptor(): Interceptor {
        return Interceptor { chain ->
            val request = chain.request()
            val startTime = System.currentTimeMillis()
            
            // Log request
            logRequest(
                url = request.url.toString(),
                method = request.method,
                headers = request.headers.toMultimap().mapValues { it.value.firstOrNull() ?: "" },
                body = request.body?.toString()
            )
            
            try {
                val response = chain.proceed(request)
                val duration = System.currentTimeMillis() - startTime
                
                // Log response
                logResponse(
                    url = request.url.toString(),
                    statusCode = response.code,
                    headers = response.headers.toMultimap().mapValues { it.value.firstOrNull() ?: "" },
                    body = response.peekBody(1024).string(),
                    durationMs = duration
                )
                
                response
            } catch (e: IOException) {
                val duration = System.currentTimeMillis() - startTime
                
                // Log error
                logError(
                    url = request.url.toString(),
                    error = e,
                    durationMs = duration
                )
                
                throw e
            }
        }
    }
}
