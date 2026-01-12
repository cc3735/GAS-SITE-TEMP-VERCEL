/**
 * Kitchen Display System (KDS) Service
 *
 * Real-time order management for kitchen staff:
 * - Live order queue
 * - Order status updates
 * - Preparation time tracking
 * - Station assignment
 * - Bump bar support
 *
 * @module services/kitchen-display
 */

import { WebSocket, WebSocketServer } from 'ws';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type OrderPriority = 'normal' | 'rush' | 'vip';
export type KitchenOrderStatus = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
export type StationType = 'grill' | 'prep' | 'sides' | 'drinks' | 'expo';

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  source: string;
  status: KitchenOrderStatus;
  priority: OrderPriority;
  items: KitchenOrderItem[];
  specialInstructions?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedReadyAt?: Date;
  elapsedTime: number;
  station?: StationType;
  assignedTo?: string;
}

export interface KitchenOrderItem {
  name: string;
  quantity: number;
  modifiers?: string[];
  specialInstructions?: string;
  status: 'pending' | 'cooking' | 'done';
  station: StationType;
}

export interface KitchenStats {
  activeOrders: number;
  avgPrepTime: number;
  ordersCompletedToday: number;
  ordersInProgress: number;
  ordersReady: number;
}

export interface KDSConfig {
  maxOrdersOnScreen: number;
  rushThresholdMinutes: number;
  alertSoundEnabled: boolean;
  autoCompleteMinutes: number;
  stations: StationType[];
}

// ============================================================================
// KITCHEN DISPLAY SERVICE
// ============================================================================

