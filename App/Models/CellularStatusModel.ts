export class CellularStatusModel {
  signalStrength: number  // RSSI in dBm
  batteryLevel: number    // in percentage
  networkRegistration: number  // 0=not registered, 1=registered, 2=searching
  lastConnectionTime: number   // timestamp
  dataUsage: number       // in bytes
  errorCode: number       // last error code

  constructor(props: any) {
    this.signalStrength = props.signalStrength || -999
    this.batteryLevel = props.batteryLevel || 0
    this.networkRegistration = props.networkRegistration || 0
    this.lastConnectionTime = props.lastConnectionTime || 0
    this.dataUsage = props.dataUsage || 0
    this.errorCode = props.errorCode || 0
  }

  getSignalQuality(): string {
    if (this.signalStrength >= -70) return 'Excellent'
    if (this.signalStrength >= -85) return 'Good'
    if (this.signalStrength >= -100) return 'Fair'
    if (this.signalStrength >= -110) return 'Poor'
    return 'No Signal'
  }

  getRegistrationStatus(): string {
    switch (this.networkRegistration) {
      case 0: return 'Not Registered'
      case 1: return 'Registered'
      case 2: return 'Searching'
      default: return 'Unknown'
    }
  }

  toString(): string {
    return `Signal: ${this.signalStrength}dBm (${this.getSignalQuality()}), ${this.getRegistrationStatus()}`
  }
}

export class CellularStatusParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(14)
  }

  parse(): CellularStatusModel | undefined {
    const len = this.data?.length
    if (len >= 14) {
      const signalStrength = this.data.readInt8(0)  // signed byte for negative RSSI
      const batteryLevel = this.data.readUInt8(1)
      const networkRegistration = this.data.readUInt8(2)
      const lastConnectionTime = this.data.readUInt32LE(4)
      const dataUsage = this.data.readUInt32LE(8)
      const errorCode = this.data.readUInt16LE(12)
      
      return new CellularStatusModel({
        signalStrength,
        batteryLevel,
        networkRegistration,
        lastConnectionTime,
        dataUsage,
        errorCode
      })
    }
    return undefined
  }
}