<template>
  <div class="crm-layout">
    <div class="page">
      <div class="page-head">
      <h1 style="color: rgb(134, 239, 172); text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);font-weight: bold;"><i class="app-ico ri-archive-fill"></i> NHẬP HÀNG VÀO WEB</h1>
      </div>

      <!-- ====== DESKTOP: FORM LEFT | LIST RIGHT ====== -->
      <div class="content-grid">
        <!-- ================= FORM (LEFT) ================= -->
        <section class="box form-box">
          <div class="box-title">
            <div class="title">Form nhập <i class="app-ico ri-arrow-up-box-fill"></i></div>
          </div>

          <!-- ẨN nhưng vẫn nhận giá trị -->
          <div class="hidden-field">
            <label>Mã hàng (ẩn)</label>
            <input v-model="form.Ma_hang" readonly />
          </div>

          <div class="form-panels">
            <div class="panel">
              <div class="panel-header">
                <i class="app-ico ri-layout-grid-line"></i>
                Hình ảnh & tên (Đa ngôn ngữ)
              </div>
              <div class="panel-body panel-grid">
                <!-- TAB 5 NGÔN NGỮ -->
                <div class="field span-12">
                  <label>Ngôn ngữ nội dung món (gộp chung 1 mã hàng)</label>
                  <div class="lang-tabs-bar">
                    <button
                      v-for="lang in SUPPORTED_DATA_LANGS"
                      :key="lang.code"
                      type="button"
                      class="lang-tab-btn"
                      :class="{ active: activeFormLang === lang.code }"
                      @click="activeFormLang = lang.code"
                    >
                      <img :src="lang.flagImg" :alt="lang.short" class="lang-tab-flag" />
                      <span>{{ lang.short }}</span>
                      <span
                        class="lang-tab-dot"
                        :class="{ filled: hasLangContent(form.i18n, lang.code) }"
                      ></span>
                    </button>
                  </div>
                </div>

                <div class="field span-6">
                  <label>ẢNH CHÍNH</label>

                  <div class="upload-wrap">
                    <input type="file" accept="image/*" @change="handleMainImageUpload" />
                    <div class="upload-size-hint">
                      Kích thước chuẩn: <strong>800 × 800 px – 1200 × 1200 px</strong> (vuông 1:1) · Tự nén ≤ 100KB
                    </div>

                    <div v-if="uploadingImg" class="hint"> Đang upload ảnh...</div>

                    <div v-if="form.Main_img" class="img-preview">
                      <img :src="form.Main_img" alt="" />
                      <div class="img-actions">
                        <button class="btn mini danger" type="button" @click="form.Main_img = ''">
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="field span-6 relative" ref="suggestionRef">
                  <label>Tên hàng ({{ getLangShort(activeFormLang) }})</label>
                  <div class="input-icon-wrap">
                    <input 
                      v-model="form.i18n[activeFormLang].Ten_hang" 
                      :placeholder="activeFormLang === 'vi' ? 'VD: Cơm ba chỉ cháy cạnh...' : (form.i18n.vi.Ten_hang ? `Dịch từ: ${form.i18n.vi.Ten_hang}` : `Nhập tên món (${getLangLabel(activeFormLang)})...`)" 
                      @focus="onFocus"
                    />
                    <!-- LOAD ICON -->
                    <div class="input-status-icon">
                      <i v-if="isLoadingProducts" class="ri-loader-4-line spin-icon"></i>
                      <i v-else-if="!form.i18n[activeFormLang].Ten_hang" class="ri-checkbox-circle-fill success-icon"></i>
                    </div>

                    <!-- NÚT XOÁ -->
                     <button 
                      v-if="form.i18n[activeFormLang].Ten_hang || isExistingProductSelected" 
                      type="button" 
                      class="btn-clear-input"
                      @click="clearSearch" 
                      tabindex="-1"
                    >
                      Xóa
                    </button>
                  </div>

                  <!-- SUGGESTION LIST -->
                  <div v-if="showSuggestions && filteredSuggestions.length" class="suggestion-list">
                    <div 
                      v-for="p in filteredSuggestions" 
                      :key="p.Ma_hang" 
                      class="suggestion-item"
                      @click="selectProduct(p)"
                    >
                      <img :src="p.Main_img" v-if="p.Main_img" class="suggest-thumb" />
                      <div class="suggest-info">
                        <div class="suggest-name">{{ resolveSuggestionName(p) }}</div>
                       <div class="suggest-meta">
                          {{ p.Ma_hang }}<template v-if="p.Size"> • {{ p.Size }}</template><template v-if="p.Dvt"> • {{ p.Dvt }}</template>
                          <span :style="{ color: p.Trang_thai === 'Hết hàng' ? '#f87171' : '#4ade80', fontWeight: 'bold', marginLeft: '5px' }">
                            ({{ p.Trang_thai === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng' }})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- MOVED SUB IMAGES HERE -->
                <div class="field span-12">
                   <label>Ảnh phụ (tối đa 6 ảnh) <span class="upload-size-hint-inline">· Kích thước chuẩn: 800 × 800 px – 1200 × 1200 px (vuông 1:1, ≤ 100KB)</span></label>
                   <div class="sub-images-grid">
                      <!-- IMG 1 -->
                      <div class="sub-img-item">
                        <div class="upload-wrap-mini">
                          <input type="file" accept="image/*" @change="(e) => handleSubImageUpload(e, 'img_1')" />
                          <div v-if="uploadingSubImg.img_1" class="hint-mini">Uploading...</div>
                          <div v-if="form.img_1" class="img-preview-mini">
                            <img :src="form.img_1" alt="" />
                            <button class="btn-remove-mini" type="button" @click="form.img_1 = ''"><i class="app-ico ri-close-line"></i></button>
                          </div>
                          <div v-else class="placeholder-mini">Ảnh 1</div>
                        </div>
                      </div>

                      <!-- IMG 2 -->
                      <div class="sub-img-item">
                        <div class="upload-wrap-mini">
                          <input type="file" accept="image/*" @change="(e) => handleSubImageUpload(e, 'img_2')" />
                          <div v-if="uploadingSubImg.img_2" class="hint-mini">Uploading...</div>
                          <div v-if="form.img_2" class="img-preview-mini">
                            <img :src="form.img_2" alt="" />
                            <button class="btn-remove-mini" type="button" @click="form.img_2 = ''">×</button>
                          </div>
                          <div v-else class="placeholder-mini">Ảnh 2</div>
                        </div>
                      </div>

                      <!-- IMG 3 -->
                      <div class="sub-img-item">
                        <div class="upload-wrap-mini">
                          <input type="file" accept="image/*" @change="(e) => handleSubImageUpload(e, 'img_3')" />
                          <div v-if="uploadingSubImg.img_3" class="hint-mini">Uploading...</div>
                          <div v-if="form.img_3" class="img-preview-mini">
                            <img :src="form.img_3" alt="" />
                            <button class="btn-remove-mini" type="button" @click="form.img_3 = ''">×</button>
                          </div>
                          <div v-else class="placeholder-mini">Ảnh 3</div>
                        </div>
                      </div>

                      <!-- IMG 4 -->
                      <div class="sub-img-item">
                        <div class="upload-wrap-mini">
                          <input type="file" accept="image/*" @change="(e) => handleSubImageUpload(e, 'img_4')" />
                          <div v-if="uploadingSubImg.img_4" class="hint-mini">Uploading...</div>
                          <div v-if="form.img_4" class="img-preview-mini">
                            <img :src="form.img_4" alt="" />
                            <button class="btn-remove-mini" type="button" @click="form.img_4 = ''">×</button>
                          </div>
                          <div v-else class="placeholder-mini">Ảnh 4</div>
                        </div>
                      </div>

                      <!-- IMG 5 -->
                      <div class="sub-img-item">
                        <div class="upload-wrap-mini">
                          <input type="file" accept="image/*" @change="(e) => handleSubImageUpload(e, 'img_5')" />
                          <div v-if="uploadingSubImg.img_5" class="hint-mini">Uploading...</div>
                          <div v-if="form.img_5" class="img-preview-mini">
                            <img :src="form.img_5" alt="" />
                            <button class="btn-remove-mini" type="button" @click="form.img_5 = ''">×</button>
                          </div>
                          <div v-else class="placeholder-mini">Ảnh 5</div>
                        </div>
                      </div>

                      <!-- IMG 6 -->
                      <div class="sub-img-item">
                        <div class="upload-wrap-mini">
                          <input type="file" accept="image/*" @change="(e) => handleSubImageUpload(e, 'img_6')" />
                          <div v-if="uploadingSubImg.img_6" class="hint-mini">Uploading...</div>
                          <div v-if="form.img_6" class="img-preview-mini">
                            <img :src="form.img_6" alt="" />
                            <button class="btn-remove-mini" type="button" @click="form.img_6 = ''">×</button>
                          </div>
                          <div v-else class="placeholder-mini">Ảnh 6</div>
                        </div>
                      </div>
                    </div>
                </div>

                <div class="field span-12">
                  <label>Mô tả ({{ getLangShort(activeFormLang) }})</label>
                  <textarea
                    v-model="form.i18n[activeFormLang].Mo_ta"
                    rows="4"
                    :placeholder="activeFormLang === 'vi' ? 'Mô tả ngắn gọn...' : (form.i18n.vi.Mo_ta ? `Dịch từ: ${form.i18n.vi.Mo_ta}` : `Mô tả (${getLangLabel(activeFormLang)})...`)"
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="panel">
              <div class="panel-header">
                <i class="app-ico ri-stack-line"></i>
                Chi tiết sản phẩm
              </div>
              <div class="panel-body panel-grid">
                <div class="field span-6">
                  <label>Danh mục ({{ getLangShort(activeFormLang) }})</label>
                  <input
                    v-model="form.i18n[activeFormLang].Danh_muc"
                    :placeholder="activeFormLang === 'vi' ? 'VD: Cơm, Bún - Phở - Mì, Đồ uống...' : (form.i18n.vi.Danh_muc ? `Dịch từ: ${form.i18n.vi.Danh_muc}` : 'Danh mục...')"
                  />
                </div>
                <div class="field span-6">
                  <label>ĐVT ({{ getLangShort(activeFormLang) }})</label>
                  <input
                    v-model="form.i18n[activeFormLang].Dvt"
                    :placeholder="activeFormLang === 'vi' ? 'VD: Phần, Tô, Ly, Dĩa...' : (form.i18n.vi.Dvt ? `Dịch từ: ${form.i18n.vi.Dvt}` : 'ĐVT...')"
                  />
                </div>
                <div class="field span-4">
                  <label>Size</label>
                  <input v-model="form.Size" placeholder="VD: S/M/L, Lớn/Nhỏ..." />
                </div>
                <div class="field span-4">
                  <label>Trạng thái</label>
                  <select v-model="form.Trang_thai">
                    <option value="Còn hàng">Còn hàng</option>
                    <option value="Hết hàng">Hết hàng</option>
                  </select>
                </div>
                <div class="field span-4">
                  <label>Đơn vị tiền tệ</label>
                  <input v-model="form.Don_vi_tien_te" placeholder="VD: P, VND, USD..." />
                </div>
              </div>
            </div>
<div class="panel">
  <div class="panel-header">
    <i class="app-ico ri-price-tag-3-line"></i>
    Giá gốc & Giá bán
  </div>
  <div class="panel-body panel-grid">
    <div class="field span-6">
      <label>Giá gốc</label>
      <div class="money-wrap">
        <input
          type="text"
          inputmode="numeric"
          autocomplete="off"
          class="money-input"
          :value="fmtMoneyInput(form.Gia_goc)"
          @input="(e) => (form.Gia_goc = parseMoneyInput(e.target.value))"
          placeholder="0"
        />
      </div>
    </div>
    <div class="field span-6">
      <label>Giá bán</label>
      <div class="money-wrap">
        <input
          type="text"
          inputmode="numeric"
          autocomplete="off"
          class="money-input"
          :value="fmtMoneyInput(form.Gia_ban)"
          @input="(e) => (form.Gia_ban = parseMoneyInput(e.target.value))"
          placeholder="0"
        />
      </div>
    </div>
    <div class="field span-12">
      <label>CK NCC (% giá gốc hoặc Tiền trực tiếp)</label>
      <div class="ncc-disc-input-row">
        <div class="ncc-type-toggle" role="group">
          <button
            type="button"
            class="ncc-type-btn"
            :class="{ active: form.Ncc_loai_giam !== 'money' }"
            @click="form.Ncc_loai_giam = 'percent'"
          >
            %
          </button>
          <button
            type="button"
            class="ncc-type-btn"
            :class="{ active: form.Ncc_loai_giam === 'money' }"
            @click="form.Ncc_loai_giam = 'money'"
          >
            Tiền ({{ form.Don_vi_tien_te || 'P' }})
          </button>
        </div>
        <input
          type="number"
          min="0"
          step="any"
          v-model.number="form.Ncc_gia_tri_giam"
          placeholder="0"
          class="ncc-val-input"
        />
      </div>
    </div>
  </div>
</div>


          </div>
          <!-- ACTIONS -->
          <div class="actions">
            <button class="btn primary" type="button" @click="themHang" style="font-size: 20px;">
              Thêm hàng 
            </button>

            <!-- MOBILE: nút xem hàng (badge) + nút hoàn thành ngay bên dưới -->
            <button
              v-if="isMobile && list.length"
              class="btn secondary"
              type="button"
              @click="showMobileList = true"
            >
              Xem hàng vừa thêm
              <span class="badge">{{ list.length }}</span>
            </button>

            <button
              v-if="isMobile && list.length"
              class="btn success"
              type="button"
              @click="submit"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spin"></span>
              {{ submitting ? 'Đang gửi...' : 'Hoàn thành' }} <i class="app-ico ri-checkbox-circle-line"></i>
            </button>
          </div>

          <!-- ✅ CÁC NÚT “MỞ RỘNG” HIỂN THỊ LUÔN (DESKTOP + MOBILE) -->
          <div class="advanced">
            <div class="advanced-grid">
              <button class="btn warning" type="button" @click="showBulkModal = true">
                Nhập hàng loạt <i class="app-ico ri-list-check"></i>
              </button>

              <!-- Import Excel -->
              <button class="btn info" type="button" @click="excelInput?.click()" style="background-color: green;">
                <i class="app-ico ri-file-excel-2-fill"></i>
                Nhập bằng Excel
              </button>
              <input
                ref="excelInput"
                type="file"
                accept=".xlsx,.xls"
                class="hidden-input"
                @change="importExcel"
              />

              <!-- Download template -->
              <button
                type="button"
                class="btn info outline"
                style="text-decoration:underline;background-color: white;color:green;font-weight: bold;"
                @click="downloadExcelTemplate"
              >
                <i class="app-ico ri-download-2-line"></i>
                Tải file mẫu excel
              </button>

              <!-- Bulk image -->
              <button class="btn primary" type="button" @click="triggerBulkImageUpload">
                Upload ảnh hàng loạt <i class="app-ico ri-upload-2-fill"></i>
              </button>
              <input
                ref="bulkImageInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden-input"
                @change="handleBulkImageUpload"
              />

              <button
                v-if="bulkImageUrls.length"
                class="btn success"
                type="button"
                @click="showBulkImageModal = true"
              >
                Xem ảnh đã upload ({{ bulkImageUrls.length }})
              </button>
            </div>

            <div v-if="uploadingBulkImg" class="hint" style="margin-top:10px">
              Đang upload ảnh hàng loạt...
            </div>
            <div class="upload-size-hint" style="margin-top:8px">
              Kích thước chuẩn ảnh hàng loạt: <strong>800 × 800 px – 1200 × 1200 px</strong> (vuông 1:1) · Tự nén ≤ 100KB
            </div>
          </div>
        </section>

        <!-- ================= LIST (RIGHT) - DESKTOP ONLY ================= -->
        <section v-if="!isMobile" class="box list-box">
          <div class="box-title">
            <div class="title"> 
               Danh sách hàng chờ nhập
              <span v-if="list.length" class="count">({{ list.length }})</span>
            </div>
          </div>

          <div v-if="!list.length" class="empty empty-fill">
            Chưa có hàng nào trong danh sách. Nhập thông tin bên trái rồi bấm <b>Thêm hàng</b>.
          </div>

          <div v-else class="table-wrap">
            <table class="table">
         <thead>
  <tr>
    <th>STT</th>
    <th>Ảnh</th>
    <th>Ảnh phụ</th>
    <th>Mã hàng</th>
    <th>Tên hàng</th>
    <th>Mô tả</th>
    <th>Danh mục</th>
    <th>ĐVT</th>
    <th>Size</th>
    <th>Giá gốc</th>
    <th>Giá bán</th>
    <th>Tiền tệ</th>
    <th>Ngôn ngữ</th>
    <th>Trạng thái</th>
    <th></th>
  </tr>
</thead>

              <tbody>
                <tr
                  v-for="(h, i) in list"
                  :key="i"
                  class="row"
                  @click="openEdit(i)"
                >
                  <td>{{ i + 1 }}</td>

                  <td>
                    <div class="thumb">
                      <img v-if="h.Main_img" :src="h.Main_img" alt="" />
                      <div v-else class="thumb-null">No</div>
                    </div>
                  </td>
                  <td class="sub-images-cell">
                    <div class="sub-image-grid">
                      <template v-for="(field, idx) in SUB_IMAGE_FIELDS" :key="field">
                        <div class="sub-thumb" :class="{ empty: !h[field] }">
                          <img v-if="h[field]" :src="h[field]" alt="Ảnh phụ" />
                          <div v-else class="placeholder-mini">Ảnh {{ idx + 1 }}</div>
                        </div>
                      </template>
                    </div>
                  </td>

                  <td class="mono">{{ h.Ma_hang }}</td>
                  <td class="cell-strong">{{ h.Ten_hang }}</td>

                  <td class="ellipsis">{{ h.Mo_ta }}</td>

                  <td>{{ h.Danh_muc }}</td>
                  <td>{{ h.Dvt }}</td>
                  <td>{{ h.Size }}</td>
                  <td class="money">
                    {{ fmtMoney(h.Gia_goc) }}
                    <div v-if="Number(h.Ncc_gia_tri_giam || 0) > 0" class="ncc-mini-tag">
                      NCC {{ formatNccDiscountLabel(h, h.Don_vi_tien_te || 'P') }}
                    </div>
                  </td>
                  <td class="money strong">{{ fmtMoney(h.Gia_ban) }}</td>
                  <td><span class="tag currency">{{ h.Don_vi_tien_te || 'P' }}</span></td>
                  <td>
                    <div class="lang-badges-wrap">
                      <span
                        v-for="code in getProductTranslatedLangs(h)"
                        :key="code"
                        class="lang-pill"
                      >
                        {{ getLangShort(code) }}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span class="tag" :class="h.Trang_thai === 'Còn hàng' ? 'ok' : 'bad'">
                      {{ h.Trang_thai }}
                    </span>
                  </td>

                  <td>
                    <button class="btn danger mini" type="button" @click.stop="removeItem(i)">
                      <i class="app-ico ri-close-line"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="submit-foot" v-if="list.length">
            <button class="btn success full" type="button" @click="submit" :disabled="submitting">
              <span v-if="submitting" class="spin"></span>
              {{ submitting ? 'Đang gửi...' : 'Hoàn thành' }} <i class="app-ico ri-checkbox-circle-line"></i>
            </button>
          </div>
        </section>
      </div>

      <!-- ================= BULK MODAL ================= -->
<div v-if="showBulkModal" class="modal-mask" @click.self="closeBulk">
  <div class="modal-box wide">
    <h3>Nhập hàng loạt</h3>

    <textarea v-model="bulkText" rows="8" placeholder="Mỗi dòng là 1 giá trị"></textarea>

    <div class="bulk-buttons">
      <button class="btn chip" @click="applyBulk('Ten_hang')"><i class="app-ico ri-add-circle-fill"></i>Tên hàng (VI)</button>
      <button class="btn chip" @click="applyBulk('Main_img')"><i class="ri-add-circle-fill"></i> Ảnh chính (URL)</button>

      <!-- ✅ 6 NÚT ẢNH PHỤ -->
      <button class="btn chip" @click="applyBulk('img_1')"><i class="ri-add-circle-fill"></i> Ảnh phụ 1</button>
      <button class="btn chip" @click="applyBulk('img_2')"><i class="ri-add-circle-fill"></i> Ảnh phụ 2</button>
      <button class="btn chip" @click="applyBulk('img_3')"><i class="ri-add-circle-fill"></i> Ảnh phụ 3</button>
      <button class="btn chip" @click="applyBulk('img_4')"><i class="ri-add-circle-fill"></i> Ảnh phụ 4</button>
      <button class="btn chip" @click="applyBulk('img_5')"><i class="ri-add-circle-fill"></i> Ảnh phụ 5</button>
      <button class="btn chip" @click="applyBulk('img_6')"><i class="ri-add-circle-fill"></i> Ảnh phụ 6</button>

      <button class="btn chip" @click="applyBulk('Danh_muc')"><i class="ri-add-circle-fill"></i> Danh mục (VI)</button>
      <button class="btn chip" @click="applyBulk('Dvt')"><i class="ri-add-circle-fill"></i> ĐVT (VI)</button>
      <button class="btn chip" @click="applyBulk('Size')"><i class="ri-add-circle-fill"></i> Size</button>

      <button class="btn chip" @click="applyBulk('Gia_goc')"><i class="ri-add-circle-fill"></i> Giá gốc</button>
      <button class="btn chip" @click="applyBulk('Gia_ban')"><i class="ri-add-circle-fill"></i> Giá bán</button>
      <button class="btn chip" @click="applyBulk('Don_vi_tien_te')"><i class="ri-add-circle-fill"></i> Tiền tệ</button>
      <button class="btn chip" @click="applyBulk('Trang_thai')"><i class="ri-add-circle-fill"></i> Trạng thái</button>

      <button class="btn chip" @click="applyBulk('Mo_ta')"><i class="ri-add-circle-fill"></i> Mô tả (VI)</button>
    </div>

    <div class="modal-actions">
      <button class="btn danger" @click="closeBulk"> Đóng</button>
    </div>
  </div>
</div>

      <!-- ================= MODAL ẢNH (XEM + COPY ALL, BỎ COPY ONE) ================= -->
      <div v-if="showBulkImageModal" class="modal-mask" @click.self="showBulkImageModal = false">
        <div class="modal-box wide">
          <h3><i class="app-ico ri-image-fill"></i>Ảnh đã upload</h3>

          <div class="img-link-list">
            <div v-for="(url, i) in bulkImageUrls" :key="i" class="img-link-item">
              <img :src="url" alt="" />
              <input :value="url" readonly />
            </div>
          </div>

          <div class="copy-all">
            <button type="button" class="btn success" @click="copyAllLinks">
             Copy toàn bộ link
            </button>
            <button type="button" class="btn danger" @click="showBulkImageModal = false">
              Đóng
            </button>
          </div>
        </div>
      </div>

      <!-- ================= MOBILE LIST MODAL (THẺ HÀNG) ================= -->
      <div v-if="showMobileList" class="modal-mask" @click.self="showMobileList = false">
        <div class="modal-box mobile-sheet">
          <div class="sheet-head">
            <div>
              <div class="sheet-title">Hàng đã thêm ({{ list.length }})</div>
              <p class="sheet-subtitle">Kiểm tra lại trước khi gửi</p>
            </div>
            <button class="btn ghost mini" type="button" @click="showMobileList = false"><i class="app-ico ri-close-line"></i></button>
          </div>

          <div v-if="!list.length" class="empty sheet-empty">
            Chưa có hàng nào.
          </div>

          <div v-else class="card-list">
            <div v-for="(h, i) in list" :key="i" class="item-card">
              <div class="left">
                <div class="thumb big">
                  <img v-if="h.Main_img" :src="h.Main_img" alt="" />
                  <div v-else class="thumb-null">No</div>
                </div>
              </div>

                <div class="mid">
                <div class="name">{{ h.Ten_hang }}</div>
                <div class="price">
                  <span class="money strong">{{ fmtMoney(h.Gia_ban, h.Don_vi_tien_te) }}</span>
                </div>
                <button class="link" type="button" @click="openDetail(i)">
                  XEM CHI TIẾT
                </button>
              </div>

              <div class="right">
                <button class="btn danger mini" type="button" @click="removeItem(i)"><i class="app-ico ri-close-line"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= DETAIL MODAL (FULL INFO) ================= -->
      <div v-if="showDetailModal" class="modal-mask" @click.self="showDetailModal = false">
        <div class="modal-box wide">
          <h3><i class="app-ico ri-information-line"></i> Chi tiết hàng</h3>

          <div class="detail-grid">
            <div class="detail-img">
              <img v-if="detailItem?.Main_img" :src="detailItem.Main_img" alt="" />
              <div v-else class="detail-img-null">No image</div>
            </div>
                     <div class="detail-sub-images">
              <div class="sub-images-grid detail">
                <div v-for="slot in 6" :key="slot" class="sub-img-item">
                  <div
                    class="sub-thumb"
                    :class="{ empty: !detailItem?.['img_' + slot] }"
                  >
                    <img
                      v-if="detailItem?.['img_' + slot]"
                      :src="detailItem?.['img_' + slot]"
                      alt="Ảnh phụ"
                    />
                    <div v-else class="placeholder-mini">Ảnh {{ slot }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="detail-info">
              <div class="kv"><span class="k">Tên hàng:</span><span class="v">{{ detailItem?.Ten_hang }}</span></div>
              <div class="kv"><span class="k">Mã hàng:</span><span class="v mono">{{ detailItem?.Ma_hang }}</span></div>

              <div class="kv"><span class="k">Danh mục:</span><span class="v">{{ detailItem?.Danh_muc }}</span></div>
              <div class="kv"><span class="k">ĐVT:</span><span class="v">{{ detailItem?.Dvt }}</span></div>
              <div class="kv"><span class="k">Size:</span><span class="v">{{ detailItem?.Size }}</span></div>

              <div class="kv"><span class="k">Giá gốc:</span><span class="v money">{{ fmtMoney(detailItem?.Gia_goc, detailItem?.Don_vi_tien_te) }}</span></div>
              <div class="kv"><span class="k">Giá bán:</span><span class="v money strong">{{ fmtMoney(detailItem?.Gia_ban, detailItem?.Don_vi_tien_te) }}</span></div>
              <div class="kv">
                <span class="k">Tiền tệ:</span>
                <span class="v"><span class="tag currency">{{ detailItem?.Don_vi_tien_te || 'P' }}</span></span>
              </div>

              <div class="kv">
                <span class="k">Ngôn ngữ:</span>
                <span class="v">
                  <span class="lang-badges-wrap">
                    <span
                      v-for="code in getProductTranslatedLangs(detailItem)"
                      :key="code"
                      class="lang-pill"
                    >
                      {{ getLangShort(code) }}
                    </span>
                  </span>
                </span>
              </div>

              <div class="kv">
                <span class="k">Trạng thái:</span>
                <span class="v">
                  <span class="tag" :class="detailItem?.Trang_thai === 'Còn hàng' ? 'ok' : 'bad'">
                    {{ detailItem?.Trang_thai }}
                  </span>
                </span>
              </div>
            </div>

            <div class="detail-desc">
              <div class="k">Mô tả:</div>
              <div class="desc">{{ detailItem?.Mo_ta || '—' }}</div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn danger" type="button" @click="showDetailModal = false"> Đóng</button>
            <button
              class="btn primary"
              type="button"
              @click="openEdit(detailIndex); showDetailModal = false"
              v-if="detailIndex !== null"
            >
              Sửa thông tin
            </button>
          </div>
        </div>
      </div>

      <!-- ================= MODAL EDIT ITEM ================= -->
      <div v-if="showEditModal" class="modal-mask" @click.self="showEditModal = false">
        <div class="modal-box wide">
          <h3>Chỉnh sửa hàng hóa</h3>

          <div class="edit-head">
            <div class="edit-img">
              <img v-if="editForm.Main_img" :src="editForm.Main_img" alt="" />
              <div v-else class="detail-img-null">No image</div>
            </div>

            <div class="edit-actions">
              <button type="button" class="btn primary" @click="editImageInput?.click()">
                <i class="app-ico ri-image-add-line"></i>Đổi ảnh
              </button>
              <div class="upload-size-hint">
                Kích thước chuẩn: <strong>800 × 800 px – 1200 × 1200 px</strong> (vuông 1:1) · Tự nén ≤ 100KB
              </div>

              <div v-if="uploadingEditImg" class="hint"> Đang upload ảnh...</div>

              <input
                ref="editImageInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleEditImageUpload"
              />
            </div>
          </div>

          <div class="edit-sub-images">
            <div class="upload-size-hint" style="margin-bottom:6px">
              Ảnh phụ: kích thước chuẩn <strong>800 × 800 px – 1200 × 1200 px</strong> (vuông 1:1) · Tự nén ≤ 100KB
            </div>
            <div class="sub-images-grid edit">
              <div
                v-for="slot in 6"
                :key="slot"
                class="sub-img-item"
              >
                <div class="upload-wrap-mini">
                  <input
                    type="file"
                    accept="image/*"
                    @change="(e) => handleEditSubImageUpload(e, 'img_' + slot)"
                  />
                  <div v-if="uploadingEditSubImg['img_' + slot]" class="hint-mini">Uploading...</div>
                  <div v-if="editForm['img_' + slot]" class="img-preview-mini">
                    <img :src="editForm['img_' + slot]" alt="Ảnh phụ" />
                    <button
                      class="btn-remove-mini"
                      type="button"
                      @click="editForm['img_' + slot] = ''"
                    >
                      <i class="app-ico ri-close-line"></i>
                    </button>
                  </div>
                  <div v-else class="placeholder-mini">Ảnh {{ slot }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-grid" v-if="editForm.i18n">
            <div class="field span-12">
              <label>Ngôn ngữ nội dung món</label>
              <div class="lang-tabs-bar">
                <button
                  v-for="lang in SUPPORTED_DATA_LANGS"
                  :key="lang.code"
                  type="button"
                  class="lang-tab-btn"
                  :class="{ active: activeEditLang === lang.code }"
                  @click="activeEditLang = lang.code"
                >
                  <img :src="lang.flagImg" :alt="lang.short" class="lang-tab-flag" />
                  <span>{{ lang.short }}</span>
                  <span
                    class="lang-tab-dot"
                    :class="{ filled: hasLangContent(editForm.i18n, lang.code) }"
                  ></span>
                </button>
              </div>
            </div>

            <div class="field span-6">
              <label>Mã hàng</label>
              <input v-model="editForm.Ma_hang" readonly />
            </div>

            <div class="field span-6">
              <label>Tên hàng ({{ getLangShort(activeEditLang) }})</label>
              <input
                v-model="editForm.i18n[activeEditLang].Ten_hang"
                :placeholder="activeEditLang === 'vi' ? 'Tên hàng...' : (editForm.i18n.vi.Ten_hang ? `Dịch từ: ${editForm.i18n.vi.Ten_hang}` : 'Tên hàng...')"
              />
            </div>

            <div class="field span-4">
              <label>Danh mục ({{ getLangShort(activeEditLang) }})</label>
              <input
                v-model="editForm.i18n[activeEditLang].Danh_muc"
                :placeholder="activeEditLang === 'vi' ? 'Danh mục...' : (editForm.i18n.vi.Danh_muc ? `Dịch từ: ${editForm.i18n.vi.Danh_muc}` : 'Danh mục...')"
              />
            </div>

            <div class="field span-4">
              <label>ĐVT ({{ getLangShort(activeEditLang) }})</label>
              <input
                v-model="editForm.i18n[activeEditLang].Dvt"
                :placeholder="activeEditLang === 'vi' ? 'ĐVT...' : (editForm.i18n.vi.Dvt ? `Dịch từ: ${editForm.i18n.vi.Dvt}` : 'ĐVT...')"
              />
            </div>

            <div class="field span-4">
              <label>Size</label>
              <input v-model="editForm.Size" />
            </div>

            <div class="field span-4">
              <label>Tiền tệ</label>
              <input v-model="editForm.Don_vi_tien_te" placeholder="P" />
            </div>

            <div class="field span-4">
              <label>Giá gốc</label>
              <div class="money-wrap">
                <input
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  class="money-input"
                  :value="fmtMoneyInput(editForm.Gia_goc)"
                  @input="(e) => (editForm.Gia_goc = parseMoneyInput(e.target.value))"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="field span-4">
              <label>Giá bán</label>
              <div class="money-wrap">
                <input
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  class="money-input"
                  :value="fmtMoneyInput(editForm.Gia_ban)"
                  @input="(e) => (editForm.Gia_ban = parseMoneyInput(e.target.value))"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="field span-12">
              <label>CK NCC (% giá gốc hoặc Tiền trực tiếp)</label>
              <div class="ncc-disc-input-row">
                <div class="ncc-type-toggle" role="group">
                  <button
                    type="button"
                    class="ncc-type-btn"
                    :class="{ active: editForm.Ncc_loai_giam !== 'money' }"
                    @click="editForm.Ncc_loai_giam = 'percent'"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    class="ncc-type-btn"
                    :class="{ active: editForm.Ncc_loai_giam === 'money' }"
                    @click="editForm.Ncc_loai_giam = 'money'"
                  >
                    Tiền ({{ editForm.Don_vi_tien_te || 'P' }})
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  v-model.number="editForm.Ncc_gia_tri_giam"
                  placeholder="0"
                  class="ncc-val-input"
                />
              </div>
            </div>

            <div class="field span-12">
              <label>Trạng thái</label>
              <select v-model="editForm.Trang_thai">
                <option value="Còn hàng">Còn hàng</option>
                <option value="Hết hàng">Hết hàng</option>
              </select>
            </div>

            <div class="field span-12">
              <label>Mô tả ({{ getLangShort(activeEditLang) }})</label>
              <textarea
                v-model="editForm.i18n[activeEditLang].Mo_ta"
                rows="4"
                :placeholder="activeEditLang === 'vi' ? 'Mô tả...' : (editForm.i18n.vi.Mo_ta ? `Dịch từ: ${editForm.i18n.vi.Mo_ta}` : 'Mô tả...')"
              ></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn danger" type="button" @click="showEditModal = false"> Hủy</button>
            <button class="btn success" type="button" @click="saveEdit"> Lưu</button>
          </div>
        </div>
      </div>

      <!-- ================= NOTIFY MODAL ================= -->
    </div>

    <div v-if="confirmBox.show" class="modal-mask" @click.self="confirmCancel">
      <div class="notify-box">
        <div class="notify-title">⚠️ {{ confirmBox.title }}</div>
        <div class="notify-msg">{{ confirmBox.message }}</div>

        <div class="notify-actions">
          <button class="btn success" type="button" @click="confirmOK">OK</button>
          <button class="btn ghost" type="button" @click="confirmCancel">Hủy</button>
        </div>
      </div>
    </div>
    <div v-if="notify.open" class="modal-mask" @click.self="closeNotify">
      <div class="notify-box" :class="notify.type">
        <div class="notify-title">{{ notify.title }}</div>
        <div class="notify-msg">{{ notify.message }}</div>

        <div class="notify-actions">
          <button class="btn primary" type="button" @click="closeNotify">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as XLSX from 'xlsx'
import { onBeforeRouteLeave } from 'vue-router'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToImgBB } from '@/utils/imageUpload.js'
import {
  normalizeNccDiscountType,
  normalizeNccDiscountValue,
  formatNccDiscountLabel,
} from '@/utils/nccDiscount'
import {
  SUPPORTED_DATA_LANGS,
  createEmptyProductI18n,
  normalizeProductI18n,
  syncProductWithI18n,
  resolveProductField,
  getProductTranslatedLangs,
  productMatchesKeyword,
} from '@/utils/i18nData'

/* ================= CONFIG ================= */
const PRODUCT_IMAGE_COMPRESS_OPTS = {
  targetKB: 100,
  maxWidth: 1200,
  maxHeight: 1200,
}

/* ================= STATE ================= */
const list = ref([])
const productList = ref([])
const showSuggestions = ref(false)
const isLoadingProducts = ref(false)
const isAutoFilling = ref(false)
const isExistingProductSelected = ref(false)

const activeFormLang = ref('vi')
const activeEditLang = ref('vi')

const isDirty = ref(false)

const showBulkModal = ref(false)
const bulkText = ref('')

const uploadingImg = ref(false)
const uploadingBulkImg = ref(false)
const uploadingEditImg = ref(false)
const uploadingEditSubImg = ref({
  img_1: false,
  img_2: false,
  img_3: false,
  img_4: false,
  img_5: false,
  img_6: false
})

const bulkImageUrls = ref([])
const showBulkImageModal = ref(false)

const bulkImageInput = ref(null)
const excelInput = ref(null)
const suggestionRef = ref(null)

const showEditModal = ref(false)
const editIndex = ref(null)
const editForm = ref({})
const editImageInput = ref(null)

/* MOBILE */
const isMobile = ref(false)
const showMobileList = ref(false)

/* Detail modal */
const showDetailModal = ref(false)
const detailItem = ref(null)
const detailIndex = ref(null)

/* Submit loading */
const submitting = ref(false)

/* Notify modal (replace alert) */
const notify = ref({
  open: false,
  title: '',
  message: '',
  type: 'info'
})
function openNotify(title, message, type = 'info') {
  notify.value = { open: true, title, message, type }
}
function closeNotify() {
  notify.value.open = false
}

/* ================= LANG HELPERS ================= */
function getLangShort(code) {
  return SUPPORTED_DATA_LANGS.find((l) => l.code === code)?.short || String(code || 'vi').toUpperCase()
}

function getLangLabel(code) {
  return SUPPORTED_DATA_LANGS.find((l) => l.code === code)?.label || code
}

function hasLangContent(i18nObj, code) {
  if (!i18nObj || !i18nObj[code]) return false
  return Boolean(String(i18nObj[code].Ten_hang || '').trim())
}

function resolveSuggestionName(p) {
  return resolveProductField(p, 'Ten_hang', activeFormLang.value) || p.Ten_hang || ''
}

/* ================= FORM ================= */
const emptyForm = () => ({
  Ma_hang: '',
  Ten_hang: '',
  Main_img: '',
  Mo_ta: '',
  Danh_muc: '',
  Size: '',
  Dvt: '',
  Gia_goc: '',
  Gia_ban: '',
  Ncc_loai_giam: 'percent',
  Ncc_gia_tri_giam: 0,
  Trang_thai: 'Còn hàng',
  Don_vi_tien_te: 'P',
  img_1: '',
  img_2: '',
  img_3: '',
  img_4: '',
  img_5: '',
  img_6: '',
  i18n: createEmptyProductI18n(),
  _fromExisting: false,
})

const form = ref(emptyForm())
const uploadingSubImg = ref({
  img_1: false,
  img_2: false,
  img_3: false,
  img_4: false,
  img_5: false,
  img_6: false
})

async function loadProducts() {
  isLoadingProducts.value = true
  try {
    const json = await getOneSheet('hang_hoa')
    productList.value = json.data || []
  } catch (err) {
    console.error('❌ Lỗi load hàng hóa:', err)
  } finally {
    isLoadingProducts.value = false
  }
}

function selectProduct(p) {
  isAutoFilling.value = true
  isExistingProductSelected.value = true

  const i18n = normalizeProductI18n(p)
  form.value = {
    ...emptyForm(),
    Ma_hang: p.Ma_hang || '',
    Ten_hang: i18n.vi.Ten_hang || p.Ten_hang || '',
    Main_img: p.Main_img || '',
    Mo_ta: i18n.vi.Mo_ta || p.Mo_ta || '',
    Danh_muc: i18n.vi.Danh_muc || p.Danh_muc || '',
    Size: p.Size || '',
    Dvt: i18n.vi.Dvt || p.Dvt || '',
    Gia_goc: p.Gia_goc ?? '',
    Gia_ban: p.Gia_ban ?? '',
    Ncc_loai_giam: normalizeNccDiscountType(p.Ncc_loai_giam),
    Ncc_gia_tri_giam: normalizeNccDiscountValue(p.Ncc_gia_tri_giam),
    Trang_thai: p.Trang_thai || 'Còn hàng',
    Don_vi_tien_te: p.Don_vi_tien_te || 'P',
    img_1: p.img_1 || '',
    img_2: p.img_2 || '',
    img_3: p.img_3 || '',
    img_4: p.img_4 || '',
    img_5: p.img_5 || '',
    img_6: p.img_6 || '',
    i18n,
    _fromExisting: true,
  }
  showSuggestions.value = false

  setTimeout(() => {
    isAutoFilling.value = false
  }, 100)
}

const filteredSuggestions = ref([])

function filterProducts(val) {
  const q = String(val || '').trim()
  if (!q) {
    filteredSuggestions.value = productList.value.slice(0, 50)
    return
  }
  filteredSuggestions.value = productList.value
    .filter((p) => productMatchesKeyword(p, q))
    .slice(0, 20)
}

function onFocus() {
  showSuggestions.value = true
  filterProducts(form.value.i18n[activeFormLang.value]?.Ten_hang || '')
}

function clearSearch() {
  isExistingProductSelected.value = false
  form.value = emptyForm()
  activeFormLang.value = 'vi'
  onFocus()
}

/* ================= AUTO SYNC I18N & GEN MÃ HÀNG ================= */
function genMaHangFE(tenHang) {
  const clean = String(tenHang || '').trim()
  if (!clean) return ''
  const ascii = clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
  const code = ascii
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, '')[0]?.toUpperCase())
    .filter(Boolean)
    .join('')
  return code || 'SP'
}

watch(
  () => form.value.i18n,
  (i18nVal) => {
    if (!i18nVal) return
    const currentInput = i18nVal[activeFormLang.value]?.Ten_hang || ''
    if (!isAutoFilling.value) {
      filterProducts(currentInput)
    }

    const primaryName =
      String(i18nVal.vi?.Ten_hang || '').trim() ||
      String(i18nVal.en?.Ten_hang || '').trim() ||
      String(i18nVal['zh-CN']?.Ten_hang || '').trim() ||
      String(i18nVal.fil?.Ten_hang || '').trim() ||
      String(i18nVal.ko?.Ten_hang || '').trim()

    form.value.Ten_hang = primaryName
    form.value.Danh_muc = String(i18nVal.vi?.Danh_muc || '').trim()
    form.value.Dvt = String(i18nVal.vi?.Dvt || '').trim()
    form.value.Mo_ta = String(i18nVal.vi?.Mo_ta || '').trim()

    if (isAutoFilling.value || isExistingProductSelected.value) return
    form.value.Ma_hang = primaryName ? genMaHangFE(primaryName) : ''
  },
  { deep: true }
)

watch(
  () => editForm.value?.i18n?.vi?.Ten_hang,
  (newName) => {
    if (!showEditModal.value || !editForm.value) return
    if (editForm.value._fromExisting) return
    const fallbackName =
      String(newName || '').trim() ||
      String(editForm.value.i18n?.en?.Ten_hang || '').trim()
    editForm.value.Ma_hang = fallbackName ? genMaHangFE(fallbackName) : ''
  }
)

/* ================= ADD TẠM ================= */
function themHang() {
  const synced = syncProductWithI18n(form.value)
  if (!synced.Ten_hang) {
    openNotify('⚠️ Thiếu thông tin', 'Vui lòng nhập Tên hàng (ít nhất Tiếng Việt hoặc Tiếng Anh)!', 'info')
    return
  }

  if (!synced.Ma_hang) {
    synced.Ma_hang = genMaHangFE(synced.Ten_hang)
  }

  const keepCurrency = form.value.Don_vi_tien_te || 'P'

  list.value.push({
    ...synced,
    Don_vi_tien_te: keepCurrency,
    _fromExisting: Boolean(form.value._fromExisting),
  })

  isExistingProductSelected.value = false
  form.value = {
    ...emptyForm(),
    Don_vi_tien_te: keepCurrency,
  }
  activeFormLang.value = 'vi'
}

function removeItem(i) {
  list.value.splice(i, 1)
  if (!list.value.length) {
    showMobileList.value = false
    showDetailModal.value = false
  }
}

const confirmBox = ref({
  show: false,
  title: '',
  message: '',
  resolve: null
})

function openConfirm(title, message) {
  return new Promise((resolve) => {
    confirmBox.value.show = true
    confirmBox.value.title = title
    confirmBox.value.message = message
    confirmBox.value.resolve = resolve
  })
}

function confirmOK() {
  confirmBox.value.resolve?.(true)
  confirmBox.value.show = false
  confirmBox.value.resolve = null
}

function confirmCancel() {
  confirmBox.value.resolve?.(false)
  confirmBox.value.show = false
  confirmBox.value.resolve = null
}

async function handleSubImageUpload(e, fieldName) {
  const file = e.target.files[0]
  if (!file) return

  uploadingSubImg.value[fieldName] = true
  try {
    form.value[fieldName] = await uploadImageToImgBB(file, PRODUCT_IMAGE_COMPRESS_OPTS)
  } catch (err) {
    console.error(err)
    openNotify('❌ Lỗi', `Upload ${fieldName} thất bại`, 'error')
  } finally {
    uploadingSubImg.value[fieldName] = false
    e.target.value = ''
  }
}

/* ================= PAYLOAD ================= */
function buildPayload() {
  return list.value.map((raw) => {
    const i = syncProductWithI18n(raw)
    return {
      Ma_hang: i.Ma_hang || genMaHangFE(i.Ten_hang),
      Ten_hang: i.Ten_hang,
      Main_img: i.Main_img || '',
      Mo_ta: i.Mo_ta || '',
      Danh_muc: i.Danh_muc || '',
      Size: i.Size || '',
      Dvt: i.Dvt || '',
      Gia_goc: Number(i.Gia_goc || 0),
      Gia_ban: Number(i.Gia_ban || 0),
      Ncc_loai_giam: normalizeNccDiscountType(i.Ncc_loai_giam),
      Ncc_gia_tri_giam: normalizeNccDiscountValue(i.Ncc_gia_tri_giam),
      Trang_thai: i.Trang_thai || 'Còn hàng',
      Don_vi_tien_te: i.Don_vi_tien_te || 'P',
      img_1: i.img_1 || '',
      img_2: i.img_2 || '',
      img_3: i.img_3 || '',
      img_4: i.img_4 || '',
      img_5: i.img_5 || '',
      img_6: i.img_6 || '',
      i18n: i.i18n,
    }
  })
}

/* ================= SUBMIT ================= */
async function submit() {
  if (submitting.value) return
  if (!list.value.length) return

  const totalItems = list.value.length
  submitting.value = true
  try {
    const payload = buildPayload()

    const res = await dispatchAction({
      action: 'nhapHangHoa',
      data: payload,
    })
    if (!res.success) {
      throw new Error(res.message || 'Không thể nhập hàng')
    }

    openNotify('✅ Thành công', `Đã thêm/cập nhật ${totalItems} hàng vào hệ thống!`, 'success')

    list.value = []
    isDirty.value = false
    showMobileList.value = false
    showDetailModal.value = false
    await loadProducts()
  } catch (err) {
    console.error('❌ Lỗi submit:', err)
    openNotify('❌ Lỗi', 'Lỗi kết nối Firebase, không gửi được dữ liệu!', 'error')
  } finally {
    submitting.value = false
  }
}

/* ================= ROUTE GUARD ================= */
onBeforeRouteLeave(async () => {
  if (!isDirty.value) return true

  const ok = await openConfirm(
    'Bạn chưa hoàn thành nhập hàng',
    'Rời trang sẽ mất dữ liệu. Tiếp tục?'
  )

  if (!ok) return false
  return true
})

function beforeUnload(e) {
  if (!isDirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))

watch(
  list,
  (val) => {
    isDirty.value = val.length > 0
  },
  { deep: true }
)

/* ================= EXCEL TEMPLATE & IMPORT ================= */
function downloadExcelTemplate() {
  const sampleRows = [
    {
      Ma_hang: '',
      Ten_hang: 'Cơm sườn nướng mật ong',
      Danh_muc: 'Cơm',
      Dvt: 'Phần',
      Size: '',
      Gia_goc: 0,
      Gia_ban: 270,
      Don_vi_tien_te: 'P',
      Trang_thai: 'Còn hàng',
      Main_img: '',
      Mo_ta: 'Sườn nướng thơm mềm ăn kèm cơm nóng',
      Ten_hang_en: 'Honey Grilled Pork Chop Rice',
      Danh_muc_en: 'Rice',
      Dvt_en: 'Portion',
      Mo_ta_en: 'Tender honey-glazed pork chop with steamed rice',
      Ten_hang_zh: '蜜汁烤猪排饭',
      Danh_muc_zh: '米饭',
      Dvt_zh: '份',
      Mo_ta_zh: '',
      Ten_hang_fil: 'Kanin na may Inihaw na Pork Chop sa Pulot',
      Danh_muc_fil: 'Kanin (Rice Meals)',
      Dvt_fil: 'Order',
      Mo_ta_fil: '',
      Ten_hang_ko: '허니 그릴 폭찹 덮밥',
      Danh_muc_ko: '덮밥 · 밥류',
      Dvt_ko: '인분',
      Mo_ta_ko: '',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(sampleRows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Hang_Hoa')
  XLSX.writeFile(wb, 'TEMPLATE-SA-KITCHEN-5LANG.xlsx')
}

function importExcel(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    let addedCount = 0
    rows.forEach((r) => {
      const synced = syncProductWithI18n({
        ...r,
        Gia_goc: parseMoneyInput(String(r.Gia_goc || '')),
        Gia_ban: parseMoneyInput(String(r.Gia_ban || '')),
        Trang_thai: r.Trang_thai || 'Còn hàng',
        Don_vi_tien_te: r.Don_vi_tien_te || 'P',
        img_1: r.img_1 || '',
        img_2: r.img_2 || '',
        img_3: r.img_3 || '',
        img_4: r.img_4 || '',
        img_5: r.img_5 || '',
        img_6: r.img_6 || '',
      })

      if (synced.Ten_hang) {
        const explicitMa = String(r.Ma_hang || '').trim()
        synced.Ma_hang = explicitMa || genMaHangFE(synced.Ten_hang)
        synced._fromExisting = Boolean(
          explicitMa && productList.value.some((p) => p.Ma_hang === explicitMa)
        )
        list.value.push(synced)
        addedCount++
      }
    })

    openNotify('📥 Import', `Đã import ${addedCount} dòng hợp lệ`, 'success')
  }

  reader.readAsArrayBuffer(file)
  e.target.value = ''
}

/* ================= BULK APPLY ================= */
function applyBulk(field) {
  const lines = bulkText.value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  lines.forEach((value, index) => {
    if (!list.value[index]) {
      list.value[index] = emptyForm()
    }

    const row = list.value[index]
    if (!row.i18n) row.i18n = createEmptyProductI18n()

    if (field.includes('Gia')) {
      row[field] = Number(value || 0)
    } else if (['Ten_hang', 'Danh_muc', 'Dvt', 'Mo_ta'].includes(field)) {
      row[field] = value
      row.i18n.vi[field] = value
    } else {
      row[field] = value
    }

    if (row.Ten_hang && !row._fromExisting) {
      row.Ma_hang = genMaHangFE(row.Ten_hang)
    }
  })

  bulkText.value = ''
}

function closeBulk() {
  showBulkModal.value = false
  bulkText.value = ''
}

/* ================= UPLOAD MAIN IMAGE ================= */
async function handleMainImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  uploadingImg.value = true
  try {
    form.value.Main_img = await uploadImageToImgBB(file, PRODUCT_IMAGE_COMPRESS_OPTS)
  } catch (err) {
    console.error(err)
    openNotify('❌ Lỗi', 'Upload ảnh thất bại', 'error')
  } finally {
    uploadingImg.value = false
    e.target.value = ''
  }
}

/* ================= BULK IMAGE UPLOAD ================= */
function triggerBulkImageUpload() {
  bulkImageInput.value?.click()
}

async function handleBulkImageUpload(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return

  uploadingBulkImg.value = true
  bulkImageUrls.value = []

  try {
    const results = await Promise.allSettled(
      files.map((file) => uploadImageToImgBB(file, PRODUCT_IMAGE_COMPRESS_OPTS))
    )
    bulkImageUrls.value = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value)

    if (!bulkImageUrls.value.length) {
      throw new Error('Upload ảnh hàng loạt thất bại')
    }

    showBulkImageModal.value = true
    openNotify('✅ Upload', `Đã upload ${bulkImageUrls.value.length} ảnh`, 'success')
  } catch (err) {
    console.error(err)
    openNotify('❌ Lỗi', 'Upload ảnh hàng loạt thất bại', 'error')
  } finally {
    uploadingBulkImg.value = false
    e.target.value = ''
  }
}

/* ================= CLIPBOARD (COPY ALL) ================= */
function copyAllLinks() {
  const text = bulkImageUrls.value.join('\n')
  navigator.clipboard.writeText(text)
  openNotify('✅ Copy', `Đã copy ${bulkImageUrls.value.length} link`, 'success')
}

/* ================= EDIT ================= */
function openEdit(index) {
  editIndex.value = index
  const target = list.value[index]
  const i18n = normalizeProductI18n(target)
  activeEditLang.value = 'vi'
  editForm.value = {
    ...target,
    Ncc_loai_giam: normalizeNccDiscountType(target.Ncc_loai_giam),
    Ncc_gia_tri_giam: normalizeNccDiscountValue(target.Ncc_gia_tri_giam),
    i18n: JSON.parse(JSON.stringify(i18n)),
    _fromExisting: Boolean(
      target._fromExisting ||
      (target.Ma_hang && productList.value.some((p) => p.Ma_hang === target.Ma_hang))
    ),
  }
  showEditModal.value = true
}

function saveEdit() {
  if (editIndex.value === null) return
  const synced = syncProductWithI18n(editForm.value)
  if (!synced.Ma_hang && synced.Ten_hang) {
    synced.Ma_hang = genMaHangFE(synced.Ten_hang)
  }

  list.value[editIndex.value] = {
    ...synced,
    _fromExisting: Boolean(editForm.value._fromExisting),
  }

  isDirty.value = true
  showEditModal.value = false
  openNotify('💾 Đã lưu', 'Đã cập nhật hàng trong danh sách', 'success')
}

async function handleEditImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  uploadingEditImg.value = true
  try {
    editForm.value.Main_img = await uploadImageToImgBB(file, PRODUCT_IMAGE_COMPRESS_OPTS)
    openNotify('✅ Upload', 'Đã đổi ảnh thành công', 'success')
  } catch (err) {
    console.error(err)
    openNotify('❌ Lỗi', 'Upload ảnh thất bại', 'error')
  } finally {
    uploadingEditImg.value = false
    e.target.value = ''
  }
}

async function handleEditSubImageUpload(e, fieldName) {
  const file = e.target.files[0]
  if (!file) return

  uploadingEditSubImg.value[fieldName] = true
  try {
    editForm.value[fieldName] = await uploadImageToImgBB(file, PRODUCT_IMAGE_COMPRESS_OPTS)
  } catch (err) {
    console.error(err)
    openNotify('❌ Lỗi', `Upload ${fieldName} thất bại`, 'error')
  } finally {
    uploadingEditSubImg.value[fieldName] = false
    e.target.value = ''
  }
}

const SUB_IMAGE_FIELDS = ['img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6']

/* ================= MOBILE DETAIL ================= */
function openDetail(i) {
  detailIndex.value = i
  detailItem.value = list.value[i]
  showDetailModal.value = true
}

/* ================= FORMAT ================= */
function fmtMoney(val, cur) {
  const n = Number(val || 0)
  try {
    return n.toLocaleString('vi-VN') + (cur ? ` ${cur}` : '')
  } catch {
    return `${n} ${cur || ''}`.trim()
  }
}
function parseMoneyInput(v) {
  const s = String(v ?? '').trim()
  if (!s) return ''
  const digits = s.replace(/[^\d]/g, '')
  return digits ? Number(digits) : ''
}

function fmtMoneyInput(val) {
  if (val === '' || val === null || val === undefined) return ''
  const n = Number(val)
  if (!Number.isFinite(n)) return ''
  try {
    return n.toLocaleString('vi-VN')
  } catch {
    return String(n)
  }
}

/* ================= MOBILE DETECT ================= */
function computeMobile() {
  isMobile.value = window.innerWidth <= 640
}
function handleClickOutside(e) {
  if (suggestionRef.value && !suggestionRef.value.contains(e.target)) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  loadProducts()
  computeMobile()
  window.addEventListener('resize', computeMobile)
  window.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  window.removeEventListener('resize', computeMobile)
  window.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ================== RESET & BASE ================== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ================== LAYOUT ================== */
.crm-layout {
  height: 100dvh;
  width: 100%;
  background: rgb(15, 23, 42);
  overflow: hidden;
  display: flex;
}

.page {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  
}

h2 {
  margin: 0;
  color: #f8fafc;
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -0.5px;
}

/* ================== CONTENT GRID ================== */
.content-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: clamp(460px, 32vw, 640px) minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
  overflow: hidden;
}

@media (min-width: 981px) {
  .form-box,
  .list-box {
    height: 100%;
    min-height: 0;
  }
  .form-box {
    overflow: auto;
  }
  .list-box {
    overflow: hidden;
  }
}

@media (max-width: 980px) {
  .content-grid {
    grid-template-columns: 1fr;
    overflow: auto;
    padding-right: 2px;
  }
}

/* ================== BOX ================== */
.box {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  min-width: 0;
}

.list-box {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.empty-fill {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.box-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.title {
  font-weight: 700;
  color: #f8fafc;
  font-size: 18px;
}

.count {
  font-weight: 600;
  color: #94a3b8;
  margin-left: 6px;
}

.empty {
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.5);
  color: #cbd5e1;
  text-align: center;
}

/* ================== SUGGESTIONS ================== */
.relative {
  position: relative;
}

.suggestion-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  margin-top: 4px;
}

/* ================== INPUT ICON ================== */
.input-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon-wrap input {
  padding-right: 32px; /* make room for icon */
}

.input-status-icon {
  position: absolute;
  right: 36px; /* Cách nút xoá một chút */
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.btn-clear-input {
  position: absolute;
  right: 6px;
  background: #ef4444;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  transition: background 0.2s;
}
.btn-clear-input:hover {
  background: #dc2626;
  color: white;
}

.spin-icon {
  color: #94a3b8;
  animation: spin 1s linear infinite;
  font-size: 18px;
}

.success-icon {
  color: #4ade80;
  font-size: 18px;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: rgba(134, 239, 172, 0.1);
}

.suggest-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.suggest-info {
  flex: 1;
  min-width: 0;
}

.suggest-name {
  color: #f8fafc;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggest-meta {
  color: #94a3b8;
  font-size: 12px;
}

/* ================== FORM ================== */
.form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
}

.form-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 20px;
  margin-bottom: 12px;
}

