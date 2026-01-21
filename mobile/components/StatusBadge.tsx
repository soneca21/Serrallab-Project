import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

type StatusBadgeProps = {
  label: string;
  tone?: 'warning' | 'success' | 'neutral' | 'info';
};

const toneStyles = {
  warning: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: Colors.primary,
    color: Colors.primary,
  },
  success: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: '#16a34a',
    color: '#16a34a',
  },
  info: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    color: '#3b82f6',
  },
  neutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: Colors.border,
    color: Colors.white,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'neutral' }) => {
  const { backgroundColor, borderColor, color } = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
