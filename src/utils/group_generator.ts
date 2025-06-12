type MBTI =
  | "ISTJ" | "ISTP" | "ESTJ" | "ESTP"
  | "ISFJ" | "ENFP" | "INTP" | "ISFP"
  | "INFP" | "ESFP" | "ENTP" | "INTJ"
  | "ESFJ" | "ENTJ" | "INFJ" | "ENFJ";

const maleDist: Record<MBTI, number> = {
  ISTJ: 20.9, ISTP: 13.0, ESTJ: 10.6, ESTP: 7.1,
  ISFJ: 5.9, ENFP: 5.6, INTP: 5.4, ISFP: 5.3,
  INFP: 4.6, ESFP: 4.6, ENTP: 4.3, INTJ: 4.0,
  ESFJ: 3.6, ENTJ: 2.2, INFJ: 1.5, ENFJ: 1.4,
};

const femaleDist: Record<MBTI, number> = {
  ISFJ: 14.9, ISTJ: 14.5, ENFP: 9.2, ESFJ: 8.6,
  INFP: 8.0, ISFP: 7.9, ISTP: 6.1, ESFP: 5.7,
  ESTJ: 5.6, INFJ: 4.2, INTP: 3.6, ENFJ: 3.2,
  ESTP: 3.0, INTJ: 2.2, ENTP: 1.8, ENTJ: 1.4,
};

// Combine and normalize the "human" distribution
function getNormalizedDistribution(): Record<MBTI, number> {
  const combined: Record<MBTI, number> = {} as Record<MBTI, number>;

  for (const type in maleDist) {
    combined[type as MBTI] = maleDist[type as MBTI] + femaleDist[type as MBTI];
  }

  const total = Object.values(combined).reduce((acc, val) => acc + val, 0);
  for (const type in combined) {
    combined[type as MBTI] = combined[type as MBTI] / total;
  }

  return combined;
}

// Sample a single MBTI from the pool based on weights
function weightedSample(dist: Record<MBTI, number>, count: number): MBTI[] {
  const entries = Object.entries(dist);
  const selected: MBTI[] = [];

  while (selected.length < count && entries.length > 0) {
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
    const rand = Math.random() * totalWeight;
    let acc = 0;

    for (let i = 0; i < entries.length; i++) {
      const [type, weight] = entries[i];
      acc += weight;
      if (rand <= acc) {
        selected.push(type as MBTI);
        entries.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

// Main export: generate 12 unique groups of 4 MBTI types
export function generatePersonalityGroups(limit:number): MBTI[][] {
  const dist = getNormalizedDistribution();
  const allGroups: MBTI[][] = [];

  for (let i = 0; i < limit; i++) {
    // Create a fresh pool for this group (copy of dist)
    const availableForGroup = { ...dist };

    // Sample 4 unique MBTI types for this group
    const group = weightedSample(availableForGroup, 4);
    allGroups.push(group);
  }

  return allGroups;
}

