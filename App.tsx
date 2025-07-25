import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

// Tipagem das rotas
export type RootStackParamList = {
  Login: undefined;
  Home: { user: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Home'>('Login');
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário está logado
  useEffect(() => {
    const checkLoggedUser = async () => {
      const user = await AsyncStorage.getItem('@logged_user');
      setInitialRoute(user ? 'Home' : 'Login');
      setLoading(false);
    };
    checkLoggedUser();
  }, []);

  if (loading) return null; // Pode ser substituído por uma tela de splash/loading

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



