<template>
  
  <div class="page" ref="pageRef">
<h1 style="color: rgb(134, 239, 172); text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);font-weight: bold;"><i class="ri-archive-fill"></i> KHO HÀNG</h1>
   <!-- ===== MOBILE STICKY SEARCH ===== -->
<div v-if="isMobile" class="mobile-sticky-search" ref="mobileSearchRef">
  <div class="mobile-sticky-search-inner">
    <div class="search-container">
      <div class="search-icon"><i class="ri-search-line" ></i></div>
      <input
        v-model="keyword"
        placeholder="Tìm kiếm tên hàng"
        class="search-input"
        @input="handleSearch"
      />
      <button v-if="keyword" @click="clearSearch" class="search-clear"><i class="app-ico ri-close-line"></i></button>
    </div>
  </div>
</div>


    <!-- ===== FILTER SECTION ===== -->
    <section class="filter-section">

      <div class="search-container">
        <div class="search-icon"><i class="ri-search-line"></i></div>
        <input
          v-model="keyword"
          placeholder="Tìm kiếm theo mã hàng hoặc tên sản phẩm..."
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="keyword" @click="clearSearch" class="search-clear"><i class="app-ico ri-close-line"></i></button>
      </div>
      
  <!-- ===== 6 BUTTONS GRID: 3 x 2 ===== -->
<!-- ===== 8 BUTTONS GRID: 4 x 2 ===== -->
<!-- ===== NEW FILTER LAYOUT (2 ROWS) ===== -->
<div class="filter-grid-rows">
  <!-- ROW 1 -->
  <div class="f-row">
    <!-- 1. Language Dropdown (Display & Export Language) -->
    <div class="dropdown-wrapper">
      <button class="btn-filter btn-dropdown" :class="{ active: selectedLanguage !== 'vi', 'menu-open': showLanguageMenu }" @click.stop="showLanguageMenu = !showLanguageMenu">
        <span class="btn-icon"><i class="ri-global-line"></i></span>
        <span class="btn-text">{{ getLanguageLabel() }}</span>
        <span class="arrow-icon"><i class="ri-arrow-down-s-line"></i></span>
      </button>

      <transition name="slide-down">
        <div v-if="showLanguageMenu" class="dropdown-menu">
          <button
            v-for="lang in SUPPORTED_DATA_LANGS"
            :key="lang.code"
            class="menu-item"
            :class="{ active: selectedLanguage === lang.code }"
            @click="selectLanguage(lang.code)"
          >
            <img :src="lang.flagImg" :alt="lang.short" class="dropdown-flag-img" />
            <span>{{ lang.label }} ({{ lang.short }})</span>
          </button>
        </div>
      </transition>
    </div>
    <!-- 2. Category -->
    <button class="btn-filter" :class="{ active: showCategoryFilter }" @click="showCategoryFilter = !showCategoryFilter">
      <span class="btn-icon"><i class="ri-list-check"></i></span>
      <span class="btn-text">Danh mục</span>
      <span v-if="selectedCategory" class="filter-badge">1</span>
    </button>
    <!-- 3. Sort -->
    <button class="btn-filter" @click="toggleSortOrder">
      <span class="btn-icon">
        <i v-if="sortOrder === 'desc'" class="ri-sort-desc"></i>
        <i v-else class="ri-sort-asc"></i>
      </span>
      <span class="btn-text">{{ sortOrder === 'desc' ? 'Mới → Cũ' : 'Cũ → Mới' }}</span>
    </button>
  </div>

  <!-- ROW 2 -->
  <div class="f-row">
    <!-- 4. Promotion -->
    <button class="btn-filter" :class="{ active: filterPromotion }" @click="togglePromotionFilter">
      <span class="btn-icon"><i class="ri-price-tag-3-fill"></i></span>
      <span class="btn-text">Khuyến mãi</span>
      <span v-if="countPromo > 0" class="filter-badge">{{ countPromo }}</span>
    </button>
    
    <!-- 5. Status Dropdown -->
    <div class="dropdown-wrapper">
      <button class="btn-filter btn-dropdown" :class="{ active: filterStatus !== 'all', 'menu-open': showStatusMenu }" @click.stop="showStatusMenu = !showStatusMenu">
        <span class="btn-icon"><i class="ri-checkbox-circle-line"></i></span>
        <span class="btn-text">{{ getStatusLabel() }}</span>
        <span v-if="countStatusResult > 0" class="filter-badge">{{ countStatusResult }}</span>
        <span class="arrow-icon"><i class="ri-arrow-down-s-line"></i></span>
      </button>
      
      <transition name="slide-down">
        <div v-if="showStatusMenu" class="dropdown-menu">
          <button class="menu-item" :class="{ active: filterStatus === 'available' }" @click="selectStatus('available')">
            <i class="ri-verified-badge-fill text-success"></i> Còn hàng
          </button>
          <button class="menu-item" :class="{ active: filterStatus === 'out' }" @click="selectStatus('out')">
            <i class="ri-close-circle-fill text-danger"></i> Hết hàng
          </button>
          <button class="menu-item" :class="{ active: filterStatus === 'hidden' }" @click="selectStatus('hidden')">
            <i class="ri-eye-off-line text-hidden"></i> Đang ẩn
          </button>
           <button class="menu-item" :class="{ active: filterStatus === 'all' }" @click="selectStatus('all')">
            <i class="ri-apps-line"></i> Tất cả
          </button>
        </div>
      </transition>
    </div>

    <!-- 6. Export Dropdown -->
    <div class="dropdown-wrapper">
      <button class="btn-filter btn-dropdown" :class="{ 'menu-open': showExportMenu }" @click.stop="showExportMenu = !showExportMenu">
        <span class="btn-icon"><i class="ri-download-2-line"></i></span>
        <span class="btn-text">Xuất hàng</span>
        <span class="arrow-icon"><i class="ri-arrow-down-s-line"></i></span>
      </button>

      <transition name="slide-down">
        <div v-if="showExportMenu" class="dropdown-menu right-align">
          <button class="menu-item" @click="selectExport('text')">
            <i class="ri-file-text-line"></i> Tên : Giá
          </button>
          <button class="menu-item" @click="selectExport('name')">
            <i class="ri-text"></i> Tên hàng
          </button>
          <button class="menu-item" @click="selectExport('price')">
             <i class="ri-money-dollar-circle-line"></i> Giá bán
          </button>
          <button class="menu-item" @click="selectExport('price_dvt')">
             <i class="ri-money-dollar-circle-line"></i> Giá bán Tiền tệ / ĐVT
          </button>
          <button class="menu-item" @click="selectExport('full')">
            <i class="ri-file-list-3-line"></i> Tên : Giá tệ / ĐVT
          </button>
        </div>
      </transition>
    </div>
  </div>
</div>

<!-- Category dropdown (GIỮ NGUYÊN) -->
<transition name="slide-down">
  <div v-if="showCategoryFilter" class="category-dropdown">
    <div class="category-grid">
     <button
  class="category-item"
  :class="{ active: !selectedCategory }"
  @click="
    selectedCategory = '';
    showCategoryFilter = false;
    resetVisibleCount();
  "
>

        <span class="category-name">Tất cả</span>
        <span class="category-count">{{ list.length }}</span>
      </button>

  <button
  v-for="cat in categories"
  :key="cat.name"
  class="category-item"
  :class="{ active: selectedCategory === cat.name }"
  @click="
    selectedCategory = cat.name;
    showCategoryFilter = false;
    resetVisibleCount();
  "
>

        <span class="category-name">{{ cat.name }}</span>
        <span class="category-count">{{ cat.count }}</span>
      </button>
    </div>
  </div>
</transition>

<!-- Xóa bộ lọc để riêng (không tính vào 6 nút) -->
<div class="clear-filter-row">
  <button
    v-if="hasActiveFilters"
    class="btn-clear-filters"
    @click="clearAllFilters"
  >
    <span class="btn-icon"><i class="ri-refresh-fill"></i></span>
    <span class="btn-text">Xóa bộ lọc</span>
  </button>
