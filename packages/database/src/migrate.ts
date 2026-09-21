import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, seedDefaultTemplates, sanitizeErrorMessage } from './client.js';

export async function runMigration() {
  console.log('🚀 Iniciando verificação e migração 100% TypeScript com Drizzle ORM...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrações Drizzle aplicadas.');

    await seedDefaultTemplates();
    console.log('✅ Templates padrão sincronizados via Drizzle insert.');

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
