import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme';

type SectionHeaderProps = {
  title: string;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  caption,
  actionLabel,
  onAction,
}) => (
  <View style={styles.container}>
    <View>
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
    {actionLabel ? (
      <TouchableOpacity onPress={onAction} style={styles.action}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  caption: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  action: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
