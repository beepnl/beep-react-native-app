import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import BleHelpers from '@/App/Helpers/BleHelpers';
import useInterval from '@/App/Helpers/useInterval';
import { LoRaWanStateModel } from '@/App/Models/LoRaWanStateModel';
import { Colors, Metrics } from '@/App/Theme';

interface Props {
  loRaWanState?: LoRaWanStateModel;
  peripheralId?: string;
  isBleConnected?: boolean;
}

const getSignalQualityKey = (rssi: number) => {
  if (rssi >= -55) return 'excellent';
  if (rssi >= -67) return 'good';
  if (rssi >= -75) return 'fair';
  return 'weak';
}

const LoRaConnectionDiagnostics: FunctionComponent<Props> = ({
  loRaWanState,
  peripheralId,
  isBleConnected,
}) => {
  const { t } = useTranslation();
  const [bleRssi, setBleRssi] = useState<number>();
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    }
  }, []);

  const refreshBleRssi = async () => {
    if (!peripheralId || !isBleConnected) {
      return;
    }

    try {
      const rssi = await BleHelpers.readRSSI(peripheralId);
      if (mountedRef.current && rssi != null) {
        setBleRssi(rssi);
        setLastUpdated(new Date());
      }
    } catch {
      if (mountedRef.current) {
        setBleRssi(undefined);
      }
    }
  }

  useEffect(() => {
    setBleRssi(undefined);
    setLastUpdated(undefined);
    void refreshBleRssi();
  }, [peripheralId, isBleConnected]);

  useInterval(() => {
    void refreshBleRssi();
  }, peripheralId && isBleConnected ? 5000 : null);

  const renderRow = (label: string, value: string, valueColor = Colors.black) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  )

  const joined = !!loRaWanState?.hasJoined;
  const keysValid = !!loRaWanState?.hasValidKeys;
  const bleSignal = bleRssi == null
    ? t(`wizard.lora.details.${isBleConnected ? 'reading' : 'notConnected'}`)
    : `${bleRssi} dBm (${t(`wizard.lora.details.${getSignalQualityKey(bleRssi)}`)})`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('wizard.lora.details.diagnostics')}</Text>
      {renderRow(t('wizard.lora.details.loraNetwork'), t(`wizard.lora.details.${joined ? 'joined' : 'notJoined'}`), joined ? Colors.green : Colors.red)}
      {renderRow(t('wizard.lora.details.credentials'), t(`wizard.lora.details.${keysValid ? 'valid' : 'notConfirmed'}`), keysValid ? Colors.green : Colors.darkYellow)}
      {renderRow(t('wizard.lora.details.ADR'), t(`wizard.lora.details.${loRaWanState?.isAdaptiveDataRateEnabled ? 'enabled' : 'disabled'}`))}
      {renderRow(t('wizard.lora.details.DCL'), t(`wizard.lora.details.${loRaWanState?.isDutyCycleLimitationEnabled ? 'enabled' : 'disabled'}`))}
      {renderRow(t('wizard.lora.details.bluetoothRssi'), bleSignal)}
      {lastUpdated && renderRow(t('wizard.lora.details.bleUpdated'), lastUpdated.toLocaleTimeString())}
      {renderRow(t('wizard.lora.details.loraRssiSnr'), t('wizard.lora.details.firmwareNotReported'))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Metrics.baseMargin,
    padding: Metrics.baseMargin,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: Metrics.baseMargin,
    backgroundColor: Colors.silver,
  },
  title: {
    color: Colors.black,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: Metrics.halfBaseMargin,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Metrics.halfBaseMargin,
    gap: Metrics.baseMargin,
  },
  label: {
    flex: 1,
    color: Colors.darkGrey,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
});

export default LoRaConnectionDiagnostics;
