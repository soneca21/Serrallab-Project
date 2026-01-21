import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KpiCard } from '../components/KpiCard';
import { Colors } from '../theme';

export const DashboardScreen = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.heading}>Minha Operação</Text>
    <View style={styles.cardContainer}>
      <KpiCard title="Orçamentos abertos" value="12" meta="+2 ontem" />
      <KpiCard title="Faturamento semana" value="R$ 38.400" meta="Meta 68% atingida" />
      <KpiCard title="Agenda hoje" value="5 visitas" meta="2 check-ins pendentes" />
    </View>
    <View style={styles.section}>
      <Text style={styles.subheading}>Alertas</Text>
      <View style={styles.alert}>
        <Text style={styles.alertTitle}>Follow-up automações</Text>
        <Text style={styles.alertMeta}>2 conversations listening</Text>
      </View>
      <View style={styles.alert}>
        <Text style={styles.alertTitle}>Pagamentos pendentes</Text>
        <Text style={styles.alertMeta}>R$14.500 aguardando</Text>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  heading: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  subheading: {
    color: Colors.muted,
    fontSize: 14,
    marginBottom: 8,
  },
  alert: {
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    backgroundColor: Colors.surface,
  },
  alertTitle: {
    color: Colors.white,
  },
  alertMeta: {
    color: Colors.muted,
    fontSize: 12,
  },
});
