<template>
  <div class="page-container" ref="rootEl">
    <!-- PHẦN 1: BỘ LỌC -->
    <!-- PHẦN 1: BỘ LỌC (GRID LAYOUT 3 ROWS) -->
    <div class="filter-bar">
      
      <!-- ROW 1: SEARCH -->
      <div class="fb-row search-row">
        <div class="search-box">
          <!-- Label removed here, moved to middle bar -->
          <div class="search-wrapper">
            <i class="app-ico ri-search-line"></i>
            <input type="text" v-model="searchText" placeholder="Tìm kiếm tên khách, SĐT, mã đơn..." />
            <button v-if="searchText" class="btn-clear-search" @click="searchText = ''">
              Xóa
            </button>
          </div>
        </div>
      </div>

      <!-- ROW 2: DATES -->
      <div class="fb-row date-row">
        <div class="filter-item date-item">
          <label>Từ ngày</label>
          <input type="date" v-model="filter.fromDate" :max="filter.toDate" />
        </div>
        <div class="filter-item date-item">
          <label>Đến ngày</label>
          <input type="date" v-model="filter.toDate" :min="filter.fromDate" />
        </div>
      </div>

      <!-- ROW 3: FILTERS & ACTIONS -->
      <div class="fb-row actions-row">
        <!-- 4. Payment -->
        <div class="filter-item payment-item">
          <label>Thanh toán</label>
          <select 
            v-model="filter.payment"
            :class="{ 
              'pay-cash': filter.payment === 'TIEN_MAT',
              'pay-transfer': filter.payment === 'CHUYEN_KHOAN'
            }"
          >
            <option value="">Tất cả</option>
            <option value="TIEN_MAT">Tiền mặt</option>
            <option value="CHUYEN_KHOAN">Chuyển khoản</option>
          </select>
        </div>

        <!-- 5. Sort Buttons -->
        <div class="filter-item sort-group-item">
          <label>Sắp xếp</label>
          <div class="status-btn-group">
            <button 
              class="status-btn" 
              :class="{ active: filter.sort === 'upcoming', 'sort-gold': filter.sort === 'upcoming' }"
              @click="filter.sort = 'upcoming'"
            >
              <i class="app-ico ri-arrow-up-circle-line"></i>
              ĐƠN CẦN GIAO GẤP
            </button>

            <button 
              class="status-btn" 
              :class="{ active: filter.sort === 'newest', 'sort-blue': filter.sort === 'newest' }"
              @click="filter.sort = 'newest'"
            >
              <i class="app-ico ri-arrow-down-circle-line"></i>
              ĐƠN KHÔNG GẤP
            </button>
          </div>
        </div>

        <!-- 6. Reset -->
        <div class="filter-item reset-item">
          <button class="btn-reset" @click="resetFilter">
            <i class="app-ico ri-refresh-line" aria-hidden="true"></i> 
            Reset
          </button>
        </div>
      </div>

    </div>

    <!-- SEARCH & COUNT STATUS BAR -->
    <div class="search-result-bar">
      <div class="result-count">
        Tìm thấy <span class="highlight-count">{{ filteredOrders.length }}</span> đơn hàng
      </div>
      <div class="result-text" v-if="searchText">
        cho từ khóa <span class="highlight-text">"{{ searchText }}"</span>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="main-content">
      <!-- PHẦN 2: GRID ĐƠN HÀNG -->
      <div class="orders-section">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Đang tải đơn hàng...</p>
        </div>

        <div v-else-if="paginatedOrders.length === 0" class="empty">
          <i class="app-ico ri-inbox-archive-line" aria-hidden="true"></i> Không có đơn hàng nào
        </div>

        <template v-else>
          <!-- BULK ACTION BAR -->
          <div v-if="selectedCount > 0" class="bulk-action-bar" @click.stop>
            <div class="bulk-info">
              <i class="app-ico ri-checkbox-multiple-line"></i>
              <span v-if="!bulkLoading">Đã chọn: <strong>{{ selectedCount }}</strong> đơn</span>
              <span v-else class="bulk-progress">
                <span class="bulk-spinner"></span>
                Đang xử lý {{ bulkProgress.done }}/{{ bulkProgress.total }}...
              </span>
            </div>
            <div class="bulk-actions">
              <button
                class="bulk-btn invoice"
                :disabled="bulkLoading"
                @click="bulkSendToInvoice"
              >
                <i class="app-ico ri-file-edit-line"></i>
                QUA NHẬP HĐ ({{ selectedCount }})
              </button>
              <button
                v-if="selectedWaitingCount > 0"
                class="bulk-btn approve"
                :disabled="bulkLoading"
                @click="bulkApprove"
              >
                <i class="app-ico ri-shield-check-line"></i>
                DUYỆT ĐƠN ({{ selectedWaitingCount }})
              </button>
              <button
                v-if="selectedShippableCount > 0"
                class="bulk-btn ship"
                :disabled="bulkLoading"
                @click="bulkShip"
              >
                <i class="app-ico ri-e-bike-2-line"></i>
                SHIP ĐƠN ({{ selectedShippableCount }})
              </button>
              <button 
                class="bulk-btn complete" 
                :disabled="bulkLoading" 
                @click="bulkComplete"
              >
                <i class="app-ico ri-check-double-line"></i>
                HOÀN THÀNH ĐƠN ({{ selectedCount }})
              </button>
              <button 
                class="bulk-btn cancel" 
                :disabled="bulkLoading" 
                @click="bulkCancel"
              >
                <i class="app-ico ri-close-circle-line"></i>
                HỦY ĐƠN ({{ selectedCount }})
              </button>
              
              <!-- SELECT ALL BUTTON - INTEGRATED -->
              <button 
                v-if="selectableOnPage.length > 0 && !isAllSelected"
                class="bulk-btn select-all" 
                :disabled="bulkLoading" 
                @click="toggleSelectAll"
              >
                <i class="app-ico ri-checkbox-multiple-line"></i>
                Chọn tất cả ({{ selectableOnPage.length }})
              </button>

              <button 
                class="bulk-btn clear" 
                :disabled="bulkLoading" 
                @click="clearSelected"
              >
                <i class="app-ico ri-eraser-line"></i>
                Bỏ chọn hết
              </button>
            </div>
          </div>

          <div class="orders-grid">
          <div
            v-for="(dh, index) in paginatedOrders"
            :key="`${filter.sort}-${index}-${dh.Ma_hoa_don}`"
            class="order-card"
            :class="[getStatusClass(getDonStatus(dh)), { selected: isSelected(dh) }]"
            @click="openDetail(dh)"
          >
            <!-- Loading Overlay -->
            <div class="card-loading-overlay" v-if="loadingId === dh.Ma_hoa_don">
              <div class="spinner-sm"></div>
              <span>
                {{
                  cardLoadingAction === 'approve'
                    ? 'Đang duyệt đơn...'
                    : cardLoadingAction === 'ship'
                      ? 'Đang chuyển Ship...'
                      : cardLoadingAction === 'complete'
                        ? 'Đang hoàn thành...'
                        : 'Đang xử lý...'
                }}
              </span>
            </div>

            <div class="card-header">
              <div class="card-header-left">
                <!-- TICK BUTTON - Multi Select -->
                <button
                  v-if="getDonStatus(dh) !== 'Hoàn thành'"
                  class="select-tick"
                  :class="{ on: isSelected(dh), disabled: !canSelect(dh) }"
                  :disabled="!canSelect(dh)"
                  @click.stop="toggleSelect(dh)"
                  title="Chọn đơn"
                >
                  <i class="app-ico" :class="isSelected(dh) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"></i>
                </button>
                <span class="status-pill" :class="getStatusClass(getDonStatus(dh))">
                  {{ getDonStatus(dh) }}
                </span>
                <span v-if="getOrderParticipantCount(dh) > 1" class="source-pill group-pill" title="Đơn ghép nhóm">
                  <i class="app-ico ri-team-line"></i> {{ getOrderParticipantCount(dh) }}
                </span>
                <span v-else-if="isWebOrder(dh)" class="source-pill web-pill" title="Đơn đặt từ Web">
                  <i class="app-ico ri-global-line"></i> WEB
                </span>
              </div>
              <span class="index-pill">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</span>
            </div>

            <div class="card-body">
              <div class="meta-copy-row customer-row">
                <div class="customer-title">{{ dh.Ten_khach_hang || 'Khách lẻ' }}</div>
                <button
                  class="copy-btn"
                  :class="{ copied: copiedKey === `card-${dh.Ma_hoa_don}-name` }"
                  :disabled="isBlank(dh.Ten_khach_hang)"
                  @click.stop="copyText(dh.Ten_khach_hang, `card-${dh.Ma_hoa_don}-name`)"
                >
                  <i class="app-ico ri-file-copy-line"></i>
                  <span class="copy-label">{{ copiedKey === `card-${dh.Ma_hoa_don}-name` ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>
              <div class="meta-copy-row">
                <div class="meta-line meta-text">{{ dh.So_dien_thoai || '—' }}</div>
                <button
                  class="copy-btn"
                  :class="{ copied: copiedKey === `card-${dh.Ma_hoa_don}-phone` }"
                  :disabled="isBlank(dh.So_dien_thoai)"
                  @click.stop="copyText(dh.So_dien_thoai, `card-${dh.Ma_hoa_don}-phone`)"
                >
                  <i class="app-ico ri-file-copy-line"></i>
                  <span class="copy-label">{{ copiedKey === `card-${dh.Ma_hoa_don}-phone` ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>
              <div class="meta-copy-row" :title="dh.Dia_chi">
                <div class="meta-line meta-text">{{ truncate(dh.Dia_chi, 40) || '—' }}</div>
                <button
                  class="copy-btn"
                  :class="{ copied: copiedKey === `card-${dh.Ma_hoa_don}-addr` }"
                  :disabled="isBlank(dh.Dia_chi)"
                  @click.stop="copyText(dh.Dia_chi, `card-${dh.Ma_hoa_don}-addr`)"
                >
                  <i class="app-ico ri-file-copy-line"></i>
                  <span class="copy-label">{{ copiedKey === `card-${dh.Ma_hoa_don}-addr` ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>

              <div class="pay-row">
                <div class="pay-badges-wrap">
                  <span class="payment-badge" :class="dh.Hinh_thuc_thanh_toan === 'CHUYEN_KHOAN' ? 'transfer' : 'cash'">
                    {{ mapPayment(dh.Hinh_thuc_thanh_toan) }}
                  </span>
                  <span class="dish-count-pill" v-if="getOrderDishCount(dh) > 0">
                    {{ getOrderDishCount(dh) }} món
                  </span>
                </div>
                <div class="amount">{{ format(dh.Tong_gia_ban) }}{{ dh.Don_vi_tien_te || '' }}</div>
              </div>

              <div class="time-box" :class="getTimeClass(dh, getDonStatus(dh))">
                <div class="time-main">Thời gian nhận: {{ dh.Thoi_gian_nhan_hang || 'Giao sớm' }}</div>
                <div class="time-sub" v-if="getDonStatus(dh) !== 'Hoàn thành'">{{ formatTimeRemaining(dh.Thoi_gian_nhan_hang) }}</div>
              </div>

              <div v-if="dh.Ghi_chu && dh.Ghi_chu.trim()" class="note-box" :title="dh.Ghi_chu">
                {{ dh.Ghi_chu }}
              </div>
            </div>

            <div class="card-footer" v-if="getDonStatus(dh) !== 'Hoàn thành'" @click.stop>
              <button class="btn-cancel" :disabled="loadingId === dh.Ma_hoa_don && !!cardLoadingAction" @click="onCardCancel(dh)">
                <span v-if="loadingId === dh.Ma_hoa_don && cardLoadingAction === 'cancel'" class="btn-spinner"></span>
                {{ loadingId === dh.Ma_hoa_don && cardLoadingAction === 'cancel' ? 'Đang hủy...' : 'Hủy' }}
              </button>
              <button
                class="btn-invoice"
                :disabled="loadingId === dh.Ma_hoa_don && !!cardLoadingAction"
                title="Mở đơn sang Nhập hóa đơn (giữ nguyên trạng thái)"
                @click="openOrderInInvoice(dh)"
              >
                <i class="app-ico ri-file-edit-line"></i>
                Nhập HĐ
              </button>
              <button
                v-if="getDonStatus(dh) === 'Chờ duyệt'"
                class="btn-approve"
                :disabled="loadingId === dh.Ma_hoa_don && !!cardLoadingAction"
                @click="onCardApprove(dh)"
              >
                <span v-if="loadingId === dh.Ma_hoa_don && cardLoadingAction === 'approve'" class="btn-spinner"></span>
                {{ loadingId === dh.Ma_hoa_don && cardLoadingAction === 'approve' ? 'Đang duyệt...' : 'Duyệt đơn' }}
              </button>
              <button
                v-else-if="String(dh.Trang_thai || '').trim() !== 'Đang ship'"
                class="btn-ship"
                :disabled="loadingId === dh.Ma_hoa_don && !!cardLoadingAction"
                @click="onCardShip(dh)"
              >
                <span v-if="loadingId === dh.Ma_hoa_don && cardLoadingAction === 'ship'" class="btn-spinner"></span>
                {{ loadingId === dh.Ma_hoa_don && cardLoadingAction === 'ship' ? 'Đang ship...' : 'Ship đơn' }}
              </button>
              <button
                v-else
                class="btn-done"
                :disabled="loadingId === dh.Ma_hoa_don && !!cardLoadingAction"
                @click="onCardComplete(dh)"
              >
                <span v-if="loadingId === dh.Ma_hoa_don && cardLoadingAction === 'complete'" class="btn-spinner"></span>
                {{ loadingId === dh.Ma_hoa_don && cardLoadingAction === 'complete' ? 'Đang hoàn thành...' : 'Hoàn thành' }}
              </button>
            </div>
          </div>
        </div>

        <!-- PHÂN TRANG -->
        <div v-if="totalPages > 1" class="pagination">
          <button @click="currentPage--" :disabled="currentPage === 1" class="btn-page"><i class="app-ico ri-arrow-left-line" aria-hidden="true"></i></button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="btn-page"><i class="app-ico ri-arrow-right-line" aria-hidden="true"></i></button>
        </div>
        </template>
      </div>

      <!-- PHẦN 3,4,5,6: CARD TRẠNG THÁI -->
      <div class="status-cards">
        <div
          class="status-card"
          :class="{ active: filter.status === '' }"
          @click="selectStatusTab('')"
        >
          <div class="stat-badge neutral">Tất cả</div>
          <div class="stat-number">{{ countAll }}</div>
        </div>

        <div
          class="status-card waiting"
          :class="{ active: filter.status === 'Chờ duyệt', 'has-waiting': countWaiting > 0 }"
          @click="selectStatusTab('Chờ duyệt')"
        >
          <div class="stat-badge waiting">Chờ duyệt</div>
          <div class="stat-number">{{ countWaiting }}</div>
        </div>

        <div
          class="status-card pending"
          :class="{ active: filter.status === 'Đang xử lý' }"
          @click="selectStatusTab('Đang xử lý')"
        >
          <div class="stat-badge pending">Đang xử lý</div>
          <div class="stat-number">{{ countPending }}</div>
        </div>

        <div
          class="status-card shipping"
          :class="{ active: filter.status === 'Đang ship' }"
          @click="selectStatusTab('Đang ship')"
        >
          <div class="stat-badge shipping">Đang ship</div>
          <div class="stat-number">{{ countShipping }}</div>
        </div>

        <div
          class="status-card overdue"
          :class="{ active: filter.status === 'Quá hạn' }"
          @click="selectStatusTab('Quá hạn')"
        >
          <div class="stat-badge overdue">Quá hạn</div>
          <div class="stat-number">{{ countOverdue }}</div>
        </div>

        <div
          class="status-card done"
          :class="{ active: filter.status === 'Hoàn thành' }"
          @click="selectStatusTab('Hoàn thành')"
        >
          <div class="stat-badge done">Hoàn thành</div>
          <div class="stat-number">{{ countDone }}</div>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT ĐƠN HÀNG (DUYỆT & CHỈNH SỬA REALTIME) -->
    <div v-if="showModal && activeOrder" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-content modal-content-wide">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-title">#{{ activeOrder?.Ma_hoa_don }}</div>
            <span v-if="activeOrder?.So_hoa_don" class="so-hd-pill">{{ activeOrder.So_hoa_don }}</span>
            <span v-if="syncStateText" class="sync-status-pill" :class="{ syncing: isSyncingOrder }">
              <i class="app-ico" :class="syncStateIcon"></i>
              {{ syncStateText }}
            </span>
          </div>
          <div class="modal-header-right">
            <span class="status-pill" :class="getStatusClass(getDonStatus(activeOrder))">
              {{ getDonStatus(activeOrder) }}
            </span>
            <button class="modal-close" @click="closeDetailModal"><i class="app-ico ri-close-line" aria-hidden="true"></i></button>
          </div>
        </div>

        <div class="modal-body">
          <!-- KHÁCH HÀNG & GIAO NHẬN -->
          <div class="m-section">
            <div class="m-title">Khách hàng & Giao nhận</div>
            <div class="m-row">
              <div class="m-label">Telegram người nhận</div>
              <div class="m-value m-value-copy">
                <input
                  v-if="canEditOrder"
                  type="text"
                  class="m-inline-input"
                  v-model="editMeta.Ten_khach_hang"
                  placeholder="Telegram / Tên người nhận..."
                  @input="scheduleSyncMeta"
                  @blur="flushSyncAll"
                />
                <span v-else>{{ activeOrder?.Ten_khach_hang }}</span>
                <button
                  class="copy-btn"
                  :class="{ copied: copiedKey === 'modal-name' }"
                  :disabled="isBlank(canEditOrder ? editMeta.Ten_khach_hang : activeOrder?.Ten_khach_hang)"
                  @click.stop="copyText(canEditOrder ? editMeta.Ten_khach_hang : activeOrder?.Ten_khach_hang, 'modal-name')"
                >
                  <i class="app-ico ri-file-copy-line"></i>
                  <span class="copy-label">{{ copiedKey === 'modal-name' ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>
            </div>

            <div class="m-row">
              <div class="m-label">Số điện thoại</div>
              <div class="m-value m-value-copy">
                <input
                  v-if="canEditOrder"
                  type="text"
                  class="m-inline-input"
                  v-model="editMeta.So_dien_thoai"
                  placeholder="Số điện thoại..."
                  @input="scheduleSyncMeta"
                  @blur="flushSyncAll"
                />
                <span v-else>{{ activeOrder?.So_dien_thoai }}</span>
                <button
                  class="copy-btn"
                  :class="{ copied: copiedKey === 'modal-phone' }"
                  :disabled="isBlank(canEditOrder ? editMeta.So_dien_thoai : activeOrder?.So_dien_thoai)"
                  @click.stop="copyText(canEditOrder ? editMeta.So_dien_thoai : activeOrder?.So_dien_thoai, 'modal-phone')"
                >
                  <i class="app-ico ri-file-copy-line"></i>
                  <span class="copy-label">{{ copiedKey === 'modal-phone' ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>
            </div>

            <div class="m-row">
              <div class="m-label">Địa chỉ giao</div>
              <div class="m-value m-value-copy">
                <input
                  v-if="canEditOrder"
                  type="text"
                  class="m-inline-input"
                  v-model="editMeta.Dia_chi"
                  placeholder="Địa chỉ nhận hàng..."
                  @input="scheduleSyncMeta"
                  @blur="flushSyncAll"
                />
                <span v-else>{{ activeOrder?.Dia_chi }}</span>
                <button
                  class="copy-btn"
                  :class="{ copied: copiedKey === 'modal-addr' }"
                  :disabled="isBlank(canEditOrder ? editMeta.Dia_chi : activeOrder?.Dia_chi)"
                  @click.stop="copyText(canEditOrder ? editMeta.Dia_chi : activeOrder?.Dia_chi, 'modal-addr')"
                >
                  <i class="app-ico ri-file-copy-line"></i>
                  <span class="copy-label">{{ copiedKey === 'modal-addr' ? 'Copied' : 'Copy' }}</span>
                </button>
              </div>
            </div>

            <div class="m-row">
              <div class="m-label">Thời gian nhận</div>
              <div class="m-value m-value-inline">
                <input
                  v-if="canEditOrder"
                  type="text"
                  class="m-inline-input m-time-input"
                  v-model="editMeta.Thoi_gian_nhan_hang"
                  placeholder="VD: 18:30:00 15/11/2026 hoặc Giao liền"
                  @input="scheduleSyncMeta"
                  @blur="flushSyncAll"
                />
                <span v-else>{{ activeOrder?.Thoi_gian_nhan_hang }}</span>
                <span class="m-counter" :class="modalTimeClass">
                  {{ formatTimeRemaining(canEditOrder ? editMeta.Thoi_gian_nhan_hang : activeOrder?.Thoi_gian_nhan_hang) }}
                </span>
              </div>
            </div>
          </div>

          <!-- DANH SÁCH MÓN ĂN THEO DANH MỤC TỪNG THÀNH VIÊN / GỘP MÓN + THÊM MÓN TỪ DB HOẶC NHẬP TAY -->
          <div class="m-section">
            <div class="m-section-head">
              <div class="m-title-left">
                <span class="m-title-text">Sản phẩm ({{ totalEditDishQty }} món)</span>
                <span class="vi-lang-pill" title="Luôn hiển thị Tiếng Việt cho Admin">
                  <i class="app-ico ri-translate-2"></i> Tiếng Việt
                </span>
              </div>
              <div class="view-mode-switch">
                <button
                  type="button"
                  class="vm-btn"
                  :class="{ active: detailViewMode === 'by_member' }"
                  @click="detailViewMode = 'by_member'"
                >
                  <i class="app-ico ri-team-line"></i> Theo từng người
                </button>
                <button
                  type="button"
                  class="vm-btn"
                  :class="{ active: detailViewMode === 'grouped' }"
                  @click="detailViewMode = 'grouped'"
                >
                  <i class="app-ico ri-stack-line"></i> Gộp theo món
                </button>
              </div>
            </div>

            <!-- PANEL THÊM MÓN CHO ADMIN (LẤY TỪ DB HOẶC NHẬP TAY) -->
            <div v-if="canEditOrder" class="admin-add-dish-bar" ref="addDishPanelRef">
              <div class="add-panel-top-row">
                <div class="add-mode-tabs">
                  <button
                    type="button"
                    class="add-mode-tab"
                    :class="{ active: addDishMode === 'db' }"
                    @click="addDishMode = 'db'; dishSearchOpen = true"
                  >
                    <i class="app-ico ri-database-2-line"></i> Chọn món từ DB
                  </button>
                  <button
                    type="button"
                    class="add-mode-tab"
                    :class="{ active: addDishMode === 'manual' }"
                    @click="addDishMode = 'manual'"
                  >
                    <i class="app-ico ri-edit-box-line"></i> Nhập tay / Phụ phí
                  </button>
                </div>

                <div class="add-target-wrap">
                  <span class="add-target-label">Thêm vào:</span>
                  <select v-model="addTargetKey" class="add-target-select">
                    <option
                      v-for="opt in adminTargetMemberOptions"
                      :key="opt.key"
                      :value="opt.key"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- TAB 1: LẤY MÓN THEO DB -->
              <template v-if="addDishMode === 'db'">
                <div class="dish-search-row">
                  <div class="dish-search-input-wrap">
                    <i class="app-ico ri-search-line"></i>
                    <input
                      ref="dishSearchInputRef"
                      type="text"
                      v-model="dishSearchQuery"
                      placeholder="Tìm tên món hoặc mã hàng trong DB..."
                      @focus="dishSearchOpen = true"
                    />
                    <button
                      v-if="dishSearchQuery"
                      type="button"
                      class="dish-clear-btn"
                      @click="dishSearchQuery = ''"
                    >
                      <i class="app-ico ri-close-line"></i>
                    </button>
                  </div>

                  <select
                    v-model="dishCategoryFilter"
                    class="db-cat-select"
                    @change="dishSearchOpen = true"
                  >
                    <option value="">Tất cả danh mục</option>
                    <option v-for="cat in dbCategories" :key="cat" :value="cat">
                      {{ cat }}
                    </option>
                  </select>

                  <button
                    type="button"
                    class="btn-custom-dish-toggle"
                    :class="{ active: dishSearchOpen }"
                    @click="dishSearchOpen = !dishSearchOpen"
                  >
                    <i class="app-ico" :class="dishSearchOpen ? 'ri-arrow-up-s-line' : 'ri-list-unordered'"></i>
                    {{ dishSearchOpen ? 'Ẩn DB' : `Menu DB (${hangHoaViList.length})` }}
                  </button>
                </div>

                <div
                  v-if="dishSearchOpen || dishSearchQuery.trim() || dishCategoryFilter"
                  class="dish-search-dropdown"
                >
                  <template v-if="filteredMenuDishes.length > 0">
                    <button
                      v-for="hh in filteredMenuDishes"
                      :key="hh.Ma_hang"
                      type="button"
                      class="dish-search-option"
                      @click="adminAddMenuDish(hh)"
                    >
                      <div class="dso-left">
                        <span class="dso-name">{{ hh._viName }}</span>
                        <span class="dso-meta">
                          {{ hh._viCat || hh.Ma_hang }}
                          <template v-if="hh._viDvt"> • {{ hh._viDvt }}</template>
                          <span
                            class="dso-stock"
                            :class="hh.Trang_thai === 'Hết hàng' ? 'out' : 'in'"
                          >
                            {{ hh.Trang_thai === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng' }}
                          </span>
                        </span>
                      </div>
                      <div class="dso-right">
                        <span class="dso-price">{{ formatMoney(hh._effectivePrice) }}</span>
                        <span class="dso-plus"><i class="app-ico ri-add-line"></i> Thêm</span>
                      </div>
                    </button>
                  </template>
                  <div v-else class="dish-search-empty">
                    Không tìm thấy món phù hợp trong DB — chuyển sang tab
                    <button type="button" class="inline-switch-btn" @click="prefillManualFromSearch">
                      Nhập tay / Phụ phí
                    </button>
                    để thêm trực tiếp.
                  </div>
                </div>
              </template>

              <!-- TAB 2: NHẬP TAY MÓN / PHỤ PHÍ -->
              <div v-else class="custom-dish-form">
                <input
                  ref="manualNameInputRef"
                  type="text"
                  v-model="customDish.Ten_hang"
                  placeholder="Tên món nhập tay hoặc Phí ship..."
                  class="cd-input cd-name"
                  @keyup.enter="adminAddCustomDish"
                />
                <input
                  type="text"
                  v-model="customDish.Dvt"
                  placeholder="ĐVT (Phần...)"
                  class="cd-input cd-dvt"
                />
                <input
                  type="number"
                  min="1"
                  v-model.number="customDish.So_luong"
                  placeholder="SL"
                  class="cd-input cd-qty"
                />
                <input
                  type="number"
                  min="0"
                  v-model.number="customDish.Gia_ban"
                  placeholder="Đơn giá"
                  class="cd-input cd-price"
                  @keyup.enter="adminAddCustomDish"
                />
                <input
                  type="text"
                  v-model="customDish.Ghi_chu"
                  placeholder="Ghi chú món (tuỳ chọn)"
                  class="cd-input cd-note"
                  @keyup.enter="adminAddCustomDish"
                />
                <button type="button" class="cd-add-btn" @click="adminAddCustomDish">
                  <i class="app-ico ri-add-line"></i> Thêm món
                </button>
              </div>
            </div>

            <!-- KHI CHƯA CÓ MÓN NÀO & CHƯA CÓ THÀNH VIÊN -->
            <div v-if="editItems.length === 0 && adminMemberGroups.length === 0" class="empty-items-box">
              Đơn hàng hiện chưa có món nào. Chọn món từ DB hoặc nhập tay ở khung phía trên.
            </div>

            <!-- CHẾ ĐỘ 1 (MẶC ĐỊNH): DANH MỤC THEO TỪNG THÀNH VIÊN -->
            <div v-else-if="detailViewMode === 'by_member'" class="member-categories-list">
              <div
                v-for="mGrp in adminMemberGroups"
                :key="mGrp.groupKey"
                class="admin-member-card"
                :class="{
                  'is-host': mGrp.role === 'host',
                  'is-admin': mGrp.role === 'admin'
                }"
              >
                <div class="admin-member-head">
                  <div class="amh-left">
                    <i
                      class="app-ico amh-ico"
                      :class="
                        mGrp.role === 'host'
                          ? adminHasGroupMembers
                            ? 'ri-vip-crown-line'
                            : 'ri-user-3-line'
                          : mGrp.role === 'admin'
                            ? 'ri-store-2-line'
                            : 'ri-user-3-line'
                      "
                    ></i>
                    <span class="amh-name">{{ mGrp.name }}</span>
                    <span
                      v-if="mGrp.role === 'admin' || adminHasGroupMembers"
                      class="amh-role-badge"
                      :class="mGrp.role"
                    >
                      {{
                        mGrp.role === 'host'
                          ? 'Trưởng nhóm'
                          : mGrp.role === 'admin'
                            ? 'Quán thêm'
                            : 'Thành viên'
                      }}
                    </span>
                    <span
                      v-if="mGrp.hasLiveState && mGrp.role === 'guest' && getDonStatus(activeOrder) === 'Chờ duyệt'"
                      class="amh-state-badge"
                      :class="{ done: mGrp.done }"
                    >
                      <i class="app-ico" :class="mGrp.done ? 'ri-check-line' : 'ri-time-line'"></i>
                      {{ mGrp.done ? 'Đã xong' : 'Đang chọn' }}
                    </span>
                  </div>

                  <div class="amh-right">
                    <span class="amh-summary">
                      {{ mGrp.totalQty }} món • {{ formatMoney(mGrp.subtotal) }}
                    </span>
                    <button
                      v-if="canEditOrder"
                      type="button"
                      class="amh-add-btn"
                      @click="focusAddForMember(mGrp)"
                    >
                      <i class="app-ico ri-add-line"></i> Thêm món
                    </button>
                  </div>
                </div>

                <div v-if="mGrp.entries.length === 0" class="admin-member-empty">
                  Chưa chọn món nào
                </div>

                <div v-else class="admin-member-items">
                  <div
                    v-for="entry in mGrp.entries"
                    :key="entry.item.lineId || entry.idx"
                    class="editor-item-card member-line-card"
                  >
                    <div class="eic-top">
                      <div class="eic-info">
                        <div class="eic-name-row">
                          <span class="eic-name">{{ getViDishName(entry.item) }}</span>
                          <span v-if="getViDishDvt(entry.item)" class="eic-dvt">
                            {{ getViDishDvt(entry.item) }}
                          </span>
                          <span
                            v-if="!entry.item.Ma_hang || String(entry.item.Ma_hang).startsWith('CUSTOM_')"
                            class="eic-manual-tag"
                          >
                            Nhập tay
                          </span>
                        </div>
                      </div>
                      <button
                        v-if="canEditOrder"
                        type="button"
                        class="eic-del-btn"
                        title="Xóa món này"
                        @click="removeLineItem(entry.idx)"
                      >
                        <i class="app-ico ri-delete-bin-line"></i>
                      </button>
                    </div>

                    <div class="eic-controls">
                      <div class="eic-qty-wrap">
                        <template v-if="canEditOrder">
                          <button type="button" class="qty-step-btn" @click="stepLineQty(entry.idx, -1)">−</button>
                          <input
                            type="number"
                            min="1"
                            class="qty-inline-input"
                            v-model.number="entry.item.So_luong"
                            @input="onLineQtyInput(entry.idx)"
                            @blur="flushSyncAll"
                          />
                          <button type="button" class="qty-step-btn" @click="stepLineQty(entry.idx, 1)">+</button>
                        </template>
                        <span v-else class="qty-readonly">SL: {{ entry.item.So_luong }}</span>
                      </div>

                      <div class="eic-price-wrap">
                        <span class="eic-sub-label">Đơn giá:</span>
                        <input
                          v-if="canEditOrder"
                          type="number"
                          min="0"
                          class="price-inline-input"
                          v-model.number="entry.item.Gia_ban"
                          @input="scheduleSyncItems"
                          @blur="flushSyncAll"
                        />
                        <span v-else class="price-readonly">{{ formatMoney(getItemUnitPrice(entry.item)) }}</span>
                      </div>

                      <div class="eic-total-wrap">
                        {{ formatMoney(calcItemNetTotal(entry.item)) }}
                      </div>
                    </div>

                    <div class="eic-note-row" v-if="canEditOrder || entry.item.Ghi_chu">
                      <input
                        v-if="canEditOrder"
                        type="text"
                        class="note-inline-input"
                        v-model="entry.item.Ghi_chu"
                        placeholder="Ghi chú món (VD: ít cay, không hành...)"
                        @input="scheduleSyncItems"
                        @blur="flushSyncAll"
                      />
                      <div v-else class="mm-note">
                        <i class="app-ico ri-file-text-line"></i> {{ entry.item.Ghi_chu }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- CHẾ ĐỘ 2: GỘP THEO MÓN (TỔNG HỢP SỐ LƯỢNG ĐỂ BẾP DỄ LÀM) -->
            <div v-else class="items-editor-list">
              <div
                v-for="grp in groupedDisplayItems"
                :key="grp.groupKey"
                class="editor-item-card grouped-card"
              >
                <div class="eic-top">
                  <div class="eic-info">
                    <div class="eic-name-row">
                      <span class="eic-name">{{ grp.Ten_hang }}</span>
                      <span v-if="grp.Dvt" class="eic-dvt">{{ grp.Dvt }}</span>
                    </div>
                    <div class="grouped-members-wrap">
                      <span
                        v-for="(ln, lIdx) in grp.lines"
                        :key="lIdx"
                        class="member-breakdown-chip"
                        :class="{ 'is-admin': ln.Added_by_role === 'admin' }"
                      >
                        <i
                          class="app-ico"
                          :class="ln.Added_by_role === 'admin' ? 'ri-store-2-line' : 'ri-user-3-line'"
                        ></i>
                        <span>{{ ln.Added_by_role === 'admin' ? 'Quán thêm' : (ln.Nguoi_dat || 'Khách') }}</span>
                        <strong>×{{ ln.So_luong }}</strong>
                        <em v-if="ln.Ghi_chu">({{ ln.Ghi_chu }})</em>
                      </span>
                    </div>
                  </div>
                  <button
                    v-if="canEditOrder"
                    type="button"
                    class="eic-del-btn"
                    title="Xóa món này"
                    @click="removeGroupedDish(grp)"
                  >
                    <i class="app-ico ri-delete-bin-line"></i>
                  </button>
                </div>

                <div class="eic-controls">
                  <div class="eic-qty-wrap">
                    <template v-if="canEditOrder">
                      <button type="button" class="qty-step-btn" @click="changeGroupedQty(grp, -1)">−</button>
                      <span class="qty-display">{{ grp.totalQty }}</span>
                      <button type="button" class="qty-step-btn" @click="changeGroupedQty(grp, 1)">+</button>
                    </template>
                    <span v-else class="qty-readonly">SL: {{ grp.totalQty }}</span>
                  </div>

                  <div class="eic-price-wrap">
                    <span class="eic-sub-label">Đơn giá:</span>
                    <input
                      v-if="canEditOrder"
                      type="number"
                      min="0"
                      class="price-inline-input"
                      :value="grp.Gia_ban"
                      @change="updateGroupedPrice(grp, $event.target.value)"
                    />
                    <span v-else class="price-readonly">{{ formatMoney(grp.Gia_ban) }}</span>
                  </div>

                  <div class="eic-total-wrap">
                    {{ formatMoney(grp.totalAmount) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- THANH TOÁN & GHI CHÚ ĐƠN -->
          <div class="m-section">
            <div class="m-title">Thanh toán & Ghi chú chung</div>
            <div class="m-row">
              <div class="m-label">Hình thức</div>
              <div class="m-value">
                <div v-if="canEditOrder" class="pay-toggle-group">
                  <button
                    type="button"
                    class="pay-toggle-btn cash"
                    :class="{ active: editMeta.Hinh_thuc_thanh_toan !== 'CHUYEN_KHOAN' }"
                    @click="setEditPayment('TIEN_MAT')"
                  >
                    <i class="app-ico ri-cash-line"></i> Tiền mặt
                  </button>
                  <button
                    type="button"
                    class="pay-toggle-btn transfer"
                    :class="{ active: editMeta.Hinh_thuc_thanh_toan === 'CHUYEN_KHOAN' }"
                    @click="setEditPayment('CHUYEN_KHOAN')"
                  >
                    <i class="app-ico ri-bank-card-line"></i> Chuyển khoản
                  </button>
                </div>
                <span
                  v-else
                  class="pay-badge"
                  :class="activeOrder?.Hinh_thuc_thanh_toan === 'CHUYEN_KHOAN' ? 'transfer' : 'cash'"
                >
                  {{ activeOrder?.Hinh_thuc_thanh_toan === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt' }}
                </span>
              </div>
            </div>
            <div class="m-row total">
              <div class="m-label">Tổng cộng</div>
              <div class="m-value total-amount">
                {{ formatMoney(canEditOrder ? computedEditTotal : (activeOrder?.Tong_gia_ban ?? activeOrder?.Tong_cong)) }}
              </div>
            </div>
            <div class="m-row" v-if="canEditOrder || activeOrder?.Ghi_chu">
              <div class="m-label">Ghi chú đơn</div>
              <div class="m-value">
                <input
                  v-if="canEditOrder"
                  type="text"
                  class="m-inline-input"
                  v-model="editMeta.Ghi_chu"
                  placeholder="Ghi chú chung cho đơn hàng..."
                  @input="scheduleSyncMeta"
                  @blur="flushSyncAll"
                />
                <div v-else class="note-box">{{ activeOrder?.Ghi_chu }}</div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="modal-footer"
          :class="{
            'three-cols':
              getDonStatus(activeOrder) !== 'Chờ duyệt' &&
              String(activeOrder?.Trang_thai || '').trim() !== 'Đang ship'
          }"
          v-if="getDonStatus(activeOrder) !== 'Hoàn thành'"
        >
          <button class="btn-cancel" :disabled="isModalLoading" @click="onModalCancel">
            <span v-if="isModalCancelLoading" class="btn-spinner"></span>
            {{ isModalCancelLoading ? 'Đang hủy...' : 'Hủy đơn' }}
          </button>
          <button
            class="btn-invoice-lg"
            :disabled="isModalLoading"
            title="Chuyển đơn sang tab Nhập hóa đơn (giữ nguyên trạng thái)"
            @click="openOrderInInvoice(activeOrder)"
          >
            <i class="app-ico ri-file-edit-line"></i>
            Mở nhập HĐ
          </button>
          <button
            v-if="getDonStatus(activeOrder) === 'Chờ duyệt'"
            class="btn-approve-lg"
            :disabled="isModalLoading || editItems.length === 0"
            @click="onModalApprove"
          >
            <span v-if="isModalApproveLoading" class="btn-spinner"></span>
            <i v-else class="app-ico ri-check-double-line"></i>
            {{ isModalApproveLoading ? 'Đang duyệt đơn...' : 'Duyệt đơn (Chuẩn bị)' }}
          </button>
          <template v-else-if="String(activeOrder?.Trang_thai || '').trim() !== 'Đang ship'">
            <button
              class="btn-ship-lg"
              :disabled="isModalLoading || editItems.length === 0"
              @click="onModalShip"
            >
              <span v-if="isModalShipLoading" class="btn-spinner"></span>
              <i v-else class="app-ico ri-e-bike-2-line"></i>
              {{ isModalShipLoading ? 'Đang chuyển Ship...' : 'Ship đơn đi' }}
            </button>
            <button
              class="btn-complete"
              :disabled="isModalLoading"
              @click="onModalComplete"
            >
              <span v-if="isModalCompleteLoading" class="btn-spinner"></span>
              {{ isModalCompleteLoading ? 'Đang hoàn thành...' : 'Hoàn thành' }}
            </button>
          </template>
          <button
            v-else
            class="btn-complete"
            :disabled="isModalLoading"
            @click="onModalComplete"
          >
            <span v-if="isModalCompleteLoading" class="btn-spinner"></span>
            {{ isModalCompleteLoading ? 'Đang hoàn thành...' : 'Hoàn thành đơn' }}
          </button>
        </div>
      </div>
    </div>

    <!-- CUSTOM CONFIRM MODAL -->
    <div v-if="confirmModal.show" class="confirm-overlay" @click.self="closeConfirm">
      <div class="confirm-box">
        <div class="confirm-icon" :class="confirmModal.type.includes('cancel') ? 'danger' : 'success'">
          <i class="app-ico ri-question-mark"></i>
        </div>
        <div class="confirm-title">{{ confirmModal.title }}</div>
        <div class="confirm-desc">{{ confirmModal.message }}</div>
        <div class="confirm-actions">
          <button class="c-btn c-cancel" @click="closeConfirm">Hủy bỏ</button>
          <button 
            class="c-btn c-yes" 
            :class="confirmModal.type.includes('cancel') ? 'danger' : 'success'"
            @click="handleConfirm"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>

    <!-- RESULT MODAL (SUCCESS/ERROR) -->
    <div v-if="resultModal.show" class="confirm-overlay" @click.self="closeResult">
      <div class="confirm-box">
        <div class="confirm-icon" :class="resultModal.type">
          <i class="app-ico" :class="resultModal.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'"></i>
        </div>
        <div class="confirm-title">{{ resultModal.title }}</div>
        <div class="confirm-desc">{{ resultModal.message }}</div>
        <div class="confirm-actions">
          <button class="c-btn c-yes" :class="resultModal.type" @click="closeResult">
            Đóng
          </button>
        </div>
      </div>
    </div>
    <!-- SCROLL TO TOP -->
    <button 
      class="btn-scroll-top" 
      :class="{ show: showScrollTop }" 
      @click="scrollToTop"
    >
      <i class="app-ico ri-arrow-up-line"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  getSheets,
  subscribeSheet,
  dispatchAction,
  subscribeAllLiveOrders,
  adminSyncOrderItems,
  duyetDonHang,
  shipDonHang,
  makeLineId,
} from '@/config/api'
import { normalizeProductI18n, productMatchesKeyword } from '@/utils/i18nData'

const router = useRouter()

let unsubDonHang = null
let unsubChiTiet = null
let unsubHangHoa = null
let unsubLiveOrders = null

const loading = ref(true)
const donHangList = ref([])
const chiTietList = ref([])
const hangHoaList = ref([])
const liveOrdersMap = ref({})

const loadingId = ref(null)
const currentPage = ref(1)
const itemsPerPage = 16
const showModal = ref(false)
const selectedOrder = ref(null)
const selectedOrderId = ref('')
const modalLoadingAction = ref('')
const cardLoadingAction = ref('')
const copiedKey = ref('')
const userChangedStatus = ref(false)

// Detail modal view & live editor state
const detailViewMode = ref('by_member') // 'by_member' | 'grouped'
const addDishMode = ref('db') // 'db' | 'manual'
const addTargetKey = ref('__admin__')
const dishCategoryFilter = ref('')
const addDishPanelRef = ref(null)
const dishSearchInputRef = ref(null)
const manualNameInputRef = ref(null)
const editItems = ref([])
const editMeta = ref({
  Ten_khach_hang: '',
  So_dien_thoai: '',
  Dia_chi: '',
  Thoi_gian_nhan_hang: '',
  Hinh_thuc_thanh_toan: 'TIEN_MAT',
  Ghi_chu: '',
})
const dishSearchQuery = ref('')
const dishSearchOpen = ref(false)
const customDish = ref({
  Ten_hang: '',
  Dvt: 'Phần',
  So_luong: 1,
  Gia_ban: 0,
  Ghi_chu: '',
})

const isSyncingOrder = ref(false)
const hasLocalPendingEdits = ref(false)
const lastSyncedAt = ref(0)
let syncTimer = null
let editRevision = 0

const updatePendingCount = inject('updatePendingCount', () => {})

// CONFIRM MODAL STATE
const confirmModal = ref({
  show: false,
  type: '', // 'approve', 'complete', 'cancel', 'bulk-approve', 'bulk-complete', 'bulk-cancel'
  title: '',
  message: '',
  data: null,
})

// RESULT MODAL STATE
const resultModal = ref({
  show: false,
  type: 'success', // 'success' | 'error'
  title: '',
  message: '',
})

const searchText = ref('')
const showScrollTop = ref(false)
const rootEl = ref(null)
const scrollContainer = ref(null)

watch(searchText, () => {
  currentPage.value = 1
})

watch(currentPage, () => {
  const el = document.querySelector('.page-container')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
})

const nowTick = ref(Date.now())
let tickTimer = null
let copyTimer = null

function todayYMD() {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const filter = ref({
  fromDate: todayYMD(),
  toDate: todayYMD(),
  payment: '',
  status: 'Đang xử lý',
  sort: 'upcoming',
})

function selectStatusTab(st) {
  userChangedStatus.value = true
  filter.value.status = st
}

// Canonical Vietnamese Hang Hoa Map so Admin ALWAYS sees Vietnamese names & units
const hangHoaViList = computed(() => {
  return (hangHoaList.value || []).map((hh) => {
    const i18n = normalizeProductI18n(hh)
    const giaGiam =
      hh.Gia_Giam !== '' && hh.Gia_Giam !== null && hh.Gia_Giam !== undefined && Number(hh.Gia_Giam) > 0
        ? Number(hh.Gia_Giam)
        : 0
    const effectivePrice = giaGiam > 0 ? giaGiam : Number(hh.Gia_ban || 0)
    return {
      ...hh,
      _viName: i18n.vi.Ten_hang || hh.Ten_hang || hh.Ma_hang || '',
      _viCat: i18n.vi.Danh_muc || hh.Danh_muc || '',
      _viDvt: i18n.vi.Dvt || hh.Dvt || '',
      _effectivePrice: effectivePrice,
    }
  })
})

const hangHoaViMap = computed(() => {
  const map = new Map()
  for (const hh of hangHoaViList.value) {
    const code = String(hh.Ma_hang || '').trim()
    if (code) map.set(code, hh)
  }
  return map
})

const dbCategories = computed(() => {
  const set = new Set()
  for (const hh of hangHoaViList.value) {
    if (hh._viCat) set.add(hh._viCat)
  }
  return Array.from(set)
})

const filteredMenuDishes = computed(() => {
  const q = dishSearchQuery.value.trim()
  const cat = dishCategoryFilter.value.trim()
  const qNoTone = q ? removeVietnameseTones(q) : ''

  return hangHoaViList.value
    .filter((hh) => {
      if (cat && hh._viCat !== cat) return false
      if (!q) return true
      if (productMatchesKeyword(hh, q)) return true
      if (removeVietnameseTones(hh._viName).includes(qNoTone)) return true
      if (removeVietnameseTones(hh._viCat).includes(qNoTone)) return true
      if (String(hh.Ma_hang || '').toLowerCase().includes(q.toLowerCase())) return true
      return false
    })
    .slice(0, 30)
})

const activeOrder = computed(() => {
  if (!selectedOrderId.value) return selectedOrder.value
  return (
    donHangList.value.find((d) => String(d.Ma_hoa_don) === String(selectedOrderId.value)) ||
    selectedOrder.value
  )
})

const canEditOrder = computed(() => {
  if (!activeOrder.value) return false
  return getDonStatus(activeOrder.value) !== 'Hoàn thành'
})

const hasLiveSession = computed(() => {
  const oid = selectedOrderId.value
  return Boolean(oid && liveOrdersMap.value[oid]?.exists)
})

const syncStateIcon = computed(() => {
  if (isSyncingOrder.value) return 'ri-loader-4-line'
  if (hasLocalPendingEdits.value) return 'ri-edit-line'
  if (lastSyncedAt.value > 0) return 'ri-check-double-line'
  if (hasLiveSession.value) return 'ri-radar-line'
  return ''
})

const syncStateText = computed(() => {
  if (isSyncingOrder.value) return 'Đang đồng bộ giỏ khách...'
  if (hasLocalPendingEdits.value) return 'Chờ lưu...'
  if (lastSyncedAt.value > 0) return 'Đã đồng bộ giỏ khách'
  if (hasLiveSession.value) return 'Live Realtime'
  return ''
})

// Reset page when filter changes
watch(() => filter.value.sort, () => { currentPage.value = 1 })
watch(() => filter.value.status, () => { currentPage.value = 1 })
watch(() => filter.value.payment, () => { currentPage.value = 1 })
watch(() => filter.value.fromDate, () => { currentPage.value = 1 })
watch(() => filter.value.toDate, () => { currentPage.value = 1 })

onMounted(async () => {
  tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)

  window.addEventListener('scroll', handleScroll, true)

  if (!filter.value.fromDate) filter.value.fromDate = todayYMD()
  if (!filter.value.toDate) filter.value.toDate = todayYMD()

  try {
    const json = await getSheets(['don_hang', 'hoa_don_chi_tiet', 'hang_hoa'])
    donHangList.value = json.data.don_hang || []
    chiTietList.value = json.data.hoa_don_chi_tiet || []
    hangHoaList.value = json.data.hang_hoa || []
  } catch (e) {
    console.error('Lỗi tải dữ liệu:', e)
  } finally {
    loading.value = false
  }

  unsubDonHang = subscribeSheet('don_hang', (rows) => {
    donHangList.value = rows || []
    loading.value = false
  })
  unsubChiTiet = subscribeSheet('hoa_don_chi_tiet', (rows) => {
    chiTietList.value = rows || []
  })
  unsubHangHoa = subscribeSheet('hang_hoa', (rows) => {
    hangHoaList.value = rows || []
  })
  unsubLiveOrders = subscribeAllLiveOrders((map) => {
    liveOrdersMap.value = map || {}
  })
})

onUnmounted(() => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
  if (unsubDonHang) {
    unsubDonHang()
    unsubDonHang = null
  }
  if (unsubChiTiet) {
    unsubChiTiet()
    unsubChiTiet = null
  }
  if (unsubHangHoa) {
    unsubHangHoa()
    unsubHangHoa = null
  }
  if (unsubLiveOrders) {
    unsubLiveOrders()
    unsubLiveOrders = null
  }
  window.removeEventListener('scroll', handleScroll, true)
})

// ===== HELPERS =====
function handleScroll(e) {
  if (e.target instanceof Element) {
    if (rootEl.value && (e.target.contains(rootEl.value) || e.target === rootEl.value)) {
      scrollContainer.value = e.target
      showScrollTop.value = e.target.scrollTop > 300
    }
  } else if (e.target === document) {
    scrollContainer.value = window
    showScrollTop.value = window.scrollY > 300
  }
}

function scrollToTop() {
  if (scrollContainer.value === window || !scrollContainer.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function getViDishName(item) {
  const code = String(item?.Ma_hang || '').trim()
  const hh = code ? hangHoaViMap.value.get(code) : null
  return hh?._viName || item?.Ten_hang || code || 'Món ăn'
}

function getViDishDvt(item) {
  const code = String(item?.Ma_hang || '').trim()
  const hh = code ? hangHoaViMap.value.get(code) : null
  return hh?._viDvt || item?.Dvt || item?.dvt || ''
}

function getRawItemsForOrder(maHoaDon) {
  if (!maHoaDon) return []
  const key = String(maHoaDon).trim()
  const live = liveOrdersMap.value[key]
  const dh = donHangList.value.find((d) => String(d.Ma_hoa_don).trim() === key)
  const st = dh ? getDonStatus(dh) : ''

  if (live?.exists && (live.itemsList.length > 0 || st === 'Chờ duyệt')) {
    return live.itemsList
  }
  return chiTietList.value.filter((i) => String(i.Ma_hoa_don).trim() === key)
}

function getOrderDishCount(dh) {
  const items = getRawItemsForOrder(dh?.Ma_hoa_don)
  return items.reduce((sum, it) => sum + n(it.So_luong), 0)
}

function getOrderParticipantCount(dh) {
  const key = String(dh?.Ma_hoa_don || '').trim()
  const live = key ? liveOrdersMap.value[key] : null
  const items = getRawItemsForOrder(key)
  const keys = new Set()

  if (live?.membersList?.length) {
    for (const m of live.membersList) {
      if (m.id) keys.add(`id:${m.id}`)
    }
  }
  for (const it of items) {
    if (it.Added_by_role === 'admin') continue
    const mId = String(it.Nguoi_dat_id || '').trim()
    const who = String(it.Nguoi_dat || '').trim()
    if (mId) keys.add(`id:${mId}`)
    else if (who) keys.add(`name:${who.toLowerCase()}`)
  }
  return keys.size
}

function isWebOrder(dh) {
  if (!dh) return false
  if (dh.Nguon_don === 'WEB') return true
  if (String(dh.Ma_hoa_don || '').startsWith('WEB')) return true
  return Boolean(liveOrdersMap.value[dh.Ma_hoa_don]?.exists)
}

function getOrderCurrency() {
  return activeOrder.value?.Don_vi_tien_te || 'P'
}

function n(v) {
  return Number(v || 0)
}

function getItemUnitPrice(item) {
  return Number(item?.Gia_ban ?? item?.giaBan ?? 0)
}

function calcItemNetTotal(item) {
  const qty = n(item?.So_luong ?? item?.soLuong ?? 0)
  const unitPrice = n(item?.Gia_ban ?? item?.giaBan ?? 0)
  const gross = qty > 0 || unitPrice > 0 ? unitPrice * qty : n(item?.Thanh_tien)
  const ck = n(item?.Tien_chiet_khau ?? item?.tienChietKhau)
  const giam = n(item?.Giam_gia ?? item?.giamGia) * qty
  return Math.max(0, gross - ck - giam)
}

function formatMoney(v) {
  const cur = getOrderCurrency()
  return format(v) + (cur ? ' ' + cur : '')
}

function format(num) {
  return Number(num || 0).toLocaleString('vi-VN')
}

function mapPayment(v) {
  return v === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt'
}

function isBlank(text) {
  return !String(text || '').trim()
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

// ===== MODAL OPEN / CLOSE & HYDRATION =====
function cloneItemForEditor(raw, idx = 0) {
  const code = String(raw?.Ma_hang || '').trim()
  const hh = code ? hangHoaViMap.value.get(code) : null
  const qty = Math.max(1, n(raw?.So_luong ?? 1))
  const unitPrice = Number(raw?.Gia_ban ?? hh?._effectivePrice ?? 0)
  return {
    lineId:
      String(raw?.lineId || '').trim() ||
      makeLineId(code || raw?.Ten_hang || `item_${idx}`, raw?.Nguoi_dat_id || `line_${idx}`),
    Ma_hang: code,
    Ten_hang: hh?._viName || raw?.Ten_hang || 'Món ăn',
    Danh_muc: hh?._viCat || raw?.Danh_muc || '',
    Dvt: hh?._viDvt || raw?.Dvt || raw?.dvt || '',
    Size: raw?.Size || hh?.Size || '',
    Main_img: raw?.Main_img || hh?.Main_img || '',
    Don_vi_tien_te: raw?.Don_vi_tien_te || hh?.Don_vi_tien_te || getOrderCurrency(),
    Gia_goc: Number(raw?.Gia_goc ?? hh?.Gia_goc ?? 0),
    Gia_ban: unitPrice,
    So_luong: qty,
    Thanh_tien: unitPrice * qty,
    Ghi_chu: String(raw?.Ghi_chu || ''),
    Nguoi_dat: String(raw?.Nguoi_dat || ''),
    Nguoi_dat_id: String(raw?.Nguoi_dat_id || ''),
    Added_by_role: String(raw?.Added_by_role || 'host'),
    Added_at: n(raw?.Added_at) || Date.now() + idx,
  }
}

function hydrateModalEditor(dh) {
  if (!dh) return
  const oid = String(dh.Ma_hoa_don || '').trim()
  const liveMeta = liveOrdersMap.value[oid]?.meta || {}
  editMeta.value = {
    Ten_khach_hang: String(dh.Ten_khach_hang ?? liveMeta.Ten_khach_hang ?? ''),
    So_dien_thoai: String(dh.So_dien_thoai ?? liveMeta.So_dien_thoai ?? ''),
    Dia_chi: String(dh.Dia_chi ?? liveMeta.Dia_chi ?? ''),
    Thoi_gian_nhan_hang: String(dh.Thoi_gian_nhan_hang ?? liveMeta.Thoi_gian_nhan_hang ?? ''),
    Hinh_thuc_thanh_toan: String(
      dh.Hinh_thuc_thanh_toan || liveMeta.Hinh_thuc_thanh_toan || 'TIEN_MAT',
    ),
    Ghi_chu: String(dh.Ghi_chu ?? liveMeta.Ghi_chu ?? ''),
  }
  const rawItems = getRawItemsForOrder(oid)
  editItems.value = rawItems.map((it, idx) => cloneItemForEditor(it, idx))
}

function openDetail(dh) {
  selectedOrder.value = dh
  selectedOrderId.value = String(dh?.Ma_hoa_don || '')
  hasLocalPendingEdits.value = false
  lastSyncedAt.value = 0
  detailViewMode.value = 'by_member'
  addDishMode.value = 'db'
  addTargetKey.value = '__admin__'
  dishSearchQuery.value = ''
  dishCategoryFilter.value = ''
  dishSearchOpen.value = false
  hydrateModalEditor(dh)
  showModal.value = true
}

async function closeDetailModal() {
  if (hasLocalPendingEdits.value) {
    await flushSyncAll()
  }
  showModal.value = false
}

// Keep modal synced in realtime when Customer or Friend modifies cart while Admin has modal open
watch(
  () => [
    selectedOrderId.value ? liveOrdersMap.value[selectedOrderId.value] : null,
    chiTietList.value,
    activeOrder.value,
  ],
  () => {
    if (!showModal.value || !activeOrder.value) return
    if (hasLocalPendingEdits.value || isSyncingOrder.value) return
    hydrateModalEditor(activeOrder.value)
  },
  { deep: true },
)

// ===== MEMBER CATEGORIES & GROUPED COMPUTED =====
const totalEditDishQty = computed(() =>
  editItems.value.reduce((acc, it) => acc + Math.max(0, n(it.So_luong)), 0),
)

const computedEditTotal = computed(() =>
  editItems.value.reduce((acc, it) => acc + calcItemNetTotal(it), 0),
)

const adminMemberGroups = computed(() => {
  const oid = selectedOrderId.value
  const live = oid ? liveOrdersMap.value[oid] : null
  const hostId = String(live?.meta?.Host_id || '').trim()
  const hasGuestInOrder =
    (live?.membersList || []).some((m) => m.role !== 'host') ||
    editItems.value.some((it) => {
      if (it.Added_by_role === 'admin') return false
      if (it.Added_by_role === 'guest') return true
      const mId = String(it.Nguoi_dat_id || '').trim()
      return Boolean(hostId && mId && mId !== hostId)
    })
  const fallbackHostName =
    editMeta.value.Ten_khach_hang ||
    live?.meta?.Ten_khach_hang ||
    (hasGuestInOrder ? 'Trưởng nhóm' : 'Khách lẻ')
  const groupsMap = new Map()

  if (live?.membersList?.length) {
    for (const m of live.membersList) {
      const gKey = `m:${m.id}`
      const defaultName = m.role === 'host' ? fallbackHostName : 'Thành viên'
      groupsMap.set(gKey, {
        groupKey: gKey,
        memberId: m.id,
        name: m.name || defaultName,
        role: m.role === 'host' ? 'host' : 'guest',
        done: m.role === 'host' ? true : Boolean(m.done),
        hasLiveState: true,
        totalQty: 0,
        subtotal: 0,
        entries: [],
      })
    }
  }

  editItems.value.forEach((item, idx) => {
    if (item.Added_by_role === 'admin') {
      const adminKey = '__admin__'
      if (!groupsMap.has(adminKey)) {
        groupsMap.set(adminKey, {
          groupKey: adminKey,
          memberId: 'admin',
          name: 'Quán thêm / Phụ phí',
          role: 'admin',
          done: true,
          hasLiveState: false,
          totalQty: 0,
          subtotal: 0,
          entries: [],
        })
      }
      const grp = groupsMap.get(adminKey)
      grp.entries.push({ item, idx })
      grp.totalQty += Math.max(0, n(item.So_luong))
      grp.subtotal += calcItemNetTotal(item)
      return
    }

    const mId = String(item.Nguoi_dat_id || '').trim()
    const rawName = String(item.Nguoi_dat || '').trim()
    const gKey = mId
      ? `m:${mId}`
      : `name:${(rawName || editMeta.value.Ten_khach_hang || 'khach').toLowerCase()}`

    if (!groupsMap.has(gKey)) {
      const isHostLine =
        item.Added_by_role === 'host' ||
        (hostId && mId === hostId) ||
        (!hostId && groupsMap.size === 0)
      groupsMap.set(gKey, {
        groupKey: gKey,
        memberId: mId,
        name: rawName || (isHostLine ? fallbackHostName : 'Thành viên'),
        role: isHostLine ? 'host' : 'guest',
        done: true,
        hasLiveState: Boolean(live?.exists),
        totalQty: 0,
        subtotal: 0,
        entries: [],
      })
    }

    const grp = groupsMap.get(gKey)
    if ((!grp.name || grp.name === 'Thành viên') && rawName) {
      grp.name = rawName
    }
    grp.entries.push({ item, idx })
    grp.totalQty += Math.max(0, n(item.So_luong))
    grp.subtotal += calcItemNetTotal(item)
  })

  const rank = { host: 0, guest: 1, admin: 2 }
  return Array.from(groupsMap.values()).sort(
    (a, b) => (rank[a.role] ?? 1) - (rank[b.role] ?? 1),
  )
})

const adminHasGroupMembers = computed(() =>
  adminMemberGroups.value.some((g) => g.role === 'guest'),
)

const adminTargetMemberOptions = computed(() => {
  const opts = [{ key: '__admin__', label: 'Quán thêm / Phụ phí' }]
  for (const grp of adminMemberGroups.value) {
    if (grp.role === 'admin') continue
    const roleText = grp.role === 'host' ? 'Trưởng nhóm' : 'Thành viên'
    opts.push({
      key: grp.groupKey,
      label: adminHasGroupMembers.value ? `${grp.name} (${roleText})` : grp.name,
    })
  }
  return opts
})

function resolveAddTargetAssignment() {
  if (addTargetKey.value === '__admin__') {
    return {
      Nguoi_dat: 'Quán thêm',
      Nguoi_dat_id: 'admin',
      Added_by_role: 'admin',
    }
  }
  const found = adminMemberGroups.value.find((g) => g.groupKey === addTargetKey.value)
  if (!found || found.role === 'admin') {
    return {
      Nguoi_dat: 'Quán thêm',
      Nguoi_dat_id: 'admin',
      Added_by_role: 'admin',
    }
  }
  return {
    Nguoi_dat: found.name,
    Nguoi_dat_id: found.memberId || found.name,
    Added_by_role: found.role === 'host' ? 'host' : 'guest',
  }
}

function focusAddForMember(mGrp) {
  addTargetKey.value = mGrp.role === 'admin' ? '__admin__' : mGrp.groupKey
  dishSearchOpen.value = true
  nextTick(() => {
    addDishPanelRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
    if (addDishMode.value === 'db') {
      dishSearchInputRef.value?.focus?.()
    } else {
      manualNameInputRef.value?.focus?.()
    }
  })
}

function prefillManualFromSearch() {
  if (dishSearchQuery.value.trim()) {
    customDish.value.Ten_hang = dishSearchQuery.value.trim()
  }
  addDishMode.value = 'manual'
  nextTick(() => {
    manualNameInputRef.value?.focus?.()
  })
}

const groupedDisplayItems = computed(() => {
  const groups = new Map()
  editItems.value.forEach((it, idx) => {
    const viName = getViDishName(it)
    const viDvt = getViDishDvt(it)
    const unitPrice = getItemUnitPrice(it)
    const key = `${it.Ma_hang || viName}__${unitPrice}`
    if (!groups.has(key)) {
      groups.set(key, {
        groupKey: key,
        Ma_hang: it.Ma_hang,
        Ten_hang: viName,
        Dvt: viDvt,
        Gia_ban: unitPrice,
        totalQty: 0,
        totalAmount: 0,
        lines: [],
      })
    }
    const g = groups.get(key)
    const qty = Math.max(0, n(it.So_luong))
    g.totalQty += qty
    g.totalAmount += unitPrice * qty
    g.lines.push({
      lineIndex: idx,
      Nguoi_dat: it.Nguoi_dat,
      So_luong: qty,
      Ghi_chu: it.Ghi_chu,
      Added_by_role: it.Added_by_role,
    })
  })
  return Array.from(groups.values())
})

function scheduleSyncItems() {
  if (!canEditOrder.value) return
  editRevision++
  hasLocalPendingEdits.value = true
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    flushSyncAll()
  }, 420)
}

function scheduleSyncMeta() {
  scheduleSyncItems()
}

async function flushSyncAll() {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
  if (!hasLocalPendingEdits.value || !activeOrder.value || !canEditOrder.value) return

  const maHoaDon = activeOrder.value.Ma_hoa_don
  const snapRev = editRevision
  isSyncingOrder.value = true
  try {
    const payloadItems = editItems.value
      .filter((it) => n(it.So_luong) > 0)
      .map((it) => ({
        ...it,
        Ten_hang: getViDishName(it),
        Dvt: getViDishDvt(it),
        So_luong: Math.max(1, n(it.So_luong)),
        Gia_ban: Math.max(0, n(it.Gia_ban)),
        Thanh_tien: Math.max(0, n(it.Gia_ban)) * Math.max(1, n(it.So_luong)),
      }))
    await adminSyncOrderItems({
      Ma_hoa_don: maHoaDon,
      items: payloadItems,
      meta: { ...editMeta.value },
    })
    if (editRevision === snapRev) {
      hasLocalPendingEdits.value = false
      lastSyncedAt.value = Date.now()
    }
  } catch (err) {
    console.error('Lỗi đồng bộ đơn hàng:', err)
  } finally {
    isSyncingOrder.value = false
  }
}

function adminAddMenuDish(hh) {
  if (!canEditOrder.value || !hh) return
  const target = resolveAddTargetAssignment()
  const existingIdx = editItems.value.findIndex(
    (it) =>
      it.Ma_hang === hh.Ma_hang &&
      it.Added_by_role === target.Added_by_role &&
      String(it.Nguoi_dat_id || '') === String(target.Nguoi_dat_id || '') &&
      String(it.Nguoi_dat || '') === String(target.Nguoi_dat || '') &&
      !String(it.Ghi_chu || '').trim() &&
      n(it.Gia_ban) === n(hh._effectivePrice),
  )
  if (existingIdx >= 0) {
    editItems.value[existingIdx].So_luong = n(editItems.value[existingIdx].So_luong) + 1
  } else {
    const ownerTag =
      target.Added_by_role === 'admin'
        ? `admin_${Date.now().toString(36)}`
        : target.Nguoi_dat_id || `m_${Date.now().toString(36)}`
    editItems.value.push({
      lineId: makeLineId(hh.Ma_hang, ownerTag),
      Ma_hang: hh.Ma_hang,
      Ten_hang: hh._viName,
      Danh_muc: hh._viCat,
      Dvt: hh._viDvt,
      Size: hh.Size || '',
      Main_img: hh.Main_img || '',
      Don_vi_tien_te: hh.Don_vi_tien_te || getOrderCurrency(),
      Gia_goc: n(hh.Gia_goc),
      Gia_ban: n(hh._effectivePrice),
      So_luong: 1,
      Thanh_tien: n(hh._effectivePrice),
      Ghi_chu: '',
      Nguoi_dat: target.Nguoi_dat,
      Nguoi_dat_id: target.Nguoi_dat_id,
      Added_by_role: target.Added_by_role,
      Added_at: Date.now(),
    })
  }
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

function adminAddCustomDish() {
  if (!canEditOrder.value) return
  const name = String(customDish.value.Ten_hang || '').trim()
  if (!name) {
    openResult('Thiếu thông tin', 'Vui lòng nhập tên món hoặc phụ phí!', 'error')
    return
  }
  const target = resolveAddTargetAssignment()
  const qty = Math.max(1, n(customDish.value.So_luong) || 1)
  const price = Math.max(0, n(customDish.value.Gia_ban))
  const dvt = String(customDish.value.Dvt || '').trim() || 'Phần'
  const customCode = `CUSTOM_${Date.now().toString(36).toUpperCase()}`
  editItems.value.push({
    lineId: makeLineId(customCode, target.Nguoi_dat_id || 'admin'),
    Ma_hang: customCode,
    Ten_hang: name,
    Danh_muc: 'Món thêm / Phụ phí',
    Dvt: dvt,
    Size: '',
    Main_img: '',
    Don_vi_tien_te: getOrderCurrency(),
    Gia_goc: 0,
    Gia_ban: price,
    So_luong: qty,
    Thanh_tien: price * qty,
    Ghi_chu: String(customDish.value.Ghi_chu || '').trim(),
    Nguoi_dat: target.Nguoi_dat,
    Nguoi_dat_id: target.Nguoi_dat_id,
    Added_by_role: target.Added_by_role,
    Added_at: Date.now(),
  })
  customDish.value = { Ten_hang: '', Dvt: 'Phần', So_luong: 1, Gia_ban: 0, Ghi_chu: '' }
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

function stepLineQty(idx, delta) {
  const item = editItems.value[idx]
  if (!item) return
  const next = n(item.So_luong) + delta
  if (next <= 0) {
    editItems.value.splice(idx, 1)
  } else {
    item.So_luong = next
  }
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

function onLineQtyInput(idx) {
  const item = editItems.value[idx]
  if (!item) return
  if (n(item.So_luong) < 1) item.So_luong = 1
  scheduleSyncItems()
}

function removeLineItem(idx) {
  editItems.value.splice(idx, 1)
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

function changeGroupedQty(grp, delta) {
  if (!grp?.lines?.length) return
  if (delta > 0) {
    const targetIdx = grp.lines[grp.lines.length - 1].lineIndex
    if (editItems.value[targetIdx]) {
      editItems.value[targetIdx].So_luong = n(editItems.value[targetIdx].So_luong) + 1
    }
  } else {
    const lastLine = grp.lines[grp.lines.length - 1]
    const targetIdx = lastLine.lineIndex
    const cur = n(editItems.value[targetIdx]?.So_luong)
    if (cur <= 1) {
      editItems.value.splice(targetIdx, 1)
    } else if (editItems.value[targetIdx]) {
      editItems.value[targetIdx].So_luong = cur - 1
    }
  }
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

function updateGroupedPrice(grp, rawVal) {
  const newPrice = Math.max(0, Number(rawVal || 0))
  for (const ln of grp.lines) {
    if (editItems.value[ln.lineIndex]) {
      editItems.value[ln.lineIndex].Gia_ban = newPrice
    }
  }
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

function removeGroupedDish(grp) {
  const indicesDesc = grp.lines.map((l) => l.lineIndex).sort((a, b) => b - a)
  for (const idx of indicesDesc) {
    editItems.value.splice(idx, 1)
  }
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

function setEditPayment(method) {
  editMeta.value.Hinh_thuc_thanh_toan = method
  editRevision++
  hasLocalPendingEdits.value = true
  flushSyncAll()
}

// ===== DATE / TIME & STATUS HELPERS =====
function formatClock(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const pad = (num) => String(num).padStart(2, '0')
  const core = `${pad(hours)}:${pad(mins)}:${pad(secs)}`
  return days > 0 ? `${days}d ${core}` : core
}

function parseVNDateTime(str) {
  if (!str) return null
  const raw = String(str).trim()
  const parts = raw.split(/\s+/)
  if (parts.length >= 2 && parts[0].includes(':') && parts[1].includes('/')) {
    const [hh, mm, ss = 0] = parts[0].split(':').map(Number)
    const [dd, MM, yyyy] = parts[1].split('/').map(Number)
    if (!yyyy || !MM || !dd || Number.isNaN(hh) || Number.isNaN(mm)) return null
    const d = new Date(yyyy, MM - 1, dd, hh, mm, Number.isNaN(ss) ? 0 : ss)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (parts.length === 1 && parts[0].includes('/')) {
    const [dd, MM, yyyy] = parts[0].split('/').map(Number)
    if (!yyyy || !MM || !dd) return null
    const d = new Date(yyyy, MM - 1, dd, 23, 59, 59)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function formatTimeRemaining(dateStr) {
  const target = parseVNDateTime(dateStr)
  if (!target) {
    return String(dateStr || '').trim() ? 'Theo hẹn khách' : 'Giao sớm'
  }

  const now = new Date(nowTick.value)
  const diff = target - now

  if (diff < 0) {
    const absDiff = Math.abs(diff)
    return `Quá hạn ${formatClock(absDiff)}`
  }

  return `Còn lại ${formatClock(diff)}`
}

function copyText(text, key) {
  const value = String(text || '').trim()
  if (!value) return

  const setCopied = () => {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = ''
    }, 1200)
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(value)
      .then(setCopied)
      .catch(() => {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.top = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        try {
          const ok = document.execCommand('copy')
          if (ok) setCopied()
        } finally {
          document.body.removeChild(ta)
        }
      })
    return
  }

  const ta = document.createElement('textarea')
  ta.value = value
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.top = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    const ok = document.execCommand('copy')
    if (ok) setCopied()
  } finally {
    document.body.removeChild(ta)
  }
}

function parseYMDLocal(ymd, endOfDay = false) {
  if (!ymd) return null
  const [yyyy, mm, dd] = ymd.split('-').map(Number)
  if (!yyyy || !mm || !dd) return null
  const d = new Date(yyyy, mm - 1, dd)
  if (endOfDay) d.setHours(23, 59, 59, 999)
  else d.setHours(0, 0, 0, 0)
  return d
}

function matchesDateFilter(dh) {
  const hasFrom = !!filter.value.fromDate
  const hasTo = !!filter.value.toDate
  if (!hasFrom && !hasTo) return true

  const ngayMoc =
    parseVNDateTime(dh.Thoi_gian_nhan_hang) || parseVNDateTime(dh.Ngay_tao_duong_lich)
  if (!ngayMoc) return true

  if (hasFrom) {
    const from = parseYMDLocal(filter.value.fromDate, false)
    if (!from) return false
    if (ngayMoc < from) return false
  }

  if (hasTo) {
    const to = parseYMDLocal(filter.value.toDate, true)
    if (!to) return false
    if (ngayMoc > to) return false
  }

  return true
}

function getDonStatus(dh) {
  if (!dh) return ''
  const st = String(dh.Trang_thai || '').trim()
  if (st === 'Hoàn thành') return 'Hoàn thành'
  if (st === 'Chờ duyệt') return 'Chờ duyệt'
  if (st === 'Đang ship') return 'Đang ship'

  const thoiGianGiao = parseVNDateTime(dh.Thoi_gian_nhan_hang)
  if (!thoiGianGiao) return st || 'Đang xử lý'

  // Quá hạn sau 23:59:59 của ngày giao hàng
  const endOfDay = new Date(thoiGianGiao)
  endOfDay.setHours(23, 59, 59, 999)

  const now = new Date()
  if (now > endOfDay) return 'Quá hạn'

  return st || 'Đang xử lý'
}

function getTimeClass(dh, status) {
  if (status === 'Hoàn thành') return 'done'
  if (status === 'Chờ duyệt') return 'waiting'
  if (status === 'Đang ship') return 'shipping'
  if (status === 'Quá hạn') return 'overdue'

  const target = parseVNDateTime(dh?.Thoi_gian_nhan_hang)
  if (!target) return 'normal'

  const now = new Date()
  const diff = target - now
  const mins = Math.floor(diff / 60000)

  if (mins > 60) return 'normal'
  if (mins > 30) return 'warning'
  if (mins >= 0) return 'urgent'
  return 'overdue'
}

function getStatusClass(status) {
  if (status === 'Hoàn thành') return 'done'
  if (status === 'Chờ duyệt') return 'waiting'
  if (status === 'Đang ship') return 'shipping'
  if (status === 'Quá hạn') return 'overdue'
  if (status === 'Đang xử lý') return 'pending'
  return ''
}

// ===== COMPUTED =====
function removeVietnameseTones(str) {
  str = String(str || '')
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

const listAfterSearch = computed(() => {
  const q = searchText.value.trim()
  if (!q) return donHangList.value

  const sNoTone = removeVietnameseTones(q)
  const sRaw = q.toLowerCase()

  return donHangList.value.filter((dh) => {
    const name = String(dh.Ten_khach_hang || '')
    if (name.toLowerCase().includes(sRaw) || removeVietnameseTones(name).includes(sNoTone)) return true

    const phone = String(dh.So_dien_thoai || '')
    if (phone.toLowerCase().includes(sRaw)) return true

    const addr = String(dh.Dia_chi || '')
    if (addr.toLowerCase().includes(sRaw) || removeVietnameseTones(addr).includes(sNoTone)) return true

    const id = String(dh.Ma_hoa_don || '')
    if (id.toLowerCase().includes(sRaw)) return true

    return false
  })
})

const baseByPayment = computed(() => {
  const list = listAfterSearch.value
  if (!filter.value.payment) return list
  return list.filter((dh) => dh.Hinh_thuc_thanh_toan === filter.value.payment)
})

const baseByDateAndPayment = computed(() => {
  return baseByPayment.value.filter((dh) => matchesDateFilter(dh))
})

const statsBase = computed(() => baseByDateAndPayment.value)

const ignoreDateForList = computed(
  () =>
    filter.value.status === 'Quá hạn' ||
    filter.value.status === 'Chờ duyệt' ||
    filter.value.status === 'Đang ship',
)
const listBase = computed(() =>
  ignoreDateForList.value ? baseByPayment.value : baseByDateAndPayment.value,
)

const filteredOrders = computed(() => {
  if (!filter.value.status) return listBase.value
  return listBase.value.filter((dh) => getDonStatus(dh) === filter.value.status)
})

const sortedOrders = computed(() => {
  const dir = filter.value.sort === 'newest' ? -1 : 1
  const list = filteredOrders.value.map((dh, idx) => {
    const t =
      parseVNDateTime(dh.Thoi_gian_nhan_hang) || parseVNDateTime(dh.Ngay_tao_duong_lich)
    return {
      dh,
      idx,
      time: t ? t.getTime() : 0,
    }
  })

  list.sort((a, b) => {
    if (a.time !== b.time) return (a.time - b.time) * dir
    const maA = a.dh?.Ma_hoa_don != null ? String(a.dh.Ma_hoa_don) : ''
    const maB = b.dh?.Ma_hoa_don != null ? String(b.dh.Ma_hoa_don) : ''
    if (maA !== maB) return maA.localeCompare(maB)
    return a.idx - b.idx
  })

  return list.map((item) => item.dh)
})

const totalPages = computed(() => Math.ceil(sortedOrders.value.length / itemsPerPage) || 1)

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return sortedOrders.value.slice(start, start + itemsPerPage)
})

// Đếm số lượng theo trạng thái
const countAll = computed(() => statsBase.value.length)
const countWaiting = computed(
  () => baseByPayment.value.filter((dh) => getDonStatus(dh) === 'Chờ duyệt').length,
)
const countPending = computed(
  () => statsBase.value.filter((dh) => getDonStatus(dh) === 'Đang xử lý').length,
)
const countShipping = computed(
  () => baseByPayment.value.filter((dh) => getDonStatus(dh) === 'Đang ship').length,
)
const countOverdue = computed(
  () => baseByPayment.value.filter((dh) => getDonStatus(dh) === 'Quá hạn').length,
)
const countDone = computed(
  () => statsBase.value.filter((dh) => getDonStatus(dh) === 'Hoàn thành').length,
)

// Tự động focus tab "Chờ duyệt" lần đầu nếu có đơn khách mới gửi về
watch(
  countWaiting,
  (val) => {
    if (!userChangedStatus.value && val > 0 && filter.value.status === 'Đang xử lý') {
      filter.value.status = 'Chờ duyệt'
    }
  },
  { immediate: true },
)

const isModalLoading = computed(
  () => loadingId.value === activeOrder.value?.Ma_hoa_don && !!modalLoadingAction.value,
)
const isModalCancelLoading = computed(
  () => isModalLoading.value && modalLoadingAction.value === 'cancel',
)
const isModalApproveLoading = computed(
  () => isModalLoading.value && modalLoadingAction.value === 'approve',
)
const isModalShipLoading = computed(
  () => isModalLoading.value && modalLoadingAction.value === 'ship',
)
const isModalCompleteLoading = computed(
  () => isModalLoading.value && modalLoadingAction.value === 'complete',
)
const modalTimeClass = computed(() => {
  const dh = activeOrder.value
  if (!dh) return ''
  nowTick.value
  return getTimeClass(dh, getDonStatus(dh))
})

// ===== ACTIONS =====
function resetFilter() {
  userChangedStatus.value = false
  filter.value = {
    fromDate: todayYMD(),
    toDate: todayYMD(),
    payment: '',
    status: countWaiting.value > 0 ? 'Chờ duyệt' : 'Đang xử lý',
    sort: 'upcoming',
  }
  currentPage.value = 1
}

function openConfirm(type, data, title, message) {
  confirmModal.value = { show: true, type, data, title, message }
}

function closeConfirm() {
  confirmModal.value.show = false
}

function openResult(title, message, type = 'success') {
  resultModal.value = { show: true, title, message, type }
}

function closeResult() {
  resultModal.value.show = false
}

async function handleConfirm() {
  const { type, data } = confirmModal.value
  closeConfirm()

  if (type === 'approve') {
    await duyetDonHangAction(data, { skipConfirm: true })
  } else if (type === 'ship') {
    await shipDonHangAction(data, { skipConfirm: true })
  } else if (type === 'complete') {
    await hoanThanhDonHang(data, { skipConfirm: true })
  } else if (type === 'cancel') {
    await huyDonHang(data, { skipConfirm: true })
  } else if (type === 'bulk-approve') {
    await runBulkApprove(data)
  } else if (type === 'bulk-ship') {
    await runBulkShip(data)
  } else if (type === 'bulk-complete') {
    await runBulkComplete(data)
  } else if (type === 'bulk-cancel') {
    await runBulkCancel(data)
  }
}

async function openOrderInInvoice(dh) {
  if (!dh?.Ma_hoa_don) return
  if (showModal.value && String(selectedOrderId.value) === String(dh.Ma_hoa_don)) {
    if (hasLocalPendingEdits.value) {
      await flushSyncAll()
    }
    showModal.value = false
  }
  await router.push({
    name: 'nhap-hoa-don',
    query: { orderId: dh.Ma_hoa_don },
  })
}

async function duyetDonHangAction(dh, opts = {}) {
  if (!dh) return false
  if (!opts.skipConfirm) {
    openConfirm(
      'approve',
      dh,
      'Duyệt đơn hàng?',
      `Xác nhận duyệt đơn #${dh.Ma_hoa_don} chuyển sang Đang xử lý và khóa chỉnh sửa món phía khách?`,
    )
    return false
  }

  loadingId.value = dh.Ma_hoa_don
  try {
    // Nếu đang mở modal của đơn này, gửi kèm danh sách món & thông tin mới nhất
    const isEditingThis =
      showModal.value && String(selectedOrderId.value) === String(dh.Ma_hoa_don)
    if (isEditingThis && syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    const payload = {
      Ma_hoa_don: dh.Ma_hoa_don,
    }
    if (isEditingThis) {
      payload.items = editItems.value
        .filter((it) => n(it.So_luong) > 0)
        .map((it) => ({
          ...it,
          Ten_hang: getViDishName(it),
          Dvt: getViDishDvt(it),
          So_luong: Math.max(1, n(it.So_luong)),
          Gia_ban: Math.max(0, n(it.Gia_ban)),
          Thanh_tien: Math.max(0, n(it.Gia_ban)) * Math.max(1, n(it.So_luong)),
        }))
      payload.meta = { ...editMeta.value }
    }

    const res = await duyetDonHang(payload)
    if (res.success) {
      dh.Trang_thai = 'Đang xử lý'
      if (isEditingThis) {
        hasLocalPendingEdits.value = false
      }
      if (!opts.silent) {
        openResult('Đã duyệt đơn', `Đơn hàng #${dh.Ma_hoa_don} đã chuyển sang trạng thái Đang xử lý.`, 'success')
      }
      return true
    } else {
      openResult('Lỗi duyệt đơn', res.message || 'Không thể duyệt đơn hàng', 'error')
      return false
    }
  } catch (e) {
    console.error(e)
    openResult('Lỗi kết nối', 'Lỗi kết nối Firebase khi duyệt đơn', 'error')
    return false
  } finally {
    loadingId.value = null
  }
}

async function shipDonHangAction(dh, opts = {}) {
  if (!dh) return false
  if (!opts.skipConfirm) {
    openConfirm(
      'ship',
      dh,
      'Chuyển trạng thái Ship đơn?',
      `Xác nhận chuyển đơn #${dh.Ma_hoa_don} sang trạng thái Đang ship? Khách sẽ thấy "Đơn hàng đang được ship" trên màn hình đặt món.`,
    )
    return false
  }

  loadingId.value = dh.Ma_hoa_don
  try {
    const isEditingThis =
      showModal.value && String(selectedOrderId.value) === String(dh.Ma_hoa_don)
    if (isEditingThis && syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    const payload = {
      Ma_hoa_don: dh.Ma_hoa_don,
    }
    if (isEditingThis) {
      payload.items = editItems.value
        .filter((it) => n(it.So_luong) > 0)
        .map((it) => ({
          ...it,
          Ten_hang: getViDishName(it),
          Dvt: getViDishDvt(it),
          So_luong: Math.max(1, n(it.So_luong)),
          Gia_ban: Math.max(0, n(it.Gia_ban)),
          Thanh_tien: Math.max(0, n(it.Gia_ban)) * Math.max(1, n(it.So_luong)),
        }))
      payload.meta = { ...editMeta.value }
    }

    const res = await shipDonHang(payload)
    if (res.success) {
      dh.Trang_thai = 'Đang ship'
      if (isEditingThis) {
        hasLocalPendingEdits.value = false
      }
      if (!opts.silent) {
        openResult(
          'Đang ship đơn',
          `Đơn #${dh.Ma_hoa_don} đã chuyển sang trạng thái Đang ship!`,
          'success',
        )
      }
      return true
    } else {
      openResult('Lỗi chuyển Ship', res.message || 'Không thể chuyển đơn sang Đang ship', 'error')
      return false
    }
  } catch (e) {
    console.error(e)
    openResult('Lỗi kết nối', 'Lỗi kết nối Firebase khi chuyển trạng thái Ship', 'error')
    return false
  } finally {
    loadingId.value = null
  }
}

async function hoanThanhDonHang(dh, opts = {}) {
  if (!opts.skipConfirm) {
    openConfirm(
      'complete',
      dh,
      'Xác nhận hoàn thành?',
      `Bạn có chắc chắn muốn hoàn thành đơn hàng #${dh.Ma_hoa_don}? (Giỏ live của khách sẽ được đóng sạch)`,
    )
    return false
  }

  const oldStatus = getDonStatus(dh)
  loadingId.value = dh.Ma_hoa_don

  try {
    if (
      showModal.value &&
      String(selectedOrderId.value) === String(dh.Ma_hoa_don) &&
      hasLocalPendingEdits.value
    ) {
      await flushSyncAll()
    }

    // Nếu đơn đang ở trạng thái Chờ duyệt mà hoàn thành ngay (ví dụ chọn hàng loạt), tự động duyệt ghi sổ trước
    if (oldStatus === 'Chờ duyệt') {
      const approved = await duyetDonHang({ Ma_hoa_don: dh.Ma_hoa_don })
      if (!approved.success) {
        openResult('Lỗi duyệt đơn', approved.message || 'Không thể duyệt đơn trước khi hoàn thành', 'error')
        return false
      }
    }

    const res = await dispatchAction({
      action: 'hoanThanhTrangThaiDon',
      Ma_hoa_don: dh.Ma_hoa_don,
    })

    if (res.success) {
      dh.Trang_thai = 'Hoàn thành'

      if (
        oldStatus === 'Đang xử lý' ||
        oldStatus === 'Chờ duyệt' ||
        oldStatus === 'Đang ship'
      ) {
        updatePendingCount(-1)
      }

      if (!opts.silent) {
        openResult('Thành công', `Đã hoàn thành đơn hàng #${dh.Ma_hoa_don}`, 'success')
      }
      return true
    } else {
      openResult('Lỗi hoàn thành', res.message || 'Không thể hoàn thành đơn hàng', 'error')
      return false
    }
  } catch (e) {
    console.error(e)
    openResult('Lỗi kết nối', 'Lỗi kết nối Firebase', 'error')
    return false
  } finally {
    loadingId.value = null
  }
}

async function huyDonHang(dh, opts = {}) {
  if (!opts.skipConfirm) {
    openConfirm(
      'cancel',
      dh,
      'Xác nhận HỦY đơn?',
      `Đơn hàng #${dh.Ma_hoa_don} sẽ bị hủy và đóng link giỏ hàng của khách. Hành động này không thể hoàn tác!`,
    )
    return false
  }

  const oldStatus = getDonStatus(dh)
  loadingId.value = dh.Ma_hoa_don

  try {
    if (syncTimer && String(selectedOrderId.value) === String(dh.Ma_hoa_don)) {
      clearTimeout(syncTimer)
      syncTimer = null
      hasLocalPendingEdits.value = false
    }

    const res = await dispatchAction({
      action: 'huyDonHang',
      Ma_hoa_don: dh.Ma_hoa_don,
    })

    if (res.success) {
      const idx = donHangList.value.findIndex((d) => d.Ma_hoa_don === dh.Ma_hoa_don)
      if (idx > -1) donHangList.value.splice(idx, 1)

      if (
        oldStatus === 'Đang xử lý' ||
        oldStatus === 'Chờ duyệt' ||
        oldStatus === 'Đang ship'
      ) {
        updatePendingCount(-1)
      }

      if (!opts.silent) {
        openResult('Đã hủy đơn', `Đơn hàng #${dh.Ma_hoa_don} đã được hủy thành công.`, 'success')
      }
      return true
    } else {
      openResult('Lỗi hủy đơn', res.message || 'Không thể hủy đơn hàng', 'error')
      return false
    }
  } catch (e) {
    console.error(e)
    openResult('Lỗi kết nối', 'Lỗi kết nối Firebase', 'error')
    return false
  } finally {
    loadingId.value = null
  }
}

async function onModalCancel() {
  if (!activeOrder.value) return
  modalLoadingAction.value = 'cancel'
  try {
    const ok = await huyDonHang(activeOrder.value, { skipConfirm: true })
    if (ok) showModal.value = false
  } finally {
    modalLoadingAction.value = ''
  }
}

async function onModalApprove() {
  if (!activeOrder.value) return
  modalLoadingAction.value = 'approve'
  try {
    const ok = await duyetDonHangAction(activeOrder.value, { skipConfirm: true })
    if (ok) showModal.value = false
  } finally {
    modalLoadingAction.value = ''
  }
}

async function onModalShip() {
  if (!activeOrder.value) return
  modalLoadingAction.value = 'ship'
  try {
    const ok = await shipDonHangAction(activeOrder.value, { skipConfirm: true })
    if (ok) showModal.value = false
  } finally {
    modalLoadingAction.value = ''
  }
}

async function onModalComplete() {
  if (!activeOrder.value) return
  modalLoadingAction.value = 'complete'
  try {
    const ok = await hoanThanhDonHang(activeOrder.value, { skipConfirm: true })
    if (ok) showModal.value = false
  } finally {
    modalLoadingAction.value = ''
  }
}

async function onCardCancel(dh) {
  if (!dh) return
  cardLoadingAction.value = 'cancel'
  try {
    await huyDonHang(dh)
  } finally {
    cardLoadingAction.value = ''
  }
}

async function onCardApprove(dh) {
  if (!dh) return
  cardLoadingAction.value = 'approve'
  try {
    await duyetDonHangAction(dh, { skipConfirm: true })
  } finally {
    cardLoadingAction.value = ''
  }
}

async function onCardShip(dh) {
  if (!dh) return
  cardLoadingAction.value = 'ship'
  try {
    await shipDonHangAction(dh, { skipConfirm: true })
  } finally {
    cardLoadingAction.value = ''
  }
}

async function onCardComplete(dh) {
  if (!dh) return
  cardLoadingAction.value = 'complete'
  try {
    await hoanThanhDonHang(dh)
  } finally {
    cardLoadingAction.value = ''
  }
}

// ===== MULTI-SELECT STATE =====
const selectedIds = ref(new Set())
const bulkLoading = ref(false)
const bulkAction = ref('') // 'approve' | 'complete' | 'cancel'
const bulkProgress = ref({ done: 0, total: 0 })

const selectedCount = computed(() => selectedIds.value.size)

const selectedWaitingCount = computed(
  () => getSelectedOrders().filter((dh) => getDonStatus(dh) === 'Chờ duyệt').length,
)

const selectedShippableCount = computed(
  () =>
    getSelectedOrders().filter((dh) => {
      const st = getDonStatus(dh)
      return st !== 'Hoàn thành' && st !== 'Đang ship'
    }).length,
)

const selectableOnPage = computed(() => paginatedOrders.value.filter((dh) => canSelect(dh)))

const isAllSelected = computed(() => {
  if (selectableOnPage.value.length === 0) return false
  return selectableOnPage.value.every((dh) => selectedIds.value.has(dh.Ma_hoa_don))
})

function toggleSelectAll() {
  if (selectableOnPage.value.length === 0) return
  const newSet = new Set(selectedIds.value)
  if (isAllSelected.value) {
    selectableOnPage.value.forEach((dh) => newSet.delete(dh.Ma_hoa_don))
  } else {
    selectableOnPage.value.forEach((dh) => newSet.add(dh.Ma_hoa_don))
  }
  selectedIds.value = newSet
}

function isSelected(dh) {
  return selectedIds.value.has(dh.Ma_hoa_don)
}

function canSelect(dh) {
  if (getDonStatus(dh) === 'Hoàn thành') return false
  if (loadingId.value === dh.Ma_hoa_don) return false
  if (bulkLoading.value) return false
  return true
}

function toggleSelect(dh) {
  if (!canSelect(dh)) return
  const newSet = new Set(selectedIds.value)
  if (newSet.has(dh.Ma_hoa_don)) {
    newSet.delete(dh.Ma_hoa_don)
  } else {
    newSet.add(dh.Ma_hoa_don)
  }
  selectedIds.value = newSet
}

function clearSelected() {
  selectedIds.value = new Set()
}

function getSelectedOrders() {
  return donHangList.value.filter((dh) => selectedIds.value.has(dh.Ma_hoa_don))
}

async function bulkApprove() {
  const orders = getSelectedOrders().filter((dh) => getDonStatus(dh) === 'Chờ duyệt')
  if (orders.length === 0) {
    openResult('Thông báo', 'Không có đơn Chờ duyệt nào được chọn', 'error')
    return
  }
  openConfirm(
    'bulk-approve',
    orders,
    'Duyệt nhiều đơn hàng',
    `Xác nhận duyệt ${orders.length} đơn hàng sang Đang xử lý?`,
  )
}

async function bulkSendToInvoice() {
  const orders = getSelectedOrders()
  if (orders.length === 0) {
    openResult('Thông báo', 'Chưa chọn đơn hàng nào', 'error')
    return
  }
  const ids = orders.map((o) => o.Ma_hoa_don).filter(Boolean)
  clearSelected()
  if (ids.length > 0) {
    await router.push({
      name: 'nhap-hoa-don',
      query: { orderIds: ids.join(',') },
    })
  }
}

async function runBulkApprove(orders) {
  bulkLoading.value = true
  bulkAction.value = 'approve'
  bulkProgress.value = { done: 0, total: orders.length }

  try {
    for (const dh of orders) {
      loadingId.value = dh.Ma_hoa_don
      cardLoadingAction.value = 'approve'
      await duyetDonHangAction(dh, { skipConfirm: true, silent: true })
      bulkProgress.value.done++
      loadingId.value = null
      cardLoadingAction.value = ''
    }
  } finally {
    bulkLoading.value = false
    bulkAction.value = ''
    clearSelected()
    loadingId.value = null
    cardLoadingAction.value = ''
    openResult('Hoàn tất', `Đã duyệt ${bulkProgress.value.done}/${orders.length} đơn hàng sang Đang xử lý.`, 'success')
  }
}

async function bulkShip() {
  const orders = getSelectedOrders().filter((dh) => {
    const st = getDonStatus(dh)
    return st !== 'Hoàn thành' && st !== 'Đang ship'
  })
  if (orders.length === 0) {
    openResult('Thông báo', 'Không có đơn nào phù hợp để chuyển sang Đang ship', 'error')
    return
  }
  openConfirm(
    'bulk-ship',
    orders,
    'Ship nhiều đơn hàng',
    `Xác nhận chuyển ${orders.length} đơn hàng sang trạng thái Đang ship?`,
  )
}

async function runBulkShip(orders) {
  bulkLoading.value = true
  bulkAction.value = 'ship'
  bulkProgress.value = { done: 0, total: orders.length }

  try {
    for (const dh of orders) {
      loadingId.value = dh.Ma_hoa_don
      cardLoadingAction.value = 'ship'
      await shipDonHangAction(dh, { skipConfirm: true, silent: true })
      bulkProgress.value.done++
      loadingId.value = null
      cardLoadingAction.value = ''
    }
  } finally {
    bulkLoading.value = false
    bulkAction.value = ''
    clearSelected()
    loadingId.value = null
    cardLoadingAction.value = ''
    openResult(
      'Hoàn tất',
      `Đã chuyển ${bulkProgress.value.done}/${orders.length} đơn hàng sang Đang ship.`,
      'success',
    )
  }
}

async function bulkComplete() {
  const orders = getSelectedOrders().filter((dh) => getDonStatus(dh) !== 'Hoàn thành')
  if (orders.length === 0) {
    openResult('Thông báo', 'Không có đơn nào để hoàn thành', 'error')
    return
  }
  openConfirm(
    'bulk-complete',
    orders,
    'Hoàn thành nhiều đơn',
    `Xác nhận hoàn thành ${orders.length} đơn hàng đã chọn?`,
  )
}

async function runBulkComplete(orders) {
  bulkLoading.value = true
  bulkAction.value = 'complete'
  bulkProgress.value = { done: 0, total: orders.length }

  try {
    for (const dh of orders) {
      loadingId.value = dh.Ma_hoa_don
      cardLoadingAction.value = 'complete'
      await hoanThanhDonHang(dh, { skipConfirm: true, silent: true })
      bulkProgress.value.done++
      loadingId.value = null
      cardLoadingAction.value = ''
    }
  } finally {
    bulkLoading.value = false
    bulkAction.value = ''
    clearSelected()
    loadingId.value = null
    cardLoadingAction.value = ''
    openResult(
      'Hoàn tất',
      `Đã hoàn thành ${bulkProgress.value.done}/${orders.length} đơn hàng.`,
      'success',
    )
  }
}

async function bulkCancel() {
  const orders = getSelectedOrders().filter((dh) => getDonStatus(dh) !== 'Hoàn thành')
  if (orders.length === 0) {
    openResult('Thông báo', 'Không có đơn nào để hủy', 'error')
    return
  }
  openConfirm(
    'bulk-cancel',
    orders,
    'Xác nhận hủy nhiều đơn',
    `Bạn có chắc chắn muốn HỦY ${orders.length} đơn hàng? Hành động này không thể hoàn tác!`,
  )
}

async function runBulkCancel(orders) {
  bulkLoading.value = true
  bulkAction.value = 'cancel'
  bulkProgress.value = { done: 0, total: orders.length }

  try {
    for (const dh of orders) {
      loadingId.value = dh.Ma_hoa_don
      cardLoadingAction.value = 'cancel'
      await huyDonHang(dh, { skipConfirm: true, silent: true })
      bulkProgress.value.done++
      loadingId.value = null
      cardLoadingAction.value = ''
    }
    openResult('Hoàn tất', `Đã hủy ${bulkProgress.value.done}/${orders.length} đơn hàng.`, 'success')
  } finally {
    bulkLoading.value = false
    bulkAction.value = ''
    clearSelected()
    loadingId.value = null
    cardLoadingAction.value = ''
  }
}

watch(
  donHangList,
  () => {
    const validIds = new Set(donHangList.value.map((dh) => dh.Ma_hoa_don))
    const newSelected = new Set()
    selectedIds.value.forEach((id) => {
      if (validIds.has(id)) newSelected.add(id)
    })
    if (newSelected.size !== selectedIds.value.size) {
      selectedIds.value = newSelected
    }
  },
  { deep: true },
)

watch(
  () => filter.value.fromDate,
  (newVal) => {
    if (newVal && filter.value.toDate && newVal > filter.value.toDate) {
      filter.value.toDate = newVal
    }
  },
)

watch(
  () => filter.value.toDate,
  (newVal) => {
    if (newVal && filter.value.fromDate && newVal < filter.value.fromDate) {
      filter.value.fromDate = newVal
    }
  },
)

watch(
  filter,
  () => {
    currentPage.value = 1
    clearSelected()
  },
  { deep: true },
)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
.page-container,
.page-container * {
  box-sizing: border-box;
}



.page-container {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 16px 18px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  position: relative;
}

.page-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.page-container > * {
  position: relative;
  z-index: 1;
}

/* ===== FILTER BAR (PREMIUM TECH DASHBOARD) ===== */
.filter-bar {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  /* Viền 1px sáng nhẹ + Shadow mềm */
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3), 
    inset 0 1px 0 rgba(255, 255, 255, 0.08); /* Inner highlight top */
  
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* Top Glow Effect */
.filter-bar::before {
  content: '';
  position: absolute;
  top: -50px;
  left: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.fb-row {
  display: flex;
  gap: 20px;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Row 1: Search */
.search-row {
  width: 100%;
}
.search-box {
  flex: 1;
}

/* Row 2: Dates */
.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Row 3: Actions */
.actions-row {
  display: grid;
  grid-template-columns: 200px 1fr 100px; /* Payment | Sort | Reset */
  align-items: end;
  gap: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.filter-item label {
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  opacity: 1;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-left: 2px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

/* ===== CONTROLS (Unified Height 48px) ===== */
.filter-item input,
.filter-item select,
.search-wrapper input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(30, 41, 59, 0.5); /* Semi-transparent dark */
  border: 1px solid rgba(148, 163, 184, 0.15);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  appearance: none;
  font-family: inherit;
}

.filter-item input::placeholder,
.search-wrapper input::placeholder {
  color: #64748b;
  font-weight: 500;
}

/* Hover & Focus */
.filter-item input:hover,
.filter-item select:hover,
.search-wrapper input:hover {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.7);
}

.filter-item input:focus,
.filter-item select:focus,
.search-wrapper input:focus {
  outline: none;
  background-color: rgba(15, 23, 42, 0.95); /* Use background-color to avoid resetting bg-image */
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); /* Glow */
  color: #fff;
}

/* ===== SEARCH BOX ===== */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-wrapper input {
  padding-left: 48px; /* Icon space */
  padding-right: 80px; /* Clear button space */
  background: rgba(15, 23, 42, 0.6);
  /* NEON GREEN HIGHLIGHT */
  border: 1px solid #10b981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
}

.search-wrapper input:focus {
  border-color: #00ff9d;
  box-shadow: 0 0 20px rgba(0, 255, 157, 0.4);
  background: rgba(15, 23, 42, 0.85);
}

.search-wrapper i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #10b981; /* Green icon to match */
  pointer-events: none;
  transition: color 0.3s;
}

.search-wrapper:focus-within i {
  color: #00ff9d;
  text-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
}

/* Clear Button (Ghost Pill) */
.btn-clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear-search:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

/* ===== SEARCH RESULT BAR ===== */
.search-result-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  font-family: 'JetBrains Mono', monospace;
  color: #94a3b8;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-count .highlight-count {
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  margin: 0 4px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.result-text .highlight-text {
  color: #10b981;
  font-weight: 700;
  margin-left: 4px;
}

/* ===== DATE INPUT ===== */
.filter-item input[type="date"] {
  position: relative; /* Ensure picker positions relative to this input */
  z-index: 1;
  /* Calendar Icon Trick */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%2364748b'%3E%3Cpath d='M17 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3ZM4 9V19H20V9H4ZM6 11H8V13H6V11ZM11 11H13V13H11V11ZM16 11H18V13H16V11Z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 48px;
}
.filter-item input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}
.filter-item input[type="date"]:focus {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%233b82f6'%3E%3Cpath d='M17 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3ZM4 9V19H20V9H4ZM6 11H8V13H6V11ZM11 11H13V13H11V11ZM16 11H18V13H16V11Z'%3E%3C/path%3E%3C/svg%3E");
}

/* ===== SELECT ===== */
.filter-item select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%2394a3b8'%3E%3Cpath d='M12 16L6 10H18L12 16Z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 48px;
}
.filter-item select:focus {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='%233b82f6'%3E%3Cpath d='M12 16L6 10H18L12 16Z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
}

/* ===== SORT GROUP (SEGMENTED CONTROL) ===== */
.status-btn-group {
  display: flex;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.12);
  padding: 4px;
  border-radius: 12px;
  height: 48px;
  position: relative;
}

.status-btn {
  flex: 1;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.status-btn .app-ico {
  font-size: 16px;
  opacity: 0.7;
}

.status-btn:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.03);
}

/* Active Pill Style */
.status-btn.active {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  opacity: 1;
}

/* Red for Upcoming (Gần -> Xa) */
.status-btn.sort-gold.active {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); /* Red gradient */
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Green for Newest (Xa -> Gần) */
.status-btn.sort-blue.active {
  background: linear-gradient(135deg, #15803d 0%, #22c55e 100%); /* Green gradient */
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

/* Payment Filter Borders & Backgrounds */
.filter-item select.pay-cash {
  border-color: #22c55e !important;
  background-color: #15803d !important; /* Solid Dark Green */
  background-repeat: no-repeat !important;
  background-position: right 16px center !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.4);
}

.filter-item select.pay-transfer {
  border-color: #3b82f6 !important;
  background-color: #1d4ed8 !important; /* Solid Dark Blue */
  background-repeat: no-repeat !important;
  background-position: right 16px center !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(29, 78, 216, 0.4);
}

/* ===== RESET BUTTON (GHOST) ===== */
.btn-reset {
  height: 48px;
  width: 100%;
  padding: 0 16px;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.15); /* Very subtle border */
  border-radius: 12px;
  color: #64748b; /* Disabled-like color by default */
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  letter-spacing: 0.5px;
}

.btn-reset:hover {
  background: rgba(239, 68, 68, 0.05); /* Slight red tint */
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

/* Resize responsive */
@media (max-width: 1024px) {
  .actions-row {
    grid-template-columns: 1fr;
  }
}

/* Ensure input has space for button */
.search-wrapper input {
  padding-right: 50px !important; /* More space for text */
}

/* ===== MAIN CONTENT ===== */
.main-content {
  display: grid;
  grid-template-columns: 1fr 120px; /* Restored sidebar column */
  gap: 24px;
  width: 100%;
}

/* ===== ORDERS SECTION ===== */
.orders-section {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(16, 185, 129, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 100%;
}

.loading, .empty {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 15px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(16, 185, 129, 0.1);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== ORDERS GRID ===== */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* ===== ORDER CARD ===== */
.order-card {
  background: linear-gradient(160deg, rgba(20, 28, 45, 0.98), rgba(10, 14, 25, 0.98));
  border-radius: 16px;
  border: 1px solid transparent;
  background-clip: padding-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  backdrop-filter: blur(10px);
}

.order-card::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.35), rgba(148, 163, 184, 0.1));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.8;
}

.order-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.05));
  opacity: 0.6;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35), 0 0 22px rgba(59, 130, 246, 0.08);
}

.order-card.overdue {
  box-shadow: 0 0 22px rgba(239, 68, 68, 0.18);
}

.order-card.pending {
  box-shadow: 0 0 18px rgba(234, 179, 8, 0.12);
}

.order-card.done {
  box-shadow: 0 0 18px rgba(16, 185, 129, 0.12);
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.status-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.status-pill.pending {
  background: rgba(234, 179, 8, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(234, 179, 8, 0.35);
}

.status-pill.overdue {
  background: rgba(239, 68, 68, 0.15);
  color: #fecaca;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.status-pill.done {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.index-pill {
  font-size: 12px;
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  border: 1px solid rgba(239, 68, 68, 0.6);
  font-family: 'JetBrains Mono', monospace;
}

/* Body */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.customer-title {
  font-size: 17px;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: 0.2px;
}

.meta-line {
  font-size: 12px;
  color: #9aa4b2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.customer-row .customer-title {
  flex: 1;
  min-width: 0;
}

.meta-text {
  flex: 1;
  min-width: 0;
}

.copy-btn {
  height: 24px;
  min-width: 64px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(148, 163, 184, 0.08);
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.copy-btn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.copy-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.16);
  border-color: rgba(59, 130, 246, 0.45);
  color: #60a5fa;
  box-shadow: 0 10px 22px rgba(59, 130, 246, 0.1);
}

.copy-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.copy-btn:active:not(:disabled) {
  background: rgba(59, 130, 246, 0.22);
  border-color: rgba(59, 130, 246, 0.55);
  color: #93c5fd;
  transform: translateY(1px);
}

.copy-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.copy-btn.copied {
  background: rgba(34, 197, 94, 0.16);
  border-color: rgba(34, 197, 94, 0.45);
  color: #34d399;
  box-shadow: 0 10px 22px rgba(34, 197, 94, 0.1);
}

.copy-label {
  line-height: 1;
}

.m-value-copy {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pay-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.amount {
  font-size: 18px;
  font-weight: 900;
  color: #22c55e;
  font-family: 'JetBrains Mono', monospace;
}

.time-box {
  font-size: 12px;
  font-weight: 600;
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 1.3;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.time-box .time-main {
  color: #cbd5f5;
}

.time-box .time-sub {
  font-size: 12px;
  opacity: 0.95;
  font-weight: 700;
}

.time-box.normal {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.time-box.warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.time-box.urgent {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  font-weight: 800;
}

.time-box.overdue {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.45);
  animation: overduePulse 1.6s ease-in-out infinite;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.25);
}

.time-box.done {
  color: #94a3b8;
}

@keyframes overduePulse {
  0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
  50% { box-shadow: 0 0 18px rgba(239, 68, 68, 0.35); }
}

/* Note */
.note-box {
  font-size: 12px;
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.payment-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
}

.payment-badge.cash {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.payment-badge.transfer {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Footer */
.card-footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.btn-cancel,
.btn-invoice,
.btn-done {
  height: 40px;
  border-radius: 12px;
  border: none;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  white-space: nowrap;
}

.btn-invoice {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
}

.btn-invoice:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.28);
}

.btn-invoice:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-done {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: #fff;
}

.btn-done:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.25);
}

.btn-cancel {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: #fff;
}

.btn-cancel:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(239, 68, 68, 0.25);
}

.btn-cancel:disabled,
.btn-done:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== PAGINATION ===== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.btn-page {
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  color: #10b981;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-page:hover:not(:disabled) {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.btn-page:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(0,0,0,0.3);
  padding: 8px 16px;
  border-radius: 8px;
}

/* ===== STATUS CARDS ===== */
.status-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border-radius: 16px;
  padding: 18px 12px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.03));
  pointer-events: none;
}

.status-card:hover {
  transform: translateX(-6px) scale(1.02);
}

.status-card.active {
  background: #334155;
  border-color: #94a3b8;
  box-shadow: 0 0 30px rgba(148, 163, 184, 0.3), inset 0 0 20px rgba(148, 163, 184, 0.1);
  transform: translateX(-6px) scale(1.04);
}

.status-card.active .stat-number {
  color: #fff !important;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
}

.status-card.active .stat-badge {
  color: #fff !important;
  border-color: rgba(255,255,255,0.5) !important;
  background: rgba(255,255,255,0.2) !important;
}

.status-card.pending {
  border-color: rgba(234, 179, 8, 0.3);
}

.status-card.pending.active {
  background: #eab308;
  border-color: #facc15;
  box-shadow: 0 0 30px rgba(234, 179, 8, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.status-card.overdue {
  border-color: rgba(239, 68, 68, 0.3);
}

.status-card.overdue.active {
  background: #ef4444;
  border-color: #fca5a5;
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2);
  animation: overdueGlow 2s infinite;
}

@keyframes overdueGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 50px rgba(239, 68, 68, 0.7), inset 0 0 30px rgba(255, 255, 255, 0.3); }
}

.status-card.done {
  border-color: rgba(16, 185, 129, 0.3);
}

.status-card.done.active {
  background: #10b981;
  border-color: #6ee7b7;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.stat-number {
  font-size: 32px;
  font-weight: 800;
  color: #f1f5f9;
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.stat-badge {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(148, 163, 184, 0.08);
}

.stat-badge.neutral {
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.35);
}

.status-card.pending .stat-number {
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
}

.status-card.pending .stat-badge {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.45);
  background: rgba(251, 191, 36, 0.12);
}

.status-card.overdue .stat-number {
  color: #f87171;
  text-shadow: 0 0 20px rgba(248, 113, 113, 0.5);
}

.status-card.overdue .stat-badge {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.45);
  background: rgba(248, 113, 113, 0.12);
}

.status-card.done .stat-number {
  color: #34d399;
  text-shadow: 0 0 20px rgba(52, 211, 153, 0.5);
}

.status-card.done .stat-badge {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.45);
  background: rgba(52, 211, 153, 0.12);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
  .orders-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .orders-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .status-cards {
    flex-direction: row;
    order: -1;
    margin-bottom: 0;
  }

  .status-card {
    flex: 1;
    padding: 12px 8px;
  }

  .status-card:hover {
    transform: translateY(-4px);
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    gap: 16px;
  }

  .date-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-item {
    width: 100%;
  }

  .filter-item input,
  .filter-item select {
    width: 100%;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }
}

/* ===== SCROLL TO TOP ===== */
.btn-scroll-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9990;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateY(20px) scale(0.9);
  pointer-events: none;
}

.btn-scroll-top.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.btn-scroll-top:hover {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
  transform: translateY(-4px) scale(1);
}

.btn-scroll-top i {
  font-size: 24px;
}

@media (max-width: 768px) {
  .btn-scroll-top {
    bottom: 90px;
    right: 16px;
    width: 44px;
    height: 44px;
  }
}

/* ===== MOBILE MODAL PRODUCT LIST ===== */
.mobile-only-list {
  display: none;
}

.desktop-only-table {
  display: flex !important;
}

@media (max-width: 768px) {
  .desktop-only-table {
    display: none !important;
  }
  
  .mobile-only-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ... (keep existing card styles) ... */

  .modal-content {
    max-height: 70vh; /* Reduced to prevent top cutoff */
    margin-bottom: 80px; /* Adjusted push */
  }

  .modal-body {
    max-height: calc(70vh - 120px); /* Adjusted scroll area */
  }

  .mm-card {
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }


  .mm-name {
    font-size: 14px;
    font-weight: 700;
    color: #e2e8f0;
    line-height: 1.4;
  }

  .mm-meta-row {
    display: flex;
    gap: 8px;
    font-size: 11px;
  }

  .mm-tag {
    background: rgba(30, 41, 59, 0.5);
    padding: 2px 8px;
    border-radius: 4px;
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  .mm-price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed rgba(148, 163, 184, 0.15);
    padding-top: 8px;
    margin-top: 2px;
  }

  .mm-calc {
    font-size: 12px;
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }

  .mm-qty {
    color: #e2e8f0;
    font-weight: 700;
  }

  .mm-total {
    font-size: 14px;
    font-weight: 800;
    color: #22c55e;
    font-family: 'JetBrains Mono', monospace;
  }

  .mm-note {
    font-size: 11px;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
    padding: 6px 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .mm-note i {
    font-size: 14px;
  }
}

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(145deg, #0f172a 0%, #1f2937 100%);
  border-radius: 18px;
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.modal-close {
  border: none;
  background: transparent;
  color: #cbd5f5;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  padding: 2px 6px;
}

.modal-close:hover {
  color: #fff;
}

.modal-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  backdrop-filter: blur(10px);
  background: rgba(15, 23, 42, 0.85);
}

.modal-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace;
}

.modal-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

/* Custom Scrollbar for Modal */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.2);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.25);
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}

.m-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.m-title {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.m-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  font-size: 13px;
}

.m-row.total .m-value {
  font-size: 15px;
}

.m-value-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.m-counter {
  font-weight: 900;
  font-size: 16px;
  letter-spacing: 0.2px;
}

.m-counter.normal {
  color: #22c55e;
}

.m-counter.warning {
  color: #f59e0b;
}

.m-counter.urgent {
  color: #ef4444;
}

.m-counter.overdue {
  color: #ef4444;
  animation: overduePulse 1.6s ease-in-out infinite;
}

.m-counter.done {
  color: #94a3b8;
}

.pay-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.pay-badge.cash {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.pay-badge.transfer {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.total-amount {
  color: #22c55e;
  font-weight: 900;
  font-size: 18px;
}

.m-row.total .m-value.total-amount {
  color: #22c55e;
  font-weight: 900;
  font-size: 18px;
}

.m-label {
  color: #94a3b8;
  font-size: 12px;
}

.m-value {
  color: #e2e8f0;
  font-weight: 700;
}

.m-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  overflow: hidden;
}

.m-table-head,
.m-table-row {
  display: grid;
  grid-template-columns: 50px 1fr 120px 140px;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
}

.m-table-head {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.08);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  font-weight: 700;
}

.m-table-row {
  font-size: 13px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.m-table-row:last-child {
  border-bottom: none;
}

.m-col-qty,
.m-col-price,
.m-col-total {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #e2e8f0;
}

.m-item-name {
  font-weight: 700;
  color: #e2e8f0;
}

.m-item-note {
  font-size: 11px;
  color: #fbbf24;
  margin-top: 2px;
}

.m-item-dvt {
  font-size: 11px;
  color: #9aa4b2;
  margin-top: 2px;
}

.modal-content .note-box {
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.55);
  padding: 10px 12px;
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 13px;
}

.modal-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding: 14px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  backdrop-filter: blur(10px);
  background: rgba(15, 23, 42, 0.85);
}

.modal-footer.three-cols {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.btn-invoice-lg {
  padding: 12px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-invoice-lg:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.42);
}

.btn-invoice-lg:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.bulk-btn.invoice {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.bulk-btn.invoice:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.btn-complete {
  padding: 12px;
  background: linear-gradient(135deg, #10b981, #34d399);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-complete:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-cancel {
  padding: 12px;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.btn-cancel:disabled,
.btn-complete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: saturate(0.9);
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  display: inline-block;
  margin-right: 8px;
  animation: spin 0.8s linear infinite;
  vertical-align: -2px;
}

/* ===== MULTI-SELECT & BULK ACTION CSS ===== */
.select-tick {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #94a3b8;
  padding: 0;
  flex-shrink: 0;
}

.select-tick:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #60a5fa;
  transform: scale(1.1);
}

.select-tick.on {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.select-tick:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(1);
}

.select-tick i {
  font-size: 20px;
}

/* Selected Card Styling */
.order-card.selected {
  outline: 2px solid #10b981;
  outline-offset: -2px;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2), 0 8px 24px rgba(16, 185, 129, 0.15);
  background: linear-gradient(160deg, rgba(16, 185, 129, 0.05), rgba(10, 14, 25, 0.98));
}

.order-card.selected .select-tick {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

/* Bulk Action Bar */
.bulk-action-bar {
  position: sticky;
  top: 16px;
  z-index: 100;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 16px;
  padding: 12px 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #e2e8f0;
}

.bulk-info i {
  font-size: 20px;
  color: #10b981;
}

.bulk-info strong {
  color: #10b981;
  font-weight: 800;
  font-size: 17px;
}

.bulk-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fbbf24;
  font-weight: 600;
}

.bulk-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(251, 191, 36, 0.3);
  border-top-color: #fbbf24;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.bulk-actions {
  display: flex;
  gap: 12px;
}

