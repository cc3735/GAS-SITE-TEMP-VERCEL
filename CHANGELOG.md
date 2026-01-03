# Changelog

All notable changes to the AI-Operating platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-02

### Added

#### Organization Management
- **Email Invitation System**: GAS admins can now invite users to organizations via email
  - Secure invitation tokens with 7-day expiration
  - Role selection during invitation (Owner, Admin, Member, Viewer)
  - Email delivery via Supabase Edge Functions + Resend API
  - Invitation acceptance page with automatic organization assignment

- **Domain Auto-Join**: Organizations can enable automatic membership based on email domain
  - Opt-in feature per organization
  - Configure multiple allowed domains
  - Users with matching domains auto-join as members on signup
  - Settings managed via GAS Admin Settings page

- **Organization Setup Page**: New user onboarding flow
  - Redirects users without organizations to setup page
  - Handles invitation token acceptance
  - Manual organization creation for non-invited users

#### Navigation Consolidation
- **Lead Engagement Page**: Merged section with tabs
  - Combines "Intake Engine" and "Nudge Campaigns"
  - Tabbed interface for easy switching
  - Cleaner sidebar navigation

- **AI Infrastructure Page**: Merged section with tabs
  - Combines "AI Agents" and "MCP Servers"
  - Tabbed interface for related features
  - Permission-aware UI (MCP config restricted to GAS admins)

#### Permission System
- **Enhanced Role-Based Permissions**
  - New `usePermissions` hook with comprehensive permission checks
  - `canConfigureMcpServers` permission for GAS admins only
  - `canViewBusinessApps` restricted to GAS master organization

- **MCP Server Toggles in Mission Control**
  - Clients can enable/disable MCP servers in their dashboard
  - Toggle switches in Command Center tab
  - Real-time status updates

#### GAS Admin Features
- **Business Apps Section**: Now exclusive to GAS master organization
  - Hidden from client organizations
  - Full app management capabilities for admins

- **GAS Admin Settings**: Enhanced per-organization configuration
  - Visibility toggles (Unified Inbox, Business Apps, AI Agents, etc.)
  - Domain auto-join configuration UI
  - PII masking settings

### Changed

#### Database Schema
- Added `domain_auto_join_enabled` column to `organizations` table
- Added `allowed_domains` array column to `organizations` table
- Created `organization_invitations` table for invitation management
- New RLS policies using `SECURITY DEFINER` helper functions to prevent circular dependencies:
  - `get_user_org_ids()` - Returns user's organization IDs
  - `is_master_admin()` - Checks master admin status

#### Navigation Structure
- Removed standalone "Intake Engine" from sidebar (now in Lead Engagement)
- Removed standalone "Nudge Campaigns" from sidebar (now in Lead Engagement)
- Removed standalone "AI Agents" from sidebar (now in AI Infrastructure)
- Removed standalone "MCP Servers" from sidebar (now in AI Infrastructure)
- Added "Lead Engagement" to base navigation
- Added "AI Infrastructure" to base navigation
- Moved "Business Apps" from base to master-only navigation

#### User Experience
- GAS admins no longer see the client "Mission Control" when not impersonating
- Clear visual distinction between GAS admin features and client features
- Improved organization context handling for new users

### Fixed

- **Login Issues for Non-GAS Users**: Fixed blank page when users without organizations logged in
  - `OrganizationRoute` now properly redirects to `/setup` page
  - `OrganizationContext` handles missing organizations gracefully

- **RLS Policy Circular Dependencies**: Resolved infinite recursion in Row Level Security policies
  - Created `SECURITY DEFINER` helper functions
  - Policies now use these functions instead of direct table queries

### Security

- Invitation tokens are cryptographically secure UUIDs
- Invitation links expire after 7 days
- Only authenticated users can accept invitations
- Only GAS master admins can send invitations
- Domain auto-join is opt-in and configurable per organization

### Documentation

- Updated `README.md` with new features and navigation structure
- Updated `project/README.md` with detailed project architecture
- Enhanced `docs/integration/API_REFERENCE.md` with invitation APIs
- Updated `docs/admin-training/ADMIN_DASHBOARD_GUIDE.md` with GAS admin features
- Updated `docs/admin-training/CUSTOMER_ONBOARDING.md` with invitation workflow
- Updated `docs/integration/AI_OPERATING_INTEGRATION.md` with permission system
- Created `docs/DATABASE_SCHEMA.md` with comprehensive schema documentation

### Dependencies

- Supabase Edge Functions for email delivery
- Resend API for transactional emails

---

## [1.0.0] - 2025-12-23

### Added

- Initial release of AI-Operating platform
- Multi-tenant organization management
- AI Agent management with playground
- Project management with Kanban boards
- CRM system with contact management
- Marketing campaign management
- Social media scheduling
- Business app instance management
- Real-time dashboard analytics
- Row Level Security for data isolation
- Google OAuth and email authentication
- Command palette (Cmd+K) for quick navigation
- Toast notification system

### Database

- Initial schema with organizations, members, projects, contacts
- AI agents and MCP servers tables
- Marketing and social media tables
- Business apps and instances tables
- Full RLS policy implementation

---

[Unreleased]: https://github.com/your-org/ai-operating/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/your-org/ai-operating/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your-org/ai-operating/releases/tag/v1.0.0

