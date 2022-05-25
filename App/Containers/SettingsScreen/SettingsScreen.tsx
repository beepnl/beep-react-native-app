import React, { FunctionComponent, useEffect, useState, useCallback } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTypedSelector } from 'App/Stores';
import { useNavigation } from '@react-navigation/native';

// Styles
import styles from './SettingsScreenStyle'
import { Colors } from '../../Theme';
import Images from 'App/Assets/Images'

// Utils

// Data
import AuthActions from 'App/Stores/Auth/Actions'
import { getToken } from 'App/Stores/User/Selectors';
import { getUser } from 'App/Stores/User/Selectors';

// Components
import { Text, View, TouchableOpacity } from 'react-native';
import ScreenHeader from '../../Components/ScreenHeader'
import { ScrollView } from 'react-native-gesture-handler';
import { UserModel } from '../../Models/UserModel';

interface Props {
}

const SettingsScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token: string = useTypedSelector<string>(getToken)
  const user: UserModel = useTypedSelector<UserModel>(getUser)
        
  useEffect(() => {
  }, []);

  const onLogOutPress = () => {
    dispatch(AuthActions.logout())
  }

  return (<>
    <ScreenHeader title={t("peripheralDetail.screenTitle")} back />

    <ScrollView style={styles.container} >
      <Text style={styles.label}>{t("settings.username")}<Text style={styles.text}>{user?.name}</Text></Text>

      <View style={styles.spacerDouble} />

      <TouchableOpacity style={styles.button} onPress={onLogOutPress} disabled={!token}>
        <Text style={styles.text}>{t("settings.logout")}</Text>
      </TouchableOpacity>
    </ScrollView>
  </>)
}

export default SettingsScreen