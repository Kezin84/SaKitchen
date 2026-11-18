<template>
  <div class="sort-page">
    <!-- Toast Alert -->
    <transition name="toast-fade">
      <div v-if="alertState.message" class="sort-toast" :class="`is-${alertState.type}`">
        <i
          :class="
            alertState.type === 'error'
              ? 'ri-error-warning-fill'
              : alertState.type === 'info'
                ? 'ri-information-fill'
                : 'ri-checkbox-circle-fill'
          "
        ></i>
        <span>{{ alertState.message }}</span>
      </div>
    </transition>

    <!-- Page Header -->
    <header class="sort-header">
      <div class="sort-header-left">
        <h1 class="sort-title">
          <i class="ri-arrow-up-down-line"></i>
          <span>Sắp xếp hiển thị</span>
        </h1>
        <p class="sort-subtitle">
          Chỉnh thứ tự Danh mục, Hàng hóa, ghim Top và Kiểu hiển thị — nhấn <strong>Lưu & Đồng bộ</strong> để áp dụng sang trang Order của khách
        </p>
      </div>
      <div class="sort-header-actions">
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading || savingAll"
          @click="handleReloadClick"
          title="Tải lại dữ liệu mới nhất"
        >
          <i class="ri-refresh-line" :class="{ spinning: loading }"></i>
          <span>Tải lại</span>
        </button>
        <router-link :to="{ name: 'menu-online', params: { lang: 'vi' } }" class="btn-preview-menu">
          <i class="ri-external-link-line"></i>
          <span>Xem Menu Online</span>
        </router-link>
        <button
          type="button"
          class="btn-primary-save"
          :disabled="savingAll || !hasAnyChanges"
          @click="saveAllChanges"
        >
          <i v-if="savingAll" class="ri-loader-4-line spinning"></i>
          <i v-else class="ri-save-3-line"></i>
          <span>{{ savingAll ? 'Đang lưu...' : 'Lưu & Đồng bộ' }}</span>
        </button>
      </div>
    </header>

    <!-- Kiểu A / Kiểu B Switch Card -->
    <section class="mode-switch-card">
      <div class="mode-switch-head">
        <div>
          <h2 class="mode-switch-title">
            <i class="ri-layout-masonry-line"></i>
            <span>Chế độ hiển thị khi khách xem tab "Tất cả" trên Menu Online</span>
          </h2>
          <p class="mode-switch-desc">
            Gạt chọn Kiểu A hoặc Kiểu B rồi nhấn <strong>Lưu & Đồng bộ</strong> để áp dụng sang trang Order của khách.
          </p>
        </div>
        <span v-if="hasModeChanges" class="mode-dirty-pill">
          <i class="ri-edit-circle-line"></i> Chưa lưu chế độ
        </span>
      </div>

      <div class="mode-toggle-grid">
        <button
          type="button"
          class="mode-option"
          :class="{ active: productSortMode === DISPLAY_MODE_FLAT }"
          :disabled="savingAll"
          @click="productSortMode = DISPLAY_MODE_FLAT"
        >
          <div class="mode-option-top">
            <span class="mode-badge">Kiểu A</span>
            <span class="mode-check">
              <i
                :class="
                  productSortMode === DISPLAY_MODE_FLAT
                    ? 'ri-radio-button-line'
                    : 'ri-checkbox-blank-circle-line'
                "
              ></i>
            </span>
          </div>
          <div class="mode-option-title">Thứ tự tự do (Ưu tiên Top → Thứ tự món)</div>
          <div class="mode-option-sub">
            Các món được đẩy lên TOP đứng đầu danh sách, tiếp theo hiển thị đúng theo thứ tự hàng hóa bạn đã xếp.
          </div>
        </button>

        <button
          type="button"
          class="mode-option"
          :class="{ active: productSortMode === DISPLAY_MODE_BY_CATEGORY }"
          :disabled="savingAll"
          @click="productSortMode = DISPLAY_MODE_BY_CATEGORY"
        >
          <div class="mode-option-top">
            <span class="mode-badge is-cat">Kiểu B</span>
            <span class="mode-check">
              <i
                :class="
                  productSortMode === DISPLAY_MODE_BY_CATEGORY
                    ? 'ri-radio-button-line'
                    : 'ri-checkbox-blank-circle-line'
                "
              ></i>
            </span>
          </div>
          <div class="mode-option-title">Gom nhóm theo thứ tự Danh mục</div>
          <div class="mode-option-sub">
            Hiện lần lượt toàn bộ món của Danh mục #1 → Danh mục #2 → ... (bên trong mỗi danh mục vẫn ưu tiên Top → thứ tự món).
          </div>
        </button>
      </div>
    </section>

    <!-- Main Tabs -->
    <div class="sort-tabs">
      <button
        type="button"
        class="sort-tab-btn"
        :class="{ active: activeTab === 'categories' }"
        @click="activeTab = 'categories'"
      >
        <i class="ri-folders-line"></i>
        <span>Sắp xếp Danh mục</span>
        <span class="tab-count">{{ categoryTreeDraft.length }}</span>
        <span v-if="hasCategoryChanges" class="tab-dirty-dot" title="Có thay đổi chưa lưu"></span>
      </button>

      <button
        type="button"
        class="sort-tab-btn"
        :class="{ active: activeTab === 'products' }"
        @click="activeTab = 'products'"
      >
        <i class="ri-shopping-bag-3-line"></i>
        <span>Sắp xếp Hàng hóa</span>
        <span class="tab-count">{{ displayedProductDraft.length }}</span>
        <span v-if="hasProductChanges || hasTopChanges" class="tab-dirty-dot" title="Có thay đổi chưa lưu"></span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="sort-loading-box">
      <div class="spinner"></div>
      <span>Đang tải dữ liệu...</span>
    </div>

    <!-- ===== TAB 1: SẮP XẾP DANH MỤC (CHỈ HIỂN THỊ & SẮP XẾP) ===== -->
    <section v-else-if="activeTab === 'categories'" class="sort-panel">
      <div class="panel-toolbar">
        <div class="panel-hint">
          <i class="ri-information-line"></i>
          <span>
            Mục <strong>Tất cả</strong> luôn cố định ở đầu. Việc tạo &amp; gom danh mục con vào <strong>Danh mục cha</strong> thực hiện ở trang <strong>Kho hàng</strong>; tại đây chỉ sắp xếp thứ tự Cha &amp; Con bên trong rồi nhấn <strong>Lưu &amp; Đồng bộ</strong>.
          </span>
        </div>
        <div class="panel-toolbar-actions">
          <button
            type="button"
            class="btn-secondary-soft"
            :disabled="savingAll"
            @click="sortCategoriesAlpha('asc')"
          >
            <i class="ri-sort-alphabet-asc"></i>
            <span>Xếp A → Z</span>
          </button>
          <button
            type="button"
            class="btn-secondary-soft"
            :disabled="savingAll"
            @click="sortCategoriesAlpha('desc')"
          >
            <i class="ri-sort-alphabet-desc"></i>
            <span>Xếp Z → A</span>
          </button>
        </div>
      </div>

      <!-- Fixed "Tất cả" Row -->
      <div class="cat-fixed-row">
        <span class="pos-pill is-locked">
          <i class="ri-lock-2-line"></i> Cố định
        </span>
        <div class="cat-row-info">
          <span class="cat-row-name">Tất cả</span>
          <span class="cat-row-meta">Tab mặc định luôn đứng đầu Menu Online</span>
        </div>
      </div>

      <!-- Draggable Category Tree List -->
      <div v-if="!categoryTreeDraft.length" class="empty-box">
        Chưa có danh mục nào trong Kho hàng.
      </div>
      <div v-else class="sortable-list">
        <div
          v-for="(node, idx) in categoryTreeDraft"
          :key="node.key + (node.isParentGroup ? '-grp' : '-solo')"
          class="cat-tree-block"
        >
          <div
            class="sort-row cat-row"
            :class="{
              'is-sale-row': node.isSale,
              'is-parent-group-row': node.isParentGroup,
              'is-dragging': catDragIdx === idx,
              'is-drag-over': catDragOverIdx === idx && catDragIdx !== idx,
            }"
            draggable="true"
            @dragstart="onCatDragStart(idx, $event)"
            @dragover.prevent="onCatDragOver(idx)"
            @drop.prevent="onCatDrop(idx)"
            @dragend="onCatDragEnd"
          >
            <div class="drag-handle" title="Kéo để đổi vị trí">
              <i class="ri-draggable"></i>
            </div>

            <div class="pos-input-wrap" title="Nhập số vị trí rồi nhấn Enter">
              <span class="pos-hash">#</span>
              <input
                type="number"
                min="1"
                :max="categoryTreeDraft.length"
                :value="idx + 1"
                class="pos-number-input"
                @change="moveCategoryTo(idx, $event.target.value)"
              />
            </div>

            <button
              v-if="node.isParentGroup"
              type="button"
              class="cat-expand-btn"
              :title="isParentExpanded(node.key) ? 'Thu gọn danh mục con' : 'Mở danh mục con'"
              @click.stop="toggleParentExpanded(node.key)"
            >
              <i :class="isParentExpanded(node.key) ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
            </button>

            <div class="cat-row-info">
              <div class="cat-name-line">
                <span class="cat-row-name">
                  <i v-if="node.isSale" class="ri-fire-fill sale-fire-icon"></i>
                  <i v-else-if="node.isParentGroup" class="ri-folder-3-fill parent-folder-icon"></i>
                  {{ node.label }}
                </span>
                <span v-if="node.isParentGroup" class="cat-parent-badge">
                  Danh mục cha • {{ node.children.length }} con
                </span>
                <span v-if="node.isSale" class="cat-sale-badge">
                  Tự động hiện khi có món giảm giá
                </span>
              </div>
              <div class="cat-row-meta">
                <span>{{ node.count }} sản phẩm</span>
                <span v-if="node.translations" class="cat-i18n-preview">
                  • {{ node.translations }}
                </span>
              </div>
            </div>

            <div class="row-move-actions">
              <button
                type="button"
                class="move-btn"
                :disabled="idx === 0"
                title="Đưa lên vị trí #1"
                @click="moveCategoryTo(idx, 1)"
              >
                <i class="ri-arrow-up-double-line"></i>
              </button>
              <button
                type="button"
                class="move-btn"
                :disabled="idx === 0"
                title="Lên 1 bậc"
                @click="moveCategoryBy(idx, -1)"
              >
                <i class="ri-arrow-up-s-line"></i>
              </button>
              <button
                type="button"
                class="move-btn"
                :disabled="idx === categoryTreeDraft.length - 1"
                title="Xuống 1 bậc"
                @click="moveCategoryBy(idx, 1)"
              >
                <i class="ri-arrow-down-s-line"></i>
              </button>
            </div>
          </div>

          <!-- Nested Subcategories Inside Parent Group -->
          <div
            v-if="node.isParentGroup && isParentExpanded(node.key)"
            class="subcat-nest-list"
          >
            <div v-if="!node.children.length" class="subcat-nest-empty">
              Chưa có danh mục con nào. Hãy chọn <strong>"↳ Thuộc cha: {{ node.label }}"</strong> ở một danh mục bên dưới để gom vào đây.
            </div>
            <div
              v-for="(sub, sIdx) in node.children"
              :key="'sub-' + node.key + '-' + sub.key"
              class="sort-row subcat-nest-row"
              :class="{
                'is-dragging': subDragState.parentKey === node.key && subDragState.idx === sIdx,
                'is-drag-over':
                  subDragState.parentKey === node.key &&
                  subDragState.overIdx === sIdx &&
                  subDragState.idx !== sIdx,
              }"
              draggable="true"
              @dragstart.stop="onSubDragStart(node.key, sIdx, $event)"
              @dragover.prevent.stop="onSubDragOver(node.key, sIdx)"
              @drop.prevent.stop="onSubDrop(node.key, sIdx)"
              @dragend.stop="onSubDragEnd"
            >
              <div class="drag-handle" title="Kéo để đổi vị trí trong nhóm cha">
                <i class="ri-draggable"></i>
              </div>

              <div class="pos-input-wrap is-sub-pos" title="Thứ tự con trong nhóm cha">
                <span class="pos-hash">#</span>
                <input
                  type="number"
                  min="1"
                  :max="node.children.length"
                  :value="sIdx + 1"
                  class="pos-number-input"
                  @change="moveSubCategoryTo(node.key, sIdx, $event.target.value)"
                />
              </div>

              <div class="cat-row-info">
                <div class="cat-name-line">
                  <span class="subcat-branch-ico">↳</span>
                  <span class="cat-row-name">{{ sub.label }}</span>
                </div>
                <div class="cat-row-meta">
                  <span>{{ sub.count }} sản phẩm</span>
                  <span v-if="sub.translations" class="cat-i18n-preview">
                    • {{ sub.translations }}
                  </span>
                </div>
              </div>

              <div class="row-move-actions">
                <button
                  type="button"
                  class="move-btn"
                  :disabled="sIdx === 0"
                  title="Lên 1 bậc"
                  @click="moveSubCategoryBy(node.key, sIdx, -1)"
                >
                  <i class="ri-arrow-up-s-line"></i>
                </button>
                <button
                  type="button"
                  class="move-btn"
                  :disabled="sIdx === node.children.length - 1"
                  title="Xuống 1 bậc"
                  @click="moveSubCategoryBy(node.key, sIdx, 1)"
                >
                  <i class="ri-arrow-down-s-line"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== TAB 2: SẮP XẾP HÀNG HÓA ===== -->
    <section v-else class="sort-panel">
      <div class="panel-toolbar">
        <div class="product-filters-row">
          <div class="filter-field">
            <label>Lọc theo danh mục</label>
            <select v-model="selectedCategoryFilter" class="filter-select">
              <option value="__ALL__">Tất cả sản phẩm ({{ displayedProductDraft.length }})</option>
              <option
                v-for="cat in filterCategoryOptions"
                :key="'opt-' + cat.key"
                :value="cat.key"
              >
                {{ cat.label }} ({{ cat.count }})
              </option>
            </select>
          </div>

          <div class="filter-field filter-search-field">
            <label>Tìm nhanh (chỉ để kiểm tra / đẩy Top)</label>
            <div class="search-input-box">
              <i class="ri-search-line"></i>
              <input
                v-model="productSearch"
                type="text"
                placeholder="Nhập tên hoặc mã hàng..."
              />
              <button
                v-if="productSearch"
                type="button"
                class="clear-search-btn"
                @click="productSearch = ''"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-hint is-compact">
        <i class="ri-pushpin-2-line"></i>
        <span>
          Danh sách bên dưới hiển thị đúng vị trí hiện tại (các món đang đẩy lên <strong>TOP</strong> luôn nổi ở đầu để dễ theo dõi). Kéo thả, nhập số `#`, hoặc bấm <strong>Lên top / Bỏ top</strong> rồi nhấn <strong>Lưu & Đồng bộ</strong> để áp dụng sang trang Order của khách.
          <template v-if="productSearch.trim()">
            <strong class="warn-text"> Đang lọc tìm kiếm nên tạm khóa kéo-thả thứ tự — xóa từ khóa để sắp xếp vị trí.</strong>
          </template>
        </span>
      </div>

      <div v-if="!filteredProducts.length" class="empty-box">
        Không có sản phẩm nào phù hợp bộ lọc.
      </div>
      <div v-else class="sortable-list">
        <div
          v-for="(item, idx) in visibleFilteredProducts"
          :key="item.Ma_hang"
          class="sort-row product-sort-row"
          :class="{
            'is-product-top': getTopAt(item) > 0,
            'is-product-hidden': isProductHidden(item),
            'is-dragging': prodDragIdx === idx,
            'is-drag-over': prodDragOverIdx === idx && prodDragIdx !== idx,
          }"
          :draggable="canReorderProducts"
          @dragstart="onProdDragStart(idx, $event)"
          @dragover.prevent="onProdDragOver(idx)"
          @drop.prevent="onProdDrop(idx)"
          @dragend="onProdDragEnd"
        >
          <div
            class="drag-handle"
            :class="{ disabled: !canReorderProducts }"
            :title="canReorderProducts ? 'Kéo để đổi vị trí' : 'Xóa ô tìm kiếm để kéo thả'"
          >
            <i class="ri-draggable"></i>
          </div>

          <div class="pos-input-wrap" title="Nhập số vị trí trong danh sách đang xem">
            <span class="pos-hash">#</span>
            <input
              type="number"
              min="1"
              :max="filteredProducts.length"
              :value="idx + 1"
              :disabled="!canReorderProducts"
              class="pos-number-input"
              @change="moveProductInScope(item.Ma_hang, $event.target.value)"
            />
          </div>

          <div class="prod-thumb-wrap">
            <img v-if="item.Main_img" :src="item.Main_img" :alt="item.Ten_hang" loading="lazy" />
            <div v-else class="prod-thumb-empty"><i class="ri-image-line"></i></div>
          </div>

          <div class="prod-info">
            <div class="prod-name-row">
              <span class="prod-name">{{ item.Ten_hang }}</span>
              <span v-if="getTopAt(item) > 0" class="badge-top-mini">
                <i class="ri-pushpin-2-fill"></i> TOP #{{ getTopRank(item) }}
              </span>
              <span v-if="isProductHidden(item)" class="badge-hidden-mini">Đang ẩn</span>
              <span v-if="item.Trang_thai === 'Hết hàng'" class="badge-out-mini">Hết hàng</span>
            </div>
            <div class="prod-meta-row">
              <span class="prod-code">{{ item.Ma_hang }}</span>
              <span v-if="getCanonicalCat(item)" class="prod-cat-pill">
                {{ getCanonicalCat(item) }}
              </span>
              <span class="prod-price">
                {{ formatMoney(item.Gia_ban) }} {{ item.Don_vi_tien_te || 'P' }}
              </span>
            </div>
          </div>

          <div class="prod-right-actions">
            <button
              v-if="!isTopRankOne(item)"
              type="button"
              class="btn-mini-top"
              title="Đẩy mặt hàng lên TOP #1 (nhấn Lưu để đồng bộ)"
              @click="pushToTopDraft(item)"
            >
              <i class="ri-arrow-up-double-line"></i>
              <span>Lên top</span>
            </button>
            <button
              v-if="getTopAt(item) > 0"
              type="button"
              class="btn-mini-untop"
              title="Bỏ ghim TOP (nhấn Lưu để đồng bộ)"
              @click="unpinTopDraft(item)"
            >
              <i class="ri-unpin-line"></i>
              <span>Bỏ top</span>
            </button>

            <div class="row-move-actions">
              <button
                type="button"
                class="move-btn"
                :disabled="!canReorderProducts || !canMoveItemUp(item, idx)"
                title="Đưa lên đầu nhóm (#1)"
                @click="moveProductToFirstInZone(item)"
              >
                <i class="ri-skip-up-line"></i>
              </button>
              <button
                type="button"
                class="move-btn"
                :disabled="!canReorderProducts || !canMoveItemUp(item, idx)"
                title="Lên 1 bậc"
                @click="moveProductBy(item.Ma_hang, -1)"
              >
                <i class="ri-arrow-up-s-line"></i>
              </button>
              <button
                type="button"
                class="move-btn"
                :disabled="!canReorderProducts || !canMoveItemDown(item, idx)"
                title="Xuống 1 bậc"
                @click="moveProductBy(item.Ma_hang, 1)"
              >
                <i class="ri-arrow-down-s-line"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredProducts.length > visibleProductLimit" class="load-more-row">
          <span>
            Đang hiện {{ visibleFilteredProducts.length }} / {{ filteredProducts.length }} sản phẩm
          </span>
          <div class="load-more-btns">
            <button
              type="button"
              class="btn-secondary-soft"
              @click="visibleProductLimit += 60"
            >
              Hiện thêm 60 món
            </button>
            <button
              type="button"
              class="btn-secondary-soft"
              @click="visibleProductLimit = filteredProducts.length"
            >
              Hiện tất cả ({{ filteredProducts.length }})
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Floating Unsaved Changes Bar -->
    <transition name="toast-fade">
      <div v-if="hasAnyChanges" class="unsaved-floating-bar">
        <div class="ufb-info">
          <span class="ufb-dot"></span>
          <span>Có thay đổi chưa đồng bộ sang Menu Online ({{ unsavedSummary }})</span>
        </div>
        <div class="ufb-actions">
          <button
            type="button"
            class="btn-secondary-soft"
            :disabled="savingAll"
            @click="discardDraftChanges"
          >
            <i class="ri-arrow-go-back-line"></i>
            <span>Hủy thay đổi</span>
          </button>
          <button
            type="button"
            class="btn-primary-save"
            :disabled="savingAll"
            @click="saveAllChanges"
          >
            <i v-if="savingAll" class="ri-loader-4-line spinning"></i>
            <i v-else class="ri-save-3-line"></i>
            <span>{{ savingAll ? 'Đang lưu...' : 'Lưu & Đồng bộ' }}</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { getOneSheet, dispatchAction } from '@/config/api'
