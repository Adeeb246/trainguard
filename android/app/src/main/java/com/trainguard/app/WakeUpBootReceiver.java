package com.trainguard.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Android forgets alarms on a restart and on an app update, so this sets the wake-up again. Only the system can send these. */
public class WakeUpBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            WakeUpReceiver.rearm(ctx);
        }
    }
}