</div>

    </section>

    <!-- ===== DESKTOP TABLE ===== -->
    <section
      class="content-section desktop-view"
      ref="desktopTableSection"
      @mouseenter="tableHovering = true"
      @mouseleave="tableHovering = false"
    >
       <div ref="desktopTableAnchor"></div>
       <div v-if="tableLoading" class="table-loading-container">
    <div class="table-loading">
      <div class="table-loading-spinner"></div>
      <div class="table-loading-text">Đang tải dữ liệu...</div>
    </div>
  </div>
   <template v-else>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 50px" class="text-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="checkbox"
                />
              </th>
              <th style="width: 60px" class="text-center">STT</th>
              <th style="width: 80px" class="text-center">Ảnh</th>
              <th style="width: 220px" class="text-center">Ảnh phụ</th>
              <th style="width: 120px" class="text-center">Mã hàng</th>
              <th style="width: 200px" class="text-center">Tên sản phẩm</th>
              <th style="width: 160px" class="text-center">Mô tả</th>
              <th style="width: 120px" class="text-center">Danh mục</th>
              <th style="width: 80px" class="text-center">Size</th>
              <th style="width: 70px" class="text-center">ĐVT</th>
              <th style="width: 100px" class="text-center">Giá gốc</th>
              <th style="width: 100px" class="text-center">Giá bán</th>
              <th style="width: 100px" class="text-center">Giá giảm</th>
              <th style="width: 80px" class="text-center">Tiền tệ</th>
              <th style="width: 150px" class="text-center">Ngôn ngữ</th>
              <th style="width: 120px" class="text-center">Trạng thái</th>
              <th style="width: 245px" class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in visibleProducts"
              :key="item.Ma_hang"
              class="table-row"
              :class="{ 'is-product-hidden': isProductHidden(item), 'is-product-top': isTopProduct(item) }"
              @click="openEdit(item)"
            >
              <td @click.stop class="text-center">
                <input
                  type="checkbox"
                  v-model="selected"
                  :value="item.Ma_hang"
                  class="checkbox"
                />
              </td>
              <td class="text-center">{{ idx + 1 }}</td>
              <td class="text-center">
                <div class="product-image-cell">
                  <img
                    v-if="item.Main_img"
                    :src="item.Main_img"
                    :alt="item.Ten_hang"
                    loading="lazy"
                    decoding="async"
                    class="product-thumbnail"
                  />
                  <div v-else class="product-thumbnail-empty"><i class="ri-file-image-fill"></i></div>
                </div>
              </td>
              <td class="text-center" @click.stop="openEdit(item)">
                <div class="supplementary-images" aria-label="Ảnh phụ">
                  <div
                    v-for="(key, slotIndex) in supplementaryImageKeys"
                    :key="key"
                    class="supplementary-image-slot"
                    @click.stop="openEdit(item)"
                    :title="item[key] ? `Ảnh phụ ${slotIndex + 1}` : 'Chưa có ảnh phụ'"
                  >
                    <img
                      v-if="item[key]"
                      :src="item[key]"
                      :alt="`${item.Ten_hang} ảnh phụ ${slotIndex + 1}`"
                      loading="lazy"
                      decoding="async"
                      class="supplementary-thumb"
                    />
                    <div v-else class="supplementary-thumb-empty" aria-hidden="true">
                      <i class="ri-image-line"></i>
                    </div>
                  </div>
                </div>
              </td>
              <td class="text-center text-mono">{{ item.Ma_hang }}</td>
              <td class="text-center product-name-cell" @click.stop="openEdit(item, { focusField: 'Ten_hang' })">{{ item.Ten_hang }}</td>
              <td class="text-center text-muted text-truncate" @click.stop="openEdit(item, { focusField: 'Mo_ta' })">{{ item.Mo_ta }}</td>
              <td class="text-center" @click.stop="openEdit(item, { focusField: 'Danh_muc' })">{{ item.Danh_muc }}</td>
              <td class="text-center" @click.stop="openEdit(item, { focusField: 'Size' })">{{ item.Size }}</td>
              <td class="text-center" @click.stop="openEdit(item, { focusField: 'Dvt' })">{{ item.Dvt }}</td>
              <td class="text-center text-number" @click.stop="openEdit(item, { focusField: 'Gia_goc' })">
                <div>{{ formatNumber(item.Gia_goc) }}</div>
                <div v-if="Number(item.Ncc_gia_tri_giam || 0) > 0" class="ncc-kho-tag">
                  NCC {{ formatNccDiscountLabel(item, item.Don_vi_tien_te || 'P') }}
                </div>
              </td>
              <td class="text-center text-number price-main" @click.stop="openEdit(item, { focusField: 'Gia_ban' })">{{ formatNumber(item.Gia_ban) }}</td>
              <td class="text-center text-number" @click.stop="openEdit(item, { focusField: 'Gia_Giam' })">
                <span v-if="item.Gia_Giam && item.Gia_Giam > 0" class="price-sale">
                  {{ formatNumber(item.Gia_Giam) }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-center" @click.stop="openEdit(item, { focusField: 'Don_vi_tien_te' })">
                <span class="badge badge-currency">{{ item.Don_vi_tien_te || 'P' }}</span>
              </td>
              <td class="text-center" @click.stop="openEdit(item, { focusField: 'Ten_hang' })">
                <div class="lang-badges-cell">
                  <span
                    v-for="l in SUPPORTED_DATA_LANGS"
                    :key="l.code"
                    class="lang-mini-pill"
                    :class="{ active: hasItemLang(item, l.code) }"
                    :title="l.label"
                  >
                    {{ l.short }}
                  </span>
                </div>
              </td>
              <td class="text-center" @click.stop="quickToggleStatus(item)" title="Bấm để đổi nhanh Còn hàng / Hết hàng">
                <div class="status-cell-stack">
                  <span 
                    class="badge" 
                    style="cursor: pointer; user-select: none;"
                    :class="item.Trang_thai === 'Hết hàng' ? 'badge-danger' : 'badge-success'"
                  >
                    {{ item.Trang_thai === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng' }}
                  </span>
                  <span v-if="isTopProduct(item)" class="badge badge-top-pill" title="Đang ghim lên đầu Menu Online">
                    <i class="ri-pushpin-2-fill"></i>
                    <span>TOP #{{ getTopRank(item) }}</span>
                  </span>
                  <span v-if="isProductHidden(item)" class="badge badge-hidden-pill">Đang ẩn</span>
                </div>
              </td>
              <td @click.stop class="text-center">
                <div class="table-actions-wrap">
                  <button class="btn-action-discount" @click="openDiscount(item)">
                    GIẢM GIÁ
                  </button>
                  <button
                    v-if="!isTopRankOne(item)"
                    type="button"
                    class="btn-action-top"
                    title="Đẩy mặt hàng lên vị trí đầu tiên (Top #1)"
                    @click="pushProductToTop(item)"
                  >
                    <i class="ri-arrow-up-double-line"></i>
                    <span>Lên top</span>
                  </button>
                  <button
                    v-if="isTopProduct(item)"
                    type="button"
                    class="btn-action-untop"
                    title="Gỡ khỏi vị trí Top"
                    @click="unpinProductFromTop(item)"
                  >
                    <i class="ri-unpin-line"></i>
                    <span>Bỏ top</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-hide"
                    :class="{ 'is-hidden': isProductHidden(item) }"
                    :title="isProductHidden(item) ? 'Hiện lại sản phẩm lên Menu Online' : 'Ẩn sản phẩm khỏi Menu Online'"
                    @click="toggleHideProduct(item)"
                  >
                    <i :class="isProductHidden(item) ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
                    <span>{{ isProductHidden(item) ? 'Hiện' : 'Ẩn' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
</template>
      <!-- Desktop Lazy Load Sentinel -->
      <div class="lazy-load-footer" ref="lazySentinelDesktopRef">
        <div class="pagination-info">
          Hiển thị <strong>{{ visibleProducts.length }}</strong> / <strong>{{ ordered.length }}</strong> sản phẩm
        </div>
        <button
          v-if="hasMoreProducts"
          type="button"
          class="btn-lazy-more"
          @click="loadMoreProducts"
        >
          <i class="ri-arrow-down-line"></i>
          <span>Tải thêm {{ Math.min(LAZY_STEP_COUNT, ordered.length - visibleProducts.length) }} sản phẩm</span>
        </button>
        <span v-else-if="ordered.length > 0" class="lazy-done-label">
          Đã hiển thị toàn bộ danh sách
        </span>
      </div>
    </section>

    <!-- ===== MOBILE CARDS ===== -->
    <section class="content-section mobile-view" ref="mobileListSection">
       <div ref="mobileTableAnchor"></div>
       <!-- TABLE LOADING -->
  <div v-if="tableLoading" class="table-loading-container">
    <div class="table-loading">
      <div class="table-loading-spinner"></div>
      <div class="table-loading-text">Đang tải dữ liệu...</div>
    </div>
  </div>
  <template v-else>
      <div class="cards-container">
        <div
          v-for="item in visibleProducts"
          :key="item.Ma_hang"
          class="product-card"
          :class="{ 'is-product-top': isTopProduct(item) }"
          @click="openEdit(item)"
        >
          <div class="card-row">
            <div class="card-image-wrapper">
              <img
                v-if="item.Main_img"
                :src="item.Main_img"
                :alt="item.Ten_hang"
                loading="lazy"
                decoding="async"
                class="card-image"
              />
              <div v-else class="card-image-empty"><i class="ri-file-image-fill"></i></div>
            </div>
            <div class="card-content">
              <div class="card-header-inline">
                <div class="card-info">
                  <h3 class="card-title">{{ item.Ten_hang }}</h3>
                  <div class="card-meta">
                    <span
                      class="badge"
                      style="cursor: pointer;"
                      :class="item.Trang_thai === 'Hết hàng' ? 'badge-danger' : 'badge-success'"
                      @click.stop="quickToggleStatus(item)"
                    >
                      {{ item.Trang_thai === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng' }}
                    </span>
                    <span v-if="isTopProduct(item)" class="badge badge-top-pill">
                      <i class="ri-pushpin-2-fill"></i>
                      <span>TOP #{{ getTopRank(item) }}</span>
                    </span>
                    <span v-if="isProductHidden(item)" class="badge badge-hidden-pill">Đang ẩn</span>
                    <span class="card-code">{{ item.Ma_hang }}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  v-model="selected"
                  :value="item.Ma_hang"
                  class="checkbox"
                  @click.stop
                />
              </div>

              <div class="card-price-block">
                <div class="price-row">
                  <span class="price-label">Giá bán</span>
                  <span class="price-value primary">
                    {{ formatNumber(item.Gia_ban) }} {{ item.Don_vi_tien_te || 'P' }}
                  </span>
                </div>
                <div v-if="item.Gia_Giam && item.Gia_Giam > 0" class="price-row">
                  <span class="price-label">Giá giảm</span>
                  <span class="price-value sale">
                    {{ formatNumber(item.Gia_Giam) }} {{ item.Don_vi_tien_te || 'P' }}
                  </span>
                </div>
                <div v-if="Number(item.Ncc_gia_tri_giam || 0) > 0" class="price-row">
                  <span class="price-label">CK NCC</span>
                  <span class="ncc-kho-tag">{{ formatNccDiscountLabel(item, item.Don_vi_tien_te || 'P') }}</span>
                </div>
                <div class="price-row">
                  <span class="price-label">Ngôn ngữ</span>
                  <div class="lang-badges-cell">
                    <span
                      v-for="l in SUPPORTED_DATA_LANGS"
                      :key="l.code"
                      class="lang-mini-pill"
                      :class="{ active: hasItemLang(item, l.code) }"
                    >
                      {{ l.short }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button class="card-action-btn btn-edit" @click.stop="openEdit(item, { focusField: 'Ten_hang' })">
              <span class="btn-icon"><i class="ri-edit-box-line"></i></span>
              <span class="btn-text">Sửa</span>
            </button>
            <button class="card-action-btn btn-status" @click.stop="quickToggleStatus(item)">
              <span class="btn-icon"><i class="ri-refresh-line"></i></span>
              <span class="btn-text">{{ item.Trang_thai === 'Hết hàng' ? 'Bật Còn' : 'Báo Hết' }}</span>
            </button>
            <button
              class="card-action-btn btn-hide"
              :class="{ 'is-hidden': isProductHidden(item) }"
              @click.stop="toggleHideProduct(item)"
            >
              <span class="btn-icon"><i :class="isProductHidden(item) ? 'ri-eye-line' : 'ri-eye-off-line'"></i></span>
              <span class="btn-text">{{ isProductHidden(item) ? 'Hiện' : 'Ẩn' }}</span>
            </button>
            <button class="card-action-btn btn-discount" @click.stop="openDiscount(item)">
              <span class="btn-icon"><i class="ri-price-tag-3-line"></i></span>
              <span class="btn-text">Giảm giá</span>
            </button>
            <button
              v-if="!isTopRankOne(item)"
              class="card-action-btn btn-top"
              @click.stop="pushProductToTop(item)"
            >
              <span class="btn-icon"><i class="ri-arrow-up-double-line"></i></span>
              <span class="btn-text">Lên top</span>
            </button>
            <button
              v-if="isTopProduct(item)"
              class="card-action-btn btn-untop"
              @click.stop="unpinProductFromTop(item)"
            >
              <span class="btn-icon"><i class="ri-unpin-line"></i></span>
              <span class="btn-text">Bỏ top</span>
            </button>
            <button class="card-action-btn btn-delete" @click.stop="confirmDelete(item)">
              <span class="btn-icon"><i class="ri-delete-bin-fill"></i></span>
              <span class="btn-text">Xóa</span>
            </button>
          </div>
        </div>
      </div>
</template>
      <!-- Mobile Lazy Load Sentinel -->
      <div class="lazy-load-footer mobile-lazy-footer" ref="lazySentinelMobileRef">
        <div class="pagination-info">
          Hiển thị <strong>{{ visibleProducts.length }}</strong> / <strong>{{ ordered.length }}</strong> sản phẩm
        </div>
        <button
          v-if="hasMoreProducts"
          type="button"
          class="btn-lazy-more"
          @click="loadMoreProducts"
        >
          <i class="ri-arrow-down-line"></i>
          <span>Tải thêm {{ Math.min(LAZY_STEP_COUNT, ordered.length - visibleProducts.length) }} sản phẩm</span>
        </button>
        <span v-else-if="ordered.length > 0" class="lazy-done-label">
          Đã hiển thị toàn bộ danh sách
        </span>
      </div>
    </section>

    <!-- ===== MOBILE SIDEBAR ===== -->
    <transition name="slide-left">
      <div v-if="showSidebar && isMobile" class="sidebar-overlay" @click="attemptCloseSidebar">
        <div class="sidebar-panel" @click.stop>
   <div class="sidebar-header">
  <div class="sidebar-header-left">
    <h2 class="sidebar-title"> Chỉnh sửa sản phẩm <i class="ri-edit-box-fill"></i></h2>
    <div v-if="edit && edit.Ten_hang" class="sidebar-subtitle">
      {{ edit.Ten_hang }}
    </div>
  </div>

  <div class="sidebar-header-actions">
    <button
  v-if="hasUnsavedChanges"
  class="btn-save-inline"
  :class="{ 'is-loading': saving }"
  @click="saveEdit"
  :disabled="saving || uploading"
>
  <span v-if="saving" class="btn-spinner"></span>
  <span v-else><i class="ri-save-3-fill"></i></span>
  <span>{{ saving ? 'Loading...' : 'Lưu' }}</span>
</button>


    <button class="btn-close-sidebar" @click="attemptCloseSidebar"><i class="app-ico ri-close-line"></i></button>
  </div>
</div>


          <div class="sidebar-body">
            <div class="edit-content" v-if="edit.i18n">
              <!-- 5-Language Tabs -->
              <div class="form-section">
                <div class="form-group">
                  <label class="form-label">Ngôn ngữ nội dung món (gộp 5 ngôn ngữ)</label>
                  <div class="lang-tabs-bar">
                    <button
                      v-for="l in SUPPORTED_DATA_LANGS"
                      :key="l.code"
                      type="button"
                      class="lang-tab-btn"
                      :class="{ active: activeEditLang === l.code }"
                      @click="activeEditLang = l.code"
                    >
                      <img :src="l.flagImg" :alt="l.short" class="lang-tab-flag" />
                      <span>{{ l.short }}</span>
                      <span
                        class="lang-tab-dot"
                        :class="{ filled: hasEditLangContent(l.code) }"
                      ></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Image Upload -->
              <div class="form-section">
                <label class="form-label">Hình ảnh sản phẩm</label>
                <div class="image-upload-area">
                  <div class="image-preview-container">
                    <img
                      v-if="edit.Main_img"
                      :src="edit.Main_img"
                      class="image-preview image-preview-clickable"
                      @click.stop="openImagePreview(edit.Main_img)"
                    />
                    <div v-else class="image-preview-empty">
                      <span class="empty-icon"><i class="ri-file-image-line"></i></span>
                      <span class="empty-text">Chưa có ảnh</span>
                    </div>
                  </div>
                    <input
                      type="file"
                      ref="fileInput"
                      @change="handleImageUpload('Main_img', $event)"
                      accept="image/*"
                      style="display: none"
                    />
                  <button 
                    class="btn-upload-image" 
                    @click="$refs.fileInput.click()" 
                    :disabled="mainImageUploading"
                  >
                    <span v-if="mainImageUploading"> Đang tải...</span>
                    <span v-else><i class="ri-chat-upload-fill"></i>Upload ảnh</span>
                  </button>
                  <div class="upload-size-hint">
                    Kích thước chuẩn: <strong>800 × 800 px – 1200 × 1200 px</strong> (vuông 1:1) · Tự nén ≤ 100KB
                  </div>
                </div>
                <div class="form-group supplementary-images-group">
                  <label class="form-label">Ảnh phụ <span class="upload-size-hint-inline">(800×800 – 1200×1200px · 1:1 · ≤100KB)</span></label>
                  <div class="supplementary-images">
                    <div
                      v-for="(key, slotIndex) in supplementaryImageKeys"
                      :key="key"
                      class="supplementary-image-slot"
                      :class="{ 'is-loading': modalSupplementaryUploading[slotIndex] }"
                      :title="edit[key] ? `Ảnh phụ ${slotIndex + 1}` : 'Chưa có ảnh phụ'"
                      role="button"
                      tabindex="0"
                      @click.stop="openSidebarSupplementaryUpload(slotIndex)"
                      @keydown.enter.prevent="openSidebarSupplementaryUpload(slotIndex)"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        class="supplementary-upload-input"
                        style="display: none"
                        :ref="el => setSidebarInput(el, slotIndex)"
                        @change="handleImageUpload(key, $event)"
                      />
                      <button
                        v-if="edit[key]"
                        type="button"
                        class="supplementary-delete-btn"
                        aria-label="Xóa ảnh phụ"
                        @click.stop="removeSupplementaryImage(key)"
                      >
                        <i class="ri-close-fill"></i>
                      </button>
                      <div v-if="modalSupplementaryUploading[slotIndex]" class="supplementary-loading" aria-hidden="true">
                        <span class="supplementary-spinner"></span>
                      </div>
                      <img
                        v-if="edit[key]"
                        :src="edit[key]"
                        :alt="`${edit.Ten_hang || 'Sản phẩm'} ảnh phụ ${slotIndex + 1}`"
                        class="supplementary-thumb image-preview-clickable"
                        @click.stop="openImagePreview(edit[key])"
                      />
                      <div v-else class="supplementary-thumb-empty" aria-hidden="true">
                        <i class="ri-image-line"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ma hang & Ten hang -->
              <div class="form-section">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Mã hàng</label>
                    <input data-field="Ma_hang" v-model="edit.Ma_hang" disabled class="form-control" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tên sản phẩm ({{ getLangShort(activeEditLang) }})</label>
                    <input
                      data-field="Ten_hang"
                      v-model="edit.i18n[activeEditLang].Ten_hang"
                      :placeholder="activeEditLang === 'vi' ? 'Tên sản phẩm...' : (edit.i18n.vi.Ten_hang ? `Dịch từ: ${edit.i18n.vi.Ten_hang}` : 'Tên sản phẩm...')"
                      class="form-control"
                      @input="onEditI18nChange"
                    />
                  </div>
                </div>
              </div>

              <!-- Trang thai, Danh muc, Size, DVT -->
              <div class="form-section">
                <div class="form-row form-row-4">
                <div class="form-group">
                  <label class="form-label">Trạng thái</label>
                  <select
                    data-field="Trang_thai"
                    ref="statusSelect"
                    v-model="edit.Trang_thai"
                    class="form-control"
                    @change="markAsEdited"
                  >
                    <option>Còn hàng</option>
                    <option>Hết hàng</option>
                  </select>
                  <div v-if="isMobile && statusOptionsVisible" class="mobile-status-options">
                    <button
                      class="status-option-btn"
                      :class="{ active: edit.Trang_thai === 'Còn hàng' }"
                      @click="selectMobileStatus('Còn hàng')"
                    >
                      Còn hàng
                    </button>
                    <button
                      class="status-option-btn"
                      :class="{ active: edit.Trang_thai === 'Hết hàng' }"
                      @click="selectMobileStatus('Hết hàng')"
                    >
                      Hết hàng
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="hide-toggle-row">
                    <input type="checkbox" v-model="edit.Is_hidden" @change="markAsEdited" />
                    <span>Ẩn sản phẩm khỏi Menu Online</span>
                  </label>
                  <div class="top-modal-row">
                    <label class="hide-toggle-row top-toggle-row">
                      <input type="checkbox" v-model="editIsTop" />
                      <span>Ghim lên Top Menu Online</span>
                    </label>
                    <button
                      v-if="getProductTopAt(edit) > 0 && !isTopRankOne(edit)"
                      type="button"
                      class="btn-bump-top-inline"
                      @click="bumpEditToTop"
                    >
                      <i class="ri-arrow-up-double-line"></i> Đẩy lên #1
                    </button>
                  </div>
                </div>
                  <div class="form-group">
                    <label class="form-label">Danh mục ({{ getLangShort(activeEditLang) }})</label>
                    <input
                      data-field="Danh_muc"
                      v-model="edit.i18n[activeEditLang].Danh_muc"
                      :placeholder="activeEditLang === 'vi' ? 'Danh mục...' : (edit.i18n.vi.Danh_muc ? `Dịch từ: ${edit.i18n.vi.Danh_muc}` : 'Danh mục...')"
                      class="form-control"
                      @input="onEditI18nChange"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Size</label>
                    <input data-field="Size" v-model="edit.Size" class="form-control" @input="markAsEdited" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">ĐVT ({{ getLangShort(activeEditLang) }})</label>
                    <input
                      data-field="Dvt"
                      v-model="edit.i18n[activeEditLang].Dvt"
                      :placeholder="activeEditLang === 'vi' ? 'ĐVT...' : (edit.i18n.vi.Dvt ? `Dịch từ: ${edit.i18n.vi.Dvt}` : 'ĐVT...')"
                      class="form-control"
                      @input="onEditI18nChange"
                    />
                  </div>
                </div>
              </div>

              <!-- Tien te, Gia goc, Gia ban, Gia giam -->
              <div class="form-section">
  <div class="form-row form-row-5">
    <div class="form-group">
      <label class="form-label">Tiền tệ</label>
      <input
        data-field="Don_vi_tien_te"
        v-model="edit.Don_vi_tien_te"
        placeholder="P"
        class="form-control"
        @input="markAsEdited"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Giá gốc</label>
      <input
        data-field="Gia_goc"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        class="form-control"
        :value="fmtMoney(edit.Gia_goc)"
        @input="onMoneyInput($event, 'Gia_goc')"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Giá bán</label>
      <input
        data-field="Gia_ban"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        class="form-control"
        :value="fmtMoney(edit.Gia_ban)"
        @input="onMoneyInput($event, 'Gia_ban')"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Giá giảm</label>
      <input
        data-field="Gia_Giam"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        class="form-control"
        :class="{ 'form-control-highlight': isDiscountMode }"
        :value="fmtMoney(edit.Gia_Giam)"
        @input="onMoneyInput($event, 'Gia_Giam')"
      />
    </div>
  </div>
  <div class="ncc-edit-block">
    <label class="form-label">CK NCC (% giá gốc hoặc Tiền trực tiếp)</label>
    <div class="ncc-disc-input-row">
      <div class="ncc-type-toggle" role="group">
        <button
          type="button"
          class="ncc-type-btn"
          :class="{ active: edit.Ncc_loai_giam !== 'money' }"
          @click="edit.Ncc_loai_giam = 'percent'; markAsEdited()"
        >
          %
        </button>
        <button
          type="button"
          class="ncc-type-btn"
          :class="{ active: edit.Ncc_loai_giam === 'money' }"
          @click="edit.Ncc_loai_giam = 'money'; markAsEdited()"
        >
          Tiền ({{ edit.Don_vi_tien_te || 'P' }})
        </button>
      </div>
      <input
        type="number"
        min="0"
        step="any"
        v-model.number="edit.Ncc_gia_tri_giam"
        placeholder="0"
        class="form-control ncc-val-input"
        @input="markAsEdited"
      />
    </div>
  </div>
</div>

              <!-- Mo ta -->
              <div class="form-section">
                <div class="form-group">
                  <label class="form-label">Mô tả sản phẩm ({{ getLangShort(activeEditLang) }})</label>
                  <textarea
                    data-field="Mo_ta"
                    v-model="edit.i18n[activeEditLang].Mo_ta"
                    :placeholder="activeEditLang === 'vi' ? 'Mô tả sản phẩm...' : (edit.i18n.vi.Mo_ta ? `Dịch từ: ${edit.i18n.vi.Mo_ta}` : 'Mô tả...')"
                    class="form-control form-textarea"
                    rows="3"
                    @input="onEditI18nChange"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-footer">
            <button class="btn-sidebar btn-danger" @click="deleteHang">
              <span class="btn-icon"><i class="ri-delete-bin-2-fill"></i></span>
              <span class="btn-text">Xóa</span>
            </button>
            <button class="btn-sidebar btn-secondary" @click="attemptCloseSidebar">
              <span class="btn-text">Hủy</span>
            </button>
          <button
  v-if="hasUnsavedChanges"
  class="btn-save-inline"
  :class="{ 'is-loading': saving }"
  @click="saveEdit"
  :disabled="saving || uploading"
>
  <span v-if="saving" class="btn-spinner"></span>
  <span v-else><i class="ri-save-3-fill"></i></span>
  <span>{{ saving ? 'Loading...' : 'Lưu' }}</span>
</button>

          </div>
        </div>
      </div>
    </transition>

    <!-- ===== DESKTOP MODAL ===== -->
    <transition name="fade-scale">
      <div v-if="showModal && !isMobile" class="modal-overlay" @click="attemptCloseModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">Chỉnh sửa sản phẩm <i class="ri-edit-box-fill"></i></h2>
            <button class="btn-close-modal" @click="attemptCloseModal"><i class="app-ico ri-close-line"></i></button>
          </div>

          <div class="modal-body">
            <div class="modal-body-grid">
              <div class="modal-image-column">
                <div class="modal-section-card modal-section-card--wide">
                  <div class="modal-section-title">ẢNH CHÍNH </div>
                  <div class="form-group main-image-group">
                    <div class="image-upload-area">
                      <div class="image-preview-container">
                        <img
                          v-if="edit.Main_img"
                          :src="edit.Main_img"
                          class="image-preview image-preview-clickable"
                          @click.stop="openImagePreview(edit.Main_img)"
                        />
                        <div v-else class="image-preview-empty">
                          <span class="empty-icon"><i class="ri-file-image-line"></i></span>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref="fileInputModal"
                        @change="handleImageUpload('Main_img', $event)"
                        accept="image/*"
                        style="display: none"
                      />
                      <button 
                        class="btn-upload-image" 
                        @click="$refs.fileInputModal.click()" 
                        :disabled="mainImageUploading"
                      >
                        {{ mainImageUploading ? 'Đang tải lên...' : 'Đổi ảnh' }}
                      </button>
                      <div class="upload-size-hint">
                        Kích thước chuẩn: <strong>800 × 800 px – 1200 × 1200 px</strong> (vuông 1:1) · Tự nén ≤ 100KB
                      </div>
                    </div>
                  </div>
                </div>
                <div class="modal-section-card modal-section-card--tight">
                  <div class="modal-section-title">Ảnh phụ <span class="upload-size-hint-inline">(800×800 – 1200×1200px · 1:1 · ≤100KB)</span></div>
                  <div class="supplementary-images modal-supplementary-grid">
                    <div
                      v-for="(key, slotIndex) in supplementaryImageKeys"
                      :key="key"
                      class="supplementary-image-slot"
                      :class="{ 'is-loading': modalSupplementaryUploading[slotIndex] }"
                      :title="edit[key] ? 'Ảnh phụ ' + (slotIndex + 1) : 'Chưa có ảnh phụ'"
                      role="button"
                      tabindex="0"
                      @click.stop="openModalSupplementaryUpload(slotIndex)"
                      @keydown.enter.prevent="openModalSupplementaryUpload(slotIndex)"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        class="supplementary-upload-input"
                        style="display: none"
                        :ref="el => setModalInput(el, slotIndex)"
                        @change="handleImageUpload(key, $event)"
                      />
                      <button
                        v-if="edit[key]"
                        type="button"
                        class="supplementary-delete-btn"
                        aria-label="Xóa ảnh phụ"
                        @click.stop="removeSupplementaryImage(key)"
                      >
                        <i class="ri-close-fill"></i>
                      </button>
                      <div v-if="modalSupplementaryUploading[slotIndex]" class="supplementary-loading" aria-hidden="true">
                        <span class="supplementary-spinner"></span>
                      </div>
                      <img
                        v-if="edit[key]"
                        :src="edit[key]"
                        :alt="(edit.Ten_hang || 'Sản phẩm') + ' ảnh phụ ' + (slotIndex + 1)"
                        class="supplementary-thumb image-preview-clickable"
                        @click.stop="openImagePreview(edit[key])"
                      />
                      <div v-else class="supplementary-thumb-empty" aria-hidden="true">
                        <i class="ri-image-line"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-details-column" v-if="edit.i18n">
                <div class="modal-section-card modal-section-card--wide" style="margin-bottom: 14px;">
                  <div class="modal-section-title">Ngôn ngữ nội dung món (gộp 5 ngôn ngữ)</div>
                  <div class="lang-tabs-bar">
                    <button
                      v-for="l in SUPPORTED_DATA_LANGS"
                      :key="l.code"
                      type="button"
                      class="lang-tab-btn"
                      :class="{ active: activeEditLang === l.code }"
                      @click="activeEditLang = l.code"
                    >
                      <img :src="l.flagImg" :alt="l.short" class="lang-tab-flag" />
                      <span>{{ l.label }} ({{ l.short }})</span>
                      <span
                        class="lang-tab-dot"
                        :class="{ filled: hasEditLangContent(l.code) }"
                      ></span>
                    </button>
                  </div>
                </div>
                <div class="modal-details-grid">
                  <div class="modal-section-card">
                    <div class="modal-section-title">Thông tin chung</div>
                    <div class="modal-section-grid modal-section-grid-2">
                      <div class="form-group">
                        <label class="form-label">Mã hàng</label>
                        <input data-field="Ma_hang" v-model="edit.Ma_hang" disabled class="form-control" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Trạng thái</label>
                        <select
                          data-field="Trang_thai"
                          ref="statusSelectModal"
                          v-model="edit.Trang_thai"
                          class="form-control"
                          @change="markAsEdited"
                        >
                          <option>Còn hàng</option>
                          <option>Hết hàng</option>
                        </select>
                        <div v-if="isMobile && statusOptionsVisible" class="mobile-status-options">
                          <button
                            class="status-option-btn"
                            :class="{ active: edit.Trang_thai === 'Còn hàng' }"
                            @click="selectMobileStatus('Còn hàng')"
                          >
                            Còn hàng
                          </button>
                          <button
                            class="status-option-btn"
                            :class="{ active: edit.Trang_thai === 'Hết hàng' }"
                            @click="selectMobileStatus('Hết hàng')"
                          >
                            Hết hàng
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                      <label class="form-label">Tên sản phẩm ({{ getLangShort(activeEditLang) }})</label>
                      <input
                        data-field="Ten_hang"
                        v-model="edit.i18n[activeEditLang].Ten_hang"
                        :placeholder="activeEditLang === 'vi' ? 'Tên sản phẩm...' : (edit.i18n.vi.Ten_hang ? `Dịch từ: ${edit.i18n.vi.Ten_hang}` : 'Tên sản phẩm...')"
                        class="form-control"
                        @input="onEditI18nChange"
                      />
                    </div>
                    <div class="modal-section-grid modal-section-grid-3">
                      <div class="form-group">
                        <label class="form-label">Danh mục ({{ getLangShort(activeEditLang) }})</label>
                        <input
                          data-field="Danh_muc"
                          v-model="edit.i18n[activeEditLang].Danh_muc"
                          :placeholder="activeEditLang === 'vi' ? 'Danh mục...' : (edit.i18n.vi.Danh_muc ? `Dịch từ: ${edit.i18n.vi.Danh_muc}` : 'Danh mục...')"
                          class="form-control"
                          @input="onEditI18nChange"
                        />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Size</label>
                        <input data-field="Size" v-model="edit.Size" class="form-control" @input="markAsEdited" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">ĐVT ({{ getLangShort(activeEditLang) }})</label>
                        <input
                          data-field="Dvt"
                          v-model="edit.i18n[activeEditLang].Dvt"
                          :placeholder="activeEditLang === 'vi' ? 'ĐVT...' : (edit.i18n.vi.Dvt ? `Dịch từ: ${edit.i18n.vi.Dvt}` : 'ĐVT...')"
                          class="form-control"
                          @input="onEditI18nChange"
                        />
                      </div>
                    </div>
                  </div>
                <div class="modal-section-card">
  <div class="modal-section-title">Giá bán & Khuyến mãi</div>
  <div class="modal-section-grid modal-section-grid-2">
    <div class="form-group">
      <label class="form-label">Tiền tệ</label>
      <input
        data-field="Don_vi_tien_te"
        v-model="edit.Don_vi_tien_te"
        placeholder="P"
        class="form-control"
        @input="markAsEdited"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Giá gốc</label>
      <input
        data-field="Gia_goc"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        class="form-control"
        :value="fmtMoney(edit.Gia_goc)"
        @input="onMoneyInput($event, 'Gia_goc')"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Giá bán</label>
      <input
        data-field="Gia_ban"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        class="form-control"
        :value="fmtMoney(edit.Gia_ban)"
        @input="onMoneyInput($event, 'Gia_ban')"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Giá giảm</label>
      <input
        data-field="Gia_Giam"
        ref="discountInputModal"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="0"
        class="form-control"
        :class="{ 'form-control-highlight': isDiscountMode }"
        :value="fmtMoney(edit.Gia_Giam)"
        @input="onMoneyInput($event, 'Gia_Giam')"
      />
    </div>
  </div>
  <div class="ncc-edit-block">
    <label class="form-label">CK NCC (% giá gốc hoặc Tiền trực tiếp)</label>
    <div class="ncc-disc-input-row">
      <div class="ncc-type-toggle" role="group">
        <button
          type="button"
          class="ncc-type-btn"
          :class="{ active: edit.Ncc_loai_giam !== 'money' }"
          @click="edit.Ncc_loai_giam = 'percent'; markAsEdited()"
        >
          %
        </button>
        <button
          type="button"
          class="ncc-type-btn"
          :class="{ active: edit.Ncc_loai_giam === 'money' }"
          @click="edit.Ncc_loai_giam = 'money'; markAsEdited()"
        >
          Tiền ({{ edit.Don_vi_tien_te || 'P' }})
        </button>
      </div>
      <input
        type="number"
        min="0"
        step="any"
        v-model.number="edit.Ncc_gia_tri_giam"
        placeholder="0"
        class="form-control ncc-val-input"
        @input="markAsEdited"
      />
    </div>
  </div>
</div>
                </div>
                <div class="modal-section-card modal-section-card--wide">
                  <div class="modal-section-title">Mô tả sản phẩm ({{ getLangShort(activeEditLang) }})</div>
                  <div class="form-group">
                    <textarea
                      data-field="Mo_ta"
                      v-model="edit.i18n[activeEditLang].Mo_ta"
                      :placeholder="activeEditLang === 'vi' ? 'Mô tả sản phẩm...' : (edit.i18n.vi.Mo_ta ? `Dịch từ: ${edit.i18n.vi.Mo_ta}` : 'Mô tả...')"
                      class="form-control form-textarea"
                      rows="3"
                      @input="onEditI18nChange"
                    ></textarea>
                  </div>
                  <label class="hide-toggle-row">
                    <input type="checkbox" v-model="edit.Is_hidden" @change="markAsEdited" />
                    <span>Ẩn sản phẩm khỏi Menu Online</span>
                  </label>
                  <div class="top-modal-row">
                    <label class="hide-toggle-row top-toggle-row">
                      <input type="checkbox" v-model="editIsTop" />
                      <span>Ghim lên Top Menu Online</span>
                    </label>
                    <button
                      v-if="getProductTopAt(edit) > 0 && !isTopRankOne(edit)"
                      type="button"
                      class="btn-bump-top-inline"
                      @click="bumpEditToTop"
                    >
                      <i class="ri-arrow-up-double-line"></i> Đẩy lên #1
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <div class="modal-footer-left">
              <button class="btn-modal btn-danger" @click="deleteHang">
                <span class="btn-icon"><i class="ri-delete-bin-2-fill"></i></span>
                <span class="btn-text">Xóa</span>
              </button>
            </div>
            <div class="modal-footer-right">
              <button class="btn-modal btn-secondary" @click="attemptCloseModal">
                <span class="btn-text">Hủy</span>
              </button>
              <button
                v-if="hasUnsavedChanges"
                class="btn-modal btn-primary"
                :class="{ 'is-loading': saving }"
                @click="saveEdit"
                :disabled="saving || uploading"
              >
                <span v-if="saving" class="btn-spinner"></span>
                <span class="btn-text">{{ saving ? 'Loading...' : 'Lưu' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <!-- ===== IMAGE PREVIEW ===== -->
    <transition name="fade-scale">
      <div v-if="previewImageUrl" class="image-preview-overlay" @click="closeImagePreview">
        <div class="image-preview-modal" @click.stop>
          <button class="image-preview-close" @click="closeImagePreview">✕</button>
          <img :src="previewImageUrl" class="image-preview-large" alt="Xem ảnh phóng to" />
        </div>
      </div>
    </transition>
    <!-- ===== NOTIFICATION MODAL ===== -->
    <transition name="fade-scale">
      <div v-if="alertMessage" class="notification-overlay" @click="alertMessage = ''">
        <div class="notification-box" @click.stop :class="`notification-${alertType}`">
          <div class="notification-icon">
            <span v-if="alertType === 'success'">✅</span>
            <span v-else-if="alertType === 'error'">❌</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="notification-content">
            <p class="notification-message">{{ alertMessage }}</p>
          </div>
          <button class="btn-notification-close" @click="alertMessage = ''">Đóng</button>
        </div>
      </div>
    </transition>

    <!-- ===== CONFIRM MODAL ===== -->
    <transition name="fade-scale">
    <div v-if="confirmData" class="notification-overlay" @click="!confirmBusy && (confirmData = null)">
  <div class="confirm-box" @click.stop>
    <div class="confirm-icon">⚠️</div>
    <div class="confirm-content">
      <h3 class="confirm-title">{{ confirmData.title || 'Xác nhận thao tác' }}</h3>
      <p class="confirm-message">{{ confirmData.message }}</p>
    </div>

    <div class="confirm-actions">
      <button class="btn-confirm btn-secondary" :disabled="confirmBusy" @click="confirmData = null">
        Hủy
      </button>

      <button class="btn-confirm btn-danger" :disabled="confirmBusy" @click="confirmAction">
        <span v-if="confirmBusy" class="spinner"></span>
        <span>
          {{
            confirmBusy
              ? (confirmData.loadingText || 'Đang xử lý...')
              : (confirmData.confirmText || 'Xác nhận')
          }}
        </span>
      </button>
    </div>
  </div>
</div>

    </transition>

    <button
      v-if="showScrollTop"
      :class="['scroll-top-btn', { 'scroll-top-btn--raised': raiseScrollTop }]"
      @click="scrollToTableTop()"
      title="Lên đầu danh sách"
      aria-label="Scroll to top"
    >
      <i class="ri-arrow-up-line"></i>
    </button>

    <!-- ===== FLOATING BULK ACTION BAR ===== -->
    <transition name="fade-scale">
      <div v-if="selected.length > 0 && !showBulkEditModal" class="bulk-floating-bar">
        <div class="bfb-info">
          <span class="bfb-count">{{ selected.length }}</span>
          <span class="bfb-label">sản phẩm đã chọn</span>
        </div>
        <div class="bfb-actions">
          <button type="button" class="bfb-btn bfb-btn-clear" @click="clearSelection">
            Bỏ chọn
          </button>
          <button type="button" class="bfb-btn bfb-btn-edit" @click="openBulkEditModal">
            <i class="ri-edit-box-line"></i>
            <span>Sửa hàng loạt</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- ===== BULK EDIT MODAL ===== -->
    <transition name="modal-fade">
      <div v-if="showBulkEditModal" class="bulk-modal-overlay" @click.self="closeBulkEditModal">
        <div class="bulk-modal-card" @click.stop>
          <div class="bulk-modal-header">
            <div>
              <h2 class="bulk-modal-title">
                <i class="ri-stack-line"></i>
                Sửa hàng loạt ({{ selectedProducts.length }} sản phẩm)
              </h2>
              <p class="bulk-modal-sub">
                Chỉ những mục được tick chọn bên dưới mới được áp dụng cập nhật; các mục khác giữ nguyên.
              </p>
            </div>
            <button type="button" class="modal-close" @click="closeBulkEditModal">✕</button>
          </div>

          <div class="bulk-modal-body">
            <!-- Selected preview chips -->
            <div class="bulk-preview-strip">
              <span
                v-for="sp in selectedProducts.slice(0, 6)"
                :key="sp.Ma_hang"
                class="bulk-preview-chip"
                :title="sp.Ma_hang"
              >
                {{ sp.Ten_hang }}
              </span>
              <span v-if="selectedProducts.length > 6" class="bulk-preview-chip is-more">
                +{{ selectedProducts.length - 6 }} sản phẩm khác
              </span>
            </div>

            <div class="bulk-fields-grid">
              <!-- Danh mục -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableDanhMuc }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableDanhMuc" />
                  <span>Danh mục ({{ getLangShort(selectedLanguage) }})</span>
                </label>
                <input
                  v-model="bulkForm.Danh_muc"
                  :disabled="!bulkForm.enableDanhMuc"
                  placeholder="Nhập tên danh mục mới..."
                  class="form-control"
                />
              </div>

              <!-- Size -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableSize }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableSize" />
                  <span>Size</span>
                </label>
                <input
                  v-model="bulkForm.Size"
                  :disabled="!bulkForm.enableSize"
                  placeholder="VD: L, M, 500g..."
                  class="form-control"
                />
              </div>

              <!-- ĐVT -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableDvt }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableDvt" />
                  <span>ĐVT ({{ getLangShort(selectedLanguage) }})</span>
                </label>
                <input
                  v-model="bulkForm.Dvt"
                  :disabled="!bulkForm.enableDvt"
                  placeholder="VD: Phần, Hộp, Chai..."
                  class="form-control"
                />
              </div>

              <!-- Tiền tệ -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableDonViTienTe }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableDonViTienTe" />
                  <span>Tiền tệ</span>
                </label>
                <input
                  v-model="bulkForm.Don_vi_tien_te"
                  :disabled="!bulkForm.enableDonViTienTe"
                  placeholder="P / VND"
                  class="form-control"
                />
              </div>

              <!-- Trạng thái kho -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableTrangThai }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableTrangThai" />
                  <span>Trạng thái kho</span>
                </label>
                <select
                  v-model="bulkForm.Trang_thai"
                  :disabled="!bulkForm.enableTrangThai"
                  class="form-control"
                >
                  <option value="Còn hàng">Còn hàng</option>
                  <option value="Hết hàng">Hết hàng</option>
                </select>
              </div>

              <!-- Ẩn / Hiện trên Menu Web -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableHidden }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableHidden" />
                  <span>Hiển thị Menu Online</span>
                </label>
                <div class="bulk-seg-group" :class="{ disabled: !bulkForm.enableHidden }">
                  <button
                    type="button"
                    class="bulk-seg-btn"
                    :class="{ active: !bulkForm.Is_hidden }"
                    :disabled="!bulkForm.enableHidden"
                    @click="bulkForm.Is_hidden = false"
                  >
                    <i class="ri-eye-line"></i> Hiện
                  </button>
                  <button
                    type="button"
                    class="bulk-seg-btn is-warn"
                    :class="{ active: bulkForm.Is_hidden }"
                    :disabled="!bulkForm.enableHidden"
                    @click="bulkForm.Is_hidden = true"
                  >
                    <i class="ri-eye-off-line"></i> Ẩn
                  </button>
                </div>
              </div>

              <!-- Đẩy lên Top / Bỏ ghim Top -->
              <div class="bulk-field-card bulk-span-2" :class="{ active: bulkForm.enableTop }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableTop" />
                  <span>Ưu tiên vị trí Top (Kho hàng & Menu Online)</span>
                </label>
                <div class="bulk-seg-group" :class="{ disabled: !bulkForm.enableTop }">
                  <button
                    type="button"
                    class="bulk-seg-btn is-top"
                    :class="{ active: bulkForm.topAction === 'pin' }"
                    :disabled="!bulkForm.enableTop"
                    @click="bulkForm.topAction = 'pin'"
                  >
                    <i class="ri-arrow-up-double-line"></i> Đẩy lên Top
                  </button>
                  <button
                    type="button"
                    class="bulk-seg-btn is-warn"
                    :class="{ active: bulkForm.topAction === 'unpin' }"
                    :disabled="!bulkForm.enableTop"
                    @click="bulkForm.topAction = 'unpin'"
                  >
                    <i class="ri-unpin-line"></i> Bỏ ghim Top
                  </button>
                </div>
              </div>

              <!-- CK NCC -->
              <div class="bulk-field-card bulk-span-2" :class="{ active: bulkForm.enableNccDiscount }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableNccDiscount" />
                  <span>CK NCC (% giá gốc hoặc Tiền trực tiếp)</span>
                </label>
                <div class="ncc-disc-input-row">
                  <div class="ncc-type-toggle" role="group">
                    <button
                      type="button"
                      class="ncc-type-btn"
                      :class="{ active: bulkForm.Ncc_loai_giam !== 'money' }"
                      :disabled="!bulkForm.enableNccDiscount"
                      @click="bulkForm.Ncc_loai_giam = 'percent'"
                    >
                      %
                    </button>
                    <button
                      type="button"
                      class="ncc-type-btn"
                      :class="{ active: bulkForm.Ncc_loai_giam === 'money' }"
                      :disabled="!bulkForm.enableNccDiscount"
                      @click="bulkForm.Ncc_loai_giam = 'money'"
                    >
                      Tiền
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    v-model.number="bulkForm.Ncc_gia_tri_giam"
                    :disabled="!bulkForm.enableNccDiscount"
                    placeholder="0"
                    class="form-control ncc-val-input"
                  />
                </div>
              </div>

              <!-- Giá gốc -->
              <div class="bulk-field-card bulk-span-2" :class="{ active: bulkForm.enableGiaGoc }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableGiaGoc" />
                  <span>Giá gốc</span>
                </label>
                <div class="bulk-price-row">
                  <select
                    v-model="bulkForm.giaGocMode"
                    :disabled="!bulkForm.enableGiaGoc"
                    class="form-control bulk-mode-select"
                  >
                    <option value="set">Gán giá cố định</option>
                    <option value="add_money">Tăng thêm (+ tiền)</option>
                    <option value="sub_money">Giảm bớt (- tiền)</option>
                    <option value="add_percent">Tăng thêm (+ %)</option>
                    <option value="sub_percent">Giảm bớt (- %)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    v-model.number="bulkForm.giaGocValue"
                    :disabled="!bulkForm.enableGiaGoc"
                    placeholder="0"
                    class="form-control bulk-val-input"
                  />
                </div>
              </div>

              <!-- Giá bán -->
              <div class="bulk-field-card bulk-span-2" :class="{ active: bulkForm.enableGiaBan }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableGiaBan" />
                  <span>Giá bán</span>
                </label>
                <div class="bulk-price-row">
                  <select
                    v-model="bulkForm.giaBanMode"
                    :disabled="!bulkForm.enableGiaBan"
                    class="form-control bulk-mode-select"
                  >
                    <option value="set">Gán giá cố định</option>
                    <option value="add_money">Tăng thêm (+ tiền)</option>
                    <option value="sub_money">Giảm bớt (- tiền)</option>
                    <option value="add_percent">Tăng thêm (+ %)</option>
                    <option value="sub_percent">Giảm bớt (- %)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    v-model.number="bulkForm.giaBanValue"
                    :disabled="!bulkForm.enableGiaBan"
                    placeholder="0"
                    class="form-control bulk-val-input"
                  />
                </div>
              </div>

              <!-- Giá giảm -->
              <div class="bulk-field-card bulk-span-2" :class="{ active: bulkForm.enableGiaGiam }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableGiaGiam" />
                  <span>Giá giảm (Gán 0 để tắt khuyến mãi)</span>
                </label>
                <div class="bulk-price-row">
                  <select
                    v-model="bulkForm.giaGiamMode"
                    :disabled="!bulkForm.enableGiaGiam"
                    class="form-control bulk-mode-select"
                  >
                    <option value="set">Gán giá cố định</option>
                    <option value="add_money">Tăng thêm (+ tiền)</option>
                    <option value="sub_money">Giảm bớt (- tiền)</option>
                    <option value="add_percent">Tăng thêm (+ %)</option>
                    <option value="sub_percent">Giảm bớt (- %)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    v-model.number="bulkForm.giaGiamValue"
                    :disabled="!bulkForm.enableGiaGiam"
                    placeholder="0"
                    class="form-control bulk-val-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="bulk-modal-footer">
            <button
              type="button"
              class="btn-modal btn-danger"
              :disabled="bulkSaving"
              @click="bulkDeleteFromModal"
            >
              <i class="ri-delete-bin-2-fill"></i>
              <span>Xóa hàng loạt ({{ selectedProducts.length }})</span>
            </button>
            <div class="bulk-footer-right">
              <button
                type="button"
                class="btn-modal btn-secondary"
                :disabled="bulkSaving"
                @click="closeBulkEditModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn-modal btn-primary"
                :disabled="bulkSaving || !hasAnyBulkFieldEnabled"
                @click="saveBulkEdit"
              >
                <span v-if="bulkSaving" class="btn-spinner"></span>
                <span>{{ bulkSaving ? 'Đang cập nhật...' : `Lưu thay đổi (${selectedProducts.length})` }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToImgBB } from '@/utils/imageUpload.js'
import {
  SUPPORTED_DATA_LANGS,
  normalizeProductI18n,
  syncProductWithI18n,
  localizeProduct,
  getProductTranslatedLangs,
  productMatchesKeyword,
} from '@/utils/i18nData'
import {
  normalizeNccDiscountType,
  normalizeNccDiscountValue,
  formatNccDiscountLabel,
} from '@/utils/nccDiscount'

const supplementaryImageKeys = ['img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6']
const modalSupplementaryUploading = ref(supplementaryImageKeys.map(() => false))

const list = ref([])
const keyword = ref('')
const selected = ref([])
const sortOrder = ref('desc') // 'desc' = mới → cũ, 'asc' = cũ → mới
const selectedLanguage = ref('vi') // Ngôn ngữ hiển thị & xuất dữ liệu
const activeEditLang = ref('vi') // Tab ngôn ngữ trong modal chỉnh sửa
// Filter states
const selectedCategory = ref('')
const filterPromotion = ref(false)
const filterStatus = ref('all') // 'all', 'available', 'out'
const showCategoryFilter = ref(false)

const showModal = ref(false)
const showSidebar = ref(false)
const edit = ref({})
const originalEdit = ref({})
const hasUnsavedChanges = ref(false)
const discountInput = ref(null)
const discountInputModal = ref(null)
const statusSelect = ref(null)
const statusSelectModal = ref(null)
const isDiscountMode = ref(false)

/* ===== BULK EDIT MODAL STATE ===== */
const showBulkEditModal = ref(false)
const bulkSaving = ref(false)
const createDefaultBulkForm = () => ({
  enableDanhMuc: false,
  Danh_muc: '',
  enableSize: false,
  Size: '',
  enableDvt: false,
  Dvt: '',
  enableDonViTienTe: false,
  Don_vi_tien_te: 'P',
  enableTrangThai: false,
  Trang_thai: 'Còn hàng',
  enableHidden: false,
  Is_hidden: false,
  enableTop: false,
  topAction: 'pin',
  enableNccDiscount: false,
  Ncc_loai_giam: 'percent',
  Ncc_gia_tri_giam: 0,
  enableGiaGoc: false,
  giaGocMode: 'set',
  giaGocValue: 0,
  enableGiaBan: false,
  giaBanMode: 'set',
  giaBanValue: 0,
  enableGiaGiam: false,
  giaGiamMode: 'set',
  giaGiamValue: 0,
})
const bulkForm = ref(createDefaultBulkForm())

const selectedProducts = computed(() => {
  const chosenSet = new Set(selected.value || [])
  return (list.value || []).filter((item) => chosenSet.has(item.Ma_hang))
})

const hasAnyBulkFieldEnabled = computed(() => {
  const f = bulkForm.value
  return Boolean(
    f.enableDanhMuc ||
      f.enableSize ||
      f.enableDvt ||
      f.enableDonViTienTe ||
      f.enableTrangThai ||
      f.enableHidden ||
      f.enableTop ||
      f.enableNccDiscount ||
      f.enableGiaGoc ||
      f.enableGiaBan ||
      f.enableGiaGiam,
  )
})
const statusOptionsVisible = ref(false)
const previewImageUrl = ref('')

const alertMessage = ref('')
const alertType = ref('info')
const confirmData = ref(null)
const confirmBusy = ref(false)

const isMobile = ref(window.innerWidth <= 768)
const desktopTableSection = ref(null)
const mobileListSection = ref(null)
const mobileSearchRef = ref(null)
const desktopTableAnchor = ref(null)
const mobileTableAnchor = ref(null)
const showScrollTop = ref(false)
const pageRef = ref(null)
const scrollCheckInterval = ref(null)
const scrollContainer = ref(null)
const scrollTopHoldTimer = ref(null)
const holdScrollTopVisible = ref(false)
const lazySentinelDesktopRef = ref(null)
const lazySentinelMobileRef = ref(null)
const raiseScrollTop = ref(false)
const tableHovering = ref(false)
const mainEl = ref(null)
const crmMainEl = ref(null)

const fileInput = ref(null)
const fileInputModal = ref(null)
const modalSupplementaryInputs = ref([])
const sidebarSupplementaryInputs = ref([])
const uploading = ref(false)
const mainImageUploading = ref(false)
const saving = ref(false) // ✅ thêm
const LAZY_INITIAL_COUNT = 25
const LAZY_STEP_COUNT = 25
const visibleCount = ref(LAZY_INITIAL_COUNT)
let lazyObserver = null
const tableLoading = ref(true) 
async function loadData() {
  tableLoading.value = true // ✅ dùng tableLoading
  try {
    const json = await getOneSheet('hang_hoa')
    list.value = json.data || []
  } catch (error) {
    console.error('Load data error:', error)
    showAlert('Không thể tải dữ liệu', 'error')
  } finally {
    tableLoading.value = false // ✅ tắt loading
    nextTick(() => setupLazyObserver())
  }
}
/* ===== LIFECYCLE ===== */


onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScrollTopVisibility, { passive: true, capture: true })
  document.addEventListener('scroll', handleScrollTopVisibility, { passive: true, capture: true })
  mainEl.value = document.querySelector('main')
  if (mainEl.value) {
    mainEl.value.addEventListener('scroll', handleScrollTopVisibility, { passive: true, capture: true })
  }
  crmMainEl.value = document.querySelector('.crm-main')
  if (crmMainEl.value) {
    crmMainEl.value.addEventListener('scroll', handleScrollTopVisibility, { passive: true, capture: true })
  }
  if (desktopTableSection.value) {
    desktopTableSection.value.addEventListener('scroll', handleScrollTopVisibility, { passive: true, capture: true })
  }
  nextTick(() => {
    const anchorEl = desktopTableAnchor.value || mobileTableAnchor.value || pageRef.value
    const scroller = getScrollParent(anchorEl || pageRef.value)
    if (scroller && scroller !== window) {
      scrollContainer.value = scroller
      scroller.addEventListener('scroll', handleScrollTopVisibility, { passive: true, capture: true })
    }

    handleScrollTopVisibility()
    setupLazyObserver()
    // extra check in case no scroll event fired yet
    setTimeout(handleScrollTopVisibility, 300)
  })
  scrollCheckInterval.value = setInterval(handleScrollTopVisibility, 400)
})

onUnmounted(() => {
  if (lazyObserver) {
    lazyObserver.disconnect()
    lazyObserver = null
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScrollTopVisibility)
  document.removeEventListener('scroll', handleScrollTopVisibility)
  if (mainEl.value) {
    mainEl.value.removeEventListener('scroll', handleScrollTopVisibility)
  }
  if (crmMainEl.value) {
    crmMainEl.value.removeEventListener('scroll', handleScrollTopVisibility)
  }
  if (desktopTableSection.value) {
    desktopTableSection.value.removeEventListener('scroll', handleScrollTopVisibility)
  }
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScrollTopVisibility, { capture: true })
  }
  if (scrollCheckInterval.value) {
    clearInterval(scrollCheckInterval.value)
  }
  if (scrollTopHoldTimer.value) {
    clearTimeout(scrollTopHoldTimer.value)
  }
})


