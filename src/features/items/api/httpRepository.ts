import { CreateItemInput, Item, ItemFilter, TagWithCount, UpdateItemInput } from '../../../types/item';
import { ItemsRepository } from './repository';

export class HttpItemsRepository implements ItemsRepository {
  private baseUrl: string;
  private listeners: Set<() => void> = new Set();

  constructor(baseUrl?: string) {
    // Default to /api or environment variable
    const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined;
    this.baseUrl = (baseUrl || envUrl || '/api').replace(/\/$/, '');
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
        console.error('Error in subscriber listener:', err);
      }
    });
  }

  async getItems(filter?: ItemFilter): Promise<Item[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.isFavorite !== undefined) params.append('isFavorite', String(filter.isFavorite));
    if (filter?.type) params.append('type', filter.type);
    if (filter?.tag) params.append('tag', filter.tag);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.sort) params.append('sort', filter.sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/items${queryString}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch items: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  async getItem(id: string): Promise<Item | null> {
    const res = await fetch(`${this.baseUrl}/items/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch item: ${res.status}`);
    }

    return res.json();
  }

  async findByUrl(rawUrl: string): Promise<Item | null> {
    const res = await fetch(`${this.baseUrl}/items/by-url?url=${encodeURIComponent(rawUrl)}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = await res.json();
    return data || null;
  }

  async createItem(input: CreateItemInput): Promise<Item> {
    const res = await fetch(`${this.baseUrl}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create item: ${res.status}`);
    }

    const created = await res.json();
    this.notify();
    return created;
  }

  async updateItem(id: string, input: UpdateItemInput): Promise<Item> {
    const res = await fetch(`${this.baseUrl}/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update item: ${res.status}`);
    }

    const updated = await res.json();
    this.notify();
    return updated;
  }

  async deleteItem(id: string): Promise<Item> {
    const res = await fetch(`${this.baseUrl}/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete item: ${res.status}`);
    }

    const deleted = await res.json();
    this.notify();
    return deleted;
  }

  async restoreItem(item: Item): Promise<void> {
    const res = await fetch(`${this.baseUrl}/items/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(item),
    });

    if (!res.ok) {
      throw new Error(`Failed to restore item: ${res.status}`);
    }

    this.notify();
  }

  async getTags(): Promise<TagWithCount[]> {
    const res = await fetch(`${this.baseUrl}/tags`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  }

  async getStatusCounts(): Promise<{
    inbox: number;
    reading: number;
    completed: number;
    favorites: number;
    archived: number;
    all: number;
  }> {
    const res = await fetch(`${this.baseUrl}/counts`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return { inbox: 0, reading: 0, completed: 0, favorites: 0, archived: 0, all: 0 };
    }

    return res.json();
  }

  async resetToDefaults(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/items/reset`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to reset library: ${res.status} ${res.statusText}`);
    }

    this.notify();
  }
}
