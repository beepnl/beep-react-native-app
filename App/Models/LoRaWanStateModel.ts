import { ceil } from "lodash"

export const BITMASK_ENABLED = 1 
export const BITMASK_JOINED = 2
export const BITMASK_DUTY_CYCLE_LIMITATION = 4
export const BITMASK_ADAPTIVE_DATA_RATE = 8
export const BITMASK_KEYS_VALID = 16

export class LoRaWanStateModel {
  isEnabled: boolean
  hasJoined: boolean
  isDutyCycleLimitationEnabled: boolean
  isAdaptiveDataRateEnabled: boolean
  hasValidKeys: boolean

  constructor(props: any) {
    this.isEnabled = !!props.isEnabled
    this.hasJoined = !!props.hasJoined
    this.isDutyCycleLimitationEnabled = !!props.isDutyCycleLimitationEnabled
    this.isAdaptiveDataRateEnabled = !!props.isAdaptiveDataRateEnabled
    this.hasValidKeys = !!props.hasValidKeys
  }
}

export class LoRaWanStateParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): LoRaWanStateModel | undefined {
    const len = this.data?.length
    if (len >= 1) {
      const state = this.data.readUInt8(0)
      const isEnabled = state & BITMASK_ENABLED
      const hasJoined = state & BITMASK_JOINED
      const isDutyCycleLimitationEnabled = state & BITMASK_DUTY_CYCLE_LIMITATION
      const isAdaptiveDataRateEnabled = state & BITMASK_ADAPTIVE_DATA_RATE
      const hasValidKeys = state & BITMASK_KEYS_VALID
      return new LoRaWanStateModel({ isEnabled, hasJoined, isDutyCycleLimitationEnabled, isAdaptiveDataRateEnabled, hasValidKeys })
    }
  }
}