.panel {
  position: relative;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.04), rgba(15, 23, 42, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 12px 44px rgba(2, 6, 23, 0.65);
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.25s ease;
  backdrop-filter: blur(18px);
}

.panel::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  border: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.panel:hover {
  transform: translateY(-4px);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 18px 60px rgba(2, 6, 23, 0.7);
}

.panel:hover::after {
  border-color: rgba(59, 130, 246, 0.35);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #e2e8f0;
  margin-bottom: 14px;
}

.panel-header i {
  font-size: 17px;
  color: #22c55e;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-body.panel-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.panel-body.panel-grid .field {
  margin-bottom: 0;
}

.panel-body.panel-body--stacked {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 900px) {
  .form-panels {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 16px;
  }
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid rgba(148, 163, 184, 0.15);
  background: rgba(51, 65, 85, 0.3);
  color: #f8fafc;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #475569;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  background: rgba(51, 65, 85, 0.5);
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.field textarea {
  resize: vertical;
  line-height: 1.5;
}

.span-12 { grid-column: span 12; }
.span-6 { grid-column: span 6; }
.span-4 { grid-column: span 4; }

.hidden-field { display: none; }

/* ================== UPLOAD ================== */
.upload-wrap input[type="file"] {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 2px dashed rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
}

.img-preview {
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.8);
}

