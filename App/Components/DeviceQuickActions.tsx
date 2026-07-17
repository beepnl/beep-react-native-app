import React, { FunctionComponent, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Colors } from '@/App/Theme';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { RNLogger } from '@/App/Helpers/RNLogger';

import { DeviceModel } from '@/App/Models/DeviceModel';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { FirmwareVersionModel } from '@/App/Models/FirmwareVersionModel';
import { CHANNELS } from '@/App/Models/WeightModel';

import BeepBaseActions from '@/App/Stores/BeepBase/Actions';
import ApiActions from '@/App/Stores/Api/Actions';
import { useTypedSelector } from '@/App/Stores';
import { getFirmwareVersion, getPairedPeripheral } from '@/App/Stores/BeepBase/Selectors';

interface Props {
  device: DeviceModel;
}

const DeviceQuickActions: FunctionComponent<Props> = ({ device }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const pairedPeripheral = useTypedSelector<PairedPeripheralModel | undefined>(getPairedPeripheral);
  const firmwareVersion = useTypedSelector<FirmwareVersionModel | undefined>(getFirmwareVersion);

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const isConnected = pairedPeripheral?.isConnected && pairedPeripheral.deviceId === device.id;

  useEffect(() => {
    if (!isConnected && !connecting) {
      connect();
    }
  }, [device.id]);

  useEffect(() => {
    if (isConnected && pairedPeripheral) {
      RNLogger.log(`[RN] QuickActions connected setup for ${device.name}`);
      dispatch(BeepBaseActions.setDevice(device));
      dispatch(ApiActions.getSensorDefinitions(device));

      BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_BUZZER_DEFAULT_TUNE, 2);
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_FIRMWARE_VERSION);
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_DS18B20_CONVERSION, 0xFF]);

      const channel = CHANNELS.find(ch => ch.name === "A_GAIN128")?.bitmask;
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.WRITE_HX711_CONVERSION, channel, 10]);
      BleHelpers.write(pairedPeripheral.id, [COMMANDS.READ_AUDIO_ADC_CONFIG]);
    }
  }, [isConnected]);

  const connect = () => {
    setConnecting(true);
    setError('');

    if (pairedPeripheral && pairedPeripheral.isConnected && pairedPeripheral.name === DeviceModel.getBleName(device)) {
      dispatch(BeepBaseActions.setPairedPeripheral({
        ...pairedPeripheral,
        deviceId: device.id
      }));
      BleHelpers.retrieveServices(pairedPeripheral.id);
      setConnecting(false);
      return;
    }

    BleHelpers.scanPeripheralByName(DeviceModel.getBleName(device))
      .then((scannedPeripheral) => {
        return BleHelpers.connectPeripheral(scannedPeripheral.id).then(() => {
          dispatch(BeepBaseActions.setPairedPeripheral({
            ...scannedPeripheral,
            isConnected: true,
            deviceId: device.id
          }));
          setConnecting(false);
        });
      })
      .catch((e) => {
        RNLogger.log(`[RN] Connection failed: ${e}`);
        setError(t("peripheralDetail.notFound"));
        setConnecting(false);
      });
  };

  if (connecting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.yellow} />
        <Text style={styles.text}>{t("peripheralDetail.scanning")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={connect} style={styles.retryButton}>
          <Text style={styles.retryText}>{t("wizard.pair.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isConnected) {
    return null;
  }

  const menuItems = [
    {
      title: "peripheralDetail.items.temperature",
      screen: "TemperatureScreen",
      icon: <FontAwesome name="thermometer-2" size={24} color={Colors.black} />,
      supported: true,
    },
    {
      title: "peripheralDetail.items.weight",
      screen: "WeightScreen",
      icon: <MaterialCommunityIcons name="scale" size={24} color={Colors.black} />,
      supported: true,
    },
    {
      title: "peripheralDetail.items.audio",
      screen: "AudioScreen",
      icon: <MaterialCommunityIcons name="microphone-variant" size={24} color={Colors.black} />,
      supported: true,
    },
    {
      title: "peripheralDetail.items.tilt",
      screen: "TiltScreen",
      icon: <MaterialCommunityIcons name="rotate-right-variant" size={24} color={Colors.black} />,
      supported: firmwareVersion ? firmwareVersion.supportsFeature("tilt") : false,
    },
    {
      title: "peripheralDetail.items.lora",
      screen: "LoRaScreen",
      icon: <Ionicons name="radio-outline" size={24} color={Colors.black} style={{ transform: [{ rotate: '90deg'}] }} />,
      supported: true,
    },
    {
      title: "peripheralDetail.items.energy",
      screen: "EnergyScreen",
      icon: <MaterialCommunityIcons name="battery-charging-wireless-70" size={24} color={Colors.black} />,
      supported: true,
    },
    {
      title: "peripheralDetail.items.clock",
      screen: "ClockScreen",
      icon: <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.black} />,
      supported: firmwareVersion ? firmwareVersion.supportsFeature("clock") : false,
    },
    {
      title: "peripheralDetail.items.logFile",
      screen: "LogFileScreen",
      icon: <MaterialCommunityIcons name="download" size={24} color={Colors.black} />,
      supported: firmwareVersion ? firmwareVersion.supportsFeature("logDownload") : false,
    },
    {
      title: "peripheralDetail.items.firmware",
      screen: "FirmwareScreen",
      icon: <FontAwesome name="microchip" size={24} color={Colors.black} />,
      supported: true,
    },
    {
      title: "Maintenance",
      screen: "MaintenanceScreen",
      icon: <MaterialCommunityIcons name="wrench-outline" size={24} color={Colors.black} />,
      supported: true,
    }
  ];

  return (
    <View style={styles.gridContainer}>
      {menuItems.map((item) => item.supported && (
        <TouchableOpacity
          key={item.screen}
          style={styles.gridItem}
          onPress={() => navigation.navigate(item.screen, { device, peripheralId: pairedPeripheral?.id, deviceId: device.id })}
        >
          {item.icon}
          <Text style={styles.gridItemText}>{item.title === 'Maintenance' ? item.title : t(item.title)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.snow,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lighterGrey,
  },
  text: {
    marginTop: 10,
    color: Colors.black,
  },
  errorText: {
    color: Colors.red,
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: Colors.lighterGrey,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.black,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.snow,
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridItem: {
    width: '33.33%',
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: Colors.darkGrey,
  }
});

export default DeviceQuickActions;
