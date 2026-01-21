import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

const quotes = [
  { id: 'q1', title: 'Portão Basculante', value: 'R$ 2.400', status: 'Rascunho' },
  { id: 'q2', title: 'Guarda Corpo', value: 'R$ 1.120', status: 'Enviado' },
  { id: 'q3', title: 'Escada Industrial', value: 'R$ 3.900', status: 'Aguardando aprovação' },
];

export const QuotesScreen = () => (
  <View style={styles.container}>
    <Text style={styles.heading}>Orçamentos</Text>
    <FlatList
      data={quotes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.value}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
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
  badge: {
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 10,
  },
});