.bulk-btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.bulk-btn i { font-size: 16px; }

.bulk-btn.complete {
  background: #10b981;
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.bulk-btn.complete:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.bulk-btn.cancel {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: #fff;
  border: none;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.bulk-btn.cancel:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
  color: #fff;
}

.bulk-btn.clear {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.bulk-btn.clear:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
}

.bulk-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* New Select All Button in Bulk Bar */
.bulk-btn.select-all {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.bulk-btn.select-all:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.25);
  color: #7dd3fc;
  transform: translateY(-1px);
}

/* Card Loading Overlay */
.card-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 16px;
  color: #fbbf24;
  font-weight: 700;
  font-size: 13px;
  animation: fadeIn 0.2s ease;
}

.spinner-sm {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(251, 191, 36, 0.3);
  border-top-color: #fbbf24;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== MODAL CONFIRM & RESULT ===== */
.confirm-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 9999; /* Higher than Detail Modal */
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.confirm-box {
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  padding: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 8px;
}
.confirm-icon.success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
}
.confirm-icon.danger, .confirm-icon.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.25);
}

.confirm-title {
  font-size: 20px;
  font-weight: 800;
  color: #f8fafc;
}
.confirm-desc {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
}

.c-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.c-btn.c-cancel {
  background: rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
}
.c-btn.c-cancel:hover {
  background: rgba(148, 163, 184, 0.2);
}

