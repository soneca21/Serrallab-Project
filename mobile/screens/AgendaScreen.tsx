import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

const schedule = [
  { id: 'a1', time: '08:30', label: 'Visita técnica Serralheria Norte' },
  { id: 'a2', time: '11:00', label: 'Checklist com Metalúrgica Alfa' },
  { id: 'a3', time: '15:00', label: 'Entrega – Engenharia Sul' },
];

export const AgendaScreen = () => (
  <View style={styles.container}>
    <Text style={styles.heading}>Agenda</Text>
    <FlatList
      data={schedule}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.time}>{item.time}</Text>
          <Text style={styles.label}>{item.label}</Text>
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
    padding: 16,
    marginBottom: 10,
  },
  time: {
    color: Colors.primary,
    fontWeight: '600',
  },
  label: {
    color: Colors.white,
    fontSize: 14,
    marginTop: 4,
  },
});
