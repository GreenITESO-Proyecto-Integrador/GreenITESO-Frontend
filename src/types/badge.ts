export interface Badge {
  id: string;
  name: string;
  description: string;
  points_required: number;
  icon_name: string;
  is_earned: boolean;
  earned_at: string | null;
}
