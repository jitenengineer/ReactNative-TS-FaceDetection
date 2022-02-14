import React from 'react';
import { Dimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import ComponentsScreen from '../components/screens/Components';
import AboutScreen from '../components/screens/About';
import OnboardingScreen from '../components/screens/Onboarding';
import PreviousScanScreen from '../components/screens/PreviousScan';
import StripeScreen from '../components/screens/Stripe';
import SettingsScreen from '../components/screens/Settings';
import CartScreen from '../components/screens/Cart';
import ContactScreen from '../components/screens/Contact';
import DeclinedScreen from '../components/screens/Declined';
import SuccessScreen from '../components/screens/Success';
import InstructionsScreen from '../components/screens/Instructions';
import ScanScreen from '../components/screens/Scan';
import ScanCompleteScreen from '../components/screens/ScanComplete';

import CustomDrawerContent from './Menu';
import { Icon, Header } from '../components';
import { Images, materialTheme } from '../constants';

const { width } = Dimensions.get('screen');

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const profile = {
  avatar: Images.Profile,
  name: 'No Previous Scan', // if no previous scan then have a cta to scan their ear
  type: '#ABC123',
  rating: '01/08/1996', // TODO: localise
};

function PreviousScanStack() {
  return (
    <Stack.Navigator
      initialRouteName="PreviousScanScreen"
      screenOptions={{ presentation: "card", headerMode: "screen" }}
    >
      <Stack.Screen
        name="{ScanID}"
        component={PreviousScanScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              title="Scan {#ScanID}"
              navigation={navigation}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function SupportStack() {
  return (
    <Stack.Navigator
      initialRouteName="Settings"
      screenOptions={{ presentation: "card", headerMode: "screen" }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          header: ({ navigation }) => (
            <Header title="Settings" navigation={navigation} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function ComponentsStack() {
  return (
    <Stack.Navigator screenOptions={{ presentation: "card", headerMode: "screen" }}>
      <Stack.Screen
        name="Components"
        component={ComponentsScreen}
        options={{
          header: ({ navigation }) => (
            <Header title="Components" navigation={navigation} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function ContactStack() {
  return (
    <Stack.Navigator screenOptions={{ presentation: "card", headerMode: "screen" }}>
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          header: ({ navigation }) => (
            <Header title="Contact Us" navigation={navigation} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function AboutStack() {
  return (
    <Stack.Navigator screenOptions={{ presentation: "card", headerMode: "screen" }}>
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              title="About"
              navigation={navigation}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function ScanStack() {
  return (
    <Stack.Navigator screenOptions={{ presentation: "card", headerMode: "screen" }}>
      <Stack.Screen
        name="Instructions"
        component={InstructionsScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              back
              white
              transparent
              hideRight
              title=""
              navigation={navigation}
            />
          ),
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              back
              white
              transparent
              hideRight
              title=""
              navigation={navigation}
            />
          ),
          headerTransparent: true,
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name="ScanComplete"
        component={ScanCompleteScreen}
        options={{
          header: ({ navigation }) => (
            <Header 
              back
              white
              transparent
              title="" 
              hideRight
              navigation={navigation}
            />
          ),
          headerTransparent: true,
          headerLeft: () => {
            return null;
          },
        }}
      />
    </Stack.Navigator>
  );
}

function CheckoutStack() {
  return (
    <Stack.Navigator screenOptions={{ presentation: "card", headerMode: "screen" }}>
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              title="Cart"
              navigation={navigation}
            />
          ),
        }}
      />
      <Stack.Screen
        name="Stripe"
        component={StripeScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              back
              title="Checkout"
              navigation={navigation}
            />
          ),
        }}
      />
      <Stack.Screen
        name="Declined"
        component={DeclinedScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              back
              title=""
              navigation={navigation}
            />
          ),
        }}
      />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{
          header: ({ navigation }) => (
            <Header
              back
              title=""
              navigation={navigation}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} profile={profile} />
      )}
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { flex: 1 },
        drawerActiveTintColor: 'white',
        drawerInactiveTintColor: '#000',
        drawerActiveBackgroundColor: materialTheme.COLORS.ACTIVE,
        drawerInactiveBackgroundColor: 'transparent',
        drawerStyle: {
          backgroundColor: 'white',
          width: width * 0.8,
        },
        drawerItemStyle: {
          width: width * 0.74,
          paddingHorizontal: 12,
          // paddingVertical: 4,
          justifyContent: 'center',
          alignContent: 'center',
          // alignItems: 'center',
          overflow: 'hidden',
        },
        drawerLabelStyle: {
          fontSize: 18,
          fontWeight: 'normal',
        },
      }}
      initialRouteName="About"
    >
      <Drawer.Screen
        name="About"
        component={AboutStack}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="shop"
              family="GalioExtra"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="New Collection"
        component={AboutScreen}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="grid-on"
              family="material"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Scan"
        component={ScanStack}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="circle-10"
              family="GalioExtra"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="{ScanID}"
        component={PreviousScanStack}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="circle-10"
              family="GalioExtra"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Components"
        component={ComponentsStack}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="md-switch"
              family="ionicon"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
              style={{ marginRight: 2, marginLeft: 2 }}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Contact"
        component={ContactStack}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="md-switch"
              family="ionicon"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
              style={{ marginRight: 2, marginLeft: 2 }}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Cart"
        component={CheckoutStack}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="md-switch"
              family="ionicon"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
              style={{ marginRight: 2, marginLeft: 2 }}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Contact Us"
        component={SupportStack}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon
              size={16}
              name="md-person-add"
              family="ionicon"
              color={focused ? 'white' : materialTheme.COLORS.MUTED}
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ presentation: "card", headerShown: false }}>
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          headerTransparent: true,
        }}
      />
      <Stack.Screen name="About" component={AppStack} />
    </Stack.Navigator>
  );
}
