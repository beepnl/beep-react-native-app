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
      viewBox={"0 0 90 230"}
      {...props}>
      <Defs>
        <LinearGradient x1="100%" y1="50%" x2="0%" y2="50%" id="a">
          <Stop stopColor={color3} offset="0%" />
          <Stop stopColor={color2} offset="100%" />
        </LinearGradient>
        <LinearGradient x1="0%" y1="50%" x2="100%" y2="50%" id="b">
          <Stop stopColor={color3} offset="0%" />
          <Stop stopColor={color2} offset="69.171%" />
          <Stop stopColor={color2} offset="100%" />
          <Stop stopColor={color1} offset="100%" />
        </LinearGradient>
      </Defs>
      <G fill="none" fillRule="evenodd">
        <Path
          d="M-38.907 157.141c56.964 3.887 110.638 3.753 167.593-.052 16.308-1.088 29.242-12.594 30.54-27.028.94-10.455 1.052-19.491.183-29.984-1.2-14.497-14.134-26.1-30.502-27.218-56.964-3.887-110.638-3.753-167.592.051-16.309 1.09-29.242 12.594-30.54 27.03-.94 10.455-1.053 19.491-.184 29.983 1.2 14.497 14.135 26.101 30.502 27.218"
          fill="url(#a)"
          transform="rotate(90 45 115)"
        />
        <Path
          d="M-39.327 80.436c-11.3.81-20.373 8.6-21.655 18.574-1.47 11.43-1.641 20.47-.194 31.96 1.256 9.966 10.276 17.793 21.562 18.624 57.612 4.249 111.342 4.101 168.94-.03 11.3-.81 20.373-8.6 21.656-18.573 1.471-11.431 1.64-20.47.193-31.961-1.255-9.966-10.274-17.792-21.56-18.624-28.498-2.102-56.05-3.127-83.584-3.128-28.133 0-56.25 1.07-85.358 3.158"
          fill="url(#b)"
          transform="rotate(90 45 115)"
        />
      </G>
    </Svg>
  );
}

export default SvgSmallButton;
