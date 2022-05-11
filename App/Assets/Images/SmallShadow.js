import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
import { Colors } from "../../Theme";

function SvgSmallShadow(props) {
  return (
    <Svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox={"0 0 240 110"}
    {...props}>
      <G fill={Colors.shadow} fillRule="evenodd" fillOpacity={0.1}>
        <Path d="M23.97 105.797c65.442 5.712 126.382 5.509 191.811-.043 11.85-1.007 21.342-10.646 22.569-22.912 2.043-20.418 2.282-35.213.191-55.769-1.244-12.227-10.697-21.838-22.51-22.87-65.443-5.712-126.382-5.51-191.812.044C12.369 5.253 2.877 14.893 1.65 27.16-.393 47.577-.632 62.37 1.46 82.927c1.244 12.227 10.697 21.84 22.512 22.87" />
        <Path d="M24.332 5.014C12.848 5.988 3.646 15.278 2.434 27.109.34 47.369.092 61.93 2.246 82.33c1.23 11.79 10.394 21.047 21.837 22.045 65.382 5.699 126.216 5.496 191.585-.042 11.484-.972 20.687-10.262 21.898-22.094 2.097-20.26 2.343-34.822.19-55.222-1.23-11.79-10.394-21.048-21.838-22.046C150.536-.727 89.702-.523 24.332 5.014" />
        <Path d="M24.444 5.78C13.33 6.721 4.414 15.661 3.218 27.06 1.07 47.159.816 61.492 3.031 81.734c1.218 11.353 10.091 20.258 21.164 21.221 65.321 5.685 126.052 5.483 191.36-.039 11.117-.94 20.031-9.88 21.227-21.277 2.149-20.101 2.402-34.433.187-54.676-1.218-11.352-10.091-20.257-21.163-21.222C150.484.056 89.754.26 24.444 5.781" />
        <Path d="M24.556 6.548c-10.748.908-19.374 9.498-20.554 20.46-2.2 19.944-2.462 34.045-.184 54.13 1.203 10.915 9.786 19.467 20.489 20.398 65.262 5.67 125.888 5.468 191.136-.039 10.75-.908 19.375-9.498 20.555-20.46 2.202-19.942 2.462-34.043.184-54.13-1.202-10.914-9.786-19.466-20.488-20.397C150.432.84 89.807 1.042 24.556 6.548" />
        <Path d="M24.668 7.315C14.288 8.19 5.95 16.43 4.787 26.958c-2.255 19.784-2.523 33.656-.182 53.583 1.19 10.477 9.483 18.677 19.814 19.574 65.202 5.657 125.724 5.455 190.913-.035 10.38-.877 18.718-9.116 19.882-19.644 2.254-19.785 2.522-33.655.182-53.584-1.19-10.477-9.483-18.676-19.814-19.573C150.38 1.62 89.858 1.824 24.668 7.315" />
        <Path d="M24.78 8.082c-10.012.843-18.062 8.733-19.209 18.825-2.307 19.627-2.54 33.263-.18 53.038 1.197 10.037 9.18 17.886 19.14 18.75 65.143 5.643 125.56 5.442 190.688-.034 10.013-.843 18.063-8.733 19.21-18.826 2.309-19.626 2.54-33.262.18-53.038-1.198-10.037-9.178-17.885-19.14-18.75-65.14-5.643-125.559-5.44-190.688.035" />
        <Path d="M24.894 8.848c-9.647.812-17.407 8.35-18.539 18.01-2.36 19.467-2.597 32.872-.177 52.49 1.183 9.6 8.874 17.095 18.465 17.926 65.082 5.63 125.396 5.428 190.465-.032 9.645-.81 17.406-8.35 18.537-18.01 2.36-19.467 2.597-32.872.178-52.49-1.183-9.6-8.875-17.094-18.465-17.925-65.082-5.63-125.396-5.428-190.464.031" />
        <Path d="M25.006 9.615c-9.278.779-16.752 7.968-17.868 17.192-2.412 19.31-2.657 32.483-.175 51.946 1.17 9.161 8.573 16.304 17.792 17.101 65.022 5.616 125.231 5.413 190.239-.03 9.28-.779 16.752-7.967 17.867-17.192 2.414-19.31 2.658-32.483.176-51.945-1.17-9.162-8.57-16.304-17.793-17.101-65.02-5.617-125.23-5.414-190.238.03" />
        <Path d="M25.118 10.382c-8.911.746-16.096 7.585-17.195 16.375-2.466 19.151-2.762 32.1-.173 51.4 1.135 8.726 8.268 15.512 17.118 16.278 64.96 5.6 125.065 5.4 190.014-.03 8.911-.746 16.095-7.584 17.196-16.374 2.465-19.152 2.762-32.1.172-51.4-1.134-8.726-8.268-15.514-17.117-16.277-64.961-5.602-125.067-5.4-190.015.028" />
        <Path d="M25.23 11.149c-8.544.713-15.44 7.202-16.523 15.558-2.518 18.993-2.822 31.71-.17 50.853 1.12 8.288 7.963 14.722 16.443 15.454 64.9 5.587 124.901 5.386 189.79-.027 8.544-.714 15.44-7.203 16.523-15.557 2.52-18.995 2.822-31.712.17-50.853-1.12-8.29-7.963-14.723-16.443-15.454-64.9-5.589-124.901-5.386-189.79.026" />
        <Path d="M25.342 11.916c-8.175.682-14.784 6.82-15.851 14.74-2.572 18.835-2.882 31.322-.168 50.307 1.107 7.852 7.66 13.932 15.769 14.63 64.841 5.573 124.737 5.372 189.566-.025 8.175-.681 14.784-6.82 15.852-14.74 2.571-18.835 2.88-31.322.167-50.307-1.107-7.851-7.659-13.932-15.77-14.629-64.84-5.575-124.736-5.373-189.565.024" />
        <Path d="M25.204 90.173c64.781 5.56 124.573 5.358 189.342-.022 7.808-.65 14.127-6.438 15.18-13.924 2.624-18.677 2.94-30.933.165-49.76-1.093-7.414-7.357-13.142-15.095-13.806-64.78-5.561-124.573-5.36-189.342.022-7.808.648-14.128 6.436-15.179 13.923-2.625 18.676-2.943 30.933-.165 49.76 1.093 7.415 7.356 13.143 15.094 13.807" />
      </G>
    </Svg>
  );
}

export default SvgSmallShadow;
