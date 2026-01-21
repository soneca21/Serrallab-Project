import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme';
import { useSupabaseClients } from '../hooks';
import { ActionButton } from '../components/ActionButton';

export const ClientsScreen = () => {
  const { clients, loading, error } = useSupabaseClients();

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Contas"
        caption="Gestão de empresas, planos e saúde financeira"
        actionLabel="Atualizar dados"
        onAction={() => undefined}
      />
      <View style={styles.actionsRow}>
        <ActionButton
          label="Filtrar status"
          onPress={() => {}}
          variant="ghost"
          style={[styles.actionSmall, styles.actionSpacing]}
        />
        <ActionButton
          label="Planos ativos"
          onPress={() => {}}
          variant="ghost"
          style={[styles.actionSmall, styles.actionSpacing]}
        />
        <ActionButton label="Nova conta" onPress={() => {}} style={styles.actionSmall} />
      </View>

      <FlatList
        data={loading ? Array.from({ length: 3 }, (_, index) => ({ id: `loading-${index}` })) : clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.title}>{item.name ?? 'Carregando...'}</Text>
              {!loading && (
                <>
                  <Text style={styles.meta}>{item.email}</Text>
                  <Text style={styles.meta}>{item.phone ?? 'Telefone não informado'}</Text>
                </>
              )}
            </View>
            <View style={styles.badges}>
              <View style={styles.badgeSpacing}>
                <StatusBadge label={item.plan ?? 'Plano'} tone="warning" />
              </View>
              <View style={styles.badgeSpacing}>
                <StatusBadge label={item.status ?? 'Status'} tone="neutral" />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading && !error ? (
          <Text style={styles.empty}>Nenhuma conta encontrada.</Text>
        ) : null}
      />
      {error && <Text style={styles.error}>Erro ao carregar contas: {error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionSmall: {
    borderColor: Colors.border,
  },
  actionSpacing: {
    marginRight: 8,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  badges: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeSpacing: {
    marginRight: 8,
    marginBottom: 6,
  },
  empty: {
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: '#ef4444',
    marginTop: 12,
  },
});
