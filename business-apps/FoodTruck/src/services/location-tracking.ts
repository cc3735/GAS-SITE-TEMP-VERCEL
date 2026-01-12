/**
 * Location Tracking Service
 *
 * Manages food truck locations and customer proximity:
 * - Real-time GPS tracking
 * - Customer proximity notifications
 * - Operating hours management
 * - Multi-location support
 *
 * @module services/location-tracking
 */

import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  truckId?: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  currentStatus: 'open' | 'closed' | 'traveling' | 'setup';
  operatingHours: OperatingHours[];
  schedule?: ScheduleEntry[];
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface OperatingHours {
  dayOfWeek: number; // 0-6, Sunday-Saturday
  openTime: string;  // HH:mm
  closeTime: string; // HH:mm
  isClosed: boolean;
}

export interface ScheduleEntry {
  date: string;       // YYYY-MM-DD
  location: string;   // Address or venue name
  latitude: number;
  longitude: number;
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  notes?: string;
}

export interface GPSUpdate {
  truckId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

export interface NearbyLocation {
  location: Location;
  distance: number; // meters
  estimatedTravelTime?: number; // minutes
  isOpen: boolean;
  nextOpenTime?: Date;
}

export interface ProximitySubscription {
  id: string;
  userId: string;
  phone?: string;
  email?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  truckId?: string;
  notifiedAt?: Date;
  active: boolean;
}

// ============================================================================
// LOCATION TRACKING SERVICE
// ============================================================================

export class LocationTrackingService {
  private locationHistory: Map<string, GPSUpdate[]> = new Map();
  private proximitySubscriptions: Map<string, ProximitySubscription> = new Map();

  // ==========================================================================
  // LOCATION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new location/truck
   */
  async createLocation(location: Partial<Location>): Promise<Location> {
    const newLocation: Location = {
      id: uuidv4(),
      organizationId: location.organizationId || '',
      name: location.name || 'Food Truck',
      truckId: location.truckId,
      address: location.address || '',
      latitude: location.latitude || 0,
      longitude: location.longitude || 0,
      isActive: true,
      currentStatus: 'closed',
      operatingHours: location.operatingHours || this.getDefaultOperatingHours(),
      schedule: location.schedule || [],
      lastUpdated: new Date(),
      metadata: location.metadata,
    };

    const { error } = await supabase.from('truck_locations').insert({
      id: newLocation.id,
      organization_id: newLocation.organizationId,
      name: newLocation.name,
      truck_id: newLocation.truckId,
      address: newLocation.address,
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      is_active: newLocation.isActive,
      current_status: newLocation.currentStatus,
      operating_hours: newLocation.operatingHours,
      schedule: newLocation.schedule,
      last_updated: newLocation.lastUpdated.toISOString(),
      metadata: newLocation.metadata,
    });

    if (error) throw error;

    logger.info(`Location created: ${newLocation.name}`);
    return newLocation;
  }

  /**
   * Update GPS location
   */
  async updateGPSLocation(update: GPSUpdate): Promise<void> {
    // Store in history
    let history = this.locationHistory.get(update.truckId);
    if (!history) {
      history = [];
      this.locationHistory.set(update.truckId, history);
    }
    history.push(update);
    if (history.length > 100) history.shift(); // Keep last 100 points

    // Update database
    await supabase
      .from('truck_locations')
      .update({
        latitude: update.latitude,
        longitude: update.longitude,
        last_updated: update.timestamp.toISOString(),
        metadata: {
          speed: update.speed,
          heading: update.heading,
          accuracy: update.accuracy,
        },
      })
      .eq('truck_id', update.truckId);

    // Store in location history table
    await supabase.from('location_history').insert({
      id: uuidv4(),
      truck_id: update.truckId,
      latitude: update.latitude,
      longitude: update.longitude,
      speed: update.speed,
      heading: update.heading,
      accuracy: update.accuracy,
      timestamp: update.timestamp.toISOString(),
    });

    // Check proximity subscriptions
    await this.checkProximityNotifications(update);

    logger.debug(`GPS updated for truck ${update.truckId}: ${update.latitude}, ${update.longitude}`);
  }

