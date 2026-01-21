import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../theme';
import { useSupabaseQuotes } from '../hooks';
import { ActionButton } from '../components/ActionButton';
import { sendEmail, sendSms, sendWhatsapp, getBudgetPdf } from '../services/communication';

export const QuotesScreen = () => {
  const { quotes, summary, loading, error } = useSupabaseQuotes();
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const primaryQuote = useMemo(() => quotes[0], [quotes]);
  const marginPercent = primaryQuote ? Math.round(((primaryQuote.total * 0.25) / primaryQuote.total) * 100) : 0;

  const handleOpenPdf = async (orderId?: string) => {
    if (!orderId) {
      setStatusMessage('Selecione um orçamento antes de abrir o PDF.');
      return;
    }

    try {
      const pdf = await getBudgetPdf(orderId);
      setStatusMessage(`PDF pronto: ${pdf?.url ?? 'download pendente'}`);
    } catch (err) {
      setStatusMessage(`Erro ao gerar PDF: ${err.message}`);
    }
  };

  const handleSendProposal = async () => {
    if (!primaryQuote) {
      setStatusMessage('Nenhum orçamento disponível para enviar.');
      return;
    }

    setSending(true);
    setStatusMessage(null);
    try {
      const formattedValue = `R$ ${primaryQuote.total.toFixed(2).replace('.', ',')}`;
      const payload = {
        to: 'cliente@empresa.com',
        subject: `Orçamento ${primaryQuote.title}`,
        html: `<p>Segue o orçamento ${primaryQuote.title} no valor de ${formattedValue}.</p>`,
        text: `Orçamento ${primaryQuote.title} - ${formattedValue}`,
      };

      await Promise.all([
        sendEmail(payload),
        sendSms({ to: '+5511999999999', body: payload.text }),
        sendWhatsapp({ to: '+5511999999999', body: payload.text }),
      ]);

      setStatusMessage('Proposta enviada via email, SMS e WhatsApp.');
    } catch (sendError) {
      setStatusMessage(`Erro ao enviar propostas: ${sendError.message}`);
    } finally {
      setSending(false);
    }
  };

  const actionDisabled = loading || sending;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionHeader
        title="Orçamentos"
        caption="Propostas comerciais em curso"
        actionLabel="Novo orçamento"
        onAction={() => undefined}
      />

      <View style={styles.actionsRow}>
        <ActionButton label="Enviar proposta" onPress={handleSendProposal} disabled={actionDisabled} />
        <ActionButton
          label="Ver PDF"
          variant="ghost"
          onPress={() => handleOpenPdf(primaryQuote?.id)}
        />
      </View>
      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

      {primaryQuote ? (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Detalhes do orçamento</Text>
          <Text style={styles.detailText}>Cliente: {primaryQuote.title}</Text>
          <Text style={styles.detailText}>Margem calculada: {marginPercent}%</Text>
          <Text style={styles.detailText}>Condições: Pagamento em 3x, 30 dias</Text>
          <Text style={styles.detailText}>Informações fiscais: CNPJ 00.000.000/0001-85</Text>
        </View>
      ) : null}

      {primaryQuote ? (
        <View style={styles.itemsCard}>
          <Text style={styles.detailTitle}>Lista de itens</Text>
          {['Disco Corte 4,1/2"', 'Serviço de medição', 'Transporte'].map((item) => (
            <Text key={item} style={styles.itemLine}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.summary}>
        {[
          { label: 'Rascunhos', value: summary.drafts, tone: 'warning' as const },
          { label: 'Enviados', value: summary.sent, tone: 'info' as const },
          { label: 'Aprovados', value: summary.approved, tone: 'success' as const },
        ].map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <StatusBadge label={item.label} tone="neutral" />
            <Text style={styles.summaryValue}>{loading ? '—' : item.value}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={loading ? Array.from({ length: 3 }, (_, index) => ({ id: `loading-${index}` })) : quotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{`R$ ${item.total.toFixed(2).replace('.', ',')}`}</Text>
            </View>
            <View>
              <StatusBadge
                label={item.status}
                tone={item.status === 'aprovado' ? 'success' : item.status === 'enviado' ? 'info' : 'warning'}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={!loading && !error ? (
          <Text style={styles.empty}>Nenhum orçamento encontrado.</Text>
        ) : null}
      />
      {error && <Text style={styles.error}>Erro ao carregar orçamentos: {error.message}</Text>}
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusMessage: {
    color: Colors.muted,
    marginBottom: 12,
    fontSize: 12,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    marginRight: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 10,
    alignItems: 'center',
  },
  summaryValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: Colors.muted,
    fontSize: 12,
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
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 12,
  },
  detailTitle: {
    color: Colors.primary,
    fontWeight: '600',
  },
  detailText: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 4,
  },
  itemsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 14,
    marginBottom: 12,
  },
  itemLine: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 4,
  },
});
