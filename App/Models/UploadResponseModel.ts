// {
//   "lines_received":2,
//   "bytes_received":80927,
//   "log_size_bytes":null,
//   "log_has_timestamps":1571,
//   "log_saved":true,
//   "log_parsed":true,
//   "log_messages":1599,
//   "erase_mx_flash":-1,
//   "erase":false,
//   "erase_type":
//   "fatfs"
// }

// When the response is 200 OK and erase_mx_flash > -1, provide the ERASE_MX_FLASH 
// BLE command (0x21) to the BEEP base with the last byte being the HEX value of the
// erase_mx_flash value (0 = 0x00, 1 = 0x01, i.e.0x2100, or 0x2101,
// i.e. erase_type:"fatfs", or erase_type:"full")

export type ERASE_TYPE = "none" | "quick" | "full"

export class UploadResponseModel {
  eraseMxFlash: number | undefined

  constructor(props: any) {
    this.eraseMxFlash = props.erase_mx_flash
    this.eraseMxFlash = 1
  }

  shouldErase(): boolean {
    return this.eraseMxFlash != undefined ? this.eraseMxFlash > -1 : false
  }

  getEraseCode(): number {
    return this.eraseMxFlash!
  }

  getEraseType(): ERASE_TYPE {
    if (this.eraseMxFlash != undefined) {
      return this.eraseMxFlash == 0 ? "quick" : "full"
    }
    return "none"
  }
}
