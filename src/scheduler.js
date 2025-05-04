const schedule = require('node-schedule');
const { updateMatches } = require('./scraper');

// Agenda com padronização robusta
const initScheduler = () => {
  // Configuração de horários variados para evitar padrão detectável
  const schedules = [
    '0 8 * * *',   // 08:00 AM
    '0 14 * * *',  // 02:00 PM 
    '0 20 * * *',  // 08:00 PM
    '0 2 * * *'    // 02:00 AM
  ];

  // Execução imediata ao iniciar
  console.log('🔍 Executando primeira atualização...');
  updateMatches().then(() => {
    console.log('✅ Primeira atualização concluída');
  });

  // Configura múltiplos agendamentos
  schedules.forEach((cronPattern, idx) => {
    schedule.scheduleJob(`ScraperJob-${idx}`, cronPattern, async () => {
      console.log(`⏰ Executando atualização agendada (Job ${idx + 1})`);
      try {
        await updateMatches();
      } catch (error) {
        console.error(`❌ Erro no job ${idx + 1}:`, error);
      }
    });
  });

  console.log(`🔄 ${schedules.length} agendamentos configurados`);
};

// Função para forçar atualização
const forceUpdate = async () => {
  console.log('🔧 Forçando atualização manual...');
  return await updateMatches();
};

module.exports = {
  initScheduler,
  forceUpdate
};