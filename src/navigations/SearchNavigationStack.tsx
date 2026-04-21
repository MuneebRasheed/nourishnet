import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchTabScreenMain from '../screens/SearchTabScreenMain';
import SearchTabScreen from '../screens/SearchTabScreen';
import ListingRequestsScreen from '../screens/ListingRequestsScreen';

/** Root stack route names and params. Use this type for useNavigation<> in screens. */
export type RootStackParamList = {
  SearchTabScreenMain: undefined;
  SearchTabScreen: { fromActivation?: boolean } | undefined;
  ListingRequestsScreen: { listingId: string; listingTitle: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
function SearchNavigationStack() {
  return (
    <Stack.Navigator
      id="SearchNavigationStack"
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="SearchTabScreenMain"
    >
      <Stack.Screen
        name="SearchTabScreenMain" 
        component={SearchTabScreenMain}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchTabScreen"
        component={SearchTabScreen}
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


export default SearchNavigationStack;
