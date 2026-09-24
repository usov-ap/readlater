import { CreateItemInput, Item, ItemFilter, TagWithCount, UpdateItemInput } from '../../../types/item';

export interface ItemsRepository {
  getItems(filter?: ItemFilter): Promise<Item[]>;
  getItem(id: string): Promise<Item | null>;
  createItem(input: CreateItemInput): Promise<Item>;
  updateItem(id: string, input: UpdateItemInput): Promise<Item>;
  deleteItem(id: string): Promise<Item>;
  restoreItem(item: Item): Promise<void>;
  findByUrl(url: string): Promise<Item | null>;
  getTags(): Promise<TagWithCount[]>;
  getStatusCounts(): Promise<{
    inbox: number;
    reading: number;
    completed: number;
    favorites: number;
    archived: number;
    all: number;
  }>;
  resetToDefaults(): Promise<void>;
  subscribe(callback: () => void): () => void;
}
