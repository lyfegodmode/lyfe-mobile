import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../context/AuthContext.js'
import { colors } from '../constants/theme.js'

import LoginScreen        from '../screens/LoginScreen.js'
import FeedScreen         from '../screens/FeedScreen.js'
import ExploreScreen      from '../screens/ExploreScreen.js'
import ProfileScreen      from '../screens/ProfileScreen.js'
import MessagesScreen, { ConversationScreen } from '../screens/MessagesScreen.js'
import EditProfileScreen  from '../screens/EditProfileScreen.js'
import PostViewerScreen   from '../screens/PostViewerScreen.js'

const Stack = createNativeStackNavigator()
const Tab   = createBottomTabNavigator()

function TabNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.earth,
        tabBarInactiveTintColor: colors.tan,
        tabBarStyle: { borderTopColor: colors.sand, backgroundColor: colors.white },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Feed:     'home-outline',
            Explore:  'compass-outline',
            Messages: 'chatbubble-outline',
            Profile:  'person-outline',
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Feed"     component={FeedScreen} />
      <Tab.Screen name="Explore"  component={ExploreScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const NAV_THEME = {
  colors: {
    background: colors.white,
    border: colors.sand,
    card: colors.white,
    notification: colors.earth,
    primary: colors.earth,
    text: colors.ink,
  },
}

export default function Navigation() {
  const { user, loading } = useAuth()
  if (loading) return null

  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNav} />
            <Stack.Screen
              name="UserProfile"
              component={ProfileScreen}
              options={{ headerShown: true, title: '' }}
            />
            <Stack.Screen
              name="Conversation"
              component={ConversationScreen}
              options={{ headerShown: true, title: '' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: true, title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="PostViewer"
              component={PostViewerScreen}
              options={{ headerShown: true, title: '' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
