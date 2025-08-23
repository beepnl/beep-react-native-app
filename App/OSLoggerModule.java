
package com.beepreactnativeapp;

import android.bluetooth.BluetoothAdapter;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

public class OSLoggerModule extends ReactContextBaseJavaModule {

    private static final String TAG = "OSLogger";
    private final ReactApplicationContext reactContext;

    public OSLoggerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        registerBluetoothStateReceiver();
    }

    @Override
    public String getName() {
        return "OSLogger";
    }

    @ReactMethod
    public void log(String message) {
        Log.d(TAG, message);
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("BRAND", Build.BRAND);
        constants.put("MODEL", Build.MODEL);
        constants.put("OS_VERSION", Build.VERSION.RELEASE);
        constants.put("API_LEVEL", String.valueOf(Build.VERSION.SDK_INT));
        return constants;
    }

    private void registerBluetoothStateReceiver() {
        IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
        reactContext.registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                final String action = intent.getAction();

                if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
                    final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                    String stateStr = "UNKNOWN";
                    switch (state) {
                        case BluetoothAdapter.STATE_OFF:
                            stateStr = "OFF";
                            break;
                        case BluetoothAdapter.STATE_TURNING_OFF:
                            stateStr = "TURNING_OFF";
                            break;
                        case BluetoothAdapter.STATE_ON:
                            stateStr = "ON";
                            break;
                        case BluetoothAdapter.STATE_TURNING_ON:
                            stateStr = "TURNING_ON";
                            break;
                    }
                    WritableMap params = Arguments.createMap();
                    params.putString("state", stateStr);
                    sendEvent(reactContext, "onBluetoothStateChange", params);
                }
            }
        }, filter);
    }

    private void sendEvent(ReactContext reactContext, String eventName, WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }
}
