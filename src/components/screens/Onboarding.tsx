import React from 'react';
import { StyleSheet, StatusBar, Dimensions } from 'react-native';
import { Block, Button, Text, theme } from 'galio-framework';
import { Audio, Video } from 'expo-av';
import * as Haptics from 'expo-haptics';
import materialTheme from '../../constants/Theme';

const { width } = Dimensions.get('screen');
let playbackObject: Video;

interface IProps {
  navigation?: any;
}

export default class Onboarding extends React.PureComponent<IProps> {
  private _unsubscribeFocus: any;

  private _unsubscribeBlur: any;

  componentDidMount() {
    console.log('didMount');
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      console.log('focus');
      if (playbackObject) playbackObject.playAsync();
    });
    this._unsubscribeBlur = this.props.navigation.addListener('blur', () => {
      console.log('blur');
      if (playbackObject) playbackObject.stopAsync();
    });
  }

  componentWillUnmount() {
    console.log('willUnMount');
    this._unsubscribeFocus();
    this._unsubscribeBlur();
  }

  _handleVideoRef = (component: Video) => {
    playbackObject = component;
  };

  playSound = async () => {
    const sound = await Audio.Sound.createAsync(
      require('../../../assets/audio/bell.mp3'),
    );
    // make haptic and sound more in sync
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await sound.sound.playAsync();
  };

  render() {
    const { navigation } = this.props;

    return (
      <Block flex style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Block flex>
          <Video
            ref={this._handleVideoRef}
            source={require('../../../assets/videos/video.mp4')}
            isLooping
            useNativeControls={false}
            posterSource={require('../../../assets/images/317342.png')}
            usePoster
            posterStyle={{
              width,
              justifyContent: 'center',
              height: '100%',
              resizeMode: 'cover',
            }}
            resizeMode="cover"
            style={{ width, flex: 1 }}
          />
          <Block flex space="around" style={styles.padded}>
            <Block>
              <Block>
                <Text color="white" size={60}>
                  Material
                </Text>
              </Block>
              <Block row>
                <Text color="white" size={60}>
                  Kit
                </Text>
              </Block>
              <Text size={16} color="rgba(255,255,255,0.6)">
                Fully coded React Native components.
              </Text>
            </Block>
          </Block>
        </Block>
        <Block center style={styles.bottomContainer}>
          <Button
            shadowless
            style={styles.button}
            color={materialTheme.COLORS.BUTTON_COLOR}
            onPress={() => this.playSound()}
          >
            Confirm Test
          </Button>
          <Button
            shadowless
            style={styles.button}
            color={materialTheme.COLORS.BUTTON_COLOR}
            onPress={() => navigation.navigate('About')}
          >
            GET STARTED
          </Button>
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
    position: 'absolute',
    bottom: theme.SIZES!.BASE,
  },
  bottomContainer: {
    paddingVertical: 40,
    position: 'relative',
  },
  button: {
    width: width - theme.SIZES!.BASE! * 4,
    height: theme.SIZES!.BASE! * 3,
    shadowRadius: 0,
    shadowOpacity: 0,
  },
});
