import { create } from 'apisauce'

const BASE_URL = 'https://api.beep.nl/api'
const ASSETS_URL = "https://assets.beep.nl"
const LOG_FILE_UPLOAD_URL = BASE_URL + "/sensors/flashlog"

const api = create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Cache-Control': 'no-cache'
    // 'Content-Type': 'application/x-www-form-urlencoded',
  },
  timeout: 10000,
})

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

function getFirmwares() {
  return apiAssets.get("firmware/firmware_index.json")
}

export default {
  setToken,
  getToken,
  login,

  getDevices,

  getFirmwares,

  LOG_FILE_UPLOAD_URL,
}
