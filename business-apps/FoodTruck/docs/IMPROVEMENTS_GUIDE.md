# Food Truck - Improvements Guide

## Overview

This guide covers the enhanced features added to the Food Truck AI Voice Ordering platform:

1. **Multi-Channel Ordering** - SMS, WhatsApp, Web Chat support
2. **Kitchen Display System (KDS)** - Real-time order management
3. **Location Tracking** - GPS tracking and proximity notifications
4. **Loyalty Program** - Points, tiers, and rewards

---

## Table of Contents

1. [Multi-Channel Ordering](#multi-channel-ordering)
2. [Kitchen Display System](#kitchen-display-system)
3. [Location Tracking](#location-tracking)
4. [Loyalty Program](#loyalty-program)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)

---

## Multi-Channel Ordering

### Supported Channels

| Channel | Features |
|---------|----------|
| Voice | Full AI conversation via Twilio |
| SMS | Text-based ordering with AI parsing |
| WhatsApp | Rich messaging with emojis |
| Web Chat | Real-time chat widget |
| Mobile | App integration ready |

### Architecture

```
Customer Message → Channel Handler → AI Parser → Order Creation
                         ↓
              Conversation State
                         ↓
              Response Generation
                         ↓
              Channel-Specific Reply
```

### Usage

```typescript
import { multiChannelService } from './services/multi-channel';

// Handle SMS
const response = await multiChannelService.handleSMS(
  '+15551234567',
  'I want 2 brisket plates with mac and cheese'
);

// Handle WhatsApp
const response = await multiChannelService.handleWhatsApp(
  '+15551234567',
  'What sides do you have?',
  'John Doe'
);

// Handle Web Chat
const response = await multiChannelService.handleWebChat(
  'session-123',
  'Can I get a combo plate?',
  { name: 'Jane', phone: '+15559876543' }
);
```

### Conversation Flow

1. **Greeting** - Welcome customer, offer assistance
2. **Taking Order** - Parse items, ask clarifying questions
3. **Confirming** - Review order, confirm details
4. **Payment** - Process payment (if applicable)
5. **Complete** - Provide order number and wait time

### API Endpoints

```bash
# Twilio SMS Webhook
POST /api/channels/sms
{
  "From": "+15551234567",
  "Body": "2 brisket plates please",
  "MediaUrl0": "optional-image-url"
}

# WhatsApp Webhook
POST /api/channels/whatsapp
{
  "WaId": "+15551234567",
  "ProfileName": "John Doe",
  "Body": "What's on the menu?"
}

# Web Chat
POST /api/channels/web-chat
{
  "sessionId": "session-uuid",
  "message": "I'd like to order",
  "customerInfo": {
    "name": "Jane Doe",
    "phone": "+15559876543"
  }
}
```

---

## Kitchen Display System

### Features

- Real-time order queue via WebSocket
- Order status progression (New → In Progress → Ready)
- Priority management (Normal, Rush, VIP)
- Station-based item routing
- Elapsed time tracking
- Bump bar support

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3010?id=kitchen-1');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'new_order':
      // Display new order
      break;
    case 'order_bumped':
      // Move to ready section
      break;
    case 'elapsed_time_update':
      // Update timers
      break;
  }
};

// Bump an order
ws.send(JSON.stringify({ type: 'bump_order', orderId: 'order-uuid' }));
```

### Station Types

| Station | Items |
|---------|-------|
| Grill | Brisket, Ribs, Chicken, Pork, Sandwiches |
| Sides | Mac & Cheese, Beans, Coleslaw, etc. |
| Drinks | Teas, Lemonade, Sodas |
| Prep | Desserts, garnishes |
| Expo | Final assembly, quality check |

### Order Status Flow

```
NEW → IN_PROGRESS → READY → DELIVERED
         ↓
      CANCELLED
```

### KDS Commands

| Command | Description |
|---------|-------------|
| `bump_order` | Move order to ready |
| `start_order` | Begin preparation |
| `recall_order` | Bring back from ready |
| `set_priority` | Change priority (normal/rush/vip) |
| `assign_station` | Assign to specific station |
| `item_done` | Mark individual item complete |

### Usage

```typescript
import { kitchenDisplayService } from './services/kitchen-display';

// Initialize WebSocket server
kitchenDisplayService.initWebSocketServer(3010);

// Add new order to display
await kitchenDisplayService.addOrder(orderId);

// Get active orders
const orders = kitchenDisplayService.getActiveOrders();

// Get orders by station
const grillOrders = kitchenDisplayService.getOrdersByStation('grill');

// Get statistics
const stats = kitchenDisplayService.getStats();
```

---

## Location Tracking

### Features

- Real-time GPS tracking
- Customer proximity notifications
- Operating hours management
- Schedule/event support
- Multi-truck support

### GPS Update

```typescript
import { locationTrackingService } from './services/location-tracking';

// Update truck location
await locationTrackingService.updateGPSLocation({
  truckId: 'truck-1',
  latitude: 29.7604,
  longitude: -95.3698,
  speed: 15,
  heading: 180,
  accuracy: 10,
  timestamp: new Date()
});
```

### Find Nearby

```typescript
// Find trucks within 5km
const nearby = await locationTrackingService.findNearbyLocations(
  29.7604,  // user latitude
  -95.3698, // user longitude
  5000      // radius in meters
);

// Result
[
  {
    location: { name: 'Downtown Truck', ... },
    distance: 1500,  // 1.5km
    estimatedTravelTime: 5,  // minutes
    isOpen: true,
    nextOpenTime: null
  }
]
```

### Proximity Notifications

```typescript
// Subscribe to notifications when truck is nearby
const subscriptionId = await locationTrackingService.subscribeToProximity({
  userId: 'user-123',
  phone: '+15551234567',
  latitude: 29.7604,
  longitude: -95.3698,
  radiusMeters: 2000,  // 2km
  truckId: 'truck-1'   // optional: specific truck
});

// Unsubscribe
await locationTrackingService.unsubscribeFromProximity(subscriptionId);
```

### Schedule Management

```typescript
// Add schedule entry
await locationTrackingService.addScheduleEntry('location-id', {
  date: '2024-02-15',
  location: 'Downtown Festival',
  latitude: 29.7604,
  longitude: -95.3698,
  startTime: '11:00',
  endTime: '20:00',
  notes: 'Special event menu available'
});

// Get upcoming schedule
const schedule = await locationTrackingService.getUpcomingSchedule('location-id', 7);
```

---

## Loyalty Program

### Tier System

| Tier | Min Points | Points Multiplier | Perks |
|------|-----------|-------------------|-------|
| Bronze | 0 | 1.0x | Basic rewards, Birthday bonus |
| Silver | 500 | 1.25x | Free side on $20+ orders |
| Gold | 1,500 | 1.5x | Free drink, 10% off Wednesdays |
| Platinum | 5,000 | 2.0x | 15% off always, Priority pickup |

### Points System

- **Earning**: 1 point per $1 spent (multiplied by tier)
- **Welcome Bonus**: 50 points on signup
- **Birthday Bonus**: 50-500 points (by tier)
- **Referral Bonus**: 25-200 points (by tier)

### Rewards Catalog

| Reward | Points | Description |
|--------|--------|-------------|
| Free Side | 100 | Any side free |
| Free Drink | 75 | Any drink free |
| $5 Off | 200 | On orders $15+ |
| $10 Off | 350 | On orders $25+ |
| 15% Off | 400 | Entire order |
| Free Dessert | 150 | Cobbler or Pudding |
| Meat Upgrade | 175 | Sandwich → Plate |
| Free Sandwich | 500 | Silver+ only |
| Free Plate | 800 | Gold+ only |

### Usage

```typescript
import { loyaltyProgramService } from './services/loyalty-program';

// Enroll new member
const member = await loyaltyProgramService.enrollMember({
  phone: '+15551234567',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  birthday: '05-15',
  referralCode: 'ABC123'  // optional
});

// Award points after order
const pointsEarned = await loyaltyProgramService.awardOrderPoints(
  member.id,
  25.99,  // order amount
  'order-uuid'
);

// Redeem reward
const redeemed = await loyaltyProgramService.redeemReward(
  member.id,
  'reward-uuid'
);

// Use reward code at checkout
const reward = await loyaltyProgramService.useReward(
  'RWD-ABCD1234',  // redemption code
  'order-uuid'
);

// Get member info
const member = await loyaltyProgramService.getMemberByPhone('+15551234567');

// Get points history
const history = await loyaltyProgramService.getPointsHistory(member.id, 50);

// Get available rewards
const rewards = await loyaltyProgramService.getAvailableRewards(member.id);
```

---

## API Reference

### Multi-Channel

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/channels/sms` | Twilio SMS webhook |
| POST | `/api/channels/whatsapp` | WhatsApp webhook |
| POST | `/api/channels/web-chat` | Web chat message |
| GET | `/api/channels/conversations/:id` | Get conversation |

### Kitchen Display

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kitchen/orders` | Active orders |
| GET | `/api/kitchen/orders/:station` | Orders by station |
| POST | `/api/kitchen/orders/:id/start` | Start order |
| POST | `/api/kitchen/orders/:id/bump` | Bump to ready |
| POST | `/api/kitchen/orders/:id/recall` | Recall order |
| GET | `/api/kitchen/stats` | Kitchen statistics |

### Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | All locations |
| GET | `/api/locations/:id` | Single location |
| POST | `/api/locations` | Create location |
| PUT | `/api/locations/:id/gps` | Update GPS |
| PUT | `/api/locations/:id/status` | Update status |
| GET | `/api/locations/nearby` | Find nearby |
| POST | `/api/locations/subscribe` | Proximity alerts |
| DELETE | `/api/locations/subscribe/:id` | Unsubscribe |
| GET | `/api/locations/:id/schedule` | Get schedule |
| POST | `/api/locations/:id/schedule` | Add schedule |

### Loyalty

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loyalty/enroll` | Enroll member |
| GET | `/api/loyalty/members/:phone` | Get member |
| POST | `/api/loyalty/points/award` | Award points |
| GET | `/api/loyalty/rewards` | Available rewards |
| POST | `/api/loyalty/rewards/:id/redeem` | Redeem reward |
| POST | `/api/loyalty/rewards/use` | Use reward code |
| GET | `/api/loyalty/members/:id/history` | Points history |
| GET | `/api/loyalty/members/:id/rewards` | Member rewards |
| GET | `/api/loyalty/stats` | Program stats |
| GET | `/api/loyalty/tiers` | Tier info |

---

## Database Schema

### New Tables

```sql
-- Loyalty Members
CREATE TABLE loyalty_members (
  id UUID PRIMARY KEY,
  customer_id UUID,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  tier VARCHAR(20) DEFAULT 'bronze',
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  tier_progress_points INTEGER DEFAULT 0,
  tier_since TIMESTAMPTZ,
  birthday VARCHAR(5),
  referral_code VARCHAR(10) UNIQUE,
  referred_by UUID REFERENCES loyalty_members(id),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Rewards
CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2),
  item_name VARCHAR(100),
  min_order_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  tier_required VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  expiration_days INTEGER DEFAULT 30,
  usage_limit INTEGER,
  valid_days INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redeemed Rewards
CREATE TABLE redeemed_rewards (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES loyalty_members(id),
  reward_id UUID REFERENCES loyalty_rewards(id),
  code VARCHAR(20) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points Transactions
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES loyalty_members(id),
  type VARCHAR(20) NOT NULL,
  points INTEGER NOT NULL,
  order_id UUID,
  reward_id UUID,
  description TEXT,
  balance INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Truck Locations
CREATE TABLE truck_locations (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(100),
  truck_id VARCHAR(50),
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_active BOOLEAN DEFAULT TRUE,
  current_status VARCHAR(20) DEFAULT 'closed',
  operating_hours JSONB,
  schedule JSONB,
  last_updated TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location History
CREATE TABLE location_history (
  id UUID PRIMARY KEY,
  truck_id VARCHAR(50),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  speed DECIMAL(5,2),
  heading INTEGER,
  accuracy DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Proximity Subscriptions
CREATE TABLE proximity_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,
  phone VARCHAR(20),
  email VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  radius_meters INTEGER,
  truck_id VARCHAR(50),
  notified_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_loyalty_members_phone ON loyalty_members(phone);
CREATE INDEX idx_loyalty_members_referral_code ON loyalty_members(referral_code);
CREATE INDEX idx_redeemed_rewards_code ON redeemed_rewards(code);
CREATE INDEX idx_redeemed_rewards_member ON redeemed_rewards(member_id);
CREATE INDEX idx_points_transactions_member ON points_transactions(member_id);
CREATE INDEX idx_truck_locations_active ON truck_locations(is_active);
CREATE INDEX idx_location_history_truck ON location_history(truck_id, timestamp);
CREATE INDEX idx_proximity_subs_active ON proximity_subscriptions(active);
```

---

## Environment Variables

```env
# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WHATSAPP_NUMBER=+15559876543

# OpenAI
OPENAI_API_KEY=sk-xxx

# KDS WebSocket
KDS_WEBSOCKET_PORT=3010

# Location
DEFAULT_TIMEZONE=America/Chicago
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-12 | Multi-channel, KDS, Location, Loyalty |
| 1.0.0 | Initial | Voice ordering, menu management |