.c-btn.c-yes.success {
  background: #10b981;
  color: #fff;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}
.c-btn.c-yes.success:hover {
  background: #059669;
}

.c-btn.c-yes.danger, .c-btn.c-yes.error {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}
.c-btn.c-yes.danger:hover, .c-btn.c-yes.error:hover {
  background: #dc2626;
}

/* ===== CHỜ DUYỆT & LIVE GROUP ORDER ENHANCEMENTS ===== */
.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.source-pill {
  font-size: 10px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 999px;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.source-pill.web-pill {
  background: rgba(56, 189, 248, 0.14);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.source-pill.group-pill {
  background: rgba(168, 85, 247, 0.18);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.pay-badges-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.dish-count-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.order-card.waiting {
  box-shadow: 0 0 22px rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.35);
}

.status-pill.waiting {
  background: rgba(6, 182, 212, 0.18);
  color: #67e8f9;
  border: 1px solid rgba(6, 182, 212, 0.45);
}

.time-box.waiting,
.m-counter.waiting {
  color: #38bdf8;
}

.status-card.waiting {
  border-color: rgba(6, 182, 212, 0.35);
}

.status-card.waiting.has-waiting:not(.active) {
  animation: waitingPulseCard 2.2s ease-in-out infinite;
}

@keyframes waitingPulseCard {
  0%, 100% { box-shadow: 0 0 12px rgba(6, 182, 212, 0.18); }
  50% { box-shadow: 0 0 26px rgba(6, 182, 212, 0.42); }
}

.status-card.waiting .stat-number {
  color: #22d3ee;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.45);
}

.status-card.waiting .stat-badge {
  color: #67e8f9;
  border-color: rgba(34, 211, 238, 0.45);
  background: rgba(6, 182, 212, 0.14);
}

.status-card.waiting.active {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  border-color: #67e8f9;
  box-shadow: 0 0 32px rgba(6, 182, 212, 0.55), inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.btn-approve {
  height: 40px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 800;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: #fff;
}

.btn-approve:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(6, 182, 212, 0.32);
}

.btn-approve:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-approve-lg {
  padding: 12px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-approve-lg:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.45);
}

.btn-approve-lg:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.bulk-btn.approve {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: #fff;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35);
}

.bulk-btn.approve:hover:not(:disabled) {
  background: #0e7490;
  transform: translateY(-1px);
}

/* ===== ĐANG SHIP ENHANCEMENTS ===== */
.order-card.shipping {
  box-shadow: 0 0 22px rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.42);
}

.status-pill.shipping {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.48);
}

