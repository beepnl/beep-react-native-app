type ChannelName = "A_GAIN128" | "B_GAIN32" | "A_GAIN64"

type Channel = {
  name: ChannelName,
  bitmask: number,
  value: number
}

export const CHANNELS: Array<Channel> = [
  {
    name: "A_GAIN128",
    bitmask: 1,
    value: 0,
  },
  {
    name: "B_GAIN32",
    bitmask: 2,
    value: 0,
  },
  {
    name: "A_GAIN64",
    bitmask: 4,
    value: 0,
  },
]

export class WeightModel {
  channels: Array<Channel> = []

  constructor(props: any) {
    this.channels = props.data
  }

  toString() {
    return `${(this.channels.map(channel => `${channel.name}: ${channel.value}`).join(", "))}`
  }

}

export class WeightParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): WeightModel | undefined {
    const data = []
    const len = this.data?.length
    if (len >= 4) {
      let i = 0
      while (i < len) {
        const channelByte = this.data.readUInt8(i++)
        const channel = CHANNELS.find(ch => ch.bitmask == channelByte)
        if (!channel) {
          i += 3
          continue
        }
        
        //read 24bit signed value
        const data_32bit_unsigned = Buffer.alloc(4);
        data_32bit_unsigned.fill(0);
        const data_32bit_signed = Buffer.alloc(4);
        data_32bit_signed.fill(0);

        console.log(data)
        let byte1 = this.data.readUInt8(i++)
        console.log(byte1)
        const signed = byte1 & 0b10000000
        if (signed) {
          byte1 &= 0b01111111
          console.log("value is signed, two's complement of first byte is:")
          console.log(byte1)
        }
        
        const byte2 = this.data.readUInt8(i++)
        const byte3 = this.data.readUInt8(i++)
        
        // let combined = (byte1<<16) | (byte2<<8) | (byte3)
        // should the sign bit of byte1 be excluded?
        if (!signed) {
          data_32bit_unsigned.writeUInt8(byte1, 1)
          data_32bit_unsigned.writeUInt8(byte2, 2)
          data_32bit_unsigned.writeUInt8(byte3, 3)
          channel.value = data_32bit_unsigned.readUInt32BE(0)
          console.log("24-bit value is postive, converting following value..")
          console.log(channel.value);
          console.log("..to zero-padded UInt32:")
          console.log(data_32bit_unsigned);
        }
        else{
          data_32bit_signed.writeUInt8(byte1, 1)
          data_32bit_signed.writeUInt8(byte2, 2)
          data_32bit_signed.writeUInt8(byte3, 3)
          console.log("24-bit value is postive, converting following value..")
          console.log(channel.value);
          console.log("..to zero-padded Int32:")
          channel.value = data_32bit_signed.readInt32BE(0)
          channel.value = -channel.value
        }
        
        data.push(channel)
      }
    }

    return new WeightModel({ data })
  }
}