  /**
   * Update location status
   */
  async updateStatus(locationId: string, status: Location['currentStatus']): Promise<void> {
    await supabase
      .from('truck_locations')
      .update({
        current_status: status,
        last_updated: new Date().toISOString(),
      })
      .eq('id', locationId);

    logger.info(`Location ${locationId} status updated to: ${status}`);
  }

  /**
   * Get location by ID
   */
  async getLocation(locationId: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('truck_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error || !data) return null;
    return this.mapRowToLocation(data);
  }

  /**
   * Get all active locations
   */
  async getActiveLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('truck_locations')
      .select('*')
      .eq('is_active', true);

    if (error) {
      logger.error('Error fetching active locations:', error);
      return [];
    }

    return (data || []).map(row => this.mapRowToLocation(row));
  }

  // ==========================================================================
  // PROXIMITY & SEARCH
  // ==========================================================================

  /**
   * Find nearby locations
   */
  async findNearbyLocations(
    latitude: number,
    longitude: number,
    radiusMeters: number = 10000 // 10km default
  ): Promise<NearbyLocation[]> {
    const locations = await this.getActiveLocations();
    const nearby: NearbyLocation[] = [];

    for (const location of locations) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );

      if (distance <= radiusMeters) {
        nearby.push({
          location,
          distance: Math.round(distance),
          estimatedTravelTime: this.estimateTravelTime(distance),
          isOpen: this.isLocationOpen(location),
          nextOpenTime: this.getNextOpenTime(location),
        });
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Estimate travel time (rough estimate)
   */
  private estimateTravelTime(distanceMeters: number): number {
    // Assume average speed of 30 km/h in urban areas
    return Math.round(distanceMeters / 1000 / 30 * 60);
  }

  /**
   * Check if location is currently open
   */
  isLocationOpen(location: Location): boolean {
    if (location.currentStatus !== 'open') return false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    // Check schedule first
    const todaySchedule = location.schedule?.find(
      s => s.date === now.toISOString().split('T')[0]
    );
    if (todaySchedule) {
      return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
    }

    // Fall back to regular hours
    const hours = location.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
    if (!hours || hours.isClosed) return false;

    return currentTime >= hours.openTime && currentTime <= hours.closeTime;
  }

  /**
   * Get next open time
   */
  getNextOpenTime(location: Location): Date | undefined {
    if (this.isLocationOpen(location)) return undefined;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    // Check today's remaining hours
    const todayHours = location.operatingHours.find(h => h.dayOfWeek === currentDay);
    if (todayHours && !todayHours.isClosed && currentTime < todayHours.openTime) {
      const [hours, minutes] = todayHours.openTime.split(':').map(Number);
      const nextOpen = new Date(now);
      nextOpen.setHours(hours, minutes, 0, 0);
      return nextOpen;
    }

    // Check upcoming days
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const dayHours = location.operatingHours.find(h => h.dayOfWeek === checkDay);
      if (dayHours && !dayHours.isClosed) {
        const [hours, minutes] = dayHours.openTime.split(':').map(Number);
        const nextOpen = new Date(now);
        nextOpen.setDate(nextOpen.getDate() + i);
        nextOpen.setHours(hours, minutes, 0, 0);
        return nextOpen;
      }
    }

    return undefined;
  }

  // ==========================================================================
  // PROXIMITY NOTIFICATIONS
  // ==========================================================================

  /**
   * Subscribe to proximity notifications
   */
  async subscribeToProximity(subscription: Omit<ProximitySubscription, 'id'>): Promise<string> {
    const id = uuidv4();
    const fullSubscription: ProximitySubscription = {
      ...subscription,
      id,
      active: true,
    };

    this.proximitySubscriptions.set(id, fullSubscription);

    await supabase.from('proximity_subscriptions').insert({
      id,
      user_id: subscription.userId,
      phone: subscription.phone,
      email: subscription.email,
      latitude: subscription.latitude,
      longitude: subscription.longitude,
      radius_meters: subscription.radiusMeters,
      truck_id: subscription.truckId,
      active: true,
    });

    return id;
  }

