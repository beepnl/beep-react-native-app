export class LanguageModel {
  name: string = ""
  nativeName: string = ""
  code: string = ""
  flag: string = ""

  constructor(props: any) {
    Object.assign(this, props)
  }

}
