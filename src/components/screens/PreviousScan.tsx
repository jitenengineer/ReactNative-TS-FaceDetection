import React from 'react';
import {
  StyleSheet,
  Dimensions,
  Switch,
  TouchableOpacity,
  Image,
  View,
  ImageBackground,
  FlatList,
  Platform,
} from 'react-native';
import { Block, Text, theme } from 'galio-framework';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '..';
import { materialTheme } from '../../constants';
import { HeaderHeight } from '../../constants/utils';
import Images from '../../constants/Images';
import { ItemProps } from '../../constants/types';
import { VirtualList } from '../VirtualList';

const { width, height } = Dimensions.get('screen');
const thumbMeasure = (width - 48 - 32) / 3;

interface IProps {
  navigation?: any;
}

export default class PreviousScan extends React.Component<IProps> {
  renderItem = ({ item }: { item: ItemProps }) => {
    // TODO: define render logic here
    console.log('item', item);
    return null;
  };

  render() {
    const { navigation } = this.props;

    const recommended = [
      { title: 'Use FaceID to sign in', id: 'face', type: 'switch' },
      { title: 'Auto-Lock security', id: 'autolock', type: 'switch' },
      { title: 'Notifications', id: 'Notifications', type: 'button' },
    ];

    const payment = [
      { title: 'Manage Payment Options', id: 'Payment', type: 'button' },
      { title: 'Manage Gift Cards', id: 'gift', type: 'button' },
    ];

    const privacy = [
      { title: 'User Agreement', id: 'Agreement', type: 'button' },
      { title: 'Privacy', id: 'Privacy', type: 'button' },
      { title: 'About', id: 'About', type: 'button' },
    ];

    return (
      <Block flex style={styles.profile}>
        <Block>
          <ImageBackground
            source={require('../../../assets/images/317424.png')}
            style={styles.profileContainer}
            imageStyle={styles.profileImage}
          >
            <Block flex style={styles.profileDetails}>
              <Block style={styles.profileTexts}>
                <Text color="white" size={28} style={{ paddingBottom: 8 }}>
                  Scan: #1D7HD4
                </Text>
                <Block row space="between">
                  <Block row>
                    <Text color="white" size={16} muted style={styles.seller}>
                      Stat
                    </Text>
                    <Text size={16} color={materialTheme.COLORS.WARNING}>
                      Stat
                    </Text>
                  </Block>
                  <Block>
                    <Text color={theme.COLORS?.MUTED} size={16}>
                      Stat
                    </Text>
                  </Block>
                </Block>
              </Block>
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
                style={styles.gradient}
              />
            </Block>
          </ImageBackground>
        </Block>
        <Block flex style={styles.options}>
          <VirtualList showsVerticalScrollIndicator={false}>
            <Block row middle space="between" style={styles.rows}>
              <Text size={14}>&quot;Title&quot;</Text>
              <Switch
                ios_backgroundColor={materialTheme.COLORS.SWITCH_OFF}
                thumbColor={
                  Platform.OS === 'android'
                    ? materialTheme.COLORS.SWITCH_OFF
                    : undefined
                }
                trackColor={{
                  false: materialTheme.COLORS.SWITCH_OFF,
                  true: materialTheme.COLORS.SWITCH_ON,
                }}
                value={false}
              />
            </Block>
            <View style={styles.settings}>
              <FlatList
                listKey='_1'
                data={recommended}
                keyExtractor={(item) => item.id}
                renderItem={this.renderItem}
                ListHeaderComponent={
                  <Block style={styles.title}>
                    <Text
                      bold
                      center
                      size={theme.SIZES!.BASE}
                      style={{ paddingBottom: 5 }}
                    >
                      Recommended Settings
                    </Text>
                    <Text center muted size={12}>
                      These are the most important settings
                    </Text>
                  </Block>
                }
              />
              <Block style={styles.title}>
                <Text
                  bold
                  center
                  size={theme.SIZES!.BASE}
                  style={{ paddingBottom: 5 }}
                >
                  Payment Settings
                </Text>
                <Text center muted size={12}>
                  These are also important settings
                </Text>
              </Block>
              <FlatList
                listKey='_2'
                data={payment}
                keyExtractor={(item) => item.id}
                renderItem={this.renderItem}
              />
              <Block style={styles.title}>
                <Text
                  bold
                  center
                  size={theme.SIZES!.BASE}
                  style={{ paddingBottom: 5 }}
                >
                  Privacy Settings
                </Text>
                <Text center muted size={12}>
                  Third most important settings
                </Text>
              </Block>
              <FlatList
                listKey='_3'
                data={privacy}
                keyExtractor={(item) => item.id}
                renderItem={this.renderItem}
              />
            </View>
            <Block style={styles.rows}>
              <TouchableOpacity onPress={() => navigation.navigate('Pro')}>
                <Block row middle space="between" style={{ paddingTop: 7 }}>
                  <Text size={14}>&quot;title&quot;</Text>
                  <Icon
                    name="angle-right"
                    family="font-awesome"
                    style={{ paddingRight: 5 }}
                  />
                </Block>
              </TouchableOpacity>
            </Block>
            <Block row space="between" style={{ padding: theme.SIZES!.BASE }}>
              <Block middle>
                <Text bold size={12} style={{ marginBottom: 8 }}>
                  01/08/2021
                </Text>
                <Text muted size={12}>
                  Scan Date
                </Text>
              </Block>
              <Block middle>
                <Text bold size={12} style={{ marginBottom: 8 }}>
                  37s
                </Text>
                <Text muted size={12}>
                  Scan Time (change)
                </Text>
              </Block>
              <Block middle>
                <Text bold size={12} style={{ marginBottom: 8 }}>
                  2
                </Text>
                <Text muted size={12}>
                  Other Stat
                </Text>
              </Block>
            </Block>
            <Block style={{ paddingBottom: -HeaderHeight * 2 }}>
              <Block row space="between" style={{ flexWrap: 'wrap' }}>
                {Images.Viewed.map((img, index) => (
                  <Image
                    source={img}
                    key={`viewed-${index}`}
                    resizeMode="cover"
                    style={styles.thumb}
                  />
                ))}
              </Block>
            </Block>
          </VirtualList>
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  profile: {
    marginTop: Platform.OS === 'android' ? -HeaderHeight : 0,
    // marginBottom: -HeaderHeight * 2,
  },
  profileImage: {
    width: width * 1.1,
    height: 'auto',
  },
  profileContainer: {
    width,
    height: height / 2.2,
  },
  profileDetails: {
    paddingTop: theme.SIZES!.BASE! * 4,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  profileTexts: {
    paddingHorizontal: theme.SIZES!.BASE! * 2,
    paddingVertical: theme.SIZES!.BASE! * 2,
    zIndex: 2,
  },
  pro: {
    backgroundColor: materialTheme.COLORS.LABEL,
    paddingHorizontal: 6,
    marginRight: theme.SIZES!.BASE! / 2,
    borderRadius: 4,
    height: 19,
    width: 38,
  },
  seller: {
    marginRight: theme.SIZES!.BASE! / 2,
  },
  options: {
    position: 'relative',
    padding: theme.SIZES!.BASE,
    marginHorizontal: theme.SIZES!.BASE,
    marginTop: -theme.SIZES!.BASE! * 1,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: theme.COLORS?.WHITE,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    zIndex: 2,
  },
  thumb: {
    borderRadius: 4,
    marginVertical: 4,
    alignSelf: 'center',
    width: thumbMeasure,
    height: thumbMeasure,
  },
  gradient: {
    zIndex: 1,
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    position: 'absolute',
  },
  settings: {
    paddingVertical: theme.SIZES!.BASE! / 3,
  },
  title: {
    paddingTop: theme.SIZES!.BASE,
    paddingBottom: theme.SIZES!.BASE! / 2,
  },
  rows: {
    height: theme.SIZES!.BASE! * 2,
    paddingHorizontal: theme.SIZES!.BASE,
    marginBottom: theme.SIZES!.BASE! / 2,
  },
});
