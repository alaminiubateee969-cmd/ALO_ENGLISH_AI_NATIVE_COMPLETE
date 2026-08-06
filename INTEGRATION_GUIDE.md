# Integration Guide

## Communication Platform Integrations

### Status Overview
All external provider integrations require account-owner authorization on the production server. The code structure and database schema are ready — only live OAuth credentials are pending.

### WhatsApp Business Cloud API
**Status**: Code complete, OAuth pending
**Required**:
- Meta Business account
- WhatsApp Business phone number
- App review and business verification
**Environment variables**: `WHATSAPP_BUSINESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_SECRET`
**Database**: Message model supports `channel: "WHATSAPP"`

### Facebook Graph API
**Status**: Code complete, OAuth pending
**Required**:
- Facebook App
- Page access token
- App review
**Environment variables**: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_PAGE_ACCESS_TOKEN`

### Instagram Business API
**Status**: Code complete, OAuth pending
**Required**:
- Instagram Business account
- Facebook Business Manager
**Environment variables**: `INSTAGRAM_BUSINESS_ID`, `INSTAGRAM_ACCESS_TOKEN`

### Email (SMTP)
**Status**: Code complete, configuration pending
**Required**:
- SMTP server (Gmail, SendGrid, etc.)
**Environment variables**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`

### Groq AI (Optional)
**Status**: Code complete, API key optional
**Required**:
- Free Groq API key from console.groq.com
**Environment variables**: `AI_ENABLED=true`, `GROQ_API_KEY`
**Note**: Platform works fully without this (local rule engine)

## Webhook Endpoints
When provider authorization is complete, configure webhooks to point to:
- WhatsApp: `https://english.aloeducation.com/api/webhooks/whatsapp`
- Facebook: `https://english.aloeducation.com/api/webhooks/facebook`
- Instagram: `https://english.aloeducation.com/api/webhooks/instagram`

## Integration Health
Monitor integration status via: `GET /api/agents/status`
