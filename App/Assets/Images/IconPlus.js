import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgIconPlus(props) {
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
      viewBox={"0 0 226 226"}
      {...props}>
      <Path
        d="M100.294 56v44.294H56v24.915h44.294v44.295h24.916v-44.295h44.293v-24.915H125.21V56z"
        fill={color4}
        fillRule="evenodd"
      />
    </Svg>
  );
}

export default SvgIconPlus;
