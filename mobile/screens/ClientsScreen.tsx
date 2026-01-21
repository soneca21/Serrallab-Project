import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme';

const clients = [
  { id: '1', name: 'Serralheria Norte', contact: 'wesley@exemplo.com', status: 'Orçamento aberto' },
  { id: '2', name: 'Metalurgica Alfa', contact: 'contato@metalurga.com', status: 'Visita agendada' },
  { id: '3', name: 'Engenharia Sul', contact: 'financeiro@esul.com', status: 'Em negociação' },
];

export const ClientsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.heading}>Clientes</Text>
    <FlatList
      data={clients}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card}>
          <View>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>{item.contact}</Text>
          </View>
          <View>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        </TouchableOpacity>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.white,
    fontSize: 16,
  },
  meta: {
    color: Colors.muted,
    fontSize: 12,
  },
  status: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
