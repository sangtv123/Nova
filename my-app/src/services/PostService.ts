/**
 * PostService.ts — CRUD service using @nova/http
 *
 * Pattern: each service uses the api singleton from api.ts,
 * exposing both async methods (for actions) and useHttp hooks (for components).
 */
import { api } from './api';
import { useHttp } from '@nova/http';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export interface CreatePostDto {
  userId: number;
  title: string;
  body: string;
}

// ── Reactive hooks (used in JSX components) ─────────────────────────────────

/**
 * Hook to get posts list — reactive, auto-fetches on mount.
 *
 * @example
 * function PostList() {
 *   const { data, loading, error, execute } = usePosts();
 *   return (
 *     <div>
 *       {() => loading.value && <p>Loading...</p>}
 *       {() => data.value?.map(p => <PostCard post={p} />)}
 *       <button onClick={() => execute()}>Refresh</button>
 *     </div>
 *   );
 * }
 */
export function usePosts() {
  return useHttp<Post[]>(api, 'GET', '/posts', {
    immediate: true,
    cacheKey: 'posts-list',
    cacheTtl: 30_000, // cache 30 seconds
  });
}

// ── Imperative methods (used in event handlers / stores) ───────────────────

export const PostService = {
  /** Get all posts */
  async getAll(): Promise<Post[]> {
    const res = await api.get<Post[]>('/posts');
    return res.data;
  },

  /** Get post by ID */
  async getById(id: number): Promise<Post> {
    const res = await api.get<Post>(`/posts/${id}`, {
      cacheKey: `post-${id}`,
      cacheTtl: 60_000,
    });
    return res.data;
  },

  /** Create new post */
  async create(dto: CreatePostDto): Promise<Post> {
    const res = await api.post<Post>('/posts', dto);
    // Clear list cache after creating
    api.clearCache('posts-list');
    return res.data;
  },

  /** Update post */
  async update(id: number, dto: Partial<CreatePostDto>): Promise<Post> {
    const res = await api.patch<Post>(`/posts/${id}`, dto);
    api.clearCache(`post-${id}`);
    api.clearCache('posts-list');
    return res.data;
  },

  /** Delete post */
  async delete(id: number): Promise<void> {
    await api.delete(`/posts/${id}`);
    api.clearCache(`post-${id}`);
    api.clearCache('posts-list');
  },
};
