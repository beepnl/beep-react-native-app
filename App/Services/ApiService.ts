import { create } from 'apisauce'

const BASE_URL = 'https://api.beep.nl/api'

const api = create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Cache-Control': 'no-cache'
    // 'Content-Type': 'application/x-www-form-urlencoded',
  },
  timeout: 10000,
})

function setToken(value: string) {
  api.headers['Authorization'] = `Bearer ${value}`
}

function login(email: string, password: string) {
  return api.post("login", { email, password }, { headers: { Authorization: "" } })
}

function getDevices() {
  return api.get("devices")
}

export default {
  setToken,
  login,

  getDevices,
}
