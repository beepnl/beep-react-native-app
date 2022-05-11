import * as React from "react"
import Svg, { Path } from "react-native-svg"
import { Colors } from "../../Theme"

function SvgComponent(props) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={32}
      viewBox="0 0 22 32"
      {...props}
    >
      <Path
        fill={Colors.black}
        d="M21.397 24.922v6.961L0 16.872v-1.919L21.397 0v6.932L9.166 15.869z"
        fillRule="evenodd"
      />
    </Svg>
  )
}

export default SvgComponent