.img-preview img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.img-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: rgba(30, 41, 59, 0.8);
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.mono {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #94a3b8;
}

/* ================== ACTIONS ================== */
.actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;
}

.advanced {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.advanced-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.hidden-input { display: none; }

@media (max-width: 640px) {
  .advanced-grid { grid-template-columns: 1fr; }
  
  .page {
    padding: 16px;
  }
  
  .page-head {
    margin-bottom: 16px;
  }
  
  h2 {
    font-size: 22px;
  }
}

/* ================== BUTTONS ================== */
.btn {
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  user-select: none;
}

.btn:active { transform: scale(0.98); }

.btn.primary {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn.primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn.success {
  background: #22c55e;
  color: #fff;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn.success:hover {
  background: #16a34a;
  transform: translateY(-2px);
}

.btn.warning {
  background: #f59e0b;
  color: #111827;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn.warning:hover {
  background: #d97706;
  transform: translateY(-2px);
}

.btn.info {
  background: #06b6d4;
  color: #fff;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.btn.info:hover {
  background: #0891b2;
  transform: translateY(-2px);
}

.btn.secondary {
  background: rgba(71, 85, 105, 0.5);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn.secondary:hover {
  background: rgba(71, 85, 105, 0.7);
}

.btn.danger {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn.danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.btn.ghost {
  background: rgba(51, 65, 85, 0.4);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn.ghost:hover {
  background: rgba(51, 65, 85, 0.6);
}

.btn.outline {
  background: transparent;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn.outline:hover {
  background: rgba(51, 65, 85, 0.3);
}

.btn.mini {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.btn.full { width: 100%; }

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn.chip {
  background: rgba(51, 65, 85, 0.4);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.15);
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
}

.btn.chip:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
}

/* ================== SPINNER ================== */
.spin {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================== BADGE ================== */
.badge {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-weight: 600;
  font-size: 11px;
  border: 2px solid rgb(15, 23, 42);
}

/* ================== TABLE ================== */
.table-wrap {
  flex: 1;
  min-height: 0;
  max-width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 980px;
  background: rgba(15, 23, 42, 0.5);
  font-size: 14px;
}

.table th,
.table td {
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  padding: 14px 12px;
  vertical-align: middle;
}

.table th {
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.95);
  color: #ffffff;
  font-weight: 600;
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  z-index: 1;
}

.table td {
  color: #e2e8f0;
  align-content: center;
}

.row {
  cursor: pointer;
  transition: all 0.2s;
}

.row:hover {
  background: rgba(59, 130, 246, 0.08);
}

.cell-strong {
  font-weight: 600;
  color: #f8fafc;
}

.ellipsis {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #94a3b8;
}

.money {
  white-space: nowrap;
  color: #e2e8f0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.money.strong {
  font-weight: 700;
  color: #f8fafc;
}
.qty {
  text-align: center;
  font-weight: 600;
  color: #22c55e;
  font-variant-numeric: tabular-nums;
}
.thumb {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(148, 163, 184, 0.1);
  background: rgba(15, 23, 42, 0.8);
  display: grid;
  place-items: center;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-null {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.sub-images-cell {
  vertical-align: top;
  padding-top: 8px;
}

.sub-image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.sub-thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  background: rgba(51, 65, 85, 0.4);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.sub-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sub-thumb.empty {
  color: rgba(148, 163, 184, 0.8);
  font-size: 11px;
  font-weight: 600;
}

.thumb.big {
  width: 58px;
  height: 58px;
  border-radius: 10px;
}

/* ================== TAGS ================== */
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.tag.lang {
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.tag.currency {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.tag.ok {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.tag.bad {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.submit-foot {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

/* ================== MODAL ================== */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-box {
  background: rgb(30, 41, 59);
  width: 860px;
  max-width: 96vw;
  max-height: 90vh;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  overflow-y: auto;
  animation: modalFade 0.2s ease;
}

.modal-box.wide {
  width: 920px;
}

@keyframes modalFade {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-box h3 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
}

.modal-box textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 2px solid rgba(148, 163, 184, 0.15);
  background: rgba(51, 65, 85, 0.3);
  color: #f8fafc;
  font-size: 14px;
  resize: vertical;
  outline: none;
}

.modal-box textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

/* ================== BULK ================== */
.bulk-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

/* ================== IMAGE LINKS ================== */
.img-link-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow: auto;
  padding-right: 4px;
}

.img-link-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.img-link-item img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.img-link-item input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  font-size: 12px;
  font-family: monospace;
}

.copy-all {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

/* ================== MOBILE SHEET ================== */
.mobile-sheet {
  width: 560px;
  max-width: 96vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.sheet-title {
  font-weight: 700;
  color: #f8fafc;
  font-size: 18px;
}

.sheet-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.sheet-empty {
  margin: 12px 0;
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.6);
  text-align: center;
}

.mini-tags {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
}

.item-card {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(51, 65, 85, 0.3);
  transition: all 0.2s;
}

.item-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.item-card .name {
  font-weight: 700;
  color: #f8fafc;
  font-size: 14px;
}

.item-card .price {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.link {
  margin-top: 8px;
  border: none;
  background: transparent;
  color: #60a5fa;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-align: left;
  font-size: 13px;
}

.link:hover {
  color: #93c5fd;
  text-decoration: underline;
}

/* ================== DETAIL ================== */
.detail-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
}

.detail-img {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.8);
}

.detail-img img {
  width: 100%;
  height: 260px;
  object-fit: cover;
  display: block;
}

.detail-img-null {
  height: 260px;
  display: grid;
  place-items: center;
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
}

.detail-info {
  display: grid;
  gap: 10px;
}

.kv {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: baseline;
}

.k {
  font-weight: 600;
  color: #94a3b8;
  font-size: 13px;
}

.v {
  color: #e2e8f0;
  font-weight: 600;
}

.detail-desc {
  grid-column: 1 / -1;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.detail-sub-images {
  margin-top: 16px;
}

.detail-sub-images .sub-images-grid {
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
}

.detail-sub-images .sub-thumb {
  width: 100%;
  height: 78px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.5);
  display: grid;
  place-items: center;
}

.desc {
  margin-top: 8px;
  line-height: 1.6;
  color: #cbd5e1;
}

/* ================== EDIT HEAD ================== */
.edit-head {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.edit-img {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.8);
  width: 140px;
  height: 140px;
}

.edit-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

/* ================== NOTIFY ================== */
.notify-box {
  width: 520px;
  max-width: 96vw;
  background: rgb(30, 41, 59);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  text-align: center;
}

.notify-title {
  font-weight: 700;
  font-size: 18px;
  color: #f8fafc;
  margin-bottom: 12px;
}

.notify-msg {
  color: #cbd5e1;
  line-height: 1.6;
  font-weight: 500;
  font-size: 15px;
}

.notify-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.notify-box.success {
  border-left: 4px solid #22c55e;
}

.notify-box.error {
  border-left: 4px solid #ef4444;
}

.notify-box.info {
  border-left: 4px solid #06b6d4;
}

/* ================== SCROLLBAR ================== */
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

/* ================== RESPONSIVE ================== */
@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-img img,
  .detail-img-null {
    height: 220px;
  }
}

/* ✅ SUB IMAGES GRID */
.sub-images-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

@media (max-width: 640px) {
  .sub-images-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.edit-sub-images {
  margin: 16px 0;
}

.sub-images-grid.edit {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.sub-img-item {
  position: relative;
}

.upload-wrap-mini {
  position: relative;
  border: 2px dashed rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.5);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-wrap-mini input[type="file"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.img-preview-mini {
  position: relative;
  width: 100%;
  height: 100%;
}

.img-preview-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.btn-remove-mini {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: grid;
  place-items: center;
  z-index: 3;
  line-height: 1;
  padding: 0;
}

.btn-remove-mini:hover {
  background: #dc2626;
}

.placeholder-mini {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-align: center;
}

.hint-mini {
  font-size: 10px;
  color: #94a3b8;
  text-align: center;
}

/* ================= 5-LANGUAGE TABS & PILLS ================= */
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
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-tab-btn:hover {
  border-color: rgba(34, 197, 94, 0.5);
  color: #ffffff;
}

.lang-tab-btn.active {
  background: rgba(34, 197, 94, 0.18);
  border-color: #22c55e;
  color: #86efac;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.25);
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
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
}

.lang-badges-wrap {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.lang-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid rgba(96, 165, 250, 0.35);
  color: #93c5fd;
}

.ncc-disc-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ncc-type-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.75);
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

.ncc-mini-tag {
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

.upload-size-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #93c5fd;
  line-height: 1.4;
}

.upload-size-hint-inline {
  font-size: 11.5px;
  font-weight: 500;
  color: #93c5fd;
  text-transform: none;
}
</style>
