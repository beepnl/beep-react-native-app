export class CellularPSMModel {
  enabled: boolean
  periodicTau: number      // Periodic TAU value in seconds
  activeTimes: number      // Active time value in seconds

  constructor(props: any) {
    this.enabled = !!props.enabled
    this.periodicTau = props.periodicTau || 3600  // 1 hour default
    this.activeTimes = props.activeTimes || 60    // 1 minute default
  }

  getPeriodicTauString(): string {
    if (this.periodicTau >= 3600) {
      return `${Math.floor(this.periodicTau / 3600)}h`
    } else if (this.periodicTau >= 60) {
      return `${Math.floor(this.periodicTau / 60)}m`
    }
    return `${this.periodicTau}s`
  }

  getActiveTimeString(): string {
    if (this.activeTimes >= 60) {
      return `${Math.floor(this.activeTimes / 60)}m`
    }
    return `${this.activeTimes}s`
  }

  toString(): string {
    if (!this.enabled) return 'PSM Disabled'
    return `PSM: TAU ${this.getPeriodicTauString()}, Active ${this.getActiveTimeString()}`
  }
}

export class CellularPSMParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(9)
  }

  parse(): CellularPSMModel | undefined {
    const len = this.data?.length
    if (len >= 9) {
      const enabled = !!this.data.readUInt8(0)
      const periodicTau = this.data.readUInt32LE(1)
      const activeTimes = this.data.readUInt32LE(5)
      
      return new CellularPSMModel({
        enabled,
        periodicTau,
        activeTimes
      })
    }
    return undefined
  }

  static serialize(model: CellularPSMModel): Buffer {
    const buffer = Buffer.alloc(9)
    buffer.writeUInt8(model.enabled ? 1 : 0, 0)
    buffer.writeUInt32LE(model.periodicTau, 1)
    buffer.writeUInt32LE(model.activeTimes, 5)
    return buffer
  }
}