require('dotenv').config();
const mongoose = require('mongoose');

// Conexão com MongoDB Atlas + Tratamento de erros
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout após 5 segundos
    });
    
    console.log('\x1b[32m%s\x1b[0m', '✅  Conexão com MongoDB estabelecida com sucesso!');
    console.log('\x1b[36m%s\x1b[0m', `📊  Database: ${mongoose.connection.name}`);
    console.log('\x1b[33m%s\x1b[0m', '🔄  Verificando dados de teste...');

    // Teste de leitura/escrita
    const testDoc = await mongoose.connection.db.collection('test').insertOne({
      message: "Teste de conexão FURIA eSports",
      timestamp: new Date()
    });
    
    console.log('\x1b[32m%s\x1b[0m', `📝  Documento de teste inserido (ID: ${testDoc.insertedId})`);

  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌  Falha na conexão com MongoDB:');
    console.error('\x1b[31m%s\x1b[0m', `   → ${err.message}`);
    console.log('\x1b[33m%s\x1b[0m', '🔍  Verifique:');
    console.log('   1. String de conexão no .env');
    console.log('   2. Permissões de IP no Atlas');
    console.log('   3. Usuário/senha do banco');
    process.exit(1); // Encerra o aplicativo com erro
  }
};

module.exports = {
  connectDB,
  mongoose
};