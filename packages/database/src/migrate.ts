import { db, seedDefaultTemplates, sanitizeErrorMessage } from './client.js';
import * as schema from './schema/index.js';

export async function runMigration() {
  console.log('🚀 Iniciando verificação e migração 100% TypeScript com Drizzle ORM...');

  try {
    // 1. Verificar conexão e contagem de templates via Drizzle ORM
    const templatesList = await db.select().from(schema.templates);
    console.log(`✅ Conexão estabelecida com sucesso via Drizzle ORM. Templates ativos: ${templatesList.length}`);

    // 2. Garantir templates padrões populados de forma type-safe
    await seedDefaultTemplates();
    console.log('✅ Templates padrão sincronizados via Drizzle insert.');

    // 3. Verificar integridade das tabelas Drizzle
    const platesList = await db.select().from(schema.plates);
    const redirectsList = await db.select().from(schema.redirects);
    console.log(`✅ Schema Drizzle validado: ${platesList.length} placas e ${redirectsList.length} redirecionamentos encontrados.`);

    console.log('✨ Migração e validação concluídas com sucesso!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Falha na migração TypeScript:', sanitizeErrorMessage(error.message));
    process.exit(1);
  }
}

if (process.argv[1]?.includes('migrate')) {
  runMigration();
}
