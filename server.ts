import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import twilio from 'twilio';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function localSiriFallback(query: string) {
  const q = query.toLowerCase().trim();
  const now = new Date();
  if (q.includes('time')) {
    return {
      reply: `It's ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`,
      actionType: 'none',
      actionTarget: '',
    };
  }
  if (q.includes('date') || q.includes('day')) {
    return {
      reply: `Today is ${now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`,
      actionType: 'none',
      actionTarget: '',
    };
  }
  const mathMatch = q.match(/^[\d\s+\-*/().]+$/);
  if (mathMatch) {
    try {
      const fn = new Function(`return (${mathMatch[0]})`);
      const res = fn();
      if (typeof res === 'number' && Number.isFinite(res)) {
        return { reply: `The answer is ${res}.`, actionType: 'none', actionTarget: '' };
      }
    } catch {
      // ignore math parse failure
    }
  }
  const appAliases: Array<[string[], string, string]> = [
    [['camera', 'photo', 'selfie'], 'camera', 'Camera'],
    [['youtube', 'video'], 'youtube', 'YouTube'],
    [['app store', 'store', 'download'], 'appstore', 'App Store'],
    [['safari', 'browser', 'web'], 'safari', 'Safari'],
    [['google', 'google search'], 'google', 'Google'],
    [['settings', 'preferences'], 'settings', 'Settings'],
    [['music', 'song'], 'music', 'Music'],
    [['spotify'], 'spotify', 'Spotify'],
    [['netflix', 'movie'], 'netflix', 'Netflix'],
    [['weather', 'forecast'], 'weather', 'Weather'],
    [['map', 'maps', 'directions'], 'maps', 'Maps'],
    [['message', 'messages', 'text'], 'messages', 'Messages'],
    [['whatsapp'], 'whatsapp', 'WhatsApp'],
    [['telegram'], 'telegram', 'Telegram'],
    [['phone', 'call'], 'phone', 'Phone'],
    [['calculator', 'calc'], 'calculator', 'Calculator'],
    [['note', 'notes'], 'notes', 'Notes'],
    [['reminder', 'reminders'], 'reminders', 'Reminders'],
    [['clock', 'alarm', 'stopwatch', 'timer'], 'clock', 'Clock'],
    [['calendar'], 'calendar', 'Calendar'],
    [['photos', 'gallery'], 'photos', 'Photos'],
    [['health', 'fitness'], 'health', 'Health'],
    [['wallet', 'pay'], 'wallet', 'Wallet'],
    [['game', 'games', 'arcade'], 'games', 'Games'],
  ];
  if (q.startsWith('search ') || q.startsWith('google ')) {
    const searchTerm = query.replace(/^(search|google)\s+(for\s+)?/i, '').trim();
    if (searchTerm) {
      return { reply: `Searching Google for ${searchTerm}.`, actionType: 'search_web', actionTarget: searchTerm };
    }
  }
  if (q.includes('open') || q.includes('launch') || q.includes('start')) {
    for (const [keys, id, label] of appAliases) {
      if (keys.some((k) => q.includes(k))) {
        return { reply: `Opening ${label}.`, actionType: 'open_app', actionTarget: id };
      }
    }
  }
  if (q.includes('dark mode')) {
    const off = q.includes('off') || q.includes('light');
    return {
      reply: off ? 'Switching to Light appearance.' : 'Turning on Dark Mode.',
      actionType: 'set_dark_mode',
      actionTarget: off ? 'false' : 'true',
    };
  }
  if (q.includes('flashlight') || q.includes('torch')) {
    const off = q.includes('off');
    return {
      reply: off ? 'Turning off Flashlight.' : 'Turning on Flashlight.',
      actionType: 'set_flashlight',
      actionTarget: off ? 'false' : 'true',
    };
  }
  if (q.includes('timer')) {
    const numMatch = q.match(/(\d+)\s*(min|minute|minutes|sec|second|seconds)/);
    if (numMatch) {
      const val = Number(numMatch[1]);
      const secs = numMatch[2].startsWith('min') ? val * 60 : val;
      return {
        reply: `Starting a ${val} ${numMatch[2].startsWith('min') ? 'minute' : 'second'} timer.`,
        actionType: 'start_timer',
        actionTarget: String(secs),
      };
    }
  }
  if (q.includes('play') && (q.includes('music') || q.includes('song'))) {
    return {
      reply: 'Playing your Liquid Glass mix.',
      actionType: 'play_music',
      actionTarget: 'toggle',
    };
  }
  return {
    reply: `Here is what I can help with on iPhone 18 Pro Max: open any app, set timers, toggle Dark Mode or Flashlight, calculate expressions, or answer questions.`,
    actionType: 'none',
    actionTarget: '',
  };
}

