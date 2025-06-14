export class CellularIMEIModel {
  imei: string

  constructor(props: any) {
    this.imei = props.imei || ''
  }

  isValid(): boolean {
    // IMEI should be 15 digits
    return /^\d{15}$/.test(this.imei)
  }

  getDisplayFormat(): string {
    if (this.imei.length === 15) {
      // Format as XX-XXXXXX-XXXXXX-X
      return `${this.imei.slice(0, 2)}-${this.imei.slice(2, 8)}-${this.imei.slice(8, 14)}-${this.imei.slice(14)}`
    }
    return this.imei
  }

  toString(): string {
    return this.getDisplayFormat()
  }
}

export class CellularIMEIParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(16)
  }

  parse(): CellularIMEIModel | undefined {
    const len = this.data?.length
    if (len >= 16) {
      // IMEI is stored as null-terminated string
      const imei = this.data.toString('ascii', 0, 15).replace(/\0/g, '')
      return new CellularIMEIModel({ imei })
    }
    return undefined
  }

  static serialize(model: CellularIMEIModel): Buffer {
    const buffer = Buffer.alloc(16)
    buffer.write(model.imei, 0, 15, 'ascii')
    return buffer
  }
}