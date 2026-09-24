import { detectItemType, getFaviconUrl, getSiteName, normalizeUrl } from '../../../lib/url';
import { generateId } from '../../../lib/utils';
import { CreateItemInput, Item, ItemFilter, Tag, TagWithCount, UpdateItemInput } from '../../../types/item';
import { INITIAL_ITEMS } from '../seedData';
import { ItemsRepository } from './repository';

const STORAGE_KEY = 'readlater_items_v3';

export class LocalStorageItemsRepository implements ItemsRepository {
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Listen for storage events from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
          this.notify();
        }
      });
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying subscriber:', err);
      }
    });
  }

  private loadRaw(): Item[] {
    if (typeof window === 'undefined') return INITIAL_ITEMS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ITEMS));
        return INITIAL_ITEMS;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.warn('Storage data is not an array, falling back to initial items');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ITEMS));
        return INITIAL_ITEMS;
      }

      // Sanitize items against corrupted or legacy records
      return parsed.map((raw): Item => {
        const item = raw as Partial<Item>;
        return {
          id: String(item.id || generateId()),
          url: String(item.url || ''),
          title: String(item.title || item.siteName || 'Без названия'),
          description: typeof item.description === 'string' ? item.description : '',
          imageUrl: item.imageUrl,
          faviconUrl: item.faviconUrl,
          siteName: item.siteName,
          author: item.author,
          publishedAt: item.publishedAt,
          type: item.type || 'article',
          status: item.status || 'inbox',
          isFavorite: Boolean(item.isFavorite),
          tags: Array.isArray(item.tags)
            ? (item.tags as unknown[]).map((rawTag): Tag => {
                if (typeof rawTag === 'string') {
                  const clean = rawTag.replace(/^#/, '').trim().toLowerCase();
                  return { id: `tag-${clean}`, name: clean };
                }
                const tagObj = rawTag as Partial<Tag> | null | undefined;
                const name = typeof tagObj?.name === 'string' ? tagObj.name.replace(/^#/, '').trim().toLowerCase() : 'untagged';
                return {
                  id: tagObj?.id || `tag-${name}`,
                  name,
                };
              })
            : [],
          notes: typeof item.notes === 'string' ? item.notes : '',
          readAt: item.readAt,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        };
      });
    } catch (err) {
      console.error('Failed to parse localStorage data', err);
      return INITIAL_ITEMS;
    }
  }

  private saveRaw(items: Item[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      this.notify();
    } catch (err) {
      console.error('Failed to save to localStorage (quota or disabled):', err);
    }
  }

  async getItems(filter?: ItemFilter): Promise<Item[]> {
    let items = this.loadRaw();

    if (!filter) return items;

    // Filter by status
    if (filter.status) {
      items = items.filter((item) => item.status === filter.status);
    }

    // Filter by favorite
    if (filter.isFavorite !== undefined) {
      items = items.filter((item) => item.isFavorite === filter.isFavorite);
    }

    // Filter by type
    if (filter.type) {
      items = items.filter((item) => item.type === filter.type);
    }

    // Filter by tag
    if (filter.tag) {
      const cleanTag = filter.tag.replace(/^#/, '').toLowerCase();
      items = items.filter((item) =>
        item.tags.some((t) => t.name.toLowerCase() === cleanTag)
      );
    }

    // Filter by search query across title, description, url, siteName, tags, notes
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      items = items.filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const urlMatch = item.url?.toLowerCase().includes(q);
        const siteMatch = item.siteName?.toLowerCase().includes(q);
        const notesMatch = item.notes?.toLowerCase().includes(q);
        const tagMatch = item.tags.some((t) => t.name.toLowerCase().includes(q));
        return titleMatch || descMatch || urlMatch || siteMatch || notesMatch || tagMatch;
      });
    }

    // Sort
    const sort = filter.sort || 'newest';
    items.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === 'recently_updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sort === 'recently_read') {
        const dateA = a.readAt ? new Date(a.readAt).getTime() : 0;
        const dateB = b.readAt ? new Date(b.readAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return items;
  }

  async getItem(id: string): Promise<Item | null> {
    const items = this.loadRaw();
    return items.find((item) => item.id === id) || null;
  }

  async findByUrl(rawUrl: string): Promise<Item | null> {
    const normalized = normalizeUrl(rawUrl);
    const items = this.loadRaw();
    return items.find((item) => normalizeUrl(item.url) === normalized) || null;
  }

  async createItem(input: CreateItemInput): Promise<Item> {
    const items = this.loadRaw();
    const now = new Date().toISOString();

    const normalizedUrl = normalizeUrl(input.url);
    const autoType = input.type || detectItemType(normalizedUrl);
    const autoSite = input.siteName || getSiteName(normalizedUrl);
    const autoFavicon = input.faviconUrl || getFaviconUrl(normalizedUrl);

    // Normalize tags
    let processedTags: Tag[] = [];
    if (Array.isArray(input.tags)) {
      processedTags = input.tags.map((t) => {
        if (typeof t === 'string') {
          const cleanName = t.replace(/^#/, '').trim().toLowerCase();
          return { id: `tag-${cleanName}`, name: cleanName };
        }
        return {
          id: t.id || `tag-${t.name.toLowerCase()}`,
          name: t.name.replace(/^#/, '').trim().toLowerCase(),
        };
      });
    }

    const newItem: Item = {
      id: generateId(),
      url: input.url.trim(),
      title: input.title?.trim() || autoSite || 'Untitled page',
      description: input.description?.trim() || '',
      imageUrl: input.imageUrl,
      faviconUrl: autoFavicon,
      siteName: autoSite,
      author: input.author,
      publishedAt: input.publishedAt,
      type: autoType,
      status: input.status || 'inbox',
      isFavorite: Boolean(input.isFavorite),
      tags: processedTags,
      notes: input.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    items.unshift(newItem);
    this.saveRaw(items);
    return newItem;
  }

  async updateItem(id: string, input: UpdateItemInput): Promise<Item> {
    const items = this.loadRaw();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Item not found with ID: ${id}`);
    }

    const current = items[index];
    const now = new Date().toISOString();

    // If status transitioned to completed and no readAt provided, set readAt
    let nextReadAt = current.readAt;
    if (input.status === 'completed' && !current.readAt) {
      nextReadAt = now;
    } else if (input.status && input.status !== 'completed') {
      nextReadAt = undefined;
    }

    if (input.readAt !== undefined) {
      nextReadAt = input.readAt === null ? undefined : input.readAt;
    }

    const updated: Item = {
      ...current,
      ...input,
      readAt: nextReadAt,
      updatedAt: now,
    };

    items[index] = updated;
    this.saveRaw(items);
    return updated;
  }

  async deleteItem(id: string): Promise<Item> {
    const items = this.loadRaw();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Item not found with ID: ${id}`);
    }

    const [deleted] = items.splice(index, 1);
    this.saveRaw(items);
    return deleted;
  }

  async restoreItem(item: Item): Promise<void> {
    const items = this.loadRaw();
    // Insert back in its place or top
    const exists = items.some((i) => i.id === item.id);
    if (!exists) {
      items.unshift(item);
      this.saveRaw(items);
    }
  }

  async getTags(): Promise<TagWithCount[]> {
    const items = this.loadRaw();
    const map = new Map<string, number>();

    items.forEach((item) => {
      // Don't count archived items towards main tag count unless requested
      if (item.status === 'archived') return;
      item.tags.forEach((tag) => {
        const key = tag.name.toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      });
    });

    const result: TagWithCount[] = [];
    map.forEach((count, name) => {
      result.push({ name, count });
    });

    result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return result;
  }

  async getStatusCounts(): Promise<{
    inbox: number;
    reading: number;
    completed: number;
    favorites: number;
    archived: number;
    all: number;
  }> {
    const items = this.loadRaw();
    let inbox = 0;
    let reading = 0;
    let completed = 0;
    let favorites = 0;
    let archived = 0;

    items.forEach((item) => {
      if (item.status === 'inbox') inbox++;
      if (item.status === 'reading') reading++;
      if (item.status === 'completed') completed++;
      if (item.status === 'archived') archived++;
      if (item.isFavorite) favorites++;
    });

    return {
      inbox,
      reading,
      completed,
      favorites,
      archived,
      all: items.length,
    };
  }

  async resetToDefaults(): Promise<void> {
    this.saveRaw(INITIAL_ITEMS);
  }
}

// Global singleton repository instance
export const itemsRepository = new LocalStorageItemsRepository();
