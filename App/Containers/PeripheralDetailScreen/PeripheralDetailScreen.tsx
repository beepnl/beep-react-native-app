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

interface Props {
}

const PeripheralDetailScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // const [peripheral, setPeripheral] = useState<PairedPeripheralModel>(navigation.state.params?.peripheral)
  const peripheral: PairedPeripheralModel = useTypedSelector<PairedPeripheralModel>(getPairedPeripheral)
  
  const onToggleConnectionPress = () => {
    if (peripheral) {
      console.log("peripheral.isConnected", peripheral.isConnected)
      if (peripheral.isConnected) {
        BleHelpers.disconnectPeripheral(peripheral)?.then(() => {
          const updated = {
            ...peripheral,
            isConnected: false,
          }
          dispatch(BeepBaseActions.setPairedPeripheral(updated))  
        })
      } else {
        BleHelpers.connectPeripheral(peripheral.id)?.then(() => {
          const updated = {
            ...peripheral,
            isConnected: true,
          }
          dispatch(BeepBaseActions.setPairedPeripheral(updated))  
        })
      }
    }
  }

  const renderMenuItem = (item: MenuItem, key: string) => {
    return (
      <TouchableOpacity key={key} style={styles.menuItem} onPress={() => { item.screen && navigation.navigate(item.screen)}}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        {/* <View style={[styles.spacer, styles.separator]} /> */}
      </TouchableOpacity>
    )
  }

  return (<>
    <ScreenHeader title={t("peripheralDetail.screenTitle")} back />

    <ScrollView style={styles.container} >
      <View style={styles.spacer} />

      <Text style={[styles.centeredText, styles.text]}>{t("peripheralDetail.bleName", { name: peripheral ? peripheral.name : "" })}</Text>
      <Text style={[styles.centeredText, styles.text]}>{t("peripheralDetail.bleStatus", { status: t(`peripheralDetail.bleConnection.${peripheral ? peripheral.isConnected : false}`)})}</Text>

      <View style={styles.spacer} />
      
      <Button onPress={onToggleConnectionPress} title={"Toggle connection"}></Button>

      <View style={styles.spacerDouble} />

      { MENU_ITEMS.map((item: MenuItem, index: number) => renderMenuItem(item, index.toString()))}

      <View style={styles.spacer} />

    </ScrollView>
  </>)
}

export default PeripheralDetailScreen