export class CellularServerModel {
  hostname: string
  port: number
  protocol: number  // 0=HTTP, 1=HTTPS, 2=MQTT, 3=CoAP
  endpoint: string

  constructor(props: any) {
    this.hostname = props.hostname || ''
    this.port = props.port || 80
    this.protocol = props.protocol || 0
    this.endpoint = props.endpoint || ''
  }

  getProtocolString(): string {
    switch (this.protocol) {
      case 0: return 'HTTP'
      case 1: return 'HTTPS'
      case 2: return 'MQTT'
      case 3: return 'CoAP'
      default: return 'Unknown'
    }
  }

  getDefaultPort(): number {
    switch (this.protocol) {
      case 0: return 80   // HTTP
      case 1: return 443  // HTTPS
      case 2: return 1883 // MQTT
      case 3: return 5683 // CoAP
      default: return 80
    }
  }

  getFullUrl(): string {
    const protocol = this.getProtocolString().toLowerCase()
    const port = this.port !== this.getDefaultPort() ? `:${this.port}` : ''
    return `${protocol}://${this.hostname}${port}${this.endpoint}`
  }

  isValid(): boolean {
    return this.hostname.length > 0
  }

  toString(): string {
    return this.getFullUrl()
  }
}

export class CellularServerParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(132)
  }

  parse(): CellularServerModel | undefined {
    const len = this.data?.length
    if (len >= 132) {
      // Format: Hostname (64 bytes) + Port (2 bytes) + Protocol (1 byte) + Endpoint (64 bytes) + Reserved (1 byte)
      const hostname = this.data.toString('ascii', 0, 64).replace(/\0/g, '')
      const port = this.data.readUInt16LE(64)
      const protocol = this.data.readUInt8(66)
      const endpoint = this.data.toString('ascii', 67, 131).replace(/\0/g, '')
      
      return new CellularServerModel({ hostname, port, protocol, endpoint })
    }
    return undefined
  }

  static serialize(model: CellularServerModel): Buffer {
    const buffer = Buffer.alloc(132)
    buffer.write(model.hostname, 0, 64, 'ascii')
    buffer.writeUInt16LE(model.port, 64)
    buffer.writeUInt8(model.protocol, 66)
    buffer.write(model.endpoint, 67, 64, 'ascii')
    return buffer
  }
}