import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgIconArrowRight(props) {
  let color1, color2, color3, color4, color5

  switch (props.state) {
    case "up":
      color1 = Colors.buttonUpColor1
      color2 = Colors.buttonUpColor2
      color3 = Colors.buttonUpColor3
      color4 = Colors.buttonUpColor4
      color5 = Colors.buttonUpColor5
      break;

    case "down":
      color1 = Colors.buttonDownColor1
      color2 = Colors.buttonDownColor2
      color3 = Colors.buttonDownColor3
      color4 = Colors.buttonDownColor4
      color5 = Colors.buttonDownColor5
      break;
  }

  return (
    <Svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox={"0 0 226 100"}
      {...props}>
      <Path
        d="M126.292 14l-11.966 12.074 16.13 15.985H64v17h66.719l-16.17 16.317 12.074 11.967 36.506-36.838z"
        fill={color4}
        fillRule="evenodd"
      />
    </Svg>
  );
}

export default SvgIconArrowRight;
