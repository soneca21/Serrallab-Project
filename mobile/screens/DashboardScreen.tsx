import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KpiCard } from '../components/KpiCard';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme';
import { useSupabaseDashboard } from '../hooks';
import { ActionButton } from '../components/ActionButton';

export const DashboardScreen = () => {
  const { data, loading, error } = useSupabaseDashboard();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionHeader title="Visão Geral" caption="Indicadores essenciais do SaaS" />
      <View style={styles.actionsRow}>
        <ActionButton
          label="Ver auditoria"
          onPress={() => setStatusMessage('Abrindo auditoria...')}
          variant="ghost"
          style={[styles.action, styles.actionSpacing]}
        />
        <ActionButton
          label="Exportar relatório"
          onPress={() => setStatusMessage('Preparando exportação...')}
          variant="ghost"
          style={styles.action}
        />
      </View>
      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
      <View style={styles.statusRow}>
        <StatusBadge label="Supabase Operacional" tone={!error ? 'success' : 'warning'} />
        <StatusBadge label={loading ? 'Sincronizando...' : 'Fluxo estável'} tone="neutral" />
      </View>

      <View style={styles.cardContainer}>
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} title={kpi.label} value={kpi.value} meta={kpi.detail} />
        ))}
      </View>

      <SectionHeader
        title="Alertas críticos"
        actionLabel="Ver auditoria"
        onAction={() => setStatusMessage('Consultando auditoria...')}
      />
      {(error ? ['Erro ao carregar dados.'] : data.alerts).map((alert) => (
        <View key={alert} style={styles.alert}>
          <Text style={styles.alertTitle}>{alert}</Text>
        </View>
      ))}

      <SectionHeader title="Pipeline em andamento" caption="Distribuição atual de oportunidades" />
      <View style={styles.pipeline}>
        {data.pipeline.map((item) => (
          <View style={styles.pipelineCard} key={item.label}>
            <Text style={styles.pipelineLabel}>{item.label}</Text>
            <Text style={styles.pipelineValue}>{item.count}</Text>
            <Text style={styles.pipelineMeta}>{item.meta}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  action: {
    flexGrow: 1,
    borderColor: Colors.border,
  },
  actionSpacing: {
    marginRight: 10,
  },
  statusMessage: {
    color: Colors.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardContainer: {
    marginBottom: 16,
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
    fontWeight: '600',
  },
  alertMeta: {
    color: Colors.muted,
    fontSize: 12,
  },
  pipeline: {
    marginTop: 8,
  },
  pipelineCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 10,
  },
  pipelineLabel: {
    color: Colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  pipelineValue: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 4,
  },
  pipelineMeta: {
    color: Colors.muted,
    fontSize: 11,
  },
});
