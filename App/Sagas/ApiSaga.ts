import { put, call } from 'redux-saga/effects'
import ApiActions from 'App/Stores/Api/Actions'
import UserActions from 'App/Stores/User/Actions'
import api from 'App/Services/ApiService'
import { DeviceModel } from '../Models/DeviceModel'

export function* getDevices(action: any) {
  const response = yield call(api.getDevices)
  if (response && response.ok) {
    const devices: Array<DeviceModel> = []
    response.data?.map((item: any) => devices.push(new DeviceModel(item)))
    yield put(UserActions.setDevices(devices))
  } else {
    yield put(ApiActions.apiFailure(response))
  }
}