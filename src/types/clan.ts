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
  /** Nickname, else full name; never the email. Empty from older backends. */
  displayName: string;
  /** Profile photo URL; empty when the member has none. */
  avatarUrl: string;
  /** Image of the member's active avatar frame; empty when none. */
  frameUrl: string;
  /** Image of the member's active profile background; empty when none. */
  backgroundUrl: string;
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

/** A pending request to join an invite-only clan (`GET /clans/{id}/requests/`, leader only). */
export interface ClanJoinRequest {
  id: string;
  clanId: string;
  userId: string;
  nickname: string;
  /** Nickname, else full name; never the email. Empty from older backends. */
  displayName: string;
  joinedAt: string;
}

export interface CreateClanPayload {
  name: string;
  description: string;
  privacy: ClanPrivacy;
}

/** Fields the leader can change (`PATCH /clans/{id}/`); omitted ones stay as they are. */
export type UpdateClanPayload = Partial<CreateClanPayload>;

/** An active single-use invite code as listed to the leader; the full code is never listed. */
export interface ClanInvitation {
  id: string;
  /** Last four characters, enough to tell active codes apart. */
  codeHint: string;
  expiresAt: string;
  createdAt: string;
}

/** A freshly generated invite code: the only time the full `code` (`XXXX-XXXX`) is returned. */
export interface ClanInvitationCreated {
  id: string;
  code: string;
  expiresAt: string;
}
