import React from 'react';
import { StyleSheet, Text, View } from 'react-native-web';
import { mobileColors } from '../theme';

type Props = {
  title: string;
  value: string;
  trend?: string;
};

export const MobileKpiCard = ({ title, value, trend }: Props) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.valueRow}>
      <Text style={styles.value}>{value}</Text>
      {trend && <Text style={styles.trend}>{trend}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: mobileColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: mobileColors.border,
    marginBottom: 12,
  },
  title: {
    color: mobileColors.muted,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    color: mobileColors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  trend: {
    color: mobileColors.success,
    fontSize: 12,
  },
});
