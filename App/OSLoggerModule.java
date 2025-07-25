
package com.beepreactnativeapp;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class OSLoggerModule extends ReactContextBaseJavaModule {

    private static final String TAG = "OSLogger";

    public OSLoggerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "OSLogger";
    }

    @ReactMethod
    public void log(String message) {
        Log.d(TAG, message);
    }
}