function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

function handleScrollTopVisibility() {
  if (!isMobile.value && tableHovering.value) {
    showScrollTop.value = false
    return
  }
  if (holdScrollTopVisible.value) {
    showScrollTop.value = true
    return
  }

  const triggerEl = isMobile.value ? mobileListSection.value : desktopTableSection.value
  const customScroller = scrollContainer.value || getScrollParent(triggerEl || pageRef.value)
  const sources = [
    window,
    customScroller,
    mainEl.value,
    crmMainEl.value,
    !isMobile.value ? desktopTableSection.value : null
  ].filter(Boolean)

  showScrollTop.value = sources.some(src => isScrolledPastTrigger(src, triggerEl))

  // Lift the button when lazy footer is near the viewport bottom to avoid overlap
  const pag = isMobile.value ? lazySentinelMobileRef.value : lazySentinelDesktopRef.value
  if (pag) {
    const rect = pag.getBoundingClientRect()
    raiseScrollTop.value = rect.bottom > window.innerHeight - 90
    if (rect.top <= window.innerHeight + 260) {
      loadMoreProducts()
    }
  } else {
    raiseScrollTop.value = false
  }
}

function getScrollOffset(scroller) {
  if (!scroller || scroller === window) {
    const docOffset = document.documentElement ? document.documentElement.scrollTop : 0
    const bodyOffset = document.body ? document.body.scrollTop : 0
    const winOffset = window.pageYOffset ?? window.scrollY ?? 0
    return Math.max(winOffset, docOffset, bodyOffset)
  }
  return scroller.scrollTop || 0
}

