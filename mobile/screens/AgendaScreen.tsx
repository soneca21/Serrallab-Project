import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { Colors } from '../theme';
import { useSupabaseAgenda } from '../hooks';
import { ActionButton } from '../components/ActionButton';

export const AgendaScreen = () => {
  const { agenda, loading, error } = useSupabaseAgenda();

  return (
    <View style={styles.container}>
      <SectionHeader title="Agenda" caption="Visitas, entregas e checkpoints do dia" />
      <View style={styles.actionsRow}>
        <ActionButton label="Novo compromisso" onPress={() => {}} style={[styles.actionSpacing, styles.actionSmall]} />
        <ActionButton label="Filtrar" variant="ghost" onPress={() => {}} style={styles.actionSmall} />
      </View>
      <FlatList
        data={loading ? Array.from({ length: 3 }, (_, index) => ({ id: `loading-${index}` })) : agenda}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{item.time ?? '—'}</Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.label}>{item.title}</Text>
              <Text style={styles.meta}>{item.meta}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading && !error ? (
          <Text style={styles.empty}>Nenhum evento registrado.</Text>
        ) : null}
      />
      {error && <Text style={styles.error}>Erro ao carregar agenda: {error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  list: {
    paddingBottom: 40,
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  timeContainer: {
    marginRight: 12,
  },
  time: {
    color: Colors.primary,
    fontWeight: '700',
  },
  details: {
    flex: 1,
  },
  label: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
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
