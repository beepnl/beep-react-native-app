import { Buffer } from 'buffer'

export class AteccModel {
  id: string = ""
 
  constructor(props: any) {
    this.id = props.id
  }

  toString() {
    return this.id
  }
}

export class AteccParser {
  data: Buffer;

  constructor(props: any) {
    // Ensure data is a proper Buffer instance
    this.data = Buffer.isBuffer(props.data) ? props.data : Buffer.from(props.data || [])
  }

  parse(): AteccModel {
    let id = ""
    if (this.data?.length >= 9) {
      id = this.data.toString("hex", 0, 9)
      // id = this.data.toString("hex", 1, 9)
    }
    return new AteccModel({ id })
  }
}