  /**
   * Check and send proximity notifications
   */
  private async checkProximityNotifications(update: GPSUpdate): Promise<void> {
    const subscriptions = Array.from(this.proximitySubscriptions.values())
      .filter(s => s.active && (!s.truckId || s.truckId === update.truckId));

    for (const sub of subscriptions) {
      const distance = this.calculateDistance(
        sub.latitude,
        sub.longitude,
        update.latitude,
        update.longitude
      );

      if (distance <= sub.radiusMeters) {
        // Check if already notified recently (within 1 hour)
        if (sub.notifiedAt && (Date.now() - sub.notifiedAt.getTime()) < 3600000) {
          continue;
        }

        await this.sendProximityNotification(sub, update, distance);
        sub.notifiedAt = new Date();
      }
    }
  }

  /**
   * Send proximity notification
   */
  private async sendProximityNotification(
    subscription: ProximitySubscription,
    update: GPSUpdate,
    distance: number
  ): Promise<void> {
    const distanceText = distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;

    const message = `Our food truck is now ${distanceText} away from you! Come grab some delicious BBQ!`;

    // Send SMS if phone provided
    if (subscription.phone) {
      try {
        const twilio = await import('twilio');
        const client = twilio.default(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: subscription.phone,
        });
        logger.info(`Proximity notification sent to ${subscription.phone}`);
      } catch (error) {
        logger.error('Error sending proximity SMS:', error);
      }
    }

    // Update notification timestamp
    await supabase
      .from('proximity_subscriptions')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', subscription.id);
  }

  /**
   * Unsubscribe from proximity notifications
   */
  async unsubscribeFromProximity(subscriptionId: string): Promise<void> {
    this.proximitySubscriptions.delete(subscriptionId);
    await supabase
      .from('proximity_subscriptions')
      .update({ active: false })
      .eq('id', subscriptionId);
  }

  // ==========================================================================
  // SCHEDULE MANAGEMENT
  // ==========================================================================

  /**
   * Add schedule entry
   */
  async addScheduleEntry(locationId: string, entry: ScheduleEntry): Promise<void> {
    const location = await this.getLocation(locationId);
    if (!location) throw new Error('Location not found');

    const schedule = location.schedule || [];
    schedule.push(entry);

    await supabase
      .from('truck_locations')
      .update({ schedule })
      .eq('id', locationId);
  }

  /**
   * Get upcoming schedule
   */
  async getUpcomingSchedule(locationId: string, days: number = 7): Promise<ScheduleEntry[]> {
    const location = await this.getLocation(locationId);
    if (!location || !location.schedule) return [];

    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return location.schedule.filter(
      entry => entry.date >= today && entry.date <= endDate
    ).sort((a, b) => a.date.localeCompare(b.date));
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get default operating hours (11 AM - 8 PM, closed Sunday)
   */
  private getDefaultOperatingHours(): OperatingHours[] {
    return [
      { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },  // Sunday
      { dayOfWeek: 1, openTime: '11:00', closeTime: '20:00', isClosed: false }, // Monday
      { dayOfWeek: 2, openTime: '11:00', closeTime: '20:00', isClosed: false }, // Tuesday
      { dayOfWeek: 3, openTime: '11:00', closeTime: '20:00', isClosed: false }, // Wednesday
      { dayOfWeek: 4, openTime: '11:00', closeTime: '20:00', isClosed: false }, // Thursday
      { dayOfWeek: 5, openTime: '11:00', closeTime: '21:00', isClosed: false }, // Friday
      { dayOfWeek: 6, openTime: '11:00', closeTime: '21:00', isClosed: false }, // Saturday
    ];
  }

  /**
   * Map database row to Location
   */
  private mapRowToLocation(row: any): Location {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      truckId: row.truck_id,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      isActive: row.is_active,
      currentStatus: row.current_status,
      operatingHours: row.operating_hours,
      schedule: row.schedule,
      lastUpdated: new Date(row.last_updated),
      metadata: row.metadata,
    };
  }
}

// Export singleton
export const locationTrackingService = new LocationTrackingService();
