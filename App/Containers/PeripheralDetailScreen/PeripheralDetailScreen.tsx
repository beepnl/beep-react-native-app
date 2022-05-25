import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from '@react-navigation/native';
import { useInterval } from '../../Helpers/useInterval';

// Styles
import styles from './PeripheralDetailScreenStyle'

// Utils
import Images from 'App/Assets/Images'
import BleHelpers from '../../Helpers/BleHelpers';

// Data
import BeepBaseActions from 'App/Stores/BeepBase/Actions'
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { getPairedPeripheral } from 'App/Stores/BeepBase/Selectors'

// Components
import { Text, View, Button, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import { DeviceModel } from '../../Models/DeviceModel';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Peripheral } from 'react-native-ble-manager';

type MenuItem = { title: string, icon: string, screen: string }

const MENU_ITEMS: Array<MenuItem> = [
  {
    title: "Temperature",
    icon: "",
    screen: "",
  },
  {
    title: "Download data",
    icon: "",
    screen: "LogFileScreen",
  },
  {
    title: "Firmware",
    icon: "",
    screen: "FirmwareScreen",
  },
]

export type PeripheralDetailScreenNavigationParams = {
  device: DeviceModel,
}

type Props = NativeStackScreenProps<PeripheralDetailScreenNavigationParams>

const PeripheralDetailScreen: FunctionComponent<Props> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  const device = route.params?.device
  const peripheralEqualsDevice = peripheral?.name === device?.name
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const isConnected = peripheral && peripheral.isConnected

  const onToggleConnectionPress = () => {
    setError("")
    if (isConnected) {
      BleHelpers.disconnectPeripheral(peripheral)
      dispatch(BeepBaseActions.setPairedPeripheral({ ...peripheral, isConnected: false }))
    } else {
      setBusy(true)
      BleHelpers.scanPeripheralByName(device.name).then((peripheral: Peripheral) => {
        BleHelpers.connectPeripheral(peripheral.id).then(() => {
          dispatch(BeepBaseActions.setPairedPeripheral({ ...peripheral, isConnected: true }))
          setBusy(false)
        })
      }).catch(() => {
        //peripheral not found
        setError("Device not found")
        setBusy(false)
      })
    }
    //OK:
    // if (peripheral) {
    //   console.log("peripheral.isConnected", peripheral.isConnected)
    //   if (peripheral.isConnected) {
    //     BleHelpers.disconnectPeripheral(peripheral)?.then(() => {
    //       const updated = {
    //         ...peripheral,
    //         isConnected: false,
    //       }
    //       dispatch(BeepBaseActions.setPairedPeripheral(updated))  
    //     })
    //   } else {
    //     BleHelpers.connectPeripheral(peripheral.id)?.then(() => {
    //       const updated = {
    //         ...peripheral,
    //         isConnected: true,
    //       }
    //       dispatch(BeepBaseActions.setPairedPeripheral(updated))  
    //     })
    //   }
    // }
  }

  const renderMenuItem = (item: MenuItem, key: string) => {
    return (
      <TouchableOpacity key={key} style={styles.navigationButton} onPress={() => { item.screen && navigation.navigate(item.screen)}}>
        <Text style={styles.text}>{item.title}</Text>
        <Text style={styles.text}>&gt;</Text>
      </TouchableOpacity>
    )
  }

  return (<>
    <ScreenHeader title={t("peripheralDetail.screenTitle")} back />

    <ScrollView style={styles.container} >
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("peripheralDetail.bleName")}<Text style={styles.text}>{device?.name}</Text></Text>

      <View style={styles.spacer} />

      <Text style={styles.label}>{t("peripheralDetail.bleStatus")}<Text style={styles.text}>{t(`peripheralDetail.bleConnectionStatus.${peripheral ? peripheral.isConnected : false}`)}</Text></Text>

      <View style={styles.spacer} />
      
      <TouchableOpacity style={styles.button} onPress={onToggleConnectionPress} disabled={busy} >
        <Text style={styles.text}>{t(`peripheralDetail.bleConnect.${peripheral ? !peripheral.isConnected : true}`)}</Text>
      </TouchableOpacity>
      <View style={styles.spacer} />
      { !!busy && <Text>Scanning...</Text> }
      { !!error && <>
        <Text style={styles.error}>{error}</Text>
        <View style={styles.spacer} />
      </>}
      { !isConnected && <>
        <Text style={styles.instructions}>{t("peripheralDetail.instructions")}</Text>
        <View style={styles.spacer} />
      </>}

      <View style={styles.spacer} />

      { isConnected && <>
        <Text style={styles.label}>{t("peripheralDetail.details")}</Text>
        { MENU_ITEMS.map((item: MenuItem, index: number) => renderMenuItem(item, index.toString()))}
      </>}

      <View style={styles.spacer} />

    </ScrollView>
  </>)
}

export default PeripheralDetailScreen