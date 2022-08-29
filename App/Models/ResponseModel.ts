const ERRORS = [
  "Successful command",                                 //0
  "SVC handler is missing",                             //1
  "SoftDevice has not been enabled",                    //2
  "Internal Error",                                     //3
  "No Memory for operation",                            //4
  "Not found",                                          //5
  "Not supported",                                      //6
  "Invalid Parameter",                                  //7
  "Invalid state, operation disallowed in this state",  //8
  "Invalid Length",                                     //9
  "Invalid Flags",                                      //10
  "Invalid Data",                                       //11
  "Invalid Data size",                                  //12
  "Operation timed out",                                //13
  "Null Pointer",                                       //14
  "Forbidden Operation",                                //15
  "Bad Memory Address",                                 //16
  "Busy",                                               //17
  "Maximum connection count exceeded.",                 //18
  "Not enough resources for operation",                 //19
]

export class ResponseModel {
  command: number
  code: number
  message: string

  constructor(props: any) {
    this.command = props.command
    this.code = props.code
    this.message = ERRORS[props.code]
  }

  toString() {
    return `Command code: 0x${this.command.toString(16)}. Error message: ${this.message}`
  }

  static parse(rawData: any) {
    let command = 0
    let code = 0
    if (rawData?.length >= 5) {
      command = rawData.readUInt8(0)
      code = rawData.readUInt32BE(1)
    }
    return new ResponseModel({ command, code })
  }
}
