import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgBluetoothLogo(props) {
  const background = props.backgroundColor || Colors.green
  return (
    <Svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={34}
      height={52}
      {...props}
    >
      <G fill="none" fillRule="evenodd" scale="0.5">
        <Path
          d="M43.887 33.625c0 18.57-4.794 33.625-21.937 33.625S.014 52.196.014 33.625C.014 15.055 4.807 0 21.95 0s21.937 15.054 21.937 33.625"
          fill={background}
        />
        <Path
          d="M20.31 6.65l14.596 16.54-9.995 9.6 9.954 9.816L20.31 59.873V37.209l-7.857 7.548-2.58-2.58 9.807-9.42-9.826-9.691 2.616-2.546 7.84 7.732V6.65zm3.687 30.363v12.813l5.898-6.997-5.898-5.816zm0-20.662V28.61l5.855-5.625-5.855-6.634z"
          fill={Colors.white}
        />
      </G>
    </Svg>
  );
}

export default SvgBluetoothLogo;
