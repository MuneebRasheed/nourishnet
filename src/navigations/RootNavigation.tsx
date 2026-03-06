import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import ThemeFontsTestScreen from '../screens/ThemeFontTestScreen';
import ThemeScreen from '../screens/ThemeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import OnBoardingScreen from '../screens/OnBoardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationCodeScreen from '../screens/VerficationCodeScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

import SelectRoleScreen from '../screens/SelectRoleScreen';
import ReceiptOnBoardScreen from '../screens/ReceiptOnBoardScreen';
import FoodOnBoardScreen from '../screens/FoodOnBoardScreen';
import FoodDetailScreen, { FoodDetailItem } from '../screens/FoodDetailScreen';
import PostFoodScreen, { PostFoodDraft } from '../screens/PostFoodScreen';
import PostPublishScreen from '../screens/PostPublishScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import MainTabNavigator, { MainTabParamList } from './MainTabNavigator';
import ProviderProfileScreen from '../screens/ProviderProfileScreen';

import SubscriptionManagementScreen from '../screens/SubscriptionManagementScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

export type AuthRole = 'provider' | 'recipient';

/** Root stack route names and params. Use this type for useNavigation<> in screens. */
export type RootStackParamList = {
  SplashScreen: undefined;
  OnBoardingScreen: undefined;
  LoginScreen: { role?: AuthRole } | undefined;
  SignupScreen: { role?: AuthRole } | undefined;
  VerificationCodeScreen: { email?: string; role?: AuthRole };
  EditProfileScreen: { email?: string; otp?: string };
  ProviderProfileScreen: { email?: string; otp?: string };
  SelectRoleScreen: undefined;
  ReceiptOnBoardScreen: { role?: AuthRole } | undefined;
  CreateNewPasswordScreen?: { email: string; otp: string };
  ThemeFontTestScreen: undefined;
  ThemeScreen: undefined;
  NotificationsScreen: undefined;
  NotificationSettingsScreen: undefined;
  FoodOnBoardScreen: { role?: AuthRole } | undefined;
  FoodDetailScreen: { item: FoodDetailItem };
  PostFoodScreen: undefined;
  PostPublishScreen: { draft: PostFoodDraft } | undefined;
  QRCodeScreen: undefined;
  ListingRequestsScreen: { listingId: string; listingTitle: string };
  SubscriptionManagementScreen: undefined;
  ChangePasswordScreen: undefined;
  TermsAndConditionsScreen: undefined;
  PrivacyPolicyScreen: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** App always starts at Splash → onboarding flow (if new) → then provider or recipient flow (MainTabs). */
function RootNavigation() {
  return (
    <Stack.Navigator
      id="RootStack"
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="SplashScreen"
    >
      <Stack.Screen
        name="SplashScreen" 
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OnBoardingScreen"
        component={OnBoardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignupScreen"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
       <Stack.Screen
        name="VerificationCodeScreen"
        component={VerificationCodeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProviderProfileScreen"
        component={ProviderProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelectRoleScreen"
        component={SelectRoleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReceiptOnBoardScreen"
        component={ReceiptOnBoardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodOnBoardScreen"
        component={FoodOnBoardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodDetailScreen"
        component={FoodDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostFoodScreen"
        component={PostFoodScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostPublishScreen"
        component={PostPublishScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QRCodeScreen"
        component={QRCodeScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="SubscriptionManagementScreen"
        component={SubscriptionManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TermsAndConditionsScreen"
        component={TermsAndConditionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicyScreen"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ThemeFontTestScreen"
        component={ThemeFontsTestScreen}
        options={{ headerShown: true, title: 'Typography & Theme' }}
      />
      <Stack.Screen
        name="ThemeScreen"
        component={ThemeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettingsScreen"
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


export default RootNavigation;