.time-box.shipping,
.m-counter.shipping {
  color: #818cf8;
}

.status-card.shipping {
  border-color: rgba(99, 102, 241, 0.35);
}

.status-card.shipping .stat-number {
  color: #818cf8;
  text-shadow: 0 0 20px rgba(99, 102, 241, 0.45);
}

.status-card.shipping .stat-badge {
  color: #a5b4fc;
  border-color: rgba(99, 102, 241, 0.45);
  background: rgba(99, 102, 241, 0.16);
}

.status-card.shipping.active {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border-color: #a5b4fc;
  box-shadow: 0 0 32px rgba(99, 102, 241, 0.55), inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.status-card.shipping.active .stat-number,
.status-card.shipping.active .stat-badge {
  color: #fff;
}

.btn-ship {
  height: 40px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 800;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
}

.btn-ship:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.35);
}

.btn-ship:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-ship-lg {
  padding: 12px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-ship-lg:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.btn-ship-lg:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.bulk-btn.ship {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.bulk-btn.ship:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

/* ===== WIDE ORDER DETAIL MODAL & LIVE EDITOR ===== */
.modal-content.modal-content-wide {
  max-width: 780px;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.so-hd-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(251, 191, 36, 0.16);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.35);
  font-family: 'JetBrains Mono', monospace;
}

.sync-status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.14);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.sync-status-pill.syncing {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.4);
}

