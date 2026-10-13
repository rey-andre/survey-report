import fs from 'fs';
import path from 'path';

export interface OccupancyItem {
  code: string;
  description: string;
  riskKey: string;
  riskLabel: string;
  score: number;
  rating: string;
  sourceSheet: string;
}

let cachedOccupancies: OccupancyItem[] | null = null;

export function getOccupancyBreakdowns(): OccupancyItem[] {
  if (cachedOccupancies) return cachedOccupancies;

  try {
    const filePath = path.join(process.cwd(), 'prisma', 'occ_breakdown.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      cachedOccupancies = JSON.parse(raw);
      return cachedOccupancies || [];
    }
  } catch (err) {
    console.error('Failed to load occ_breakdown.json:', err);
  }

  return [];
}

export function searchOccupancies(query: string, limit = 20): OccupancyItem[] {
  const all = getOccupancyBreakdowns();
  if (!query || query.trim() === '') {
    return all.slice(0, limit);
  }

  const q = query.toLowerCase().trim();
  return all
    .filter((item) => item.code.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
    .slice(0, limit);
}

export function findOccupancyByCode(code: string): OccupancyItem | null {
  const all = getOccupancyBreakdowns();
  return all.find((item) => item.code === code) || null;
}
