import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Block, Button, Text, theme } from 'galio-framework';

import materialTheme from '../../constants/Theme';

const { height, width } = Dimensions.get('screen');

interface IProps {
  navigation?: any;
}

export default class ScanComplete extends React.PureComponent<IProps> {
  render() {
    const { navigation } = this.props;

    return (
      <Block flex style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Block flex center>
          <ImageBackground
            source={require('../../../assets/images/317342.png')}
            style={{
              height,
              width,
              marginTop: '-70%',
              zIndex: 1,
            }}
          />
        </Block>
        <Block flex space="between" style={styles.padded}>
          <Block flex space="around" style={{ zIndex: 2 }}>
            <Block>
              <Block>
                <Text color="white" size={60}>
                  Scan Complete
                </Text>
              </Block>
              <Text size={16} color="rgba(255,255,255,0.6)">
                Fully coded React Native components.
              </Text>
            </Block>
            <Block center>
              <Button
                shadowless
                style={styles.button}
                color={materialTheme.COLORS.BUTTON_COLOR}
                onPress={() => navigation.replace('About')}
              >
                HOME
              </Button>
              <Button
                shadowless
                style={styles.button}
                color={materialTheme.COLORS.BUTTON_COLOR}
                onPress={() => navigation.replace('Scan')}
              >
                RESCAN
              </Button>
            </Block>
          </Block>
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
  },
  padded: {
    paddingHorizontal: theme.SIZES!.BASE! * 2,
    position: 'relative',
    bottom: theme.SIZES!.BASE,
  },
  button: {
    width: width - theme.SIZES!.BASE! * 4,
    height: theme.SIZES!.BASE! * 3,
    shadowRadius: 0,
    shadowOpacity: 0,
  },
});
