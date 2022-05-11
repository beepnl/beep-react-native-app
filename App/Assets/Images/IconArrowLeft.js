import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgIconArrowLeft(props) {
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
        d="M100.837 87.343l11.966-12.074-16.13-15.985h66.456v-17H96.41l16.17-16.317L100.506 14 64 50.838z"
        fill={color4}
        fillRule="evenodd"
      />
    </Svg>
  );
}

export default SvgIconArrowLeft;
