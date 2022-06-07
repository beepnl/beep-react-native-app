import React, { FunctionComponent, useEffect, useState, useCallback, useRef } from 'react'

// Hooks
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'App/Stores';

// Styles
import styles from './LoginScreenStyle'
import { Images, Metrics } from '../../Theme';

// Utils

// Data
import AuthActions from 'App/Stores/Auth/Actions'
import { getError } from 'App/Stores/Auth/Selectors';

// Components
import { Text, View, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
}

const LoginScreen: FunctionComponent<Props> = ({
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const error = useSelector(getError)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const inputUsernameRef = useRef<TextInput>(null)
  const inputPasswordRef = useRef<TextInput>(null)

  const onLoginPress = () => {
    dispatch(AuthActions.login(username, password))
  }

  return (
    <SafeAreaView style={styles.mainContainer}>

      <ScrollView style={styles.container}>
        <View style={styles.spacerDouble} />

        <Image style={{ width: Metrics.clientWidth - Metrics.doubleBaseMargin, height: 300, margin: Metrics.baseMargin }} source={Images.beepLogo} resizeMode="contain" />

        <TextInput
          ref={inputUsernameRef}
          style={styles.input}
          placeholder={t("login.username")}
          onChangeText={setUsername}
          value={username}
          autoCapitalize={"none"}
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => inputPasswordRef?.current?.focus()}
        />

        <View style={styles.spacerDouble} />

        <TextInput
          ref={inputPasswordRef}
          style={styles.input}
          placeholder={t("login.password")}
          onChangeText={setPassword}
          value={password}
          secureTextEntry={true}
          onSubmitEditing={onLoginPress}
        />

        <View style={styles.spacerDouble} />

        { !!error && <>
          <Text style={styles.error}>{error}</Text>
          <View style={styles.spacerDouble} />
        </>}

        <TouchableOpacity style={styles.button} onPress={onLoginPress}>
          <Text style={styles.text}>{t("login.login")}</Text>
        </TouchableOpacity>

        <View style={styles.spacerDouble} />

      </ScrollView>
    </SafeAreaView>
  )
}

export default LoginScreen