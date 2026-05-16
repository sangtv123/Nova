import { registerIsland } from '@nova/islands';
import { searchQuery } from '../shared/searchState';

export function SearchResults() {
  return (
    <div class="search-results-island card highlight">
      <h3>Island B: Search Results</h3>
      <div class="status-box">
        <p><strong>Received Data:</strong> {() => searchQuery.value}</p>
        <p><strong>Length:</strong> {() => searchQuery.value.length} characters</p>
      </div>
      {() => searchQuery.value ? (
        <div class="results-list">
          <p>You are searching for: <span class="text-primary">{searchQuery.value}</span></p>
        </div>
      ) : (
        <p class="empty-state">Please enter text in Island A.</p>
      )}
    </div>
  );
}

// Đăng ký island với tên chuẩn
registerIsland('SearchResults', SearchResults);
