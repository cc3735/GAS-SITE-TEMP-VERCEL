/**
 * Loyalty Program Service
 *
 * Complete loyalty and rewards system:
 * - Points earning and redemption
 * - Tiered membership levels
 * - Rewards catalog
 * - Referral bonuses
 * - Birthday rewards
 *
 * @module services/loyalty-program
 */

import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyMember {
  id: string;
  customerId: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tier: LoyaltyTier;
  currentPoints: number;
  lifetimePoints: number;
  pointsRedeemed: number;
  tierProgressPoints: number;
  tierSince: Date;
  birthday?: string; // MM-DD
  referralCode: string;
  referredBy?: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface PointsTransaction {
  id: string;
  memberId: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'expired' | 'adjustment';
  points: number;
  orderId?: string;
  rewardId?: string;
  description: string;
  balance: number;
  createdAt: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount_percent' | 'discount_amount' | 'free_item' | 'upgrade';
  value: number;
  itemName?: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  tierRequired?: LoyaltyTier;
  isActive: boolean;
  expirationDays?: number;
  usageLimit?: number;
  validDays?: number[];
}

export interface RedeemedReward {
  id: string;
  memberId: string;
  rewardId: string;
  reward: Reward;
  code: string;
  status: 'active' | 'used' | 'expired';
  usedAt?: Date;
  expiresAt: Date;
  orderId?: string;
  createdAt: Date;
}

export interface TierConfig {
  tier: LoyaltyTier;
  name: string;
  minPoints: number;
  pointsMultiplier: number;
  perks: string[];
  birthdayBonus: number;
  referralBonus: number;
}

export interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  membersByTier: Record<LoyaltyTier, number>;
  topMembers: Array<{ member: LoyaltyMember; rank: number }>;
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

const TIER_CONFIG: TierConfig[] = [
  {
    tier: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    pointsMultiplier: 1.0,
    perks: ['Earn 1 point per $1 spent', 'Birthday reward'],
    birthdayBonus: 50,
    referralBonus: 25,
  },
  {
    tier: 'silver',
    name: 'Silver',
    minPoints: 500,
    pointsMultiplier: 1.25,
    perks: ['Earn 1.25 points per $1 spent', 'Birthday reward', 'Free side on orders over $20'],
    birthdayBonus: 100,
    referralBonus: 50,
  },
  {
    tier: 'gold',
    name: 'Gold',
    minPoints: 1500,
    pointsMultiplier: 1.5,
    perks: ['Earn 1.5 points per $1 spent', 'Birthday reward', 'Free drink with any order', '10% off on Wednesdays'],
    birthdayBonus: 200,
    referralBonus: 100,
  },
  {
    tier: 'platinum',
    name: 'Platinum',
    minPoints: 5000,
    pointsMultiplier: 2.0,
    perks: ['Earn 2 points per $1 spent', 'Birthday reward', 'Free side with any order', '15% off always', 'Priority pickup'],
    birthdayBonus: 500,
    referralBonus: 200,
  },
];

// ============================================================================
// REWARDS CATALOG
// ============================================================================

const DEFAULT_REWARDS: Omit<Reward, 'id'>[] = [
  {
    name: 'Free Side',
    description: 'Get any side for free with your order',
    pointsCost: 100,
    type: 'free_item',
    value: 3.99,
    itemName: 'Any Side',
    isActive: true,
    expirationDays: 30,
  },
  {
    name: 'Free Drink',
    description: 'Get any drink for free with your order',
    pointsCost: 75,
    type: 'free_item',
    value: 2.99,
    itemName: 'Any Drink',
    isActive: true,
    expirationDays: 30,
  },
  {
    name: '$5 Off',
    description: 'Save $5 on any order of $15 or more',
    pointsCost: 200,
    type: 'discount_amount',
    value: 5,
    minOrderAmount: 15,
    isActive: true,
    expirationDays: 30,
  },
  {
    name: '$10 Off',
    description: 'Save $10 on any order of $25 or more',
    pointsCost: 350,
    type: 'discount_amount',
    value: 10,
    minOrderAmount: 25,
    isActive: true,
    expirationDays: 30,
  },
  {
    name: '15% Off',
    description: 'Get 15% off your entire order',
    pointsCost: 400,
    type: 'discount_percent',
    value: 15,
    maxDiscount: 20,
    isActive: true,
    expirationDays: 30,
  },
  {
    name: 'Free Dessert',
    description: 'Free Peach Cobbler or Banana Pudding',
    pointsCost: 150,
    type: 'free_item',
    value: 6.99,
    itemName: 'Dessert',
    isActive: true,
    expirationDays: 30,
  },
  {
    name: 'Meat Upgrade',
    description: 'Upgrade any sandwich to a plate for free',
    pointsCost: 175,
    type: 'upgrade',
    value: 5,
    isActive: true,
    expirationDays: 30,
  },
  {
    name: 'Free BBQ Sandwich',
    description: 'Get a free BBQ Sandwich (any meat)',
    pointsCost: 500,
    type: 'free_item',
    value: 11.99,
    itemName: 'BBQ Sandwich',
    tierRequired: 'silver',
    isActive: true,
    expirationDays: 30,
  },
  {
    name: 'Free Plate',
    description: 'Get any plate free (includes 2 sides)',
    pointsCost: 800,
    type: 'free_item',
    value: 16.99,
    itemName: 'Any Plate',
    tierRequired: 'gold',
    isActive: true,
    expirationDays: 30,
  },
];

// ============================================================================
// LOYALTY PROGRAM SERVICE
// ============================================================================

export class LoyaltyProgramService {
  // ==========================================================================
  // MEMBER MANAGEMENT
  // ==========================================================================

  /**
   * Enroll new member
   */
  async enrollMember(data: {
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    birthday?: string;
    referralCode?: string;
  }): Promise<LoyaltyMember> {
    // Check for existing member
    const existing = await this.getMemberByPhone(data.phone);
    if (existing) {
      throw new Error('Phone number already enrolled');
    }

    // Generate referral code
    const referralCode = this.generateReferralCode();

    // Handle referral
    let referredBy: string | undefined;
    if (data.referralCode) {
      const referrer = await this.getMemberByReferralCode(data.referralCode);
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    const member: LoyaltyMember = {
      id: uuidv4(),
      customerId: uuidv4(),
      phone: data.phone,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      tier: 'bronze',
      currentPoints: 0,
      lifetimePoints: 0,
      pointsRedeemed: 0,
      tierProgressPoints: 0,
      tierSince: new Date(),
      birthday: data.birthday,
      referralCode,
      referredBy,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date(),
    };

    // Welcome bonus
    member.currentPoints = 50;
    member.lifetimePoints = 50;

    const { error } = await supabase.from('loyalty_members').insert({
      id: member.id,
      customer_id: member.customerId,
      phone: member.phone,
      email: member.email,
      first_name: member.firstName,
      last_name: member.lastName,
      tier: member.tier,
      current_points: member.currentPoints,
      lifetime_points: member.lifetimePoints,
      points_redeemed: member.pointsRedeemed,
      tier_progress_points: member.tierProgressPoints,
      tier_since: member.tierSince.toISOString(),
      birthday: member.birthday,
      referral_code: member.referralCode,
      referred_by: member.referredBy,
      total_orders: member.totalOrders,
      total_spent: member.totalSpent,
      created_at: member.createdAt.toISOString(),
    });

    if (error) throw error;

    // Log welcome bonus
    await this.logPointsTransaction({
      memberId: member.id,
      type: 'bonus',
      points: 50,
      description: 'Welcome bonus',
      balance: member.currentPoints,
    });

    // Process referral bonus
    if (referredBy) {
      await this.processReferralBonus(referredBy);
    }

    logger.info(`New loyalty member enrolled: ${member.phone}`);
    return member;
  }

  /**
   * Get member by phone
   */
  async getMemberByPhone(phone: string): Promise<LoyaltyMember | null> {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) return null;
    return this.mapRowToMember(data);
  }

  /**
   * Get member by referral code
   */
  async getMemberByReferralCode(code: string): Promise<LoyaltyMember | null> {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select('*')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error || !data) return null;
    return this.mapRowToMember(data);
  }

  /**
   * Get member by ID
   */
  async getMember(memberId: string): Promise<LoyaltyMember | null> {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error || !data) return null;
    return this.mapRowToMember(data);
  }

  // ==========================================================================
  // POINTS MANAGEMENT
  // ==========================================================================

  /**
   * Award points for an order
   */
  async awardOrderPoints(memberId: string, orderAmount: number, orderId: string): Promise<number> {
    const member = await this.getMember(memberId);
    if (!member) throw new Error('Member not found');

    const tierConfig = this.getTierConfig(member.tier);
    const basePoints = Math.floor(orderAmount);
    const earnedPoints = Math.floor(basePoints * tierConfig.pointsMultiplier);

    // Update member
    const newCurrentPoints = member.currentPoints + earnedPoints;
    const newLifetimePoints = member.lifetimePoints + earnedPoints;
    const newTierProgressPoints = member.tierProgressPoints + earnedPoints;

    await supabase.from('loyalty_members').update({
      current_points: newCurrentPoints,
      lifetime_points: newLifetimePoints,
      tier_progress_points: newTierProgressPoints,
      total_orders: member.totalOrders + 1,
      total_spent: member.totalSpent + orderAmount,
      last_visit: new Date().toISOString(),
    }).eq('id', memberId);

    // Log transaction
    await this.logPointsTransaction({
      memberId,
      type: 'earned',
      points: earnedPoints,
      orderId,
      description: `Earned from order (${tierConfig.pointsMultiplier}x multiplier)`,
      balance: newCurrentPoints,
    });

    // Check tier upgrade
    await this.checkTierUpgrade(memberId, newTierProgressPoints);

    logger.info(`Awarded ${earnedPoints} points to member ${memberId}`);
    return earnedPoints;
  }

  /**
   * Redeem points for reward
   */
  async redeemReward(memberId: string, rewardId: string): Promise<RedeemedReward> {
    const member = await this.getMember(memberId);
    if (!member) throw new Error('Member not found');

    const reward = await this.getReward(rewardId);
    if (!reward) throw new Error('Reward not found');

    if (!reward.isActive) throw new Error('Reward is no longer available');

    if (reward.tierRequired && !this.meetsMinTier(member.tier, reward.tierRequired)) {
      throw new Error(`Requires ${reward.tierRequired} tier or higher`);
    }

    if (member.currentPoints < reward.pointsCost) {
      throw new Error(`Not enough points. Need ${reward.pointsCost}, have ${member.currentPoints}`);
    }

    // Deduct points
    const newPoints = member.currentPoints - reward.pointsCost;
    await supabase.from('loyalty_members').update({
      current_points: newPoints,
      points_redeemed: member.pointsRedeemed + reward.pointsCost,
    }).eq('id', memberId);

    // Generate redemption code
    const code = this.generateRedemptionCode();
    const expiresAt = new Date(Date.now() + (reward.expirationDays || 30) * 24 * 60 * 60 * 1000);

    const redeemed: RedeemedReward = {
      id: uuidv4(),
      memberId,
      rewardId: reward.id,
      reward,
      code,
      status: 'active',
      expiresAt,
      createdAt: new Date(),
    };

    await supabase.from('redeemed_rewards').insert({
      id: redeemed.id,
      member_id: memberId,
      reward_id: rewardId,
      code: redeemed.code,
      status: redeemed.status,
      expires_at: redeemed.expiresAt.toISOString(),
      created_at: redeemed.createdAt.toISOString(),
    });

    // Log transaction
    await this.logPointsTransaction({
      memberId,
      type: 'redeemed',
      points: -reward.pointsCost,
      rewardId,
      description: `Redeemed: ${reward.name}`,
      balance: newPoints,
    });

    logger.info(`Member ${memberId} redeemed ${reward.name} for ${reward.pointsCost} points`);
    return redeemed;
  }

  /**
   * Use redeemed reward
   */
  async useReward(code: string, orderId: string): Promise<RedeemedReward | null> {
    const { data, error } = await supabase
      .from('redeemed_rewards')
      .select('*, reward:loyalty_rewards(*)')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error || !data) return null;

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      await supabase
        .from('redeemed_rewards')
        .update({ status: 'expired' })
        .eq('id', data.id);
      throw new Error('Reward has expired');
    }

    // Mark as used
    await supabase.from('redeemed_rewards').update({
      status: 'used',
      used_at: new Date().toISOString(),
      order_id: orderId,
    }).eq('id', data.id);

    return {
      id: data.id,
      memberId: data.member_id,
      rewardId: data.reward_id,
      reward: data.reward,
      code: data.code,
      status: 'used',
      usedAt: new Date(),
      expiresAt: new Date(data.expires_at),
      orderId,
      createdAt: new Date(data.created_at),
    };
  }

  // ==========================================================================
  // BONUS POINTS
  // ==========================================================================

  /**
   * Award birthday bonus
   */
  async awardBirthdayBonus(memberId: string): Promise<number> {
    const member = await this.getMember(memberId);
    if (!member) throw new Error('Member not found');

    const tierConfig = this.getTierConfig(member.tier);
    const bonus = tierConfig.birthdayBonus;

    await supabase.from('loyalty_members').update({
      current_points: member.currentPoints + bonus,
      lifetime_points: member.lifetimePoints + bonus,
    }).eq('id', memberId);

    await this.logPointsTransaction({
      memberId,
      type: 'bonus',
      points: bonus,
      description: 'Birthday bonus',
      balance: member.currentPoints + bonus,
    });

    logger.info(`Birthday bonus of ${bonus} points awarded to member ${memberId}`);
    return bonus;
  }

  /**
   * Process referral bonus
   */
  private async processReferralBonus(referrerId: string): Promise<void> {
    const referrer = await this.getMember(referrerId);
    if (!referrer) return;

    const tierConfig = this.getTierConfig(referrer.tier);
    const bonus = tierConfig.referralBonus;

    await supabase.from('loyalty_members').update({
      current_points: referrer.currentPoints + bonus,
      lifetime_points: referrer.lifetimePoints + bonus,
    }).eq('id', referrerId);

    await this.logPointsTransaction({
      memberId: referrerId,
      type: 'bonus',
      points: bonus,
      description: 'Referral bonus - new member signup',
      balance: referrer.currentPoints + bonus,
    });

    logger.info(`Referral bonus of ${bonus} points awarded to member ${referrerId}`);
  }

  // ==========================================================================
  // TIER MANAGEMENT
  // ==========================================================================

  /**
   * Check and process tier upgrade
   */
  private async checkTierUpgrade(memberId: string, tierProgressPoints: number): Promise<void> {
    const member = await this.getMember(memberId);
    if (!member) return;

    let newTier = member.tier;

    // Check tier eligibility (in reverse order to find highest)
    for (const config of [...TIER_CONFIG].reverse()) {
      if (tierProgressPoints >= config.minPoints) {
        newTier = config.tier;
        break;
      }
    }

    if (newTier !== member.tier) {
      await supabase.from('loyalty_members').update({
        tier: newTier,
        tier_since: new Date().toISOString(),
      }).eq('id', memberId);

      // Tier upgrade bonus
      const tierConfig = this.getTierConfig(newTier);
      const bonus = 100; // Fixed tier upgrade bonus

      await supabase.from('loyalty_members').update({
        current_points: member.currentPoints + bonus,
        lifetime_points: member.lifetimePoints + bonus,
      }).eq('id', memberId);

      await this.logPointsTransaction({
        memberId,
        type: 'bonus',
        points: bonus,
        description: `Tier upgrade bonus - Welcome to ${tierConfig.name}!`,
        balance: member.currentPoints + bonus,
      });

      logger.info(`Member ${memberId} upgraded to ${newTier} tier`);
    }
  }

  /**
   * Get tier configuration
   */
  getTierConfig(tier: LoyaltyTier): TierConfig {
    return TIER_CONFIG.find(t => t.tier === tier) || TIER_CONFIG[0];
  }

  /**
   * Get all tier configurations
   */
  getAllTierConfigs(): TierConfig[] {
    return TIER_CONFIG;
  }

  /**
   * Check if member meets minimum tier
   */
  private meetsMinTier(memberTier: LoyaltyTier, requiredTier: LoyaltyTier): boolean {
    const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];
    return tierOrder.indexOf(memberTier) >= tierOrder.indexOf(requiredTier);
  }

  // ==========================================================================
  // REWARDS CATALOG
  // ==========================================================================

  /**
   * Get reward by ID
   */
  async getReward(rewardId: string): Promise<Reward | null> {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (error || !data) return null;
    return this.mapRowToReward(data);
  }

  /**
   * Get available rewards for member
   */
  async getAvailableRewards(memberId: string): Promise<Reward[]> {
    const member = await this.getMember(memberId);
    if (!member) return [];

    const { data } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_cost', { ascending: true });

    return (data || [])
      .map(row => this.mapRowToReward(row))
      .filter(reward => {
        // Filter by tier requirement
        if (reward.tierRequired && !this.meetsMinTier(member.tier, reward.tierRequired)) {
          return false;
        }
        return true;
      })
      .map(reward => ({
        ...reward,
        canRedeem: member.currentPoints >= reward.pointsCost,
      }));
  }

  /**
   * Get member's redeemed rewards
   */
  async getMemberRewards(memberId: string, status?: string): Promise<RedeemedReward[]> {
    let query = supabase
      .from('redeemed_rewards')
      .select('*, reward:loyalty_rewards(*)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(row => ({
      id: row.id,
      memberId: row.member_id,
      rewardId: row.reward_id,
      reward: this.mapRowToReward(row.reward),
      code: row.code,
      status: row.status,
      usedAt: row.used_at ? new Date(row.used_at) : undefined,
      expiresAt: new Date(row.expires_at),
      orderId: row.order_id,
      createdAt: new Date(row.created_at),
    }));
  }

  // ==========================================================================
  // TRANSACTION HISTORY
  // ==========================================================================

  /**
   * Log points transaction
   */
  private async logPointsTransaction(data: Omit<PointsTransaction, 'id' | 'createdAt'>): Promise<void> {
    await supabase.from('points_transactions').insert({
      id: uuidv4(),
      member_id: data.memberId,
      type: data.type,
      points: data.points,
      order_id: data.orderId,
      reward_id: data.rewardId,
      description: data.description,
      balance: data.balance,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Get member's points history
   */
  async getPointsHistory(memberId: string, limit: number = 50): Promise<PointsTransaction[]> {
    const { data } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(row => ({
      id: row.id,
      memberId: row.member_id,
      type: row.type,
      points: row.points,
      orderId: row.order_id,
      rewardId: row.reward_id,
      description: row.description,
      balance: row.balance,
      createdAt: new Date(row.created_at),
    }));
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get loyalty program statistics
   */
  async getStatistics(): Promise<LoyaltyStats> {
    const { data: members } = await supabase.from('loyalty_members').select('*');

    if (!members) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        membersByTier: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        topMembers: [],
      };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeMembers = members.filter(m => m.last_visit && new Date(m.last_visit) > thirtyDaysAgo);

    const membersByTier: Record<LoyaltyTier, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    };

    let totalPointsIssued = 0;
    let totalPointsRedeemed = 0;

    for (const member of members) {
      membersByTier[member.tier as LoyaltyTier]++;
      totalPointsIssued += member.lifetime_points;
      totalPointsRedeemed += member.points_redeemed;
    }

    // Top 10 members by lifetime points
    const topMembers = members
      .sort((a, b) => b.lifetime_points - a.lifetime_points)
      .slice(0, 10)
      .map((m, i) => ({
        member: this.mapRowToMember(m),
        rank: i + 1,
      }));

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      totalPointsIssued,
      totalPointsRedeemed,
      membersByTier,
      topMembers,
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Generate referral code
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate redemption code
   */
  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'RWD-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Map database row to LoyaltyMember
   */
  private mapRowToMember(row: any): LoyaltyMember {
    return {
      id: row.id,
      customerId: row.customer_id,
      phone: row.phone,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      tier: row.tier,
      currentPoints: row.current_points,
      lifetimePoints: row.lifetime_points,
      pointsRedeemed: row.points_redeemed,
      tierProgressPoints: row.tier_progress_points,
      tierSince: new Date(row.tier_since),
      birthday: row.birthday,
      referralCode: row.referral_code,
      referredBy: row.referred_by,
      totalOrders: row.total_orders,
      totalSpent: row.total_spent,
      lastVisit: row.last_visit ? new Date(row.last_visit) : undefined,
      createdAt: new Date(row.created_at),
      metadata: row.metadata,
    };
  }

  /**
   * Map database row to Reward
   */
  private mapRowToReward(row: any): Reward {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      pointsCost: row.points_cost,
      type: row.type,
      value: row.value,
      itemName: row.item_name,
      minOrderAmount: row.min_order_amount,
      maxDiscount: row.max_discount,
      tierRequired: row.tier_required,
      isActive: row.is_active,
      expirationDays: row.expiration_days,
      usageLimit: row.usage_limit,
      validDays: row.valid_days,
    };
  }
}

// Export singleton
export const loyaltyProgramService = new LoyaltyProgramService();
