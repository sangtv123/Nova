/** @jsx createElement */
import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { usePosts, PostService } from '../services/PostService';
import type { Post, CreatePostDto } from '../services/PostService';
import { HttpError } from '@nova/http';

// ─────────────────────────────────────────────────────────────────────────────
// PostCard — Displays a single post
// ─────────────────────────────────────────────────────────────────────────────
function PostCard({ post, onDelete }: { key?: any, post: Post; onDelete: (id: number) => void }) {
  const deleting = signal(false);

  const handleDelete = async () => {
    deleting.value = true;
    try {
      await PostService.delete(post.id);
      onDelete(post.id);
    } catch (e: any) {
      alert(e instanceof HttpError ? e.message : 'Delete failed');
    } finally {
      deleting.value = false;
    }
  };

  return (
    <article class="post-card">
      <h3>#{post.id} — {post.title}</h3>
      <p>{post.body}</p>
      <button
        onClick={handleDelete}
        disabled={() => deleting.value}
        class="btn-danger"
      >
        {() => deleting.value ? 'Deleting…' : 'Delete'}
      </button>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CreatePostForm — Create a new post
// ─────────────────────────────────────────────────────────────────────────────
function CreatePostForm({ onCreated }: { onCreated: (post: Post) => void }) {
  const title   = signal('');
  const body    = signal('');
  const saving  = signal(false);
  const formErr = signal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title.value.trim()) { formErr.value = 'Title is required'; return; }

    saving.value  = true;
    formErr.value = null;

    const dto: CreatePostDto = { userId: 1, title: title.value, body: body.value };

    try {
      const post = await PostService.create(dto);
      title.value = '';
      body.value  = '';
      onCreated(post);
    } catch (err: any) {
      formErr.value = err instanceof HttpError ? err.message : 'Failed to create post';
    } finally {
      saving.value = false;
    }
  };

  return (
    <form class="create-form" onSubmit={handleSubmit}>
      <h2>New Post</h2>

      {() => formErr.value && (
        <div class="error-banner">{formErr.value}</div>
      )}

      <input
        type="text"
        placeholder="Title"
        value={() => title.value}
        onInput={(e: InputEvent) => title.value = (e.target as HTMLInputElement).value}
      />
      <textarea
        placeholder="Body"
        onInput={(e: InputEvent) => body.value = (e.target as HTMLTextAreaElement).value}
      >{() => body.value}</textarea>

      <button type="submit" disabled={() => saving.value}>
        {() => saving.value ? 'Saving…' : 'Create Post'}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PostsPage — Main page, uses useHttp reactive hook
// ─────────────────────────────────────────────────────────────────────────────
export function PostsPage() {
  // useHttp returns signals — auto updates when request completes
  const { data, loading, error, execute } = usePosts();

  // Handle local mutations without re-fetching everything
  const handleCreated = (post: Post) => {
    if (data.value) {
      data.value = [post, ...data.value];
    }
  };

  const handleDeleted = (id: number) => {
    if (data.value) {
      data.value = data.value.filter((p: Post) => p.id !== id);
    }
  };

  return (
    <div class="page posts-page">
      <header class="page-header">
        <h1>Posts</h1>
        <button onClick={() => execute()} disabled={() => loading.value} aria-label="Refresh posts">
          {() => loading.value ? 'Loading…' : '↺ Refresh'}
        </button>
      </header>

      {/* Create new post form */}
      <CreatePostForm onCreated={handleCreated} />

      {/* Loading state */}
      {() => loading.value && (
        <div class="loading-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div class="skeleton-card" key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {() => error.value && (
        <div class="error-state">
          <p>⚠ {error.value.message}</p>
          {error.value.isServerError && (
            <button onClick={() => execute()}>Retry</button>
          )}
        </div>
      )}

      {/* Data */}
      {() => !loading.value && data.value && (
        <div class="posts-grid">
          {data.value.slice(0, 20).map((post: Post) => (
            <PostCard key={post.id} post={post} onDelete={handleDeleted} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {() => !loading.value && data.value?.length === 0 && (
        <p class="empty">No posts yet.</p>
      )}
    </div>
  );
}
