import React from 'react';
import { StyleSheet, StatusBar, Image } from 'react-native';
import { Block, Button, Input, Text, theme } from 'galio-framework';

import AppIntroSlider from 'react-native-app-intro-slider';
import { Camera } from 'expo-camera';
import { Formik } from 'formik';
import * as Yup from 'yup';
import IconExtra from '../atoms/Icon';
import { materialTheme } from '../../constants';
import { width } from '../../constants/utils';

interface IProps {
  navigation: any;
}

interface IState {
  errors?: any;
}

type SlideProps = {
  key: number;
  title: string;
  text: string;
  image: any;
  backgroundColor: string;
};

const slides = [
  {
    key: 1,
    title: 'Title 1',
    text: 'Description.\nSay something cool',
    image: require('../../../assets/images/icon.png'),
    backgroundColor: '#59b2ab',
  },
  {
    key: 2,
    title: 'Title 2',
    text: 'Other cool stuff',
    image: require('../../../assets/images/icon.png'),
    backgroundColor: '#febe29',
  },
  {
    key: 3,
    title: 'Enter your email',
    text: 'Please provide your email id before proceeding for the scan',
    image: require('../../../assets/images/icon.png'),
    backgroundColor: '#22bcb5',
  },
];

export default class Onboarding extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      errors: {},
    };
  }

  _renderItem = ({ item }: { item: SlideProps }) => {
    const { navigation } = this.props;
    if (item.key === 3) {
      return (
        <Block
          flex
          style={[styles.slide, { backgroundColor: item.backgroundColor }]}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Block height={30} />
          <Formik
            validationSchema={Yup.object().shape({
              email: Yup.string()
                .email('*Invalid Email!')
                .required('*This field is required!'),
            })}
            initialValues={{ email: '' }}
            onSubmit={(values) => {
              console.log('Formik submit', values);
              // TODO: SUBMIT TO BACKEND
              navigation.navigate('Scan');
            }}
          >
            {({ errors, handleChange, handleBlur, handleSubmit, values }) => {
              return (
                <Block center>
                  <Block
                    width={width - 100}
                    style={{ paddingHorizontal: theme.SIZES!.BASE }}
                  >
                    <Input
                      right
                      placeholder="Email"
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      value={values.email}
                      type="email-address"
                      color={materialTheme.COLORS.INPUT}
                      placeholderTextColor={materialTheme.COLORS.DEFAULT}
                      style={{
                        borderRadius: 3,
                        borderColor: materialTheme.COLORS.BORDER_COLOR,
                      }}
                    />
                  </Block>
                  <Text color="red">{errors.email}</Text>
                  <Block height={10} />
                  <Button onPress={handleSubmit}>Submit</Button>
                </Block>
              );
            }}
          </Formik>
          <Block height={30} />
          <Text style={styles.text}>{item.text}</Text>
        </Block>
      );
    }
    return (
      <Block
        flex
        style={[styles.slide, { backgroundColor: item.backgroundColor }]}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Image source={item.image} style={styles.image} />
        <Text style={styles.text}>{item.text}</Text>
      </Block>
    );
  };

  _renderPrevButton = () => {
    return (
      <Block style={styles.buttonCircle}>
        <IconExtra
          name="md-arrow-back-circle"
          color="rgba(255, 255, 255, .9)"
          family="ionicon"
          size={40}
        />
      </Block>
    );
  };

  _renderNextButton = () => {
    return (
      <Block style={styles.buttonCircle}>
        <IconExtra
          name="md-arrow-forward-circle"
          color="rgba(255, 255, 255, .9)"
          family="ionicon"
          size={40}
        />
      </Block>
    );
  };

  // TODO: THIS NEEDS TO BE REMOVED, NAVIGAE TO NEXT ON FORM
  _renderDoneButton = () => {
    return (
      <Block style={styles.buttonCircle}>
        <IconExtra
          name="md-checkmark-circle"
          color="rgba(255, 255, 255, .9)"
          family="ionicon"
          size={40}
        />
      </Block>
    );
  };

  _onDoneButton = () => {
    this.requestPermissions();
  };

  requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    console.log('status', status);
    // TODO: Check below doesnt force skit the instructions
    if (status === 'granted') this.props.navigation.navigate('Scan');
  };

  render() {
    return (
      <Block flex style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Block flex>
          <AppIntroSlider
            data={slides}
            keyExtractor={(item: SlideProps) => item.key.toString()}
            renderItem={this._renderItem}
            onDone={this._onDoneButton}
            showPrevButton
            renderPrevButton={this._renderPrevButton}
            renderDoneButton={this._renderDoneButton}
            renderNextButton={this._renderNextButton}
          />
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
  },
  image: {
    width: 320,
    height: 320,
    marginVertical: 40,
  },
  text: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  title: {
    fontSize: 25,
    color: 'white',
    textAlign: 'center',
  },
  buttonCircle: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
