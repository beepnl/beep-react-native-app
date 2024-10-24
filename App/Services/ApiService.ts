import { create } from 'apisauce'
import { Platform } from 'react-native'

const TEST_URL = 'https://test.beep.nl/api'
const BASE_URL = 'https://api.beep.nl/api'
const ASSETS_URL = "https://assets.beep.nl"
const LOG_FILE_UPLOAD_URL = "/sensors/flashlog"
const LORA_SENSORS_URL = "/lora_sensors"

const api = create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-ClientId': Platform.OS
  },
  timeout: 10000,
})

function setBaseUrl(useProduction: boolean) {
  if (useProduction) {
    api.setBaseURL(BASE_URL)
  } else {
    api.setBaseURL(TEST_URL)
  }
}

function getBaseUrl(useProduction: boolean) {
  return useProduction ? BASE_URL : TEST_URL
}

function getLogFileUploadUrl(useProduction: boolean, logFileSize: number) {
  return getBaseUrl(useProduction) + LOG_FILE_UPLOAD_URL + "?log_size_bytes=" + logFileSize.toString()
}

function getLoRaSensorsUrl(useProduction: boolean) {
  return getBaseUrl(useProduction) + LORA_SENSORS_URL
}

const apiAssets = create({
  baseURL: ASSETS_URL,
  headers: {
    Accept: 'application/json',
    'Cache-Control': 'no-cache'
  },
  timeout: 10000,
})

let token = ""
function setToken(value: string) {
  api.headers['Authorization'] = `Bearer ${value}`
  token = value
}

function getToken() {
  return token
}

function login(email: string, password: string) {
  return api.post("login", { email, password }, { headers: { Authorization: "" } })
}

function getDevices() {
  return api.get("devices")
}

function getDevice(hardwareId: string) {
  return api.get("devices", { hardware_id: hardwareId })
}

function registerDevice(params: any) {
  return api.post("devices", { ...params })
}

function updateDevice(id: string, params: any) {
  return api.put(`devices/${id}`, { ...params })
}

function createTtnDevice(hardwareId: string, params: any) {
  return api.post(`devices/ttn/${hardwareId}`, { ...params })
}

function createSensorDefinition(params: any) {
  return api.post("sensordefinition", { ...params })
}

function getSensorDefinitions(deviceId: string) {
  return api.get("sensordefinition", { device_id: deviceId })
}

function updateSensorDefinition(id: string, params: any) {
  return api.put(`sensordefinition/${id}`, { ...params })
}

function getFirmwares() {
  return apiAssets.get("firmware/firmware_index.json")
}


export default {
  //auth
  setToken,
  getToken,
  login,

  //api
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  createTtnDevice,
  createSensorDefinition,
  getSensorDefinitions,
  updateSensorDefinition,

  //assets
  getFirmwares,

  //constants
  getBaseUrl,
  setBaseUrl,
  getLogFileUploadUrl,
  getLoRaSensorsUrl,
}