export class KitchenDisplayService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();
  private orders: Map<string, KitchenOrder> = new Map();
  private config: KDSConfig;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.config = {
      maxOrdersOnScreen: 12,
      rushThresholdMinutes: 15,
      alertSoundEnabled: true,
      autoCompleteMinutes: 30,
      stations: ['grill', 'prep', 'sides', 'drinks', 'expo'],
    };
  }

  // ==========================================================================
  // WEBSOCKET SERVER
  // ==========================================================================

  /**
   * Initialize WebSocket server for real-time updates
   */
  initWebSocketServer(port: number = 3010): void {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = req.url?.split('?id=')[1] || `client-${Date.now()}`;
      this.clients.set(clientId, ws);

      logger.info(`KDS client connected: ${clientId}`);

      // Send current state
      ws.send(JSON.stringify({
        type: 'initial_state',
        data: {
          orders: Array.from(this.orders.values()),
          stats: this.getStats(),
        },
      }));

      ws.on('message', (message: string) => {
        this.handleClientMessage(clientId, message);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info(`KDS client disconnected: ${clientId}`);
      });
    });

    // Start elapsed time updater
    this.startElapsedTimeUpdater();

    logger.info(`KDS WebSocket server started on port ${port}`);
  }

  /**
   * Handle client messages
   */
  private handleClientMessage(clientId: string, message: string): void {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'bump_order':
          this.bumpOrder(data.orderId);
          break;
        case 'start_order':
          this.startOrder(data.orderId);
          break;
        case 'recall_order':
          this.recallOrder(data.orderId);
          break;
        case 'set_priority':
          this.setPriority(data.orderId, data.priority);
          break;
        case 'assign_station':
          this.assignStation(data.orderId, data.station);
          break;
        case 'item_done':
          this.markItemDone(data.orderId, data.itemIndex);
          break;
      }
    } catch (error) {
      logger.error('Error handling KDS message:', error);
    }
  }

  /**
   * Broadcast message to all clients
   */
  private broadcast(message: any): void {
    const payload = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  /**
   * Start elapsed time updater
   */
  private startElapsedTimeUpdater(): void {
    this.updateInterval = setInterval(() => {
      const updates: Array<{ orderId: string; elapsedTime: number }> = [];

      this.orders.forEach(order => {
        if (order.status === 'new' || order.status === 'in_progress') {
          const elapsed = Math.floor((Date.now() - order.createdAt.getTime()) / 1000);
          if (elapsed !== order.elapsedTime) {
            order.elapsedTime = elapsed;
            updates.push({ orderId: order.id, elapsedTime: elapsed });
          }
        }
      });

      if (updates.length > 0) {
        this.broadcast({
          type: 'elapsed_time_update',
          data: updates,
        });
      }
    }, 1000);
  }

  // ==========================================================================
  // ORDER MANAGEMENT
  // ==========================================================================

  /**
   * Add new order to kitchen display
   */
  async addOrder(orderId: string): Promise<void> {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      logger.error('Error fetching order for KDS:', error);
      return;
    }

    const kitchenOrder: KitchenOrder = {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name || 'Guest',
      source: order.source,
      status: 'new',
      priority: 'normal',
      items: this.mapItemsToKitchen(order.items),
      specialInstructions: order.special_instructions,
      createdAt: new Date(order.created_at),
      elapsedTime: 0,
      estimatedReadyAt: this.calculateEstimatedReadyTime(order.items),
    };

    this.orders.set(order.id, kitchenOrder);

    // Broadcast new order
    this.broadcast({
      type: 'new_order',
      data: kitchenOrder,
    });

    // Play alert sound
    if (this.config.alertSoundEnabled) {
      this.broadcast({ type: 'play_sound', sound: 'new_order' });
    }

    this.emit('order_added', kitchenOrder);
    logger.info(`Order added to KDS: ${order.order_number}`);
  }

  /**
   * Map order items to kitchen format with station assignment
   */
  private mapItemsToKitchen(items: any[]): KitchenOrderItem[] {
    return items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      modifiers: item.modifiers,
      specialInstructions: item.specialInstructions,
      status: 'pending',
      station: this.assignItemStation(item.name),
    }));
  }

  /**
   * Assign station based on item type
   */
  private assignItemStation(itemName: string): StationType {
    const name = itemName.toLowerCase();

    if (name.includes('brisket') || name.includes('ribs') || name.includes('chicken') ||
        name.includes('pork') || name.includes('sandwich')) {
      return 'grill';
    }
    if (name.includes('mac') || name.includes('beans') || name.includes('coleslaw') ||
        name.includes('potato') || name.includes('collard') || name.includes('cornbread')) {
      return 'sides';
    }
    if (name.includes('tea') || name.includes('lemonade') || name.includes('water') ||
        name.includes('coke') || name.includes('sprite') || name.includes('pepper')) {
      return 'drinks';
    }
    if (name.includes('cobbler') || name.includes('pudding')) {
      return 'prep';
    }

    return 'expo';
  }

  /**
   * Calculate estimated ready time
   */
  private calculateEstimatedReadyTime(items: any[]): Date {
    // Base prep time + item-specific times
    let totalMinutes = 5; // Base time

    for (const item of items) {
      const name = item.name.toLowerCase();
      const quantity = item.quantity || 1;

      if (name.includes('ribs')) totalMinutes += 8 * quantity;
      else if (name.includes('brisket')) totalMinutes += 6 * quantity;
      else if (name.includes('chicken')) totalMinutes += 5 * quantity;
      else if (name.includes('pork')) totalMinutes += 4 * quantity;
      else if (name.includes('sandwich')) totalMinutes += 3 * quantity;
      else totalMinutes += 2 * quantity;
    }

    return new Date(Date.now() + totalMinutes * 60 * 1000);
  }

  /**
   * Start working on an order
   */
  async startOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = 'in_progress';
    order.startedAt = new Date();

    // Update database
    await supabase
      .from('orders')
      .update({ status: 'preparing', started_at: order.startedAt.toISOString() })
      .eq('id', orderId);

    this.broadcast({
      type: 'order_updated',
      data: order,
    });

    this.emit('order_started', order);
  }

  /**
   * Bump order (mark as ready)
   */
  async bumpOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = 'ready';
    order.completedAt = new Date();

    // Update database
    await supabase
      .from('orders')
      .update({
        status: 'ready',
        completed_at: order.completedAt.toISOString(),
        prep_time_seconds: order.elapsedTime,
      })
      .eq('id', orderId);

    this.broadcast({
      type: 'order_bumped',
      data: order,
    });

    // Play ready sound
    if (this.config.alertSoundEnabled) {
      this.broadcast({ type: 'play_sound', sound: 'order_ready' });
    }

    this.emit('order_ready', order);
    logger.info(`Order bumped: ${order.orderNumber}`);
  }

  /**
   * Recall order (bring back to display)
   */
  async recallOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = 'in_progress';
    order.completedAt = undefined;

    await supabase
      .from('orders')
      .update({ status: 'preparing' })
      .eq('id', orderId);

    this.broadcast({
      type: 'order_recalled',
      data: order,
    });

    this.emit('order_recalled', order);
  }

  /**
   * Set order priority
   */
  async setPriority(orderId: string, priority: OrderPriority): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.priority = priority;

    this.broadcast({
      type: 'order_updated',
      data: order,
    });

    if (priority === 'rush') {
      this.broadcast({ type: 'play_sound', sound: 'rush_order' });
    }

    this.emit('priority_changed', { order, priority });
  }

  /**
   * Assign order to station
   */
  async assignStation(orderId: string, station: StationType): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.station = station;

    this.broadcast({
      type: 'order_updated',
      data: order,
    });
  }

  /**
   * Mark individual item as done
   */
  async markItemDone(orderId: string, itemIndex: number): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order || !order.items[itemIndex]) return;

    order.items[itemIndex].status = 'done';

    // Check if all items are done
    const allDone = order.items.every(item => item.status === 'done');
    if (allDone) {
      await this.bumpOrder(orderId);
    } else {
      this.broadcast({
        type: 'item_updated',
        data: { orderId, itemIndex, status: 'done' },
      });
    }
  }

  /**
   * Remove order from display
   */
  removeOrder(orderId: string): void {
    this.orders.delete(orderId);
    this.broadcast({
      type: 'order_removed',
      data: { orderId },
    });
  }

  // ==========================================================================
  // STATISTICS & QUERIES
  // ==========================================================================

  /**
   * Get current statistics
   */
  getStats(): KitchenStats {
    const orders = Array.from(this.orders.values());
    const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'in_progress');
    const readyOrders = orders.filter(o => o.status === 'ready');

    // Calculate average prep time from completed orders
    const completedOrders = orders.filter(o => o.completedAt && o.startedAt);
    const avgPrepTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + (o.completedAt!.getTime() - o.startedAt!.getTime()), 0) / completedOrders.length / 1000
      : 0;

    return {
      activeOrders: activeOrders.length,
      avgPrepTime: Math.round(avgPrepTime),
      ordersCompletedToday: completedOrders.length,
      ordersInProgress: activeOrders.filter(o => o.status === 'in_progress').length,
      ordersReady: readyOrders.length,
    };
  }

  /**
   * Get orders by station
   */
  getOrdersByStation(station: StationType): KitchenOrder[] {
    return Array.from(this.orders.values())
      .filter(order =>
        (order.status === 'new' || order.status === 'in_progress') &&
        order.items.some(item => item.station === station && item.status !== 'done')
      )
      .sort((a, b) => {
        // Rush orders first
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (b.priority === 'rush' && a.priority !== 'rush') return 1;
        // Then by elapsed time
        return b.elapsedTime - a.elapsedTime;
      });
  }

  /**
   * Get all active orders
   */
  getActiveOrders(): KitchenOrder[] {
    return Array.from(this.orders.values())
      .filter(order => order.status === 'new' || order.status === 'in_progress')
      .sort((a, b) => {
        if (a.priority === 'rush' && b.priority !== 'rush') return -1;
        if (b.priority === 'rush' && a.priority !== 'rush') return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  /**
   * Get ready orders
   */
  getReadyOrders(): KitchenOrder[] {
    return Array.from(this.orders.values())
      .filter(order => order.status === 'ready')
      .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Stop KDS service
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    this.clients.clear();
    this.orders.clear();
  }
}

// Export singleton
export const kitchenDisplayService = new KitchenDisplayService();
