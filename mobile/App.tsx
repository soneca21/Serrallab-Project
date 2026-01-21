import React from 'react';
import { SafeAreaView, StatusBar, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from './theme';

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Dashboard Serrallab Mobile</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Orçamentos em andamento</Text>
          <Text style={styles.cardValue}>12</Text>
          <Text style={styles.cardMeta}>Pipeline atualizado há 2h</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alertas</Text>
          <Text style={styles.cardValue}>3 em aberto</Text>
          <Text style={styles.cardMeta}>Follow-up automático ativado</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agenda do Dia</Text>
          <Text style={styles.cardValue}>5 visitas</Text>
          <Text style={styles.cardMeta}>Começa em 30 min</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
  },
  heading: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: Colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValue: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '600',
  },
  cardMeta: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 4,
  },
});