function getElementScrollOffset(el, scroller) {
  if (!el) return 0
  if (!scroller || scroller === window) {
    return el.getBoundingClientRect().top + getScrollOffset(window)
  }
  const parentRect = scroller.getBoundingClientRect()
  return el.getBoundingClientRect().top - parentRect.top + scroller.scrollTop
}

function isScrolledPastTrigger(scroller, targetEl) {
  if (!scroller || !targetEl) return false
  if (scroller === window) {
    return getScrollOffset(window) >= getElementScrollOffset(targetEl, window)
  }
  if (scroller === targetEl) {
    return getScrollOffset(scroller) > 0
  }
  return getScrollOffset(scroller) >= getElementScrollOffset(targetEl, scroller)
}

/* ===== LOCALIZED LIST & CATEGORIES ===== */
const displayLang = computed(() => selectedLanguage.value || 'vi')

const localizedList = computed(() =>
  list.value.map((item) => localizeProduct(item, displayLang.value))
)

const categories = computed(() => {
  const catMap = {}
  localizedList.value.forEach(item => {
    const cat = item.Danh_muc || 'Khác'
    catMap[cat] = (catMap[cat] || 0) + 1
  })
  return Object.keys(catMap)
    .sort()
    .map(name => ({ name, count: catMap[name] }))
})

