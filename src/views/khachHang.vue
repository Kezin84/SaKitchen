<template>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <h1>👥 Quản Lý Khách Hàng</h1>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Tổng khách hàng</div>
          <div class="stat-value">{{ tongKhachHang }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tổng doanh thu</div>
          <div class="stat-value text-neutral">{{ formatMoneyWithCurrency(tongDoanhThu, defaultCurrency) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tổng lợi nhuận</div>
          <div class="stat-value text-success">{{ formatMoneyWithCurrency(tongLoiNhuan, defaultCurrency) }} ↑</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tổng công nợ</div>
          <div class="stat-value text-danger">
            {{ formatMoneyWithCurrency(tongCongNo, defaultCurrency) }}
            <span v-if="tongCongNo > 0"> ↑</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Khách có công nợ</div>
          <div class="stat-value">{{ khachCoCongNo }}</div>
        </div>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Tìm theo tên, SĐT, địa chỉ..."
          @input="resetPage"
        >
      </div>
      
      <!-- BỘ LỌC SẮP XẾP -->
      <div class="filter-box">
        <select v-model="sortOrder" @change="onSortOrderChange">
          <option value="newest">Mới nhất → Cũ nhất</option>
          <option value="oldest">Cũ nhất → Mới nhất</option>
        </select>
      </div>

      <!-- BỘ LỌC CHI TIÊU -->
      <div class="filter-box">
        <select v-model="filterChiTieu" @change="onFilterChiTieuChange">
          <option value="">Tất cả chi tiêu</option>
          <option value="high">Chi tiêu nhiều → ít</option>
          <option value="low">Chi tiêu ít → nhiều</option>
        </select>
      </div>

      <!-- BỘ LỌC LỢI NHUẬN -->
      <div class="filter-box">
        <select v-model="filterLoiNhuan" @change="onFilterLoiNhuanChange">
          <option value="">Tất cả lợi nhuận</option>
          <option value="high">Lợi nhuận nhiều → ít</option>
          <option value="low">Lợi nhuận ít → nhiều</option>
        </select>
      </div>

      <!-- BỘ LỌC LẦN MUA CUỐI -->
      <div class="filter-box">
        <select v-model="filterLanMua" @change="onFilterLanMuaChange">
          <option value="">Tất cả lần mua</option>
          <option value="recent">Mua gần đây → xa</option>
          <option value="old">Mua xa → gần đây</option>
        </select>
      </div>

      <!-- NÚT RESET BỘ LỌC -->
      <button 
        v-if="hasActiveFilters" 
        class="btn-reset" 
        @click="resetAllFilters"
        title="Xóa tất cả bộ lọc"
      >
        ✕ Xóa lọc
      </button>
    </div>

    <!-- TABLE -->
    <div class="table-container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <div>Đang tải dữ liệu...</div>
      </div>

      <div v-else-if="filteredKhachHang.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div>{{ searchQuery ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng' }}</div>
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên khách hàng</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Công nợ</th>
              <th>Tổng chi tiêu</th>
              <th>Tổng lợi nhuận</th>
              <th>Lần mua cuối</th>
              <th>Ghi chú</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(kh, index) in paginatedKhachHang" 
              :key="kh.Ma_khach_hang"
              @click="openEditModal(kh)"
              class="clickable-row customer-row"
            >
              <td class="col-stt" data-label="STT">
                <i class="ri-hashtag mobile-icon"></i>
                {{ startIndex + index + 1 }}
              </td>
              <td class="col-name" data-label="Tên">
                <i class="ri-user-3-fill mobile-icon"></i>
                <strong class="customer-name">{{ kh.Ten_khach_hang }}</strong>
              </td>
              <td class="col-phone" data-label="SĐT">
                <i class="ri-phone-fill mobile-icon"></i>
                {{ kh.So_dien_thoai }}
              </td>
              <td class="col-address" data-label="Địa chỉ">
                <i class="ri-map-pin-2-fill mobile-icon"></i>
                {{ kh.Dia_chi || '—' }}
              </td>
              <td class="col-debt" data-label="Công nợ">
                <i class="ri-hand-coin-line mobile-icon"></i>
                <span v-if="Number(kh.Cong_no_hien_tai || 0) > 0" class="money money-debt">
                  {{ formatMoneyWithCurrency(kh.Cong_no_hien_tai, kh.Don_vi_tien_te) }} ↑
                </span>
                <span v-else class="money money-zero">
                  {{ formatMoneyWithCurrency(kh.Cong_no_hien_tai, kh.Don_vi_tien_te) }}
                </span>
              </td>
              <td class="col-spent" data-label="Tổng chi">
                <i class="ri-shopping-cart-2-line mobile-icon"></i>
                <span class="money money-neutral">
                  {{ formatMoneyWithCurrency(kh.Tong_chi_tieu, kh.Don_vi_tien_te) }}
                </span>
              </td>
              <td class="col-profit" data-label="Lợi nhuận">
                <i class="ri-line-chart-line mobile-icon"></i>
                <span class="money money-profit">
                  {{ formatMoneyWithCurrency(kh.Tong_loi_nhuan, kh.Don_vi_tien_te) }} ↑
                </span>
              </td>
              <td class="col-last" data-label="Lần cuối">
                <i class="ri-history-line mobile-icon icon-large"></i>
                <div v-if="kh.Lan_mua_cuoi" class="last-purchase">
                  <div class="last-purchase-date">{{ kh.Lan_mua_cuoi }}</div>
                  <div class="last-purchase-ago">{{ getTimeAgo(kh.Lan_mua_cuoi) }}</div>
                </div>
                <div v-else class="no-purchase">Chưa mua hàng</div>
              </td>
              <td class="col-note" :class="{ 'empty-note': !kh.Ghi_chu }" data-label="Ghi chú">
                <i class="ri-sticky-note-line mobile-icon"></i>
                {{ kh.Ghi_chu || '—' }}
              </td>
              <td class="col-action" @click.stop>
                <div class="action-buttons">
                  <button 
                    class="btn-action btn-delete" 
                    @click="confirmDelete(kh)"
                    title="Xóa"
                  >
                    <i class="ri-delete-bin-6-line"></i>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Dòng trống để giữ chiều cao cố định -->
            <tr 
              v-for="n in emptyRows" 
              :key="'empty-' + n"
              class="empty-row"
            >
              <td colspan="10">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div v-if="filteredKhachHang.length > 0" class="pagination">
        <div class="pagination-info">
          Hiển thị {{ startIndex + 1 }} - {{ Math.min(startIndex + itemsPerPage, filteredKhachHang.length) }} / {{ filteredKhachHang.length }} khách hàng
        </div>
        <div class="pagination-controls">
          <button 
            class="page-btn" 
            @click="goToPage(1)" 
            :disabled="currentPage === 1"
            title="Trang đầu"
          >
            ⏮️
          </button>
          <button 
            class="page-btn" 
            @click="prevPage" 
            :disabled="currentPage === 1"
            title="Trang trước"
          >
            ◀️
          </button>
          
          <template v-for="page in totalPages" :key="page">
            <button 
              v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              class="page-btn"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <span 
              v-else-if="page === currentPage - 2 || page === currentPage + 2" 
              class="page-dots"
            >...</span>
          </template>
          
          <button 
            class="page-btn" 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            title="Trang sau"
          >
            ▶️
          </button>
          <button 
            class="page-btn" 
            @click="goToPage(totalPages)" 
            :disabled="currentPage === totalPages"
            title="Trang cuối"
          >
            ⏭️
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL SỬA KHÁCH HÀNG -->
    <div v-if="showEditModal" class="modal" @click="closeEditModal">
      <div class="modal-box" @click.stop>
        <h3>✏️ Chỉnh sửa khách hàng</h3>

        <div class="form-grid">
          <div class="field">
            <label>Tên khách hàng</label>
            <input v-model="editForm.Ten_khach_hang" />
          </div>

          <div class="field">
            <label>Số điện thoại</label>
            <input v-model="editForm.So_dien_thoai" type="tel" />
          </div>

          <div class="field full-width">
            <label>Địa chỉ</label>
            <input v-model="editForm.Dia_chi" />
          </div>

          <div class="field">
            <label>Công nợ hiện tại</label>
            <input v-model.number="editForm.Cong_no_hien_tai" type="number" />
          </div>

          <div class="field">
            <label>Tổng chi tiêu (chỉ xem)</label>
            <input :value="formatMoney(editForm.Tong_chi_tieu)" readonly />
          </div>

          <div class="field full-width">
            <label>Ghi chú</label>
            <textarea v-model="editForm.Ghi_chu" rows="3"></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeEditModal" :disabled="saving">Hủy</button>
          <button class="btn btn-primary" @click="saveEdit" :disabled="saving">
            <span v-if="saving" class="btn-spinner"></span>
            <span v-else>💾 Lưu</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL XÓA KHÁCH HÀNG -->
    <div v-if="showDeleteModal" class="modal" @click="showDeleteModal = false">
      <div class="modal-box modal-confirm" @click.stop>
        <h3>⚠️ Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa khách hàng <strong>{{ deleteTarget?.Ten_khach_hang }}</strong>?</p>
        <p class="warning-text">⚠️ Hành động này không thể hoàn tác!</p>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false" :disabled="deleting">Hủy</button>
          <button class="btn btn-danger" @click="executeDelete" :disabled="deleting">
            <span v-if="deleting" class="btn-spinner"></span>
            <span v-else>🗑️ Xóa</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL THÔNG BÁO -->
    <div v-if="showNotifyModal" class="modal" @click="closeNotifyModal">
      <div class="modal-box modal-notify" @click.stop>
        <div class="notify-icon" :class="notifyType">
          {{ notifyType === 'success' ? '✅' : '❌' }}
        </div>
        <h3 :class="notifyType">{{ notifyTitle }}</h3>
        <p>{{ notifyMessage }}</p>
        <div class="modal-actions center">
          <button class="btn btn-primary" @click="closeNotifyModal">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getSheets, dispatchAction } from '@/config/api'
export default {
  name: 'KhachHangManager',
  
  data() {
    return {
      khachHangList: [],
      donHangList: [],
      soThuChiList: [],
      
      searchQuery: '',
      sortOrder: 'newest',
      filterChiTieu: '',
      filterLoiNhuan: '',
      filterLanMua: '', // Bộ lọc lần mua cuối
      loading: false,
      saving: false,
      deleting: false,

      // Phân trang
      currentPage: 1,
      itemsPerPage: 10,

      showEditModal: false,
      editForm: {},

      showDeleteModal: false,
      deleteTarget: null,

      // Modal thông báo
      showNotifyModal: false,
      notifyType: 'success',
      notifyTitle: '',
      notifyMessage: '',
    }
  },

  computed: {
    // ===== LỌC VÀ SẮP XẾP KHÁCH HÀNG =====
    filteredKhachHang() {
      let list = [...this.khachHangList]

      // Giữ nguyên index gốc để sắp xếp theo vị trí
      list = list.map((kh, idx) => ({ ...kh, _originalIndex: idx }))

      // Lọc theo search
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase()
        list = list.filter(kh => {
          return (
            kh.Ten_khach_hang?.toLowerCase().includes(q) ||
            kh.So_dien_thoai?.toLowerCase().includes(q) ||
            kh.Dia_chi?.toLowerCase().includes(q) ||
            kh.Ma_khach_hang?.toLowerCase().includes(q)
          )
        })
      }

      // ===== SẮP XẾP ĐỘC LẬP - CHỈ 1 BỘ LỌC ACTIVE =====
      
      // Ưu tiên 1: Chi tiêu
      if (this.filterChiTieu) {
        list.sort((a, b) => {
          const chiTieuA = Number(a.Tong_chi_tieu || 0)
          const chiTieuB = Number(b.Tong_chi_tieu || 0)
          return this.filterChiTieu === 'high' 
            ? chiTieuB - chiTieuA 
            : chiTieuA - chiTieuB
        })
      }
      // Ưu tiên 2: Lợi nhuận
      else if (this.filterLoiNhuan) {
        list.sort((a, b) => {
          const loiNhuanA = Number(a.Tong_loi_nhuan || 0)
          const loiNhuanB = Number(b.Tong_loi_nhuan || 0)
          return this.filterLoiNhuan === 'high' 
            ? loiNhuanB - loiNhuanA 
            : loiNhuanA - loiNhuanB
        })
      }
      // Ưu tiên 3: Lần mua cuối
      else if (this.filterLanMua) {
        list.sort((a, b) => {
          const hasA = a.Lan_mua_cuoi ? 1 : 0
          const hasB = b.Lan_mua_cuoi ? 1 : 0
          
          if (this.filterLanMua === 'old') {
            if (hasA !== hasB) return hasA - hasB
          }
          
          const dateA = a.Lan_mua_cuoi ? this.parseDateTime(a.Lan_mua_cuoi) : new Date(0)
          const dateB = b.Lan_mua_cuoi ? this.parseDateTime(b.Lan_mua_cuoi) : new Date(0)
          
          return this.filterLanMua === 'recent' 
            ? dateB - dateA 
            : dateA - dateB
        })
      }
      // Mặc định: Sắp xếp theo vị trí tạo (mới/cũ)
      else {
        list.sort((a, b) => {
          return this.sortOrder === 'newest'
            ? b._originalIndex - a._originalIndex
            : a._originalIndex - b._originalIndex
        })
      }

      return list
    },

    // ===== KIỂM TRA CÓ BỘ LỌC ĐANG ACTIVE =====
    hasActiveFilters() {
      return (
        this.searchQuery.trim() !== '' ||
        this.sortOrder !== 'newest' ||
        this.filterChiTieu !== '' ||
        this.filterLoiNhuan !== '' ||
        this.filterLanMua !== ''
      )
    },

    // ===== THỐNG KÊ =====
    tongKhachHang() {
      return this.khachHangList.length
    },

    // ===== LẤY ĐƠN VỊ TIỀN TỆ MẶC ĐỊNH TỪ SỔ THU CHI =====
    defaultCurrency() {
      if (this.soThuChiList.length > 0) {
        const record = this.soThuChiList.find(tc => tc.Don_vi_tien_te)
        return record?.Don_vi_tien_te || 'VND'
      }
      return 'VND'
    },

    tongDoanhThu() {
      return this.khachHangList.reduce((sum, kh) => {
        return sum + Number(kh.Tong_chi_tieu || 0)
      }, 0)
    },

    tongLoiNhuan() {
      return this.khachHangList.reduce((sum, kh) => {
        return sum + Number(kh.Tong_loi_nhuan || 0)
      }, 0)
    },

    tongCongNo() {
      return this.khachHangList.reduce((sum, kh) => {
        return sum + Number(kh.Cong_no_hien_tai || 0)
      }, 0)
    },

    khachCoCongNo() {
      return this.khachHangList.filter(kh => {
        return Number(kh.Cong_no_hien_tai || 0) > 0
      }).length
    },

    // ===== PHÂN TRANG =====
    totalPages() {
      return Math.ceil(this.filteredKhachHang.length / this.itemsPerPage)
    },

    paginatedKhachHang() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredKhachHang.slice(start, end)
    },

    // Tính STT bắt đầu của trang hiện tại
    startIndex() {
      return (this.currentPage - 1) * this.itemsPerPage
    },

    // Số dòng trống cần thêm để giữ chiều cao cố định
    emptyRows() {
      const currentItems = this.paginatedKhachHang.length
      return Math.max(0, this.itemsPerPage - currentItems)
    }
  },

  methods: {
    // ===== HIỂN THỊ THÔNG BÁO =====
    showNotify(type, title, message) {
      this.notifyType = type
      this.notifyTitle = title
      this.notifyMessage = message
      this.showNotifyModal = true
    },

    closeNotifyModal() {
      this.showNotifyModal = false
    },

    // ===== PHÂN TRANG =====
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },

    // Reset về trang 1 khi search hoặc sort thay đổi
    resetPage() {
      this.currentPage = 1
    },

    // Reset tất cả bộ lọc về mặc định
    resetAllFilters() {
      this.searchQuery = ''
      this.sortOrder = 'newest'
      this.filterChiTieu = ''
      this.filterLoiNhuan = ''
      this.filterLanMua = ''
      this.currentPage = 1
    },

    // Khi chọn bộ lọc mới, reset các bộ lọc khác (độc lập)
    onSortOrderChange() {
      this.filterChiTieu = ''
      this.filterLoiNhuan = ''
      this.filterLanMua = ''
      this.resetPage()
    },

    onFilterChiTieuChange() {
      if (this.filterChiTieu) {
        this.sortOrder = 'newest'
        this.filterLoiNhuan = ''
        this.filterLanMua = ''
      }
      this.resetPage()
    },

    onFilterLoiNhuanChange() {
      if (this.filterLoiNhuan) {
        this.sortOrder = 'newest'
        this.filterChiTieu = ''
        this.filterLanMua = ''
      }
      this.resetPage()
    },

    onFilterLanMuaChange() {
      if (this.filterLanMua) {
        this.sortOrder = 'newest'
        this.filterChiTieu = ''
        this.filterLoiNhuan = ''
      }
      this.resetPage()
    },

    // ===== TẢI DỮ LIỆU =====
    async loadData() {
      this.loading = true
      try {
        const json = await getSheets(['khach_hang', 'don_hang', 'so_thu_chi'])

        if (json.success) {
          this.khachHangList = json.data.khach_hang || []
          this.donHangList = json.data.don_hang || []
          this.soThuChiList = json.data.so_thu_chi || []

          // ✅ GẮN THÔNG TIN CHO TỪNG KHÁCH
          this.khachHangList.forEach(kh => {
            kh.Lan_mua_cuoi = this.getLastPurchase(kh.Ma_khach_hang)
            kh.Don_vi_tien_te = this.getDonViTienTe(kh.Ma_khach_hang)
            kh.Tong_loi_nhuan = this.getTongLoiNhuan(kh.Ma_khach_hang)
          })
        }
      } catch (err) {
        console.error('Load data error:', err)
        this.showNotify('error', 'Lỗi', 'Không thể tải dữ liệu!')
      } finally {
        this.loading = false
      }
    },

    // ===== LẤY LẦN MUA HÀNG CUỐI =====
    getLastPurchase(maKhachHang) {
      const donHangKhach = this.donHangList.filter(dh => {
        return dh.Ma_khach_hang === maKhachHang && 
               dh.Trang_thai === 'Hoàn thành'
      })

      if (!donHangKhach.length) return null

      donHangKhach.sort((a, b) => {
        const dateA = this.parseDateTime(a.Thoi_gian_nhan_hang)
        const dateB = this.parseDateTime(b.Thoi_gian_nhan_hang)
        return dateB - dateA
      })

      return donHangKhach[0].Thoi_gian_nhan_hang
    },

    // ===== LẤY ĐƠN VỊ TIỀN TỆ TỪ SỔ THU CHI =====
    getDonViTienTe(maKhachHang) {
      const thuChi = this.soThuChiList.find(tc => tc.Ma_khach_hang === maKhachHang)
      return thuChi?.Don_vi_tien_te || 'VND'
    },

    // ===== LẤY TỔNG LỢI NHUẬN TỪ SỔ THU CHI =====
    getTongLoiNhuan(maKhachHang) {
      return this.soThuChiList
        .filter(tc => tc.Ma_khach_hang === maKhachHang && tc.Trang_thai === 'BAN_HANG')
        .reduce((sum, tc) => sum + Number(tc.loi_nhuan || 0), 0)
    },

    // ===== PARSE DATETIME (HH:MM:SS DD/MM/YYYY) =====
    parseDateTime(str) {
      if (!str) return new Date(0)
      
      const parts = str.split(' ')
      if (parts.length !== 2) return new Date(0)

      const [time, date] = parts
      const [h, m, s] = time.split(':')
      const [d, M, y] = date.split('/')

      return new Date(y, M - 1, d, h, m, s)
    },

    // ===== TÍNH THỜI GIAN ĐÃ QUA =====
    getTimeAgo(dateStr) {
      if (!dateStr) return ''
      
      const date = this.parseDateTime(dateStr)
      const now = new Date()
      const diffMs = now - date
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffWeeks = Math.floor(diffDays / 7)
      const diffMonths = Math.floor(diffDays / 30)
      const diffYears = Math.floor(diffDays / 365)
      
      if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`
      } else if (diffHours < 24) {
        return `${diffHours} giờ trước`
      } else if (diffDays < 7) {
        return `${diffDays} ngày trước`
      } else if (diffWeeks < 4) {
        return `${diffWeeks} tuần trước`
      } else if (diffMonths < 12) {
        return `${diffMonths} tháng trước`
      } else {
        return `${diffYears} năm trước`
      }
    },

    // ===== MỞ MODAL SỬA =====
    openEditModal(kh) {
      this.editForm = { ...kh }
      this.showEditModal = true
    },

    closeEditModal() {
      this.showEditModal = false
      this.editForm = {}
    },

    // ===== LƯU CHỈNH SỬA =====
    async saveEdit() {
      if (!this.editForm.Ma_khach_hang) {
        this.showNotify('error', 'Lỗi', 'Thiếu mã khách hàng!')
        return
      }

      this.saving = true

      try {
        const payload = {
          action: 'updateKhachHang',
          data: {
            Ma_khach_hang: this.editForm.Ma_khach_hang,
            Ten_khach_hang: this.editForm.Ten_khach_hang,
            So_dien_thoai: this.editForm.So_dien_thoai,
            Dia_chi: this.editForm.Dia_chi,
            Cong_no_hien_tai: this.editForm.Cong_no_hien_tai,
            Ghi_chu: this.editForm.Ghi_chu,
          }
        }

        const res = await dispatchAction(payload)
        if (!res.success) {
          throw new Error(res.message || 'Cập nhật thất bại')
        }

        this.showNotify('success', 'Thành công', 'Cập nhật khách hàng thành công!')
        this.closeEditModal()
        await this.loadData()
      } catch (err) {
        console.error('Update error:', err)
        this.showNotify('error', 'Lỗi', 'Không thể kết nối Firebase!')
      } finally {
        this.saving = false
      }
    },

    // ===== XÁC NHẬN XÓA =====
    confirmDelete(kh) {
      this.deleteTarget = kh
      this.showDeleteModal = true
    },

    // ===== THỰC HIỆN XÓA =====
    async executeDelete() {
      if (!this.deleteTarget) return

      this.deleting = true

      try {
        const payload = {
          action: 'deleteKhachHang',
          Ma_khach_hang: this.deleteTarget.Ma_khach_hang
        }

        const res = await dispatchAction(payload)
        if (!res.success) {
          throw new Error(res.message || 'Xóa thất bại')
        }

        this.showNotify('success', 'Thành công', 'Xóa khách hàng thành công!')
        this.showDeleteModal = false
        this.deleteTarget = null
        await this.loadData()
      } catch (err) {
        console.error('Delete error:', err)
        this.showNotify('error', 'Lỗi', 'Không thể kết nối Firebase!')
      } finally {
        this.deleting = false
      }
    },

    // ===== FORMAT MONEY =====
    formatMoney(num) {
      const n = Number(num || 0)
      return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
    },

    formatMoneyWithCurrency(num, currency) {
      const n = Number(num || 0)
      return new Intl.NumberFormat('vi-VN').format(n) + ' ' + (currency || 'VND')
    }
  },

  mounted() {
    this.loadData()
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: rgb(15, 23, 42);
  color: #e2e8f0;
  min-height: 100vh;
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  background: rgb(15, 23, 42);
  min-height: 100vh;
  padding: 20px;
}

/* ===== HEADER ===== */
.header {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-card {
  background: rgba(51, 65, 85, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

.text-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

.text-neutral {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

/* ===== CONTROLS ===== */
.controls {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-box input {
  width: 100%;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  padding: 12px 16px 12px 40px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.search-box input::placeholder {
  color: #64748b;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 18px;
}

.filter-box select {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 180px;
}

.filter-box select:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.filter-box select option {
  background: rgb(30, 41, 59);
  color: #e2e8f0;
}

/* ===== NÚT RESET BỘ LỌC ===== */
.btn-reset {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #f87171;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-reset:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}

/* ===== TABLE ===== */
.table-container {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  background: rgba(51, 65, 85, 0.6);
}

th {
  padding: 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  white-space: nowrap;
}

td {
  padding: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
  font-size: 14px;
  color: #cbd5e1;
  height: 60px;
}

tbody {
  min-height: 600px;
}

/* Đảm bảo tbody luôn có chiều cao cố định cho 10 dòng */
tbody tr {
  transition: all 0.3s;
  height: 60px;
}

tbody tr:hover {
  background: rgba(51, 65, 85, 0.3);
}

.clickable-row {
  cursor: pointer;
}

.customer-name {
  color: #60a5fa;
}

/* Spacer để giữ chiều cao khi ít dữ liệu */
.table-spacer {
  height: 60px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
}

.empty-row {
  height: 60px;
}

.empty-row td {
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
}

.empty-row:hover {
  background: transparent !important;
}

/* ===== PAGINATION ===== */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(51, 65, 85, 0.3);
}

.pagination-info {
  font-size: 13px;
  color: #94a3b8;
}

.pagination-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.4);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: transparent;
  color: white;
}

.page-dots {
  color: #64748b;
  padding: 0 4px;
}

/* ===== LOADING ===== */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(148, 163, 184, 0.2);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* ===== MONEY FORMAT ===== */
.money {
  font-weight: 600;
  font-family: 'Monaco', 'Courier New', monospace;
}

.money-neutral {
  color: #e2e8f0;
}

.money-positive {
  color: #22c55e;
}

.money-negative {
  color: #ef4444;
}

.money-zero {
  color: #64748b;
}

.money-profit {
  color: #10b981;
  font-weight: 700;
}

.money-debt {
  color: #ef4444;
  font-weight: 700;
}

/* ===== LAST PURCHASE ===== */
.last-purchase {
  font-size: 13px;
}

.last-purchase-date {
  color: #60a5fa;
  font-weight: 600;
}

.last-purchase-ago {
  color: #94a3b8;
  font-size: 11px;
  margin-top: 2px;
}

.no-purchase {
  color: #64748b;
  font-style: italic;
}

.mobile-icon {
  display: none;
}

/* ===== ACTION BUTTONS ===== */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
}

/* ===== MODAL ===== */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-box {
  background: rgb(15, 23, 42);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-box h3 {
  font-size: 22px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full-width {
  grid-column: span 2;
}

.field label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.field input,
.field textarea {
  padding: 10px 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.3s;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.field input[readonly] {
  background: rgba(51, 65, 85, 0.3);
  cursor: not-allowed;
  opacity: 0.7;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.modal-actions.center {
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 100px;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: rgba(148, 163, 184, 0.2);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

/* ===== BUTTON SPINNER ===== */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ===== MODAL CONFIRM ===== */
.modal-confirm {
  max-width: 450px;
}

.modal-confirm p {
  color: #cbd5e1;
  line-height: 1.6;
  margin: 12px 0;
}

.modal-confirm strong {
  color: #60a5fa;
  font-weight: 700;
}

.warning-text {
  color: #fbbf24 !important;
  font-weight: 600;
  margin-top: 16px !important;
}

/* ===== MODAL NOTIFY ===== */
.modal-notify {
  max-width: 400px;
  text-align: center;
}

.notify-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-notify h3 {
  border-bottom: none;
  padding-bottom: 0;
  text-align: center;
}

.modal-notify h3.success {
  color: #22c55e;
}

.modal-notify h3.error {
  color: #ef4444;
}

.modal-notify p {
  color: #94a3b8;
  margin-bottom: 20px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .controls {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .filter-box {
    width: 100%;
  }

  .filter-box select {
    width: 100%;
  }

  th, td {
    padding: 12px 8px;
    font-size: 12px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field.full-width {
    grid-column: span 1;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-info {
    text-align: center;
  }

  /* ===== FUTURISTIC TECH MOBILE CARD LAYOUT ===== */
  .table-container {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  table, thead, tbody, th, td, tr {
    display: block;
    width: 100%;
  }

  thead {
    display: none;
  }

  tbody tr {
    height: auto !important;
    min-height: unset !important;
  }

  .empty-row {
    display: none !important;
  }

  .mobile-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    margin-right: 12px;
    font-size: 1.1em;
    color: #60a5fa;
  }

  .customer-row {
    background: 
      linear-gradient(165deg, #0f172a 0%, #020617 100%),
      radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1), transparent 70%);
    background-size: cover;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: 4px solid #3b82f6; /* Tech accent line */
    border-radius: 12px 24px 24px 12px;
    margin-bottom: 24px;
    padding: 20px;
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
    box-shadow: 
      0 15px 35px -10px rgba(0, 0, 0, 0.6),
      inset 0 0 20px rgba(59, 130, 246, 0.05);
    overflow: hidden;
  }

  /* Tech Grid Pattern overlay */
  .customer-row::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none;
  }

  .customer-row:active {
    transform: scale(0.98);
    border-left-color: #60a5fa;
    background-color: #0f172a;
  }

  td {
    padding: 0;
    border: none;
    height: auto !important;
    display: inline-flex;
    align-items: center;
    width: auto;
    z-index: 2; /* Over tech grid */
  }

  /* --- Row 1: Primary Info (ID | Icon | Name) --- */
  .col-stt {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 900;
    color: #fff;
    background: #3b82f6;
    padding: 2px 8px !important;
    border-radius: 4px;
    margin-right: 8px;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }
  .col-stt .mobile-icon { display: none; }

  .col-name {
    font-size: 18px;
    font-weight: 800;
    color: #f8fafc;
    flex: 1;
    min-width: 140px;
    letter-spacing: -0.2px;
  }
  .col-name .mobile-icon { 
    background: rgba(30, 41, 59, 0.8);
    color: #cbd5e1;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
  }

  /* --- Meta row: Phone under name --- */
  .col-phone {
    width: 100% !important;
    flex-basis: 100%;
    font-size: 13px;
    color: #94a3b8;
    padding-left: 50px !important; /* Align with name start */
    margin-top: -10px;
    font-family: 'JetBrains Mono', monospace;
  }
  .col-phone .mobile-icon { display: none; }
  .col-phone::before { content: "SDT: "; font-size: 9px; opacity: 0.5; margin-right: 4px; }

  /* --- Row 2: Address --- */
  .col-address {
    width: 100% !important;
    flex-basis: 100%;
    font-size: 13px;
    color: #cbd5e1;
    background: rgba(30, 41, 59, 0.5);
    padding: 12px 14px !important;
    border-radius: 12px;
    border-left: 2px solid #f472b6;
    margin-top: 4px;
    line-height: 1.4;
  }
  .col-address .mobile-icon { background: transparent; border: none; width: auto; height: auto; color: #f472b6; }

  /* --- Row 3: Bento Metrics (The Grid) --- */
  .col-debt, .col-spent, .col-profit {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 6px !important;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-top: 6px;
  }

  .col-debt .money, .col-spent .money, .col-profit .money {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
  }
  
  .col-debt .money { color: #f87171 !important; }
  .col-profit .money { color: #10b981 !important; }

  .col-debt::before, .col-spent::before, .col-profit::before { 
    font-size: 8px; 
    color: #64748b; 
    margin-bottom: 8px; 
    font-weight: 800; 
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  
  .col-debt::before { content: "CÔNG NỢ"; }
  .col-spent::before { content: "CHI TIÊU"; }
  .col-profit::before { content: "LỢI NHUẬN"; }
  
  .col-debt .mobile-icon, .col-spent .mobile-icon, .col-profit .mobile-icon {
    display: none; /* Keep it clean for tech look */
  }

  /* --- Row 4: Timeline / Last Purchase --- */
  .col-last {
    width: 100% !important;
    flex-basis: 100%;
    display: flex;
    justify-content: space-between !important;
    align-items: center;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid #1e293b;
    padding: 10px 14px !important;
    border-radius: 8px;
    margin-top: 4px;
  }
  .col-last .mobile-icon { width: auto; height: auto; background: transparent; border: none; margin-right: 8px; }
  .col-last::after {
    content: "LẦN MUA CUỐI";
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #475569;
    font-weight: 700;
  }

  .last-purchase-ago { color: #3b82f6; font-weight: bold; }

  /* --- Row 5: Notes --- */
  .col-note {
    width: 100% !important;
    flex-basis: 100%;
    font-size: 13px;
    color: #94a3b8;
    background: linear-gradient(90deg, rgba(234, 179, 8, 0.05), transparent);
    border-left: 2px solid #eab308 !important;
    padding: 10px 14px !important;
    margin-top: 8px;
    font-style: italic;
  }
  .col-note .mobile-icon { color: #eab308; background: transparent; border: none; width: auto; height: auto; }
  .col-note.empty-note { display: none !important; }

  /* --- Floating Delete Action --- */
  .col-action {
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 5;
  }
  .col-action .btn-delete {
    width: 36px;
    height: 36px;
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    color: #f87171;
    transition: all 0.3s;
  }
}
</style>