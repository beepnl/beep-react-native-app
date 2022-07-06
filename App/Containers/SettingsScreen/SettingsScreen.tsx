import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from '@react-navigation/native';

// Styles
import styles from '../Sensor/styles'
import { Colors, Fonts, Metrics } from '../../Theme';
import Images from 'App/Assets/Images'

// Utils
const nodePackage = require('../../../package.json')   //including node package config for app version
import ApiService from '../../Services/ApiService';

// Data
import AuthActions from 'App/Stores/Auth/Actions'
import UserActions from 'App/Stores/User/Actions'
import { getToken, getUser, getUseProduction } from 'App/Stores/User/Selectors';
import { UserModel } from '../../Models/UserModel';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import { ScrollView } from 'react-native-gesture-handler';
import ToggleSwitch from 'rn-toggle-switch';

interface Props {
}

const SettingsScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token: string = useTypedSelector<string>(getToken)
  const user: UserModel = useTypedSelector<UserModel>(getUser)
  const jsVersion =  nodePackage.version
  const [useProduction, _setUseProduction] = useState(useTypedSelector<UserModel>(getUseProduction))
  const setUseProduction = (value: boolean) => {
    _setUseProduction(value)
    useProductionRef.current = value
  }
  const useProductionRef = useRef(useProduction)    //we need a ref to access the current value in the return handler of useEffect

  useEffect(() => {
    return () => {
      if (useProduction != useProductionRef.current) {
        dispatch(UserActions.setUseProduction(useProductionRef.current))
        ApiService.setBaseUrl(useProductionRef.current)
        dispatch(AuthActions.logout())
      }
    }
  }, [])

  const onLogOutPress = () => {
    dispatch(AuthActions.logout())
  }

  return (<>
    <ScreenHeader title={t("peripheralDetail.screenTitle")} back />

    <ScrollView style={styles.container}>

      <Text style={styles.label}>{t("settings.account")}</Text>

      <View style={styles.spacer} />

      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.label}>{t("settings.username")}</Text>
          <Text style={styles.text}>{user?.name}</Text>
        </View>
      </View>

      <View style={styles.spacerDouble} />

      <TouchableOpacity style={styles.button} onPress={onLogOutPress} disabled={!token}>
        <Text style={styles.text}>{t("settings.logout")}</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
      <View style={styles.separator} />
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("settings.development")}</Text>
      <View style={styles.spacer} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={styles.label}>{t("settings.environment")}</Text>
        <ToggleSwitch
          text={{ on: t("settings.production"), off: t("settings.test"), activeTextColor: Colors.black, inactiveTextColor: Colors.black }}
          textStyle={{ ...Fonts.style.regular }}
          textProps={{ allowFontScaling: false }}
          color={{ indicator: Colors.yellow, inactiveIndicator: Colors.yellow, active: Colors.white, inactive: Colors.white, activeBorder: Colors.lightGrey, inactiveBorder: Colors.lightGrey }}
          padding={16}
          width={105}
          radius={Metrics.inputHeight / 4}
          active={useProduction}
          onValueChange={setUseProduction}
        />
      </View>
      <View style={styles.spacer} />
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.label}>{t("settings.apiBaseUrl")}</Text>
          <Text style={styles.text}>{ApiService.getBaseUrl(useProduction)}</Text>
        </View>
      </View>

      <View style={styles.spacer} />
      <View style={styles.separator} />
      <View style={styles.spacer} />

      <Text style={styles.label}>{t("settings.app")}</Text>
      <View style={styles.spacer} />
      <View style={styles.itemContainer}>
        <View style={styles.itemRow}>
          <Text style={styles.label}>{t('settings.versionJS')}</Text>
          <Text style={styles.text}>{jsVersion + (__DEV__ ? " DEV" : "")}</Text>
        </View>
      </View>

      <View style={styles.spacerDouble} />
    </ScrollView>
  </>)
}

export default SettingsScreen