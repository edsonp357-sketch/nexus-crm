
import { GoogleGenAI } from "@google/genai";
import { Customer } from "../types";

// Serviço de geração de insights por IA usando a API Gemini
export const getAIInsights = async (customer: Customer): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Forneça um resumo profissional e 3 próximos passos acionáveis para um cliente com os seguintes detalhes:
      Nome: ${customer.name}
      Status: ${customer.status}
      Valor Atual: R$${customer.value}
      Data do Contrato: ${customer.date}
      
      Mantenha o texto conciso, profissional e totalmente em português do Brasil. Use um tom positivo e estratégico.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao gerar recomendações da IA. Tente novamente mais tarde.";
  }
};

// Gera uma mensagem de notificação/contato para o cliente
export const generateCustomerNotification = async (customer: Customer): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escreva uma mensagem de contato curta e profissional para enviar ao cliente ${customer.name} via WhatsApp ou E-mail.
      Contexto:
      Status: ${customer.status}
      Valor do Contrato: R$${customer.value}
      Data de Referência: ${customer.date}
      
      Regras:
      - Se estiver "Ativo", a mensagem deve ser de agradecimento e manutenção.
      - Se estiver "Atrasado", a mensagem deve ser um lembrete gentil mas firme sobre o pagamento.
      - Se estiver "Expirado", a mensagem deve ser um convite para renovação com foco em benefícios.
      - Use emojis adequados e mantenha um tom humano.
      - Responda apenas com o texto da mensagem.`,
      config: {
        temperature: 0.8,
      },
    });

    return response.text || "Olá! Gostariamos de conversar sobre seu contrato.";
  } catch (error) {
    console.error("Erro Gemini Notification:", error);
    return "Olá, notamos uma pendência em seu cadastro. Por favor, entre em contato.";
  }
};
