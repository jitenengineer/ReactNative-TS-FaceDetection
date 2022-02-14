import { Dimensions, Platform, StatusBar } from 'react-native';
import { theme } from 'galio-framework';

export const BASE_URL = "http://6407-122-170-105-142.ngrok.io"

export const StatusHeight = StatusBar.currentHeight;
export const HeaderHeight = theme.SIZES!.BASE! * 3.5 + (StatusHeight || 0);

export const { height, width } = Dimensions.get('window');
export const iPhoneX = () =>
  Platform.OS === 'ios' && (height === 812 || width === 812);

let checkInsideScan = false

export const insideScan = (val: boolean) => {
  checkInsideScan = val
}

export const isInsideScan = () => {
  return checkInsideScan
}

export default {
  BASE_URL,
  StatusHeight,
  HeaderHeight,
  iPhoneX,
  insideScan,
  isInsideScan
};