import { productMatchesKeyword, normalizeProductI18n, DATA_LANG_CODES } from '@/utils/i18nData'
import {
  DISPLAY_MODE_FLAT,
  DISPLAY_MODE_BY_CATEGORY,
  normalizeDisplayConfig,
  sortProductsFlat,
  sortProductsByRankOnly,
  getCanonicalCategoryName,
  parseProductTopAt,
} from '@/utils/displayOrder'

const loading = ref(true)
const activeTab = ref('categories')
const savingAll = ref(false)

// Saved baseline state from Firebase
const rawProducts = ref([])
const savedProductSortMode = ref(DISPLAY_MODE_FLAT)
const savedCategoryOrder = ref([])
const savedParentMap = ref({})
const savedParentI18n = ref({})
const savedCategorySnapshot = ref('')
const savedBaseOrderCodes = ref([]) // canonical Thu_tu sequence of products
const savedTopAtByCode = ref({}) // { [Ma_hang]: Top_at }

// Editable draft state (not synced until user clicks Lưu)
const productSortMode = ref(DISPLAY_MODE_FLAT)
const categoryTreeDraft = ref([])
const parentI18nDraft = ref({})
const customParentKeysDraft = ref([])
const expandedParentKeys = ref({})
const subDragState = ref({ parentKey: '', idx: -1, overIdx: -1 })
const baseOrderDraft = ref([]) // products ordered solely by Thu_tu (1..N)
const topAtDraftByCode = ref({}) // { [Ma_hang]: Top_at }

