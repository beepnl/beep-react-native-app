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

  /**
   * Converts a 24-bit value to a 32-bit signed integer
   * @param bytes - Array of 3 bytes representing 24-bit value
   * @returns number - 32-bit signed integer
   */
  private convert24BitToSigned(byte1: number, byte2: number, byte3: number): number {
    // Combine to 24-bit unsigned value
    let v = ((byte1 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte3 & 0xFF);
    // Sign-extend 24 -> 32 bits
    if (v & 0x800000) v -= 0x1000000; // 2^24
    return v;
  }

  parse(): WeightModel | undefined {
    const data = []
    const len = this.data?.length
    if (len >= 4) {
      let i = 0
      while (i < len) {
        const channelByte = this.data.readUInt8(i++);
        const channel = CHANNELS.find(ch => ch.bitmask == channelByte);
        if (!channel) {
          i += 3;
          continue;
        }

        // Read the three bytes for the 24-bit value
        const byte1 = this.data.readUInt8(i++);
        const byte2 = this.data.readUInt8(i++);
        const byte3 = this.data.readUInt8(i++);

        // Convert to signed value using the new method
        channel.value = this.convert24BitToSigned(byte1, byte2, byte3);

        data.push(channel);
      }
    }

    return new WeightModel({ data });
  }
}