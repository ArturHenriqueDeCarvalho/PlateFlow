import type { IPlateRepository } from '../../repositories/IPlateRepository.js';
import type { IRedirectRepository } from '../../repositories/IRedirectRepository.js';
import type { ITemplateRepository } from '../../repositories/ITemplateRepository.js';
import type { BatchGenerationParams, PhysicalPlate, DynamicRedirect } from '../../entities/index.js';

export type CreateBatchInput =
  | BatchGenerationParams
  | { plates: PhysicalPlate[]; redirects?: DynamicRedirect[] };

export class CreateBatchPlatesUseCase {
  constructor(
    private plateRepo: IPlateRepository,
    private redirectRepo: IRedirectRepository,
    private templateRepo: ITemplateRepository
  ) {}

  async execute(params: any): Promise<{ plates: PhysicalPlate[]; redirects: DynamicRedirect[] }> {
    // 1. Client passed pre-generated plates and redirects
    if (Array.isArray(params?.plates) && params.plates.length > 0) {
      const incomingPlates: PhysicalPlate[] = params.plates;
      const incomingRedirects: DynamicRedirect[] = Array.isArray(params.redirects) ? params.redirects : [];
      const now = new Date().toISOString();

      const redirectMap = new Map(incomingRedirects.map((r) => [r.slug.toLowerCase(), r]));
      const completeRedirects: DynamicRedirect[] = [...incomingRedirects];

      for (const plate of incomingPlates) {
        if (!redirectMap.has(plate.slug.toLowerCase())) {
          const autoRedirect: DynamicRedirect = {
            id: `redir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            slug: plate.slug,
            type: 'url',
            title: plate.customerNotes || `Placa #${plate.plateNumber}`,
            destinationUrl: '',
            status: 'virgin',
            clicks: 0,
            metadata: {},
            createdAt: now,
            updatedAt: now,
          };
          redirectMap.set(plate.slug.toLowerCase(), autoRedirect);
          completeRedirects.push(autoRedirect);
        }
      }

      const savedRedirects = await this.redirectRepo.createBatch(completeRedirects);
      const savedPlates = await this.plateRepo.createBatch(incomingPlates);

      return { plates: savedPlates, redirects: savedRedirects };
    }

    // 2. Client passed raw batch generation parameters
    const { templateId, batchIdentifier, quantity, prefix, customerNotesPrefix, initialType = 'url' } = params || {};

    if (!templateId || !batchIdentifier || !quantity || quantity < 1) {
      throw new Error('Parâmetros inválidos para geração em lote.');
    }

    const cleanBatch = batchIdentifier.trim().toUpperCase();
    const cleanPrefix = (prefix || 'placa').toLowerCase().replace(/[^a-z0-9-_]/g, '');

    const newPlates: PhysicalPlate[] = [];
    const newRedirects: DynamicRedirect[] = [];
    const now = new Date().toISOString();

    for (let i = 1; i <= quantity; i++) {
      const padNum = String(i).padStart(2, '0');
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${cleanPrefix}-${padNum}`;
      const plateId = `plate-${cleanBatch}-${padNum}-${randomSuffix}`;

      newRedirects.push({
        id: `redir-${cleanBatch}-${padNum}-${randomSuffix}`,
        slug,
        type: initialType,
        title: `${customerNotesPrefix || 'Placa'} #${padNum}`,
        destinationUrl: '',
        status: 'virgin',
        clicks: 0,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      newPlates.push({
        id: plateId,
        slug,
        templateId,
        batchIdentifier: cleanBatch,
        plateNumber: i,
        customerNotes: `${customerNotesPrefix || 'Placa'} #${padNum}`,
        nfcWritten: false,
        createdAt: now,
      });
    }

    // Persist redirects first (as plates reference slugs/redirects)
    const savedRedirects = await this.redirectRepo.createBatch(newRedirects);
    const savedPlates = await this.plateRepo.createBatch(newPlates);

    return { plates: savedPlates, redirects: savedRedirects };
  }
}
