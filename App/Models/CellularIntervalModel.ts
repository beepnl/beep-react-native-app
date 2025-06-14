export class CellularIntervalModel {
  transmissionInterval: number  // in minutes
  heartbeatInterval: number     // in minutes
  emergencyInterval: number     // in minutes for emergency transmissions

  constructor(props: any) {
    this.transmissionInterval = props.transmissionInterval || 60  // 1 hour default
    this.heartbeatInterval = props.heartbeatInterval || 1440      // 24 hours default
    this.emergencyInterval = props.emergencyInterval || 1        // 1 minute default
  }

  getTransmissionIntervalString(): string {
    if (this.transmissionInterval >= 1440) {
      return `${Math.floor(this.transmissionInterval / 1440)} days`
    } else if (this.transmissionInterval >= 60) {
      return `${Math.floor(this.transmissionInterval / 60)}h`
    }
    return `${this.transmissionInterval}m`
  }

  getHeartbeatIntervalString(): string {
    if (this.heartbeatInterval >= 1440) {
      return `${Math.floor(this.heartbeatInterval / 1440)} days`
    } else if (this.heartbeatInterval >= 60) {
      return `${Math.floor(this.heartbeatInterval / 60)}h`
    }
    return `${this.heartbeatInterval}m`
  }

  toString(): string {
    return `Data: ${this.getTransmissionIntervalString()}, Heartbeat: ${this.getHeartbeatIntervalString()}`
  }
}

export class CellularIntervalParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(12)
  }

  parse(): CellularIntervalModel | undefined {
    const len = this.data?.length
    if (len >= 12) {
      const transmissionInterval = this.data.readUInt32LE(0)
      const heartbeatInterval = this.data.readUInt32LE(4)
      const emergencyInterval = this.data.readUInt32LE(8)
      
      return new CellularIntervalModel({
        transmissionInterval,
        heartbeatInterval,
        emergencyInterval
      })
    }
    return undefined
  }

  static serialize(model: CellularIntervalModel): Buffer {
    const buffer = Buffer.alloc(12)
    buffer.writeUInt32LE(model.transmissionInterval, 0)
    buffer.writeUInt32LE(model.heartbeatInterval, 4)
    buffer.writeUInt32LE(model.emergencyInterval, 8)
    return buffer
  }
}