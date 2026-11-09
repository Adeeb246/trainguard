package com.trainguard.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PhoneCalendarPlugin.class);
        super.onCreate(savedInstanceState);
        // Back closes an open sheet first. Only with nothing open does it leave the app.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                bridge.getWebView().evaluateJavascript("window.__tg.back()", closed -> {
                    if ("true".equals(closed)) return;
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                });
            }
        });
    }
}
