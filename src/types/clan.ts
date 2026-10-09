export type ClanType = 'INSTITUTIONAL' | 'PRIVATE' | (string & {});

export interface Clan {
  id: string;
  name: string;
  type: ClanType;
}

export type ClanPrivacy = 'PUBLIC' | 'PRIVATE_INVITE';
export type ClanMemberRole = 'LEADER' | 'MEMBER';
export type ClanMembershipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

/** A clan as listed in the clans directory (`GET /clans/`). */
export interface ClanListItem extends Clan {
  description: string;
  privacy: ClanPrivacy;
  totalPoints: number;
  createdAt: string;
}

export interface ClanMember {
  userId: string;
  nickname: string;
  role: ClanMemberRole;
  joinedAt: string;
}

/** A clan profile (`GET /clans/{id}/`): the list item plus its accepted roster. */
export interface ClanDetail extends ClanListItem {
  members: ClanMember[];
  memberCount: number;
}

/** Result of join / select-active / transfer-leadership calls. */
export interface ClanMembership {
  id: string;
  clanId: string;
  userId: string;
  role: ClanMemberRole;
  status: ClanMembershipStatus;
  isActivePrivate: boolean;
  joinedAt: string;
}

export interface CreateClanPayload {
  name: string;
  description: string;
  privacy: ClanPrivacy;
}
