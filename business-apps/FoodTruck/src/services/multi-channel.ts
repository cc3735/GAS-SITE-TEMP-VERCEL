/**
 * Multi-Channel Ordering Service
 *
 * Supports ordering from multiple channels:
 * - Voice (Twilio) - existing
 * - SMS
 * - WhatsApp
 * - Web widget
 * - Mobile app
 *
 * @module services/multi-channel
 */

import twilio from 'twilio';
import axios from 'axios';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type OrderChannel = 'voice' | 'sms' | 'whatsapp' | 'web' | 'mobile' | 'walk_in';

export interface ChannelMessage {
  id: string;
  channel: OrderChannel;
  senderId: string;
  senderName?: string;
  senderPhone?: string;
  content: string;
  mediaUrls?: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface OrderIntent {
  items: Array<{
    name: string;
    quantity: number;
    modifiers?: string[];
    specialInstructions?: string;
  }>;
  customerName?: string;
  customerPhone?: string;
  pickupTime?: string;
  specialInstructions?: string;
  confidence: number;
}

export interface ConversationState {
  sessionId: string;
  channel: OrderChannel;
  customerId?: string;
  stage: 'greeting' | 'taking_order' | 'confirming' | 'payment' | 'complete';
  currentOrder: OrderIntent;
  messages: ChannelMessage[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MENU CONTEXT
// ============================================================================

const MENU_CONTEXT = `
You are an AI ordering assistant for "This What I Do BBQ" food truck.

MENU:
- Brisket Plate: $16.99 (includes 2 sides)
- Pulled Pork Plate: $14.99 (includes 2 sides)
- Ribs (Half Rack): $18.99 (includes 2 sides)
- Ribs (Full Rack): $32.99 (includes 2 sides)
- Smoked Chicken: $13.99 (includes 2 sides)
- BBQ Sandwich: $11.99 (brisket, pulled pork, or chicken)
- Combo Plate: $22.99 (pick 2 meats, includes 2 sides)

SIDES ($3.99 each, or included with plate):
- Mac & Cheese
- Coleslaw
- Baked Beans
- Potato Salad
- Collard Greens
- Cornbread

DRINKS ($2.99):
- Sweet Tea
- Unsweet Tea
- Lemonade
- Bottled Water
- Soda (Coke, Sprite, Dr Pepper)

DESSERTS:
- Peach Cobbler: $6.99
- Banana Pudding: $5.99

GUIDELINES:
1. Be friendly and helpful
2. Confirm order details before completing
3. Ask for customer name for pickup
4. Mention estimated wait time (usually 10-15 minutes)
5. If unclear, ask clarifying questions
`;

// ============================================================================
// MULTI-CHANNEL ORDERING SERVICE
// ============================================================================

export class MultiChannelOrderingService {
  private twilioClient: twilio.Twilio;
  private openai: OpenAI;
  private conversations: Map<string, ConversationState> = new Map();

  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // ==========================================================================
  // MESSAGE HANDLING
  // ==========================================================================

  /**
   * Process incoming message from any channel
   */
  async processMessage(message: ChannelMessage): Promise<string> {
    const sessionKey = `${message.channel}:${message.senderId}`;
    let conversation = this.conversations.get(sessionKey);

    if (!conversation) {
      conversation = this.createConversation(message);
      this.conversations.set(sessionKey, conversation);
    }

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Get AI response
    const response = await this.generateResponse(conversation, message);

    // Update conversation state
    await this.updateConversationState(conversation, message, response);

    return response;
  }

  /**
   * Create new conversation
   */
  private createConversation(message: ChannelMessage): ConversationState {
    return {
      sessionId: uuidv4(),
      channel: message.channel,
      stage: 'greeting',
      currentOrder: {
        items: [],
        confidence: 0,
      },
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate AI response
   */
  private async generateResponse(
    conversation: ConversationState,
    message: ChannelMessage
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(conversation);
      const messages = this.buildMessageHistory(conversation);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: message.content },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || "I'm sorry, I didn't understand that. Could you please repeat?";
    } catch (error) {
      logger.error('Error generating response:', error);
      return "I'm having trouble processing your request. Please try again or call us directly.";
    }
  }

  /**
   * Build system prompt based on conversation state
   */
  private buildSystemPrompt(conversation: ConversationState): string {
    let prompt = MENU_CONTEXT;

    prompt += `\n\nCURRENT CONVERSATION STATE:
- Stage: ${conversation.stage}
- Channel: ${conversation.channel}
- Current Order Items: ${conversation.currentOrder.items.length}`;

    if (conversation.currentOrder.items.length > 0) {
      prompt += `\n- Order so far: ${JSON.stringify(conversation.currentOrder.items)}`;
    }

    // Channel-specific instructions
    switch (conversation.channel) {
      case 'sms':
        prompt += '\n\nKEEP RESPONSES BRIEF (under 160 characters when possible) since this is SMS.';
        break;
      case 'whatsapp':
        prompt += '\n\nYou can use emojis and formatting. Responses can be longer.';
        break;
    }

    return prompt;
  }

  /**
   * Build message history for context
   */
  private buildMessageHistory(conversation: ConversationState): Array<{ role: 'user' | 'assistant'; content: string }> {
    return conversation.messages.slice(-10).map(msg => ({
      role: 'user' as const,
      content: msg.content,
    }));
  }

  /**
   * Update conversation state based on response
   */
  private async updateConversationState(
    conversation: ConversationState,
    message: ChannelMessage,
    response: string
  ): Promise<void> {
    // Parse order intent from message
    const intent = await this.parseOrderIntent(message.content, conversation);

    if (intent.items.length > 0) {
      conversation.currentOrder.items.push(...intent.items);
      conversation.stage = 'taking_order';
    }

    // Check for confirmation keywords
    const confirmKeywords = ['yes', 'confirm', 'that\'s correct', 'sounds good', 'perfect'];
    if (confirmKeywords.some(kw => message.content.toLowerCase().includes(kw)) &&
        conversation.stage === 'confirming') {
      conversation.stage = 'payment';
      await this.createOrderFromConversation(conversation);
    }

    // Check if ready to confirm
    if (conversation.currentOrder.items.length > 0 &&
        (message.content.toLowerCase().includes('that\'s all') ||
         message.content.toLowerCase().includes('that is all') ||
         message.content.toLowerCase().includes('complete') ||
         message.content.toLowerCase().includes('done ordering'))) {
      conversation.stage = 'confirming';
    }
  }

  /**
   * Parse order intent from message
   */
  private async parseOrderIntent(content: string, conversation: ConversationState): Promise<OrderIntent> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Parse the following message for food order items. Return JSON only.
            Menu items: Brisket Plate, Pulled Pork Plate, Ribs Half Rack, Ribs Full Rack, Smoked Chicken, BBQ Sandwich, Combo Plate
            Sides: Mac & Cheese, Coleslaw, Baked Beans, Potato Salad, Collard Greens, Cornbread
            Drinks: Sweet Tea, Unsweet Tea, Lemonade, Water, Coke, Sprite, Dr Pepper
            Desserts: Peach Cobbler, Banana Pudding

            Return format: {"items": [{"name": "item name", "quantity": 1, "modifiers": [], "specialInstructions": ""}], "confidence": 0.9}`
          },
          { role: 'user', content }
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{"items": [], "confidence": 0}');
      return result;
    } catch (error) {
      logger.error('Error parsing order intent:', error);
      return { items: [], confidence: 0 };
    }
  }

  /**
   * Create order from conversation
   */
  private async createOrderFromConversation(conversation: ConversationState): Promise<string | null> {
    try {
      const orderNumber = this.generateOrderNumber();

      // Calculate totals
      const items = conversation.currentOrder.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: this.getItemPrice(item.name),
        modifiers: item.modifiers,
        specialInstructions: item.specialInstructions,
      }));

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.0825;
      const total = subtotal + tax;

      // Create order in database
      const { data, error } = await supabase.from('orders').insert({
        id: uuidv4(),
        order_number: orderNumber,
        customer_name: conversation.currentOrder.customerName,
        customer_phone: conversation.currentOrder.customerPhone,
        source: conversation.channel,
        status: 'pending',
        items,
        subtotal,
        tax,
        total,
        special_instructions: conversation.currentOrder.specialInstructions,
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      conversation.stage = 'complete';
      logger.info(`Order created: ${orderNumber} via ${conversation.channel}`);

      return orderNumber;
    } catch (error) {
      logger.error('Error creating order:', error);
      return null;
    }
  }

  /**
   * Get item price
   */
  private getItemPrice(itemName: string): number {
    const prices: Record<string, number> = {
      'Brisket Plate': 16.99,
      'Pulled Pork Plate': 14.99,
      'Ribs Half Rack': 18.99,
      'Ribs Full Rack': 32.99,
      'Smoked Chicken': 13.99,
      'BBQ Sandwich': 11.99,
      'Combo Plate': 22.99,
      'Mac & Cheese': 3.99,
      'Coleslaw': 3.99,
      'Baked Beans': 3.99,
      'Potato Salad': 3.99,
      'Collard Greens': 3.99,
      'Cornbread': 3.99,
      'Sweet Tea': 2.99,
      'Unsweet Tea': 2.99,
      'Lemonade': 2.99,
      'Water': 2.99,
      'Coke': 2.99,
      'Sprite': 2.99,
      'Dr Pepper': 2.99,
      'Peach Cobbler': 6.99,
      'Banana Pudding': 5.99,
    };
    return prices[itemName] || 0;
  }

  /**
   * Generate order number
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
  }

  // ==========================================================================
  // SMS HANDLING
  // ==========================================================================

  /**
   * Handle incoming SMS
   */
  async handleSMS(from: string, body: string, mediaUrls?: string[]): Promise<string> {
    const message: ChannelMessage = {
      id: uuidv4(),
      channel: 'sms',
      senderId: from,
      senderPhone: from,
      content: body,
      mediaUrls,
      timestamp: new Date(),
    };

    const response = await this.processMessage(message);
    return response;
  }

  /**
   * Send SMS response
   */
  async sendSMS(to: string, message: string): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  // ==========================================================================
  // WHATSAPP HANDLING
  // ==========================================================================

  /**
   * Handle incoming WhatsApp message
   */
  async handleWhatsApp(from: string, body: string, profileName?: string, mediaUrls?: string[]): Promise<string> {
    const message: ChannelMessage = {
      id: uuidv4(),
      channel: 'whatsapp',
      senderId: from,
      senderName: profileName,
      senderPhone: from.replace('whatsapp:', ''),
      content: body,
      mediaUrls,
      timestamp: new Date(),
    };

    const response = await this.processMessage(message);
    return response;
  }

  /**
   * Send WhatsApp response
   */
  async sendWhatsApp(to: string, message: string): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
      });
    } catch (error) {
      logger.error('Error sending WhatsApp:', error);
      throw error;
    }
  }

  // ==========================================================================
  // WEB CHAT HANDLING
  // ==========================================================================

  /**
   * Handle web chat message
   */
  async handleWebChat(sessionId: string, message: string, customerInfo?: { name?: string; phone?: string }): Promise<string> {
    const channelMessage: ChannelMessage = {
      id: uuidv4(),
      channel: 'web',
      senderId: sessionId,
      senderName: customerInfo?.name,
      senderPhone: customerInfo?.phone,
      content: message,
      timestamp: new Date(),
    };

    return this.processMessage(channelMessage);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get conversation state
   */
  getConversation(channel: OrderChannel, senderId: string): ConversationState | undefined {
    return this.conversations.get(`${channel}:${senderId}`);
  }

  /**
   * Clear conversation
   */
  clearConversation(channel: OrderChannel, senderId: string): void {
    this.conversations.delete(`${channel}:${senderId}`);
  }

  /**
   * Get active conversations count
   */
  getActiveConversationsCount(): number {
    return this.conversations.size;
  }
}

// Export singleton
export const multiChannelService = new MultiChannelOrderingService();
