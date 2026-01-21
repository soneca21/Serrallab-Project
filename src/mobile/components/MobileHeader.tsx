import React from 'react';
import { StyleSheet, Text, View } from 'react-native-web';
import { mobileColors } from '../theme';
import { Circle, Activity } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  healthy?: boolean;
};

export const MobileHeader = ({ title, description, healthy = true }: Props) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
    <View style={styles.status}>
      <Circle size={10} color={healthy ? mobileColors.success : '#dc2626'} />
      <Text style={[styles.statusText, { color: healthy ? mobileColors.success : '#dc2626' }]}>
        {healthy ? 'Supabase Operacional' : 'Supabase Desativado'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: mobileColors.surface,
    borderWidth: 1,
    borderColor: mobileColors.border,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: mobileColors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  description: {
    color: mobileColors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
