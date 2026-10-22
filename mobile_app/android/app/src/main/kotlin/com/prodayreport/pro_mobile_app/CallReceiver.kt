package com.prodayreport.pro_mobile_app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.TelephonyManager
import androidx.core.app.NotificationCompat
import org.json.JSONObject

class CallReceiver : BroadcastReceiver() {

    companion object {
        private const val CHANNEL_ID = "pro_caller_id_channel"
        private const val CHANNEL_NAME = "Incoming Student Call Alerts"
        private const val NOTIFICATION_ID = 9001
        private const val MISSED_CALL_NOTIFICATION_ID = 9002

        private var lastState = TelephonyManager.EXTRA_STATE_IDLE
        private var lastIncomingNumber = ""
        private var isIncoming = false
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        val numberExtra = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return

        createNotificationChannel(notificationManager)

        if (state == TelephonyManager.EXTRA_STATE_RINGING) {
            isIncoming = true
            if (!numberExtra.isNullOrEmpty()) {
                lastIncomingNumber = numberExtra
            }

            val student = findStudent(context, lastIncomingNumber)
            if (student != null) {
                showIncomingCallNotification(context, notificationManager, student)
            }
        } else if (state == TelephonyManager.EXTRA_STATE_OFFHOOK) {
            // Call answered - dismiss incoming alert banner
            notificationManager.cancel(NOTIFICATION_ID)
        } else if (state == TelephonyManager.EXTRA_STATE_IDLE) {
            // Call ended / missed
            notificationManager.cancel(NOTIFICATION_ID)

            // If it was a missed call from a known student
            if (isIncoming && lastState == TelephonyManager.EXTRA_STATE_RINGING && lastIncomingNumber.isNotEmpty()) {
                val student = findStudent(context, lastIncomingNumber)
                if (student != null) {
                    showMissedCallNotification(context, notificationManager, student)
                }
            }

            isIncoming = false
            lastIncomingNumber = ""
        }

        lastState = state
    }

    private fun createNotificationChannel(manager: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existing = manager.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Displays student profile information during incoming calls"
                    enableVibration(false)
                    setSound(null, null)
                    setShowBadge(true)
                }
                manager.createNotificationChannel(channel)
            }
        }
    }

    private fun findStudent(context: Context, rawNumber: String): JSONObject? {
        if (rawNumber.isEmpty()) return null
        val clean = rawNumber.replace(Regex("\\D"), "")
        val last10 = if (clean.length >= 10) clean.substring(clean.length - 10) else clean
        if (last10.isEmpty()) return null

        try {
            val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val jsonStr = prefs.getString("flutter.pro_caller_id_cache", null) ?: return null
            val root = JSONObject(jsonStr)
            if (root.has(last10)) {
                return root.getJSONObject(last10)
            }
        } catch (_: Exception) {}
        return null
    }

    private fun showIncomingCallNotification(
        context: Context,
        manager: NotificationManager,
        student: JSONObject
    ) {
        val name = student.optString("name", "Student")
        val school = student.optString("school", "")
        val mandal = student.optString("mandal", "")
        val village = student.optString("village", "")
        val group = student.optString("group", "")
        val isStar = student.optBoolean("star", false)

        val starPrefix = if (isStar) "⭐ [STAR LEAD] " else ""
        val title = "$starPrefix$name ${if (group.isNotEmpty()) "($group)" else ""}".trim()

        val detailsList = mutableListOf<String>()
        if (school.isNotEmpty()) detailsList.add("🏫 $school")
        val loc = listOf(village, mandal).filter { it.isNotEmpty() }.joinToString(", ")
        if (loc.isNotEmpty()) detailsList.add("📍 $loc")
        val text = if (detailsList.isNotEmpty()) detailsList.joinToString(" • ") else "PRO Day Report Student"

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = if (launchIntent != null) {
            PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            )
        } else null

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.sym_action_call)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setOngoing(true)
            .setContentIntent(pendingIntent)

        manager.notify(NOTIFICATION_ID, builder.build())
    }

    private fun showMissedCallNotification(
        context: Context,
        manager: NotificationManager,
        student: JSONObject
    ) {
        val name = student.optString("name", "Student")
        val school = student.optString("school", "")
        val title = "📞 Missed Call: $name"
        val text = "School: $school. Tap to open profile in PRO App."

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = if (launchIntent != null) {
            PendingIntent.getActivity(
                context,
                1,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            )
        } else null

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.sym_call_missed)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        manager.notify(MISSED_CALL_NOTIFICATION_ID, builder.build())
    }
}
