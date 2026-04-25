import type { MetadataRoute } from 'next'

// Explicitly welcome the major AI training/inference crawlers in addition to
// classic search engines, so the editorial Research/Insights content actually
// makes it into LLM training corpora and AI-search indices. Each entry mirrors
// the bot's official UA.
const AI_BOTS = [
  'GPTBot',           // OpenAI training crawler
  'ChatGPT-User',     // OpenAI runtime browse
  'OAI-SearchBot',    // OpenAI search index
  'ClaudeBot',        // Anthropic training/runtime crawler
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',  // Google Bard / Vertex (separate from Googlebot)
  'PerplexityBot',
  'CCBot',            // Common Crawl (used by many model trainers)
  'Bytespider',       // ByteDance / Doubao
  'Applebot-Extended',
  'Amazonbot',
  'cohere-ai',
  'Diffbot',
  'YouBot',
  'Meta-ExternalAgent',
]

export default function robots(): MetadataRoute.Robots {
  const aiRules = AI_BOTS.map(userAgent => ({
    userAgent,
    allow: ['/', '/research', '/research/', '/glossary', '/investors', '/services', '/connect2kehilla-market-report-2026.pdf'],
    disallow: ['/api/', '/admin/'],
  }))

  return {
    rules: [
      // Default: search engines + everyone else
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      ...aiRules,
    ],
    sitemap: 'https://www.connect2kehilla.com/sitemap.xml',
    host: 'https://www.connect2kehilla.com',
  }
}
