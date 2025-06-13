import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './styles'
import { Colors, Fonts, Metrics } from '../../Theme';

// Utils
import type { StackNavigationProp } from '@react-navigation/stack';
import BleHelpers, { COMMANDS } from '../../Helpers/BleHelpers';

// Data
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { 
  getPairedPeripheral, 
  getCellularState, 
  getCellularConfig, 
  getCellularStatus, 
  getCellularImei, 
  getCellularPsm, 
  getCellularInterval, 
  getCellularApn, 
  getCellularServer, 
  getCellularModule 
} from 'App/Stores/BeepBase/Selectors'
import { CellularStateModel } from '../../Models/CellularStateModel';
import { CellularConfigModel } from '../../Models/CellularConfigModel';
import { CellularStatusModel } from '../../Models/CellularStatusModel';
import { CellularIMEIModel } from '../../Models/CellularIMEIModel';
import { CellularPSMModel } from '../../Models/CellularPSMModel';
import { CellularIntervalModel } from '../../Models/CellularIntervalModel';
import { CellularAPNModel } from '../../Models/CellularAPNModel';
import { CellularServerModel } from '../../Models/CellularServerModel';
import { CellularModuleModel } from '../../Models/CellularModuleModel';

// Components
import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader';
import IconIonicons from 'react-native-vector-icons/Ionicons';

interface Props {
  navigation: StackNavigationProp,
}

const CellularScreen: FunctionComponent<Props> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const pairedPeripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  
  // Cellular state from store using proper selectors
  const cellularState = useTypedSelector(getCellularState) as CellularStateModel
  const cellularConfig = useTypedSelector(getCellularConfig) as CellularConfigModel
  const cellularStatus = useTypedSelector(getCellularStatus) as CellularStatusModel
  const cellularImei = useTypedSelector(getCellularImei) as CellularIMEIModel
  const cellularPsm = useTypedSelector(getCellularPsm) as CellularPSMModel
  const cellularInterval = useTypedSelector(getCellularInterval) as CellularIntervalModel
  const cellularApn = useTypedSelector(getCellularApn) as CellularAPNModel
  const cellularServer = useTypedSelector(getCellularServer) as CellularServerModel
  const cellularModule = useTypedSelector(getCellularModule) as CellularModuleModel

  useEffect(() => {
    if (pairedPeripheral) {
      // Read all cellular data from device
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_STATE)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_CONFIG)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_STATUS)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_IMEI)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_PSM)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_INTERVAL)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_APN)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_SERVER)
      BleHelpers.write(pairedPeripheral.id, COMMANDS.READ_CELLULAR_MODULE)
    }
  }, [pairedPeripheral])

  const toggleCellularEnabled = () => {
    if (cellularState && pairedPeripheral) {
      const newState = !cellularState.isEnabled
      const stateValue = new Uint8Array([
        (newState ? 1 : 0) |
        (cellularState.isConnected ? 2 : 0) |
        (cellularState.isPsmEnabled ? 4 : 0) |
        (cellularState.isEdrxEnabled ? 8 : 0) |
        (cellularState.isGnssEnabled ? 16 : 0)
      ])
      BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_CELLULAR_STATE, stateValue)
    }
  }

  const togglePSM = () => {
    if (cellularPsm && pairedPeripheral) {
      const newEnabled = !cellularPsm.enabled
      const psmValue = new Uint8Array([
        newEnabled ? 1 : 0,
        cellularPsm.periodicTau & 0xFF,
        (cellularPsm.periodicTau >> 8) & 0xFF,
        cellularPsm.activeTimes & 0xFF,
        (cellularPsm.activeTimes >> 8) & 0xFF
      ])
      BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_CELLULAR_PSM, psmValue)
    }
  }

  const testConnection = () => {
    if (pairedPeripheral) {
      const testMessage = 'TEST_CONNECTION'
      const messageBytes = new TextEncoder().encode(testMessage)
      const dataValue = new Uint8Array([
        messageBytes.length & 0xFF,
        (messageBytes.length >> 8) & 0xFF,
        0, // include_audio = false
        ...messageBytes
      ])
      BleHelpers.write(pairedPeripheral.id, COMMANDS.WRITE_CELLULAR_SEND, dataValue)
      Alert.alert('Test Connection', 'Test message sent via cellular')
    }
  }

  return (<>
    <ScreenHeader title="Cellular Configuration" back />

    <ScrollView style={styles.container}>
      <View style={styles.spacer} />

      {/* Module Detection Status */}
      <Text style={styles.label}>Hardware Status</Text>
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>Module</Text>
          <Text style={[styles.text, { 
            color: cellularModule?.isDetected ? Colors.green : Colors.red 
          }]}>
            {cellularModule?.toString() || 'Checking...'}
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Connection Status */}
      <Text style={styles.label}>Connection Status</Text>
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>Status</Text>
          <Text style={[styles.text, { 
            color: cellularState?.isConnected ? Colors.green : Colors.red 
          }]}>
            {cellularState?.toString() || 'Unknown'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>Signal Strength</Text>
          <Text style={styles.text}>
            {cellularStatus?.toString() || '-'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>IMEI</Text>
          <Text style={styles.text}>
            {cellularImei?.toString() || '-'}
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Configuration */}
      <Text style={styles.label}>Configuration</Text>
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>Cellular Enabled</Text>
          <Switch
            value={cellularState?.isEnabled || false}
            onValueChange={toggleCellularEnabled}
            trackColor={{ false: Colors.lightGrey, true: Colors.yellow }}
            thumbColor={Colors.white}
          />
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>Network Mode</Text>
          <Text style={styles.text}>
            {cellularConfig?.getNetworkModeString() || 'Auto'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>Transmission Interval</Text>
          <Text style={styles.text}>
            {cellularInterval?.getTransmissionIntervalString() || '60m'}
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Power Management */}
      <Text style={styles.label}>Power Management</Text>
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>PSM (Power Saving Mode)</Text>
          <Switch
            value={cellularPsm?.enabled || false}
            onValueChange={togglePSM}
            trackColor={{ false: Colors.lightGrey, true: Colors.yellow }}
            thumbColor={Colors.white}
          />
        </View>
        {cellularPsm?.enabled && (
          <>
            <View style={styles.itemRow}>
              <Text style={styles.text}>Periodic TAU</Text>
              <Text style={styles.text}>
                {cellularPsm?.getPeriodicTauString() || '1h'}
              </Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.text}>Active Time</Text>
              <Text style={styles.text}>
                {cellularPsm?.getActiveTimeString() || '60s'}
              </Text>
            </View>
          </>
        )}
        <View style={styles.itemRow}>
          <Text style={styles.text}>eDRX Enabled</Text>
          <Text style={styles.text}>
            {cellularState?.isEdrxEnabled ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Network Settings */}
      <Text style={styles.label}>Network Settings</Text>
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.text}>APN</Text>
          <Text style={styles.text}>
            {cellularApn?.toString() || 'Not configured'}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.text}>Server</Text>
          <Text style={styles.text}>
            {cellularServer?.toString() || 'Not configured'}
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Action Buttons */}
      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.text}>Test Connection</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: Colors.orange }]} 
        onPress={() => Alert.alert(
          'Advanced Configuration', 
          'Advanced features include:\n\n• Network mode selection\n• Transmission intervals\n• APN configuration\n• Server settings\n• PSM timing adjustments\n\nThese features are currently read-only. Configuration updates via firmware are planned for future releases.',
          [{ text: 'OK' }]
        )}
      >
        <Text style={styles.text}>Advanced Configuration</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  </>)
}

export default CellularScreen