import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgIconRoboDown(props) {
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
          d="M115.965 62.796L94.07 35.892A13.237 13.237 0 0083.778 31a13.21 13.21 0 00-8.364 2.976c-5.682 4.623-6.54 12.977-1.917 18.659l18.982 23.326 2.146-2.749c5.164-6.616 12.943-10.412 21.34-10.416m-46.273 63.4l.441.003c14.392.234 26.015 11.858 26.246 26.25l.004.438v43.605H43v-43.605c0-14.741 11.95-26.691 26.691-26.691zm0 14.945a8.99 8.99 0 00-8.989 8.99 8.99 8.99 0 108.989-8.99zm46.288-70.345c4.55 0 9.137 1.62 12.835 4.975 7.451 6.758 8.08 18.29 1.89 26.22l-29.106 37.284c-5.303-12.382-17.606-21.08-31.907-21.08h-.032l31.271-40.06c3.762-4.82 9.376-7.339 15.05-7.339z"
          fill={color5}
        />
        <Path
          d="M166.06 128l-8.753 20.116c-9.345-20.287-24.206-37.595-43.365-50.117L103 114.74c16.465 10.762 29.12 25.763 36.858 43.355L115.99 147.71l-7.981 18.34 53.23 23.16 23.162-53.23L166.06 128z"
          fill={color4}
        />
      </G>
    </Svg>
  );
}

export default SvgIconRoboDown;
