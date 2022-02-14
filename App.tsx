import React from 'react';
import { Platform, StatusBar, Image, StyleSheet } from 'react-native';
import AppLoading from 'expo-app-loading';
import { Asset } from 'expo-asset';
import { Block, GalioProvider, Text } from 'galio-framework';

import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { Images, products, materialTheme } from './src/constants';

import Screens from './src/navigation/Screens';
import { ProductProps } from './src/constants/types';

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo'
import { isInsideScan } from './src/constants/utils';

// Before rendering any navigation stack

enableScreens();

// cache app images
const assetImages = [
  Images.Pro,
  Images.Profile,
  Images.Avatar,
  Images.Onboarding,
];

// cache product images
products.map((product: ProductProps) => assetImages.push(product.image));

function cacheImages(images: any[]): any {
  return images.map((image) => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    }
    return Asset.fromModule(image).downloadAsync();
  });
}

interface IProps {
  skipLoadingScreen?: boolean;
  focused?: boolean;
  navigation?: any;
}

interface IState {
  isLoadingComplete?: boolean;
  isConnected?: boolean;
}

let unsubConnectivityChange: NetInfoSubscription;

// ref
let bottomSheetRef = React.createRef<BottomSheetModal>();

// variables
const snapPoints = ['50%'];

// callbacks
const handleSheetChanges = ((index: number) => {
  console.log('handleSheetChanges', index);
});

// Change to use proper state, this is where the scanID is
export default class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      isLoadingComplete: false,
      isConnected: true,
    };
  }

  componentDidMount() {
    unsubConnectivityChange = NetInfo.addEventListener(this.handleConnectivityChange)
  }

  handleConnectivityChange = ((state: NetInfoState) => {
    console.log("isConnected", state)
    console.log("nav props", isInsideScan())
    if (isInsideScan())
     return
    if (state.isConnected) {
      bottomSheetRef.current?.close()
    } else {
      bottomSheetRef.current?.present()
    }
  })

  componentWillUnmount() {
    unsubConnectivityChange()
  }

  loadResourcesAsync = async () => {
    return Promise.all([
      // TODO: change to init
      fetch('/init')
        .then((response) => response.json())
        .then((data) => console.log(data))
        .then(...cacheImages(assetImages))
        .catch((error) => console.log('error', error)),
    ]);
  };

  handleLoadingError = (error: Error) => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };

  render() {
    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          // @ts-ignore
          startAsync={this.loadResourcesAsync}
          onError={this.handleLoadingError}
          onFinish={this.handleFinishLoading}
        />
      );
    }
    return (
      <NavigationContainer>
        <BottomSheetModalProvider>
          <GalioProvider theme={materialTheme}>
            <Block flex>
              {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
              <Screens />
              <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={(backdropProps) => {
                  return (
                    <BottomSheetBackdrop {...backdropProps} />
                  )
                }}
                onChange={handleSheetChanges}
              >
                <Block style={styles.contentContainer}>
                  <Text h4 style={{ textAlign: "center", marginTop: "30%" }}>Sorry! you don't have an internet connection. please try again later.</Text>
                </Block>
              </BottomSheetModal>
            </Block>
          </GalioProvider>
        </BottomSheetModalProvider>
      </NavigationContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
})