import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

// Hooks
import { useTypedSelector } from '@/App/Stores';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// Styles
import ApiService from '@/App/Services/ApiService';
import styles from '../Sensor/styles';

// Utils
import * as Application from 'expo-application';

// Data
import { UserModel } from '@/App/Models/UserModel';
import AuthActions from '@/App/Stores/Auth/Actions';
import UserActions from '@/App/Stores/User/Actions';
import { getToken, getUseProduction, getUser } from '@/App/Stores/User/Selectors';

// Components
import ScreenHeader from '@/App/Components/ScreenHeader';
import ToggleSwitch from '@/App/Components/ToggleSwitch';
import { Colors } from '@/App/Theme';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { persistData, TOKEN_KEY, USE_PRODUCTION_KEY, USER_KEY } from '@/App/Helpers/AsyncStorageHelpers';


interface Props {
}
const SettingsScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const token: string = useTypedSelector<string>(getToken)
  const user: UserModel = useTypedSelector<UserModel>(getUser)
  const jsVersion = Application.nativeApplicationVersion
  const [useProduction, _setUseProduction] = useState(useTypedSelector<boolean>(getUseProduction))
  const [apiToken, setApiToken] = useState("")
  const [apiTokenError, setApiTokenError] = useState("")
  const [apiTokenSuccess, setApiTokenSuccess] = useState("")
  const [isApplyingApiToken, setApplyingApiToken] = useState(false)
  const showApiTokenLogin = __DEV__
  const apiTokenLoginAppliedRef = useRef(false)
  const setUseProduction = (value: boolean) => {
    _setUseProduction(value)
    useProductionRef.current = value
    //persist setting
    persistData(USE_PRODUCTION_KEY, value)
  }
  const useProductionRef = useRef(useProduction)    //we need a ref to access the current value in the return handler of useEffect

  useEffect(() => {
    return () => {
      if (useProduction != useProductionRef.current && !apiTokenLoginAppliedRef.current) {
        dispatch(UserActions.setUseProduction(useProductionRef.current))
        ApiService.setBaseUrl(useProductionRef.current)
        dispatch(AuthActions.logout())
      }
    }
  }, [])

  const onLogOutPress = () => {
    dispatch(AuthActions.logout())
  }

  const onApiTokenLoginPress = async () => {
    const cleanApiToken = apiToken.trim()
    setApiTokenError("")
    setApiTokenSuccess("")

    if (!cleanApiToken) {
      setApiTokenError(t("settings.apiTokenRequired"))
      return
    }

    try {
      setApplyingApiToken(true)
      ApiService.setBaseUrl(useProductionRef.current)
      const response = await ApiService.authenticate(cleanApiToken)

      if (!response?.ok || !response.data) {
        setApiTokenError(t("settings.apiTokenInvalid"))
        return
      }

      const userFromToken = new UserModel(response.data)
      await persistData(TOKEN_KEY, cleanApiToken)
      await persistData(USER_KEY, userFromToken)
      apiTokenLoginAppliedRef.current = true
      dispatch(UserActions.setUseProduction(useProductionRef.current))
      dispatch(AuthActions.handleLogin(cleanApiToken, userFromToken))
      setApiToken("")
      setApiTokenSuccess(t("settings.apiTokenApplied", { email: userFromToken.email || userFromToken.name }))
    } catch (error) {
      setApiTokenError(`${t("settings.apiTokenFailed")} ${String(error)}`)
    } finally {
      setApplyingApiToken(false)
    }
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
          value={useProduction}
          onValueChange={setUseProduction}
          offLabel={t("settings.test")}
          onLabel={t("settings.production")}
          trackColor={{ false: Colors.lightGrey, true: Colors.lightGrey }}
          thumbColor={Colors.yellow}
        />
      </View>

      {showApiTokenLogin && <>
        <View style={styles.spacerDouble} />

        <View style={styles.itemContainer}>
          <Text style={styles.label}>{t("settings.apiTokenLogin")}</Text>
          <View style={styles.spacerHalf} />
          <Text style={styles.instructions}>{t("settings.apiTokenInstructions")}</Text>
          <View style={styles.spacer} />
          <TextInput
            style={styles.input}
            placeholder={t("settings.apiTokenPlaceholder")}
            placeholderTextColor={Colors.placeholder}
            value={apiToken}
            onChangeText={(value) => {
              setApiToken(value)
              setApiTokenError("")
              setApiTokenSuccess("")
            }}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
            editable={!isApplyingApiToken}
          />
          {!!apiTokenError && <>
            <View style={styles.spacerHalf} />
            <Text style={[styles.text, styles.error]}>{apiTokenError}</Text>
          </>}
          {!!apiTokenSuccess && <>
            <View style={styles.spacerHalf} />
            <Text style={styles.text}>{apiTokenSuccess}</Text>
          </>}
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.button} onPress={onApiTokenLoginPress} disabled={isApplyingApiToken}>
            <Text style={styles.text}>{isApplyingApiToken ? t("settings.apiTokenApplying") : t("settings.apiTokenApply")}</Text>
          </TouchableOpacity>
        </View>
      </>}

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
