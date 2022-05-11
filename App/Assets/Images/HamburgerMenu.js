import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgHamburgerMenu(props) {
  return (
    <Svg width={40} height={32} xmlns="http://www.w3.org/2000/svg" {...props}>
      <G fill="none" fillRule="evenodd">
        {/* <Path
          d="M5.915 0l7.661 12.114L21.323 0h5.943L14.42 21.219h-1.633L0 0h5.915zm21.21 5.601V21.22h-5.634v-6.152L27.126 5.6zm-26.985 0l5.634 9.466v6.152H.14V5.6zM51.575 8.196v4.608H37.097v3.338h14.478v5.05l-14.76.027h-5.578V8.196h20.338zm0-8.196v5.022H31.237V0h20.338zM77.743.001v21.19h-5.577V.002h5.577zm-16.056 0l7.634 9.767v8.057l-8.226-10.32v13.687h-5.492V0h6.084zM87.573.083v12.83c.093.424.191.828.296 1.214.102.387.304.746.605 1.077.28.313.516.497.704.552.187.055.395.092.62.11h17.013v5.353H87.769a6.171 6.171 0 01-2.153-.4 6.195 6.195 0 01-1.944-1.146 5.691 5.691 0 01-1.395-1.848c-.357-.736-.535-1.572-.535-2.511V.084h5.83zm19.295-.082v13.078h-5.887V.001h5.887z"
          fill={Colors.white}
        /> */}
        <Path
          d="M147.767 16.17v5.02h-29.176v-5.02h29.176zm0-7.974v5.021h-29.176V8.196h29.176zm0-8.195v5.021h-29.176V.001h29.176z"
          fill={Colors.green}
          transform="translate(-115 0)"
        />
      </G>
    </Svg>
  );
}

export default SvgHamburgerMenu;
