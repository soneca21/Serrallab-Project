import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { Colors } from '../theme';
import { useSupabaseNotifications } from '../hooks';
import { ActionButton } from '../components/ActionButton';

export const NotificationsScreen = () => {
  const { notifications, loading, error } = useSupabaseNotifications();

  return (
    <View style={styles.container}>
      <SectionHeader title="Notificações" caption="Eventos operacionais e auditoria" />
      <View style={styles.actionsRow}>
        <ActionButton
          label="Limpar alertas"
          variant="ghost"
          onPress={() => {}}
          style={{ marginRight: 8 }}
        />
        <ActionButton label="Filtrar" variant="ghost" onPress={() => {}} />
      </View>
      <FlatList
        data={loading ? Array.from({ length: 3 }, (_, index) => ({ id: `loading-${index}` })) : notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.detail}</Text>
            </View>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        )}
        ListEmptyComponent={!loading && !error ? (
          <Text style={styles.empty}>Ainda sem notificações.</Text>
        ) : null}
      />
      {error && <Text style={styles.error}>Erro ao carregar notificações: {error.message}</Text>}
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
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  timestamp: {
    color: Colors.muted,
    fontSize: 10,
    alignSelf: 'flex-start',
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
