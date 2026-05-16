import { registerIsland } from '@nova/islands';
import { searchQuery } from '../shared/searchState';

export function SearchInput() {
  return (
    <div class="search-input-island card">
      <h3>Island A: Search Input</h3>
      <input 
        type="text" 
        value={() => searchQuery.value} 
        onInput={(e: InputEvent) => searchQuery.value = (e.target as HTMLInputElement).value}
        placeholder="Nhập nội dung tìm kiếm..."
        class="input-field"
      />
      <button onClick={() => searchQuery.value = ''} class="btn secondary">Clear</button>
    </div>
  );
}

// Đăng ký island với tên chuẩn
registerIsland('SearchInput', SearchInput);
