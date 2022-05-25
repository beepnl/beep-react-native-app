import { Platform } from "react-native";

//map correct font full name per platform
const type = {
  regular: Platform.select({
    ios: "Roboto",
    android: "Roboto"
  }),
}

//style per font/size combination
const style = {
  regular: {
    // fontFamily: type.regular,
    fontSize: 18,
  },

  small: {
    // fontFamily: type.regular,
    fontSize: 15,
  },

  big: {
    // fontFamily: type.regular,
    fontSize: 22,
  },

  bold: {
    fontWeight: "bold",
    fontSize: 16,
  },

  underline: {
    // fontFamily: type.regular,
    textDecorationLine: "underline",
    fontSize: 16,
  },

  heading: {
    fontWeight: "bold",
    fontSize: 18,
  },

  headingSmall: {
    // fontFamily: type.heading,
    fontSize: 24,
  },


  button: {
    // fontFamily: type.heading,
    fontSize: 24,
  }
}

export default {
  type,
  style
}
