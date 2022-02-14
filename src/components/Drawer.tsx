import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Block, Text, theme } from 'galio-framework';

import Icon from './atoms/Icon';
import materialTheme from '../constants/Theme';

// TODO: Change how notification ius rendered, take the style fromt the pro icon
const proScreens = ['Cart'];

interface IProps {
  title: string;
  focused?: boolean;
  navigation?: any;
}

class DrawerItem extends React.Component<IProps> {
  renderIcon = () => {
    const { title, focused } = this.props;

    switch (title) {
      case 'About':
        return (
          <Icon
            size={20}
            name="home"
            family="font-awesome"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case 'Scan':
        return (
          <Icon
            size={20}
            name="dot-circle-o"
            family="font-awesome"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case '{ScanID}':
        return (
          <Icon
            size={20}
            name="rotate-left"
            family="font-awesome"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case 'Kids':
        return (
          <Icon
            size={20}
            name="baby"
            family="GalioExtra"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case 'Cart':
        return (
          <Icon
            size={20}
            name="shopping-cart"
            family="font-awesome"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case 'Contact Us':
        return (
          <Icon
            size={20}
            name="comments-o"
            family="font-awesome"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case 'Components':
        return (
          <Icon
            size={20}
            name="question"
            family="font-awesome"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case 'Components-1':
        return (
          <Icon
            size={20}
            name="md-switch"
            family="ionicon"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case 'Contact':
        return (
          <Icon
            size={20}
            name="ios-log-in"
            family="ionicon"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      case '':
        return (
          <Icon
            size={20}
            name="md-person-add"
            family="ionicon"
            color={focused ? 'white' : materialTheme.COLORS.MUTED}
          />
        );
      default:
        return null;
    }
  };

  renderLabel = () => {
    const { title } = this.props;

    if (proScreens.includes(title)) {
      return (
        <Block middle style={styles.pro}>
          <Text size={12} color="white">
            Item
          </Text>
        </Block>
      );
    }

    return null;
  };

  render() {
    const { focused, title, navigation } = this.props;
    const proScreen = proScreens.includes(title);
    return (
      <TouchableOpacity
        style={{ height: 55 }}
        onPress={() => {
          navigation?.navigate(title);
        }}
      >
        <Block
          flex
          row
          style={[
            styles.defaultStyle,
            focused ? [styles.activeStyle, styles.shadow] : null,
          ]}
        >
          <Block middle flex={0.1} style={{ marginRight: 28 }}>
            {this.renderIcon()}
          </Block>
          <Block row center flex={0.9}>
            <Text
              size={18}
              color={
                focused
                  ? 'white'
                  : proScreen
                  ? materialTheme.COLORS.MUTED
                  : 'black'
              }
            >
              {title}
            </Text>
            {this.renderLabel()}
          </Block>
        </Block>
      </TouchableOpacity>
    );
  }
}

export default DrawerItem;

const styles = StyleSheet.create({
  defaultStyle: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  activeStyle: {
    backgroundColor: materialTheme.COLORS.ACTIVE,
    borderRadius: 4,
  },
  shadow: {
    shadowColor: theme.COLORS?.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    shadowOpacity: 0.2,
  },
  pro: {
    backgroundColor: materialTheme.COLORS.LABEL,
    paddingHorizontal: 6,
    marginLeft: 8,
    borderRadius: 2,
    height: 16,
    width: 36,
  },
});
