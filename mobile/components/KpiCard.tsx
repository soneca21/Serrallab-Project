import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

type KpiCardProps = {
  title: string;
  value: string;
  meta?: string;
};

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, meta }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.value}>{value}</Text>
    {meta && <Text style={styles.meta}>{meta}</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: Colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  value: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 6,
  },
  meta: {
    color: Colors.primary,
    fontSize: 12,
  },
});
