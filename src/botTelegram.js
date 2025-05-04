require('dotenv').config();
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const { initScheduler, forceUpdate } = require('./scheduler');
const Match = require('../models/Match');

// Configuração robusta de conexão
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Erro MongoDB:', err));

// Configuração do bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
      limit: 100
    }
  },
  request: {
    proxy: process.env.PROXY || null,
    timeout: 15000
  }
});

// Inicia o agendador
initScheduler();

// ======================
// FUNÇÕES AUXILIARES
// ======================

function formatDate(date) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function getUpcomingMatches(limit = 5) {
  return Match.find({ 
    isCompleted: false,
    date: { $gte: new Date() }
  })
  .sort('date')
  .limit(limit);
}

async function getRecentResults(limit = 5) {
  return Match.find({ 
    isCompleted: true 
  })
  .sort('-date')
  .limit(limit);
}

// ======================
// HANDLERS PRINCIPAIS
// ======================

// Menu de comandos
bot.setMyCommands([
  { command: 'start', description: 'Iniciar o bot' },
  { command: 'proximos', description: 'Próximos jogos' },
  { command: 'resultados', description: 'Últimos resultados' },
  { command: 'onde', description: 'Onde assistir' },
  { command: 'notificar', description: 'Ativar notificações' },
  { command: 'atualizar', description: 'Forçar atualização (admin)' }
]);

// Handler para /start
bot.onText(/\/start/, (msg) => {
  const options = {
    reply_markup: {
      keyboard: [
        ['📅 Próximos Jogos', '🏆 Últimos Resultados'],
        ['📺 Onde Assistir', '🔔 Ativar Notificações']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    },
    parse_mode: 'Markdown'
  };

  bot.sendMessage(
    msg.chat.id,
    `🎮 *Olá ${msg.from.first_name}!* Sou o assistente oficial da *FURIA Esports* 🐯\n\n` +
    'Posso te informar sobre:\n' +
    '• Próximos jogos do time\n' +
    '• Resultados recentes\n' +
    '• Onde assistir as partidas\n\n' +
    'Escolha uma opção abaixo ou use os comandos: /proximos, /resultados, /onde',
    options
  );
});

// Handler para próximos jogos
bot.onText(/\/proximos|📅 próximos jogos/i, async (msg) => {
  try {
    const matches = await getUpcomingMatches();
    
    if (!matches.length) {
      return bot.sendMessage(msg.chat.id, 
        '🏟️ Nenhum jogo agendado no momento.\n\n' +
        'Os próximos jogos serão anunciados em breve!'
      );
    }

    let response = '🐯 *PRÓXIMOS JOGOS DA FURIA* 🐯\n\n';
    matches.forEach(match => {
      response += `*⏰ Data:* ${formatDate(match.date)}\n`;
      response += `*⚔️ Adversário:* ${match.opponent}\n`;
      response += `*🏆 Torneio:* ${match.tournament}\n`;
      if (match.streamLink) {
        response += `*🔴 Transmissão:* [Assistir](${match.streamLink})\n\n`;
      } else {
        response += `*🔴 Transmissão:* Em breve\n\n`;
      }
    });

    bot.sendMessage(msg.chat.id, response, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error('Erro ao buscar jogos:', err);
    bot.sendMessage(msg.chat.id, 
      '❌ Ocorreu um erro ao buscar os jogos.\n\n' +
      'Tente novamente mais tarde ou consulte nosso site: [FURIA.gg](https://furia.gg)',
      { parse_mode: 'Markdown' }
    );
  }
});

// Handler para atualização manual (admin)
bot.onText(/\/atualizar/, async (msg) => {
  if (String(msg.from.id) !== process.env.ADMIN_ID) {
    return bot.sendMessage(msg.chat.id, '❌ Acesso restrito a administradores.');
  }

  const loadingMsg = await bot.sendMessage(msg.chat.id, '🔄 Atualizando dados da HLTV...');
  
  try {
    const updatedCount = await forceUpdate();
    bot.editMessageText(
      `✅ ${updatedCount} jogos atualizados com sucesso!\n\n` +
      `Próxima atualização automática em ~6 horas.`,
      {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    bot.editMessageText(
      `❌ Falha na atualização: ${error.message}\n\n` +
      'Verifique os logs para mais detalhes.',
      {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id
      }
    );
  }
});

// ======================
// CONFIGURAÇÕES FINAIS
// ======================

// Log de erros do polling
bot.on('polling_error', (error) => {
  console.error('❌ Erro no polling:', error.code, error.message);
  setTimeout(() => {
    console.log('🔄 Reiniciando polling...');
    bot.startPolling();
  }, 5000);
});

// Log de mensagens recebidas
bot.on('message', (msg) => {
  if (!msg.text) return;
  console.log(`📩 [${msg.from.id}] ${msg.text}`);
});

console.log('🤖 Bot da FURIA iniciado com sucesso!');

