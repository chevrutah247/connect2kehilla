// Store Specials — MCG (My Cloud Grocer) API integration

export interface Store {
  id: string;
  name: string;
  apiBase: string | null; // null = no API access
  webUrl: string;
}

export interface Special {
  name: string;
  price: string;
  oldPrice: string | null;
  category: string;
}

// All stores from user's list
const STORES: Store[] = [
  { id: 'rosemary', name: 'Rosemary Kosher', apiBase: 'https://rosemarykosher.com/api', webUrl: 'https://rosemarykosher.com/Rosemary' },
  { id: 'koshertown', name: 'KosherTown', apiBase: 'https://koshertown.com/api', webUrl: 'https://koshertown.com/brooklyn' },
  { id: 'empire', name: 'Empire Kosher', apiBase: 'https://empirekoshersupermarket.com/api', webUrl: 'https://empirekoshersupermarket.com/empire' },
  { id: 'kosherfamily', name: 'Kosher Family', apiBase: 'https://kosherfamily.com/api', webUrl: 'https://kosherfamily.com/Brooklyn-Crown-Heights' },
  { id: 'breadberry', name: 'Breadberry', apiBase: 'https://breadberry.com/api', webUrl: 'https://breadberry.com/Brooklyn' },
  { id: 'pomppeople', name: 'Pom People', apiBase: null, webUrl: 'https://thepompeopleonline.com' },
  { id: 'southside', name: 'Southside Kosher', apiBase: null, webUrl: 'https://www.southsidekosher.com' },
  { id: 'gottlieb', name: "Gottlieb's Restaurant", apiBase: null, webUrl: 'https://gottliebrestaurant.com/order' },
  { id: 'kosherdepot', name: 'The Kosher Depot', apiBase: null, webUrl: 'http://www.thekosherdepot.com' },
];

export function getAllStores(): Store[] {
  return STORES;
}

export function getStoreByIndex(index: number): Store | null {
  if (index < 0 || index >= STORES.length) return null;
  return STORES[index];
}

export function formatStoreListForSMS(): string {
  const lines = STORES.map((s, i) => {
    const tag = s.apiBase ? '' : ' (website only)';
    return `${i + 1}. ${s.name}${tag}`;
  });
  return `🏷 Kosher Store Specials:\n${lines.join('\n')}\n\nReply 1-${STORES.length} to see specials`;
}

export async function fetchStoreSpecials(store: Store): Promise<Special[]> {
  if (!store.apiBase) return [];

  try {
    const res = await fetch(`${store.apiBase}/AjaxFilter/JsonProductsList?pageNumber=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; Connect2Kehilla/1.0)',
      },
      body: JSON.stringify([{ FilterType: 6, Value1: 1, categoryId: 0 }]),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const raw = data.productsJson || data.ProductsJson || '[]';
    const products = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return products.map((p: any) => ({
      name: p.N || '',
      price: p.P || '',
      oldPrice: p.O || null,
      category: p.CN || '',
    }));
  } catch {
    return [];
  }
}

export function formatSpecialsForSMS(store: Store, specials: Special[]): string {
  if (specials.length === 0) {
    if (!store.apiBase) {
      return `🏷 ${store.name}\nVisit their website for specials:\n${store.webUrl}\n\nReply SPECIALS for store list`;
    }
    return `🏷 ${store.name}\nNo specials available right now.\n\nReply SPECIALS for store list`;
  }

  // Sort by discount (items with oldPrice first)
  const sorted = [...specials].sort((a, b) => {
    if (a.oldPrice && !b.oldPrice) return -1;
    if (!a.oldPrice && b.oldPrice) return 1;
    return 0;
  });

  const header = `🏷 ${store.name} Specials (${specials.length} items):\n\n`;
  const footer = `\n\nReply SPECIALS for store list`;
  const maxLen = 1500 - header.length - footer.length;

  let body = '';
  let count = 0;

  for (const s of sorted) {
    const discount = s.oldPrice ? ` (was ${s.oldPrice})` : '';
    const line = `• ${s.name} ${s.price}${discount}\n`;

    if (body.length + line.length > maxLen) break;
    body += line;
    count++;
  }

  if (count < specials.length) {
    body += `... and ${specials.length - count} more\n`;
  }

  return header + body.trim() + footer;
}