/* ===== FILTER FUNCTIONS ===== */
function togglePromotionFilter() {
  filterPromotion.value = !filterPromotion.value
  resetVisibleCount()
}

function setStatusFilter(status) {
  if (filterStatus.value === status) {
    filterStatus.value = 'all'
  } else {
    filterStatus.value = status
  }
  resetVisibleCount()
}

const hasActiveFilters = computed(() => {
  return Boolean(
    selectedCategory.value ||
    (selectedLanguage.value && selectedLanguage.value !== 'vi') ||
    filterPromotion.value ||
    filterStatus.value !== 'all'
  )
})

function clearAllFilters() {
  selectedCategory.value = ''
  selectedLanguage.value = 'vi'
  filterPromotion.value = false
  filterStatus.value = 'all'
  resetVisibleCount()
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  resetVisibleCount()
}

function selectLanguage(lang) {
  selectedLanguage.value = lang || 'vi'
  selectedCategory.value = ''
  showLanguageMenu.value = false
  resetVisibleCount()
}

function getLanguageLabel() {
  return SUPPORTED_DATA_LANGS.find((l) => l.code === selectedLanguage.value)?.label || 'Tiếng Việt'
}

function getLangShort(code) {
  return SUPPORTED_DATA_LANGS.find((l) => l.code === code)?.short || String(code || 'vi').toUpperCase()
}

function hasItemLang(item, code) {
  return getProductTranslatedLangs(item).includes(code)
}

function hasEditLangContent(code) {
  return Boolean(String(edit.value?.i18n?.[code]?.Ten_hang || '').trim())
}

function onEditI18nChange() {
  if (edit.value?.i18n) {
    edit.value.Ten_hang =
      String(edit.value.i18n.vi?.Ten_hang || '').trim() ||
      String(edit.value.i18n.en?.Ten_hang || '').trim() ||
      String(edit.value.Ten_hang || '').trim()
    edit.value.Danh_muc = String(edit.value.i18n.vi?.Danh_muc || '').trim()
    edit.value.Dvt = String(edit.value.i18n.vi?.Dvt || '').trim()
    edit.value.Mo_ta = String(edit.value.i18n.vi?.Mo_ta || '').trim()
  }
  markAsEdited()
}

// ===== DROPDOWN STATE =====
const showStatusMenu = ref(false)
const showExportMenu = ref(false)
const showLanguageMenu = ref(false)

function getStatusLabel() {
  if (filterStatus.value === 'available') return 'Còn hàng'
  if (filterStatus.value === 'out') return 'Hết hàng'
  if (filterStatus.value === 'hidden') return 'Đang ẩn'
  return 'Trạng thái'
}

function selectStatus(key) {
  setStatusFilter(key)
  showStatusMenu.value = false
}

function selectExport(type) {
  showExportMenu.value = false
  if (type === 'text') exportText()
  if (type === 'full') exportFull()
  if (type === 'name') exportTen()
  if (type === 'price') exportGia()
  if (type === 'price_dvt') exportGiaBanDvt()
}

/* ===== SEARCH ===== */
function handleSearch() {
  resetVisibleCount()
}

function clearSearch() {
  keyword.value = ''
  resetVisibleCount()
}

/* ===== IMAGE UPLOAD ===== */
async function handleImageUpload(targetKey = 'Main_img', event) {
  if (!event) return
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showAlert('Vui lòng chọn file hình ảnh', 'error')
    return
  }

  if (file.size > 25 * 1024 * 1024) {
    showAlert('Kích thước ảnh tối đa 25MB', 'error')
    return
  }

  const slotIndex = supplementaryImageKeys.indexOf(targetKey)
  const isMainImage = targetKey === 'Main_img'
  if (slotIndex >= 0) {
    modalSupplementaryUploading.value[slotIndex] = true
  }

  uploading.value = true
  if (isMainImage) {
    mainImageUploading.value = true
  }

  try {
    const uploadedUrl = await uploadImageToImgBB(file, {
      targetKB: 100,
      maxWidth: 1200,
      maxHeight: 1200,
    })

    const key = targetKey || 'Main_img'
    edit.value[key] = uploadedUrl
    markAsEdited()
  } catch (error) {
    console.error('Upload error:', error)
    showAlert('Upload ảnh thất bại', 'error')
  } finally {
    uploading.value = false
    if (slotIndex >= 0) {
      modalSupplementaryUploading.value[slotIndex] = false
    }
    if (isMainImage) {
      mainImageUploading.value = false
    }
    if (fileInput.value) fileInput.value.value = ''
    if (fileInputModal.value) fileInputModal.value.value = ''
    modalSupplementaryInputs.value.forEach(input => {
      if (input) input.value = ''
    })
    sidebarSupplementaryInputs.value.forEach(input => {
      if (input) input.value = ''
    })
  }
}

function setModalInput(el, index) {
  if (el) {
    modalSupplementaryInputs.value[index] = el
  } else {
    modalSupplementaryInputs.value[index] = null
  }
}

function openImagePreview(url) {
  if (!url) return
  previewImageUrl.value = url
}

function closeImagePreview() {
  previewImageUrl.value = ''
}

function setSidebarInput(el, index) {
  if (el) {
    sidebarSupplementaryInputs.value[index] = el
  } else {
    sidebarSupplementaryInputs.value[index] = null
  }
}

function openModalSupplementaryUpload(index) {
  const input = modalSupplementaryInputs.value[index]
  if (input) {
    input.click()
  }
}

function openSidebarSupplementaryUpload(index) {
  const input = sidebarSupplementaryInputs.value[index]
  if (input) {
    input.click()
  }
}

function removeSupplementaryImage(key) {
  if (!key) return
  edit.value[key] = ''
  markAsEdited()
}

/* ===== COMPUTED ===== */
/* ===== FILTER HELPERS ===== */
function matchesKeyword(item) {
  return productMatchesKeyword(item, keyword.value)
}

function matchesCategory(item) {
  if (!selectedCategory.value) return true
  return (item.Danh_muc || 'Khác') === selectedCategory.value
}

function matchesPromo(item) {
  return item.Gia_Giam && item.Gia_Giam > 0
}

function isProductHidden(item) {
  return (
    item?.Is_hidden === true ||
    String(item?.Is_hidden) === 'true' ||
    String(item?.Trang_thai || '').trim() === 'Ẩn'
  )
}

function getProductTopAt(item) {
  const val = Number(item?.Top_at || 0)
  return Number.isFinite(val) && val > 0 ? val : 0
}

function isTopProduct(item) {
  return getProductTopAt(item) > 0
}

function getNextTopTimestamp() {
  const maxExisting = (list.value || []).reduce(
    (max, item) => Math.max(max, getProductTopAt(item)),
    0,
  )
  return Math.max(Date.now(), maxExisting + 1)
}

const topRankMap = computed(() => {
  const pinned = (list.value || [])
    .filter((item) => getProductTopAt(item) > 0)
    .sort((a, b) => getProductTopAt(b) - getProductTopAt(a))
  const map = new Map()
  pinned.forEach((item, index) => {
    map.set(item.Ma_hang, index + 1)
  })
  return map
})

function getTopRank(item) {
  if (!item?.Ma_hang) return 0
  return topRankMap.value.get(item.Ma_hang) || 0
}

function isTopRankOne(item) {
  return getTopRank(item) === 1
}

const editIsTop = computed({
  get: () => getProductTopAt(edit.value) > 0,
  set: (checked) => {
    edit.value.Top_at = checked ? getNextTopTimestamp() : 0
    markAsEdited()
  },
})

function bumpEditToTop() {
  edit.value.Top_at = getNextTopTimestamp()
  markAsEdited()
}

function matchesStatus(item, status) {
  if (status === 'all') return true
  if (status === 'hidden') return isProductHidden(item)
  const isOut = String(item.Trang_thai || '').trim() === 'Hết hàng'
  if (status === 'out') return isOut
  if (status === 'available') return !isOut
  return true
}

/* ===== COMPUTED ===== */
// List after Search + Category (localized to selectedLanguage)
const baseList = computed(() => localizedList.value.filter(item => 
  matchesKeyword(item) && matchesCategory(item)
))

// Count Promo items (within current base list + current status)
const countPromo = computed(() => {
  return baseList.value.filter(item => 
    matchesStatus(item, filterStatus.value) && matchesPromo(item)
  ).length
})

// Count Result items (Current View Count) - implicitly the status count
const countStatusResult = computed(() => filtered.value.length)

const filtered = computed(() =>
  baseList.value.filter(item => {
    // Promotion filter
    if (filterPromotion.value && !matchesPromo(item)) return false

    // Status filter
    if (!matchesStatus(item, filterStatus.value)) return false

    return true
  })
)

const ordered = computed(() => {
  const baseArr =
    sortOrder.value === 'desc' ? [...filtered.value].reverse() : [...filtered.value]
  return baseArr
    .map((item, idx) => {
      const rawOrder = Number(item?.Thu_tu || 0)
      const order = Number.isFinite(rawOrder) && rawOrder > 0 ? Math.floor(rawOrder) : Number.MAX_SAFE_INTEGER
      return { item, idx, topAt: getProductTopAt(item), order }
    })
    .sort((a, b) => {
      if (a.topAt !== b.topAt) return b.topAt - a.topAt
      if (a.order !== b.order) return a.order - b.order
      return a.idx - b.idx
    })
    .map((entry) => entry.item)
})

const visibleProducts = computed(() => ordered.value.slice(0, visibleCount.value))

const hasMoreProducts = computed(() => visibleCount.value < ordered.value.length)

const isAllSelected = computed(() => {
  if (!ordered.value.length) return false
  const selectedSet = new Set(selected.value)
  return ordered.value.every((item) => selectedSet.has(item.Ma_hang))
})

function resetVisibleCount() {
  visibleCount.value = LAZY_INITIAL_COUNT
}

function loadMoreProducts() {
  if (!hasMoreProducts.value) return
  visibleCount.value = Math.min(ordered.value.length, visibleCount.value + LAZY_STEP_COUNT)
}

function setupLazyObserver() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return
  if (lazyObserver) {
    lazyObserver.disconnect()
  }
  lazyObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMoreProducts()
      }
    },
    { root: null, rootMargin: '260px 0px', threshold: 0.01 },
  )
  if (lazySentinelDesktopRef.value) lazyObserver.observe(lazySentinelDesktopRef.value)
  if (lazySentinelMobileRef.value) lazyObserver.observe(lazySentinelMobileRef.value)
}

watch([filtered, sortOrder], () => {
  resetVisibleCount()
  nextTick(() => setupLazyObserver())
})

watch(isMobile, () => {
  nextTick(() => setupLazyObserver())
})

function scrollToTableTop(options = { hold: true }) {
  const shouldHold = options.hold !== false
  if (scrollTopHoldTimer.value) {
    clearTimeout(scrollTopHoldTimer.value)
  }
  holdScrollTopVisible.value = shouldHold
  showScrollTop.value = true
  nextTick(() => {
    const anchor = isMobile.value ? mobileTableAnchor.value : desktopTableAnchor.value
    if (!anchor) return

    const stickyOffset = isMobile.value && mobileSearchRef.value
      ? mobileSearchRef.value.getBoundingClientRect().height + 12
      : 0

    const scroller = getScrollParent(anchor)

    if (scroller === window) {
      const top = anchor.getBoundingClientRect().top + window.scrollY - stickyOffset
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
    } else {
      const parentRect = scroller.getBoundingClientRect()
      const top = anchor.getBoundingClientRect().top - parentRect.top + scroller.scrollTop - stickyOffset
      scroller.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
    }

    if (shouldHold) {
      scrollTopHoldTimer.value = setTimeout(() => {
        holdScrollTopVisible.value = false
        handleScrollTopVisibility()
      }, 700)
    } else {
      holdScrollTopVisible.value = false
      handleScrollTopVisibility()
    }
  })
}

function getScrollParent(el) {
  let parent = el?.parentElement
  while (parent) {
    const style = window.getComputedStyle(parent)
    const overflowY = style.overflowY || style.overflow
    if (/(auto|scroll)/.test(overflowY)) {
      return parent
    }
    parent = parent.parentElement
  }
  return window
}

/* ===== EDIT TRACKING ===== */
const numericFields = new Set(['Gia_goc', 'Gia_ban', 'Gia_Giam', 'Top_at', 'Thu_tu'])

function normalizeString(val) {
  return (val ?? '').toString().trim()
}

