export interface CheckinAggregation {
  sessionsCompleted: number;
  sessionsPlanned: number;
  avgSleep: number;
  avgSoreness: number;
  avgStress: number;
  hasPainFlag: boolean;
  adherenceRate: number;
}

export function aggregateCheckins(checkins: any[], daysPerWeek: number): CheckinAggregation {
  const sessionsCompleted = checkins.filter(c => c.sessionCompleted).length;
  const avgSleep = checkins.length > 0
    ? checkins.reduce((acc, c) => acc + (parseFloat(c.sleepHours) || 0), 0) / checkins.length
    : 8;
  const avgSoreness = checkins.length > 0
    ? checkins.reduce((acc, c) => acc + (c.soreness1to10 || 0), 0) / checkins.length
    : 1;
  const avgStress = checkins.length > 0
    ? checkins.reduce((acc, c) => acc + (c.stress1to10 || 0), 0) / checkins.length
    : 1;
  
  const hasPainFlag = checkins.some(c => c.painFlag && c.painFlag !== "null" && c.painFlag !== "");

  return {
    sessionsCompleted,
    sessionsPlanned: daysPerWeek,
    avgSleep,
    avgSoreness,
    avgStress,
    hasPainFlag,
    adherenceRate: daysPerWeek > 0 ? sessionsCompleted / daysPerWeek : 0,
  };
}

export function classifyWeek({
  currentWeekCheckins,
  prevWeekCheckins,
  daysPerWeek,
  totalLoggedWeeks,
}: {
  currentWeekCheckins: any[];
  prevWeekCheckins: any[];
  daysPerWeek: number;
  totalLoggedWeeks: number;
}) {
  // Aggregate current week
  const currentAgg = aggregateCheckins(currentWeekCheckins, daysPerWeek);

  // Rule 1: Injury Signal
  if (currentAgg.hasPainFlag) {
    return "injury_signal";
  }

  // Rule 2: Life Disruption (Adherence < 60%)
  if (currentAgg.adherenceRate < 0.6) {
    return "life_disruption";
  }

  // Rule 3: Under Recovery
  if (currentAgg.avgSleep < 6 && (currentAgg.avgStress >= 7 || currentAgg.avgSoreness >= 7)) {
    return "under_recovery";
  }

  // Rule 4: Not enough data (Only 1 week of data exists)
  if (totalLoggedWeeks <= 1) {
    return null;
  }

  // Rule 5 & 6: Stagnant lifts (Plateaus)
  // Find max working weights for all lifts this week vs prior week
  const currentMaxWeights: { [lift: string]: number } = {};
  currentWeekCheckins.forEach(c => {
    try {
      const exercises = JSON.parse(c.exercisesLogged || "[]");
      exercises.forEach((ex: any) => {
        if (!ex.name) return;
        const name = ex.name.toLowerCase().trim();
        const maxWeight = ex.actual_sets 
          ? Math.max(...ex.actual_sets.map((s: any) => parseFloat(s.weight_kg) || 0), 0)
          : 0;
        if (maxWeight > 0) {
          currentMaxWeights[name] = Math.max(currentMaxWeights[name] || 0, maxWeight);
        }
      });
    } catch (e) {}
  });

  const prevMaxWeights: { [lift: string]: number } = {};
  prevWeekCheckins.forEach(c => {
    try {
      const exercises = JSON.parse(c.exercisesLogged || "[]");
      exercises.forEach((ex: any) => {
        if (!ex.name) return;
        const name = ex.name.toLowerCase().trim();
        const maxWeight = ex.actual_sets 
          ? Math.max(...ex.actual_sets.map((s: any) => parseFloat(s.weight_kg) || 0), 0)
          : 0;
        if (maxWeight > 0) {
          prevMaxWeights[name] = Math.max(prevMaxWeights[name] || 0, maxWeight);
        }
      });
    } catch (e) {}
  });

  // Count stagnant lifts
  let stagnantLiftCount = 0;
  Object.keys(currentMaxWeights).forEach(lift => {
    if (prevMaxWeights[lift] !== undefined) {
      if (currentMaxWeights[lift] <= prevMaxWeights[lift]) {
        stagnantLiftCount++;
      }
    }
  });

  // Apply plateau rules
  if (stagnantLiftCount >= 2 && stagnantLiftCount <= 2 && currentAgg.adherenceRate >= 0.8) {
    return "true_plateau_localized";
  }

  if (stagnantLiftCount >= 3 && currentAgg.adherenceRate >= 0.8) {
    return "true_plateau_systemic";
  }

  // Fallback: Bad Day / Isolated underperformance
  return "bad_day_session";
}
