import Fonts from './Fonts'
import Metrics from './Metrics'
import Colors from './Colors'

// MultiSlider
export const trackStyle = { height: 4, backgroundColor: Colors.lightGrey }
export const markerStyle = { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.yellow }
export const pressedMarkerStyle = { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.yellow }
export const selectedStyle = { backgroundColor: Colors.yellow }

export const shadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.30,
  shadowRadius: 4.65,
  elevation: 8,
}

const ApplicationStyles = {
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: Metrics.baseMargin,
    paddingVertical: Metrics.baseMargin,
    backgroundColor: Colors.transparent
  },

  modalContainer: {
    ...shadow,
    justifyContent: "center",
    padding: Metrics.doubleBaseMargin,
    borderRadius: Metrics.buttonRadius,
    backgroundColor: Colors.background,
  },

  collapsibleButton: {
    flex: 1,
    flexDirection: "row",
    alignSelf: "flex-end",
    justifyContent: "flex-end", 
    alignItems: "center",
    paddingHorizontal: Metrics.baseMargin,
    backgroundColor: Colors.background,
  },

  input: {
    ...Fonts.style.regular,
    height: Metrics.inputHeight,
    paddingHorizontal: Metrics.baseMargin,
    borderWidth: 1,
    borderColor: Colors.grey,
    borderRadius: Metrics.buttonRadius,
    color: Colors.text,
  },

  inputValidationError: {
    marginTop: 2,
    color: Colors.error,
  },

  paddingHorizontal: {
    paddingHorizontal: Metrics.baseMargin
  },

  paddingVertical: {
    paddingVertical: Metrics.baseMargin
  },

  paddingBottom: {
    paddingBottom: Metrics.baseMargin
  },

  paddingTop: {
    paddingTop: Metrics.baseMargin
  },

  padding: {
    paddingHorizontal: Metrics.baseMargin,
    paddingVertical: Metrics.baseMargin
  },

  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  //row left aligned padded
  itemsContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    justifyContent: 'space-between',
  },

  // multiple buttons stretched out evenly spaced
  buttonsContainer: {
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: 'space-between',
  },
  
  //single button centered
  buttonContainer: {
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: 'center',
  },

  button: {
    height: Metrics.buttonHeight,
    paddingHorizontal: Metrics.doubleBaseMargin,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Metrics.buttonRadius,
    backgroundColor: Colors.yellow,
  },

  navigationButton: {
    flexDirection: "row",
    width: "100%",
    // height: Metrics.buttonHeight,
    alignItems: "center",
    justifyContent: "space-between",
    padding: Metrics.baseMargin,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },

  spacer: {
    width: Metrics.doubleBaseMargin,
    height: Metrics.doubleBaseMargin
  },

  spacerHalf: {
    width: Metrics.baseMargin,
    height: Metrics.baseMargin
  },

  spacerDouble: {
    width: Metrics.doubleBaseMargin * 2,
    height: Metrics.doubleBaseMargin * 2
  },

  separator: {
    width: "100%",
    borderBottomColor: Colors.lightGrey, 
    borderBottomWidth: 1,
  },

  listSeparator: {
    height: 1,
    margin: Metrics.baseMargin,
    backgroundColor: Colors.black,
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  heading: {
    ...Fonts.style.heading,
    color: Colors.text,
  },

  text: {
    ...Fonts.style.regular,
    color: Colors.text,
  },

  textBig: {
    ...Fonts.style.big,
    color: Colors.text,
  },

  instructions: {
    ...Fonts.style.small,
    fontStyle: "italic",
    color: Colors.darkGrey,
  },

  label: {
    ...Fonts.style.regular,
    color: Colors.darkGrey,
  },

  link: {
    ...Fonts.style.regular,
    textDecorationLine: 'underline',
    color: Colors.link,
  },

  centeredText: {
    ...Fonts.style.regular,
    color: Colors.text,
    paddingHorizontal: Metrics.baseMargin,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    textAlign: "center",
  },

  error: {
    color: Colors.error,
  },

}

export default ApplicationStyles
