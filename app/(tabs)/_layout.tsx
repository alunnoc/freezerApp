import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          justifyContent: 'space-around',
          alignItems: 'center',
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Frigo',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menù',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="fork.knife" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-recipes"
        options={{
          title: 'Le mie ricette',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.closed.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Ricetta dal web',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'Lista della spesa',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