const selectedCategoryFilter = ref('__ALL__')
const productSearch = ref('')
const visibleProductLimit = ref(80)

const catDragIdx = ref(-1)
const catDragOverIdx = ref(-1)
const prodDragIdx = ref(-1)
const prodDragOverIdx = ref(-1)

const alertState = ref({ message: '', type: 'success' })
let alertTimer = null

function showToast(message, type = 'success') {
  alertState.value = { message, type }
  if (alertTimer) clearTimeout(alertTimer)
  alertTimer = setTimeout(() => {
    alertState.value = { message: '', type: 'success' }
  }, 3200)
}

function getCanonicalCat(item) {
  return getCanonicalCategoryName(item)
}

function getTopAt(item) {
  const code = item?.Ma_hang
  if (code && Object.prototype.hasOwnProperty.call(topAtDraftByCode.value, code)) {
    const val = Number(topAtDraftByCode.value[code] || 0)
    return Number.isFinite(val) && val > 0 ? val : 0
  }
  return parseProductTopAt(item)
}

function isProductHidden(item) {
  return (
    item?.Is_hidden === true ||
    String(item?.Is_hidden) === 'true' ||
    String(item?.Trang_thai || '').trim() === 'Ẩn'
  )
}

function formatMoney(num) {
  const n = Number(num || 0)
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0'
}

