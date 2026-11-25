<template>
  <div class="page">
    

    <div
      ref="layoutGridRef"
      class="layout-grid"
      :class="{
        'is-left-collapsed': !isMobile && pcCollapsed.left,
        'is-center-collapsed': !isMobile && pcCollapsed.center,
        'is-right-collapsed': !isMobile && pcCollapsed.right,
        'is-resizing-cols': !isMobile && Boolean(resizingCol),
      }"
      :style="pcGridStyle"
    >

      <!-- MOBILE SUB-DOCK (ABOVE BOTTOM BAR) -->
      <div
        v-if="isMobile && showMobileEntryMenu"
        class="mobile-entry-backdrop"
        @click="showMobileEntryMenu = false"
      ></div>
      <div v-if="isMobile" class="mobile-tabs-header" :class="{ 'is-dock-down': isAdminDockHidden }">
        <button
          class="m-tab-item"
          :class="{ active: activeMobileTab === 'tabs' }"
          @click="setMobileTab('tabs')"
        >
          <i class="ri-stack-line"></i>
          <span class="m-tab-label">Tab</span>
          <span
            v-if="totalBellNotificationCount > 0 || invoiceTabs.length > 1"
            class="m-badge"
            :class="{ 'is-count': totalBellNotificationCount === 0 }"
          >{{ totalBellNotificationCount > 0 ? totalBellNotificationCount : invoiceTabs.length }}</span>
        </button>
        <div class="m-tab-item-wrapper" style="position: relative; flex: 1; min-width: 0;">
          <button 
            class="m-tab-item" 
            :class="{ active: activeMobileTab === 'entry' }"
            @click="handleEntryTabClick"
            style="width: 100%;"
          >
            <i class="ri-add-circle-line"></i> 
            <span class="m-tab-label" style="font-weight: bold;">
              Nhập
              <i
                v-if="activeMobileTab === 'entry'"
                :class="showMobileEntryMenu ? 'ri-arrow-down-s-fill' : 'ri-arrow-up-s-fill'"
                class="m-tab-caret"
              ></i>
            </span>
          </button>
          
          <!-- Drop-up Menu for Entry Mode -->
          <div v-if="showMobileEntryMenu" class="mobile-entry-dropdown">
            <div 
              class="me-dropdown-item" 
              :class="{ active: entryMode === 'catalog' }"
              @click="selectMobileEntryMode('catalog')"
            >
              <i class="ri-grid-fill"></i> Có sẵn
            </div>
            <div 
              class="me-dropdown-item" 
              :class="{ active: entryMode === 'manual' }"
              @click="selectMobileEntryMode('manual')"
            >
              <i class="ri-keyboard-box-line"></i> Thủ công
            </div>
          </div>
        </div>
        <button 
          class="m-tab-item" 
          :class="{ active: activeMobileTab === 'order' }"
          @click="setMobileTab('order')"
        >
          <i class="ri-file-list-3-line"></i>
          <span class="m-tab-label">Giỏ hàng</span>
          <span v-if="totalItemQty > 0" class="m-badge">{{ totalItemQty }}</span>
        </button>
        <button 
          class="m-tab-item" 
          :class="{ active: activeMobileTab === 'customer' }"
          @click="setMobileTab('customer')"
        >
          <i class="ri-user-heart-line"></i>
          <span class="m-tab-label">Khách</span>
        </button>
        <button 
          class="m-tab-item" 
          :class="{ active: activeMobileTab === 'payment' }"
          @click="setMobileTab('payment')"
        >
          <i class="ri-wallet-3-line"></i>
          <span class="m-tab-label">Thanh Toán</span>
        </button>
      </div>

      <div class="left-stack" v-show="!isMobile || activeMobileTab === 'entry'">
        <button
          v-if="!isMobile && pcCollapsed.left"
          type="button"
          class="pc-col-rail pc-col-rail--left"
          @click="pcCollapsed.left = false"
          title="Mở cột nhập hàng"
        >
          <i class="ri-arrow-right-double-line pc-rail-ico"></i>
          <span class="pc-rail-label">NHẬP HÀNG</span>
        </button>

        <div class="box entry-box" v-show="isMobile ? activeMobileTab === 'entry' : !pcCollapsed.left">

          <!-- HEADER REFACTORED: Unified Toolbar for Catalog Mode -->
          <!-- HEADER REFACTORED: Unified Toolbar for Catalog Mode -->
          <div class="entry-header" v-if="entryMode === 'catalog'" style="padding: 0; background: transparent; border: none; overflow: visible;">
             <div class="catalog-toolbar-unified" style="border-radius: 12px 12px 0 0; width: 100%;">
                
                <!-- === DESKTOP LAYOUT (Unchanged) === -->
                <template v-if="!isMobile">
                  <!-- Row 1: Buttons & Language -->
                  <div class="toolbar-section-title">
                    <div class="entry-mode-toggle">
                      <button class="mode-btn mode-btn-green active"> <i class="app-ico ri-grid-fill"></i> Có sẵn </button>
                      <button class="mode-btn mode-btn-blue" @click="entryMode = 'manual'"> <i class="app-ico ri-keyboard-box-line"></i> Thủ công </button>
                      
                      <div class="custom-select-wrapper header-lang-select" style="margin-left: 4px;">
                        <select v-model="selectedLang" class="custom-select custom-select-transparent">
                          <option v-for="opt in langOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </select>
                        <span class="lang-label-text">{{ currentLangLabel }}</span>
                        <img :src="currentLangFlagUrl" alt="Lang" class="lang-flag-img" />
                      </div>
                      <button
                        type="button"
                        class="pc-col-toggle-btn"
                        @click="pcCollapsed.left = true"
                        title="Thu gọn cột nhập hàng"
                      >
                        <i class="ri-arrow-left-double-line"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Row 2: Search & Filters -->
                  <div class="toolbar-row-2 pc-toolbar-row-2">
                    <!-- Search -->
                    <div class="search-box-unified pc-search-full" :class="{ 'has-query': Boolean(searchProduct && searchProduct.trim()) }">
                      <i class="app-ico ri-search-line search-icon"></i>
                      <input
                        ref="productSearchInputRef"
                        v-model="searchProduct"
                        type="text"
                        placeholder="Tìm tên (không dấu), mã, viết tắt, giá... (Enter thêm nhanh, 2x món)"
                        class="search-input-unified"
                        @keydown.enter.prevent="handleProductSearchEnter"
                        @keydown.esc="searchProduct = ''"
                      />
                      <button v-if="searchProduct" class="search-clear" @click="searchProduct = ''"> <i class="app-ico ri-close-line"></i> </button>
                    </div>

                    <!-- Filters -->
                    <div class="filter-item">
                      <div class="custom-select-wrapper">
                        <select v-model="selectedStockStatus" class="custom-select custom-select-cat">
                          <option value="all">Tất cả tình trạng</option>
                          <option value="in">Còn hàng</option>
                          <option value="out">Hết hàng</option>
                        </select>
                      </div>
                    </div>
                    <div class="filter-item">
                      <div class="custom-select-wrapper cat-filter-wrap">
                        <select v-model="selectedCategory" class="custom-select custom-select-cat">
                          <option value="">Danh mục</option>
                          <option v-for="cat in filteredCategories" :key="cat.value" :value="cat.value">
                            {{ cat.label }}
                          </option>
                        </select>
                        <i class="app-ico ri-list-check arrow-icon text-green-400"></i>
                      </div>
                    </div>
                    <div class="filter-item">
                      <div class="custom-select-wrapper">
                        <select v-model="selectedSize" class="custom-select custom-select-green">
                          <option value="">Size</option>
                          <option v-for="s in uniqueSizes" :key="s" :value="s"> {{ s }} </option>
                        </select>
                        <i class="app-ico ri-ruler-2-line arrow-icon text-green-400"></i>
                      </div>
                    </div>
                    <label class="filter-checkbox-btn filter-checkbox-yellow" :class="{ active: onlyPromotion }">
                      <input type="checkbox" v-model="onlyPromotion" class="chk-hidden" />
                      <i class="app-ico" :class="onlyPromotion ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"></i>
                      <span>Khuyến mãi</span>
                    </label>
                    <button v-if="hasActiveFilters" class="btn-reset-icon" @click="resetCatalogFilters" title="Reset bộ lọc">
                      <i class="app-ico ri-refresh-line"></i>
                    </button>
                  </div>

                  <!-- Row 3 (Desktop): View Mode Switcher (Chi tiết / Chọn nhanh) -->
                  <div class="nhd-catalog-view-row">
                    <div class="nhd-view-switcher" role="group" aria-label="Chế độ hiển thị sản phẩm">
                      <button
                        type="button"
                        class="nhd-vs-btn"
                        :class="{ active: catalogViewMode === 'card' }"
                        @click="setCatalogViewMode('card')"
                      >
                        <i class="ri-layout-grid-line"></i>
                        <span>Dạng Chi Tiết</span>
                      </button>
                      <button
                        type="button"
                        class="nhd-vs-btn"
                        :class="{ active: catalogViewMode === 'board' }"
                        @click="setCatalogViewMode('board')"
                      >
                        <i class="ri-flashlight-line"></i>
                        <span>Dạng Chọn Nhanh</span>
                      </button>
                    </div>
                    <span class="nhd-catalog-view-meta">
                      {{ filteredProducts.length }} món
                      <template v-if="catalogViewMode === 'board' && catalogBoardSections.length > 0">
                        · {{ catalogBoardSections.length }} nhóm
                      </template>
                    </span>
                  </div>
                </template>

                <!-- === MOBILE LAYOUT (New Requirement) === -->
                <template v-else>
                  <!-- Row 1: Search Box + Language -->
                  <div class="toolbar-section-title" style="gap: 8px;">
                     <!-- Search Box (Fill space) -->
                     <div class="search-box-unified" :class="{ 'has-query': Boolean(searchProduct && searchProduct.trim()) }" style="flex: 1; min-width: 0;">
                        <i class="app-ico ri-search-line search-icon"></i>
                        <input
                          ref="productSearchInputRef"
                          v-model="searchProduct"
                          type="text"
                          placeholder="Tìm món không dấu, mã, giá..."
                          class="search-input-unified"
                          @keydown.enter.prevent="handleProductSearchEnter"
                          @keydown.esc="searchProduct = ''"
                        />
                        <button v-if="searchProduct" class="search-clear" @click="searchProduct = ''"> <i class="app-ico ri-close-line"></i> </button>
                     </div>

                     <!-- Language Selector (Compact) -->
                     <div class="custom-select-wrapper header-lang-select" style="margin-left: 0; flex-shrink: 0; width: auto;">
                        <select v-model="selectedLang" class="custom-select custom-select-transparent">
                          <option v-for="opt in langOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </select>
                        <span class="lang-label-text">{{ currentLangLabel }}</span>
                        <img :src="currentLangFlagUrl" alt="Lang" class="lang-flag-img" />
                     </div>
                  </div>

                  <!-- Row 2: Filters -->
                  <div class="toolbar-row-2 scrollbar-hide mobile-filters-row" style="display: flex; flex-direction: row; flex-wrap: nowrap; width: 100%; align-items: center; gap: 6px; overflow-x: auto; overflow-y: hidden; white-space: nowrap; padding-top: 4px;">

                     <!-- Filters (Auto width + Padding) -->
                     <div class="filter-item" style="flex: 0 0 auto;">
                       <div class="custom-select-wrapper mobile-filter-wrap mobile-filter-stock">
                         <select v-model="selectedStockStatus" class="custom-select custom-select-cat mobile-filter-select">
                           <option value="all">Tất cả</option>
                           <option value="in">Còn hàng</option>
                           <option value="out">Hết hàng</option>
                         </select>
                       </div>
                     </div>
                     <div class="filter-item" style="flex: 0 0 auto;">
                       <div class="custom-select-wrapper cat-filter-wrap mobile-filter-wrap mobile-filter-cat">
                         <select v-model="selectedCategory" class="custom-select custom-select-cat mobile-filter-select">
                           <option value="">Danh mục</option>
                           <option v-for="cat in filteredCategories" :key="cat.value" :value="cat.value">
                             {{ cat.label }}
                           </option>
                         </select>
                         <i class="app-ico ri-list-check arrow-icon text-green-400 mobile-filter-icon"></i>
                       </div>
                     </div>
                     <div class="filter-item" style="flex: 0 0 auto;">
                       <div class="custom-select-wrapper mobile-filter-wrap mobile-filter-size">
                         <select v-model="selectedSize" class="custom-select custom-select-green mobile-filter-select">
                           <option value="">Size</option>
                           <option v-for="s in uniqueSizes" :key="s" :value="s"> {{ s }} </option>
                         </select>
                         <i class="app-ico ri-ruler-2-line arrow-icon text-green-400 mobile-filter-icon"></i>
                       </div>
                     </div>
                     <label class="filter-checkbox-btn filter-checkbox-yellow mobile-filter-checkbox" :class="{ active: onlyPromotion }" style="flex: 0 0 auto;">
                       <input type="checkbox" v-model="onlyPromotion" class="chk-hidden" />
                       <i class="app-ico" :class="onlyPromotion ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"></i>
                       <span>Sale</span>
                     </label>
                     <button v-if="hasActiveFilters" class="btn-reset-icon mobile-filter-reset" @click="resetCatalogFilters" style="flex: 0 0 auto;" title="Reset bộ lọc">
                       <i class="app-ico ri-refresh-line"></i>
                     </button>
                  </div>
                </template>

              </div>
          </div>

          <!-- HEADER FOR MANUAL MODE -->
          <div class="entry-header manual-entry-header" v-else>
             <div class="entry-mode-toggle">
                <template v-if="!isMobile">
                  <button class="mode-btn" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.1);" @click="entryMode = 'catalog'"> <i class="app-ico ri-grid-fill"></i> Có sẵn </button>
                  <button class="mode-btn" :class="{ 'active-manual': entryMode === 'manual' }" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.1);" @click="entryMode = 'manual'"> <i class="app-ico ri-keyboard-box-line"></i> Thủ công </button>
                  <button
                    type="button"
                    class="pc-col-toggle-btn"
                    @click="pcCollapsed.left = true"
                    title="Thu gọn cột nhập hàng"
                  >
                    <i class="ri-arrow-left-double-line"></i>
                  </button>
                </template>
             </div>
          </div>

          <div class="entry-body" :class="{ 'entry-body-manual': entryMode === 'manual' }">
            <div v-if="showMemberTargetBar" class="entry-member-target-bar">
              <span class="emtb-label">
                <i class="app-ico ri-user-shared-line"></i>
                Đang thêm cho:
              </span>
              <div class="emtb-pills">
                <button
                  v-for="m in invoiceOrderMembers"
                  :key="m.groupKey"
                  type="button"
                  class="emtb-pill"
                  :class="[
                    { active: activeTargetMemberKey === m.groupKey },
                    `role-${m.role}`,
                  ]"
                  @click="selectTargetMember(m.groupKey)"
                >
                  <i
                    class="app-ico"
                    :class="m.role === 'admin' ? 'ri-store-2-line' : 'ri-user-3-line'"
                  ></i>
                  <span>{{ m.name }}</span>
                  <span v-if="m.dupTag" class="omg-dup-tag">{{ m.dupTag }}</span>
                  <em v-if="m.badge" class="emtb-badge">{{ m.badge }}</em>
                </button>
                <button
                  type="button"
                  class="emtb-pill emtb-add-pill"
                  @click="openAddMemberModal"
                  title="Thêm người đặt mới vào đơn"
                >
                  <i class="app-ico ri-user-add-line"></i>
                  <span>Thêm người</span>
                </button>
              </div>
            </div>

            <template v-if="entryMode === 'catalog'">
              <!-- Mobile View Mode Switcher (Dạng Chi Tiết / Dạng Chọn Nhanh) -->
              <div v-if="isMobile" class="nhd-mobile-view-bar">
                <div class="nhd-view-switcher is-mobile-full" role="group" aria-label="Chế độ hiển thị sản phẩm">
                  <button
                    type="button"
                    class="nhd-vs-btn"
                    :class="{ active: catalogViewMode === 'card' }"
                    @click="setCatalogViewMode('card')"
                  >
                    <i class="ri-layout-grid-line"></i>
                    <span>Dạng Chi Tiết</span>
                  </button>
                  <button
                    type="button"
                    class="nhd-vs-btn"
                    :class="{ active: catalogViewMode === 'board' }"
                    @click="setCatalogViewMode('board')"
                  >
                    <i class="ri-flashlight-line"></i>
                    <span>Dạng Chọn Nhanh</span>
                  </button>
                </div>
              </div>

              <!-- Filters moved to header -->

              <div v-if="!isLoadingProducts && searchProduct && searchProduct.trim()" class="search-result-banner">
                <span class="srb-text">
                  <i class="ri-search-eye-line"></i>
                  Tìm thấy <strong>{{ filteredProducts.length }}</strong> món cho "<em>{{ parsedProductSearch.cleanQuery || searchProduct.trim() }}</em>"
                  <span v-if="parsedProductSearch.qty" class="srb-badge is-qty">
                    SL nhanh ×{{ parsedProductSearch.qty }} · Enter thêm
                  </span>
                  <span v-if="productSearchMeta.usedFuzzy" class="srb-badge is-fuzzy">
                    Kết quả gần đúng
                  </span>
                </span>
                <div class="srb-actions">
                  <button
                    v-if="globalProductSearchCount > filteredProducts.length"
                    type="button"
                    class="srb-global-btn"
                    @click="clearCatalogNonSearchFilters"
                  >
                    <i class="ri-apps-2-line"></i> Tìm toàn kho ({{ globalProductSearchCount }} món)
                  </button>
                  <button type="button" class="srb-clear" @click="searchProduct = ''">
                    <i class="ri-close-line"></i> Xóa tìm
                  </button>
                </div>
              </div>

              <div class="catalog-grid-section">
                <!-- SKELETON LOADING -->
                <div v-if="isLoadingProducts" class="product-grid">
                  <div v-for="n in 12" :key="n" class="product-card product-card-horizontal skeleton-card">
                    <div class="pc-media-horizontal skeleton-shimmer"></div>
                    <div class="pc-content-horizontal" style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                      <div class="skeleton-line width-80 skeleton-shimmer"></div>
                      <div class="skeleton-line width-60 skeleton-shimmer"></div>
                      <div class="skeleton-line width-40 skeleton-shimmer" style="margin-top: auto;"></div>
                    </div>
                  </div>
                </div>

                <!-- MODE 1: DẠNG CHI TIẾT (CARD GRID) -->
                <div v-else-if="catalogViewMode === 'card'" class="product-grid">
                <div
                  v-for="product in filteredProducts"
                  :key="product.Ma_hang"
                  class="product-card product-card-horizontal"
                  :class="[
                    { 'is-out': isOutOfStock(product) },
                    { 'is-flash': cardHighlight[product.Ma_hang] },
                    { 'is-search-match': Boolean(searchProduct && searchProduct.trim()) },
                    { 'is-mobile-in-cart': isMobile && getMobileCartQty(product) > 0 }
                  ]"
                  @click="onProductCardClick(product)"
                >
                  <!-- Area 1: Product Image (Left) -->
                  <div class="pc-media-horizontal">
                    <img 
                      v-if="cardImg(product)" 
                      :src="cardImg(product)" 
                      :alt="product.Ten_hang"
                      loading="lazy"
                      @error="onCardImgError(product)"
                    />
                    <div v-else class="no-img-placeholder">
                      <i class="app-ico ri-image-2-line"></i>
                    </div>
                    
                    <div v-if="product.Gia_Giam > 0" class="badge-sale">SALE</div>
                    <div v-if="isOutOfStock(product)" class="badge-out">Hết hàng</div>
                    <button
                      v-if="isMobile"
                      type="button"
                      class="mobile-detail-info-btn"
                      @click.stop="openProductDetail(product)"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết sản phẩm"
                    >
                      <i class="ri-information-line"></i>
                    </button>
                    <span
                      v-if="isMobile && getMobileCartQty(product) > 0"
                      class="mobile-cart-qty-badge"
                    >
                      ×{{ getMobileCartQty(product) }}
                    </span>
                  </div>

                  <!-- Right Content Wrapper (Areas 2-4) -->
                  <div class="pc-content-horizontal">
                    <!-- Area 2: Product Name -->
                    <div class="pc-name-horizontal" :title="product.Ten_hang">
                      <template v-for="(seg, sIdx) in getHighlightedSegments(product.Ten_hang, searchProduct)" :key="sIdx">
                        <mark v-if="seg.match" class="search-hl-mark">{{ seg.text }}</mark>
                        <template v-else>{{ seg.text }}</template>
                      </template>
                    </div>

                    <!-- Area 3: Price, Status, Quantity Row -->
                    <div class="pc-info-group">
                      <!-- Row 1: Price + Status -->
                      <div class="pc-price-stock-row">
                        <div class="pc-price-box-horizontal">
                          <span v-if="product.Gia_Giam > 0" class="price-sale">
                            {{ formatWithCurrency(product.Gia_Giam, product.Don_vi_tien_te) }}
                          </span>
                          <span :class="product.Gia_Giam > 0 ? 'price-old' : 'price-normal'">
                            {{ formatWithCurrency(product.Gia_ban, product.Don_vi_tien_te) }}
                          </span>
                        </div>
                        <div class="pc-stock-pill-horizontal" :class="getStockClass(product)">
                          <span class="stock-text">
                            {{ isOutOfStock(product) ? 'Hết hàng' : 'Còn hàng' }}
                          </span>
                        </div>
                      </div>

                      <!-- Row 2 (Desktop): Quantity Stepper & Note -->
                      <div v-if="!isMobile" class="qty-note-row">
                        <div class="qty-stepper-modern" @click.stop>
                          <button 
                            class="qty-btn-circle" 
                            @click="decreaseQty(product)"
                            :disabled="productQty[product.Ma_hang] <= 1 || isOutOfStock(product)"
                          >
                            <i class="ri-subtract-line"></i>
                          </button>
                          <input 
                            type="number" 
                            v-model.number="productQty[product.Ma_hang]"
                            min="1"
                            :disabled="isOutOfStock(product)"
                            class="qty-input-box"
                          />
                          <button 
                            class="qty-btn-circle" 
                            @click="increaseQty(product)"
                            :disabled="isOutOfStock(product)"
                          >
                            <i class="ri-add-line"></i>
                          </button>
                        </div>

                        <button
                          class="btn-note-text-green"
                          :class="{ 'has-note': productNotes[product.Ma_hang] }"
                          @click.stop="toggleNotePopover(product.Ma_hang)"
                          title="Ghi chú"
                        >
                          <i class="ri-file-edit-fill"></i>
                        </button>

                        <!-- Note Popover -->
                        <div
                          v-if="notePopoverOpen[product.Ma_hang]"
                          class="note-popover-horizontal"
                          @click.stop
                        >
                          <textarea
                            v-model="productNotes[product.Ma_hang]"
                            placeholder="Ghi chú..."
                            rows="2"
                          ></textarea>
                          <button class="note-save-horizontal" @click="toggleNotePopover(product.Ma_hang)">Lưu</button>
                        </div>
                      </div>
                    </div>

                    <!-- Area 4 (Desktop): Action Buttons -->
                    <div v-if="!isMobile" class="pc-actions-horizontal" @click.stop>
                      <button 
                        class="btn-add-green" 
                        :class="{ 'btn-added-success': addedSuccess[product.Ma_hang] }"
                        @click="addProductToCart(product)"
                        :disabled="isOutOfStock(product)"
                      >
                        <template v-if="addedSuccess[product.Ma_hang]">
                           <i class="app-ico ri-check-line"></i>
                           <span>Đã thêm</span>
                        </template>
                        <template v-else>
                           <i class="app-ico ri-shopping-cart-2-fill"></i>
                           <span>Thêm hàng</span>
                        </template>
                      </button>
                    </div>

                    <!-- Area 4 (Mobile): Instant 1-tap add & live quantity stepper (no confirmation button) -->
                    <div v-else class="mobile-quick-add-row" @click.stop>
                      <div v-if="getMobileCartQty(product) > 0" class="mobile-live-stepper">
                        <button
                          type="button"
                          class="qty-btn-circle mobile-qty-minus"
                          @click="adjustMobileCartQty(product, -1)"
                          aria-label="Giảm số lượng"
                        >
                          <i class="ri-subtract-line"></i>
                        </button>
                        <input
                          type="number"
                          min="0"
                          :value="getMobileCartQty(product)"
                          @change="setMobileCartQty(product, $event.target.value)"
                          class="qty-input-box mobile-live-qty-input"
                          aria-label="Số lượng đã thêm"
                        />
                        <button
                          type="button"
                          class="qty-btn-circle"
                          @click="adjustMobileCartQty(product, 1)"
                          :disabled="isOutOfStock(product)"
                          aria-label="Tăng số lượng"
                        >
                          <i class="ri-add-line"></i>
                        </button>
                      </div>
                      <button
                        v-else
                        type="button"
                        class="mobile-tap-add-btn"
                        :disabled="isOutOfStock(product)"
                        @click="adjustMobileCartQty(product, 1)"
                      >
                        <i class="ri-add-line"></i>
                        <span>{{ isOutOfStock(product) ? 'Hết hàng' : 'Nhấn để thêm' }}</span>
                      </button>

                      <span v-if="getMobileCartQty(product) > 0" class="mobile-added-pill">
                        Đã thêm {{ getMobileCartQty(product) }}
                      </span>

                      <button
                        type="button"
                        class="btn-note-text-green"
                        :class="{ 'has-note': productNotes[product.Ma_hang] }"
                        @click.stop="toggleNotePopover(product.Ma_hang)"
                        title="Ghi chú"
                      >
                        <i class="ri-file-edit-fill"></i>
                      </button>

                      <div
                        v-if="notePopoverOpen[product.Ma_hang]"
                        class="note-popover-horizontal"
                        @click.stop
                      >
                        <textarea
                          v-model="productNotes[product.Ma_hang]"
                          placeholder="Ghi chú..."
                          rows="2"
                        ></textarea>
                        <button class="note-save-horizontal" @click="saveMobileProductNote(product)">Lưu</button>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                <!-- MODE 2: DẠNG CHỌN NHANH (MENU BOARD THEO DANH MỤC) -->
                <div
                  v-else-if="catalogViewMode === 'board' && catalogBoardSections.length > 0"
                  class="nhd-menu-board"
                >
                  <section
                    v-for="sec in catalogBoardSections"
                    :key="sec.key"
                    class="nhd-mb-section"
                  >
                    <header
                      class="nhd-mb-sec-header"
                      :class="{
                        'has-thumbs': sec.thumbs.length > 0,
                        'is-filtered': Boolean(selectedCategory && selectedCategory === sec.subLabel),
                      }"
                      :title="
                        selectedCategory && selectedCategory === sec.subLabel
                          ? 'Bấm để hiện lại tất cả danh mục'
                          : 'Bấm để lọc riêng danh mục này'
                      "
                      @click="onBoardSectionHeaderClick(sec)"
                    >
                      <div v-if="!isMobile && sec.thumbs.length" class="nhd-mb-sec-thumbs is-left" aria-hidden="true">
                        <img
                          v-for="(thumb, tIdx) in sec.thumbs.slice(0, 2)"
                          :key="'nhd-mb-tl-' + sec.key + '-' + tIdx"
                          :src="thumb"
                          width="34"
                          height="34"
                          loading="lazy"
                          decoding="async"
                          class="nhd-mb-sec-thumb"
                          alt=""
                        />
                      </div>

                      <div class="nhd-mb-sec-title-wrap">
                        <div v-if="isMobile && sec.thumbs.length" class="nhd-mb-sec-thumbs is-mobile-cluster" aria-hidden="true">
                          <img
                            v-for="(thumb, tIdx) in sec.thumbs.slice(0, 3)"
                            :key="'nhd-mb-tm-' + sec.key + '-' + tIdx"
                            :src="thumb"
                            width="30"
                            height="30"
                            loading="lazy"
                            decoding="async"
                            class="nhd-mb-sec-thumb"
                            alt=""
                          />
                        </div>

                        <div class="nhd-mb-sec-title-texts">
                          <span v-if="sec.parentTag" class="nhd-mb-sec-parent">{{ sec.parentTag }}</span>
                          <h4 class="nhd-mb-sec-title">{{ sec.title }}</h4>
                        </div>

                        <span class="nhd-mb-sec-count">{{ sec.items.length }}</span>
                        <span
                          v-if="selectedCategory && selectedCategory === sec.subLabel"
                          class="nhd-mb-sec-clear"
                        >
                          <i class="ri-close-line"></i>
                        </span>
                      </div>

                      <div v-if="!isMobile && sec.thumbs.length > 2" class="nhd-mb-sec-thumbs is-right" aria-hidden="true">
                        <img
                          v-for="(thumb, tIdx) in sec.thumbs.slice(2, 4)"
                          :key="'nhd-mb-tr-' + sec.key + '-' + tIdx"
                          :src="thumb"
                          width="34"
                          height="34"
                          loading="lazy"
                          decoding="async"
                          class="nhd-mb-sec-thumb"
                          alt=""
                        />
                      </div>
                    </header>

                    <div
                      class="nhd-mb-items-grid"
                      :class="{ 'is-single-col': sec.items.length === 1 }"
                    >
                      <div
                        v-for="item in sec.items"
                        :key="'nhd-mb-item-' + item.Ma_hang"
                        class="nhd-mb-row"
                        :class="{
                          'is-out': isOutOfStock(item),
                          'is-in-cart': getCatalogCartQty(item) > 0,
                          'is-flash': cardHighlight[item.Ma_hang],
                        }"
                        @click="openProductDetail(item)"
                      >
                        <div class="nhd-mb-name-wrap">
                          <span class="nhd-mb-name">
                            <template v-if="searchProduct && searchProduct.trim()">
                              <template
                                v-for="(seg, sIdx) in getHighlightedSegments(item.Ten_hang, searchProduct)"
                                :key="sIdx"
                              >
                                <mark v-if="seg.match" class="search-hl-mark">{{ seg.text }}</mark>
                                <template v-else>{{ seg.text }}</template>
                              </template>
                            </template>
                            <template v-else>{{ item.Ten_hang }}</template>
                          </span>

                          <span v-if="item.Size" class="nhd-mb-size-tag">{{ item.Size }}</span>

                          <span v-if="getBoardDiscountPercent(item) > 0" class="nhd-mb-sale-tag">
                            -{{ getBoardDiscountPercent(item) }}%
                          </span>

                          <span v-if="isOutOfStock(item)" class="nhd-mb-out-tag">
                            Hết hàng
                          </span>

                          <span
                            v-else-if="getBoardProductBadge(item)"
                            class="nhd-mb-item-badge"
                            :class="[
                              `is-group-${getBoardProductBadge(item).group}`,
                              `is-shape-${getBoardProductBadge(item).shape}`,
                            ]"
                          >
                            <span class="nhd-mb-item-badge-inner">
                              <i :class="getBoardProductBadge(item).icon"></i>
                              <span>{{ getBoardProductBadge(item).label }}</span>
                            </span>
                          </span>

                          <span
                            v-if="getCatalogCartQty(item) > 0"
                            class="nhd-mb-incart-pill"
                            :class="{ 'is-pop': addedSuccess[item.Ma_hang] }"
                          >
                            ×{{ getCatalogCartQty(item) }}
                          </span>
                        </div>

                        <span class="nhd-mb-leader" aria-hidden="true"></span>

                        <div class="nhd-mb-right">
                          <div class="nhd-mb-price-wrap">
                            <span v-if="Number(item.Gia_Giam || 0) > 0" class="nhd-mb-old-price">
                              {{ formatWithCurrency(item.Gia_ban, item.Don_vi_tien_te) }}
                            </span>
                            <div class="nhd-mb-price-line">
                              <strong class="nhd-mb-price" :class="{ 'is-sale': Number(item.Gia_Giam || 0) > 0 }">
                                {{
                                  formatWithCurrency(
                                    Number(item.Gia_Giam || 0) > 0 ? item.Gia_Giam : item.Gia_ban,
                                    item.Don_vi_tien_te,
                                  )
                                }}
                              </strong>
                              <span v-if="item.Dvt" class="nhd-mb-unit">/{{ item.Dvt }}</span>
                            </div>
                          </div>

                          <div v-if="getCatalogCartQty(item) > 0" class="nhd-mb-stepper" @click.stop>
                            <button
                              type="button"
                              class="nhd-mb-step-btn is-minus"
                              title="Giảm 1"
                              aria-label="Giảm số lượng"
                              @click="quickAdjustBoardQty(item, -1)"
                            >
                              <i class="ri-subtract-line"></i>
                            </button>
                            <span class="nhd-mb-step-qty">{{ getCatalogCartQty(item) }}</span>
                            <button
                              type="button"
                              class="nhd-mb-step-btn is-plus"
                              :class="{ added: addedSuccess[item.Ma_hang] }"
                              :disabled="isOutOfStock(item)"
                              title="Thêm 1"
                              aria-label="Tăng số lượng"
                              @click="quickAdjustBoardQty(item, 1)"
                            >
                              <i class="ri-add-line"></i>
                            </button>
                          </div>

                          <button
                            v-else
                            type="button"
                            class="nhd-mb-add-btn"
                            :class="{ added: addedSuccess[item.Ma_hang] }"
                            :disabled="isOutOfStock(item)"
                            :title="isOutOfStock(item) ? 'Hết hàng' : 'Thêm nhanh +1'"
                            :aria-label="'Thêm ' + item.Ten_hang"
                            @click.stop="quickAdjustBoardQty(item, 1)"
                          >
                            <i v-if="addedSuccess[item.Ma_hang]" class="ri-check-line"></i>
                            <i v-else class="ri-add-line"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div v-if="filteredProducts.length === 0" class="no-products">
                <div>Không tìm thấy sản phẩm phù hợp</div>
                <div v-if="searchProduct && searchProduct.trim()" class="no-products-actions">
                  <button
                    v-if="globalProductSearchCount > 0"
                    type="button"
                    class="srb-global-btn"
                    @click="clearCatalogNonSearchFilters"
                  >
                    <i class="ri-apps-2-line"></i> Tìm trên toàn bộ kho ({{ globalProductSearchCount }} món)
                  </button>
                  <button type="button" class="srb-clear" @click="searchProduct = ''">
                    <i class="ri-close-line"></i> Xóa từ khóa
                  </button>
                </div>
              </div>

              <!-- View Toggle -->

              <div v-if="totalPages > 1" class="pagination">
                <button 
                  class="page-btn" 
                  @click="currentPage = 1"
                  :disabled="currentPage === 1"
                >
                  <i class="app-ico ri-arrow-left-double-line"></i>
                </button>
                <button 
                  class="page-btn" 
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                >
                  <i class="app-ico ri-arrow-left-s-line"></i>
                </button>
                
                <span class="page-info">
                  Trang {{ currentPage }} / {{ totalPages }}
                </span>
                
                <button 
                  class="page-btn" 
                  @click="currentPage++"
                  :disabled="currentPage === totalPages"
                >
                  <i class="app-ico ri-arrow-right-s-line"></i>
                </button>
                <button 
                  class="page-btn" 
                  @click="currentPage = totalPages"
                  :disabled="currentPage === totalPages"
                >
                  <i class="app-ico ri-arrow-right-double-line"></i>
                </button>
              </div>
            </template>

            <template v-else>
              <div class="manual-mobile-block-parent scroller-hide">
                <div class="manual-content premium-mode-v4">
                  <!-- HIDDEN BINDINGS (Keep for logic) -->
                  <div style="display:none">
                    <input v-model="form.maHang" />
                  </div>

                  <!-- UNIFIED PRODUCT CARD -->
                  <div class="mv4-card">
                    <!-- Header -->
                    <div class="mv4-header">
                       <div class="mv4-header-left">
                          <i class="ri-box-3-line"></i>
                          <div class="mv4-header-titles">
                            <span>Nhập hàng thủ công</span>
                            <span
                              v-if="isManualMatchedInDb"
                              class="mv4-db-badge is-existing"
                              :title="`Khớp sản phẩm trong kho: ${form.maHang}`"
                            >
                              Kho: #{{ form.maHang }}
                            </span>
                            <span v-else-if="form.tenHang && form.tenHang.trim()" class="mv4-db-badge is-new">
                              Mặt hàng mới
                            </span>
                          </div>
                       </div>
                       <button v-if="hasProductData" @click="xoaHang" class="mv4-btn-clear" title="Làm mới form">
                          <i class="ri-refresh-line"></i>
                       </button>
                    </div>

                    <!-- NHÓM 1: THÔNG TIN SẢN PHẨM -->
                    <div class="mv4-section">
                      <div class="mv4-field">
                         <label>Tên sản phẩm <span class="req">*</span></label>
                         <div class="mv4-input-hero">
                            <input 
                               v-model="form.tenHang" 
                               list="ds-hang-ten" 
                               placeholder="Nhập tên mới hoặc chọn từ kho..." 
                            />
                            <button 
                               v-if="form.tenHang || form.maHang" 
                               type="button"
                               class="btn-delete-cta"
                               @click="resetItem"
                               title="Xóa hàng đang chọn"
                            >
                               XÓA
                            </button>
                            <datalist id="ds-hang-ten">
                               <option v-for="h in hangHoaList" :key="h.Ma_hang" :value="h.Ten_hang">{{ h.Ten_hang }}</option>
                            </datalist>
                         </div>
                      </div>

                      <div class="mv4-meta-grid">
                         <div class="mv4-field">
                            <label>Danh mục</label>
                            <input v-model="form.danhMuc" list="ds-danhmuc" placeholder="VD: Đồ ăn..." />
                            <datalist id="ds-danhmuc"><option v-for="d in uniqueDanhMucs" :key="d" :value="d">{{ d }}</option></datalist>
                         </div>
                         <div class="mv4-field">
                            <label>Size</label>
                            <input v-model="form.size" list="ds-size" placeholder="VD: L, M..." />
                            <datalist id="ds-size"><option v-for="s in uniqueSizes" :key="s" :value="s">{{ s }}</option></datalist>
                         </div>
                         <div class="mv4-field">
                            <label>Đơn vị tính</label>
                            <input v-model="form.dvt" list="ds-dvt" placeholder="Phần, Ly..." />
                            <datalist id="ds-dvt"><option v-for="u in uniqueDvts" :key="u" :value="u">{{ u }}</option></datalist>
                         </div>
                      </div>

                      <div class="mv4-pair-grid">
                         <div class="mv4-field">
                            <label>Đơn vị tiền tệ</label>
                            <input v-model="form.donViTienTe" placeholder="P / VND" />
                         </div>
                         <div class="mv4-field">
                            <label>Ngôn ngữ</label>
                            <select v-model="form.lang">
                              <option value="vi">🇻🇳 Việt Nam</option>
                              <option value="en">🇬🇧 English</option>
                              <option value="zh-CN">🇨🇳 Trung Quốc</option>
                              <option value="tl">🇵🇭 Philippines</option>
                              <option value="ko">🇰🇷 Hàn Quốc</option>
                            </select>
                         </div>
                      </div>
                    </div>

                    <!-- NHÓM 2: ĐỊNH GIÁ -->
                    <div class="mv4-section is-pricing">
                      <div class="mv4-section-head">
                        <span><i class="ri-price-tag-3-line"></i> Định giá</span>
                        <span v-if="manualLinePreview > 0" class="mv4-preview-chip">
                          Tạm tính: {{ formatWithCurrency(manualLinePreview, form.donViTienTe || 'P') }}
                        </span>
                      </div>

                      <div class="mv4-price-grid">
                         <div class="mv4-field highlight">
                            <label>Giá bán</label>
                            <div class="mv4-input-price">
                               <input type="number" v-model.number="form.giaBan" placeholder="0" />
                               <span class="currency">{{ form.donViTienTe || 'P' }}</span>
                            </div>
                         </div>
                         <div class="mv4-field">
                            <label>Giá vốn</label>
                            <div class="mv4-input-price">
                               <input type="number" v-model.number="form.giaGoc" placeholder="0" />
                               <span class="currency">{{ form.donViTienTe || 'P' }}</span>
                            </div>
                         </div>
                         <div class="mv4-field">
                            <label>Giảm giá / SP</label>
                            <div class="mv4-input-price danger">
                               <input type="number" v-model.number="form.giamGia" placeholder="0" />
                               <span class="currency">{{ form.donViTienTe || 'P' }}</span>
                            </div>
                         </div>
                      </div>
                      <div class="mv4-field" style="margin-top: 8px;">
                         <label>CK NCC (% giá gốc hoặc Tiền trực tiếp)</label>
                         <div class="ncc-inline-control">
                            <div class="ncc-type-toggle" role="group">
                               <button
                                 type="button"
                                 class="ncc-type-btn"
                                 :class="{ active: form.nccLoaiGiam !== 'money' }"
                                 @click="form.nccLoaiGiam = 'percent'"
                               >
                                 %
                               </button>
                               <button
                                 type="button"
                                 class="ncc-type-btn"
                                 :class="{ active: form.nccLoaiGiam === 'money' }"
                                 @click="form.nccLoaiGiam = 'money'"
                               >
                                 Tiền ({{ form.donViTienTe || 'P' }})
                               </button>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              v-model.number="form.nccGiaTriGiam"
                              placeholder="0"
                              class="ncc-inline-input"
                            />
                         </div>
                      </div>
                    </div>

                    <!-- NHÓM 3: GHI CHÚ & SỐ LƯỢNG -->
                    <div class="mv4-section">
                      <div class="mv4-field">
                         <label>Ghi chú hàng hóa</label>
                         <input v-model="form.ghiChuHang" placeholder="VD: Ít đường, để riêng sốt..." />
                      </div>

                      <div class="mv4-row-qty-bar">
                         <div class="mv4-qty-section">
                            <label>Số lượng</label>
                            <div class="mv4-qty-stepper">
                               <button type="button" @click="form.soLuong > 1 ? form.soLuong-- : null" :disabled="form.soLuong <= 1">
                                  <i class="ri-subtract-line"></i>
                               </button>
                               <input type="number" v-model.number="form.soLuong" min="1" />
                               <button type="button" @click="form.soLuong++">
                                  <i class="ri-add-line"></i>
                               </button>
                            </div>
                         </div>
                         <div class="mv4-stock-badge" :class="stockColorClass">
                            <i :class="isManualOutOfStock ? 'ri-close-circle-line' : 'ri-checkbox-circle-line'"></i>
                            <span><strong>{{ isManualOutOfStock ? 'Hết hàng' : 'Còn hàng' }}</strong></span>
                         </div>
                      </div>
                    </div>

                    <!-- ACTION FOOTER + OPTION POPOVER -->
                    <div ref="manualAddWrapRef" class="mv4-action-wrap">
                      <div
                        v-if="showManualAddOptions"
                        class="mv4-add-options-popover"
                        @click.stop
                      >
                        <div class="mv4-opt-head">
                          <span>Chọn cách thêm "{{ (form.tenHang || '').trim() }}"</span>
                          <button
                            type="button"
                            class="mv4-opt-close"
                            :disabled="isSavingManualToDb"
                            @click="showManualAddOptions = false"
                          >
                            <i class="ri-close-line"></i>
                          </button>
                        </div>

                        <button
                          type="button"
                          class="mv4-opt-btn is-order-only"
                          :disabled="isSavingManualToDb"
                          @click="manualAddOrderOnly"
                        >
                          <i class="ri-shopping-cart-2-line"></i>
                          <div class="mv4-opt-text">
                            <strong>Chỉ thêm vào đơn</strong>
                            <span>Chỉ thêm vào hóa đơn hiện tại, không lưu vào kho hàng</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          class="mv4-opt-btn is-save-db"
                          :disabled="isSavingManualToDb"
                          @click="manualAddAndSaveToDb"
                        >
                          <span v-if="isSavingManualToDb" class="btn-spinner" aria-hidden="true"></span>
                          <i v-else class="ri-database-2-line"></i>
                          <div class="mv4-opt-text">
                            <strong>{{ isManualMatchedInDb ? 'Thêm vào đơn & Cập nhật DB' : 'Thêm vào đơn & Lưu vào DB' }}</strong>
                            <span>
                              {{
                                isManualMatchedInDb
                                  ? 'Cập nhật thông tin sản phẩm vào kho (hang_hoa) và thêm vào đơn'
                                  : 'Lưu thành sản phẩm mới trong kho (hang_hoa) và thêm vào đơn'
                              }}
                            </span>
                          </div>
                        </button>
                      </div>

                      <button 
                        type="button"
                        class="mv4-btn-add-simple" 
                        :class="{ 
                          'success': addedSuccessManual,
                          'is-disabled-stock': hasProductData && isManualOutOfStock,
                          'is-options-open': showManualAddOptions
                        }"
                        :disabled="(hasProductData && isManualOutOfStock) || isSavingManualToDb"
                        @click.stop="handleManualAddClick"
                      >
                        <template v-if="isSavingManualToDb">
                          <span class="btn-spinner" aria-hidden="true"></span>
                          <span>ĐANG LƯU VÀO DB...</span>
                        </template>
                        <template v-else-if="addedSuccessManual">
                          <i class="ri-check-line"></i>
                          <span>ĐÃ THÊM</span>
                        </template>
                        <template v-else-if="hasProductData && isManualOutOfStock">
                          <i class="ri-prohibited-line"></i>
                          <span>HẾT HÀNG</span>
                        </template>
                        <template v-else>
                          <i class="ri-add-circle-fill"></i>
                          <span>THÊM VÀO ĐƠN</span>
                          <i :class="showManualAddOptions ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'" class="mv4-btn-caret"></i>
                        </template>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div
        v-if="!isMobile"
        class="pc-col-resizer"
        :class="{
          active: resizingCol === 'left',
          disabled: pcCollapsed.left || pcCollapsed.center,
        }"
        title="Kéo để chỉnh độ rộng cột • Double-click để đặt lại mặc định"
        @mousedown.prevent="startPcColResize('left', $event)"
        @dblclick="resetPcColWidths"
      >
        <span class="pc-resizer-grip"></span>
      </div>

      <div class="center-stack" v-show="!isMobile || activeMobileTab === 'order' || activeMobileTab === 'tabs'">
        <button
          v-if="!isMobile && pcCollapsed.center"
          type="button"
          class="pc-col-rail pc-col-rail--center"
          @click="pcCollapsed.center = false"
          title="Mở bảng đơn hàng"
        >
          <i class="ri-expand-left-right-line pc-rail-ico"></i>
          <span class="pc-rail-label">ĐƠN HÀNG</span>
          <span v-if="totalItemQty > 0" class="pc-rail-badge">{{ totalItemQty }}</span>
        </button>

        <!-- MULTI-ORDER TABS RAIL (PC: CỘT DỌC GIỮA KHO HÀNG & BẢNG ĐƠN | MOBILE: TAB CHỌN ĐƠN RIÊNG) -->
        <div
          v-show="isMobile ? activeMobileTab === 'tabs' : !pcCollapsed.center"
          class="invoice-tabs-bar"
          :class="{
            'is-pc-vertical': !isMobile,
            'is-mobile-tabs-panel': isMobile,
            'is-rail-collapsed': !isMobile && pcTabRailCollapsed,
          }"
          :style="!isMobile && !pcTabRailCollapsed && pcColWidths.tabRail ? { width: pcColWidths.tabRail + 'px' } : undefined"
        >
          <div
            v-if="isMobile || !pcTabRailCollapsed"
            class="itb-source-filter"
            role="tablist"
            aria-label="Lọc loại tab đơn"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="tabSourceFilter === 'all'"
              class="itb-filter-btn"
              :class="{ active: tabSourceFilter === 'all' }"
              @click="tabSourceFilter = 'all'"
            >
              <span>Tất cả</span>
              <span class="itb-fcount">{{ invoiceTabs.length }}</span>
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="tabSourceFilter === 'web'"
              class="itb-filter-btn is-web"
              :class="{ active: tabSourceFilter === 'web' }"
              @click="tabSourceFilter = 'web'"
            >
              <span>Đơn web</span>
              <span class="itb-fcount">{{ webInvoiceTabsCount }}</span>
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="tabSourceFilter === 'admin'"
              class="itb-filter-btn is-admin"
              :class="{ active: tabSourceFilter === 'admin' }"
              @click="tabSourceFilter = 'admin'"
            >
              <span>Đơn admin</span>
              <span class="itb-fcount">{{ adminInvoiceTabsCount }}</span>
            </button>
          </div>
          <div v-if="isMobile || !pcTabRailCollapsed" class="itb-search-wrap">
            <i class="ri-search-line itb-search-icon"></i>
            <input
              v-model="tabSearchQuery"
              type="text"
              class="itb-search-input"
              placeholder="Tìm tên, SĐT, địa chỉ, món, tiền..."
              aria-label="Tìm kiếm tab đơn hàng"
            />
            <button
              v-if="tabSearchQuery"
              type="button"
              class="itb-search-clear"
              title="Xóa tìm kiếm"
              @click="tabSearchQuery = ''"
            >
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="invoice-tabs-scroll">
            <div v-if="!filteredInvoiceTabEntries.length" class="itb-filter-empty">
              {{
                tabSearchQuery.trim()
                  ? `Không thấy tab khớp "${tabSearchQuery.trim()}".`
                  : tabSourceFilter === 'web'
                    ? 'Chưa có tab đơn web nào.'
                    : 'Chưa có tab đơn admin nào.'
              }}
            </div>
            <button
              v-for="entry in filteredInvoiceTabEntries"
              :key="entry.tab.id"
              type="button"
              class="invoice-tab-pill"
              :class="[
                {
                  active: entry.tab.id === activeInvoiceTabId,
                  'is-approved': Boolean(entry.tab.sourceOrderId || entry.tab.adminOrderStatus),
                  'is-search-match': Boolean(tabSearchQuery.trim()),
                },
                getTabLiveStatus(entry.tab) ? getTabStatusClass(getTabLiveStatus(entry.tab)) : '',
              ]"
              :title="getTabDisplayTitle(entry.tab, entry.idx)"
              @click="handleInvoiceTabSelect(entry.tab.id)"
            >
              <span v-if="!isMobile && pcTabRailCollapsed" class="itp-compact-idx">
                {{ entry.idx + 1 }}
              </span>
              <span class="itp-dot"></span>
              <div v-if="isMobile || !pcTabRailCollapsed" class="itp-top-line">
                <span class="itp-title">
                  <template
                    v-for="(seg, sIdx) in getHighlightedSegments(getTabDisplayTitle(entry.tab, entry.idx), tabSearchQuery)"
                    :key="sIdx"
                  >
                    <mark v-if="seg.match" class="search-hl-mark">{{ seg.text }}</mark>
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </span>
                <span
                  v-if="
                    invoiceTabs.length > 1 ||
                    getTabItemQty(entry.tab) > 0 ||
                    entry.tab.sourceOrderId ||
                    entry.tab.adminOrderStatus ||
                    entry.tab.customer?.tenKhachHang
                  "
                  class="itp-close"
                  title="Đóng tab"
                  @click.stop="requestCloseInvoiceTab(entry.tab.id)"
                >
                  <i class="ri-close-line"></i>
                </span>
              </div>
              <div
                v-if="(getTabLiveStatus(entry.tab) || entry.tab.pendingWebUpdate?.changes?.length) && (isMobile || !pcTabRailCollapsed)"
                class="itp-sub-line"
              >
                <span
                  v-if="getTabLiveStatus(entry.tab)"
                  class="itp-status-tag"
                  :class="getTabStatusClass(getTabLiveStatus(entry.tab))"
                >
                  {{ getTabStatusLabel(getTabLiveStatus(entry.tab)) }}
                </span>
                <span
                  v-if="entry.tab.pendingWebUpdate?.changes?.length"
                  class="itp-update-tag"
                  title="Khách vừa cập nhật thêm món / thông tin"
                >
                  Cập nhật ({{ entry.tab.pendingWebUpdate.changes.length }})
                </span>
              </div>
              <div
                v-if="entry.matchedHint && (isMobile || !pcTabRailCollapsed)"
                class="itp-search-match-sub"
              >
                <template
                  v-for="(seg, mIdx) in getHighlightedSegments(entry.matchedHint, tabSearchQuery)"
                  :key="mIdx"
                >
                  <mark v-if="seg.match" class="search-hl-mark">{{ seg.text }}</mark>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </div>
            </button>
          </div>
          <div class="itb-actions">
            <span v-if="isMobile" class="itb-mobile-title">
              <i class="ri-stack-line"></i>
              <span>Tab đơn hàng ({{ invoiceTabs.length }})</span>
            </span>
            <button
              v-if="!isMobile"
              type="button"
              class="itb-collapse-btn"
              :title="pcTabRailCollapsed ? 'Mở rộng cột tab' : 'Thu gọn cột tab'"
              @click="pcTabRailCollapsed = !pcTabRailCollapsed"
            >
              <i :class="pcTabRailCollapsed ? 'ri-sidebar-unfold-line' : 'ri-sidebar-fold-line'"></i>
            </button>
            <button
              type="button"
              class="invoice-tab-add-btn"
              title="Mở thêm tab đơn hàng mới"
              aria-label="Mở thêm tab đơn hàng mới"
              @click="addNewInvoiceTab"
            >
              <i class="ri-add-line"></i>
            </button>
            <button
              type="button"
              class="invoice-tab-bell-btn"
              :class="{
                'has-pending': totalBellNotificationCount > 0,
                'is-ringing': pendingBellPulse && totalBellNotificationCount > 0,
              }"
              :title="bellButtonTooltip"
              @click="handleOrderBellClick"
            >
              <i :class="totalBellNotificationCount > 0 ? 'ri-notification-3-fill' : 'ri-notification-3-line'"></i>
              <span v-if="totalBellNotificationCount > 0" class="itb-badge">
                {{ totalBellNotificationCount }}
              </span>
            </button>
          </div>
        </div>

        <div
          v-if="!isMobile && !pcCollapsed.center"
          class="pc-col-resizer pc-tab-rail-resizer"
          :class="{
            active: resizingCol === 'tabRail',
            disabled: pcTabRailCollapsed,
          }"
          title="Kéo để chỉnh độ rộng cột tab • Double-click để đặt lại mặc định"
          @mousedown.prevent="startPcColResize('tabRail', $event)"
          @dblclick="resetTabRailWidth"
        >
          <span class="pc-resizer-grip"></span>
        </div>

        <div class="box order-box" v-show="isMobile ? activeMobileTab === 'order' : !pcCollapsed.center">

          <div
            class="order-header"
            style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; position: relative; margin-bottom: 10px;"
          >
            <div class="order-title-group">
              <h3 class="text-success" style="margin: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
                Đơn hàng của {{ form.tenKhachHang || '...' }}
              </h3>
              <span
                v-if="isLinkedOnlineOrder || isSubmittedAdminOrder"
                class="order-live-status-pill"
                :class="getTabStatusClass(activeOrderStatus)"
              >
                {{ getTabStatusLabel(activeOrderStatus) }}
              </span>
              <span
                v-if="(isLinkedOnlineOrder || isSubmittedAdminOrder) && orderCreatedAt"
                class="order-created-pill"
                :title="isLinkedOnlineOrder ? 'Thời gian tạo đơn web' : 'Thời gian tạo đơn'"
              >
                <i class="ri-calendar-check-line"></i>
                <span>Tạo: {{ orderCreatedAt }}</span>
              </span>
              <button
                v-if="isLinkedOnlineOrder"
                type="button"
                class="order-back-donhang-btn"
                title="Quay lại danh sách Đơn hàng"
                @click="goBackToOrdersPage"
              >
                <i class="ri-arrow-left-line"></i>
                <span>Đơn hàng</span>
              </button>
            </div>
            <div class="order-header-right">
              <div class="order-view-switch" role="group" aria-label="Chế độ xem bảng đơn hàng">
                <button
                  type="button"
                  class="ov-btn"
                  :class="{ active: orderTableViewMode === 'by_member' }"
                  @click="setOrderTableViewMode('by_member')"
                >
                  <i class="ri-team-line"></i>
                  <span>Theo từng người</span>
                </button>
                <button
                  type="button"
                  class="ov-btn"
                  :class="{ active: orderTableViewMode === 'grouped' }"
                  @click="setOrderTableViewMode('grouped')"
                >
                  <i class="ri-stack-line"></i>
                  <span>Dạng gộp</span>
                </button>
              </div>
              <button
                type="button"
                class="ov-add-member-btn"
                @click="openAddMemberModal"
                title="Thêm hoặc quản lý người đặt trong bảng đơn hàng"
              >
                <i class="ri-user-add-line"></i>
                <span>Thêm người</span>
                <span v-if="invoiceOrderMembers.length > 0" class="ov-member-count">
                  {{ invoiceOrderMembers.length }}
                </span>
              </button>
              <div v-if="!isMobile" class="order-col-settings-wrap" ref="colSettingsWrapRef">
                <button
                  type="button"
                  class="ov-col-btn"
                  :class="{ active: showColSettings }"
                  @click.stop="showColSettings = !showColSettings"
                  title="Thiết lập cột hiển thị trong bảng đơn hàng"
                >
                  <i class="ri-table-line"></i>
                  <span>Hiển thị cột</span>
                  <span class="ov-col-count">{{ visibleOrderColCount }}</span>
                </button>

                <div v-if="showColSettings" class="order-col-popover" @click.stop>
                  <div class="ocp-header">
                    <div class="ocp-title">
                      <i class="ri-layout-column-line"></i>
                      <span>Thiết lập cột bảng đơn</span>
                    </div>
                    <button type="button" class="ocp-close" @click="showColSettings = false" title="Đóng">
                      <i class="ri-close-line"></i>
                    </button>
                  </div>

                  <div class="ocp-presets">
                    <button type="button" class="ocp-preset-btn" @click="applyOrderColPreset('sales')">
                      Bán hàng (Gọn)
                    </button>
                    <button type="button" class="ocp-preset-btn" @click="applyOrderColPreset('audit')">
                      Kiểm tra (Nội bộ)
                    </button>
                    <button type="button" class="ocp-preset-btn" @click="applyOrderColPreset('full')">
                      Đầy đủ
                    </button>
                  </div>

                  <div class="ocp-groups">
                    <div v-for="grp in ORDER_TABLE_COL_GROUPS" :key="grp.title" class="ocp-group">
                      <div class="ocp-group-title">{{ grp.title }}</div>
                      <div class="ocp-check-grid">
                        <label
                          v-for="col in grp.items"
                          :key="col.key"
                          class="ocp-check-item"
                          :class="{ checked: orderTableCols[col.key] }"
                        >
                          <input type="checkbox" v-model="orderTableCols[col.key]" />
                          <span>{{ col.label }}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="ocp-footer-switch">
                    <button
                      v-if="hasCustomOrderColWidths"
                      type="button"
                      class="ocp-reset-widths-btn"
                      @click="resetOrderColWidths"
                    >
                      <i class="ri-refresh-line"></i>
                      <span>Đặt lại độ rộng cột bảng</span>
                    </button>
                    <div class="ocp-locked-hint">
                      Luôn hiện: Sản phẩm, Số lượng, Thành tiền, Xóa
                    </div>
                  </div>
                </div>
              </div>
              <div class="order-codes">
                <span class="code-item" style="display: flex; align-items: center; font-size: 13px; color: #64748b;">
                  <span class="status-dot-green"></span>
                  <strong>Mã: {{ maHoaDon }}</strong>
                </span>
              </div>
              <button
                v-if="!isMobile"
                type="button"
                class="pc-col-toggle-btn"
                @click="pcCollapsed.center = true"
                title="Thu gọn bảng đơn hàng"
              >
                <i class="ri-contract-left-right-line"></i>
              </button>
            </div>
          </div>

          <template v-if="isMobile">
            <div class="order-card-container">
            <div class="order-card-list">
              <!-- MOBILE: XEM THEO TỪNG NGƯỜI -->
              <template v-if="orderTableViewMode === 'by_member' && invoiceMemberGroups.length">
                <div
                  v-for="grp in invoiceMemberGroups"
                  :key="grp.groupKey"
                  class="order-member-section"
                >
                  <div class="order-member-group-header">
                    <div class="omg-left">
                      <i
                        class="app-ico"
                        :class="grp.role === 'admin' ? 'ri-store-2-line' : 'ri-user-3-line'"
                      ></i>
                      <span class="omg-name">{{ grp.name }}</span>
                      <span v-if="grp.dupTag" class="omg-dup-tag">{{ grp.dupTag }}</span>
                      <span v-if="grp.badge" class="omg-badge" :class="`role-${grp.role}`">
                        {{ grp.badge }}
                      </span>
                    </div>
                    <div class="omg-right">
                      <button
                        v-if="showMemberTargetBar"
                        type="button"
                        class="omg-add-for-btn"
                        :class="{ active: activeTargetMemberKey === grp.groupKey }"
                        @click.stop="selectTargetMember(grp.groupKey, { goToEntry: true })"
                        :title="`Thêm món cho ${grp.name}`"
                      >
                        <i :class="activeTargetMemberKey === grp.groupKey ? 'ri-check-line' : 'ri-add-line'"></i>
                        <span>{{ activeTargetMemberKey === grp.groupKey ? 'Đang chọn' : 'Thêm món' }}</span>
                      </button>
                      <span class="omg-qty">{{ grp.totalQty }} món</span>
                      <span class="omg-total">{{ formatWithCurrency(grp.subtotal, donViTienTeChung) }}</span>
                      <button
                        v-if="grp.entries.length === 0 && grp.isCustom"
                        type="button"
                        class="omg-remove-member-btn"
                        @click.stop="removeCustomOrderMember(grp)"
                        :title="`Xóa người đặt ${grp.name}`"
                      >
                        <i class="ri-close-line"></i>
                      </button>
                    </div>
                  </div>

                  <div v-if="!grp.entries.length" class="order-member-empty-card">
                    <span>Chưa có món nào — bấm <strong>Thêm món</strong> để chọn sản phẩm cho {{ grp.name }}.</span>
                  </div>

                  <div
                    v-for="entry in grp.entries"
                    :key="entry.idx"
                    class="order-card"
                    :class="{
                      'is-highlight': entry.idx === highlightedIndex,
                      'card-web-updated': Boolean(getOrderItemUpdateBadge(entry)),
                    }"
                    @click="openEditItem(entry.item, entry.idx)"
                  >
                    <button
                      class="order-card-delete"
                      @click.stop="deleteItem(entry.idx)"
                      title="Xóa hàng"
                    >
                      <i class="app-ico ri-close-line"></i>
                    </button>

                    <div class="order-card-title">
                      <div class="order-card-name">
                        <span>{{ entry.item.tenHang }}</span>
                        <span
                          v-if="getOrderItemUpdateBadge(entry)"
                          class="web-update-pill"
                          :class="`is-${getOrderItemUpdateBadge(entry).kind}`"
                        >
                          {{ getOrderItemUpdateBadge(entry).label }}
                        </span>
                      </div>
                      <div v-if="entry.item.dvt || entry.item.size" class="order-card-meta">
                        <span v-if="entry.item.dvt">ĐVT: {{ entry.item.dvt }}</span>
                        <span v-if="entry.item.size">Size: {{ entry.item.size }}</span>
                      </div>
                    </div>

                    <div class="order-card-discount" :class="{ 'item-card-discount-red': hasItemDiscount(entry.item) }">
                      <span v-if="Number(entry.item.chietKhau || 0) > 0">
                        CK {{ entry.item.chietKhau || 0 }}%: -{{ formatWithCurrency(getItemChietKhauTien(entry.item), entry.item.donViTienTe) }}
                      </span>
                      <span v-if="Number(entry.item.giamGia || 0) > 0">
                        Giảm: -{{ formatWithCurrency(getItemGiamGiaTien(entry.item), entry.item.donViTienTe) }}
                      </span>
                      <span v-if="Number(entry.item.Ncc_gia_tri_giam || entry.item.nccGiaTriGiam || 0) > 0" class="item-card-ncc-badge">
                        NCC: {{ formatNccDiscountLabel(entry.item, entry.item.donViTienTe) }}
                      </span>
                    </div>

                    <div class="order-card-pricing">
                      <div class="order-card-price-left">
                        <span
                          class="price-main"
                          :class="{ 'price-discounted': hasItemDiscount(entry.item) }"
                        >
                          {{ formatWithCurrency(
                            hasItemDiscount(entry.item) ? getItemUnitPriceAfterDiscount(entry.item) : entry.item.giaBan,
                            entry.item.donViTienTe
                          ) }}
                        </span>
                        <span class="price-qty">x {{ entry.item.soLuong }}</span>
                      </div>
                      <div class="order-card-price-total">
                        {{ formatWithCurrency(entry.item.thanhTien - (entry.item.tongGiamTru || 0), entry.item.donViTienTe) }}
                      </div>
                    </div>

                    <div v-if="entry.item.ghiChuHang" class="order-card-note">
                      <i class="app-ico ri-file-text-line"></i>
                      <span>{{ entry.item.ghiChuHang }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- MOBILE: XEM DẠNG GỘP -->
              <template v-else-if="!items.length">
                <div class="order-empty">
                  Chưa có sản phẩm trong đơn.
                </div>
              </template>
              <template v-else>
                <div
                  v-for="grp in groupedOrderDisplayItems"
                  :key="grp.groupKey"
                  class="order-card"
                  :class="{
                    'is-highlight': grp.entries.some((e) => e.idx === highlightedIndex),
                    'card-web-updated': Boolean(getOrderGroupUpdateBadge(grp)),
                  }"
                  @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)"
                >
                  <button
                    class="order-card-delete"
                    @click.stop="deleteGroupedOrderItem(grp)"
                    title="Xóa hàng"
                  >
                    <i class="app-ico ri-close-line"></i>
                  </button>

                  <div class="order-card-title">
                    <div class="order-card-name">
                      <span>{{ grp.tenHang }}</span>
                      <span
                        v-if="getOrderGroupUpdateBadge(grp)"
                        class="web-update-pill"
                        :class="`is-${getOrderGroupUpdateBadge(grp).kind}`"
                      >
                        {{ getOrderGroupUpdateBadge(grp).label }}
                      </span>
                    </div>
                    <div v-if="grp.dvt || grp.size" class="order-card-meta">
                      <span v-if="grp.dvt">ĐVT: {{ grp.dvt }}</span>
                      <span v-if="grp.size">Size: {{ grp.size }}</span>
                    </div>
                  </div>

                  <div v-if="grp.showMemberBreakdown" class="order-member-chips">
                    <button
                      v-for="(entry, eIdx) in grp.entries"
                      :key="eIdx"
                      type="button"
                      class="om-chip"
                      :class="{ 'is-admin': entry.role === 'admin' }"
                      @click.stop="openEditItem(entry.item, entry.idx)"
                    >
                      <span>{{ entry.personName }}</span>
                      <strong>×{{ entry.item.soLuong }}</strong>
                      <em v-if="entry.item.ghiChuHang">({{ entry.item.ghiChuHang }})</em>
                    </button>
                  </div>

                  <div class="order-card-discount" :class="{ 'item-card-discount-red': grp.tongGiamTru > 0 }">
                    <span v-if="grp.tongChietKhauTien > 0">
                      CK: -{{ formatWithCurrency(grp.tongChietKhauTien, grp.donViTienTe) }}
                    </span>
                    <span v-if="grp.tongGiamGiaTien > 0">
                      Giảm: -{{ formatWithCurrency(grp.tongGiamGiaTien, grp.donViTienTe) }}
                    </span>
                    <span v-if="Number(grp.nccGiaTriGiam || 0) > 0" class="item-card-ncc-badge">
                      NCC: {{ formatNccDiscountLabel({ Ncc_loai_giam: grp.nccLoaiGiam, Ncc_gia_tri_giam: grp.nccGiaTriGiam }, grp.donViTienTe) }}
                    </span>
                  </div>

                  <div class="order-card-pricing">
                    <div class="order-card-price-left">
                      <span class="price-main">
                        {{ formatWithCurrency(grp.giaBan, grp.donViTienTe) }}
                      </span>
                      <span class="price-qty">x {{ grp.totalQty }}</span>
                    </div>
                    <div class="order-card-price-total">
                      {{ formatWithCurrency(grp.netTotal, grp.donViTienTe) }}
                    </div>
                  </div>

                  <div v-if="!grp.showMemberBreakdown && grp.combinedNotes" class="order-card-note">
                    <i class="app-ico ri-file-text-line"></i>
                    <span>{{ grp.combinedNotes }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>

            <div v-if="activeMobileTab === 'order'" class="order-next-wrap">
              <button class="order-back-btn" @click="setMobileTab('entry')">
                <i class="ri-arrow-left-line"></i>
                <span>Quay lại</span>
              </button>
              <button v-if="items.length" class="order-next-btn" @click="setMobileTab('customer')">
                <span>Tiếp theo</span>
                <i class="ri-arrow-right-line"></i>
              </button>
            </div>
          </template>

          <div v-else class="order-table-wrap">
            <table
              ref="orderTableRef"
              :class="{
                'is-fixed-cols': hasCustomOrderColWidths,
                'is-resizing-table-cols': Boolean(resizingOrderColKey),
              }"
            >
              <thead>
                <tr>
                  <th
                    v-for="col in visibleOrderTableHeaders"
                    :key="col.key"
                    :data-col-key="col.key"
                    :class="[col.align, { 'is-col-resizing': resizingOrderColKey === col.key }]"
                    :style="getOrderColWidthStyle(col.key)"
                  >
                    <span class="th-label-text">{{ col.label }}</span>
                    <span
                      class="th-col-resizer"
                      title="Kéo để chỉnh độ rộng cột • Double-click để đặt lại"
                      @mousedown.stop.prevent="startOrderColResize(col.key, $event)"
                      @dblclick.stop="resetSingleOrderColWidth(col.key)"
                    ></span>
                  </th>
                </tr>
              </thead>

              <!-- DESKTOP: XEM THEO TỪNG NGƯỜI -->
              <tbody v-if="orderTableViewMode === 'by_member'">
                <tr v-if="!invoiceMemberGroups.length">
                  <td :colspan="visibleOrderColCount" class="order-table-empty">Chưa có sản phẩm trong đơn.</td>
                </tr>
                <template v-for="grp in invoiceMemberGroups" :key="grp.groupKey">
                  <tr class="order-group-row">
                    <td :colspan="visibleOrderColCount">
                      <div class="ogr-inner">
                        <div class="ogr-left">
                          <i
                            class="app-ico"
                            :class="grp.role === 'admin' ? 'ri-store-2-line' : 'ri-user-3-line'"
                          ></i>
                          <span class="ogr-name">{{ grp.name }}</span>
                          <span v-if="grp.dupTag" class="omg-dup-tag">{{ grp.dupTag }}</span>
                          <span v-if="grp.badge" class="omg-badge" :class="`role-${grp.role}`">
                            {{ grp.badge }}
                          </span>
                        </div>
                        <div class="ogr-right">
                          <button
                            v-if="showMemberTargetBar"
                            type="button"
                            class="ogr-add-for-btn"
                            :class="{ active: activeTargetMemberKey === grp.groupKey }"
                            @click.stop="selectTargetMember(grp.groupKey)"
                            :title="`Chọn ${grp.name} để thêm món`"
                          >
                            <i :class="activeTargetMemberKey === grp.groupKey ? 'ri-check-line' : 'ri-add-line'"></i>
                            <span>{{ activeTargetMemberKey === grp.groupKey ? 'Đang thêm cho người này' : 'Thêm món' }}</span>
                          </button>
                          <span class="ogr-qty">{{ grp.totalQty }} món</span>
                          <span class="ogr-total">{{ formatWithCurrency(grp.subtotal, donViTienTeChung) }}</span>
                          <button
                            v-if="grp.entries.length === 0 && grp.isCustom"
                            type="button"
                            class="ogr-remove-member-btn"
                            @click.stop="removeCustomOrderMember(grp)"
                            :title="`Xóa người đặt ${grp.name}`"
                          >
                            <i class="ri-close-line"></i>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!grp.entries.length" class="order-member-empty-row">
                    <td :colspan="visibleOrderColCount">
                      Chưa có món nào cho <strong>{{ grp.name }}</strong> — chọn người này rồi bấm sản phẩm ở cột bên trái để thêm.
                    </td>
                  </tr>
                  <tr
                    v-for="(entry, mIdx) in grp.entries"
                    :key="entry.idx"
                    :class="{
                      'row-highlight': entry.idx === highlightedIndex,
                      'row-web-updated': Boolean(getOrderItemUpdateBadge(entry)),
                    }"
                  >
                    <td v-if="orderTableCols.stt" class="col-center col-bold">{{ mIdx + 1 }}</td>
                    <td v-if="orderTableCols.maHang" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-code-pill">{{ getOrderItemMeta(entry.item).maHang }}</span>
                    </td>
                    <td class="col-left">
                      <div class="prod-cell" @click="openEditItem(entry.item, entry.idx)">
                        <div class="prod-name">
                          <span>{{ entry.item.tenHang }}</span>
                          <span
                            v-if="getOrderItemUpdateBadge(entry)"
                            class="web-update-pill"
                            :class="`is-${getOrderItemUpdateBadge(entry).kind}`"
                          >
                            {{ getOrderItemUpdateBadge(entry).label }}
                          </span>
                        </div>
                        <template v-if="!orderTableCols.sizeDvt">
                          <div v-if="entry.item.size" class="prod-sub">Size: {{ entry.item.size }}</div>
                          <div v-if="entry.item.dvt" class="prod-sub">ĐVT: {{ entry.item.dvt }}</div>
                        </template>
                        <div v-if="!orderTableCols.ghiChu && entry.item.ghiChuHang" class="prod-note">{{ entry.item.ghiChuHang }}</div>
                      </div>
                    </td>
                    <td v-if="orderTableCols.danhMuc" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-muted-text">{{ getOrderItemMeta(entry.item).danhMuc }}</span>
                    </td>
                    <td v-if="orderTableCols.sizeDvt" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <div class="col-sizedvt-cell">
                        <span v-if="entry.item.size">S: {{ entry.item.size }}</span>
                        <span v-if="entry.item.dvt">{{ entry.item.dvt }}</span>
                        <span v-if="!entry.item.size && !entry.item.dvt" class="col-muted-text">—</span>
                      </div>
                    </td>
                    <td v-if="orderTableCols.trangThaiKho" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-stock-badge" :class="getOrderItemMeta(entry.item).isOut ? 'is-out' : 'is-ok'">
                        {{ getOrderItemMeta(entry.item).trangThai }}
                      </span>
                    </td>
                    <td v-if="orderTableCols.nguoiDat" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-person-pill">{{ getOrderItemMeta(entry.item).nguoiDat }}</span>
                    </td>
                    <td class="col-center col-bold" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">{{ entry.item.soLuong }}</td>
                    <td v-if="orderTableCols.giaVon" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-cost-val">{{ formatWithCurrency(getOrderItemMeta(entry.item).giaGoc, entry.item.donViTienTe) }}</span>
                    </td>
                    <td v-if="orderTableCols.tongVon" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-cost-val">{{ formatWithCurrency(getOrderItemMeta(entry.item).tongVon, entry.item.donViTienTe) }}</span>
                    </td>
                    <td v-if="orderTableCols.giaBan" class="col-center col-bold" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      {{ formatWithCurrency(entry.item.giaBan, entry.item.donViTienTe) }}
                    </td>
                    <td v-if="orderTableCols.truocGiam" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-muted-text">{{ formatWithCurrency(entry.item.thanhTien, entry.item.donViTienTe) }}</span>
                    </td>
                    <td v-if="orderTableCols.giamCk" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <div class="disc-cell">
                        <span class="disc-ck">
                          CK ({{ entry.item.chietKhau || 0 }}%): -{{ formatWithCurrency(entry.item.tongChietKhauTien || 0, entry.item.donViTienTe) }}
                        </span>
                        <span class="disc-giam">
                          Giảm: -{{ formatWithCurrency(entry.item.tongGiamGiaTien || 0, entry.item.donViTienTe) }}
                        </span>
                      </div>
                    </td>
                    <td v-if="orderTableCols.ckNcc" class="col-center" @click.stop>
                      <div class="table-ncc-cell">
                        <button
                          type="button"
                          class="table-ncc-mode-btn"
                          :class="{ 'is-money': (entry.item.Ncc_loai_giam ?? entry.item.nccLoaiGiam) === 'money' }"
                          title="Bấm để đổi % / Tiền"
                          @click="toggleRowNccType([entry.item])"
                        >
                          {{ (entry.item.Ncc_loai_giam ?? entry.item.nccLoaiGiam) === 'money' ? (entry.item.donViTienTe || 'P') : '%' }}
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          class="table-ncc-input"
                          :value="entry.item.Ncc_gia_tri_giam ?? entry.item.nccGiaTriGiam ?? 0"
                          @input="updateRowNccValue([entry.item], $event.target.value)"
                        />
                      </div>
                    </td>
                    <td @click="openEditItem(entry.item, entry.idx)" class="total-cell col-center col-bold" style="cursor:pointer">
                      <span class="total-amount">
                        {{ formatWithCurrency(entry.item.thanhTien - (entry.item.tongGiamTru || 0), entry.item.donViTienTe) }}
                      </span>
                    </td>
                    <td v-if="orderTableCols.loiNhuan" class="col-center" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span class="col-profit-val" :class="{ 'is-neg': Number(entry.item.loiNhuan || 0) < 0 }">
                        {{ Number(entry.item.loiNhuan || 0) >= 0 ? '+' : '' }}{{ formatWithCurrency(entry.item.loiNhuan, entry.item.donViTienTe) }}
                      </span>
                    </td>
                    <td v-if="orderTableCols.ghiChu" class="col-left" @click="openEditItem(entry.item, entry.idx)" style="cursor:pointer">
                      <span v-if="entry.item.ghiChuHang" class="col-note-text">{{ entry.item.ghiChuHang }}</span>
                      <span v-else class="col-muted-text">—</span>
                    </td>
                    <td class="col-center">
                      <button class="btn-delete" @click="deleteItem(entry.idx)" title="Xóa hàng">
                        <i class="app-ico ri-close-line"></i>
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>

              <!-- DESKTOP: XEM DẠNG GỘP -->
              <tbody v-else>
                <tr v-if="!items.length">
                  <td :colspan="visibleOrderColCount" class="order-table-empty">Chưa có sản phẩm trong đơn.</td>
                </tr>
                <tr
                  v-for="(grp, gIdx) in groupedOrderDisplayItems"
                  :key="grp.groupKey"
                  :class="{
                    'row-highlight': grp.entries.some((e) => e.idx === highlightedIndex),
                    'row-web-updated': Boolean(getOrderGroupUpdateBadge(grp)),
                  }"
                >
                  <td v-if="orderTableCols.stt" class="col-center col-bold">{{ gIdx + 1 }}</td>
                  <td v-if="orderTableCols.maHang" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-code-pill">{{ grp.maHang }}</span>
                  </td>
                  <td class="col-left">
                    <div class="prod-cell" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)">
                      <div class="prod-name">
                        <span>{{ grp.tenHang }}</span>
                        <span
                          v-if="getOrderGroupUpdateBadge(grp)"
                          class="web-update-pill"
                          :class="`is-${getOrderGroupUpdateBadge(grp).kind}`"
                        >
                          {{ getOrderGroupUpdateBadge(grp).label }}
                        </span>
                      </div>
                      <template v-if="!orderTableCols.sizeDvt">
                        <div v-if="grp.size" class="prod-sub">Size: {{ grp.size }}</div>
                        <div v-if="grp.dvt" class="prod-sub">ĐVT: {{ grp.dvt }}</div>
                      </template>
                      <div v-if="grp.showMemberBreakdown" class="order-member-chips">
                        <button
                          v-for="(entry, eIdx) in grp.entries"
                          :key="eIdx"
                          type="button"
                          class="om-chip"
                          :class="{ 'is-admin': entry.role === 'admin' }"
                          @click.stop="openEditItem(entry.item, entry.idx)"
                        >
                          <span>{{ entry.personName }}</span>
                          <strong>×{{ entry.item.soLuong }}</strong>
                          <em v-if="entry.item.ghiChuHang">({{ entry.item.ghiChuHang }})</em>
                        </button>
                      </div>
                      <div v-else-if="!orderTableCols.ghiChu && grp.combinedNotes" class="prod-note">{{ grp.combinedNotes }}</div>
                    </div>
                  </td>
                  <td v-if="orderTableCols.danhMuc" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-muted-text">{{ grp.danhMuc }}</span>
                  </td>
                  <td v-if="orderTableCols.sizeDvt" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <div class="col-sizedvt-cell">
                      <span v-if="grp.size">S: {{ grp.size }}</span>
                      <span v-if="grp.dvt">{{ grp.dvt }}</span>
                      <span v-if="!grp.size && !grp.dvt" class="col-muted-text">—</span>
                    </div>
                  </td>
                  <td v-if="orderTableCols.trangThaiKho" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-stock-badge" :class="grp.isOut ? 'is-out' : 'is-ok'">
                      {{ grp.trangThai }}
                    </span>
                  </td>
                  <td v-if="orderTableCols.nguoiDat" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-person-pill">{{ grp.nguoiDatSummary }}</span>
                  </td>
                  <td class="col-center col-bold" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">{{ grp.totalQty }}</td>
                  <td v-if="orderTableCols.giaVon" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-cost-val">{{ formatWithCurrency(grp.giaGoc, grp.donViTienTe) }}</span>
                  </td>
                  <td v-if="orderTableCols.tongVon" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-cost-val">{{ formatWithCurrency(grp.tongVon, grp.donViTienTe) }}</span>
                  </td>
                  <td v-if="orderTableCols.giaBan" class="col-center col-bold" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    {{ formatWithCurrency(grp.giaBan, grp.donViTienTe) }}
                  </td>
                  <td v-if="orderTableCols.truocGiam" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-muted-text">{{ formatWithCurrency(grp.thanhTien, grp.donViTienTe) }}</span>
                  </td>
                  <td v-if="orderTableCols.giamCk" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <div class="disc-cell">
                      <span class="disc-ck">
                        CK: -{{ formatWithCurrency(grp.tongChietKhauTien, grp.donViTienTe) }}
                      </span>
                      <span class="disc-giam">
                        Giảm: -{{ formatWithCurrency(grp.tongGiamGiaTien, grp.donViTienTe) }}
                      </span>
                    </div>
                  </td>
                  <td v-if="orderTableCols.ckNcc" class="col-center" @click.stop>
                    <div class="table-ncc-cell">
                      <button
                        type="button"
                        class="table-ncc-mode-btn"
                        :class="{ 'is-money': grp.nccLoaiGiam === 'money' }"
                        title="Bấm để đổi % / Tiền"
                        @click="toggleRowNccType(grp.entries.map((e) => e.item))"
                      >
                        {{ grp.nccLoaiGiam === 'money' ? (grp.donViTienTe || 'P') : '%' }}
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        class="table-ncc-input"
                        :value="grp.nccGiaTriGiam"
                        @input="updateRowNccValue(grp.entries.map((e) => e.item), $event.target.value)"
                      />
                    </div>
                  </td>
                  <td @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" class="total-cell col-center col-bold" style="cursor:pointer">
                    <span class="total-amount">
                      {{ formatWithCurrency(grp.netTotal, grp.donViTienTe) }}
                    </span>
                  </td>
                  <td v-if="orderTableCols.loiNhuan" class="col-center" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span class="col-profit-val" :class="{ 'is-neg': Number(grp.loiNhuan || 0) < 0 }">
                      {{ Number(grp.loiNhuan || 0) >= 0 ? '+' : '' }}{{ formatWithCurrency(grp.loiNhuan, grp.donViTienTe) }}
                    </span>
                  </td>
                  <td v-if="orderTableCols.ghiChu" class="col-left" @click="openEditItem(grp.entries[0].item, grp.entries[0].idx, grp.entries)" style="cursor:pointer">
                    <span v-if="grp.combinedNotes" class="col-note-text">{{ grp.combinedNotes }}</span>
                    <span v-else class="col-muted-text">—</span>
                  </td>
                  <td class="col-center">
                    <button class="btn-delete" @click="deleteGroupedOrderItem(grp)" title="Xóa hàng">
                      <i class="app-ico ri-close-line"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        v-if="!isMobile"
        class="pc-col-resizer"
        :class="{
          active: resizingCol === 'right',
          disabled: pcCollapsed.right || pcCollapsed.center,
        }"
        title="Kéo để chỉnh độ rộng cột • Double-click để đặt lại mặc định"
        @mousedown.prevent="startPcColResize('right', $event)"
        @dblclick="resetPcColWidths"
      >
        <span class="pc-resizer-grip"></span>
      </div>

      <div
        class="right-stack"
        :class="{ 'is-pc-collapsed': !isMobile && pcCollapsed.right }"
        v-show="!isMobile || ['customer', 'payment'].includes(activeMobileTab)"
      >
        <button
          v-if="!isMobile && pcCollapsed.right"
          type="button"
          class="pc-col-rail pc-col-rail--right"
          @click="pcCollapsed.right = false"
          title="Mở cột thông tin & thanh toán"
        >
          <i class="ri-arrow-left-double-line pc-rail-ico"></i>
          <span class="pc-rail-label">THÔNG TIN &amp; THANH TOÁN</span>
          <span v-if="tongCong > 0" class="pc-rail-total">{{ formatWithCurrency(tongCong, donViTienTeChung) }}</span>
        </button>

        <div v-if="!isMobile && !pcCollapsed.right" class="pc-right-panel-bar">
          <span class="prpb-title">
            <i class="ri-layout-right-2-line"></i>
            <span>THÔNG TIN &amp; THANH TOÁN</span>
          </span>
          <div class="prpb-actions">
            <button
              v-if="pcColWidths.left !== null || pcColWidths.right !== null"
              type="button"
              class="pc-col-reset-btn"
              @click="resetPcColWidths"
              title="Khôi phục kích thước 3 cột mặc định"
            >
              <i class="ri-refresh-line"></i>
              <span>Reset cột</span>
            </button>
            <button
              type="button"
              class="pc-col-toggle-btn"
              @click="pcCollapsed.right = true"
              title="Thu gọn cột bên phải"
            >
              <i class="ri-arrow-right-double-line"></i>
            </button>
          </div>
        </div>

        <div
          v-if="!isMobile && !pcCollapsed.right"
          class="pc-right-tabs"
          role="tablist"
          aria-label="Chuyển mục thông tin và thanh toán"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="pcRightTab === 'customer'"
            class="pc-right-tab-btn"
            :class="{ active: pcRightTab === 'customer' }"
            @click="pcRightTab = 'customer'"
          >
            <i class="ri-user-heart-line"></i>
            <span>Khách &amp; Giao</span>
            <span v-if="form.tenKhachHang" class="pc-tab-badge is-ok" :title="form.tenKhachHang">
              <i class="ri-check-line"></i>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="pcRightTab === 'payment'"
            class="pc-right-tab-btn"
            :class="{ active: pcRightTab === 'payment' }"
            @click="pcRightTab = 'payment'"
          >
            <i class="ri-wallet-3-line"></i>
            <span>Thanh toán</span>
            <span
              v-if="tongGiamGia > 0 || tongTienChietKhau > 0"
              class="pc-tab-badge is-disc"
              title="Đơn có giảm giá / chiết khấu"
            >%</span>
          </button>
        </div>

        <div class="pc-right-scroll" v-show="isMobile || !pcCollapsed.right">
          <!-- KHÁCH HÀNG & GIAO HÀNG -->
          <div
            class="info-row-2col"
            v-show="isMobile ? activeMobileTab === 'customer' : pcRightTab === 'customer'"
          >
            <div class="customer-scroll-container">
              <div
                class="box customer-box"
                v-show="!isMobile || activeMobileTab === 'customer'"
              >
                <h3>
                  <span class="pc-card-title-left"><i class="ri-user-heart-line"></i> Thông tin khách hàng</span>
                </h3>
                <div class="pc-card-body">
                <div class="hidden-field">
                  <label>Ma khach hang (an)</label>
                  <input v-model="form.maKhachHang" readonly />
                </div>

                <div class="field-row">
                  <label>Tên khách hàng</label>
                  <div class="field-control">
                    <div style="position:relative">
                      <input
                        v-model="form.tenKhachHang"
                        placeholder="Nhập tên, SĐT/@tele hoặc địa chỉ khách quen..."
                        autocomplete="off"
                        @focus="showCustomerSuggest = true"
                        @blur="closeCustomerSuggestDelayed"
                        @input="handleTenKhachChange"
                        style="padding-right: 70px"
                      />
                      <!-- Loading Spinner -->
                      <div v-if="isLoadingCustomer" class="input-spinner"></div>
                      <!-- Success Check (Only show when ready & empty) -->
                      <i v-if="!isLoadingCustomer && !form.tenKhachHang" class="ri-checkbox-circle-fill input-success-icon"></i>

                      <button 
                        v-if="form.tenKhachHang" 
                        class="btn-delete-cta"
                        @click="xoaKhachHang"
                        title="Xóa thông tin khách hàng"
                      >
                        XÓA
                      </button>

                      <!-- Smart Customer Autocomplete Dropdown (Name / Phone / Address / Note) -->
                      <div
                        v-if="showCustomerSuggest && filteredCustomerSuggestions.length > 0"
                        class="cust-suggest-dropdown"
                      >
                        <button
                          v-for="kh in filteredCustomerSuggestions"
                          :key="kh.Ma_khach_hang || kh.Ten_khach_hang"
                          type="button"
                          class="cust-suggest-item"
                          @mousedown.prevent="selectCustomerSuggestion(kh)"
                        >
                          <div class="cust-suggest-name">
                            <template v-for="(seg, sIdx) in getHighlightedSegments(kh.Ten_khach_hang, form.tenKhachHang)" :key="sIdx">
                              <mark v-if="seg.match" class="search-hl-mark">{{ seg.text }}</mark>
                              <template v-else>{{ seg.text }}</template>
                            </template>
                          </div>
                          <div class="cust-suggest-meta">
                            <span v-if="kh.So_dien_thoai">
                              <i class="ri-phone-line"></i> {{ kh.So_dien_thoai }}
                            </span>
                            <span v-if="kh.Dia_chi">
                              <i class="ri-map-pin-line"></i> {{ kh.Dia_chi }}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="field-row">
                  <label>Số điện thoại</label>
                  <div class="field-control">
                    <input 
                      v-model="form.soDienThoai" 
                      type="tel"
                      pattern="[0-9]*"
                      inputmode="numeric"
                      @input="cleanPhoneInput"
                    />
                  </div>
                </div>

                <div class="field-row">
                  <label>Địa chỉ</label>
                  <div class="field-control">
                    <input v-model="form.diaChi" />
                  </div>
                </div>

                <!-- BỔ SUNG: THÔNG TIN TÓM TẮT KHÁCH -->
                <div v-if="selectedCustomer || form.tenKhachHang" class="cust-summary-box">
                  <div class="cust-stat debt">
                    <span class="cust-stat-label">Công nợ</span>
                    <span class="cust-stat-value" :class="{ 'text-danger': customerDebt > 0 }">
                      {{ formatWithCurrency(customerDebt, donViTienTeChung) }}
                    </span>
                  </div>
                  <div class="cust-stat spend">
                    <span class="cust-stat-label">Chi tiêu</span>
                    <span class="cust-stat-value text-primary">
                      {{ formatWithCurrency(customerTotalSpend, donViTienTeChung) }}
                    </span>
                  </div>
                  <div class="cust-stat profit">
                    <span class="cust-stat-label">Lợi nhuận</span>
                    <span class="cust-stat-value text-success">
                      {{ formatWithCurrency(customerProfit, donViTienTeChung) }}
                    </span>
                  </div>
                </div>

                <div class="field-row">
                  <label>Ghi chú khách</label>
                  <div class="field-control">
                    <input 
                      type="text"
                      v-model="form.ghiChu" 
                      class="pm-input"
                      placeholder="Ghi chú về khách..."
                    />
                  </div>
                </div>
                </div>
              </div>

              <div
                class="box delivery-box"
                v-show="!isMobile || activeMobileTab === 'customer'"
              >
                <h3>
                  <span class="pc-card-title-left"><i class="ri-truck-line"></i> Thông tin giao hàng</span>
                </h3>

                <div class="pc-card-body">

                <div class="field-row">
                  <label>Ngày nhận</label>
                  <div class="field-control">
                    <input
                      type="date"
                      v-model="ngayNhanHang"
                      class="date-input-dark"
                    />
                  </div>
                </div>

                <div class="field-row">
                  <label>Thời gian nhận</label>
                  <div class="field-control">
                    <div class="delivery-time-row">
                      <select v-model="gioNhanHang" class="time-select">
                        <option v-for="g in gioList" :key="g" :value="g">{{ g }}</option>
                      </select>
                      <span class="time-sep">:</span>
                      <select v-model="phutNhanHang" class="time-select">
                        <option v-for="p in phutList" :key="p" :value="p">{{ p }}</option>
                      </select>
                      <button class="btn-now" @click="setPlus20Min" title="Hiện tại + 20 phút">
                        <i class="ri-flashlight-fill"></i> Làm liền
                      </button>
                    </div>
                  </div>
                </div>

                <div class="field-row">
                  <label>Ghi chú đơn</label>
                  <div class="field-control">
                    <textarea
                      v-model="form.ghiChuDonHang"
                      placeholder="VD: Giao giờ hành chính..."
                      rows="2"
                    ></textarea>
                  </div>
                </div>
                </div>
              </div>
            </div>

            <div v-if="isMobile && activeMobileTab === 'customer'" class="customer-next-wrap">
              <button class="customer-back-btn" @click="setMobileTab('order')">
                <i class="ri-arrow-left-line"></i>
                <span>Quay lại</span>
              </button>
              <button v-if="hasCustomerData" class="customer-next-btn" @click="setMobileTab('payment')">
                <span>Tiếp theo</span>
                <i class="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>

          <!-- TÓM TẮT ĐƠN & THANH TOÁN -->
          <div
            class="bottom-row"
            v-show="isMobile ? activeMobileTab === 'payment' : pcRightTab === 'payment'"
          >
            <div class="payment-scroll">
              <div class="summary-stack">
                <!-- CARD 1: THANH TOÁN -->
                <div class="box summary-card summary-card--payment">
                  <h3 class="card-title">
                    <span class="pc-card-title-left"><i class="ri-wallet-line"></i> THANH TOÁN</span>
                  </h3>

                  <div class="sum-grid">
                    <!-- Hình thức thanh toán -->
                    <div class="payment-toggle-section">
                      <span class="pm-label">Hình thức thanh toán</span>
                      <div class="pay-toggle-row">
                        <div class="pay-toggle">
                          <button 
                            class="pill-btn" 
                            :class="{ active: hinhThucThanhToan === 'TIEN_MAT' }"
                            @click="handlePaymentMethodChange('TIEN_MAT')"
                          >
                            <i class="ri-money-dollar-circle-line"></i> Tiền mặt
                          </button>
                          <button 
                            class="pill-btn pill-btn--transfer" 
                            :class="{ active: hinhThucThanhToan === 'CHUYEN_KHOAN' }"
                            @click="handlePaymentMethodChange('CHUYEN_KHOAN')"
                          >
                            <i class="ri-bank-card-line"></i> Chuyển khoản
                          </button>
                        </div>
                        <button
                          type="button"
                          class="pay-qr-export-btn"
                          @click="openQrExportModal"
                          title="Xuất mã QR chuyển khoản tự điền số tiền"
                        >
                          <i class="ri-qr-code-line"></i>
                          <span>Xuất QR</span>
                        </button>
                      </div>
                    </div>

                    <!-- Tỉ giá input (chỉ hiện khi chọn Chuyển khoản) -->
                    <div v-if="hinhThucThanhToan === 'CHUYEN_KHOAN'" class="exchange-rate-section">
                      <label class="er-label">Tỉ giá</label>
                      <div class="er-input-wrapper">
                        <input type="number" v-model.number="tiGia" min="0" step="0.01" class="er-input" ref="tiGiaRef" />
                        <span v-if="donViTienTeCK && donViTienTeCK !== 'VND'" class="er-badge">1 {{ donViTienTeCK }}</span>
                      </div>
                    </div>

                    <!-- Tiền ship (chỉ áp khi xuất ảnh/text Giá bán & đồng bộ hiển thị cho khách web; không cộng doanh thu) -->
                    <div class="exchange-rate-section shipping-fee-section">
                      <label
                        class="er-label"
                        title="Chỉ áp dụng khi xuất ảnh/text (Giá bán) và đồng bộ hiển thị cho khách web — không cộng vào doanh thu"
                      >
                        Tiền ship
                      </label>
                      <div class="shipping-fee-controls">
                        <div class="er-input-wrapper">
                          <input
                            type="number"
                            v-model.number="phiShip"
                            min="0"
                            step="1"
                            placeholder="0"
                            class="er-input"
                          />
                          <span class="er-badge">{{ donViTienTeChung }}</span>
                        </div>
                        <label
                          v-if="hinhThucThanhToan === 'CHUYEN_KHOAN'"
                          class="ck-ship-inline-check"
                          :class="{ active: ckBaoGomShip }"
                          title="Chuyển khoản luôn tiền ship"
                        >
                          <input type="checkbox" v-model="ckBaoGomShip" />
                          <span>CK luôn</span>
                        </label>
                      </div>
                    </div>
                    <div v-if="normalizedPhiShip > 0" class="ship-fee-hint">
                      <i class="ri-information-line"></i>
                      <span>Chỉ cộng khi xuất bill (Giá bán) &amp; hiển thị đơn web</span>
                    </div>
                  </div>
                </div>

                <!-- CARD 2: TÓM TẮT ĐƠN -->
                <div class="box summary-card summary-card--order">
                  <h3 class="card-title">
                    <span class="pc-card-title-left"><i class="ri-receipt-line"></i> TÓM TẮT ĐƠN</span>
                  </h3>

                  <div class="sum-grid">
                    <div class="sum-row">
                      <span class="sum-label">Hàng tạm tính</span>
                      <span class="sum-value font-mono sum-val-base">{{ formatWithCurrency(tamTinh, donViTienTeChung) }}</span>
                    </div>
                    
                    <div class="sum-row" :class="{ 'has-value': tongGiamGia > 0 }">
                      <span class="sum-label">Giảm giá</span>
                      <div class="sum-right-group">
                        <button class="btn-limit-red" @click="openDiscountModal('money')">Giảm thêm</button>
                        <span class="sum-value font-mono sum-val-disc">-{{ formatWithCurrency(tongGiamGia, donViTienTeChung) }}</span>
                      </div>
                    </div>
                    
                    <div class="sum-row" :class="{ 'has-value': tongTienChietKhau > 0 }">
                      <span class="sum-label">Chiết khấu</span>
                      <div class="sum-right-group">
                        <button class="btn-limit-red" @click="openDiscountModal('percent')">Giảm thêm</button>
                        <span class="sum-value font-mono sum-val-disc">-{{ formatWithCurrency(tongTienChietKhau, donViTienTeChung) }}</span>
                      </div>
                    </div>

                    <div class="sum-divider"></div>

                    <div class="sum-row">
                      <span class="sum-label">Tiền hàng</span>
                      <span class="sum-value font-mono sum-val-base">{{ formatWithCurrency(tongCong, donViTienTeChung) }}</span>
                    </div>

                    <div v-if="normalizedPhiShip > 0" class="sum-row is-ship">
                      <span class="sum-label">Phí ship</span>
                      <span class="sum-value font-mono">+{{ formatWithCurrency(normalizedPhiShip, donViTienTeChung) }}</span>
                    </div>

                    <!-- Tổng cộng -->
                    <div class="sum-row total-row">
                      <span class="sum-label total-label">TỔNG CỘNG</span>
                      <span class="sum-value total-value text-primary font-mono">{{ formatWithCurrency(tongCong + normalizedPhiShip, donViTienTeChung) }}</span>
                    </div>

                    <!-- Chuyển khoản (chỉ hiện khi chọn Chuyển khoản) -->
                    <div class="sum-row transfer-row" v-if="hinhThucThanhToan === 'CHUYEN_KHOAN'">
                      <span class="sum-label transfer-label">CHUYỂN KHOẢN (x{{ tiGia || 1 }})</span>
                      <span class="sum-value transfer-value font-mono">{{ formatWithCurrency((tongCong + normalizedPhiShip) * Number(tiGia || 1), donViTienTeCK) }}</span>
                    </div>

                    <div class="sum-row sub-info">
                      <span class="sum-label">Lợi nhuận dự kiến</span>
                      <span class="sum-value font-mono sum-val-profit">+{{ formatWithCurrency(tongLoiNhuan, donViTienTeChung) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STICKY CHECKOUT FOOTER (Always visible on PC unless right column collapsed; inside Payment tab on Mobile) -->
        <div class="pc-checkout-footer" v-show="isMobile ? activeMobileTab === 'payment' : !pcCollapsed.right">
          <!-- THAO TÁC ĐƠN (GỒM TIẾN TRÌNH + NÚT THAO TÁC + XUẤT HÓA ĐƠN) -->
          <div class="footer-action-block footer-order-block">
            <div class="fab-header">
              <div class="fab-title-group">
                <span class="fab-title">
                  <i class="ri-file-check-line"></i>
                  <span>Thao tác đơn</span>
                </span>
                <button
                  v-if="isLinkedOnlineOrder && activeOrderStatus !== 'Đã hủy'"
                  type="button"
                  class="fab-chat-toggle-btn"
                  :class="{
                    'is-open': showWebAdminMsgBox,
                    'has-draft': Boolean(webAdminMessageInput.trim()),
                  }"
                  title="Gửi lời nhắn tới khách đơn web"
                  aria-label="Mở khung gửi lời nhắn khách web"
                  @click="toggleWebAdminMsgBox"
                >
                  <i :class="showWebAdminMsgBox ? 'ri-chat-3-fill' : 'ri-chat-3-line'"></i>
                  <span
                    v-if="webAdminMessageInput.trim() && !showWebAdminMsgBox"
                    class="fab-chat-dot"
                  ></span>
                </button>
              </div>
              <span
                v-if="isLinkedOnlineOrder || isSubmittedAdminOrder"
                class="fab-sync-pill"
                :class="isOrderSyncedWithWeb ? 'is-synced' : 'is-unsynced'"
              >
                <i :class="isOrderSyncedWithWeb ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'"></i>
                <span>{{ isOrderSyncedWithWeb ? 'Đã đồng bộ' : 'Chưa đồng bộ' }}</span>
              </span>
            </div>

            <!-- HÀNG RIÊNG: PROGRESS TRẠNG THÁI ĐƠN (WEB 4 BƯỚC / ADMIN 3 BƯỚC) -->
            <div class="order-progress-row">
              <div v-if="activeOrderStatus === 'Đã hủy'" class="order-progress-cancelled">
                <i class="ri-close-circle-line"></i>
                <span>Đơn hàng đã hủy</span>
              </div>
              <div
                v-else
                class="order-status-progress"
                :class="{ 'is-3-steps': !isLinkedOnlineOrder }"
                role="group"
                aria-label="Tiến trình trạng thái đơn hàng"
              >
                <div class="osp-track">
                  <div class="osp-track-fill" :style="{ width: orderProgressPercent + '%' }"></div>
                </div>
                <button
                  v-for="(step, sIdx) in activeProgressSteps"
                  :key="step.value"
                  type="button"
                  class="osp-step"
                  :class="getOrderProgressStepClass(sIdx)"
                  :disabled="isSubmitting || isOrderActionLoading"
                  :title="`Chuyển trạng thái sang: ${step.value}`"
                  @click="handleOrderProgressStepClick(step.value)"
                >
                  <span class="osp-dot">
                    <i
                      v-if="
                        activeOrderStepIndex !== -1 &&
                        (sIdx < activeOrderStepIndex ||
                          (step.value === 'Hoàn thành' && activeOrderStatus === 'Hoàn thành'))
                      "
                      class="ri-check-line"
                    ></i>
                    <span v-else>{{ sIdx + 1 }}</span>
                  </span>
                  <span class="osp-label">{{ step.label }}</span>
                </button>
              </div>
            </div>

            <div
              class="submit-stack"
              :class="{
                'mobile-scroll-submit': isMobile,
                'pc-submit-stack': !isMobile,
                'is-online-actions': isLinkedOnlineOrder || isSubmittedAdminOrder,
              }"
            >
              <!-- ĐƠN ADMIN CHƯA CHỐT -->
              <button
                v-if="!isLinkedOnlineOrder && !isSubmittedAdminOrder"
                class="btn btn-complete"
                :disabled="isSubmitting || isOrderActionLoading"
                @click="hoanThanhDon('Đang xử lý', false)"
              >
                <span v-if="isSubmitting || isOrderActionLoading" class="btn-spinner" aria-hidden="true"></span>
                <i v-else class="app-ico ri-checkbox-circle-line"></i>
                <span>{{ isSubmitting ? 'ĐANG XỬ LÝ...' : 'CHỐT ĐƠN' }}</span>
              </button>

              <!-- ĐƠN WEB HOẶC ĐƠN ADMIN ĐÃ CHỐT: LƯU/ĐỒNG BỘ + HỦY / ĐÓNG TAB -->
              <template v-else>
                <button
                  v-if="isLinkedOnlineOrder && activeOrderStatus !== 'Đã hủy'"
                  type="button"
                  class="btn btn-sync-web"
                  :class="isOrderSyncedWithWeb ? 'is-synced' : 'is-unsynced'"
                  :disabled="isSubmitting || isOrderActionLoading"
                  :title="isOrderSyncedWithWeb ? 'Đã đồng bộ dữ liệu lên web (bấm để đồng bộ lại)' : 'Có thay đổi chưa đồng bộ — bấm để đồng bộ lên web'"
                  @click="syncOrderToWebFromInvoice"
                >
                  <span v-if="isSubmitting || isOrderActionLoading" class="btn-spinner" aria-hidden="true"></span>
                  <i v-else :class="['app-ico', isOrderSyncedWithWeb ? 'ri-cloud-line' : 'ri-refresh-line']"></i>
                  <span>ĐỒNG BỘ WEB</span>
                </button>

                <button
                  v-else-if="!isLinkedOnlineOrder && activeOrderStatus !== 'Đã hủy'"
                  type="button"
                  class="btn btn-sync-web"
                  :class="isOrderSyncedWithWeb ? 'is-synced' : 'is-unsynced'"
                  :disabled="isSubmitting || isOrderActionLoading"
                  :title="isOrderSyncedWithWeb ? 'Dữ liệu đơn đã lưu đồng bộ (bấm để lưu lại)' : 'Có thay đổi chưa lưu — bấm để cập nhật đơn hàng'"
                  @click="saveAdminOrderEdits"
                >
                  <span v-if="isSubmitting || isOrderActionLoading" class="btn-spinner" aria-hidden="true"></span>
                  <i v-else :class="['app-ico', isOrderSyncedWithWeb ? 'ri-cloud-line' : 'ri-refresh-line']"></i>
                  <span>LƯU CẬP NHẬT</span>
                </button>

                <button
                  v-if="activeOrderStatus !== 'Hoàn thành' && activeOrderStatus !== 'Đã hủy'"
                  type="button"
                  class="btn btn-order-cancel"
                  :disabled="isSubmitting || isOrderActionLoading"
                  @click="cancelOrderFromInvoice"
                >
                  <i class="app-ico ri-close-circle-line"></i>
                  <span>HỦY ĐƠN</span>
                </button>

                <button
                  v-else
                  type="button"
                  class="btn btn-order-draft btn-close-order-tab"
                  @click="closeInvoiceTab(activeInvoiceTabId)"
                >
                  <i class="app-ico ri-close-circle-line"></i>
                  <span>ĐÓNG TAB</span>
                </button>
              </template>
            </div>

            <!-- XUẤT ẢNH / XUẤT CHỮ (GỘP TRONG THAO TÁC ĐƠN) -->
            <div class="footer-export-actions" :class="{ 'is-mobile-export': isMobile }">
              <button class="btn btn-preview" :disabled="isPreviewing" @click="previewHoaDon" title="Xuất ảnh hóa đơn">
                <span v-if="isPreviewing" class="btn-spinner" aria-hidden="true"></span>
                <i v-else class="app-ico ri-image-line"></i> 
                <span>{{ isPreviewing ? 'ĐANG XUẤT...' : (isMobile ? 'XUẤT ẢNH HÓA ĐƠN' : 'XUẤT ẢNH') }}</span>
              </button>
              <button class="btn btn-text" @click="openTextInvoice" title="Xuất hóa đơn (chữ)">
                <i class="app-ico ri-file-text-line"></i> 
                <span>{{ isMobile ? 'XUẤT HÓA ĐƠN (CHỮ)' : 'XUẤT CHỮ' }}</span>
              </button>
            </div>

            <!-- Ô GỬI LỜI NHẮN TRỰC TIẾP TỚI KHÁCH CỦA ĐƠN WEB -->
            <div
              v-if="isLinkedOnlineOrder && activeOrderStatus !== 'Đã hủy' && showWebAdminMsgBox"
              class="web-admin-msg-box"
            >
              <div class="wamb-head">
                <span class="wamb-title">
                  <i class="ri-message-3-line"></i>
                  <span>Gửi lời nhắn tới khách đơn web</span>
                </span>
                <div class="wamb-head-right">
                  <span v-if="webAdminMessageLastSent" class="wamb-last-sent" :title="webAdminMessageLastSent">
                    Đã gửi: {{ webAdminMessageLastSent }}
                  </span>
                  <button
                    type="button"
                    class="wamb-close-btn"
                    title="Đóng khung lời nhắn"
                    @click="showWebAdminMsgBox = false"
                  >
                    <i class="ri-close-line"></i>
                  </button>
                </div>
              </div>
              <div class="wamb-row">
                <textarea
                  ref="webAdminMsgTextareaRef"
                  v-model="webAdminMessageInput"
                  class="wamb-input"
                  rows="2"
                  maxlength="400"
                  placeholder="Nhập lời nhắn / thông báo gửi tới mọi người trong đơn này..."
                  @keydown.ctrl.enter.prevent="sendWebOrderMessageNow"
                ></textarea>
                <button
                  type="button"
                  class="wamb-send-btn"
                  :disabled="isSendingWebMessage || !webAdminMessageInput.trim()"
                  @click="sendWebOrderMessageNow"
                >
                  <span v-if="isSendingWebMessage" class="btn-spinner" aria-hidden="true"></span>
                  <i v-else class="ri-send-plane-2-fill"></i>
                  <span>{{ isSendingWebMessage ? 'Đang gửi' : 'Gửi tin' }}</span>
                </button>
              </div>
            </div>

            <!-- KHỐI XÁC NHẬN & CHI TIẾT KHÁCH UPDATE -->
            <div v-if="activePendingWebUpdate?.changes?.length" class="web-update-action-box">
              <div class="wuab-head">
                <i class="ri-notification-badge-fill"></i>
                <span>
                  Khách vừa cập nhật đơn ({{ activePendingWebUpdate.changes.length }} thay đổi)
                </span>
              </div>
              <div class="wuab-btns">
                <button
                  type="button"
                  class="btn-wuab-confirm"
                  @click="confirmWebOrderUpdate"
                >
                  <i class="ri-check-double-line"></i>
                  <span>Xác nhận update</span>
                </button>
                <button
                  type="button"
                  class="btn-wuab-detail"
                  @click="openWebUpdateDetailModal"
                >
                  <i class="ri-file-list-3-line"></i>
                  <span>Xem chi tiết update</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="`t-${t.type}`">
        <div class="toast-msg">{{ t.message }}</div>
        <button class="toast-close" @click="removeToast(t.id)"><i class="app-ico ri-close-line"></i></button>
        <div class="toast-bar" :style="{ animationDuration: (t.timeout || 2500) + 'ms' }"></div>
      </div>
    </div>
  </div>
<div ref="hoaDonRef" class="hoa-don-print">
    <!-- ===== HEADER HÓA ĐƠN ===== -->
    <div class="hd-header">
      <!-- LOGO + TÊN SHOP BÊN TRÁI -->
      <div class="hd-left-group">
        <div class="hd-logo-circle">
          <img
            v-if="logoInfo && (logoInfo.base64 || logoInfo.URL)"
            :src="logoInfo.base64 || logoInfo.URL"
            alt="Logo"
          />
        </div>

        <div class="hd-shop-info-box">
          <div class="hd-shop-name">{{ logoInfo?.Name || 'SA KITCHEN' }}</div>
          <div v-if="thoiGianHoatDongShop" class="hd-shop-time">
            {{ thoiGianHoatDongShop }}
          </div>
        </div>
      </div>

      <!-- CONTACT GÓC PHẢI -->
      <div class="hd-contact-right">
        <div
          v-for="(c, idx) in shopContactList"
          :key="idx"
          class="contact-row"
        >
          <img 
            v-if="c.URL_img_base64 || c.URL_img" 
            :src="c.URL_img_base64 || c.URL_img" 
            class="contact-img"
            alt=""
          />
          <div v-else class="contact-placeholder"></div>
          <span class="contact-text">
            <span class="platform-name">{{ c.PLATFORM_name }}:</span>
            <span class="platform-info">{{ c.INFO }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- ===== TITLE (CĂN GIỮA) ===== -->
    <div class="hd-title-section">
      <h2 class="hd-title">HÓA ĐƠN BÁN HÀNG</h2>
      <div class="hd-meta">
        <span class="hd-code">{{ maHoaDon }}</span>
        <span class="hd-separator">•</span>
        <span class="hd-date">{{ orderCreatedAt || formatDateTimeVN(new Date()) }}</span>
      </div>
    </div>

    <!-- ===== THÔNG TIN KHÁCH HÀNG & GIAO HÀNG (2 CARD) ===== -->
    <div class="hd-info-cards">
      <!-- CARD KHÁCH HÀNG -->
      <div class="info-card">
        <div class="card-title">THÔNG TIN KHÁCH HÀNG</div>
        <div class="card-row">
          <span class="label">Tên khách hàng:</span>
          <span class="value">{{ form.tenKhachHang || '---' }}</span>
        </div>
        <div class="card-row">
          <span class="label">Số điện thoại:</span>
          <span class="value">{{ form.soDienThoai || '---' }}</span>
        </div>
        <div class="card-row">
          <span class="label">Địa chỉ:</span>
          <span class="value">{{ form.diaChi || '---' }}</span>
        </div>
      </div>

      <!-- CARD GIAO HÀNG -->
      <div class="info-card">
        <div class="card-title">THÔNG TIN GIAO HÀNG</div>
        <div class="card-row">
          <span class="label">Thời gian nhận:</span>
          <span class="value">{{ formatDateTimeVN(new Date(thoiGianNhanHang)) }}</span>
        </div>
        <div class="card-row">
          <span class="label">Ghi chú đơn hàng:</span>
          <span class="value">{{ form.ghiChuDonHang || '---' }}</span>
        </div>
      </div>
    </div>

    <!-- ===== BẢNG SẢN PHẨM ===== -->
    <table class="hd-table">
      <thead>
        <tr>
          <th class="col-stt">STT</th>
          <th class="col-name">Tên hàng</th>
          <th v-if="hasAnySize" class="col-size">Size</th>
          <th v-if="hasAnyDvt" class="col-dvt">ĐVT</th>
          <th class="col-qty">SL</th>
          <th class="col-price">Đơn giá</th>
          <th class="col-total">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="isExportByMember">
          <template v-for="sec in exportMemberSections" :key="sec.groupKey">
            <tr class="hd-member-group-row">
              <td :colspan="exportTableColSpan">
                <div class="hd-mg-inner">
                  <span class="hd-mg-name">
                    {{ sec.name }}
                    <span v-if="sec.badge" class="hd-mg-badge">({{ sec.badge }})</span>
                  </span>
                  <span class="hd-mg-meta">{{ sec.totalQty }} món • {{ formatWithCurrency(sec.sectionTotal, donViTienTeChung) }}</span>
                </div>
              </td>
            </tr>
            <tr v-for="(i, mIdx) in sec.rows" :key="`${sec.groupKey}-${mIdx}`">
              <td class="text-center">{{ mIdx + 1 }}</td>
              <td class="text-left">
                <div class="product-name">{{ i.tenHang }}</div>
                <div v-if="i.ghiChuHang" class="product-note">{{ i.ghiChuHang }}</div>
              </td>
              <td v-if="hasAnySize" class="text-center">{{ i.size }}</td>
              <td v-if="hasAnyDvt" class="text-center">{{ i.dvt }}</td>
              <td class="text-center">{{ i.soLuong }}</td>
              <td class="text-right">{{ formatWithCurrency(i.unitPrice, i.donViTienTe) }}</td>
              <td class="text-right price-highlight">{{ formatWithCurrency(i.lineTotal, i.donViTienTe) }}</td>
            </tr>
          </template>
        </template>
        <template v-else>
          <tr v-for="(i, idx) in exportGroupedRows" :key="i.groupKey || idx">
            <td class="text-center">{{ idx + 1 }}</td>
            <td class="text-left">
              <div class="product-name">{{ i.tenHang }}</div>
              <div v-if="i.ghiChuHang" class="product-note">{{ i.ghiChuHang }}</div>
            </td>
            <td v-if="hasAnySize" class="text-center">{{ i.size }}</td>
            <td v-if="hasAnyDvt" class="text-center">{{ i.dvt }}</td>
            <td class="text-center">{{ i.soLuong }}</td>
            <td class="text-right">{{ formatWithCurrency(i.unitPrice, i.donViTienTe) }}</td>
            <td class="text-right price-highlight">{{ formatWithCurrency(i.lineTotal, i.donViTienTe) }}</td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- ===== TỔNG KẾT ===== -->
    <div
      class="hd-summary-row"
      :class="{ 'is-no-bank': hinhThucThanhToan !== 'CHUYEN_KHOAN' || !(ckInfoList && ckInfoList.length) }"
    >
      <!-- LEFT: THÔNG TIN CHUYỂN KHOẢN (chỉ hiện khi chọn Chuyển khoản) -->
      <div class="hd-bank-box" v-if="hinhThucThanhToan === 'CHUYEN_KHOAN' && ckInfoList && ckInfoList.length">
        <div class="bank-title">THÔNG TIN CHUYỂN KHOẢN</div>

        <div class="bank-list-stack">
          <div class="bank-minicard" v-for="(info, idx) in ckInfoList" :key="idx">
            <div class="bank-body">
              <div
                class="bank-qr"
                v-if="getBankDynamicQrPayload(info) || info.QR_IMG_base64 || info.QR_IMG"
              >
                <QrcodeVue
                  v-if="getBankDynamicQrPayload(info)"
                  :value="getBankDynamicQrPayload(info)"
                  :size="102"
                  level="M"
                  render-as="svg"
                  :margin="1"
                  foreground="#0f172a"
                  background="#ffffff"
                  class="bank-qr-svg"
                />
                <img v-else :src="info.QR_IMG_base64 || info.QR_IMG" alt="QR" />
              </div>

              <div class="bank-text" v-if="info.ThongTin">
                {{ info.ThongTin }}
              </div>
            </div>
          </div>
        </div>

        <div class="bank-divider"></div>

        <div class="bank-amount">
          <div class="ba-label">SỐ TIỀN CHUYỂN KHOẢN</div>
          <div class="ba-value">{{ formatWithCurrency(exportTongChuyenKhoan, donViTienTeCK) }}</div>
          <div
            class="ba-sub"
            :class="exportShippingFee > 0 ? 'is-ship-included' : 'is-ship-excluded'"
          >
            ({{ exportShippingFee > 0 ? 'Đã tính ship' : 'Chưa tính ship' }})
          </div>
        </div>
      </div>

      <div class="hd-summary" style="margin-left:0 !important">
      <div class="summary-title">TỔNG KẾT THANH TOÁN</div>
      <div class="summary-row subtotal">
        <span class="summary-label">Tạm tính:</span>
        <span class="summary-value">{{ formatWithCurrency(exportTamTinh, donViTienTeChung) }}</span>
      </div>
      <div class="summary-row discount" v-if="!isExportCostMode && tongGiamGia > 0">
        <span class="summary-label">Giảm giá:</span>
        <span class="summary-value">-{{ formatWithCurrency(tongGiamGia, donViTienTeChung) }}</span>
      </div>
      <div class="summary-row discount" v-if="!isExportCostMode && tongTienChietKhau > 0">
        <span class="summary-label">Chiết khấu:</span>
        <span class="summary-value">-{{ formatWithCurrency(tongTienChietKhau, donViTienTeChung) }}</span>
      </div>
      <div
        class="summary-row goods-total"
        v-if="!isExportCostMode && exportShippingFee > 0"
      >
        <span class="summary-label">{{ (tongGiamGia > 0 || tongTienChietKhau > 0) ? 'Tiền hàng (sau giảm):' : 'Tiền hàng:' }}</span>
        <span class="summary-value">{{ formatWithCurrency(tongCong, donViTienTeChung) }}</span>
      </div>
      <div class="summary-row shipping" v-if="exportShippingFee > 0">
        <span class="summary-label">Tiền ship:</span>
        <span class="summary-value">+{{ formatWithCurrency(exportShippingFee, donViTienTeChung) }}</span>
      </div>
      <div class="summary-row payment">
        <span class="summary-label">Hình thức thanh toán:</span>
        <span class="summary-value">{{ tenHinhThucThanhToan }}</span>
      </div>
      <div class="summary-row total">
        <span class="summary-label">TỔNG CỘNG:</span>
        <span class="summary-value">{{ formatWithCurrency(exportTongCong, donViTienTeChung) }}</span>
      </div>
      <div v-if="khuyenMaiText" class="summary-row promo">
        <span class="summary-label">Ưu đãi :</span>
        <span class="summary-value">{{ khuyenMaiText }}</span>
      </div>
      <div v-if="nextMilestoneHintText" class="hd-promo-next">
        <span class="hd-promo-next-text">{{ nextMilestoneHintText }}</span>
      </div>
    </div>
    </div>

    <!-- ===== FOOTER ===== -->
    <div class="hd-footer-note">
      <div class="footer-line">Cảm ơn quý khách đã mua hàng!</div>
      <div class="footer-line">Vui lòng kiểm tra kỹ hàng trước khi nhận.</div>
      <div class="footer-web">WEBSITE : SAKITCHEN.SHOP</div>
    </div>
  </div>

  <div ref="hoaDonNCCRef" class="hoa-don-ncc">
    <h2 style="text-align:center">ĐƠN HÀNG</h2>
    <p><b>Mã hóa đơn:</b> {{ maHoaDon }}</p>

    <table class="ncc-table">
      <thead>
        <tr>
          <th>STT</th>
          <th>Số lượng</th>
          <th>Tên hàng</th>
          <th>Giá gốc</th>
          <th>Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(i, idx) in items" :key="idx">
          <td>{{ idx + 1 }}</td>
          <td>{{ i.soLuong }}</td>
          <td>{{ i.tenHang }}</td>
          <td>{{ formatWithCurrency(i.giaGoc, i.donViTienTe) }}</td>
          <td>{{ i.ghiChuHang }}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:12px">
      <p><b>Thời gian nhận:</b> {{ formatDateTimeVN(new Date(thoiGianNhanHang)) }}</p>
      <p><b>SĐT:</b> {{ form.soDienThoai }}</p>
      <p><b>Địa chỉ:</b> {{ form.diaChi }}</p>
      <p><b>Hình thức thanh toán:</b> {{ tenHinhThucThanhToan }}</p>
      <p style="font-size:16px"><b>Tổng cộng:</b> {{ formatWithCurrency(tongCong, donViTienTeChung) }}</p>
      <p><b>Ghi chú đơn hàng:</b> {{ form.ghiChuDonHang || '' }}</p>
    </div>
  </div>

  <!-- ================= POPUP HÓA ĐƠN TEXT ================= -->
  <div v-if="showTextInvoice" class="text-invoice-overlay grab-modal-overlay" @click.self="showTextInvoice = false">
    <div class="text-invoice-box grab-sheet">
      <div class="grab-sheet-handle" @click="showTextInvoice = false"></div>
      <div class="text-invoice-header">
        <h3>📄 Hóa đơn (văn bản)</h3>
        <button class="grab-sheet-close" @click="showTextInvoice = false" aria-label="Đóng">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="text-invoice-mode-stack">
        <div class="text-invoice-mode-bar" role="group" aria-label="Chọn kiểu hiển thị hóa đơn văn bản">
          <span class="epm-label">Kiểu xuất:</span>
          <div class="epm-options">
            <button
              type="button"
              class="epm-btn"
              :class="{ active: exportGroupMode === 'grouped' }"
              @click="selectExportGroupMode('grouped')"
            >
              <i class="ri-stack-line"></i>
              <span>Dạng gộp</span>
            </button>
            <button
              type="button"
              class="epm-btn"
              :class="{ active: exportGroupMode === 'by_member' }"
              @click="selectExportGroupMode('by_member')"
            >
              <i class="ri-group-line"></i>
              <span>Từng người</span>
            </button>
          </div>
        </div>

        <div class="text-invoice-mode-bar" role="group" aria-label="Chọn loại giá hóa đơn văn bản">
          <span class="epm-label">Loại giá:</span>
          <div class="epm-options">
            <button
              type="button"
              class="epm-btn"
              :class="{ active: exportPriceMode === 'giaBan' }"
              @click="selectExportPriceMode('giaBan')"
            >
              <i class="ri-price-tag-3-line"></i>
              <span>Giá bán</span>
            </button>
            <button
              type="button"
              class="epm-btn is-cost"
              :class="{ active: exportPriceMode === 'giaGoc' }"
              @click="selectExportPriceMode('giaGoc')"
            >
              <i class="ri-coins-line"></i>
              <span>Giá gốc</span>
            </button>
          </div>
        </div>
      </div>

      <textarea readonly rows="14" ref="textInvoiceRef">
{{ textInvoice }}
      </textarea>

      <div class="actions">
        
        <button class="btn danger" @click="showTextInvoice = false">
          <i class="app-ico ri-close-line"></i> Đóng
        </button>
        <button class="btn primary" :class="{ 'btn-copied': isTextCopied }" @click="copyTextInvoice">
          <i class="app-ico" :class="isTextCopied ? 'ri-check-line' : 'ri-file-copy-line'"></i> 
          {{ isTextCopied ? 'Đã copy' : 'Copy' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ================= MODAL CHI TIẾT SẢN PHẨM ================= -->
  <div v-if="showProductDetail" class="modal modal-overlay-blur grab-modal-overlay" @click="showProductDetail = false">
    <div class="product-detail-box grab-sheet" @click.stop>
      <div class="grab-sheet-handle" @click="showProductDetail = false"></div>
      <div class="grab-detail-topbar">
        <span class="grab-detail-topbar-title">{{ selectedProduct.Ten_hang }}</span>
        <button class="grab-sheet-close" @click="showProductDetail = false" aria-label="Đóng">
          <i class="ri-close-line"></i>
        </button>
      </div>
      <button class="close-btn desktop-detail-close" @click="showProductDetail = false"><i class="app-ico ri-close-line"></i></button>

      <div class="detail-grid">
        <!-- HÌNH ẢNH -->
        <div class="detail-images">
          <div class="main-image">
            <img 
              v-if="currentMainImage || selectedProduct.Main_img_base64" 
              :src="currentMainImage || selectedProduct.Main_img_base64" 
              :alt="selectedProduct.Ten_hang"
            />
            <div v-else class="no-img-large"><i class="app-ico ri-inbox-archive-line"></i></div>
          </div>

          <div v-if="productImages.length > 0" class="thumbnail-list">
            <div
              v-for="(img, idx) in productImages"
              :key="idx"
              class="thumbnail"
              @click="changeMainImage(img)"
            >
              <img :src="img" alt="Thumbnail" />
            </div>
          </div>
        </div>

        <!-- THÔNG TIN -->
        <div class="detail-info">
          <h2 class="detail-title">{{ selectedProduct.Ten_hang }}</h2>
          
          <!-- Meta Tags & Stock -->
          <div class="detail-meta-tags">
            <span class="meta-tag meta-category">
              <i class="ri-price-tag-3-line"></i>
              {{ selectedProduct.Danh_muc }}
            </span>
            <span v-if="selectedProduct.Size" class="meta-tag meta-size">
              <i class="ri-ruler-line"></i>
              {{ selectedProduct.Size }}
            </span>
            <span class="meta-tag meta-unit">
              <i class="ri-inbox-line"></i>
              {{ selectedProduct.Dvt }}
            </span>
            <span class="meta-tag meta-stock" :class="getStockClass(selectedProduct)">
              <i :class="isOutOfStock(selectedProduct) ? 'ri-close-circle-line' : 'ri-checkbox-circle-line'"></i>
              <b>{{ isOutOfStock(selectedProduct) ? 'Hết hàng' : 'Còn hàng' }}</b>
            </span>
          </div>

          <!-- Price Section -->
          <div class="detail-price-section">
            <div class="price-section-header">
              <i class="ri-money-dollar-circle-line"></i>
              Thông tin giá
            </div>
            
            <!-- Cost Price (Giá gốc) -->
            <div v-if="selectedProduct.Gia_goc" class="price-row price-row-cost">
              <div class="price-row-label">
                <i class="ri-price-tag-line"></i>
                Giá gốc
              </div>
              <div class="price-row-value price-cost">
                {{ formatWithCurrency(selectedProduct.Gia_goc, selectedProduct.Don_vi_tien_te) }}
              </div>
            </div>

            <!-- Selling Price (Giá bán) -->
            <div class="price-row price-row-selling">
              <div class="price-row-label">
                <i class="ri-shopping-bag-line"></i>
                Giá bán
              </div>
              <div class="price-row-value">
                <div v-if="selectedProduct.Gia_Giam > 0" class="price-with-discount">
                  <div class="price-current">
                    {{ formatWithCurrency(selectedProduct.Gia_Giam, selectedProduct.Don_vi_tien_te) }}
                  </div>
                  <div class="price-original-strike">
                    {{ formatWithCurrency(selectedProduct.Gia_ban, selectedProduct.Don_vi_tien_te) }}
                  </div>
                </div>
                <div v-else class="price-normal-large">
                  {{ formatWithCurrency(selectedProduct.Gia_ban, selectedProduct.Don_vi_tien_te) }}
                </div>
              </div>
            </div>

            <!-- Profit Indicator (if both prices available) -->
            <div v-if="selectedProduct.Gia_goc && selectedProduct.Gia_ban" class="profit-indicator">
              <div class="profit-label">
                <i class="ri-line-chart-line"></i>
                Lợi nhuận dự kiến
              </div>
              <div class="profit-value">
                <i class="ri-arrow-right-up-line" style="margin-right: 4px;"></i>
                {{ formatWithCurrency(
                  (selectedProduct.Gia_Giam > 0 ? selectedProduct.Gia_Giam : selectedProduct.Gia_ban) - selectedProduct.Gia_goc,
                  selectedProduct.Don_vi_tien_te
                ) }}
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="detail-desc">
            <div class="detail-section-title">
              <i class="ri-file-text-line"></i>
              Mô tả sản phẩm
            </div>
            <p>{{ selectedProduct.Mo_ta || 'Không có mô tả' }}</p>
          </div>

          <!-- Note Input -->
          <div class="detail-note-input">
            <label class="detail-section-title">
              <i class="ri-sticky-note-line"></i>
              Ghi chú hàng
            </label>
            <textarea 
              v-model="productNotes[selectedProduct.Ma_hang]"
              placeholder="VD: Hàng dễ vỡ, chọn size lớn, giao riêng..."
              rows="3"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <!-- Quantity Control - Matches Card Style -->
            <div class="qty-note-row">
              <div class="qty-stepper-modern">
                <button 
                  class="qty-btn-circle" 
                  @click="decreaseQty(selectedProduct)"
                  :disabled="productQty[selectedProduct.Ma_hang] <= 1 || isOutOfStock(selectedProduct)"
                >
                  <i class="ri-subtract-line"></i>
                </button>
                <input 
                  type="number" 
                  v-model.number="productQty[selectedProduct.Ma_hang]"
                  min="1"
                  :disabled="isOutOfStock(selectedProduct)"
                  class="qty-input-box"
                />
                <button 
                  class="qty-btn-circle" 
                  @click="increaseQty(selectedProduct)"
                  :disabled="isOutOfStock(selectedProduct)"
                >
                  <i class="ri-add-line"></i>
                </button>
              </div>
            </div>

            <!-- Add to Cart Button - Full Width -->
            <button 
              class="btn-add-large" 
              @click="addProductToCart(selectedProduct); showProductDetail = false"
              :disabled="isOutOfStock(selectedProduct)"
            >
              <i class="app-ico" :class="isOutOfStock(selectedProduct) ? 'ri-close-circle-line' : 'ri-shopping-cart-line'"></i>
              {{ isOutOfStock(selectedProduct) ? 'Hết hàng' : 'Thêm vào đơn' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showEditModal" class="modal modal-overlay-blur grab-modal-overlay" @click.self="showEditModal = false">
    <div class="modal-box premium-modal-v4 grab-sheet">
      <div class="grab-sheet-handle" @click="showEditModal = false"></div>
      <!-- HEADER -->
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box">
            <i class="ri-edit-2-fill"></i>
          </div>
          <div>
            <h3 class="pmv4-title">Chỉnh sửa sản phẩm</h3>
            <p class="pmv4-subtitle">{{ editItem.tenHang }}</p>
          </div>
        </div>
        <button class="pmv4-close" @click="showEditModal=false">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <!-- BODY -->
      <div class="pmv4-body">
        <!-- STATUS INFO BANNER -->
        <div class="pmv4-stock-strip" :class="isEditModalOutOfStock ? 'strip-danger' : 'strip-success'">
          <div class="strip-item">
            <i :class="isEditModalOutOfStock ? 'ri-close-circle-fill' : 'ri-checkbox-circle-fill'"></i>
            <span class="strip-text">Trạng thái: <b>{{ isEditModalOutOfStock ? 'Hết hàng' : 'Còn hàng' }}</b></span>
          </div>
          <div class="strip-item">
            <i class="ri-shopping-cart-2-fill"></i>
            <span class="strip-text">Trong đơn: <b>{{ items[editIndex]?.soLuong || 0 }}</b></span>
          </div>
        </div>

        <!-- MAIN FORM GRID -->
        <div class="pmv4-form-grid">
          <div v-if="editModalSiblings.length > 1" class="pmv4-field-group span-full">
            <label class="pmv4-label">Chọn người để sửa món này</label>
            <div class="pmv4-member-pills">
              <button
                v-for="sib in editModalSiblings"
                :key="sib.idx"
                type="button"
                class="pmv4-member-pill"
                :class="{ active: editIndex === sib.idx }"
                @click="switchEditModalSibling(sib)"
              >
                <i
                  class="app-ico"
                  :class="sib.role === 'admin' ? 'ri-store-2-line' : 'ri-user-3-line'"
                ></i>
                <span>{{ sib.personName }}</span>
                <strong>×{{ sib.item.soLuong }}</strong>
              </button>
            </div>
          </div>
          <div v-else-if="showMemberTargetBar" class="pmv4-field-group span-full">
            <label class="pmv4-label">Thuộc về người đặt</label>
            <div class="pmv4-member-pills">
              <button
                v-for="m in invoiceOrderMembers"
                :key="m.groupKey"
                type="button"
                class="pmv4-member-pill"
                :class="{ active: editItemMemberKey === m.groupKey }"
                @click="editItemMemberKey = m.groupKey"
              >
                <i
                  class="app-ico"
                  :class="m.role === 'admin' ? 'ri-store-2-line' : 'ri-user-3-line'"
                ></i>
                <span>{{ m.name }}</span>
                <span v-if="m.dupTag" class="omg-dup-tag">{{ m.dupTag }}</span>
              </button>
            </div>
          </div>

          <!-- Row 1: Quantity (Prominent) -->
          <div class="pmv4-field-group span-full">
            <label class="pmv4-label">Số lượng mua</label>
            <div class="pmv4-stepper">
              <button 
                class="pmv4-step-btn" 
                @click="editItem.soLuong > 1 ? editItem.soLuong-- : null"
                :disabled="editItem.soLuong <= 1"
              >
                <i class="ri-subtract-line"></i>
              </button>
              <div class="pmv4-step-input-wrap">
                <input 
                  type="number" 
                  v-model.number="editItem.soLuong" 
                  min="1"
                  class="pmv4-step-input"
                />
                <span class="pmv4-input-unit">{{ editItem.dvt }}</span>
              </div>
              <button 
                class="pmv4-step-btn" 
                @click="editItem.soLuong++"
              >
                <i class="ri-add-line"></i>
              </button>
            </div>
          </div>

          <!-- Row 1b: Unit (ĐVT) -->
          <div class="pmv4-field-group span-full">
            <label class="pmv4-label">Đơn vị tính (ĐVT)</label>
            <div class="pmv4-input-wrap">
              <input
                type="text"
                v-model="editItem.dvt"
                list="ds-edit-dvt"
                placeholder="VD: Phần, Ly, Kg, Hộp..."
                class="pmv4-input"
              />
              <datalist id="ds-edit-dvt">
                <option v-for="u in uniqueDvts" :key="u" :value="u">{{ u }}</option>
              </datalist>
            </div>
          </div>

          <!-- Row 2: Pricing -->
          <div class="pmv4-field-group">
            <label class="pmv4-label">Giá bán</label>
            <div class="pmv4-input-wrap">
              <input type="number" v-model.number="editItem.giaBan" class="pmv4-input text-highlight" />
              <span class="pmv4-input-unit">{{ editItem.donViTienTe || 'VND' }}</span>
            </div>
          </div>
          <div class="pmv4-field-group">
            <label class="pmv4-label">Giá vốn</label>
            <div class="pmv4-input-wrap">
              <input
                type="number"
                v-model.number="editItem.giaGoc"
                min="0"
                step="any"
                class="pmv4-input"
              />
              <span class="pmv4-input-unit">{{ editItem.donViTienTe || 'VND' }}</span>
            </div>
          </div>

          <!-- Row 3: Discount -->
          <div class="pmv4-field-group">
            <label class="pmv4-label text-subtle">Giảm tiền</label>
            <div class="pmv4-input-wrap">
              <input type="number" v-model.number="editItem.giamGia" class="pmv4-input text-danger-soft" />
            </div>
          </div>
          <div class="pmv4-field-group">
            <label class="pmv4-label text-subtle">Chiết khấu %</label>
            <div class="pmv4-input-wrap">
              <input type="number" v-model.number="editItem.chietKhau" class="pmv4-input text-danger-soft" />
            </div>
          </div>

          <!-- Row 3b: CK NCC -->
          <div class="pmv4-field-group span-full">
            <label class="pmv4-label">CK NCC (% giá gốc hoặc Tiền trực tiếp)</label>
            <div class="ncc-inline-control">
              <div class="ncc-type-toggle" role="group">
                <button
                  type="button"
                  class="ncc-type-btn"
                  :class="{ active: editItem.nccLoaiGiam !== 'money' }"
                  @click="editItem.nccLoaiGiam = 'percent'"
                >
                  %
                </button>
                <button
                  type="button"
                  class="ncc-type-btn"
                  :class="{ active: editItem.nccLoaiGiam === 'money' }"
                  @click="editItem.nccLoaiGiam = 'money'"
                >
                  Tiền ({{ editItem.donViTienTe || 'P' }})
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                v-model.number="editItem.nccGiaTriGiam"
                placeholder="0"
                class="ncc-inline-input"
              />
            </div>
          </div>

          <!-- Row 4: Note -->
          <div class="pmv4-field-group span-full">
            <label class="pmv4-label">Ghi chú hàng</label>
            <textarea 
              v-model="editItem.ghiChuHang" 
              rows="1" 
              class="pmv4-textarea" 
              placeholder="Nhập ghi chú..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="pmv4-footer">
        <button class="pmv4-btn-ghost" @click="showEditModal=false">Hủy</button>
        <button class="pmv4-btn-primary" @click="saveEditItem">Xác nhận</button>
      </div>
    </div>
  </div>

  <div v-if="showSuccessModal" class="vip-modal-overlay grab-modal-overlay" @click.self="confirmSuccessReload">
     <div class="vip-success-card grab-sheet">
        <div class="grab-sheet-handle" @click="confirmSuccessReload"></div>
        <div class="vip-icon-box">
           <div class="vip-success-ring"></div>
           <i class="ri-check-line vip-check-icon"></i>
        </div>
        <h3 class="vip-title">HOÀN THÀNH ĐƠN</h3>
        <p class="vip-message">{{ successMessage }}</p>
        <button class="vip-btn-ok" @click="confirmSuccessReload">OK</button>
     </div>
  </div>

  <!-- MODAL XÁC NHẬN HOÀN THÀNH / HỦY ĐƠN KÈM LỜI NHẮN -->
  <div
    v-if="orderActionConfirmModal.show"
    class="modal modal-overlay-blur grab-modal-overlay oac-overlay"
    @click.self="closeOrderActionConfirm"
  >
    <div class="modal-box premium-modal-v4 grab-sheet oac-modal-box">
      <div class="grab-sheet-handle" @click="closeOrderActionConfirm"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box" :class="{ 'is-danger': orderActionConfirmModal.action === 'cancel' }">
            <i :class="orderActionConfirmModal.action === 'cancel' ? 'ri-close-circle-fill' : 'ri-checkbox-circle-fill'"></i>
          </div>
          <div>
            <h3 class="pmv4-title">{{ orderActionConfirmModal.title }}</h3>
            <p class="pmv4-subtitle">Đơn #{{ maHoaDon }}</p>
          </div>
        </div>
        <button type="button" class="pmv4-close" @click="closeOrderActionConfirm">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body oac-body">
        <p class="oac-desc">{{ orderActionConfirmModal.description }}</p>

        <div v-if="orderActionConfirmModal.showMessageBox" class="oac-msg-wrap">
          <div class="oac-msg-head">
            <span class="oac-msg-label">
              <i class="ri-notification-3-line"></i>
              Gửi thông báo tới khách của đơn (tùy chọn)
            </span>
            <button
              v-if="orderActionConfirmModal.messageInput"
              type="button"
              class="oac-msg-clear"
              @click="orderActionConfirmModal.messageInput = ''"
            >
              Xóa
            </button>
          </div>
          <div class="oac-msg-chips">
            <button
              v-for="preset in orderActionMessagePresets"
              :key="preset"
              type="button"
              class="oac-msg-chip"
              :class="{ active: orderActionConfirmModal.messageInput.trim() === preset }"
              @click="orderActionConfirmModal.messageInput = preset"
            >
              {{ preset }}
            </button>
          </div>
          <textarea
            v-model="orderActionConfirmModal.messageInput"
            class="oac-msg-input"
            rows="3"
            maxlength="400"
            :placeholder="
              orderActionConfirmModal.action === 'cancel'
                ? 'VD: Xin lỗi quý khách, quán đã hết món hoặc đang quá tải...'
                : 'VD: Cảm ơn quý khách! Hôm nay quán có ưu đãi...'
            "
          ></textarea>
        </div>

        <div class="oac-actions">
          <button
            type="button"
            class="oac-btn is-cancel"
            :disabled="isSubmitting || isOrderActionLoading"
            @click="closeOrderActionConfirm"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            class="oac-btn"
            :class="orderActionConfirmModal.action === 'cancel' ? 'is-danger' : 'is-success'"
            :disabled="isSubmitting || isOrderActionLoading"
            @click="confirmOrderActionModal"
          >
            {{ orderActionConfirmModal.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showDiscountModal" class="modal modal-overlay-blur grab-modal-overlay" @click.self="showDiscountModal = false">
    <div class="modal-box premium-modal-v4 grab-sheet" style="max-width: 400px">
      <div class="grab-sheet-handle" @click="showDiscountModal = false"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box">
            <i class="ri-price-tag-3-fill"></i>
          </div>
          <div>
            <h3 class="pmv4-title">{{ activeDiscountType === 'money' ? 'Giảm giá thêm' : 'Chiết khấu thêm' }}</h3>
            <p class="pmv4-subtitle">
              {{ activeDiscountType === 'money' ? 'Nhập số tiền giảm giá trực tiếp' : 'Nhập % chiết khấu' }}
            </p>
          </div>
        </div>
        <button class="pmv4-close" @click="showDiscountModal = false">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body">
        <div class="pmv4-form-grid">
          <!-- Discount Money -->
          <div v-if="activeDiscountType === 'money'" class="pmv4-field-group span-full">
            <label class="pmv4-label">Số tiền giảm</label>
            <div class="pmv4-input-wrap">
              <input 
                type="number" 
                v-model.number="tempGlobalGiamGia" 
                class="pmv4-input text-danger-soft" 
                placeholder="0"
              />
              <span class="pmv4-input-unit">{{ donViTienTeChung }}</span>
            </div>
          </div>

          <!-- Discount Rebate -->
          <div v-if="activeDiscountType === 'percent'" class="pmv4-field-group span-full">
            <label class="pmv4-label">Phần trăm chiết khấu (%)</label>
            <div class="pmv4-input-wrap">
              <input 
                type="number" 
                v-model.number="tempGlobalChietKhauPercent" 
                class="pmv4-input text-danger-soft" 
                placeholder="0"
                min="0"
                max="100"
              />
              <span class="pmv4-input-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pmv4-footer">
        <button class="pmv4-btn-ghost" @click="showDiscountModal = false">Hủy</button>
        <button class="pmv4-btn-primary" @click="applyGlobalDiscount">Áp dụng</button>
      </div>
    </div>
  </div>

  <!-- ================= MODAL CHỌN LOẠI GIÁ XUẤT HÓA ĐƠN ================= -->
  <div
    v-if="showExportPriceChoiceModal"
    class="modal modal-overlay-blur grab-modal-overlay"
    @click.self="closeExportPriceChoiceModal"
  >
    <div class="modal-box premium-modal-v4 grab-sheet" style="max-width: 500px">
      <div class="grab-sheet-handle" @click="closeExportPriceChoiceModal"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box">
            <i :class="pendingExportAction === 'text' ? 'ri-file-text-line' : 'ri-image-line'"></i>
          </div>
          <div>
            <h3 class="pmv4-title">Chọn kiểu &amp; giá xuất hóa đơn</h3>
            <p class="pmv4-subtitle">
              {{ pendingExportAction === 'text' ? 'Xuất hóa đơn (chữ)' : 'Xuất ảnh hóa đơn' }} — chọn trực tiếp 1 tùy chọn bên dưới
            </p>
          </div>
        </div>
        <button class="pmv4-close" @click="closeExportPriceChoiceModal">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body">
        <div class="export-choice-sections">
          <div class="export-choice-section">
            <div class="ecs-title">
              <i class="ri-stack-line"></i>
              <span>Dạng gộp</span>
              <span class="ecs-sub">Gộp các món giống nhau thành 1 dòng</span>
            </div>
            <div class="ecs-row">
              <button type="button" class="export-choice-card is-sell" @click="confirmExportOptions('grouped', 'giaBan')">
                <div class="ecc-head">
                  <i class="ri-price-tag-3-line"></i>
                  <span>Giá bán</span>
                </div>
                <div class="ecc-total font-mono">{{ formatWithCurrency(tongCong + normalizedPhiShip, donViTienTeChung) }}</div>
              </button>
              <button type="button" class="export-choice-card is-cost" @click="confirmExportOptions('grouped', 'giaGoc')">
                <div class="ecc-head">
                  <i class="ri-coins-line"></i>
                  <span>Giá gốc</span>
                </div>
                <div class="ecc-total font-mono">{{ formatWithCurrency(totalCostAmount, donViTienTeChung) }}</div>
              </button>
            </div>
          </div>

          <div class="export-choice-section">
            <div class="ecs-title">
              <i class="ri-group-line"></i>
              <span>Theo từng người</span>
              <span class="ecs-sub">Tách nhóm theo từng người đặt ({{ exportMemberSections.length }} nhóm)</span>
            </div>
            <div class="ecs-row">
              <button type="button" class="export-choice-card is-sell" @click="confirmExportOptions('by_member', 'giaBan')">
                <div class="ecc-head">
                  <i class="ri-price-tag-3-line"></i>
                  <span>Giá bán</span>
                </div>
                <div class="ecc-total font-mono">{{ formatWithCurrency(tongCong + normalizedPhiShip, donViTienTeChung) }}</div>
              </button>
              <button type="button" class="export-choice-card is-cost" @click="confirmExportOptions('by_member', 'giaGoc')">
                <div class="ecc-head">
                  <i class="ri-coins-line"></i>
                  <span>Giá gốc</span>
                </div>
                <div class="ecc-total font-mono">{{ formatWithCurrency(totalCostAmount, donViTienTeChung) }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pmv4-footer">
        <button class="pmv4-btn-ghost" @click="closeExportPriceChoiceModal">Hủy</button>
      </div>
    </div>
  </div>

  <!-- ================= MODAL THÊM / QUẢN LÝ NGƯỜI ĐẶT ================= -->
  <div
    v-if="showAddMemberModal"
    class="modal modal-overlay-blur grab-modal-overlay"
    @click.self="closeAddMemberModal"
  >
    <div class="modal-box premium-modal-v4 grab-sheet" style="max-width: 480px">
      <div class="grab-sheet-handle" @click="closeAddMemberModal"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box">
            <i class="ri-user-add-line"></i>
          </div>
          <div>
            <h3 class="pmv4-title">Thêm người đặt vào đơn</h3>
            <p class="pmv4-subtitle">Nhập tên từng người hoặc nhiều tên cách nhau bởi dấu phẩy (,)</p>
          </div>
        </div>
        <button class="pmv4-close" @click="closeAddMemberModal">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body">
        <div class="add-member-form">
          <input
            ref="newMemberInputRef"
            v-model="newMemberNameInput"
            type="text"
            class="amf-input"
            placeholder="Ví dụ: Lan, Hùng, Phòng KT..."
            @keyup.enter="submitAddMembers(false)"
          />
          <button
            type="button"
            class="amf-add-btn"
            :disabled="!String(newMemberNameInput || '').trim()"
            @click="submitAddMembers(false)"
          >
            <i class="ri-add-line"></i>
            <span>Thêm</span>
          </button>
        </div>

        <!-- CẢNH BÁO TRÙNG TÊN & TÙY CHỌN XỬ LÝ -->
        <div v-if="activeDuplicatePrompt" class="amf-dup-alert">
          <div class="amf-dup-head">
            <i class="ri-alert-line"></i>
            <div class="amf-dup-text">
              <div class="amf-dup-title">
                Tên <strong>"{{ activeDuplicatePrompt.rawName }}"</strong> đã có trong đơn
                <span class="amf-dup-meta">
                  ({{ activeDuplicatePrompt.existingMember.totalQty }} món ·
                  {{ formatWithCurrency(activeDuplicatePrompt.existingMember.subtotal, donViTienTeChung) }})
                </span>
              </div>
              <div class="amf-dup-sub">
                Nếu đây là <strong>người khác trùng tên</strong>, bạn có muốn vẫn thêm tách riêng không?
              </div>
            </div>
          </div>
          <div class="amf-dup-actions">
            <button
              type="button"
              class="amf-dup-btn is-confirm"
              @click="resolveDuplicateMemberPrompt('new')"
            >
              <i class="ri-user-add-line"></i>
              <span>Vẫn thêm người mới</span>
            </button>
            <button
              type="button"
              class="amf-dup-btn is-existing"
              @click="resolveDuplicateMemberPrompt('existing')"
            >
              <i class="ri-user-follow-line"></i>
              <span>Chọn người đã có</span>
            </button>
            <button
              type="button"
              class="amf-dup-btn is-rename"
              @click="resolveDuplicateMemberPrompt('rename')"
            >
              <i class="ri-edit-line"></i>
              <span>Đặt tên khác</span>
            </button>
          </div>
        </div>

        <div v-if="invoiceOrderMembers.length" class="amf-members-section">
          <div class="amf-section-title">
            <span>Người trong đơn ({{ invoiceOrderMembers.length }})</span>
            <small>Chọn một người để gán món khi bấm sản phẩm</small>
          </div>
          <div class="amf-member-list">
            <div
              v-for="m in invoiceOrderMembers"
              :key="m.groupKey"
              class="amf-member-row"
              :class="{ active: activeTargetMemberKey === m.groupKey }"
            >
              <template v-if="editingMemberKey === m.groupKey">
                <input
                  v-model="editingMemberName"
                  type="text"
                  class="amf-rename-input"
                  placeholder="Tên mới..."
                  @keyup.enter="saveRenameOrderMember(m)"
                  @keyup.esc="cancelRenameOrderMember"
                />
                <div class="amf-row-actions">
                  <button
                    type="button"
                    class="amf-icon-btn is-save"
                    @click="saveRenameOrderMember(m)"
                    title="Lưu tên"
                  >
                    <i class="ri-check-line"></i>
                  </button>
                  <button
                    type="button"
                    class="amf-icon-btn"
                    @click="cancelRenameOrderMember"
                    title="Hủy"
                  >
                    <i class="ri-close-line"></i>
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="amf-member-info" @click="selectMemberFromModal(m.groupKey)">
                  <i
                    class="app-ico"
                    :class="m.role === 'admin' ? 'ri-store-2-line' : 'ri-user-3-line'"
                  ></i>
                  <div class="amf-member-text">
                    <div class="amf-member-name">
                      <span>{{ m.name }}</span>
                      <span v-if="m.dupTag" class="omg-dup-tag">{{ m.dupTag }}</span>
                      <span v-if="m.badge" class="omg-badge" :class="`role-${m.role}`">{{ m.badge }}</span>
                    </div>
                    <div class="amf-member-meta">
                      {{ m.totalQty }} món · {{ formatWithCurrency(m.subtotal, donViTienTeChung) }}
                    </div>
                  </div>
                </div>
                <div class="amf-row-actions">
                  <button
                    type="button"
                    class="amf-select-btn"
                    :class="{ active: activeTargetMemberKey === m.groupKey }"
                    @click="selectMemberFromModal(m.groupKey)"
                  >
                    {{ activeTargetMemberKey === m.groupKey ? 'Đang chọn' : 'Chọn' }}
                  </button>
                  <button
                    v-if="m.role !== 'admin'"
                    type="button"
                    class="amf-icon-btn"
                    @click="startRenameOrderMember(m)"
                    title="Đổi tên người đặt"
                  >
                    <i class="ri-edit-line"></i>
                  </button>
                  <button
                    v-if="m.entries.length === 0 && m.isCustom"
                    type="button"
                    class="amf-icon-btn is-del"
                    @click="removeCustomOrderMember(m)"
                    title="Xóa người đặt này"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="pmv4-footer">
        <button class="pmv4-btn-ghost" @click="closeAddMemberModal">Đóng</button>
        <button
          v-if="String(newMemberNameInput || '').trim()"
          class="pmv4-btn-primary"
          @click="submitAddMembers(true)"
        >
          Thêm &amp; Chọn món
        </button>
      </div>
    </div>
  </div>

  <!-- ================= MODAL ĐƠN ĐANG CHỜ DUYỆT (CHUÔNG) ================= -->
  <div
    v-if="showPendingOrdersModal"
    class="modal modal-overlay-blur grab-modal-overlay"
    @click.self="closePendingOrdersModal"
  >
    <div class="modal-box premium-modal-v4 grab-sheet" style="max-width: 560px">
      <div class="grab-sheet-handle" @click="closePendingOrdersModal"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box" :class="{ 'is-alert-red': totalBellNotificationCount > 0 }">
            <i class="ri-notification-3-fill"></i>
          </div>
          <div>
            <h3 class="pmv4-title">Thông báo đơn web ({{ totalBellNotificationCount }})</h3>
            <p class="pmv4-subtitle">
              {{
                totalBellNotificationCount > 0
                  ? 'Chọn đơn cập nhật để đi tới tab hoặc đưa đơn mới vào bảng'
                  : 'Tất cả đơn chờ duyệt đã đồng bộ và chưa có cập nhật mới'
              }}
            </p>
          </div>
        </div>
        <button class="pmv4-close" @click="closePendingOrdersModal">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body">
        <!-- PHẦN 1: ĐƠN ĐÃ MỞ TAB NHƯNG KHÁCH VỪA CẬP NHẬT -->
        <div v-if="tabsWithPendingUpdate.length" class="po-update-section">
          <div class="po-section-label is-update">
            <i class="ri-refresh-line"></i>
            <span>Khách vừa cập nhật món ({{ tabsWithPendingUpdate.length }})</span>
          </div>
          <div class="po-list">
            <div
              v-for="uTab in tabsWithPendingUpdate"
              :key="'upd-' + uTab.id"
              class="po-card is-update-card"
              style="cursor: pointer;"
              @click="navigateToUpdatedOrderTab(uTab.id)"
            >
              <div class="po-card-top">
                <div class="po-code-group">
                  <span class="po-code">#{{ uTab.sourceOrderId || uTab.maHoaDon }}</span>
                  <span class="po-badge-updated">Khách vừa cập nhật</span>
                </div>
                <span class="po-total">
                  {{ uTab.pendingWebUpdate.changes.length }} thay đổi
                </span>
              </div>

              <div class="po-customer-row">
                <strong><i class="ri-user-3-line"></i> {{ uTab.customer?.tenKhachHang || 'Khách web' }}</strong>
                <span v-if="uTab.customer?.soDienThoai" class="po-phone">· {{ uTab.customer.soDienThoai }}</span>
              </div>

              <div class="po-update-preview-list">
                <div
                  v-for="(ch, cIdx) in uTab.pendingWebUpdate.changes.slice(0, 4)"
                  :key="cIdx"
                  class="po-update-preview-item"
                  :class="`is-${ch.type}`"
                >
                  {{ ch.summary }}
                </div>
                <div v-if="uTab.pendingWebUpdate.changes.length > 4" class="po-update-more">
                  + {{ uTab.pendingWebUpdate.changes.length - 4 }} thay đổi khác...
                </div>
              </div>

              <div class="po-card-actions">
                <button
                  type="button"
                  class="po-import-btn is-jump-update"
                  @click.stop="navigateToUpdatedOrderTab(uTab.id)"
                >
                  <i class="ri-arrow-right-circle-line"></i>
                  <span>Đi tới tab &amp; xem món mới</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- PHẦN 2: ĐƠN MỚI CHƯA ĐƯA VÀO BẢNG -->
        <div v-if="tabsWithPendingUpdate.length && unopenedPendingOrders.length" class="po-section-label">
          <i class="ri-inbox-unarchive-line"></i>
          <span>Đơn mới chờ duyệt ({{ unopenedPendingOrders.length }})</span>
        </div>

        <div v-if="!unopenedPendingOrders.length && !tabsWithPendingUpdate.length" class="po-empty">
          <i class="ri-checkbox-circle-line"></i>
          <span>Hiện không có đơn chờ duyệt hoặc cập nhật mới từ khách.</span>
        </div>

        <div v-else-if="unopenedPendingOrders.length" class="po-list">
          <div
            v-for="ord in unopenedPendingOrders"
            :key="ord.maHoaDon"
            class="po-card"
          >
            <div class="po-card-top">
              <div class="po-code-group">
                <span class="po-code">#{{ ord.maHoaDon }}</span>
                <span class="po-badge-waiting">Chờ duyệt</span>
              </div>
              <span class="po-total font-mono">
                {{ formatWithCurrency(ord.tongCong, ord.donViTienTe) }}
              </span>
            </div>

            <div class="po-customer-row">
              <strong><i class="ri-user-3-line"></i> {{ ord.tenKhach }}</strong>
              <span v-if="ord.soDienThoai" class="po-phone">· {{ ord.soDienThoai }}</span>
            </div>

            <div v-if="ord.diaChi" class="po-sub-row">
              <i class="ri-map-pin-line"></i>
              <span>{{ ord.diaChi }}</span>
            </div>

            <div v-if="ord.ngayTao" class="po-sub-row">
              <i class="ri-calendar-check-line"></i>
              <span>Tạo đơn: {{ ord.ngayTao }}</span>
            </div>

            <div class="po-sub-row">
              <i class="ri-time-line"></i>
              <span>
                <template v-if="ord.thoiGianNhanHang">Nhận: {{ ord.thoiGianNhanHang }} · </template>
                {{ ord.hinhThucTT }}
              </span>
            </div>

            <div v-if="ord.itemsPreview || ord.totalQty > 0" class="po-items-preview">
              <i class="ri-shopping-basket-2-line"></i>
              <span>
                <strong v-if="ord.totalQty > 0">{{ ord.totalQty }} món:</strong>
                {{ ord.itemsPreview || 'Đang đồng bộ chi tiết món...' }}
              </span>
            </div>

            <div class="po-card-actions">
              <button
                type="button"
                class="po-import-btn"
                :class="{ 'is-open-tab': ord.isOpenedInTab }"
                :disabled="importingPendingOrderId === ord.maHoaDon"
                @click="importPendingOrderToTable(ord.maHoaDon)"
              >
                <span v-if="importingPendingOrderId === ord.maHoaDon" class="btn-spinner" aria-hidden="true"></span>
                <i v-else :class="ord.isOpenedInTab ? 'ri-arrow-right-circle-line' : 'ri-download-2-line'"></i>
                <span>{{ ord.isOpenedInTab ? 'Mở tab đang có' : 'Đưa vào bảng' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pmv4-footer">
        <button class="pmv4-btn-ghost" @click="closePendingOrdersModal">Đóng</button>
      </div>
    </div>
  </div>

  <!-- ================= MODAL CHI TIẾT KHÁCH UPDATE ĐƠN ================= -->
  <div
    v-if="showWebUpdateDetailModal && activePendingWebUpdate"
    class="modal modal-overlay-blur grab-modal-overlay"
    @click.self="showWebUpdateDetailModal = false"
  >
    <div class="modal-box premium-modal-v4 grab-sheet" style="max-width: 560px">
      <div class="grab-sheet-handle" @click="showWebUpdateDetailModal = false"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box is-alert-amber">
            <i class="ri-history-line"></i>
          </div>
          <div>
            <h3 class="pmv4-title">
              Chi tiết khách cập nhật đơn #{{ activePendingWebUpdate.orderId || maHoaDon }}
            </h3>
            <p class="pmv4-subtitle">
              Tổng cộng {{ activePendingWebUpdate.changes.length }} thay đổi mới nhất từ khách hàng
            </p>
          </div>
        </div>
        <button class="pmv4-close" @click="showWebUpdateDetailModal = false">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body">
        <div class="wud-change-list">
          <div
            v-for="(ch, cIdx) in activePendingWebUpdate.changes"
            :key="cIdx"
            class="wud-change-card"
            :class="`is-${ch.type}`"
          >
            <span class="wud-type-badge" :class="`is-${ch.type}`">
              {{ getWebUpdateTypeLabel(ch.type) }}
            </span>
            <div class="wud-change-content">
              <div class="wud-change-summary">{{ ch.summary }}</div>
              <div v-if="ch.detail" class="wud-change-sub">{{ ch.detail }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="pmv4-footer">
        <button class="pmv4-btn-ghost" @click="showWebUpdateDetailModal = false">Đóng</button>
        <button class="pmv4-btn-primary is-confirm-update" @click="confirmWebOrderUpdate">
          <i class="ri-check-double-line"></i> Xác nhận update
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL XÁC NHẬN ĐÓNG TAB -->
  <div
    v-if="closeTabConfirmState"
    class="modal modal-overlay-blur grab-modal-overlay"
    @click.self="cancelCloseTabConfirm"
  >
    <div class="modal-box premium-modal-v4 grab-sheet ctc-modal-box" style="max-width: 480px">
      <div class="grab-sheet-handle" @click="cancelCloseTabConfirm"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div
            class="pmv4-icon-box"
            :class="closeTabConfirmState.mode === 'active_order' ? 'is-ctc-warn' : 'is-alert-red'"
          >
            <i :class="closeTabConfirmState.mode === 'active_order' ? 'ri-question-line' : 'ri-error-warning-line'"></i>
          </div>
          <div>
            <h3 class="pmv4-title">
              {{
                closeTabConfirmState.mode === 'active_order'
                  ? 'Xác nhận đóng tab đơn hàng'
                  : 'Đóng tab đơn nháp?'
              }}
            </h3>
            <p class="pmv4-subtitle">
              {{ closeTabConfirmState.title }}
              <template v-if="closeTabConfirmState.maHoaDon"> · #{{ closeTabConfirmState.maHoaDon }}</template>
            </p>
          </div>
        </div>
        <button
          class="pmv4-close"
          :disabled="isClosingTabCancelling"
          @click="cancelCloseTabConfirm"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body ctc-body">
        <div v-if="closeTabConfirmState.status" class="ctc-status-row">
          <span class="ctc-meta-label">Trạng thái hiện tại:</span>
          <span
            class="itp-status-tag"
            :class="getTabStatusClass(closeTabConfirmState.status)"
          >
            {{ getTabStatusLabel(closeTabConfirmState.status) }}
          </span>
          <span v-if="closeTabConfirmState.isWeb" class="ctc-source-chip is-web">Đơn web</span>
          <span v-else class="ctc-source-chip is-admin">Đơn admin</span>
        </div>

        <p v-if="closeTabConfirmState.mode === 'active_order'" class="ctc-desc">
          <template v-if="closeTabConfirmState.status === 'Chờ duyệt'">
            <strong>Chỉ đóng tab</strong> sẽ ẩn tab khỏi bảng và đưa đơn quay lại chuông
            <strong>Đơn chờ duyệt (🔔)</strong> để xử lý sau. Phía khách vẫn giữ trạng thái chờ duyệt.<br />
            Chọn <strong>Hủy đơn này</strong> nếu bạn muốn chuyển đơn sang <strong>Đã hủy</strong> và báo hủy cho khách.
          </template>
          <template v-else>
            <strong>Chỉ đóng tab</strong> sẽ thu gọn khỏi màn hình nhập hóa đơn, đơn vẫn giữ nguyên trạng thái
            <strong>{{ getTabStatusLabel(closeTabConfirmState.status) }}</strong> trên hệ thống và phía khách.<br />
            Chọn <strong>Hủy đơn này</strong> nếu bạn muốn hủy hẳn đơn khỏi danh sách{{ closeTabConfirmState.isWeb ? ' và báo Đã hủy cho khách' : '' }}.
          </template>
        </p>

        <p v-else class="ctc-desc">
          Tab đang có <strong>{{ closeTabConfirmState.qty }} món</strong> hoặc thông tin khách chưa chốt đơn. Nếu đóng tab, dữ liệu nháp trên tab này sẽ bị xóa.
        </p>

        <div v-if="closeTabConfirmState.unsynced" class="ctc-unsynced-warn">
          <i class="ri-alert-line"></i>
          <span>Lưu ý: Tab này đang có chỉnh sửa chưa lưu / chưa đồng bộ!</span>
        </div>
      </div>

      <div class="pmv4-footer ctc-footer">
        <button
          type="button"
          class="pmv4-btn-ghost"
          :disabled="isClosingTabCancelling"
          @click="cancelCloseTabConfirm"
        >
          Ở lại
        </button>

        <template v-if="closeTabConfirmState.mode === 'active_order'">
          <button
            type="button"
            class="ctc-btn-keep"
            :disabled="isClosingTabCancelling"
            @click="confirmKeepOrderCloseTab"
          >
            <i class="ri-eye-off-line"></i>
            <span>Chỉ đóng tab (giữ đơn)</span>
          </button>
          <button
            type="button"
            class="ctc-btn-cancel-order"
            :disabled="isClosingTabCancelling"
            @click="confirmCancelAndCloseTab"
          >
            <span v-if="isClosingTabCancelling" class="btn-spinner" aria-hidden="true"></span>
            <i v-else class="ri-close-circle-line"></i>
            <span>Hủy đơn này</span>
          </button>
        </template>

        <button
          v-else
          type="button"
          class="ctc-btn-cancel-order"
          @click="confirmKeepOrderCloseTab"
        >
          <i class="ri-delete-bin-line"></i>
          <span>Xác nhận đóng tab</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ================= MODAL XUẤT MÃ QR CHUYỂN KHOẢN TỰ ĐIỀN ================= -->
  <div
    v-if="showQrExportModal"
    class="modal modal-overlay-blur grab-modal-overlay"
    @click.self="showQrExportModal = false"
  >
    <div class="modal-box premium-modal-v4 grab-sheet qr-export-modal-box" style="max-width: 460px">
      <div class="grab-sheet-handle" @click="showQrExportModal = false"></div>
      <div class="pmv4-header">
        <div class="pmv4-header-info">
          <div class="pmv4-icon-box is-qr-amber">
            <i class="ri-qr-code-line"></i>
          </div>
          <div>
            <h3 class="pmv4-title">Xuất mã QR chuyển khoản</h3>
            <p class="pmv4-subtitle">
              {{
                activeQrBankAccount?.isValidVietQr
                  ? 'QR động: khách quét bằng app ngân hàng VN sẽ tự điền số tiền'
                  : 'QR tĩnh: khách quét mã và nhập số tiền bên dưới'
              }}
            </p>
          </div>
        </div>
        <button class="pmv4-close" @click="showQrExportModal = false">
          <i class="ri-close-line"></i>
        </button>
      </div>

      <div class="pmv4-body qr-export-modal-body" v-if="activeQrBankAccount">
        <div class="qr-bank-selector-wrap">
          <div class="qr-bank-selector-label">Chọn tài khoản chuyển khoản:</div>
          <div class="qr-bank-selector">
            <button
              v-for="(acc, idx) in qrExportAccounts"
              :key="acc.id || acc.stk || idx"
              type="button"
              class="qr-bank-chip"
              :class="{ active: selectedQrBankIndex === idx }"
              @click="selectedQrBankIndex = idx"
            >
              <span>{{ acc.bankName || acc.title }}{{ acc.stk ? ` · ${acc.stk}` : '' }}</span>
              <span class="qr-type-tag" :class="acc.isValidVietQr ? 'is-dynamic' : 'is-static'">
                {{ acc.isValidVietQr ? 'Tự điền' : 'Tĩnh' }}
              </span>
            </button>
          </div>
        </div>

        <div class="qr-export-card" ref="qrModalCardRef">
          <div class="qec-top-badge">
            <span class="qec-brand" :class="{ 'is-static': !activeQrBankAccount.isValidVietQr }">
              {{ activeQrBankAccount.isValidVietQr ? 'VIETQR · TỰ ĐIỀN SỐ TIỀN' : 'QR CHUYỂN KHOẢN' }}
            </span>
            <span class="qec-bank-name">{{ activeQrBankAccount.bankName || activeQrBankAccount.title }}</span>
          </div>

          <div class="qec-qr-frame" ref="qrModalWrapRef">
            <QrcodeVue
              v-if="activeQrBankAccount.isValidVietQr"
              :value="qrModalPayload"
              :size="210"
              level="M"
              render-as="svg"
              :margin="2"
              foreground="#0f172a"
              background="#ffffff"
              class="qec-qr-svg"
            />
            <img
              v-else
              :src="activeQrBankAccount.qrImgSrc"
              alt="QR Chuyển khoản"
              class="qec-static-qr-img"
              crossorigin="anonymous"
            />
          </div>

          <div class="qec-amount-box">
            <div class="qec-amount-lbl">SỐ TIỀN CHUYỂN KHOẢN</div>
            <div class="qec-amount-val font-mono">
              {{ formatWithCurrency(qrExportDisplayAmount, qrExportCurrency) }}
            </div>
            <div class="qec-ship-status" :class="qrExportShipIncluded ? 'is-included' : 'is-excluded'">
              {{ qrExportShipStatusText }}
            </div>
          </div>

          <div class="qec-meta-list">
            <div class="qec-meta-row" v-if="activeQrBankAccount.ownerName">
              <span>Chủ TK:</span>
              <strong>{{ activeQrBankAccount.ownerName }}</strong>
            </div>
            <div class="qec-meta-row" v-if="activeQrBankAccount.stk">
              <span>Số TK:</span>
              <strong class="font-mono">{{ activeQrBankAccount.stk }}</strong>
            </div>
            <div class="qec-meta-row" v-if="activeQrBankAccount.isValidVietQr && qrExportMemo">
              <span>Nội dung:</span>
              <strong class="font-mono">{{ qrExportMemo }}</strong>
            </div>
          </div>
        </div>

        <div class="qr-export-controls">
          <label
            v-if="normalizedPhiShip > 0"
            class="qr-ship-toggle"
            :class="{ active: ckBaoGomShip }"
          >
            <input type="checkbox" v-model="ckBaoGomShip" />
            <span>Tính luôn tiền ship (+{{ formatWithCurrency(normalizedPhiShip, donViTienTeChung) }})</span>
          </label>

          <div v-if="activeQrBankAccount.isValidVietQr" class="qr-memo-field">
            <label>Nội dung CK tự điền:</label>
            <input
              v-model="qrExportMemo"
              type="text"
              maxlength="50"
              placeholder="VD: HD..."
              class="qr-memo-input"
            />
          </div>
        </div>
      </div>

      <div class="pmv4-footer qr-export-footer">
        <button class="pmv4-btn-ghost" @click="showQrExportModal = false">Đóng</button>
        <button
          type="button"
          class="qr-action-btn is-copy"
          :disabled="isExportingQrPng"
          @click="copyQrExportPng"
        >
          <i :class="isQrImageCopied ? 'ri-check-line' : 'ri-file-copy-line'"></i>
          <span>{{ isQrImageCopied ? 'Đã copy ảnh' : 'Copy ảnh QR' }}</span>
        </button>
        <button
          type="button"
          class="qr-action-btn is-download"
          :disabled="isExportingQrPng"
          @click="downloadQrExportPng"
        >
          <i class="ri-download-2-line"></i>
          <span>Tải ảnh QR</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL XÁC NHẬN TRÙNG SẢN PHẨM KHI LƯU VÀO DB -->
  <div
    v-if="manualDbConflictModal.open"
    class="pmv4-overlay db-conflict-overlay"
    @click.self="cancelManualDbConflict"
  >
    <div class="db-conflict-card">
      <div class="db-conflict-head">
        <div class="db-conflict-ico"><i class="ri-error-warning-fill"></i></div>
        <div>
          <h3>Đang có sản phẩm trùng trong kho</h3>
          <p>Bạn muốn cập nhật vào sản phẩm cũ hay bỏ qua để tạo thành món mới?</p>
        </div>
      </div>

      <div class="db-conflict-compare">
        <div class="db-conflict-box is-old">
          <div class="db-conflict-tag">Sản phẩm đang có trong DB</div>
          <div class="db-conflict-name">{{ manualDbConflictModal.existingItem?.Ten_hang }}</div>
          <div class="db-conflict-meta">
            <span>Mã: <strong>#{{ manualDbConflictModal.existingItem?.Ma_hang }}</strong></span>
            <span>Giá bán: <strong>{{ formatNumber(manualDbConflictModal.existingItem?.Gia_ban || 0) }} {{ manualDbConflictModal.existingItem?.Don_vi_tien_te || 'P' }}</strong></span>
            <span>Giá gốc: <strong>{{ formatNumber(manualDbConflictModal.existingItem?.Gia_goc || 0) }} {{ manualDbConflictModal.existingItem?.Don_vi_tien_te || 'P' }}</strong></span>
            <span v-if="manualDbConflictModal.existingItem?.Dvt">ĐVT: <strong>{{ manualDbConflictModal.existingItem?.Dvt }}</strong></span>
          </div>
        </div>

        <div class="db-conflict-box is-new">
          <div class="db-conflict-tag">Thông tin bạn vừa nhập</div>
          <div class="db-conflict-name">{{ manualDbConflictModal.draft?.tenHangTrim }}</div>
          <div class="db-conflict-meta">
            <span>Nếu thêm mới → Mã: <strong>#{{ manualDbConflictModal.newMaHang }}</strong></span>
            <span>Giá bán: <strong>{{ formatNumber(manualDbConflictModal.draft?.giaBan || 0) }} {{ manualDbConflictModal.draft?.currencyTrim || 'P' }}</strong></span>
            <span>Giá gốc: <strong>{{ formatNumber(manualDbConflictModal.draft?.giaGoc || 0) }} {{ manualDbConflictModal.draft?.currencyTrim || 'P' }}</strong></span>
            <span v-if="manualDbConflictModal.draft?.dvtTrim">ĐVT: <strong>{{ manualDbConflictModal.draft?.dvtTrim }}</strong></span>
          </div>
        </div>
      </div>

      <div class="db-conflict-actions">
        <button
          type="button"
          class="db-conflict-btn is-update"
          :disabled="isSavingManualToDb"
          @click="confirmManualDbUpdateExisting"
        >
          <i class="ri-refresh-line"></i>
          <span>Cập nhật vào #{{ manualDbConflictModal.existingItem?.Ma_hang }}</span>
        </button>
        <button
          type="button"
          class="db-conflict-btn is-create"
          :disabled="isSavingManualToDb"
          @click="confirmManualDbCreateNew"
        >
          <i class="ri-add-circle-line"></i>
          <span>Bỏ qua &amp; Thêm mới (#{{ manualDbConflictModal.newMaHang }})</span>
        </button>
        <button type="button" class="db-conflict-btn is-cancel" @click="cancelManualDbConflict">
          Hủy
        </button>
      </div>
    </div>
  </div>
</template>





<script setup>
import {
  reactive,
  ref,
  computed,
  inject,
  onMounted,
  onActivated,
  onUnmounted,
  watch,
  nextTick,
} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import html2canvas from 'html2canvas'
import {
  getSheets,
  getOneSheet,
  subscribeSheet,
  subscribeAllLiveOrders,
  getOrderForInvoice,
  adminSyncOrderItems,
  sendAdminOrderMessage,
  dispatchAction,
} from '@/config/api'
import {
  localizeProduct,
  productMatchesKeyword,
  resolveNoticeText,
  syncProductWithI18n,
} from '@/utils/i18nData'
import {
  rankProductsWithMeta,
  parseQuickQtyQuery,
  getAccentInsensitiveHighlights,
  matchesMultiTokenRecord,
  normalizeSearchText,
  getPhoneDigitVariants,
  normalizeTelegramHandle,
} from '@/utils/searchUtils'
import {
  normalizeNccDiscountType,
  normalizeNccDiscountValue,
  calcOrderLineProfit,
  formatNccDiscountLabel,
} from '@/utils/nccDiscount'
import {
  parseBankAccountInfo,
  buildVietQrPayload,
  toAsciiClean,
} from '@/utils/vietQr'
import { buildOrderTextInvoice } from '@/utils/invoiceTextExport'
import {
  buildUniqueProductCode,
  findDuplicateProductMatch,
  normalizeProductNameKey,
} from '@/utils/productCode'
import {
  normalizeDisplayConfig,
  sortProductsByCategoryOrder,
  getEffectiveParentCategory,
} from '@/utils/displayOrder'
import { resolveProductBadge } from '@/utils/productBadge'
import { toOptimizedImageUrl } from '@/utils/brandAssets'
const router = useRouter() // Initialize router
const route = useRoute()



/* ================= MOBILE & PC COLLAPSE STATE ================= */
const isMobile = ref(false)
const isAdminDockHidden = inject('isMobileDockHidden', ref(false))
const activeMobileTab = ref('entry') // 'entry', 'order', 'customer', 'payment'
const showMobileEntryMenu = ref(false)

const pcCollapsed = reactive({
  left: false,
  center: false,
  right: false,
})
const pcTabRailCollapsed = ref(false)

/* ================= PC COLUMN DRAG RESIZE ================= */
const PC_COL_WIDTHS_KEY = 'nhaphoadon_pc_col_widths_v1'
const layoutGridRef = ref(null)
const resizingCol = ref(null) // 'left' | 'right' | 'tabRail' | null

function loadPcColWidths() {
  try {
    const raw = localStorage.getItem(PC_COL_WIDTHS_KEY)
    if (!raw) return { left: null, right: null, tabRail: null }
    const parsed = JSON.parse(raw)
    const left = Number.isFinite(Number(parsed?.left)) && Number(parsed.left) >= 240 ? Number(parsed.left) : null
    const right = Number.isFinite(Number(parsed?.right)) && Number(parsed.right) >= 245 ? Number(parsed.right) : null
    const tabRail =
      Number.isFinite(Number(parsed?.tabRail)) && Number(parsed.tabRail) >= 104 && Number(parsed.tabRail) <= 300
        ? Number(parsed.tabRail)
        : null
    return { left, right, tabRail }
  } catch {
    return { left: null, right: null, tabRail: null }
  }
}

const pcColWidths = reactive(loadPcColWidths())

function savePcColWidths() {
  try {
    localStorage.setItem(
      PC_COL_WIDTHS_KEY,
      JSON.stringify({ left: pcColWidths.left, right: pcColWidths.right, tabRail: pcColWidths.tabRail }),
    )
  } catch {
    // ignore storage errors
  }
}

const pcGridStyle = computed(() => {
  if (isMobile.value) return undefined
  const style = {}
  if (pcColWidths.left !== null && !pcCollapsed.left && !pcCollapsed.center) {
    style['--col-left'] = `${Math.round(pcColWidths.left)}px`
  }
  if (pcColWidths.right !== null && !pcCollapsed.right) {
    style['--col-right'] = `${Math.round(pcColWidths.right)}px`
  }
  return style
})

let colDragState = null

function onPcColResizeMove(e) {
  if (!colDragState) return
  const dx = e.clientX - colDragState.startX
  const minLeft = 240
  const minCenter = pcTabRailCollapsed.value ? 300 : 380
  const minRight = 245
  const resizerReserve = 20

  if (colDragState.side === 'tabRail') {
    const minTab = 104
    const maxTab = Math.min(300, Math.max(minTab, colDragState.centerWidth - 260))
    pcColWidths.tabRail = Math.round(Math.min(maxTab, Math.max(minTab, colDragState.startTabRail + dx)))
    return
  }

  if (colDragState.side === 'left') {
    const rightW = pcCollapsed.right ? 44 : colDragState.startRight
    const maxLeft = Math.max(minLeft, colDragState.gridWidth - rightW - minCenter - resizerReserve)
    pcColWidths.left = Math.round(Math.min(maxLeft, Math.max(minLeft, colDragState.startLeft + dx)))
  } else if (colDragState.side === 'right') {
    const leftW = pcCollapsed.left ? 44 : colDragState.startLeft
    const maxRight = Math.max(minRight, colDragState.gridWidth - leftW - minCenter - resizerReserve)
    pcColWidths.right = Math.round(Math.min(maxRight, Math.max(minRight, colDragState.startRight - dx)))
  }
}

function stopPcColResize() {
  if (!colDragState && !resizingCol.value) return
  colDragState = null
  resizingCol.value = null
  window.removeEventListener('mousemove', onPcColResizeMove)
  window.removeEventListener('mouseup', stopPcColResize)
  savePcColWidths()
}

function startPcColResize(side, e) {
  if (isMobile.value || pcCollapsed.center) return
  if (side === 'left' && pcCollapsed.left) return
  if (side === 'right' && pcCollapsed.right) return
  if (side === 'tabRail' && pcTabRailCollapsed.value) return

  const gridEl = layoutGridRef.value
  if (!gridEl) return

  if (side === 'tabRail') {
    const centerEl = gridEl.querySelector('.center-stack')
    const tabEl = gridEl.querySelector('.invoice-tabs-bar')
    if (!centerEl || !tabEl) return
    resizingCol.value = 'tabRail'
    colDragState = {
      side: 'tabRail',
      startX: e.clientX,
      centerWidth: centerEl.clientWidth,
      startTabRail: tabEl.getBoundingClientRect().width,
    }
    window.addEventListener('mousemove', onPcColResizeMove)
    window.addEventListener('mouseup', stopPcColResize)
    return
  }

  const leftEl = gridEl.querySelector('.left-stack')
  const rightEl = gridEl.querySelector('.right-stack')
  if (!leftEl || !rightEl) return

  resizingCol.value = side
  colDragState = {
    side,
    startX: e.clientX,
    gridWidth: gridEl.clientWidth,
    startLeft: leftEl.getBoundingClientRect().width,
    startRight: rightEl.getBoundingClientRect().width,
  }

  window.addEventListener('mousemove', onPcColResizeMove)
  window.addEventListener('mouseup', stopPcColResize)
}

function resetTabRailWidth() {
  pcColWidths.tabRail = null
  savePcColWidths()
  toast('info', 'Đã đặt lại độ rộng cột tab mặc định')
}

function resetPcColWidths() {
  pcColWidths.left = null
  pcColWidths.right = null
  pcColWidths.tabRail = null
  savePcColWidths()
  toast('info', 'Đã đặt lại kích thước các cột mặc định')
}

function clampPcColWidthsToViewport() {
  if (isMobile.value) return
  const gridEl = layoutGridRef.value
  if (!gridEl || !gridEl.clientWidth) return
  const gridWidth = gridEl.clientWidth
  const minCenter = pcTabRailCollapsed.value ? 300 : 380
  const resizerReserve = 20
  const maxCombined = gridWidth - minCenter - resizerReserve
  if (maxCombined <= 0) return

  const leftVal = pcColWidths.left ?? 0
  const rightVal = pcColWidths.right ?? 0
  if (leftVal && rightVal && leftVal + rightVal > maxCombined) {
    const scale = maxCombined / (leftVal + rightVal)
    pcColWidths.left = Math.max(240, Math.round(leftVal * scale))
    pcColWidths.right = Math.max(245, Math.round(rightVal * scale))
  } else if (leftVal && !rightVal && leftVal > maxCombined - 260) {
    pcColWidths.left = Math.max(240, Math.round(maxCombined - 260))
  } else if (rightVal && !leftVal && rightVal > maxCombined - 260) {
    pcColWidths.right = Math.max(245, Math.round(maxCombined - 260))
  }

  if (pcColWidths.tabRail !== null) {
    const centerEl = gridEl.querySelector('.center-stack')
    if (centerEl && centerEl.clientWidth > 0) {
      const maxTab = Math.min(300, Math.max(104, centerEl.clientWidth - 260))
      if (pcColWidths.tabRail > maxTab) {
        pcColWidths.tabRail = Math.round(maxTab)
      }
    }
  }
}

/* ================= ORDER TABLE INDIVIDUAL COLUMN DRAG RESIZE ================= */
const ORDER_TABLE_COL_WIDTHS_KEY = 'sa_nhaphoadon_order_col_widths_v1'
const orderTableRef = ref(null)
const resizingOrderColKey = ref('')

const ORDER_TABLE_HEADERS = [
  { key: 'stt', label: 'STT', align: 'col-center', toggleKey: 'stt', minWidth: 38, defaultWidth: 44 },
  { key: 'maHang', label: 'MÃ HÀNG', align: 'col-center', toggleKey: 'maHang', minWidth: 64, defaultWidth: 92 },
  { key: 'sanPham', label: 'SẢN PHẨM', align: 'col-left', toggleKey: null, minWidth: 110, defaultWidth: 210 },
  { key: 'danhMuc', label: 'DANH MỤC', align: 'col-center', toggleKey: 'danhMuc', minWidth: 72, defaultWidth: 108 },
  { key: 'sizeDvt', label: 'SIZE / ĐVT', align: 'col-center', toggleKey: 'sizeDvt', minWidth: 68, defaultWidth: 90 },
  { key: 'trangThaiKho', label: 'KHO', align: 'col-center', toggleKey: 'trangThaiKho', minWidth: 62, defaultWidth: 82 },
  { key: 'nguoiDat', label: 'NGƯỜI ĐẶT', align: 'col-center', toggleKey: 'nguoiDat', minWidth: 76, defaultWidth: 112 },
  { key: 'soLuong', label: 'SỐ LƯỢNG', align: 'col-center', toggleKey: null, minWidth: 62, defaultWidth: 78 },
  { key: 'giaVon', label: 'GIÁ VỐN', align: 'col-center', toggleKey: 'giaVon', minWidth: 70, defaultWidth: 92 },
  { key: 'tongVon', label: 'TỔNG VỐN', align: 'col-center', toggleKey: 'tongVon', minWidth: 72, defaultWidth: 96 },
  { key: 'giaBan', label: 'GIÁ BÁN', align: 'col-center', toggleKey: 'giaBan', minWidth: 70, defaultWidth: 96 },
  { key: 'truocGiam', label: 'TRƯỚC GIẢM', align: 'col-center', toggleKey: 'truocGiam', minWidth: 76, defaultWidth: 98 },
  { key: 'giamCk', label: 'GIẢM & CK%', align: 'col-center', toggleKey: 'giamCk', minWidth: 86, defaultWidth: 116 },
  { key: 'ckNcc', label: 'CK NCC', align: 'col-center', toggleKey: 'ckNcc', minWidth: 84, defaultWidth: 108 },
  { key: 'thanhTien', label: 'THÀNH TIỀN', align: 'col-center', toggleKey: null, minWidth: 80, defaultWidth: 110 },
  { key: 'loiNhuan', label: 'LỢI NHUẬN', align: 'col-center', toggleKey: 'loiNhuan', minWidth: 74, defaultWidth: 96 },
  { key: 'ghiChu', label: 'GHI CHÚ', align: 'col-left', toggleKey: 'ghiChu', minWidth: 80, defaultWidth: 140 },
  { key: 'xoa', label: 'XÓA', align: 'col-center', toggleKey: null, minWidth: 44, defaultWidth: 52 },
]

function loadOrderTableColWidths() {
  try {
    const raw = localStorage.getItem(ORDER_TABLE_COL_WIDTHS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const clean = {}
    for (const col of ORDER_TABLE_HEADERS) {
      const val = Number(parsed[col.key])
      if (Number.isFinite(val) && val >= col.minWidth && val <= 640) {
        clean[col.key] = Math.round(val)
      }
    }
    return clean
  } catch {
    return {}
  }
}

const orderTableColWidths = reactive(loadOrderTableColWidths())

function saveOrderTableColWidths() {
  try {
    localStorage.setItem(ORDER_TABLE_COL_WIDTHS_KEY, JSON.stringify({ ...orderTableColWidths }))
  } catch {}
}

const visibleOrderTableHeaders = computed(() =>
  ORDER_TABLE_HEADERS.filter((col) => !col.toggleKey || Boolean(orderTableCols[col.toggleKey])),
)

const hasCustomOrderColWidths = computed(() =>
  Object.keys(orderTableColWidths).some((k) => Number(orderTableColWidths[k]) > 0),
)

function getOrderColWidthStyle(colKey) {
  if (!hasCustomOrderColWidths.value) return undefined
  const def = ORDER_TABLE_HEADERS.find((c) => c.key === colKey)
  const w = Number(orderTableColWidths[colKey]) || def?.defaultWidth || 96
  return {
    width: `${w}px`,
    minWidth: `${w}px`,
  }
}

let orderColDragState = null

function onOrderColResizeMove(e) {
  if (!orderColDragState) return
  const dx = e.clientX - orderColDragState.startX
  const nextW = Math.round(
    Math.min(640, Math.max(orderColDragState.minWidth, orderColDragState.startWidth + dx)),
  )
  orderTableColWidths[orderColDragState.colKey] = nextW
}

function stopOrderColResize() {
  if (!orderColDragState && !resizingOrderColKey.value) return
  orderColDragState = null
  resizingOrderColKey.value = ''
  window.removeEventListener('mousemove', onOrderColResizeMove)
  window.removeEventListener('mouseup', stopOrderColResize)
  saveOrderTableColWidths()
}

function startOrderColResize(colKey, e) {
  if (isMobile.value) return
  const tableEl = orderTableRef.value
  if (!tableEl) return

  const thEls = tableEl.querySelectorAll('thead th[data-col-key]')
  for (const th of thEls) {
    const k = th.getAttribute('data-col-key')
    if (!k) continue
    if (!Number(orderTableColWidths[k])) {
      const def = ORDER_TABLE_HEADERS.find((c) => c.key === k)
      const measured = Math.round(th.getBoundingClientRect().width)
      orderTableColWidths[k] = Math.max(def?.minWidth || 40, measured || def?.defaultWidth || 90)
    }
  }

  const targetDef = ORDER_TABLE_HEADERS.find((c) => c.key === colKey)
  const startWidth = Number(orderTableColWidths[colKey]) || targetDef?.defaultWidth || 96

  resizingOrderColKey.value = colKey
  orderColDragState = {
    colKey,
    startX: e.clientX,
    startWidth,
    minWidth: targetDef?.minWidth || 44,
  }

  window.addEventListener('mousemove', onOrderColResizeMove)
  window.addEventListener('mouseup', stopOrderColResize)
}

function resetSingleOrderColWidth(colKey) {
  const def = ORDER_TABLE_HEADERS.find((c) => c.key === colKey)
  if (!def) return
  if (hasCustomOrderColWidths.value) {
    orderTableColWidths[colKey] = def.defaultWidth
    saveOrderTableColWidths()
  }
}

function resetOrderColWidths() {
  for (const k of Object.keys(orderTableColWidths)) {
    delete orderTableColWidths[k]
  }
  saveOrderTableColWidths()
  toast('info', 'Đã đặt lại độ rộng các cột bảng báo giá')
}

const pcRightTab = ref('customer') // 'customer' | 'payment' (PC 2-tab switch)

/* ================= ORDER TABLE COLUMN VISIBILITY ================= */
const ORDER_COL_STORAGE_KEY = 'nhaphoadon_order_table_cols_v1'
const showColSettings = ref(false)
const colSettingsWrapRef = ref(null)

const DEFAULT_ORDER_TABLE_COLS = {
  stt: true,
  maHang: false,
  danhMuc: false,
  sizeDvt: false,
  trangThaiKho: false,
  nguoiDat: false,
  giaVon: false,
  tongVon: false,
  giaBan: true,
  truocGiam: false,
  giamCk: true,
  ckNcc: true,
  loiNhuan: false,
  ghiChu: false,
}

const ORDER_TABLE_COL_GROUPS = [
  {
    title: 'Thông tin sản phẩm',
    items: [
      { key: 'stt', label: 'STT' },
      { key: 'maHang', label: 'Mã hàng' },
      { key: 'danhMuc', label: 'Danh mục' },
      { key: 'sizeDvt', label: 'Size / ĐVT (cột riêng)' },
      { key: 'trangThaiKho', label: 'Trạng thái kho' },
      { key: 'nguoiDat', label: 'Người đặt' },
      { key: 'ghiChu', label: 'Ghi chú món (cột riêng)' },
    ],
  },
  {
    title: 'Giá, vốn & lợi nhuận',
    items: [
      { key: 'giaVon', label: 'Giá vốn' },
      { key: 'tongVon', label: 'Tổng vốn' },
      { key: 'giaBan', label: 'Giá bán' },
      { key: 'truocGiam', label: 'Tiền trước giảm' },
      { key: 'giamCk', label: 'Giảm & CK%' },
      { key: 'ckNcc', label: 'CK NCC (% / Tiền)' },
      { key: 'loiNhuan', label: 'Cột Lợi nhuận' },
    ],
  },
]

function loadOrderTableCols() {
  try {
    const raw = localStorage.getItem(ORDER_COL_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ORDER_TABLE_COLS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_ORDER_TABLE_COLS, ...(parsed && typeof parsed === 'object' ? parsed : {}) }
  } catch {
    return { ...DEFAULT_ORDER_TABLE_COLS }
  }
}

const orderTableCols = reactive(loadOrderTableCols())

watch(
  orderTableCols,
  (val) => {
    try {
      localStorage.setItem(ORDER_COL_STORAGE_KEY, JSON.stringify(val))
    } catch {
      // ignore storage quota errors
    }
  },
  { deep: true },
)

function applyOrderColPreset(preset) {
  if (preset === 'sales') {
    Object.assign(orderTableCols, {
      stt: true,
      maHang: false,
      danhMuc: false,
      sizeDvt: false,
      trangThaiKho: false,
      nguoiDat: false,
      giaVon: false,
      tongVon: false,
      giaBan: true,
      truocGiam: false,
      giamCk: true,
      loiNhuan: false,
      ghiChu: false,
    })
  } else if (preset === 'audit') {
    Object.assign(orderTableCols, {
      stt: true,
      maHang: true,
      danhMuc: false,
      sizeDvt: false,
      trangThaiKho: true,
      nguoiDat: true,
      giaVon: true,
      tongVon: false,
      giaBan: true,
      truocGiam: false,
      giamCk: true,
      loiNhuan: true,
      ghiChu: true,
    })
  } else if (preset === 'full') {
    Object.assign(orderTableCols, {
      stt: true,
      maHang: true,
      danhMuc: true,
      sizeDvt: true,
      trangThaiKho: true,
      nguoiDat: true,
      giaVon: true,
      tongVon: true,
      giaBan: true,
      truocGiam: true,
      giamCk: true,
      loiNhuan: true,
      ghiChu: true,
    })
  }
}

const activeOptionalColCount = computed(() => {
  return ORDER_TABLE_COL_GROUPS.reduce(
    (sum, grp) => sum + grp.items.filter((it) => Boolean(orderTableCols[it.key])).length,
    0,
  )
})

const visibleOrderColCount = computed(() => 4 + activeOptionalColCount.value)

function handleDocClickForColSettings(e) {
  if (showColSettings.value) {
    const el = colSettingsWrapRef.value
    if (el && !el.contains(e.target)) {
      showColSettings.value = false
    }
  }
  if (showManualAddOptions.value) {
    const wrapEl = manualAddWrapRef.value
    if (wrapEl && !wrapEl.contains(e.target)) {
      showManualAddOptions.value = false
    }
  }
}

/** Split text into matched/unmatched segments for safe accent-insensitive multi-token search highlighting. */
function getHighlightedSegments(text, rawKeyword) {
  const parsed = parseQuickQtyQuery(rawKeyword)
  const effectiveKw = parsed.cleanQuery || rawKeyword
  return getAccentInsensitiveHighlights(text, effectiveKw)
}

function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 1024
    if (!isMobile.value) {
      nextTick(clampPcColWidthsToViewport)
    }
  }
}

const handleEntryTabClick = () => {
  if (activeMobileTab.value === 'entry') {
    // Already active, toggle menu
    showMobileEntryMenu.value = !showMobileEntryMenu.value
  } else {
    // Switch to entry tab
    setMobileTab('entry')
    showMobileEntryMenu.value = false
  }
}

const selectMobileEntryMode = (mode) => {
  entryMode.value = mode
  showMobileEntryMenu.value = false
}

function setMobileTab(tab) {
  activeMobileTab.value = tab
  if (tab !== 'entry') showMobileEntryMenu.value = false
  window.scrollTo({ top: 0, behavior: 'instant' })
  const crmMain = document.querySelector('.crm-main')
  if (crmMain) crmMain.scrollTo({ top: 0, behavior: 'instant' })
}

/* ================= MASTER DATA ================= */
const khachHangList = ref([])
const hangHoaList = ref([])
const donHangList = ref([])
const logoInfo = ref(null)
const shopContactList = ref([])
const shopContactInfo = ref(null)
const thoiGianHoatDongShop = ref('')
const soThuChiList = ref([]) // Bổ sung list thu chi để tính lợi nhuận khách
const khuyenMaiList = ref([]) // Bổ sung list chứa nội dung khuyến mãi
const thongTinChuyenKhoanList = ref([]) // Bổ sung list Chuyển khoản
const tiGia = ref(1)
const donViTienTeCK = ref('VND')

/* ================= CATALOG SẢN PHẨM ================= */
const entryMode = ref('catalog') // 'catalog' | 'manual'
const displayConfig = ref(normalizeDisplayConfig([]))
const CATALOG_VIEW_MODE_KEY = 'nhaphoadon_catalog_view_mode_v1'
const catalogViewMode = ref('card') // 'card' (Dạng Chi Tiết) | 'board' (Dạng Chọn Nhanh)
try {
  const savedCatalogMode = localStorage.getItem(CATALOG_VIEW_MODE_KEY)
  if (savedCatalogMode === 'board' || savedCatalogMode === 'card') {
    catalogViewMode.value = savedCatalogMode
  }
} catch {}

function setCatalogViewMode(mode) {
  const next = mode === 'board' ? 'board' : 'card'
  catalogViewMode.value = next
  try {
    localStorage.setItem(CATALOG_VIEW_MODE_KEY, next)
  } catch {}
}

const addedSuccessManual = ref(false) // Trạng thái nút thêm thủ công
const showManualAddOptions = ref(false)
const isSavingManualToDb = ref(false)
const manualAddWrapRef = ref(null)

watch(entryMode, (m) => {
  if (m !== 'manual') {
    showManualAddOptions.value = false
  }
})
const searchProduct = ref('')
// PHẦN BỔ SUNG: CATALOG FILTERS
const selectedLang = ref('vi')
const selectedCategory = ref('')
const onlyPromotion = ref(false)
const selectedSize = ref('')
const langOptions = [
  { value: 'vi', label: 'Việt Nam', flagUrl: 'https://flagcdn.com/w40/vn.png' },
  { value: 'en', label: 'English', flagUrl: 'https://flagcdn.com/w40/gb.png' },
  { value: 'zh-CN', label: 'Trung Quốc', flagUrl: 'https://flagcdn.com/w40/cn.png' },
  { value: 'fil', label: 'Philippines', flagUrl: 'https://flagcdn.com/w40/ph.png' },
  { value: 'ko', label: 'Hàn Quốc', flagUrl: 'https://flagcdn.com/w40/kr.png' },
]
const currentLangFlagUrl = computed(() => {
  const lang = langOptions.find(o => o.value === selectedLang.value)
  return lang ? lang.flagUrl : ''
})

const currentLangLabel = computed(() => {
  const lang = langOptions.find(o => o.value === selectedLang.value)
  return lang ? lang.label : ''
})
const selectedStockStatus = ref('all') // 'all' | 'in' | 'out'

const localizedHangHoaList = computed(() =>
  hangHoaList.value.map((p) => localizeProduct(p, selectedLang.value || 'vi'))
)

const filteredCategories = computed(() => {
  const cats = new Set()
  localizedHangHoaList.value.forEach((p) => {
    if (p.Danh_muc) cats.add(p.Danh_muc)
  })
  return Array.from(cats).sort().map(c => ({ value: c, label: c }))
})

const productQty = reactive({})
const productNotes = reactive({}) // ✅ THÊM: Lưu ghi chú cho từng sản phẩm
const notePopoverOpen = reactive({})
const cardHighlight = reactive({})
const cardImgStep = reactive({})
const showProductDetail = ref(false)
const isLoadingCustomer = ref(false) // State loading khách hàng
const selectedProduct = ref({})
const currentMainImage = ref('')
const currentPage = ref(1)
const itemsPerPage = 16 // 4x4
const toasts = ref([])
const showSuccessModal = ref(false)
const successMessage = ref('')
const showWebAdminMsgBox = ref(false)
const webAdminMsgTextareaRef = ref(null)
const webAdminMessageInput = ref('')
const webAdminMessageLastSent = ref('')
const isSendingWebMessage = ref(false)
const orderActionConfirmModal = ref({
  show: false,
  action: 'complete', // 'complete' | 'cancel'
  mode: 'online', // 'online' | 'admin-submitted' | 'admin-new' | 'cancel'
  title: '',
  description: '',
  confirmLabel: 'Đồng ý',
  showMessageBox: true,
  messageInput: '',
})

const ORDER_COMPLETE_PRESETS = [
  'Cảm ơn quý khách đã ủng hộ quán!',
  'Đơn đã hoàn thành, chúc bạn ngon miệng!',
  'Quán đang có ưu đãi mới, mời bạn ghé xem menu nhé!',
]

const ORDER_CANCEL_PRESETS = [
  'Xin lỗi quý khách, quán hiện đã hết món.',
  'Quán đang quá tải, mong quý khách thông cảm.',
  'Ngoài khu vực giao hàng hoặc chưa liên hệ được khách.',
]

const orderActionMessagePresets = computed(() =>
  orderActionConfirmModal.value.action === 'cancel'
    ? ORDER_CANCEL_PRESETS
    : ORDER_COMPLETE_PRESETS,
)

function closeOrderActionConfirm() {
  orderActionConfirmModal.value.show = false
}

function openOrderActionConfirm({
  action,
  mode,
  title,
  description,
  confirmLabel = 'Đồng ý',
  showMessageBox = true,
}) {
  orderActionConfirmModal.value = {
    show: true,
    action,
    mode,
    title,
    description,
    confirmLabel,
    showMessageBox: Boolean(showMessageBox),
    messageInput: showMessageBox ? String(webAdminMessageInput.value || '').trim() : '',
  }
}

function toggleWebAdminMsgBox() {
  showWebAdminMsgBox.value = !showWebAdminMsgBox.value
  if (showWebAdminMsgBox.value) {
    nextTick(() => {
      webAdminMsgTextareaRef.value?.focus()
    })
  }
}

async function sendWebOrderMessageNow() {
  if (!isLinkedOnlineOrder.value) return
  const msg = String(webAdminMessageInput.value || '').trim()
  if (!msg) {
    toast('warn', 'Chưa nhập nội dung lời nhắn')
    return
  }
  if (isSendingWebMessage.value) return
  isSendingWebMessage.value = true
  try {
    const res = await sendAdminOrderMessage({
      orderId: maHoaDon.value,
      message: msg,
    })
    if (res?.success) {
      webAdminMessageLastSent.value = msg
      webAdminMessageInput.value = ''
      showWebAdminMsgBox.value = false
      const tab = activeTabObj.value
      if (tab) {
        tab.webAdminMessageInput = ''
        tab.webAdminMessageLastSent = msg
        saveTabsToStorage()
      }
      toast('success', '🔔 Đã gửi lời nhắn kèm chuông thông báo tới khách đơn web!')
    } else {
      toast('error', '❌ ' + (res?.message || 'Không gửi được lời nhắn'))
    }
  } catch (e) {
    console.error(e)
    toast('error', '❌ Lỗi kết nối Firebase khi gửi lời nhắn')
  } finally {
    isSendingWebMessage.value = false
  }
}
const isPreviewing = ref(false) // State for preview button loading
const exportPriceMode = ref('') // '' | 'giaBan' | 'giaGoc' (không mặc định sẵn)
const exportGroupMode = ref('') // '' | 'grouped' | 'by_member' (không mặc định sẵn)
const showExportPriceChoiceModal = ref(false)
const pendingExportAction = ref('') // 'image' | 'text' | ''
const isPrinting = ref(false) // Logic state for printing
const isLoadingProducts = ref(true) // Loading state for skeleton

/* ================= HÓA ĐƠN ================= */
const showEditModal = ref(false)
const editIndex = ref(-1)
const editItem = reactive({})
const invoiceImageUrl = ref('')
const barcodeRef = ref(null)

const maHoaDon = ref('')
const soHoaDon = ref('')
const orderCreatedAt = ref('')
const thoiGianNhanHang = ref('')
const ngayNhanHang = ref('')
const gioNhanHang = ref('')
const phutNhanHang = ref('')
const gioList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const phutList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const INVOICE_TABS_STORAGE_KEY = 'sa_admin_invoice_tabs_v1'
const invoiceTabs = ref([])
const activeInvoiceTabId = ref('')
const orderTableViewMode = ref('grouped')
const syncedOrderDigest = ref('')
const customOrderMembers = ref([])
const showAddMemberModal = ref(false)
const newMemberNameInput = ref('')
const newMemberInputRef = ref(null)
const editingMemberKey = ref('')
const editingMemberName = ref('')
const duplicateMemberQueue = ref([])
const activeDuplicatePrompt = computed(() => duplicateMemberQueue.value[0] || null)
const selectedTargetMemberKey = ref('')
const editItemMemberKey = ref('')
const editModalSiblings = ref([])
const hasLoadedDonHang = ref(false)
const liveOrdersById = ref({})
const showPendingOrdersModal = ref(false)
const showWebUpdateDetailModal = ref(false)
const importingPendingOrderId = ref('')
const closeTabConfirmState = ref(null)
const isClosingTabCancelling = ref(false)
const pendingBellPulse = ref(false)
const knownPendingOrderIds = new Set()
let hasInitPendingBellWatch = false
let pendingBellPulseTimer = null
const isOrderActionLoading = ref(false)
let unsubDonHangRealtime = null
let unsubLiveOrdersRealtime = null
let isSwitchingTab = false
let tabSeq = 0
let maHoaDonSeq = 0
let localMemberSeq = 0

function genLocalMemberId() {
  localMemberSeq += 1
  return `local_${Date.now()}_${localMemberSeq}_${Math.random().toString(36).slice(2, 6)}`
}

const activeTabObj = computed(
  () => invoiceTabs.value.find((t) => t.id === activeInvoiceTabId.value) || null,
)
const isLinkedOnlineOrder = computed(() => Boolean(activeTabObj.value?.sourceOrderId))
const isSubmittedAdminOrder = computed(
  () => !isLinkedOnlineOrder.value && Boolean(activeTabObj.value?.adminOrderStatus),
)

const tabSourceFilter = ref('all') // 'all' | 'web' | 'admin'
const tabSearchQuery = ref('')
const webInvoiceTabsCount = computed(
  () => invoiceTabs.value.filter((t) => Boolean(t?.sourceOrderId)).length,
)
const adminInvoiceTabsCount = computed(
  () => invoiceTabs.value.filter((t) => !t?.sourceOrderId).length,
)

function getTabMatchedHint(tab, idx, rawQuery) {
  const q = String(rawQuery || '').trim()
  if (!q) return ''
  const titleRaw = getTabDisplayTitle(tab, idx)
  const isActive = tab?.id === activeInvoiceTabId.value
  const maHD = String(tab?.sourceOrderId || (isActive ? maHoaDon.value : tab?.maHoaDon) || '').trim()
  const phone = String(isActive ? form.soDienThoai : tab?.customer?.soDienThoai || '').trim()
  const custName = String(isActive ? form.tenKhachHang : tab?.customer?.tenKhachHang || '').trim()
  const diaChi = String(isActive ? form.diaChi : tab?.customer?.diaChi || '').trim()
  const ghiChu = String(isActive ? form.ghiChuDonHang : tab?.customer?.ghiChuDonHang || '').trim()
  const tabItems = isActive ? items.value : tab?.items || []

  let tabTotal = isActive ? Number(tongCong.value || 0) : 0
  const itemTexts = []
  const itemHandles = []
  for (const it of tabItems) {
    const tenHang = String(it?.tenHang || it?.Ten_hang || '').trim()
    const maHang = String(it?.maHang || it?.Ma_hang || '').trim()
    const nguoiDat = String(it?.Nguoi_dat || '').trim()
    const noteItem = String(it?.Ghi_chu || '').trim()
    if (tenHang) itemTexts.push(tenHang)
    if (maHang) itemTexts.push(maHang)
    if (nguoiDat) {
      itemTexts.push(nguoiDat)
      itemHandles.push(nguoiDat)
    }
    if (noteItem) itemTexts.push(noteItem)
    if (!isActive) {
      const qty = Math.max(0, Number(it?.So_luong || 0))
      const price = Number(it?.Gia_ban || it?.Don_gia || 0)
      tabTotal += qty * price
    }
  }

  const matched = matchesMultiTokenRecord(q, {
    texts: [titleRaw, maHD, custName, diaChi, ghiChu, ...itemTexts],
    phones: [phone],
    handles: [custName, phone, ...itemHandles],
    amounts: [tabTotal],
  })
  if (!matched) return null

  const titleMatched = matchesMultiTokenRecord(q, { texts: [titleRaw], handles: [titleRaw] })
  if (phone && matchesMultiTokenRecord(q, { texts: [phone], phones: [phone], handles: [phone] })) {
    return `SĐT: ${phone}`
  }
  if (maHD && matchesMultiTokenRecord(q, { texts: [maHD] }) && !titleMatched) return `Mã: ${maHD}`
  if (custName && matchesMultiTokenRecord(q, { texts: [custName], handles: [custName] }) && !titleMatched) {
    return custName
  }
  if (diaChi && matchesMultiTokenRecord(q, { texts: [diaChi] })) return `Đ/c: ${diaChi}`
  if (ghiChu && matchesMultiTokenRecord(q, { texts: [ghiChu] })) return `Ghi chú: ${ghiChu}`

  for (const it of tabItems) {
    const tenHang = String(it?.tenHang || it?.Ten_hang || '').trim()
    const maHang = String(it?.maHang || it?.Ma_hang || '').trim()
    const nguoiDat = String(it?.Nguoi_dat || '').trim()
    if (tenHang && matchesMultiTokenRecord(q, { texts: [tenHang] })) return `Món: ${tenHang}`
    if (maHang && matchesMultiTokenRecord(q, { texts: [maHang] })) return `Mã món: ${maHang}`
    if (nguoiDat && matchesMultiTokenRecord(q, { texts: [nguoiDat], handles: [nguoiDat] })) {
      return `Người đặt: ${nguoiDat}`
    }
  }

  if (tabTotal > 0 && matchesMultiTokenRecord(q, { amounts: [tabTotal] })) {
    return `Tổng: ${formatWithCurrency(tabTotal, donViTienTeChung.value)}`
  }

  return ''
}

const filteredInvoiceTabEntries = computed(() => {
  const mode = tabSourceFilter.value
  const rawQ = String(tabSearchQuery.value || '').trim()
  const result = []
  invoiceTabs.value.forEach((tab, idx) => {
    if (mode === 'web' && !tab?.sourceOrderId) return
    if (mode === 'admin' && tab?.sourceOrderId) return
    if (!rawQ) {
      result.push({ tab, idx, matchedHint: '' })
      return
    }
    const hint = getTabMatchedHint(tab, idx, rawQ)
    if (hint !== null) {
      result.push({ tab, idx, matchedHint: hint })
    }
  })
  return result
})

const pendingApprovalOrders = computed(() => {
  const result = []
  const seenIds = new Set()
  const liveMap = liveOrdersById.value || {}

  const findLiveSnap = (maHD) =>
    liveMap[maHD] ||
    Object.values(liveMap).find(
      (v) => String(v?.meta?.Ma_hoa_don || v?.orderId || '').trim() === maHD,
    ) ||
    null

  const buildPendingEntry = (maHD, dhRow, liveSnap) => {
    const liveMeta = liveSnap?.submittedMeta || liveSnap?.meta || {}
    const itemsList = Array.isArray(liveSnap?.submittedItemsList)
      ? liveSnap.submittedItemsList
      : Array.isArray(liveSnap?.itemsList)
        ? liveSnap.itemsList
        : []
    const totalQty = itemsList.reduce((s, it) => s + Number(it?.So_luong || 0), 0)
    const itemsPreview =
      itemsList
        .slice(0, 4)
        .map((it) => `${Number(it?.So_luong || 0)}x ${String(it?.Ten_hang || '').trim()}`)
        .filter(Boolean)
        .join(', ') + (itemsList.length > 4 ? ` (+${itemsList.length - 4})` : '')
    const rawPay = String(
      liveMeta.Hinh_thuc_thanh_toan || dhRow?.Hinh_thuc_thanh_toan || 'TIEN_MAT',
    ).trim()
    return {
      maHoaDon: maHD,
      tenKhach: String(liveMeta.Ten_khach_hang || dhRow?.Ten_khach_hang || 'Khách lẻ').trim(),
      soDienThoai: String(liveMeta.So_dien_thoai || dhRow?.So_dien_thoai || '').trim(),
      diaChi: String(liveMeta.Dia_chi || dhRow?.Dia_chi || '').trim(),
      thoiGianNhanHang: String(
        liveMeta.Thoi_gian_nhan_hang || dhRow?.Thoi_gian_nhan_hang || '',
      ).trim(),
      ngayTao: String(liveMeta.Ngay_tao_duong_lich || dhRow?.Ngay_tao_duong_lich || '').trim(),
      hinhThucTT: rawPay === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt',
      donViTienTe: String(liveMeta.Don_vi_tien_te || dhRow?.Don_vi_tien_te || 'P').trim() || 'P',
      tongCong: Number(liveMeta.Tong_cong ?? dhRow?.Tong_gia_ban ?? 0),
      totalQty,
      itemsPreview,
      submittedAt: Number(liveMeta.Submitted_at || liveMeta.Updated_at || 0),
      isOpenedInTab: invoiceTabs.value.some(
        (t) => t.sourceOrderId === maHD || t.maHoaDon === maHD,
      ),
    }
  }

  for (const dh of donHangList.value || []) {
    const maHD = String(dh?.Ma_hoa_don || '').trim()
    if (!maHD || seenIds.has(maHD)) continue
    const liveSnap = findLiveSnap(maHD)
    const effectiveStatus = String(liveSnap?.meta?.Trang_thai || dh?.Trang_thai || '').trim()
    if (effectiveStatus !== 'Chờ duyệt') continue
    seenIds.add(maHD)
    result.push(buildPendingEntry(maHD, dh, liveSnap))
  }

  for (const liveSnap of Object.values(liveMap)) {
    if (!liveSnap?.exists) continue
    const maHD = String(liveSnap?.meta?.Ma_hoa_don || liveSnap?.orderId || '').trim()
    if (!maHD || seenIds.has(maHD)) continue
    const st = String(liveSnap?.meta?.Trang_thai || '').trim()
    if (st !== 'Chờ duyệt') continue
    seenIds.add(maHD)
    result.push(buildPendingEntry(maHD, null, liveSnap))
  }

  return result.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
})

const unopenedPendingOrders = computed(
  () => pendingApprovalOrders.value.filter((ord) => !ord.isOpenedInTab),
)

const unopenedPendingApprovalCount = computed(
  () => unopenedPendingOrders.value.length,
)

const tabsWithPendingUpdate = computed(() =>
  invoiceTabs.value.filter((t) => Boolean(t?.pendingWebUpdate?.changes?.length)),
)

const totalBellNotificationCount = computed(
  () => unopenedPendingApprovalCount.value + tabsWithPendingUpdate.value.length,
)

const bellButtonTooltip = computed(() => {
  const newCount = unopenedPendingApprovalCount.value
  const updCount = tabsWithPendingUpdate.value.length
  if (updCount > 0 && newCount > 0) {
    return `Có ${updCount} đơn khách vừa cập nhật & ${newCount} đơn chờ duyệt mới — bấm để xem`
  }
  if (updCount > 0) {
    return `Khách vừa cập nhật ${updCount} đơn trong bảng — bấm chuông để xem danh sách & đi tới tab`
  }
  if (newCount > 0) {
    return `Có ${newCount} đơn chờ duyệt chưa có trong bảng — bấm để xem & đưa vào bảng`
  }
  if (pendingApprovalOrders.value.length > 0) {
    return `Tất cả ${pendingApprovalOrders.value.length} đơn chờ duyệt đã được đưa vào bảng`
  }
  return 'Không có đơn đang chờ duyệt'
})

const activePendingWebUpdate = computed(
  () => activeTabObj.value?.pendingWebUpdate || null,
)

function getWebUpdateTypeLabel(type) {
  if (type === 'added') return 'Thêm'
  if (type === 'qty_up') return 'Tăng'
  if (type === 'qty_down') return 'Giảm'
  if (type === 'removed') return 'Xóa món'
  if (type === 'note') return 'Đổi ghi chú món'
  return 'Thông tin đơn'
}

function getOrderItemDiffKey(item) {
  const lineId = String(item?.lineId || '').trim()
  if (lineId) return `line:${lineId}`
  const maHang = String(item?.maHang || item?.Ma_hang || '').trim()
  const person = String(item?.nguoiDatId || item?.nguoiDat || '').trim()
  return `code:${maHang}__${person}`
}

function buildCustomerOrderUpdateDiff(oldItems = [], oldMeta = {}, newItems = [], newMeta = {}) {
  const oldMap = new Map()
  for (const it of oldItems || []) {
    if (!it) continue
    oldMap.set(getOrderItemDiffKey(it), it)
  }

  const newMap = new Map()
  for (const it of newItems || []) {
    if (!it) continue
    newMap.set(getOrderItemDiffKey(it), it)
  }

  const addedLineIds = []
  const addedMaHangs = []
  const qtyUpLineIds = []
  const qtyUpMaHangs = []
  const noteLineIds = []
  const noteMaHangs = []
  const changes = []

  for (const [k, nextIt] of newMap.entries()) {
    const prevIt = oldMap.get(k)
    const lineId = String(nextIt.lineId || '').trim()
    const maHang = String(nextIt.maHang || nextIt.Ma_hang || '').trim()
    const tenHang = String(nextIt.tenHang || nextIt.Ten_hang || maHang).trim()
    const nguoiDat = String(nextIt.nguoiDat || '').trim()
    const personTag = nguoiDat ? ` (${nguoiDat})` : ''
    const nextQty = Number(nextIt.soLuong ?? nextIt.So_luong ?? 1)
    const nextNote = String(nextIt.ghiChuHang ?? nextIt.Ghi_chu ?? '').trim()

    if (!prevIt) {
      if (lineId) addedLineIds.push(lineId)
      if (maHang) addedMaHangs.push(maHang)
      changes.push({
        type: 'added',
        lineId,
        maHang,
        tenHang,
        summary: `Thêm ${nextQty} ${tenHang}`,
        detail: nextNote ? `Ghi chú: ${nextNote}` : '',
      })
      continue
    }

    const prevQty = Number(prevIt.soLuong ?? prevIt.So_luong ?? 1)
    const prevNote = String(prevIt.ghiChuHang ?? prevIt.Ghi_chu ?? '').trim()

    if (nextQty > prevQty) {
      if (lineId) qtyUpLineIds.push(lineId)
      if (maHang) qtyUpMaHangs.push(maHang)
      changes.push({
        type: 'qty_up',
        lineId,
        maHang,
        tenHang,
        summary: `Tăng ${nextQty - prevQty} ${tenHang}`,
        detail: '',
      })
    } else if (nextQty < prevQty) {
      changes.push({
        type: 'qty_down',
        lineId,
        maHang,
        tenHang,
        summary: `Giảm ${prevQty - nextQty} ${tenHang}`,
        detail: '',
      })
    }

    if (nextNote !== prevNote) {
      if (lineId) noteLineIds.push(lineId)
      if (maHang) noteMaHangs.push(maHang)
      changes.push({
        type: 'note',
        lineId,
        maHang,
        tenHang,
        summary: `✎ Đổi ghi chú món ${tenHang}${personTag}`,
        detail: `${prevNote || '(trống)'} → ${nextNote || '(trống)'}`,
      })
    }
  }

  for (const [k, prevIt] of oldMap.entries()) {
    if (newMap.has(k)) continue
    const maHang = String(prevIt.maHang || prevIt.Ma_hang || '').trim()
    const tenHang = String(prevIt.tenHang || prevIt.Ten_hang || maHang).trim()
    const nguoiDat = String(prevIt.nguoiDat || '').trim()
    const personTag = nguoiDat ? ` (${nguoiDat})` : ''
    const prevQty = Number(prevIt.soLuong ?? prevIt.So_luong ?? 1)
    changes.push({
      type: 'removed',
      lineId: String(prevIt.lineId || '').trim(),
      maHang,
      tenHang,
      summary: `Xóa ${prevQty} ${tenHang}`,
      detail: '',
    })
  }

  const prevCust = oldMeta?.customer || {}
  const nextCust = newMeta?.customer || {}
  const metaFields = [
    ['Tên khách hàng', prevCust.tenKhachHang, nextCust.tenKhachHang],
    ['Số điện thoại', prevCust.soDienThoai, nextCust.soDienThoai],
    ['Địa chỉ giao', prevCust.diaChi, nextCust.diaChi],
    ['Ghi chú đơn', prevCust.ghiChuDonHang, nextCust.ghiChuDonHang],
    ['Thời gian nhận', oldMeta?.thoiGianNhanHang, newMeta?.thoiGianNhanHang],
    [
      'Thanh toán',
      oldMeta?.hinhThucThanhToan === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt',
      newMeta?.hinhThucThanhToan === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt',
    ],
  ]
  for (const [label, oldVal, newVal] of metaFields) {
    const o = String(oldVal || '').trim()
    const n = String(newVal || '').trim()
    if (o !== n) {
      changes.push({
        type: 'meta',
        summary: `✎ Cập nhật ${label}`,
        detail: `${o || '(trống)'} → ${n || '(trống)'}`,
      })
    }
  }

  return {
    addedLineIds: [...new Set(addedLineIds)],
    addedMaHangs: [...new Set(addedMaHangs)],
    qtyUpLineIds: [...new Set(qtyUpLineIds)],
    qtyUpMaHangs: [...new Set(qtyUpMaHangs)],
    noteLineIds: [...new Set(noteLineIds)],
    noteMaHangs: [...new Set(noteMaHangs)],
    changes,
  }
}

function getOrderItemUpdateBadge(entry) {
  const upd = activePendingWebUpdate.value
  const item = entry?.item
  if (!upd || !item) return null
  const lineId = String(item.lineId || '').trim()
  const maHang = String(item.maHang || item.Ma_hang || '').trim()

  if ((lineId && upd.addedLineIds?.includes(lineId)) || (!lineId && maHang && upd.addedMaHangs?.includes(maHang))) {
    return { kind: 'added', label: 'MỚI THÊM' }
  }
  if ((lineId && upd.qtyUpLineIds?.includes(lineId)) || (!lineId && maHang && upd.qtyUpMaHangs?.includes(maHang))) {
    return { kind: 'qty_up', label: 'TĂNG SL' }
  }
  if ((lineId && upd.noteLineIds?.includes(lineId)) || (!lineId && maHang && upd.noteMaHangs?.includes(maHang))) {
    return { kind: 'note', label: 'ĐỔI GHI CHÚ' }
  }
  return null
}

function getOrderGroupUpdateBadge(grp) {
  const entries = Array.isArray(grp?.entries) ? grp.entries : []
  let best = null
  for (const entry of entries) {
    const badge = getOrderItemUpdateBadge(entry)
    if (!badge) continue
    if (badge.kind === 'added') return badge
    if (!best || (best.kind === 'note' && badge.kind === 'qty_up')) {
      best = badge
    }
  }
  return best
}

function scrollFirstUpdatedRowIntoView() {
  nextTick(() => {
    setTimeout(() => {
      const targetEl = document.querySelector('.row-web-updated, .card-web-updated')
      if (targetEl && typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 80)
  })
}

function navigateToUpdatedOrderTab(tabId) {
  const target = invoiceTabs.value.find((t) => t.id === tabId)
  if (!target) return
  showPendingOrdersModal.value = false
  pendingBellPulse.value = false
  if (tabSourceFilter.value === 'admin') {
    tabSourceFilter.value = 'all'
  }
  if (activeInvoiceTabId.value !== target.id) {
    switchInvoiceTab(target.id)
  }
  if (isMobile.value) {
    activeMobileTab.value = 'order'
  }
  scrollFirstUpdatedRowIntoView()
}

function handleOrderBellClick() {
  pendingBellPulse.value = false
  showPendingOrdersModal.value = true
}

function confirmWebOrderUpdate() {
  const tab = activeTabObj.value
  if (!tab) return
  tab.pendingWebUpdate = null
  tab.updateBaselineItems = null
  tab.updateBaselineMeta = null
  showWebUpdateDetailModal.value = false
  saveTabsToStorage()
  toast('success', `✅ Đã xác nhận cập nhật cho đơn #${tab.sourceOrderId || tab.maHoaDon}`)
}

function openWebUpdateDetailModal() {
  if (!activePendingWebUpdate.value?.changes?.length) return
  showWebUpdateDetailModal.value = true
}

function checkNewPendingOrdersNotification() {
  if (!hasLoadedDonHang.value) return
  const list = pendingApprovalOrders.value
  if (!hasInitPendingBellWatch) {
    hasInitPendingBellWatch = true
    for (const ord of list) {
      knownPendingOrderIds.add(ord.maHoaDon)
    }
    return
  }

  const newOrders = []
  for (const ord of list) {
    if (!knownPendingOrderIds.has(ord.maHoaDon)) {
      knownPendingOrderIds.add(ord.maHoaDon)
      if (!ord.isOpenedInTab) {
        newOrders.push(ord)
      }
    }
  }

  if (newOrders.length > 0) {
    pendingBellPulse.value = true
    if (pendingBellPulseTimer) clearTimeout(pendingBellPulseTimer)
    pendingBellPulseTimer = setTimeout(() => {
      pendingBellPulse.value = false
    }, 4500)

    const newest = newOrders[0]
    toast(
      'info',
      newOrders.length === 1
        ? `🔔 Có đơn mới #${newest.maHoaDon} (${newest.tenKhach}) đang chờ duyệt!`
        : `🔔 Có ${newOrders.length} đơn mới đang chờ duyệt!`,
      4000,
    )
  }
}

function openPendingOrdersModal() {
  handleOrderBellClick()
}

function closePendingOrdersModal() {
  showPendingOrdersModal.value = false
}

function getTabLiveStatus(tab) {
  if (!tab) return ''
  if (tab.sourceOrderId) {
    if (hasLoadedDonHang.value) {
      const dh = donHangList.value.find(
        (d) => String(d?.Ma_hoa_don || '').trim() === String(tab.sourceOrderId).trim(),
      )
      if (dh) {
        return String(dh.Trang_thai || '').trim() || 'Chờ duyệt'
      }
      return tab.sourceOrderStatus || 'Đã hủy'
    }
    return tab.sourceOrderStatus || 'Chờ duyệt'
  }
  if (tab.adminOrderStatus) {
    if (hasLoadedDonHang.value) {
      const dh = donHangList.value.find(
        (d) => String(d?.Ma_hoa_don || '').trim() === String(tab.maHoaDon || '').trim(),
      )
      if (dh) {
        return String(dh.Trang_thai || '').trim() || tab.adminOrderStatus
      }
      if (tab.adminSeenInDonHang) return 'Đã hủy'
    }
    return tab.adminOrderStatus
  }
  return ''
}

const activeOrderStatus = computed(() => getTabLiveStatus(activeTabObj.value))

function getTabStatusLabel(status) {
  const st = String(status || '').trim()
  if (st === 'Chờ duyệt') return 'Đang xác nhận'
  if (st === 'Đang xử lý') return 'Đang xử lý'
  if (st === 'Đang ship') return 'Đang ship'
  if (st === 'Hoàn thành') return 'Hoàn thành'
  if (st === 'Đã hủy') return 'Đã hủy'
  return st || 'Đang xác nhận'
}

function getTabStatusClass(status) {
  const st = String(status || '').trim()
  if (st === 'Chờ duyệt') return 'status-waiting'
  if (st === 'Đang xử lý') return 'status-processing'
  if (st === 'Đang ship') return 'status-shipping'
  if (st === 'Hoàn thành') return 'status-done'
  if (st === 'Đã hủy') return 'status-cancelled'
  return 'status-waiting'
}

function syncTabsStatusFromDonHang() {
  if (!hasLoadedDonHang.value) return
  let changed = false
  for (const tab of invoiceTabs.value) {
    if (!tab) continue
    if (tab.sourceOrderId) {
      const dh = donHangList.value.find(
        (d) => String(d?.Ma_hoa_don || '').trim() === String(tab.sourceOrderId).trim(),
      )
      const nextSt = dh ? String(dh.Trang_thai || '').trim() || 'Chờ duyệt' : 'Đã hủy'
      if (tab.sourceOrderStatus !== nextSt) {
        tab.sourceOrderStatus = nextSt
        changed = true
      }
      continue
    }
    if (tab.adminOrderStatus) {
      const dh = donHangList.value.find(
        (d) => String(d?.Ma_hoa_don || '').trim() === String(tab.maHoaDon || '').trim(),
      )
      if (dh) {
        if (!tab.adminSeenInDonHang) {
          tab.adminSeenInDonHang = true
          changed = true
        }
        const nextSt = String(dh.Trang_thai || '').trim() || 'Đang xử lý'
        if (tab.adminOrderStatus !== nextSt) {
          tab.adminOrderStatus = nextSt
          changed = true
        }
      } else if (tab.adminSeenInDonHang && tab.adminOrderStatus !== 'Đã hủy') {
        tab.adminOrderStatus = 'Đã hủy'
        changed = true
      }
    }
  }
  if (changed) saveTabsToStorage()
}

function syncTabsFromLiveOrders(liveMap = {}) {
  if (!liveMap || typeof liveMap !== 'object') return
  if (isOrderActionLoading.value || isSubmitting.value) return

  let changed = false
  let activeTabUpdated = null

  for (let i = 0; i < invoiceTabs.value.length; i++) {
    const tab = invoiceTabs.value[i]
    const orderId = String(tab?.sourceOrderId || '').trim()
    if (!orderId) continue

    const snap =
      liveMap[orderId] ||
      Object.values(liveMap).find(
        (v) => String(v?.meta?.Ma_hoa_don || v?.orderId || '').trim() === orderId,
      )
    if (!snap || !snap.exists) continue

    const meta = snap.submittedMeta || snap.meta || {}
    const st = String(snap.meta?.Trang_thai || meta.Trang_thai || '').trim()
    if (st && tab.sourceOrderStatus !== st) {
      tab.sourceOrderStatus = st
      changed = true
    }

    // Chỉ tự động kéo dữ liệu đơn web về tab khi đơn vẫn ở trạng thái "Chờ duyệt" và cập nhật xuất phát từ phía khách
    if (st !== 'Chờ duyệt') continue
    if (meta.Synced_by_admin && meta.Last_source !== 'web') continue

    const submittedAt = Number(meta.Submitted_at || 0)
    if (!submittedAt) continue

    const prevSubmittedAt = tab.lastWebSubmittedAt
    if (prevSubmittedAt !== undefined && submittedAt <= Number(prevSubmittedAt || 0)) {
      continue
    }

    const maHD = String(meta.Ma_hoa_don || tab.maHoaDon || orderId).trim()
    const soHD = String(meta.So_hoa_don || tab.soHoaDon || '').trim()
    const nowStr = formatDateTimeVN()
    const sourceItems = Array.isArray(snap.submittedItemsList)
      ? snap.submittedItemsList
      : snap.itemsList || []
    const mappedItems = sourceItems.map((it) =>
      mapServerOrderItemToPosRow(it, maHD, soHD, nowStr),
    )
    const delivery = parseDeliveryToInputs(meta.Thoi_gian_nhan_hang)
    const nextPay = meta.Hinh_thuc_thanh_toan === 'CHUYEN_KHOAN' ? 'CHUYEN_KHOAN' : 'TIEN_MAT'
    const nextCustomer = {
      maKhachHang: tab.customer?.maKhachHang || meta.Ma_khach_hang || '',
      tenKhachHang: meta.Ten_khach_hang ?? tab.customer?.tenKhachHang ?? '',
      soDienThoai: meta.So_dien_thoai ?? tab.customer?.soDienThoai ?? '',
      diaChi: meta.Dia_chi ?? tab.customer?.diaChi ?? '',
      ghiChu: tab.customer?.ghiChu || '',
      ghiChuDonHang: String(meta.Ghi_chu ?? tab.customer?.ghiChuDonHang ?? '')
        .replace(/\s*\[KM ĐẠT ĐƯỢC:[^\]]*\]/gi, '')
        .trim(),
      isExistingCustomer: Boolean(tab.customer?.isExistingCustomer || meta.Ma_khach_hang),
    }

    const nextShipFee =
      meta.Phi_ship !== undefined
        ? Math.max(0, Number(meta.Phi_ship || 0))
        : Math.max(0, Number(tab.phiShip || 0))

    const nextDigest = computeOrderSyncFingerprint({
      items: mappedItems,
      customer: nextCustomer,
      ngayNhanHang: delivery.ngayNhanHang,
      gioNhanHang: delivery.gioNhanHang,
      phutNhanHang: delivery.phutNhanHang,
      hinhThucThanhToan: nextPay,
      globalGiamGia: Number(tab.globalGiamGia || 0),
      globalChietKhauPercent: Number(tab.globalChietKhauPercent || 0),
      phiShip: nextShipFee,
    })

    // Nếu dữ liệu tab hiện tại đã trùng khớp với bản web mới nhất -> chỉ cập nhật mốc thời gian
    if (nextDigest === tab.syncedDigest) {
      tab.lastWebSubmittedAt = submittedAt
      changed = true
      continue
    }

    const baselineItems = Array.isArray(tab.updateBaselineItems)
      ? tab.updateBaselineItems
      : JSON.parse(JSON.stringify(tab.items || []))
    const baselineMeta = tab.updateBaselineMeta || {
      customer: JSON.parse(JSON.stringify(tab.customer || {})),
      thoiGianNhanHang: tab.thoiGianNhanHang || '',
      hinhThucThanhToan: tab.hinhThucThanhToan || 'TIEN_MAT',
    }
    const diff = buildCustomerOrderUpdateDiff(baselineItems, baselineMeta, mappedItems, {
      customer: nextCustomer,
      thoiGianNhanHang: delivery.thoiGianNhanHang,
      hinhThucThanhToan: nextPay,
    })

    tab.items = mappedItems
    tab.customer = nextCustomer
    tab.orderCreatedAt = String(meta.Ngay_tao_duong_lich || tab.orderCreatedAt || '').trim()
    tab.ngayNhanHang = delivery.ngayNhanHang
    tab.gioNhanHang = delivery.gioNhanHang
    tab.phutNhanHang = delivery.phutNhanHang
    tab.thoiGianNhanHang = delivery.thoiGianNhanHang
    tab.hinhThucThanhToan = nextPay
    tab.phiShip = nextShipFee
    tab.lastWebSubmittedAt = submittedAt
    tab.syncedDigest = nextDigest
    tab.orderTableViewMode =
      detectHasMultipleOrderMembers(mappedItems) || (tab.customOrderMembers?.length || 0) > 0
        ? 'by_member'
        : 'grouped'

    if (diff.changes.length > 0) {
      if (!tab.updateBaselineItems) {
        tab.updateBaselineItems = baselineItems
        tab.updateBaselineMeta = baselineMeta
      }
      tab.pendingWebUpdate = {
        updatedAt: submittedAt,
        orderId: maHD,
        ...diff,
      }
      pendingBellPulse.value = true
      if (pendingBellPulseTimer) clearTimeout(pendingBellPulseTimer)
      pendingBellPulseTimer = setTimeout(() => {
        pendingBellPulse.value = false
      }, 6000)
      toast(
        'info',
        `🔔 Khách vừa cập nhật đơn #${maHD} (${diff.changes.length} thay đổi) — bấm chuông để kiểm tra!`,
        4500,
      )
    }

    changed = true

    if (tab.id === activeInvoiceTabId.value) {
      activeTabUpdated = tab
    }
  }

  if (activeTabUpdated) {
    applyTabToEditor(activeTabUpdated)
  } else if (changed) {
    saveTabsToStorage()
  }
}

function goBackToOrdersPage() {
  router.push({ name: 'admin-don-hang' })
}

function detectHasMultipleOrderMembers(list = []) {
  const ids = new Set()
  const namesWithId = new Set()
  const namesWithoutId = new Set()
  let hasGuest = false
  let hasAdmin = false

  for (const it of list) {
    if (!it) continue
    if (it.Added_by_role === 'admin' || it.Nguoi_dat === 'Quán thêm') {
      hasAdmin = true
      continue
    }
    if (it.Added_by_role === 'guest') {
      hasGuest = true
    }
    const id = String(it.Nguoi_dat_id || '').trim()
    const name = String(it.Nguoi_dat || '').trim().toLowerCase()
    if (id) {
      ids.add(id)
      if (name && !id.startsWith('local_')) namesWithId.add(name)
    } else if (name) {
      namesWithoutId.add(name)
    }
  }

  let extraNameCount = 0
  for (const name of namesWithoutId) {
    if (!namesWithId.has(name)) extraNameCount += 1
  }

  const totalDistinctCustomers = ids.size + extraNameCount
  return totalDistinctCustomers > 1 || hasGuest || (hasAdmin && totalDistinctCustomers >= 1)
}

function genTabId() {
  tabSeq += 1
  return `TAB_${Date.now()}_${tabSeq}_${Math.random().toString(36).slice(2, 6)}`
}

function getDefaultDeliveryParts() {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 10)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const gio = String(now.getHours()).padStart(2, '0')
  const phut = String(now.getMinutes()).padStart(2, '0')
  const ngay = `${y}-${m}-${d}`
  return {
    ngayNhanHang: ngay,
    gioNhanHang: gio,
    phutNhanHang: phut,
    thoiGianNhanHang: `${ngay}T${gio}:${phut}`,
  }
}

function parseDeliveryToInputs(rawStr) {
  const fallback = getDefaultDeliveryParts()
  const str = String(rawStr || '').trim()
  if (!str) return fallback

  // Match "HH:mm[:ss] DD/MM/YYYY"
  const vnMatch = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (vnMatch) {
    const gio = String(vnMatch[1]).padStart(2, '0')
    const phut = String(vnMatch[2]).padStart(2, '0')
    const dd = String(vnMatch[3]).padStart(2, '0')
    const mm = String(vnMatch[4]).padStart(2, '0')
    const yyyy = vnMatch[5]
    const ngay = `${yyyy}-${mm}-${dd}`
    return {
      ngayNhanHang: ngay,
      gioNhanHang: gio,
      phutNhanHang: phut,
      thoiGianNhanHang: `${ngay}T${gio}:${phut}`,
    }
  }

  // Match ISO-like "YYYY-MM-DDTHH:mm"
  const isoMatch = str.match(/(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (isoMatch) {
    return {
      ngayNhanHang: isoMatch[1],
      gioNhanHang: isoMatch[2],
      phutNhanHang: isoMatch[3],
      thoiGianNhanHang: `${isoMatch[1]}T${isoMatch[2]}:${isoMatch[3]}`,
    }
  }

  // Match free hour like "18h30" or "18:30"
  const timeOnly = str.match(/(\d{1,2})[:hH](\d{2})/)
  if (timeOnly) {
    const gio = String(Math.min(23, Math.max(0, Number(timeOnly[1])))).padStart(2, '0')
    const phut = String(Math.min(59, Math.max(0, Number(timeOnly[2])))).padStart(2, '0')
    return {
      ngayNhanHang: fallback.ngayNhanHang,
      gioNhanHang: gio,
      phutNhanHang: phut,
      thoiGianNhanHang: `${fallback.ngayNhanHang}T${gio}:${phut}`,
    }
  }

  return fallback
}

function genMaHoaDon() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const base =
    'HD' +
    p(d.getDate()) +
    p(d.getMonth() + 1) +
    d.getFullYear() +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  const exists = invoiceTabs.value.some((t) => t.maHoaDon === base)
  if (!exists) return base
  maHoaDonSeq += 1
  return `${base}_${maHoaDonSeq}`
}

function computeOrderSyncFingerprint(source = null) {
  const srcItems = source ? (Array.isArray(source.items) ? source.items : []) : items.value || []
  const srcCust = source ? (source.customer || {}) : form
  const srcNgay = source ? source.ngayNhanHang : ngayNhanHang.value
  const srcGio = source ? source.gioNhanHang : gioNhanHang.value
  const srcPhut = source ? source.phutNhanHang : phutNhanHang.value
  const srcPay = source ? source.hinhThucThanhToan : hinhThucThanhToan.value
  const srcGiam = source ? source.globalGiamGia : globalGiamGia.value
  const srcCk = source ? source.globalChietKhauPercent : globalChietKhauPercent.value
  const srcShip = source ? source.phiShip : phiShip.value

  return JSON.stringify({
    items: srcItems.map((it) => ({
      maHang: String(it?.maHang ?? it?.Ma_hang ?? '').trim(),
      tenHang: String(it?.tenHang ?? it?.Ten_hang ?? '').trim(),
      size: String(it?.size ?? it?.Size ?? '').trim(),
      dvt: String(it?.dvt ?? it?.Dvt ?? '').trim(),
      soLuong: Number(it?.soLuong ?? it?.So_luong ?? 0),
      giaBan: Number(it?.giaBan ?? it?.Gia_ban ?? 0),
      giaGoc: Number(it?.giaGoc ?? it?.Gia_goc ?? 0),
      giamGia: Number(it?.giamGia ?? it?.Giam_gia ?? 0),
      chietKhau: Number(it?.chietKhau ?? 0),
      ghiChu: String(it?.ghiChuHang ?? it?.Ghi_chu ?? '').trim(),
      nguoiDat: String(it?.Nguoi_dat ?? '').trim(),
      role: String(it?.Added_by_role ?? '').trim(),
    })),
    customer: {
      tenKhachHang: String(srcCust.tenKhachHang || '').trim(),
      soDienThoai: String(srcCust.soDienThoai || '').trim(),
      diaChi: String(srcCust.diaChi || '').trim(),
      ghiChuDonHang: String(srcCust.ghiChuDonHang || '').trim(),
    },
    ngayNhanHang: String(srcNgay || ''),
    gioNhanHang: String(srcGio || ''),
    phutNhanHang: String(srcPhut || ''),
    hinhThucThanhToan: String(srcPay || 'TIEN_MAT'),
    globalGiamGia: Number(srcGiam || 0),
    globalChietKhauPercent: Number(srcCk || 0),
    phiShip: Math.max(0, Number(srcShip || 0)),
  })
}

function createBlankTabSnapshot(overrides = {}) {
  const delivery = getDefaultDeliveryParts()
  return {
    id: overrides.id || genTabId(),
    sourceOrderId: overrides.sourceOrderId || '',
    sourceOrderStatus: overrides.sourceOrderStatus || '',
    adminOrderStatus: overrides.adminOrderStatus || '',
    adminSeenInDonHang: Boolean(overrides.adminSeenInDonHang),
    syncedDigest: overrides.syncedDigest || '',
    pendingWebUpdate: overrides.pendingWebUpdate || null,
    updateBaselineItems: overrides.updateBaselineItems || null,
    updateBaselineMeta: overrides.updateBaselineMeta || null,
    lastWebSubmittedAt:
      overrides.lastWebSubmittedAt !== undefined ? Number(overrides.lastWebSubmittedAt || 0) : 0,
    maHoaDon: overrides.maHoaDon || genMaHoaDon(),
    soHoaDon: overrides.soHoaDon || genSoHoaDon(),
    orderCreatedAt: overrides.orderCreatedAt || '',
    ngayNhanHang: overrides.ngayNhanHang || delivery.ngayNhanHang,
    gioNhanHang: overrides.gioNhanHang || delivery.gioNhanHang,
    phutNhanHang: overrides.phutNhanHang || delivery.phutNhanHang,
    thoiGianNhanHang: overrides.thoiGianNhanHang || delivery.thoiGianNhanHang,
    hinhThucThanhToan: overrides.hinhThucThanhToan || 'TIEN_MAT',
    ckBaoGomShip: Boolean(overrides.ckBaoGomShip),
    exportPriceMode: overrides.exportPriceMode || '',
    orderTableViewMode: overrides.orderTableViewMode || 'grouped',
    customOrderMembers: Array.isArray(overrides.customOrderMembers)
      ? JSON.parse(JSON.stringify(overrides.customOrderMembers))
      : [],
    globalGiamGia: Number(overrides.globalGiamGia || 0),
    globalChietKhauPercent: Number(overrides.globalChietKhauPercent || 0),
    phiShip: Math.max(0, Number(overrides.phiShip || 0)),
    items: Array.isArray(overrides.items) ? JSON.parse(JSON.stringify(overrides.items)) : [],
    customer: {
      maKhachHang: overrides.customer?.maKhachHang || '',
      tenKhachHang: overrides.customer?.tenKhachHang || '',
      soDienThoai: overrides.customer?.soDienThoai || '',
      diaChi: overrides.customer?.diaChi || '',
      ghiChu: overrides.customer?.ghiChu || '',
      ghiChuDonHang: overrides.customer?.ghiChuDonHang || '',
      isExistingCustomer: Boolean(overrides.customer?.isExistingCustomer),
    },
  }
}

function saveTabsToStorage() {
  try {
    localStorage.setItem(
      INVOICE_TABS_STORAGE_KEY,
      JSON.stringify({
        activeId: activeInvoiceTabId.value,
        tabs: invoiceTabs.value,
      }),
    )
  } catch {}
}

function captureCurrentEditorSnapshot(existingTab = {}) {
  return {
    id: existingTab.id || activeInvoiceTabId.value || genTabId(),
    sourceOrderId: existingTab.sourceOrderId || '',
    sourceOrderStatus: existingTab.sourceOrderStatus || '',
    adminOrderStatus: existingTab.adminOrderStatus || '',
    adminSeenInDonHang: Boolean(existingTab.adminSeenInDonHang),
    syncedDigest: syncedOrderDigest.value || existingTab.syncedDigest || '',
    pendingWebUpdate: existingTab.pendingWebUpdate || null,
    updateBaselineItems: existingTab.updateBaselineItems || null,
    updateBaselineMeta: existingTab.updateBaselineMeta || null,
    lastWebSubmittedAt:
      existingTab.lastWebSubmittedAt !== undefined
        ? Number(existingTab.lastWebSubmittedAt || 0)
        : 0,
    maHoaDon: maHoaDon.value,
    soHoaDon: soHoaDon.value,
    orderCreatedAt: orderCreatedAt.value || existingTab.orderCreatedAt || '',
    ngayNhanHang: ngayNhanHang.value,
    gioNhanHang: gioNhanHang.value,
    phutNhanHang: phutNhanHang.value,
    thoiGianNhanHang: thoiGianNhanHang.value,
    hinhThucThanhToan: hinhThucThanhToan.value,
    ckBaoGomShip: Boolean(ckBaoGomShip.value),
    exportPriceMode: exportPriceMode.value || '',
    orderTableViewMode: orderTableViewMode.value,
    customOrderMembers: JSON.parse(JSON.stringify(customOrderMembers.value || [])),
    globalGiamGia: Number(globalGiamGia.value || 0),
    globalChietKhauPercent: Number(globalChietKhauPercent.value || 0),
    phiShip: Math.max(0, Number(phiShip.value || 0)),
    webAdminMessageInput: String(webAdminMessageInput.value || ''),
    webAdminMessageLastSent: String(webAdminMessageLastSent.value || ''),
    items: JSON.parse(JSON.stringify(items.value || [])),
    customer: {
      maKhachHang: form.maKhachHang || '',
      tenKhachHang: form.tenKhachHang || '',
      soDienThoai: form.soDienThoai || '',
      diaChi: form.diaChi || '',
      ghiChu: form.ghiChu || '',
      ghiChuDonHang: form.ghiChuDonHang || '',
      isExistingCustomer: Boolean(isExistingCustomer),
    },
  }
}

function syncActiveTabSnapshot() {
  if (isSwitchingTab || !activeInvoiceTabId.value) return
  const idx = invoiceTabs.value.findIndex((t) => t.id === activeInvoiceTabId.value)
  if (idx === -1) return
  invoiceTabs.value[idx] = captureCurrentEditorSnapshot(invoiceTabs.value[idx])
  saveTabsToStorage()
}

function applyTabToEditor(tab) {
  if (!tab) return
  isSwitchingTab = true
  activeInvoiceTabId.value = tab.id
  maHoaDon.value = tab.maHoaDon || genMaHoaDon()
  soHoaDon.value = tab.soHoaDon || genSoHoaDon()
  orderCreatedAt.value = String(tab.orderCreatedAt || '').trim()

  const delivery =
    tab.ngayNhanHang && tab.gioNhanHang && tab.phutNhanHang
      ? tab
      : getDefaultDeliveryParts()
  ngayNhanHang.value = delivery.ngayNhanHang
  gioNhanHang.value = delivery.gioNhanHang
  phutNhanHang.value = delivery.phutNhanHang
  thoiGianNhanHang.value =
    tab.thoiGianNhanHang || `${delivery.ngayNhanHang}T${delivery.gioNhanHang}:${delivery.phutNhanHang}`

  hinhThucThanhToan.value = tab.hinhThucThanhToan || 'TIEN_MAT'
  ckBaoGomShip.value = Boolean(tab.ckBaoGomShip)
  exportPriceMode.value = tab.exportPriceMode === 'giaBan' || tab.exportPriceMode === 'giaGoc' ? tab.exportPriceMode : ''
  globalGiamGia.value = Number(tab.globalGiamGia || 0)
  globalChietKhauPercent.value = Number(tab.globalChietKhauPercent || 0)
  phiShip.value = Math.max(0, Number(tab.phiShip || 0))
  showWebAdminMsgBox.value = false
  webAdminMessageInput.value = String(tab.webAdminMessageInput || '')
  webAdminMessageLastSent.value = String(tab.webAdminMessageLastSent || '')
  const loadedItems = Array.isArray(tab.items) ? JSON.parse(JSON.stringify(tab.items)) : []
  items.value = loadedItems
  customOrderMembers.value = Array.isArray(tab.customOrderMembers)
    ? JSON.parse(JSON.stringify(tab.customOrderMembers))
    : []
  orderTableViewMode.value =
    tab.orderTableViewMode ||
    (detectHasMultipleOrderMembers(loadedItems) || customOrderMembers.value.length > 0
      ? 'by_member'
      : 'grouped')

  const cust = tab.customer || {}
  isExistingCustomer = Boolean(cust.isExistingCustomer || cust.maKhachHang)
  form.maKhachHang = cust.maKhachHang || ''
  form.tenKhachHang = cust.tenKhachHang || ''
  form.soDienThoai = cust.soDienThoai || ''
  form.diaChi = cust.diaChi || ''
  form.ghiChu = cust.ghiChu || ''
  form.ghiChuDonHang = cust.ghiChuDonHang || ''
  lastCheckedName = form.tenKhachHang || ''
  syncedOrderDigest.value =
    tab.syncedDigest ||
    (tab.sourceOrderId || tab.adminOrderStatus
      ? computeOrderSyncFingerprint({
          items: loadedItems,
          customer: cust,
          ngayNhanHang: delivery.ngayNhanHang,
          gioNhanHang: delivery.gioNhanHang,
          phutNhanHang: delivery.phutNhanHang,
          hinhThucThanhToan: tab.hinhThucThanhToan || 'TIEN_MAT',
          globalGiamGia: tab.globalGiamGia,
          globalChietKhauPercent: tab.globalChietKhauPercent,
          phiShip: tab.phiShip,
        })
      : '')
  selectedTargetMemberKey.value = ''
  highlightedIndex.value = -1
  saveTabsToStorage()
  nextTick(() => {
    isSwitchingTab = false
  })
}

function switchInvoiceTab(tabId) {
  if (!tabId || tabId === activeInvoiceTabId.value) return
  syncActiveTabSnapshot()
  const target = invoiceTabs.value.find((t) => t.id === tabId)
  if (target) applyTabToEditor(target)
}

function handleInvoiceTabSelect(tabId) {
  if (!tabId) return
  if (tabId !== activeInvoiceTabId.value) {
    switchInvoiceTab(tabId)
  }
  if (isMobile.value && activeMobileTab.value === 'tabs') {
    setMobileTab('order')
  }
}

function addNewInvoiceTab() {
  syncActiveTabSnapshot()
  if (tabSourceFilter.value === 'web') {
    tabSourceFilter.value = 'all'
  }
  const newTab = createBlankTabSnapshot()
  invoiceTabs.value.push(newTab)
  applyTabToEditor(newTab)
  if (isMobile.value && activeMobileTab.value === 'tabs') {
    setMobileTab('entry')
  }
}

function closeInvoiceTab(tabId) {
  syncActiveTabSnapshot()
  const idx = invoiceTabs.value.findIndex((t) => t.id === tabId)
  if (idx === -1) return

  if (invoiceTabs.value.length === 1) {
    const freshTab = createBlankTabSnapshot()
    invoiceTabs.value = [freshTab]
    applyTabToEditor(freshTab)
    return
  }

  const wasActive = tabId === activeInvoiceTabId.value
  invoiceTabs.value.splice(idx, 1)
  if (wasActive) {
    const nextTab = invoiceTabs.value[Math.min(idx, invoiceTabs.value.length - 1)]
    applyTabToEditor(nextTab)
  } else {
    saveTabsToStorage()
  }
}

function isTabUnsynced(tab) {
  if (!tab) return false
  if (!tab.sourceOrderId && !tab.adminOrderStatus) return false
  if (tab.id === activeInvoiceTabId.value) return !isOrderSyncedWithWeb.value
  if (!tab.syncedDigest) return true
  return computeOrderSyncFingerprint(tab) !== tab.syncedDigest
}

function requestCloseInvoiceTab(tabId) {
  syncActiveTabSnapshot()
  const idx = invoiceTabs.value.findIndex((t) => t.id === tabId)
  if (idx === -1) return
  const tab = invoiceTabs.value[idx]
  const st = getTabLiveStatus(tab)

  if (isTabUntouchedDraft(tab) || st === 'Hoàn thành' || st === 'Đã hủy') {
    closeInvoiceTab(tabId)
    return
  }

  const isActiveOrder = Boolean(tab.sourceOrderId || tab.adminOrderStatus)
  closeTabConfirmState.value = {
    tabId: tab.id,
    mode: isActiveOrder ? 'active_order' : 'draft',
    title: getTabDisplayTitle(tab, idx),
    maHoaDon: String(tab.sourceOrderId || tab.maHoaDon || '').trim(),
    status: st || (tab.sourceOrderId ? 'Chờ duyệt' : ''),
    isWeb: Boolean(tab.sourceOrderId),
    qty: getTabItemQty(tab),
    unsynced: isTabUnsynced(tab),
  }
}

function cancelCloseTabConfirm() {
  if (isClosingTabCancelling.value) return
  closeTabConfirmState.value = null
}

function confirmKeepOrderCloseTab() {
  const st = closeTabConfirmState.value
  if (!st || isClosingTabCancelling.value) return
  const targetId = st.tabId
  closeTabConfirmState.value = null
  closeInvoiceTab(targetId)
}

async function confirmCancelAndCloseTab() {
  const st = closeTabConfirmState.value
  if (!st || isClosingTabCancelling.value) return
  const targetTab = invoiceTabs.value.find((t) => t.id === st.tabId)
  if (!targetTab) {
    closeTabConfirmState.value = null
    return
  }

  const maHD = String(targetTab.sourceOrderId || targetTab.maHoaDon || '').trim()
  if (!maHD) {
    closeTabConfirmState.value = null
    closeInvoiceTab(targetTab.id)
    return
  }

  isClosingTabCancelling.value = true
  try {
    const res = await dispatchAction({
      action: 'huyDonHang',
      Ma_hoa_don: maHD,
    })
    if (res?.success) {
      if (targetTab.sourceOrderId) {
        targetTab.sourceOrderStatus = 'Đã hủy'
      } else {
        targetTab.adminOrderStatus = 'Đã hủy'
      }
      saveTabsToStorage()
      toast('success', `Đã hủy đơn #${maHD}`)
      const targetId = targetTab.id
      closeTabConfirmState.value = null
      closeInvoiceTab(targetId)
    } else {
      toast('error', '❌ Lỗi: ' + (res?.message || 'Không thể hủy đơn'))
    }
  } catch (e) {
    console.error(e)
    toast('error', '❌ Lỗi kết nối Firebase khi hủy đơn')
  } finally {
    isClosingTabCancelling.value = false
  }
}

function isTabUntouchedDraft(tab) {
  if (!tab) return false
  if (tab.sourceOrderId || tab.adminOrderStatus) return false
  if (Array.isArray(tab.items) && tab.items.length > 0) return false
  if (Array.isArray(tab.customOrderMembers) && tab.customOrderMembers.length > 0) return false
  const cust = tab.customer || {}
  return !cust.tenKhachHang && !cust.soDienThoai && !cust.diaChi && !cust.ghiChuDonHang
}

function getTabItemQty(tab) {
  const list = tab?.id === activeInvoiceTabId.value ? items.value : tab?.items || []
  return list.reduce((sum, it) => sum + Number(it?.soLuong ?? it?.So_luong ?? 0), 0)
}

function getTabDisplayTitle(tab, idx) {
  const isActive = tab?.id === activeInvoiceTabId.value
  const custName = String(
    isActive ? form.tenKhachHang : tab?.customer?.tenKhachHang || '',
  ).trim()
  const shortCode = tab?.sourceOrderId
    ? `#${String(tab.sourceOrderId).slice(-6)}`
    : `Đơn ${idx + 1}`
  if (custName) return `${shortCode} · ${custName}`
  return shortCode
}

function mapServerOrderItemToPosRow(raw, maHD, soHD, ngayTaoStr) {
  const rawCode = String(raw?.Ma_hang || '').trim()
  const prod = rawCode ? hangHoaByMaMap.value.get(rawCode) : null
  const rawGiaGoc = Number(raw?.Gia_goc ?? 0) || 0
  const giaGoc = rawGiaGoc > 0 ? rawGiaGoc : Number(prod?.Gia_goc ?? 0) || 0
  const giaBan = Number(raw?.Gia_ban ?? 0) || 0
  const qty = Math.max(1, Number(raw?.So_luong ?? 1) || 1)
  const giamGia = Number(raw?.Giam_gia ?? 0) || 0
  const chietKhau = Number(raw?.Chiet_khau ?? 0) || 0
  const d = calcDiscount(giaBan, qty, giamGia, chietKhau)
  const thanhTien = Number(raw?.Thanh_tien) || giaBan * qty
  const hasExplicitNccType = raw?.Ncc_loai_giam !== undefined || raw?.nccLoaiGiam !== undefined
  const hasExplicitNccVal = raw?.Ncc_gia_tri_giam !== undefined || raw?.nccGiaTriGiam !== undefined
  const nccLoaiGiam = normalizeNccDiscountType(
    hasExplicitNccType ? (raw?.Ncc_loai_giam ?? raw?.nccLoaiGiam) : prod?.Ncc_loai_giam,
  )
  const nccGiaTriGiam = normalizeNccDiscountValue(
    hasExplicitNccVal ? (raw?.Ncc_gia_tri_giam ?? raw?.nccGiaTriGiam) : prod?.Ncc_gia_tri_giam,
  )
  const loiNhuan =
    raw?.Loi_nhuan !== undefined
      ? Number(raw.Loi_nhuan)
      : calcOrderLineProfit({
          giaBan,
          giaGoc,
          soLuong: qty,
          giamGia,
          ck1sp: d.ck1sp,
          nccLoaiGiam,
          nccGiaTriGiam,
        })
  const currency = raw?.Don_vi_tien_te || 'P'
  return {
    lineId: raw?.lineId || '',
    Ma_hoa_don: maHD,
    So_hoa_don: soHD,
    Ngay_tao_duong_lich: ngayTaoStr || formatDateTimeVN(),
    Ma_hang: raw?.Ma_hang || '',
    Ten_hang: raw?.Ten_hang || '',
    Trang_thai: raw?.Trang_thai || 'Còn hàng',
    Danh_muc: raw?.Danh_muc || '',
    Size: raw?.Size || '',
    Dvt: raw?.Dvt || '',
    ...(raw?.Dvt_custom ? { Dvt_custom: true } : {}),
    Don_vi_tien_te: currency,
    donViTienTe: currency,
    So_luong: qty,
    Gia_goc: giaGoc,
    Gia_ban: giaBan,
    Giam_gia: giamGia,
    Tien_chiet_khau: Number(raw?.Tien_chiet_khau ?? d.chietKhauTien) || 0,
    Ncc_loai_giam: nccLoaiGiam,
    Ncc_gia_tri_giam: nccGiaTriGiam,
    nccLoaiGiam,
    nccGiaTriGiam,
    Thanh_tien: thanhTien,
    Loi_nhuan: loiNhuan,
    Ghi_chu: raw?.Ghi_chu || '',
    ghiChuHang: raw?.Ghi_chu || '',
    Nguoi_dat: raw?.Nguoi_dat || '',
    Nguoi_dat_id: raw?.Nguoi_dat_id || '',
    Added_by_role: raw?.Added_by_role || '',
    soLuong: qty,
    giaGoc,
    giaBan,
    chietKhau,
    giamGia,
    thanhTien,
    loiNhuan,
    tongGiamGiaTien: d.giamGiaTien,
    tongChietKhauTien: Number(raw?.Tien_chiet_khau ?? d.chietKhauTien) || 0,
    tongGiamTru: d.tongGiamTru,
    tongGiamGiaDong: d.tongGiamTru,
    maHang: raw?.Ma_hang || '',
    tenHang: raw?.Ten_hang || '',
    size: raw?.Size || '',
    dvt: raw?.Dvt || '',
    danhMuc: raw?.Danh_muc || '',
    trangThai: raw?.Trang_thai || 'Còn hàng',
  }
}

function initTabsFromStorage() {
  let restoredTabs = []
  let restoredActiveId = ''
  try {
    const raw = localStorage.getItem(INVOICE_TABS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed?.tabs) && parsed.tabs.length > 0) {
        restoredTabs = parsed.tabs
        restoredActiveId = String(parsed.activeId || '')
      }
    }
  } catch {}

  if (restoredTabs.length > 0) {
    invoiceTabs.value = restoredTabs
    const found =
      restoredTabs.find((t) => t.id === restoredActiveId) || restoredTabs[0]
    applyTabToEditor(found)
  } else {
    const initialTab = createBlankTabSnapshot()
    invoiceTabs.value = [initialTab]
    applyTabToEditor(initialTab)
  }
}

let isImportingOrderQuery = false
async function importOrderIdsIntoTabs(targetIds = [], { replaceRoute = false } = {}) {
  const cleanIds = [...new Set((targetIds || []).map((id) => String(id || '').trim()).filter(Boolean))]
  if (!cleanIds.length || isImportingOrderQuery) return false

  isImportingOrderQuery = true
  try {
    syncActiveTabSnapshot()
    let lastActivatedId = ''
    let importedCount = 0

    for (const orderId of cleanIds) {
      const existingTab = invoiceTabs.value.find(
        (t) => t.sourceOrderId === orderId || t.maHoaDon === orderId,
      )
      if (existingTab) {
        lastActivatedId = existingTab.id
        continue
      }

      const res = await getOrderForInvoice(orderId)
      if (!res?.success || !res.order) {
        toast('warn', `Không tải được đơn #${orderId}`)
        continue
      }

      const ord = res.order
      const delivery = parseDeliveryToInputs(ord.Thoi_gian_nhan_hang)
      const maHD = ord.Ma_hoa_don || orderId
      const soHD = ord.So_hoa_don || genSoHoaDon()
      const nowStr = formatDateTimeVN()
      const mappedItems = (res.items || []).map((it) =>
        mapServerOrderItemToPosRow(it, maHD, soHD, nowStr),
      )

      const itemGiamGiaSum = mappedItems.reduce((s, it) => s + (it.tongGiamGiaTien || 0), 0)
      const globalMoneyDiscount = Math.max(0, Number(ord.Tong_giam_gia || 0) - itemGiamGiaSum)

      const customerObj = {
        maKhachHang: ord.Ma_khach_hang || '',
        tenKhachHang: ord.Ten_khach_hang || '',
        soDienThoai: ord.So_dien_thoai || '',
        diaChi: ord.Dia_chi || '',
        ghiChu: '',
        ghiChuDonHang: String(ord.Ghi_chu || '')
          .replace(/\s*\[KM ĐẠT ĐƯỢC:[^\]]*\]/gi, '')
          .trim(),
        isExistingCustomer: Boolean(ord.Ma_khach_hang),
      }
      const initialPay =
        ord.Hinh_thuc_thanh_toan === 'CHUYEN_KHOAN' ? 'CHUYEN_KHOAN' : 'TIEN_MAT'
      const initialShipFee = Math.max(0, Number(ord.Phi_ship || 0))
      const initialSyncedDigest = computeOrderSyncFingerprint({
        items: mappedItems,
        customer: customerObj,
        ngayNhanHang: delivery.ngayNhanHang,
        gioNhanHang: delivery.gioNhanHang,
        phutNhanHang: delivery.phutNhanHang,
        hinhThucThanhToan: initialPay,
        globalGiamGia: globalMoneyDiscount,
        globalChietKhauPercent: 0,
        phiShip: initialShipFee,
      })

      const tabData = createBlankTabSnapshot({
        sourceOrderId: maHD,
        sourceOrderStatus: ord.Trang_thai || 'Chờ duyệt',
        syncedDigest: initialSyncedDigest,
        lastWebSubmittedAt: Number(ord.Submitted_at || 0),
        maHoaDon: maHD,
        soHoaDon: soHD,
        orderCreatedAt: String(ord.Ngay_tao_duong_lich || '').trim(),
        ngayNhanHang: delivery.ngayNhanHang,
        gioNhanHang: delivery.gioNhanHang,
        phutNhanHang: delivery.phutNhanHang,
        thoiGianNhanHang: delivery.thoiGianNhanHang,
        hinhThucThanhToan: initialPay,
        orderTableViewMode: detectHasMultipleOrderMembers(mappedItems) ? 'by_member' : 'grouped',
        globalGiamGia: globalMoneyDiscount,
        globalChietKhauPercent: 0,
        phiShip: initialShipFee,
        items: mappedItems,
        customer: customerObj,
      })

      const currentTab = invoiceTabs.value.find((t) => t.id === activeInvoiceTabId.value)
      if (importedCount === 0 && isTabUntouchedDraft(currentTab)) {
        const currentIdx = invoiceTabs.value.findIndex((t) => t.id === currentTab.id)
        tabData.id = currentTab.id
        invoiceTabs.value[currentIdx] = tabData
      } else {
        invoiceTabs.value.push(tabData)
      }
      lastActivatedId = tabData.id
      importedCount += 1
    }

    if (lastActivatedId) {
      if (tabSourceFilter.value === 'admin') {
        tabSourceFilter.value = 'all'
      }
      const targetTab = invoiceTabs.value.find((t) => t.id === lastActivatedId)
      if (targetTab) applyTabToEditor(targetTab)
      if (isMobile.value) {
        activeMobileTab.value = 'order'
      }
      if (importedCount > 0) {
        toast(
          'success',
          importedCount === 1
            ? `Đã nạp đơn #${cleanIds[cleanIds.length - 1]} vào tab hóa đơn`
            : `Đã mở ${importedCount} tab đơn hàng`,
        )
      }
    }

    if (replaceRoute) {
      await router.replace({ name: 'nhap-hoa-don' })
    }
    return true
  } catch (err) {
    console.error('importOrderIdsIntoTabs failed:', err)
    toast('error', 'Không thể mở đơn hàng sang Nhập hóa đơn')
    return false
  } finally {
    isImportingOrderQuery = false
  }
}

async function openApprovedOrdersFromQuery() {
  const focusOrderId = String(route.query?.focusOrderId || '').trim()
  if (focusOrderId) {
    const existingTab = invoiceTabs.value.find(
      (t) =>
        String(t?.sourceOrderId || '').trim() === focusOrderId ||
        String(t?.maHoaDon || '').trim() === focusOrderId,
    )
    if (existingTab) {
      navigateToUpdatedOrderTab(existingTab.id)
      await router.replace({ name: 'nhap-hoa-don' })
      return
    }
    await importOrderIdsIntoTabs([focusOrderId], { replaceRoute: true })
    return
  }

  const singleId = String(route.query?.orderId || '').trim()
  const multiIds = String(route.query?.orderIds || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const targetIds = [...new Set([...(singleId ? [singleId] : []), ...multiIds])]
  if (!targetIds.length) return
  await importOrderIdsIntoTabs(targetIds, { replaceRoute: true })
}

async function importPendingOrderToTable(orderId) {
  const cleanId = String(orderId || '').trim()
  if (!cleanId) return
  importingPendingOrderId.value = cleanId
  try {
    const ok = await importOrderIdsIntoTabs([cleanId], { replaceRoute: false })
    if (ok) {
      showPendingOrdersModal.value = false
    }
  } finally {
    importingPendingOrderId.value = ''
  }
}

function removeToast(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx === -1) return
  const [toastItem] = toasts.value.splice(idx, 1)
  if (toastItem?.timerId) clearTimeout(toastItem.timerId)
}

function toast(type, message, timeout = 2500) {
  const id = Date.now() + Math.random()
  const toastItem = {
    id,
    type,
    message,
    timeout,
    createdAt: Date.now(),
  }
  toastItem.timerId = setTimeout(() => removeToast(id), timeout)
  toasts.value.unshift(toastItem)
  if (toasts.value.length > 4) {
    const removed = toasts.value.pop()
    if (removed?.timerId) clearTimeout(removed.timerId)
  }
}

if (typeof window !== 'undefined') {
  window.toast = toast
}

function openSuccessModal(message) {
  successMessage.value = message
  showSuccessModal.value = true
}

async function confirmSuccessReload() {
  showSuccessModal.value = false
  if (activeInvoiceTabId.value) {
    closeInvoiceTab(activeInvoiceTabId.value)
  }
  try {
    const res = await getOneSheet('don_hang')
    if (Array.isArray(res?.data)) {
      donHangList.value = res.data
    }
  } catch {}
}

watch(
  () => [route.query?.orderId, route.query?.orderIds, route.query?.focusOrderId],
  ([orderId, orderIds, focusOrderId]) => {
    if (orderId || orderIds || focusOrderId) {
      openApprovedOrdersFromQuery()
    }
  },
)

onActivated(() => {
  if (route.query?.orderId || route.query?.orderIds || route.query?.focusOrderId) {
    openApprovedOrdersFromQuery()
  }
})

watch(
  donHangList,
  () => {
    syncTabsStatusFromDonHang()
  },
  { deep: true },
)

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', handleGlobalSearchShortcut)
  document.addEventListener('click', handleDocClickForColSettings)

  isLoadingProducts.value = true
  isLoadingCustomer.value = true // Start loading customer data
  initTabsFromStorage()

  try {
    const json = await getSheets([
      'khach_hang',
      'hang_hoa',
      'don_hang',
      'khuyenmai_info',
      'so_thu_chi',
      'thong_tin_chuyen_khoan',
      'logo',
      'shop_contact',
      'time',
      'display_config',
    ])

    khachHangList.value = json.data.khach_hang || []
    hangHoaList.value = json.data.hang_hoa || []
    donHangList.value = json.data.don_hang || []
    displayConfig.value = normalizeDisplayConfig(json.data.display_config || [])
    hasLoadedDonHang.value = true
    syncTabsStatusFromDonHang()
    khuyenMaiList.value = json.data.khuyenmai_info || []
    soThuChiList.value = json.data.so_thu_chi || []
    thongTinChuyenKhoanList.value = json.data.thong_tin_chuyen_khoan || []

    const firstCK =
      thongTinChuyenKhoanList.value.find(
        (r) => r?.Show_in_invoice === true || r?.Show_in_invoice === 'YES',
      ) || thongTinChuyenKhoanList.value[0]
    if (firstCK) {
      tiGia.value = Number(firstCK.Ti_gia || 1)
      donViTienTeCK.value = firstCK.Don_vi_tien_te || 'VND'
    }

    // Nếu tab khởi tạo chưa có đơn nào và chưa có số hóa đơn theo donHangList mới nhất -> cập nhật số hóa đơn sạch
    const activeTab = invoiceTabs.value.find((t) => t.id === activeInvoiceTabId.value)
    if (activeTab && !activeTab.sourceOrderId && (!activeTab.items || activeTab.items.length === 0)) {
      soHoaDon.value = genSoHoaDon()
      syncActiveTabSnapshot()
    }

    logoInfo.value = (json.data.logo || [])[0] || null
    shopContactList.value = json.data.shop_contact || []

    // Time Data
    const timeData = (json.data.time || [])[0] || null
    thoiGianHoatDongShop.value = timeData?.thoi_gian_hoat_dong_shop || ''

    // Init Product Qty & UI Maps immediately (no blocking image downloads)
    for (const product of hangHoaList.value) {
      productQty[product.Ma_hang] = 1
      productNotes[product.Ma_hang] = ''
      notePopoverOpen[product.Ma_hang] = false
      cardHighlight[product.Ma_hang] = false
    }

    await openApprovedOrdersFromQuery()

    unsubDonHangRealtime = subscribeSheet('don_hang', (rows) => {
      donHangList.value = rows || []
      hasLoadedDonHang.value = true
      syncTabsStatusFromDonHang()
      checkNewPendingOrdersNotification()
    })
    unsubLiveOrdersRealtime = subscribeAllLiveOrders((liveMap) => {
      liveOrdersById.value = liveMap || {}
      syncTabsFromLiveOrders(liveMap)
      checkNewPendingOrdersNotification()
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    toast('error', 'Lỗi tải dữ liệu')
  } finally {
    isLoadingProducts.value = false
    isLoadingCustomer.value = false
  }

  // Tải ngầm base64 cho riêng 5 ảnh xuất bill (Logo, Contact icons, QR) — không chặn giao diện
  warmBillAssetsBase64()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleGlobalSearchShortcut)
  document.removeEventListener('click', handleDocClickForColSettings)
  stopPcColResize()
  stopOrderColResize()
  if (typeof unsubDonHangRealtime === 'function') {
    unsubDonHangRealtime()
    unsubDonHangRealtime = null
  }
  if (pendingBellPulseTimer) {
    clearTimeout(pendingBellPulseTimer)
    pendingBellPulseTimer = null
  }
  if (customerSuggestBlurTimer) {
    clearTimeout(customerSuggestBlurTimer)
    customerSuggestBlurTimer = null
  }
  if (typeof unsubLiveOrdersRealtime === 'function') {
    unsubLiveOrdersRealtime()
    unsubLiveOrdersRealtime = null
  }
  for (const key of Object.keys(boardAddedTimers)) {
    clearTimeout(boardAddedTimers[key])
    delete boardAddedTimers[key]
  }
})

function warmBillAssetsBase64() {
  const tasks = []

  if (logoInfo.value?.URL) {
    tasks.push(
      imageToBase64(logoInfo.value.URL)
        .then((b64) => {
          if (logoInfo.value) logoInfo.value.base64 = b64
        })
        .catch(() => {
          if (logoInfo.value) logoInfo.value.base64 = null
        }),
    )
  }

  for (const contact of shopContactList.value) {
    if (contact.URL_img) {
      tasks.push(
        imageToBase64(contact.URL_img)
          .then((b64) => {
            contact.URL_img_base64 = b64
          })
          .catch(() => {
            contact.URL_img_base64 = null
          }),
      )
    }
  }

  for (const r of thongTinChuyenKhoanList.value) {
    if (r.QR_IMG) {
      tasks.push(
        imageToBase64(r.QR_IMG)
          .then((b64) => {
            r.QR_IMG_base64 = b64
          })
          .catch(() => {
            r.QR_IMG_base64 = null
          }),
      )
    }
  }

  Promise.allSettled(tasks)
}

async function imageToBase64(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    const blob = await res.blob()

    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } finally {
    clearTimeout(timer)
  }
}



function genSoHoaDon() {
  const candidates = [
    ...donHangList.value.map((d) => d?.So_hoa_don),
    ...invoiceTabs.value.map((t) => t?.soHoaDon),
  ]
  if (!candidates.length) return 'OD-0001'

  const nums = candidates.map((s) => {
    if (!s) return 0
    const num = parseInt(String(s).replace('OD-', ''), 10)
    return isNaN(num) ? 0 : num
  })
  const max = Math.max(0, ...nums)

  return 'OD-' + String(max + 1).padStart(4, '0')
}

/* ================= GEN MÃ KHÁCH HÀNG ================= */
function genMaKhachHang(ten, sdt, diaChi) {
  const t = ten ? String(ten).toLowerCase().replace(/\s+/g, '') : ''
  const s = sdt ? String(sdt).replace(/\D/g, '') : ''
  const d = diaChi ? String(diaChi).toLowerCase().replace(/\s+/g, '') : ''
  
  const partTen = t || 'ten'
  const partSdt = s || 'sdt'
  const partDc = d || 'dc'
  
  return `${partTen}_${partSdt}_${partDc}`
}

function isOutOfStock(product) {
  return String(product?.Trang_thai || '').trim() === 'Hết hàng'
}

const isManualOutOfStock = computed(() => {
  if (!form.maHang) return false
  const hang = hangHoaList.value.find(h => h.Ma_hang === form.maHang)
  return hang ? isOutOfStock(hang) : false
})

const stockColorClass = computed(() => {
  return isManualOutOfStock.value ? 'text-danger' : 'text-success'
})

const isEditModalOutOfStock = computed(() => {
  if (!editItem.maHang) return false
  const hang = hangHoaList.value.find(h => h.Ma_hang === editItem.maHang)
  return hang ? isOutOfStock(hang) : false
})

/* ================= FORM ================= */
const form = reactive({
  maKhachHang: '',
  tenKhachHang: '',
  soDienThoai: '',
  diaChi: '',
  ghiChu: '',
  ghiChuDonHang: '',
  maHang: '',
  tenHang: '',
  danhMuc: '',
  size: '',
  dvt: '',
  donViTienTe: 'P',
  giaGoc: 0,
  chietKhau: 0,
  giamGia: 0,
  nccLoaiGiam: 'percent',
  nccGiaTriGiam: 0,
  giaBan: 0,
  soLuong: 1,
  trangThai: '',
  ghiChuHang: '',
})

/* ================= TỈ GIÁ & CHUYỂN KHOẢN (AUTO) ================= */
const ckInfoList = computed(() => {
  const list = thongTinChuyenKhoanList.value || []
  if (!list.length) return []
  const hasExplicitFlag = list.some(
    (r) =>
      r &&
      r.Show_in_invoice !== undefined &&
      r.Show_in_invoice !== null &&
      r.Show_in_invoice !== '',
  )
  if (!hasExplicitFlag) {
    // Dữ liệu cũ chưa cấu hình cờ -> chỉ hiện 1 QR đầu tiên để không vỡ layout hóa đơn ảnh
    return list.slice(0, 1)
  }
  return list
    .filter((r) => r?.Show_in_invoice === true || r?.Show_in_invoice === 'YES')
    .slice(0, 1)
})

const tongChuyenKhoan = computed(() => {
  const rate = Number(tiGia.value || 1)
  return tongCong.value * rate
})

/* ================= RESET ================= */
function xoaKhachHang() {
  // Removed confirm as requested
  
  isExistingCustomer = false
  form.maKhachHang = ''
  form.tenKhachHang = ''
  form.soDienThoai = ''
  form.diaChi = ''
  form.ghiChu = ''
  form.ghiChuDonHang = ''
}

/* ================= AUTO UPDATE MÃ KHÁCH HÀNG (CHỈ KHI KHÁCH MỚI) ================= */
let isExistingCustomer = false

watch(
  () => [form.tenKhachHang, form.soDienThoai, form.diaChi],
  () => {
    if (isSwitchingTab) return
    if (!isExistingCustomer) {
      form.maKhachHang = genMaKhachHang(
        form.tenKhachHang,
        form.soDienThoai,
        form.diaChi
      )
    }
  },
  { deep: true }
)

function xoaHang() {
  if (!confirm('Xóa toàn bộ thông tin hàng đang nhập?')) return
  
  form.maHang = ''
  form.tenHang = ''
  form.danhMuc = ''
  form.size = ''
  form.dvt = ''
  form.giaGoc = 0
  form.chietKhau = 0
  form.giamGia = 0
  form.nccLoaiGiam = 'percent'
  form.nccGiaTriGiam = 0
  form.giaBan = 0
  form.soLuong = 1
  form.trangThai = ''
  form.ghiChuHang = ''
}

/* ================= SMART CUSTOMER AUTOCOMPLETE (TÊN / SĐT / ĐỊA CHỈ / GHI CHÚ) ================= */
let lastCheckedName = ''
const showCustomerSuggest = ref(false)
let customerSuggestBlurTimer = null

const filteredCustomerSuggestions = computed(() => {
  const q = String(form.tenKhachHang || '').trim()
  const list = khachHangList.value || []
  if (!list.length) return []
  if (!q) return list.slice(0, 8)

  const qNorm = normalizeSearchText(q)
  const matched = list.filter((kh) =>
    matchesMultiTokenRecord(q, {
      texts: [kh.Ten_khach_hang, kh.Dia_chi, kh.Ghi_chu, kh.Ma_khach_hang],
      phones: [kh.So_dien_thoai],
      handles: [kh.Ten_khach_hang, kh.So_dien_thoai],
    }),
  )

  // Prioritize exact/startsWith name matches
  matched.sort((a, b) => {
    const aName = normalizeSearchText(a.Ten_khach_hang)
    const bName = normalizeSearchText(b.Ten_khach_hang)
    const aRank = aName === qNorm ? 3 : aName.startsWith(qNorm) ? 2 : 1
    const bRank = bName === qNorm ? 3 : bName.startsWith(qNorm) ? 2 : 1
    return bRank - aRank
  })

  return matched.slice(0, 10)
})

function selectCustomerSuggestion(kh) {
  if (!kh) return
  if (customerSuggestBlurTimer) {
    clearTimeout(customerSuggestBlurTimer)
    customerSuggestBlurTimer = null
  }
  isExistingCustomer = true
  form.tenKhachHang = kh.Ten_khach_hang || ''
  form.soDienThoai = kh.So_dien_thoai || ''
  form.diaChi = kh.Dia_chi || ''
  form.ghiChu = kh.Ghi_chu || ''
  form.maKhachHang = kh.Ma_khach_hang || ''
  lastCheckedName = form.tenKhachHang.trim()
  showCustomerSuggest.value = false
}

function closeCustomerSuggestDelayed() {
  if (customerSuggestBlurTimer) clearTimeout(customerSuggestBlurTimer)
  customerSuggestBlurTimer = setTimeout(() => {
    showCustomerSuggest.value = false
  }, 160)
}

function handleTenKhachChange(event) {
  showCustomerSuggest.value = true
  const inputName = event.target.value.trim()
  if (inputName === lastCheckedName) return
  lastCheckedName = inputName

  const inputNorm = normalizeSearchText(inputName)
  const inputHandle = normalizeTelegramHandle(inputName)
  const inputPhoneDigits = getPhoneDigitVariants(inputName)

  const kh =
    khachHangList.value.find((k) => String(k.Ten_khach_hang || '').trim() === inputName) ||
    (inputNorm
      ? khachHangList.value.find((k) => normalizeSearchText(k.Ten_khach_hang) === inputNorm)
      : null) ||
    (inputHandle && inputName.startsWith('@')
      ? khachHangList.value.find(
          (k) =>
            normalizeTelegramHandle(k.Ten_khach_hang) === inputHandle ||
            normalizeTelegramHandle(k.So_dien_thoai) === inputHandle,
        )
      : null) ||
    (inputPhoneDigits.length && /^\+?[\d\s\-()]{8,}$/.test(inputName)
      ? khachHangList.value.find((k) => {
          const kv = getPhoneDigitVariants(k.So_dien_thoai)
          return kv.some((v) => inputPhoneDigits.includes(v))
        })
      : null)

  if (kh) {
    isExistingCustomer = true
    form.soDienThoai = kh.So_dien_thoai
    form.diaChi = kh.Dia_chi
    form.ghiChu = kh.Ghi_chu
    form.maKhachHang = kh.Ma_khach_hang
  } else {
    isExistingCustomer = false
  }
}

/* ================= AUTO FILL HÀNG ================= */
watch(
  () => form.tenHang,
  () => {
    const targetKey = normalizeProductNameKey(form.tenHang)
    const h = targetKey
      ? localizedHangHoaList.value.find(
          (x) => normalizeProductNameKey(x.Ten_hang) === targetKey,
        ) ||
        hangHoaList.value.find(
          (x) => normalizeProductNameKey(x.Ten_hang) === targetKey,
        )
      : null

    if (!h) {
      if (form.maHang) {
        const currentLinked = hangHoaList.value.find(
          (x) => String(x?.Ma_hang || '').trim() === String(form.maHang).trim(),
        )
        const linkedLocalized = localizedHangHoaList.value.find(
          (x) => String(x?.Ma_hang || '').trim() === String(form.maHang).trim(),
        )
        const linkedNames = [
          currentLinked?.Ten_hang,
          linkedLocalized?.Ten_hang,
        ].map(normalizeProductNameKey)
        if (!linkedNames.includes(targetKey)) {
          form.maHang = ''
        }
      }
      return
    }

    form.maHang = h.Ma_hang
    form.danhMuc = h.Danh_muc
    form.size = h.Size
    form.dvt = h.Dvt
    form.giaGoc = Number(h.Gia_goc) || 0
    form.nccLoaiGiam = normalizeNccDiscountType(h.Ncc_loai_giam)
    form.nccGiaTriGiam = normalizeNccDiscountValue(h.Ncc_gia_tri_giam)
    
    if (h.Gia_Giam && Number(h.Gia_Giam) > 0) {
      form.giaBan = Number(h.Gia_Giam)
    } else {
      form.giaBan = Number(h.Gia_ban) || 0
    }
    
    form.trangThai = h.Trang_thai
    form.donViTienTe = h.Don_vi_tien_te || 'P'
  }
)

/* ================= TRẠNG THÁI ================= */
const trangThaiList = computed(() => {
  return [
    ...new Set(hangHoaList.value.map((h) => h.Trang_thai).filter(Boolean)),
  ]
})

/* ================= ITEMS ================= */
const items = ref([])
const highlightedIndex = ref(-1)

function setOrderTableViewMode(mode) {
  orderTableViewMode.value = mode === 'by_member' ? 'by_member' : 'grouped'
}

function getOrderPrimaryMemberHint(list = items.value) {
  const formName = String(form.tenKhachHang || '').trim()
  const nonAdminItems = (Array.isArray(list) ? list : []).filter(
    (it) => it && it.Added_by_role !== 'admin' && it.Nguoi_dat !== 'Quán thêm',
  )
  const hostItem =
    nonAdminItems.find((it) => it.Added_by_role === 'host') ||
    nonAdminItems.find(
      (it) => formName && String(it.Nguoi_dat || '').trim().toLowerCase() === formName.toLowerCase(),
    ) ||
    nonAdminItems[0]

  const primaryId = String(hostItem?.Nguoi_dat_id || '').trim()
  const primaryName =
    String(hostItem?.Nguoi_dat || '').trim() ||
    formName ||
    (detectHasMultipleOrderMembers(list) ? 'Trưởng nhóm' : 'Khách lẻ')
  const primaryKey = primaryId ? `m:${primaryId}` : `name:${primaryName.toLowerCase()}`

  return {
    primaryId,
    primaryName,
    primaryKey,
    formName,
  }
}

function resolveMemberGroupKeyForItem(item, hint = getOrderPrimaryMemberHint()) {
  if (item?.Added_by_role === 'admin' || item?.Nguoi_dat === 'Quán thêm') {
    return '__admin__'
  }
  const mId = String(item?.Nguoi_dat_id || '').trim()
  if (mId) return `m:${mId}`

  const rawName = String(item?.Nguoi_dat || '').trim()
  if (!rawName || rawName.toLowerCase() === hint.primaryName.toLowerCase()) {
    return hint.primaryKey
  }
  return `name:${rawName.toLowerCase()}`
}

const invoiceMemberGroups = computed(() => {
  const hint = getOrderPrimaryMemberHint(items.value)
  const groupsMap = new Map()
  const customKeysSet = new Set(
    (customOrderMembers.value || []).map((cm) => String(cm?.groupKey || '').trim()).filter(Boolean),
  )

  items.value.forEach((item, idx) => {
    const qty = Number(item?.soLuong ?? item?.So_luong ?? 0)
    const net = Number(item?.thanhTien || 0) - Number(item?.tongGiamTru || 0)

    if (item?.Added_by_role === 'admin' || item?.Nguoi_dat === 'Quán thêm') {
      const adminKey = '__admin__'
      if (!groupsMap.has(adminKey)) {
        groupsMap.set(adminKey, {
          groupKey: adminKey,
          memberId: 'admin',
          name: 'Quán thêm / Phụ phí',
          role: 'admin',
          badge: 'Quán thêm',
          isCustom: false,
          totalQty: 0,
          subtotal: 0,
          entries: [],
        })
      }
      const grp = groupsMap.get(adminKey)
      grp.entries.push({ item, idx })
      grp.totalQty += qty
      grp.subtotal += net
      return
    }

    const mId = String(item?.Nguoi_dat_id || '').trim()
    const rawName = String(item?.Nguoi_dat || '').trim()
    const gKey = resolveMemberGroupKeyForItem(item, hint)

    if (!groupsMap.has(gKey)) {
      const isHostLine =
        gKey === hint.primaryKey ||
        item?.Added_by_role === 'host'
      const role = isHostLine ? 'host' : 'guest'
      groupsMap.set(gKey, {
        groupKey: gKey,
        memberId: mId || (isHostLine ? hint.primaryId : ''),
        name: rawName || (isHostLine ? hint.primaryName : 'Thành viên'),
        role,
        badge: '',
        isCustom: customKeysSet.has(gKey),
        totalQty: 0,
        subtotal: 0,
        entries: [],
      })
    }

    const grp = groupsMap.get(gKey)
    if (!grp.memberId && mId) grp.memberId = mId
    if ((!grp.name || grp.name === 'Thành viên') && rawName) {
      grp.name = rawName
    }
    grp.entries.push({ item, idx })
    grp.totalQty += qty
    grp.subtotal += net
  })

  for (const cm of customOrderMembers.value || []) {
    const cmName = String(cm?.name || '').trim()
    if (!cmName) continue
    const cmId = String(cm?.memberId || '').trim()
    const cmKey = String(cm?.groupKey || (cmId ? `m:${cmId}` : `name:${cmName.toLowerCase()}`)).trim()
    const existingByKey = groupsMap.get(cmKey)
    if (existingByKey) {
      existingByKey.isCustom = true
      continue
    }
    if (!cmId) {
      const existingByName = Array.from(groupsMap.values()).find(
        (g) =>
          g.role !== 'admin' &&
          !g.memberId &&
          String(g.name || '').trim().toLowerCase() === cmName.toLowerCase(),
      )
      if (existingByName) {
        existingByName.isCustom = true
        continue
      }
    }
    groupsMap.set(cmKey, {
      groupKey: cmKey,
      memberId: cmId,
      name: cmName,
      role: cm?.role === 'host' ? 'host' : 'guest',
      badge: '',
      isCustom: true,
      totalQty: 0,
      subtotal: 0,
      entries: [],
    })
  }

  const hasMultiplePeople =
    detectHasMultipleOrderMembers(items.value) || groupsMap.size > 1
  for (const grp of groupsMap.values()) {
    if (grp.role === 'admin') {
      grp.badge = 'Quán thêm'
    } else if (hasMultiplePeople) {
      grp.badge = grp.role === 'host' ? 'Trưởng nhóm' : 'Thành viên'
    } else {
      grp.badge = ''
    }
  }

  const rank = { host: 0, guest: 1, admin: 2 }
  const sorted = Array.from(groupsMap.values()).sort(
    (a, b) => (rank[a.role] ?? 1) - (rank[b.role] ?? 1),
  )

  const nameTotals = new Map()
  for (const grp of sorted) {
    if (grp.role === 'admin') continue
    const lower = String(grp.name || '').trim().toLowerCase()
    if (lower) nameTotals.set(lower, (nameTotals.get(lower) || 0) + 1)
  }
  const nameSeen = new Map()
  for (const grp of sorted) {
    if (grp.role === 'admin') {
      grp.dupTag = ''
      continue
    }
    const lower = String(grp.name || '').trim().toLowerCase()
    if (lower && (nameTotals.get(lower) || 0) > 1) {
      const seq = (nameSeen.get(lower) || 0) + 1
      nameSeen.set(lower, seq)
      grp.dupTag = `#${seq}`
    } else {
      grp.dupTag = ''
    }
  }

  return sorted
})

const invoiceOrderMembers = computed(() => invoiceMemberGroups.value)
const showMemberTargetBar = computed(
  () => invoiceOrderMembers.value.length > 1 || customOrderMembers.value.length > 0,
)

const activeTargetMemberKey = computed(() => {
  const members = invoiceOrderMembers.value
  if (!members.length) return ''
  const matched = members.find((m) => m.groupKey === selectedTargetMemberKey.value)
  return matched ? matched.groupKey : members[0].groupKey
})

function selectTargetMember(groupKey, options = {}) {
  if (!groupKey) return
  selectedTargetMemberKey.value = groupKey
  if (options.goToEntry && isMobile.value) {
    setMobileTab('entry')
  }
}

function openAddMemberModal() {
  newMemberNameInput.value = ''
  editingMemberKey.value = ''
  editingMemberName.value = ''
  duplicateMemberQueue.value = []
  showAddMemberModal.value = true
  nextTick(() => {
    newMemberInputRef.value?.focus()
  })
}

function closeAddMemberModal() {
  showAddMemberModal.value = false
  editingMemberKey.value = ''
  editingMemberName.value = ''
  duplicateMemberQueue.value = []
}

function selectMemberFromModal(groupKey) {
  if (!groupKey) return
  orderTableViewMode.value = 'by_member'
  selectedTargetMemberKey.value = groupKey
  duplicateMemberQueue.value = []
  showAddMemberModal.value = false
  if (isMobile.value) {
    setMobileTab('entry')
  }
}

function findExistingMemberByName(rawName) {
  const lower = String(rawName || '').trim().toLowerCase()
  if (!lower) return null
  const inGroups = invoiceMemberGroups.value.find(
    (g) => g.role !== 'admin' && String(g.name || '').trim().toLowerCase() === lower,
  )
  if (inGroups) return inGroups
  const inCustom = customOrderMembers.value.find(
    (cm) => String(cm.name || '').trim().toLowerCase() === lower,
  )
  if (inCustom) {
    return {
      groupKey: inCustom.groupKey,
      name: inCustom.name,
      totalQty: 0,
      subtotal: 0,
    }
  }
  return null
}

function submitAddMembers(shouldSelectAndClose = false) {
  const rawList = String(newMemberNameInput.value || '')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (!rawList.length) {
    toast('error', 'Vui lòng nhập tên người đặt!')
    nextTick(() => newMemberInputRef.value?.focus())
    return
  }

  let addedCount = 0
  let lastKey = ''
  const addedNames = []
  const nextDuplicates = []

  for (const rawName of rawList) {
    const existing = findExistingMemberByName(rawName)
    if (existing) {
      nextDuplicates.push({
        rawName,
        existingMember: existing,
        shouldSelectAndClose,
      })
      continue
    }

    const cleanKey = `name:${rawName.toLowerCase()}`
    customOrderMembers.value.push({
      groupKey: cleanKey,
      name: rawName,
      role: 'guest',
      memberId: '',
    })
    lastKey = cleanKey
    addedCount += 1
    addedNames.push(rawName)
  }

  if (addedCount > 0) {
    orderTableViewMode.value = 'by_member'
    if (lastKey) {
      selectedTargetMemberKey.value = lastKey
    }
    toast(
      'success',
      addedCount === 1
        ? `Đã thêm người đặt "${addedNames[0]}"`
        : `Đã thêm ${addedCount} người đặt vào đơn`,
    )
  }

  if (nextDuplicates.length > 0) {
    duplicateMemberQueue.value = nextDuplicates
    newMemberNameInput.value = ''
    return
  }

  newMemberNameInput.value = ''
  if (shouldSelectAndClose) {
    showAddMemberModal.value = false
    if (isMobile.value) {
      setMobileTab('entry')
    }
  } else {
    nextTick(() => newMemberInputRef.value?.focus())
  }
}

function resolveDuplicateMemberPrompt(choice) {
  const current = duplicateMemberQueue.value.shift()
  if (!current) return

  if (choice === 'rename') {
    duplicateMemberQueue.value = []
    newMemberNameInput.value = current.rawName
    nextTick(() => {
      newMemberInputRef.value?.focus()
      newMemberInputRef.value?.select()
    })
    return
  }

  orderTableViewMode.value = 'by_member'

  if (choice === 'new') {
    const newId = genLocalMemberId()
    const newKey = `m:${newId}`
    customOrderMembers.value.push({
      groupKey: newKey,
      name: current.rawName,
      role: 'guest',
      memberId: newId,
    })
    selectedTargetMemberKey.value = newKey
    toast('success', `Đã thêm người mới "${current.rawName}" (tách riêng)`)
  } else if (choice === 'existing') {
    selectedTargetMemberKey.value = current.existingMember.groupKey
    toast('info', `Đã chọn "${current.existingMember.name}" có sẵn trong đơn`)
  }

  if (duplicateMemberQueue.value.length === 0) {
    if (current.shouldSelectAndClose) {
      showAddMemberModal.value = false
      if (isMobile.value) {
        setMobileTab('entry')
      }
    } else {
      nextTick(() => newMemberInputRef.value?.focus())
    }
  }
}

function removeCustomOrderMember(member) {
  if (!member) return
  if (member.entries && member.entries.length > 0) {
    toast('error', 'Người này đang có món trong đơn, hãy xóa hoặc chuyển món trước.')
    return
  }
  const idx = customOrderMembers.value.findIndex((cm) => {
    if (cm.groupKey === member.groupKey) return true
    if (!cm.memberId && !member.memberId) {
      return String(cm.name || '').trim().toLowerCase() === String(member.name || '').trim().toLowerCase()
    }
    return false
  })
  if (idx !== -1) {
    customOrderMembers.value.splice(idx, 1)
  }
  if (selectedTargetMemberKey.value === member.groupKey) {
    selectedTargetMemberKey.value = ''
  }
  if (editingMemberKey.value === member.groupKey) {
    editingMemberKey.value = ''
    editingMemberName.value = ''
  }
  toast('success', `Đã xóa "${member.name}" khỏi danh sách người đặt`)
}

function startRenameOrderMember(member) {
  if (!member || member.role === 'admin') return
  editingMemberKey.value = member.groupKey
  editingMemberName.value = member.name || ''
}

function cancelRenameOrderMember() {
  editingMemberKey.value = ''
  editingMemberName.value = ''
}

function saveRenameOrderMember(member) {
  if (!member) return
  const newName = String(editingMemberName.value || '').trim()
  if (!newName) {
    toast('error', 'Tên người đặt không được để trống!')
    return
  }
  if (newName === member.name) {
    cancelRenameOrderMember()
    return
  }
  const duplicate = invoiceMemberGroups.value.find(
    (g) =>
      g.groupKey !== member.groupKey &&
      String(g.name || '').trim().toLowerCase() === newName.toLowerCase(),
  )
  let nextMemberId = member.memberId || ''
  if (duplicate) {
    if (
      !confirm(
        `Đã có người tên "${duplicate.name}" trong đơn.\nNếu đây là người khác trùng tên, nhấn OK để vẫn đổi thành "${newName}" (vẫn tách riêng).`,
      )
    ) {
      return
    }
    if (!nextMemberId) {
      nextMemberId = genLocalMemberId()
    }
  }

  const hint = getOrderPrimaryMemberHint(items.value)
  const nextGroupKey = nextMemberId ? `m:${nextMemberId}` : `name:${newName.toLowerCase()}`

  for (const it of items.value) {
    if (resolveMemberGroupKeyForItem(it, hint) === member.groupKey) {
      it.Nguoi_dat = newName
      if ('nguoiDat' in it) it.nguoiDat = newName
      if (nextMemberId && !it.Nguoi_dat_id) {
        it.Nguoi_dat_id = nextMemberId
      }
    }
  }

  const customEntry = customOrderMembers.value.find(
    (cm) => cm.groupKey === member.groupKey,
  )
  if (customEntry) {
    customEntry.name = newName
    customEntry.groupKey = nextGroupKey
    if (nextMemberId) customEntry.memberId = nextMemberId
  }

  if (selectedTargetMemberKey.value === member.groupKey) {
    selectedTargetMemberKey.value = nextGroupKey
  }

  cancelRenameOrderMember()
  toast('success', `Đã đổi tên thành "${newName}"`)
}

function getTargetMemberPayload() {
  const members = invoiceOrderMembers.value
  if (members.length > 0) {
    const chosen =
      members.find((m) => m.groupKey === activeTargetMemberKey.value) || members[0]
    return {
      groupKey: chosen.groupKey,
      Nguoi_dat: chosen.role === 'admin' ? 'Quán thêm' : chosen.name,
      Nguoi_dat_id: chosen.memberId || '',
      Added_by_role: chosen.role || 'host',
    }
  }
  const primaryName = String(form.tenKhachHang || '').trim()
  return {
    groupKey: primaryName ? `name:${primaryName.toLowerCase()}` : '',
    Nguoi_dat: primaryName,
    Nguoi_dat_id: '',
    Added_by_role: 'host',
  }
}

function isSameItemOwner(item, target) {
  if (!item || !target) return true
  if (invoiceOrderMembers.value.length <= 1) return true
  const hint = getOrderPrimaryMemberHint(items.value)
  return resolveMemberGroupKeyForItem(item, hint) === target.groupKey
}

const hangHoaByMaMap = computed(() => {
  const map = new Map()
  for (const h of hangHoaList.value || []) {
    if (h?.Ma_hang) map.set(String(h.Ma_hang), h)
  }
  return map
})

function getOrderItemGiaGoc(item) {
  const rawGiaGoc = Number(item?.giaGoc ?? item?.Gia_goc ?? 0)
  if (rawGiaGoc > 0) return rawGiaGoc
  const rawCode = String(item?.maHang || item?.Ma_hang || '').trim()
  const prod = rawCode ? hangHoaByMaMap.value.get(rawCode) : null
  return Number(prod?.Gia_goc ?? 0)
}

function getOrderItemMeta(item) {
  const rawCode = String(item?.maHang || item?.Ma_hang || '').trim()
  const prod = rawCode ? hangHoaByMaMap.value.get(rawCode) : null
  const qty = Number(item?.soLuong ?? item?.So_luong ?? 0)
  const giaGoc = getOrderItemGiaGoc(item)
  const danhMuc = String(item?.danhMuc || item?.Danh_muc || prod?.Danh_muc || '').trim()
  const trangThai = String(prod?.Trang_thai || item?.trangThai || item?.Trang_thai || '').trim()
  const isOut = prod ? isOutOfStock(prod) : trangThai === 'Hết hàng'
  const isAdminRow = item?.Added_by_role === 'admin' || item?.Nguoi_dat === 'Quán thêm'
  const fallbackPrimary = String(form.tenKhachHang || '').trim() || 'Khách lẻ'
  const nguoiDat = isAdminRow
    ? 'Quán thêm'
    : String(item?.Nguoi_dat || '').trim() || fallbackPrimary
  return {
    maHang: rawCode || '—',
    danhMuc: danhMuc || '—',
    giaGoc,
    tongVon: giaGoc * qty,
    trangThai: trangThai || (isOut ? 'Hết hàng' : 'Còn hàng'),
    isOut,
    nguoiDat,
  }
}

const groupedOrderDisplayItems = computed(() => {
  const hasMultiplePeople = detectHasMultipleOrderMembers(items.value)
  const fallbackPrimary = String(form.tenKhachHang || '').trim() || 'Khách lẻ'
  const groups = new Map()

  items.value.forEach((item, idx) => {
    const rawCode = String(item?.maHang || item?.Ma_hang || '').trim()
    const codeKey = rawCode || item?.tenHang || ''
    const sizeKey = item?.size || item?.Size || ''
    const dvtKey = item?.dvt || item?.Dvt || ''
    const currency = item?.donViTienTe || item?.Don_vi_tien_te || 'P'
    const giaBan = Number(item?.giaBan ?? item?.Gia_ban ?? 0)
    const gKey = `${codeKey}__${sizeKey}__${dvtKey}__${currency}__${giaBan}`
    const meta = getOrderItemMeta(item)

    if (!groups.has(gKey)) {
      groups.set(gKey, {
        groupKey: gKey,
        maHang: rawCode || '—',
        tenHang: item?.tenHang || item?.Ten_hang || '',
        danhMuc: meta.danhMuc,
        trangThai: meta.trangThai,
        isOut: meta.isOut,
        size: sizeKey,
        dvt: dvtKey,
        donViTienTe: currency,
        giaBan,
        giaGoc: meta.giaGoc,
        tongVon: 0,
        totalQty: 0,
        thanhTien: 0,
        tongChietKhauTien: 0,
        tongGiamGiaTien: 0,
        tongGiamTru: 0,
        netTotal: 0,
        loiNhuan: 0,
        nccLoaiGiam: normalizeNccDiscountType(item?.Ncc_loai_giam ?? item?.nccLoaiGiam),
        nccGiaTriGiam: normalizeNccDiscountValue(item?.Ncc_gia_tri_giam ?? item?.nccGiaTriGiam),
        notesSet: new Set(),
        peopleSet: new Set(),
        entries: [],
      })
    }

    const grp = groups.get(gKey)
    const qty = Number(item?.soLuong ?? item?.So_luong ?? 0)
    const thanhTien = Number(item?.thanhTien ?? item?.Thanh_tien ?? 0)
    const tongCK = Number(item?.tongChietKhauTien ?? item?.Tien_chiet_khau ?? 0)
    const tongGiam = Number(item?.tongGiamGiaTien ?? 0)
    const tongTru = Number(item?.tongGiamTru ?? item?.tongGiamGiaDong ?? 0)
    const loiNhuan = Number(item?.loiNhuan ?? item?.Loi_nhuan ?? 0)

    grp.totalQty += qty
    grp.tongVon += meta.giaGoc * qty
    grp.thanhTien += thanhTien
    grp.tongChietKhauTien += tongCK
    grp.tongGiamGiaTien += tongGiam
    grp.tongGiamTru += tongTru
    grp.netTotal += thanhTien - tongTru
    grp.loiNhuan += loiNhuan

    const noteStr = String(item?.ghiChuHang || item?.Ghi_chu || '').trim()
    if (noteStr) grp.notesSet.add(noteStr)

    const isAdminRow = item?.Added_by_role === 'admin' || item?.Nguoi_dat === 'Quán thêm'
    const role = isAdminRow ? 'admin' : item?.Added_by_role || 'host'
    const personName = isAdminRow
      ? 'Quán thêm'
      : String(item?.Nguoi_dat || '').trim() || fallbackPrimary

    grp.peopleSet.add(`${personName} ×${qty}`)
    grp.entries.push({ item, idx, personName, role })
  })

  return Array.from(groups.values()).map((grp) => ({
    ...grp,
    giaGoc: grp.totalQty > 0 ? grp.tongVon / grp.totalQty : grp.giaGoc,
    combinedNotes: Array.from(grp.notesSet).join('; '),
    nguoiDatSummary: Array.from(grp.peopleSet).join(', '),
    showMemberBreakdown:
      hasMultiplePeople ||
      grp.entries.some((e) => Boolean(e.item?.Nguoi_dat || e.item?.Added_by_role)),
  }))
})

function recalcOrderItemProfit(row) {
  if (!row) return
  const qty = Math.max(1, Number(row.soLuong ?? row.So_luong ?? 1))
  const giaBan = Number(row.giaBan ?? row.Gia_ban ?? 0)
  const giaGoc = Number(row.giaGoc ?? row.Gia_goc ?? getOrderItemGiaGoc(row))
  const giamGia = Number(row.giamGia ?? row.Giam_gia ?? 0)
  const chietKhau = Number(row.chietKhau ?? row.Chiet_khau ?? 0)
  const d = calcDiscount(giaBan, qty, giamGia, chietKhau)
  const nccLoaiGiam = normalizeNccDiscountType(row.Ncc_loai_giam ?? row.nccLoaiGiam)
  const nccGiaTriGiam = normalizeNccDiscountValue(row.Ncc_gia_tri_giam ?? row.nccGiaTriGiam)

  const loiNhuan = calcOrderLineProfit({
    giaBan,
    giaGoc,
    soLuong: qty,
    giamGia,
    ck1sp: d.ck1sp,
    nccLoaiGiam,
    nccGiaTriGiam,
  })
  row.Ncc_loai_giam = nccLoaiGiam
  row.nccLoaiGiam = nccLoaiGiam
  row.Ncc_gia_tri_giam = nccGiaTriGiam
  row.nccGiaTriGiam = nccGiaTriGiam
  row.Loi_nhuan = loiNhuan
  row.loiNhuan = loiNhuan
}

function toggleRowNccType(targetRows = []) {
  const validRows = (targetRows || []).filter(Boolean)
  if (!validRows.length) return
  const curType = normalizeNccDiscountType(
    validRows[0].Ncc_loai_giam ?? validRows[0].nccLoaiGiam,
  )
  const nextType = curType === 'money' ? 'percent' : 'money'
  for (const row of validRows) {
    row.Ncc_loai_giam = nextType
    row.nccLoaiGiam = nextType
    recalcOrderItemProfit(row)
  }
}

function updateRowNccValue(targetRows = [], rawVal) {
  const validRows = (targetRows || []).filter(Boolean)
  if (!validRows.length) return
  const nextVal = normalizeNccDiscountValue(rawVal)
  for (const row of validRows) {
    row.Ncc_gia_tri_giam = nextVal
    row.nccGiaTriGiam = nextVal
    recalcOrderItemProfit(row)
  }
}

function deleteGroupedOrderItem(grp) {
  if (!grp || !Array.isArray(grp.entries) || !grp.entries.length) return
  if (grp.entries.length === 1) {
    deleteItem(grp.entries[0].idx)
    return
  }
  if (
    confirm(
      `Xóa toàn bộ ${grp.totalQty} phần "${grp.tenHang}" (gồm ${grp.entries.length} dòng) khỏi đơn?`,
    )
  ) {
    const indicesDesc = grp.entries.map((e) => e.idx).sort((a, b) => b - a)
    for (const idx of indicesDesc) {
      if (idx >= 0 && idx < items.value.length) {
        items.value.splice(idx, 1)
      }
    }
  }
}

function highlightRow(index) {
  if (index === -1) return
  highlightedIndex.value = index
  
  // Update scroll with nextTick
  nextTick(() => {
    const targetRow = document.querySelector('.order-table-wrap tr.row-highlight, .order-card.is-highlight')
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })

  // Clear highlight after animation
  setTimeout(() => {
    highlightedIndex.value = -1
  }, 1600)
}

/* ================= ĐƠN VỊ TIỀN TỆ CHUNG ================= */
const donViTienTeChung = computed(() => {
  if (!items.value.length) return 'VND'
  return items.value[0].donViTienTe || 'VND'
})

/* ================= KIỂM TRA SIZE/DVT CÓ GIÁ TRỊ ================= */
const hasAnySize = computed(() => {
  return items.value.some(i => i.size && i.size.trim())
})

const hasAnyDvt = computed(() => {
  return items.value.some(i => i.dvt && i.dvt.trim())
})

const totalItemQty = computed(() => {
  return items.value.reduce((sum, item) => sum + Number(item.soLuong || 0), 0)
})

const hasCustomerData = computed(() => {
  return form.tenKhachHang || form.soDienThoai || form.diaChi || form.ghiChu
})

const hasProductData = computed(() => {
  return !!(form.tenHang && form.tenHang.trim())
})

const uniqueSizes = computed(() => {
  const sizes = new Set()
  hangHoaList.value.forEach(h => {
    if (h.Size) sizes.add(h.Size)
  })
  return Array.from(sizes).sort()
})

const uniqueDvts = computed(() => {
  const s = new Set()
  hangHoaList.value.forEach(h => { if (h.Dvt) s.add(h.Dvt) })
  return Array.from(s).sort()
})

const uniqueDanhMucs = computed(() => {
  const s = new Set()
  hangHoaList.value.forEach(h => { if (h.Danh_muc) s.add(h.Danh_muc) })
  return Array.from(s).sort()
})

/* ================= CUSTOMER INFO COMPUTED ================= */
const selectedCustomer = computed(() => {
  if (form.maKhachHang) {
    return khachHangList.value.find(k => k.Ma_khach_hang === form.maKhachHang) || null
  }
  return khachHangList.value.find(k => k.Ten_khach_hang === form.tenKhachHang) || null
})

const customerDebt = computed(() => Number(selectedCustomer.value?.Cong_no_hien_tai || 0))
const customerTotalSpend = computed(() => Number(selectedCustomer.value?.Tong_chi_tieu || 0))
const customerProfit = computed(() => {
  const mkh = form.maKhachHang
  if (!mkh) return 0
  return soThuChiList.value
    .filter(tc => tc.Ma_khach_hang === mkh && tc.Trang_thai === 'BAN_HANG')
    .reduce((sum, tc) => sum + Number(tc.loi_nhuan || 0), 0)
})

const activeInvoiceMilestones = computed(() => {
  if (isExportCostMode.value) return []
  const lang = selectedLang.value || 'vi'
  return khuyenMaiList.value
    .filter(
      (k) =>
        k &&
        k.Loai_km === 'MILESTONE' &&
        k.Kich_hoat !== false &&
        Number(k.Moc_tien) > 0,
    )
    .slice()
    .sort((a, b) => Number(a.Moc_tien) - Number(b.Moc_tien))
    .map((m) => {
      const custom = resolveNoticeText(m, lang)
      const label = custom || (m.Kieu_uu_dai === 'GIFT' ? 'Quà tặng' : 'Freeship')
      return {
        threshold: Number(m.Moc_tien),
        label,
      }
    })
})

const khuyenMaiText = computed(() => {
  const orderTotal = Number(tongCong.value || 0)
  const unlocked = activeInvoiceMilestones.value
    .filter((m) => orderTotal >= m.threshold)
    .map((m) => m.label)
    .filter(Boolean)

  return [...new Set(unlocked)].join(' + ')
})

const nextMilestoneHintText = computed(() => {
  const orderTotal = Number(tongCong.value || 0)
  const next = activeInvoiceMilestones.value.find((m) => orderTotal < m.threshold)
  if (!next) return ''
  const remaining = Math.max(0, next.threshold - orderTotal)
  if (remaining <= 0) return ''
  return `Mua thêm ${formatWithCurrency(remaining, donViTienTeChung.value)} để được ${next.label}`
})

const hasActiveFilters = computed(() => {
  return !!(
    searchProduct.value ||
    (selectedLang.value && selectedLang.value.toLowerCase() !== 'vi') ||
    selectedCategory.value ||
    selectedSize.value ||
    onlyPromotion.value
  )
})

const productSearchInputRef = ref(null)

const parsedProductSearch = computed(() => parseQuickQtyQuery(searchProduct.value))

const productSearchMeta = computed(() => {
  let products = localizedHangHoaList.value

  // 1. Filter Category
  if (selectedCategory.value) {
    products = products.filter((p) => p.Danh_muc === selectedCategory.value)
  }

  // 2. Filter Promotion
  if (onlyPromotion.value) {
    products = products.filter((p) => Number(p.Gia_Giam || 0) > 0)
  }

  // 3. Filter Size
  if (selectedSize.value) {
    products = products.filter((p) => p.Size === selectedSize.value)
  }

  // 4. Filter Stock Status (Còn hàng / Hết hàng)
  if (selectedStockStatus.value !== 'all') {
    if (selectedStockStatus.value === 'in') {
      products = products.filter((p) => !isOutOfStock(p))
    } else if (selectedStockStatus.value === 'out') {
      products = products.filter((p) => isOutOfStock(p))
    }
  }

  // 5. Smart search + relevance ranking (accent-insensitive, multi-token, acronym, synonym, description, price, typo fallback)
  const cleanKw = parsedProductSearch.value.cleanQuery
  if (cleanKw) {
    return rankProductsWithMeta(products, cleanKw, {
      activeLang: selectedLang.value || 'vi',
      preferInStock: true,
      fuzzyFallback: true,
    })
  }

  return { items: products, usedFuzzy: false }
})

const allFilteredProducts = computed(() => productSearchMeta.value.items)

const globalProductSearchCount = computed(() => {
  const cleanKw = parsedProductSearch.value.cleanQuery
  if (!cleanKw) return 0
  const hasNonSearchFilter = Boolean(
    selectedCategory.value ||
      selectedSize.value ||
      onlyPromotion.value ||
      selectedStockStatus.value !== 'all',
  )
  if (!hasNonSearchFilter) return allFilteredProducts.value.length
  return rankProductsWithMeta(localizedHangHoaList.value, cleanKw, {
    activeLang: selectedLang.value || 'vi',
    preferInStock: true,
    fuzzyFallback: true,
  }).items.length
})

const filteredProducts = computed(() => {
  return allFilteredProducts.value
})

const catalogCartQtyByKey = computed(() => {
  const map = Object.create(null)
  const list = items.value || []
  if (!list.length) return map
  const target = getTargetMemberPayload()
  const multiMembers = invoiceOrderMembers.value.length > 1
  const hint = multiMembers ? getOrderPrimaryMemberHint(list) : null

  for (const it of list) {
    if (!it) continue
    if (multiMembers && resolveMemberGroupKeyForItem(it, hint) !== target.groupKey) continue
    const key = `${it.Ma_hang || it.maHang || ''}__${it.Size ?? it.size ?? ''}__${it.Dvt ?? it.dvt ?? ''}`
    map[key] = (map[key] || 0) + Number(it.So_luong || it.soLuong || 0)
  }
  return map
})

function getCatalogCartQty(product) {
  if (!product) return 0
  const key = `${product.Ma_hang || ''}__${product.Size || ''}__${product.Dvt || ''}`
  return catalogCartQtyByKey.value[key] || 0
}

const catalogBoardSections = computed(() => {
  const rawList = filteredProducts.value || []
  if (!rawList.length) return []

  const activeLocale = selectedLang.value || 'vi'
  const ordered = sortProductsByCategoryOrder(rawList, displayConfig.value, activeLocale)

  const sectionMap = new Map()
  for (const item of ordered) {
    const parentLabel = getEffectiveParentCategory(item, displayConfig.value, activeLocale)
    const subLabel = String(item?.Danh_muc || '').trim()
    const hasChild = Boolean(subLabel && subLabel !== parentLabel)
    const title = hasChild ? subLabel : parentLabel || subLabel || 'Khác'
    const parentTag = hasChild ? parentLabel : ''
    const key = `${parentLabel}::${subLabel}`

    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        key,
        title,
        parentTag,
        parentLabel: parentLabel || subLabel,
        subLabel: subLabel || '',
        items: [],
        thumbs: [],
      })
    }

    const sec = sectionMap.get(key)
    sec.items.push(item)
    if (sec.thumbs.length < 4) {
      const img = cardImg(item)
      const thumbUrl = img ? toOptimizedImageUrl(img, { width: 96, height: 96, crop: 'fill' }) : ''
      if (thumbUrl && !sec.thumbs.includes(thumbUrl)) {
        sec.thumbs.push(thumbUrl)
      }
    }
  }

  return Array.from(sectionMap.values())
})

function getBoardDiscountPercent(item) {
  const orig = Number(item?.Gia_ban || 0)
  const sale = Number(item?.Gia_Giam || 0)
  if (!orig || !sale || sale >= orig) return 0
  return Math.round(((orig - sale) / orig) * 100)
}

function getBoardProductBadge(item) {
  return resolveProductBadge(item?.Badge, selectedLang.value || 'vi')
}

function onBoardSectionHeaderClick(sec) {
  if (!sec?.subLabel) return
  if (selectedCategory.value === sec.subLabel) {
    selectedCategory.value = ''
  } else {
    selectedCategory.value = sec.subLabel
  }
  currentPage.value = 1
}

const boardAddedTimers = Object.create(null)

function quickAdjustBoardQty(product, delta) {
  if (!product) return
  if (delta > 0 && isOutOfStock(product)) {
    toast('error', 'Sản phẩm đang ở trạng thái HẾT HÀNG!')
    return
  }
  adjustMobileCartQty(product, delta)
  if (delta > 0) {
    const code = product.Ma_hang
    addedSuccess[code] = true
    if (boardAddedTimers[code]) {
      clearTimeout(boardAddedTimers[code])
    }
    boardAddedTimers[code] = setTimeout(() => {
      addedSuccess[code] = false
      delete boardAddedTimers[code]
    }, 650)
  }
}

function clearCatalogNonSearchFilters() {
  selectedCategory.value = ''
  selectedSize.value = ''
  onlyPromotion.value = false
  selectedStockStatus.value = 'all'
  currentPage.value = 1
}

function handleProductSearchEnter() {
  const kw = parsedProductSearch.value.cleanQuery
  if (!kw) return

  let candidates = filteredProducts.value
  if (!candidates.length && globalProductSearchCount.value > 0) {
    clearCatalogNonSearchFilters()
    candidates = filteredProducts.value
  }

  const firstInStock = candidates.find((p) => !isOutOfStock(p))
  if (!firstInStock) {
    if (candidates.length > 0) {
      toast('error', `Món "${candidates[0].Ten_hang}" đang ở trạng thái HẾT HÀNG!`)
    }
    return
  }

  const quickQty = parsedProductSearch.value.qty
  if (isMobile.value) {
    adjustMobileCartQty(firstInStock, quickQty || 1)
  } else {
    if (quickQty) {
      productQty[firstInStock.Ma_hang] = quickQty
    }
    addProductToCart(firstInStock)
  }

  nextTick(() => {
    productSearchInputRef.value?.focus?.()
    productSearchInputRef.value?.select?.()
  })
}

function handleGlobalSearchShortcut(e) {
  if (!e) return
  const key = e.key
  const isCtrlK = (e.ctrlKey || e.metaKey) && key.toLowerCase() === 'k'
  const isSlash = key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey

  if (!isCtrlK && !isSlash) return

  if (isSlash) {
    const tag = String(document.activeElement?.tagName || '').toLowerCase()
    const isEditable =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      Boolean(document.activeElement?.isContentEditable)
    if (isEditable) return
  }

  e.preventDefault()
  if (entryMode.value !== 'catalog') {
    entryMode.value = 'catalog'
  }
  if (isMobile.value && activeMobileTab.value !== 'entry') {
    activeMobileTab.value = 'entry'
  }
  nextTick(() => {
    productSearchInputRef.value?.focus?.()
    productSearchInputRef.value?.select?.()
  })
}

const totalPages = computed(() => 1)

watch(selectedLang, () => {
  selectedCategory.value = ''
})

// Reset page when any filter changes
watch([searchProduct, selectedLang, onlyPromotion, selectedSize], () => {
  currentPage.value = 1
})

const productImages = computed(() => {
  if (!selectedProduct.value) return []
  
  const images = []
  const mainImg = selectedProduct.value.Main_img_base64 || selectedProduct.value.Main_img
  if (mainImg) images.push(mainImg)
  
  for (let i = 1; i <= 6; i++) {
    const base64Key = `img_${i}_base64`
    const urlKey = `img_${i}`
    const img = selectedProduct.value[base64Key] || selectedProduct.value[urlKey]
    if (img) images.push(img)
  }
  
  return images
})

function calcDiscount(giaBan, soLuong, giamGia, chietKhau) {
  const qty = Number(soLuong || 0)
  const price = Number(giaBan || 0)
  const giamGiaTien = Number(giamGia || 0) * qty
  const ck1sp = price * (Number(chietKhau || 0) / 100)
  const chietKhauTien = ck1sp * qty
  return {
    giamGiaTien,
    chietKhauTien,
    tongGiamTru: giamGiaTien + chietKhauTien,
    ck1sp,
  }
}

function hasItemDiscount(item) {
  return Number(item?.chietKhau || 0) > 0 || Number(item?.giamGia || 0) > 0
}

function getItemChietKhauTien(item) {
  const cached = Number(item?.tongChietKhauTien)
  if (Number.isFinite(cached)) return cached
  const d = calcDiscount(item?.giaBan, item?.soLuong, item?.giamGia, item?.chietKhau)
  return d.chietKhauTien
}

function getItemGiamGiaTien(item) {
  const cached = Number(item?.tongGiamGiaTien)
  if (Number.isFinite(cached)) return cached
  const d = calcDiscount(item?.giaBan, item?.soLuong, item?.giamGia, item?.chietKhau)
  return d.giamGiaTien
}

function getItemUnitPriceAfterDiscount(item) {
  const price = Number(item?.giaBan || 0)
  if (!price) return 0
  const d = calcDiscount(item?.giaBan, item?.soLuong, item?.giamGia, item?.chietKhau)
  const unit = price - d.ck1sp - Number(item?.giamGia || 0)
  return Math.max(0, unit)
}

const manualPreview = computed(() => {
  const soLuong = Number(form.soLuong || 0)
  const giaBan = Number(form.giaBan || 0)
  const giaGoc = Number(form.giaGoc || 0)
  const d = calcDiscount(giaBan, soLuong, form.giamGia, form.chietKhau)
  const thanhTien = giaBan * soLuong
  const sauGiam = thanhTien - d.tongGiamTru
  const loiNhuan = calcOrderLineProfit({
    giaBan,
    giaGoc,
    soLuong,
    giamGia: Number(form.giamGia || 0),
    ck1sp: d.ck1sp,
    nccLoaiGiam: form.nccLoaiGiam,
    nccGiaTriGiam: form.nccGiaTriGiam,
  })
  return {
    thanhTien,
    chietKhauTien: d.chietKhauTien,
    giamGiaTien: d.giamGiaTien,
    tongGiamTru: d.tongGiamTru,
    sauGiam,
    loiNhuan,
  }
})

function resetCatalogFilters() {
  searchProduct.value = ''
  selectedLang.value = 'vi'
  selectedCategory.value = ''
  selectedSize.value = ''
  onlyPromotion.value = false
  currentPage.value = 1
}


function setPlus20Min() {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 20)
  
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  ngayNhanHang.value = `${y}-${m}-${d}`
  
  gioNhanHang.value = String(now.getHours()).padStart(2, '0')
  phutNhanHang.value = String(now.getMinutes()).padStart(2, '0')
  
  form.ghiChuDonHang = 'Làm xong ship liền'
  
  toast('success', 'Đã cập nhật thời gian: +20 phút')
}

function toggleNotePopover(maHang) {
  notePopoverOpen[maHang] = !notePopoverOpen[maHang]
}

function highlightCard(maHang) {
  cardHighlight[maHang] = true
  setTimeout(() => {
    cardHighlight[maHang] = false
  }, 600)
}

function addItem() {
  const tenHangTrim = (form.tenHang || '').trim()
  if (!tenHangTrim) {
    toast('warn', '?? Vui long nhap ten hang')
    return
  }

  form.tenHang = tenHangTrim

  const hasMaHang = !!form.maHang

  if (hasMaHang && isManualOutOfStock.value) {
    toast('error', '❌ Sản phẩm này đang ở trạng thái HẾT HÀNG!')
    return
  }

  const targetMember = getTargetMemberPayload()

  /* ===== CHECK EXISTS & AGGREGATE ===== */
  let existingItemIndex = -1
  if (hasMaHang) {
    const maHangKey = form.maHang
    const sizeKey = form.size || ''
    const dvtKey = form.dvt || ''
    
    existingItemIndex = items.value.findIndex(i => 
      (i.Ma_hang || i.maHang) === maHangKey && 
      (i.Size ?? i.size ?? '') === sizeKey && 
      (i.Dvt ?? i.dvt ?? '') === dvtKey &&
      isSameItemOwner(i, targetMember)
    )
  }
  if (existingItemIndex > -1) {
    // Aggregation Logic
    const existingItem = items.value[existingItemIndex]
    
    // Calculate new total quantity
    const qtyToAdd = form.soLuong || 1
    const newQty = existingItem.So_luong + qtyToAdd

    // Recalculate financial fields
    const giaBan = form.giaBan
    const chietKhau = Number(existingItem.chietKhau ?? existingItem.Chiet_khau ?? 0)
    const giamGia = Number(existingItem.giamGia ?? existingItem.Giam_gia ?? 0)
    const giaGoc = form.giaGoc

    const d = calcDiscount(giaBan, newQty, giamGia, chietKhau)
    const Thanh_tien = giaBan * newQty
    const nccLoaiGiam = normalizeNccDiscountType(
      existingItem.Ncc_loai_giam ?? existingItem.nccLoaiGiam ?? form.nccLoaiGiam,
    )
    const nccGiaTriGiam = normalizeNccDiscountValue(
      existingItem.Ncc_gia_tri_giam ?? existingItem.nccGiaTriGiam ?? form.nccGiaTriGiam,
    )
    const Loi_nhuan = calcOrderLineProfit({
      giaBan,
      giaGoc,
      soLuong: newQty,
      giamGia,
      ck1sp: d.ck1sp,
      nccLoaiGiam,
      nccGiaTriGiam,
    })

    // Update existing item fields (UI & Sheet sync)
    existingItem.So_luong = newQty
    existingItem.soLuong = newQty
    existingItem.Tien_chiet_khau = d.chietKhauTien
    existingItem.Ncc_loai_giam = nccLoaiGiam
    existingItem.nccLoaiGiam = nccLoaiGiam
    existingItem.Ncc_gia_tri_giam = nccGiaTriGiam
    existingItem.nccGiaTriGiam = nccGiaTriGiam
    existingItem.Thanh_tien = Thanh_tien
    existingItem.thanhTien = Thanh_tien
    existingItem.tongGiamGiaTien = d.giamGiaTien
    existingItem.tongChietKhauTien = d.chietKhauTien
    existingItem.tongGiamTru = d.tongGiamTru
    existingItem.tongGiamGiaDong = d.tongGiamTru
    existingItem.Loi_nhuan = Loi_nhuan
    existingItem.loiNhuan = Loi_nhuan
    if (!existingItem.Nguoi_dat && targetMember.Nguoi_dat) existingItem.Nguoi_dat = targetMember.Nguoi_dat
    if (!existingItem.Nguoi_dat_id && targetMember.Nguoi_dat_id) existingItem.Nguoi_dat_id = targetMember.Nguoi_dat_id
    if (!existingItem.Added_by_role && targetMember.Added_by_role) existingItem.Added_by_role = targetMember.Added_by_role
    
    // Merge Notes
    if (form.ghiChuHang && form.ghiChuHang !== existingItem.Ghi_chu) {
      existingItem.Ghi_chu = existingItem.Ghi_chu 
        ? `${existingItem.Ghi_chu}, ${form.ghiChuHang}`
        : form.ghiChuHang
      existingItem.ghiChuHang = existingItem.Ghi_chu
    }

    const ownerSuffix = showMemberTargetBar.value && targetMember.Nguoi_dat ? ` (${targetMember.Nguoi_dat})` : ''
    toast('success', `✅ Đã cộng dồn +${qtyToAdd} vào ${form.tenHang}${ownerSuffix}`)
    highlightRow(existingItemIndex)

  } else {
    // Add new item (existing logic)
    const d = calcDiscount(form.giaBan, form.soLuong, form.giamGia, form.chietKhau)
    const nccLoaiGiam = normalizeNccDiscountType(form.nccLoaiGiam)
    const nccGiaTriGiam = normalizeNccDiscountValue(form.nccGiaTriGiam)

    const loiNhuan = calcOrderLineProfit({
      giaBan: form.giaBan,
      giaGoc: form.giaGoc,
      soLuong: form.soLuong,
      giamGia: form.giamGia,
      ck1sp: d.ck1sp,
      nccLoaiGiam,
      nccGiaTriGiam,
    })

    const thanhTien = form.giaBan * form.soLuong

    items.value.push({
      Ma_hoa_don: maHoaDon.value,
      So_hoa_don: soHoaDon.value,
      Ngay_tao_duong_lich: formatDateTimeVN(),
      Ma_hang: form.maHang,
      Ten_hang: form.tenHang,
      Trang_thai: form.trangThai,
      Danh_muc: form.danhMuc,
      Size: form.size,
      Dvt: form.dvt,
      Don_vi_tien_te: form.donViTienTe,
      donViTienTe: form.donViTienTe,
      So_luong: form.soLuong,
      Gia_goc: form.giaGoc,
      Gia_ban: form.giaBan,
      Giam_gia: form.giamGia,
      Tien_chiet_khau: d.chietKhauTien,
      Ncc_loai_giam: nccLoaiGiam,
      Ncc_gia_tri_giam: nccGiaTriGiam,
      nccLoaiGiam,
      nccGiaTriGiam,
      Thanh_tien: thanhTien,
      Loi_nhuan: loiNhuan,
      Ghi_chu: form.ghiChuHang || '',
      ghiChuHang: form.ghiChuHang,
      Nguoi_dat: targetMember.Nguoi_dat,
      Nguoi_dat_id: targetMember.Nguoi_dat_id,
      Added_by_role: targetMember.Added_by_role,
      soLuong: form.soLuong,
      giaGoc: form.giaGoc,
      giaBan: form.giaBan,
      chietKhau: form.chietKhau,
      giamGia: form.giamGia,
      thanhTien,
      loiNhuan,
      tongGiamGiaTien: d.giamGiaTien,
      tongChietKhauTien: d.chietKhauTien,
      tongGiamTru: d.tongGiamTru,
      tongGiamGiaDong: d.tongGiamTru,
      maHang: form.maHang,
      tenHang: form.tenHang,
      size: form.size,
      dvt: form.dvt,
      danhMuc: form.danhMuc,
      trangThai: form.trangThai,
    })
    const newIndex = items.value.length - 1
    highlightRow(newIndex)
  }

  // Visual success feedback
  addedSuccessManual.value = true
  setTimeout(() => {
    addedSuccessManual.value = false
  }, 1200)

  resetItem()
}

function resetItem() {
  showManualAddOptions.value = false
  form.maHang = ''
  form.tenHang = ''
  form.soLuong = 1
  form.giaGoc = 0
  form.chietKhau = 0
  form.giamGia = 0
  form.nccLoaiGiam = 'percent'
  form.nccGiaTriGiam = 0
  form.giaBan = 0
  form.ghiChuHang = ''
}

const isManualMatchedInDb = computed(() => {
  const code = String(form.maHang || '').trim()
  if (!code) return false
  return hangHoaList.value.some((h) => String(h?.Ma_hang || '').trim() === code)
})

const manualLinePreview = computed(() => {
  const price = Number(form.giaBan || 0)
  const disc = Number(form.giamGia || 0)
  const qty = Math.max(1, Number(form.soLuong || 1))
  return Math.max(0, (price - disc) * qty)
})

const manualDbConflictModal = reactive({
  open: false,
  existingItem: null,
  matchReason: 'name',
  newMaHang: '',
  draft: null,
})

function buildManualDbDraftSnapshot() {
  return {
    tenHangTrim: (form.tenHang || '').trim(),
    maHangInput: String(form.maHang || '').trim(),
    langKey: form.lang === 'tl' ? 'fil' : form.lang || 'vi',
    danhMucTrim: (form.danhMuc || '').trim(),
    sizeTrim: (form.size || '').trim(),
    dvtTrim: (form.dvt || '').trim(),
    currencyTrim: (form.donViTienTe || 'P').trim() || 'P',
    giaGoc: Number(form.giaGoc || 0),
    giaBan: Number(form.giaBan || 0),
    nccLoaiGiam: normalizeNccDiscountType(form.nccLoaiGiam),
    nccGiaTriGiam: normalizeNccDiscountValue(form.nccGiaTriGiam),
    trangThai: form.trangThai || 'Còn hàng',
  }
}

async function executeSaveManualProductToDb({
  targetMaHang,
  existingRow = null,
  isUpdate = false,
  forceCreateNew = false,
  draft = buildManualDbDraftSnapshot(),
}) {
  if (isSavingManualToDb.value) return
  const i18nSeed = existingRow?.i18n ? JSON.parse(JSON.stringify(existingRow.i18n)) : {}
  i18nSeed[draft.langKey] = {
    ...i18nSeed[draft.langKey],
    Ten_hang: draft.tenHangTrim,
    Danh_muc: draft.danhMucTrim,
    Dvt: draft.dvtTrim,
  }

  const productPayload = syncProductWithI18n({
    ...existingRow,
    Ma_hang: targetMaHang,
    Ten_hang: draft.langKey === 'vi' ? draft.tenHangTrim : existingRow?.Ten_hang || draft.tenHangTrim,
    Danh_muc: draft.langKey === 'vi' ? draft.danhMucTrim : existingRow?.Danh_muc || draft.danhMucTrim,
    Size: draft.sizeTrim,
    Dvt: draft.langKey === 'vi' ? draft.dvtTrim : existingRow?.Dvt || draft.dvtTrim,
    Gia_goc: draft.giaGoc,
    Gia_ban: draft.giaBan,
    Ncc_loai_giam: draft.nccLoaiGiam,
    Ncc_gia_tri_giam: draft.nccGiaTriGiam,
    Don_vi_tien_te: draft.currencyTrim,
    Trang_thai: draft.trangThai || existingRow?.Trang_thai || 'Còn hàng',
    i18n: i18nSeed,
  })
  if (!isUpdate) {
    productPayload.Gia_Giam = ''
  }

  const dispatchPayload = forceCreateNew
    ? { ...productPayload, _forceCreateNew: true }
    : productPayload

  isSavingManualToDb.value = true
  try {
    const res = await dispatchAction({
      action: 'nhapHangHoa',
      data: [dispatchPayload],
    })
    if (!res?.success) {
      toast('error', '❌ ' + (res?.message || 'Không thể lưu sản phẩm vào DB'))
      return
    }

    const idx = hangHoaList.value.findIndex(
      (h) => String(h?.Ma_hang || '').trim() === targetMaHang,
    )
    if (idx > -1) {
      hangHoaList.value[idx] = { ...hangHoaList.value[idx], ...productPayload }
    } else {
      hangHoaList.value.unshift(productPayload)
      productQty[targetMaHang] = 1
      productNotes[targetMaHang] = ''
      notePopoverOpen[targetMaHang] = false
      cardHighlight[targetMaHang] = false
    }

    form.maHang = targetMaHang
    form.trangThai = productPayload.Trang_thai
    showManualAddOptions.value = false
    manualDbConflictModal.open = false
    addItem()
    toast(
      'success',
      isUpdate
        ? `✅ Đã cập nhật DB (#${targetMaHang}) & thêm vào đơn!`
        : `✅ Đã lưu vào DB (#${targetMaHang}) & thêm vào đơn!`,
    )
  } catch (e) {
    console.error('Lỗi lưu sản phẩm thủ công vào DB:', e)
    toast('error', '❌ Lỗi kết nối Firebase khi lưu sản phẩm vào DB')
  } finally {
    isSavingManualToDb.value = false
  }
}

function handleManualAddClick() {
  if (isSavingManualToDb.value) return
  const tenHangTrim = (form.tenHang || '').trim()
  if (!tenHangTrim) {
    toast('warn', '⚠️ Vui lòng nhập tên hàng')
    return
  }
  if (form.maHang && isManualOutOfStock.value) {
    toast('error', '❌ Sản phẩm này đang ở trạng thái HẾT HÀNG!')
    return
  }
  showManualAddOptions.value = !showManualAddOptions.value
}

function manualAddOrderOnly() {
  showManualAddOptions.value = false
  addItem()
}

async function manualAddAndSaveToDb() {
  if (isSavingManualToDb.value) return
  const tenHangTrim = (form.tenHang || '').trim()
  if (!tenHangTrim) {
    toast('warn', '⚠️ Vui lòng nhập tên hàng')
    return
  }

  const draft = buildManualDbDraftSnapshot()
  const existingCodes = (hangHoaList.value || []).map((h) => String(h?.Ma_hang || '').trim())
  const duplicate = findDuplicateProductMatch({
    tenHang: draft.tenHangTrim,
    maHang: draft.maHangInput,
    catalog: hangHoaList.value,
  })

  if (duplicate?.matched) {
    const matchedCode = String(duplicate.matched.Ma_hang || '').trim()
    manualDbConflictModal.existingItem = duplicate.matched
    manualDbConflictModal.matchReason = duplicate.matchReason
    manualDbConflictModal.newMaHang = buildUniqueProductCode(
      matchedCode || draft.tenHangTrim,
      existingCodes,
      { treatInputAsBase: Boolean(matchedCode) },
    )
    manualDbConflictModal.draft = draft
    manualDbConflictModal.open = true
    return
  }

  const uniqueNewCode = buildUniqueProductCode(draft.tenHangTrim, existingCodes)
  await executeSaveManualProductToDb({
    targetMaHang: uniqueNewCode,
    existingRow: null,
    isUpdate: false,
    forceCreateNew: true,
    draft,
  })
}

async function confirmManualDbUpdateExisting() {
  const existing = manualDbConflictModal.existingItem
  const draft = manualDbConflictModal.draft
  if (!existing || !draft) {
    manualDbConflictModal.open = false
    return
  }
  const targetCode = String(existing.Ma_hang || '').trim()
  manualDbConflictModal.open = false
  await executeSaveManualProductToDb({
    targetMaHang: targetCode,
    existingRow: existing,
    isUpdate: true,
    forceCreateNew: false,
    draft,
  })
}

async function confirmManualDbCreateNew() {
  const newCode = manualDbConflictModal.newMaHang
  const draft = manualDbConflictModal.draft
  if (!newCode || !draft) {
    manualDbConflictModal.open = false
    return
  }
  manualDbConflictModal.open = false
  await executeSaveManualProductToDb({
    targetMaHang: newCode,
    existingRow: null,
    isUpdate: false,
    forceCreateNew: true,
    draft,
  })
}

function cancelManualDbConflict() {
  manualDbConflictModal.open = false
}

/* ================= THANH TOÁN ================= */
const hinhThucThanhToan = ref('TIEN_MAT')
const ckBaoGomShip = ref(false)
const tiGiaRef = ref(null)

function handlePaymentMethodChange(method) {
  hinhThucThanhToan.value = method
  if (method === 'CHUYEN_KHOAN') {
    nextTick(() => {
      tiGiaRef.value?.focus()
    })
  }
}

const tenHinhThucThanhToan = computed(() => {
  if (hinhThucThanhToan.value === 'CHUYEN_KHOAN') return 'Chuyển khoản'
  return 'Tiền mặt'
})

/* ================= XUẤT MÃ QR CHUYỂN KHOẢN TỰ ĐIỀN (VIETQR) ================= */
const showQrExportModal = ref(false)
const selectedQrBankIndex = ref(0)
const qrExportMemo = ref('')
const qrModalWrapRef = ref(null)
const qrModalCardRef = ref(null)
const isQrImageCopied = ref(false)
const isExportingQrPng = ref(false)

const parsedCkAccounts = computed(() =>
  (thongTinChuyenKhoanList.value || []).map((info) => parseBankAccountInfo(info)).filter(Boolean),
)

const qrExportAccounts = computed(() =>
  parsedCkAccounts.value.filter((acc) => acc.hasAnyQr),
)

const activeQrBankAccount = computed(
  () =>
    qrExportAccounts.value[selectedQrBankIndex.value] ||
    qrExportAccounts.value[0] ||
    null,
)

const qrExportShipIncluded = computed(
  () => normalizedPhiShip.value > 0 && ckBaoGomShip.value,
)

const qrExportCurrency = computed(() => {
  const acc = activeQrBankAccount.value
  if (!acc) return donViTienTeCK.value || 'VND'
  if (acc.currency === 'P' || acc.currency === 'PHP') {
    return donViTienTeChung.value || 'P'
  }
  return acc.currency || donViTienTeCK.value || 'VND'
})

const qrExportDisplayAmount = computed(() => {
  const acc = activeQrBankAccount.value
  const baseAmt = Number(tongCong.value || 0) + (qrExportShipIncluded.value ? normalizedPhiShip.value : 0)
  if (!acc) return Math.max(0, Math.round(baseAmt * Number(tiGia.value || 1)))

  const accCur = acc.currency === 'P' ? 'PHP' : acc.currency
  const orderCurRaw = String(donViTienTeChung.value || 'P').trim().toUpperCase()
  const orderCur = orderCurRaw === 'P' ? 'PHP' : orderCurRaw

  if (accCur === orderCur) {
    return Math.max(0, Math.round(baseAmt))
  }
  const rate =
    accCur === 'VND'
      ? Number(tiGia.value || acc.tiGia || 1)
      : Number(acc.tiGia || tiGia.value || 1)
  return Math.max(0, Math.round(baseAmt * rate))
})

const qrExportShipStatusText = computed(() =>
  qrExportShipIncluded.value ? 'Đã tính ship' : 'Chưa tính ship',
)

const qrModalPayload = computed(() => {
  const acc = activeQrBankAccount.value
  if (!acc?.isValidVietQr) return ''
  return buildVietQrPayload({
    bin: acc.bin,
    accountNo: acc.stk,
    amount: qrExportDisplayAmount.value,
    addInfo: qrExportMemo.value,
  })
})

function getBankDynamicQrPayload(info) {
  const parsed = parseBankAccountInfo(info)
  if (!parsed?.isValidVietQr) return ''
  return buildVietQrPayload({
    bin: parsed.bin,
    accountNo: parsed.stk,
    amount: Math.max(0, Math.round(Number(exportTongChuyenKhoan.value || 0))),
    addInfo: maHoaDon.value || '',
  })
}

function openQrExportModal() {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }
  if (!qrExportAccounts.value.length) {
    toast(
      'warn',
      'Chưa có tài khoản chuyển khoản hoặc ảnh QR trong mục Ngân hàng & Tỉ giá',
    )
    return
  }
  selectedQrBankIndex.value = 0
  qrExportMemo.value = toAsciiClean(maHoaDon.value || '').slice(0, 50)
  isQrImageCopied.value = false
  showQrExportModal.value = true
}

function loadImageAsync(src, useCors = false) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (useCors && !String(src || '').startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function renderQrExportPngBlob() {
  const acc = activeQrBankAccount.value
  if (!acc) throw new Error('Không tìm thấy tài khoản QR để xuất')

  let qrImg = null
  if (acc.isValidVietQr) {
    const svgEl = qrModalWrapRef.value?.querySelector('svg')
    if (!svgEl) throw new Error('Không tìm thấy mã QR để xuất')
    const svgClone = svgEl.cloneNode(true)
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svgClone.setAttribute('width', '420')
    svgClone.setAttribute('height', '420')
    const svgMarkup = new XMLSerializer().serializeToString(svgClone)
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
    qrImg = await loadImageAsync(svgDataUrl)
  } else {
    if (!acc.qrImgSrc) throw new Error('Tài khoản này chưa có ảnh QR tĩnh')
    qrImg = await loadImageAsync(acc.qrImgSrc, true)
  }

  const W = 680
  const H = 880
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Không khởi tạo được canvas')

  // Outer light card background
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, W, H)

  // Main white rounded card
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(28, 28, W - 56, H - 56, 28)
  ctx.fill()
  ctx.stroke()

  // Header gradient pill
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.roundRect(68, 56, W - 136, 56, 14)
  ctx.fill()

  ctx.fillStyle = acc.isValidVietQr ? '#38bdf8' : '#fbbf24'
  ctx.font = '800 18px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    acc.isValidVietQr ? 'VIETQR · CHUYỂN KHOẢN TỰ ĐIỀN' : 'QR CHUYỂN KHOẢN',
    W / 2,
    91,
  )

  // Bank name
  ctx.fillStyle = '#1e293b'
  ctx.font = '800 22px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText(String(acc.bankName || acc.title || '').toUpperCase(), W / 2, 148)

  // QR Frame (fit keeping aspect ratio for static QR images)
  const qrSize = 360
  const qrX = (W - qrSize) / 2
  const qrY = 172
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 20)
  ctx.fill()
  ctx.stroke()

  const iw = qrImg.naturalWidth || qrSize
  const ih = qrImg.naturalHeight || qrSize
  const scale = Math.min(qrSize / iw, qrSize / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(qrImg, qrX + (qrSize - dw) / 2, qrY + (qrSize - dh) / 2, dw, dh)

  // Amount label + value
  ctx.fillStyle = '#64748b'
  ctx.font = '700 16px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText('SỐ TIỀN CHUYỂN KHOẢN', W / 2, 588)

  ctx.fillStyle = '#059669'
  ctx.font = '900 38px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText(formatWithCurrency(qrExportDisplayAmount.value, qrExportCurrency.value), W / 2, 634)

  ctx.fillStyle = qrExportShipIncluded.value ? '#0284c7' : '#64748b'
  ctx.font = '700 17px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText(`(${qrExportShipStatusText.value})`, W / 2, 666)

  // Divider
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(68, 692)
  ctx.lineTo(W - 68, 692)
  ctx.stroke()

  // Account details
  ctx.textAlign = 'left'
  const detailLines = [
    acc.ownerName ? ['Chủ TK:', acc.ownerName] : null,
    acc.stk ? ['Số TK:', acc.stk] : null,
    acc.isValidVietQr && qrExportMemo.value ? ['Nội dung:', qrExportMemo.value] : null,
  ].filter(Boolean)

  let curY = 732
  for (const [label, val] of detailLines) {
    ctx.fillStyle = '#64748b'
    ctx.font = '600 18px system-ui, -apple-system, Segoe UI, sans-serif'
    ctx.fillText(label, 76, curY)

    ctx.fillStyle = '#0f172a'
    ctx.font = '800 19px system-ui, -apple-system, Segoe UI, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(val), W - 76, curY)
    ctx.textAlign = 'left'
    curY += 36
  }

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Không xuất được file PNG'))
    }, 'image/png')
  })
}

async function downloadQrExportPng() {
  if (isExportingQrPng.value) return
  isExportingQrPng.value = true
  try {
    const blob = await renderQrExportPngBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vietqr-${maHoaDon.value || 'chuyen-khoan'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast('success', 'Đã tải ảnh mã QR chuyển khoản!')
  } catch (err) {
    console.error('Lỗi tải ảnh QR:', err)
    toast('error', 'Không thể tạo ảnh mã QR')
  } finally {
    isExportingQrPng.value = false
  }
}

async function copyQrExportPng() {
  if (isExportingQrPng.value) return
  isExportingQrPng.value = true
  try {
    const blob = await renderQrExportPngBlob()
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof window !== 'undefined' &&
      typeof window.ClipboardItem === 'function'
    ) {
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
      isQrImageCopied.value = true
      toast('success', 'Đã copy ảnh mã QR vào clipboard!')
      setTimeout(() => {
        isQrImageCopied.value = false
      }, 2200)
    } else {
      await downloadQrExportPng()
    }
  } catch (err) {
    console.warn('Copy QR image fallback to download:', err)
    toast('warn', 'Trình duyệt không hỗ trợ copy ảnh trực tiếp, đang tải về...')
    isExportingQrPng.value = false
    await downloadQrExportPng()
    return
  } finally {
    isExportingQrPng.value = false
  }
}

/* ================= GLOBAL DISCOUNT INTERFACE ================= */
const showDiscountModal = ref(false)
const activeDiscountType = ref('money') // 'money' | 'percent'
const globalGiamGia = ref(0)
const globalChietKhauPercent = ref(0)
const phiShip = ref(0)
const normalizedPhiShip = computed(() => Math.max(0, Number(phiShip.value || 0)))
const tempGlobalGiamGia = ref(0)
const tempGlobalChietKhauPercent = ref(0)

watch(
  [
    maHoaDon,
    soHoaDon,
    ngayNhanHang,
    gioNhanHang,
    phutNhanHang,
    hinhThucThanhToan,
    ckBaoGomShip,
    exportPriceMode,
    orderTableViewMode,
    syncedOrderDigest,
    customOrderMembers,
    globalGiamGia,
    globalChietKhauPercent,
    phiShip,
    items,
    () => form.maKhachHang,
    () => form.tenKhachHang,
    () => form.soDienThoai,
    () => form.diaChi,
    () => form.ghiChu,
    () => form.ghiChuDonHang,
  ],
  () => {
    syncActiveTabSnapshot()
  },
  { deep: true },
)

function openDiscountModal(type) {
  activeDiscountType.value = type
  if (type === 'money') {
    tempGlobalGiamGia.value = globalGiamGia.value
  } else {
    tempGlobalChietKhauPercent.value = globalChietKhauPercent.value
  }
  showDiscountModal.value = true
}

function applyGlobalDiscount() {
  if (activeDiscountType.value === 'money') {
    globalGiamGia.value = tempGlobalGiamGia.value
    toast('success', 'Đã cập nhật giảm giá thêm')
  } else {
    globalChietKhauPercent.value = tempGlobalChietKhauPercent.value
    toast('success', 'Đã cập nhật chiết khấu thêm')
  }
  showDiscountModal.value = false
}

const tamTinh = computed(() =>
  items.value.reduce((s, i) => s + i.thanhTien, 0)
)

const tongGiamGia = computed(() => {
  const itemTotal = items.value.reduce((s, i) => {
    const giamGiaTien = Number(i.tongGiamGiaTien)
    if (Number.isFinite(giamGiaTien)) return s + giamGiaTien
    const d = calcDiscount(i.giaBan, i.soLuong, i.giamGia, i.chietKhau)
    return s + d.giamGiaTien
  }, 0)
  // Global Discount (Money) is added here
  return itemTotal + (globalGiamGia.value || 0)
})

const tongTienChietKhau = computed(() => {
  const itemTotal = items.value.reduce((s, i) => {
    const chietKhauTien = Number(i.tongChietKhauTien)
    if (Number.isFinite(chietKhauTien)) return s + chietKhauTien
    const d = calcDiscount(i.giaBan, i.soLuong, i.giamGia, i.chietKhau)
    return s + d.chietKhauTien
  }, 0)
  
  // Calculate Global Percent Amount
  // Base: (TamTinh - TongGiamGia_Items - GlobalGiamGia_Money) + Item_ChietKhau? 
  // Simplified: (Tam Tinh - Total Giam Gia) * Percent
  const baseAmount = tamTinh.value - tongGiamGia.value
  const globalPercentAmount = baseAmount > 0 
    ? baseAmount * ((globalChietKhauPercent.value || 0) / 100) 
    : 0

  return itemTotal + globalPercentAmount
})

const tongCong = computed(() => tamTinh.value - tongGiamGia.value - tongTienChietKhau.value)
const tongLoiNhuan = computed(() => {
  const itemProfit = items.value.reduce((s, i) => s + i.loiNhuan, 0)
  // Deduct global discount amount and global rebate amount
  const globalRebateAmount = (tongTienChietKhau.value - items.value.reduce((s, i) => s + (i.tongChietKhauTien || 0), 0))
  return itemProfit - (globalGiamGia.value || 0) - globalRebateAmount
})

/* ================= UTILS ================= */
function format(n) {
  return Number(n || 0).toLocaleString('vi-VN')
}

function formatWithCurrency(n, currency) {
  return format(n) + ' ' + (currency || 'VND')
}

function formatDateTimeLocal(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(
    date.getDate()
  )}T${p(date.getHours())}:${p(date.getMinutes())}`
}

function splitDateTimeLocal(value) {
  if (!value || !value.includes('T')) return { date: '', time: '' }
  const [date, time] = value.split('T')
  return { date, time: time?.slice(0, 5) || '' }
}

function formatDateTimeVN(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(date.getHours())}:${p(date.getMinutes())}:${p(
    date.getSeconds()
  )} ${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()}`
}

const isSubmitting = ref(false)

watch(
  () => [ngayNhanHang.value, gioNhanHang.value, phutNhanHang.value],
  ([date, gio, phut]) => {
    if (!date || !gio || !phut) return
    thoiGianNhanHang.value = `${date}T${gio}:${phut}`
  }
)

function buildInvoicePayload(targetStatus = '', adminMessage = '') {
  const cleanAdminMsg = String(adminMessage || '').trim()
  return {
    action: 'hoanThanhDon',
    ...(cleanAdminMsg ? { Admin_message: cleanAdminMsg } : {}),
    hoa_don: {
      Ma_hoa_don: maHoaDon.value,
      So_hoa_don: soHoaDon.value,
      Ngay_tao_duong_lich: orderCreatedAt.value || formatDateTimeVN(),
      Thoi_gian_nhan_hang: formatDateTimeVN(new Date(thoiGianNhanHang.value)),
      Ma_khach_hang: form.maKhachHang,
      Ten_khach_hang: form.tenKhachHang,
      Tra_tien: tongCong.value,
      Tam_tinh: tamTinh.value,
      Tong_giam_gia: tongGiamGia.value,
      Tong_tien_chiet_khau: tongTienChietKhau.value,
      Tong_cong: tongCong.value,
      Tong_loi_nhuan: tongLoiNhuan.value,
      Hinh_thuc_thanh_toan: hinhThucThanhToan.value,
      Dia_chi: form.diaChi,
      So_dien_thoai: String(form.soDienThoai),
      Ghi_chu_don_hang: form.ghiChuDonHang,
      Don_vi_tien_te: donViTienTeChung.value,
      Ti_gia: tiGia.value,
      Don_vi_tien_te_ck: donViTienTeCK.value,
      Phi_ship: normalizedPhiShip.value,
      ...(targetStatus ? { Trang_thai: targetStatus } : {}),
    },
    items: (items.value || []).map((it) => ({
      ...it,
      lineId: it.lineId || '',
      Ma_hang: it.Ma_hang || it.maHang || '',
      Ten_hang: it.Ten_hang || it.tenHang || '',
      Size: it.Size || it.size || '',
      Dvt: it.Dvt ?? it.dvt ?? '',
      ...(it.Dvt_custom ? { Dvt_custom: true } : {}),
      Don_vi_tien_te: it.Don_vi_tien_te || it.donViTienTe || donViTienTeChung.value,
      So_luong: Number(it.soLuong ?? it.So_luong ?? 1),
      Gia_goc: Number(it.giaGoc ?? it.Gia_goc ?? 0),
      Gia_ban: Number(it.giaBan ?? it.Gia_ban ?? 0),
      Giam_gia: Number(it.giamGia ?? it.Giam_gia ?? 0),
      Chiet_khau: Number(it.chietKhau ?? it.Chiet_khau ?? 0),
      Tien_chiet_khau: Number(it.tongChietKhauTien ?? it.Tien_chiet_khau ?? 0),
      Thanh_tien: Number(it.thanhTien ?? it.Thanh_tien ?? 0),
      Loi_nhuan: Number(it.loiNhuan ?? it.Loi_nhuan ?? 0),
      Ghi_chu: it.ghiChuHang ?? it.Ghi_chu ?? '',
    })),
    khach_hang: {
      Ma_khach_hang: form.maKhachHang,
      Ten_khach_hang: form.tenKhachHang,
      So_dien_thoai: String(form.soDienThoai),
      Dia_chi: form.diaChi,
      Tong_chi_tieu: tongCong.value,
      Ghi_chu: form.ghiChu,
    },
  }
}

function updateActiveTabSourceStatus(nextStatus) {
  const tab = activeTabObj.value
  if (!tab) return
  tab.sourceOrderStatus = nextStatus
  if (nextStatus && nextStatus !== 'Chờ duyệt') {
    tab.pendingWebUpdate = null
    tab.updateBaselineItems = null
    tab.updateBaselineMeta = null
  }
  saveTabsToStorage()
}

function updateActiveTabAdminStatus(nextStatus, seenInDonHang = null) {
  const tab = activeTabObj.value
  if (!tab) return
  tab.adminOrderStatus = nextStatus
  if (seenInDonHang !== null) {
    tab.adminSeenInDonHang = Boolean(seenInDonHang)
  }
  saveTabsToStorage()
}

async function hoanThanhDon(targetStatus = 'Đang xử lý', openModalOnDone = false, adminMessage = '') {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }

  if (isSubmitting.value || isOrderActionLoading.value) return
  const nextStatus = typeof targetStatus === 'string' && targetStatus.trim() ? targetStatus.trim() : 'Đang xử lý'
  if (!orderCreatedAt.value) {
    orderCreatedAt.value = formatDateTimeVN()
  }
  isSubmitting.value = true

  try {
    const json = await dispatchAction(buildInvoicePayload(nextStatus, adminMessage))

    if (json.success) {
      const dh = donHangList.value.find(
        (d) => String(d?.Ma_hoa_don || '').trim() === String(maHoaDon.value).trim(),
      )
      if (dh) dh.Trang_thai = nextStatus
      updateActiveTabAdminStatus(nextStatus, Boolean(dh))
      markOrderSyncedWithWeb()

      if (openModalOnDone || nextStatus === 'Hoàn thành') {
        openSuccessModal('✅ Hoàn thành đơn hàng thành công!')
      } else {
        const msg =
          nextStatus === 'Đang ship'
            ? '🛵 Đã chốt đơn — trạng thái: Đang ship!'
            : '✅ Đã chốt đơn — trạng thái: Đang xử lý!'
        toast('success', msg)
      }
    } else {
      toast('error', '❌ Lỗi: ' + (json.message || 'Không thể lưu đơn hàng'))
    }
  } catch (e) {
    console.error(e)
    toast('error', '❌ Lỗi kết nối Firebase')
  } finally {
    isSubmitting.value = false
  }
}

const ORDER_STATUS_STEPS = [
  { value: 'Chờ duyệt', label: 'Chờ duyệt' },
  { value: 'Đang xử lý', label: 'Xử lý' },
  { value: 'Đang ship', label: 'Đang ship' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
]

const ADMIN_ORDER_STATUS_STEPS = [
  { value: 'Đang xử lý', label: 'Xử lý' },
  { value: 'Đang ship', label: 'Đang ship' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
]

const activeProgressSteps = computed(() =>
  isLinkedOnlineOrder.value ? ORDER_STATUS_STEPS : ADMIN_ORDER_STATUS_STEPS,
)

const currentOrderSyncFingerprint = computed(() => computeOrderSyncFingerprint())

const isOrderSyncedWithWeb = computed(() => {
  if (!isLinkedOnlineOrder.value && !isSubmittedAdminOrder.value) return false
  if (!syncedOrderDigest.value) return false
  return currentOrderSyncFingerprint.value === syncedOrderDigest.value
})

const activeOrderStepIndex = computed(() => {
  const st = activeOrderStatus.value
  const steps = activeProgressSteps.value
  const idx = steps.findIndex((s) => s.value === st)
  if (idx !== -1) return idx
  return isLinkedOnlineOrder.value ? 0 : -1
})

const orderProgressPercent = computed(() => {
  const maxStep = activeProgressSteps.value.length - 1
  if (maxStep <= 0 || activeOrderStepIndex.value <= 0) return 0
  return Math.round((activeOrderStepIndex.value / maxStep) * 100)
})

function getOrderProgressStepClass(stepIdx) {
  const currentIdx = activeOrderStepIndex.value
  if (currentIdx === -1) return 'is-upcoming'
  const isCompletedAll = activeOrderStatus.value === 'Hoàn thành'
  if (isCompletedAll || stepIdx < currentIdx) return 'is-done'
  if (stepIdx === currentIdx) return 'is-current'
  return 'is-upcoming'
}

function markOrderSyncedWithWeb() {
  const digest = currentOrderSyncFingerprint.value
  syncedOrderDigest.value = digest
  const tab = activeTabObj.value
  if (tab) {
    tab.syncedDigest = digest
    saveTabsToStorage()
  }
}

function syncOrderToWebFromInvoice() {
  if (!isLinkedOnlineOrder.value) return
  if (activeOrderStatus.value === 'Chờ duyệt') {
    return saveOrderDraftFromInvoice()
  }
  return saveApprovedOrderEdits()
}

function handleOrderProgressStepClick(targetStatus) {
  if (!targetStatus || isOrderActionLoading.value || isSubmitting.value) return
  if (!isLinkedOnlineOrder.value) {
    return handleAdminProgressStepClick(targetStatus)
  }
  if (activeOrderStatus.value === targetStatus) {
    if (!isOrderSyncedWithWeb.value) {
      toast('info', 'Đơn có thay đổi chưa đồng bộ — bấm "ĐỒNG BỘ WEB" để cập nhật lên web')
    }
    return
  }
  if (targetStatus === 'Chờ duyệt') {
    return runOnlineOrderTransition(
      'Chờ duyệt',
      `Chuyển đơn #${maHoaDon.value} về trạng thái Chờ duyệt?`,
      '✅ Đã chuyển đơn về Chờ duyệt!',
    )
  }
  if (targetStatus === 'Đang xử lý') return approveOrderFromInvoice()
  if (targetStatus === 'Đang ship') return shipOrderFromInvoice()
  if (targetStatus === 'Hoàn thành') return completeOrderFromInvoice()
}

function handleAdminProgressStepClick(targetStatus) {
  if (!isSubmittedAdminOrder.value) {
    if (!items.value.length) {
      toast('warn', 'Chưa có hàng trong đơn')
      return
    }
    if (targetStatus === 'Đang xử lý') {
      return hoanThanhDon('Đang xử lý', false)
    }
    if (targetStatus === 'Đang ship') {
      if (!confirm(`Xác nhận chốt đơn #${maHoaDon.value} và chuyển ngay sang Đang ship?`)) return
      return hoanThanhDon('Đang ship', false)
    }
    if (targetStatus === 'Hoàn thành') {
      openOrderActionConfirm({
        action: 'complete',
        mode: 'admin-new',
        title: 'Hoàn thành đơn hàng',
        description: `Xác nhận chốt và Hoàn thành đơn #${maHoaDon.value} ngay?`,
        confirmLabel: 'Hoàn thành',
        showMessageBox: false,
      })
      return
    }
    return
  }

  if (activeOrderStatus.value === targetStatus) {
    if (!isOrderSyncedWithWeb.value) {
      toast('info', 'Đơn có thay đổi chưa lưu — bấm "LƯU CẬP NHẬT" để cập nhật đơn hàng')
    }
    return
  }

  if (targetStatus === 'Đang xử lý') {
    return runAdminOrderTransition(
      'Đang xử lý',
      `Chuyển đơn #${maHoaDon.value} về trạng thái Đang xử lý?`,
      '✅ Đã chuyển đơn sang Đang xử lý!',
    )
  }
  if (targetStatus === 'Đang ship') {
    return runAdminOrderTransition(
      'Đang ship',
      `Xác nhận chuyển đơn #${maHoaDon.value} sang trạng thái Đang ship?`,
      '🛵 Đơn hàng đã chuyển sang Đang ship!',
    )
  }
  if (targetStatus === 'Hoàn thành') {
    openOrderActionConfirm({
      action: 'complete',
      mode: 'admin-submitted',
      title: 'Hoàn thành đơn hàng',
      description: `Xác nhận hoàn thành đơn #${maHoaDon.value}?`,
      confirmLabel: 'Hoàn thành',
      showMessageBox: false,
    })
    return
  }
}

async function runAdminOrderTransition(targetStatus, confirmText, successText, openModalOnDone = false, adminMessage = '') {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }
  if (isOrderActionLoading.value || isSubmitting.value) return
  if (confirmText && !confirm(confirmText)) return

  isOrderActionLoading.value = true
  try {
    const res = await dispatchAction(buildInvoicePayload(targetStatus, adminMessage))
    if (res?.success) {
      const dh = donHangList.value.find(
        (d) => String(d?.Ma_hoa_don || '').trim() === String(maHoaDon.value).trim(),
      )
      if (dh) dh.Trang_thai = targetStatus
      updateActiveTabAdminStatus(targetStatus, dh ? true : null)
      markOrderSyncedWithWeb()

      if (openModalOnDone) {
        openSuccessModal(successText)
      } else {
        toast('success', successText)
      }
    } else {
      toast('error', '❌ Lỗi: ' + (res?.message || 'Không thể cập nhật đơn hàng'))
    }
  } catch (e) {
    console.error(e)
    toast('error', '❌ Lỗi kết nối Firebase')
  } finally {
    isOrderActionLoading.value = false
  }
}

function saveAdminOrderEdits() {
  return runAdminOrderTransition(
    activeOrderStatus.value || 'Đang xử lý',
    '',
    '✅ Đã lưu cập nhật đơn hàng!',
  )
}

async function saveOrderDraftFromInvoice() {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }
  if (isOrderActionLoading.value || isSubmitting.value) return
  isOrderActionLoading.value = true
  try {
    const res = await adminSyncOrderItems({
      Ma_hoa_don: maHoaDon.value,
      items: items.value.map((it) => ({
        ...it,
        Ma_hang: it.Ma_hang || it.maHang || '',
        Ten_hang: it.Ten_hang || it.tenHang || '',
        Size: it.Size || it.size || '',
        Dvt: it.Dvt ?? it.dvt ?? '',
        ...(it.Dvt_custom ? { Dvt_custom: true } : {}),
        So_luong: Number(it.So_luong ?? it.soLuong ?? 1),
        Gia_goc: Number(it.Gia_goc ?? it.giaGoc ?? 0),
        Gia_ban: Number(it.Gia_ban ?? it.giaBan ?? 0),
        Thanh_tien: Number(it.Thanh_tien ?? it.thanhTien ?? 0),
        Ghi_chu: it.Ghi_chu ?? it.ghiChuHang ?? '',
      })),
      meta: {
        Ten_khach_hang: form.tenKhachHang || 'Khách lẻ',
        So_dien_thoai: String(form.soDienThoai || ''),
        Dia_chi: form.diaChi || '',
        Thoi_gian_nhan_hang: formatDateTimeVN(new Date(thoiGianNhanHang.value)),
        Hinh_thuc_thanh_toan: hinhThucThanhToan.value,
        Ghi_chu: form.ghiChuDonHang || '',
        Phi_ship: normalizedPhiShip.value,
      },
    })
    if (res?.success) {
      updateActiveTabSourceStatus('Chờ duyệt')
      markOrderSyncedWithWeb()
      toast('success', '✅ Đã đồng bộ đơn hàng lên web!')
    } else {
      toast('error', '❌ ' + (res?.message || 'Không đồng bộ được đơn lên web'))
    }
  } catch (e) {
    console.error(e)
    toast('error', '❌ Lỗi kết nối Firebase khi đồng bộ web')
  } finally {
    isOrderActionLoading.value = false
  }
}

async function runOnlineOrderTransition(
  targetStatus,
  confirmText,
  successText,
  openModalOnDone = false,
  adminMessage = '',
) {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }
  if (isOrderActionLoading.value || isSubmitting.value) return
  if (confirmText && !confirm(confirmText)) return

  isOrderActionLoading.value = true
  try {
    const res = await dispatchAction(buildInvoicePayload(targetStatus, adminMessage))
    if (res?.success) {
      updateActiveTabSourceStatus(targetStatus)
      markOrderSyncedWithWeb()
      const dh = donHangList.value.find(
        (d) => String(d?.Ma_hoa_don || '').trim() === String(maHoaDon.value).trim(),
      )
      if (dh) dh.Trang_thai = targetStatus

      if (openModalOnDone) {
        openSuccessModal(successText)
      } else {
        toast('success', successText)
      }
    } else {
      toast('error', '❌ Lỗi: ' + (res?.message || 'Không thể cập nhật đơn hàng'))
    }
  } catch (e) {
    console.error(e)
    toast('error', '❌ Lỗi kết nối Firebase')
  } finally {
    isOrderActionLoading.value = false
  }
}

function approveOrderFromInvoice() {
  return runOnlineOrderTransition(
    'Đang xử lý',
    `Xác nhận duyệt đơn #${maHoaDon.value} chuyển sang Đang xử lý và khóa chỉnh sửa món phía khách?`,
    '✅ Đã duyệt đơn sang Đang xử lý!',
  )
}

function saveApprovedOrderEdits() {
  return runOnlineOrderTransition(
    activeOrderStatus.value || 'Đang xử lý',
    '',
    '✅ Đã đồng bộ đơn hàng lên web!',
  )
}

function shipOrderFromInvoice() {
  return runOnlineOrderTransition(
    'Đang ship',
    `Xác nhận chuyển đơn #${maHoaDon.value} sang trạng thái Đang ship?`,
    '🛵 Đơn hàng đã chuyển sang Đang ship!',
  )
}

function completeOrderFromInvoice() {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }
  if (isOrderActionLoading.value || isSubmitting.value) return
  openOrderActionConfirm({
    action: 'complete',
    mode: 'online',
    title: 'Hoàn thành đơn hàng',
    description: `Xác nhận hoàn thành đơn #${maHoaDon.value}? (Giỏ live của khách sẽ được đóng sạch)`,
    confirmLabel: 'Hoàn thành',
    showMessageBox: true,
  })
}

function cancelOrderFromInvoice() {
  if (isOrderActionLoading.value || isSubmitting.value) return
  const confirmMsg = isLinkedOnlineOrder.value
    ? `Xác nhận HỦY đơn #${maHoaDon.value}? Đơn sẽ bị hủy đồng bộ cả ở trang Đơn hàng và phía khách!`
    : `Xác nhận HỦY đơn #${maHoaDon.value}? Đơn sẽ bị hủy khỏi danh sách Đơn hàng!`
  openOrderActionConfirm({
    action: 'cancel',
    mode: 'cancel',
    title: 'Xác nhận HỦY đơn',
    description: confirmMsg,
    confirmLabel: 'Hủy đơn',
    showMessageBox: isLinkedOnlineOrder.value,
  })
}

async function confirmOrderActionModal() {
  const { mode, messageInput } = orderActionConfirmModal.value
  const cleanMsg = String(messageInput || '').trim()
  closeOrderActionConfirm()
  if (cleanMsg) {
    webAdminMessageInput.value = ''
    webAdminMessageLastSent.value = cleanMsg
    const tab = activeTabObj.value
    if (tab) {
      tab.webAdminMessageInput = ''
      tab.webAdminMessageLastSent = cleanMsg
      saveTabsToStorage()
    }
  }

  if (mode === 'online') {
    await runOnlineOrderTransition(
      'Hoàn thành',
      '',
      '✅ Hoàn thành đơn hàng thành công!',
      true,
      cleanMsg,
    )
    return
  }

  if (mode === 'admin-new') {
    await hoanThanhDon('Hoàn thành', true, cleanMsg)
    return
  }

  if (mode === 'admin-submitted') {
    await runAdminOrderTransition(
      'Hoàn thành',
      '',
      '✅ Hoàn thành đơn hàng thành công!',
      true,
      cleanMsg,
    )
    return
  }

  if (mode === 'cancel') {
    await executeCancelOrderFromInvoice(cleanMsg)
  }
}

async function executeCancelOrderFromInvoice(adminMessage = '') {
  if (isOrderActionLoading.value || isSubmitting.value) return
  isOrderActionLoading.value = true
  try {
    const res = await dispatchAction({
      action: 'huyDonHang',
      Ma_hoa_don: maHoaDon.value,
      Admin_message: String(adminMessage || '').trim(),
    })
    if (res?.success) {
      if (isLinkedOnlineOrder.value) {
        updateActiveTabSourceStatus('Đã hủy')
      } else {
        updateActiveTabAdminStatus('Đã hủy')
      }
      toast('success', `Đã hủy đơn #${maHoaDon.value}`)
      if (activeInvoiceTabId.value) {
        closeInvoiceTab(activeInvoiceTabId.value)
      }
    } else {
      toast('error', '❌ Lỗi: ' + (res?.message || 'Không thể hủy đơn'))
    }
  } catch (e) {
    console.error(e)
    toast('error', '❌ Lỗi kết nối Firebase khi hủy đơn')
  } finally {
    isOrderActionLoading.value = false
  }
}

function cleanPhoneInput(event) {
  const cleaned = event.target.value.replace(/\D/g, '')
  form.soDienThoai = cleaned
}

function buildIsolatedInvoiceStyles() {
  return `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; }
    img { max-width: 100%; }
    h2 { margin: 0; }
    .hoa-don-print {
      width: 800px;
      padding: 32px;
      background: #ffffff;
      color: #1a1a1a;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      position: static !important;
      top: auto !important;
      left: auto !important;
      margin: 0 !important;
      line-height: 1.6;
    }
    .hd-header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: center;
      padding-bottom: 18px;
      margin-bottom: 18px;
      border-bottom: 3px solid #1a1a1a;
    }
    .hd-left-group { display: flex; align-items: center; gap: 16px; }
    .hd-logo-circle {
      width: 90px; height: 90px; border: 2px solid #1a1a1a; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; background: #ffffff; flex-shrink: 0;
    }
    .hd-logo-circle img { width: 100%; height: 100%; object-fit: cover; }
    .hd-shop-info-box { display: flex; flex-direction: column; gap: 4px; }
    .hd-shop-name {
      font-size: 24px; font-weight: 900; color: #1a1a1a;
      letter-spacing: 0.8px; line-height: 1.2; text-transform: uppercase;
    }
    .hd-shop-time { font-size: 11px; font-weight: 600; color: #6b7280; font-style: italic; }
    .hd-contact-right { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
    .contact-row { display: grid; grid-template-columns: 18px 1fr; gap: 8px; align-items: center; font-size: 11px; }
    .contact-img { width: 18px; height: 18px; object-fit: contain; flex-shrink: 0; border-radius: 2px; }
    .contact-text { color: #374151; font-weight: 500; text-align: left; white-space: nowrap; display: flex; gap: 4px; }
    .platform-name { font-weight: 700; text-transform: uppercase; color: #1f2937; }
    .platform-info { font-weight: 500; color: #374151; }
    .contact-placeholder { width: 18px; height: 18px; background: #e5e7eb; border-radius: 3px; flex-shrink: 0; }
    .hd-title-section { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
    .hd-title { font-size: 28px; font-weight: 900; color: #1a1a1a; letter-spacing: 2px; margin: 0 0 8px 0; text-transform: uppercase; }
    .hd-meta { display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 13px; color: #6b7280; font-weight: 600; }
    .hd-code { letter-spacing: 0.5px; }
    .hd-separator { color: #d1d5db; font-weight: 400; }
    .hd-date { color: #9ca3af; }
    .hd-info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-card { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px; padding: 16px; }
    .card-title {
      font-size: 12px; font-weight: 800; color: #1a1a1a; margin-bottom: 12px;
      text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px;
    }
    .card-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-row .label { font-weight: 600; color: #6b7280; white-space: nowrap; font-size: 12px; flex-shrink: 0; }
    .card-row .value { color: #1f2937; font-weight: 500; flex: 1; word-wrap: break-word; }
    .hd-table {
      width: 100%; border-collapse: collapse; margin-bottom: 20px;
      border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden;
    }
    .hd-table thead { background: linear-gradient(135deg, #1f2937 0%, #374151 100%); }
    .hd-table th {
      padding: 12px 10px; font-size: 12px; font-weight: 700; color: #ffffff;
      text-transform: uppercase; letter-spacing: 0.5px; text-align: center;
      border-right: 1px solid rgba(255,255,255,0.1);
    }
    .hd-table th:last-child { border-right: none; }
    .hd-table tbody tr { border-bottom: 1px solid #e5e7eb; }
    .hd-table tbody tr:last-child { border-bottom: none; }
    .hd-table tbody tr:nth-child(even) { background: #f9fafb; }
    .hd-table td { padding: 10px; font-size: 12px; color: #374151; border-right: 1px solid #e5e7eb; }
    .hd-table td:last-child { border-right: none; }
    .hd-table tbody tr.hd-member-group-row { background: #f1f5f9 !important; border-top: 2px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; }
    .hd-table tbody tr.hd-member-group-row td { padding: 8px 10px; color: #0f172a; font-weight: 700; }
    .hd-mg-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .hd-mg-name { font-size: 13px; font-weight: 800; color: #0f172a; }
    .hd-mg-badge { font-size: 11px; font-weight: 700; color: #475569; margin-left: 4px; }
    .hd-mg-meta { font-size: 12px; font-weight: 800; color: #0f172a; white-space: nowrap; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .product-name { font-weight: 600; color: #1f2937; margin-bottom: 2px; }
    .product-note { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 2px; }
    .price-highlight { font-weight: 700; color: #1a1a1a; }
    .col-stt { width: 50px; }
    .col-name { min-width: 180px; }
    .col-size { width: 70px; }
    .col-dvt { width: 60px; }
    .col-qty { width: 50px; }
    .col-price { width: 100px; }
    .col-total { width: 110px; }
    .hd-summary-row {
      display: grid; grid-template-columns: 1fr 420px; gap: 20px; align-items: stretch; margin-bottom: 16px;
    }
    .hd-summary-row.is-no-bank {
      display: flex; justify-content: flex-end;
    }
    .hd-summary-row.is-no-bank .hd-summary {
      width: 420px; max-width: 100%;
    }
    .hd-bank-box {
      background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .bank-title {
      font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;
      border-bottom: 2px solid #334155; padding-bottom: 8px; margin-bottom: 14px; color: #0f172a;
    }
    .bank-list-stack { display: flex; flex-direction: column; gap: 12px; }
    .bank-minicard {
      border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;
      background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .bank-body { display: flex; align-items: center; gap: 20px; margin-bottom: 0; }
    .bank-qr {
      width: 110px; height: 110px; flex-shrink: 0; border: 4px solid #fff;
      outline: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .bank-qr img { width: 100%; height: 100%; object-fit: contain; }
    .bank-text {
      font-size: 13px; color: #0f172a; white-space: pre-line; line-height: 1.6; font-weight: 700;
      display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical;
      overflow: hidden; text-overflow: ellipsis; height: 4.8em;
    }
    .bank-divider { height: 1px; margin: 14px 0; width: 100%; border-top: 1px dashed #94a3b8; background: transparent; }
    .bank-amount {
      background: #fff; border: 2px solid #e2e8f0; border-radius: 10px; padding: 14px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }
    .ba-label { font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
    .ba-value { font-size: 22px; font-weight: 900; color: #000000; letter-spacing: -0.5px; }
    .ba-sub { font-size: 12px; color: #64748b; font-weight: 700; margin-top: 4px; }
    .ba-sub.is-ship-included { color: #0284c7; }
    .ba-sub.is-ship-excluded { color: #64748b; }
    .hd-summary {
      display: flex; flex-direction: column; gap: 8px; margin-left: 0; max-width: 400px;
      padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;
    }
    .summary-title {
      font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
      color: #111827; border-bottom: 1px dashed #94a3b8; padding-bottom: 8px; margin-bottom: 12px; text-align: center;
    }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
    .summary-label { font-size: 13px; color: #6b7280; font-weight: 600; }
    .summary-value { font-size: 14px; color: #1f2937; font-weight: 700; }
    .summary-row.discount .summary-label, .summary-row.discount .summary-value { color: #dc2626; }
    .summary-row.goods-total .summary-label, .summary-row.goods-total .summary-value { color: #111827; font-weight: 700; border-top: 1px dashed #d1d5db; padding-top: 8px; }
    .summary-row.shipping .summary-label, .summary-row.shipping .summary-value { color: #0284c7; font-weight: 700; }
    .summary-row.total { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 8px; }
    .summary-row.total .summary-label { font-size: 15px; color: #1a1a1a; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-row.total .summary-value { font-size: 18px; color: #1a1a1a; font-weight: 900; }
    .summary-row.subtotal .summary-label, .summary-row.subtotal .summary-value,
    .summary-row.payment .summary-label, .summary-row.payment .summary-value { font-weight: 800; color: #111827; }
    .summary-row.payment { border-top: 1px solid #d1d5db; padding-top: 8px; margin-top: 4px; }
    .summary-row.promo { margin-top: 4px; padding-top: 6px; border-top: 1px dashed #cbd5e1; gap: 10px; align-items: flex-start; }
    .summary-row.promo .summary-label { color: #047857; font-weight: 800; flex-shrink: 0; }
    .summary-row.promo .summary-value { color: #059669; font-weight: 700; text-align: right; }
    .hd-promo-next { margin-top: 6px; padding: 6px 10px; border-radius: 6px; background: #fffbeb; border: 1px solid #fde68a; text-align: center; }
    .hd-promo-next-text { font-size: 12px; font-weight: 700; color: #b45309; line-height: 1.35; }
    .hd-footer-note { text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb; }
    .footer-line { font-size: 12px; color: #6b7280; font-weight: 500; margin: 4px 0; font-style: italic; }
    .footer-web { font-size: 12px; color: #1f2937; font-weight: 800; letter-spacing: 0.6px; margin-top: 6px; }
  `
}

function buildInvoiceViewerShellHtml(safeTitle, fileName) {
  const escapedTitle = String(safeTitle || 'Ảnh hóa đơn').replace(/[<>&"]/g, '')
  const escapedFile = String(fileName || 'hoa-don.png').replace(/[^a-zA-Z0-9._-]/g, '_')
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .bar {
      position: sticky;
      top: 0;
      z-index: 20;
      width: 100%;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      padding: 12px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }
    .btn {
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      transition: transform 0.12s ease, opacity 0.2s ease, background-color 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn:not(:disabled):hover { opacity: 0.92; transform: translateY(-1px); }
    .btn:not(:disabled):active { transform: scale(0.97); }
    .btn-download { background: linear-gradient(135deg, #16a34a, #22c55e); }
    .btn-copy { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .btn-copy.copied { background: linear-gradient(135deg, #059669, #10b981); }
    .btn-print { background: linear-gradient(135deg, #2563eb, #3b82f6); }
    .stage {
      width: 100%;
      max-width: 860px;
      padding: 18px 14px 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .status-note {
      display: none;
      width: 100%;
      max-width: 680px;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(245, 158, 11, 0.16);
      border: 1px solid rgba(245, 158, 11, 0.45);
      color: #fde68a;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
    }
    .status-note.error {
      background: rgba(239, 68, 68, 0.16);
      border-color: rgba(239, 68, 68, 0.45);
      color: #fecaca;
    }
    .loader-box {
      margin-top: 40px;
      padding: 28px 32px;
      border-radius: 14px;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #e2e8f0;
      font-size: 14px;
      font-weight: 600;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid rgba(148, 163, 184, 0.25);
      border-top-color: #38bdf8;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #img {
      display: none;
      width: 100%;
      max-width: 800px;
      height: auto;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
    }
    @media (max-width: 480px) {
      .bar { padding: 10px; gap: 8px; }
      .btn { flex: 1; min-width: 100px; padding: 10px 12px; font-size: 13px; }
      .stage { padding: 12px 10px 28px; }
    }
    @media print {
      body { background: #ffffff !important; }
      .bar, .status-note, .loader-box { display: none !important; }
      .stage { padding: 0 !important; max-width: none !important; }
      #img { display: block !important; box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="bar">
    <button id="btn-download" class="btn btn-download" disabled onclick="handleDownload()">Tải ảnh PNG</button>
    <button id="btn-copy" class="btn btn-copy" disabled onclick="handleCopy()">Copy ảnh</button>
    <button id="btn-print" class="btn btn-print" disabled onclick="window.print()">In hóa đơn</button>
  </div>
  <div class="stage">
    <div id="status-note" class="status-note"></div>
    <div id="loader" class="loader-box">
      <div class="spinner"></div>
      <div>Đang tạo ảnh hóa đơn...</div>
    </div>
    <img id="img" alt="Hóa đơn bán hàng" />
  </div>
  <script>
    window.__invoiceFileName = ${JSON.stringify(escapedFile)};
    window.setInvoiceImage = function(dataUrl, fileName) {
      if (fileName) window.__invoiceFileName = fileName;
      var img = document.getElementById('img');
      var loader = document.getElementById('loader');
      img.onload = function() {
        if (loader) loader.style.display = 'none';
        img.style.display = 'block';
        document.getElementById('btn-download').disabled = false;
        document.getElementById('btn-copy').disabled = false;
        document.getElementById('btn-print').disabled = false;
      };
      img.src = dataUrl;
    };
    window.setInvoiceError = function(msg) {
      var loader = document.getElementById('loader');
      var note = document.getElementById('status-note');
      if (loader) loader.style.display = 'none';
      if (note) {
        note.textContent = msg || 'Không thể tạo ảnh hóa đơn.';
        note.className = 'status-note error';
        note.style.display = 'block';
      }
    };
    function showNote(msg) {
      var note = document.getElementById('status-note');
      if (!note) return;
      note.textContent = msg;
      note.className = 'status-note';
      note.style.display = 'block';
    }
    function handleDownload() {
      var img = document.getElementById('img');
      if (!img || !img.src) return;
      var a = document.createElement('a');
      a.href = img.src;
      a.download = window.__invoiceFileName || 'hoa-don.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    async function toPngBlob(imgEl) {
      try {
        var r = await fetch(imgEl.src);
        var b = await r.blob();
        if (b && b.type === 'image/png') return b;
      } catch (e) {}
      var c = document.createElement('canvas');
      c.width = imgEl.naturalWidth || 800;
      c.height = imgEl.naturalHeight || 1000;
      c.getContext('2d').drawImage(imgEl, 0, 0);
      return await new Promise(function(resolve) { c.toBlob(resolve, 'image/png'); });
    }
    async function handleCopy() {
      var btn = document.getElementById('btn-copy');
      var img = document.getElementById('img');
      if (!img || !img.src) return;
      try {
        var pngBlob = await toPngBlob(img);
        if (!pngBlob) throw new Error('Không tạo được PNG blob');
        var item = new ClipboardItem({ 'image/png': pngBlob });
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([item]);
        } else if (window.opener && window.opener.navigator && window.opener.navigator.clipboard && window.opener.navigator.clipboard.write) {
          await window.opener.navigator.clipboard.write([item]);
        } else {
          throw new Error('Clipboard API unsupported');
        }
        btn.textContent = '✓ Đã copy ảnh!';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.textContent = 'Copy ảnh';
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Copy image error:', err);
        showNote('Trình duyệt không cho phép copy tự động ở chế độ này. Bạn hãy nhấn chuột phải vào ảnh chọn "Sao chép hình ảnh" (hoặc nhấn giữ ảnh trên điện thoại) hoặc bấm "Tải ảnh PNG".');
      }
    }
  <${'/'}script>
</body>
</html>`
}

async function renderInvoiceCanvasIsolated() {
  const srcEl = hoaDonRef.value
  if (!srcEl) throw new Error('Không tìm thấy mẫu hóa đơn')

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;left:-12000px;top:0;width:820px;height:2000px;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  try {
    const idoc = iframe.contentDocument
    if (!idoc) throw new Error('Không khởi tạo được vùng render hóa đơn')

    idoc.open()
    idoc.write(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${buildIsolatedInvoiceStyles()}</style></head><body>${srcEl.outerHTML}</body></html>`,
    )
    idoc.close()

    // Convert dynamic SVG QR codes inside isolated invoice to data:image/svg+xml imgs for crisp html2canvas capture
    for (const svgEl of Array.from(idoc.querySelectorAll('svg.bank-qr-svg'))) {
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      const svgMarkup = new XMLSerializer().serializeToString(svgEl)
      const imgReplacement = idoc.createElement('img')
      imgReplacement.setAttribute(
        'src',
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`,
      )
      imgReplacement.setAttribute('alt', 'QR')
      svgEl.replaceWith(imgReplacement)
    }

    const imgs = Array.from(idoc.querySelectorAll('img'))
    await Promise.race([
      Promise.all(
        imgs.map((imgEl) => {
          const rawSrc = imgEl.getAttribute('src') || ''
          if (rawSrc.startsWith('data:')) {
            return imgEl.complete
              ? Promise.resolve()
              : new Promise((res) => {
                  imgEl.onload = res
                  imgEl.onerror = res
                })
          }
          // Với ảnh URL ngoài: dùng CORS để không làm tainted canvas; lỗi CORS thì ẩn ảnh đó
          return new Promise((res) => {
            imgEl.crossOrigin = 'anonymous'
            imgEl.onload = () => res()
            imgEl.onerror = () => {
              imgEl.remove()
              res()
            }
            imgEl.src = rawSrc
          })
        }),
      ),
      new Promise((res) => setTimeout(res, 1800)),
    ])

    // Gỡ mọi ảnh http còn dang dở để chắc chắn không taint canvas khi toDataURL
    for (const imgEl of Array.from(idoc.querySelectorAll('img'))) {
      const s = imgEl.getAttribute('src') || ''
      if (!s.startsWith('data:') && !imgEl.complete) {
        imgEl.remove()
      }
    }

    const captureEl = idoc.querySelector('.hoa-don-print')
    if (!captureEl) throw new Error('Không tìm thấy vùng hóa đơn cô lập')

    const isMobileDevice =
      window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    return await html2canvas(captureEl, {
      scale: isMobileDevice ? 1.5 : 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 2000,
      removeContainer: true,
      width: 800,
      windowWidth: 800,
      windowHeight: Math.max(captureEl.scrollHeight || 900, 900),
    })
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }
}

const hoaDonRef = ref(null)

const isExportCostMode = computed(() => exportPriceMode.value === 'giaGoc')
const isExportByMember = computed(() => exportGroupMode.value === 'by_member')

const exportTableColSpan = computed(
  () => 5 + (hasAnySize.value ? 1 : 0) + (hasAnyDvt.value ? 1 : 0),
)

const totalCostAmount = computed(() =>
  items.value.reduce((s, i) => s + getOrderItemGiaGoc(i) * Number(i?.soLuong ?? i?.So_luong ?? 0), 0),
)

function getExportItemUnitPrice(item) {
  return isExportCostMode.value
    ? getOrderItemGiaGoc(item)
    : Number(item?.giaBan ?? item?.Gia_ban ?? 0)
}

function getExportItemLineTotal(item) {
  if (isExportCostMode.value) {
    const qty = Number(item?.soLuong ?? item?.So_luong ?? 0)
    return getOrderItemGiaGoc(item) * qty
  }
  return Number(item?.thanhTien ?? item?.Thanh_tien ?? 0) - Number(item?.tongGiamTru || 0)
}

const exportGroupedRows = computed(() => {
  const groups = new Map()
  for (const item of items.value) {
    const rawCode = String(item?.maHang || item?.Ma_hang || '').trim()
    const codeKey = rawCode || item?.tenHang || ''
    const sizeKey = item?.size || item?.Size || ''
    const dvtKey = item?.dvt || item?.Dvt || ''
    const currency = item?.donViTienTe || item?.Don_vi_tien_te || 'P'
    const unitPrice = getExportItemUnitPrice(item)
    const gKey = `${codeKey}__${sizeKey}__${dvtKey}__${currency}__${unitPrice}`

    if (!groups.has(gKey)) {
      groups.set(gKey, {
        groupKey: gKey,
        tenHang: item?.tenHang || item?.Ten_hang || '',
        size: sizeKey,
        dvt: dvtKey,
        donViTienTe: currency,
        soLuong: 0,
        unitPrice,
        lineTotal: 0,
        notesSet: new Set(),
      })
    }

    const grp = groups.get(gKey)
    grp.soLuong += Number(item?.soLuong ?? item?.So_luong ?? 0)
    grp.lineTotal += getExportItemLineTotal(item)
    const noteStr = String(item?.ghiChuHang || item?.Ghi_chu || '').trim()
    if (noteStr) grp.notesSet.add(noteStr)
  }

  return Array.from(groups.values()).map((grp) => ({
    ...grp,
    ghiChuHang: Array.from(grp.notesSet).join('; '),
  }))
})

const exportMemberSections = computed(() => {
  const nonEmpty = invoiceMemberGroups.value.filter(
    (grp) => grp.entries && grp.entries.length > 0,
  )
  const nameTotals = new Map()
  for (const grp of nonEmpty) {
    if (grp.role === 'admin') continue
    const lower = String(grp.name || '').trim().toLowerCase()
    if (lower) nameTotals.set(lower, (nameTotals.get(lower) || 0) + 1)
  }
  const nameSeen = new Map()

  return nonEmpty.map((grp) => {
    const lower = String(grp.name || '').trim().toLowerCase()
    let displayName = grp.name
    if (grp.role !== 'admin' && lower && (nameTotals.get(lower) || 0) > 1) {
      const seq = (nameSeen.get(lower) || 0) + 1
      nameSeen.set(lower, seq)
      displayName = `${grp.name} (#${seq})`
    }

    const rows = grp.entries.map(({ item }) => ({
      tenHang: item?.tenHang || item?.Ten_hang || '',
      ghiChuHang: String(item?.ghiChuHang || item?.Ghi_chu || '').trim(),
      size: item?.size || item?.Size || '',
      dvt: item?.dvt || item?.Dvt || '',
      soLuong: Number(item?.soLuong ?? item?.So_luong ?? 0),
      donViTienTe: item?.donViTienTe || item?.Don_vi_tien_te || 'P',
      unitPrice: getExportItemUnitPrice(item),
      lineTotal: getExportItemLineTotal(item),
    }))
    const sectionTotal = rows.reduce((s, r) => s + r.lineTotal, 0)
    return {
      groupKey: grp.groupKey,
      name: displayName,
      badge: grp.badge,
      totalQty: grp.totalQty,
      sectionTotal,
      rows,
    }
  })
})

const exportTamTinh = computed(() => (isExportCostMode.value ? totalCostAmount.value : tamTinh.value))

const exportShippingFee = computed(() => (!isExportCostMode.value ? normalizedPhiShip.value : 0))

const exportTongCong = computed(() =>
  isExportCostMode.value ? totalCostAmount.value : tongCong.value + exportShippingFee.value,
)

const exportTongChuyenKhoan = computed(() => {
  const rate = Number(tiGia.value || 1)
  return exportTongCong.value * rate
})

function selectExportPriceMode(mode) {
  exportPriceMode.value = mode
  isTextCopied.value = false
}

function selectExportGroupMode(mode) {
  exportGroupMode.value = mode
  isTextCopied.value = false
}

function closeExportPriceChoiceModal() {
  showExportPriceChoiceModal.value = false
  pendingExportAction.value = ''
}

function confirmExportOptions(groupMode, priceMode) {
  exportGroupMode.value = groupMode
  exportPriceMode.value = priceMode
  isTextCopied.value = false
  const action = pendingExportAction.value
  pendingExportAction.value = ''
  showExportPriceChoiceModal.value = false
  if (action === 'image') {
    executePreviewHoaDon()
  } else if (action === 'text') {
    showTextInvoice.value = true
  }
}

function previewHoaDon() {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }
  if (isPreviewing.value) return
  pendingExportAction.value = 'image'
  showExportPriceChoiceModal.value = true
}

async function executePreviewHoaDon() {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }

  if (isPreviewing.value) return
  isPreviewing.value = true

  const groupSuffix = isExportByMember.value ? '-tung-nguoi' : '-gop'
  const modeSuffix = isExportCostMode.value ? '-gia-goc' : ''
  const fileName = `hoa-don-${maHoaDon.value || 'export'}${groupSuffix}${modeSuffix}.png`
  const titleParts = []
  if (isExportByMember.value) titleParts.push('Từng người')
  if (isExportCostMode.value) titleParts.push('Giá gốc')
  const titleSuffix = titleParts.length ? ` (${titleParts.join(' · ')})` : ''
  // Mở tab mới ngay khi bấm để 0ms trễ và không bị trình duyệt chặn popup
  const win = window.open('', '_blank')
  if (win && !win.closed) {
    win.document.open()
    win.document.write(buildInvoiceViewerShellHtml(`Hóa đơn ${maHoaDon.value || ''}${titleSuffix}`, fileName))
    win.document.close()
  }

  await nextTick()

  try {
    const canvas = await renderInvoiceCanvasIsolated()
    const pngDataUrl = canvas.toDataURL('image/png')
    invoiceImageUrl.value = pngDataUrl

    if (win && !win.closed && typeof win.setInvoiceImage === 'function') {
      win.setInvoiceImage(pngDataUrl, fileName)
    } else if (!win || win.closed) {
      // Fallback nếu popup bị trình duyệt chặn
      const link = document.createElement('a')
      link.href = pngDataUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast('info', 'Popup bị chặn. Đã tự động tải ảnh hóa đơn!')
    }
  } catch (err) {
    console.error('Lỗi tạo ảnh hóa đơn:', err)
    if (win && !win.closed && typeof win.setInvoiceError === 'function') {
      win.setInvoiceError('Không thể xuất ảnh hóa đơn. Vui lòng thử lại hoặc dùng "Xuất hóa đơn (chữ)".')
    }
    toast('error', 'Không thể tạo ảnh hóa đơn. Vui lòng dùng "Xuất hóa đơn (chữ)" thay thế.')
  } finally {
    isPreviewing.value = false
  }
}

const showTextInvoice = ref(false)
const textInvoiceRef = ref(null)
const isTextCopied = ref(false)

const textInvoice = computed(() =>
  buildOrderTextInvoice({
    items: items.value,
    tenKhachHang: form.tenKhachHang,
    diaChi: form.diaChi,
    soDienThoai: form.soDienThoai,
    thoiGianNhanHang: formatDateTimeVN(new Date(thoiGianNhanHang.value)),
    hinhThucThanhToan: hinhThucThanhToan.value,
    tongCong: tongCong.value,
    phiShip: normalizedPhiShip.value,
    ckBaoGomShip: ckBaoGomShip.value,
    ghiChuDonHang: form.ghiChuDonHang,
    khuyenMaiText: khuyenMaiText.value,
    nextMilestoneHintText: nextMilestoneHintText.value,
    donViTienTe: donViTienTeChung.value,
    groupMode: exportGroupMode.value,
    priceMode: exportPriceMode.value,
    hangHoaByMaMap: hangHoaByMaMap.value,
    customOrderMembers: customOrderMembers.value,
  }),
)

function openTextInvoice() {
  if (!items.value.length) {
    toast('warn', 'Chưa có hàng trong đơn')
    return
  }
  pendingExportAction.value = 'text'
  showExportPriceChoiceModal.value = true
}

function copyTextInvoice() {
  navigator.clipboard.writeText(textInvoice.value)
  toast('success', 'Đã copy hóa đơn')
  
  isTextCopied.value = true
  setTimeout(() => {
    isTextCopied.value = false
  }, 2000)
}

function openEditItem(item, idx, siblingEntries = []) {
  editIndex.value = idx
  const cloned = JSON.parse(JSON.stringify(item))
  cloned.giaGoc = getOrderItemGiaGoc(cloned)
  cloned.dvt = String(cloned.dvt ?? cloned.Dvt ?? '').trim()
  cloned.Dvt = cloned.dvt
  cloned.Dvt_custom = Boolean(cloned.Dvt_custom)
  cloned.nccLoaiGiam = normalizeNccDiscountType(cloned.Ncc_loai_giam ?? cloned.nccLoaiGiam)
  cloned.nccGiaTriGiam = normalizeNccDiscountValue(cloned.Ncc_gia_tri_giam ?? cloned.nccGiaTriGiam)
  Object.assign(editItem, cloned)
  const hint = getOrderPrimaryMemberHint(items.value)
  editItemMemberKey.value = resolveMemberGroupKeyForItem(item, hint)
  editModalSiblings.value = Array.isArray(siblingEntries) && siblingEntries.length > 1 ? siblingEntries : []
  showEditModal.value = true
}

function switchEditModalSibling(sib) {
  if (!sib || sib.idx === undefined) return
  const liveItem = items.value[sib.idx] || sib.item
  if (!liveItem) return
  editIndex.value = sib.idx
  const cloned = JSON.parse(JSON.stringify(liveItem))
  cloned.giaGoc = getOrderItemGiaGoc(cloned)
  cloned.dvt = String(cloned.dvt ?? cloned.Dvt ?? '').trim()
  cloned.Dvt = cloned.dvt
  cloned.Dvt_custom = Boolean(cloned.Dvt_custom)
  cloned.nccLoaiGiam = normalizeNccDiscountType(cloned.Ncc_loai_giam ?? cloned.nccLoaiGiam)
  cloned.nccGiaTriGiam = normalizeNccDiscountValue(cloned.Ncc_gia_tri_giam ?? cloned.nccGiaTriGiam)
  Object.assign(editItem, cloned)
  const hint = getOrderPrimaryMemberHint(items.value)
  editItemMemberKey.value = resolveMemberGroupKeyForItem(liveItem, hint)
}

function deleteItem(idx) {
  if (confirm(`Xóa hàng "${items.value[idx].tenHang}" khỏi đơn?`)) {
    items.value.splice(idx, 1)
  }
}

function saveEditItem() {
  const i = editItem

  const hang = hangHoaList.value.find(h => h.Ma_hang === i.maHang)
  if (hang && isOutOfStock(hang)) {
    toast('error', '❌ Sản phẩm này đang ở trạng thái HẾT HÀNG!')
    return
  }

  const d = calcDiscount(i.giaBan, i.soLuong, i.giamGia, i.chietKhau)
  const nccLoaiGiam = normalizeNccDiscountType(i.nccLoaiGiam ?? i.Ncc_loai_giam)
  const nccGiaTriGiam = normalizeNccDiscountValue(i.nccGiaTriGiam ?? i.Ncc_gia_tri_giam)
  i.giaGoc = Math.max(0, Number(i.giaGoc || 0))
  i.giaBan = Math.max(0, Number(i.giaBan || 0))

  i.thanhTien = i.giaBan * i.soLuong
  i.tongGiamGiaTien = d.giamGiaTien
  i.tongChietKhauTien = d.chietKhauTien
  i.tongGiamTru = d.tongGiamTru
  i.tongGiamGiaDong = d.tongGiamTru

  i.loiNhuan = calcOrderLineProfit({
    giaBan: i.giaBan,
    giaGoc: i.giaGoc,
    soLuong: i.soLuong,
    giamGia: i.giamGia,
    ck1sp: d.ck1sp,
    nccLoaiGiam,
    nccGiaTriGiam,
  })

  i.Ncc_loai_giam = nccLoaiGiam
  i.Ncc_gia_tri_giam = nccGiaTriGiam
  i.nccLoaiGiam = nccLoaiGiam
  i.nccGiaTriGiam = nccGiaTriGiam
  i.Tien_chiet_khau = d.chietKhauTien
  i.Thanh_tien = i.thanhTien
  i.Loi_nhuan = i.loiNhuan
  i.So_luong = i.soLuong
  i.Gia_goc = i.giaGoc
  i.Gia_ban = i.giaBan
  i.Giam_gia = i.giamGia
  i.Ghi_chu = i.ghiChuHang || '' // ✅ CẬP NHẬT GHI CHÚ HÀNG
  const prevDvt = String(items.value[editIndex.value]?.dvt ?? items.value[editIndex.value]?.Dvt ?? '').trim()
  const nextDvt = String(i.dvt ?? '').trim()
  i.dvt = nextDvt
  i.Dvt = nextDvt
  if (nextDvt !== prevDvt || items.value[editIndex.value]?.Dvt_custom) {
    i.Dvt_custom = true
  }

  if (showMemberTargetBar.value && editItemMemberKey.value) {
    const chosenMember = invoiceOrderMembers.value.find(
      (m) => m.groupKey === editItemMemberKey.value,
    )
    if (chosenMember) {
      i.Nguoi_dat = chosenMember.role === 'admin' ? 'Quán thêm' : chosenMember.name
      i.Nguoi_dat_id = chosenMember.memberId || ''
      i.Added_by_role = chosenMember.role || 'host'
    }
  }

  items.value[editIndex.value] = { ...i }

  showEditModal.value = false
  editModalSiblings.value = []
}

const hoaDonNCCRef = ref(null)

const giaGiamHienThi = computed(() => {
  if (!form.maHang) return 0
  
  const h = hangHoaList.value.find(x => x.Ma_hang === form.maHang)
  return h ? Number(h.Gia_Giam || 0) : 0
})

const giaGocBan = computed(() => {
  if (!form.maHang) return 0
  
  const h = hangHoaList.value.find(x => x.Ma_hang === form.maHang)
  return h ? Number(h.Gia_ban || 0) : 0
})

// ✨ FUNCTION LẤY ICON CHO CONTACT
function getContactIcon(platform) {
  const iconMap = {
    'Zalo': 'ri-smartphone-line',
    'Facebook': 'ri-facebook-box-line',
    'Telegram': 'ri-telegram-line',
    'WhatsApp': 'ri-whatsapp-line',
    'Instagram': 'ri-instagram-line',
    'TikTok': 'ri-tiktok-line',
    'Phone': 'ri-phone-line',
    'Email': 'ri-mail-line',
    'Website': 'ri-global-line'
  }
  return iconMap[platform] || 'ri-customer-service-2-line'
}

/* ================= CATALOG FUNCTIONS ================= */
function decreaseQty(product) {
  if (productQty[product.Ma_hang] > 1) {
    productQty[product.Ma_hang]--
  }
}

function increaseQty(product) {
  if (!isOutOfStock(product)) {
    productQty[product.Ma_hang] = (productQty[product.Ma_hang] || 1) + 1
  }
}

function getStockClass(productOrStatus) {
  if (typeof productOrStatus === 'object' && productOrStatus !== null) {
    return isOutOfStock(productOrStatus) ? 'stock-out' : 'stock-ok'
  }
  return String(productOrStatus || '').trim() === 'Hết hàng' ? 'stock-out' : 'stock-ok'
}

const addedSuccess = reactive({})

function findProductOrderIndex(product, targetMember = getTargetMemberPayload()) {
  if (!product) return -1
  const maHangKey = product.Ma_hang
  const sizeKey = product.Size || ''
  const dvtKey = product.Dvt || ''

  return items.value.findIndex(
    (i) =>
      (i.Ma_hang || i.maHang) === maHangKey &&
      (i.Size ?? i.size ?? '') === sizeKey &&
      (i.Dvt ?? i.dvt ?? '') === dvtKey &&
      isSameItemOwner(i, targetMember),
  )
}

function getProductEffectivePrices(product) {
  const giaGoc = Number(product?.Gia_goc) || 0
  const giaBan =
    product?.Gia_Giam && Number(product.Gia_Giam) > 0
      ? Number(product.Gia_Giam)
      : Number(product?.Gia_ban) || 0
  return { giaGoc, giaBan }
}

function applyExistingOrderItemQty(existingItem, product, newQty, targetMember, ghiChuMoi = '') {
  const { giaGoc, giaBan } = getProductEffectivePrices(product)
  const chietKhau = Number(existingItem.chietKhau ?? existingItem.Chiet_khau ?? 0)
  const giamGia = Number(existingItem.giamGia ?? existingItem.Giam_gia ?? 0)

  const d = calcDiscount(giaBan, newQty, giamGia, chietKhau)
  const Thanh_tien = giaBan * newQty
  const nccLoaiGiam = normalizeNccDiscountType(
    existingItem.Ncc_loai_giam ?? existingItem.nccLoaiGiam ?? product?.Ncc_loai_giam,
  )
  const nccGiaTriGiam = normalizeNccDiscountValue(
    existingItem.Ncc_gia_tri_giam ?? existingItem.nccGiaTriGiam ?? product?.Ncc_gia_tri_giam,
  )
  const Loi_nhuan = calcOrderLineProfit({
    giaBan,
    giaGoc,
    soLuong: newQty,
    giamGia,
    ck1sp: d.ck1sp,
    nccLoaiGiam,
    nccGiaTriGiam,
  })

  existingItem.So_luong = newQty
  existingItem.soLuong = newQty
  existingItem.Tien_chiet_khau = d.chietKhauTien
  existingItem.Ncc_loai_giam = nccLoaiGiam
  existingItem.Ncc_gia_tri_giam = nccGiaTriGiam
  existingItem.nccLoaiGiam = nccLoaiGiam
  existingItem.nccGiaTriGiam = nccGiaTriGiam
  existingItem.Thanh_tien = Thanh_tien
  existingItem.thanhTien = Thanh_tien
  existingItem.tongGiamGiaTien = d.giamGiaTien
  existingItem.tongChietKhauTien = d.chietKhauTien
  existingItem.tongGiamTru = d.tongGiamTru
  existingItem.tongGiamGiaDong = d.tongGiamTru
  existingItem.Loi_nhuan = Loi_nhuan
  existingItem.loiNhuan = Loi_nhuan
  if (!existingItem.Nguoi_dat && targetMember.Nguoi_dat) existingItem.Nguoi_dat = targetMember.Nguoi_dat
  if (!existingItem.Nguoi_dat_id && targetMember.Nguoi_dat_id) existingItem.Nguoi_dat_id = targetMember.Nguoi_dat_id
  if (!existingItem.Added_by_role && targetMember.Added_by_role) existingItem.Added_by_role = targetMember.Added_by_role

  if (ghiChuMoi && ghiChuMoi !== existingItem.Ghi_chu) {
    existingItem.Ghi_chu = existingItem.Ghi_chu
      ? `${existingItem.Ghi_chu}, ${ghiChuMoi}`
      : ghiChuMoi
    existingItem.ghiChuHang = existingItem.Ghi_chu
  }
}

function buildNewOrderItem(product, qtyToAdd, ghiChuMoi, targetMember) {
  const { giaGoc, giaBan } = getProductEffectivePrices(product)
  const chietKhau = 0
  const giamGia = 0
  const d = calcDiscount(giaBan, qtyToAdd, giamGia, chietKhau)
  const nccLoaiGiam = normalizeNccDiscountType(product?.Ncc_loai_giam)
  const nccGiaTriGiam = normalizeNccDiscountValue(product?.Ncc_gia_tri_giam)
  const loiNhuan = calcOrderLineProfit({
    giaBan,
    giaGoc,
    soLuong: qtyToAdd,
    giamGia,
    ck1sp: d.ck1sp,
    nccLoaiGiam,
    nccGiaTriGiam,
  })
  const thanhTien = giaBan * qtyToAdd

  return {
    Ma_hoa_don: maHoaDon.value,
    So_hoa_don: soHoaDon.value,
    Ngay_tao_duong_lich: formatDateTimeVN(),
    Ma_hang: product.Ma_hang,
    Ten_hang: product.Ten_hang,
    Trang_thai: product.Trang_thai,
    Danh_muc: product.Danh_muc,
    Size: product.Size,
    Dvt: product.Dvt,
    Don_vi_tien_te: product.Don_vi_tien_te || 'P',
    donViTienTe: product.Don_vi_tien_te || 'P',
    So_luong: qtyToAdd,
    Gia_goc: giaGoc,
    Gia_ban: giaBan,
    Giam_gia: giamGia,
    Tien_chiet_khau: d.chietKhauTien,
    Ncc_loai_giam: nccLoaiGiam,
    Ncc_gia_tri_giam: nccGiaTriGiam,
    nccLoaiGiam,
    nccGiaTriGiam,
    Thanh_tien: thanhTien,
    Loi_nhuan: loiNhuan,
    Ghi_chu: ghiChuMoi,
    ghiChuHang: ghiChuMoi,
    Nguoi_dat: targetMember.Nguoi_dat,
    Nguoi_dat_id: targetMember.Nguoi_dat_id,
    Added_by_role: targetMember.Added_by_role,
    soLuong: qtyToAdd,
    giaGoc: giaGoc,
    giaBan: giaBan,
    chietKhau: chietKhau,
    giamGia: giamGia,
    thanhTien,
    loiNhuan,
    tongGiamGiaTien: d.giamGiaTien,
    tongChietKhauTien: d.chietKhauTien,
    tongGiamTru: d.tongGiamTru,
    tongGiamGiaDong: d.tongGiamTru,
    maHang: product.Ma_hang,
    tenHang: product.Ten_hang,
    size: product.Size,
    dvt: product.Dvt,
    danhMuc: product.Danh_muc,
    trangThai: product.Trang_thai,
  }
}

function getMobileCartQty(product) {
  if (!product) return 0
  const idx = findProductOrderIndex(product)
  if (idx === -1) return 0
  return Number(items.value[idx]?.So_luong || items.value[idx]?.soLuong || 0)
}

function setMobileCartQty(product, rawQty) {
  if (!product) return
  const parsed = Number(rawQty)
  const targetQty = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
  const targetMember = getTargetMemberPayload()
  const existingIdx = findProductOrderIndex(product, targetMember)
  const currentQty = existingIdx > -1 ? Number(items.value[existingIdx]?.So_luong || 0) : 0

  if (targetQty > currentQty && isOutOfStock(product)) {
    toast('error', 'Sản phẩm đang ở trạng thái HẾT HÀNG!')
    return
  }

  if (targetQty === 0) {
    if (existingIdx > -1) {
      items.value.splice(existingIdx, 1)
    }
    return
  }

  const ghiChuMoi = (productNotes[product.Ma_hang] || '').trim()
  if (existingIdx > -1) {
    applyExistingOrderItemQty(items.value[existingIdx], product, targetQty, targetMember, ghiChuMoi)
    highlightRow(existingIdx)
  } else {
    items.value.push(buildNewOrderItem(product, targetQty, ghiChuMoi, targetMember))
    highlightRow(items.value.length - 1)
  }

  if (ghiChuMoi) {
    productNotes[product.Ma_hang] = ''
  }
  notePopoverOpen[product.Ma_hang] = false
  highlightCard(product.Ma_hang)
}

function adjustMobileCartQty(product, delta) {
  const currentQty = getMobileCartQty(product)
  setMobileCartQty(product, currentQty + delta)
}

function onProductCardClick(product) {
  if (isMobile.value) {
    adjustMobileCartQty(product, 1)
    return
  }
  openProductDetail(product)
}

function saveMobileProductNote(product) {
  if (!product) return
  notePopoverOpen[product.Ma_hang] = false
  const noteVal = (productNotes[product.Ma_hang] || '').trim()
  if (!noteVal) return

  const existingIdx = findProductOrderIndex(product)
  if (existingIdx > -1) {
    const existingItem = items.value[existingIdx]
    if (noteVal !== existingItem.Ghi_chu) {
      existingItem.Ghi_chu = existingItem.Ghi_chu
        ? `${existingItem.Ghi_chu}, ${noteVal}`
        : noteVal
      existingItem.ghiChuHang = existingItem.Ghi_chu
    }
    productNotes[product.Ma_hang] = ''
    highlightRow(existingIdx)
  }
}

function addProductToCart(product) {
  const qtyToAdd = productQty[product.Ma_hang] || 1
  const ghiChuMoi = productNotes[product.Ma_hang] || ''

  if (isOutOfStock(product)) {
    toast('error', 'Sản phẩm đang ở trạng thái HẾT HÀNG!')
    return
  }

  const targetMember = getTargetMemberPayload()
  const existingItemIndex = findProductOrderIndex(product, targetMember)

  if (existingItemIndex > -1) {
    const existingItem = items.value[existingItemIndex]
    const newQty = existingItem.So_luong + qtyToAdd
    applyExistingOrderItemQty(existingItem, product, newQty, targetMember, ghiChuMoi)

    const ownerSuffix = showMemberTargetBar.value && targetMember.Nguoi_dat ? ` (${targetMember.Nguoi_dat})` : ''
    toast('success', `✅ Đã cộng dồn +${qtyToAdd} vào ${product.Ten_hang}${ownerSuffix}`)
    highlightRow(existingItemIndex)
  } else {
    items.value.push(buildNewOrderItem(product, qtyToAdd, ghiChuMoi, targetMember))
    highlightRow(items.value.length - 1)
  }

  // Trigger Success State
  addedSuccess[product.Ma_hang] = true
  setTimeout(() => {
    addedSuccess[product.Ma_hang] = false
  }, 1500)

  // Reset local state
  productQty[product.Ma_hang] = 1
  productNotes[product.Ma_hang] = ''
  notePopoverOpen[product.Ma_hang] = false
  highlightCard(product.Ma_hang)
}

function openProductDetail(product) {
  selectedProduct.value = product
  currentMainImage.value = product.Main_img_base64 || product.Main_img || ''
  showProductDetail.value = true
}

function changeMainImage(imgSrc) {
  currentMainImage.value = imgSrc
}

function cardImg(product) {
  if (!product) return ''
  const steps = [
    product.Main_img_base64,
    product.Main_img,
    product.img_1_base64,
    product.img_1,
    product.img_2_base64,
    product.img_2,
    product.img_3_base64,
    product.img_3,
    product.img_4_base64,
    product.img_4,
    product.img_5_base64,
    product.img_5,
    product.img_6_base64,
    product.img_6,
  ].filter(Boolean)
  const step = cardImgStep[product.Ma_hang] || 0
  return steps[step] || ''
}

function onCardImgError(product) {
  if (!product) return
  const current = cardImgStep[product.Ma_hang] || 0
  cardImgStep[product.Ma_hang] = current + 1
}
</script>





<style scoped>
/* ===== COLOR VARIABLES (GREEN ACCENT THEME) ===== */
.page {
  --accent-green: #22c55e;
  --accent-green-dark: #16a34a;
  --accent-green-darker: #15803d;
  --accent-green-glow: rgba(34, 197, 94, 0.25);
  --accent-green-light: rgba(34, 197, 94, 0.15);
}

.status-dot-green {
  width: 8px;
  height: 8px;
  background-color: var(--accent-green);
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 12px var(--accent-green);
  animation: dot-pulse-green 2s infinite;
  flex-shrink: 0;
}

@keyframes dot-pulse-green {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.page {
  max-width: none !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 12px; /* Reduced padding */
  background: rgb(15, 23, 42);
  color: #e2e8f0;
  box-sizing: border-box;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page * {
  box-sizing: border-box;
}

.box {
  background: rgba(2, 6, 23, 0.72);
  padding: 18px;
  margin-bottom: 0;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 12px 32px rgba(2, 6, 23, 0.45);
  backdrop-filter: blur(8px);
}

/* Section Headers: Customer, Delivery, Summary, Payment */
.box h3,
h3.card-title {
  margin: 0 0 14px 0;
  font-size: 16px;
  font-weight: 700;
  color: #10b981 !important; /* Green text */
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important; /* Left align */
  gap: 10px !important;
  text-align: left !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px dashed rgba(16, 185, 129, 0.2);
  padding-bottom: 8px;
}

.box h3 i,
h3.card-title i {
  color: #ffffff !important; /* White icon */
  font-size: 18px;
  margin-right: 0 !important;
  margin-left: 0 !important;
  flex: 0 0 auto !important;
}

/* Specific overrides for each section */
.customer-box h3,
.delivery-box h3 {
  color: #10b981 !important;
  display: flex !important;
  justify-content: flex-start !important;
  align-items: center !important;
  gap: 10px !important;
}

.summary-card h3,
.summary-card h3.card-title,
.summary-card--order h3,
.summary-card--payment h3 {
  color: #ffffff !important;
  display: flex !important;
  justify-content: flex-start !important;
  align-items: center !important;
  gap: 10px !important;
}

.customer-box h3 i,
.delivery-box h3 i,
.summary-card h3 i,
.summary-card h3.card-title i {
  color: #ffffff !important;
  flex-shrink: 0 !important;
}

.layout-grid {
  display: grid;
  grid-template-columns: minmax(285px, 1fr) minmax(365px, 1.28fr) minmax(275px, 0.88fr);
  gap: 10px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.left-stack,
.center-stack,
.right-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.entry-box {
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1; /* Take remaining space */
}

/* ===== PREMIUM ENTRY HEADER ===== */
.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.entry-header-left {
  flex-shrink: 0;
}

.entry-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #e2e8f0, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.entry-subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.entry-header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.segmented-tabs {
  display: inline-flex;
  padding: 4px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.tabs-track {
  position: relative;
  display: flex;
  gap: 4px;
}

.tabs-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(50% - 2px);
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 999px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.tabs-slider.slider-manual {
  transform: translateX(calc(100% + 4px));
}

.seg-tab {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border: none;
  background: transparent;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: #94a3b8;
  transition: color 0.3s;
  white-space: nowrap;
}

.seg-tab.active {
  color: #ffffff;
}

.seg-tab:not(.active):hover {
  color: #cbd5e1;
}

.seg-tab i {
  font-size: 16px;
}

.entry-header-right {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.context-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}

.context-chip i {
  font-size: 14px;
  opacity: 0.7;
}

.context-chip.chip-tien_mat {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.context-chip.chip-chuyen_khoan {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

@media (max-width: 1200px) {
  .entry-header {
    flex-wrap: wrap;
  }
  
  .entry-header-left {
    order: 1;
    flex-basis: 100%;
  }
  
  .entry-header-center {
    order: 3;
    flex-basis: 100%;
    justify-content: flex-start;
  }
  
  .entry-header-right {
    order: 2;
    flex-basis: 100%;
    margin-top: 8px;
  }
}

@media (max-width: 768px) {
  .entry-title {
    font-size: 20px;
  }
  
  .seg-tab span {
    display: none;
  }
  
  .context-chip span {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.entry-body {
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 16px;
  padding: 16px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
}

.inline-group {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

/* ===== STICKY SEARCH TOOLBAR ===== */
.catalog-toolbar-sticky {
  position: sticky;
  top: -12px;
  z-index: 10;
  background: rgba(2, 6, 23, 0.95);
  border-radius: 10px;
  padding: 12px;
  margin: -12px -12px 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.toolbar-row-1 {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ===== NON-STICKY FILTERS ===== */
.catalog-filters {
  background: rgba(2, 6, 23, 0.7);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.toolbar-row-2 {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 18px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 42px;
  padding: 0 40px 0 40px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 0 3px var(--accent-green-glow);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.search-clear:hover {
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-count {
  padding: 8px 14px;
  background: rgba(59, 130, 246, 0.12);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
  white-space: nowrap;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-reset:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
  transform: translateY(-1px);
}

.toolbar-row-2 .filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.pill-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill {
  padding: 6px 12px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.pill:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(34, 197, 94, 0.3);
  color: #cbd5e1;
}

.pill.active {
  background: linear-gradient(135deg, var(--accent-green), var(--accent-green-dark));
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 10px var(--accent-green-glow);
}

.pill-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-dropdown {
  height: 34px;
  padding: 0 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-width: 120px;
  transition: all 0.2s;
}

.size-dropdown:hover {
  border-color: rgba(148, 163, 184, 0.3);
}

.size-dropdown:focus {
  outline: none;
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 0 3px var(--accent-green-glow);
}

/* ===== PRODUCT GRID ===== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 4px;
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* ===== PRODUCT CARD (PREMIUM) ===== */
.product-card {
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.8));
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.product-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0) 100%);
  border-radius: 16px;
  transition: all 0.35s;
  z-index: 0;
  pointer-events: none;
}

.product-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(59, 130, 246, 0.2),
    0 0 60px rgba(59, 130, 246, 0.08);
}

.product-card:hover::before {
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0) 50%);
}

.product-card.is-flash {
  animation: cardFlashPremium 0.7s ease-out;
}

@keyframes cardFlashPremium {
  0% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.1); }
  100% { box-shadow: 0 12px 28px rgba(0,0,0,0.25); }
}

.product-card.is-out {
  opacity: 0.5;
  filter: grayscale(40%);
  pointer-events: none;
}

.pc-media {
  position: relative;
  width: 100%;
  padding-top: 75%;
  background: rgba(15, 23, 42, 0.6);
  overflow: hidden;
}

.pc-media img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-img-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  font-size: 48px;
}

.badge-sale,
.badge-out {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-sale {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.badge-out {
  background: rgba(71, 85, 105, 0.9);
  color: #cbd5e1;
}

.pc-body {
  padding: 14px;
}

.pc-header {
  margin-bottom: 12px;
}

.pc-name {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2; /* Standard property for compatibility */
}

.pc-price-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.price-sale {
  font-size: 17px;
  font-weight: 700;
  color: #10b981;
}

.price-normal {
  font-size: 15px;
  font-weight: 600;
  color: #94a3b8;
}

.price-old {
  font-size: 13px;
  color: #64748b;
  text-decoration: line-through;
}

.pc-stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.pc-stock-pill.stock-ok {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.pc-stock-pill.stock-low {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.pc-stock-pill.stock-out {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.pc-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Compact Stepper */
.qty-stepper-compact {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.qty-btn-compact {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.qty-btn-compact:hover:not(:disabled) {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.qty-btn-compact:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-input-compact {
  flex: 1;
  min-width: 40px;
  height: 32px;
  text-align: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
}

.qty-input-compact:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

/* Note Icon-Only with Popover */
.note-icon-wrapper {
  position: relative;
}

.btn-note-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-note-icon:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fbbf24;
}

.btn-note-icon.has-note {
  background: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fbbf24;
}

.note-popover-modern {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  min-width: 260px;
  padding: 12px;
  background: rgba(2, 6, 23, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  z-index: 100;
  animation: popoverSlide 0.2s ease-out;
}

@keyframes popoverSlide {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.note-popover-modern::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 12px;
  width: 12px;
  height: 12px;
  background: rgba(2, 6, 23, 0.98);
  border-right: 1px solid rgba(148, 163, 184, 0.25);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  transform: rotate(45deg);
}

.note-popover-modern textarea {
  width: 100%;
  padding: 8px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  resize: vertical;
  margin-bottom: 8px;
}

.note-popover-modern textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.note-save-modern {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.note-save-modern:hover {
  background: #2563eb;
}

/* Prominent Add Button (PREMIUM) */
.btn-add-prominent {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 14px rgba(16, 185, 129, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.btn-add-prominent::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-add-prominent:hover:not(:disabled)::before {
  left: 100%;
}

.btn-add-prominent:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 24px rgba(16, 185, 129, 0.5),
    0 0 40px rgba(16, 185, 129, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-add-prominent:active:not(:disabled) {
  transform: translateY(-1px);
}

.btn-add-prominent:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
}

/* No Products Empty State */
.no-products {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px 20px;
  text-align: center;
  font-size: 16px;
  color: #64748b;
  font-weight: 500;
}

.manual-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manual-scroll-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.manual-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 16px;
}

.manual-section {
  background: rgba(2, 6, 23, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 12px 24px rgba(2, 6, 23, 0.35);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.section-head span {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e2e8f0;
}

.section-sub {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  color: #94a3b8;
}

.manual-fields {
  display: grid;
  gap: 12px;
}

.manual-fields.info-grid,
.manual-fields.price-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.span-2 {
  grid-column: span 2;
}

.manual-section .field label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.manual-section input,
.manual-section select {
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.manual-section textarea {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.input-with-badge {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-badge input {
  width: 100%;
  padding-right: 64px;
}

.clear-badge {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: none;
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(239, 68, 68, 0.35);
}

.clear-badge:hover {
  background: #dc2626;
}

.clear-badge i {
  font-size: 12px;
}

.manual-preview {
  margin-top: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: inset 0 0 0 1px rgba(2, 6, 23, 0.35);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #cbd5f5;
}

.preview-row span:last-child {
  font-weight: 700;
  color: #e2e8f0;
}

.preview-total {
  padding-top: 6px;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
}

.preview-final {
  font-size: 14px;
  color: #3b82f6;
}

.preview-final span:last-child {
  color: #3b82f6;
  font-weight: 800;
}

.preview-profit {
  font-size: 12px;
  color: #22c55e;
}

.preview-profit span:last-child {
  color: #22c55e;
}

/* ===== MANUAL MODE: INFO CHIPS ===== */
.product-info-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #60a5fa;
}

.info-chip i {
  font-size: 14px;
  opacity: 0.8;
}

/* ===== MANUAL MODE: ADVANCED ACCORDION ===== */
.manual-accordion {
  margin-top: 12px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
  overflow: hidden;
}

.accordion-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  list-style: none;
  transition: all 0.2s;
}

.accordion-trigger::-webkit-details-marker {
  display: none;
}

.accordion-trigger:hover {
  background: rgba(30, 41, 59, 0.5);
  color: #cbd5e1;
}

.accordion-arrow {
  margin-left: auto;
  transition: transform 0.2s;
}

.manual-accordion[open] .accordion-arrow {
  transform: rotate(180deg);
}

.accordion-content {
  padding: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: grid;
  gap: 12px;
  animation: accordionSlide 0.2s ease-out;
}

@keyframes accordionSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== MANUAL MODE: HERO PREVIEW ===== */
.manual-preview-hero {
  position: relative;
  padding: 20px 16px;
}

.hero-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.hero-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #64748b;
}

.hero-value {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.hero-final .hero-value {
  color: #3b82f6;
}

.hero-profit .hero-value {
  color: #10b981;
}

/* Preview Details Accordion */
.preview-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.preview-details summary {
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  list-style: none;
  padding: 8px 0;
  user-select: none;
  transition: color 0.2s;
}

.preview-details summary::-webkit-details-marker {
  display: none;
}

.preview-details summary:hover {
  color: #94a3b8;
}

.preview-details summary::after {
  content: ' ▼';
  font-size: 10px;
  margin-left: 6px;
  transition: transform 0.2s;
  display: inline-block;
}

.preview-details[open] summary::after {
  transform: rotate(180deg);
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

.detail-grid .preview-row {
  font-size: 12px;
  color: #94a3b8;
}

.detail-grid .preview-row span:last-child {
  color: #cbd5e1;
  font-weight: 600;
}

.manual-note-field textarea {
  min-height: 72px;
}

.manual-footer {
  margin-top: auto;
  display: flex;
  gap: 10px;
  padding: 12px 0 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}
.manual-footer .btn {
  flex: 1;
  height: 44px;
}

@media (max-width: 1024px) {
  .manual-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .manual-fields.info-grid,
  .manual-fields.price-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }
}

.bottom-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 16px;
  align-items: stretch;
}

.payment-scroll {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.payment-block {
  display: none;
}

.date-time-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.delivery-time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.delivery-time-row .time-sep {
  color: #94a3b8;
  font-weight: 700;
}

.submit-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-width: 240px;
  align-self: stretch;
}

.btn-preview,
.btn-text {
  flex: 1;
  width: 100%;
  font-weight: 900;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  -webkit-text-stroke: 0.6px #ffffff; /* Increased artificial thickness */
  paint-order: markers fill stroke;
}

.btn-complete {
  flex: 2;
  width: 100%;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 900;
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  -webkit-text-stroke: 1px #ffffff; /* Heavier stroke for main button */
  paint-order: markers fill stroke;
}

/* Internal Shine Effect for all 3D buttons */
.btn-preview::after, .btn-text::after, .btn-complete::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  pointer-events: none;
}

.info-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
}

.order-box {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1; /* Take remaining space to push summary to bottom */
}

.order-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  /* Standard Scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) rgba(15, 23, 42, 0.4);
}

/* WebKit Scrollbar (Chrome/Edge/Safari) */
.order-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.order-table-wrap::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 4px;
}

.order-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}

.order-table-wrap::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.order-card-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.order-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 2px 12px;
}

.order-empty {
  text-align: center;
  color: #64748b;
  padding: 24px 12px;
  border: 1px dashed rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  font-size: 13px;
}

.order-card {
  position: relative;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.order-card.is-highlight {
  border-color: rgba(34, 197, 94, 0.7);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.order-card-title {
  padding-right: 32px;
}

.order-card-name {
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
}

.order-card-meta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.order-card-discount {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #fca5a5;
}

.order-card-pricing {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
}

.order-card-price-left {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: #cbd5e1;
}

.order-card-price-left .price-main {
  font-weight: 700;
  color: #e2e8f0;
}

.order-card-price-left .price-main.price-discounted {
  color: #4ade80;
}

.order-card-price-left .price-qty {
  color: #94a3b8;
  font-weight: 600;
}

.order-card-price-total {
  font-size: 13px;
  font-weight: 800;
  color: #01f716;
  font-family: 'JetBrains Mono', monospace;
}

.order-card-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
  border-top: 1px dashed rgba(148, 163, 184, 0.15);
  padding-top: 6px;
  margin-top: 2px;
}

.order-card-note i {
  font-size: 14px;
  color: #60a5fa;
}

.order-card-delete {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.order-card-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.summary-box {
  height: 100%;
  padding: 14px 16px;
}

.summary-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0; /* Don't squash summary */
}

.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.action-row .btn {
  width: 100%;
}

@media (max-width: 1024px) {
  .layout-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .left-stack,
  .right-stack {
    gap: 16px;
  }

  .entry-box {
    order: 1;
    height: auto;
  }

  .order-box {
    order: 2;
    height: auto;
  }

  .info-box {
    order: 3;
  }

  .bottom-row {
    order: 4;
    grid-template-columns: 1fr;
  }

  .summary-stack {
    width: 100%;
  }

  .submit-stack {
    width: 100%;
    min-width: 0;
  }

  .customer-delivery-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    grid-template-columns: 1fr;
  }

  .btn-complete {
    min-height: 64px;
  }
}

.entry-body .pagination {
  margin-top: 16px;
}

/* Obsolete grid styles removed */

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 8px 0;
  padding-bottom: 6px;
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.order-codes {
  display: flex;
  gap: 20px;
}

.code-item {
  font-size: 14px;
  color: #94a3b8;
}

.code-item strong {
  color: #e2e8f0;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
}

@media (max-width: 768px) {
  .customer-delivery-grid {
    grid-template-columns: 1fr;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .order-codes {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 900px) {
  .col-profit {
    display: none;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.field label {
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
  color: #cbd5f5;
}

.hidden-field {
  display: none;
}

.price-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-old-inline {
  color: #f87171;
  font-size: 12px;
  text-decoration: line-through;
}

.hint-text {
  color: #94a3b8;
  font-size: 12px;
}

input,
select,
textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.7);
  color: #e2e8f0;
  font-size: 13px;
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}
.order-box table {
  width: 100%;
  border-collapse: collapse;
}
.order-box table thead th {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95)); /* Glassy Green */
  backdrop-filter: blur(8px); /* Glassmorphism */
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 14px 10px;
  position: sticky; /* ADDED STICKY */
  top: 0;
  z-index: 20;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); /* Softer shadow */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border-bottom: none; /* Removed for full rounded look */
}

.order-box table thead th:first-child {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.order-box table thead th:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.order-box table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 10px;
}

.order-box table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 10px;
}


.row-highlight {
  animation: highlight-fade 1.5s ease-out forwards;
}

@keyframes highlight-fade {
  0% { background: rgba(34, 197, 94, 0.35); }
  70% { background: rgba(34, 197, 94, 0.05); }
  100% { background: transparent; }
}
.order-box th,
.order-box td {
  padding: 14px 10px; /* More breathing room */
  border-bottom: 1px solid rgba(148, 163, 184, 0.08); /* Lighter, more subtle border */
  color: #e2e8f0;
  vertical-align: middle;
}

/* Professional Table Rows */
.order-box table tbody tr {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 2px solid transparent; /* Prepare for hover accent */
}

.order-box table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.01); /* Very subtle striping */
}

.order-box table tbody tr:hover {
  background: rgba(34, 197, 94, 0.05) !important; /* Soft Green Glow */
  border-left-color: #22c55e; /* Accent Border */
  transform: translateX(2px); /* Micro-interaction */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
  position: relative;
}

/* High-End Scrollbar (Ultra-Slim & Floating) */
.order-table-wrap::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.order-table-wrap::-webkit-scrollbar-track {
  background: transparent; /* Floating feel */
}

.order-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(4px);
}

.order-table-wrap:hover::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
}

.order-table-wrap::-webkit-scrollbar-corner {
  background: transparent;
}

/* Align specific columns reliably regardless of visible column toggles */
.order-box th.col-center,
.order-box td.col-center {
  text-align: center;
}

.order-box th.col-left,
.order-box td.col-left {
  text-align: left;
}

.order-box table thead th {
  white-space: nowrap;
}

/* Bold Specific Columns */
.order-box td.col-bold,
.order-box .disc-cell,
.order-box .total-amount {
  font-weight: 700;
  color: #f8fafc;
}

.order-box .disc-cell span {
  font-weight: 700;
}
.prod-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.prod-name {
  font-weight: 700;
  font-size: 14px;
  color: #f8fafc;
  line-height: 1.3;
}

.prod-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.prod-note {
  font-size: 13px;
  color: #ef4444;
  font-weight: 600;
  margin-top: 6px;
  white-space: pre-wrap;
}

.disc-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.disc-ck {
  color: #e2e8f0;
}

.disc-giam {
  color: #fb7185;
}
.total-cell {
  text-align: center; /* Changed from right to center as requested */
  vertical-align: middle;
}
.total-amount {
  display: block;
  line-height: 1.2;
}
.profit-value {
  font-size: 11px;
  line-height: 1.2;
}
.profit {
  color: #22c55e;
  font-weight: bold;
}

.text-danger {
  color: #f87171 !important;
}

.text-success {
  color: #22c55e !important;
}

.text-primary {
  color: #3b82f6 !important;
}

.btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}
.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #e2e8f0;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}
.danger {
  background: #ef4444;
  color: #0f172a;
}
.cash {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #0f172a;
}
.personal {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: #0f172a;
}
.supplier {
  background: #6366f1;
  color: #e2e8f0;
}
.payment {
  display: flex;
  gap: 8px;
}
.secondary {
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.info-box .field label {
  font-size: 12px;
}

.info-box input,
.info-box select {
  height: 36px;
}

.info-box textarea {
  min-height: 80px;
  height: auto;
}

.pill-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.6);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn.active {
  background: linear-gradient(135deg, var(--accent-green), var(--accent-green-dark));
  border-color: var(--accent-green);
  box-shadow: 0 6px 14px var(--accent-green-glow);
  color: #ffffff;
}

.pill-btn:not(.active):hover {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(15, 23, 42, 0.8);
}

.summary-grid {
  display: grid;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-row .summary-label {
  font-size: 12px;
  color: #94a3b8;
}

.summary-row .summary-value {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
}

.summary-row.total .summary-label {
  color: #cbd5f5;
}

.summary-row.total .summary-value {
  font-size: 15px;
  font-weight: 800;
}

.summary-chip {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.7);
  font-size: 11px;
  font-weight: 700;
  color: #e2e8f0;
}

.sum-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sum-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
  margin: 0 -8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.sum-row:hover:not(.sum-total) {
  background: rgba(148, 163, 184, 0.05);
}

.sum-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(148, 163, 184, 0.75);
  letter-spacing: 0.05em;
}

.sum-value {
  font-size: 14px;
  font-weight: 800;
  color: #e2e8f0;
  text-align: right;
}

.sum-total {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
}

.sum-total .sum-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #94a3b8;
}

.sum-total .sum-value {
  font-size: 22px;
  font-weight: 900;
}

.sum-chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.55);
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
}

.btn-outline {
  height: 40px;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s;
}

.btn-outline:hover {
  border-color: rgba(148, 163, 184, 0.75);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.2);
}

.btn-preview {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff !important;
  font-weight: 950 !important;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 0 1px rgba(0,0,0,0.5); /* extra definition */
  box-shadow: 
    0 4px 0 #064e3b,
    0 8px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
}

.btn-preview:hover:not(:disabled) {
  background: linear-gradient(135deg, #34d399, #10b981);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 6px 0 #064e3b,
    0 12px 25px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(16, 185, 129, 0.3);
}

.btn-preview:active:not(:disabled) {
  transform: translateY(2px) scale(0.98);
  box-shadow: 
    0 2px 0 #064e3b,
    0 4px 10px rgba(0, 0, 0, 0.3);
}

.btn-text {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff !important;
  font-weight: 950 !important;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 0 1px rgba(0,0,0,0.5);
  box-shadow: 
    0 4px 0 #78350f,
    0 8px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.4);
}

.btn-text:hover:not(:disabled) {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 6px 0 #78350f,
    0 12px 25px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(245, 158, 11, 0.3);
}

.btn-text:active:not(:disabled) {
  transform: translateY(2px) scale(0.98);
  box-shadow: 
    0 2px 0 #78350f,
    0 4px 10px rgba(0, 0, 0, 0.3);
}

.btn-complete {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: #ffffff !important;
  font-weight: 950 !important;
  font-size: 20px; /* Slightly larger for impact */
  text-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.5),
    0 0 2px rgba(0,0,0,0.4);
  box-shadow: 
    0 6px 0 #7f1d1d,
    0 10px 25px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
}

.btn-complete:hover:not(:disabled) {
  background: linear-gradient(135deg, #f87171, #ef4444);
  transform: translateY(-3px) scale(1.01);
  box-shadow: 
    0 9px 0 #7f1d1d,
    0 18px 35px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(239, 68, 68, 0.4);
}

.btn-complete:active:not(:disabled) {
  transform: translateY(4px) scale(0.97);
  box-shadow: 
    0 3px 0 #7f1d1d,
    0 8px 15px rgba(0, 0, 0, 0.4);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  filter: saturate(0.7);
}

.btn-complete:disabled {
  box-shadow: none;
}

.cta-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.35);
  transition: all 0.2s;
}

.cta-btn:hover:not(:disabled) {
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.45);
}

.cta-btn:disabled {
  opacity: 0.5;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.toast-stack {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10050;
  width: min(360px, calc(100vw - 32px));
}

.toast {
  position: relative;
  padding: 12px 12px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.92);
  color: #e2e8f0;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.toast-msg {
  font-size: 13px;
  line-height: 1.35;
  white-space: pre-wrap;
  padding-right: 22px;
  font-weight: 600;
}

.toast-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  cursor: pointer;
}

.toast-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  animation: toastShrink linear forwards;
  opacity: 0.9;
}

.t-success {
  border-color: rgba(34, 197, 94, 0.35);
}

.t-success .toast-bar {
  background: rgba(34, 197, 94, 0.85);
}

.t-error {
  border-color: rgba(239, 68, 68, 0.45);
}

.t-error .toast-bar {
  background: rgba(239, 68, 68, 0.9);
}

.t-warn {
  border-color: rgba(245, 158, 11, 0.45);
}

.t-warn .toast-bar {
  background: rgba(245, 158, 11, 0.9);
}

.t-info {
  border-color: rgba(59, 130, 246, 0.45);
}

.t-info .toast-bar {
  background: rgba(59, 130, 246, 0.9);
}

@keyframes toastShrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* ============================================
   HÓA ĐƠN IN - THIẾT KẾ MỚI CHUYÊN NGHIỆP
   ============================================ */

.hoa-don-print {
  width: 800px;
  padding: 32px;
  background: #ffffff;
  color: #1a1a1a;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 13px;
  position: fixed;
  top: -9999px;
  left: -9999px;
  line-height: 1.6;
}

/* ===== HEADER - LAYOUT 2 CỘT ===== */
.hd-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 3px solid #1a1a1a;
}

/* LOGO + TÊN SHOP BÊN TRÁI */
.hd-left-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* LOGO TRÒN */
.hd-logo-circle {
  width: 90px;
  height: 90px;
  border: 2px solid #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #ffffff;
  flex-shrink: 0;
}

.hd-logo-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* TÊN SHOP + THỜI GIAN */
.hd-shop-info-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hd-shop-name {
  font-size: 24px;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: 0.8px;
  line-height: 1.2;
  text-transform: uppercase;
}

.hd-shop-time {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  font-style: italic;
}

/* CONTACT GÓC PHẢI */
.hd-contact-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.contact-row {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 8px;
  align-items: center;
  font-size: 11px;
}

.contact-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 2px;
}

.contact-text {
  color: #374151;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
  display: flex;
  gap: 4px;
}

.platform-name {
  font-weight: 700;
  text-transform: uppercase;
  color: #1f2937;
}

.platform-info {
  font-weight: 500;
  color: #374151;
}

.contact-placeholder {
  width: 18px;
  height: 18px;
  background: #e5e7eb;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ===== TITLE (CĂN GIỮA) ===== */
.hd-title-section {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.hd-title {
  font-size: 28px;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: 2px;
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.hd-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
}

.hd-code {
  letter-spacing: 0.5px;
}

.hd-separator {
  color: #d1d5db;
  font-weight: 400;
}

.hd-date {
  color: #9ca3af;
}

/* ===== 2 CARD THÔNG TIN ===== */
.hd-info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
}

.card-title {
  font-size: 12px;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: 2px solid #1a1a1a;
  padding-bottom: 6px;
}

.card-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.card-row:last-child {
  margin-bottom: 0;
}

.card-row .label {
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
  font-size: 12px;
  flex-shrink: 0;
}

.card-row .value {
  color: #1f2937;
  font-weight: 500;
  flex: 1;
  word-wrap: break-word;
}

/* ===== BẢNG SẢN PHẨM ===== */
.hd-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.hd-table thead {
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
}

.hd-table th {
  padding: 12px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  border-right: 1px solid rgba(255,255,255,0.1);
}

.hd-table th:last-child {
  border-right: none;
}

.hd-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
}

.hd-table tbody tr:last-child {
  border-bottom: none;
}

.hd-table tbody tr:nth-child(even) {
  background: #f9fafb;
}

.hd-table tbody tr:hover {
  background: #f3f4f6;
}

.hd-table td {
  padding: 10px;
  font-size: 12px;
  color: #374151;
  border-right: 1px solid #e5e7eb;
}

.hd-table td:last-child {
  border-right: none;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.product-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.product-note {
  font-size: 11px;
  color: #6b7280;
  font-style: italic;
  margin-top: 2px;
}

.price-highlight {
  font-weight: 700;
  color: #1a1a1a;
}

.col-stt {
  width: 50px;
}

.col-name {
  min-width: 180px;
}

.col-size {
  width: 70px;
}

.col-dvt {
  width: 60px;
}

.col-qty {
  width: 50px;
}

.col-price {
  width: 100px;
}

.col-total {
  width: 110px;
}

/* ===== TỔNG KẾT ===== */
.hd-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: auto;
  max-width: 400px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
}

.summary-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 700;
}

.summary-row.discount .summary-label,
.summary-row.discount .summary-value {
  color: #dc2626;
}

.summary-row.shipping .summary-label,
.summary-row.shipping .summary-value {
  color: #0284c7;
  font-weight: 700;
}

.summary-row.goods-total .summary-label,
.summary-row.goods-total .summary-value {
  color: #111827;
  font-weight: 700;
  border-top: 1px dashed #d1d5db;
  padding-top: 8px;
}

.pc-ft-breakdown-rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.pc-ft-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11.5px;
  color: #cbd5e1;
}

.pc-ft-sub-label {
  color: #94a3b8;
  font-weight: 600;
}

.pc-ft-sub-val {
  color: #f8fafc;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.pc-ft-sub-row.is-ship .pc-ft-sub-label,
.pc-ft-sub-row.is-ship .pc-ft-sub-val {
  color: #38bdf8;
}

.ship-fee-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: #7dd3fc;
  padding: 2px 4px 0;
  line-height: 1.3;
}

.shipping-fee-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.shipping-fee-controls .er-input-wrapper {
  flex: 1;
  min-width: 0;
}

.ck-ship-inline-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 8px;
  border-radius: 7px;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.ck-ship-inline-check.active {
  border-color: rgba(56, 189, 248, 0.72);
  background: rgba(14, 165, 233, 0.2);
  color: #e0f2fe;
}

.ck-ship-inline-check input[type='checkbox'] {
  width: 14px;
  height: 14px;
  accent-color: #38bdf8;
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

.pc-ft-ship-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.16);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #7dd3fc;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.summary-row.total {
  border-top: 2px solid #1a1a1a;
  padding-top: 12px;
  margin-top: 8px;
}

.summary-row.total .summary-label {
  font-size: 15px;
  color: #1a1a1a;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-row.total .summary-value {
  font-size: 18px;
  color: #1a1a1a;
  font-weight: 900;
}

.summary-row.subtotal .summary-label,
.summary-row.subtotal .summary-value,
.summary-row.payment .summary-label,
.summary-row.payment .summary-value {
  font-weight: 800; /* Bold as requested */
  color: #111827;
}

.summary-row.payment {
  border-top: 1px solid #d1d5db;
  padding-top: 8px;
  margin-top: 4px;
}

/* ===== FOOTER ===== */
.hd-footer-note {
  text-align: center;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.footer-line {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin: 4px 0;
  font-style: italic;
}

.footer-web {
  font-size: 12px;
  color: #1f2937;
  font-weight: 800;
  letter-spacing: 0.6px;
  margin-top: 6px;
}

/* ============================================
   HÓA ĐƠN NCC (GIỮ NGUYÊN)
   ============================================ */
.hoa-don-ncc {
  width: 720px;
  padding: 20px;
  background: #fff;
  color: #000;
  font-size: 14px;
  position: fixed;
  top: -9999px;
  left: -9999px;
}

.ncc-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.ncc-table th,
.ncc-table td {
  border: 1px solid #000;
  padding: 6px;
  text-align: center;
}

/* ===== POPUP & MODAL ===== */
.text-invoice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.text-invoice-box {
  width: 520px;
  background: rgba(2, 6, 23, 0.92);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

.text-invoice-box textarea {
  width: 100%;
  font-family: monospace;
  font-size: 13px;
  padding: 8px;
  margin-top: 8px;
}

.text-invoice-box .actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.modal {
  position: fixed;
  inset: 0;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 9999;
}

.modal-overlay-blur {
  background: rgba(2, 6, 23, 0.7) !important;
  backdrop-filter: blur(8px) saturate(180%);
}

.modal-box {
  background: rgba(2, 6, 23, 0.96) !important;
  padding: 24px !important;
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #f1f5f9 !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6) !important;
  width: 480px;
  max-width: 95vw;
}

.premium-modal-compact {
  background: linear-gradient(165deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 1)) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 20px !important;
  width: 620px !important;
  padding: 0 !important;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
}

/* ========== PREMIUM MODAL V2 ========== */
.premium-modal-v2 {
  background: linear-gradient(180deg, rgba(15, 23, 42, 1), rgba(2, 6, 23, 0.98)) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  width: 580px !important;
  max-width: 95vw;
  padding: 0 !important;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03),
    0 30px 60px -20px rgba(0, 0, 0, 0.8),
    0 0 80px -30px rgba(34, 197, 94, 0.15) !important;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.pm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pm-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pm-icon-circle {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-green), var(--accent-green-dark));
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
}

.pm-icon-circle i {
  font-size: 26px;
  color: #ffffff;
}

.pm-header-text h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.3px;
}

.pm-product-name {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pm-close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.pm-close-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.pm-body {
  padding: 24px;
}

/* Stock Banner */
.pm-stock-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  margin-bottom: 24px;
  border: 1px solid;
}

.pm-stock-banner.stock-ok {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.2);
}

.pm-stock-banner.stock-low {
  background: rgba(251, 191, 36, 0.08);
  border-color: rgba(251, 191, 36, 0.2);
}

.pm-stock-banner.stock-empty {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
}

.stock-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.pm-stock-banner.stock-ok .stock-icon-wrap {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.pm-stock-banner.stock-low .stock-icon-wrap {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.pm-stock-banner.stock-empty .stock-icon-wrap {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.stock-icon-wrap i {
  font-size: 22px;
}

.stock-details {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.stock-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.5);
}

.stock-value {
  font-size: 20px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
  color: #f1f5f9;
}

.stock-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
}

/* Form Sections */
.pm-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pm-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 16px 18px;
}

.pm-section-discount {
  background: rgba(239, 68, 68, 0.04);
  border-color: rgba(239, 68, 68, 0.1);
}

.pm-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  margin-bottom: 14px;
}

.pm-section-discount .pm-section-title {
  color: #fb7185;
}

.pm-section-title i {
  font-size: 15px;
}

.pm-fields-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
}

.pm-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pm-field-half {
  max-width: 200px;
}

.pm-field-full {
  margin-top: 14px;
}

.pm-field label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.pm-input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.pm-input {
  width: 100%;
  height: 44px;
  padding: 0 44px 0 14px;
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  color: #f1f5f9 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  transition: all 0.2s !important;
}

.pm-input:focus {
  outline: none !important;
  border-color: var(--accent-green) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15) !important;
  background: rgba(15, 23, 42, 0.8) !important;
}

.pm-input-highlight {
  color: #4ade80 !important;
  font-size: 17px !important;
  font-weight: 800 !important;
}

.pm-input-danger {
  color: #fb7185 !important;
}

.pm-unit {
  position: absolute;
  right: 14px;
  font-size: 11px;
  font-weight: 800;
  color: #475569;
  pointer-events: none;
}

.pm-select {
  width: 100%;
  height: 44px;
  padding: 0 36px 0 14px;
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  color: #f1f5f9 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  cursor: pointer;
}

.pm-textarea {
  width: 100%;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  color: #f1f5f9 !important;
  font-size: 14px !important;
  resize: none !important;
  transition: all 0.2s;
}

.pm-textarea:focus {
  outline: none;
  border-color: var(--accent-green) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15) !important;
}

.pm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.pm-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
}

.pm-btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.pm-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
}

.pm-btn-save {
  background: linear-gradient(135deg, var(--accent-green), var(--accent-green-dark));
  border: none;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
}

.pm-btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(34, 197, 94, 0.4);
  filter: brightness(1.08);
}

/* ========== PREMIUM MODAL V3 ========== */
.premium-modal-v3 {
  background: #0f172a !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 20px !important;
  width: 520px !important;
  max-width: 95vw;
  padding: 0 !important;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6) !important;
  animation: modalFadeIn 0.25s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}


/* ========== PREMIUM MODAL V4 (CLEAN & MINIMAL) ========== */
.premium-modal-v4 {
  background: #0f172a !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  width: 500px !important;
  max-width: 95vw;
  padding: 0 !important;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7) !important;
  animation: modalFadeIn 0.25s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* Header */
.pmv4-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pmv4-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pmv4-icon-box {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.pmv4-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #f1f5f9;
}

.pmv4-subtitle {
  margin: 1px 0 0;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.pmv4-close {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 20px;
  transition: color 0.2s;
}

.pmv4-close:hover {
  color: #ef4444;
}

/* Order Action Confirm Modal */
.oac-modal-box {
  max-width: 460px;
  width: 92vw;
}
.pmv4-icon-box.is-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.oac-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.oac-desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: #cbd5e1;
}
.oac-msg-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.oac-msg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.oac-msg-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: #e2e8f0;
}
.oac-msg-label i {
  color: #34d399;
}
.oac-msg-clear {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}
.oac-msg-clear:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.12);
}
.oac-msg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.oac-msg-chip {
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.45);
  color: #cbd5e1;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.16s ease;
}
.oac-msg-chip:hover {
  border-color: rgba(52, 211, 153, 0.55);
  color: #f8fafc;
}
.oac-msg-chip.active {
  background: rgba(16, 185, 129, 0.18);
  border-color: #10b981;
  color: #6ee7b7;
}
.oac-msg-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  padding: 10px 12px;
  font-size: 13.5px;
  line-height: 1.45;
  resize: vertical;
  min-height: 76px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.oac-msg-input::placeholder {
  color: #64748b;
}
.oac-msg-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16);
}
.oac-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.oac-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
}
.oac-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.oac-btn.is-cancel {
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}
.oac-btn.is-cancel:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.25);
}
.oac-btn.is-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
}
.oac-btn.is-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #ffffff;
}

/* Body */
.pmv4-body {
  padding: 20px;
}

/* Stock Strip (Minimal) */
.pmv4-stock-strip {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
}

.pmv4-stock-strip.strip-success { background: rgba(16, 185, 129, 0.1); color: #34d399; }
.pmv4-stock-strip.strip-warning { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
.pmv4-stock-strip.strip-danger  { background: rgba(239, 68, 68, 0.1); color: #f87171; }

.strip-text b { font-weight: 800; margin-left: 4px; }
.strip-item { display: flex; align-items: center; gap: 6px; }

/* Grid */
.pmv4-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.span-full { grid-column: span 2; }

.pmv4-field-group {
  display: flex;
  flex-direction: column;
}

.pmv4-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.text-subtle { color: #64748b; }

/* Stepper V5 (Circular Design) */
.pmv4-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 54px;
  width: 100%;
}

.pmv4-step-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #22c55e;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.pmv4-step-btn:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.5);
}

.pmv4-step-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.95);
}

.pmv4-step-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: #64748b;
  box-shadow: none;
  cursor: not-allowed;
}

.pmv4-step-input-wrap {
  flex: 1;
  max-width: 160px;
  height: 48px;
  position: relative;
  display: flex;
  align-items: center;
}

.pmv4-step-input {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  padding: 0 35px; /* Space for unit */
  transition: all 0.2s;
}

.pmv4-step-input:focus {
  outline: none;
  background: rgba(34, 197, 94, 0.15);
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

.pmv4-input-unit {
  position: absolute;
  right: 12px;
  font-size: 11px;
  color: #15803d; /* Dark green for contrast on light bg */
  font-weight: 800;
  text-transform: uppercase;
  pointer-events: none;
}

/* Inputs */
.pmv4-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pmv4-input {
  width: 100%;
  height: 40px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0 12px;
  color: #e2e8f0;
  font-weight: 600;
}

.pmv4-input:focus, .pmv4-step-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
}

.text-highlight { color: #4ade80; font-weight: 800; }
.text-danger-soft { color: #fb7185; }

.pmv4-static-field {
  width: 100%;
  height: 40px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #94a3b8;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  position: relative;
}

.pmv4-static-unit {
  position: absolute;
  right: 12px;
  font-size: 11px;
  color: #475569;
  font-weight: 700;
}

.pmv4-input-unit {
  position: absolute;
  right: 12px;
  font-size: 11px;
  color: #22c55e;
  font-weight: 800;
}

.pmv4-textarea {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
  color: #e2e8f0;
  resize: none;
}

.pmv4-textarea:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
}

/* Footer */
.pmv4-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.pmv4-btn-ghost {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  background: transparent;
  color: #94a3b8;
  border: none;
  cursor: pointer;
}

.pmv4-btn-ghost:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }

.pmv4-btn-primary {
  padding: 8px 24px;
  border-radius: 8px;
  font-weight: 700;
  background: #10b981;
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.pmv4-btn-primary:hover {
  background: #059669;
}

/* Hide Spinners */
.pmv4-input::-webkit-outer-spin-button,
.pmv4-input::-webkit-inner-spin-button,
.pmv4-step-input::-webkit-outer-spin-button,
.pmv4-step-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pmv4-input[type=number],
.pmv4-step-input[type=number] {
  -moz-appearance: textfield;
}


.pmv3-icon-box i {
  font-size: 22px;
  color: #fff;
}

.pmv3-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #f8fafc;
}

.pmv3-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pmv3-close {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.pmv3-close:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Body */
.pmv3-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Stock Strip */
.pmv3-stock-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid;
}

.pmv3-stock-strip.strip-success {
  background: rgba(34, 197, 94, 0.06);
  border-color: rgba(34, 197, 94, 0.15);
}

.pmv3-stock-strip.strip-warning {
  background: rgba(251, 191, 36, 0.06);
  border-color: rgba(251, 191, 36, 0.15);
}

.pmv3-stock-strip.strip-danger {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.15);
}

.strip-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.strip-item i {
  font-size: 20px;
}

.strip-success .strip-item:first-child i { color: #22c55e; }
.strip-warning .strip-item:first-child i { color: #fbbf24; }
.strip-danger .strip-item:first-child i { color: #ef4444; }

.strip-item:last-child i {
  color: #64748b;
}

.strip-content {
  display: flex;
  flex-direction: column;
}

.strip-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(255, 255, 255, 0.5);
}

.strip-value {
  font-size: 18px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
  color: #f1f5f9;
}

.strip-separator {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

/* Cards */
.pmv3-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  overflow: hidden;
}

.pmv3-card-danger {
  background: rgba(239, 68, 68, 0.03);
  border-color: rgba(239, 68, 68, 0.08);
}

.pmv3-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}

.pmv3-card-danger .pmv3-card-header {
  color: #fb7185;
}

.pmv3-card-header i {
  font-size: 14px;
}

.pmv3-card-body {
  padding: 16px;
}

.pmv3-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.pmv3-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pmv3-field label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.pmv3-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.pmv3-input {
  width: 100%;
  height: 44px;
  padding: 0 50px 0 14px;
  background: rgba(15, 23, 42, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  color: #f1f5f9 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  transition: all 0.2s !important;
}

.pmv3-input:focus {
  outline: none !important;
  border-color: var(--accent-green) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12) !important;
}

.pmv3-input-lg {
  height: 52px;
  font-size: 20px !important;
  font-weight: 800 !important;
  text-align: center;
  padding-right: 70px !important;
}

.pmv3-input-success {
  color: #4ade80 !important;
  font-weight: 800 !important;
}

.pmv3-input-danger {
  color: #fb7185 !important;
}

.pmv3-input-suffix {
  position: absolute;
  right: 14px;
  font-size: 12px;
  font-weight: 800;
  color: #475569;
  pointer-events: none;
}

.pmv3-textarea {
  width: 100%;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  color: #f1f5f9 !important;
  font-size: 14px !important;
  resize: none !important;
  transition: all 0.2s;
}

.pmv3-textarea:focus {
  outline: none;
  border-color: var(--accent-green) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12) !important;
}


/* Stepper V3 */
.pmv3-stepper {
  display: flex;
  align-items: stretch;
  gap: 10px;
  height: 52px;
}

.pmv3-step-btn {
  width: 52px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #e2e8f0;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pmv3-step-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
  transform: translateY(-1px);
}

.pmv3-step-btn:active:not(:disabled) {
  transform: translateY(0);
}

.pmv3-step-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: transparent;
  border-color: rgba(255, 255, 255, 0.05);
}

.pmv3-step-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.pmv3-step-input {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: #4ade80; /* Highlight Green */
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  padding: 0 50px;
  transition: all 0.2s;
}

.pmv3-step-input:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
  background: rgba(15, 23, 42, 0.8);
}

.pmv3-step-unit {
  position: absolute;
  right: 16px;
  color: #64748b;
  font-weight: 700;
  font-size: 13px;
  pointer-events: none;
  text-transform: uppercase;
}

/* Footer */
.pmv3-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.pmv3-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  padding: 0 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.pmv3-btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.pmv3-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
}

.pmv3-btn-primary {
  background: linear-gradient(135deg, var(--accent-green), var(--accent-green-dark));
  border: none;
  color: #fff;
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.25);
}

.pmv3-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.35);
  filter: brightness(1.05);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.02);
}

.modal-title-wrap {
  display: flex;
  gap: 16px;
  align-items: center;
}

.modal-title-wrap .header-icon {
  font-size: 28px;
  color: var(--accent-green);
  background: rgba(34, 197, 94, 0.1);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.modal-title-wrap h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #f8fafc;
}

.modal-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.modal-body {
  padding: 24px;
}

.stock-status-banner {
  display: flex;
  justify-content: space-between;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid;
  margin-bottom: 24px;
}

.stock-info-main, .stock-info-sub {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stock-info-main {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-right: 40px;
}

.stock-status-banner .label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.5);
}

.stock-status-banner .value {
  font-size: 18px;
  font-weight: 950;
  font-family: 'JetBrains Mono', monospace;
}

.modal-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.span-full {
  grid-column: span 2;
}

.discounts-panel {
  background: rgba(239, 68, 68, 0.05);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.input-premium {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
  height: 44px !important;
  padding: 0 14px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #f1f5f9 !important;
  transition: all 0.2s !important;
}

.input-premium:focus {
  border-color: var(--accent-green) !important;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15) !important;
}

.highlight-input {
  color: #4ade80 !important;
  font-size: 18px !important;
  font-weight: 800 !important;
}

.input-readonly-dark {
  background: rgba(2, 6, 23, 0.5) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
  color: #94a3b8 !important;
  cursor: default;
}

.input-stepper-wrap, .input-currency-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-unit {
  position: absolute;
  right: 14px;
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  pointer-events: none;
}

.select-premium {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 16px;
  background-color: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
  height: 44px !important;
  padding: 0 40px 0 14px !important;
  font-weight: 600 !important;
  color: #f1f5f9 !important;
}

.textarea-premium {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  padding: 12px 14px !important;
  font-size: 14px !important;
  color: #f1f5f9 !important;
  resize: none !important;
}

.modal-footer {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.btn-cancel-premium {
  padding: 0 24px;
  height: 44px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #94a3b8;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-premium:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-save-premium {
  padding: 0 32px;
  height: 44px;
  background: linear-gradient(135deg, var(--accent-green), var(--accent-green-dark));
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
}

.btn-save-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(34, 197, 94, 0.45);
  filter: brightness(1.1);
}

.text-danger-val {
  color: #f87171 !important;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.stock-warning {
  background: rgba(15, 23, 42, 0.8);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border-left: 4px solid #3b82f6;
}

.stock-warning p {
  margin: 4px 0;
}

.stock-warning b {
  color: #e2e8f0;
}

.btn-delete {
  padding: 4px 8px;
  background: #ef4444;
  color: #0f172a;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: #f87171;
}

/* ===== MEDIA PRINT - ẨN CÁC NÚT VÀ PHẦN KHÔNG CẦN IN ===== */
@media print {
  .page,
  .box,
  .btn,
  .payment,
  .summary,
  button,
  .modal,
  .text-invoice-overlay {
    display: none !important;
  }
  
  .hoa-don-print {
    position: static !important;
    display: block !important;
  }
}

/* ============================================
   CATALOG SẢN PHẨM
   ============================================ */

.search-box {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  transition: border 0.3s;
  background: rgba(2, 6, 23, 0.7);
  color: #e2e8f0;
}

.search-input:focus {
  border-color: rgba(59, 130, 246, 0.9);
  outline: none;
}


  /* ===== PRODUCT GRID (VIP Refactor) ===== */

  /* ===== PRODUCT GRID (VIP Refactor) ===== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-bottom: 16px;
}

/* =========================================
   SCOPED CATALOG GRID STYLES (COMPACT FIX)
   ========================================= */


/* 1. Scoped Grid Container */
.catalog-grid-section .product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)); /* FORCE 3 COLUMNS */
  gap: 10px;
  padding: 10px 0;
  width: 100%;
}

/* 2. Scoped Card Container - High Specificity */
.catalog-grid-section .product-card-horizontal {
  display: flex !important;
  flex-direction: row !important;
  width: 100%;
  min-height: 135px; /* Use min-height to prevent cut-off */
  height: auto;
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  padding: 0; 
  align-items: stretch;
  gap: 0;
}

.catalog-grid-section .product-card-horizontal:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.catalog-grid-section .product-card-horizontal.is-out {
  opacity: 0.6;
  filter: grayscale(0.8);
}

/* 3. Image Section (Fixed Width) */
.catalog-grid-section .pc-media-horizontal {
  width: 110px;
  min-width: 110px;
  height: auto; /* Allow to stretch */
  min-height: 100%;
  position: relative;
  background: #fff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.catalog-grid-section .pc-media-horizontal img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
  display: block;
  position: absolute; /* Lock inside container */
  top: 0;
  left: 0;
}

.catalog-grid-section .pc-media-horizontal .no-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e293b;
  color: #475569;
  font-size: 24px;
}

/* Badges (Absolute to Image) */
.catalog-grid-section .badge-sale {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 4px;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.catalog-grid-section .badge-out {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.15);
  z-index: 2;
}

/* 4. Content Section */
.catalog-grid-section .pc-content-horizontal {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  justify-content: space-between;
  overflow: visible; /* Show dropdowns/popovers */
}

/* Name */
.catalog-grid-section .pc-name-horizontal {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.3;
  color: #f8fafc;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 34px;
  flex-shrink: 0;
}

/* New Card Layout Styles */
.catalog-grid-section .pc-info-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: auto;
  min-width: 0;
}

.catalog-grid-section .pc-price-stock-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  flex-wrap: wrap; 
}

.catalog-grid-section .pc-price-box-horizontal {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}

.catalog-grid-section .price-sale {
  color: #f87171;
  font-weight: 800;
  font-size: 14px;
}

.catalog-grid-section .price-old {
  color: #64748b;
  text-decoration: line-through;
  font-size: 11px;
}

.catalog-grid-section .price-normal {
  color: #e2e8f0;
  font-weight: 700;
  font-size: 14px;
}

.catalog-grid-section .pc-stock-pill-horizontal {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  margin-top: 0;
}
.catalog-grid-section .pc-stock-pill-horizontal.stock-out { color: #f87171; background: rgba(239, 68, 68, 0.12); }
.catalog-grid-section .pc-stock-pill-horizontal.stock-low { color: #fbbf24; background: rgba(245, 158, 11, 0.12); }
.catalog-grid-section .pc-stock-pill-horizontal.stock-ok { color: #4ade80; background: rgba(74, 222, 128, 0.12); }

/* Actions */
.catalog-grid-section .pc-actions-horizontal {
  display: flex;
  gap: 6px;
  margin-top: 6px; 
  padding-top: 0;
  border-top: none; 
}

/* Modern Stepper Layout */
.qty-note-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.qty-stepper-modern {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qty-btn-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  flex-shrink: 0;
}

.qty-btn-circle:hover:not(:disabled) {
  background: #059669;
  transform: scale(1.1);
}

.qty-btn-circle:disabled {
  background: #334155;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.5;
}

.qty-input-box {
  width: 50px;
  padding: 0 4px;
  height: 24px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 6px;
  color: #10b981;
  font-weight: 800;
  text-align: center;
  font-size: 12px;
  outline: none;
  -moz-appearance: textfield; 
}

/* Force hide spin buttons */
.qty-input-box::-webkit-outer-spin-button,
.qty-input-box::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
  display: none !important;
}

.btn-note-text-green {
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.1); 
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;
  color: #10b981;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px; /* Icon size */
}

.btn-note-text-green:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.btn-note-text-green.has-note {
  background: #facc15;
  color: #000;
  border-color: #eab308;
}

/* Green Add Button */
.btn-add-green {
  flex: 1;
  height: 30px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-add-green:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(16, 185, 129, 0.35);
}

.btn-add-green:disabled {
  background: #334155;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.catalog-grid-section .note-popover-horizontal {
  position: absolute;
  bottom: 34px;
  right: 0;
  width: 200px;
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  padding: 8px;
  border-radius: 8px;
  z-index: 20;
}

.catalog-grid-section .note-save-horizontal {
  width: 100%;
  margin-top: 6px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 11px;
}

/* Responsive */
@media (max-width: 900px) { /* Adjusted breakpoint down from 1024px */
  .catalog-grid-section .product-grid { grid-template-columns: repeat(2, 1fr); }
}


@media (max-width: 640px) {
  .catalog-grid-section .product-grid { grid-template-columns: 1fr; }
  .catalog-grid-section .product-card-horizontal { height: auto; } /* Allow expand on mobile */
  .catalog-grid-section .pc-media-horizontal { width: 100px; }
}

/* Header Language Select */
/* Header Language Select */
.header-lang-select {
  position: relative;
  width: auto;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(22, 163, 74, 0.2); /* Dark green bg */
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  padding: 0 8px;
  gap: 8px;
}

.custom-select-transparent {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0; /* Fully hidden but clickable */
  cursor: pointer;
  z-index: 2;
}

.lang-label-text {
  font-size: 11px; /* Reduced from 13px */
  font-weight: 700;
  color: #4ade80; /* Green text */
  text-transform: uppercase;
  z-index: 1;
  pointer-events: none;
  white-space: nowrap;
}

.lang-flag-img {
  width: 20px; /* Reduced from 24px */
  height: auto;
  border-radius: 3px;
  pointer-events: none;
  z-index: 1;
  display: block;
}

/* Ensure options are visible when opened (browser dependent, mainly for non-native styling attempts) */
.custom-select-transparent option {
  color: #000; /* Fallback for some browsers */
}

.product-card {
  background: rgba(2, 6, 23, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 12px;
  align-items: center;
  position: relative;
  box-shadow: 0 10px 26px rgba(2, 6, 23, 0.35);
}

.product-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.45);
  box-shadow: 0 16px 32px rgba(2, 6, 23, 0.45);
}

.product-card.is-out {
  opacity: 0.6;
}

.product-card.is-flash {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35), 0 18px 40px rgba(59, 130, 246, 0.2);
}

.pc-media {
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  background: #0f172a;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.pc-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-img-placeholder i, .no-img {
  font-size: 26px;
}

.badge-sale {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
}

.badge-out {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.75);
  color: #0f172a;
}

.pc-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.pc-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.pc-name {
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pc-price-box {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.price-sale {
  font-size: 14px;
  font-weight: 700;
  color: #ef4444;
}

.price-old {
  font-size: 11px;
  color: #64748b;
  text-decoration: line-through;
}

.price-normal {
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
}

.pc-stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid rgba(148, 163, 184, 0.16);
  width: fit-content;
}

.pc-stock-pill .stock-qty {
  background: rgba(148, 163, 184, 0.2);
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
}

.pc-stock-pill.stock-ok {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
}

.pc-stock-pill.stock-low {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.12);
}

.pc-stock-pill.stock-out {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
}

.pc-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.qty-stepper {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 999px;
  padding: 2px;
}

.qty-btn-mini {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #e2e8f0;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  border-radius: 999px;
}

.qty-btn-mini:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.18);
  color: #3b82f6;
}

.qty-btn-mini:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-input-mini {
  width: 40px;
  height: 28px;
  background: transparent;
  border: none;
  color: #e2e8f0;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  appearance: textfield;
}

.qty-input-mini::-webkit-inner-spin-button, 
.qty-input-mini::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

.btn-add-mini {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-add-mini i {
  font-size: 18px;
}

.btn-add-mini:hover:not(:disabled) {
  background: #2563eb;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
}

.btn-add-mini:disabled {
  background: #475569;
  cursor: not-allowed;
  opacity: 0.5;
}

.pc-note-wrap {
  position: relative;
}

.note-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.65);
  color: #cbd5f5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.note-btn:hover {
  border-color: rgba(59, 130, 246, 0.45);
  color: #e2e8f0;
}

.note-popover {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 220px;
  background: rgba(2, 6, 23, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 10px;
  z-index: 10;
  box-shadow: 0 18px 30px rgba(2, 6, 23, 0.6);
}

.note-popover textarea {
  width: 100%;
  min-height: 70px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  padding: 8px;
  font-size: 12px;
  resize: vertical;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.note-save {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}



.pc-note textarea {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 6px;
  font-size: 11px;
  resize: none;
  transition: border 0.2s, height 0.2s;
  height: 28px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.7);
  color: #e2e8f0;
}

.pc-note textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.9);
  height: 72px;
}

.pc-note textarea::placeholder {
  color: #64748b;
  font-size: 11px;
}

.pc-qty-row {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  gap: 6px;
  align-items: center;
}

.qty-btn {
  width: 36px;
  height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.8);
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.2s;
  color: #e2e8f0;
}

.qty-btn:hover:not(:disabled) {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(59, 130, 246, 0.8);
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-input {
  width: 100%;
  height: 32px;
  text-align: center;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 6px;
  font-weight: 600;
  background: rgba(2, 6, 23, 0.7);
  color: #e2e8f0;
}

.pc-add-row .btn-add-product {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #e2e8f0;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-add-product:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.btn-add-product:disabled {
  background: #475569;
  cursor: not-allowed;
}


.no-products {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 15px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.page-btn {
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: #e2e8f0;
}

.page-btn:hover:not(:disabled) {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(59, 130, 246, 0.8);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: #e2e8f0;
  min-width: 120px;
  text-align: center;
}

/* ============================================
   MODAL CHI TIẾT SẢN PHẨM
   ============================================ */

/* ===== PREMIUM DARK PRODUCT MODAL - BALANCED ===== */
.product-detail-box {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-radius: 16px;
  max-width: 1100px; /* Wider for balance */
  width: 95%;
  max-height: 95vh;
  min-height: 500px;
  height: auto;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 32px; /* Restored breathing room */
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: #94a3b8;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(15, 23, 42, 0.9);
  color: #f8fafc;
  transform: rotate(90deg);
}

.detail-grid {
  display: grid;
  grid-template-columns: 45% 1fr; /* Balanced Image/Info split */
  gap: 36px; /* Wider gap */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 8px;
}

/* Custom scrollbar for grid */
.detail-grid::-webkit-scrollbar { width: 4px; }
.detail-grid::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.3); }
.detail-grid::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
.detail-grid::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }

/* Images Left */
.detail-images {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-self: center; /* Vertically center in grid */
}

.main-image {
  width: 100%;
  height: 380px; /* Increased for better visibility */
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

.no-img-large {
  font-size: 80px;
  color: #334155;
}

.thumbnail-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 12px;
}

.thumbnail {
  width: 70px;
  height: 70px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #020617;
  transition: all 0.2s;
}

.thumbnail:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.thumbnail:hover img {
  opacity: 1;
}

/* Info Right */
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 16px; /* Comfortable gap */
}

.detail-title {
  font-size: 28px; /* Restored size */
  font-weight: 800;
  background: linear-gradient(135deg, #f8fafc, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1.2;
}

.detail-row {
  display: flex;
  gap: 16px;
  padding: 8px 0; /* Comfortable padding */
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  align-items: baseline;
}

.detail-label {
  font-weight: 600;
  color: #64748b;
  min-width: 100px;
  font-size: 14px;
}

.detail-value {
  color: #e2e8f0;
  font-weight: 500;
  font-size: 15px;
}

/* Price Section - Airy */
.detail-price-section {
  background: transparent;
  padding: 8px 0;
  margin: 8px 0;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
  border-bottom: 1px dashed rgba(148, 163, 184, 0.2);
}

.price-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-section-header i { font-size: 14px; color: #10b981; }

/* Price Row Structure - Minimal */
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  gap: 12px;
}

/* Price Row Label - Big & Clear */
.price-row-label {
  display: flex;
  align-items: center;
  gap: 8px; /* Increased gap */
  font-size: 18px; /* Greatly increased size */
  font-weight: 700; /* Bolder */
  color: #f8fafc; /* Even brighter */
  min-width: 100px;
}

.price-row-label i { font-size: 20px; opacity: 1; }

.price-row-value {
  flex: 1;
  text-align: right;
  font-size: 20px; /* Big value */
  font-weight: 700;
  color: #f8fafc;
  line-height: 1;
}

/* Cost & Selling - No Backgrounds */
.price-row-cost, .price-row-selling {
  background: transparent;
  padding: 4px 0;
  border-radius: 0;
  margin-bottom: 0;
}

.price-row-cost .price-row-label { color: #e2e8f0; }
.price-row-selling .price-row-label { color: #e2e8f0; }

/* Cost Price - Large & Equal */
.price-cost {
  color: #60a5fa !important;
  font-family: 'Roboto Mono', monospace;
  font-size: 24px; /* Increased to match selling price */
  font-weight: 700;
}

/* Price with Discount */
.price-with-discount {
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: flex-end;
}

.price-current {
  font-size: 24px; /* Same large size */
  font-weight: 900;
  color: #ef4444;
  text-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
}

.price-original-strike {
  font-size: 13px;
  color: #64748b;
  text-decoration: line-through;
  font-weight: 600;
}

.price-normal-large {
  font-size: 24px; /* Same large size */
  font-weight: 700;
  color: #4ade80;
  letter-spacing: -0.5px;
}

/* Profit Indicator - Smaller Hierarchy */
.profit-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-top: 6px;
  border-top: 1px dotted rgba(148, 163, 184, 0.2);
  background: transparent;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
}

.profit-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px; /* Slightly smaller label */
  font-weight: 600;
  color: #4ade80;
  text-transform: uppercase;
  min-width: 100px;
}

.profit-label i { font-size: 16px; color: #10b981; }

.profit-value {
  font-size: 18px; /* Smaller than prices (24px vs 18px) */
  font-weight: 700;
  color: #10b981;
}

.detail-stock {
  font-size: 15px;
  font-weight: 600;
}

.detail-desc {
  margin-top: 8px;
}

.detail-desc p {
  color: #94a3b8;
  line-height: 1.5;
  margin: 4px 0;
  font-size: 13px;
}

.detail-note-input {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
}

.detail-note-input label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-weight: 600;
  color: #cbd5e1;
  font-size: 14px;
}

.detail-note-input textarea {
  width: 100%;
  padding: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.detail-note-input textarea:focus {
  outline: none;
  background: rgba(15, 23, 42, 0.9);
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.detail-actions {
  display: flex;
  flex-direction: column; /* Vertical stacking */
  gap: 14px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

/* Quantity row - centered */
.detail-actions .qty-note-row {
  display: flex;
  justify-content: center;
  margin: 0;
}

/* Button full width */
.detail-actions .btn-add-large {
  width: 100%;
}


/* Meta Tags / Pills */
.detail-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
  white-space: nowrap;
}

.meta-tag i {
  font-size: 14px;
}

.meta-category {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.meta-size {
  background: rgba(236, 72, 153, 0.1);
  border-color: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.meta-unit {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.meta-status-active,
.meta-status-hoạt_động {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

/* Stock - Inline Meta */
.meta-stock {
  font-weight: 700;
  border-width: 1px;
}

.meta-stock.stock-ok {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.meta-stock.stock-low {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fbbf24;
}

.meta-stock.stock-out {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* Price Label */
.price-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-label i {
  font-size: 16px;
  color: #10b981;
}

/* Section Titles */
.detail-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-section-title i {
  font-size: 16px;
  color: #3b82f6;
}

.btn-add-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-add-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-add-large:hover::before {
  left: 100%;
}

.btn-add-large:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.btn-add-large:active:not(:disabled) {
  transform: translateY(0);
}

.btn-add-large:disabled {
  background: rgba(100, 116, 139, 0.3);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .main-image {
    height: 300px;
  }
}
</style>

<style scoped>
/* ===== CATALOG TOOLBAR ===== */
.catalog-toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  margin: -12px -12px 12px;
  background: rgba(2, 6, 23, 0.92);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 20px rgba(2, 6, 23, 0.35);
}

.toolbar-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 320px;
  min-width: 240px;
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  align-items: flex-start;
  flex: 1 1 320px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 15px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 42px;
  padding: 0 40px 0 38px;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  color: #e2e8f0;
  outline: none;
  font-size: 14px;
  transition: border 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.8);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.search-clear:hover {
  color: #e2e8f0;
  border-color: rgba(59, 130, 246, 0.45);
}

.catalog-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-count {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.btn-reset {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  border-color: rgba(59, 130, 246, 0.45);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.8);
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(2, 6, 23, 0.6);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.pill:hover {
  border-color: rgba(59, 130, 246, 0.4);
  color: #e2e8f0;
}

.pill.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
  border-color: rgba(59, 130, 246, 0.75);
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
}

.pill-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chk-hidden {
  display: none;
}

@media (max-width: 1024px) {
  .catalog-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: flex-start;
  }
}

/* ===== PRODUCT CARD REFINEMENTS ===== */
.no-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.no-img-placeholder i {
  font-size: 48px;
  opacity: 0.5;
}

/* ===== SUMMARY BOX REFINEMENTS ===== */
.sum-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.sum-label {
  color: #94a3b8;
}

.font-mono {
  font-family: 'Consolas', 'Monaco', monospace;
  letter-spacing: -0.5px;
}

.has-value .sum-value {
  font-weight: 700;
}

.sum-divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.2);
  margin: 12px 0;
}

.highlight-row .sum-label {
  font-weight: 700;
  color: #e2e8f0;
  font-size: 16px;
}

/* =========================================
   UNIFIED CATALOG HEADER (Single Row)
   ========================================= */
.catalog-toolbar-unified {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 12px 12px 0 0;
  flex-wrap: wrap; /* Allow wrapping to 2 rows */
  overflow-x: visible;
  row-gap: 12px;
}

/* 1. SECTION TITLE & MODE */
.toolbar-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Title left, buttons right/fill */
  gap: 16px;
  flex-shrink: 0;
  width: 100%;
  padding-bottom: 8px;
  margin-bottom: 4px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.15);
}

.entry-mode-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1; /* Grow to fill remaining space */
  background: transparent;
  padding: 0;
  border-radius: 0;
  border: none;
}

.header-title-text {
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  color: #e2e8f0;
  padding-left: 4px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.mode-btn i { font-size: 16px; }

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1; /* Each button grows equally */
  padding: 10px 32px;
  min-width: 0; /* Remove min-width to allow full stretching */
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.mode-btn i { font-size: 18px; }

.mode-btn:hover { 
  color: #f1f5f9; 
  background: rgba(255,255,255,0.05); 
}

/* Green Button - Active State (Có sẵn) */
.mode-btn-green.active {
  background: #22c55e !important; /* Solid green */
  color: #ffffff !important; /* White text */
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  border-color: rgba(34, 197, 94, 0.5);
}

/* Green Button - Inactive State */
.mode-btn-green:not(.active) {
  color: #94a3b8; /* Gray text */
  background: rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.2);
}

/* Blue Button - Active State (Thủ công) */
.mode-btn-blue.active {
  background: #3b82f6 !important; /* Solid blue */
  color: #ffffff !important; /* White text */
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
}

/* Blue Button - Inactive State */
.mode-btn-blue:not(.active) {
  color: #94a3b8; /* Gray text */
  background: rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.2);
}

/* 2. SEARCH Box */
/* 2. SEARCH Box */
.toolbar-section-search {
  flex: 0 1 300px; /* Do not force full width, allow shrinking. Base 300px */
  min-width: 180px;
}

.search-box-unified {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-input-unified {
  width: 100%;
  height: 40px;
  padding: 0 36px 0 38px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8); /* Lighter, cleaner border */
  border-radius: 99px; /* Fully rounded pill shape */
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* Subtle depth */
}

.search-input-unified:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.search-input-unified:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); /* Soft, wide glow */
  transform: translateY(0);
}

.search-input-unified::placeholder { 
  color: #94a3b8; 
  font-weight: 400;
  letter-spacing: 0.3px;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #64748b; /* Slightly darker for better visibility on white */
  pointer-events: none;
  font-size: 16px;
}

.search-clear {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}
.search-clear:hover { color: #f87171; background: rgba(239, 68, 68, 0.1); }


/* 3. FILTERS SECTION */
.toolbar-section-filters {
  display: flex;
  align-items: center;
  gap: 8px; /* Reduced gap */
  flex-shrink: 1; /* Allow shrinking */
  min-width: 0;
}

/* Custom Dropdown Style */
.filter-item { position: relative; flex-shrink: 1; }

.custom-select-wrapper {
  position: relative;
  width: auto;
  min-width: 80px; /* Reduced from 100px */
  max-width: none;
}

.cat-filter-wrap {
  max-width: 115px; /* Reduced from 130px */
}

.custom-select {
  width: 100%;
  height: 38px; /* Slightly reduced height */
  appearance: none;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 9px;
  padding: 0 16px 0 8px; /* Further reduced padding */
  color: #cbd5e1;
  font-size: 10.5px; /* Reduced font size from 12px */
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-select:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.4);
  color: #f8fafc;
}

.custom-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.arrow-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 13px;
  pointer-events: none;
}

/* Promo Toggle Button Style */
.filter-checkbox-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 38px; /* Consistent height */
  padding: 0 10px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s;
  color: #94a3b8;
  font-size: 10.5px; /* Reduced from 12px */
  font-weight: 700;
  user-select: none;
  white-space: nowrap;
}

.filter-checkbox-btn:hover {
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.4);
}

.filter-checkbox-btn.active {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

/* Green Filter Style */
.custom-select-green {
  border-color: rgba(34, 197, 94, 0.3) !important;
  color: #4ade80 !important;
  background: rgba(34, 197, 94, 0.05) !important;
}
.custom-select-green:hover {
  background: rgba(34, 197, 94, 0.1) !important;
  border-color: rgba(34, 197, 94, 0.5) !important;
}

/* Category Filter Style (Dark Blue Bg, Green Text) */
.custom-select-cat {
  border-color: rgba(34, 197, 94, 0.3) !important;
  color: #4ade80 !important;
  background: rgba(15, 23, 42, 0.95) !important; /* Dark Blue */
}
.custom-select-cat:hover {
  background: #0f172a !important; /* 100% opacity */
  border-color: rgba(34, 197, 94, 0.6) !important;
}
.text-green-400 { color: #4ade80 !important; }

/* Yellow Filter Style */
.filter-checkbox-yellow {
  border-color: rgba(234, 179, 8, 0.3) !important;
  color: #facc15 !important;
  background: rgba(234, 179, 8, 0.05) !important;
}
.filter-checkbox-yellow:hover {
  background: rgba(234, 179, 8, 0.1) !important;
  border-color: rgba(234, 179, 8, 0.5) !important;
  color: #fde047 !important;
}
.filter-checkbox-yellow.active {
  background: rgba(234, 179, 8, 0.15) !important;
  border-color: #eab308 !important; /* Yellow-500 */
  color: #facc15 !important; /* Yellow-400 */
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.25) !important;
}

.chk-hidden { display: none; }

/* Reset Button */
.btn-reset-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-reset-icon:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
  transform: rotate(180deg);
}

.highlight-row .sum-value.large {
  font-size: 24px;
  font-weight: 800;
}

.sub-info {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.9;
}

.payment-method-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pm-label {
  font-size: 12px;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.pm-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pm-cash {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pm-transfer {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* ===== CUSTOMER INFO ENHANCEMENTS ===== */
.cust-summary-box {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 0; /* field-row handles margin */
}

/* ci-label and ci-value are now within field-row structure */
.ci-value {
  font-weight: 600;
}

.text-danger { color: #f87171 !important; }
.text-success { color: #10b981 !important; }
.text-primary { color: #3b82f6 !important; }

/* ===== HORIZONTAL FIELD LAYOUT ===== */
.info-row-2col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  flex-shrink: 0;
}

.customer-scroll-container {
  display: contents;
}

.customer-next-wrap,
.order-next-wrap {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  padding: 8px 0 0;
}

.customer-next-btn,
.order-next-btn,
.customer-back-btn,
.order-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  width: 100%;
  max-width: none;
  height: 46px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
}

.customer-next-btn,
.order-next-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(16, 185, 129, 0.3);
}

.customer-back-btn,
.order-back-btn {
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #e2e8f0;
  box-shadow: none;
}

.customer-next-btn:hover,
.order-next-btn:hover {
  filter: brightness(1.05);
}

.customer-back-btn:hover,
.order-back-btn:hover {
  background: rgba(148, 163, 184, 0.2);
}

@media (max-width: 1024px) {
  .info-row-2col {
    grid-template-columns: 1fr;
  }

  .customer-scroll-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    flex: 1;
    min-height: 0;
    max-height: calc(100dvh - 200px);
    overflow-y: auto;
    padding-bottom: calc(35px + env(safe-area-inset-bottom));
    -webkit-overflow-scrolling: touch;
  }
}

.field-row {
  display: grid;
  grid-template-columns: 130px 1fr; /* Reduced from 140px to give more room */
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}


.field-row label {
  font-size: 11px; /* Slightly smaller */
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
  letter-spacing: 0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-control {
  min-width: 0; /* Prevents overflow in grid */
}

.field-control input,
.field-control select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
}

.field-control textarea {
  width: 100%;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
  min-height: 60px;
  display: block;
}

.field-row:has(textarea) {
  align-items: start;
}

.field-row:has(textarea) label {
  margin-top: 8px;
}

.field-control .delivery-time-row {
  display: flex;
  gap: 4px; /* Reduced gap */
  align-items: center;
  flex-wrap: wrap; /* Allow wrapping if too narrow */
}

.field-control .time-select {
  width: 55px; /* More compact */
  flex-shrink: 0;
  padding: 0 4px !important;
}

.field-control .date-input {
  flex: 1;
  min-width: 120px;
}

.field-control .pay-toggle {
  display: flex;
  gap: 8px;
}

.pill-btn {
  padding: 6px 12px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 20px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.pill-btn:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(59, 130, 246, 0.4);
}

.pill-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* RESPONSIVE: VERTICAL ON MOBILE */
@media (max-width: 768px) {
  .field-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .field-row label {
    white-space: normal;
  }
  
  .field-row:has(textarea) {
    align-items: stretch;
  }
}

/* ===== INVOICE PRINT PROMO ===== */
.summary-row.promo {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed #cbd5e1;
  gap: 10px;
  align-items: flex-start;
}
.summary-row.promo .summary-label {
  color: #047857;
  font-weight: 800;
  flex-shrink: 0;
}
.summary-row.promo .summary-value {
  color: #059669;
  font-weight: 700;
  text-align: right;
}
.hd-promo-next {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  text-align: center;
}
.hd-promo-next-text {
  font-size: 12px;
  font-weight: 700;
  color: #b45309;
  line-height: 1.35;
}


/* ===== COMPACT MANUAL ENTRY MODE (PREMIUM) ===== */
.manual-content.compact-mode {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 0;
}

.cp-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}
.cp-row.name-row { align-items: flex-end; }
.cp-field.grow { flex: 1; }
.cp-field.w-auto { width: auto; }
.cp-field.w-sm { width: 90px; }

/* 5 COLS GRID for Prices */
.cp-grid-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.cp-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cp-field label {
  font-size: 10px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.cp-input {
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.6));
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  height: 40px; 
  color: #e2e8f0;
  font-size: 13px;
  padding: 0 12px;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}
.cp-input:focus {
  border-color: rgba(34, 197, 94, 0.6);
  background: rgba(15, 23, 42, 0.95);
  box-shadow: 
    0 0 0 3px var(--accent-green-glow),
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 4px 12px var(--accent-green-light);
  outline: none;
  transform: translateY(-1px);
}
.cp-input.main-input {
  height: 44px;
  font-size: 14px;
  font-weight: 600;
  border-width: 1.5px;
}

.clear-badge-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #ef4444;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: all 0.2s;
  opacity: 0.8;
}
.clear-badge-icon:hover { 
  transform: translateY(-50%) scale(1.15); 
  opacity: 1;
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
}


.stock-badge-box {
  border: 1.5px solid;
  padding: 0 18px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  min-width: 100px;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(2, 6, 23, 0.7));
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}
.stock-badge-box:hover {
  transform: translateY(-2px);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 6px 18px rgba(0, 0, 0, 0.2);
}


/* QUANTITY STEPPER (PREMIUM) */
.qty-stepper-manual {
  display: flex;
  align-items: center;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.8));
  border: 1.5px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  overflow: hidden;
  height: 50px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}
.qty-stepper-manual:hover {
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 6px 18px rgba(0, 0, 0, 0.2),
    0 0 20px var(--accent-green-light);
}
.q-btn {
  width: 44px;
  height: 100%;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.q-btn:hover { 
  background: var(--accent-green-light); 
  color: var(--accent-green);
  transform: scale(1.1);
}
.q-btn:active {
  transform: scale(0.95);
}
.q-input {
  width: 70px;
  height: 100%;
  border: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  appearance: textfield; 
}
.q-input:focus { 
  outline: none;
  color: var(--accent-green);
}

/* ADD BUTTON (PREMIUM) */
.btn-add-full {
  height: 52px;
  border-radius: 12px;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  box-shadow: 
    0 6px 16px rgba(59, 130, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-add-full::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-add-full:hover::before {
  left: 100%;
}

.btn-add-full:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 10px 28px rgba(59, 130, 246, 0.5),
    0 0 40px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.btn-add-full:active {
  transform: translateY(-1px);
}
.btn-add-full.grow { flex: 1; }

.mini-old-price {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: #f87171;
    text-decoration: line-through;
    pointer-events: none;
    font-weight: 600;
    opacity: 0.8;
}
.price-stack { position: relative; }




/* ===== BANK TRANSFER INFO IN INVOICE ===== */
.hd-summary-row {
  display: grid;
  grid-template-columns: 1fr 420px; /* Tăng cột phải chút cho thoáng */
  gap: 20px;
  align-items: stretch;
  margin-bottom: 16px;
}

.hd-summary-row.is-no-bank {
  display: flex;
  justify-content: flex-end;
}

.hd-summary-row.is-no-bank .hd-summary {
  width: 420px;
  max-width: 100%;
}

.hd-bank-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Cân đối chiều dọc */
}

.bank-title {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-bottom: 2px solid #334155; /* Đậm hơn */
  padding-bottom: 8px;
  margin-bottom: 14px;
  color: #0f172a;
}

.bank-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

.bank-qr {
  width: 110px;
  height: 110px;
  flex-shrink: 0;
  border: 4px solid #fff;
  outline: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.bank-qr img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.bank-text {
  font-size: 13px; /* To hơn */
  color: #0f172a; /* Đen hơn */
  white-space: pre-line;
  line-height: 1.6;
  font-weight: 700; /* In đậm */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 4.8em; /* Cố định 3 dòng */
}

.bank-divider {
  height: 1px;
  background: #cbd5e1;
  margin: 14px 0;
  width: 100%;
  border-top: 1px dashed #94a3b8; /* Line nét đứt cho tinh tế */
  background: transparent;
}

.bank-amount {
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
}

.ba-label {
  font-size: 12px;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.ba-value {
  font-size: 22px; /* To hơn */
  font-weight: 900;
  color: #000000;
  letter-spacing: -0.5px;
}

.ba-sub {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
  margin-top: 4px;
}

.ba-sub.is-ship-included {
  color: #0284c7;
}

.ba-sub.is-ship-excluded {
  color: #64748b;
}


.summary-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #111827;
  border-bottom: 1px dashed #94a3b8;
  padding-bottom: 8px;
  margin-bottom: 12px;
  text-align: center;
}
.bank-list-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bank-minicard {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.bank-minicard .bank-body {
  margin-bottom: 0;
}
.btn-delete-cta {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-delete-cta:hover {
  background: #dc2626;
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
  transform: translateY(-50%) translateY(-1px);
}
.btn-delete-cta:active {
  transform: translateY(-50%) translateY(0);
}

/* ===== SUMMARY CARDS REFACTOR ===== */
.summary-stack {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 1024px) {
  .summary-stack {
    grid-template-columns: 1fr;
  }
}

.summary-card .card-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

/* Payment toggle section */
.payment-toggle-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;
}

.payment-toggle-section .pm-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-toggle-section .pay-toggle-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-width: 0;
}

.payment-toggle-section .pay-toggle {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: 6px;
}

.pay-qr-export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 0 11px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(251, 191, 36, 0.55);
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.28);
  transition: transform 0.14s ease, filter 0.16s ease, box-shadow 0.16s ease;
}

.pay-qr-export-btn:hover {
  filter: brightness(1.07);
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.42);
}

.pay-qr-export-btn:active {
  transform: scale(0.97);
}

.payment-toggle-section .pill-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.payment-toggle-section .pill-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.payment-toggle-section .pill-btn.active {
  background: linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
  border-color: var(--accent-green);
  color: white;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
}

/* Total row styling */
.sum-row.total-row {
  margin-top: 6px;
  padding: 8px 0;
}

.sum-row.total-row .total-label {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 1px;
}

.sum-row.total-row .total-value {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

/* Transfer row styling */
.sum-row.transfer-row {
  margin-top: 6px;
  padding: 8px 10px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.sum-row.transfer-row .transfer-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-green);
  letter-spacing: 0.5px;
}

.sum-row.transfer-row .transfer-value {
  font-size: 14px;
  font-weight: 800;
  color: var(--accent-green);
}

/* Exchange rate section in payment card */
.exchange-rate-section {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.exchange-rate-section .er-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.exchange-rate-section .er-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.exchange-rate-section .er-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  -moz-appearance: textfield;
  appearance: textfield;
}

.exchange-rate-section .er-input::-webkit-outer-spin-button,
.exchange-rate-section .er-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.exchange-rate-section .er-input:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.exchange-rate-section .er-badge {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.exchange-rate-section .er-hint {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  margin-top: 4px;
}
/* Delivery Date & Time Button */
.date-input-dark {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  color-scheme: dark; /* Icon lịch màu trắng */
}

.date-input-dark:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.btn-now {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 38px;
  background: #ef4444;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.btn-now:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.4);
}

.btn-now:active {
  transform: translateY(0);
}

.btn-now i {
  font-size: 16px;
}
/* ===============================================================
   PREMIUM UI SKIN FOR INFO CARDS (FINAL RETRY)
   Scope: .customer-box, .delivery-box, .summary-card--order, .summary-card--payment
   =============================================================== */

/* === 1. UNIFIED CARD SKIN === */
.customer-box,
.delivery-box,
.summary-card {
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(7, 10, 20, 0.99)) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
  padding: 12px 12px 8px 12px !important; /* Reduced bottom padding */
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.5),
    0 0 40px -5px rgba(34, 197, 94, 0.05) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative;
  overflow: hidden;
}

.summary-card .sum-grid .sum-row:last-child {
  padding-bottom: 0 !important;
}

.customer-box:hover,
.delivery-box:hover,
.summary-card:hover {
  transform: translateY(-3px);
  border-color: rgba(34, 197, 94, 0.3) !important;
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.6),
    0 0 50px -10px rgba(34, 197, 94, 0.18) !important;
}

/* === 2. CARD HEADERS === */
.customer-box > h3,
.delivery-box > h3,
.summary-card .card-title {
  display: flex !important;
  justify-content: space-between !important; /* Added */
  align-items: center !important;
  /* gap: 12px !important; */ /* Removed */
  font-size: 13px !important;
  font-weight: 850 !important;
  text-transform: uppercase !important;
  letter-spacing: 1.5px !important;
  color: #ffffff !important;
  padding-bottom: 10px !important;
  margin-bottom: 8px !important; /* Changed from 12px to 8px */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  opacity: 0.95;
}

.customer-box > h3 i,
.delivery-box > h3 i,
.summary-card .card-title i {
  color: var(--accent-green);
  font-size: 20px;
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4));
}

/* === 3. LABELS & TYPOGRAPHY === */
.customer-box label,
.delivery-box label,
.summary-card .sum-label,
.summary-card .pm-label,
.summary-card .er-label {
  display: block;
  font-size: 10px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  color: #ffffff !important; /* Changed from #94a3b8 to white */
  margin-bottom: 4px !important;
}

/* === 4. INPUTS, SELECTS, TEXTAREAS === */
.customer-box input,
.customer-box select,
.customer-box textarea,
.delivery-box input,
.delivery-box select,
.delivery-box textarea,
.summary-card input {
  width: 100%;
  height: 40px;
  padding: 0 14px !important;
  background: rgba(15, 23, 42, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 8px !important;
  color: #f1f5f9 !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}

.customer-box textarea,
.delivery-box textarea {
  height: auto !important;
  padding: 12px 14px !important;
  min-height: 80px;
}

/* Hover */
.customer-box input:hover,
.delivery-box input:hover,
.summary-card input:hover {
  border-color: rgba(255, 255, 255, 0.25) !important;
  background: #0f172a !important;
}

/* Focus */
.customer-box input:focus,
.customer-box select:focus,
.customer-box textarea:focus,
.delivery-box input:focus,
.delivery-box select:focus,
.delivery-box textarea:focus,
.summary-card input:focus {
  outline: none !important;
  border-color: var(--accent-green) !important;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18) !important;
  background: #020617 !important;
}

/* === 5. CUSTOMER MINI-DASHBOARD === */
.cust-summary-box {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 12px !important;
  margin: 10px 0 !important;
  padding: 10px !important;
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 10px !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.cust-stat {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  text-align: center !important;
}

.cust-stat-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: #ffffff; /* Optimized for visibility */
  letter-spacing: 0.6px;
}

.cust-stat-value {
  font-family: 'JetBrains Mono', 'Courier New', monospace !important;
  font-size: 14px !important; /* Slightly larger */
  font-weight: 950 !important; /* Maximum weight */
  color: #f1f5f9;
}


.sum-right-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-limit-red {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-limit-red:hover {
  background: #b91c1c;
}

.btn-edit-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  margin-left: 6px;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-edit-inline:hover {
  color: #fff;
  background: rgba(255,255,255,0.1);
}

/* === 6. SUMMARY ROWS === */
.summary-card .sum-row {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 8px 0 !important;
}

.summary-card .sum-label {
  font-size: 11px !important;
  color: #ffffff !important; /* Force white for inner summary labels */
}

.summary-card .sum-value {
  font-size: 14px !important;
  font-weight: 900 !important; /* Consistent with template */
  color: #ffffff !important;
}

.summary-card .sum-row.is-ship .sum-label,
.summary-card .sum-row.is-ship .sum-value {
  color: #38bdf8 !important;
}

.summary-card .sum-row.sub-info {
  margin-top: 6px !important;
  padding-top: 8px !important;
  border-top: 1px dashed rgba(148, 163, 184, 0.16);
}

.summary-card .sum-divider {
  height: 1px !important;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent) !important;
  margin: 8px 0 !important;
  border: none !important;
}

/* === 7. HERO TOTAL ROW === */
.summary-card .total-row {
  margin-top: 4px !important;
  padding: 6px 8px !important;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(2, 6, 23, 0.6)) !important;
  border: 1px solid rgba(34, 197, 94, 0.4) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
}

.summary-card .total-label {
  font-size: 14px !important;
  font-weight: 900 !important;
  color: #ffffff !important;
  letter-spacing: 1.2px !important;
}

.summary-card .total-value {
  font-size: 24px !important;
  font-weight: 950 !important;
  color: #4ade80 !important;
  text-shadow: 0 0 20px rgba(34, 197, 94, 0.6) !important;
}

/* === 8. TRANSFER PILL ROW === */
.summary-card .transfer-row {
  margin-top: 4px !important;
  padding: 4px 8px !important;
  background: rgba(59, 130, 246, 0.18) !important;
  border: 1px solid rgba(59, 130, 246, 0.35) !important;
  border-radius: 99px !important;
}

.summary-card .transfer-label {
  color: #ffffff !important;
  font-weight: 800 !important;
  font-size: 10px !important;
}

.summary-card .transfer-value {
  color: #93c5fd !important;
  font-weight: 900 !important;
  font-size: 16px !important;
}

/* === 9. PAYMENT BUTTONS (Pills) === */
.summary-card .pill-btn {
  height: 44px !important;
  padding: 0 16px !important;
  background: rgba(30, 41, 59, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
  font-size: 12px !important;
  font-weight: 750 !important;
  color: #94a3b8 !important;
  transition: all 0.25s !important;
}

.summary-card .pill-btn:hover {
  background: rgba(51, 65, 85, 0.9) !important;
  color: white !important;
}

.summary-card .pill-btn.active {
  background: linear-gradient(135deg, var(--accent-green), var(--accent-green-dark)) !important;
  color: white !important;
  border-color: var(--accent-green) !important;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.45) !important;
}

.summary-card .pill-btn--transfer.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.45) !important;
}

/* === COMPACT PAYMENT SECTIONS === */
.payment-toggle-section {
  margin-bottom: 8px;
}

.payment-toggle-section .pm-label {
  font-size: 10px;
  margin-bottom: 4px;
}

.exchange-rate-section {
  margin-bottom: 8px;
}

.exchange-rate-section .er-label {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 4px;
  display: block;
}

.exchange-rate-section .er-input-wrapper {
  display: flex;
  gap: 6px;
  align-items: center;
}

.exchange-rate-section .er-input {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
}

.exchange-rate-section .er-badge {
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  font-size: 11px;
  color: #93c5fd;
}

.btn-discount-trigger {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.btn-discount-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}



/* ================= PREMIUM MANUAL MODE CSS ================= */
.premium-mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.pm-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pm-row-main {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.pm-input-lg {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  color: #fff;
  padding: 8px 0;
  transition: all 0.2s;
}

.pm-input-lg:focus {
  border-bottom-color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.05);
}

/* CHIPS */
.pm-chips-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chip-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chip-group label {
  font-size: 11px;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.chip-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.chip-scroll::-webkit-scrollbar {
  height: 4px;
}

.chip-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.pm-chip {
  padding: 6px 12px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.pm-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.pm-chip.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
}

.pm-chip-input {
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 6px 12px;
  color: #fff;
  font-size: 13px;
  width: 80px;
}

.pm-chip-input:focus {
  border-color: var(--accent-blue);
  border-style: solid;
}

/* PRICING GRID */
.pm-pricing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
  background: rgba(30, 41, 59, 0.3);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pm-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pm-field label {
  font-size: 11px;
  color: #94a3b8;
}

.pm-input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  width: 100%;
}

.pm-input.text-highlight {
  color: var(--accent-green);
  font-weight: 700;
  border-color: rgba(34, 197, 94, 0.3);
}

.input-symbol {
  position: relative;
}

.input-symbol .symbol {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #64748b;
}

/* ACCORDION */
.pm-accordion {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.2);
  overflow: hidden;
}

.pm-summary {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
}

.pm-summary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.pm-details-body {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.4);
}

.pm-row-details {
  display: flex;
  gap: 12px;
}

.pm-select {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  width: 100%;
}

/* HERO SECTION */
.pm-hero-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: center;
}

.hero-item {
  display: flex;
  flex-direction: column;
}

.hero-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
}

.hero-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 800;
}

.hero-stock {
  text-align: right;
  font-size: 12px;
}

.btn-add-hero {
  padding: 12px;
  background: linear-gradient(135deg, var(--accent-blue), #1e40af);
  border: none;
  border-radius: 8px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
  transition: all 0.2s;
}

.btn-add-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
}

.btn-sub {
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.summary-card .pill-btn--transfer.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.45) !important;
}

/* === 10. DELIVERY TIME GRID === */
.delivery-box .time-select {
  width: 70px !important;
  text-align: center !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-weight: 800 !important;
  font-size: 15px !important;
}

/* === 11. BUTTON NOW REFINEMENT === */
.btn-now {
  background: linear-gradient(135deg, #ef4444, #991b1b) !important;
  border: none !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4) !important;
}

.btn-now:hover {
  filter: brightness(1.1);
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.5) !important;
}

/* === 12. UTILS === */
.text-danger { color: #f87171 !important; }
.text-success { color: #4ade80 !important; }
.text-primary { color: #60a5fa !important; }
.font-mono { font-family: 'JetBrains Mono', monospace !important; }

/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}

</style>

<!-- Non-scoped styles for scrollbar (scoped styles don't work with pseudo-elements) -->
<style>
/* ===== GLOBAL SCROLLBAR STYLING FOR NHAPHOADON ===== */
/* Apply to everything inside .page to ensure consistency */
.page ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.page ::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 4px;
}

.page ::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 4px;
}

.page ::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.page ::-webkit-scrollbar-corner {
  background: transparent;
}

/* Firefox standard */
.page * {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.35) rgba(15, 23, 42, 0.4);
}
.page .customer-box h3,
.page .delivery-box h3 {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  color: #10b981 !important; /* Green */
  text-align: left !important;
}

.page .summary-card h3,
.page .summary-card--order h3,
.page .summary-card--payment h3,
.page .card-title {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  color: #ffffff !important; /* Revert to White */
  text-align: left !important;
}

.page .customer-box h3 i,
.page .delivery-box h3 i,
.page .summary-card h3 i,
.page .card-title i {
  color: #10b981 !important; /* Force Green */
  margin-right: 10px !important;
  margin-left: 0 !important;
  flex: 0 0 auto !important;
}

/* Success Button State */
.btn-added-success {
  background: #10b981 !important; /* Green Success */
  border-color: #10b981 !important;
  color: white !important;
  pointer-events: none; /* Prevent double click */
}
.btn-copied {
  background: #10b981 !important; /* Green */
  color: white !important;
  pointer-events: none;
}
/* ===== MANUAL ENTRY V2 PRO STYLES ===== */
.manual-v2-container { display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.mv2-card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 16px; }
.mv2-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.mv2-title { font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
.mv2-btn-clear-all { font-size: 12px; color: #fca5a5; background: transparent; border: none; cursor: pointer; }
.mv2-row-split { display: flex; gap: 12px; margin-bottom: 16px; }
.mv2-field { display: flex; flex-direction: column; gap: 6px; }
.mv2-field label { font-size: 12px; font-weight: 600; color: #64748b; }
.mv2-field label .req { color: #ef4444; }
.mv2-input-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; height: 40px; display: flex; align-items: center; padding: 0 12px; transition: all 0.2s; }
.mv2-input-box:focus-within { border-color: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15); }
.mv2-input-box input { background: transparent; border: none; width: 100%; color: #e2e8f0; font-size: 14px; height: 100%; font-weight: 600; }
.mv2-input-box input:focus { outline: none; }
.mv2-input-box .icon-left { color: #64748b; margin-right: 8px; }
.mv2-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.mv2-row-pricing { display: grid; grid-template-columns: 160px 1fr; gap: 12px; }
.qty-card { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); }
.mv2-qty-control { display: flex; align-items: center; background: #0f172a; border-radius: 20px; padding: 4px; margin: 8px 0; border: 1px solid #334155; }
.mv2-qty-control button { width: 32px; height: 32px; border-radius: 50%; border: none; background: #1e293b; color: #e2e8f0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.mv2-qty-control button:hover { background: #334155; }
.mv2-qty-control input { width: 50px; background: transparent; border: none; text-align: center; color: #fff; font-size: 16px; -moz-appearance: textfield; }
.mv2-stock-info { font-size: 12px; color: #64748b; }
.price-card { padding: 12px; }
.mv2-price-grid { display: grid; grid-template-columns: repeat(3, 1fr) 1.5fr; gap: 10px; align-items: start; }
.input-price { background: #0f172a; border: 1px solid #334155; border-radius: 8px; width: 100%; padding: 8px; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
.input-price.text-highlight { color: #10b981; font-weight: 700; border-color: rgba(16, 185, 129, 0.3); }
.mv2-total-box { background: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 8px; text-align: right; border: 1px dashed rgba(16, 185, 129, 0.4); }
.mv2-total-box .label { font-size: 11px; color: #10b981; text-transform: uppercase; font-weight: 700; }
.mv2-total-box .value { font-size: 18px; font-weight: 900; color: #ffffff; }
.mv2-total-box .profit { font-size: 11px; color: #3b82f6; }
.mv2-btn-submit { width: 100%; height: 48px; background: linear-gradient(90deg, #10b981 0%, #059669 100%); border: none; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); transition: transform 0.2s; }
.mv2-btn-submit:hover { transform: translateY(-2px); filter: brightness(1.1); }
.mv2-btn-submit .cont { display: flex; flex-direction: column; align-items: flex-start; }
.mv2-btn-submit .txt { font-weight: 900; font-size: 14px; color: white; letter-spacing: 1px; }
.mv2-btn-submit .sub { font-size: 12px; color: #d1fae5; }
.mv2-btn-submit i { font-size: 20px; color: white; }
.w-30 { width: 30%; }
.w-70 { width: 70%; }
.w-full { width: 100%; }

/* Hero Input Enhancements */
.mv2-input-box.hero-input {
  height: 50px;
  border-color: rgba(16, 185, 129, 0.4);
  background: linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(15, 23, 42, 0.6));
}

.mv2-input-box.hero-input i {
  color: #10b981;
  font-size: 18px;
}

.text-lg {
  font-size: 16px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
}

/* ================= MANUAL MODE V3 (UNIFIED CARD) ================= */
.premium-mode-v3 {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0;
}

/* Unified Card Container */
.mv3-unified-card {
  background: rgba(2, 6, 23, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
}

/* Header */
.mv3-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.mv3-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mv3-header-left i {
  color: var(--accent-green);
  font-size: 18px;
}

.mv3-title {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #e2e8f0;
}

.mv3-btn-clear {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #ef4444;
}

.mv3-btn-clear:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.25);
}

/* Product Name Section */
.mv3-name-section {
  margin-bottom: 14px;
}

.mv3-name-section label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.mv3-input-hero {
  position: relative;
  display: flex;
  align-items: center;
}

.mv3-input-hero i {
  position: absolute;
  left: 14px;
  color: var(--accent-green);
  font-size: 18px;
  pointer-events: none;
}

.mv3-input-hero input {
  width: 100%;
  height: 50px;
  padding: 0 16px 0 46px;
  background: linear-gradient(to right, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.6));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.mv3-input-hero input:focus {
  outline: none;
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  background: rgba(15, 23, 42, 0.8);
}

/* Grid Layouts */
.mv3-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.mv3-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mv3-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mv3-field label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.mv3-field input,
.mv3-field select {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  transition: all 0.2s;
}

.mv3-field input:focus,
.mv3-field select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: rgba(15, 23, 42, 0.9);
}

/* Divider */
.mv3-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.15), transparent);
  margin: 12px 0;
}

/* Quantity & Stock Row */
.mv3-qty-stock-row {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  margin-bottom: 14px;
}

.mv3-qty-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mv3-qty-section label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.mv3-qty-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  padding: 4px;
  height: 44px;
}

.mv3-qty-stepper button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #60a5fa;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.mv3-qty-stepper button:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
}

.mv3-qty-stepper button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.mv3-qty-stepper input {
  flex: 1;
  background: transparent;
  border: none;
  text-align: center;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 700;
  min-width: 60px;
}

.mv3-qty-stepper input:focus {
  outline: none;
}

/* Stock Badge */
.mv3-stock-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 44px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  white-space: nowrap;
}

.mv3-stock-badge i {
  color: var(--accent-green);
  font-size: 18px;
}

.mv3-stock-badge span {
  font-size: 12px;
  color: #94a3b8;
}

.mv3-stock-badge strong {
  color: var(--accent-green);
  font-size: 16px;
  font-weight: 800;
}

/* Stock Badge Color Variants */
.mv3-stock-badge.text-danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.mv3-stock-badge.text-danger i,
.mv3-stock-badge.text-danger strong {
  color: #ef4444;
}

.mv3-stock-badge.text-warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.mv3-stock-badge.text-warning i,
.mv3-stock-badge.text-warning strong {
  color: #f59e0b;
}

/* Price Input Fields */
.mv3-input-price {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  height: 38px;
  overflow: hidden;
  transition: all 0.2s;
}

.mv3-input-price input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0 12px;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
}

.mv3-input-price input:focus {
  outline: none;
}

.mv3-input-price .currency {
  padding: 0 12px;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  background: rgba(0, 0, 0, 0.2);
  height: 100%;
  display: flex;
  align-items: center;
  border-left: 1px solid rgba(148, 163, 184, 0.15);
}

.mv3-input-price:focus-within {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Highlight variant for selling price */
.mv3-field.highlight .mv3-input-price {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.05);
}

.mv3-field.highlight .mv3-input-price input {
  color: var(--accent-green);
  font-weight: 700;
}

.mv3-field.highlight .mv3-input-price:focus-within {
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Danger variant for discount */
.mv3-input-price.danger {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.mv3-input-price.danger input {
  color: #f87171;
}

/* Note Section */
.mv3-note-section {
  margin-bottom: 14px;
}

.mv3-note-section label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.mv3-note-section input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  transition: all 0.2s;
}

.mv3-note-section input:focus {
  outline: none;
  border-color: rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.9);
}

/* Summary Box */
.mv3-summary {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(2, 6, 23, 0.4));
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 10px;
  padding: 14px;
}

.mv3-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.mv3-summary-row + .mv3-summary-row {
  border-top: 1px dashed rgba(148, 163, 184, 0.15);
  margin-top: 6px;
  padding-top: 12px;
}

.mv3-summary-row .label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.mv3-summary-row .value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 900;
  color: #e2e8f0;
}

.mv3-summary-row .value.primary {
  color: var(--accent-green);
  text-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

.mv3-summary-row .value.success {
  color: #4ade80;
  font-size: 14px;
}

/* Accordion */
.mv3-accordion {
  background: rgba(2, 6, 23, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  overflow: hidden;
}

.mv3-accordion-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: all 0.2s;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.mv3-accordion-summary::-webkit-details-marker {
  display: none;
}

.mv3-accordion-summary:hover {
  background: rgba(148, 163, 184, 0.05);
  color: #e2e8f0;
}

.mv3-accordion-summary i {
  font-size: 16px;
}

.mv3-accordion-summary .chevron {
  margin-left: auto;
  transition: transform 0.2s;
}

.mv3-accordion[open] .mv3-accordion-summary .chevron {
  transform: rotate(180deg);
}

.mv3-accordion-body {
  padding: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

/* Action Button */
.mv3-btn-add {
  width: 100%;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%);
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  position: relative;
  overflow: hidden;
}

.mv3-btn-add::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.mv3-btn-add:hover::before {
  left: 100%;
}

.mv3-btn-add:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5);
  filter: brightness(1.1);
}

.mv3-btn-add:active {
  transform: translateY(-1px);
}

.mv3-btn-add .btn-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mv3-btn-add .btn-content i {
  font-size: 24px;
  color: white;
}

.mv3-btn-add .btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.mv3-btn-add .btn-text .main {
  font-size: 15px;
  font-weight: 900;
  color: white;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.mv3-btn-add .btn-text .sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.mv3-btn-add .arrow {
  font-size: 24px;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .mv3-grid-3 {
    grid-template-columns: 1fr;
  }
  
  .mv3-qty-stock-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .mv3-stock-badge {
    justify-content: center;
  }
}

/* ================= MANUAL MODE V4 (CLEAN PROFESSIONAL) ================= */
.premium-mode-v4 {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
  height: 100%;
}

/* Card Container - Clean Glass */
.mv4-card {
  position: relative;
  background: rgba(15, 23, 42, 0.68);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow: visible;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.mv4-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  position: relative;
  min-height: 30px;
}

.mv4-header-left {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.mv4-header-left > i {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 8px;
  color: #10b981;
  font-size: 15px;
}

.mv4-header-titles {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.mv4-header-titles > span:first-child {
  font-size: 12.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #e2e8f0;
}

.mv4-db-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

.mv4-db-badge.is-existing {
  background: rgba(16, 185, 129, 0.16);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.mv4-db-badge.is-new {
  background: rgba(56, 189, 248, 0.16);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.mv4-btn-clear {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  transition: 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
}

.mv4-btn-clear:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Reorganized Sections & Responsive Grids */
.entry-body.entry-body-manual {
  container-type: inline-size;
  container-name: manual-panel;
}

.mv4-section {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 10px;
  border-radius: 11px;
  background: rgba(2, 6, 23, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.mv4-section.is-pricing {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(59, 130, 246, 0.2);
}

.mv4-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.mv4-section-head > span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #93c5fd;
}

.mv4-preview-chip {
  font-size: 11px;
  font-weight: 800;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 999px;
  padding: 2px 8px;
  font-family: 'JetBrains Mono', monospace;
}

.mv4-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.mv4-pair-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mv4-price-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.mv4-row-qty-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 2px;
}

/* Fields - Vertical Labels for clean compact fit */
.mv4-field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  min-width: 0;
}

.mv4-field label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.4px;
  width: auto;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mv4-field.highlight label {
  color: #6ee7b7;
}

.mv4-field label .req { color: #f43f5e; margin-left: 2px; }

.mv4-field input,
.mv4-field select {
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 12.5px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.mv4-field input:hover,
.mv4-field select:hover {
  border-color: rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.9);
}

.mv4-field input:focus,
.mv4-field select:focus {
  outline: none;
  background: rgba(15, 23, 42, 0.95);
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Hero Input - Clean */
.mv4-input-hero {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.mv4-input-hero input {
  height: 42px;
  padding: 0 60px 0 12px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(16, 185, 129, 0.28);
}

.mv4-input-hero input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
  background: rgba(15, 23, 42, 0.95);
}

/* Price Input - Clean */
.mv4-input-price {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  height: 36px;
  overflow: hidden;
  transition: 0.2s;
  min-width: 0;
}

.mv4-field.highlight .mv4-input-price {
  border-color: rgba(16, 185, 129, 0.42);
}

.mv4-input-price.danger:focus-within {
  border-color: #f87171;
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.18);
}

.mv4-input-price:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.mv4-input-price input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  padding: 0 8px;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 12.5px;
  height: 100%;
}
.mv4-input-price input:focus { outline: none; box-shadow: none; }

.mv4-input-price .currency {
  padding: 0 7px;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(0, 0, 0, 0.18);
  height: 100%;
  display: flex;
  align-items: center;
  border-left: 1px solid rgba(148, 163, 184, 0.14);
  flex-shrink: 0;
}

@container manual-panel (max-width: 350px) {
  .mv4-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mv4-price-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mv4-price-grid .mv4-field.highlight {
    grid-column: 1 / -1;
  }
}

@container manual-panel (max-width: 245px) {
  .mv4-meta-grid,
  .mv4-pair-grid,
  .mv4-price-grid {
    grid-template-columns: 1fr;
  }
}

/* Action Wrap & Add Options Popover */
.mv4-action-wrap {
  position: relative;
  margin-top: auto;
  padding-top: 4px;
}

.mv4-add-options-popover {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px;
  border-radius: 12px;
  background: #0f172a;
  border: 1px solid rgba(56, 189, 248, 0.45);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.68);
}

.mv4-opt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.mv4-opt-head > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mv4-opt-close {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: none;
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.mv4-opt-close:hover {
  color: #ffffff;
  background: rgba(239, 68, 68, 0.25);
}

.mv4-opt-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(30, 41, 59, 0.85);
  color: #f8fafc;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mv4-opt-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mv4-opt-btn > i {
  font-size: 18px;
  flex-shrink: 0;
}

.mv4-opt-btn.is-order-only > i {
  color: #34d399;
}

.mv4-opt-btn.is-order-only:hover:not(:disabled) {
  border-color: rgba(16, 185, 129, 0.6);
  background: rgba(16, 185, 129, 0.16);
}

.mv4-opt-btn.is-save-db {
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(14, 165, 233, 0.14);
}

.mv4-opt-btn.is-save-db > i {
  color: #38bdf8;
}

.mv4-opt-btn.is-save-db:hover:not(:disabled) {
  border-color: rgba(56, 189, 248, 0.7);
  background: rgba(14, 165, 233, 0.24);
}

.mv4-opt-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mv4-opt-text strong {
  font-size: 12.5px;
  font-weight: 800;
  color: #f8fafc;
}

.mv4-opt-text span {
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.3;
}

.mv4-btn-caret {
  font-size: 17px;
  margin-left: auto;
  opacity: 0.85;
}

/* Quantity Section Styles */
.mv4-qty-section { flex: 0 1 auto; display: flex; flex-direction: row; align-items: center; gap: 12px; }
.mv4-qty-section label { width: auto; color: #ffffff; margin-right: 4px; }

/* Quantity Stepper - Modern Split Style */
.mv4-qty-stepper {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  background: transparent;
  padding: 0;
  border: none;
}

.mv4-qty-stepper button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
  font-size: 16px;
}

/* Minus Button */
.mv4-qty-stepper button:first-of-type {
  background: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.mv4-qty-stepper button:first-of-type:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}
.mv4-qty-stepper button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Plus Button */
.mv4-qty-stepper button:last-of-type {
  background: #10b981;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  border: none;
}
.mv4-qty-stepper button:last-of-type:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4);
}

/* Input Display */
.mv4-qty-stepper input {
  width: 50px;
  height: 36px;
  background: rgba(6, 78, 59, 0.3); /* Dark green tint */
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  color: #34d399; /* Bright green text */
  padding: 0;
}
.mv4-qty-stepper input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
}

/* Stock Badge - Clean */
.mv4-stock-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 42px;
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
}
.mv4-stock-badge i { font-size: 18px; color: #10b981; }
.mv4-stock-badge span {font-size: 12px; color: #64748b;}
.mv4-stock-badge strong { font-family: 'JetBrains Mono'; color: #10b981; font-size: 15px; }

/* Action Button - Clean Solid */
.mv4-btn-add-simple {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #10b981;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: white;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.mv4-btn-add-simple:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
}

.mv4-btn-add-simple.is-disabled-stock {
  background: #334155 !important;
  color: #94a3b8 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  opacity: 0.8;
}

.mv4-btn-add-simple:disabled {
  pointer-events: none;
}

.mv4-btn-add-simple .price {
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}

/* Custom Header Toggle Active State */
.mode-btn.active-manual {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}

.mode-btn.active-manual i {
  color: #ffffff !important;
}

/* ================= VIP SUCCESS MODAL ================= */
.vip-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: vipFadeIn 0.3s ease-out;
}

.vip-success-card {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  padding: 30px 40px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15);
  max-width: 400px;
  width: 90%;
  animation: vipScaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.vip-success-card::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 60%);
  pointer-events: none;
}

.vip-icon-box {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vip-success-ring {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  border-radius: 50%;
  border: 4px solid #10b981;
  opacity: 0.2;
  animation: vipRingPing 1.5s infinite;
}

.vip-check-icon {
  font-size: 40px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.2);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}

.vip-title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.vip-message {
  margin: 0 0 25px;
  font-size: 14px;
  color: #cad5e1;
  line-height: 1.5;
}

.vip-btn-ok {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  transition: all 0.2s;
  width: 100%;
  text-transform: uppercase;
}

.vip-btn-ok:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

@keyframes vipFadeIn { from { opacity: 0; } to { opacity: 1; }}
@keyframes vipScaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; }}
@keyframes vipRingPing { 
  0% { transform: scale(0.8); opacity: 0.5; border-width: 4px; }
  100% { transform: scale(1.5); opacity: 0; border-width: 0; }
}

/* Responsive */
@media (max-width: 1024px) {
  .mv4-meta-grid,
  .mv4-pair-grid,
  .mv4-price-grid {
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 10px;
  }

  .mv4-price-grid .mv4-field.highlight {
    grid-column: auto;
  }

  .mv4-row-qty-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding-top: 4px;
  }

  .mv4-qty-section {
    justify-content: space-between;
    width: 100%;
  }

  .mv4-stock-badge {
    justify-content: center;
    width: 100%;
  }

  .mv4-field label {
    text-align: left;
    width: 100%;
    font-size: 11px;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  .mv4-field input,
  .mv4-field select,
  .mv4-input-price,
  .ncc-inline-input {
    height: 42px;
  }

  .mv4-input-price input {
    height: 100%;
  }

  .mv4-input-hero input {
    height: 44px;
  }
}
/* ================= SKELETON LOADING ================= */
.skeleton-card {
  pointer-events: none;
  border-color: rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.4);
}

.skeleton-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255, 0.03) 25%, rgba(255,255,255, 0.08) 50%, rgba(255,255,255, 0.03) 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 6px;
}

.skeleton-line {
  height: 14px;
  border-radius: 4px;
}

.width-80 { width: 80%; height: 16px; margin-bottom: 4px; }
.width-60 { width: 60%; }
.width-40 { width: 40%; height: 36px; border-radius: 8px; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

</style>

<style scoped>
/* Custom Override for Table Rows - Even Rows Lighter */
.order-table-wrap table tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.04) !important;
}
</style>

<style scoped>
/* Custom Override for Table Rows - Even Rows Lighter */
.order-table-wrap table tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.04) !important;
}

/* Input Spinner */
.input-spinner {
  position: absolute;
  right: 48px; /* Adjusted position */
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-left-color: #3b82f6; 
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  pointer-events: none;
}

/* Success Check Icon */
.input-success-icon {
  position: absolute;
  right: 48px; /* Adjusted position */
  top: 50%;
  transform: translateY(-50%);
  color: #10b981; /* Green */
  font-size: 18px;
  pointer-events: none;
  animation: fadeIn 0.3s ease-out;
}

@keyframes spin { 100% { transform: translateY(-50%) rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-50%) scale(0.8); } to { opacity: 1; transform: translateY(-50%) scale(1); } }
</style>

<style scoped>
/* ================= MOBILE SUB-DOCK (ABOVE BOTTOM BAR) ================= */
.mobile-entry-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1045;
  background: transparent;
}

.mobile-tabs-header {
  display: flex;
  align-items: stretch;
  background: rgba(15, 23, 42, 0.94);
  padding: 5px;
  position: fixed;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 14px;
  right: 14px;
  top: auto;
  z-index: 1050;
  margin: 0;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(2, 6, 23, 0.65);
  gap: 4px;
}

@media (max-width: 768px) {
  .mobile-tabs-header {
    bottom: calc(80px + env(safe-area-inset-bottom));
    left: 10px;
    right: 10px;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  .mobile-tabs-header.is-dock-down {
    transform: translateY(70px);
  }
}

.m-tab-item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 7px 2px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
}

.m-tab-item i {
  font-size: 16px;
  margin-bottom: 0;
}

.m-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  line-height: 1.1;
}

.m-tab-caret {
  font-size: 13px !important;
  margin-left: 1px;
}

.m-tab-item.active {
  background: #ffffff !important;
  color: #15803d !important;
  box-shadow: 0 4px 14px rgba(255, 255, 255, 0.22);
  transform: scale(1.02);
}

.m-tab-item.active i {
  color: #15803d !important;
}

.m-badge {
  position: absolute;
  top: 3px;
  right: 12%;
  background: #ef4444;
  color: white;
  font-size: 9px;
  padding: 2px 5px;
  border-radius: 10px;
  line-height: 1;
  border: 1px solid #0f172a;
}

.m-badge.is-count {
  background: #059669;
  color: #ecfdf5;
}

/* Shared Grab-sheet helpers (hidden on desktop) */
.grab-sheet-handle,
.grab-detail-topbar {
  display: none;
}

.text-invoice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.text-invoice-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
}

.grab-sheet-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.65);
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.grab-sheet-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

/* On Mobile, ensure single scroll flow & Grab-style Bottom Sheet modals */
@media (max-width: 1024px) {
  .layout-grid {
    display: block !important;
    height: auto !important;
  }

  .left-stack,
  .center-stack,
  .right-stack {
    width: 100% !important;
    display: block;
    max-width: none !important;
    padding: 0 !important;
    height: auto !important;
    min-height: 0;
  }

  .pc-right-scroll {
    display: contents;
  }

  .pc-checkout-footer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 12px 12px;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .page {
    padding: 0 0 calc(92px + env(safe-area-inset-bottom)) 0 !important;
    overflow: visible !important;
    overflow-x: clip !important;
    --mobile-filter-gap: clamp(3px, 1.2vw, 6px);
    --mobile-filter-height: clamp(30px, 7.5vw, 36px);
    --mobile-filter-font: clamp(9px, 2.1vw, 11px);
    --mobile-filter-icon: clamp(10px, 2.8vw, 12px);
    --mobile-filter-stock-w: clamp(56px, 16vw, 72px);
    --mobile-filter-cat-w: clamp(70px, 22vw, 96px);
    --mobile-filter-size-w: clamp(46px, 14vw, 60px);
    --mobile-filter-btn: clamp(30px, 8vw, 34px);
    height: auto !important;
    min-height: 100% !important;
  }

  .entry-box {
    padding: 0 !important;
    height: auto !important;
  }

  .entry-box > .entry-header {
    position: sticky;
    top: 0;
    z-index: 40;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }

  .entry-box > .entry-header .catalog-toolbar-unified {
    border-radius: 0 !important;
    background: rgba(15, 23, 42, 0.96) !important;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 6px 18px rgba(2, 6, 23, 0.45);
  }

  .entry-body {
    height: auto !important;
    overflow: visible !important;
    border-radius: 0 !important;
    border: none !important;
    padding: 12px 10px 16px !important;
  }

  .manual-entry-header {
    display: none;
    margin: 0;
    padding: 0;
    border: none;
  }

  .entry-body.entry-body-manual {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0 !important;
    overflow: visible !important;
  }

  .mobile-filters-row {
    gap: var(--mobile-filter-gap);
  }

  .mobile-filter-wrap {
    min-width: 0;
    overflow: hidden;
  }

  .mobile-filter-stock {
    width: var(--mobile-filter-stock-w);
    max-width: var(--mobile-filter-stock-w);
    flex: 0 0 var(--mobile-filter-stock-w);
  }

  .mobile-filter-cat {
    width: var(--mobile-filter-cat-w);
    max-width: var(--mobile-filter-cat-w);
    flex: 0 0 var(--mobile-filter-cat-w);
  }

  .mobile-filter-size {
    width: var(--mobile-filter-size-w);
    max-width: var(--mobile-filter-size-w);
    flex: 0 0 var(--mobile-filter-size-w);
  }

  .mobile-filter-select {
    width: 100%;
    min-width: 0;
    height: var(--mobile-filter-height);
    padding: 0 8px 0 6px;
    font-size: var(--mobile-filter-font);
  }

  .mobile-filter-icon {
    right: 6px;
    font-size: var(--mobile-filter-icon);
  }

  .mobile-filter-checkbox {
    height: var(--mobile-filter-height);
    padding: 0 6px;
    font-size: var(--mobile-filter-font);
    gap: 3px;
  }

  .mobile-filter-checkbox .app-ico {
    font-size: clamp(12px, 3.6vw, 14px);
  }

  .mobile-filter-reset {
    width: var(--mobile-filter-btn);
    height: var(--mobile-filter-btn);
  }

  /* Adjust Boxes for Tab View */
  .box {
    margin-bottom: 0 !important;
    border-radius: 0 !important;
    border: none !important;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1) !important;
  }

  /* Single-flow Customer / Delivery Tab */
  .info-row-2col {
    display: block;
  }

  .customer-scroll-container {
    max-height: none !important;
    overflow: visible !important;
    padding-bottom: 4px !important;
  }

  .customer-next-wrap,
  .order-next-wrap {
    padding: 12px 12px 8px !important;
    max-width: 480px;
  }

  /* Single-flow Payment Tab (Option 1B: 1 luồng cuộn) */
  .bottom-row {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 12px;
  }

  .payment-scroll {
    flex: none !important;
    max-height: none !important;
    overflow: visible !important;
    padding-bottom: 0 !important;
  }

  .footer-export-actions.is-mobile-export {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 10px !important;
    width: 100% !important;
    min-width: 0 !important;
  }

  .footer-export-actions.is-mobile-export .btn-preview,
  .footer-export-actions.is-mobile-export .btn-text {
    min-height: 48px !important;
    padding: 10px 8px !important;
    font-size: 12px !important;
    flex-direction: row !important;
    gap: 6px !important;
  }

  .submit-stack.mobile-scroll-submit {
    position: static !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 10px !important;
    width: 100% !important;
    min-width: 0 !important;
    height: auto !important;
    padding: 2px 0 4px !important;
  }

  .submit-stack.mobile-scroll-submit .btn-complete {
    grid-column: 1 / -1;
    min-height: 56px !important;
    padding: 14px 16px !important;
    font-size: 16px !important;
    flex-direction: row !important;
    gap: 8px !important;
  }

  /* Single-flow Catalog & Order & Manual Entry */
  .catalog-grid-section {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    padding-bottom: 8px !important;
  }

  .catalog-grid-section .product-card-horizontal.is-mobile-in-cart {
    border-color: rgba(16, 185, 129, 0.72) !important;
    background: linear-gradient(145deg, rgba(16, 185, 129, 0.14), rgba(15, 23, 42, 0.96)) !important;
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.28), 0 6px 16px rgba(2, 6, 23, 0.35) !important;
  }

  .mobile-detail-info-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(15, 23, 42, 0.78);
    color: #e2e8f0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    z-index: 3;
    cursor: pointer;
    padding: 0;
  }

  .mobile-cart-qty-badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
    min-width: 24px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.45);
    z-index: 3;
  }

  .mobile-quick-add-row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-top: 8px;
  }

  .mobile-tap-add-btn {
    flex: 1;
    height: 30px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid rgba(16, 185, 129, 0.45);
    background: rgba(16, 185, 129, 0.14);
    color: #34d399;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
  }

  .mobile-tap-add-btn:disabled {
    background: rgba(51, 65, 85, 0.5);
    border-color: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
    cursor: not-allowed;
  }

  .mobile-live-stepper {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .mobile-live-stepper .qty-btn-circle {
    width: 28px;
    height: 28px;
    font-size: 15px;
  }

  .mobile-live-stepper .mobile-qty-minus {
    background: rgba(239, 68, 68, 0.18);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.35);
    box-shadow: none;
  }

  .mobile-live-qty-input {
    width: 44px !important;
    height: 28px !important;
    font-size: 13px !important;
    color: #ecfdf5 !important;
    background: rgba(16, 185, 129, 0.2) !important;
    border-color: rgba(52, 211, 153, 0.55) !important;
  }

  .mobile-added-pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.18);
    border: 1px solid rgba(52, 211, 153, 0.4);
    color: #6ee7b7;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
    margin-right: auto;
  }

  .order-box {
    height: auto !important;
    min-height: 0;
    overflow: visible !important;
    padding: 14px 12px !important;
  }

  .order-card-container {
    flex: none;
    min-height: 0;
  }

  .order-card-list {
    max-height: none !important;
    overflow: visible !important;
    padding-bottom: 8px !important;
  }

  .manual-mobile-block-parent {
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    padding: 8px !important;
    display: block;
    background: transparent;
    border-radius: 0;
    margin: 0;
  }

  .manual-content {
    height: auto !important;
    overflow: visible !important;
  }

  .mv4-card {
    margin-bottom: 8px;
    gap: 12px;
  }

  .mv4-section {
    gap: 10px;
    padding: 12px;
  }

  /* ================= GRAB-STYLE MOBILE BOTTOM SHEET MODALS ================= */
  .grab-modal-overlay {
    position: fixed !important;
    inset: 0 !important;
    z-index: 9999 !important;
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
    padding: max(96px, calc(env(safe-area-inset-top) + 76px)) 0 0 0 !important;
    background: rgba(2, 6, 23, 0.72) !important;
    backdrop-filter: blur(6px) !important;
    -webkit-backdrop-filter: blur(6px) !important;
  }

  .grab-sheet {
    width: 100% !important;
    max-width: 100% !important;
    max-height: calc(100dvh - max(96px, calc(env(safe-area-inset-top) + 76px))) !important;
    min-height: 0 !important;
    margin: 0 !important;
    border-radius: 22px 22px 0 0 !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: none !important;
    border-top: 1px solid rgba(148, 163, 184, 0.22) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    box-shadow: 0 -16px 40px rgba(0, 0, 0, 0.65) !important;
    animation: grabSheetSlideUp 0.26s cubic-bezier(0.22, 1, 0.36, 1) !important;
  }

  .grab-sheet-handle {
    display: block;
    width: 44px;
    height: 5px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.42);
    margin: 10px auto 4px;
    flex-shrink: 0;
    cursor: pointer;
  }

  /* 1. Product Detail Sheet */
  .product-detail-box.grab-sheet {
    padding: 0 !important;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%) !important;
  }

  .product-detail-box.grab-sheet .desktop-detail-close {
    display: none !important;
  }

  .grab-detail-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 16px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    flex-shrink: 0;
  }

  .grab-detail-topbar-title {
    font-size: 15px;
    font-weight: 800;
    color: #f8fafc;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .product-detail-box.grab-sheet .detail-grid {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
    padding: 14px 16px 0 !important;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .product-detail-box.grab-sheet .main-image {
    height: 210px !important;
  }

  .product-detail-box.grab-sheet .detail-actions {
    position: sticky;
    bottom: 0;
    z-index: 5;
    margin: 12px -16px 0;
    padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
    background: rgba(15, 23, 42, 0.97);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-top: 1px solid rgba(148, 163, 184, 0.14);
  }

  /* 2 & 3. Edit Cart Item & Global Discount Sheets */
  .premium-modal-v4.grab-sheet .pmv4-header {
    padding: 8px 16px 12px;
    flex-shrink: 0;
  }

  .premium-modal-v4.grab-sheet .pmv4-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(148, 163, 184, 0.12);
    color: #e2e8f0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .premium-modal-v4.grab-sheet .pmv4-body {
    padding: 16px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .premium-modal-v4.grab-sheet .pmv4-footer {
    padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
    flex-shrink: 0;
    background: rgba(15, 23, 42, 0.98);
  }

  .premium-modal-v4.grab-sheet .pmv4-btn-ghost {
    flex: 1;
    min-height: 44px;
    background: rgba(148, 163, 184, 0.1);
  }

  .premium-modal-v4.grab-sheet .pmv4-btn-primary {
    flex: 2;
    min-height: 44px;
  }

  /* 4. Text Invoice Sheet */
  .text-invoice-box.grab-sheet {
    padding: 0 16px calc(16px + env(safe-area-inset-bottom)) !important;
  }

  .text-invoice-box.grab-sheet .text-invoice-header {
    padding: 6px 0 10px;
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    flex-shrink: 0;
  }

  .text-invoice-box.grab-sheet textarea {
    flex: 1;
    min-height: 160px;
    max-height: 46dvh;
    overflow-y: auto;
  }

  .text-invoice-box.grab-sheet .actions {
    flex-shrink: 0;
    padding-top: 12px;
    margin-top: 0;
  }

  .text-invoice-box.grab-sheet .actions .btn {
    flex: 1;
    min-height: 44px;
    justify-content: center;
  }

  /* 5. VIP Success Sheet */
  .vip-success-card.grab-sheet {
    padding: 6px 24px calc(24px + env(safe-area-inset-bottom)) !important;
  }
}

@media (max-width: 768px) {
  .page {
    padding-bottom: calc(96px + env(safe-area-inset-bottom)) !important;
  }
}

@keyframes grabSheetSlideUp {
  from {
    opacity: 0;
    transform: translateY(48px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style scoped>
/* ================= MOBILE ENTRY DROP-UP (SUB-DOCK) ================= */
.mobile-entry-dropdown {
  position: absolute;
  bottom: calc(100% + 10px);
  top: auto;
  left: 0;
  min-width: 150px;
  width: max-content;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 14px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.55);
  z-index: 2000;
  margin: 0;
  overflow: hidden;
  animation: subDockDropUp 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.me-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
  white-space: nowrap;
}

.me-dropdown-item:last-child {
  border-bottom: none;
}

.me-dropdown-item i {
  font-size: 16px;
}

.me-dropdown-item.active {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
}

@keyframes subDockDropUp {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style scoped>
/* Update Text Invoice Modal Background */
.text-invoice-box {
  background: #1e293b !important; /* Matches product-card theme */
  border: 1px solid rgba(148, 163, 184, 0.1) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
  color: #fff !important;
}

.text-invoice-box textarea {
  background: rgba(15, 23, 42, 0.6) !important; /* Slightly darker input bg */
  border-color: rgba(148, 163, 184, 0.1) !important;
  color: #e2e8f0 !important;
}

/* ================= MULTI-ORDER TABS BAR ================= */
.invoice-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  margin-bottom: 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.invoice-tabs-scroll {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: thin;
  padding-bottom: 2px;
}

.invoice-tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 190px;
  padding: 6px 10px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(30, 41, 59, 0.72);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.invoice-tab-pill:hover {
  border-color: rgba(52, 211, 153, 0.45);
  color: #f8fafc;
}

.invoice-tab-pill.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.24), rgba(5, 150, 105, 0.28));
  border-color: rgba(52, 211, 153, 0.7);
  color: #ecfdf5;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.22);
}

.invoice-tab-pill .itp-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #64748b;
  flex-shrink: 0;
}

.invoice-tab-pill.active .itp-dot {
  background: #34d399;
}

.invoice-tab-pill.is-approved .itp-dot {
  background: #38bdf8;
}

.invoice-tab-pill .itp-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.invoice-tab-pill .itp-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.9);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.invoice-tab-pill .itp-close {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.invoice-tab-pill .itp-close:hover {
  background: rgba(239, 68, 68, 0.24);
  color: #fecaca;
}

.invoice-tab-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 999px;
  border: 1px dashed rgba(52, 211, 153, 0.65);
  background: rgba(16, 185, 129, 0.14);
  color: #6ee7b7;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.invoice-tab-add-btn:hover {
  background: rgba(16, 185, 129, 0.28);
  border-style: solid;
  color: #ecfdf5;
  transform: scale(1.05);
}

/* ================= ORDER VIEW MODE (THEO TỪNG NGƯỜI / DẠNG GỘP) ================= */
.order-header-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.order-view-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.ov-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.ov-btn:hover {
  color: #e2e8f0;
}

.ov-btn.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.26), rgba(5, 150, 105, 0.34));
  color: #ecfdf5;
  box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.55);
}

.order-table-empty {
  text-align: center;
  padding: 20px 12px !important;
  color: #64748b;
  font-style: italic;
}

.order-group-row td {
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.86)) !important;
  border-top: 1px solid rgba(56, 189, 248, 0.25) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18) !important;
  padding: 7px 12px !important;
}

.ogr-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ogr-left {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #e2e8f0;
  font-size: 12.5px;
  font-weight: 800;
}

.ogr-left i {
  color: #38bdf8;
  font-size: 14px;
}

.ogr-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.ogr-qty {
  color: #94a3b8;
  font-weight: 700;
}

.ogr-total {
  color: #34d399;
  font-weight: 800;
}

.omg-badge {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(56, 189, 248, 0.16);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.omg-badge.role-host {
  background: rgba(16, 185, 129, 0.16);
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.35);
}

.omg-badge.role-admin {
  background: rgba(245, 158, 11, 0.16);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.35);
}

.order-member-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.order-member-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 11px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.28);
}

.omg-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: #f1f5f9;
  font-size: 12.5px;
  font-weight: 800;
}

.omg-left i {
  color: #38bdf8;
  flex-shrink: 0;
}

.omg-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.omg-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  font-size: 12px;
}

.omg-qty {
  color: #94a3b8;
  font-weight: 700;
}

.omg-total {
  color: #34d399;
  font-weight: 800;
}

.order-member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.om-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(15, 23, 42, 0.65);
  color: #bae6fd;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.om-chip:hover {
  border-color: rgba(56, 189, 248, 0.65);
  background: rgba(30, 41, 59, 0.9);
}

.om-chip.is-admin {
  border-color: rgba(245, 158, 11, 0.35);
  color: #fde68a;
}

.om-chip em {
  font-style: italic;
  color: #94a3b8;
  font-size: 10.5px;
}

@media (max-width: 640px) {
  .order-header-right {
    width: 100%;
    justify-content: space-between;
  }
  .ov-btn {
    padding: 5px 8px;
    font-size: 11px;
  }
}

/* ================= ONLINE ORDER LIFECYCLE SYNC (STATUS & ACTIONS) ================= */
.itp-status-tag {
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.itp-status-tag.status-waiting,
.order-live-status-pill.status-waiting {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.45);
}

.itp-status-tag.status-processing,
.order-live-status-pill.status-processing {
  background: rgba(6, 182, 212, 0.18);
  color: #67e8f9;
  border: 1px solid rgba(6, 182, 212, 0.45);
}

.itp-status-tag.status-shipping,
.order-live-status-pill.status-shipping {
  background: rgba(99, 102, 241, 0.22);
  color: #c7d2fe;
  border: 1px solid rgba(99, 102, 241, 0.48);
}

.itp-status-tag.status-done,
.order-live-status-pill.status-done {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.48);
}

.itp-status-tag.status-cancelled,
.order-live-status-pill.status-cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.45);
}

.invoice-tab-pill.status-waiting .itp-dot { background: #fbbf24; }
.invoice-tab-pill.status-processing .itp-dot { background: #22d3ee; }
.invoice-tab-pill.status-shipping .itp-dot { background: #818cf8; }
.invoice-tab-pill.status-done .itp-dot { background: #34d399; }
.invoice-tab-pill.status-cancelled .itp-dot { background: #f87171; }

.order-title-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.order-live-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.order-back-donhang-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.75);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.order-back-donhang-btn:hover {
  border-color: rgba(56, 189, 248, 0.55);
  color: #f8fafc;
}

.submit-stack .btn-order-draft {
  background: linear-gradient(135deg, #334155, #475569) !important;
  color: #f8fafc !important;
}

.submit-stack .btn-order-approve {
  background: linear-gradient(135deg, #0891b2, #06b6d4) !important;
  color: #ffffff !important;
}

.submit-stack .btn-order-ship {
  background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
  color: #ffffff !important;
}

.submit-stack .btn-order-cancel {
  background: linear-gradient(135deg, #dc2626, #ef4444) !important;
  color: #ffffff !important;
}

.entry-member-target-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.emtb-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  white-space: nowrap;
}

.emtb-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.emtb-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.emtb-pill:hover {
  border-color: rgba(56, 189, 248, 0.5);
  color: #f8fafc;
}

.emtb-pill.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25));
  border-color: rgba(52, 211, 153, 0.75);
  color: #ecfdf5;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.22);
}

.emtb-badge {
  font-style: normal;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.55);
  color: #a5f3fc;
}

.ogr-add-for-btn,
.omg-add-for-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(30, 41, 59, 0.85);
  color: #7dd3fc;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.ogr-add-for-btn:hover,
.omg-add-for-btn:hover {
  border-color: rgba(56, 189, 248, 0.7);
  color: #e0f2fe;
}

.ogr-add-for-btn.active,
.omg-add-for-btn.active {
  background: rgba(16, 185, 129, 0.22);
  border-color: rgba(52, 211, 153, 0.75);
  color: #6ee7b7;
}

.pmv4-member-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pmv4-member-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.75);
  color: #cbd5e1;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pmv4-member-pill.active {
  background: rgba(14, 165, 233, 0.22);
  border-color: rgba(56, 189, 248, 0.8);
  color: #e0f2fe;
}

/* ================= SEARCH RESULT HIGHLIGHT ================= */
.search-box-unified.has-query .search-input-unified {
  border-color: rgba(250, 204, 21, 0.85);
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.22);
}

.search-box-unified.has-query .search-icon {
  color: #eab308;
}

.search-result-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 9px;
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  color: #fef08a;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.search-result-banner .srb-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-banner .srb-text strong {
  color: #fde047;
  font-weight: 900;
}

.search-result-banner .srb-text em {
  font-style: normal;
  color: #ffffff;
  font-weight: 700;
}

.search-result-banner .srb-clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.35);
  background: rgba(250, 204, 21, 0.14);
  color: #fef08a;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.search-result-banner .srb-clear:hover {
  background: rgba(250, 204, 21, 0.26);
}

.catalog-grid-section .product-card-horizontal.is-search-match {
  border-color: rgba(250, 204, 21, 0.45);
  box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.15), 0 6px 16px rgba(2, 6, 23, 0.35);
}

.search-hl-mark {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.92), rgba(245, 158, 11, 0.92));
  color: #0f172a;
  font-weight: 900;
  padding: 0 3px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(250, 204, 21, 0.35);
}

/* ================= PC 3-COLUMN LAYOUT & STACKED RIGHT PANEL ================= */
@media (min-width: 1025px) {
  .page {
    padding: 10px;
  }

  .layout-grid {
    --col-left: minmax(285px, 1fr);
    --col-center: minmax(430px, 1.42fr);
    --col-right: minmax(290px, 0.9fr);
    grid-template-columns: var(--col-left) 10px var(--col-center) 10px var(--col-right);
    gap: 0;
  }

  .layout-grid.is-resizing-cols,
  .layout-grid.is-resizing-cols * {
    user-select: none !important;
    cursor: col-resize !important;
  }

  .layout-grid.is-left-collapsed {
    --col-left: 44px !important;
  }

  .layout-grid.is-center-collapsed {
    --col-center: 44px !important;
  }

  .layout-grid.is-center-collapsed:not(.is-left-collapsed) {
    --col-left: minmax(280px, 1fr) !important;
  }

  .layout-grid.is-center-collapsed.is-left-collapsed:not(.is-right-collapsed) {
    --col-right: minmax(280px, 1fr) !important;
  }

  .layout-grid.is-right-collapsed {
    --col-right: 44px !important;
  }

  /* --- DRAG RESIZER HANDLES --- */
  .pc-col-resizer {
    position: relative;
    width: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: col-resize;
    z-index: 15;
    touch-action: none;
  }

  .pc-resizer-grip {
    width: 3px;
    height: 44px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.25);
    transition: all 0.16s ease;
  }

  .pc-col-resizer:hover .pc-resizer-grip,
  .pc-col-resizer.active .pc-resizer-grip {
    width: 4px;
    height: 76px;
    background: #22c55e;
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
  }

  .pc-col-resizer.disabled {
    cursor: default;
    pointer-events: none;
  }

  .pc-col-resizer.disabled .pc-resizer-grip {
    opacity: 0.18;
    height: 24px;
  }

  .prpb-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .pc-col-reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 8px;
    border-radius: 8px;
    border: 1px solid rgba(56, 189, 248, 0.35);
    background: rgba(14, 165, 233, 0.14);
    color: #7dd3fc;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .pc-col-reset-btn:hover {
    border-color: rgba(56, 189, 248, 0.65);
    background: rgba(14, 165, 233, 0.24);
    color: #e0f2fe;
  }

  /* --- COLUMN TOGGLE BUTTONS & COLLAPSED RAILS --- */
  .pc-col-toggle-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: rgba(30, 41, 59, 0.85);
    color: #cbd5e1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.16s ease;
  }

  .pc-col-toggle-btn:hover {
    border-color: rgba(34, 197, 94, 0.6);
    background: rgba(16, 185, 129, 0.18);
    color: #ffffff;
  }

  .pc-col-rail {
    flex: 1;
    width: 100%;
    height: 100%;
    padding: 14px 4px;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98));
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 14px;
    cursor: pointer;
    transition: all 0.18s ease;
    box-shadow: 0 10px 26px rgba(2, 6, 23, 0.45);
  }

  .pc-col-rail:hover {
    border-color: rgba(34, 197, 94, 0.55);
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.16), rgba(15, 23, 42, 0.96));
  }

  .pc-rail-ico {
    font-size: 18px;
    color: #4ade80;
    flex-shrink: 0;
  }

  .pc-rail-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 11.5px;
    font-weight: 900;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #cbd5e1;
    white-space: nowrap;
  }

  .pc-rail-badge {
    min-width: 24px;
    height: 24px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(34, 197, 94, 0.22);
    border: 1px solid rgba(34, 197, 94, 0.5);
    color: #4ade80;
    font-size: 11px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pc-rail-total {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    margin-top: auto;
    font-size: 11.5px;
    font-weight: 900;
    color: #4ade80;
    white-space: nowrap;
  }

  .pc-right-panel-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 0;
    background: rgba(2, 6, 23, 0.62);
    border: none;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    flex-shrink: 0;
  }

  .prpb-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 900;
    letter-spacing: 0.7px;
    color: #e2e8f0;
    text-transform: uppercase;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .prpb-title i {
    color: #4ade80;
    font-size: 15px;
  }

  .pc-collapsible-header {
    cursor: pointer;
    user-select: none;
  }

  .pc-card-title-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .pc-card-header-right {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .pc-card-mini-val {
    max-width: 105px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: none;
    letter-spacing: 0;
    color: #6ee7b7;
    background: rgba(16, 185, 129, 0.14);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 1px 6px;
    border-radius: 999px;
  }

  .pc-card-chevron {
    font-size: 16px !important;
    color: #94a3b8 !important;
    filter: none !important;
    transition: transform 0.18s ease;
  }

  .right-stack .box.is-pc-collapsed > h3,
  .right-stack .box.is-pc-collapsed > h3.card-title {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
    border-bottom: none !important;
  }

  /* --- LEFT COLUMN: KHO HÀNG --- */
  .left-stack .entry-box {
    padding: 0;
    overflow: hidden;
  }

  .left-stack .entry-box .catalog-toolbar-unified {
    padding: 10px 12px;
    gap: 8px;
    row-gap: 8px;
  }

  .left-stack .toolbar-section-title {
    gap: 8px;
    padding-bottom: 8px;
    margin-bottom: 0;
  }

  .left-stack .entry-mode-toggle {
    gap: 6px;
    min-width: 0;
  }

  .left-stack .mode-btn {
    padding: 7px 10px;
    font-size: 12px;
    gap: 5px;
  }

  .left-stack .mode-btn i {
    font-size: 14px;
  }

  .left-stack .pc-toolbar-row-2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .left-stack .pc-search-full {
    flex: 1 1 100%;
    min-width: 0;
  }

  .left-stack .pc-search-full .search-input-unified {
    height: 34px;
    font-size: 12.5px;
  }

  .left-stack .pc-toolbar-row-2 .filter-item {
    flex: 1 1 0;
    min-width: 78px;
  }

  .left-stack .pc-toolbar-row-2 .custom-select-wrapper,
  .left-stack .pc-toolbar-row-2 .custom-select {
    width: 100%;
    min-width: 0;
    height: 32px;
    font-size: 11.5px;
  }

  .left-stack .pc-toolbar-row-2 .filter-checkbox-btn {
    height: 32px;
    padding: 0 8px;
    font-size: 11.5px;
  }

  .left-stack .pc-toolbar-row-2 .btn-reset-icon {
    width: 32px;
    height: 32px;
  }

  .left-stack .entry-body {
    padding: 10px 12px;
    gap: 10px;
    border-radius: 0 0 14px 14px;
  }

  .left-stack .catalog-grid-section {
    container-type: inline-size;
    container-name: catalog-grid;
    width: 100%;
    min-width: 0;
  }

  .left-stack .catalog-grid-section .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(235px, 100%), 1fr));
    gap: 8px;
    padding: 2px 0 8px;
  }

  .left-stack .catalog-grid-section .product-card-horizontal {
    min-height: 114px;
  }

  .left-stack .catalog-grid-section .pc-media-horizontal {
    width: 86px;
    min-width: 86px;
  }

  .left-stack .catalog-grid-section .pc-content-horizontal {
    padding: 7px 9px;
  }

  .left-stack .catalog-grid-section .pc-name-horizontal {
    font-size: 12.5px;
    min-height: 32px;
    margin-bottom: 3px;
  }

  .left-stack .catalog-grid-section .price-sale,
  .left-stack .catalog-grid-section .price-normal {
    font-size: 13px;
  }

  @container catalog-grid (max-width: 479px) {
    .left-stack .catalog-grid-section .product-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @container catalog-grid (max-width: 336px) {
    .left-stack .catalog-grid-section .product-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .left-stack .catalog-grid-section .product-card-horizontal {
      flex-direction: column !important;
      height: auto !important;
      min-height: 0;
    }

    .left-stack .catalog-grid-section .pc-media-horizontal {
      width: 100% !important;
      min-width: 0 !important;
      height: 110px !important;
      min-height: 110px !important;
    }

    .left-stack .catalog-grid-section .pc-content-horizontal {
      width: 100%;
      padding: 8px 10px 10px;
      gap: 6px;
    }

    .left-stack .catalog-grid-section .pc-name-horizontal {
      min-height: auto;
      margin-bottom: 2px;
    }

    .left-stack .catalog-grid-section .pc-info-group {
      gap: 6px;
    }

    .left-stack .catalog-grid-section .pc-price-stock-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .left-stack .catalog-grid-section .qty-note-row {
      width: 100%;
      margin-top: 4px;
      gap: 6px;
    }

    .left-stack .catalog-grid-section .qty-input-box {
      width: 44px;
    }

    .left-stack .catalog-grid-section .note-popover-horizontal {
      width: min(200px, calc(100% - 8px));
      left: 4px;
      right: 4px;
    }
  }

  .left-stack .manual-entry-header {
    padding: 10px 12px;
    margin-bottom: 0;
    border-bottom: 1px dashed rgba(148, 163, 184, 0.15);
  }

  .left-stack .manual-entry-header .entry-mode-toggle {
    width: 100%;
  }

  /* --- CENTER COLUMN: BẢNG ĐƠN HÀNG + CỘT TAB DỌC --- */
  .center-stack {
    flex-direction: row;
    align-items: stretch;
    gap: 0;
  }

  .center-stack .order-box {
    padding: 12px;
    min-width: 0;
  }

  .center-stack .order-box table thead th {
    font-size: 10.5px;
    padding: 10px 6px;
    letter-spacing: 0.05em;
  }

  .center-stack .order-box table th,
  .center-stack .order-box table td {
    padding: 10px 6px;
    font-size: 12.5px;
  }

  .center-stack .prod-name {
    font-size: 13px;
  }

  .center-stack .prod-sub,
  .center-stack .disc-cell {
    font-size: 11px;
  }

  /* --- RIGHT COLUMN: UNIFIED POS INSPECTOR PANEL + STICKY FOOTER --- */
  .right-stack {
    overflow: hidden;
    min-width: 0;
    gap: 0;
  }

  .right-stack:not(.is-pc-collapsed) {
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.97), rgba(2, 6, 23, 0.99));
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 12px 32px rgba(2, 6, 23, 0.46);
  }

  .pc-right-tabs {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 8px 10px;
    background: rgba(2, 6, 23, 0.42);
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }

  .pc-right-tab-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    height: 33px;
    padding: 0 10px;
    border-radius: 9px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(30, 41, 59, 0.45);
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.16s ease;
  }

  .pc-right-tab-btn:hover {
    color: #e2e8f0;
    background: rgba(30, 41, 59, 0.78);
  }

  .pc-right-tab-btn.active {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.24), rgba(5, 150, 105, 0.18));
    border-color: rgba(34, 197, 94, 0.55);
    color: #ecfdf5;
    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.16);
  }

  .pc-tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .pc-tab-badge.is-ok {
    background: rgba(34, 197, 94, 0.22);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.45);
  }

  .pc-tab-badge.is-disc {
    background: rgba(239, 68, 68, 0.24);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.45);
  }

  .pc-right-scroll {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
  }

  .pc-right-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .pc-right-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.28);
    border-radius: 99px;
  }

  .right-stack .info-row-2col {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    width: 100%;
  }

  .right-stack .customer-scroll-container,
  .right-stack .summary-stack {
    display: flex !important;
    flex-direction: column !important;
    grid-template-columns: 1fr !important;
    gap: 12px !important;
    min-width: 0 !important;
    width: 100% !important;
    padding: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
  }

  .right-stack .bottom-row {
    display: block;
    min-width: 0 !important;
    width: 100% !important;
    padding-top: 0 !important;
    border-top: none !important;
  }

  .right-stack .payment-scroll {
    min-width: 0 !important;
    width: 100% !important;
  }

  .right-stack .customer-box,
  .right-stack .delivery-box,
  .right-stack .summary-card {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    min-width: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: visible !important;
  }

  .right-stack .delivery-box,
  .right-stack .summary-card--order {
    padding-top: 12px !important;
    border-top: 1px solid rgba(148, 163, 184, 0.14) !important;
  }

  .right-stack .customer-box:hover,
  .right-stack .delivery-box:hover,
  .right-stack .summary-card:hover {
    transform: none;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  .right-stack .delivery-box:hover,
  .right-stack .summary-card--order:hover {
    border-top-color: rgba(148, 163, 184, 0.14) !important;
  }

  .right-stack .customer-box > h3,
  .right-stack .delivery-box > h3,
  .right-stack .summary-card .card-title {
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.75px !important;
    text-transform: uppercase !important;
    color: #cbd5e1 !important;
    padding-bottom: 0 !important;
    margin-bottom: 8px !important;
    border-bottom: none !important;
  }

  .right-stack .customer-box > h3 i,
  .right-stack .delivery-box > h3 i,
  .right-stack .summary-card .card-title i {
    font-size: 14px !important;
    color: #4ade80 !important;
    filter: none !important;
  }

  .right-stack .pc-card-body {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .right-stack .field-row {
    display: grid;
    grid-template-columns: 94px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    margin-bottom: 0 !important;
    min-width: 0;
  }

  .right-stack .field-row label {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #94a3b8 !important;
    line-height: 1.25;
    white-space: nowrap;
  }

  .right-stack .field-control {
    min-width: 0;
  }

  .right-stack .customer-box input,
  .right-stack .customer-box select,
  .right-stack .delivery-box input,
  .right-stack .delivery-box select {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    height: 34px;
    padding: 0 10px !important;
    font-size: 12.5px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(148, 163, 184, 0.2) !important;
    background: rgba(30, 41, 59, 0.65) !important;
    color: #f8fafc !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
  }

  .right-stack .customer-box input:focus,
  .right-stack .customer-box select:focus,
  .right-stack .delivery-box input:focus,
  .right-stack .delivery-box select:focus,
  .right-stack .delivery-box textarea:focus,
  .right-stack .exchange-rate-section .er-input:focus {
    outline: none !important;
    border-color: rgba(34, 197, 94, 0.65) !important;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.14) !important;
  }

  .right-stack .delivery-time-row {
    flex-wrap: nowrap;
    gap: 5px;
    min-width: 0;
  }

  .right-stack .delivery-time-row .time-select {
    width: auto !important;
    min-width: 48px;
    flex: 1 1 0;
    padding: 0 4px !important;
    text-align: center;
  }

  .right-stack .delivery-time-row .btn-now {
    height: 34px;
    padding: 0 10px;
    font-size: 11.5px;
    font-weight: 700;
    border-radius: 8px;
    white-space: nowrap;
    flex: 0 0 auto;
  }

  .right-stack .delivery-box textarea {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    min-height: 50px;
    padding: 7px 10px !important;
    font-size: 12.5px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(148, 163, 184, 0.2) !important;
    background: rgba(30, 41, 59, 0.65) !important;
    color: #f8fafc !important;
  }

  .right-stack .cust-summary-box {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    margin: 2px 0 !important;
    padding: 7px 8px !important;
    gap: 6px !important;
    border-radius: 9px !important;
    background: rgba(30, 41, 59, 0.45) !important;
    border: 1px solid rgba(148, 163, 184, 0.14) !important;
    min-width: 0;
  }

  .right-stack .cust-stat {
    min-width: 0;
  }

  .right-stack .cust-stat-label {
    font-size: 10px !important;
  }

  .right-stack .cust-stat-value {
    font-size: 11.5px !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .right-stack .summary-card .sum-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .right-stack .summary-card .sum-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 0 !important;
    min-width: 0;
  }

  .right-stack .summary-card .sum-label {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #94a3b8 !important;
    white-space: nowrap;
  }

  .right-stack .summary-card .sum-right-group {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    min-width: 0;
    flex-shrink: 1;
  }

  .right-stack .summary-card .btn-limit-red {
    padding: 2px 7px;
    font-size: 10.5px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .right-stack .summary-card .sum-value {
    font-size: 13px !important;
    font-weight: 800 !important;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .right-stack .summary-card .sum-val-base {
    color: #f8fafc !important;
  }

  .right-stack .summary-card .sum-val-disc {
    color: #f87171 !important;
  }

  .right-stack .summary-card .sum-val-profit {
    color: #4ade80 !important;
  }

  .right-stack .summary-card .sum-row.is-ship .sum-label,
  .right-stack .summary-card .sum-row.is-ship .sum-value {
    color: #38bdf8 !important;
  }

  .right-stack .summary-card .sum-row.total-row {
    margin-top: 4px !important;
    padding: 7px 10px !important;
    border-radius: 8px !important;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(2, 6, 23, 0.65)) !important;
    border: 1px solid rgba(34, 197, 94, 0.42) !important;
  }

  .right-stack .summary-card .sum-label.total-label {
    font-size: 11px !important;
    font-weight: 900 !important;
    letter-spacing: 0.7px !important;
    color: #e2e8f0 !important;
  }

  .right-stack .summary-card .sum-value.total-value {
    font-size: clamp(16px, 1.35vw, 19px) !important;
    font-weight: 950 !important;
    color: #4ade80 !important;
    text-shadow: 0 0 16px rgba(34, 197, 94, 0.45) !important;
  }

  .right-stack .summary-card .sum-row.transfer-row {
    margin-top: 4px !important;
    padding: 5px 10px !important;
    border-radius: 999px !important;
    background: rgba(59, 130, 246, 0.16) !important;
    border: 1px solid rgba(59, 130, 246, 0.34) !important;
  }

  .right-stack .summary-card .sum-label.transfer-label {
    font-size: 10.5px !important;
    font-weight: 800 !important;
    color: #e2e8f0 !important;
  }

  .right-stack .summary-card .sum-value.transfer-value {
    font-size: 13px !important;
    font-weight: 900 !important;
    color: #93c5fd !important;
  }

  .right-stack .summary-card .sum-row.sub-info {
    margin-top: 4px !important;
    padding-top: 6px !important;
    border-top: 1px dashed rgba(148, 163, 184, 0.16);
  }

  .right-stack .payment-toggle-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 4px;
  }

  .right-stack .pm-label {
    font-size: 11.5px !important;
    font-weight: 600 !important;
    color: #94a3b8 !important;
  }

  .right-stack .summary-card .pay-toggle-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .right-stack .summary-card .pay-toggle {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
    padding: 3px;
    border-radius: 10px;
    background: rgba(2, 6, 23, 0.68);
    border: 1px solid rgba(148, 163, 184, 0.16);
    min-width: 0;
  }

  .right-stack .pay-qr-export-btn {
    height: 38px !important;
    padding: 0 9px !important;
    border-radius: 9px !important;
    font-size: 11.5px !important;
  }

  .right-stack .summary-card .pill-btn {
    height: 32px !important;
    padding: 0 8px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    border-radius: 7px !important;
    border: 1px solid transparent !important;
    background: transparent !important;
    color: #94a3b8 !important;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .right-stack .summary-card .pill-btn.active {
    background: rgba(16, 185, 129, 0.2) !important;
    border-color: rgba(34, 197, 94, 0.5) !important;
    color: #ecfdf5 !important;
  }

  .right-stack .summary-card .pill-btn--transfer.active {
    background: rgba(59, 130, 246, 0.22) !important;
    border-color: rgba(96, 165, 250, 0.5) !important;
    color: #eff6ff !important;
  }

  .right-stack .exchange-rate-section {
    display: grid;
    grid-template-columns: 94px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    margin: 2px 0 0 !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    min-width: 0;
  }

  .right-stack .exchange-rate-section .er-label {
    margin: 0 !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #94a3b8 !important;
    white-space: nowrap;
  }

  .right-stack .exchange-rate-section .er-input-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    width: 100%;
  }

  .right-stack .exchange-rate-section .er-input {
    flex: 1;
    min-width: 0;
    width: 100%;
    max-width: none;
    height: 34px !important;
    padding: 0 10px !important;
    text-align: right;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    border-radius: 8px !important;
    border: 1px solid rgba(148, 163, 184, 0.2) !important;
    background: rgba(30, 41, 59, 0.65) !important;
    color: #f8fafc !important;
  }

  .right-stack .exchange-rate-section .er-badge {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 7px;
  }

  .right-stack .ship-fee-hint {
    margin-left: 102px;
    margin-top: 2px;
    font-size: 10.5px;
    color: #7dd3fc;
  }

  /* --- STICKY CHECKOUT FOOTER --- */
  .pc-checkout-footer {
    flex-shrink: 0;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px 12px;
    border-radius: 0;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.98));
    border: none;
    border-top: 1px solid rgba(34, 197, 94, 0.28);
    box-shadow: 0 -8px 20px rgba(2, 6, 23, 0.35);
  }

  .pc-footer-total-bar {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .pc-ft-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
  }

  .pc-ft-left {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    overflow: hidden;
  }

  .pc-ft-label {
    font-size: 10.5px;
    font-weight: 900;
    letter-spacing: 0.7px;
    color: #cbd5e1;
    white-space: nowrap;
  }

  .pc-ft-pay-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: 999px;
    border: 1px solid rgba(34, 197, 94, 0.35);
    background: rgba(34, 197, 94, 0.14);
    color: #86efac;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .pc-ft-pay-chip.is-transfer {
    border-color: rgba(59, 130, 246, 0.45);
    background: rgba(59, 130, 246, 0.18);
    color: #93c5fd;
  }

  .pc-ft-value {
    font-size: clamp(16px, 1.35vw, 19px);
    font-weight: 950;
    color: #4ade80;
    text-shadow: 0 0 16px rgba(34, 197, 94, 0.45);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .pc-ft-transfer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.16);
    border: 1px solid rgba(59, 130, 246, 0.32);
    font-size: 10.5px;
    color: #e2e8f0;
    min-width: 0;
  }

  .pc-ft-transfer strong {
    color: #93c5fd;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
  }

  .footer-export-actions .btn,
  .pc-submit-stack .btn {
    min-width: 0;
    min-height: 36px;
    padding: 7px 8px;
    font-size: 11.5px;
    flex-direction: row;
    gap: 5px;
    border-radius: 10px;
    -webkit-text-stroke: 0;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .submit-stack.pc-submit-stack {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    min-width: 0;
    height: auto;
    width: 100%;
  }

  .pc-submit-stack .btn-complete {
    grid-column: 1 / -1;
    min-height: 44px;
    font-size: 14px;
    letter-spacing: 0.9px;
    border-radius: 12px;
  }

  .pc-submit-stack .btn-order-cancel {
    grid-column: 1 / -1;
    min-height: 36px;
  }

  .pc-submit-stack .btn-order-draft:has(+ .btn-complete),
  .pc-submit-stack .btn-order-draft:last-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1400px) {
  .layout-grid {
    --col-left: minmax(335px, 1.02fr);
    --col-center: minmax(520px, 1.48fr);
    --col-right: minmax(310px, 0.84fr);
    gap: 12px;
  }
}

@media (min-width: 1700px) {
  .layout-grid {
    --col-left: minmax(405px, 1.04fr);
    --col-center: minmax(620px, 1.52fr);
    --col-right: minmax(335px, 0.82fr);
  }
}

/* ================= ORDER TABLE COLUMN VISIBILITY SETTINGS ================= */
.order-col-settings-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ov-col-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 9px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.78);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.ov-col-btn:hover,
.ov-col-btn.active {
  border-color: rgba(34, 197, 94, 0.6);
  background: rgba(16, 185, 129, 0.18);
  color: #ecfdf5;
}

.ov-col-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.22);
  color: #6ee7b7;
  font-size: 10px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.order-col-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-width: calc(100vw - 32px);
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(34, 197, 94, 0.35);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.75);
  backdrop-filter: blur(14px);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ocp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.22);
}

.ocp-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #f8fafc;
}

.ocp-title i {
  color: #4ade80;
  font-size: 15px;
}

.ocp-close {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.ocp-close:hover {
  color: #ffffff;
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.2);
}

.ocp-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.ocp-preset-btn {
  padding: 6px 6px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(30, 41, 59, 0.75);
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ocp-preset-btn:hover {
  border-color: rgba(34, 197, 94, 0.55);
  background: rgba(16, 185, 129, 0.2);
  color: #ecfdf5;
}

.ocp-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ocp-group-title {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.ocp-check-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.ocp-check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(30, 41, 59, 0.45);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.ocp-check-item input[type='checkbox'] {
  accent-color: #22c55e;
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.ocp-check-item.checked {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(16, 185, 129, 0.12);
  color: #f8fafc;
}

.ocp-footer-switch {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(148, 163, 184, 0.22);
}

.ocp-check-full {
  width: 100%;
}

.ocp-locked-hint {
  font-size: 10.5px;
  color: #64748b;
  text-align: center;
}

/* Extra column cell styles */
.col-code-pill {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #cbd5e1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.col-muted-text {
  color: #94a3b8;
  font-size: 11.5px;
}

.col-sizedvt-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11.5px;
  color: #cbd5e1;
  white-space: nowrap;
}

.col-stock-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
}

.col-stock-badge.is-ok {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.col-stock-badge.is-out {
  background: rgba(239, 68, 68, 0.16);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.col-person-pill {
  display: inline-block;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #bae6fd;
  font-size: 11px;
  font-weight: 700;
}

.col-cost-val {
  color: #fbbf24;
  font-weight: 700;
  white-space: nowrap;
}

.col-profit-val {
  color: #4ade80;
  font-weight: 800;
  white-space: nowrap;
}

.col-profit-val.is-neg {
  color: #f87171;
}

.col-note-text {
  display: inline-block;
  max-width: 170px;
  font-size: 11.5px;
  color: #fda4af;
  font-weight: 600;
  white-space: normal;
  line-height: 1.3;
}

/* ===== FOOTER ACTION BLOCKS & EXPORT PRICE MODE ===== */
.footer-action-block {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 8px 9px;
  border-radius: 10px;
  min-width: 0;
}

.footer-order-block {
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(34, 197, 94, 0.26);
}

.fab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.fab-title-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.fab-chat-toggle-btn {
  position: relative;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 7px;
  border: 1px solid rgba(52, 211, 153, 0.72);
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-size: 13.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  transition: all 0.16s ease;
}

.fab-chat-toggle-btn:hover {
  filter: brightness(1.08);
  color: #ffffff;
}

.fab-chat-toggle-btn.is-open,
.fab-chat-toggle-btn.has-draft {
  border-color: #a7f3d0;
  background: linear-gradient(135deg, #059669, #047857);
  color: #ffffff;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.28);
}

.fab-chat-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #fbbf24;
  box-shadow: 0 0 0 1.5px #0f172a;
}

.fab-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #94a3b8;
  white-space: nowrap;
}

.fab-title i {
  font-size: 12.5px;
  color: #cbd5e1;
}

.footer-order-block .fab-title i {
  color: #4ade80;
}

.fab-status-pill {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(59, 130, 246, 0.35);
  color: #93c5fd;
  white-space: nowrap;
}

.footer-export-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  min-width: 0;
  width: 100%;
}

.text-invoice-mode-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.text-invoice-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.epm-label {
  font-size: 11.5px;
  font-weight: 800;
  color: #cbd5e1;
  white-space: nowrap;
}

.epm-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  flex: 1;
}

.epm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.72);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.epm-btn:hover {
  border-color: rgba(148, 163, 184, 0.55);
  color: #ffffff;
}

.epm-btn.active {
  border-color: rgba(34, 197, 94, 0.85);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(5, 150, 105, 0.24));
  color: #86efac;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.28);
}

.epm-btn.is-cost.active {
  border-color: rgba(245, 158, 11, 0.9);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(217, 119, 6, 0.24));
  color: #fde68a;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3);
}

.export-choice-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-choice-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.ecs-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  color: #f8fafc;
}

.ecs-title i {
  color: #38bdf8;
  font-size: 15px;
}

.ecs-sub {
  font-size: 11.5px;
  font-weight: 500;
  color: #94a3b8;
}

.ecs-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.export-choice-card {
  width: 100%;
  text-align: left;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.18s ease;
}

.export-choice-card.is-sell:hover {
  border-color: rgba(34, 197, 94, 0.8);
  background: rgba(16, 185, 129, 0.14);
}

.export-choice-card.is-cost:hover {
  border-color: rgba(245, 158, 11, 0.85);
  background: rgba(245, 158, 11, 0.14);
}

.ecc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
}

.export-choice-card.is-sell .ecc-head {
  color: #4ade80;
}

.export-choice-card.is-cost .ecc-head {
  color: #fbbf24;
}

.ecc-sub {
  font-size: 12px;
  color: #94a3b8;
}

.ecc-total {
  margin-top: 2px;
  font-size: 15px;
  font-weight: 900;
  color: #ffffff;
}

/* ================= ADD / MANAGE ORDER MEMBERS ================= */
.ov-add-member-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 9px;
  border: 1px dashed rgba(56, 189, 248, 0.55);
  background: rgba(14, 165, 233, 0.14);
  color: #7dd3fc;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.ov-add-member-btn:hover {
  background: rgba(14, 165, 233, 0.26);
  border-style: solid;
  border-color: rgba(56, 189, 248, 0.85);
  color: #f0f9ff;
}

.ov-member-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.25);
  color: #e0f2fe;
  font-size: 10.5px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.emtb-add-pill {
  border-style: dashed !important;
  border-color: rgba(56, 189, 248, 0.5) !important;
  color: #7dd3fc !important;
  background: rgba(14, 165, 233, 0.1) !important;
}

.emtb-add-pill:hover {
  border-style: solid !important;
  background: rgba(14, 165, 233, 0.22) !important;
  color: #f0f9ff !important;
}

.ogr-remove-member-btn,
.omg-remove-member-btn {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.ogr-remove-member-btn:hover,
.omg-remove-member-btn:hover {
  background: rgba(239, 68, 68, 0.28);
  border-color: rgba(248, 113, 113, 0.7);
  color: #ffffff;
}

.order-member-empty-row td {
  padding: 10px 14px !important;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  background: rgba(15, 23, 42, 0.32) !important;
}

.order-member-empty-card {
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.45);
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

.order-member-empty-card strong {
  color: #7dd3fc;
}

.add-member-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amf-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  font-size: 13.5px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.amf-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.22);
}

.amf-add-btn {
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.55);
  background: linear-gradient(135deg, #0284c7, #0ea5e9);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.amf-add-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.amf-members-section {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amf-section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 800;
  color: #e2e8f0;
}

.amf-section-title small {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
}

.amf-member-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 2px;
}

.amf-member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.72);
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.amf-member-row.active {
  border-color: rgba(52, 211, 153, 0.65);
  background: rgba(16, 185, 129, 0.12);
}

.amf-member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
}

.amf-member-info > i {
  font-size: 16px;
  color: #38bdf8;
  flex-shrink: 0;
}

.amf-member-text {
  min-width: 0;
  flex: 1;
}

.amf-member-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  color: #f8fafc;
}

.amf-member-name > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amf-member-meta {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 1px;
}

.amf-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.amf-select-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.85);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.amf-select-btn.active {
  border-color: rgba(52, 211, 153, 0.75);
  background: rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
}

.amf-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.amf-icon-btn:hover {
  border-color: rgba(56, 189, 248, 0.6);
  color: #ffffff;
}

.amf-icon-btn.is-save {
  border-color: rgba(34, 197, 94, 0.6);
  background: rgba(16, 185, 129, 0.22);
  color: #4ade80;
}

.amf-icon-btn.is-del:hover {
  border-color: rgba(248, 113, 113, 0.7);
  background: rgba(239, 68, 68, 0.22);
  color: #fca5a5;
}

.amf-rename-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #38bdf8;
  background: rgba(15, 23, 42, 0.95);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  outline: none;
}

/* ================= ORDER STATUS PROGRESS & WEB SYNC BUTTON ================= */
.fab-sync-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.fab-sync-pill.is-synced {
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(100, 116, 139, 0.35);
  color: #94a3b8;
}

.fab-sync-pill.is-unsynced {
  background: rgba(14, 165, 233, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.55);
  color: #38bdf8;
}

.order-progress-row {
  width: 100%;
  min-width: 0;
}

.order-progress-cancelled {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  font-size: 11.5px;
  font-weight: 800;
}

.order-status-progress {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2px;
  padding: 6px 4px 4px;
  border-radius: 9px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.order-status-progress.is-3-steps {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.osp-track {
  position: absolute;
  top: 16px;
  left: 12.5%;
  right: 12.5%;
  height: 2px;
  background: rgba(148, 163, 184, 0.24);
  border-radius: 999px;
  overflow: hidden;
  z-index: 0;
}

.order-status-progress.is-3-steps .osp-track {
  left: 16.67%;
  right: 16.67%;
}

.osp-track-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #38bdf8);
  border-radius: 999px;
  transition: width 0.24s ease;
}

.osp-step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 2px 1px;
  border: none;
  background: transparent;
  cursor: pointer;
  min-width: 0;
  transition: transform 0.14s ease, opacity 0.14s ease;
}

.osp-step:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.osp-step:not(:disabled):hover .osp-dot {
  transform: scale(1.1);
  border-color: #7dd3fc;
}

.osp-step:not(:disabled):hover .osp-label {
  color: #f8fafc;
}

.osp-dot {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  background: #0f172a;
  border: 2px solid rgba(148, 163, 184, 0.4);
  color: #94a3b8;
  transition: all 0.18s ease;
}

.osp-label {
  font-size: 10px;
  font-weight: 700;
  line-height: 1.15;
  color: #94a3b8;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.osp-step.is-done .osp-dot {
  background: #059669;
  border-color: #34d399;
  color: #ffffff;
}

.osp-step.is-done .osp-label {
  color: #6ee7b7;
}

.osp-step.is-current .osp-dot {
  background: #0ea5e9;
  border-color: #7dd3fc;
  color: #ffffff;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.osp-step.is-current .osp-label {
  color: #e0f2fe;
  font-weight: 800;
}

.submit-stack.pc-submit-stack.is-online-actions {
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
}

.submit-stack.pc-submit-stack.is-online-actions .btn-order-cancel,
.submit-stack.pc-submit-stack.is-online-actions .btn-close-order-tab {
  grid-column: auto;
}

.submit-stack.pc-submit-stack.is-online-actions .btn-close-order-tab:only-child {
  grid-column: 1 / -1;
}

.submit-stack .btn-sync-web.is-synced {
  background: linear-gradient(135deg, #1e293b, #0f172a) !important;
  color: #64748b !important;
  border: 1px solid rgba(100, 116, 139, 0.35) !important;
  box-shadow: none !important;
}

.submit-stack .btn-sync-web.is-synced:hover:not(:disabled) {
  background: linear-gradient(135deg, #273449, #162033) !important;
  color: #94a3b8 !important;
}

.submit-stack .btn-sync-web.is-unsynced {
  background: linear-gradient(135deg, #0284c7, #06b6d4) !important;
  color: #ffffff !important;
  border: 1px solid rgba(56, 189, 248, 0.8) !important;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.36) !important;
}

.submit-stack .btn-sync-web.is-unsynced:hover:not(:disabled) {
  background: linear-gradient(135deg, #0369a1, #0891b2) !important;
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.48) !important;
}

.omg-dup-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.45);
  color: #fde68a;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.25;
  flex-shrink: 0;
}

.amf-dup-alert {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.55);
  background: rgba(245, 158, 11, 0.12);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.amf-dup-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.amf-dup-head > i {
  font-size: 18px;
  color: #fbbf24;
  flex-shrink: 0;
  margin-top: 1px;
}

.amf-dup-text {
  min-width: 0;
  flex: 1;
}

.amf-dup-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #fef3c7;
  line-height: 1.35;
}

.amf-dup-meta {
  color: #fde68a;
  font-size: 11.5px;
  font-weight: 600;
}

.amf-dup-sub {
  margin-top: 3px;
  font-size: 12px;
  color: #e2e8f0;
  line-height: 1.35;
}

.amf-dup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.amf-dup-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 31px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.amf-dup-btn.is-confirm {
  background: linear-gradient(135deg, #059669, #10b981);
  border-color: rgba(52, 211, 153, 0.7);
  color: #ffffff;
}

.amf-dup-btn.is-confirm:hover {
  filter: brightness(1.08);
}

.amf-dup-btn.is-existing {
  background: rgba(14, 165, 233, 0.18);
  border-color: rgba(56, 189, 248, 0.55);
  color: #7dd3fc;
}

.amf-dup-btn.is-existing:hover {
  background: rgba(14, 165, 233, 0.3);
  color: #f0f9ff;
}

.amf-dup-btn.is-rename {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.35);
  color: #cbd5e1;
}

.amf-dup-btn.is-rename:hover {
  border-color: rgba(148, 163, 184, 0.7);
  color: #ffffff;
}

/* ================= BELL PENDING ORDERS BUTTON & MODAL ================= */
.invoice-tab-bell-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.78);
  color: #94a3b8;
  font-size: 15px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.invoice-tab-bell-btn:hover {
  border-color: rgba(248, 113, 113, 0.65);
  color: #f8fafc;
}

.invoice-tab-bell-btn.has-pending {
  border-color: rgba(239, 68, 68, 0.65);
  background: rgba(220, 38, 38, 0.2);
  color: #fca5a5;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.25);
}

.invoice-tab-bell-btn.has-pending:hover {
  background: rgba(220, 38, 38, 0.34);
  color: #ffffff;
}

.invoice-tab-bell-btn.is-ringing i {
  animation: pendingBellRing 0.75s ease-in-out infinite;
}

@keyframes pendingBellRing {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(16deg); }
  40% { transform: rotate(-14deg); }
  60% { transform: rotate(10deg); }
  80% { transform: rotate(-8deg); }
}

.itb-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  border: 1.5px solid #0f172a;
  color: #ffffff;
  font-size: 10px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.invoice-tab-pill.status-waiting {
  border-color: rgba(239, 68, 68, 0.55);
  background: rgba(185, 28, 28, 0.22);
  color: #fecaca;
}

.invoice-tab-pill.status-waiting.active {
  border-color: rgba(248, 113, 113, 0.9);
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.36), rgba(153, 27, 27, 0.42));
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.28);
}

.pmv4-icon-box.is-alert-red {
  background: rgba(239, 68, 68, 0.18) !important;
  border-color: rgba(239, 68, 68, 0.45) !important;
  color: #f87171 !important;
}

.po-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 14px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.55);
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

.po-empty i {
  font-size: 28px;
  color: #34d399;
}

.po-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 62vh;
  overflow-y: auto;
  padding-right: 2px;
}

.po-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.38);
  background: rgba(15, 23, 42, 0.82);
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.po-card:hover {
  border-color: rgba(248, 113, 113, 0.72);
  background: rgba(30, 41, 59, 0.88);
}

.po-card.is-opened {
  border-color: rgba(56, 189, 248, 0.38);
}

.po-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.po-code-group {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.po-code {
  font-size: 13px;
  font-weight: 900;
  color: #f8fafc;
}

.po-badge-waiting {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #fca5a5;
}

.po-badge-opened {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  background: rgba(14, 165, 233, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
}

.po-total {
  font-size: 14px;
  font-weight: 900;
  color: #4ade80;
  white-space: nowrap;
}

.po-customer-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  font-size: 13px;
  color: #e2e8f0;
}

.po-customer-row i {
  color: #38bdf8;
}

.po-phone {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.po-sub-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.35;
}

.po-sub-row i {
  color: #64748b;
  flex-shrink: 0;
  margin-top: 1px;
}

.po-items-preview {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.55);
  font-size: 11.5px;
  color: #cbd5e1;
  line-height: 1.35;
}

.po-items-preview i {
  color: #fbbf24;
  flex-shrink: 0;
  margin-top: 1px;
}

.po-card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.po-import-btn {
  height: 33px;
  padding: 0 13px;
  border-radius: 9px;
  border: 1px solid rgba(52, 211, 153, 0.65);
  background: linear-gradient(135deg, #059669, #10b981);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.po-import-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}

.po-import-btn.is-open-tab {
  border-color: rgba(56, 189, 248, 0.65);
  background: linear-gradient(135deg, #0284c7, #0ea5e9);
}

.po-import-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.order-created-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.order-created-pill i {
  color: #38bdf8;
}

/* ================= VERTICAL TABS RAIL (PC) & MOBILE COMPAT ================= */
.itb-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.itp-top-line,
.itp-sub-line {
  display: contents;
}

.itb-collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(30, 41, 59, 0.78);
  color: #cbd5e1;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.itb-collapse-btn:hover {
  border-color: rgba(56, 189, 248, 0.55);
  color: #f8fafc;
}

@media (min-width: 1025px) {
  .invoice-tabs-bar.is-pc-vertical {
    width: 152px;
    flex-shrink: 0;
    height: 100%;
    min-height: 0;
    margin-bottom: 0;
    padding: 8px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.95));
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 8px 22px rgba(2, 6, 23, 0.4);
  }

  .invoice-tabs-bar.is-pc-vertical .itb-actions {
    order: -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding-bottom: 7px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }

  .invoice-tabs-bar.is-pc-vertical .invoice-tab-add-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 999px;
    font-size: 16px;
    flex: none;
  }

  .invoice-tabs-bar.is-pc-vertical .invoice-tabs-scroll {
    flex: 1;
    min-height: 0;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 0;
    padding-right: 2px;
    gap: 6px;
  }

  .invoice-tabs-bar.is-pc-vertical .invoice-tab-pill {
    width: 100%;
    max-width: none;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
    padding: 7px 8px;
    border-radius: 10px;
    white-space: normal;
  }

  .invoice-tabs-bar.is-pc-vertical .itp-dot {
    display: none;
  }

  .invoice-tabs-bar.is-pc-vertical .itp-top-line {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    width: 100%;
  }

  .invoice-tabs-bar.is-pc-vertical .itp-top-line::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #64748b;
    flex-shrink: 0;
  }

  .invoice-tabs-bar.is-pc-vertical .invoice-tab-pill.active .itp-top-line::before {
    background: #34d399;
  }

  .invoice-tabs-bar.is-pc-vertical .invoice-tab-pill.is-approved .itp-top-line::before {
    background: #38bdf8;
  }

  .invoice-tabs-bar.is-pc-vertical .invoice-tab-pill.status-waiting .itp-top-line::before {
    background: #f87171;
  }

  .invoice-tabs-bar.is-pc-vertical .itp-title {
    flex: 1;
    min-width: 0;
    text-align: left;
    font-size: 11.5px;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .invoice-tabs-bar.is-pc-vertical .itp-sub-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    width: 100%;
    padding-left: 12px;
  }

  .invoice-tabs-bar.is-pc-vertical .itp-status-tag {
    font-size: 9.5px;
    padding: 1px 6px;
  }

  /* Collapsed compact vertical rail */
  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed {
    width: 52px;
    padding: 8px 5px;
  }

  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .itb-actions {
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .itb-collapse-btn,
  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .invoice-tab-add-btn,
  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .invoice-tab-bell-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    flex: none;
  }

  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .invoice-tab-add-btn {
    border-radius: 999px;
  }

  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .invoice-tab-pill {
    position: relative;
    align-items: center;
    justify-content: center;
    padding: 7px 4px;
    gap: 3px;
  }

  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .itp-dot {
    display: inline-block;
  }

  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .itp-compact-idx {
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
  }

  .invoice-tabs-bar.is-pc-vertical.is-rail-collapsed .itp-sub-line {
    justify-content: center;
    padding-left: 0;
  }
}

/* ================= ORDER TABLE COLUMN RESIZE HANDLES ================= */
.order-box table.is-fixed-cols {
  table-layout: fixed;
  width: max-content;
  min-width: 100%;
}

.order-box table.is-fixed-cols th,
.order-box table.is-fixed-cols td {
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-box table.is-resizing-table-cols,
.order-box table.is-resizing-table-cols * {
  user-select: none !important;
  cursor: col-resize !important;
}

.order-box table thead th {
  position: sticky;
  top: 0;
}

.th-label-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.th-col-resizer {
  position: absolute;
  top: 4px;
  right: 0;
  bottom: 4px;
  width: 7px;
  cursor: col-resize;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.th-col-resizer::after {
  content: '';
  width: 2px;
  height: 56%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
  transition: background-color 0.14s ease, width 0.14s ease, height 0.14s ease;
}

.order-box table thead th:hover .th-col-resizer::after,
.order-box table thead th.is-col-resizing .th-col-resizer::after {
  width: 3px;
  height: 76%;
  background: rgba(255, 255, 255, 0.85);
}

.ocp-reset-widths-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(14, 165, 233, 0.14);
  color: #7dd3fc;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ocp-reset-widths-btn:hover {
  border-color: rgba(56, 189, 248, 0.75);
  background: rgba(14, 165, 233, 0.25);
  color: #e0f2fe;
}

/* ================= TAB SOURCE FILTER (TẤT CẢ / ĐƠN WEB / ĐƠN ADMIN) ================= */
.itb-source-filter {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3px;
  padding: 2px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.16);
  flex-shrink: 0;
}

.itb-filter-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 3px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 0;
}

.itb-filter-btn > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.itb-filter-btn:hover {
  color: #e2e8f0;
  background: rgba(30, 41, 59, 0.65);
}

.itb-filter-btn.active {
  background: rgba(16, 185, 129, 0.22);
  color: #6ee7b7;
  box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.45);
}

.itb-filter-btn.is-web.active {
  background: rgba(14, 165, 233, 0.22);
  color: #7dd3fc;
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.48);
}

.itb-filter-btn.is-admin.active {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.45);
}

.itb-fcount {
  font-size: 9.5px;
  font-weight: 800;
  opacity: 0.82;
}

.itb-filter-empty {
  padding: 12px 8px;
  font-size: 11px;
  color: #64748b;
  font-style: italic;
  text-align: center;
}

@media (min-width: 1025px) {
  .invoice-tabs-bar.is-pc-vertical .itb-source-filter {
    order: -1;
  }
  .invoice-tabs-bar.is-pc-vertical .itb-search-wrap {
    order: -1;
  }
}

@media (max-width: 1024px) {
  .invoice-tabs-bar.is-mobile-tabs-panel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: 100%;
    padding: 12px;
    margin: 0;
    border-radius: 0;
    border: none;
    background: transparent;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itb-actions {
    order: -3;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itb-mobile-title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-right: auto;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.45px;
    color: #e2e8f0;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itb-mobile-title i {
    color: #34d399;
    font-size: 16px;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-add-btn,
  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-bell-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itb-source-filter {
    order: -2;
    width: 100%;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itb-filter-btn {
    min-height: 34px;
    font-size: 11px;
    padding: 5px 6px;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itb-search-wrap {
    order: -1;
    width: 100%;
    height: 38px;
    padding: 0 10px;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itb-search-input {
    font-size: 13px;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tabs-scroll {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    overflow-x: hidden;
    overflow-y: visible;
    padding: 0;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill {
    width: 100%;
    max-width: none;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 11px 12px;
    border-radius: 12px;
    white-space: normal;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itp-dot {
    display: none;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itp-top-line {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itp-top-line::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #64748b;
    flex-shrink: 0;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill.active .itp-top-line::before {
    background: #34d399;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill.is-approved .itp-top-line::before {
    background: #38bdf8;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill.status-waiting .itp-top-line::before {
    background: #fbbf24;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill.status-processing .itp-top-line::before {
    background: #22d3ee;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill.status-shipping .itp-top-line::before {
    background: #818cf8;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill.status-done .itp-top-line::before {
    background: #34d399;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .invoice-tab-pill.status-cancelled .itp-top-line::before {
    background: #f87171;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itp-title {
    flex: 1;
    min-width: 0;
    text-align: left;
    font-size: 13.5px;
    line-height: 1.3;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itp-close {
    width: 26px;
    height: 26px;
    font-size: 15px;
    flex-shrink: 0;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itp-sub-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    padding-left: 16px;
  }

  .invoice-tabs-bar.is-mobile-tabs-panel .itp-search-match-sub {
    padding-left: 16px;
    font-size: 11.5px;
  }
}

.itb-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 8px;
  gap: 5px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.22);
  flex-shrink: 0;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.itb-search-wrap:focus-within {
  border-color: rgba(56, 189, 248, 0.65);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.14);
}

.itb-search-icon {
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
}

.itb-search-input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #f1f5f9;
  font-size: 11.5px;
  font-weight: 600;
}

.itb-search-input::placeholder {
  color: #64748b;
}

.itb-search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: none;
  background: rgba(148, 163, 184, 0.22);
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.itb-search-clear:hover {
  background: rgba(239, 68, 68, 0.28);
  color: #fecaca;
}

.invoice-tab-pill.is-search-match {
  border-color: rgba(250, 204, 21, 0.55) !important;
  box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.22);
}

.itp-search-match-sub {
  margin-top: 2px;
  padding-left: 14px;
  font-size: 10.5px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  width: 100%;
}

.pmv4-icon-box.is-ctc-warn {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.ctc-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ctc-status-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.ctc-meta-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.ctc-source-chip {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
}

.ctc-source-chip.is-web {
  background: rgba(56, 189, 248, 0.16);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.ctc-source-chip.is-admin {
  background: rgba(245, 158, 11, 0.16);
  color: #fcd34d;
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.ctc-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: #cbd5e1;
}

.ctc-unsynced-warn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.38);
  color: #fde68a;
  font-size: 12px;
  font-weight: 700;
}

.ctc-footer {
  flex-wrap: wrap;
  gap: 8px;
}

.ctc-btn-keep,
.ctc-btn-cancel-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ctc-btn-keep {
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.42);
  color: #7dd3fc;
}

.ctc-btn-keep:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.24);
  color: #e0f2fe;
}

.ctc-btn-cancel-order {
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.ctc-btn-cancel-order:hover:not(:disabled) {
  background: #dc2626;
  border-color: #ef4444;
  color: #ffffff;
}

.ctc-btn-keep:disabled,
.ctc-btn-cancel-order:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================= CK NCC (IN ORDER TABLE, MANUAL ENTRY & EDIT MODAL) ================= */
.table-ncc-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  max-width: 100%;
}

.table-ncc-mode-btn {
  padding: 3px 6px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.45);
  background: rgba(16, 185, 129, 0.16);
  color: #6ee7b7;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1.2;
}

.table-ncc-mode-btn.is-money {
  border-color: rgba(56, 189, 248, 0.5);
  background: rgba(14, 165, 233, 0.18);
  color: #7dd3fc;
}

.table-ncc-input {
  width: 54px;
  min-width: 40px;
  height: 26px;
  padding: 0 5px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.table-ncc-input:focus {
  outline: none;
  border-color: #22c55e;
}

.ncc-inline-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ncc-type-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.85);
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

.ncc-inline-input {
  flex: 1;
  min-width: 80px;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
}

.item-card-ncc-badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.18);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

/* ================= CUSTOMER ORDER UPDATE HIGHLIGHTS & ACTION BOX ================= */
.itp-update-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  background: rgba(245, 158, 11, 0.24);
  color: #fde68a;
  border: 1px solid rgba(251, 191, 36, 0.65);
  margin-left: 4px;
}

.row-web-updated td {
  background: rgba(245, 158, 11, 0.14) !important;
  border-top: 1px solid rgba(251, 191, 36, 0.45) !important;
  border-bottom: 1px solid rgba(251, 191, 36, 0.45) !important;
}

.row-web-updated td:first-child {
  box-shadow: inset 4px 0 0 #f59e0b;
}

.card-web-updated {
  background: rgba(245, 158, 11, 0.14) !important;
  border: 1.5px solid rgba(251, 191, 36, 0.72) !important;
  box-shadow: 0 6px 18px rgba(245, 158, 11, 0.18), inset 4px 0 0 #f59e0b !important;
}

.web-update-pill {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.3px;
  vertical-align: middle;
}

.web-update-pill.is-added {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
}

.web-update-pill.is-qty_up {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
}

.web-update-pill.is-note {
  background: rgba(56, 189, 248, 0.24);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.55);
}

.web-admin-msg-box {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(52, 211, 153, 0.32);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wamb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.wamb-head-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.wamb-close-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.14);
  color: #94a3b8;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.wamb-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.wamb-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 800;
  color: #6ee7b7;
}

.wamb-title i {
  font-size: 14px;
  color: #34d399;
}

.wamb-last-sent {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wamb-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.wamb-input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  max-height: 110px;
  resize: vertical;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.4;
  font-family: inherit;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.wamb-input::placeholder {
  color: #64748b;
}

.wamb-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
}

.wamb-send-btn {
  flex-shrink: 0;
  min-width: 86px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.6);
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: opacity 0.16s ease, transform 0.14s ease;
}

.wamb-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wamb-send-btn:hover:not(:disabled) {
  filter: brightness(1.06);
}

.web-update-action-box {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(120, 53, 15, 0.26);
  border: 1px solid rgba(251, 191, 36, 0.58);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wuab-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 800;
  color: #fde68a;
}

.wuab-head i {
  font-size: 15px;
  color: #fbbf24;
}

.wuab-btns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.btn-wuab-confirm,
.btn-wuab-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.btn-wuab-confirm {
  background: linear-gradient(135deg, #10b981, #059669);
  border: 1px solid rgba(52, 211, 153, 0.7);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28);
}

.btn-wuab-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-wuab-detail {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(251, 191, 36, 0.55);
  color: #fde68a;
}

.btn-wuab-detail:hover {
  background: rgba(245, 158, 11, 0.22);
  color: #ffffff;
}

/* Bell Modal update section + Update Detail Modal */
.po-update-section {
  margin-bottom: 14px;
}

.po-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}

.po-section-label.is-update {
  color: #fbbf24;
}

.po-card.is-update-card {
  border-color: rgba(251, 191, 36, 0.55);
  background: rgba(120, 53, 15, 0.18);
}

.po-badge-updated {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: rgba(245, 158, 11, 0.24);
  color: #fde68a;
  border: 1px solid rgba(251, 191, 36, 0.55);
}

.po-update-preview-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0;
  padding: 8px 10px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.55);
  font-size: 12.5px;
}

.po-update-preview-item.is-added {
  color: #6ee7b7;
  font-weight: 700;
}

.po-update-preview-item.is-qty_up {
  color: #fde68a;
  font-weight: 700;
}

.po-update-preview-item.is-removed,
.po-update-preview-item.is-qty_down {
  color: #fca5a5;
}

.po-update-preview-item.is-note,
.po-update-preview-item.is-meta {
  color: #93c5fd;
}

.po-update-more {
  color: #94a3b8;
  font-size: 11.5px;
}

.po-import-btn.is-jump-update {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  border-color: rgba(251, 191, 36, 0.75);
  color: #ffffff;
}

.pmv4-icon-box.is-alert-amber {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.5);
}

.wud-change-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wud-change-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.wud-change-card.is-added {
  border-color: rgba(16, 185, 129, 0.45);
  background: rgba(6, 78, 59, 0.22);
}

.wud-change-card.is-qty_up {
  border-color: rgba(245, 158, 11, 0.45);
  background: rgba(120, 53, 15, 0.2);
}

.wud-change-card.is-removed,
.wud-change-card.is-qty_down {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(127, 29, 29, 0.2);
}

.wud-type-badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
}

.wud-type-badge.is-added {
  background: rgba(16, 185, 129, 0.22);
  color: #6ee7b7;
}

.wud-type-badge.is-qty_up {
  background: rgba(245, 158, 11, 0.22);
  color: #fde68a;
}

.wud-type-badge.is-removed,
.wud-type-badge.is-qty_down {
  background: rgba(239, 68, 68, 0.22);
  color: #fca5a5;
}

.wud-type-badge.is-note,
.wud-type-badge.is-meta {
  background: rgba(56, 189, 248, 0.2);
  color: #7dd3fc;
}

.wud-change-content {
  flex: 1;
  min-width: 0;
}

.wud-change-summary {
  font-size: 13.5px;
  font-weight: 700;
  color: #f8fafc;
}

.wud-change-sub {
  margin-top: 3px;
  font-size: 12px;
  color: #94a3b8;
}

.pmv4-btn-primary.is-confirm-update {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #10b981, #059669);
}

.bank-qr svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* ================= MODAL XUẤT MÃ QR VIETQR ================= */
.pmv4-icon-box.is-qr-amber {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.24), rgba(217, 119, 6, 0.14));
  border-color: rgba(245, 158, 11, 0.45);
  color: #fbbf24;
}

.qr-export-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qr-bank-selector-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qr-bank-selector-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
}

.qr-bank-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qr-bank-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.65);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.qr-bank-chip.active {
  border-color: #fbbf24;
  background: rgba(245, 158, 11, 0.18);
  color: #fde68a;
}

.qr-type-tag {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.qr-type-tag.is-dynamic {
  background: rgba(56, 189, 248, 0.2);
  color: #7dd3fc;
}

.qr-type-tag.is-static {
  background: rgba(251, 191, 36, 0.2);
  color: #fcd34d;
}

.qr-export-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #0f172a;
  box-shadow: 0 10px 28px rgba(2, 6, 23, 0.22);
}

.qec-top-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  margin-bottom: 10px;
}

.qec-brand {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: #0f172a;
  color: #38bdf8;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
}

.qec-brand.is-static {
  color: #fbbf24;
}

.qec-bank-name {
  font-size: 14px;
  font-weight: 900;
  color: #1e293b;
  text-transform: uppercase;
}

.qec-qr-frame {
  padding: 10px;
  border-radius: 14px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.qec-qr-svg {
  display: block;
}

.qec-static-qr-img {
  width: 210px;
  height: 210px;
  object-fit: contain;
  display: block;
}

.qec-amount-box {
  margin-top: 10px;
  padding-bottom: 10px;
  width: 100%;
  border-bottom: 1px dashed #cbd5e1;
}

.qec-amount-lbl {
  font-size: 10.5px;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.6px;
}

.qec-amount-val {
  margin-top: 2px;
  font-size: 23px;
  font-weight: 900;
  color: #059669;
  line-height: 1.15;
}

.qec-ship-status {
  margin-top: 3px;
  font-size: 11.5px;
  font-weight: 700;
}

.qec-ship-status.is-included {
  color: #0284c7;
}

.qec-ship-status.is-excluded {
  color: #64748b;
}

.qec-meta-list {
  width: 100%;
  margin-top: 9px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qec-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #475569;
}

.qec-meta-row strong {
  color: #0f172a;
  font-weight: 800;
  text-align: right;
  word-break: break-word;
}

.qr-export-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qr-ship-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 9px;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

.qr-ship-toggle.active {
  border-color: rgba(56, 189, 248, 0.72);
  background: rgba(14, 165, 233, 0.16);
  color: #e0f2fe;
}

.qr-ship-toggle input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: #38bdf8;
  margin: 0;
}

.qr-memo-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qr-memo-field label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  white-space: nowrap;
}

.qr-memo-input {
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.75);
  color: #f8fafc;
  font-size: 12.5px;
  font-weight: 700;
}

.qr-export-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.qr-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 13px;
  border-radius: 9px;
  border: none;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  color: #ffffff;
}

.qr-action-btn.is-copy {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.qr-action-btn.is-download {
  background: linear-gradient(135deg, #10b981, #059669);
}

.qr-action-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.db-conflict-overlay {
  z-index: 99999;
}

.db-conflict-card {
  width: 100%;
  max-width: 500px;
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.db-conflict-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.db-conflict-ico {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  display: grid;
  place-items: center;
  font-size: 20px;
  flex-shrink: 0;
}

.db-conflict-head h3 {
  margin: 0;
  font-size: 15.5px;
  font-weight: 800;
  color: #fef3c7;
}

.db-conflict-head p {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: #cbd5e1;
  line-height: 1.4;
}

.db-conflict-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 520px) {
  .db-conflict-compare {
    grid-template-columns: 1fr;
  }
}

.db-conflict-box {
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.db-conflict-box.is-old {
  border-color: rgba(245, 158, 11, 0.45);
}

.db-conflict-box.is-new {
  border-color: rgba(34, 197, 94, 0.45);
}

.db-conflict-tag {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
}

.db-conflict-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #f8fafc;
}

.db-conflict-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #cbd5e1;
}

.db-conflict-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.db-conflict-btn {
  flex: 1;
  min-width: 140px;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: none;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.db-conflict-btn.is-update {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
}

.db-conflict-btn.is-create {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

.db-conflict-btn.is-cancel {
  flex: 0 0 auto;
  min-width: 72px;
  background: rgba(148, 163, 184, 0.16);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.srb-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.srb-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  vertical-align: middle;
}

.srb-badge.is-qty {
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid rgba(74, 222, 128, 0.45);
  color: #86efac;
}

.srb-badge.is-fuzzy {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(251, 191, 36, 0.45);
  color: #fde68a;
}

.srb-global-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.45);
  background: rgba(14, 165, 233, 0.18);
  color: #7dd3fc;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.srb-global-btn:hover {
  background: rgba(14, 165, 233, 0.32);
  color: #ffffff;
}

.no-products-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.cust-suggest-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 60;
  max-height: 240px;
  overflow-y: auto;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
  padding: 4px;
}

.cust-suggest-item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 7px;
  padding: 8px 10px;
  color: #f1f5f9;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background 0.14s ease;
}

.cust-suggest-item:hover {
  background: rgba(34, 197, 94, 0.16);
}

.cust-suggest-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
}

.cust-suggest-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11.5px;
  color: #94a3b8;
}

.cust-suggest-meta span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* =========================================================
   CATALOG VIEW SWITCHER & QUICK-PICK MENU BOARD (DẠNG CHỌN NHANH)
   ========================================================= */
.nhd-catalog-view-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding-top: 6px;
  border-top: 1px dashed rgba(148, 163, 184, 0.16);
}

.nhd-mobile-view-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0 0 10px;
}

.nhd-view-switcher {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: inset 0 1px 2px rgba(2, 6, 23, 0.35);
}

.nhd-view-switcher.is-mobile-full {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 4px;
  border-radius: 12px;
}

.nhd-vs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease;
}

.nhd-view-switcher.is-mobile-full .nhd-vs-btn {
  height: 34px;
  font-size: 12.5px;
  border-radius: 9px;
}

.nhd-vs-btn i {
  font-size: 14px;
}

.nhd-vs-btn:hover:not(.active) {
  color: #f1f5f9;
  background: rgba(148, 163, 184, 0.12);
}

.nhd-vs-btn.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.32);
}

.nhd-vs-btn:active {
  transform: scale(0.97);
}

.nhd-catalog-view-meta {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.nhd-menu-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 2px 0 10px;
}

.nhd-mb-section {
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 13px;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.32);
  overflow: hidden;
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto 260px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.nhd-mb-section:hover {
  border-color: rgba(16, 185, 129, 0.36);
}

.nhd-mb-sec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 46px;
  padding: 7px 12px;
  background: linear-gradient(135deg, #065f46 0%, #047857 52%, #059669 100%);
  color: #ffffff;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  transition: filter 0.16s ease;
}

.nhd-mb-sec-header:hover {
  filter: brightness(1.06);
}

.nhd-mb-sec-header.is-filtered {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%);
}

.nhd-mb-sec-thumbs {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.nhd-mb-sec-thumb {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.88);
  background: #0f172a;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.nhd-mb-sec-thumbs .nhd-mb-sec-thumb + .nhd-mb-sec-thumb {
  margin-left: -9px;
}

.nhd-mb-sec-header:hover .nhd-mb-sec-thumb {
  transform: scale(1.06);
}

.nhd-mb-sec-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.nhd-mb-sec-title-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.nhd-mb-sec-parent {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.55px;
  text-transform: uppercase;
  opacity: 0.86;
  line-height: 1.15;
}

.nhd-mb-sec-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 800;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.22);
  line-height: 1.25;
  text-align: center;
  word-break: break-word;
}

.nhd-mb-sec-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.nhd-mb-sec-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.34);
  color: #ffffff;
  font-size: 13px;
  flex-shrink: 0;
}

.nhd-mb-items-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 2px;
  padding: 8px 10px 10px;
}

.nhd-mb-items-grid.is-single-col {
  grid-template-columns: 1fr;
}

.nhd-mb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 9px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.16);
  cursor: pointer;
  transition: background-color 0.14s ease, border-color 0.14s ease;
  min-width: 0;
}

.nhd-mb-row:hover {
  background: rgba(30, 41, 59, 0.72);
}

.nhd-mb-row.is-in-cart {
  background: rgba(16, 185, 129, 0.12);
  border-bottom-color: rgba(16, 185, 129, 0.26);
}

.nhd-mb-row.is-in-cart:hover {
  background: rgba(16, 185, 129, 0.18);
}

.nhd-mb-row.is-flash {
  background: rgba(34, 197, 94, 0.24);
}

.nhd-mb-row.is-out {
  opacity: 0.52;
}

.nhd-mb-name-wrap {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  max-width: 60%;
}

.nhd-mb-name {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.3;
  word-break: break-word;
}

.nhd-mb-row.is-out .nhd-mb-name {
  text-decoration: line-through;
  color: #94a3b8;
}

.nhd-mb-size-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.28);
  color: #7dd3fc;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.25;
  flex-shrink: 0;
}

.nhd-mb-sale-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(244, 63, 94, 0.2);
  color: #fda4af;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.3;
  flex-shrink: 0;
}

.nhd-mb-out-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(239, 68, 68, 0.16);
  color: #f87171;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.3;
  flex-shrink: 0;
}

.nhd-mb-incart-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  line-height: 1.3;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
}

.nhd-mb-incart-pill.is-pop {
  animation: nhdBoardPop 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nhd-mb-item-badge {
  display: inline-flex;
  align-items: center;
  padding: 1.5px 6px;
  font-size: 9.5px;
  font-weight: 800;
  line-height: 1.25;
  vertical-align: middle;
  flex-shrink: 0;
}

.nhd-mb-item-badge-inner {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.nhd-mb-item-badge.is-group-fire {
  background: linear-gradient(135deg, #ff6a00 0%, #dc2626 100%);
  color: #ffffff;
}

.nhd-mb-item-badge.is-group-new {
  background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
  color: #ffffff;
}

.nhd-mb-item-badge.is-group-crown {
  background: linear-gradient(135deg, #b45309 0%, #f59e0b 52%, #d97706 100%);
  color: #fffbeb;
}

.nhd-mb-item-badge.is-group-spicy {
  background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);
  color: #ffffff;
}

.nhd-mb-item-badge.is-group-custom {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  color: #ffffff;
}

.nhd-mb-item-badge.is-shape-flame {
  border-radius: 9px 3px 9px 3px;
  transform: skewX(-8deg);
}

.nhd-mb-item-badge.is-shape-flame .nhd-mb-item-badge-inner {
  transform: skewX(8deg);
}

.nhd-mb-item-badge.is-shape-leaf {
  border-radius: 3px 12px 3px 12px;
}

.nhd-mb-item-badge.is-shape-crest {
  padding: 1.5px 8px;
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 50%, calc(100% - 5px) 100%, 5px 100%, 0% 50%);
}

.nhd-mb-item-badge.is-shape-pennant {
  padding: 1.5px 6px 1.5px 9px;
  border-radius: 0 5px 5px 0;
  clip-path: polygon(5px 0%, 100% 0%, 100% 100%, 5px 100%, 0% 50%);
}

.nhd-mb-item-badge.is-shape-ticket {
  border-radius: 4px;
}

.nhd-mb-leader {
  flex: 1;
  min-width: 8px;
  border-bottom: 1.5px dotted rgba(148, 163, 184, 0.34);
  align-self: center;
  transform: translateY(2px);
}

.nhd-mb-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nhd-mb-price-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.18;
}

.nhd-mb-old-price {
  font-size: 10.5px;
  font-weight: 500;
  color: #64748b;
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
}

.nhd-mb-price-line {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  white-space: nowrap;
}

.nhd-mb-price {
  font-size: 13px;
  font-weight: 800;
  color: #4ade80;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.15px;
}

.nhd-mb-price.is-sale {
  color: #fbbf24;
}

.nhd-mb-unit {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.nhd-mb-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.15s ease, box-shadow 0.15s ease;
}

.nhd-mb-add-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
}

.nhd-mb-add-btn:active:not(:disabled) {
  transform: scale(0.9);
}

.nhd-mb-add-btn.added {
  animation: nhdBoardPop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nhd-mb-add-btn:disabled {
  background: rgba(51, 65, 85, 0.75);
  color: #64748b;
  box-shadow: none;
  cursor: not-allowed;
}

.nhd-mb-stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.45);
  flex-shrink: 0;
}

.nhd-mb-step-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, background-color 0.15s ease;
}

.nhd-mb-step-btn.is-minus {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.nhd-mb-step-btn.is-minus:hover {
  background: rgba(239, 68, 68, 0.35);
  color: #ffffff;
}

.nhd-mb-step-btn.is-plus {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
}

.nhd-mb-step-btn.is-plus:hover:not(:disabled) {
  filter: brightness(1.12);
}

.nhd-mb-step-btn.is-plus:disabled {
  background: rgba(51, 65, 85, 0.75);
  color: #64748b;
  cursor: not-allowed;
}

.nhd-mb-step-btn:active:not(:disabled) {
  transform: scale(0.88);
}

.nhd-mb-step-qty {
  min-width: 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  color: #f8fafc;
  font-variant-numeric: tabular-nums;
  padding: 0 2px;
}

@keyframes nhdBoardPop {
  0% {
    transform: scale(0.86);
  }
  55% {
    transform: scale(1.14);
  }
  100% {
    transform: scale(1);
  }
}

/* Container-responsive Menu Board inside resizable PC left column */
@container catalog-grid (max-width: 619px) {
  .nhd-mb-items-grid {
    grid-template-columns: 1fr;
    padding: 6px 8px 8px;
  }

  .nhd-mb-sec-thumbs.is-right {
    display: none;
  }

  .nhd-mb-sec-title-wrap {
    justify-content: flex-start;
  }

  .nhd-mb-sec-title-texts {
    align-items: flex-start;
  }

  .nhd-mb-sec-title {
    text-align: left;
    font-size: 13px;
  }
}

@container catalog-grid (max-width: 360px) {
  .nhd-mb-sec-thumbs.is-left {
    display: none;
  }

  .nhd-mb-row {
    padding: 6px 6px;
    gap: 5px;
  }

  .nhd-mb-name-wrap {
    max-width: 55%;
  }

  .nhd-mb-name {
    font-size: 12px;
  }

  .nhd-mb-price {
    font-size: 12px;
  }
}

@media (max-width: 1024px) {
  .nhd-menu-board {
    gap: 11px;
    padding-bottom: 6px;
  }

  .nhd-mb-sec-header {
    min-height: 46px;
    padding: 8px 11px;
    gap: 8px;
  }

  .nhd-mb-sec-title-wrap {
    justify-content: flex-start;
    gap: 8px;
  }

  .nhd-mb-sec-title-texts {
    align-items: flex-start;
    flex: 1;
  }

  .nhd-mb-sec-title {
    font-size: 13.5px;
    text-align: left;
  }

  .nhd-mb-sec-thumbs.is-mobile-cluster .nhd-mb-sec-thumb {
    width: 30px;
    height: 30px;
    border-width: 1.5px;
  }

  .nhd-mb-sec-thumbs.is-mobile-cluster .nhd-mb-sec-thumb + .nhd-mb-sec-thumb {
    margin-left: -9px;
  }

  .nhd-mb-items-grid {
    grid-template-columns: 1fr;
    padding: 6px 8px 8px;
  }

  .nhd-mb-row {
    padding: 9px 8px;
    gap: 6px;
  }

  .nhd-mb-name-wrap {
    max-width: 56%;
  }

  .nhd-mb-name {
    font-size: 13px;
  }

  .nhd-mb-price {
    font-size: 13px;
  }

  .nhd-mb-unit {
    font-size: 11px;
  }

  .nhd-mb-add-btn {
    width: 31px;
    height: 31px;
    font-size: 16px;
  }

  .nhd-mb-step-btn {
    width: 26px;
    height: 26px;
  }
}
</style>