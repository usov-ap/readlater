export type ItemType =
  | "article"
  | "video"
  | "github"
  | "documentation"
  | "news"
  | "post"
  | "other";

export type ItemStatus =
  | "inbox"
  | "reading"
  | "completed"
  | "archived";

export interface Tag {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
  siteName?: string;
  author?: string;
  publishedAt?: string;
  type: ItemType;
  status: ItemStatus;
  isFavorite: boolean;
  tags: Tag[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

export interface CreateItemInput {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
  siteName?: string;
  author?: string;
  publishedAt?: string;
  type?: ItemType;
  status?: ItemStatus;
  isFavorite?: boolean;
  tags?: Tag[] | string[];
  notes?: string;
}

export interface UpdateItemInput {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
  siteName?: string;
  author?: string;
  publishedAt?: string;
  type?: ItemType;
  status?: ItemStatus;
  isFavorite?: boolean;
  tags?: Tag[];
  notes?: string;
  readAt?: string | null;
}

export type SortOption = 'newest' | 'oldest' | 'recently_updated' | 'recently_read';

export interface ItemFilter {
  status?: ItemStatus;
  isFavorite?: boolean;
  type?: ItemType;
  tag?: string;
  search?: string;
  sort?: SortOption;
}

export interface TagWithCount {
  name: string;
  count: number;
}
