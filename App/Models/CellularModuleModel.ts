export class CellularModuleModel {
  isDetected: boolean
  
  constructor(props: any) {
    this.isDetected = !!props.isDetected
  }

  toString(): string {
    return this.isDetected ? 'nRF91xx Module Detected' : 'nRF91xx Module Not Found'
  }

  getStatusColor(): string {
    return this.isDetected ? '#4CAF50' : '#F44336' // Green if detected, red if not
  }
}

export class CellularModuleParser {
  data: Buffer

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): CellularModuleModel | undefined {
    const len = this.data?.length
    if (len >= 1) {
      const detected = this.data.readUInt8(0) === 1
      return new CellularModuleModel({ isDetected: detected })
    }
    return undefined
  }
}