const { createClient } = require('@supabase/supabase-js');

// Variáveis de ambiente configuradas no painel da Hostinger ou em um arquivo .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Inicialização do cliente Supabase
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Função de teste para verificar a integridade da conexão na Hostinger
async function testarConexao() {
  console.log('==================================================');
  console.log('   MOVIX - TESTADOR DE CONEXÃO SUPABASE (HOSTINGER)   ');
  console.log('==================================================');
  console.log('URL do Supabase:', supabaseUrl ? 'Configurada ✔' : 'FALTANDO ❌');
  console.log('Chave Anon Key:', supabaseKey ? 'Configurada ✔' : 'FALTANDO ❌');
  console.log('==================================================');

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Aviso: As variáveis de ambiente não foram detectadas neste script.');
    console.log('Certifique-se de adicioná-las no painel de gerenciamento da Hostinger.');
    console.log('Para testes rápidos locais, você também pode colar as credenciais diretamente aqui temporariamente.');
    return;
  }

  try {
    console.log('Tentando ler a tabela "distributors" (distribuidores do Movix)...');
    
    // Substituindo 'your_table' por 'distributors' (a tabela principal do seu projeto)
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro na consulta do Supabase:', error.message);
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\nDica: A conexão autenticou, mas a tabela "distributors" não existe.');
        console.log('Abra o arquivo "supabase_schema.sql" deste projeto e execute o código no painel de SQL do Supabase.');
      }
    } else {
      console.log('🎉 SUCESSO! Conectado e autenticado com o Supabase com êxito!');
      console.log('Registro encontrado:', data);
    }
  } catch (err) {
    console.error('❌ Erro inesperado ao conectar:', err.message || err);
  }
}

// Executa o teste de conexão se o script for executado diretamente
if (require.main === module) {
  testarConexao();
}

module.exports = { supabase };
