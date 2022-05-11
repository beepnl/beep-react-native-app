import { create } from 'apisauce'

const BASE_URL = 'https:///'

const api = create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Cache-Control': 'no-cache'
    // 'Content-Type': 'application/x-www-form-urlencoded',
  },
  timeout: 10000,
})

let key: string = ""
function setKey(value: string) {
  key = value
}

export default {
  setKey,
}
