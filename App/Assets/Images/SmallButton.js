import * as React from "react";
import Svg, { Defs, LinearGradient, Stop, G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgSmallButton(props) {
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
      viewBox={"0 0 230 90"}
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
          <Stop stopColor={color2} offset="69.171%" />
          <Stop stopColor={color2} offset="100%" />
          <Stop stopColor={color1} offset="100%" />
        </LinearGradient>
      </Defs>
      <G fill="none" fillRule="evenodd">
        <Path
          d="M31.093 87.141c56.964 3.887 110.638 3.753 167.593-.052 16.308-1.088 29.242-12.594 30.54-27.028.94-10.455 1.052-19.491.183-29.984-1.2-14.497-14.134-26.1-30.502-27.218C141.943-1.028 88.269-.894 31.315 2.91 15.006 4 2.073 15.504.775 29.94-.166 40.395-.279 49.431.59 59.923c1.2 14.497 14.135 26.101 30.502 27.218"
          fill="url(#prefix__a)"
        />
        <Path
          d="M30.673 10.436c-11.3.81-20.373 8.6-21.655 18.574-1.47 11.43-1.641 20.47-.194 31.96C10.08 70.937 19.1 78.764 30.386 79.595c57.612 4.249 111.342 4.101 168.94-.03 11.3-.81 20.373-8.6 21.656-18.573 1.471-11.431 1.64-20.47.193-31.961-1.255-9.966-10.274-17.792-21.56-18.624-28.498-2.102-56.05-3.127-83.584-3.128-28.133 0-56.25 1.07-85.358 3.158"
          fill="url(#prefix__b)"
        />
      </G>
    </Svg>
  );
}

export default SvgSmallButton;
