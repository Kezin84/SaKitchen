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
          <button class="menu-item" @click="selectExport('excel_all')">
            <i class="ri-file-excel-2-fill text-success"></i> Xuất Excel (Toàn bộ kho · 5 ngôn ngữ)
          </button>
          <button class="menu-item" @click="selectExport('excel_current')">
            <i class="ri-file-excel-2-line text-success"></i>
            Xuất Excel ({{ selected.length ? `Đã chọn ${selected.length} món` : `Đang lọc (${ordered.length})` }})
          </button>
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

<!-- Tạo danh mục cha, Link phân loại SP & Xóa bộ lọc -->
<div class="clear-filter-row parent-action-row">
  <button
    type="button"
    class="btn-manage-parents"
    @click="openParentCategoryModal"
  >
    <span class="btn-icon"><i class="ri-folder-add-line"></i></span>
    <span class="btn-text">Tạo danh mục cha</span>
    <span v-if="existingParentEntries.length" class="filter-badge">
      {{ existingParentEntries.length }}
    </span>
  </button>

  <button
    type="button"
    class="btn-manage-product-groups"
    @click="openProductGroupModal"
  >
    <span class="btn-icon"><i class="ri-links-line"></i></span>
    <span class="btn-text">Link phân loại SP</span>
    <span v-if="productGroupsList.length" class="filter-badge">
      {{ productGroupsList.length }}
    </span>
  </button>

  <button
    type="button"
    class="btn-manage-toppings"
    @click="openToppingGroupModal()"
  >
    <span class="btn-icon"><i class="ri-add-box-line"></i></span>
    <span class="btn-text">Link Topping</span>
    <span v-if="toppingGroupsList.length" class="filter-badge">
      {{ toppingGroupsList.length }}
    </span>
  </button>

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
              <th style="width: 120px" class="text-center">Danh mục cha</th>
              <th style="width: 120px" class="text-center">Danh mục con</th>
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
              <td class="text-center" @click.stop="openEdit(item, { focusField: 'Danh_muc_cha' })">{{ item.Danh_muc_cha || '—' }}</td>
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
                    <button
                      v-if="edit.Main_img"
                      type="button"
                      class="main-image-delete-badge"
                      aria-label="Xóa ảnh chính"
                      title="Xóa ảnh chính"
                      :disabled="mainImageUploading"
                      @click.stop="removeMainImage"
                    >
                      <i class="ri-close-fill"></i>
                    </button>
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
                  <div class="main-image-actions">
                    <button
                      type="button"
                      class="btn-upload-image"
                      @click="$refs.fileInput.click()"
                      :disabled="mainImageUploading"
                    >
                      <span v-if="mainImageUploading"> Đang tải...</span>
                      <span v-else><i class="ri-chat-upload-fill"></i>{{ edit.Main_img ? 'Đổi ảnh' : 'Upload ảnh' }}</span>
                    </button>
                    <button
                      v-if="edit.Main_img"
                      type="button"
                      class="btn-remove-image"
                      @click="removeMainImage"
                      :disabled="mainImageUploading"
                    >
                      <i class="ri-delete-bin-line"></i>
                      <span>Xóa ảnh</span>
                    </button>
                  </div>
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
                  <div v-if="edit.Ma_hang" class="edit-link-trigger-card">
                    <div class="elt-left">
                      <div class="elt-title-row">
                        <i class="ri-links-line"></i>
                        <span>Link với hàng hóa khác</span>
                        <span class="ils-badge" :class="{ active: editLinkDraft.items.length >= 2 }">
                          {{
                            editLinkDraft.items.length >= 2
                              ? `Đã link ${editLinkDraft.items.length} món`
                              : 'Chưa link'
                          }}
                        </span>
                      </div>
                      <div v-if="editLinkDraft.items.length >= 2" class="elt-preview-chips">
                        <span
                          v-for="selIt in editLinkDraft.items"
                          :key="'elt-chip-' + selIt.maHang"
                          class="elt-chip"
                          :class="{ 'is-current': selIt.maHang === edit.Ma_hang }"
                        >
                          {{ selIt.shortLabel || (selIt.maHang === edit.Ma_hang ? (edit.Ten_hang || selIt.maHang) : getProductNameByCode(selIt.maHang)) }}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="btn-link-group-inline"
                      @click="openEditLinkPickerModal"
                    >
                      <i class="ri-links-line"></i>
                      <span>{{ editLinkDraft.items.length >= 2 ? 'Sửa link' : 'Chọn hàng link' }}</span>
                    </button>
                  </div>
                  <div v-if="edit.Ma_hang" class="edit-link-trigger-card is-topping-card">
                    <div class="elt-left">
                      <div class="elt-title-row">
                        <i class="ri-add-box-line"></i>
                        <span>Topping gọi thêm</span>
                        <span class="ils-badge" :class="{ active: editProductToppingsPreview.length > 0 }">
                          {{
                            editProductToppingsPreview.length > 0
                              ? `${editProductToppingsPreview.length} topping`
                              : 'Chưa gắn'
                          }}
                        </span>
                      </div>
                      <div v-if="editProductToppingsPreview.length" class="elt-preview-chips">
                        <span
                          v-for="tp in editProductToppingsPreview"
                          :key="'mob-tp-chip-' + tp.maHang"
                          class="elt-chip is-topping-chip"
                        >
                          + {{ tp.item.Ten_hang }}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="btn-link-group-inline is-topping-btn"
                      @click="openToppingGroupModalForProduct(edit)"
                    >
                      <i class="ri-add-box-line"></i>
                      <span>Quản lý Topping</span>
                    </button>
                  </div>
                </div>
                  <div class="form-group">
                    <label class="form-label">Danh mục cha ({{ getLangShort(activeEditLang) }})</label>
                    <input
                      data-field="Danh_muc_cha"
                      v-model="edit.i18n[activeEditLang].Danh_muc_cha"
                      :placeholder="activeEditLang === 'vi' ? 'Danh mục cha...' : (edit.i18n.vi.Danh_muc_cha ? `Dịch từ: ${edit.i18n.vi.Danh_muc_cha}` : 'Danh mục cha...')"
                      class="form-control"
                      @input="onEditI18nChange"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Danh mục con ({{ getLangShort(activeEditLang) }})</label>
                    <input
                      data-field="Danh_muc"
                      v-model="edit.i18n[activeEditLang].Danh_muc"
                      :placeholder="activeEditLang === 'vi' ? 'Danh mục con...' : (edit.i18n.vi.Danh_muc ? `Dịch từ: ${edit.i18n.vi.Danh_muc}` : 'Danh mục con...')"
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
                        <button
                          v-if="edit.Main_img"
                          type="button"
                          class="main-image-delete-badge"
                          aria-label="Xóa ảnh chính"
                          title="Xóa ảnh chính"
                          :disabled="mainImageUploading"
                          @click.stop="removeMainImage"
                        >
                          <i class="ri-close-fill"></i>
                        </button>
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
                      <div class="main-image-actions">
                        <button
                          type="button"
                          class="btn-upload-image"
                          @click="$refs.fileInputModal.click()"
                          :disabled="mainImageUploading"
                        >
                          {{ mainImageUploading ? 'Đang tải lên...' : (edit.Main_img ? 'Đổi ảnh' : 'Thêm ảnh') }}
                        </button>
                        <button
                          v-if="edit.Main_img"
                          type="button"
                          class="btn-remove-image"
                          @click="removeMainImage"
                          :disabled="mainImageUploading"
                        >
                          <i class="ri-delete-bin-line"></i>
                          <span>Xóa ảnh</span>
                        </button>
                      </div>
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
                    <div class="modal-section-grid modal-section-grid-2" style="margin-bottom: 12px;">
                      <div class="form-group">
                        <label class="form-label">Danh mục cha ({{ getLangShort(activeEditLang) }})</label>
                        <input
                          data-field="Danh_muc_cha"
                          v-model="edit.i18n[activeEditLang].Danh_muc_cha"
                          :placeholder="activeEditLang === 'vi' ? 'Danh mục cha...' : (edit.i18n.vi.Danh_muc_cha ? `Dịch từ: ${edit.i18n.vi.Danh_muc_cha}` : 'Danh mục cha...')"
                          class="form-control"
                          @input="onEditI18nChange"
                        />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Danh mục con ({{ getLangShort(activeEditLang) }})</label>
                        <input
                          data-field="Danh_muc"
                          v-model="edit.i18n[activeEditLang].Danh_muc"
                          :placeholder="activeEditLang === 'vi' ? 'Danh mục con...' : (edit.i18n.vi.Danh_muc ? `Dịch từ: ${edit.i18n.vi.Danh_muc}` : 'Danh mục con...')"
                          class="form-control"
                          @input="onEditI18nChange"
                        />
                      </div>
                    </div>
                    <div class="modal-section-grid modal-section-grid-2">
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
                  <div class="modal-section-title">Mô tả &amp; Cài đặt hiển thị ({{ getLangShort(activeEditLang) }})</div>
                  <div class="modal-desc-settings-split">
                    <div class="form-group modal-desc-pane">
                      <label class="form-label">Mô tả sản phẩm</label>
                      <textarea
                        data-field="Mo_ta"
                        v-model="edit.i18n[activeEditLang].Mo_ta"
                        :placeholder="activeEditLang === 'vi' ? 'Mô tả sản phẩm...' : (edit.i18n.vi.Mo_ta ? `Dịch từ: ${edit.i18n.vi.Mo_ta}` : 'Mô tả...')"
                        class="form-control form-textarea modal-desc-textarea"
                        rows="4"
                        @input="onEditI18nChange"
                      ></textarea>
                    </div>
                    <div class="modal-settings-pane">
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
                      <div v-if="edit.Ma_hang" class="edit-link-trigger-card">
                        <div class="elt-left">
                          <div class="elt-title-row">
                            <i class="ri-links-line"></i>
                            <span>Link với hàng hóa khác</span>
                            <span class="ils-badge" :class="{ active: editLinkDraft.items.length >= 2 }">
                              {{
                                editLinkDraft.items.length >= 2
                                  ? `Đã link ${editLinkDraft.items.length} món`
                                  : 'Chưa link'
                              }}
                            </span>
                          </div>
                          <div v-if="editLinkDraft.items.length >= 2" class="elt-preview-chips">
                            <span
                              v-for="selIt in editLinkDraft.items"
                              :key="'elt-chip-' + selIt.maHang"
                              class="elt-chip"
                              :class="{ 'is-current': selIt.maHang === edit.Ma_hang }"
                            >
                              {{ selIt.shortLabel || (selIt.maHang === edit.Ma_hang ? (edit.Ten_hang || selIt.maHang) : getProductNameByCode(selIt.maHang)) }}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="btn-link-group-inline"
                          @click="openEditLinkPickerModal"
                        >
                          <i class="ri-links-line"></i>
                          <span>{{ editLinkDraft.items.length >= 2 ? 'Sửa link' : 'Chọn hàng link' }}</span>
                        </button>
                      </div>
                      <div v-if="edit.Ma_hang" class="edit-link-trigger-card is-topping-card">
                        <div class="elt-left">
                          <div class="elt-title-row">
                            <i class="ri-add-box-line"></i>
                            <span>Topping gọi thêm</span>
                            <span class="ils-badge" :class="{ active: editProductToppingsPreview.length > 0 }">
                              {{
                                editProductToppingsPreview.length > 0
                                  ? `${editProductToppingsPreview.length} topping`
                                  : 'Chưa gắn'
                              }}
                            </span>
                          </div>
                          <div v-if="editProductToppingsPreview.length" class="elt-preview-chips">
                            <span
                              v-for="tp in editProductToppingsPreview"
                              :key="'pc-tp-chip-' + tp.maHang"
                              class="elt-chip is-topping-chip"
                            >
                              + {{ tp.item.Ten_hang }}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="btn-link-group-inline is-topping-btn"
                          @click="openToppingGroupModalForProduct(edit)"
                        >
                          <i class="ri-add-box-line"></i>
                          <span>Quản lý Topping</span>
                        </button>
                      </div>
                    </div>
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
          <button type="button" class="bfb-btn bfb-btn-delete" @click="bulkDeleteFromModal">
            <i class="ri-delete-bin-6-line"></i>
            <span>Xóa đã chọn</span>
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
              <!-- Danh mục cha -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableDanhMucCha }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableDanhMucCha" />
                  <span>Danh mục cha ({{ getLangShort(selectedLanguage) }})</span>
                </label>
                <input
                  v-model="bulkForm.Danh_muc_cha"
                  :disabled="!bulkForm.enableDanhMucCha"
                  placeholder="Nhập tên danh mục cha mới..."
                  class="form-control"
                />
              </div>

              <!-- Danh mục con -->
              <div class="bulk-field-card" :class="{ active: bulkForm.enableDanhMuc }">
                <label class="bulk-field-toggle">
                  <input type="checkbox" v-model="bulkForm.enableDanhMuc" />
                  <span>Danh mục con ({{ getLangShort(selectedLanguage) }})</span>
                </label>
                <input
                  v-model="bulkForm.Danh_muc"
                  :disabled="!bulkForm.enableDanhMuc"
                  placeholder="Nhập tên danh mục con mới..."
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

    <!-- ===== MODAL TẠO & GOM DANH MỤC CHA ===== -->
    <transition name="fade">
      <div
        v-if="showParentCategoryModal"
        class="bulk-modal-overlay"
        @click.self="closeParentCategoryModal"
      >
        <div class="bulk-modal-card parent-cat-modal-card" @click.stop>
          <div class="bulk-modal-header">
            <div>
              <h3 class="bulk-modal-title">
                <i class="ri-folder-add-fill"></i>
                Tạo &amp; Gom Danh Mục Cha
              </h3>
              <p class="bulk-modal-subtitle">
                Tạo danh mục cha và tick chọn các danh mục con để đưa vào (tự động đồng bộ kho hàng &amp; Menu Online).
              </p>
            </div>
            <button
              type="button"
              class="bulk-close-btn"
              :disabled="parentModalSaving"
              @click="closeParentCategoryModal"
            >
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div class="bulk-modal-body pcm-body">
            <!-- Existing Parent Tabs + New Button -->
            <div class="pcm-section">
              <div class="pcm-section-label">Chọn danh mục cha để sửa hoặc tạo mới:</div>
              <div class="pcm-parent-pills">
                <button
                  type="button"
                  class="pcm-parent-pill is-new"
                  :class="{ active: parentModalState.isCreatingNew }"
                  @click="selectNewParentInModal"
                >
                  <i class="ri-add-circle-line"></i>
                  <span>+ Tạo cha mới</span>
                </button>
                <button
                  v-for="p in existingParentEntries"
                  :key="'pcm-p-' + p.name"
                  type="button"
                  class="pcm-parent-pill"
                  :class="{ active: !parentModalState.isCreatingNew && parentModalState.editingParentKey === p.name }"
                  @click="selectExistingParentInModal(p.name)"
                >
                  <i class="ri-folder-3-fill"></i>
                  <span>{{ p.name }}</span>
                  <span class="pcm-pill-count">{{ p.childCount }}</span>
                </button>
              </div>
            </div>

            <!-- Parent Name & Multi-lang Inputs -->
            <div class="pcm-section pcm-name-card">
              <div class="pcm-name-grid">
                <div class="pcm-field">
                  <label>Tên Danh mục cha (Tiếng Việt)*</label>
                  <input
                    v-model="parentModalState.i18n.vi"
                    type="text"
                    class="form-control"
                    :disabled="!parentModalState.isCreatingNew"
                    placeholder="VD: Đồ uống, Món chính, Tráng miệng..."
                  />
                </div>
                <div class="pcm-field">
                  <label>English (tùy chọn)</label>
                  <input
                    v-model="parentModalState.i18n.en"
                    type="text"
                    class="form-control"
                    placeholder="Drinks..."
                  />
                </div>
                <div class="pcm-field">
                  <label>中文 (tùy chọn)</label>
                  <input
                    v-model="parentModalState.i18n['zh-CN']"
                    type="text"
                    class="form-control"
                    placeholder="饮品..."
                  />
                </div>
                <div class="pcm-field">
                  <label>한국어 (tùy chọn)</label>
                  <input
                    v-model="parentModalState.i18n.ko"
                    type="text"
                    class="form-control"
                    placeholder="음료..."
                  />
                </div>
                <div class="pcm-field">
                  <label>Filipino (tùy chọn)</label>
                  <input
                    v-model="parentModalState.i18n.fil"
                    type="text"
                    class="form-control"
                    placeholder="Inumin..."
                  />
                </div>
              </div>
            </div>

            <!-- Subcategory Checklist Picker -->
            <div class="pcm-section">
              <div class="pcm-sub-toolbar">
                <div class="pcm-sub-title">
                  Chọn danh mục con đưa vào ({{ parentModalState.selectedSubs.length }}/{{ allKhoSubCategories.length }}):
                </div>
                <div class="pcm-sub-actions">
                  <button type="button" class="pcm-mini-btn" @click="selectAllFilteredSubs(true)">
                    Chọn tất cả
                  </button>
                  <button type="button" class="pcm-mini-btn" @click="selectAllFilteredSubs(false)">
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <input
                v-model="parentModalState.subSearch"
                type="text"
                class="form-control pcm-sub-search"
                placeholder="Tìm nhanh danh mục con..."
              />

              <div v-if="!filteredModalSubCategories.length" class="pcm-empty">
                Không tìm thấy danh mục con phù hợp trong Kho hàng.
              </div>
              <div v-else class="pcm-sub-grid">
                <label
                  v-for="sub in filteredModalSubCategories"
                  :key="'pcm-sub-' + sub.name"
                  class="pcm-sub-item"
                  :class="{
                    checked: parentModalState.selectedSubs.includes(sub.name),
                    'other-parent':
                      sub.currentParent &&
                      sub.currentParent !== activeModalParentName &&
                      !parentModalState.selectedSubs.includes(sub.name),
                  }"
                >
                  <input
                    type="checkbox"
                    :checked="parentModalState.selectedSubs.includes(sub.name)"
                    @change="toggleSubInParentModal(sub.name)"
                  />
                  <div class="pcm-sub-info">
                    <div class="pcm-sub-name">{{ sub.name }}</div>
                    <div class="pcm-sub-meta">
                      <span>{{ sub.count }} SP</span>
                      <span
                        v-if="sub.currentParent && sub.currentParent !== activeModalParentName"
                        class="pcm-other-badge"
                      >
                        • Đang thuộc: {{ sub.currentParent }}
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="bulk-modal-footer">
            <button
              v-if="!parentModalState.isCreatingNew && parentModalState.editingParentKey"
              type="button"
              class="btn-modal btn-danger"
              :disabled="parentModalSaving"
              @click="dissolveParentFromModal"
            >
              <i class="ri-folder-reduce-line"></i>
              <span>Xóa nhóm cha</span>
            </button>
            <div v-else></div>

            <div class="bulk-footer-right">
              <button
                type="button"
                class="btn-modal btn-secondary"
                :disabled="parentModalSaving"
                @click="closeParentCategoryModal"
              >
                Đóng
              </button>
              <button
                type="button"
                class="btn-modal btn-primary"
                :disabled="parentModalSaving"
                @click="saveParentCategoryModal"
              >
                <span v-if="parentModalSaving" class="btn-spinner"></span>
                <span>{{ parentModalSaving ? 'Đang lưu...' : 'Lưu Danh mục cha' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== MODAL LINK PHÂN LOẠI SẢN PHẨM (100% FULLSCREEN) ===== -->
    <transition name="fade">
      <div
        v-if="showProductGroupModal"
        class="bulk-modal-overlay fullscreen-link-overlay"
        @click.self="closeProductGroupModal"
      >
        <div class="bulk-modal-card fullscreen-link-card" @click.stop>
          <div class="bulk-modal-header flc-header">
            <div class="flc-header-inner">
              <div>
                <h3 class="bulk-modal-title pgm-title">
                  <i class="ri-links-line"></i>
                  Link Phân Loại Sản Phẩm
                </h3>
                <p class="bulk-modal-subtitle">
                  Gom các món riêng lẻ (VD: Món nhỏ, Món lớn...) lại để khách bấm chọn chuyển đổi ngay trong modal chi tiết.
                </p>
              </div>
              <button
                type="button"
                class="bulk-close-btn"
                :disabled="productGroupSaving"
                @click="closeProductGroupModal"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>

          <div class="flc-top-tabs-bar">
            <div class="flc-container flc-top-tabs-inner">
              <span class="pcm-section-label">Nhóm phân loại:</span>
              <div class="pcm-parent-pills">
                <button
                  type="button"
                  class="pcm-parent-pill is-new"
                  :class="{ active: productGroupState.isCreatingNew }"
                  @click="selectNewProductGroupInModal"
                >
                  <i class="ri-add-circle-line"></i>
                  <span>+ Tạo nhóm mới</span>
                </button>
                <button
                  v-for="(grp, gIdx) in productGroupsList"
                  :key="'pgm-grp-' + grp.id"
                  type="button"
                  class="pcm-parent-pill"
                  :class="{ active: !productGroupState.isCreatingNew && productGroupState.editingGroupId === grp.id }"
                  @click="selectExistingProductGroupInModal(grp.id)"
                >
                  <i class="ri-links-line"></i>
                  <span>{{ grp.name || `Nhóm #${gIdx + 1}` }}</span>
                  <span class="pcm-pill-count">{{ grp.items.length }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="flc-workspace-body">
            <div class="flc-container link-workspace-grid">
              <!-- CỘT TRÁI: THÔNG TIN NHÓM & CÁC MÓN ĐÃ CHỌN -->
              <div class="link-pane is-left">
                <div class="link-pane-head">
                  <span class="link-pane-title">
                    <i class="ri-list-ordered"></i>
                    <span>Sản phẩm trong nhóm ({{ productGroupState.items.length }})</span>
                  </span>
                  <span class="link-pane-hint">Tối thiểu 2 món</span>
                </div>

                <div class="pcm-field flc-group-name-field">
                  <label>Tên nhóm (dùng để quản lý, tùy chọn)</label>
                  <input
                    v-model="productGroupState.name"
                    type="text"
                    class="form-control"
                    placeholder="VD: Trà sữa truyền thống, Bánh tráng..."
                  />
                </div>

                <div v-if="!productGroupState.items.length" class="link-pane-empty">
                  <i class="ri-checkbox-multiple-blank-line"></i>
                  <span>Chưa chọn sản phẩm nào. Tick chọn ít nhất 2 sản phẩm ở cột bên phải.</span>
                </div>
                <div v-else class="link-selected-scroll">
                  <div
                    v-for="(selIt, sIdx) in productGroupState.items"
                    :key="'pgm-sel-' + selIt.maHang"
                    class="pgm-selected-row flc-selected-card"
                  >
                    <div class="pgm-move-col">
                      <button
                        type="button"
                        class="pgm-move-btn"
                        :disabled="sIdx === 0"
                        title="Lên"
                        @click="moveProductGroupItem(sIdx, -1)"
                      >
                        <i class="ri-arrow-up-s-line"></i>
                      </button>
                      <button
                        type="button"
                        class="pgm-move-btn"
                        :disabled="sIdx === productGroupState.items.length - 1"
                        title="Xuống"
                        @click="moveProductGroupItem(sIdx, 1)"
                      >
                        <i class="ri-arrow-down-s-line"></i>
                      </button>
                    </div>
                    <img
                      v-if="getProductImageByCode(selIt.maHang)"
                      :src="getProductImageByCode(selIt.maHang)"
                      class="link-item-thumb"
                      alt=""
                    />
                    <div v-else class="link-item-thumb is-empty">
                      <i class="ri-image-line"></i>
                    </div>
                    <div class="pgm-sel-info">
                      <div class="pgm-sel-name">
                        {{ getProductNameByCode(selIt.maHang) }}
                      </div>
                      <div class="pgm-sel-meta">
                        <span>{{ selIt.maHang }}</span>
                        <span v-if="getProductPriceByCode(selIt.maHang)">
                          • {{ getProductPriceByCode(selIt.maHang) }}
                        </span>
                      </div>
                      <input
                        v-model="selIt.shortLabel"
                        type="text"
                        class="form-control flc-short-input"
                        placeholder="Tên nút ngắn (bỏ trống = tên món)"
                      />
                    </div>
                    <button
                      type="button"
                      class="pgm-remove-btn"
                      title="Gỡ khỏi nhóm"
                      @click="removeProductFromGroupDraft(selIt.maHang)"
                    >
                      <i class="ri-close-line"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- CỘT PHẢI: KHO HÀNG ĐỂ TÌM & TICK CHỌN -->
              <div class="link-pane is-right">
                <div class="link-pane-head">
                  <span class="link-pane-title">
                    <i class="ri-archive-line"></i>
                    <span>Kho hàng hóa ({{ filteredKhoProductsForGroup.length }})</span>
                  </span>
                  <div class="link-filter-tools">
                    <select v-model="productGroupState.categoryFilter" class="form-control flc-cat-select">
                      <option value="">Tất cả danh mục</option>
                      <option v-for="cat in categories" :key="'pgm-cat-' + cat.name" :value="cat.name">
                        {{ cat.name }} ({{ cat.count }})
                      </option>
                    </select>
                  </div>
                </div>

                <input
                  v-model="productGroupState.search"
                  type="text"
                  class="form-control flc-search-input"
                  placeholder="Tìm theo tên món, mã hàng, danh mục..."
                />

                <div v-if="!filteredKhoProductsForGroup.length" class="link-pane-empty">
                  <i class="ri-search-line"></i>
                  <span>Không tìm thấy sản phẩm phù hợp.</span>
                </div>
                <div v-else class="link-picker-scroll">
                  <div class="link-picker-cards">
                    <label
                      v-for="prod in filteredKhoProductsForGroup"
                      :key="'pgm-pick-' + prod.Ma_hang"
                      class="pcm-sub-item flc-pick-card"
                      :class="{
                        checked: isProductInGroupDraft(prod.Ma_hang),
                        'other-parent':
                          otherGroupNameOfProduct(prod.Ma_hang) && !isProductInGroupDraft(prod.Ma_hang),
                      }"
                    >
                      <input
                        type="checkbox"
                        :checked="isProductInGroupDraft(prod.Ma_hang)"
                        @change="toggleProductInGroupDraft(prod.Ma_hang)"
                      />
                      <img
                        v-if="prod.Main_img"
                        :src="prod.Main_img"
                        class="link-item-thumb"
                        alt=""
                      />
                      <div v-else class="link-item-thumb is-empty">
                        <i class="ri-image-line"></i>
                      </div>
                      <div class="pcm-sub-info">
                        <div class="pcm-sub-name">{{ prod.Ten_hang }}</div>
                        <div class="pcm-sub-meta">
                          <span>{{ prod.Ma_hang }}</span>
                          <span v-if="prod.Danh_muc"> • {{ prod.Danh_muc }}</span>
                          <span v-if="getProductPriceByCode(prod.Ma_hang)" class="flc-pick-price">
                            • {{ getProductPriceByCode(prod.Ma_hang) }}
                          </span>
                          <span
                            v-if="otherGroupNameOfProduct(prod.Ma_hang) && !isProductInGroupDraft(prod.Ma_hang)"
                            class="pcm-other-badge"
                          >
                            • Nhóm: {{ otherGroupNameOfProduct(prod.Ma_hang) }}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bulk-modal-footer flc-footer">
            <div class="flc-footer-inner">
              <button
                v-if="!productGroupState.isCreatingNew && productGroupState.editingGroupId"
                type="button"
                class="btn-modal btn-danger"
                :disabled="productGroupSaving"
                @click="deleteProductGroupModal"
              >
                <i class="ri-delete-bin-line"></i>
                <span>Xóa nhóm</span>
              </button>
              <div v-else></div>

              <div class="bulk-footer-right">
                <button
                  type="button"
                  class="btn-modal btn-secondary"
                  :disabled="productGroupSaving"
                  @click="closeProductGroupModal"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  class="btn-modal btn-primary"
                  :disabled="productGroupSaving || productGroupState.items.length < 2"
                  @click="saveProductGroupModal"
                >
                  <span v-if="productGroupSaving" class="btn-spinner"></span>
                  <span>{{ productGroupSaving ? 'Đang lưu...' : 'Lưu nhóm phân loại' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== MODAL CHỌN HÀNG HÓA LINK CÙNG (MỞ TỪ MODAL SỬA SẢN PHẨM - 100% FULLSCREEN) ===== -->
    <transition name="fade">
      <div
        v-if="showEditLinkPickerModal"
        class="bulk-modal-overlay fullscreen-link-overlay"
        @click.self="closeEditLinkPickerModal"
      >
        <div class="bulk-modal-card fullscreen-link-card" @click.stop>
          <div class="bulk-modal-header flc-header">
            <div class="flc-header-inner">
              <div>
                <h3 class="bulk-modal-title pgm-title">
                  <i class="ri-links-line"></i>
                  Link hàng hóa với "{{ edit.Ten_hang || edit.Ma_hang }}"
                </h3>
                <p class="bulk-modal-subtitle">
                  Chọn các hàng hóa khác ở cột bên phải để liên kết thành phân loại chọn nhanh trong modal Order.
                </p>
              </div>
              <button
                type="button"
                class="bulk-close-btn"
                :disabled="editLinkSaving"
                @click="closeEditLinkPickerModal"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>

          <div class="flc-workspace-body">
            <div class="flc-container link-workspace-grid">
              <!-- CỘT TRÁI: CÁC MÓN ĐANG LINK -->
              <div class="link-pane is-left">
                <div class="link-pane-head">
                  <span class="link-pane-title">
                    <i class="ri-list-ordered"></i>
                    <span>Các món đang link ({{ editLinkDraft.items.length }})</span>
                  </span>
                  <span class="link-pane-hint">
                    {{ editLinkDraft.items.length >= 2 ? 'Đã đủ tối thiểu 2 món' : 'Chọn thêm ít nhất 1 món nữa' }}
                  </span>
                </div>

                <div class="link-selected-scroll">
                  <div
                    v-for="(selIt, sIdx) in editLinkDraft.items"
                    :key="'modal-ils-' + selIt.maHang"
                    class="ils-selected-row flc-selected-card"
                    :class="{ 'is-current': selIt.maHang === edit.Ma_hang }"
                  >
                    <div class="pgm-move-col">
                      <button
                        type="button"
                        class="pgm-move-btn"
                        :disabled="sIdx === 0"
                        title="Lên"
                        @click="moveEditLinkItem(sIdx, -1)"
                      >
                        <i class="ri-arrow-up-s-line"></i>
                      </button>
                      <button
                        type="button"
                        class="pgm-move-btn"
                        :disabled="sIdx === editLinkDraft.items.length - 1"
                        title="Xuống"
                        @click="moveEditLinkItem(sIdx, 1)"
                      >
                        <i class="ri-arrow-down-s-line"></i>
                      </button>
                    </div>
                    <img
                      v-if="selIt.maHang === edit.Ma_hang ? edit.Main_img : getProductImageByCode(selIt.maHang)"
                      :src="selIt.maHang === edit.Ma_hang ? edit.Main_img : getProductImageByCode(selIt.maHang)"
                      class="link-item-thumb"
                      alt=""
                    />
                    <div v-else class="link-item-thumb is-empty">
                      <i class="ri-image-line"></i>
                    </div>
                    <div class="ils-sel-info">
                      <div class="ils-sel-name">
                        {{ selIt.maHang === edit.Ma_hang ? (edit.Ten_hang || selIt.maHang) : getProductNameByCode(selIt.maHang) }}
                        <span v-if="selIt.maHang === edit.Ma_hang" class="ils-cur-tag">Đang sửa</span>
                      </div>
                      <div class="ils-sel-meta">
                        {{ selIt.maHang }}
                        <span v-if="getProductPriceByCode(selIt.maHang)"> • {{ getProductPriceByCode(selIt.maHang) }}</span>
                      </div>
                      <input
                        v-model="selIt.shortLabel"
                        type="text"
                        class="form-control flc-short-input"
                        placeholder="Tên nút ngắn (bỏ trống = tên món)"
                        @input="onEditLinkChanged"
                      />
                    </div>
                    <button
                      v-if="selIt.maHang !== edit.Ma_hang"
                      type="button"
                      class="pgm-remove-btn"
                      title="Bỏ link món này"
                      @click="removeOtherProductFromEditLink(selIt.maHang)"
                    >
                      <i class="ri-close-line"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- CỘT PHẢI: CHỌN HÀNG HÓA KHÁC TRONG KHO -->
              <div class="link-pane is-right">
                <div class="link-pane-head">
                  <span class="link-pane-title">
                    <i class="ri-archive-line"></i>
                    <span>Hàng hóa khác trong kho ({{ filteredOtherProductsForEditLink.length }})</span>
                  </span>
                  <div class="link-filter-tools">
                    <select v-model="editLinkDraft.categoryFilter" class="form-control flc-cat-select">
                      <option value="">Tất cả danh mục</option>
                      <option v-for="cat in categories" :key="'ils-cat-' + cat.name" :value="cat.name">
                        {{ cat.name }} ({{ cat.count }})
                      </option>
                    </select>
                  </div>
                </div>

                <input
                  v-model="editLinkDraft.search"
                  type="text"
                  class="form-control flc-search-input"
                  placeholder="Tìm tên món, mã hàng, danh mục..."
                />

                <div v-if="!filteredOtherProductsForEditLink.length" class="link-pane-empty">
                  <i class="ri-search-line"></i>
                  <span>Không có sản phẩm phù hợp để link.</span>
                </div>
                <div v-else class="link-picker-scroll">
                  <div class="link-picker-cards">
                    <label
                      v-for="prod in filteredOtherProductsForEditLink"
                      :key="'modal-ils-pick-' + prod.Ma_hang"
                      class="ils-pick-item flc-pick-card"
                      :class="{ checked: isProductInEditLink(prod.Ma_hang) }"
                    >
                      <input
                        type="checkbox"
                        :checked="isProductInEditLink(prod.Ma_hang)"
                        @change="toggleOtherProductInEditLink(prod.Ma_hang)"
                      />
                      <img
                        v-if="prod.Main_img"
                        :src="prod.Main_img"
                        class="link-item-thumb"
                        alt=""
                      />
                      <div v-else class="link-item-thumb is-empty">
                        <i class="ri-image-line"></i>
                      </div>
                      <div class="ils-pick-info">
                        <div class="ils-pick-name">{{ prod.Ten_hang }}</div>
                        <div class="ils-pick-meta">
                          <span>{{ prod.Ma_hang }}</span>
                          <span v-if="prod.Danh_muc"> • {{ prod.Danh_muc }}</span>
                          <span v-if="getProductPriceByCode(prod.Ma_hang)" class="flc-pick-price">
                            • {{ getProductPriceByCode(prod.Ma_hang) }}
                          </span>
                          <span
                            v-if="getOtherProductGroupLabel(prod.Ma_hang) && !isProductInEditLink(prod.Ma_hang)"
                            class="pcm-other-badge"
                          >
                            • Nhóm: {{ getOtherProductGroupLabel(prod.Ma_hang) }}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bulk-modal-footer flc-footer">
            <div class="flc-footer-inner">
              <div></div>
              <div class="bulk-footer-right">
                <button
                  type="button"
                  class="btn-modal btn-secondary"
                  :disabled="editLinkSaving"
                  @click="closeEditLinkPickerModal"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  class="btn-modal btn-primary"
                  :disabled="editLinkSaving"
                  @click="saveEditLinkPickerModal"
                >
                  <span v-if="editLinkSaving" class="btn-spinner"></span>
                  <span>{{ editLinkSaving ? 'Đang lưu...' : 'Lưu link' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== MODAL QUẢN LÝ LINK TOPPING / GỌI THÊM (100% FULLSCREEN) ===== -->
    <transition name="fade">
      <div
        v-if="showToppingGroupModal"
        class="bulk-modal-overlay fullscreen-link-overlay tgm-fullscreen-overlay"
        @click.self="closeToppingGroupModal"
      >
        <div class="bulk-modal-card fullscreen-link-card tgm-fullscreen-card" @click.stop>
          <div class="bulk-modal-header flc-header">
            <div class="flc-header-inner">
              <div>
                <h3 class="bulk-modal-title tgm-title">
                  <i class="ri-add-box-line"></i>
                  Link Topping / Gọi Thêm
                </h3>
                <p class="bulk-modal-subtitle">
                  Chọn món làm Topping (VD: Trứng ốp la, Chả, Cơm thêm...) rồi gắn vào Danh mục hoặc Món cụ thể để khách tick gọi thêm ngay trong modal chi tiết.
                </p>
              </div>
              <button
                type="button"
                class="bulk-close-btn"
                :disabled="toppingGroupSaving"
                @click="closeToppingGroupModal"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>

          <div class="flc-top-tabs-bar">
            <div class="flc-container flc-top-tabs-inner">
              <span class="pcm-section-label">Nhóm Topping:</span>
              <div class="pcm-parent-pills">
                <button
                  type="button"
                  class="pcm-parent-pill is-new"
                  :class="{ active: toppingGroupState.isCreatingNew }"
                  @click="selectNewToppingGroupInModal"
                >
                  <i class="ri-add-circle-line"></i>
                  <span>+ Tạo nhóm mới</span>
                </button>
                <button
                  v-for="(grp, gIdx) in toppingGroupsList"
                  :key="'tgm-grp-' + grp.id"
                  type="button"
                  class="pcm-parent-pill"
                  :class="{ active: !toppingGroupState.isCreatingNew && toppingGroupState.editingGroupId === grp.id }"
                  @click="selectExistingToppingGroupInModal(grp.id)"
                >
                  <i class="ri-add-box-line"></i>
                  <span>{{ grp.name || `Topping #${gIdx + 1}` }}</span>
                  <span class="pcm-pill-count">{{ grp.toppings.length }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="flc-workspace-body">
            <div class="flc-container link-workspace-grid">
              <!-- CỘT TRÁI: TÊN NHÓM, DANH SÁCH TOPPING & PHẠM VI ÁP DỤNG -->
              <div class="link-pane is-left">
                <div class="pcm-field flc-group-name-field">
                  <label>Tên nhóm Topping (tùy chọn)</label>
                  <input
                    v-model="toppingGroupState.name"
                    type="text"
                    class="form-control"
                    placeholder="VD: Topping Cơm, Topping Mì/Bún, Đồ ăn kèm..."
                  />
                </div>

                <!-- 1. TOPPINGS SELECTED -->
                <div class="link-pane-head" style="margin-top: 4px;">
                  <span class="link-pane-title">
                    <i class="ri-restaurant-2-line"></i>
                    <span>Món làm Topping ({{ toppingGroupState.toppings.length }})</span>
                  </span>
                  <button
                    type="button"
                    class="tgm-jump-btn"
                    :class="{ active: toppingGroupState.pickerTab === 'toppings' }"
                    @click="toppingGroupState.pickerTab = 'toppings'"
                  >
                    + Chọn Topping
                  </button>
                </div>

                <div v-if="!toppingGroupState.toppings.length" class="tgm-mini-empty">
                  Chưa chọn món topping nào. Tick chọn ở cột bên phải (Tab 1).
                </div>
                <div v-else class="tgm-selected-list">
                  <div
                    v-for="(code, tIdx) in toppingGroupState.toppings"
                    :key="'tgm-tp-' + code"
                    class="pgm-selected-row flc-selected-card"
                  >
                    <div class="pgm-move-col">
                      <button
                        type="button"
                        class="pgm-move-btn"
                        :disabled="tIdx === 0"
                        title="Lên"
                        @click="moveToppingInDraft(tIdx, -1)"
                      >
                        <i class="ri-arrow-up-s-line"></i>
                      </button>
                      <button
                        type="button"
                        class="pgm-move-btn"
                        :disabled="tIdx === toppingGroupState.toppings.length - 1"
                        title="Xuống"
                        @click="moveToppingInDraft(tIdx, 1)"
                      >
                        <i class="ri-arrow-down-s-line"></i>
                      </button>
                    </div>
                    <img
                      v-if="getProductImageByCode(code)"
                      :src="getProductImageByCode(code)"
                      class="link-item-thumb"
                      alt=""
                    />
                    <div v-else class="link-item-thumb is-empty">
                      <i class="ri-image-line"></i>
                    </div>
                    <div class="pgm-sel-info">
                      <div class="pgm-sel-name">{{ getProductNameByCode(code) }}</div>
                      <div class="pgm-sel-meta">
                        <span>{{ code }}</span>
                        <span v-if="getProductPriceByCode(code)">
                          • +{{ getProductPriceByCode(code) }}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="pgm-remove-btn"
                      title="Gỡ topping"
                      @click="toggleToppingInDraft(code)"
                    >
                      <i class="ri-close-line"></i>
                    </button>
                  </div>
                </div>

                <!-- 2. TARGETS SUMMARY -->
                <div class="link-pane-head" style="margin-top: 14px;">
                  <span class="link-pane-title">
                    <i class="ri-focus-3-line"></i>
                    <span>
                      Áp dụng cho ({{ toppingGroupState.targetCategories.length }} danh mục,
                      {{ toppingGroupState.targetProducts.length }} món lẻ)
                    </span>
                  </span>
                  <button
                    type="button"
                    class="tgm-jump-btn"
                    :class="{ active: toppingGroupState.pickerTab === 'targets' }"
                    @click="toppingGroupState.pickerTab = 'targets'"
                  >
                    + Chọn món áp dụng
                  </button>
                </div>

                <div
                  v-if="!toppingGroupState.targetCategories.length && !toppingGroupState.targetProducts.length"
                  class="tgm-mini-empty"
                >
                  Chưa chọn danh mục hoặc món áp dụng. Chuyển sang Tab 2 ở cột bên phải để chọn.
                </div>
                <div v-else class="tgm-target-chips-wrap">
                  <span
                    v-for="cat in toppingGroupState.targetCategories"
                    :key="'tgm-tcat-' + cat"
                    class="tgm-chip is-cat"
                  >
                    <i class="ri-folder-3-line"></i>
                    <span>{{ cat }}</span>
                    <button type="button" @click="toggleTargetCategoryInDraft(cat)">
                      <i class="ri-close-line"></i>
                    </button>
                  </span>
                  <span
                    v-for="code in toppingGroupState.targetProducts"
                    :key="'tgm-tprod-' + code"
                    class="tgm-chip is-prod"
                  >
                    <i class="ri-restaurant-line"></i>
                    <span>{{ getProductNameByCode(code) }}</span>
                    <button type="button" @click="toggleTargetProductInDraft(code)">
                      <i class="ri-close-line"></i>
                    </button>
                  </span>
                </div>
              </div>

              <!-- CỘT PHẢI: 2 TAB CHỌN TOPPING / CHỌN PHẠM VI ÁP DỤNG -->
              <div class="link-pane is-right">
                <div class="tgm-picker-tabs">
                  <button
                    type="button"
                    class="tgm-picker-tab"
                    :class="{ active: toppingGroupState.pickerTab === 'toppings' }"
                    @click="toppingGroupState.pickerTab = 'toppings'"
                  >
                    <span class="tgm-step-num">1</span>
                    <span>Chọn món làm Topping</span>
                    <span class="tgm-tab-badge">{{ toppingGroupState.toppings.length }}</span>
                  </button>
                  <button
                    type="button"
                    class="tgm-picker-tab"
                    :class="{ active: toppingGroupState.pickerTab === 'targets' }"
                    @click="toppingGroupState.pickerTab = 'targets'"
                  >
                    <span class="tgm-step-num">2</span>
                    <span>Áp dụng cho Danh mục / Món</span>
                    <span class="tgm-tab-badge">
                      {{ toppingGroupState.targetCategories.length + toppingGroupState.targetProducts.length }}
                    </span>
                  </button>
                </div>

                <!-- TAB 2 QUICK CATEGORY PICKER -->
                <div v-if="toppingGroupState.pickerTab === 'targets'" class="tgm-cat-box">
                  <div class="tgm-cat-box-label">
                    <i class="ri-folder-check-line"></i>
                    <span>Gắn nhanh cho cả Danh mục (1 click áp dụng toàn bộ món trong danh mục):</span>
                  </div>
                  <div class="tgm-cat-pills">
                    <button
                      v-for="cat in categories"
                      :key="'tgm-cat-pick-' + cat.name"
                      type="button"
                      class="tgm-cat-pill"
                      :class="{ active: toppingGroupState.targetCategories.includes(cat.name) }"
                      @click="toggleTargetCategoryInDraft(cat.name)"
                    >
                      <i
                        :class="
                          toppingGroupState.targetCategories.includes(cat.name)
                            ? 'ri-checkbox-fill'
                            : 'ri-checkbox-blank-line'
                        "
                      ></i>
                      <span>{{ cat.name }}</span>
                      <span class="tgm-cat-cnt">{{ cat.count }}</span>
                    </button>
                  </div>
                </div>

                <div class="link-pane-head" style="margin-top: 4px;">
                  <span class="link-pane-title">
                    <i class="ri-archive-line"></i>
                    <span>
                      {{
                        toppingGroupState.pickerTab === 'toppings'
                          ? `Chọn món làm Topping (${filteredKhoProductsForTopping.length})`
                          : `Hoặc chọn thêm từng món lẻ (${filteredKhoProductsForTopping.length})`
                      }}
                    </span>
                  </span>
                  <div class="link-filter-tools">
                    <select v-model="toppingGroupState.categoryFilter" class="form-control flc-cat-select">
                      <option value="">Tất cả danh mục</option>
                      <option v-for="cat in categories" :key="'tgm-cat-' + cat.name" :value="cat.name">
                        {{ cat.name }} ({{ cat.count }})
                      </option>
                    </select>
                  </div>
                </div>

                <input
                  v-model="toppingGroupState.search"
                  type="text"
                  class="form-control flc-search-input"
                  placeholder="Tìm theo tên món, mã hàng, danh mục..."
                />

                <div v-if="!filteredKhoProductsForTopping.length" class="link-pane-empty">
                  <i class="ri-search-line"></i>
                  <span>Không tìm thấy sản phẩm phù hợp.</span>
                </div>
                <div v-else class="link-picker-scroll">
                  <div class="link-picker-cards">
                    <label
                      v-for="prod in filteredKhoProductsForTopping"
                      :key="'tgm-pick-' + toppingGroupState.pickerTab + '-' + prod.Ma_hang"
                      class="pcm-sub-item flc-pick-card"
                      :class="{
                        checked:
                          toppingGroupState.pickerTab === 'toppings'
                            ? toppingGroupState.toppings.includes(prod.Ma_hang)
                            : toppingGroupState.targetProducts.includes(prod.Ma_hang) ||
                              toppingGroupState.targetCategories.includes(String(prod.Danh_muc || '').trim()),
                      }"
                    >
                      <input
                        type="checkbox"
                        :checked="
                          toppingGroupState.pickerTab === 'toppings'
                            ? toppingGroupState.toppings.includes(prod.Ma_hang)
                            : toppingGroupState.targetProducts.includes(prod.Ma_hang)
                        "
                        @change="
                          toppingGroupState.pickerTab === 'toppings'
                            ? toggleToppingInDraft(prod.Ma_hang)
                            : toggleTargetProductInDraft(prod.Ma_hang)
                        "
                      />
                      <img
                        v-if="prod.Main_img"
                        :src="prod.Main_img"
                        class="link-item-thumb"
                        alt=""
                      />
                      <div v-else class="link-item-thumb is-empty">
                        <i class="ri-image-line"></i>
                      </div>
                      <div class="pcm-sub-info">
                        <div class="pcm-sub-name">{{ prod.Ten_hang }}</div>
                        <div class="pcm-sub-meta">
                          <span>{{ prod.Ma_hang }}</span>
                          <span v-if="prod.Danh_muc"> • {{ prod.Danh_muc }}</span>
                          <span v-if="getProductPriceByCode(prod.Ma_hang)" class="flc-pick-price">
                            • {{ getProductPriceByCode(prod.Ma_hang) }}
                          </span>
                          <span
                            v-if="
                              toppingGroupState.pickerTab === 'targets' &&
                              toppingGroupState.targetCategories.includes(String(prod.Danh_muc || '').trim())
                            "
                            class="pcm-other-badge"
                          >
                            • Đã gồm trong danh mục
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bulk-modal-footer flc-footer">
            <div class="flc-footer-inner">
              <button
                v-if="!toppingGroupState.isCreatingNew && toppingGroupState.editingGroupId"
                type="button"
                class="btn-modal btn-danger"
                :disabled="toppingGroupSaving"
                @click="deleteToppingGroupModal"
              >
                <i class="ri-delete-bin-line"></i>
                <span>Xóa nhóm</span>
              </button>
              <div v-else></div>

              <div class="bulk-footer-right">
                <button
                  type="button"
                  class="btn-modal btn-secondary"
                  :disabled="toppingGroupSaving"
                  @click="closeToppingGroupModal"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  class="btn-modal btn-primary"
                  :disabled="
                    toppingGroupSaving ||
                    !toppingGroupState.toppings.length ||
                    (!toppingGroupState.targetCategories.length && !toppingGroupState.targetProducts.length)
                  "
                  @click="saveToppingGroupModal"
                >
                  <span v-if="toppingGroupSaving" class="btn-spinner"></span>
                  <span>{{ toppingGroupSaving ? 'Đang lưu...' : 'Lưu nhóm Topping' }}</span>
                </button>
              </div>
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
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import {
  SUPPORTED_DATA_LANGS,
  DATA_LANG_CODES,
  normalizeProductI18n,
  syncProductWithI18n,
  localizeProduct,
  getProductTranslatedLangs,
  productMatchesKeyword,
} from '@/utils/i18nData'
import { normalizeDisplayConfig, getLinkedProductToppings } from '@/utils/displayOrder'
import {
  normalizeNccDiscountType,
  normalizeNccDiscountValue,
  formatNccDiscountLabel,
} from '@/utils/nccDiscount'
import { exportProductsWorkbook } from '@/utils/productExcel'

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

/* ===== PARENT CATEGORY MANAGER MODAL STATE ===== */
const displayConfigState = ref({
  categoryOrder: [],
  parentMap: {},
  parentI18n: {},
  productGroups: [],
  toppingGroups: [],
  productSortMode: 'flat',
})
const showParentCategoryModal = ref(false)
const parentModalSaving = ref(false)
const parentModalState = ref({
  isCreatingNew: true,
  editingParentKey: '',
  i18n: { vi: '', en: '', 'zh-CN': '', fil: '', ko: '' },
  selectedSubs: [],
  subSearch: '',
})

const effectiveParentHierarchy = computed(() => {
  const pMap = { ...displayConfigState.value.parentMap }
  const pI18n = JSON.parse(JSON.stringify(displayConfigState.value.parentI18n || {}))
  const subStats = new Map()

  for (const item of list.value || []) {
    const i18n = normalizeProductI18n(item)
    const subVi = String(i18n.vi?.Danh_muc || item?.Danh_muc || '').trim()
    if (!subVi || subVi === 'Tất cả' || subVi === 'Sale') continue
    if (!subStats.has(subVi)) {
      subStats.set(subVi, { name: subVi, count: 0 })
    }
    subStats.get(subVi).count += 1

    const itemParentVi = String(i18n.vi?.Danh_muc_cha || item?.Danh_muc_cha || '').trim()
    if (itemParentVi && itemParentVi !== 'Tất cả' && itemParentVi !== 'Sale' && itemParentVi !== subVi) {
      if (!Object.prototype.hasOwnProperty.call(pMap, subVi)) {
        pMap[subVi] = itemParentVi
      }
      if (!pI18n[itemParentVi]) pI18n[itemParentVi] = { vi: itemParentVi }
      for (const code of DATA_LANG_CODES) {
        if (code === 'vi') continue
        const val = String(i18n[code]?.Danh_muc_cha || '').trim()
        if (val && !pI18n[itemParentVi][code]) {
          pI18n[itemParentVi][code] = val
        }
      }
    }
  }

  return { pMap, pI18n, subStats }
})

const allKhoSubCategories = computed(() => {
  const { pMap, subStats } = effectiveParentHierarchy.value
  return [...subStats.values()]
    .map((s) => ({
      name: s.name,
      count: s.count,
      currentParent: String(pMap[s.name] || '').trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base', numeric: true }))
})

const existingParentEntries = computed(() => {
  const { pMap, pI18n } = effectiveParentHierarchy.value
  const counts = new Map()
  for (const pName of Object.keys(pI18n)) {
    if (pName && pName !== 'Tất cả' && pName !== 'Sale') {
      counts.set(pName, 0)
    }
  }
  for (const [subName, pName] of Object.entries(pMap)) {
    if (!pName || pName === subName) continue
    counts.set(pName, (counts.get(pName) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, childCount]) => ({ name, childCount }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base', numeric: true }))
})

const activeModalParentName = computed(() =>
  parentModalState.value.isCreatingNew
    ? String(parentModalState.value.i18n.vi || '').trim()
    : String(parentModalState.value.editingParentKey || '').trim(),
)

const filteredModalSubCategories = computed(() => {
  const kw = String(parentModalState.value.subSearch || '').trim().toLowerCase()
  const activeName = activeModalParentName.value
  return allKhoSubCategories.value.filter((sub) => {
    if (activeName && sub.name === activeName) return false
    if (!kw) return true
    return (
      sub.name.toLowerCase().includes(kw) ||
      sub.currentParent.toLowerCase().includes(kw)
    )
  })
})

function openParentCategoryModal() {
  const firstParent = existingParentEntries.value[0]?.name || ''
  if (firstParent) {
    selectExistingParentInModal(firstParent)
  } else {
    selectNewParentInModal()
  }
  showParentCategoryModal.value = true
}

function closeParentCategoryModal() {
  if (parentModalSaving.value) return
  showParentCategoryModal.value = false
}

function selectNewParentInModal() {
  parentModalState.value = {
    isCreatingNew: true,
    editingParentKey: '',
    i18n: { vi: '', en: '', 'zh-CN': '', fil: '', ko: '' },
    selectedSubs: [],
    subSearch: '',
  }
}

function selectExistingParentInModal(parentName) {
  const { pMap, pI18n } = effectiveParentHierarchy.value
  const langObj = pI18n[parentName] || { vi: parentName }
  const currentSubs = Object.entries(pMap)
    .filter(([, p]) => p === parentName)
    .map(([sub]) => sub)

  parentModalState.value = {
    isCreatingNew: false,
    editingParentKey: parentName,
    i18n: {
      vi: parentName,
      en: String(langObj.en || ''),
      'zh-CN': String(langObj['zh-CN'] || ''),
      fil: String(langObj.fil || ''),
      ko: String(langObj.ko || ''),
    },
    selectedSubs: currentSubs,
    subSearch: '',
  }
}

function toggleSubInParentModal(subName) {
  const arr = parentModalState.value.selectedSubs
  const idx = arr.indexOf(subName)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(subName)
  }
}

function selectAllFilteredSubs(checked) {
  const visibleNames = filteredModalSubCategories.value.map((s) => s.name)
  if (checked) {
    const merged = new Set([...parentModalState.value.selectedSubs, ...visibleNames])
    parentModalState.value.selectedSubs = [...merged]
  } else {
    const visibleSet = new Set(visibleNames)
    parentModalState.value.selectedSubs = parentModalState.value.selectedSubs.filter(
      (name) => !visibleSet.has(name),
    )
  }
}

async function saveParentCategoryModal() {
  const targetParentVi = activeModalParentName.value
  if (!targetParentVi) {
    showAlert('Vui lòng nhập tên Danh mục cha (Tiếng Việt)', 'error')
    return
  }
  if (targetParentVi === 'Tất cả' || targetParentVi === 'Sale') {
    showAlert('Tên danh mục cha không được trùng "Tất cả" hoặc "Sale"', 'error')
    return
  }

  parentModalSaving.value = true
  try {
    const { pMap, pI18n } = effectiveParentHierarchy.value
    const nextMap = { ...pMap }
    // Remove previous links to this parent first
    for (const [subName, pName] of Object.entries(nextMap)) {
      if (pName === targetParentVi) {
        delete nextMap[subName]
      }
    }
    // Assign newly selected subcategories
    for (const subName of parentModalState.value.selectedSubs) {
      if (subName && subName !== targetParentVi) {
        nextMap[subName] = targetParentVi
      }
    }

    const nextI18n = {
      ...pI18n,
      [targetParentVi]: {
        vi: targetParentVi,
        en: String(parentModalState.value.i18n.en || '').trim(),
        'zh-CN': String(parentModalState.value.i18n['zh-CN'] || '').trim(),
        fil: String(parentModalState.value.i18n.fil || '').trim(),
        ko: String(parentModalState.value.i18n.ko || '').trim(),
      },
    }

    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: {
        parentMap: nextMap,
        parentI18n: nextI18n,
      },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Lưu danh mục cha thất bại')
    }

    await loadData()
    selectExistingParentInModal(targetParentVi)
    showAlert(`Đã lưu Danh mục cha "${targetParentVi}" và đồng bộ kho hàng!`, 'success')
  } catch (err) {
    console.error('saveParentCategoryModal error:', err)
    showAlert(err?.message || 'Không lưu được danh mục cha', 'error')
  } finally {
    parentModalSaving.value = false
  }
}

async function dissolveParentFromModal() {
  const targetParentVi = parentModalState.value.editingParentKey
  if (!targetParentVi) return
  if (
    !window.confirm(
      `Xóa nhóm danh mục cha "${targetParentVi}"? Các danh mục con bên trong sẽ trở thành danh mục độc lập.`,
    )
  ) {
    return
  }

  parentModalSaving.value = true
  try {
    const { pMap, pI18n } = effectiveParentHierarchy.value
    const nextMap = { ...pMap }
    for (const [subName, pName] of Object.entries(nextMap)) {
      if (pName === targetParentVi) {
        delete nextMap[subName]
      }
    }
    const nextI18n = { ...pI18n }
    delete nextI18n[targetParentVi]

    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: {
        parentMap: nextMap,
        parentI18n: nextI18n,
      },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Xóa nhóm cha thất bại')
    }

    await loadData()
    const nextFirst = existingParentEntries.value[0]?.name || ''
    if (nextFirst) {
      selectExistingParentInModal(nextFirst)
    } else {
      selectNewParentInModal()
    }
    showAlert(`Đã giải tán danh mục cha "${targetParentVi}"`, 'success')
  } catch (err) {
    console.error('dissolveParentFromModal error:', err)
    showAlert(err?.message || 'Không xóa được danh mục cha', 'error')
  } finally {
    parentModalSaving.value = false
  }
}

/* ===== PRODUCT LINK GROUPS (VARIANTS) MANAGER STATE ===== */
const showProductGroupModal = ref(false)
const productGroupSaving = ref(false)
const productGroupState = ref({
  isCreatingNew: true,
  editingGroupId: '',
  name: '',
  items: [], // [{ maHang, shortLabel }]
  search: '',
  categoryFilter: '',
})

const productGroupsList = computed(() =>
  Array.isArray(displayConfigState.value.productGroups) ? displayConfigState.value.productGroups : [],
)

/* ===== TOPPING LINK GROUPS MANAGER STATE ===== */
const showToppingGroupModal = ref(false)
const toppingGroupSaving = ref(false)
const toppingGroupState = ref({
  isCreatingNew: true,
  editingGroupId: '',
  name: '',
  toppings: [],
  targetCategories: [],
  targetProducts: [],
  pickerTab: 'toppings', // 'toppings' | 'targets'
  search: '',
  categoryFilter: '',
})

const toppingGroupsList = computed(() =>
  Array.isArray(displayConfigState.value.toppingGroups) ? displayConfigState.value.toppingGroups : [],
)

const editProductToppingsPreview = computed(() => {
  if (!edit.value?.Ma_hang) return []
  return getLinkedProductToppings(edit.value, toppingGroupsList.value, list.value || [])
})

const filteredKhoProductsForTopping = computed(() => {
  const kw = String(toppingGroupState.value.search || '').trim().toLowerCase()
  const catFilter = String(toppingGroupState.value.categoryFilter || '').trim()
  const items = list.value || []
  const filtered = items.filter((it) => {
    if (catFilter && String(it?.Danh_muc || '').trim() !== catFilter) return false
    if (!kw) return true
    const name = String(it?.Ten_hang || '').toLowerCase()
    const code = String(it?.Ma_hang || '').toLowerCase()
    const cat = String(it?.Danh_muc || '').toLowerCase()
    return name.includes(kw) || code.includes(kw) || cat.includes(kw) || productMatchesKeyword(it, kw)
  })
  return filtered.slice(0, 120)
})

function selectNewToppingGroupInModal(presetTargetCode = '') {
  const cleanCode = String(presetTargetCode || '').trim()
  toppingGroupState.value = {
    isCreatingNew: true,
    editingGroupId: '',
    name: '',
    toppings: [],
    targetCategories: [],
    targetProducts: cleanCode ? [cleanCode] : [],
    pickerTab: 'toppings',
    search: '',
    categoryFilter: '',
  }
}

function selectExistingToppingGroupInModal(groupId) {
  const found = toppingGroupsList.value.find((g) => g.id === groupId)
  if (!found) {
    selectNewToppingGroupInModal()
    return
  }
  toppingGroupState.value = {
    isCreatingNew: false,
    editingGroupId: found.id,
    name: found.name || '',
    toppings: [...(found.toppings || [])],
    targetCategories: [...(found.targetCategories || [])],
    targetProducts: [...(found.targetProducts || [])],
    pickerTab: 'toppings',
    search: '',
    categoryFilter: '',
  }
}

function openToppingGroupModal(preferredGroupId = '') {
  if (preferredGroupId) {
    selectExistingToppingGroupInModal(preferredGroupId)
  } else {
    const first = toppingGroupsList.value[0]
    if (first) selectExistingToppingGroupInModal(first.id)
    else selectNewToppingGroupInModal()
  }
  showToppingGroupModal.value = true
}

function openToppingGroupModalForProduct(prod) {
  const code = String(prod?.Ma_hang || '').trim()
  const catVi = String(prod?.i18n?.vi?.Danh_muc || prod?.Danh_muc || '').trim()
  const matched = toppingGroupsList.value.find(
    (g) =>
      (code && (g.targetProducts || []).includes(code)) ||
      (catVi && (g.targetCategories || []).includes(catVi)),
  )
  if (matched) {
    selectExistingToppingGroupInModal(matched.id)
  } else {
    selectNewToppingGroupInModal(code)
  }
  showToppingGroupModal.value = true
}

function closeToppingGroupModal() {
  if (toppingGroupSaving.value) return
  showToppingGroupModal.value = false
}

function toggleToppingInDraft(maHang) {
  const code = String(maHang || '').trim()
  if (!code) return
  const arr = toppingGroupState.value.toppings
  const idx = arr.indexOf(code)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(code)
}

function moveToppingInDraft(index, delta) {
  const arr = toppingGroupState.value.toppings
  const target = index + delta
  if (target < 0 || target >= arr.length) return
  const [moved] = arr.splice(index, 1)
  arr.splice(target, 0, moved)
}

function toggleTargetCategoryInDraft(catName) {
  const clean = String(catName || '').trim()
  if (!clean) return
  const arr = toppingGroupState.value.targetCategories
  const idx = arr.indexOf(clean)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(clean)
}

function toggleTargetProductInDraft(maHang) {
  const code = String(maHang || '').trim()
  if (!code) return
  const arr = toppingGroupState.value.targetProducts
  const idx = arr.indexOf(code)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(code)
}

async function saveToppingGroupModal() {
  if (toppingGroupSaving.value) return
  const st = toppingGroupState.value
  if (!st.toppings.length) {
    showAlert('Vui lòng chọn ít nhất 1 món làm Topping', 'error')
    return
  }
  if (!st.targetCategories.length && !st.targetProducts.length) {
    showAlert('Vui lòng chọn ít nhất 1 danh mục hoặc món áp dụng', 'error')
    return
  }

  toppingGroupSaving.value = true
  try {
    const groupId = st.isCreatingNew
      ? `tg_${Date.now().toString(36)}`
      : st.editingGroupId || `tg_${Date.now().toString(36)}`
    const newEntry = {
      id: groupId,
      name: String(st.name || '').trim(),
      toppings: [...st.toppings],
      targetCategories: [...st.targetCategories],
      targetProducts: [...st.targetProducts],
    }

    const nextGroups = st.isCreatingNew
      ? [...toppingGroupsList.value, newEntry]
      : toppingGroupsList.value.map((g) => (g.id === groupId ? newEntry : g))

    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: { toppingGroups: nextGroups },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Lưu nhóm Topping thất bại')
    }
    displayConfigState.value = {
      ...displayConfigState.value,
      toppingGroups: nextGroups,
    }
    selectExistingToppingGroupInModal(groupId)
    showAlert('Đã lưu nhóm Topping thành công!', 'success')
  } catch (err) {
    console.error('saveToppingGroupModal error:', err)
    showAlert(err?.message || 'Không lưu được nhóm Topping', 'error')
  } finally {
    toppingGroupSaving.value = false
  }
}

async function deleteToppingGroupModal() {
  if (toppingGroupSaving.value || toppingGroupState.value.isCreatingNew) return
  const targetId = toppingGroupState.value.editingGroupId
  if (!targetId) return
  if (!confirm('Xóa nhóm Topping này? Các món ăn vẫn được giữ nguyên trong kho.')) return

  toppingGroupSaving.value = true
  try {
    const nextGroups = toppingGroupsList.value.filter((g) => g.id !== targetId)
    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: { toppingGroups: nextGroups },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Xóa nhóm Topping thất bại')
    }
    displayConfigState.value = {
      ...displayConfigState.value,
      toppingGroups: nextGroups,
    }
    const first = nextGroups[0]
    if (first) selectExistingToppingGroupInModal(first.id)
    else selectNewToppingGroupInModal()
    showAlert('Đã xóa nhóm Topping!', 'success')
  } catch (err) {
    console.error('deleteToppingGroupModal error:', err)
    showAlert(err?.message || 'Không xóa được nhóm Topping', 'error')
  } finally {
    toppingGroupSaving.value = false
  }
}

const filteredKhoProductsForGroup = computed(() => {
  const kw = String(productGroupState.value.search || '').trim().toLowerCase()
  const catFilter = String(productGroupState.value.categoryFilter || '').trim()
  const items = list.value || []
  const filtered = items.filter((it) => {
    if (catFilter && String(it?.Danh_muc || '').trim() !== catFilter) return false
    if (!kw) return true
    const name = String(it?.Ten_hang || '').toLowerCase()
    const code = String(it?.Ma_hang || '').toLowerCase()
    const cat = String(it?.Danh_muc || '').toLowerCase()
    return name.includes(kw) || code.includes(kw) || cat.includes(kw) || productMatchesKeyword(it, kw)
  })
  return filtered.slice(0, 120)
})

function getProductByCode(maHang) {
  const code = String(maHang || '').trim()
  return (list.value || []).find((p) => String(p?.Ma_hang || '').trim() === code) || null
}

function getProductNameByCode(maHang) {
  const p = getProductByCode(maHang)
  return p?.Ten_hang || maHang
}

function getProductImageByCode(maHang) {
  const p = getProductByCode(maHang)
  return String(p?.Main_img || '').trim()
}

function getProductPriceByCode(maHang) {
  const p = getProductByCode(maHang)
  if (!p) return ''
  const giam = Number(p.Gia_Giam || 0)
  const ban = Number(p.Gia_ban || 0)
  const active = giam > 0 ? giam : ban
  return `${active.toLocaleString('en-US')} ${p.Don_vi_tien_te || 'P'}`
}

function isProductInGroupDraft(maHang) {
  const code = String(maHang || '').trim()
  return productGroupState.value.items.some((it) => it.maHang === code)
}

function otherGroupNameOfProduct(maHang) {
  const code = String(maHang || '').trim()
  const found = productGroupsList.value.find(
    (g) =>
      g.id !== productGroupState.value.editingGroupId &&
      Array.isArray(g.items) &&
      g.items.some((it) => it.maHang === code),
  )
  if (!found) return ''
  return found.name || found.id
}

function openProductGroupModal() {
  const first = productGroupsList.value[0]
  if (first) {
    selectExistingProductGroupInModal(first.id)
  } else {
    selectNewProductGroupInModal()
  }
  showProductGroupModal.value = true
}

function getProductGroupForCode(maHang) {
  const code = String(maHang || '').trim()
  if (!code) return null
  return (
    productGroupsList.value.find(
      (g) => Array.isArray(g.items) && g.items.some((it) => it.maHang === code),
    ) || null
  )
}

/* ===== INLINE PRODUCT LINKING INSIDE PRODUCT EDIT MODAL ===== */
const showEditLinkPickerModal = ref(false)
const editLinkSaving = ref(false)
const editLinkDraft = ref({
  groupId: '',
  groupName: '',
  items: [], // [{ maHang, shortLabel }]
  search: '',
  categoryFilter: '',
  baselineSnapshot: '[]',
})

function openEditLinkPickerModal() {
  editLinkDraft.value.search = ''
  editLinkDraft.value.categoryFilter = ''
  showEditLinkPickerModal.value = true
}

function closeEditLinkPickerModal() {
  if (editLinkSaving.value) return
  hydrateEditLinkDraft(edit.value)
  showEditLinkPickerModal.value = false
}

async function saveEditLinkPickerModal() {
  if (editLinkSaving.value) return
  editLinkSaving.value = true
  try {
    const nextGroups = buildNextProductGroupsFromEditLink()
    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: { productGroups: nextGroups },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Lưu link phân loại thất bại')
    }
    displayConfigState.value = {
      ...displayConfigState.value,
      productGroups: nextGroups,
    }
    hydrateEditLinkDraft(edit.value)
    showEditLinkPickerModal.value = false
    showAlert('Đã lưu liên kết phân loại sản phẩm!', 'success')
  } catch (err) {
    console.error('saveEditLinkPickerModal error:', err)
    showAlert(err?.message || 'Không lưu được liên kết sản phẩm', 'error')
  } finally {
    editLinkSaving.value = false
  }
}

function serializeEditLinkItems(itemsArr) {
  return JSON.stringify(
    (itemsArr || []).map((it) => ({
      maHang: String(it?.maHang || '').trim(),
      shortLabel: String(it?.shortLabel || '').trim(),
    })),
  )
}

function hydrateEditLinkDraft(rawItem) {
  const code = String(rawItem?.Ma_hang || '').trim()
  const existingGroup = getProductGroupForCode(code)
  const items = existingGroup
    ? (existingGroup.items || []).map((it) => ({
        maHang: String(it.maHang || '').trim(),
        shortLabel: String(it.shortLabel || '').trim(),
      }))
    : code
      ? [{ maHang: code, shortLabel: '' }]
      : []

  editLinkDraft.value = {
    groupId: existingGroup?.id || '',
    groupName:
      existingGroup?.name || String(rawItem?.i18n?.vi?.Ten_hang || rawItem?.Ten_hang || '').trim(),
    items,
    search: '',
    categoryFilter: '',
    baselineSnapshot: serializeEditLinkItems(items),
  }
}

function hasEditLinkChanges() {
  return serializeEditLinkItems(editLinkDraft.value.items) !== editLinkDraft.value.baselineSnapshot
}

function onEditLinkChanged() {
  // Handled directly inside showEditLinkPickerModal via saveEditLinkPickerModal
}

const filteredOtherProductsForEditLink = computed(() => {
  const currentCode = String(edit.value?.Ma_hang || '').trim()
  const kw = String(editLinkDraft.value.search || '').trim().toLowerCase()
  const catFilter = String(editLinkDraft.value.categoryFilter || '').trim()
  const others = (list.value || []).filter((it) => {
    const code = String(it?.Ma_hang || '').trim()
    if (!code || code === currentCode) return false
    if (catFilter && String(it?.Danh_muc || '').trim() !== catFilter) return false
    if (!kw) return true
    const name = String(it?.Ten_hang || '').toLowerCase()
    const cat = String(it?.Danh_muc || '').toLowerCase()
    return (
      name.includes(kw) ||
      code.toLowerCase().includes(kw) ||
      cat.includes(kw) ||
      productMatchesKeyword(it, kw)
    )
  })
  // Put already-linked items first for convenience, then others (limit 120 for snappy scroll)
  const linkedSet = new Set(editLinkDraft.value.items.map((i) => i.maHang))
  const selected = others.filter((o) => linkedSet.has(o.Ma_hang))
  const unselected = others.filter((o) => !linkedSet.has(o.Ma_hang))
  return [...selected, ...unselected].slice(0, 120)
})

function isProductInEditLink(maHang) {
  const code = String(maHang || '').trim()
  return editLinkDraft.value.items.some((it) => it.maHang === code)
}

function getOtherProductGroupLabel(maHang) {
  const code = String(maHang || '').trim()
  const found = productGroupsList.value.find(
    (g) =>
      g.id !== editLinkDraft.value.groupId &&
      Array.isArray(g.items) &&
      g.items.some((it) => it.maHang === code),
  )
  return found ? found.name || found.id : ''
}

function toggleOtherProductInEditLink(maHang) {
  const code = String(maHang || '').trim()
  if (!code) return
  const idx = editLinkDraft.value.items.findIndex((it) => it.maHang === code)
  if (idx >= 0) {
    editLinkDraft.value.items.splice(idx, 1)
  } else {
    editLinkDraft.value.items.push({ maHang: code, shortLabel: '' })
  }
  markAsEdited()
}

function removeOtherProductFromEditLink(maHang) {
  const code = String(maHang || '').trim()
  if (!code || code === String(edit.value?.Ma_hang || '').trim()) return
  editLinkDraft.value.items = editLinkDraft.value.items.filter((it) => it.maHang !== code)
  markAsEdited()
}

function moveEditLinkItem(idx, delta) {
  const arr = editLinkDraft.value.items
  const dest = idx + delta
  if (dest < 0 || dest >= arr.length) return
  const next = [...arr]
  const [moved] = next.splice(idx, 1)
  next.splice(dest, 0, moved)
  editLinkDraft.value.items = next
  markAsEdited()
}

function buildNextProductGroupsFromEditLink() {
  const cleanItems = editLinkDraft.value.items
    .map((it) => ({
      maHang: String(it.maHang || '').trim(),
      shortLabel: String(it.shortLabel || '').trim(),
    }))
    .filter((it) => it.maHang)

  const currentCode = String(edit.value?.Ma_hang || '').trim()
  const targetGroupId = editLinkDraft.value.groupId || (currentCode ? `pg_${Date.now()}` : '')

  if (cleanItems.length < 2) {
    // Unlink current product from its old group (and keep remaining >= 2 items if any)
    return productGroupsList.value
      .map((g) => ({
        ...g,
        items: (g.items || []).filter((it) => it.maHang !== currentCode),
      }))
      .filter((g) => g.items.length >= 2)
  }

  const chosenSet = new Set(cleanItems.map((i) => i.maHang))
  const nextGroups = productGroupsList.value
    .filter((g) => g.id !== targetGroupId)
    .map((g) => ({
      ...g,
      items: (g.items || []).filter((it) => !chosenSet.has(it.maHang)),
    }))
    .filter((g) => g.items.length >= 2)

  nextGroups.push({
    id: targetGroupId,
    name:
      String(editLinkDraft.value.groupName || '').trim() ||
      String(edit.value?.i18n?.vi?.Ten_hang || edit.value?.Ten_hang || '').trim(),
    items: cleanItems,
  })
  return nextGroups
}

function closeProductGroupModal() {
  if (productGroupSaving.value) return
  showProductGroupModal.value = false
}

function selectNewProductGroupInModal() {
  productGroupState.value = {
    isCreatingNew: true,
    editingGroupId: '',
    name: '',
    items: [],
    search: '',
    categoryFilter: '',
  }
}

function selectExistingProductGroupInModal(groupId) {
  const grp = productGroupsList.value.find((g) => g.id === groupId)
  if (!grp) {
    selectNewProductGroupInModal()
    return
  }
  productGroupState.value = {
    isCreatingNew: false,
    editingGroupId: grp.id,
    name: grp.name || '',
    items: (grp.items || []).map((it) => ({
      maHang: String(it.maHang || '').trim(),
      shortLabel: String(it.shortLabel || '').trim(),
    })),
    search: '',
    categoryFilter: '',
  }
}

function toggleProductInGroupDraft(maHang) {
  const code = String(maHang || '').trim()
  if (!code) return
  const idx = productGroupState.value.items.findIndex((it) => it.maHang === code)
  if (idx >= 0) {
    productGroupState.value.items.splice(idx, 1)
  } else {
    productGroupState.value.items.push({ maHang: code, shortLabel: '' })
  }
}

function removeProductFromGroupDraft(maHang) {
  const code = String(maHang || '').trim()
  productGroupState.value.items = productGroupState.value.items.filter((it) => it.maHang !== code)
}

function moveProductGroupItem(idx, delta) {
  const arr = productGroupState.value.items
  const dest = idx + delta
  if (dest < 0 || dest >= arr.length) return
  const next = [...arr]
  const [moved] = next.splice(idx, 1)
  next.splice(dest, 0, moved)
  productGroupState.value.items = next
}

async function saveProductGroupModal() {
  if (productGroupState.value.items.length < 2) {
    showAlert('Vui lòng chọn ít nhất 2 sản phẩm để link thành nhóm', 'error')
    return
  }

  productGroupSaving.value = true
  try {
    const cleanItems = productGroupState.value.items.map((it) => ({
      maHang: String(it.maHang || '').trim(),
      shortLabel: String(it.shortLabel || '').trim(),
    }))
    const selectedCodes = new Set(cleanItems.map((i) => i.maHang))
    const resolvedName =
      String(productGroupState.value.name || '').trim() ||
      getProductNameByCode(cleanItems[0].maHang)

    const targetId = productGroupState.value.isCreatingNew
      ? `pg_${Date.now()}`
      : productGroupState.value.editingGroupId

    // Remove chosen codes from any other group so each product belongs cleanly to 1 group
    const nextGroups = productGroupsList.value
      .filter((g) => g.id !== targetId)
      .map((g) => ({
        ...g,
        items: (g.items || []).filter((it) => !selectedCodes.has(it.maHang)),
      }))
      .filter((g) => g.items.length >= 2)

    nextGroups.push({
      id: targetId,
      name: resolvedName,
      items: cleanItems,
    })

    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: { productGroups: nextGroups },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Lưu nhóm phân loại thất bại')
    }

    displayConfigState.value = {
      ...displayConfigState.value,
      productGroups: nextGroups,
    }
    selectExistingProductGroupInModal(targetId)
    showAlert(`Đã lưu nhóm phân loại "${resolvedName}"!`, 'success')
  } catch (err) {
    console.error('saveProductGroupModal error:', err)
    showAlert(err?.message || 'Không lưu được nhóm phân loại', 'error')
  } finally {
    productGroupSaving.value = false
  }
}

async function deleteProductGroupModal() {
  const targetId = productGroupState.value.editingGroupId
  if (!targetId) return
  if (!window.confirm('Xóa liên kết nhóm phân loại này?')) return

  productGroupSaving.value = true
  try {
    const nextGroups = productGroupsList.value.filter((g) => g.id !== targetId)
    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: { productGroups: nextGroups },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Xóa nhóm thất bại')
    }
    displayConfigState.value = {
      ...displayConfigState.value,
      productGroups: nextGroups,
    }
    const nextFirst = nextGroups[0]
    if (nextFirst) {
      selectExistingProductGroupInModal(nextFirst.id)
    } else {
      selectNewProductGroupInModal()
    }
    showAlert('Đã xóa nhóm phân loại sản phẩm', 'success')
  } catch (err) {
    console.error('deleteProductGroupModal error:', err)
    showAlert(err?.message || 'Không xóa được nhóm phân loại', 'error')
  } finally {
    productGroupSaving.value = false
  }
}

/* ===== BULK EDIT MODAL STATE ===== */
const showBulkEditModal = ref(false)
const bulkSaving = ref(false)
const createDefaultBulkForm = () => ({
  enableDanhMucCha: false,
  Danh_muc_cha: '',
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
    f.enableDanhMucCha ||
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
    const [json, cfgJson] = await Promise.all([
      getOneSheet('hang_hoa'),
      getOneSheet('display_config'),
    ])
    list.value = json.data || []
    displayConfigState.value = normalizeDisplayConfig(cfgJson?.data || [])
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
    edit.value.Danh_muc_cha = String(edit.value.i18n.vi?.Danh_muc_cha || '').trim()
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
  if (type === 'excel_all') exportKhoExcel('all')
  if (type === 'excel_current') exportKhoExcel('current')
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
    const uploadedUrl = await uploadImageToCloudinary(file, {
      targetKB: 100,
      maxWidth: 1200,
      maxHeight: 1200,
      folder: 'sakitchen/san-pham',
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

function removeMainImage() {
  if (!edit.value?.Main_img) return
  edit.value.Main_img = ''
  if (fileInput.value) fileInput.value.value = ''
  if (fileInputModal.value) fileInputModal.value.value = ''
  markAsEdited()
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

function exportKhoExcel(scope = 'all') {
  const rawByCode = new Map(
    (list.value || []).map((item) => [String(item?.Ma_hang || '').trim(), item]),
  )

  let targetProducts = []
  if (scope === 'current') {
    if (selected.value.length > 0) {
      const selSet = new Set(selected.value.map((c) => String(c || '').trim()))
      targetProducts = (list.value || []).filter((item) =>
        selSet.has(String(item?.Ma_hang || '').trim()),
      )
    } else {
      targetProducts = (ordered.value || []).map(
        (item) => rawByCode.get(String(item?.Ma_hang || '').trim()) || item,
      )
    }
  } else {
    targetProducts = list.value || []
  }

  if (!targetProducts.length) {
    showAlert('Không có sản phẩm nào để xuất Excel', 'error')
    return
  }

  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`
  const suffix = scope === 'current' ? (selected.value.length > 0 ? '-DA-CHON' : '-DANG-LOC') : ''
  const filename = `KHO-HANG-SA-KITCHEN-5LANG${suffix}-${stamp}.xlsx`

  exportProductsWorkbook({
    products: targetProducts,
    filename,
    sheetName: 'Hang_Hoa',
  })
  showAlert(`Đã xuất ${targetProducts.length} sản phẩm ra ${filename}`, 'success')
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
    Danh_muc_cha: i18n.vi.Danh_muc_cha || rawItem.Danh_muc_cha || '',
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
  hydrateEditLinkDraft(cloned)
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
    const linkChanged = hasEditLinkChanges()
    const tasks = [
      dispatchAction({
        action: 'updateHangHoa',
        data: payload,
      }).then((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Cập nhật thất bại')
        }
      }),
    ]

    if (linkChanged) {
      const nextGroups = buildNextProductGroupsFromEditLink()
      tasks.push(
        dispatchAction({
          action: 'saveDisplayConfig',
          data: { productGroups: nextGroups },
        }).then((res) => {
          if (!res?.success) {
            throw new Error(res?.message || 'Lưu link phân loại thất bại')
          }
          displayConfigState.value = {
            ...displayConfigState.value,
            productGroups: nextGroups,
          }
        }),
      )
    }

    await Promise.all(tasks)

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
  if (f.enableDanhMucCha) patch.Danh_muc_cha = String(f.Danh_muc_cha || '').trim()
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
  width: 100%;
  max-width: 1560px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(340px, 400px) minmax(0, 1fr);
  gap: 24px;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}

.modal-desc-settings-split {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
}

.modal-desc-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-desc-textarea {
  flex: 1;
  min-height: 118px;
  padding-top: 10px;
  padding-bottom: 10px;
  resize: vertical;
}

.modal-settings-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: space-between;
}

@media (max-width: 1120px) {
  .modal-body-grid {
    grid-template-columns: minmax(290px, 340px) minmax(0, 1fr);
    gap: 18px;
  }
  .modal-details-grid,
  .modal-desc-settings-split {
    grid-template-columns: 1fr;
  }
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
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(30, 41, 59, 0.5);
  border: 2px dashed rgba(148, 163, 184, 0.2);
}

.main-image-delete-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(15, 23, 42, 0.78);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.15s ease;
}

.main-image-delete-badge:hover:not(:disabled) {
  background: #ef4444;
  transform: scale(1.06);
}

.main-image-delete-badge:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.main-image-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.main-image-actions .btn-upload-image {
  flex: 1;
  width: auto;
  min-width: 0;
}

.btn-remove-image {
  height: 44px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.14);
  border: 2px solid rgba(239, 68, 68, 0.34);
  border-radius: 10px;
  color: #ef4444;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

.btn-remove-image:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.24);
  border-color: #ef4444;
}

.btn-remove-image:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* ===== DESKTOP MODAL (100% FULLSCREEN) ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  z-index: 1000;
  padding: 0;
}

.modal-container {
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  background: rgb(15, 23, 42);
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: none;
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
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-manage-parents {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.65);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.28));
  color: #86efac;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-manage-parents:hover {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
}

.btn-manage-product-groups {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.65);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(37, 99, 235, 0.28));
  color: #7dd3fc;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-manage-product-groups:hover {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: #ffffff;
}

.btn-manage-toppings {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(251, 191, 36, 0.65);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.26));
  color: #fcd34d;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-manage-toppings:hover {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #ffffff;
}

.tgm-title {
  color: #fcd34d;
}

.tgm-fullscreen-overlay {
  z-index: 12000;
}

.tgm-fullscreen-card {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  border-radius: 0 !important;
}

.tgm-fullscreen-card .flc-header-inner,
.tgm-fullscreen-card .flc-container,
.tgm-fullscreen-card .flc-footer-inner {
  max-width: 100% !important;
}

.tgm-fullscreen-card .link-pane.is-left {
  overflow-y: auto;
}

.tgm-fullscreen-card .link-pane.is-right {
  min-height: 0;
  overflow: hidden;
}

.tgm-fullscreen-card .tgm-picker-tabs,
.tgm-fullscreen-card .tgm-cat-box {
  flex-shrink: 0;
}

.edit-link-trigger-card.is-topping-card {
  margin-top: 8px;
  border-color: rgba(245, 158, 11, 0.35);
}

.elt-chip.is-topping-chip {
  background: rgba(245, 158, 11, 0.16);
  border-color: rgba(245, 158, 11, 0.38);
  color: #fbbf24;
}

.btn-link-group-inline.is-topping-btn {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.btn-link-group-inline.is-topping-btn:hover {
  background: #f59e0b;
  color: #0f172a;
}

.tgm-picker-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.tgm-picker-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.45);
  color: #cbd5e1;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.tgm-picker-tab.active {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.18);
  color: #fef3c7;
}

.tgm-step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.tgm-picker-tab.active .tgm-step-num {
  background: #f59e0b;
  color: #0f172a;
}

.tgm-tab-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 11px;
  line-height: 20px;
  text-align: center;
}

.tgm-jump-btn {
  border: 1px solid rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.12);
  color: #fcd34d;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.tgm-jump-btn.active {
  background: #f59e0b;
  color: #0f172a;
}

.tgm-mini-empty {
  padding: 12px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  color: #94a3b8;
  font-size: 12.5px;
  text-align: center;
}

.tgm-selected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
}

.tgm-target-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.tgm-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.tgm-chip.is-cat {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.45);
  color: #fde68a;
}

.tgm-chip.is-prod {
  background: rgba(56, 189, 248, 0.16);
  border: 1px solid rgba(56, 189, 248, 0.42);
  color: #bae6fd;
}

.tgm-chip button {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  opacity: 0.78;
}

.tgm-chip button:hover {
  opacity: 1;
}

.tgm-cat-box {
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.tgm-cat-box-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #fcd34d;
  margin-bottom: 8px;
}

.tgm-cat-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 112px;
  overflow-y: auto;
}

.tgm-cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.7);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
}

.tgm-cat-pill.active {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.22);
  color: #fef3c7;
}

.tgm-cat-cnt {
  font-size: 10.5px;
  opacity: 0.72;
}

.pgm-title {
  color: #7dd3fc;
}

.pgm-selected-wrap {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pgm-selected-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 200px;
  overflow-y: auto;
}

.pgm-selected-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(56, 189, 248, 0.28);
}

.pgm-move-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pgm-move-btn {
  width: 22px;
  height: 18px;
  padding: 0;
  border-radius: 5px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pgm-move-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pgm-sel-info {
  min-width: 0;
  flex: 1;
}

.pgm-sel-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pgm-sel-meta {
  font-size: 11px;
  color: #94a3b8;
}

.pgm-short-input {
  width: 195px;
  max-width: 44%;
  height: 32px;
  font-size: 12.5px;
  padding: 0 9px;
}

.pgm-remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pgm-remove-btn:hover {
  background: rgba(239, 68, 68, 0.28);
}

.edit-link-trigger-card {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 11px;
  background: rgba(14, 165, 233, 0.09);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.elt-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.elt-title-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  color: #7dd3fc;
  flex-wrap: wrap;
}

.elt-preview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.elt-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #e2e8f0;
}

.elt-chip.is-current {
  border-color: rgba(52, 211, 153, 0.55);
  color: #6ee7b7;
}

.btn-link-group-inline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 13px;
  border-radius: 9px;
  border: 1px solid rgba(56, 189, 248, 0.6);
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  transition: filter 0.15s ease;
}

.btn-link-group-inline:hover {
  filter: brightness(1.08);
}

/* ===== 100% FULLSCREEN PRODUCT LINK MODALS (2-COLUMN BALANCED WORKSPACE) ===== */
.bulk-modal-overlay.fullscreen-link-overlay {
  padding: 0;
  align-items: stretch;
  justify-content: stretch;
}

.bulk-modal-card.fullscreen-link-card {
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  border: none;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}

.flc-header {
  padding: 16px 24px;
  flex-shrink: 0;
}

.flc-header-inner,
.flc-container,
.flc-footer-inner {
  width: 100%;
  max-width: 1560px;
  margin: 0 auto;
}

.flc-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.flc-top-tabs-bar {
  padding: 12px 24px;
  background: rgba(15, 23, 42, 0.72);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  flex-shrink: 0;
}

.flc-top-tabs-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.flc-workspace-body {
  flex: 1;
  min-height: 0;
  padding: 20px 24px;
  overflow: hidden;
  display: flex;
}

.link-workspace-grid {
  display: grid;
  grid-template-columns: minmax(380px, 0.92fr) minmax(0, 1.38fr);
  gap: 20px;
  height: 100%;
  min-height: 0;
}

.link-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 16px;
}

.link-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.link-pane-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 800;
  color: #f8fafc;
}

.link-pane-title i {
  color: #38bdf8;
  font-size: 16px;
}

.link-pane-hint {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.flc-group-name-field {
  flex-shrink: 0;
}

.flc-cat-select {
  height: 36px;
  min-width: 170px;
  padding: 0 10px;
  font-size: 12.5px;
  background: rgba(15, 23, 42, 0.85);
}

.flc-search-input {
  height: 40px;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.72);
}

.link-selected-scroll,
.link-picker-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.link-selected-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-picker-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.link-pane-empty {
  flex: 1;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.25);
  color: #94a3b8;
  font-size: 13px;
}

.link-pane-empty i {
  font-size: 26px;
  opacity: 0.7;
}

.link-item-thumb {
  width: 44px;
  height: 44px;
  border-radius: 9px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.7);
}

.link-item-thumb.is-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 18px;
}

.flc-selected-card {
  padding: 10px;
  gap: 10px;
}

.flc-short-input {
  height: 32px;
  margin-top: 6px;
  padding: 0 10px;
  font-size: 12.5px;
  background: rgba(15, 23, 42, 0.72);
}

.flc-pick-card {
  align-items: center;
  padding: 10px;
  gap: 10px;
}

.flc-pick-price {
  color: #6ee7b7;
  font-weight: 700;
}

.flc-footer {
  padding: 16px 24px;
  flex-shrink: 0;
}

.flc-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 960px) {
  .flc-workspace-body {
    overflow-y: auto;
    padding: 14px;
  }
  .link-workspace-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
  .link-selected-scroll,
  .link-picker-scroll {
    max-height: 360px;
  }
}

.inline-link-section {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.28);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ils-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.ils-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  color: #7dd3fc;
}

.ils-badge {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: rgba(148, 163, 184, 0.16);
  color: #94a3b8;
}

.ils-badge.active {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(52, 211, 153, 0.4);
}

.ils-selected-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 185px;
  overflow-y: auto;
}

.ils-selected-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.ils-selected-row.is-current {
  border-color: rgba(52, 211, 153, 0.5);
  background: rgba(16, 185, 129, 0.1);
}

.ils-sel-info {
  min-width: 0;
  flex: 1;
}

.ils-sel-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ils-cur-tag {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
}

.ils-sel-meta {
  font-size: 11px;
  color: #94a3b8;
}

.ils-short-input {
  width: 170px;
  max-width: 44%;
  height: 30px;
  font-size: 12px;
  padding: 0 8px;
}

.ils-search-input {
  height: 34px;
  font-size: 12.5px;
}

.ils-empty {
  padding: 12px;
  text-align: center;
  font-size: 12.5px;
  color: #94a3b8;
}

.ils-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 7px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

.ils-pick-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 9px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.55);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.ils-pick-item input[type='checkbox'] {
  margin-top: 2px;
  accent-color: #38bdf8;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.ils-pick-item.checked {
  border-color: #38bdf8;
  background: rgba(14, 165, 233, 0.16);
}

.ils-pick-info {
  min-width: 0;
  flex: 1;
}

.ils-pick-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #f8fafc;
  word-break: break-word;
}

.ils-pick-meta {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.parent-cat-modal-card {
  max-width: 780px;
}

.pcm-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pcm-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pcm-section-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #cbd5e1;
}

.pcm-parent-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pcm-parent-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.85);
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pcm-parent-pill.is-new {
  border-color: rgba(52, 211, 153, 0.5);
  color: #6ee7b7;
}

.pcm-parent-pill.active {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #34d399;
  color: #ffffff;
}

.pcm-pill-count {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(15, 23, 42, 0.35);
}

.pcm-name-card {
  padding: 12px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.pcm-name-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
  gap: 10px;
}

.pcm-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pcm-field label {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
}

.pcm-sub-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.pcm-sub-title {
  font-size: 13px;
  font-weight: 800;
  color: #f8fafc;
}

.pcm-sub-actions {
  display: inline-flex;
  gap: 6px;
}

.pcm-mini-btn {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.85);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.pcm-mini-btn:hover {
  border-color: #34d399;
  color: #6ee7b7;
}

.pcm-sub-search {
  margin-bottom: 2px;
}

.pcm-empty {
  padding: 18px;
  text-align: center;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.45);
  color: #94a3b8;
  font-size: 13px;
}

.pcm-sub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
}

.pcm-sub-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(30, 41, 59, 0.65);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pcm-sub-item input[type='checkbox'] {
  margin-top: 2px;
  accent-color: #10b981;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.pcm-sub-item.checked {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.14);
}

.pcm-sub-item.other-parent {
  opacity: 0.82;
}

.pcm-sub-info {
  min-width: 0;
  flex: 1;
}

.pcm-sub-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  word-break: break-word;
}

.pcm-sub-meta {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 2px;
}

.pcm-other-badge {
  color: #fbbf24;
  font-weight: 600;
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

.bfb-btn-delete {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
}

.bfb-btn-delete:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.48);
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
    width: calc(100% - 20px);
    max-width: 480px;
    border-radius: 14px;
    padding: 10px 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .bfb-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
  }

  .bfb-btn {
    padding: 7px 11px;
    font-size: 12.5px;
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



