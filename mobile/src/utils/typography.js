import { Platform, Text, TextInput } from 'react-native';

export const APP_FONT_FAMILY = Platform.select({
  android: 'sans-serif',
  default: undefined,
});

const baseTextStyle = APP_FONT_FAMILY ? { fontFamily: APP_FONT_FAMILY } : null;

const mergeDefaultStyle = (existingStyle) => {
  if (!baseTextStyle) return existingStyle;
  return existingStyle ? [baseTextStyle, existingStyle] : baseTextStyle;
};

export const applyGlobalTypography = () => {
  if (globalThis.__ANIMAL_E_BAZAR_TYPOGRAPHY_APPLIED__) return;
  globalThis.__ANIMAL_E_BAZAR_TYPOGRAPHY_APPLIED__ = true;

  if (!baseTextStyle) return;

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = mergeDefaultStyle(Text.defaultProps.style);

  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = mergeDefaultStyle(TextInput.defaultProps.style);
};