function valuesEqual(key, originalValue, currentValue) {
  if (key.startsWith('_')) return true
  if (key === 'i18n') {
    return JSON.stringify(originalValue || {}) === JSON.stringify(currentValue || {})
  }
  if (key === 'Gia_Giam') {
    const oEmpty = originalValue === '' || originalValue === null || originalValue === undefined
    const cEmpty = currentValue === '' || currentValue === null || currentValue === undefined
    if (oEmpty && cEmpty) return true
    return Number(originalValue || 0) === Number(currentValue || 0)
  }
  if (numericFields.has(key)) {
    return Number(originalValue || 0) === Number(currentValue || 0)
  }
  return normalizeString(originalValue) === normalizeString(currentValue)
}

function hasEditChanges() {
  const original = originalEdit.value || {}
  const current = edit.value || {}
  const keys = new Set([...Object.keys(original), ...Object.keys(current)])
  for (const key of keys) {
    if (!valuesEqual(key, original[key], current[key])) {
      return true
    }
  }
  return false
}

function markAsEdited() {
  hasUnsavedChanges.value = hasEditChanges()
}

function resetEditTracking() {
  hasUnsavedChanges.value = false
  originalEdit.value = {}
}

function selectMobileStatus(value) {
  edit.value.Trang_thai = value
  markAsEdited()
  statusOptionsVisible.value = false
}

/* ===== ACTIONS ===== */
function toggleSelectAll(e) {
  const allIds = ordered.value.map((item) => item.Ma_hang)
  if (e.target.checked) {
    selected.value = [...new Set([...selected.value, ...allIds])]
  } else {
    const allIdSet = new Set(allIds)
    selected.value = selected.value.filter((id) => !allIdSet.has(id))
  }
}

function exportText() {
  if (!selected.value.length) {
    showAlert('Vui lòng chọn sản phẩm để xuất', 'error')
    return
  }

  const text = localizedList.value
    .filter(item => selected.value.includes(item.Ma_hang))
    .map(item => `${item.Ten_hang} : ${formatNumber(item.Gia_ban)}`)
    .join('\n')

  navigator.clipboard.writeText(text)
  showAlert(`Đã sao chép ${selected.value.length} sản phẩm`, 'success')
}

function exportFull() {
  if (!selected.value.length) {
    showAlert('Vui lòng chọn sản phẩm để xuất', 'error')
    return
  }

  const text = localizedList.value
    .filter(item => selected.value.includes(item.Ma_hang))
    .map(item => `${item.Ten_hang} : ${formatNumber(item.Gia_ban)}${item.Don_vi_tien_te ? ' ' + item.Don_vi_tien_te : ''}${item.Dvt ? ' / ' + item.Dvt : ''}`)
    .join('\n')

  navigator.clipboard.writeText(text)
  showAlert(`Đã sao chép ${selected.value.length} sản phẩm đầy đủ`, 'success')
}

function exportTen() {
  if (!selected.value.length) {
    showAlert('Vui lòng chọn sản phẩm để xuất', 'error')
    return
  }

  const text = localizedList.value
    .filter(item => selected.value.includes(item.Ma_hang))
    .map(item => item.Ten_hang)
    .join('\n')

  navigator.clipboard.writeText(text)
  showAlert(`Đã sao chép ${selected.value.length} tên hàng`, 'success')
}

function exportGia() {
  if (!selected.value.length) {
    showAlert('Vui lòng chọn sản phẩm để xuất', 'error')
    return
  }

  const text = localizedList.value
    .filter(item => selected.value.includes(item.Ma_hang))
    .map(item => formatNumber(item.Gia_ban))
    .join('\n')

  navigator.clipboard.writeText(text)
  showAlert(`Đã sao chép ${selected.value.length} giá bán`, 'success')
}

function exportGiaBanDvt() {
  if (!selected.value.length) {
    showAlert('Vui lòng chọn sản phẩm để xuất', 'error')
    return
  }

  const text = localizedList.value
    .filter(item => selected.value.includes(item.Ma_hang))
    .map(item => `${formatNumber(item.Gia_ban)}${item.Don_vi_tien_te ? item.Don_vi_tien_te : ''}${item.Dvt ? ' / ' + item.Dvt : ''}`)
    .join('\n')

  navigator.clipboard.writeText(text)
  showAlert(`Đã sao chép ${selected.value.length} giá bán Tiền tệ / ĐVT`, 'success')
}

function prepareEditState(item) {
  const rawItem = list.value.find((r) => r.Ma_hang === item.Ma_hang) || item
  const i18n = normalizeProductI18n(rawItem)
  const cloned = {
    ...rawItem,
    Ten_hang: i18n.vi.Ten_hang || rawItem.Ten_hang || '',
    Danh_muc: i18n.vi.Danh_muc || rawItem.Danh_muc || '',
    Dvt: i18n.vi.Dvt || rawItem.Dvt || '',
    Mo_ta: i18n.vi.Mo_ta || rawItem.Mo_ta || '',
    Is_hidden: isProductHidden(rawItem),
    Top_at: getProductTopAt(rawItem),
    Ncc_loai_giam: normalizeNccDiscountType(rawItem.Ncc_loai_giam),
    Ncc_gia_tri_giam: normalizeNccDiscountValue(rawItem.Ncc_gia_tri_giam),
    i18n: JSON.parse(JSON.stringify(i18n)),
  }
  delete cloned.Lang
  delete cloned._tenVi
  delete cloned._danhMucVi

  activeEditLang.value = selectedLanguage.value || 'vi'
  hasUnsavedChanges.value = false
  edit.value = cloned
  originalEdit.value = JSON.parse(JSON.stringify(cloned))
}

function openEdit(item, options = {}) {
  const { focusField = null } = options
  prepareEditState(item)
  isDiscountMode.value = false
  
  if (isMobile.value) {
    showSidebar.value = true
  } else {
    showModal.value = true
  }

  statusOptionsVisible.value = isMobile.value && focusField === 'Trang_thai'

  focusFieldInput(focusField)
}

function focusFieldInput(field) {
  if (!field) return

  const attemptLimit = 6
  let attempts = 0

  const tryFocus = () => {
    const containerSelector = isMobile.value ? '.sidebar-panel' : '.modal-container'
    const selector = `[data-field="${field}"]`
    let target = null

    if (field === 'Trang_thai') {
      target = isMobile.value ? statusSelect.value : statusSelectModal.value
    } else {
      target = document.querySelector(`${containerSelector} ${selector}`)
    }

    if (!target) return false

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.focus()
    if (typeof target.select === 'function') {
      target.select()
    }

    if (field === 'Trang_thai' && isMobile.value) {
      setTimeout(() => openSelectDropdown(target), 320)
    }

    return true
  }

  const scheduleAttempt = (delay = 0) => {
    setTimeout(() => {
      attempts += 1
      const focused = tryFocus()
      if (!focused && attempts < attemptLimit && isMobile.value) {
        scheduleAttempt(120)
      }
    }, delay)
  }

  nextTick(() => scheduleAttempt(0))
}

function openSelectDropdown(el) {
  if (!el) return
  requestAnimationFrame(() => {
    el.focus()
    el.click()
    setTimeout(() => {
      try {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }))
      } catch (err) {
        el.click()
      }
    }, 30)
  })
}

function openDiscount(item) {
  prepareEditState(item)
  isDiscountMode.value = true
  
  if (isMobile.value) {
    showSidebar.value = true
  } else {
    showModal.value = true
  }
  
  focusFieldInput('Gia_Giam')
}

function attemptCloseModal() {
  if (hasUnsavedChanges.value) {
    confirmData.value = {
      title: '⚠️ Chưa lưu thay đổi',
      message: 'Bạn có thay đổi chưa được lưu. Vui lòng nhấn nút "Lưu" để lưu thay đổi hoặc "Hủy" để bỏ qua.',
      confirmText: 'Đóng lại',
      action: () => {
        closeModal()
      }
    }
  } else {
    closeModal()
  }
}

function attemptCloseSidebar() {
  if (hasUnsavedChanges.value) {
    confirmData.value = {
      title: '⚠️ Chưa lưu thay đổi',
      message: 'Bạn có thay đổi chưa được lưu. Vui lòng nhấn nút "Lưu" để lưu thay đổi hoặc "Hủy" để bỏ qua.',
      confirmText: 'Đóng lại',
      action: () => {
        closeSidebar()
      }
    }
  } else {
    closeSidebar()
  }
}

function closeModal() {
  showModal.value = false
  isDiscountMode.value = false
  statusOptionsVisible.value = false
  previewImageUrl.value = ''
  resetEditTracking()
}

function closeSidebar() {
  showSidebar.value = false
  isDiscountMode.value = false
  resetEditTracking()
  statusOptionsVisible.value = false
  previewImageUrl.value = ''
}

async function updateProductTopAt(item, nextTopAt, successMsg, failMsg) {
  if (!item?.Ma_hang) return
  const rawItem = list.value.find((r) => r.Ma_hang === item.Ma_hang)
  const prevTopAt = getProductTopAt(rawItem || item)

  if (rawItem) rawItem.Top_at = nextTopAt
  item.Top_at = nextTopAt

  try {
    const res = await dispatchAction({
      action: 'updateHangHoa',
      data: {
        Ma_hang: item.Ma_hang,
        Top_at: nextTopAt,
      },
    })
    if (!res.success) throw new Error(res.message || failMsg)
    showAlert(successMsg, 'success')
  } catch (err) {
    console.error(err)
    if (rawItem) rawItem.Top_at = prevTopAt
    item.Top_at = prevTopAt
    showAlert(failMsg, 'error')
  }
}

async function pushProductToTop(item) {
  if (!item?.Ma_hang) return
  await updateProductTopAt(
    item,
    getNextTopTimestamp(),
    `Đã đẩy "${item.Ten_hang}" lên Top #1`,
    'Đẩy mặt hàng lên top thất bại',
  )
}

async function unpinProductFromTop(item) {
  if (!item?.Ma_hang) return
  await updateProductTopAt(
    item,
    0,
    `Đã gỡ "${item.Ten_hang}" khỏi vị trí Top`,
    'Bỏ ghim top thất bại',
  )
}

async function toggleHideProduct(item) {
  if (!item?.Ma_hang) return
  const rawItem = list.value.find((r) => r.Ma_hang === item.Ma_hang)
  const prevHidden = isProductHidden(rawItem || item)
  const nextHidden = !prevHidden

  if (rawItem) rawItem.Is_hidden = nextHidden
  item.Is_hidden = nextHidden

  try {
    const res = await dispatchAction({
      action: 'updateHangHoa',
      data: {
        Ma_hang: item.Ma_hang,
        Is_hidden: nextHidden,
      },
    })
    if (!res.success) throw new Error(res.message || 'Không thể cập nhật hiển thị')
    showAlert(
      nextHidden
        ? `Đã ẩn "${item.Ten_hang}" khỏi Menu Online`
        : `Đã hiện lại "${item.Ten_hang}" trên Menu Online`,
      'success',
    )
  } catch (err) {
    console.error(err)
    if (rawItem) rawItem.Is_hidden = prevHidden
    item.Is_hidden = prevHidden
    showAlert('Cập nhật ẩn/hiện thất bại', 'error')
  }
}

async function quickToggleStatus(item) {
  if (!item?.Ma_hang) return
  const rawItem = list.value.find((r) => r.Ma_hang === item.Ma_hang)
  const prevStatus = String((rawItem || item).Trang_thai || 'Còn hàng')
  const nextStatus = prevStatus === 'Hết hàng' ? 'Còn hàng' : 'Hết hàng'

  if (rawItem) rawItem.Trang_thai = nextStatus
  item.Trang_thai = nextStatus

  try {
    const res = await dispatchAction({
      action: 'updateHangHoa',
      data: {
        Ma_hang: item.Ma_hang,
        Trang_thai: nextStatus,
      },
    })
    if (!res.success) throw new Error(res.message || 'Không thể đổi trạng thái')
    showAlert(`Đã đổi "${item.Ten_hang}" → ${nextStatus}`, 'success')
  } catch (err) {
    console.error(err)
    if (rawItem) rawItem.Trang_thai = prevStatus
    item.Trang_thai = prevStatus
    showAlert('Đổi trạng thái thất bại', 'error')
  }
}

async function saveEdit() {
  if (saving.value) return

  saving.value = true
  try {
    const payload = syncProductWithI18n(edit.value)
    const res = await dispatchAction({
      action: 'updateHangHoa',
      data: payload,
    })
    if (!res.success) {
      throw new Error(res.message || 'Cập nhật thất bại')
    }

    showAlert('Cập nhật thành công', 'success')
    resetEditTracking()

    closeModal()
    closeSidebar()

    await loadData()
  } catch (error) {
    console.error('Save error:', error)
    showAlert('Cập nhật thất bại', 'error')
  } finally {
    saving.value = false
  }
}


function deleteHang() {
  confirmData.value = {
    title: 'Xác nhận xóa',
    message: `Bạn có chắc chắn muốn xóa sản phẩm "${edit.value.Ten_hang}"?`,
    confirmText: 'Xóa',
    loadingText: 'Đang xóa...',
    action: async () => {
      try {
        const res = await dispatchAction({
          action: 'deleteHangHoa',
          Ma_hang: edit.value.Ma_hang,
        })
        if (!res.success) {
          throw new Error(res.message || 'Xóa thất bại')
        }

        showAlert('Đã xóa sản phẩm', 'success')
        resetEditTracking()
        closeModal()
        closeSidebar()
        await loadData()
      } catch (error) {
        console.error('Delete error:', error)
        showAlert('Xóa thất bại', 'error')
      }
    }
  }
}


function confirmDelete(item) {
  confirmData.value = {
    title: 'Xác nhận xóa',
    message: `Bạn có chắc chắn muốn xóa sản phẩm "${item.Ten_hang}"?`,
    confirmText: 'Xóa',
    loadingText: 'Đang xóa...',
    action: async () => {
      try {
        const res = await dispatchAction({
          action: 'deleteHangHoa',
          Ma_hang: item.Ma_hang,
        })
        if (!res.success) {
          throw new Error(res.message || 'Xóa thất bại')
        }

        showAlert('Đã xóa sản phẩm', 'success')
        await loadData()
      } catch (error) {
        console.error('Delete error:', error)
        showAlert('Xóa thất bại', 'error')
      }
    }
  }
}


async function confirmAction() {
  if (confirmBusy.value) return
  if (!confirmData.value?.action) {
    confirmData.value = null
    return
  }

  confirmBusy.value = true
  try {
    await confirmData.value.action()
  } finally {
    confirmBusy.value = false
    confirmData.value = null
  }
}

/* ===== BULK EDIT / DELETE ACTIONS ===== */
function clearSelection() {
  selected.value = []
}

function openBulkEditModal() {
  if (!selected.value.length) {
    showAlert('Vui lòng tick chọn ít nhất 1 sản phẩm', 'error')
    return
  }
  bulkForm.value = createDefaultBulkForm()
  showBulkEditModal.value = true
}

function closeBulkEditModal() {
  if (bulkSaving.value) return
  showBulkEditModal.value = false
}

async function saveBulkEdit() {
  if (bulkSaving.value || !hasAnyBulkFieldEnabled.value) return
  const maHangs = selectedProducts.value.map((p) => p.Ma_hang).filter(Boolean)
  if (!maHangs.length) return

  const f = bulkForm.value
  const patch = {
    lang: selectedLanguage.value || 'vi',
  }
  if (f.enableDanhMuc) patch.Danh_muc = String(f.Danh_muc || '').trim()
  if (f.enableSize) patch.Size = String(f.Size || '').trim()
  if (f.enableDvt) patch.Dvt = String(f.Dvt || '').trim()
  if (f.enableDonViTienTe) patch.Don_vi_tien_te = String(f.Don_vi_tien_te || '').trim() || 'P'
  if (f.enableTrangThai) patch.Trang_thai = f.Trang_thai === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng'
  if (f.enableHidden) patch.Is_hidden = Boolean(f.Is_hidden)
  if (f.enableTop) patch.Top_action = f.topAction === 'unpin' ? 'unpin' : 'pin'
  if (f.enableNccDiscount) {
    patch.Ncc_discount = {
      Ncc_loai_giam: normalizeNccDiscountType(f.Ncc_loai_giam),
      Ncc_gia_tri_giam: normalizeNccDiscountValue(f.Ncc_gia_tri_giam),
    }
  }
  if (f.enableGiaGoc) {
    patch.Gia_goc = { mode: f.giaGocMode, value: Number(f.giaGocValue || 0) }
  }
  if (f.enableGiaBan) {
    patch.Gia_ban = { mode: f.giaBanMode, value: Number(f.giaBanValue || 0) }
  }
  if (f.enableGiaGiam) {
    patch.Gia_Giam = { mode: f.giaGiamMode, value: Number(f.giaGiamValue || 0) }
  }

  bulkSaving.value = true
  try {
    const res = await dispatchAction({
      action: 'bulkUpdateHangHoa',
      maHangs,
      patch,
    })
    if (!res?.success) throw new Error(res?.message || 'Cập nhật hàng loạt thất bại')
    showAlert(`Đã cập nhật ${res.updated || maHangs.length} sản phẩm`, 'success')
    showBulkEditModal.value = false
    selected.value = []
    await loadData()
  } catch (err) {
    console.error('Bulk update error:', err)
    showAlert('Cập nhật hàng loạt thất bại', 'error')
  } finally {
    bulkSaving.value = false
  }
}

