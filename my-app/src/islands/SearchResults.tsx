import { registerIsland } from '@nova/islands';
import { searchQuery } from '../shared/searchState';

export function SearchResults() {
  return (
    <div class="search-results-island card highlight">
      <h3>Island B: Search Results</h3>
      <div class="status-box">
        <p><strong>Dữ liệu nhận được:</strong> {() => searchQuery.value}</p>
        <p><strong>Độ dài:</strong> {() => searchQuery.value.length} ký tự</p>
      </div>
      {() => searchQuery.value ? (
        <div class="results-list">
          <p>Bạn đang tìm kiếm: <span class="text-primary">{searchQuery.value}</span></p>
        </div>
      ) : (
        <p class="empty-state">Vui lòng nhập nội dung ở Island A.</p>
      )}
    </div>
  );
}

// Đăng ký island với tên chuẩn
registerIsland('SearchResults', SearchResults);
