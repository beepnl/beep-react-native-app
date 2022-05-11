import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgIconUpDown(props) {
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
      <G fill="none" fillRule="evenodd">
        <Path
          d="M113.528 88c8.385 0 15.206 6.821 15.206 15.207v8.07h.302a2.02 2.02 0 012.02 2.02v22.122a2.02 2.02 0 01-2.02 2.019H98.019A2.02 2.02 0 0196 135.419v-22.122a2.02 2.02 0 012.019-2.02h.302v-8.07c0-8.386 6.821-15.207 15.207-15.207zm0 8.756a6.46 6.46 0 00-6.451 6.451v8.07h12.901v-8.07a6.458 6.458 0 00-6.45-6.451z"
          fill={color5}
        />
        <Path
          d="M122.337 160.121v16.78l15.986-16.13 12.074 11.966-36.505 36.837-36.838-36.506 11.967-12.075 16.316 16.17v-17.042h17zm0-11.418v5.77h-17v-5.77h17zm-.277-77.601v5.77h-17v-5.77h17zM113.505 16l36.838 36.505-11.966 12.074L122.06 48.41v17.042h-17.001V48.674L89.075 64.803 77 52.837 113.505 16z"
          fill={color4}
        />
      </G>
    </Svg>
  );
}

export default SvgIconUpDown;
