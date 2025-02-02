export type ChannelName = "IN3LM" | "IN2RP" | "IN2LP"

export type Channel = {
  name: ChannelName,
  bitmask: number,
}

export const CHANNELS: Array<Channel> = [
  {
    name: "IN3LM",
    bitmask: 0,
  },
  {
    name: "IN2LP",
    bitmask: 1,
  },
  {
    name: "IN2RP",
    bitmask: 2,
  },
]

export interface AudioModel {
  channel: {
    name: string;
  };
  startBin: number;
  stopBin: number;
  bins: number;
  values: number[];
  gain?: number;
  volume?: number;
}

export class AudioParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  // read audio values 
  parseConversion(data: Buffer): number[] {
    const values: number[] = [];
    const len = data?.length;
    
    if (len >= 2) { // Assuming 2 bytes per bin value
      for (let i = 0; i < len; i += 2) {
        // Combine two bytes into a single value
        const value = data.readUInt16LE(i);
        values.push(value);
      }
    }
    
    return values;
  }

  parse(): AudioModel | undefined {
    const len = this.data?.length
    if (len >= 6) {
      let i = 0
      const channelByte = this.data.readUInt8(i++)
      const channel = CHANNELS.find(ch => ch.bitmask == channelByte)
      const gain = this.data.readUint8(i++)
      const volume = this.data.readInt8(i++)
      const bins = this.data.readUInt8(i++)
      const startBin = this.data.readUInt8(i++)
      const stopBin = this.data.readUInt8(i++)
      return { channel, gain, volume, bins, startBin, stopBin, values: [] }
    }
  }
}