function harvestHierarchyData(products, cfgParentMap = {}, cfgParentI18n = {}) {
  const subStats = new Map()
  const harvestedParentMap = { ...cfgParentMap }
  const harvestedParentI18n = {}

  for (const [pKey, pLangs] of Object.entries(cfgParentI18n || {})) {
    const cleanP = String(pKey || '').trim()
    if (!cleanP) continue
    harvestedParentI18n[cleanP] = { ...pLangs, vi: cleanP }
  }

  for (const p of products || []) {
    const viCat = getCanonicalCat(p)
    if (!viCat || viCat === 'Tất cả' || viCat === 'Sale') continue
    const i18n = normalizeProductI18n(p)

    if (!subStats.has(viCat)) {
      const otherLangs = DATA_LANG_CODES.filter((c) => c !== 'vi')
        .map((code) => String(i18n[code]?.Danh_muc || '').trim())
        .filter((val) => val && val !== viCat)
      subStats.set(viCat, {
        key: viCat,
        label: viCat,
        count: 0,
        translations: [...new Set(otherLangs)].join(' / '),
      })
    }
    subStats.get(viCat).count += 1

    const itemParentVi = String(i18n.vi?.Danh_muc_cha || p?.Danh_muc_cha || '').trim()
    if (itemParentVi && itemParentVi !== 'Tất cả' && itemParentVi !== 'Sale' && itemParentVi !== viCat) {
      if (!Object.prototype.hasOwnProperty.call(harvestedParentMap, viCat)) {
        harvestedParentMap[viCat] = itemParentVi
      }
      if (!harvestedParentI18n[itemParentVi]) {
        harvestedParentI18n[itemParentVi] = { vi: itemParentVi }
      }
      for (const code of DATA_LANG_CODES) {
        if (code === 'vi') continue
        const val = String(i18n[code]?.Danh_muc_cha || '').trim()
        if (val && !harvestedParentI18n[itemParentVi][code]) {
          harvestedParentI18n[itemParentVi][code] = val
        }
      }
    }
  }

  return { subStats, harvestedParentMap, harvestedParentI18n }
}

function buildCategoryTreeEntries(
  products,
  customOrder = [],
  parentMapInput = {},
  parentI18nInput = {},
  extraParentKeys = [],
  forcedDirection = null,
) {
  const { subStats } = harvestHierarchyData(products, parentMapInput, parentI18nInput)
  const rankMap = new Map(customOrder.map((name, idx) => [name, idx]))
  const hasCustom = rankMap.size > 0 && !forcedDirection

  // Collect all active parent keys
  const parentGroupsMap = new Map()
  const ensureParentGroup = (pKey) => {
    const clean = String(pKey || '').trim()
    if (!clean || clean === 'Tất cả' || clean === 'Sale') return null
    if (!parentGroupsMap.has(clean)) {
      const i18nObj = parentI18nInput[clean] || { vi: clean }
      const transPreview = DATA_LANG_CODES.filter((c) => c !== 'vi')
        .map((c) => String(i18nObj[c] || '').trim())
        .filter((v) => v && v !== clean)
      parentGroupsMap.set(clean, {
        key: clean,
        label: clean,
        isParentGroup: true,
        isSale: false,
        count: 0,
        translations: [...new Set(transPreview)].join(' / '),
        children: [],
      })
    }
    return parentGroupsMap.get(clean)
  }

  for (const extraP of extraParentKeys || []) {
    ensureParentGroup(extraP)
  }
  for (const [subKey, parentKey] of Object.entries(parentMapInput || {})) {
    if (subStats.has(subKey) && parentKey && parentKey !== subKey) {
      ensureParentGroup(parentKey)
    }
  }

  const standaloneNodes = []
  for (const [subKey, info] of subStats.entries()) {
    const assignedParent = String(parentMapInput[subKey] || '').trim()
    if (assignedParent && assignedParent !== subKey && parentGroupsMap.has(assignedParent)) {
      const grp = parentGroupsMap.get(assignedParent)
      grp.children.push({ ...info })
      grp.count += info.count
    } else {
      standaloneNodes.push({
        key: info.key,
        label: info.label,
        isParentGroup: false,
        isSale: false,
        count: info.count,
        translations: info.translations,
        children: [],
      })
    }
  }

  const sortChildNodes = (arr) => {
    arr.sort((a, b) => {
      if (forcedDirection === 'asc' || forcedDirection === 'desc') {
        const cmp = a.label.localeCompare(b.label, 'vi', { sensitivity: 'base', numeric: true })
        return forcedDirection === 'desc' ? -cmp : cmp
      }
      const rA = rankMap.has(a.key) ? rankMap.get(a.key) : Number.MAX_SAFE_INTEGER
      const rB = rankMap.has(b.key) ? rankMap.get(b.key) : Number.MAX_SAFE_INTEGER
      if (rA !== rB) return rA - rB
      return a.label.localeCompare(b.label, 'vi', { sensitivity: 'base', numeric: true })
    })
  }

  const topNodes = []
  for (const grp of parentGroupsMap.values()) {
    sortChildNodes(grp.children)
    topNodes.push(grp)
  }
  topNodes.push(...standaloneNodes)

  const saleCount = (products || []).filter((p) => Number(p?.Gia_Giam || 0) > 0).length
  topNodes.push({
    key: 'Sale',
    label: 'Sale',
    isParentGroup: false,
    isSale: true,
    count: saleCount,
    translations: 'Danh mục khuyến mãi',
    children: [],
  })

  if (forcedDirection === 'asc' || forcedDirection === 'desc') {
    return topNodes.sort((a, b) => {
      const cmp = a.label.localeCompare(b.label, 'vi', { sensitivity: 'base', numeric: true })
      return forcedDirection === 'desc' ? -cmp : cmp
    })
  }

  return topNodes.sort((a, b) => {
    const rA = rankMap.has(a.key) ? rankMap.get(a.key) : Number.MAX_SAFE_INTEGER
    const rB = rankMap.has(b.key) ? rankMap.get(b.key) : Number.MAX_SAFE_INTEGER
    if (!hasCustom) {
      if (a.isSale && !b.isSale) return -1
      if (!a.isSale && b.isSale) return 1
    } else if (rA !== rB) {
      return rA - rB
    } else if (a.isSale && !b.isSale && rA === Number.MAX_SAFE_INTEGER) {
      return -1
    } else if (!a.isSale && b.isSale && rB === Number.MAX_SAFE_INTEGER) {
      return 1
    }
    return a.label.localeCompare(b.label, 'vi', { sensitivity: 'base', numeric: true })
  })
}

function extractCurrentParentMapFromTree(tree) {
  const map = {}
  for (const node of tree || []) {
    if (!node?.isParentGroup) continue
    for (const child of node.children || []) {
      if (child?.key && child.key !== node.key) {
        map[child.key] = node.key
      }
    }
  }
  return map
}

function flattenTreeOrderKeys(tree) {
  const keys = []
  for (const node of tree || []) {
    if (!node?.key) continue
    keys.push(node.key)
    if (node.isParentGroup) {
      for (const child of node.children || []) {
        if (child?.key) keys.push(child.key)
      }
    }
  }
  return [...new Set(keys)]
}

