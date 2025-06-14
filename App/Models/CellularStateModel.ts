export const CELLULAR_BITMASK_ENABLED = 1
export const CELLULAR_BITMASK_CONNECTED = 2
export const CELLULAR_BITMASK_PSM_ENABLED = 4
export const CELLULAR_BITMASK_EDRX_ENABLED = 8
export const CELLULAR_BITMASK_GNSS_ENABLED = 16

export class CellularStateModel {
  isEnabled: boolean
  isConnected: boolean
  isPsmEnabled: boolean
  isEdrxEnabled: boolean
  isGnssEnabled: boolean

  constructor(props: any) {
    this.isEnabled = !!props.isEnabled
    this.isConnected = !!props.isConnected
    this.isPsmEnabled = !!props.isPsmEnabled
    this.isEdrxEnabled = !!props.isEdrxEnabled
    this.isGnssEnabled = !!props.isGnssEnabled
  }

  toString(): string {
    const states = []
    if (this.isEnabled) states.push('Enabled')
    if (this.isConnected) states.push('Connected')
    if (this.isPsmEnabled) states.push('PSM')
    if (this.isEdrxEnabled) states.push('eDRX')
    if (this.isGnssEnabled) states.push('GNSS')
    return states.length > 0 ? states.join(', ') : 'Disabled'
  }
}

export class CellularStateParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): CellularStateModel | undefined {
    const len = this.data?.length
    if (len >= 1) {
      const state = this.data.readUInt8(0)
      const isEnabled = !!(state & CELLULAR_BITMASK_ENABLED)
      const isConnected = !!(state & CELLULAR_BITMASK_CONNECTED)
      const isPsmEnabled = !!(state & CELLULAR_BITMASK_PSM_ENABLED)
      const isEdrxEnabled = !!(state & CELLULAR_BITMASK_EDRX_ENABLED)
      const isGnssEnabled = !!(state & CELLULAR_BITMASK_GNSS_ENABLED)
      return new CellularStateModel({ 
        isEnabled, 
        isConnected, 
        isPsmEnabled, 
        isEdrxEnabled, 
        isGnssEnabled 
      })
    }
  }
}