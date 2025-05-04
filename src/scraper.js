const axios = require('axios');
const cheerio = require('cheerio');
const { HttpsProxyAgent } = require('https-proxy-agent');
const Match = require('../models/Match');

// Configurações avançadas de scraping
const HLTV_CONFIG = {
  url: 'https://www.hltv.org/team/8297/furia#tab-matchesBox',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br'
  },
  timeout: 15000,
  retries: 3,
  retryDelay: 5000
};

// Pool de User-Agents para rotação
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
];

/**
 * Função para fazer requisições com resiliência
 */
async function makeRequest(url, attempt = 1) {
  try {
    const options = {
      headers: {
        ...HLTV_CONFIG.headers,
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
      },
      timeout: HLTV_CONFIG.timeout,
      httpsAgent: process.env.HLTV_PROXY ? new HttpsProxyAgent(process.env.HLTV_PROXY) : undefined
    };

    // Delay aleatório entre requisições
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));

    console.log(`🔎 Tentativa ${attempt} de scraping...`);
    const { data } = await axios.get(url, options);
    return data;

  } catch (error) {
    if (attempt >= HLTV_CONFIG.retries) {
      console.error(`❌ Falha após ${HLTV_CONFIG.retries} tentativas`);
      throw error;
    }

    console.warn(`⚠️ Tentativa ${attempt} falhou. Tentando novamente em ${HLTV_CONFIG.retryDelay/1000}s...`);
    await new Promise(resolve => setTimeout(resolve, HLTV_CONFIG.retryDelay));
    return makeRequest(url, attempt + 1);
  }
}

/**
 * Extrai dados dos jogos da HLTV
 */
async function fetchHLTVMatches() {
  try {
    console.log('🔄 Iniciando scraping com proteção anti-bloqueio...');
    
    const data = await makeRequest(HLTV_CONFIG.url);
    const $ = cheerio.load(data);
    const matches = [];

    // Processa matches upcoming
    $('.upcoming-matches .upcoming-match').each((i, element) => {
      const opponent = $(element).find('.team .team-name').text().trim();
      const tournament = $(element).find('.event .event-name').text().trim();
      const time = $(element).find('.match-time').attr('data-unix');
      const stream = $(element).find('.stream-box').attr('data-stream-embed');

      if (opponent && tournament && time) {
        matches.push({
          date: new Date(parseInt(time)),
          opponent,
          tournament,
          streamLink: stream ? `https://hltv.org${stream}` : null,
          isCompleted: false,
          source: 'hltv'
        });
      }
    });

    // Processa matches results
    $('.results .result').each((i, element) => {
      const opponent = $(element).find('.team .team-name').text().trim();
      const tournament = $(element).find('.event-name').text().trim();
      const score = $(element).find('.score').text().trim().replace(/\s+/g, ' ');
      const time = $(element).find('.date').attr('data-unix');

      if (opponent && tournament && score && time) {
        matches.push({
          date: new Date(parseInt(time)),
          opponent,
          tournament,
          score,
          isCompleted: true,
          source: 'hltv'
        });
      }
    });

    console.log(`✅ ${matches.length} jogos extraídos com sucesso`);
    return matches;

  } catch (error) {
    console.error('❌ Erro crítico no scraping:', {
      status: error.response?.status,
      message: error.message,
      config: {
        url: error.config?.url,
        headers: error.config?.headers
      }
    });
    throw new Error('HLTV_BLOCKED');
  }
}

/**
 * Atualiza o banco de dados de forma segura
 */
async function safeUpdate(match) {
  try {
    const result = await Match.updateOne(
      { 
        date: { 
          $gte: new Date(match.date.getTime() - 3600000), 
          $lte: new Date(match.date.getTime() + 3600000) 
        },
        opponent: match.opponent,
        tournament: match.tournament
      },
      { $set: match },
      { upsert: true }
    );
    return result;
  } catch (error) {
    console.error(`⚠️ Erro ao atualizar jogo vs ${match.opponent}:`, error.message);
    return null;
  }
}

/**
 * Função principal para atualizar os jogos
 */
async function updateMatches() {
  try {
    const hltvMatches = await fetchHLTVMatches();
    let updatedCount = 0;

    for (const [index, match] of hltvMatches.entries()) {
      // Delay progressivo entre atualizações
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 500));
      }

      const result = await safeUpdate(match);
      if (result?.upserted || result?.modified) updatedCount++;
    }

    console.log(`🔄 ${updatedCount} jogos atualizados no banco de dados`);
    return updatedCount;

  } catch (error) {
    if (error.message === 'HLTV_BLOCKED') {
      console.error('🚨 O scraping foi bloqueado pela HLTV. Soluções:');
      console.error('1. Configure um proxy no arquivo .env');
      console.error('2. Espere antes de tentar novamente');
      console.error('3. Considere usar um serviço profissional como ScraperAPI');
    }
    return 0;
  }
}

module.exports = {
  fetchHLTVMatches,
  updateMatches,
  makeRequest
};