function computeTreeSnapshot(tree, pI18n = {}) {
  const order = flattenTreeOrderKeys(tree)
  const pMap = extractCurrentParentMapFromTree(tree)
  return JSON.stringify({ order, pMap, pI18n })
}

function hydrateDraftFromSaved() {
  productSortMode.value = savedProductSortMode.value
  parentI18nDraft.value = JSON.parse(JSON.stringify(savedParentI18n.value || {}))
  customParentKeysDraft.value = Object.keys(savedParentI18n.value || {}).filter((k) =>
    Object.values(savedParentMap.value || {}).includes(k),
  )
  categoryTreeDraft.value = buildCategoryTreeEntries(
    rawProducts.value,
    savedCategoryOrder.value,
    savedParentMap.value,
    parentI18nDraft.value,
    customParentKeysDraft.value,
  )
  const nextExpanded = {}
  for (const node of categoryTreeDraft.value) {
    if (node.isParentGroup) nextExpanded[node.key] = true
  }
  expandedParentKeys.value = nextExpanded

  const sortedByRank = sortProductsByRankOnly(rawProducts.value)
  baseOrderDraft.value = sortedByRank.map((p) => ({ ...p }))
  topAtDraftByCode.value = { ...savedTopAtByCode.value }
}

async function loadAll() {
  loading.value = true
  try {
    const [hhRes, cfgRes] = await Promise.all([
      getOneSheet('hang_hoa'),
      getOneSheet('display_config'),
    ])
    const products = Array.isArray(hhRes?.data) ? hhRes.data : []
    const cfg = normalizeDisplayConfig(cfgRes?.data || [])

    const { harvestedParentMap, harvestedParentI18n } = harvestHierarchyData(
      products,
      cfg.parentMap,
      cfg.parentI18n,
    )

    rawProducts.value = products
    savedProductSortMode.value = cfg.productSortMode
    savedCategoryOrder.value = [...cfg.categoryOrder]
    savedParentMap.value = { ...harvestedParentMap }
    savedParentI18n.value = JSON.parse(JSON.stringify(harvestedParentI18n))

    const initialTree = buildCategoryTreeEntries(
      products,
      cfg.categoryOrder,
      savedParentMap.value,
      savedParentI18n.value,
    )
    savedCategorySnapshot.value = computeTreeSnapshot(initialTree, savedParentI18n.value)

    const sortedByRank = sortProductsByRankOnly(products)
    savedBaseOrderCodes.value = sortedByRank.map((p) => p.Ma_hang)

    const topMap = {}
    for (const p of products) {
      if (p?.Ma_hang) {
        topMap[p.Ma_hang] = parseProductTopAt(p)
      }
    }
    savedTopAtByCode.value = topMap

    hydrateDraftFromSaved()
  } catch (err) {
    console.error('Load SapXepHienThi error:', err)
    showToast('Không thể tải dữ liệu sắp xếp', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAll()
})

watch([selectedCategoryFilter, productSearch], () => {
  visibleProductLimit.value =
    selectedCategoryFilter.value === '__ALL__' ? 80 : displayedProductDraft.value.length || 80
})

/* ===== CHANGE DETECTION (ALL REQUIRE SAVE TO SYNC) ===== */
const hasModeChanges = computed(() => productSortMode.value !== savedProductSortMode.value)

const currentCategorySnapshot = computed(() =>
  computeTreeSnapshot(categoryTreeDraft.value, parentI18nDraft.value),
)
const hasCategoryChanges = computed(
  () => currentCategorySnapshot.value !== savedCategorySnapshot.value,
)

const hasProductChanges = computed(() => {
  if (savedBaseOrderCodes.value.length !== baseOrderDraft.value.length) return false
  return baseOrderDraft.value.some((p, i) => p.Ma_hang !== savedBaseOrderCodes.value[i])
})

const hasTopChanges = computed(() => {
  for (const p of rawProducts.value) {
    const code = p?.Ma_hang
    if (!code) continue
    const prevTop = Number(savedTopAtByCode.value[code] || 0)
    const nextTop = Number(topAtDraftByCode.value[code] || 0)
    if (prevTop !== nextTop) return true
  }
  return false
})

const hasAnyChanges = computed(
  () =>
    hasModeChanges.value ||
    hasCategoryChanges.value ||
    hasProductChanges.value ||
    hasTopChanges.value,
)

const unsavedSummary = computed(() => {
  const parts = []
  if (hasModeChanges.value) parts.push('Kiểu A/B')
  if (hasCategoryChanges.value) parts.push('Danh mục')
  if (hasProductChanges.value) parts.push('Thứ tự món')
  if (hasTopChanges.value) parts.push('Ghim TOP')
  return parts.join(', ')
})

function discardDraftChanges() {
  hydrateDraftFromSaved()
  showToast('Đã hủy các thay đổi chưa lưu', 'info')
}

function handleReloadClick() {
  if (hasAnyChanges.value) {
    if (!window.confirm('Bạn có thay đổi chưa lưu. Tải lại sẽ bỏ toàn bộ thay đổi chưa lưu, tiếp tục?')) {
      return
    }
  }
  loadAll()
}

onBeforeRouteLeave(() => {
  if (hasAnyChanges.value) {
    return window.confirm('Bạn có thay đổi chưa lưu (nhấn Lưu & Đồng bộ để cập nhật Menu Online). Vẫn muốn rời trang?')
  }
  return true
})

/* ===== VISUAL PRODUCT LIST (SHOWING TOP ITEMS FIRST JUST LIKE MENU ONLINE) ===== */
const displayedProductDraft = computed(() => {
  const withDraftTop = baseOrderDraft.value.map((p) => ({
    ...p,
    Top_at: getTopAt(p),
  }))
  return sortProductsFlat(withDraftTop)
})

const topRankMap = computed(() => {
  const pinned = displayedProductDraft.value.filter((item) => getTopAt(item) > 0)
  const map = new Map()
  pinned.forEach((item, idx) => map.set(item.Ma_hang, idx + 1))
  return map
})

function getTopRank(item) {
  return topRankMap.value.get(item?.Ma_hang) || 0
}

function isTopRankOne(item) {
  return getTopRank(item) === 1
}

/* ===== CATEGORY TREE DISPLAY & REORDER ACTIONS (DRAFT) ===== */
function isParentExpanded(parentKey) {
  return expandedParentKeys.value[parentKey] !== false
}

function toggleParentExpanded(parentKey) {
  expandedParentKeys.value = {
    ...expandedParentKeys.value,
    [parentKey]: !isParentExpanded(parentKey),
  }
}

function sortCategoriesAlpha(direction = 'asc') {
  const curMap = extractCurrentParentMapFromTree(categoryTreeDraft.value)
  categoryTreeDraft.value = buildCategoryTreeEntries(
    rawProducts.value,
    [],
    curMap,
    parentI18nDraft.value,
    customParentKeysDraft.value,
    direction,
  )
  showToast(
    direction === 'desc'
      ? 'Đã xếp danh mục theo Z → A (nhấn Lưu & Đồng bộ để áp dụng)'
      : 'Đã xếp danh mục theo A → Z (nhấn Lưu & Đồng bộ để áp dụng)',
    'info',
  )
}

function moveCategoryTo(fromIdx, rawTargetPos) {
  const total = categoryTreeDraft.value.length
  if (total < 2) return
  const parsed = Math.floor(Number(rawTargetPos))
  if (!Number.isFinite(parsed)) return
  const destIdx = Math.min(Math.max(parsed - 1, 0), total - 1)
  if (destIdx === fromIdx) return
  const next = [...categoryTreeDraft.value]
  const [moved] = next.splice(fromIdx, 1)
  next.splice(destIdx, 0, moved)
  categoryTreeDraft.value = next
}

function moveCategoryBy(idx, delta) {
  moveCategoryTo(idx, idx + 1 + delta)
}

function onCatDragStart(idx, event) {
  catDragIdx.value = idx
  catDragOverIdx.value = idx
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(idx))
  }
}

