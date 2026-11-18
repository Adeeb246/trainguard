package com.trainguard.app;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.app.NotificationManagerCompat;

/** The alarm screen. It shows over the lock screen so someone half asleep can stop the alarm with one tap. */
public class WakeUpActivity extends Activity {

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        float dp = getResources().getDisplayMetrics().density;

        TextView title = new TextView(this);
        title.setText(getIntent().getStringExtra("title"));
        title.setTextColor(Color.parseColor("#F5F5F5"));
        title.setTextSize(30);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);

        GradientDrawable pill = new GradientDrawable();
        pill.setColor(Color.parseColor("#4ADE80"));
        pill.setCornerRadius(40 * dp);
        Button stop = new Button(this);
        stop.setText(getIntent().getStringExtra("stop"));
        stop.setAllCaps(false);
        stop.setTextSize(22);
        stop.setTypeface(Typeface.DEFAULT_BOLD);
        stop.setTextColor(Color.parseColor("#0B2E1A"));
        stop.setBackground(pill);
        stop.setOnClickListener(v -> {
            NotificationManagerCompat.from(this).cancel(WakeUpReceiver.NOTIFICATION);
            finish();
        });

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#111111"));
        int pad = (int) (32 * dp);
        root.setPadding(pad, pad, pad, pad);
        root.addView(title, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        LinearLayout.LayoutParams size = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, (int) (80 * dp));
        size.topMargin = (int) (48 * dp);
        root.addView(stop, size);
        setContentView(root);
    }
}
