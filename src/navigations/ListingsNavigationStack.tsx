import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProviderListingsScreen from '../screens/ProviderListingsScreen';
import ListingRequestsScreen from '../screens/ListingRequestsScreen';

export type ListingsStackParamList = {
  ProviderListingsScreen: undefined;
  ListingRequestsScreen: { listingId: string; listingTitle: string };
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
      <Stack.Screen
        name="ListingRequestsScreen"
        component={ListingRequestsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