function onCatDragOver(idx) {
  if (catDragIdx.value < 0) return
  catDragOverIdx.value = idx
}

function onCatDrop(dropIdx) {
  const fromIdx = catDragIdx.value
  if (fromIdx >= 0 && dropIdx >= 0 && fromIdx !== dropIdx) {
    moveCategoryTo(fromIdx, dropIdx + 1)
  }
  onCatDragEnd()
}

function onCatDragEnd() {
  catDragIdx.value = -1
  catDragOverIdx.value = -1
}

function moveSubCategoryTo(parentKey, fromIdx, rawTargetPos) {
  const grpIdx = categoryTreeDraft.value.findIndex((n) => n.isParentGroup && n.key === parentKey)
  if (grpIdx === -1) return
  const children = categoryTreeDraft.value[grpIdx].children || []
  if (children.length < 2) return
  const parsed = Math.floor(Number(rawTargetPos))
  if (!Number.isFinite(parsed)) return
  const destIdx = Math.min(Math.max(parsed - 1, 0), children.length - 1)
  if (destIdx === fromIdx) return

  const nextChildren = [...children]
  const [moved] = nextChildren.splice(fromIdx, 1)
  nextChildren.splice(destIdx, 0, moved)

  const nextTree = [...categoryTreeDraft.value]
  nextTree[grpIdx] = { ...nextTree[grpIdx], children: nextChildren }
  categoryTreeDraft.value = nextTree
}

function moveSubCategoryBy(parentKey, idx, delta) {
  moveSubCategoryTo(parentKey, idx, idx + 1 + delta)
}

function onSubDragStart(parentKey, idx, event) {
  subDragState.value = { parentKey, idx, overIdx: idx }
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${parentKey}:${idx}`)
  }
}

function onSubDragOver(parentKey, idx) {
  if (subDragState.value.parentKey !== parentKey) return
  subDragState.value.overIdx = idx
}

function onSubDrop(parentKey, dropIdx) {
  const { parentKey: srcParent, idx: fromIdx } = subDragState.value
  if (srcParent === parentKey && fromIdx >= 0 && dropIdx >= 0 && fromIdx !== dropIdx) {
    moveSubCategoryTo(parentKey, fromIdx, dropIdx + 1)
  }
  onSubDragEnd()
}

function onSubDragEnd() {
  subDragState.value = { parentKey: '', idx: -1, overIdx: -1 }
}

/* ===== PRODUCT REORDER & TOP (DRAFT ONLY) ===== */
const filterCategoryOptions = computed(() => {
  const out = []
  for (const node of categoryTreeDraft.value) {
    if (node.isSale) continue
    if (node.isParentGroup) {
      for (const ch of node.children || []) {
        out.push({ key: ch.key, label: `${node.label} › ${ch.label}` })
      }
    } else {
      out.push({ key: node.key, label: node.label })
    }
  }
  return out
})

const canReorderProducts = computed(() => !productSearch.value.trim())

const filteredProducts = computed(() => {
  const kw = productSearch.value.trim()
  return displayedProductDraft.value.filter((item) => {
    if (selectedCategoryFilter.value !== '__ALL__') {
      if (getCanonicalCat(item) !== selectedCategoryFilter.value) return false
    }
    if (kw && !productMatchesKeyword(item, kw)) return false
    return true
  })
})

const visibleFilteredProducts = computed(() =>
  filteredProducts.value.slice(0, visibleProductLimit.value),
)

function canMoveItemUp(item, idxInFiltered) {
  if (idxInFiltered <= 0) return false
  const isTop = getTopAt(item) > 0
  if (isTop) return true
  const topCount = filteredProducts.value.filter((p) => getTopAt(p) > 0).length
  return idxInFiltered > topCount
}

function canMoveItemDown(item, idxInFiltered) {
  const scoped = filteredProducts.value
  if (idxInFiltered >= scoped.length - 1) return false
  const isTop = getTopAt(item) > 0
  if (!isTop) return true
  const topCount = scoped.filter((p) => getTopAt(p) > 0).length
  return idxInFiltered < topCount - 1
}

function moveProductToFirstInZone(item) {
  const isTop = getTopAt(item) > 0
  if (isTop) {
    moveProductInScope(item.Ma_hang, 1)
  } else {
    const topCount = filteredProducts.value.filter((p) => getTopAt(p) > 0).length
    moveProductInScope(item.Ma_hang, topCount + 1)
  }
}

function moveProductInScope(maHang, rawTargetPos) {
  if (!canReorderProducts.value) return
  const parsed = Math.floor(Number(rawTargetPos))
  if (!Number.isFinite(parsed)) return

  const scoped = filteredProducts.value
  const item = scoped.find((p) => p.Ma_hang === maHang)
  if (!item) return

  const topItems = scoped.filter((p) => getTopAt(p) > 0)
  const normalItems = scoped.filter((p) => getTopAt(p) === 0)
  const topCount = topItems.length
  const isTop = getTopAt(item) > 0

  if (isTop) {
    const fromTopIdx = topItems.findIndex((p) => p.Ma_hang === maHang)
    const destTopIdx = Math.min(Math.max(parsed - 1, 0), topCount - 1)
    if (fromTopIdx < 0 || fromTopIdx === destTopIdx) {
      if (parsed - 1 >= topCount) {
        showToast('Món đang ghim TOP chỉ đổi vị trí trong nhóm TOP (bấm Bỏ top để đưa xuống dưới)', 'info')
      }
      return
    }
    const reorderedTop = [...topItems]
    const [moved] = reorderedTop.splice(fromTopIdx, 1)
    reorderedTop.splice(destTopIdx, 0, moved)

    // Assign descending Top_at preserving order among pinned items
    const sortedTimestamps = topItems
      .map((p) => getTopAt(p))
      .sort((a, b) => b - a)
    // Ensure strictly distinct timestamps in case two items somehow shared one
    for (let i = 1; i < sortedTimestamps.length; i++) {
      if (sortedTimestamps[i] >= sortedTimestamps[i - 1]) {
        sortedTimestamps[i] = sortedTimestamps[i - 1] - 1
      }
    }
    const nextTopMap = { ...topAtDraftByCode.value }
    reorderedTop.forEach((p, idx) => {
      nextTopMap[p.Ma_hang] = Math.max(1, sortedTimestamps[idx] || Date.now() - idx)
    })
    topAtDraftByCode.value = nextTopMap
    return
  }

  // Reorder among normal (non-top) items while preserving global Thu_tu slots of other categories
  let destVisualIdx = Math.min(Math.max(parsed - 1, 0), scoped.length - 1)
  if (destVisualIdx < topCount) {
    destVisualIdx = topCount
    showToast('Món thường xếp ngay sau vùng ghim TOP (bấm "Lên top" nếu muốn đưa lên TOP #1)', 'info')
  }
  const destNormalIdx = Math.min(Math.max(destVisualIdx - topCount, 0), normalItems.length - 1)
  const fromNormalIdx = normalItems.findIndex((p) => p.Ma_hang === maHang)
  if (fromNormalIdx < 0 || fromNormalIdx === destNormalIdx) return

  const normalCodeSet = new Set(normalItems.map((p) => p.Ma_hang))
  const scopedBaseIndices = []
  baseOrderDraft.value.forEach((p, gIdx) => {
    if (normalCodeSet.has(p.Ma_hang)) scopedBaseIndices.push(gIdx)
  })

  // Keep order in normalItems aligned with baseOrderDraft
  const currentNormalOrder = scopedBaseIndices.map((gIdx) => baseOrderDraft.value[gIdx])
  const baseFrom = currentNormalOrder.findIndex((p) => p.Ma_hang === maHang)
  if (baseFrom < 0) return

  const reorderedNormal = [...currentNormalOrder]
  const [movedNormal] = reorderedNormal.splice(baseFrom, 1)
  reorderedNormal.splice(destNormalIdx, 0, movedNormal)

  const nextBase = [...baseOrderDraft.value]
  scopedBaseIndices.forEach((gIdx, slotIdx) => {
    nextBase[gIdx] = reorderedNormal[slotIdx]
  })
  baseOrderDraft.value = nextBase
}

function moveProductBy(maHang, delta) {
  const scopedIdx = filteredProducts.value.findIndex((p) => p.Ma_hang === maHang)
  if (scopedIdx < 0) return
  moveProductInScope(maHang, scopedIdx + 1 + delta)
}

function onProdDragStart(idx, event) {
  if (!canReorderProducts.value) return
  prodDragIdx.value = idx
  prodDragOverIdx.value = idx
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(idx))
  }
}

function onProdDragOver(idx) {
  if (!canReorderProducts.value) return
  prodDragOverIdx.value = idx
}

function onProdDrop(dropIdx) {
  if (!canReorderProducts.value) return
  const fromIdx = prodDragIdx.value
  const item = visibleFilteredProducts.value[fromIdx]
  if (item && fromIdx >= 0 && dropIdx >= 0 && fromIdx !== dropIdx) {
    moveProductInScope(item.Ma_hang, dropIdx + 1)
  }
  onProdDragEnd()
}

function onProdDragEnd() {
  prodDragIdx.value = -1
  prodDragOverIdx.value = -1
}

function getNextDraftTopTs() {
  const maxExisting = Object.values(topAtDraftByCode.value).reduce(
    (max, val) => Math.max(max, Number(val || 0)),
    0,
  )
  return Math.max(Date.now(), maxExisting + 1)
}

function pushToTopDraft(item) {
  if (!item?.Ma_hang) return
  const nextTs = getNextDraftTopTs()
  topAtDraftByCode.value = {
    ...topAtDraftByCode.value,
    [item.Ma_hang]: nextTs,
  }
  showToast(`Đã đưa "${item.Ten_hang}" lên TOP #1 (nhấn Lưu & Đồng bộ để cập nhật Menu)`, 'info')
}

