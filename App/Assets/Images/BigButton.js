import * as React from "react";
import Svg, { Defs, LinearGradient, Stop, G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgBigButton(props) {
  let color1, color2, color3

  switch (props.state) {
    case "up":
      color1 = Colors.buttonUpColor1
      color2 = Colors.buttonUpColor2
      color3 = Colors.buttonUpColor3
      break;

    case "down":
      color1 = Colors.buttonDownColor1
      color2 = Colors.buttonDownColor2
      color3 = Colors.buttonDownColor3
      break;
  }

  return (
    <Svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox={"0 0 230 230"}
      preserveAspectRatio={"none"}    //stretch
      {...props}>
      <Defs>
        <LinearGradient
          x1="50%"
          y1="94.233%"
          x2="50%"
          y2="4.007%"
          id="prefix__a"
        >
          <Stop stopColor={color3} offset="0%" />
          <Stop stopColor={color2} offset="100%" />
        </LinearGradient>
        <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="prefix__b">
          <Stop stopColor={color3} offset="0%" />
          <Stop stopColor={color2} offset="29.873%" />
          <Stop stopColor={color2} offset="69.171%" />
          <Stop stopColor={color1} offset="100%" />
        </LinearGradient>
      </Defs>
      <G fill="none" fillRule="evenodd">
        <Path
          d="M226.81 33.19C225.606 17.14 212.83 4.338 196.781 3.114c-55.58-4.24-108.01-4.087-163.591.077C17.139 4.393 4.338 17.169 3.114 33.217c-4.24 55.581-4.087 108.01.076 163.592 1.203 16.052 13.978 28.852 30.029 30.077 55.58 4.24 108.01 4.087 163.591-.076 16.05-1.203 28.851-13.978 30.076-30.028 4.24-55.58 4.088-108.01-.077-163.592z"
          fill="url(#prefix__a)"
        />
        <Path
          d="M35.247 11.346c-12.803 1-22.953 11.217-23.974 24.019-4.326 54.248-4.165 105.135.074 159.387 1 12.804 11.217 22.953 24.018 23.974 54.248 4.327 105.135 4.166 159.388-.074 12.803-1 22.953-11.216 23.974-24.017 4.326-54.247 4.166-105.136-.073-159.388-1.002-12.802-11.217-22.953-24.02-23.974-26.752-2.134-52.694-3.175-78.62-3.175-26.644 0-53.27 1.1-80.767 3.248"
          fill="url(#prefix__b)"
        />
      </G>
    </Svg>
  );
}

export default SvgBigButton;
