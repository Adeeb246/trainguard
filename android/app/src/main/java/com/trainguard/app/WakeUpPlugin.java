package com.trainguard.app;

import android.Manifest;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * The timed wake-up alarm, with the same calls as the iPhone's WakeUp plugin.
 * GPS wake-up is iPhone-only for now, so this always reports location as "unsupported".
 */
@CapacitorPlugin(name = "WakeUp", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class WakeUpPlugin extends Plugin {

    @PluginMethod
    public void schedule(PluginCall call) {
        // Android 13 and later need permission before anything can ring.
        if (call.getBoolean("backup", false) && Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "afterPermission");
            return;
        }
        arm(call);
    }

    @PermissionCallback
    private void afterPermission(PluginCall call) {
        arm(call);
    }

    private void arm(PluginCall call) {
        WakeUpReceiver.cancel(getContext());
        boolean set = true;
        Double at = call.getDouble("backupDate");
        if (call.getBoolean("backup", false) && at != null && at > System.currentTimeMillis()) {
            set = NotificationManagerCompat.from(getContext()).areNotificationsEnabled()
                && WakeUpReceiver.schedule(getContext(), at.longValue(), call.getString("title", "Wake up"), call.getString("stopLabel", "Stop"));
        }
        JSObject result = new JSObject();
        result.put("alarm", set);
        result.put("location", "unsupported");
        call.resolve(result);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        WakeUpReceiver.cancel(getContext());
        call.resolve();
    }
}
