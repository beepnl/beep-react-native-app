export class CellularAPNModel {
  apn: string
  username: string
  password: string

  constructor(props: any) {
    this.apn = props.apn || ''
    this.username = props.username || ''
    this.password = props.password || ''
  }

  isValid(): boolean {
    // APN is required, username/password are optional
    return this.apn.length > 0
  }

  toString(): string {
    if (this.username) {
      return `${this.apn} (${this.username})`
    }
    return this.apn
  }
}

export class CellularAPNParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(128)
  }

  parse(): CellularAPNModel | undefined {
    const len = this.data?.length
    if (len >= 128) {
      // Format: APN (64 bytes) + Username (32 bytes) + Password (32 bytes)
      const apn = this.data.toString('ascii', 0, 64).replace(/\0/g, '')
      const username = this.data.toString('ascii', 64, 96).replace(/\0/g, '')
      const password = this.data.toString('ascii', 96, 128).replace(/\0/g, '')
      
      return new CellularAPNModel({ apn, username, password })
    }
    return undefined
  }

  static serialize(model: CellularAPNModel): Buffer {
    const buffer = Buffer.alloc(128)
    buffer.write(model.apn, 0, 64, 'ascii')
    buffer.write(model.username, 64, 32, 'ascii')
    buffer.write(model.password, 96, 32, 'ascii')
    return buffer
  }
}