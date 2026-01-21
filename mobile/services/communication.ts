import { supabase } from '../hooks/supabaseClient';

export type SendSmsPayload = {
  to: string;
  body: string;
};

export type SendWhatsappPayload = SendSmsPayload;

export type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const invokeFunction = async (name: string, payload: Record<string, any>) => {
  const { data, error } = await supabase.functions.invoke(name, { body: payload });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const sendSms = (payload: SendSmsPayload) => invokeFunction('send-sms', payload);

export const sendWhatsapp = (payload: SendWhatsappPayload) =>
  invokeFunction('send-whatsapp', payload);

export const sendEmail = (payload: SendEmailPayload) => invokeFunction('send-email', payload);

export const getBudgetPdf = (orderId: string) =>
  invokeFunction('generate-orcamento-pdf', { order_id: orderId });
