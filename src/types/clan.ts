export type ClanType = 'INSTITUTIONAL' | 'PRIVATE' | (string & {});

export interface Clan {
  id: string;
  name: string;
  type: ClanType;
}
