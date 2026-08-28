import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Buffer } from 'buffer';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from '@/App/Stores';
import { Colors } from '@/App/Theme';
import styles from '../FirmwareScreen/FirmwareScreenStyle';

import BleHelpers, { COMMANDS } from '@/App/Helpers/BleHelpers';
import { PairedPeripheralModel } from '@/App/Models/PairedPeripheralModel';
import { FirmwareVersionModel } from '@/App/Models/FirmwareVersionModel';
import { FirmwareModel } from '@/App/Models/FirmwareModel';

import { getPairedPeripheral, getFirmwareVersion } from '@/App/Stores/BeepBase/Selectors';
import { getFirmwaresStable } from '@/App/Stores/Api/Selectors';
import ApiActions from '@/App/Stores/Api/Actions';
import BeepBaseActions from '@/App/Stores/BeepBase/Actions';

import ScreenHeader from '@/App/Components/ScreenHeader';
import IconMaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const MaintenanceScreen: FunctionComponent = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const peripheral = useTypedSelector<PairedPeripheralModel | undefined>(getPairedPeripheral);
  const firmwareVersion = useTypedSelector<FirmwareVersionModel | undefined>(getFirmwareVersion);
  const firmwaresStable = useTypedSelector<Array<FirmwareModel>>(getFirmwaresStable);

  const [statusText, setStatusText] = useState('Initializing maintenance...');
  const [step, setStep] = useState(0);
  const firmwareVersionRef = useRef(firmwareVersion);

  const waitForFirmwareVersion = async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (firmwareVersionRef.current) {
        return firmwareVersionRef.current;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('Could not read the firmware version from the BEEP base.');
  };

  useEffect(() => {
    firmwareVersionRef.current = firmwareVersion;
  }, [firmwareVersion]);

  useEffect(() => {
    dispatch(ApiActions.getFirmwares());
  }, [dispatch]);

  const navigateToLogDownload = () => {
    setStep(4);
    setStatusText('Redirecting to Log Data Download...');
    setTimeout(() => {
      navigation.navigate('LogFileScreen', {
        autoStart: true,
        peripheralId: peripheral?.id,
        deviceId: peripheral?.deviceId,
      });
    }, 1000);
  };

  const startMaintenance = async () => {
    if (!peripheral) {
      setStatusText('No BEEP base is connected.');
      setStep(-1);
      return;
    }

    try {
      setStep(1);
      setStatusText('Syncing clock...');
      const params = Buffer.alloc(4);
      params.writeUint32BE((new Date().valueOf() + 1300) / 1000, 0);
      await BleHelpers.write(peripheral.id, COMMANDS.WRITE_CLOCK, params, { throwOnError: true });
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStep(2);
      setStatusText('Checking LoRa stack...');
      await BleHelpers.write(peripheral.id, COMMANDS.READ_LORAWAN_STATE, undefined, { throwOnError: true });
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStep(3);
      setStatusText('Checking firmware version...');
      firmwareVersionRef.current = undefined;
      dispatch(BeepBaseActions.setFirmwareVersion(undefined));
      await BleHelpers.write(peripheral.id, COMMANDS.READ_FIRMWARE_VERSION, undefined, { throwOnError: true });
      const currentVersion = (await waitForFirmwareVersion()).toString();
      const latestFirmware = firmwaresStable.length > 0 ? firmwaresStable[0] : null;

      if (!latestFirmware) {
        setStatusText('Firmware list unavailable; continuing to log download.');
        setTimeout(navigateToLogDownload, 1000);
      } else if (currentVersion !== latestFirmware.version) {
        Alert.alert(
          'Firmware Update Available',
          `New firmware version ${latestFirmware.version} is available. Do you want to install it now?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: navigateToLogDownload },
            {
              text: 'Update',
              onPress: () => {
                navigation.navigate('FirmwareDetailScreen', {
                  firmware: latestFirmware,
                  returnToLogDownload: true,
                  peripheralId: peripheral.id,
                  deviceId: peripheral.deviceId,
                });
              }
            }
          ]
        );
      } else {
        setStatusText('Firmware is up to date.');
        setTimeout(navigateToLogDownload, 1000);
      }
    } catch (error: any) {
      setStatusText(`Error during maintenance: ${error?.message || 'Unknown error'}`);
      setStep(-1);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title="Maintenance" back />
      <ScrollView style={styles.container}>
        <View style={styles.spacerDouble} />

        <View style={{ alignItems: 'center', padding: 20 }}>
          <IconMaterialCommunityIcons name="wrench-outline" size={64} color={Colors.yellow} />
          <View style={styles.spacerDouble} />
          <Text style={[styles.label, { textAlign: 'center', marginBottom: 20 }]}>
            {step === 0 ? 'Ready to perform maintenance tasks:' : statusText}
          </Text>

          <View style={{ width: '100%', paddingHorizontal: 20 }}>
            <Text style={{ color: step >= 1 ? Colors.green : Colors.black, marginVertical: 5 }}>
              {step >= 1 ? '✓ ' : '• '} Clock Sync
            </Text>
            <Text style={{ color: step >= 2 ? Colors.green : Colors.black, marginVertical: 5 }}>
              {step >= 2 ? '✓ ' : '• '} Check LoRa Stack
            </Text>
            <Text style={{ color: step >= 3 ? Colors.green : Colors.black, marginVertical: 5 }}>
              {step >= 3 ? '✓ ' : '• '} Firmware Update Check
            </Text>
            <Text style={{ color: step >= 4 ? Colors.green : Colors.black, marginVertical: 5 }}>
              {step >= 4 ? '✓ ' : '• '} Log Data Download
            </Text>
          </View>
        </View>

        <View style={styles.spacerDouble} />

        {step === 0 && (
          <TouchableOpacity
            style={{ backgroundColor: Colors.yellow, padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 20 }}
            onPress={startMaintenance}
          >
            <Text style={{ fontWeight: 'bold', color: Colors.black }}>Start Maintenance</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default MaintenanceScreen;
