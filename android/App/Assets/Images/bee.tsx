import * as React from "react"
import Svg, { G, Path, Circle } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" {...props}>
    <G
      transform="translate(2 3)"
      stroke="#242424"
      strokeWidth={3}
      fill="none"
      fillRule="evenodd"
    >
      <Path d="M7.56 40.569 0 47.559M1.62 27.059l19.25 20.83M.44 15.679l31.37 33.94M10.62 16.239l21.28 23.02" />
      <Circle
        transform="rotate(-42.74 33.26 17.141)"
        cx={33.26}
        cy={17.141}
        r={12.13}
      />
      <Circle
        transform="rotate(-72.74 3.173 8.173)"
        cx={3.173}
        cy={8.173}
        r={1.94}
      />
      <Circle
        transform="rotate(-42.74 39.834 47.51)"
        cx={39.834}
        cy={47.51}
        r={1.94}
      />
    </G>
  </Svg>
)

export default SvgComponent
