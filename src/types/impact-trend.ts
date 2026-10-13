/** One week of impact totals (GET /api/v1/profile/me/impact-trend/). */
export interface ImpactTrendPoint {
  weekStart: string;
  co2Kg: number;
  waterLiters: number;
  plasticKg: number;
}