.m-inline-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  padding: 7px 10px;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.m-inline-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.18);
}

.m-time-input {
  max-width: 280px;
}

.m-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.m-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.m-title-text {
  font-size: 11px;
  font-weight: 800;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.vi-lang-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.14);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.view-mode-switch {
  display: inline-flex;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 10px;
  padding: 3px;
  gap: 4px;
}

.vm-btn {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.vm-btn:hover {
  color: #e2e8f0;
}

.vm-btn.active {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: #fff;
  box-shadow: 0 2px 10px rgba(6, 182, 212, 0.3);
}

/* Admin Add Dish Toolbar */
.admin-add-dish-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px dashed rgba(56, 189, 248, 0.32);
  border-radius: 12px;
  padding: 10px;
}

.dish-search-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dish-search-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.dish-search-input-wrap i {
  position: absolute;
  left: 10px;
  color: #64748b;
  font-size: 15px;
}

.dish-search-input-wrap input {
  width: 100%;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 9px;
  padding: 8px 30px 8px 32px;
  color: #f8fafc;
  font-size: 13px;
  outline: none;
}

.dish-search-input-wrap input:focus {
  border-color: #38bdf8;
}

.dish-clear-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
}

.btn-custom-dish-toggle {
  height: 35px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-custom-dish-toggle.active,
.btn-custom-dish-toggle:hover {
  background: rgba(251, 191, 36, 0.24);
  color: #fde68a;
}

.dish-search-dropdown {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  padding: 6px;
}

.dish-search-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px;
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.dish-search-option:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
}

