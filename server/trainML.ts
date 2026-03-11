import { mlPipeline } from './ml/real/mlPipeline';
import { getDb } from './db';

async function main() {
    console.log('Orchestrating ML Pipeline Training...');
    const result = await mlPipeline.trainAllModels();
    console.log('Results:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
