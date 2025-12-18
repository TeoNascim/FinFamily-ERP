import { GoogleGenAI } from "@google/genai";
import { Transaction, AIAnalysisResult } from "../types";

// Função para obter a API KEY de forma segura
const getApiKey = () => {
  return process.env.API_KEY || "";
};

export const getFinancialAdvice = async (transactions: Transaction[], moduleTitle: string): Promise<AIAnalysisResult> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return {
      summary: "API Key não configurada no servidor.",
      tips: ["Configure a variável de ambiente API_KEY no painel do Netlify.", "Reinicie o deploy.", "Consulte a documentação."],
      riskLevel: "Low"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contextData = JSON.stringify(transactions);
    
    const prompt = `
      Atue como um consultor financeiro sênior para uma família.
      Analise os seguintes dados do módulo "${moduleTitle}":
      ${contextData}

      Por favor, forneça:
      1. Um resumo curto da situação (max 2 frases).
      2. 3 dicas táticas para economizar ou melhorar a situação financeira baseada nesses dados.
      3. Classifique o nível de risco financeiro (Low, Medium, High).

      Responda APENAS em formato JSON com a seguinte estrutura, sem markdown code blocks:
      {
        "summary": "string",
        "tips": ["string", "string", "string"],
        "riskLevel": "Low" | "Medium" | "High"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Error fetching AI advice:", error);
    return {
      summary: "Não foi possível analisar os dados no momento.",
      tips: ["Verifique sua conexão.", "Tente novamente mais tarde.", "Contate o suporte se o erro persistir."],
      riskLevel: "Low"
    };
  }
};