function bulkDeleteFromModal() {
  const maHangs = selectedProducts.value.map((p) => p.Ma_hang).filter(Boolean)
  if (!maHangs.length) return

  confirmData.value = {
    title: 'Xác nhận xóa hàng loạt',
    message: `Bạn có chắc chắn muốn xóa ${maHangs.length} sản phẩm đã chọn khỏi kho hàng? Hành động này không thể hoàn tác.`,
    confirmText: `Xóa ${maHangs.length} sản phẩm`,
    loadingText: 'Đang xóa hàng loạt...',
    action: async () => {
      try {
        const res = await dispatchAction({
          action: 'bulkDeleteHangHoa',
          maHangs,
        })
        if (!res?.success) throw new Error(res?.message || 'Xóa hàng loạt thất bại')
        showAlert(`Đã xóa ${res.deleted || maHangs.length} sản phẩm`, 'success')
        showBulkEditModal.value = false
        selected.value = []
        await loadData()
      } catch (err) {
        console.error('Bulk delete error:', err)
        showAlert('Xóa hàng loạt thất bại', 'error')
      }
    },
  }
}


function showAlert(message, type = 'info') {
  alertMessage.value = message
  alertType.value = type
  setTimeout(() => {
    alertMessage.value = ''
  }, 3000)
}

function formatNumber(num) {
  if (!num && num !== 0) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function fmtMoney(val) {
  const n = Number(val || 0)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}


function parseMoney(str) {
  const digits = (str || '').toString().replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function onMoneyInput(e, key) {
  const el = e.target
  const raw = el.value
  const caret = el.selectionStart || 0

  // số lượng chữ số ở bên trái caret (để giữ vị trí sau khi format)
  const digitsLeft = raw.slice(0, caret).replace(/[^\d]/g, '').length

  // parse -> lưu number vào edit
  const num = parseMoney(raw)
  edit.value[key] = num
  markAsEdited()

  // format lại để hiển thị
  const formatted = fmtMoney(num)
  el.value = formatted

  // đặt lại caret đúng vị trí tương ứng
  let pos = 0, seen = 0
  while (pos < formatted.length && seen < digitsLeft) {
    if (/\d/.test(formatted[pos])) seen++
    pos++
  }
  requestAnimationFrame(() => el.setSelectionRange(pos, pos))
}

</script>
<style scoped>
/* ===== RESET & BASE ===== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.page {
  min-height: 100vh;
  background: rgb(15, 23, 42);
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ===== PAGE HEADER ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.5px;
}

.page-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #60a5fa;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== FILTER SECTION ===== */
.filter-section {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative; /* Ensure z-index works */
  z-index: 50; /* Higher than table header */
}

.filter-section.sticky {
  position: sticky;
  top: 16px;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.search-container {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 48px;
  padding: 0 48px;
  background: rgba(15, 23, 42, 0.6);
  border: 2px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  font-size: 15px;
  color: #f8fafc;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: #64748b;
}

.search-input:focus {
  outline: none;
  background: rgba(15, 23, 42, 0.8);
  border-color: #39ff14;
  box-shadow: 0 0 0 4px rgba(57, 255, 20, 0.18);
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: rgba(148, 163, 184, 0.2);
  border: none;
  border-radius: 50%;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 1;
}

.search-clear:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* ===== FILTER BUTTONS ===== */
.filter-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.btn-filter {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: rgba(57, 255, 20, 0.08);
  border: 1px solid rgba(57, 255, 20, 0.28);
  border-radius: 10px;
  color: #c7f9d6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  width: 100%; /* Ensure equal width in grid */
}

.btn-filter:hover {
  background: rgba(57, 255, 20, 0.16);
  border-color: #39ff14;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(57, 255, 20, 0.15);
}

.btn-filter.active {
  background: #39ff14;
  border-color: #39ff14;
  color: #0f172a;
  box-shadow: 0 8px 20px rgba(57, 255, 20, 0.25);
}

.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  border: 2px solid rgb(15, 23, 42);
}

.btn-clear-filters {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear-filters:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  transform: translateY(-2px);
}

/* ===== CATEGORY DROPDOWN ===== */
.category-dropdown {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.category-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: rgba(51, 65, 85, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
}

.category-item.active {
  background: rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
  color: #93c5fd;
}

.category-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 11px;
  color: #64748b;
  background: rgba(15, 23, 42, 0.5);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.category-item.active .category-count {
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.2);
}

.export-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.btn-export {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(57, 255, 20, 0.08);
  border: 1px solid rgba(57, 255, 20, 0.28);
  border-radius: 10px;
  color: #c7f9d6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: rgba(57, 255, 20, 0.16);
  border-color: #39ff14;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(57, 255, 20, 0.15);
}

.btn-export .btn-icon {
  font-size: 18px;
}

/* ===== CONTENT SECTION ===== */
.content-section {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.desktop-view {
  display: block;
}

.mobile-view {
  display: none;
}

/* ===== TABLE ===== */
.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 12px;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.data-table thead th {
  position: sticky;
  top: 0;
  padding: 14px 12px;
  background: rgba(15, 23, 42, 0.95);
  color: #ffffff;
  font-weight: 600;
  text-align: center;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  white-space: nowrap;
  z-index: 10;
}

.data-table tbody td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  color: #e2e8f0;
}

.table-row {
  cursor: pointer;
  transition: all 0.2s;
}

.table-row:hover {
  background: rgba(59, 130, 246, 0.08);
}

.product-image-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumbnail {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(148, 163, 184, 0.1);
}

.product-thumbnail-empty {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 8px;
  font-size: 24px;
}

.supplementary-images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  justify-content: center;
}

.data-table .supplementary-images {
  grid-template-columns: repeat(3, 36px);
}

.supplementary-image-slot {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(30, 41, 59, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.data-table .supplementary-image-slot {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.supplementary-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.supplementary-thumb-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(148, 163, 184, 0.8);
  font-size: 18px;
}

.data-table .supplementary-thumb-empty {
  font-size: 20px;
}
.supplementary-images-group {
  margin-top: 16px;
}
.supplementary-image-slot:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 4px;
}
.supplementary-image-slot:hover {
  transform: translateY(-1px);
}
.supplementary-upload-input {
  display: none;
}

.supplementary-image-slot.is-loading {
  pointer-events: none;
}

.supplementary-loading {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  z-index: 4;
  backdrop-filter: blur(2px);
}

.supplementary-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.supplementary-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.4);
  background: rgba(15, 23, 42, 0.75);
  color: #fffbfb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  transition: all 0.18s ease;
  z-index: 5;
}

.supplementary-delete-btn:hover {
  transform: translateY(-1px) scale(1.05);
  background: rgba(239, 68, 68, 0.85);
  border-color: rgba(239, 68, 68, 0.9);
}

.modal-container .form-row-image {
  grid-template-columns: 260px 1fr 1fr;
}

.modal-container .main-image-group .image-preview-container {
  max-width: 260px;
}

.modal-container .supplementary-images {
  max-width: 100%;
  gap: 12px;
}

.modal-container .supplementary-image-slot {
  min-height: 96px;
}

.product-name-cell {
  font-weight: 500;
  color: #f8fafc;
}

.text-center {
  text-align: center;
}

.text-mono {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #94a3b8;
}

.text-number {
  font-variant-numeric: tabular-nums;
}

.text-bold {
  font-weight: 600;
  color: #f8fafc;
}
.price-main {
  font-weight: 700;
  color: #22c55e;
}
.data-table .price-main {
  color: #22c55e !important;
}

.text-muted {
  color: #64748b;
}

.text-truncate {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-sale {
  color: #f87171;
  font-weight: 600;
}

/* ===== BADGES ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-currency {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-lang {
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

/* ===== ACTION BUTTONS ===== */
.btn-action-discount {
  padding: 8px 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #c27a00, #f1a208);
  border: 1px solid rgba(241, 162, 8, 0.65);
  border-radius: 10px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 6px 12px rgba(241, 162, 8, 0.25);
}

.btn-action-discount:hover {
  background: linear-gradient(135deg, #f1a208, #c27a00);
  border-color: #f1a208;
  transform: translateY(-1px);
}

.table-actions-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.btn-action-top,
.btn-action-untop {
  padding: 8px 11px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-action-top {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border: 1px solid rgba(96, 165, 250, 0.7);
  color: #ffffff;
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.22);
}

.btn-action-top:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  transform: translateY(-1px);
}

.btn-action-untop {
  background: rgba(245, 158, 11, 0.16);
  border: 1px solid rgba(251, 191, 36, 0.55);
  color: #fde68a;
}

.btn-action-untop:hover {
  background: rgba(245, 158, 11, 0.28);
  color: #ffffff;
  transform: translateY(-1px);
}

.btn-action-hide {
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(100, 116, 139, 0.25);
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-hide:hover {
  background: rgba(100, 116, 139, 0.42);
  color: #ffffff;
  transform: translateY(-1px);
}

.btn-action-hide.is-hidden {
  background: rgba(16, 185, 129, 0.22);
  border-color: rgba(52, 211, 153, 0.65);
  color: #6ee7b7;
}

.status-cell-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.badge-top-pill {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.26), rgba(217, 119, 6, 0.26));
  color: #fde68a;
  border: 1px solid rgba(251, 191, 36, 0.65);
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.table-row.is-product-top {
  background: rgba(245, 158, 11, 0.055);
}

.product-card.is-product-top {
  border-color: rgba(251, 191, 36, 0.45);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.08);
}

.badge-hidden-pill {
  background: rgba(100, 116, 139, 0.28);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.45);
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
}

.table-row.is-product-hidden {
  opacity: 0.68;
}

.text-hidden {
  color: #94a3b8;
}

.hide-toggle-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
}

.hide-toggle-row input {
  width: 16px;
  height: 16px;
  accent-color: #10b981;
}

.top-modal-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.top-toggle-row {
  margin-top: 0;
}

.top-toggle-row input {
  accent-color: #f59e0b;
}

.btn-bump-top-inline {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.65);
  background: rgba(37, 99, 235, 0.24);
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-bump-top-inline:hover {
  background: rgba(37, 99, 235, 0.42);
  color: #ffffff;
}

.card-action-btn.btn-top {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border: 1px solid rgba(96, 165, 250, 0.65);
  color: #ffffff;
}

.card-action-btn.btn-untop {
  background: rgba(245, 158, 11, 0.22);
  border: 1px solid rgba(251, 191, 36, 0.6);
  color: #fde68a;
}

.bulk-seg-btn.is-top.active {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: rgba(96, 165, 250, 0.75);
  color: #ffffff;
}

.card-action-btn.btn-hide {
  background: rgba(100, 116, 139, 0.25);
  border-color: rgba(148, 163, 184, 0.4);
  color: #e2e8f0;
}

.card-action-btn.btn-hide.is-hidden {
  background: rgba(16, 185, 129, 0.22);
  border-color: rgba(52, 211, 153, 0.65);
  color: #6ee7b7;
}

.ncc-kho-tag {
  margin-top: 3px;
  display: inline-block;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.18);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.ncc-edit-block {
  margin-top: 10px;
}

.ncc-disc-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.ncc-type-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.25);
  gap: 3px;
  flex-shrink: 0;
}

.ncc-type-btn {
  padding: 6px 10px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.ncc-type-btn.active {
  background: rgba(16, 185, 129, 0.24);
  color: #6ee7b7;
}

.ncc-val-input {
  flex: 1;
  min-width: 90px;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

/* ===== PAGINATION ===== */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-info {
  color: #94a3b8;
  font-size: 14px;
}

.pagination-info strong {
  color: #f8fafc;
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.pagination-btn {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(57, 255, 20, 0.08);
  border: 1px solid rgba(57, 255, 20, 0.28);
  border-radius: 8px;
  color: #c7f9d6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(57, 255, 20, 0.16);
  border-color: #39ff14;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(57, 255, 20, 0.18);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-btn.active {
  background: #39ff14;
  border-color: #39ff14;
  color: #0f172a;
  box-shadow: 0 8px 22px rgba(57, 255, 20, 0.28);
}
.scroll-top-btn {
  position: fixed;
  right: 22px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: 2px solid #39ff14;
  background: rgba(57, 255, 20, 0.12);
  color: #39ff14;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35), 0 0 18px rgba(57, 255, 20, 0.28);
  backdrop-filter: blur(12px);
  transition: all 0.2s;
  z-index: 999;
  opacity: 0.92;
}

.scroll-top-btn:hover {
  background: #39ff14;
  color: #0f172a;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(57, 255, 20, 0.35);
}

.scroll-top-btn:active {
  transform: translateY(0);
  box-shadow: 0 8px 18px rgba(57, 255, 20, 0.3);
}

.scroll-top-btn--raised {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
}

@media (max-width: 768px) {
  .scroll-top-btn {
    right: 16px;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 86px);
  }

  .scroll-top-btn--raised {
    bottom: calc(env(safe-area-inset-bottom, 0px) + 140px);
  }
}

.pagination-arrow {
  min-width: 36px;
}

.pagination-ellipsis {
  padding: 0 8px;
  color: #64748b;
  font-size: 14px;
  user-select: none;
}

/* ===== MOBILE CARDS ===== */
.cards-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.product-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.85));
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.28);
}

.product-card:hover {
  border-color: rgba(59, 130, 246, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.32);
}

