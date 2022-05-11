import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgIconRotate(props) {
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
          d="M108.528 99c8.385 0 15.206 6.821 15.206 15.207v8.07h.302a2.02 2.02 0 012.02 2.02v22.122a2.02 2.02 0 01-2.02 2.019H93.019A2.02 2.02 0 0191 146.419v-22.122a2.02 2.02 0 012.019-2.02h.302v-8.07c0-8.386 6.821-15.207 15.207-15.207zm0 8.756a6.46 6.46 0 00-6.451 6.451v8.07h12.901v-8.07a6.458 6.458 0 00-6.45-6.451z"
          fill={color5}
        />
        <Path
          d="M68.903 23l16.193 5.175-6.561 20.532c31.945-12.653 69.759-3.569 92.1 24.76 27.253 34.56 21.309 84.848-13.25 112.1-14.61 11.521-32.035 17.11-49.34 17.11-23.624 0-47.026-10.413-62.758-30.36l13.35-10.528c21.448 27.199 61.025 31.877 88.222 10.428 27.198-21.447 31.877-61.024 10.428-88.224-17.636-22.364-47.528-29.486-72.72-19.389l23.126 7.389-5.174 16.194-49.402-15.786L68.903 23zM51.348 152.547l3.573 4.53-13.348 10.528-3.573-4.53 13.348-10.528z"
          fill={color4}
        />
      </G>
    </Svg>
  );
}

export default SvgIconRotate;
