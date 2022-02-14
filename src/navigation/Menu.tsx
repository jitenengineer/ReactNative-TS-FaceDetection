import React from 'react';
import {
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Block, Text, theme } from 'galio-framework';
import { useSafeArea } from 'react-native-safe-area-context';

import {
  DrawerNavigationState,
  ParamListBase,
} from '@react-navigation/routers';
import { Drawer as DrawerCustomItem } from '../components';
import { materialTheme } from '../constants';
import { ProfileProps } from '../constants/types';

interface IProps {
  drawerPosition?: string;
  navigation: any;
  profile?: ProfileProps;
  focused?: boolean;
  state?: DrawerNavigationState<ParamListBase>;
}

function CustomDrawerContent({
  drawerPosition,
  navigation,
  profile,
  state,
}: IProps) {
  const insets = useSafeArea();
  const screens = ['About', 'Scan', 'Components', '{ScanID}', 'Contact'];
  return (
    <Block
      style={styles.container}
      forceInset={{ top: 'always', horizontal: 'never' }}
    >
      <Block flex={0.25} style={styles.header}>
        <TouchableWithoutFeedback
          onPress={() => navigation.navigate('{ScanID}')}
        >
          <Block style={styles.profile}>
            <Image
              source={require('../../assets/images/210315.png')}
              style={styles.avatar}
            />
            <Text h5 color="white">
              {profile?.name}
            </Text>
          </Block>
        </TouchableWithoutFeedback>
        <Block row>
          <Text size={16} muted style={styles.seller}>
            {profile?.type}
          </Text>
          <Text size={16} color={materialTheme.COLORS.WARNING}>
            {profile?.rating}
          </Text>
        </Block>
      </Block>
      <Block flex style={{ paddingLeft: 7, paddingRight: 14 }}>
        <ScrollView
          contentContainerStyle={[
            {
              paddingTop: insets.top * 0.4,
              paddingLeft: drawerPosition === 'left' ? insets.left : 0,
              paddingRight: drawerPosition === 'right' ? insets.right : 0,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {screens.map((item, index) => {
            return (
              <DrawerCustomItem
                title={item}
                key={`item-${item}`}
                navigation={navigation}
                focused={state?.index === index}
              />
            );
          })}
        </ScrollView>
      </Block>
      <Block flex={0.3} style={{ paddingLeft: 7, paddingRight: 14 }}>
        <DrawerCustomItem
          title="Cart"
          navigation={navigation}
          focused={state?.index === 8}
        />
        <DrawerCustomItem
          title="Contact Us"
          navigation={navigation}
          focused={state?.index === 9}
        />
      </Block>
    </Block>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4B1958',
    paddingHorizontal: 28,
    paddingBottom: theme.SIZES!.BASE,
    paddingTop: theme.SIZES!.BASE! * 2,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
  },
  profile: {
    marginBottom: theme.SIZES!.BASE! / 2,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginBottom: theme.SIZES!.BASE,
  },
  pro: {
    backgroundColor: materialTheme.COLORS.LABEL,
    paddingHorizontal: 6,
    marginRight: 8,
    borderRadius: 4,
    height: 19,
    width: 38,
  },
  seller: {
    marginRight: 16,
  },
});

export default CustomDrawerContent;