function unpinTopDraft(item) {
  if (!item?.Ma_hang) return
  topAtDraftByCode.value = {
    ...topAtDraftByCode.value,
    [item.Ma_hang]: 0,
  }
  showToast(`Đã gỡ "${item.Ten_hang}" khỏi TOP (nhấn Lưu & Đồng bộ để cập nhật Menu)`, 'info')
}

/* ===== MASTER SAVE & SYNC TO STOREFRONT ===== */
async function saveAllChanges() {
  if (savingAll.value || !hasAnyChanges.value) return
  savingAll.value = true
  try {
    const tasks = []

    if (hasModeChanges.value || hasCategoryChanges.value) {
      const nextKeys = flattenTreeOrderKeys(categoryTreeDraft.value)
      tasks.push(
        dispatchAction({
          action: 'saveDisplayConfig',
          data: {
            categoryOrder: nextKeys,
            productSortMode: productSortMode.value,
          },
        }).then((res) => {
          if (!res?.success) throw new Error(res?.message || 'Lưu cấu hình hiển thị thất bại')
          savedCategoryOrder.value = [...nextKeys]
          savedCategorySnapshot.value = computeTreeSnapshot(categoryTreeDraft.value, parentI18nDraft.value)
          savedProductSortMode.value = productSortMode.value
        }),
      )
    }

    if (hasProductChanges.value || hasTopChanges.value) {
      const maHangs = hasProductChanges.value
        ? baseOrderDraft.value.map((p) => p.Ma_hang).filter(Boolean)
        : []
      const topUpdates = {}
      if (hasTopChanges.value) {
        for (const p of rawProducts.value) {
          const code = p?.Ma_hang
          if (!code) continue
          const prevTop = Number(savedTopAtByCode.value[code] || 0)
          const nextTop = Number(topAtDraftByCode.value[code] || 0)
          if (prevTop !== nextTop) {
            topUpdates[code] = nextTop
          }
        }
      }

      tasks.push(
        dispatchAction({
          action: 'reorderHangHoa',
          maHangs,
          topUpdates,
        }).then((res) => {
          if (!res?.success) throw new Error(res?.message || 'Lưu thứ tự hàng hóa thất bại')
          if (hasProductChanges.value) {
            savedBaseOrderCodes.value = baseOrderDraft.value.map((p) => p.Ma_hang)
            baseOrderDraft.value.forEach((p, idx) => {
              p.Thu_tu = idx + 1
            })
          }
          if (hasTopChanges.value) {
            savedTopAtByCode.value = { ...topAtDraftByCode.value }
            rawProducts.value.forEach((p) => {
              if (p?.Ma_hang && Object.prototype.hasOwnProperty.call(topAtDraftByCode.value, p.Ma_hang)) {
                p.Top_at = topAtDraftByCode.value[p.Ma_hang]
              }
            })
          }
        }),
      )
    }

    await Promise.all(tasks)
    showToast('Đã lưu và đồng bộ qua Menu Online của khách!', 'success')
  } catch (err) {
    console.error('Save SapXepHienThi error:', err)
    showToast(err?.message || 'Lưu thất bại, vui lòng thử lại', 'error')
  } finally {
    savingAll.value = false
  }
}
</script>

<style scoped>
.sort-page {
  min-height: 100vh;
  background: rgb(15, 23, 42);
  color: #f8fafc;
  padding: 24px 24px 96px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.sort-toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 2000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}
.sort-toast.is-success {
  background: #065f46;
  border: 1px solid #10b981;
  color: #ecfdf5;
}
.sort-toast.is-info {
  background: #1e3a8a;
  border: 1px solid #60a5fa;
  color: #eff6ff;
}
.sort-toast.is-error {
  background: #7f1d1d;
  border: 1px solid #ef4444;
  color: #fef2f2;
}

.sort-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.sort-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sort-title i {
  color: #38bdf8;
}

.sort-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: #94a3b8;
}

.sort-header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.btn-refresh,
.btn-preview-menu {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s ease;
}

.btn-refresh {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #e2e8f0;
}
.btn-refresh:hover:not(:disabled) {
  border-color: #60a5fa;
  color: #ffffff;
}

.btn-preview-menu {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border: 1px solid rgba(96, 165, 250, 0.7);
  color: #ffffff;
}
.btn-preview-menu:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

/* Mode switch card */
.mode-switch-card {
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 18px;
}

.mode-switch-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.mode-switch-title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 800;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}
.mode-switch-title i {
  color: #fbbf24;
}

.mode-switch-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.mode-dirty-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(251, 191, 36, 0.5);
  color: #fde68a;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.mode-toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mode-option {
  text-align: left;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.7);
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.18s ease;
}

.mode-option:hover {
  border-color: rgba(96, 165, 250, 0.55);
}

.mode-option.active {
  background: rgba(30, 58, 138, 0.28);
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.16);
  color: #f8fafc;
}

.mode-option-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mode-badge {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  background: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
  border: 1px solid rgba(96, 165, 250, 0.5);
}
.mode-badge.is-cat {
  background: rgba(16, 185, 129, 0.22);
  color: #6ee7b7;
  border-color: rgba(52, 211, 153, 0.5);
}

.mode-check {
  font-size: 18px;
  color: #38bdf8;
}

.mode-option-title {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 4px;
}

.mode-option-sub {
  font-size: 12.5px;
  line-height: 1.45;
  color: #94a3b8;
}

