import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

const notifications = [
  { id: 'n1', text: 'Mensagem enviada via WhatsApp para Serralheria Norte', time: 'Agora' },
  { id: 'n2', text: 'Novo lead captado pelo site', time: 'Há 30 min' },
  { id: 'n3', text: 'Orçamento entregue para Engenharia Sul', time: '1 hora atrás' },
];

export const NotificationsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.heading}>Notificações</Text>
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.text}>{item.text}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  heading: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  text: {
    color: Colors.white,
    fontSize: 14,
  },
  time: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
});
