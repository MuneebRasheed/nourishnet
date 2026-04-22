import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProviderListingsScreen from '../screens/ProviderListingsScreen';

export type ListingsStackParamList = {
  ProviderListingsScreen: undefined;
};

const Stack = createNativeStackNavigator<ListingsStackParamList>();

export default function ListingsNavigationStack() {
  return (
    <Stack.Navigator
      id="ListingsNavigationStack"
      screenOptions={{ headerShown: false }}
      initialRouteName="ProviderListingsScreen"
    >
      <Stack.Screen
        name="ProviderListingsScreen"
        component={ProviderListingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
