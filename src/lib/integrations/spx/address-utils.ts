import { prisma } from '@/lib/prisma';

export interface DistrictInfo {
  id: string;
  name: string;
}

export interface MandalInfo {
  id: string;
  name: string;
  districtId: string;
}

export interface VillageInfo {
  id: string;
  name: string;
  mandalId: string;
}

export interface HierarchyValidationResult {
  valid: boolean;
  hierarchy?: {
    district: DistrictInfo;
    mandal: MandalInfo;
    village: VillageInfo;
  };
  error?: string;
  reason?: string;
}

export interface AddressSearchResult {
  type: 'VILLAGE' | 'MANDAL' | 'DISTRICT';
  id: string;
  name: string;
  villageId?: string;
  villageName?: string;
  mandalId?: string;
  mandalName?: string;
  districtId?: string;
  districtName?: string;
  formattedAddress: string;
}

/**
 * Retrieves all registered Districts from ConfigValue master data.
 */
export async function getDistricts(): Promise<DistrictInfo[]> {
  const records = await prisma.configValue.findMany({
    where: { type: 'DISTRICT' },
    select: { id: true, value: true },
    orderBy: { value: 'asc' },
  });

  return records.map((r) => ({ id: r.id, name: r.value }));
}

/**
 * Retrieves Mandals belonging strictly to a specified District.
 */
export async function getMandalsByDistrict(districtId: string): Promise<MandalInfo[] | null> {
  const district = await prisma.configValue.findFirst({
    where: { id: districtId.trim(), type: 'DISTRICT' },
    select: { id: true, value: true },
  });

  if (!district) return null;

  const records = await prisma.configValue.findMany({
    where: { type: 'MANDAL', parentId: district.id },
    select: { id: true, value: true, parentId: true },
    orderBy: { value: 'asc' },
  });

  return records.map((r) => ({
    id: r.id,
    name: r.value,
    districtId: r.parentId || district.id,
  }));
}

/**
 * Retrieves Villages belonging strictly to a specified Mandal.
 */
export async function getVillagesByMandal(mandalId: string): Promise<VillageInfo[] | null> {
  const mandal = await prisma.configValue.findFirst({
    where: { id: mandalId.trim(), type: 'MANDAL' },
    select: { id: true, value: true },
  });

  if (!mandal) return null;

  const records = await prisma.configValue.findMany({
    where: { type: 'VILLAGE', parentId: mandal.id },
    select: { id: true, value: true, parentId: true },
    orderBy: { value: 'asc' },
  });

  return records.map((r) => ({
    id: r.id,
    name: r.value,
    mandalId: r.parentId || mandal.id,
  }));
}

/**
 * Searches across Villages, Mandals, and Districts by name.
 * For any matching village or mandal, resolves the complete parent hierarchy.
 * Returns distinct candidate hierarchies for disambiguating duplicate village names.
 */
export async function searchAddresses(query: string, limit: number = 20): Promise<AddressSearchResult[]> {
  const cleanQ = query.trim();
  if (cleanQ.length < 2) return [];

  // 1. Search matching Villages
  const villages = await prisma.configValue.findMany({
    where: {
      type: 'VILLAGE',
      value: { contains: cleanQ, mode: 'insensitive' },
    },
    select: {
      id: true,
      value: true,
      parentId: true,
      parent: {
        select: {
          id: true,
          value: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              value: true,
            },
          },
        },
      },
    },
    take: limit,
  });

  const results: AddressSearchResult[] = [];

  for (const v of villages) {
    const mandal = v.parent;
    const district = mandal?.parent;

    results.push({
      type: 'VILLAGE',
      id: v.id,
      name: v.value,
      villageId: v.id,
      villageName: v.value,
      mandalId: mandal?.id,
      mandalName: mandal?.value,
      districtId: district?.id,
      districtName: district?.value,
      formattedAddress: `${v.value}, ${mandal?.value || 'Unknown'} Mandal, ${district?.value || 'Unknown'} District`,
    });
  }

  // 2. Search matching Mandals if capacity remains
  if (results.length < limit) {
    const remaining = limit - results.length;
    const mandals = await prisma.configValue.findMany({
      where: {
        type: 'MANDAL',
        value: { contains: cleanQ, mode: 'insensitive' },
      },
      select: {
        id: true,
        value: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            value: true,
          },
        },
      },
      take: remaining,
    });

    for (const m of mandals) {
      const district = m.parent;
      results.push({
        type: 'MANDAL',
        id: m.id,
        name: m.value,
        mandalId: m.id,
        mandalName: m.value,
        districtId: district?.id,
        districtName: district?.value,
        formattedAddress: `${m.value} Mandal, ${district?.value || 'Unknown'} District`,
      });
    }
  }

  return results;
}

/**
 * Validates that District -> Mandal -> Village are mathematically and relationally correct.
 * Rejects mismatched hierarchies (e.g. Village belonging to a different Mandal).
 */
export async function validateAddressHierarchy(
  districtId: string,
  mandalId: string,
  villageId: string
): Promise<HierarchyValidationResult> {
  const cleanDistrictId = districtId?.trim();
  const cleanMandalId = mandalId?.trim();
  const cleanVillageId = villageId?.trim();

  if (!cleanDistrictId || !cleanMandalId || !cleanVillageId) {
    return {
      valid: false,
      error: 'MISSING_HIERARCHY_IDS',
      reason: 'districtId, mandalId, and villageId are all required for hierarchical address validation.',
    };
  }

  // Fetch Village along with its parent Mandal and parent's parent District in one query
  const village = await prisma.configValue.findFirst({
    where: { id: cleanVillageId, type: 'VILLAGE' },
    select: {
      id: true,
      value: true,
      parentId: true,
      parent: {
        select: {
          id: true,
          value: true,
          type: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              value: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!village) {
    return {
      valid: false,
      error: 'VILLAGE_NOT_FOUND',
      reason: `Village with ID '${cleanVillageId}' does not exist in the address master database.`,
    };
  }

  const mandal = village.parent;
  if (!mandal || mandal.id !== cleanMandalId || mandal.type !== 'MANDAL') {
    return {
      valid: false,
      error: 'MANDAL_MISMATCH',
      reason: `Village '${village.value}' belongs to Mandal ID '${village.parentId}', not the submitted Mandal ID '${cleanMandalId}'.`,
    };
  }

  const district = mandal.parent;
  if (!district || district.id !== cleanDistrictId || district.type !== 'DISTRICT') {
    return {
      valid: false,
      error: 'DISTRICT_MISMATCH',
      reason: `Mandal '${mandal.value}' belongs to District ID '${mandal.parentId}', not the submitted District ID '${cleanDistrictId}'.`,
    };
  }

  return {
    valid: true,
    hierarchy: {
      district: { id: district.id, name: district.value },
      mandal: { id: mandal.id, name: mandal.value, districtId: district.id },
      village: { id: village.id, name: village.value, mandalId: mandal.id },
    },
  };
}

