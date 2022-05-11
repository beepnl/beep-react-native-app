import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgIconRoboUp(props) {
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
          d="M161.965 62.796l-21.893-26.904A13.237 13.237 0 00129.777 31a13.21 13.21 0 00-8.364 2.976c-5.681 4.623-6.54 12.977-1.916 18.659l18.982 23.326 2.145-2.749c5.164-6.616 12.943-10.412 21.34-10.416m-46.273 63.4l.442.003c14.392.234 26.015 11.858 26.246 26.25l.003.438v43.605H89v-43.605c0-14.741 11.95-26.691 26.691-26.691zm0 14.945a8.99 8.99 0 00-8.988 8.99 8.99 8.99 0 108.989-8.99zm46.288-70.345c4.55 0 9.137 1.62 12.835 4.975 7.452 6.758 8.08 18.29 1.89 26.22l-29.106 37.284c-5.303-12.382-17.606-21.08-31.907-21.08h-.032l31.271-40.06c3.762-4.82 9.376-7.339 15.05-7.339z"
          fill={color5}
        />
        <Path
          d="M137.726 112.706l10.838-16.81c-19.236-12.402-41.095-18.932-63.429-19.21l14.812-16.183L85.193 47 46 89.822l42.822 39.193 13.504-14.754-19.204-17.575c19.218-.092 38.073 5.36 54.604 16.02"
          fill={color4}
        />
      </G>
    </Svg>
  );
}

export default SvgIconRoboUp;
