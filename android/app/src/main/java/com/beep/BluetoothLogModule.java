package com.beep;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.UUID;

import javax.annotation.Nullable;

public class BluetoothLogModule extends ReactContextBaseJavaModule implements ActivityEventListener, LifecycleEventListener {

    private static final String TAG = "BluetoothLog";
    private final ReactApplicationContext reactContext;
    private final BluetoothAdapter bluetoothAdapter;
    private boolean isReceiverRegistered = false;

    public BluetoothLogModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        reactContext.addActivityEventListener(this);
        reactContext.addLifecycleEventListener(this);
    }

    @Override
    public String getName() {
        return "BluetoothLog";
    }

    private final BroadcastReceiver bluetoothStateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            final String action = intent.getAction();
            if (action == null) {
                return;
            }

            String logMessage = "[OS] " + action;
            WritableMap params = Arguments.createMap();
            params.putString("type", "broadcast");
            params.putString("action", action);

            try {
                if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
                    final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                    final int prevState = intent.getIntExtra(BluetoothAdapter.EXTRA_PREVIOUS_STATE, BluetoothAdapter.ERROR);
                    logMessage += " | " + getBluetoothStateString(prevState) + " -> " + getBluetoothStateString(state);
                    params.putString("state", getBluetoothStateString(state));
                    params.putString("previousState", getBluetoothStateString(prevState));
                } else if (action.equals(BluetoothDevice.ACTION_BOND_STATE_CHANGED)) {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    final int bondState = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR);
                    final int prevBondState = intent.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.ERROR);
                    if (device != null) {
                        logMessage += " | " + device.getAddress() + " | " + getBondStateString(prevBondState) + " -> " + getBondStateString(bondState);
                        params.putString("device", device.getAddress());
                        params.putString("bondState", getBondStateString(bondState));
                        params.putString("previousBondState", getBondStateString(prevBondState));
                        // device.getName() requires BLUETOOTH_CONNECT permission on Android 12+
                        try {
                            String deviceName = device.getName();
                            if (deviceName != null) {
                                params.putString("deviceName", deviceName);
                            }
                        } catch (SecurityException e) {
                            // Permission not granted, skip device name
                        }
                    }
                } else if (action.equals(BluetoothDevice.ACTION_ACL_CONNECTED)) {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    if (device != null) {
                        logMessage += " | " + device.getAddress() + " connected";
                        params.putString("device", device.getAddress());
                        params.putString("event", "connected");
                    }
                } else if (action.equals(BluetoothDevice.ACTION_ACL_DISCONNECTED)) {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    if (device != null) {
                        logMessage += " | " + device.getAddress() + " disconnected";
                        params.putString("device", device.getAddress());
                        params.putString("event", "disconnected");
                    }
                } else if (action.equals(BluetoothDevice.ACTION_FOUND)) {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    if (device != null) {
                        short rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);
                        logMessage += " | " + device.getAddress() + " | RSSI: " + rssi;
                        params.putString("device", device.getAddress());
                        params.putInt("rssi", rssi);
                    }
                } else if (action.equals(BluetoothAdapter.ACTION_DISCOVERY_STARTED)) {
                    logMessage += " | Classic discovery started";
                    params.putString("event", "discoveryStarted");
                } else if (action.equals(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)) {
                    logMessage += " | Classic discovery finished";
                    params.putString("event", "discoveryFinished");
                }

                // Android 12+ specific events
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (action.equals(BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED)) {
                        final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_CONNECTION_STATE, BluetoothAdapter.ERROR);
                        final int prevState = intent.getIntExtra(BluetoothAdapter.EXTRA_PREVIOUS_CONNECTION_STATE, BluetoothAdapter.ERROR);
                        BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                        if (device != null) {
                            logMessage += " | " + device.getAddress() + " | " + getConnectionStateString(prevState) + " -> " + getConnectionStateString(state);
                            params.putString("device", device.getAddress());
                            params.putString("connectionState", getConnectionStateString(state));
                            params.putString("previousConnectionState", getConnectionStateString(prevState));
                        }
                    }
                }
            } catch (Exception e) {
                logMessage += " | Error: " + e.getMessage();
                params.putString("error", e.getMessage());
            }

            params.putString("message", logMessage);
            params.putString("androidVersion", String.valueOf(Build.VERSION.SDK_INT));
            sendEvent("onBluetoothLog", params);
        }
    };

    @ReactMethod
    public void start() {
        if (isReceiverRegistered) {
            return;
        }

        IntentFilter filter = new IntentFilter();
        // Core Bluetooth state changes
        filter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);
        filter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
        filter.addAction(BluetoothDevice.ACTION_ACL_CONNECTED);
        filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
        filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECT_REQUESTED);
        
        // Discovery events
        filter.addAction(BluetoothDevice.ACTION_FOUND);
        filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_STARTED);
        filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        
        // Android 12+ specific events
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            filter.addAction(BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED);
        }
        
        // GATT events (if available)
        filter.addAction(BluetoothDevice.ACTION_UUID);
        filter.addAction(BluetoothDevice.ACTION_NAME_CHANGED);

        reactContext.registerReceiver(bluetoothStateReceiver, filter);
        isReceiverRegistered = true;
        
        // Log system information
        WritableMap systemInfo = Arguments.createMap();
        systemInfo.putString("message", "[OS] Bluetooth logging started | Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");
        systemInfo.putString("type", "system");
        systemInfo.putString("androidVersion", String.valueOf(Build.VERSION.SDK_INT));
        systemInfo.putString("androidRelease", Build.VERSION.RELEASE);
        systemInfo.putString("device", Build.MANUFACTURER + " " + Build.MODEL);
        systemInfo.putBoolean("hasBluetoothLE", reactContext.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE));
        
        if (bluetoothAdapter != null) {
            systemInfo.putBoolean("bluetoothEnabled", bluetoothAdapter.isEnabled());
            systemInfo.putString("bluetoothState", getBluetoothStateString(bluetoothAdapter.getState()));
        }
        
        sendEvent("onBluetoothLog", systemInfo);
        Log.d(TAG, "BluetoothLog receiver registered for Android " + Build.VERSION.SDK_INT);
    }

    @ReactMethod
    public void stop() {
        if (isReceiverRegistered) {
            reactContext.unregisterReceiver(bluetoothStateReceiver);
            isReceiverRegistered = false;
            Log.d(TAG, "BluetoothLog receiver unregistered");
        }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    private String getBluetoothStateString(int state) {
        switch (state) {
            case BluetoothAdapter.STATE_OFF:
                return "STATE_OFF";
            case BluetoothAdapter.STATE_TURNING_ON:
                return "STATE_TURNING_ON";
            case BluetoothAdapter.STATE_ON:
                return "STATE_ON";
            case BluetoothAdapter.STATE_TURNING_OFF:
                return "STATE_TURNING_OFF";
            default:
                return "UNKNOWN_STATE";
        }
    }

    private String getBondStateString(int bondState) {
        switch (bondState) {
            case BluetoothDevice.BOND_NONE:
                return "BOND_NONE";
            case BluetoothDevice.BOND_BONDING:
                return "BOND_BONDING";
            case BluetoothDevice.BOND_BONDED:
                return "BOND_BONDED";
            default:
                return "UNKNOWN_BOND_STATE";
        }
    }

    private String getConnectionStateString(int state) {
        switch (state) {
            case BluetoothAdapter.STATE_DISCONNECTED:
                return "DISCONNECTED";
            case BluetoothAdapter.STATE_CONNECTING:
                return "CONNECTING";
            case BluetoothAdapter.STATE_CONNECTED:
                return "CONNECTED";
            case BluetoothAdapter.STATE_DISCONNECTING:
                return "DISCONNECTING";
            default:
                return "UNKNOWN_CONNECTION_STATE";
        }
    }

    @ReactMethod
    public void logGattEvent(String deviceAddress, String event, String details) {
        WritableMap params = Arguments.createMap();
        params.putString("message", "[OS] GATT Event | " + deviceAddress + " | " + event + " | " + details);
        params.putString("type", "gatt");
        params.putString("device", deviceAddress);
        params.putString("event", event);
        params.putString("details", details);
        params.putString("androidVersion", String.valueOf(Build.VERSION.SDK_INT));
        sendEvent("onBluetoothLog", params);
    }

    @ReactMethod
    public void logScanEvent(String event, String details) {
        WritableMap params = Arguments.createMap();
        params.putString("message", "[OS] Scan Event | " + event + " | " + details);
        params.putString("type", "scan");
        params.putString("event", event);
        params.putString("details", details);
        params.putString("androidVersion", String.valueOf(Build.VERSION.SDK_INT));
        params.putString("timestamp", String.valueOf(System.currentTimeMillis()));
        sendEvent("onBluetoothLog", params);
    }

    @ReactMethod
    public void logConnectionEvent(String event, String deviceId, String details) {
        WritableMap params = Arguments.createMap();
        params.putString("message", "[OS] Connection Event | " + event + " | " + deviceId + " | " + details);
        params.putString("type", "connection");
        params.putString("event", event);
        params.putString("deviceId", deviceId);
        params.putString("details", details);
        params.putString("androidVersion", String.valueOf(Build.VERSION.SDK_INT));
        params.putString("timestamp", String.valueOf(System.currentTimeMillis()));
        sendEvent("onBluetoothLog", params);
    }

    @ReactMethod
    public void logBleEvent(String event, String details) {
        WritableMap params = Arguments.createMap();
        params.putString("message", "[OS] BLE Event | " + event + " | " + details);
        params.putString("type", "ble");
        params.putString("event", event);
        params.putString("details", details);
        params.putString("androidVersion", String.valueOf(Build.VERSION.SDK_INT));
        params.putString("timestamp", String.valueOf(System.currentTimeMillis()));
        sendEvent("onBluetoothLog", params);
    }

    @ReactMethod
    public void getSystemBluetoothInfo(Promise promise) {
        WritableMap info = Arguments.createMap();
        
        try {
            info.putString("androidVersion", String.valueOf(Build.VERSION.SDK_INT));
            info.putString("androidRelease", Build.VERSION.RELEASE);
            info.putString("device", Build.MANUFACTURER + " " + Build.MODEL);
            info.putBoolean("hasBluetoothLE", reactContext.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE));
            
            if (bluetoothAdapter != null) {
                // Android 12+ requires BLUETOOTH_CONNECT permission to access adapter state
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    boolean hasConnectPermission = reactContext.checkSelfPermission("android.permission.BLUETOOTH_CONNECT") == PackageManager.PERMISSION_GRANTED;
                    info.putBoolean("hasBluetoothConnectPermission", hasConnectPermission);
                    info.putBoolean("hasBluetoothScanPermission", 
                        reactContext.checkSelfPermission("android.permission.BLUETOOTH_SCAN") == PackageManager.PERMISSION_GRANTED);
                    
                    if (hasConnectPermission) {
                        info.putBoolean("bluetoothEnabled", bluetoothAdapter.isEnabled());
                        info.putString("bluetoothState", getBluetoothStateString(bluetoothAdapter.getState()));
                        info.putBoolean("isDiscovering", bluetoothAdapter.isDiscovering());
                    } else {
                        info.putString("bluetoothState", "PERMISSION_REQUIRED");
                    }
                } else {
                    // Android 11 and below don't need special permissions for adapter state
                    info.putBoolean("bluetoothEnabled", bluetoothAdapter.isEnabled());
                    info.putString("bluetoothState", getBluetoothStateString(bluetoothAdapter.getState()));
                    info.putBoolean("isDiscovering", bluetoothAdapter.isDiscovering());
                }
            }
            
            promise.resolve(info);
        } catch (Exception e) {
            promise.reject("BLUETOOTH_INFO_ERROR", e.getMessage());
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        // Not needed for this module
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed for this module
    }

    @Override
    public void onHostResume() {
        // Not needed for this module
    }

    @Override
    public void onHostPause() {
        // Not needed for this module
    }

    @Override
    public void onHostDestroy() {
        stop();
    }
}