.dso-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dso-name {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
}

.dso-meta {
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.dso-stock {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}

.dso-stock.in {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.dso-stock.out {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.dso-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.dso-price {
  font-size: 13px;
  font-weight: 800;
  color: #22c55e;
  font-family: 'JetBrains Mono', monospace;
}

.dso-plus {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  background: #06b6d4;
  color: #fff;
}

.dish-search-empty {
  font-size: 12px;
  color: #94a3b8;
  padding: 6px 8px;
}

.custom-dish-form {
  display: grid;
  grid-template-columns: 1.5fr 92px 68px 110px 1.2fr auto;
  gap: 6px;
  align-items: center;
}

.add-panel-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.add-mode-tabs {
  display: inline-flex;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 9px;
  padding: 3px;
  gap: 4px;
}

.add-mode-tab {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.18s;
}

.add-mode-tab:hover {
  color: #e2e8f0;
}

.add-mode-tab.active {
  background: rgba(56, 189, 248, 0.18);
  color: #38bdf8;
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.35);
}

.add-target-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.add-target-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  white-space: nowrap;
}

.add-target-select,
.db-cat-select {
  height: 34px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0 10px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 600;
  outline: none;
}

.add-target-select:focus,
.db-cat-select:focus {
  border-color: #38bdf8;
}

.inline-switch-btn {
  border: none;
  background: transparent;
  color: #fbbf24;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
  padding: 0 2px;
}

/* Member Category Cards in Admin Approval Modal */
.member-categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-member-card {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.admin-member-card.is-host {
  border-color: rgba(34, 197, 94, 0.38);
}

.admin-member-card.is-admin {
  border-color: rgba(245, 158, 11, 0.38);
}

.admin-member-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 9px 12px;
  background: rgba(30, 41, 59, 0.85);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.admin-member-card.is-host .admin-member-head {
  background: linear-gradient(90deg, rgba(22, 163, 74, 0.18), rgba(30, 41, 59, 0.85));
}

.admin-member-card.is-admin .admin-member-head {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.16), rgba(30, 41, 59, 0.85));
}

