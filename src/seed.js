const { connectDB } = require('./database');
const Match = require('../models/Match');

// Dados iniciais da FURIA
const initialMatches = [
  {
    date: new Date('2024-05-20T19:00:00Z'),
    opponent: 'Team Vitality',
    tournament: 'ESL Pro League S19',
    stage: 'Fase de Grupos',
    streamLink: 'https://twitch.tv/esl_cs2',
    isCompleted: false
  },
  {
    date: new Date('2024-05-22T17:30:00Z'),
    opponent: 'Natus Vincere',
    tournament: 'BLAST Premier',
    stage: 'Quartas de Final',
    streamLink: 'https://twitch.tv/blastpremier',
    isCompleted: false
  }
];

async function seedDatabase() {
  await connectDB();
  
  try {
    await Match.deleteMany({});
    await Match.insertMany(initialMatches);
    
    console.log('\x1b[32m%s\x1b[0m', '🌱  Banco de dados semeado com sucesso!');
    console.log('\x1b[33m%s\x1b[0m', `📅  ${initialMatches.length} jogos adicionados`);
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌  Erro ao semear banco de dados:');
    console.error(err);
    process.exit(1);
  }
}

seedDatabase();