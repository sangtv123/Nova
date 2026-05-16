/**
 * PostService.ts — CRUD service dùng @nova/http
 *
 * Pattern: mỗi service dùng api singleton từ api.ts,
 * expose cả async methods (cho action) và useHttp hooks (cho component).
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

// ── Reactive hooks (dùng trong JSX component) ─────────────────────────────────

/**
 * Hook lấy danh sách posts — reactive, tự động fetch khi mount.
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
    cacheTtl: 30_000, // cache 30 giây
  });
}

/**
 * Hook lấy 1 post theo ID — chỉ fetch khi gọi execute(overrides).
 *
 * @example
 * function PostDetail({ id }: { id: number }) {
 *   const { data, loading, execute } = usePost();
 *   onMount(() => execute({ params: undefined }));   // fetch với id cụ thể
 *   // Hoặc đơn giản hơn — dùng immediate: false rồi gọi execute trong onMount
 * }
 */
export function usePost(id: number) {
  return useHttp<Post>(api, 'GET', `/posts/${id}`, {
    immediate: true,
    cacheKey: `post-${id}`,
    cacheTtl: 60_000,
  });
}

// ── Imperative methods (dùng trong event handlers / stores) ───────────────────

export const PostService = {
  /** Lấy tất cả posts */
  async getAll(): Promise<Post[]> {
    const res = await api.get<Post[]>('/posts');
    return res.data;
  },

  /** Lấy 1 post */
  async getById(id: number): Promise<Post> {
    const res = await api.get<Post>(`/posts/${id}`, {
      cacheKey: `post-${id}`,
      cacheTtl: 60_000,
    });
    return res.data;
  },

  /** Tạo post mới */
  async create(dto: CreatePostDto): Promise<Post> {
    const res = await api.post<Post>('/posts', dto);
    // Xóa cache list sau khi tạo mới
    api.clearCache('posts-list');
    return res.data;
  },

  /** Cập nhật post */
  async update(id: number, dto: Partial<CreatePostDto>): Promise<Post> {
    const res = await api.patch<Post>(`/posts/${id}`, dto);
    api.clearCache(`post-${id}`);
    api.clearCache('posts-list');
    return res.data;
  },

  /** Xóa post */
  async delete(id: number): Promise<void> {
    await api.delete(`/posts/${id}`);
    api.clearCache(`post-${id}`);
    api.clearCache('posts-list');
  },
};