.card-row {
  padding: 12px 14px 10px;
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.card-image-wrapper {
  flex-shrink: 0;
  width: 78px;
  height: 78px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(51, 65, 85, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.card-image-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.55);
  color: #cbd5e1;
  font-size: 24px;
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-header-inline {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.card-header-inline .checkbox {
  margin-left: auto;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.card-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card-code {
  font-size: 11px;
  color: #64748b;
  font-family: 'Monaco', 'Courier New', monospace;
}
.card-price-block {
  padding: 8px 10px;
  background: rgba(15, 23, 42, 0.35);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  margin-top: 2px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.price-row:last-of-type {
  margin-bottom: 6px;
}

.price-label {
  font-size: 12px;
  color: #ece8e8;
}

.price-value {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.price-value.primary {
  color: #22c55e;
}

.price-value.sale {
  color: #f87171;
}
.price-value.lang {
  color: #3b82f6;
}
.price-value.primary {
  color: #22c55e;
}

.price-value.sale {
  color: #f87171;
}

.price-value.lang {
  color: #3b82f6;
}

/* ✅ THÊM DÒNG NÀY */
.price-value.stock {
  color: #fbbf24;
  font-weight: 700;
}

.stock-cell {
  font-weight: 600;
}

.stock-value {
  color: #fbbf24;
  font-weight: 700;
}
.price-badges {
  display: flex;
  gap: 6px;
}
.price-badges.compact {
  margin-top: 6px;
}

.card-actions {
  padding: 10px 12px 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 6px;
  justify-items: stretch;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  background: linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.8));
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.card-action-btn {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 6px 12px rgba(0,0,0,0.18);
}

.card-action-btn.btn-delete {
  grid-column: 1 / -1;
}

.btn-edit {
  background: linear-gradient(135deg, #0f9a52, #16c172);
  color: #ffffff;
  border: 1px solid rgba(22, 193, 114, 0.7);
  box-shadow: 0 6px 12px rgba(22, 193, 114, 0.25);
}

.btn-edit:hover {
  background: linear-gradient(135deg, #16c172, #0f9a52);
  transform: translateY(-1px);
}

.btn-status {
  background: linear-gradient(135deg, #0ea5e9, #38bdf8);
  color: #ffffff;
  border: 1px solid rgba(56, 189, 248, 0.65);
  box-shadow: 0 6px 12px rgba(56, 189, 248, 0.24);
}

.btn-status:hover {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  transform: translateY(-1px);
}

.btn-discount {
  background: linear-gradient(135deg, #c27a00, #f1a208);
  color: #ffffff;
  border: 1px solid rgba(241, 162, 8, 0.65);
  box-shadow: 0 6px 12px rgba(241, 162, 8, 0.22);
}

.btn-discount:hover {
  background: linear-gradient(135deg, #f1a208, #c27a00);
  transform: translateY(-1px);
}

.btn-delete {
  background: linear-gradient(135deg, #b63232, #e24b4b);
  color: #ffffff;
  border: 1px solid rgba(226, 75, 75, 0.7);
  box-shadow: 0 6px 12px rgba(226, 75, 75, 0.24);
}

.btn-delete:hover {
  background: linear-gradient(135deg, #e24b4b, #b63232);
  transform: translateY(-1px);
}

.card-action-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 10px rgba(0,0,0,0.18);
}
/* ===== MOBILE SIDEBAR ===== */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.sidebar-panel {
  width: 100%;
  max-width: 100%;
  height: 100%;
  background: rgb(15, 23, 42);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
}

.sidebar-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(30, 41, 59, 0.8);
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
}

.btn-close-sidebar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.5);
  border: none;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-sidebar:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(30, 41, 59, 0.8);
  display: flex;
  gap: 12px;
}

/* ===== FORM ===== */
.edit-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  gap: 12px;
}

.form-row-2 {
  grid-template-columns: repeat(2, 1fr);
}

.form-row-4 {
  grid-template-columns: repeat(2, 1fr);
}
.form-row-4 {
  grid-template-columns: repeat(2, 1fr);
}

/* ✅ THÊM DÒNG NÀY */
.form-row-5 {
  grid-template-columns: repeat(2, 1fr);
}

/* Mobile: 1 cột */
@media (max-width: 768px) {
  .form-row-4,
  .form-row-5 {
    grid-template-columns: 1fr;
  }
}
.modal-body-grid {
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  gap: 28px;
  align-items: flex-start;
}

.modal-image-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-details-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.modal-section-card {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.45);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-section-card--tight {
  padding: 14px;
}

.modal-section-card--wide {
  width: 100%;
}

.modal-section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  color: #94e2ff;
  margin-bottom: 6px;
}

.modal-section-grid {
  display: grid;
  gap: 12px;
}

.modal-section-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.modal-section-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.modal-image-column .image-upload-area {
  flex-direction: column;
}

.modal-section-card .form-label {
  font-size: 11px;
  letter-spacing: 0.4px;
}

.modal-section-card.modal-section-card--tight .supplementary-images {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.modal-section-card.modal-section-card--tight .supplementary-image-slot {
  min-height: 96px;
  border-radius: 14px;
}

.modal-section-card.modal-section-card--tight .supplementary-thumb,
.modal-section-card.modal-section-card--tight .supplementary-thumb-empty {
  border-radius: 12px;
}

.modal-supplementary-grid .supplementary-delete-btn {
  position: absolute;
}

.modal-supplementary-grid .supplementary-image-slot.is-loading .supplementary-delete-btn {
  opacity: 0;
}

.form-row-image {
  grid-template-columns: 160px 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  height: 44px;
  padding: 0 14px;
  background: rgba(51, 65, 85, 0.3);
  border: 2px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 14px;
  transition: all 0.2s;
}

.form-control::placeholder {
  color: #475569;
}

.form-control:focus {
  outline: none;
  background: rgba(51, 65, 85, 0.5);
  border-color: #39ff14;
  box-shadow: 0 0 0 4px rgba(57, 255, 20, 0.18);
}

.form-control:disabled {
  background: rgba(30, 41, 59, 0.5);
  opacity: 0.6;
  cursor: not-allowed;
}

.form-control-highlight {
  background: rgba(57, 255, 20, 0.12);
  border-color: #39ff14;
  box-shadow: 0 0 0 4px rgba(57, 255, 20, 0.18);
}

.mobile-status-options {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.status-option-btn {
  flex: 1;
  height: 40px;
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-option-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

.status-option-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.form-textarea {
  height: auto;
  padding: 12px 14px;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

/* ===== IMAGE UPLOAD ===== */
.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(30, 41, 59, 0.5);
  border: 2px dashed rgba(148, 163, 184, 0.2);
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.image-preview-clickable {
  cursor: zoom-in;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.8);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
}

.image-preview-modal {
  position: relative;
  max-width: min(920px, 92vw);
  max-height: min(680px, 88vh);
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-large {
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
  border-radius: 12px;
}

.image-preview-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.75);
  color: #e2e8f0;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-preview-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: rotate(90deg);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
}

.empty-text {
  font-size: 12px;
  color: #64748b;
}

.btn-upload-image {
  height: 44px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  color: #93c5fd;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upload-image:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
}

.btn-upload-image:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== SIDEBAR BUTTONS ===== */
.btn-sidebar {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sidebar.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-sidebar.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.btn-sidebar.btn-secondary {
  background: rgba(71, 85, 105, 0.5);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn-sidebar.btn-secondary:hover {
  background: rgba(71, 85, 105, 0.7);
}

.btn-sidebar.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-sidebar.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
}

/* ===== DESKTOP MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-container {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: rgb(15, 23, 42);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', system-ui, -apple-system, sans-serif;
}

.modal-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(30, 41, 59, 0.8);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #f8fafc;
}

.btn-close-modal {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.5);
  border: none;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-modal:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(30, 41, 59, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer-right {
  display: flex;
  gap: 12px;
}

.btn-modal {
  height: 44px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-modal.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-modal.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.btn-modal.btn-secondary {
  background: rgba(71, 85, 105, 0.5);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn-modal.btn-secondary:hover {
  background: rgba(71, 85, 105, 0.7);
}

.btn-modal.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-modal.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
}

/* ===== NOTIFICATIONS ===== */
.notification-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.notification-box {
  min-width: 320px;
  max-width: 400px;
  background: rgb(30, 41, 59);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.notification-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.notification-content {
  margin-bottom: 20px;
}

.notification-message {
  font-size: 16px;
  color: #e2e8f0;
  line-height: 1.5;
}

.btn-notification-close {
  width: 100%;
  height: 44px;
  background: #3b82f6;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-notification-close:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.notification-success {
  border-color: rgba(34, 197, 94, 0.3);
}

.notification-error {
  border-color: rgba(239, 68, 68, 0.3);
}

/* ===== CONFIRM MODAL ===== */
.confirm-box {
  min-width: 360px;
  max-width: 440px;
  background: rgb(30, 41, 59);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.confirm-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.confirm-content {
  margin-bottom: 24px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 15px;
  color: #cbd5e1;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.btn-confirm {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm.btn-secondary {
  background: rgba(71, 85, 105, 0.5);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn-confirm.btn-secondary:hover {
  background: rgba(71, 85, 105, 0.7);
}

.btn-confirm.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-confirm.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
}

/* ===== ANIMATIONS ===== */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .desktop-view {
    display: none;
  }

  .mobile-view {
    display: block;
  }

  .page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-stats {
    width: 100%;
    justify-content: space-between;
  }

  .export-actions {
    grid-template-columns: 1fr;
  }

  .cards-container {
    grid-template-columns: 1fr;
  }

  .mobile-pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .form-row-4 {
    grid-template-columns: 1fr;
  }

  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

@media (max-width: 960px) {
  .modal-body-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .modal-image-column {
    width: 100%;
  }

  .modal-details-grid {
    grid-template-columns: 1fr;
  }

  .modal-section-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .form-row-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row-image {
    grid-template-columns: 1fr;
  }
}

/* ===== SCROLLBAR STYLING ===== */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
/* ===== MOBILE STICKY SEARCH ===== */
.mobile-sticky-search {
  display: none;
}

@media (max-width: 768px) {
  .mobile-sticky-search {
    display: block;
    position: sticky;
    top: calc(env(safe-area-inset-top) + 10px);
    z-index: 150;
    margin-bottom: 12px;
  }

  .mobile-sticky-search-inner {
    background: rgba(30, 41, 59, 0.78);
    backdrop-filter: blur(18px);
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 16px;
    padding: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  /* Ẩn search cũ trong filter-section */
  .filter-section .search-container {
    display: none;
  }
}
/* ===== SIDEBAR HEADER SAVE INLINE ===== */
.sidebar-header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sidebar-subtitle {
  font-size: 12px;
  font-weight: 800;
  color: #93c5fd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 58vw;
  opacity: 0.95;
}

.sidebar-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-save-inline {
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 10px;
  background: #3b82f6;
  color: #fff;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.25);
}

.btn-save-inline:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-save-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
/* ===== LOADING SPINNER FOR SAVE BUTTONS ===== */
.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: btnSpin 0.8s linear infinite;
}

@keyframes btnSpin {
  to { transform: rotate(360deg); }
}

.is-loading {
  opacity: 0.9;
}

.is-loading:disabled {
  cursor: not-allowed;
}
/* ===== 6 BUTTONS: 3x2 GRID ===== */
.action-grid-8 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.action-grid-8 .btn-filter,
.action-grid-8 .btn-export {
  width: 100%;
  height: 44px;
  justify-content: center;
  padding: 0 12px;
}

.action-grid-8 .btn-icon {
  font-size: 16px;
}
.action-grid-8 .btn-text {
  font-size: 13px;
  font-weight: 600;
}
/* Xóa bộ lọc nằm riêng, canh phải */
.clear-filter-row {
  display: flex;
  justify-content: flex-end;
}

/* MOBILE: vẫn 3 cột x 2 hàng (nếu muốn) */
@media (max-width: 768px) {
  .action-grid-8 {
    gap: 10px;
  }

  .action-grid-8 .btn-filter,
  .action-grid-8 .btn-export {
    height: 42px;
    padding: 0 10px;
  }

  .action-grid-8 .btn-text {
    font-size: 12px;
  }
}

/* Nếu màn hình quá nhỏ bị chật -> bật cái này để chuyển 2 cột (OPTIONAL)
@media (max-width: 380px) {
  .action-grid-6 { grid-template-columns: repeat(2, 1fr); }
}
*/
/* DESKTOP: đưa pagination-controls ra giữa */
@media (min-width: 769px) {
  .pagination-wrapper {
    display: grid;
    grid-template-columns: 1fr auto 1fr; /* trái | giữa | phải */
    align-items: center;
    gap: 16px;
  }

  .pagination-info {
    justify-self: start; /* nằm trái */
  }

  .pagination-controls {
    justify-self: center; /* nằm giữa */
  }
}
/* ===== TABLE LOADING ===== */
.table-loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.table-loading-spinner {
  width: 56px;
  height: 56px;
  border: 4px solid rgba(59, 130, 246, 0.15);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.table-loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #94a3b8;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.ri-search-line{
  color: white;
}
  /* ===== NEW FILTER GRID CSS ===== */
.filter-grid-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.f-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* Mobile: Stack rows or keep grid? User asked for layout. 
   On mobile, 3 items per row might be tight but doable with smaller font.
   Let's keep it responsive. */
@media (max-width: 600px) {
  .f-row {
    gap: 8px;
  }
}

/* Dropdown Wrapper */
.dropdown-wrapper {
  position: relative;
}

.btn-dropdown {
  justify-content: space-between;
  padding-right: 12px;
}

.arrow-icon {
  margin-left: auto;
  font-size: 16px;
  color: #64748b;
  transition: transform 0.2s;
}

.btn-dropdown.menu-open .arrow-icon {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  min-width: 180px; /* Ensure enough width */
  margin-top: 6px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  z-index: 50;
  overflow: hidden;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-menu.right-align {
  left: auto;
  right: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.menu-item:hover {
  background: rgba(148, 163, 184, 0.1);
  color: #fff;
}

.menu-item.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.menu-item i {
  font-size: 16px;
  color: #94a3b8;
}

.menu-item:hover i {
  color: #fff;
}

.text-success { color: #10b981 !important; }
.text-warning { color: #fbbf24 !important; }
.text-danger { color: #ef4444 !important; }

/* Animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ===== 5-LANGUAGE BADGES & EDIT TABS ===== */
.dropdown-flag-img {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
  flex-shrink: 0;
}

.lang-badges-cell {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.lang-mini-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 5px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(51, 65, 85, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.lang-mini-pill.active {
  background: rgba(16, 185, 129, 0.16);
  border-color: rgba(16, 185, 129, 0.45);
  color: #6ee7b7;
}

.lang-tabs-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lang-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.65);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.lang-tab-btn:hover {
  border-color: rgba(16, 185, 129, 0.5);
  color: #ffffff;
}

.lang-tab-btn.active {
  background: rgba(16, 185, 129, 0.18);
  border-color: #10b981;
  color: #6ee7b7;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.22);
}

.lang-tab-flag {
  width: 18px;
  height: 13px;
  object-fit: cover;
  border-radius: 2px;
}

.lang-tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.35);
}

.lang-tab-dot.filled {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
}

.upload-size-hint {
  margin-top: 6px;
  font-size: 11.5px;
  color: #93c5fd;
  line-height: 1.4;
}

.upload-size-hint-inline {
  font-size: 11px;
  font-weight: 500;
  text-transform: none;
  color: #93c5fd;
  margin-left: 4px;
}

/* ===== FLOATING BULK ACTION BAR ===== */
.bulk-floating-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 950;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px 10px 16px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(34, 197, 94, 0.55);
  box-shadow: 0 14px 36px rgba(2, 6, 23, 0.55), 0 0 0 3px rgba(34, 197, 94, 0.14);
}

.bfb-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.bfb-count {
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 999px;
  background: #10b981;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bfb-label {
  font-size: 13.5px;
  font-weight: 700;
  color: #e2e8f0;
}

.bfb-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.bfb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.bfb-btn-clear {
  background: rgba(148, 163, 184, 0.16);
  color: #cbd5e1;
}

.bfb-btn-clear:hover {
  background: rgba(148, 163, 184, 0.28);
  color: #ffffff;
}

.bfb-btn-edit {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.bfb-btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
}

/* ===== BULK EDIT MODAL ===== */
.bulk-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.bulk-modal-card {
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bulk-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(2, 6, 23, 0.55);
}

.bulk-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #86efac;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-modal-sub {
  margin-top: 4px;
  font-size: 12.5px;
  color: #94a3b8;
}

.bulk-modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bulk-preview-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bulk-preview-chip {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(96, 165, 250, 0.35);
  color: #bfdbfe;
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bulk-preview-chip.is-more {
  background: rgba(148, 163, 184, 0.16);
  border-color: rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
}

.bulk-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.bulk-field-card {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.16);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.bulk-field-card.active {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(34, 197, 94, 0.48);
}

.bulk-span-2 {
  grid-column: span 2;
}

.bulk-field-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: #e2e8f0;
  cursor: pointer;
}

.bulk-field-toggle input {
  width: 16px;
  height: 16px;
  accent-color: #10b981;
  cursor: pointer;
}

.bulk-field-card .form-control:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.bulk-seg-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.bulk-seg-group.disabled {
  opacity: 0.45;
}

.bulk-seg-btn {
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.65);
  color: #cbd5e1;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
}

.bulk-seg-btn.active {
  background: rgba(16, 185, 129, 0.22);
  border-color: #10b981;
  color: #6ee7b7;
}

.bulk-seg-btn.is-warn.active {
  background: rgba(100, 116, 139, 0.35);
  border-color: #94a3b8;
  color: #f8fafc;
}

.bulk-price-row {
  display: grid;
  grid-template-columns: 185px minmax(0, 1fr);
  gap: 8px;
}

.bulk-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(2, 6, 23, 0.65);
  flex-wrap: wrap;
}

.bulk-footer-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .bulk-floating-bar {
    bottom: 76px;
    width: calc(100% - 24px);
    max-width: 460px;
    border-radius: 14px;
    padding: 10px 12px;
  }

  .bulk-fields-grid {
    grid-template-columns: 1fr;
  }

  .bulk-span-2 {
    grid-column: span 1;
  }

  .bulk-price-row {
    grid-template-columns: 1fr;
  }

  .bulk-modal-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .bulk-footer-right {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

/* ===== LAZY LOAD FOOTER ===== */
.lazy-load-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.mobile-lazy-footer {
  margin-top: 12px;
  border-top: none;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.btn-lazy-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.45);
  background: rgba(14, 165, 233, 0.16);
  color: #7dd3fc;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-lazy-more:hover {
  background: rgba(14, 165, 233, 0.28);
  color: #e0f2fe;
}

.lazy-done-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
}
</style>



