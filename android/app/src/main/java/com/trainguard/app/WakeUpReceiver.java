package com.trainguard.app;

import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * Rings the wake-up alarm. Alarm-clock mode fires on time even when the phone is idle, and the notification
 * uses the alarm sound and category, so it plays through silent mode and the default Do Not Disturb settings.
 */
public class WakeUpReceiver extends BroadcastReceiver {
    static final String RING = "com.trainguard.app.WAKE_RING";
    static final String STOP = "com.trainguard.app.WAKE_STOP";
    static final int NOTIFICATION = 4242;
    private static final String CHANNEL = "wakeup_alarm";
    private static final String PREFS = "trainguard_wakeup";
    private static final long[] BUZZ = { 0, 800, 400, 800, 400, 800 };

    static boolean schedule(Context ctx, long at, String title, String stop) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putLong("at", at).putString("title", title).putString("stop", stop).apply();
        return arm(ctx, at);
    }

    /** Sets the saved alarm again after a restart or an app update, which both clear it. */
    static void rearm(Context ctx) {
        long at = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong("at", 0);
        if (at > System.currentTimeMillis()) arm(ctx, at);
    }

    static void cancel(Context ctx) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        ctx.getSystemService(AlarmManager.class).cancel(ringIntent(ctx));
    }

    private static boolean arm(Context ctx, long at) {
        AlarmManager alarms = ctx.getSystemService(AlarmManager.class);
        if (Build.VERSION.SDK_INT >= 31 && !alarms.canScheduleExactAlarms()) return false;
        PendingIntent show = PendingIntent.getActivity(ctx, 2, new Intent(ctx, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        alarms.setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), ringIntent(ctx));
        return true;
    }

    private static PendingIntent ringIntent(Context ctx) {
        return PendingIntent.getBroadcast(ctx, 1, new Intent(ctx, WakeUpReceiver.class).setAction(RING), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (STOP.equals(intent.getAction())) {
            NotificationManagerCompat.from(ctx).cancel(NOTIFICATION);
        } else if (RING.equals(intent.getAction())) {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            ring(ctx, prefs.getString("title", "Wake up"), prefs.getString("stop", "Stop"));
            prefs.edit().clear().apply();
        }
    }

    @SuppressLint("MissingPermission")
    private static void ring(Context ctx, String title, String stop) {
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = ctx.getSystemService(NotificationManager.class);
            if (manager.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel channel = new NotificationChannel(CHANNEL, "Wake-up alarm", NotificationManager.IMPORTANCE_HIGH);
                channel.setSound(sound, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                channel.enableVibration(true);
                channel.setVibrationPattern(BUZZ);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(channel);
            }
        }
        Intent screen = new Intent(ctx, WakeUpActivity.class)
            .putExtra("title", title)
            .putExtra("stop", stop)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        PendingIntent open = PendingIntent.getActivity(ctx, 3, screen, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent quiet = PendingIntent.getBroadcast(ctx, 4, new Intent(ctx, WakeUpReceiver.class).setAction(STOP), PendingIntent.FLAG_IMMUTABLE);
        Notification note = new NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_wake)
            .setContentTitle(title)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(open, true)
            .setContentIntent(open)
            .addAction(0, stop, quiet)
            .setOngoing(true)
            .setTimeoutAfter(10 * 60 * 1000)
            .setSound(sound, AudioManager.STREAM_ALARM)
            .setVibrate(BUZZ)
            .build();
        // Insistent repeats the sound until someone stops it, like an alarm clock, instead of playing it once.
        note.flags |= Notification.FLAG_INSISTENT;
        try {
            NotificationManagerCompat.from(ctx).notify(NOTIFICATION, note);
        } catch (SecurityException e) {
            // Notifications were turned off after the alarm was set, so nothing can ring.
        }
    }
}
