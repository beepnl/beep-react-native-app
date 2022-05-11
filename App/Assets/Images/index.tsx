import IconPlus from 'App/Assets/Images/IconPlus'
import IconMinus from 'App/Assets/Images/IconMinus'
import IconRoboUp from 'App/Assets/Images/IconRoboUp'
import IconRoboDown from 'App/Assets/Images/IconRoboDown'
import IconRotate from 'App/Assets/Images/IconRotate'
import IconUpDown from 'App/Assets/Images/IconUpDown'
import IconArrowLeft from 'App/Assets/Images/IconArrowLeft'
import IconArrowRight from 'App/Assets/Images/IconArrowRight'

export type IconNames = 
  undefined |
  "plus" | 
  "minus" |
  "roboUp" |
  "roboDown" |
  "rotate" |
  "upDown" |
  "arrowLeft" |
  "arrowRight"

export default {
  getIconByName(iconName: IconNames): JSX.Element | undefined {
    switch (iconName) {
      case "plus":
        return IconPlus

      case "minus":
        return IconMinus
    
      case "roboUp":
        return IconRoboUp
    
      case "roboDown":
        return IconRoboDown
    
      case "rotate":
        return IconRotate
    
      case "upDown":
        return IconUpDown
    
      case "arrowLeft":
        return IconArrowLeft
    
      case "arrowRight":
        return IconArrowRight   
    }
  }
}