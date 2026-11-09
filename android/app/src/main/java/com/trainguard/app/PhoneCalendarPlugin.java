package com.trainguard.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.provider.CalendarContract;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Opens the phone's calendar app with the event filled in. It needs no calendar permission, but it can't set alerts. */
@CapacitorPlugin(name = "PhoneCalendar")
public class PhoneCalendarPlugin extends Plugin {

    @PluginMethod
    public void add(PluginCall call) {
        JSObject event = call.getData();
        Intent intent = new Intent(Intent.ACTION_INSERT)
            .setData(CalendarContract.Events.CONTENT_URI)
            .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, event.optLong("startDate"))
            .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, event.optLong("endDate"))
            .putExtra(CalendarContract.Events.TITLE, call.getString("title"))
            .putExtra(CalendarContract.Events.DESCRIPTION, call.getString("notes"))
            .putExtra(CalendarContract.Events.EVENT_LOCATION, call.getString("location"));
        try {
            getActivity().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No calendar app");
        }
    }
}
