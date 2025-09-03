<div align="center">
  <img src="https://github.com/user-attachments/assets/5ceec814-a0e5-45c4-84a9-9001000ff3c5" alt="Amurex Logo" width="800" />

  <h2>Amurex Web</h2>

  <p>
    <a href="https://github.com/thepersonalaicompany/amurex/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License" />
    </a>
    <a href="https://chrome.google.com/webstore/detail/amurex/dckidmhhpnfhachdpobgfbjnhfnmddmc">
      <img src="https://img.shields.io/chrome-web-store/v/dckidmhhpnfhachdpobgfbjnhfnmddmc.svg" alt="Chrome Web Store" />
    </a>
    <a href="https://twitter.com/thepersonalaico">
      <img src="https://img.shields.io/twitter/follow/thepersonalaico?style=social" alt="Twitter Follow" />
    </a>
    <a href="https://discord.gg/ftUdQsHWbY">
      <img alt="Discord" src="https://img.shields.io/discord/1306591395804348476">
    </a>
  </p>
</div>

## Amurex Web

Amurex Web is the web interface for Amurex, providing a powerful search engine across all your knowledge. Built with Next.js, it enables fast retrieval of past meetings, notes, and documents, ensuring seamless access to your information.

## Demo

https://github.com/user-attachments/assets/050bf888-18f8-414d-b1ad-7f8e2f8fced7

## Features

• Universal Search – Instantly find past meetings, notes, and documents.

• Meeting Hub – View and manage past meetings with rich context.

• Optimized for Speed – Built upon our SOTA retrieval algorithm called FAFSeach.

## Prerequisites

- Node.js 18+

- npm, yarn, or pnpm

## Getting Started

First, clone the repository:

```
git clone https://github.com/thepersonalaicompany/amurex-web
cd amurex-web
```

Create a .env.local file in the root directory with the following variables:

```
# supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_URL=

# opeani
OPENAI_API_KEY=

# base url
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_APP_URL=

# notion
NOTION_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_AUTH_URL=
NOTION_REDIRECT_URI=

# google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_CALENDAR_REDIRECT_URI=

# embeddings (using mistral now)
MIXEDBREAD_API_KEY=
MISTRAL_API_KEY=

# resend
RESEND_API_KEY=
```

### Installation

1. Install dependencies:

```
npm install  # or yarn install or pnpm install
```

2. Run the development server:

```
npm run dev  # or yarn dev or pnpm dev
```

3. Open http://localhost:3000 in your browser.

### Building for Production

To create an optimized production build:

```
npm run build
```

To start the production server:

```
npm run start
```

### Learn More

To learn more about Next.js, check out:

- [Next.js Documentation](https://nextjs.org/docs)

- [Learn Next.js](https://nextjs.org/docs)