async function createServer() {
  const app = express();
  const server = http.createServer(app);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', aiReady: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY) });
  });

  app.post('/api/siri', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const context = typeof req.body?.context === 'string' ? req.body.context : '';
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({ ...localSiriFallback(prompt), source: 'local' });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `User command: "${prompt}"\nDevice context: ${context || 'iPhone 18 Pro Max'}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are Siri inside an iPhone 18 Pro Max simulator. Respond concisely in 1-2 natural spoken sentences. ' +
            'If the user asks to open an app, set actionType="open_app" and actionTarget to one of: phone, contacts, messages, facetime, whatsapp, telegram, mail, safari, google, chrome, camera, photos, appstore, playstore, settings, music, maps, weather, calendar, clock, calculator, notes, reminders, files, voicememos, shortcuts, wallet, health, translate, findmy, tips, youtube, netflix, spotify, games, social, photoeditor, videoeditor, flashlight, screenrecorder, qrscanner, compass, converter, passwords, battery, storage. ' +
            'If asked to toggle dark mode, set actionType="set_dark_mode" and actionTarget="true" or "false". ' +
            'If asked to toggle flashlight, set actionType="set_flashlight" and actionTarget="true" or "false". ' +
            'If asked to set a timer, set actionType="start_timer" and actionTarget to seconds as a string (e.g. "300"). ' +
            'If asked to play music, set actionType="play_music" and actionTarget="play". ' +
            'If asked to search the web, set actionType="search_web" and actionTarget to the search query. ' +
            'Otherwise set actionType="none" and actionTarget="".',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              actionType: { type: Type.STRING },
              actionTarget: { type: Type.STRING },
            },
            required: ['reply', 'actionType', 'actionTarget'],
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        reply: parsed.reply || 'Done.',
        actionType: parsed.actionType || 'none',
        actionTarget: parsed.actionTarget || '',
        source: 'gemini',
      });
    } catch (err) {
      console.error('Siri Gemini fallback:', err);
      res.json({ ...localSiriFallback(prompt), source: 'local' });
    }
  });

  app.post('/api/translate', async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const from = typeof req.body?.from === 'string' ? req.body.from : 'English';
    const to = typeof req.body?.to === 'string' ? req.body.to : 'Spanish';
    if (!text) {
      res.status(400).json({ error: 'Text is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        translated: `[${to}] ${text}`,
        pronunciation: '',
        source: 'local',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Translate from ${from} to ${to}: "${text}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: 'Return JSON with translated text and optional phonetic pronunciation.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translated: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
            },
            required: ['translated'],
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        translated: parsed.translated || text,
        pronunciation: parsed.pronunciation || '',
        source: 'gemini',
      });
    } catch {
      res.json({ translated: text, pronunciation: '', source: 'local' });
    }
  });

  app.get('/api/safari/fetch', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
        return;
      }
    } catch {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4200);
      const upstream = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 20_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/20.0 Mobile/15E148 Safari/604.1',
          Accept: 'text/html,application/xhtml+xml,text/plain',
        },
      });
      clearTimeout(timer);
      const html = await upstream.text();
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3500);

      res.json({
        url: parsedUrl.toString(),
        status: upstream.status,
        title: titleMatch?.[1]?.trim() || parsedUrl.hostname,
        description: descMatch?.[1]?.trim() || '',
        excerpt: stripped,
        xFrameOptions: upstream.headers.get('x-frame-options') || '',
      });
    } catch (err) {
      res.json({
        url: parsedUrl.toString(),
        status: 0,
        title: parsedUrl.hostname,
        description: 'Live fetch unavailable in offline or sandboxed mode.',
        excerpt: '',
        error: err instanceof Error ? err.message : 'Fetch failed',
      });
    }
  });

  // Google Search Autocomplete & Live Web Search (outside Wikipedia)
  const decodeHtmlText = (input: string): string =>
    input
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const googleSearchCache = new Map<
    string,
    {
      expires: number;
      payload: {
        query: string;
        tab: string;
        aiOverview: string;
        results: Array<{
          title: string;
          url: string;
          displayUrl: string;
          domain: string;
          snippet: string;
          publishedAt?: string;
          source: string;
        }>;
        relatedQueries: string[];
        source: string;
      };
    }
  >();

  app.get('/api/google/suggest', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      res.json({ suggestions: [] });
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const upstream = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(q)}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 20_0 like Mac OS X) AppleWebKit/605.1.15',
          },
        }
      );
      clearTimeout(timer);
      if (!upstream.ok) {
        res.json({ suggestions: [] });
        return;
      }
      const data = (await upstream.json()) as unknown[];
      const rawList = Array.isArray(data?.[1]) ? data[1] : [];
      const suggestions = rawList
        .filter((s): s is string => typeof s === 'string')
        .filter((s) => !/\bwikipedia\b/i.test(s) || /\bwikipedia\b/i.test(q))
        .slice(0, 8);
      res.json({ suggestions });
    } catch {
      res.json({ suggestions: [] });
    }
  });

  app.get('/api/google/search', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const tab = typeof req.query.tab === 'string' ? req.query.tab.toLowerCase() : 'all';
    if (!q) {
      res.status(400).json({ error: 'Search query q is required.' });
      return;
    }

    const cacheKey = `${tab}:${q.toLowerCase()}`;
    const cached = googleSearchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      res.json(cached.payload);
      return;
    }

    const wantsWikipedia = /\bwikipedia\b/i.test(q);
    const webQuery = wantsWikipedia ? q : `${q} -site:wikipedia.org`;
    const isNewsTab = tab === 'news';
    const isVideosTab = tab === 'videos';

    type SearchResultItem = {
      title: string;
      url: string;
      displayUrl: string;
      domain: string;
      snippet: string;
      publishedAt?: string;
      source: string;
    };

    const unwrapDdgUrl = (rawHref: string): string => {
      try {
        const resolved = rawHref.startsWith('//') ? `https:${rawHref}` : rawHref;
        const parsed = new URL(resolved, 'https://html.duckduckgo.com');
        const uddg = parsed.searchParams.get('uddg');
        if (uddg) return uddg;
        return parsed.toString();
      } catch {
        return rawHref;
      }
    };

    const fetchOpenWebResults = async (): Promise<SearchResultItem[]> => {
      const items: SearchResultItem[] = [];
      try {
        if (isNewsTab) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5500);
          const newsRes = await fetch(
            `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`,
            {
              signal: controller.signal,
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; iPhoneSimulator/1.0)' },
            }
          );
          clearTimeout(timer);
          if (newsRes.ok) {
            const xml = await newsRes.text();
            const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 12);
            for (const match of itemBlocks) {
              const block = match[1];
              const title = decodeHtmlText(block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i)?.[1] || block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
              const link = decodeHtmlText(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '');
              const pubDate = decodeHtmlText(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '');
              const sourceName = decodeHtmlText(block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || 'Google News');
              if (!title || !link) continue;
              if (!wantsWikipedia && /wikipedia\.org/i.test(link)) continue;
              let domain = sourceName;
              try {
                domain = new URL(link).hostname.replace(/^www\./, '');
              } catch {
                // fallback
              }
              items.push({
                title,
                url: link,
                displayUrl: `${sourceName} · ${domain}`,
                domain,
                snippet: pubDate ? `Google News · Published ${pubDate}` : `Latest coverage from ${sourceName}`,
                publishedAt: pubDate || undefined,
                source: 'google-news-rss',
              });
            }
          }
          if (items.length > 0) return items;
        }

        const effectiveQuery = isVideosTab && !/\b(video|youtube)\b/i.test(webQuery) ? `${webQuery} video` : webQuery;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5500);
        const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(effectiveQuery)}`, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'text/html',
          },
        });
        clearTimeout(timer);
        if (!ddgRes.ok) return items;
        const html = await ddgRes.text();
        const anchorRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        const snippetRegex = /<(?:a|div)[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div)>/gi;
        const snippets = [...html.matchAll(snippetRegex)].map((m) => decodeHtmlText(m[1]));

        let idx = 0;
        for (const match of html.matchAll(anchorRegex)) {
          const realUrl = unwrapDdgUrl(match[1]);
          const title = decodeHtmlText(match[2]);
          const snippet = snippets[idx] || '';
          idx++;
          if (!title || !realUrl || !/^https?:\/\//i.test(realUrl)) continue;
          if (/duckduckgo\.com\/y\.js/i.test(realUrl)) continue;
          if (!wantsWikipedia && /(^|\.)wikipedia\.org/i.test(realUrl)) continue;
          let domain = realUrl;
          let displayUrl = realUrl;
          try {
            const u = new URL(realUrl);
            domain = u.hostname.replace(/^www\./, '');
            const cleanPath = u.pathname === '/' ? '' : u.pathname.slice(0, 42);
            displayUrl = `${domain}${cleanPath}`;
          } catch {
            // keep raw
          }
          items.push({
            title,
            url: realUrl,
            displayUrl,
            domain,
            snippet,
            source: 'web-index',
          });
          if (items.length >= 12) break;
        }
      } catch {
        // upstream open web lookup failed
      }
      return items;
    };

    const fetchGeminiGrounding = async (): Promise<{
      aiOverview: string;
      groundingResults: SearchResultItem[];
      relatedQueries: string[];
    }> => {
      const ai = getGeminiClient();
      if (!ai) {
        return { aiOverview: '', groundingResults: [], relatedQueries: [] };
      }
      try {
        const scopePrompt = isNewsTab
          ? `Provide a concise, up-to-date Google News overview for: "${q}". Cite non-Wikipedia journalism and primary web sources.`
          : isVideosTab
            ? `Find the best videos, channels, and visual resources across the open web (YouTube, Vimeo, official sites, outside Wikipedia) for: "${q}".`
            : `Answer or summarize the Google Search query "${q}" concisely using broad open-web sources outside of Wikipedia (official sites, news, documentation, articles, forums).`;
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: scopePrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        const aiOverview = (response.text || '').trim();
        const metadata = response.candidates?.[0]?.groundingMetadata;
        const chunks = metadata?.groundingChunks || [];
        const relatedQueries = (metadata?.webSearchQueries || []).filter(
          (rq): rq is string => typeof rq === 'string' && rq.trim().length > 0
        );
        const groundingResults: SearchResultItem[] = [];
        for (const chunk of chunks) {
          const web = chunk?.web;
          if (!web?.uri) continue;
          const title = (web.title || web.uri).trim();
          if (!wantsWikipedia && /wikipedia\.org/i.test(`${title} ${web.uri}`)) continue;
          let domain = title;
          try {
            const u = new URL(web.uri);
            if (!u.hostname.includes('vertexaisearch.cloud.google.com')) {
              domain = u.hostname.replace(/^www\./, '');
            }
          } catch {
            // keep title
          }
          groundingResults.push({
            title,
            url: web.uri,
            displayUrl: domain,
            domain,
            snippet: 'Verified source from Google Search grounding',
            source: 'google-grounding',
          });
        }
        return { aiOverview, groundingResults, relatedQueries };
      } catch {
        return { aiOverview: '', groundingResults: [], relatedQueries: [] };
      }
    };

    const [openWebResults, grounding] = await Promise.all([fetchOpenWebResults(), fetchGeminiGrounding()]);

    // Merge organic web results first, appending unique Google Search grounding sources not already present
    const seenUrls = new Set<string>();
    const combinedResults: SearchResultItem[] = [];
    for (const item of [...openWebResults, ...grounding.groundingResults]) {
      const norm = item.url.replace(/\/$/, '').toLowerCase();
      if (seenUrls.has(norm)) continue;
      seenUrls.add(norm);
      combinedResults.push(item);
    }

    if (combinedResults.length === 0 && !grounding.aiOverview) {
      res.status(502).json({
        query: q,
        tab,
        aiOverview: '',
        results: [],
        relatedQueries: [],
        source: 'unavailable',
        error: 'Unable to reach live Google Search or open web search services right now.',
      });
      return;
    }

    const payload = {
      query: q,
      tab,
      aiOverview: grounding.aiOverview,
      results: combinedResults.slice(0, 14),
      relatedQueries: grounding.relatedQueries.slice(0, 6),
      source: grounding.aiOverview && openWebResults.length > 0
        ? 'google-search+web'
        : grounding.aiOverview
          ? 'google-search-grounding'
          : isNewsTab
            ? 'google-news-rss'
            : 'open-web-search',
    };

    googleSearchCache.set(cacheKey, { expires: Date.now() + 3 * 60 * 1000, payload });
    res.json(payload);
  });

  // Live Original YouTube Integration (YouTube Data API v3 when YOUTUBE_API_KEY set + public ytInitialData + oEmbed)
  const ytSearchCache = new Map<
    string,
    { expires: number; videos: unknown[]; channels: unknown[]; playlists: unknown[]; source: string }
  >();
  const ytDetailsCache = new Map<
    string,
    { expires: number; details: unknown; comments: unknown[]; source: string }
  >();
  const YT_GRADIENTS = [
    'from-red-600 via-zinc-900 to-black',
    'from-sky-600 via-indigo-900 to-zinc-950',
    'from-purple-600 via-fuchsia-900 to-zinc-950',
    'from-emerald-600 via-teal-900 to-zinc-950',
    'from-amber-500 via-orange-900 to-zinc-950',
  ];

  const extractJsonObject = (source: string, marker: string): string | null => {
    const idx = source.indexOf(marker);
    if (idx < 0) return null;
    const start = source.indexOf('{', idx + marker.length);
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < source.length; i++) {
      const ch = source[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return source.slice(start, i + 1);
      }
    }
    return null;
  };

  const formatIsoDuration = (iso?: string): string => {
    if (!iso) return 'HD';
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 'HD';
    const h = Number(m[1] || 0);
    const min = Number(m[2] || 0);
    const sec = Number(m[3] || 0);
    if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  app.get('/api/youtube/search', async (req, res) => {
    const rawQ = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : '';
    const type = typeof req.query.type === 'string' ? req.query.type : 'all';
    const q =
      rawQ ||
      (type === 'trending'
        ? 'trending videos today 2026'
        : type === 'music'
          ? 'official music video hits 2026'
          : type === 'live'
            ? 'live stream music news space'
            : type === 'shorts'
              ? 'trending viral shorts'
              : 'trending technology music science gaming 2026');

    const cacheKey = `${type}:${q.toLowerCase()}`;
    const cached = ytSearchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      res.json({
        videos: cached.videos,
        channels: cached.channels,
        playlists: cached.playlists,
        source: cached.source,
      });
      return;
    }

    const ytApiKey = (process.env.YOUTUBE_API_KEY || '').trim();
    if (ytApiKey) {
      try {
        const results: Array<Record<string, unknown>> = [];
        const channels: Array<Record<string, unknown>> = [];
        const playlists: Array<Record<string, unknown>> = [];

        if (type === 'trending' && !rawQ) {
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=24&key=${encodeURIComponent(ytApiKey)}`;
          const apiRes = await fetch(apiUrl, { signal: AbortSignal.timeout(7000) });
          if (apiRes.ok) {
            const apiJson = (await apiRes.json()) as { items?: any[] };
            (apiJson.items || []).forEach((item, idx) => {
              const vid = item.id as string;
              const snip = item.snippet || {};
              const isLive = snip.liveBroadcastContent === 'live';
              const channel = snip.channelTitle || 'YouTube Creator';
              const handleSlug = channel.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'Creator';
              const viewsNum = Number(item.statistics?.viewCount || 0);
              const likesNum = Number(item.statistics?.likeCount || 0);
              results.push({
                id: `yt-${vid}`,
                youtubeId: vid,
                title: snip.title || 'YouTube Video',
                channel,
                channelHandle: `@${handleSlug}`,
                avatarColor: YT_GRADIENTS[idx % YT_GRADIENTS.length].split(' ')[0] + ' to-zinc-800',
                views: isLive ? 'LIVE' : viewsNum ? `${viewsNum.toLocaleString()} views` : 'YouTube',
                uploadedAt: snip.publishedAt ? new Date(snip.publishedAt).toLocaleDateString() : 'Trending',
                duration: isLive ? 'LIVE' : formatIsoDuration(item.contentDetails?.duration),
                category: 'Trending',
                description: snip.description || snip.title || '',
                likes: likesNum,
                gradient: YT_GRADIENTS[idx % YT_GRADIENTS.length],
                thumbnailUrl:
                  snip.thumbnails?.high?.url ||
                  snip.thumbnails?.medium?.url ||
                  `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                isLive,
              });
            });
            ytSearchCache.set(cacheKey, {
              expires: Date.now() + 5 * 60 * 1000,
              videos: results,
              channels,
              playlists,
              source: 'youtube-data-api-v3',
            });
            res.json({ videos: results, channels, playlists, source: 'youtube-data-api-v3' });
            return;
          }
        } else {
          const apiType =
            type === 'channels'
              ? 'channel'
              : type === 'playlists'
                ? 'playlist'
                : type === 'videos' || type === 'live' || type === 'shorts' || type === 'music'
                  ? 'video'
                  : 'video,channel,playlist';
          const extraParams =
            type === 'live'
              ? '&eventType=live'
              : type === 'shorts'
                ? '&videoDuration=short'
                : type === 'music'
                  ? '&videoCategoryId=10'
                  : '';
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(q)}&type=${encodeURIComponent(apiType)}${extraParams}&key=${encodeURIComponent(ytApiKey)}`;
          const apiRes = await fetch(searchUrl, { signal: AbortSignal.timeout(7000) });
          if (apiRes.ok) {
            const apiJson = (await apiRes.json()) as { items?: any[] };
            (apiJson.items || []).forEach((item, idx) => {
              const idObj = item.id || {};
              const snip = item.snippet || {};
              if (idObj.kind === 'youtube#channel' && idObj.channelId) {
                const title = snip.title || 'YouTube Channel';
                const handleSlug = title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'Channel';
                channels.push({
                  id: idObj.channelId,
                  title,
                  handle: `@${handleSlug}`,
                  subscribers: 'Official Channel',
                  description: snip.description || '',
                  avatarUrl: snip.thumbnails?.high?.url || snip.thumbnails?.default?.url || '',
                  verified: true,
                });
              } else if (idObj.kind === 'youtube#playlist' && idObj.playlistId) {
                playlists.push({
                  id: idObj.playlistId,
                  title: snip.title || 'YouTube Playlist',
                  channel: snip.channelTitle || 'YouTube',
                  videoCount: 'Playlist',
                  thumbnailUrl: snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || '',
                  playlistUrl: `https://www.youtube.com/playlist?list=${idObj.playlistId}`,
                });
              } else if (idObj.videoId) {
                const vid = idObj.videoId as string;
                const channel = snip.channelTitle || 'YouTube Creator';
                const handleSlug = channel.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'Creator';
                const isLive = snip.liveBroadcastContent === 'live' || type === 'live';
                results.push({
                  id: `yt-${vid}`,
                  youtubeId: vid,
                  title: snip.title || 'YouTube Video',
                  channel,
                  channelHandle: `@${handleSlug}`,
                  avatarColor: YT_GRADIENTS[idx % YT_GRADIENTS.length].split(' ')[0] + ' to-zinc-800',
                  views: isLive ? 'LIVE' : 'YouTube',
                  uploadedAt: snip.publishedAt ? new Date(snip.publishedAt).toLocaleDateString() : 'YouTube',
                  duration: isLive ? 'LIVE' : type === 'shorts' ? '0:59' : 'HD',
                  category: q,
                  description: snip.description || snip.title || '',
                  likes: 0,
                  gradient: YT_GRADIENTS[idx % YT_GRADIENTS.length],
                  thumbnailUrl:
                    snip.thumbnails?.high?.url ||
                    snip.thumbnails?.medium?.url ||
                    `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                  isShort: type === 'shorts',
                  isLive,
                });
              }
            });
            ytSearchCache.set(cacheKey, {
              expires: Date.now() + 5 * 60 * 1000,
              videos: results,
              channels,
              playlists,
              source: 'youtube-data-api-v3',
            });
            res.json({ videos: results, channels, playlists, source: 'youtube-data-api-v3' });
            return;
          }
        }
      } catch {
        // Fall through seamlessly to live public YouTube search extraction
      }
    }

    try {
      const spMap: Record<string, string> = {
        trending: '&sp=EgIQAQ%253D%253D',
        videos: '&sp=EgIQAQ%253D%253D',
        music: '&sp=EgIQAQ%253D%253D',
        shorts: '&sp=EgIYAQ%253D%253D',
        channels: '&sp=EgIQAg%253D%253D',
        playlists: '&sp=EgIQAw%253D%253D',
        live: '&sp=EgJAAQ%253D%253D',
      };
      const sp = spMap[type] || '';
      const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}${sp}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const upstream = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timer);
      const html = await upstream.text();
      const jsonText =
        extractJsonObject(html, 'var ytInitialData = ') ||
        extractJsonObject(html, 'window["ytInitialData"] = ');
      if (!jsonText) {
        res.json({ videos: [], channels: [], playlists: [], source: 'empty' });
        return;
      }

      const data = JSON.parse(jsonText);
      const seenVideos = new Set<string>();
      const seenChannels = new Set<string>();
      const seenPlaylists = new Set<string>();
      const results: Array<Record<string, unknown>> = [];
      const channels: Array<Record<string, unknown>> = [];
      const playlists: Array<Record<string, unknown>> = [];

      const pushVideo = (v: Record<string, any>, isCompact = false) => {
        const vid = v.videoId as string;
        if (!vid || seenVideos.has(vid) || results.length >= 24) return;
        seenVideos.add(vid);
        const title =
          v.title?.runs?.map((r: any) => r.text).join('') ||
          v.title?.simpleText ||
          'YouTube Video';
        const channel =
          v.ownerText?.runs?.[0]?.text ||
          v.longBylineText?.runs?.[0]?.text ||
          v.shortBylineText?.runs?.[0]?.text ||
          'YouTube Creator';
        const handleSlug = channel.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'Creator';
        const snippet =
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
          v.descriptionSnippet?.runs?.map((r: any) => r.text).join('') ||
          `${title} — ${channel}`;
        const thumbs = v.thumbnail?.thumbnails;
        const rawThumb = Array.isArray(thumbs) && thumbs.length > 0 ? thumbs[thumbs.length - 1]?.url : '';
        const durationText = v.lengthText?.simpleText;
        const isLiveBadge =
          type === 'live' ||
          !durationText ||
          Boolean(
            Array.isArray(v.badges) &&
              v.badges.some((b: any) => String(b?.metadataBadgeRenderer?.label || '').toUpperCase().includes('LIVE'))
          ) ||
          Boolean(
            Array.isArray(v.thumbnailOverlays) &&
              v.thumbnailOverlays.some(
                (o: any) => String(o?.thumbnailOverlayTimeStatusRenderer?.style || '').toUpperCase() === 'LIVE'
              )
          );
        const duration = durationText || (isLiveBadge ? 'LIVE' : isCompact ? 'HD' : 'LIVE');
        const viewsText =
          v.shortViewCountText?.simpleText ||
          v.viewCountText?.simpleText ||
          v.viewCountText?.runs?.map((r: any) => r.text).join('') ||
          (isLiveBadge ? 'Watching now' : 'YouTube');

        results.push({
          id: `yt-${vid}`,
          youtubeId: vid,
          title,
          channel,
          channelHandle: `@${handleSlug}`,
          avatarColor: YT_GRADIENTS[results.length % YT_GRADIENTS.length].split(' ')[0] + ' to-zinc-800',
          views: viewsText,
          uploadedAt: v.publishedTimeText?.simpleText || (isLiveBadge ? 'LIVE' : 'YouTube'),
          duration,
          category: type === 'trending' ? 'Trending' : q,
          description: snippet,
          likes: 0,
          gradient: YT_GRADIENTS[results.length % YT_GRADIENTS.length],
          thumbnailUrl: rawThumb || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          isShort: type === 'shorts',
          isLive: isLiveBadge,
        });
      };

      const walk = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        if (results.length >= 24 && channels.length >= 16 && playlists.length >= 16) return;
        const obj = node as Record<string, any>;

        if (obj.channelRenderer && typeof obj.channelRenderer.channelId === 'string' && channels.length < 16) {
          const c = obj.channelRenderer;
          const cid = c.channelId as string;
          if (!seenChannels.has(cid)) {
            seenChannels.add(cid);
            const title = c.title?.simpleText || c.title?.runs?.map((r: any) => r.text).join('') || 'YouTube Channel';
            const rawHandle =
              c.subscriberCountText?.simpleText ||
              c.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl?.replace(/^\//, '') ||
              `@${title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18)}`;
            const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
            const subscribers = c.videoCountText?.simpleText || 'YouTube Creator';
            const description = c.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '';
            const rawAvatar = c.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';
            const avatarUrl = rawAvatar.startsWith('//') ? `https:${rawAvatar}` : rawAvatar;
            channels.push({
              id: cid,
              title,
              handle,
              subscribers,
              description,
              avatarUrl,
              verified: Boolean(c.ownerBadges?.length),
            });
          }
        }

        if (
          obj.lockupViewModel &&
          obj.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' &&
          typeof obj.lockupViewModel.contentId === 'string' &&
          playlists.length < 16
        ) {
          const p = obj.lockupViewModel;
          const pid = p.contentId as string;
          if (!seenPlaylists.has(pid)) {
            seenPlaylists.add(pid);
            const title = p.metadata?.lockupMetadataViewModel?.title?.content || 'YouTube Playlist';
            const rows = p.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
            const channel = rows?.[0]?.metadataParts?.[0]?.text?.content || 'YouTube';
            const thumbSources =
              p.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources ||
              p.contentImage?.thumbnailViewModel?.image?.sources ||
              [];
            const thumb = Array.isArray(thumbSources) && thumbSources.length > 0 ? thumbSources[thumbSources.length - 1]?.url || '' : '';
            const badgeText =
              p.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.overlays?.[0]
                ?.thumbnailOverlayBadgeViewModel?.thumbnailBadges?.[0]?.thumbnailBadgeViewModel?.text ||
              'Playlist';
            playlists.push({
              id: pid,
              title,
              channel,
              videoCount: badgeText,
              thumbnailUrl: thumb,
              playlistUrl: `https://www.youtube.com/playlist?list=${pid}`,
            });
          }
        }

        if (obj.playlistRenderer && typeof obj.playlistRenderer.playlistId === 'string' && playlists.length < 16) {
          const p = obj.playlistRenderer;
          const pid = p.playlistId as string;
          if (!seenPlaylists.has(pid)) {
            seenPlaylists.add(pid);
            const title = p.title?.simpleText || p.title?.runs?.map((r: any) => r.text).join('') || 'YouTube Playlist';
            const channel = p.shortBylineText?.runs?.[0]?.text || p.longBylineText?.runs?.[0]?.text || 'YouTube';
            const rawThumb =
              p.thumbnails?.[0]?.thumbnails?.slice(-1)[0]?.url || p.thumbnail?.thumbnails?.slice(-1)[0]?.url || '';
            playlists.push({
              id: pid,
              title,
              channel,
              videoCount: p.videoCount ? `${p.videoCount} videos` : 'Playlist',
              thumbnailUrl: rawThumb,
              playlistUrl: `https://www.youtube.com/playlist?list=${pid}`,
            });
          }
        }

        if (obj.videoRenderer && typeof obj.videoRenderer.videoId === 'string') {
          pushVideo(obj.videoRenderer, false);
        } else if (obj.compactVideoRenderer && typeof obj.compactVideoRenderer.videoId === 'string') {
          pushVideo(obj.compactVideoRenderer, true);
        }

        if (type === 'shorts' && obj.shortsLockupViewModel && results.length < 24) {
          const s = obj.shortsLockupViewModel;
          const vid = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId as string | undefined;
          if (vid && !seenVideos.has(vid)) {
            seenVideos.add(vid);
            const title = s.overlayMetadata?.primaryText?.content || 'YouTube Short';
            const views = s.overlayMetadata?.secondaryText?.content || 'YouTube Shorts';
            const thumbs = s.thumbnail?.sources;
            const rawThumb = Array.isArray(thumbs) && thumbs.length > 0 ? thumbs[thumbs.length - 1]?.url : '';
            results.push({
              id: `yt-short-${vid}`,
              youtubeId: vid,
              title,
              channel: 'YouTube Shorts',
              channelHandle: '@YouTubeShorts',
              avatarColor: 'from-red-500 to-rose-700',
              views,
              uploadedAt: 'Shorts',
              duration: '0:59',
              category: 'Shorts',
              description: title,
              likes: 0,
              gradient: YT_GRADIENTS[results.length % YT_GRADIENTS.length],
              thumbnailUrl: rawThumb || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              isShort: true,
            });
          }
        }

        if (Array.isArray(node)) {
          for (const item of node) walk(item);
        } else {
          for (const val of Object.values(obj)) walk(val);
        }
      };

      walk(data);
      ytSearchCache.set(cacheKey, {
        expires: Date.now() + 5 * 60 * 1000,
        videos: results,
        channels,
        playlists,
        source: 'youtube',
      });
      res.json({ videos: results, channels, playlists, source: 'youtube' });
    } catch (err) {
      res.json({
        videos: [],
        channels: [],
        playlists: [],
        source: 'offline',
        error: err instanceof Error ? err.message : 'YouTube search unavailable',
      });
    }
  });

  app.get('/api/youtube/details', async (req, res) => {
    const videoId = typeof req.query.videoId === 'string' ? req.query.videoId.trim() : '';
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      res.status(400).json({ error: 'Valid 11-character YouTube videoId is required.' });
      return;
    }

    const cached = ytDetailsCache.get(videoId);
    if (cached && cached.expires > Date.now()) {
      res.json({ details: cached.details, comments: cached.comments, source: cached.source });
      return;
    }

    const ytApiKey = (process.env.YOUTUBE_API_KEY || '').trim();
    if (ytApiKey) {
      try {
        const [videoRes, commentsRes] = await Promise.all([
          fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(ytApiKey)}`,
            { signal: AbortSignal.timeout(6000) }
          ),
          fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(videoId)}&maxResults=15&order=relevance&key=${encodeURIComponent(ytApiKey)}`,
            { signal: AbortSignal.timeout(6000) }
          ),
        ]);

        const videoJson = videoRes.ok ? ((await videoRes.json()) as { items?: any[] }) : { items: [] };
        const commentsJson = commentsRes.ok ? ((await commentsRes.json()) as { items?: any[] }) : { items: [] };
        const item = videoJson.items?.[0];
        const details = item
          ? {
              youtubeId: videoId,
              title: item.snippet?.title,
              channel: item.snippet?.channelTitle,
              description: item.snippet?.description,
              views: item.statistics?.viewCount
                ? `${Number(item.statistics.viewCount).toLocaleString()} views`
                : undefined,
              likes: Number(item.statistics?.likeCount || 0),
              thumbnailUrl:
                item.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            }
          : null;
        const comments = (commentsJson.items || []).map((c) => {
          const top = c.snippet?.topLevelComment?.snippet || {};
          return {
            id: c.id || Math.random().toString(36).slice(2),
            author: top.authorDisplayName || 'YouTube User',
            text: top.textDisplay?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '',
            time: top.publishedAt ? new Date(top.publishedAt).toLocaleDateString() : 'YouTube',
          };
        });

        ytDetailsCache.set(videoId, {
          expires: Date.now() + 10 * 60 * 1000,
          details,
          comments,
          source: 'youtube-data-api-v3',
        });
        res.json({ details, comments, source: 'youtube-data-api-v3' });
        return;
      } catch {
        // Fall through cleanly to official oEmbed endpoint
      }
    }

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oembedRes.ok) {
        const meta = (await oembedRes.json()) as Record<string, any>;
        const details = {
          youtubeId: videoId,
          title: meta.title || undefined,
          channel: meta.author_name || undefined,
          thumbnailUrl: meta.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
        ytDetailsCache.set(videoId, {
          expires: Date.now() + 15 * 60 * 1000,
          details,
          comments: [],
          source: 'youtube-oembed',
        });
        res.json({ details, comments: [], source: 'youtube-oembed' });
        return;
      }
    } catch {
      // ignore oEmbed failure
    }

    res.json({ details: null, comments: [], source: 'unavailable' });
  });

  // Google Play Store live search & app details proxy
  const playSearchCache = new Map<string, { expires: number; apps: unknown[] }>();
  const playDetailsCache = new Map<string, { expires: number; details: unknown }>();

  const LOCAL_PACKAGE_MAP: Record<string, string> = {
    'com.google.android.googlequicksearchbox': 'google',
    'com.instagram.android': 'instagram',
    'com.zhiliaoapp.musically': 'tiktok',
    'com.ss.android.ugc.trill': 'tiktok',
    'com.twitter.android': 'twitterx',
    'com.discord': 'discord',
    'com.reddit.frontpage': 'reddit',
    'com.android.chrome': 'chrome',
    'com.google.android.gm': 'gmail',
    'com.google.android.apps.docs': 'googledrive',
    'com.ubercab': 'uber',
    'com.amazon.mShop.android.shopping': 'amazon',
    'notion.id': 'notion',
    'com.pinterest': 'pinterest',
    'com.duolingo': 'duolingo',
    'com.snapchat.android': 'snapchat',
    'com.whatsapp': 'whatsapp',
    'org.telegram.messenger': 'telegram',
    'com.google.android.youtube': 'youtube',
    'com.spotify.music': 'spotify',
    'com.netflix.mediaclient': 'netflix',
    'com.google.android.apps.maps': 'maps',
    'com.google.android.apps.translate': 'translate',
  };

  app.get('/api/playstore/search', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = req.query.category === 'games' ? 'games' : 'apps';
    const cacheKey = `${category}:${q.toLowerCase()}`;
    const cached = playSearchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      res.json({ apps: cached.apps, source: 'google-play-cache' });
      return;
    }

    interface ParsedPlayApp {
      packageId: string;
      name: string;
      developer: string;
      icon: string;
      rating: number;
      category: string;
      price: string;
      downloads: string;
      playUrl: string;
      localAppId?: string;
      description?: string;
      screenshots?: string[];
    }

    const apps: ParsedPlayApp[] = [];
    const seen = new Set<string>();

    try {
      const targetUrl = q
        ? `https://play.google.com/store/search?q=${encodeURIComponent(q)}&c=${category}&hl=en&gl=us`
        : `https://play.google.com/store/${category}?hl=en&gl=us`;

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(4500),
      });

      const html = await response.text();
      const blocks = [
        ...html.matchAll(/AF_initDataCallback\(\{key:\s*'([^']+)',[\s\S]*?data:([\s\S]*?),\s*sideChannel:/g),
      ];

      const grabStrings = (x: unknown, out: string[]) => {
        if (typeof x === 'string') {
          const t = x.trim();
          if (t && !t.startsWith('http') && !t.startsWith('/') && !t.startsWith('<a ')) {
            out.push(t);
          }
        } else if (Array.isArray(x)) {
          for (const item of x) grabStrings(item, out);
        }
      };

      const isPaidListing = (rawJson: string): boolean => {
        // Free apps with optional in-app purchases contain "Install" or IAP ranges ("per item", " - $")
        // Only treat an app as paid-to-download if it has an explicit paid purchase price without "Install"
        if (rawJson.includes('"Install"') || /per item|in-app/i.test(rawJson)) return false;
        return /"\$[0-9]+(?:\.[0-9]{2})?"\s*,\s*"Buy"/i.test(rawJson) || /"Buy"\s*,\s*"\$[0-9]+/i.test(rawJson);
      };

      const BAD_DEV_REGEX =
        /^(Rated|Contains|In-App|Users|Shares|Everyone|Teen|Mature|USD|Buy|Install|Diverse Content|Discretion|Violence|Blood|Digital Purchases|Interactive Elements)/i;

      const walk = (node: unknown) => {
        if (!Array.isArray(node)) return;
        const str = JSON.stringify(node);
        if (str.includes('/store/apps/details?id=')) {
          const allIds = [...str.matchAll(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/g)].map((m) => m[1]);
          const uniqueIds = new Set(allIds);
          if (uniqueIds.size === 1) {
            const pkg = allIds[0];
            if (!seen.has(pkg) && apps.length < 32) {
              const imgs = [
                ...str.matchAll(/https:\/\/play-lh\.googleusercontent\.com\/[^"\\]+/g),
              ].map((m) => m[0]);
              const strings: string[] = [];
              grabStrings(node, strings);

              const isStandard = strings[0] === pkg;
              let name = pkg;
              let developer = 'Google Play Developer';
              let appCat = category === 'games' ? 'Games' : 'Apps';
              let rating = 4.6;
              let price = 'Free';

              if (isStandard) {
                name = strings[1] || pkg;
                const parsedR = parseFloat(strings[2] || '');
                if (!Number.isNaN(parsedR) && parsedR >= 1 && parsedR <= 5) {
                  rating = Number(parsedR.toFixed(1));
                }
                if (strings[3] && strings[3].length < 40 && strings[3] !== 'USD') {
                  appCat = strings[3];
                }
                if (isPaidListing(str)) {
                  const pm = str.match(/\$[0-9]+(?:\.[0-9]{2})?/);
                  if (pm) price = pm[0];
                }
              } else {
                const cleanCandidate = strings.find(
                  (s) =>
                    s !== pkg &&
                    s.length >= 2 &&
                    s.length <= 60 &&
                    !s.startsWith('qgJ') &&
                    !s.includes('==') &&
                    !['Everyone', 'Everyone 10+', 'Teen', 'Mature 17+'].includes(s)
                );
                name = cleanCandidate || pkg;
                const ratingM = str.match(/Rated ([0-9.]+) stars/);
                if (ratingM) rating = Number(parseFloat(ratingM[1]).toFixed(1));
                const devCandidate = strings.find(
                  (s) =>
                    s !== name &&
                    !s.startsWith('qgJ') &&
                    !s.includes('==') &&
                    s.length > 2 &&
                    s.length < 45 &&
                    !BAD_DEV_REGEX.test(s)
                );
                if (devCandidate) developer = devCandidate;
                if (isPaidListing(str)) {
                  const pm = str.match(/\$[0-9]+(?:\.[0-9]{2})?/);
                  if (pm) price = pm[0];
                }
              }

              const dlMatch = str.match(/([0-9,.]+[KMB]\+)/);
              seen.add(pkg);
              apps.push({
                packageId: pkg,
                name,
                developer,
                icon: imgs[0] ? `${imgs[0].split('=')[0]}=s160-rw` : '',
                rating,
                category: appCat,
                price,
                downloads: dlMatch ? dlMatch[1] : '10M+',
                playUrl: `https://play.google.com/store/apps/details?id=${pkg}`,
                localAppId: LOCAL_PACKAGE_MAP[pkg],
              });
            }
            return;
          }
        }
        for (const child of node) {
          if (Array.isArray(child)) walk(child);
        }
      };

      for (const b of blocks) {
        try {
          walk(JSON.parse(b[2]));
        } catch {
          // ignore unparseable block
        }
      }
    } catch {
      // Fall through to official iTunes fallback if Play Store scraping fails
    }

    // Fallback / complement using official public Apple iTunes Search API (zero cost free apps) when search query yields few results
    if (q && apps.length < 6) {
      try {
        const itRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=14&country=us`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (itRes.ok) {
          const itData = (await itRes.json()) as { results?: Array<Record<string, any>> };
          for (const r of itData.results || []) {
            if (typeof r.price === 'number' && r.price > 0) continue;
            const pkg = String(r.bundleId || `app.store.${r.trackId || Math.random()}`);
            if (seen.has(pkg)) continue;
            seen.add(pkg);
            apps.push({
              packageId: pkg,
              name: String(r.trackName || pkg),
              developer: String(r.artistName || 'App Developer'),
              icon: String(r.artworkUrl512 || r.artworkUrl100 || ''),
              rating: r.averageUserRating ? Number(Number(r.averageUserRating).toFixed(1)) : 4.7,
              category: String(r.primaryGenreName || 'Apps'),
              price: 'Free',
              downloads: r.userRatingCount ? `${Number(r.userRatingCount).toLocaleString()} reviews` : '1M+',
              playUrl: String(r.trackViewUrl || `https://play.google.com/store/search?q=${encodeURIComponent(q)}`),
              description: String(r.description || '').slice(0, 600),
              screenshots: Array.isArray(r.screenshotUrls) ? r.screenshotUrls.slice(0, 5) : [],
            });
          }
        }
      } catch {
        // ignore secondary store fallback error
      }
    }

    if (apps.length > 0) {
      playSearchCache.set(cacheKey, { expires: Date.now() + 5 * 60 * 1000, apps });
    }
    res.json({ apps, source: apps.length > 0 ? 'google-play' : 'empty' });
  });

  app.get('/api/playstore/details', async (req, res) => {
    const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
    if (!id) {
      res.status(400).json({ error: 'Missing id parameter' });
      return;
    }

    const cached = playDetailsCache.get(id);
    if (cached && cached.expires > Date.now()) {
      res.json({ details: cached.details, source: 'google-play-cache' });
      return;
    }

    try {
      const response = await fetch(`https://play.google.com/store/apps/details?id=${encodeURIComponent(id)}&hl=en&gl=us`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(9000),
      });
      const html = await response.text();
      const ldMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
      const ld = ldMatch ? JSON.parse(ldMatch[1]) : {};

      const allImgs = [
        ...new Set([...html.matchAll(/https:\/\/play-lh\.googleusercontent\.com\/[a-zA-Z0-9_-]+/g)].map((m) => m[0])),
      ];
      const iconBase = typeof ld.image === 'string' ? ld.image.split('=')[0] : allImgs[0] || '';
      const screenshots = allImgs
        .filter((u) => u !== iconBase)
        .slice(0, 6)
        .map((u) => `${u}=w720-h1280-rw`);

      const dlMatch = html.match(/([0-9,.]+[KMB]\+)\s*<\/div>\s*<div[^>]*>Downloads/i) || html.match(/([0-9]+[KMB]\+)/);
      const rawPrice = ld.offers?.[0]?.price;
      const versionMatch = html.match(/\[\[\["(\d+(?:\.\d+){1,3})"/);
      const updatedMatch = html.match(/Updated on<\/div><div[^>]*>([^<]+)<\/div>/i);
      const parsedReviews: Array<{ id: string; author: string; rating: number; date: string; text: string }> = [];
      const reviewBlockMatches = [
        ...html.matchAll(/<div class="h3YV2d">([\s\S]*?)<\/div>/g),
      ];
      const authorMatches = [...html.matchAll(/<div class="X5PpBb">([^<]+)<\/div>/g)];
      const dateMatches = [...html.matchAll(/<span class="bp9Aid">([^<]+)<\/span>/g)];
      for (let i = 0; i < Math.min(6, reviewBlockMatches.length); i++) {
        const cleanText = reviewBlockMatches[i][1].replace(/<[^>]+>/g, '').trim();
        if (!cleanText) continue;
        parsedReviews.push({
          id: `gp-rev-${i}`,
          author: authorMatches[i]?.[1]?.trim() || 'Google Play User',
          rating: 5,
          date: dateMatches[i]?.[1]?.trim() || 'Recent',
          text: cleanText,
        });
      }

      const details = {
        packageId: id,
        name: ld.name || id,
        developer: ld.author?.name || 'Google Play Developer',
        icon: iconBase ? `${iconBase}=s256-rw` : '',
        rating: ld.aggregateRating?.ratingValue ? Number(parseFloat(ld.aggregateRating.ratingValue).toFixed(1)) : 4.6,
        ratingCount: ld.aggregateRating?.ratingCount ? Number(ld.aggregateRating.ratingCount).toLocaleString() : '120K',
        category: String(ld.applicationCategory || 'Application').replace(/^GAME_/, '').replace(/_/g, ' '),
        price: rawPrice && String(rawPrice) !== '0' ? `$${rawPrice}` : 'Free',
        downloads: dlMatch ? dlMatch[1] : '10M+',
        version: versionMatch?.[1] || 'Latest',
        updatedOn: updatedMatch?.[1]?.trim() || 'Current',
        description: ld.description || 'Verified listing from Google Play Store.',
        screenshots,
        reviews: parsedReviews,
        playUrl: `https://play.google.com/store/apps/details?id=${id}`,
        localAppId: LOCAL_PACKAGE_MAP[id],
        installType: LOCAL_PACKAGE_MAP[id] ? 'builtin-native' : 'play-catalog',
      };

      playDetailsCache.set(id, { expires: Date.now() + 10 * 60 * 1000, details });
      res.json({ details, source: 'google-play' });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to fetch Play Store details' });
    }
  });

  // ==================== REAL VOIP & TWILIO VOICE BACKEND ====================
  interface VoipClient {
    ws: WebSocket;
    extension: string;
    name: string;
  }
  const voipPeers = new Map<string, VoipClient>();

  const broadcastPeersList = () => {
    const peers = Array.from(voipPeers.values()).map((p) => ({
      extension: p.extension,
      name: p.name,
    }));
    const payload = JSON.stringify({ type: 'peers:list', peers });
    for (const peer of voipPeers.values()) {
      if (peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(payload);
      }
    }
  };

  const wss = new WebSocketServer({ server, path: '/ws/voice' });
  wss.on('connection', (ws) => {
    let clientExt = '';

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, any>;
        if (msg.type === 'register') {
          const ext = String(msg.extension || '').trim();
          const name = String(msg.name || 'iPhone User').trim().slice(0, 40);
          if (!ext) return;
          if (clientExt && clientExt !== ext) {
            voipPeers.delete(clientExt);
          }
          clientExt = ext;
          voipPeers.set(ext, { ws, extension: ext, name });
          ws.send(JSON.stringify({ type: 'registered', extension: ext, name }));
          broadcastPeersList();
          return;
        }

        const targetExt = typeof msg.to === 'string' ? msg.to.trim() : '';
        if (!targetExt) return;
        const target = voipPeers.get(targetExt);

        if (target && target.ws.readyState === WebSocket.OPEN) {
          target.ws.send(
            JSON.stringify({
              ...msg,
              from: clientExt || msg.from,
            })
          );
        } else if (msg.type === 'call:invite') {
          ws.send(
            JSON.stringify({
              type: 'call:unavailable',
              callId: msg.callId,
              to: targetExt,
              reason: `VoIP extension ${targetExt} is offline or not registered.`,
            })
          );
        }
      } catch {
        // ignore malformed signaling packets
      }
    });

    ws.on('close', () => {
      if (clientExt && voipPeers.get(clientExt)?.ws === ws) {
        voipPeers.delete(clientExt);
        broadcastPeersList();
      }
    });
  });

  const isTwilioConfigured = () => {
    const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const apiKey = (process.env.TWILIO_API_KEY || '').trim();
    const apiSecret = (process.env.TWILIO_API_SECRET || '').trim();
    const twimlAppSid = (process.env.TWILIO_TWIML_APP_SID || '').trim();
    return Boolean(sid && apiKey && apiSecret && twimlAppSid);
  };

  app.get('/api/voice/config', (_req, res) => {
    const twilioConfigured = isTwilioConfigured();
    res.json({
      twilioConfigured,
      callerId: (process.env.TWILIO_CALLER_ID || '').trim() || null,
      webrtcSignalingReady: true,
      onlinePeersCount: voipPeers.size,
      stunServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
  });

  app.post('/api/voice/token', (req, res) => {
    if (!isTwilioConfigured()) {
      res.status(503).json({
        configured: false,
        error:
          'Twilio PSTN calling is not configured on the server (missing TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, or TWILIO_TWIML_APP_SID). Use WebRTC VoIP extension calling instead.',
      });
      return;
    }
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
      const apiKey = process.env.TWILIO_API_KEY!.trim();
      const apiSecret = process.env.TWILIO_API_SECRET!.trim();
      const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID!.trim();
      const rawIdentity = typeof req.body?.identity === 'string' ? req.body.identity.trim() : 'iphone_18_user';
      const identity = rawIdentity.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 60) || 'iphone_18_user';

      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid,
        incomingAllow: true,
      });
      const token = new AccessToken(accountSid, apiKey, apiSecret, {
        identity,
        ttl: 3600,
      });
      token.addGrant(voiceGrant);

      res.json({
        configured: true,
        identity,
        token: token.toJwt(),
        callerId: (process.env.TWILIO_CALLER_ID || '').trim() || null,
      });
    } catch (err) {
      res.status(500).json({
        configured: false,
        error: err instanceof Error ? err.message : 'Failed to generate Twilio Voice AccessToken',
      });
    }
  });

  app.post('/api/voice/twiml', (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    const to = typeof req.body?.To === 'string' ? req.body.To.trim() : '';
    const callerId = (process.env.TWILIO_CALLER_ID || req.body?.From || '').trim();

    if (to) {
      const dial = callerId ? twiml.dial({ callerId }) : twiml.dial();
      if (/^[+\d\s\-().]{3,20}$/.test(to)) {
        const sanitized = to.replace(/[^\d+]/g, '');
        dial.number(sanitized);
      } else {
        dial.client(to);
      }
    } else {
      twiml.say('Connected to the iPhone 18 Pro Max Twilio Voice gateway.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
  });

  // ==================== WHATSAPP BUSINESS CLOUD API PROXY ====================
  app.get('/api/whatsapp/config', (_req, res) => {
    const token = (process.env.WHATSAPP_CLOUD_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    res.json({
      businessApiConfigured: Boolean(token && phoneNumberId),
      officialWebUrl: 'https://web.whatsapp.com',
      clickToChatBase: 'https://wa.me/',
    });
  });

  app.post('/api/whatsapp/send', async (req, res) => {
    const token = (process.env.WHATSAPP_CLOUD_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    if (!token || !phoneNumberId) {
      res.status(503).json({
        sent: false,
        error:
          'WhatsApp Business Cloud API is not configured on the server. Use official WhatsApp links (wa.me / web.whatsapp.com) instead.',
      });
      return;
    }

    const to = typeof req.body?.to === 'string' ? req.body.to.replace(/[^\d]/g, '') : '';
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!to || !text) {
      res.status(400).json({ sent: false, error: 'Recipient phone digits and message text are required.' });
      return;
    }

    try {
      const apiRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
        signal: AbortSignal.timeout(9000),
      });
      const data = (await apiRes.json()) as Record<string, any>;
      if (!apiRes.ok) {
        res.status(apiRes.status).json({
          sent: false,
          error: data?.error?.message || `Meta Cloud API HTTP ${apiRes.status}`,
        });
        return;
      }
      res.json({
        sent: true,
        messageId: data?.messages?.[0]?.id || null,
      });
    } catch (err) {
      res.status(502).json({
        sent: false,
        error: err instanceof Error ? err.message : 'Unable to reach Meta WhatsApp Cloud API',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`iPhone 18 Pro Max Simulator server listening on http://localhost:${PORT}`);
    // Background cache warm so initial Play Store / YouTube opens have zero cold-start lag
    setTimeout(() => {
      const base = `http://127.0.0.1:${PORT}`;
      void fetch(`${base}/api/playstore/search?category=apps`).catch(() => {});
      void fetch(`${base}/api/playstore/search?category=games`).catch(() => {});
      void fetch(`${base}/api/youtube/search?q=trending&type=trending`).catch(() => {});
    }, 600);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