.amh-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  min-width: 0;
}

.amh-ico {
  font-size: 15px;
  color: #38bdf8;
}

.admin-member-card.is-host .amh-ico {
  color: #4ade80;
}

.admin-member-card.is-admin .amh-ico {
  color: #fbbf24;
}

.amh-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #f8fafc;
}

.amh-role-badge {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.16);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.32);
}

.amh-role-badge.host {
  background: rgba(34, 197, 94, 0.16);
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.35);
}

.amh-role-badge.admin {
  background: rgba(245, 158, 11, 0.16);
  color: #fde68a;
  border-color: rgba(245, 158, 11, 0.35);
}

.amh-state-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.32);
}

.amh-state-badge.done {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.38);
}

.amh-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.amh-summary {
  font-size: 12px;
  font-weight: 800;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace;
}

.amh-add-btn {
  padding: 4px 9px;
  border-radius: 7px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: all 0.18s;
}

.amh-add-btn:hover {
  background: rgba(56, 189, 248, 0.25);
  color: #fff;
}

.admin-member-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  font-style: italic;
  color: #94a3b8;
}

.admin-member-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

.editor-item-card.member-line-card {
  background: rgba(30, 41, 59, 0.65);
  border-left: 3px solid #38bdf8;
}

.admin-member-card.is-host .editor-item-card.member-line-card {
  border-left-color: #22c55e;
}

