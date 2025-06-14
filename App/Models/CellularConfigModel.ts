export class CellularConfigModel {
  networkMode: number  // 0=LTE-M, 1=NB-IoT, 2=GPS, 3=Auto
  transmissionInterval: number  // in minutes
  retryAttempts: number
  maxDataLength: number

  constructor(props: any) {
    this.networkMode = props.networkMode || 0
    this.transmissionInterval = props.transmissionInterval || 60
    this.retryAttempts = props.retryAttempts || 3
    this.maxDataLength = props.maxDataLength || 512
  }

  getNetworkModeString(): string {
    switch (this.networkMode) {
      case 0: return 'LTE-M'
      case 1: return 'NB-IoT'
      case 2: return 'GPS Only'
      case 3: return 'Auto'
      default: return 'Unknown'
    }
  }

  toString(): string {
    return `${this.getNetworkModeString()}, ${this.transmissionInterval}min, ${this.retryAttempts} retries`
  }
}

export class CellularConfigParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(6)
  }

  parse(): CellularConfigModel | undefined {
    const len = this.data?.length
    if (len >= 6) {
      const networkMode = this.data.readUInt8(0)
      const transmissionInterval = this.data.readUInt16LE(1)
      const retryAttempts = this.data.readUInt8(3)
      const maxDataLength = this.data.readUInt16LE(4)
      
      return new CellularConfigModel({
        networkMode,
        transmissionInterval,
        retryAttempts,
        maxDataLength
      })
    }
    return undefined
  }

  static serialize(config: CellularConfigModel): Buffer {
    const buffer = Buffer.alloc(6)
    buffer.writeUInt8(config.networkMode, 0)
    buffer.writeUInt16LE(config.transmissionInterval, 1)
    buffer.writeUInt8(config.retryAttempts, 3)
    buffer.writeUInt16LE(config.maxDataLength, 4)
    return buffer
  }
}