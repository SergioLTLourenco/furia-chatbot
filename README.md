# 🤖 FURIA Esports Chatbot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-blue.svg)](https://www.mongodb.com/)

Chatbot oficial para fãs da FURIA Esports (CS:GO/CS2) com integração Telegram e WhatsApp, fornecedor de informações sobre jogos, resultados e transmissões.

## 🚀 Recursos Principais

- **Calendário Automatizado**: Web scraping da HLTV.org para atualização de jogos
- **Multiplataforma**: Integração simultânea com Telegram e WhatsApp
- **Notificações**: Alertas pré-jogo para usuários cadastrados
- **Banco de Dados**: MongoDB Atlas para armazenamento de histórico
- **Resiliência**: Sistema de retry automático e fallback para APIs

## 🛠️ Stack Tecnológica

| Tecnologia       | Uso no Projeto                     |
|------------------|-----------------------------------|
| Node.js          | Runtime principal (v18+)          |
| MongoDB          | Armazenamento de jogos e histórico|
| Telegram API     | Comunicação com usuários          |
| WhatsApp Business| Integração via Twilio             |
| Cheerio          | Web scraping da HLTV              |
| Axios            | Requisições HTTP robustas         |

## 📌 Destaques Técnicos

```javascript
// Exemplo de inovação: Sistema híbrido de scraping + API
async function updateMatches() {
  try {
    // 1. Tenta via API oficial
    const apiData = await fetchFromEsportsAPI(); 
    
    // 2. Fallback para scraping se API falhar
    return apiData || await scrapeHLTVMatches();
  } catch (error) {
    // 3. Sistema de notificação de falhas
    notifyAdmin(`Falha na atualização: ${error.message}`);
  }
}