.admin-member-card.is-admin .editor-item-card.member-line-card {
  border-left-color: #f59e0b;
}

.eic-manual-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(245, 158, 11, 0.16);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.cd-input {
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 8px;
  padding: 7px 9px;
  color: #f8fafc;
  font-size: 12px;
  outline: none;
  width: 100%;
}

.cd-input:focus {
  border-color: #fbbf24;
}

.cd-add-btn {
  height: 33px;
  padding: 0 12px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #0f172a;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
}

.empty-items-box {
  padding: 18px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed rgba(148, 163, 184, 0.25);
  border-radius: 10px;
}

/* Items Editor Cards (Grouped & Ungrouped) */
.items-editor-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-item-card {
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 11px 13px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-item-card.grouped-card {
  border-left: 3px solid #06b6d4;
}

.editor-item-card.ungrouped-card {
  border-left: 3px solid #a855f7;
}

.eic-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.eic-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.eic-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.eic-name {
  font-size: 14px;
  font-weight: 800;
  color: #f1f5f9;
}

.eic-dvt {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.65);
  padding: 2px 7px;
  border-radius: 5px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.member-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.16);
  color: #e9d5ff;
  border: 1px solid rgba(168, 85, 247, 0.35);
}

.member-tag.is-admin {
  background: rgba(245, 158, 11, 0.16);
  color: #fde68a;
  border-color: rgba(245, 158, 11, 0.38);
}

.grouped-members-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.member-breakdown-chip {
  font-size: 11px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.22);
  padding: 3px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.member-breakdown-chip strong {
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace;
}

.member-breakdown-chip em {
  font-style: normal;
  color: #fbbf24;
}

.member-breakdown-chip.is-admin {
  border-color: rgba(245, 158, 11, 0.38);
  color: #fde68a;
}

.eic-del-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.32);
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.eic-del-btn:hover {
  background: #ef4444;
  color: #fff;
}

.eic-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px dashed rgba(148, 163, 184, 0.14);
}

.eic-qty-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.qty-step-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  line-height: 1;
}

.qty-step-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
}

.qty-display {
  min-width: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  color: #f8fafc;
  font-family: 'JetBrains Mono', monospace;
}

.qty-inline-input {
  width: 52px;
  height: 28px;
  text-align: center;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 7px;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  outline: none;
}

.qty-readonly,
.price-readonly {
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
  font-family: 'JetBrains Mono', monospace;
}

.eic-price-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.eic-sub-label {
  font-size: 11px;
  color: #94a3b8;
}

.price-inline-input {
  width: 98px;
  height: 28px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 7px;
  padding: 0 8px;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  text-align: right;
  outline: none;
}

.price-inline-input:focus,
.qty-inline-input:focus {
  border-color: #38bdf8;
}

.eic-total-wrap {
  font-size: 14px;
  font-weight: 900;
  color: #22c55e;
  font-family: 'JetBrains Mono', monospace;
  margin-left: auto;
}

.eic-note-row {
  width: 100%;
}

.note-inline-input {
  width: 100%;
  background: rgba(251, 191, 36, 0.07);
  border: 1px solid rgba(251, 191, 36, 0.24);
  border-radius: 7px;
  padding: 6px 10px;
  color: #fde68a;
  font-size: 12px;
  outline: none;
}

.note-inline-input::placeholder {
  color: rgba(251, 191, 36, 0.55);
}

.note-inline-input:focus {
  border-color: #fbbf24;
}

/* Payment Toggle in Modal */
.pay-toggle-group {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pay-toggle-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.65);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.pay-toggle-btn.cash.active {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.45);
}

.pay-toggle-btn.transfer.active {
  background: rgba(59, 130, 246, 0.18);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.45);
}

@media (max-width: 768px) {
  .status-cards {
    flex-wrap: wrap;
    gap: 8px;
  }

  .status-card {
    min-width: calc(33.333% - 6px);
  }

  .custom-dish-form {
    grid-template-columns: 1fr 1fr;
  }

  .custom-dish-form .cd-name,
  .custom-dish-form .cd-note,
  .custom-dish-form .cd-add-btn {
    grid-column: 1 / -1;
  }

  .dish-search-row {
    flex-wrap: wrap;
  }

  .dish-search-input-wrap {
    min-width: 100%;
  }

  .db-cat-select {
    flex: 1;
  }

  .m-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .bulk-action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
  }

  .bulk-actions {
    flex-wrap: wrap;
  }

  .modal-footer.three-cols {
    grid-template-columns: 1fr 1fr;
  }

  .modal-footer.three-cols .btn-cancel {
    grid-column: 1 / -1;
    order: 3;
  }
}
</style>


















