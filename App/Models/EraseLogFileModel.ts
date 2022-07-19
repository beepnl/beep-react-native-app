const ERRORS = [
  "Succeeded",                                                          //0
  "A hard error occurred in the low level disk I/O layer",              //1
  "Assertion failed",                                                   //2
  "The physical drive cannot work",                                     //3
  "Could not find the file",                                            //4
  "Could not find the path",                                            //5
  "The path name format is invalid",                                    //6
  "Access denied due to prohibited access or directory full",           //7
  "Access denied due to prohibited access",                             //8
  "The file/directory object is invalid",                               //9
  "The physical drive is write protected",                              //10
  "The logical drive number is invalid",                                //11
  "The volume has no work area",                                        //12
  "There is no valid FAT volume",                                       //13
  "The f_mkfs() aborted due to any problem",                            //14
  "Could not get a grant to access the volume within defined period",   //15
  "The operation is rejected according to the file sharing policy",     //16
  "LFN working buffer could not be allocated",                          //17
  "Number of open files > _FS_LOCK",                                    //18
  "Given parameter is invalid",                                         //19
]

export class EraseLogFileModel {
  command: number
  code: number
  message: string

  constructor(props: any) {
    this.command = props.command
    this.code = props.code
    this.message = ERRORS[props.code]
  }

  toString() {
    return `Command code: ${this.command}. Error message: ${this.message}`
  }

  static parse(rawData: any) {
    let command = 0
    let code = 0
    if (rawData?.length >= 5) {
      command = rawData.readUInt8(0)
      code = rawData.readUInt32BE(1)
    }
    return new EraseLogFileModel({ command, code })
  }
}