/* Tabs */
.sort-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.sort-tab-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.sort-tab-btn.active {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  border-color: rgba(125, 211, 252, 0.6);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
}

.tab-count {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.35);
}

.tab-dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.28);
}

/* Panel */
.sort-panel {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  padding: 18px;
}

.panel-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 14px;
}

.panel-hint {
  flex: 1 1 360px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.14);
  font-size: 12.8px;
  line-height: 1.45;
  color: #cbd5e1;
}
.panel-hint i {
  font-size: 16px;
  color: #38bdf8;
  margin-top: 1px;
}
.panel-hint.is-compact {
  margin-bottom: 14px;
}
.warn-text {
  color: #fcd34d;
}

.panel-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.btn-secondary-soft {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.btn-secondary-soft:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.26);
}

.btn-primary-save {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: 1px solid rgba(52, 211, 153, 0.7);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
  transition: all 0.18s ease;
}
.btn-primary-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* Filters inside Products tab */
.product-filters-row {
  flex: 1 1 420px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 210px;
}
.filter-field label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}
.filter-select {
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #f8fafc;
  font-size: 13.5px;
  font-weight: 600;
}

.filter-search-field {
  flex: 1;
  min-width: 220px;
}
.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.28);
  gap: 8px;
}
.search-input-box i {
  color: #94a3b8;
}
.search-input-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-size: 13.5px;
}
.clear-search-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 16px;
}

/* Rows */
.cat-fixed-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px dashed rgba(148, 163, 184, 0.28);
}

.pos-pill.is-locked {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(100, 116, 139, 0.25);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
}

.sortable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sort-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.18);
  transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
}

.sort-row:hover {
  border-color: rgba(96, 165, 250, 0.45);
}

.sort-row.is-sale-row {
  border-color: rgba(248, 113, 113, 0.45);
  background: rgba(127, 29, 29, 0.18);
}

.sort-row.is-product-top {
  border-color: rgba(251, 191, 36, 0.5);
  background: rgba(120, 53, 15, 0.18);
}

.sort-row.is-product-hidden {
  opacity: 0.65;
}

.sort-row.is-dragging {
  opacity: 0.45;
}

/* Parent -> Subcategory Tree Styling */
.btn-create-parent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.65);
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: filter 0.16s ease;
}
.btn-create-parent:hover:not(:disabled) {
  filter: brightness(1.08);
}
.btn-create-parent:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.new-parent-bar {
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(52, 211, 153, 0.45);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.npb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.npb-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 800;
  color: #6ee7b7;
}
.npb-close {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
}
.npb-inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}
.npb-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.npb-field label {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
}
.npb-input {
  height: 36px;
  padding: 0 10px;
  border-radius: 9px;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #f8fafc;
  font-size: 13px;
  outline: none;
}
.npb-input:focus {
  border-color: #10b981;
}
.npb-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cat-tree-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sort-row.is-parent-group-row {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(52, 211, 153, 0.35);
}

.cat-expand-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(52, 211, 153, 0.4);
  background: rgba(16, 185, 129, 0.16);
  color: #6ee7b7;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.parent-folder-icon {
  color: #34d399;
  margin-right: 4px;
}

.cat-parent-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(52, 211, 153, 0.35);
}

.cat-parent-assign {
  flex-shrink: 0;
}

.parent-assign-select {
  height: 34px;
  max-width: 220px;
  padding: 0 10px;
  border-radius: 9px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #e2e8f0;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.parent-quick-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.move-btn.is-dissolve:hover {
  border-color: rgba(248, 113, 113, 0.6);
  color: #f87171;
}

.subcat-nest-list {
  margin-left: 28px;
  padding-left: 14px;
  border-left: 2px dashed rgba(52, 211, 153, 0.38);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subcat-nest-empty {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px dashed rgba(148, 163, 184, 0.25);
  color: #94a3b8;
  font-size: 12.5px;
}

.subcat-nest-row {
  background: rgba(15, 23, 42, 0.62);
  border-color: rgba(148, 163, 184, 0.16);
}

.subcat-branch-ico {
  color: #34d399;
  font-weight: 900;
  margin-right: 4px;
}

.sort-row.is-drag-over {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.28);
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 32px;
  border-radius: 8px;
  color: #94a3b8;
  cursor: grab;
  font-size: 18px;
  flex-shrink: 0;
}
.drag-handle:hover:not(.disabled) {
  background: rgba(148, 163, 184, 0.14);
  color: #ffffff;
}
.drag-handle.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pos-input-wrap {
  display: inline-flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0 6px;
  height: 32px;
  flex-shrink: 0;
}
.pos-hash {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 700;
}
.pos-number-input {
  width: 44px;
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
}

.cat-row-info {
  flex: 1;
  min-width: 0;
}
.cat-name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.cat-row-name {
  font-size: 14.5px;
  font-weight: 800;
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.sale-fire-icon {
  color: #f87171;
}
.cat-sale-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(248, 113, 113, 0.45);
}
.cat-row-meta {
  margin-top: 2px;
  font-size: 12px;
  color: #94a3b8;
}
.cat-i18n-preview {
  color: #64748b;
}

/* Product row specific */
.prod-thumb-wrap {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.prod-thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.prod-thumb-empty {
  color: #64748b;
  font-size: 18px;
}

.prod-info {
  flex: 1;
  min-width: 0;
}
.prod-name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.prod-name {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
}
.badge-top-mini {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.25);
  border: 1px solid rgba(251, 191, 36, 0.6);
  color: #fde68a;
  font-size: 10.5px;
  font-weight: 800;
}
.badge-hidden-mini,
.badge-out-mini {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
}
.badge-hidden-mini {
  background: rgba(100, 116, 139, 0.3);
  color: #cbd5e1;
}
.badge-out-mini {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.prod-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 12px;
  color: #94a3b8;
}
.prod-code {
  font-family: monospace;
  color: #7dd3fc;
}
.prod-cat-pill {
  padding: 1px 7px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.16);
  color: #93c5fd;
  font-weight: 600;
}
.prod-price {
  color: #4ade80;
  font-weight: 700;
}

.prod-right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-mini-top,
.btn-mini-untop {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.btn-mini-top {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border: 1px solid rgba(96, 165, 250, 0.65);
  color: #ffffff;
}
.btn-mini-untop {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(251, 191, 36, 0.55);
  color: #fde68a;
}

.row-move-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.move-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
}
.move-btn:hover:not(:disabled) {
  border-color: #60a5fa;
  background: rgba(37, 99, 235, 0.25);
}
.move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.load-more-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  color: #94a3b8;
  font-size: 13px;
}
.load-more-btns {
  display: flex;
  gap: 8px;
}

.unsaved-floating-bar {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 10px 14px 10px 18px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(251, 191, 36, 0.65);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.55), 0 0 0 3px rgba(251, 191, 36, 0.14);
  max-width: calc(100vw - 24px);
}

.ufb-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #fde68a;
}

.ufb-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

.ufb-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.sort-loading-box,
.empty-box {
  padding: 40px 16px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(148, 163, 184, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinning {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .sort-page {
    padding: 14px 12px calc(88px + env(safe-area-inset-bottom));
  }
  .mode-toggle-grid {
    grid-template-columns: 1fr;
  }
  .sort-row {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px;
  }
  .prod-right-actions {
    width: 100%;
    justify-content: space-between;
    padding-top: 6px;
    border-top: 1px solid rgba(148, 163, 184, 0.12);
  }
  .sort-tabs {
    width: 100%;
  }
  .sort-tab-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 12px;
    font-size: 13px;
  }
  .unsaved-floating-bar {
    flex-direction: column;
    border-radius: 16px;
    bottom: 72px;
    width: calc(100vw - 24px);
    padding: 12px;
    gap: 10px;
  }
  .ufb-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
