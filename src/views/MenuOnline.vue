<template>
  <div
    class="sa-storefront"
    :class="[themeMode === 'dark' ? 'theme-dark' : 'theme-light', { 'is-mobile-view': isMobile }]"
  >
    <!-- ========== DESKTOP TOP HEADER (1A) ========== -->
    <header v-if="!isMobile" class="desktop-top-header">
      <div class="dth-inner" :class="{ 'has-header-scam': showHeaderScam }">
        <!-- BRAND LEFT -->
        <div class="dth-brand" @click="onAllFilter" role="button" tabindex="0">
          <img v-if="logo?.URL" :src="logo.URL" class="dth-logo" alt="" />
          <div class="dth-brand-meta">
            <div class="dth-name">{{ logo?.Name || 'SA KITCHEN' }}</div>
            <div v-if="shopTime" class="dth-time">
              <span class="dot-online"></span>
              <span>{{ shopTime }}</span>
            </div>
          </div>
        </div>

        <!-- INTEGRATED SEARCH CENTER -->
        <div class="dth-search-wrap" ref="searchWrapperRef">
          <div class="dth-search-box">
            <i class="ri-search-line dth-search-ico"></i>
            <input
              v-model="searchInput"
              type="text"
              :placeholder="$t('search.placeholder')"
              class="dth-search-input"
              @focus="showSearchSuggest = true"
              @input="showSearchSuggest = true"
              @keyup.enter="applySearch"
            />
            <button
              v-if="searchInput || keyword"
              class="dth-search-clear"
              type="button"
              @click.stop="clearSearchAll"
              aria-label="Clear search"
            >
              <i class="ri-close-line"></i>
            </button>
            <button class="dth-search-submit" type="button" @click="applySearch">
              <i class="ri-search-line"></i>
            </button>
          </div>

          <div
            v-if="searchInput && searchSuggestions.length && showSearchSuggest"
            class="search-suggest dth-suggest"
          >
            <button
              v-for="m in searchSuggestions"
              :key="m.Ma_hang"
              type="button"
              class="suggest-item"
              @click="openSuggestion(m)"
            >
              <img :src="m.Main_img" alt="" class="suggest-img" />
              <div class="suggest-info">
                <div class="suggest-name">{{ m.Ten_hang }}</div>
                <div class="suggest-price">
                  {{ formatPrice(finalPrice(m), m.Don_vi_tien_te) }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- RIGHT ZONE: COMPACT CHECK SCAM ON SCROLL + ACTIONS -->
        <div class="dth-right-zone">
          <nav
            v-if="showHeaderScam"
            class="dth-scam-bar"
            aria-label="Check Scam & Trusted Shops"
          >
            <a
              v-for="item in CHECK_SCAM_LINKS"
              :key="'hdr-' + item.key"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="dth-scam-btn"
              :class="item.variant"
              :title="`${item.title} — ${item.sub}`"
              :aria-label="item.title"
            >
              <i :class="item.icon" class="dth-scam-ico"></i>
              <span class="dth-scam-label">{{ item.headerLabel }}</span>
            </a>
          </nav>

          <!-- RIGHT CONTROLS: CONTACT + THEME + LANG + CART PILL -->
          <div class="dth-actions">
          <div
            class="dth-contact-wrap"
            ref="contactPopoverRef"
          >
            <button
              type="button"
              class="dth-ctrl-btn"
              :class="{ active: showContactPopover }"
              @click.stop="showContactPopover = !showContactPopover"
            >
              <i class="ri-customer-service-2-line"></i>
              <span>{{ $t('mobile.contact') }}</span>
              <i class="ri-arrow-down-s-line dth-caret"></i>
            </button>

            <div v-if="showContactPopover" class="dth-contact-popover" @click.stop>
              <div class="dcp-header">
                <i class="ri-customer-service-2-fill"></i>
                <span>{{ $t('contact.sendOrder') }}</span>
              </div>
              <div class="dcp-list">
                <component
                  :is="c.Direct_link ? 'a' : 'div'"
                  v-for="c in shopContactList"
                  :key="c.ID"
                  :href="c.Direct_link || undefined"
                  :target="c.Direct_link ? '_blank' : undefined"
                  :rel="c.Direct_link ? 'noopener' : undefined"
                  class="dcp-item"
                  :class="{
                    'is-msg-allowed': isContactMessageAllowed(c),
                    'is-static': !c.Direct_link
                  }"
                  @click="c.Direct_link ? (showContactPopover = false) : null"
                >
                  <img :src="c.URL_img" class="dcp-avatar" alt="" />
                  <div class="dcp-info">
                    <div class="dcp-name-row">
                      <span class="dcp-name">{{ c.PLATFORM_name }}</span>
                      <span v-if="isContactMessageAllowed(c)" class="contact-msg-badge">
                        <i class="ri-message-3-fill"></i>
                        <span>{{ $t('contact.allowMessageBadge') }}</span>
                      </span>
                    </div>
                    <div class="dcp-desc">{{ c.INFO }}</div>
                  </div>
                  <i v-if="c.Direct_link" class="ri-external-link-line dcp-ext"></i>
                </component>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="dth-ctrl-btn icon-only theme-toggle-btn"
            :title="themeMode === 'dark' ? $t('common.lightMode') : $t('common.darkMode')"
            @click="toggleThemeMode"
          >
            <i :class="themeMode === 'dark' ? 'ri-sun-fill' : 'ri-moon-clear-line'"></i>
          </button>

          <button
            type="button"
            class="dth-ctrl-btn lang-btn"
            :title="$t('filter.changeLang')"
            @click="openLangModal"
          >
            <img :src="currentLangFlagImg" class="dth-flag-img" alt="lang" />
          </button>

          <button
            type="button"
            class="dth-cart-pill"
            :class="{ active: showCart, bump: bumpCart }"
            @click="showCart = !showCart"
          >
            <i class="ri-shopping-basket-2-fill"></i>
            <span class="dcp-badge">{{ cartQtyTotal }}</span>
            <span class="dcp-amount">
              {{ cartQtyTotal > 0 ? formatPrice(totalAmount, cartCurrency) : $t('mobile.cart') }}
            </span>
          </button>
          </div>
        </div>
      </div>
    </header>

    <div
      class="layout"
      :class="{
        'hide-left': !showCategories,
        'hide-right': !showCart
      }"
    >
      <!-- ========== SIDEBAR LEFT (CHỈ DÙNG DRAWER MOBILE NẾU CẦN) ========== -->
      <aside v-if="isMobile" class="sidebar-left" :class="{ collapsed: !showCategories }">
        <button class="toggle-btn" @click="showCategories = !showCategories">
          <i
            :class="[
              showCategories
                ? 'ri-arrow-left-circle-fill'
                : 'ri-list-check',
              'toggle-icon'
            ]"
          ></i>
        </button>

        <div v-if="showCategories" class="sidebar-content">
          <div class="logo-box" v-if="logo">
            <img :src="logo.URL" alt="" />
            <div class="logo-name">{{ logo.Name }}</div>
            <div v-if="shopTime" class="logo-time badge-online">
              <span class="dot-online"></span>
              {{ shopTime }}
            </div>
          </div>

          <div class="categories">
            <h4 class="category-title">
              <i class="ri-list-check category-title-icon"></i>
              {{ $t('menu.category') }}
              <span v-if="hasSale" class="category-sale-badge">SALE</span>
            </h4>
            <div
              v-for="c in categories"
              style="text-transform: uppercase;"
              :key="c"
              class="cat"
              :class="{
                active: c === currentCategory,
                sale: c === 'Sale'
              }"
              @click="selectCategory(c)"
            >
              {{ c }}
            </div>
          </div>
        </div>
      </aside>

      <!-- ========== MAIN CONTENT ========== -->
      <main
        class="main"
        :class="{
          'dock-expanded': !isMobile && !loadingMain && !leftDockCollapsed,
          'dock-collapsed': !isMobile && !loadingMain && leftDockCollapsed
        }"
        ref="mainRef"
      >
        <div v-if="isMobile && logo" class="mobile-header-clean" :class="{ 'has-scam': showHeaderScam }">
          <img :src="logo.URL" class="mh-logo" alt="" />

          <div class="mh-name">
            {{ logo.Name }}
          </div>

          <div
            v-if="shopTime && !showHeaderScam"
            class="logo-time badge-online mh-time"
          >
            <span class="dot-online"></span>
            {{ shopTime }}
          </div>

          <nav
            v-if="showHeaderScam"
            class="mh-scam-bar"
            aria-label="Check Scam & Trusted Shops"
          >
            <a
              v-for="item in CHECK_SCAM_LINKS"
              :key="'mob-hdr-' + item.key"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="dth-scam-btn mh-scam-btn"
              :class="item.variant"
              :title="`${item.title} — ${item.sub}`"
              :aria-label="item.title"
            >
              <i :class="item.icon" class="dth-scam-ico mh-scam-ico"></i>
              <span class="dth-scam-label mh-scam-label">{{ item.headerLabel }}</span>
            </a>
          </nav>

          <button
            type="button"
            class="mh-theme-btn"
            :class="{ 'no-time': !shopTime && !showHeaderScam }"
            :title="themeMode === 'dark' ? $t('common.lightMode') : $t('common.darkMode')"
            @click="toggleThemeMode"
          >
            <i :class="themeMode === 'dark' ? 'ri-sun-fill' : 'ri-moon-clear-line'"></i>
          </button>
        </div>
        <!-- ================== SKELETON ================== -->
  <div v-if="loadingMain" class="main-skeleton">
    <div class="sk-notice"></div>
    <div class="sk-banner"></div>
    <div class="sk-search"></div>
    <div class="sk-filter"></div>

    <div class="sk-grid">
      <div v-for="n in 8" :key="n" class="sk-card">
        <div class="sk-img"></div>
        <div class="sk-line"></div>
        <div class="sk-line short"></div>
        <div class="sk-btn"></div>
      </div>
    </div>
  </div>
  <template v-else>
      <!-- HERO SECTION: NOTICE + BANNER -->
      <div v-if="thongBaoTexts.length || bannerList.length > 0" class="hero-container">
        <div v-if="thongBaoTexts.length" class="notice-bar">
          <div class="notice-icon"><i class="ri-volume-up-line"></i></div>
          <div class="notice-marquee">
            <span class="notice-text">
              {{ thongBaoTexts.join('   •   ') }}
            </span>
          </div>
        </div>

        <!-- BANNER SHOWCASE: 3-CARD REVOLVING CAROUSEL + CIRCULAR THUMBNAIL RING -->
        <div
          v-if="bannerList.length > 0"
          class="banner banner-showcase"
          @mouseenter="onBannerMouseEnter"
          @mouseleave="onBannerMouseLeave"
        >
          <div class="banner-carousel-row">
            <button
              v-if="bannerList.length > 1 && !isMobile"
              type="button"
              class="banner-btn prev"
              @click.stop="prevBanner"
              aria-label="Previous banner"
            >
              <i class="app-ico ri-arrow-left-s-line"></i>
            </button>

            <div
              class="banner-stage"
              :class="{ 'single-mode': bannerList.length === 1 }"
              @touchstart.passive="onBannerTouchStart"
              @touchend.passive="onBannerTouchEnd"
            >
              <div
                v-for="(b, bIdx) in bannerList"
                :key="b.ID || bIdx"
                class="banner-slide-card"
                :class="getBannerCardClasses(bIdx)"
                @click="onBannerCardClick(b, bIdx)"
              >
                <div
                  class="banner-backdrop"
                  :style="{ backgroundImage: `url(${b.URL})` }"
                ></div>
                <img
                  :src="b.URL"
                  :alt="'Banner ' + (bIdx + 1)"
                  class="banner-img"
                />
              </div>

              <div
                v-if="bannerList.length === 2"
                class="banner-slide-card is-prev is-mirror"
                @click="goToBanner((currentBannerIndex + 1) % 2)"
              >
                <div
                  class="banner-backdrop"
                  :style="{ backgroundImage: `url(${bannerList[(currentBannerIndex + 1) % 2].URL})` }"
                ></div>
                <img
                  :src="bannerList[(currentBannerIndex + 1) % 2].URL"
                  alt="Banner preview"
                  class="banner-img"
                />
              </div>
            </div>

            <button
              v-if="bannerList.length > 1 && !isMobile"
              type="button"
              class="banner-btn next"
              @click.stop="nextBanner"
              aria-label="Next banner"
            >
              <i class="app-ico ri-arrow-right-s-line"></i>
            </button>
          </div>

          <div v-if="bannerList.length > 1" class="banner-ring-bar">
            <button
              v-if="isMobile"
              type="button"
              class="banner-btn prev mobile-ring-nav"
              @click.stop="prevBanner"
              aria-label="Previous banner"
            >
              <i class="app-ico ri-arrow-left-s-line"></i>
            </button>

            <button
              v-for="(b, bIdx) in bannerList"
              :key="'ring-' + (b.ID || bIdx)"
              type="button"
              class="banner-ring-btn"
              :class="{ active: bIdx === currentBannerIndex }"
              @click="goToBanner(bIdx)"
              :aria-label="'Banner ' + (bIdx + 1)"
            >
              <span class="banner-ring-inner">
                <img :src="b.URL" :alt="'Preview ' + (bIdx + 1)" class="banner-ring-img" />
              </span>
            </button>

            <button
              v-if="isMobile"
              type="button"
              class="banner-btn next mobile-ring-nav"
              @click.stop="nextBanner"
              aria-label="Next banner"
            >
              <i class="app-ico ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- STANDALONE CHECK SCAM HUB (3 LARGER SEPARATE BUTTONS) -->
      <section ref="scamHubRef" class="scam-hub-section" aria-label="Check Scam & Trusted Shops">
        <div class="scam-hub-grid">
          <a
            v-for="item in CHECK_SCAM_LINKS"
            :key="'hub-' + item.key"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="scam-hub-btn"
            :class="item.variant"
          >
            <span class="scam-hub-icon">
              <i :class="item.icon"></i>
            </span>
            <span class="scam-hub-text">
              <span class="scam-hub-title">{{ item.title }}</span>
              <span class="scam-hub-sub">{{ item.sub }}</span>
            </span>
            <i class="ri-external-link-line scam-hub-ext"></i>
          </a>
        </div>
      </section>

      <!-- DESKTOP STICKY HORIZONTAL CATEGORY TOOLBAR (TIER 1) -->
      <div v-if="!isMobile" class="sticky-cat-toolbar">
        <div class="sct-inner">
          <div class="sct-cat-bar">
            <button
              type="button"
              class="sct-scroll-btn"
              aria-label="Scroll categories left"
              @click="scrollCategories(-1)"
            >
              <i class="ri-arrow-left-s-line"></i>
            </button>

            <div class="sct-cat-scroll" ref="catScrollRef">
              <button
                v-for="c in categories"
                :key="'desk-cat-' + c"
                type="button"
                class="sct-cat-pill"
                :class="{
                  active: c === currentCategory,
                  sale: c === 'Sale'
                }"
                @click="selectCategory(c)"
              >
                <i v-if="c === 'Sale'" class="ri-fire-fill"></i>
                <span>{{ c }}</span>
              </button>
            </div>

            <button
              type="button"
              class="sct-scroll-btn"
              aria-label="Scroll categories right"
              @click="scrollCategories(1)"
            >
              <i class="ri-arrow-right-s-line"></i>
            </button>
          </div>

          <div class="sct-all-cats-wrap" ref="allCatsWrapRef">
            <button
              type="button"
              class="sct-all-cats-btn"
              :class="{ active: showAllCatsDrawer }"
              @click.stop="showAllCatsDrawer = !showAllCatsDrawer"
            >
              <i class="ri-layout-grid-line"></i>
              <span>{{ $t('menu.allCategories') }} ({{ categories.length }})</span>
              <i :class="showAllCatsDrawer ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"></i>
            </button>

            <div v-if="showAllCatsDrawer" class="sct-all-cats-dropdown" @click.stop>
              <div class="sct-all-cats-header">
                <span>{{ $t('menu.allCategories') }} ({{ categories.length }})</span>
                <span class="sct-alpha-badge">A → Z</span>
              </div>
              <div class="sct-all-cats-grid">
                <button
                  v-for="c in categories"
                  :key="'drop-cat-' + c"
                  type="button"
                  class="sct-cat-pill"
                  :class="{
                    active: c === currentCategory,
                    sale: c === 'Sale'
                  }"
                  @click="selectCategory(c)"
                >
                  <i v-if="c === 'Sale'" class="ri-fire-fill"></i>
                  <span>{{ c }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-container">
      <!-- MOBILE SEARCH + FILTER -->
      <div v-if="isMobile" class="search-wrapper" ref="searchWrapperRef">
        <div class="search-box">
          <input
            v-model="searchInput"
            type="text"
            :placeholder="$t('search.placeholder')"
            class="search-input"
            @focus="showSearchSuggest = true"
            @input="showSearchSuggest = true"
            @keyup.enter="applySearch"
          />

          <button
            v-if="searchInput"
            class="search-clear-btn"
            type="button"
            @click.stop="clearSearchAll"
            aria-label="Close search"
          >
            <i class="app-ico ri-close-line"></i>
          </button>

          <button class="search-btn" type="button" @click="applySearch">
            <i class="ri-search-line"></i>
          </button>
        </div>
        <div
          v-if="searchInput && searchSuggestions.length && showSearchSuggest"
          class="search-suggest"
        >
          <button
            v-for="m in searchSuggestions"
            :key="m.Ma_hang"
            type="button"
            class="suggest-item"
            @click="openSuggestion(m)"
          >
            <img :src="m.Main_img" alt="" class="suggest-img" />
            <div class="suggest-info">
              <div class="suggest-name">{{ m.Ten_hang }}</div>
              <div class="suggest-price">
                {{ formatPrice(finalPrice(m), m.Don_vi_tien_te) }}
              </div>
            </div>
          </button>
        </div>

        <div class="filter-bar">
          <button
            type="button"
            class="filter-btn filter-cat-btn"
            :class="{ active: showCategoryModal || (currentCategory && currentCategory !== allCategoryLabel) }"
            @click="openMobilePanel('category')"
          >
            <i class="ri-apps-2-line"></i>
            <span>{{ currentCategory && currentCategory !== allCategoryLabel ? currentCategory : $t('menu.category') }}</span>
            <i class="ri-arrow-down-s-line"></i>
          </button>

          <button
            class="filter-btn"
            :class="{ active: priceSort === 'all' }"
            @click="onAllFilter"
          >
            {{ $t('filter.all') }}
          </button>

          <button
            class="filter-btn"
            :class="{ active: priceSort === 'asc' }"
            @click="priceSort = 'asc'"
          >
            {{ $t('filter.asc') }}
          </button>

          <button
            class="filter-btn"
            :class="{ active: priceSort === 'desc' }"
            @click="priceSort = 'desc'"
          >
            {{ $t('filter.desc') }}
          </button>

          <button
            class="filter-btn lang-filter"
            @click="openLangModal"
            :title="$t('filter.changeLang')"
          >
            <img
              :src="currentLangFlagImg"
              class="lang-flag-img-only"
              alt="lang"
            />
          </button>
        </div>
      </div>

      <!-- MOBILE HORIZONTAL A-Z CATEGORY STRIP ON HOME -->
      <div v-if="isMobile && categories.length" class="mobile-cat-strip">
        <button
          v-for="c in categories"
          :key="'mob-cat-' + c"
          type="button"
          class="sct-cat-pill mob-cat-pill"
          :class="{
            active: c === currentCategory,
            sale: c === 'Sale'
          }"
          @click="selectCategory(c)"
        >
          <i v-if="c === 'Sale'" class="ri-fire-fill"></i>
          <span>{{ c }}</span>
        </button>
      </div>

      <!-- DESKTOP FILTER & SORT BAR (TIER 2) -->
      <div v-if="!isMobile" class="menu-filter-bar">
        <div class="mfb-left">
          <span class="mfb-active-cat">
            <i v-if="currentCategory === 'Sale'" class="ri-fire-fill"></i>
            <i v-else class="ri-price-tag-3-line"></i>
            <span>{{ currentCategory || allCategoryLabel }}</span>
          </span>
          <span class="mfb-count-pill">
            {{ filteredMenu.length }} {{ $t('menu.itemsUnit') }}
          </span>
          <button
            v-if="currentCategory !== allCategoryLabel || priceSort !== 'all' || keyword"
            type="button"
            class="mfb-reset-btn"
            @click="onAllFilter"
          >
            <i class="ri-close-circle-line"></i>
            <span>{{ $t('menu.clearFilter') }}</span>
          </button>
        </div>

        <div class="sct-sort-group">
          <button
            type="button"
            class="sct-sort-btn"
            :class="{ active: priceSort === 'all' }"
            @click="onAllFilter"
          >
            <span>{{ $t('filter.all') }}</span>
          </button>
          <button
            type="button"
            class="sct-sort-btn"
            :class="{ active: priceSort === 'asc' }"
            @click="priceSort = 'asc'"
          >
            <i class="ri-sort-asc"></i>
            <span>{{ $t('filter.asc') }}</span>
          </button>
          <button
            type="button"
            class="sct-sort-btn"
            :class="{ active: priceSort === 'desc' }"
            @click="priceSort = 'desc'"
          >
            <i class="ri-sort-desc"></i>
            <span>{{ $t('filter.desc') }}</span>
          </button>
        </div>
      </div>

      <!-- MENU GRID -->
      <div class="menu" ref="menuRef" :key="menuKey" v-if="pagedMenu.length > 0">
        <div v-if="keyword" class="search-result-line">
          Kết quả tìm kiếm cho: "{{ keyword }}"
        </div>
        <div
          v-for="m in pagedMenu"
          :key="m.Ma_hang"
          class="card-border"
          :class="{ out: m.Trang_thai === 'Hết hàng' }"
        >
          <div
            class="card"
            @click="openDetail(m)"
          >
            <div class="card-img-wrap">
              <transition name="card-fade" mode="out-in">
                <img
                  :key="getCardImageKey(m)"
                  :src="getCardImage(m)"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
              </transition>

              <!-- TAG GIẢM GIÁ -->
              <div
                v-if="isDiscount(m)"
                class="discount-tag"
              >
                <span>-{{ discountPercent(m) }}%</span>
              </div>

              <!-- TAG TRẠNG THÁI TRÊN ẢNH -->
              <div
                class="status-tag card-status-pill"
                :class="{
                  available: m.Trang_thai === 'Còn hàng',
                  out: m.Trang_thai === 'Hết hàng'
                }"
              >
                {{ $t(getStatusKey(m.Trang_thai)) }}
              </div>
            </div>

            <div class="info">
              <!-- TÊN -->
              <h4 class="name">{{ m.Ten_hang }}</h4>

              <!-- MÔ TẢ -->
              <p class="desc">
                {{ m.Mo_ta || m.Ten_hang }}
              </p>

              <!-- GIÁ + CHI TIẾT / GHI CHÚ -->
              <div class="card-meta-row">
                <div class="price-row price-discount">
                  <span class="price" :class="{ 'is-sale-price': isDiscount(m) }">
                    {{ formatPrice(finalPrice(m), m.Don_vi_tien_te) }}<span v-if="m.Dvt" class="unit">/{{ m.Dvt }}</span>
                  </span>

                  <span
                    v-if="isDiscount(m)"
                    class="price-old"
                  >
                    {{ formatPrice(m.Gia_ban, m.Don_vi_tien_te) }}
                  </span>
                </div>

                <a
                  class="detail-link"
                  @click.stop.prevent="openDetail(m)"
                >
                  <i class="ri-sticky-note-line"></i>
                  <span>{{ $t('menu.detailNote') }}</span>
                </a>
              </div>

              <!-- THANH HÀNH ĐỘNG GỘP: SỐ LƯỢNG + THÊM -->
              <div class="card-action-bar">
                <div class="qty-row">
                  <button type="button" class="btn-qty" @click.stop="decTemp(m)">
                    <i class="app-ico ri-subtract-line"></i>
                  </button>

                  <input
                    type="number"
                    min="1"
                    v-model.number="tempQty[m.Ma_hang]"
                    @click.stop
                  />

                  <button type="button" class="btn-qty" @click.stop="incTemp(m)">
                    <i class="app-ico ri-add-line"></i>
                  </button>
                </div>

                <button
                  type="button"
                  class="add-btn"
                  :class="{ added: addedMap[m.Ma_hang] }"
                  :disabled="m.Trang_thai === 'Hết hàng'"
                  @click.stop="addToCart(m)"
                >
                  <template v-if="addedMap[m.Ma_hang]">
                    <i class="ri-check-line"></i>
                  </template>
                  <template v-else-if="m.Trang_thai === 'Hết hàng'">
                    {{ $t('status.outOfStock') }}
                  </template>
                  <template v-else>
                    <i class="ri-add-line add-btn-ico"></i>
                    <span>{{ $t('menu.add') }}</span>
                  </template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div
        v-else
        class="empty-menu"
      >
        {{ $t('empty.menu') }}&nbsp;
        <i class="ri-search-2-line"></i>
      </div>

      <!-- LAZY LOAD SENTINEL (AUTO LOAD ON SCROLL) -->
      <div
        v-if="hasMoreItems"
        ref="loadMoreSentinelRef"
        class="lazy-load-sentinel"
        aria-hidden="true"
      >
        <i class="ri-loader-4-line lazy-spin-ico"></i>
        <span>{{ pagedMenu.length }} / {{ filteredMenu.length }}</span>
      </div>

      <!-- FOOTER CHECK SCAM BUTTONS (3 SEPARATE LARGER BUTTONS) -->
      <div class="footer-checkscam-group">
        <a
          v-for="item in CHECK_SCAM_LINKS"
          :key="'footer-' + item.key"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-checkscam-btn"
          :class="item.variant"
        >
          <i :class="item.icon"></i>
          <span>{{ item.title }}</span>
          <i class="ri-external-link-line footer-cs-ext"></i>
        </a>
      </div>
      </div>
      </template>
    </main>
<transition name="mobile-modal">
  <div
    v-if="showDetailSidebar && isMobile"
    class="mobile-sheet-backdrop is-detail"
    @click="closeDetailSidebar"
  ></div>
</transition>
<transition name="detail-slide">
  <aside
    v-if="showDetailSidebar && isMobile"
    class="detail-sidebar"
  >
    <!-- HEADER -->
   <div class="detail-header">
  <button class="detail-back" @click="closeDetailSidebar">
    <i class="ri-arrow-left-line"></i>
  </button>

  <div class="detail-title">
    {{ selectedItem?.Ten_hang }}
  </div>
  <button
    class="detail-add-btn"
    type="button"
    :disabled="selectedItem?.Trang_thai === 'Hết hàng'"
    @click.stop="addFromDetailSidebar"
  >
    {{ selectedItem?.Trang_thai === 'Hết hàng' ? $t('status.outOfStock') : $t('menu.add') }}
  </button>
</div>
   <!--  ẢNH SẢN PHẨM (BỊ THIẾU) -->
    <div class="detail-image-wrap">
      <div class="detail-image-main">
        <img
          :src="modalImages[activeModalIndex] || selectedItem?.Main_img"
          class="detail-img clickable"
          alt=""
          @click="openImageModal(modalImages[activeModalIndex] || selectedItem.Main_img)"
        />
        <button
          v-if="modalImages.length > 1"
          type="button"
          class="detail-img-nav prev"
          aria-label="Prev image"
          @click.stop="prevModalImage"
        >
          <
        </button>
        <button
          v-if="modalImages.length > 1"
          type="button"
          class="detail-img-nav next"
          aria-label="Next image"
          @click.stop="nextModalImage"
        >
          >
        </button>
      </div>
      <div v-if="modalImages.length > 1" class="detail-thumbs">
        <button
          v-for="(img, idx) in modalImages"
          :key="`${img}-${idx}`"
          type="button"
          class="detail-thumb"
          :class="{ active: idx === activeModalIndex }"
          @click.stop="setActiveModalImage(idx)"
        >
          <img :src="img" alt="" />
        </button>
      </div>
    </div>

    <!-- BODY (COPY 100% TỪ MODAL) -->
    <div class="detail-body modal-right">

  <div class="status-row">
    <!-- TAG TRẠNG THÁI -->
    <div
      class="status-tag"
      :class="{
        available: selectedItem.Trang_thai === 'Còn hàng',
        out: selectedItem.Trang_thai === 'Hết hàng'
      }"
    >
      {{ $t(getStatusKey(selectedItem.Trang_thai)) }}
    </div>

    <!-- BADGE DANH MỤC -->
    <div v-if="selectedItem.Danh_muc" class="meta-tag inline">
      {{ $t('menu.category') }}: {{ selectedItem.Danh_muc }}
    </div>
  </div>

  <!-- BADGE SIZE -->
  <div v-if="selectedItem.Size" class="meta-tag size-badge">
    Size: {{ selectedItem.Size }}
  </div>

  <!-- TÊN -->
  <h3 class="modal-title">
    {{ selectedItem.Ten_hang }}
  </h3>

  <!-- MÔ TẢ -->
  <p class="modal-desc">
    {{ selectedItem.Mo_ta || selectedItem.Ten_hang }}
  </p>

  <!-- GIÁ -->
<div class="modal-price price-discount">
  <!-- GIÁ CŨ -->
  <span
    v-if="isDiscount(selectedItem)"
    class="price-old"
  >
    {{ formatPrice(selectedItem.Gia_ban, selectedItem.Don_vi_tien_te) }}
  </span>

  <!-- GIÁ SAU GIẢM -->
  <span class="price" :class="{ 'is-sale-price': isDiscount(selectedItem) }">
    {{ formatPrice(finalPrice(selectedItem), selectedItem.Don_vi_tien_te) }}
    <span v-if="selectedItem.Dvt" class="modal-unit">
      / {{ selectedItem.Dvt }}
    </span>
  </span>
</div>


  <!-- QTY (Y CHANG MODAL) -->
  <div class="qty-row modal-qty">
    <button @click="decTemp(selectedItem)">−</button>
    <input
      type="number"
      min="1"
      v-model.number="tempQty[selectedItem.Ma_hang]"
    />
    <button @click="incTemp(selectedItem)">+</button>
  </div>
<!-- ===== GHI CHÚ MÓN (MOBILE) ===== -->
<div class="form-field">
  <label>{{ $t('menu.note') }}</label>
  <textarea
    rows="2"
    v-model="itemNotes[selectedItem.Ma_hang]"
   
  ></textarea>
</div>

  <!-- ADD -->
<button
  class="add-btn"
  :class="{
    added: addedMap[selectedItem.Ma_hang],
    closing: closingDetailSidebar
  }"
  :disabled="selectedItem.Trang_thai === 'Hết hàng'"
  @click="addFromDetailSidebar"
>

    <template v-if="addedMap[selectedItem.Ma_hang]">
      <i class="ri-checkbox-circle-fill"></i>
    </template>
    <template v-else-if="selectedItem.Trang_thai === 'Hết hàng'">
      {{ $t('status.outOfStock') }}
    </template>
    <template v-else>
      {{ $t('menu.add') }}
    </template>
  </button>

</div>

  </aside>
</transition>

    <!-- ========== SIDEBAR RIGHT – SUMMARY CART (6-LAYER FLOW) ========== -->
    <div
      v-if="isMobile && showCart"
      class="mobile-sheet-backdrop is-cart"
      @click="closeCart"
    ></div>
    <aside class="sidebar-right" :class="{ collapsed: !showCart }" @wheel="forwardWheelToMain">
      <div v-if="showCart" class="sidebar-content cart-box">
        <!-- ===== LAYER 1 & 2 HEADER: ĐƠN HÀNG + GHÉP ĐƠN CÙNG HÀNG ===== -->
        <div class="cart-header-zone">
          <div class="cart-top-header">
            <div class="cart-top-title">
              <i class="ri-shopping-basket-2-fill"></i>
              <span>{{ $t('cart.title') }}</span>
              <span class="order-count">({{ cartQtyTotal }})</span>
            </div>

            <div class="cart-header-actions">
              <button
                type="button"
                class="group-invite-btn cart-inline-group-btn"
                :disabled="creatingGroupSession"
                @click="openGroupShareModal"
              >
                <i class="ri-qr-code-line"></i>
                <span>{{ $t('group.groupOrderBtn') }}</span>
              </button>

              <button
                type="button"
                class="cart-hdr-icon-btn close"
                :title="$t('cart.hideCart')"
                @click="closeCart"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="isMobile && liveStatus && liveStatus !== 'Nháp'"
          type="button"
          class="cart-live-status-notice"
          :class="orderStatusInfo.stateClass"
          @click="onOrderStatusClick"
        >
          <span class="clsn-icon">
            <i :class="orderStatusInfo.icon"></i>
          </span>
          <span class="clsn-copy">
            <strong class="clsn-title">{{ orderStatusInfo.text }}</strong>
            <span class="clsn-sub">
              {{
                isOrderTerminal
                  ? $t('cart.cartTerminalHint')
                  : isOrderLocked
                    ? $t('cart.cartLockedHint')
                    : $t('cart.cartPendingHint')
              }}
            </span>
          </span>
          <i class="ri-arrow-right-s-line clsn-arrow"></i>
        </button>

        <!-- ===== LAYER 2 BODY: DANH SÁCH MÓN (SOLO PHẲNG / GHÉP ĐƠN ĐÓNG-MỞ 1B) ===== -->
        <div class="cart-scroll-area" ref="cartListRef">
          <div class="cart-list">
            <div
              v-if="isCartVisuallyEmpty"
              class="cart-empty-placeholder"
            >
              <i class="ri-shopping-basket-2-line"></i>
              <span>{{ $t('group.emptyMemberItems') }}</span>
            </div>

            <!-- SOLO MODE: DANH SÁCH PHẲNG -->
            <div v-else-if="!activeOrderId" class="cart-solo-items">
              <div
                v-for="(i, idx) in cartItems"
                :key="i.lineId"
                class="cart-row sidebar-cart-row"
                :class="{
                  highlight: i.lineId === lastAdded || i.Ma_hang === lastAdded,
                  active: editingItem?.lineId === i.lineId,
                  locked: !canModifyCartItem(i)
                }"
                :data-ma="i.Ma_hang"
                :data-line="i.lineId"
                @click="canModifyCartItem(i) && openEditQty(i)"
              >
                <div class="sc-thumb">
                  <img
                    v-if="i.Main_img"
                    :src="i.Main_img"
                    class="sc-thumb-img"
                    alt=""
                  />
                  <span v-else class="sc-thumb-idx">{{ idx + 1 }}</span>
                </div>

                <div class="sc-body">
                  <div class="sc-top-row">
                    <div class="cart-name">{{ i.Ten_hang }}</div>
                    <button
                      v-if="canModifyCartItem(i)"
                      type="button"
                      class="sc-remove-btn"
                      @click.stop="removeItem(i)"
                    >
                      <i class="ri-close-line"></i>
                    </button>
                  </div>

                  <div class="sc-meta-row">
                    <div class="sc-qty-unit">
                      <span class="sc-qty-badge">x{{ i.qty }}</span>
                      <span class="sc-unit-price" :class="{ discounted: i.isDiscounted }">
                        {{ formatPrice(i.unitPrice, i.Don_vi_tien_te) }}<template v-if="i.Dvt">/{{ i.Dvt }}</template>
                      </span>
                    </div>
                    <div class="sc-subtotal">
                      {{ formatPrice(i.thanhTien, i.Don_vi_tien_te) }}
                    </div>
                  </div>

                  <div v-if="i.note" class="cart-item-note">
                    <i class="ri-file-text-line"></i>
                    <span>{{ i.note }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- GROUP MODE (1B): MẶC ĐỊNH MỞ CỦA BẠN, ĐÓNG CỦA NGƯỜI KHÁC -->
            <template v-else>
              <div
                v-for="grp in cartMemberGroups"
                :key="grp.groupKey"
                class="cart-member-group"
                :class="{
                  'is-host': grp.role === 'host',
                  'is-admin': grp.role === 'admin',
                  'is-me': grp.isMe,
                  'is-collapsed': !isMemberGroupOpen(grp)
                }"
              >
                <div
                  role="button"
                  tabindex="0"
                  class="cart-member-header clickable-member-header"
                  @click="toggleMemberGroupOpen(grp)"
                  @keydown.enter.space.prevent="toggleMemberGroupOpen(grp)"
                >
                  <div class="cm-header-left">
                    <i
                      class="cm-role-ico"
                      :class="
                        grp.role === 'host'
                          ? hasGroupMembers
                            ? 'ri-vip-crown-fill'
                            : 'ri-user-3-fill'
                          : grp.role === 'admin'
                            ? 'ri-store-2-fill'
                            : 'ri-user-3-fill'
                      "
                      :title="
                        grp.role === 'host'
                          ? hasGroupMembers
                            ? $t('group.hostBadge')
                            : $t('group.orderedBy')
                          : grp.role === 'admin'
                            ? $t('group.addedByShop')
                            : $t('group.memberBadge')
                      "
                    ></i>
                    <span class="cm-name" :title="grp.name">{{ grp.name }}</span>
                    <span v-if="grp.isMe" class="cm-badge me">{{ $t('group.youBadge') }}</span>
                    <span
                      v-if="grp.role === 'guest' && !isOrderLocked"
                      class="cm-status-pill"
                      :class="{ done: grp.done }"
                    >
                      <i :class="grp.done ? 'ri-check-line' : 'ri-time-line'"></i>
                      {{ grp.done ? $t('group.doneStatus') : $t('group.selectingStatus') }}
                    </span>
                  </div>

                  <div class="cm-header-right">
                    <span class="cm-summary">
                      {{ grp.totalQty }} {{ $t('group.itemsCount') }} • {{ formatPrice(grp.subtotal, cartCurrency) }}
                    </span>
                    <button
                      v-if="isGroupHost && !isOrderLocked && grp.role === 'guest'"
                      type="button"
                      class="cm-remove-member-btn"
                      :disabled="removingMemberKey === grp.groupKey"
                      :title="$t('group.removeMemberBtn')"
                      :aria-label="$t('group.removeMemberBtn')"
                      @click.stop="requestRemoveMember(grp)"
                    >
                      <i class="ri-user-unfollow-line"></i>
                    </button>
                    <i
                      class="cm-chevron-ico"
                      :class="isMemberGroupOpen(grp) ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                    ></i>
                  </div>
                </div>

                <div v-show="isMemberGroupOpen(grp)" class="cart-member-collapse-body">
                  <div v-if="!grp.items.length" class="cart-member-empty">
                    {{ $t('group.emptyMemberItems') }}
                  </div>

                  <div v-else class="cart-member-items">
                    <div
                      v-for="(i, idx) in grp.items"
                      :key="i.lineId"
                      class="cart-row sidebar-cart-row"
                      :class="{
                        highlight: i.lineId === lastAdded || i.Ma_hang === lastAdded,
                        active: editingItem?.lineId === i.lineId,
                        locked: !canModifyCartItem(i)
                      }"
                      :data-ma="i.Ma_hang"
                      :data-line="i.lineId"
                      @click="canModifyCartItem(i) && openEditQty(i)"
                    >
                      <div class="sc-thumb">
                        <img
                          v-if="i.Main_img"
                          :src="i.Main_img"
                          class="sc-thumb-img"
                          alt=""
                        />
                        <span v-else class="sc-thumb-idx">{{ idx + 1 }}</span>
                      </div>

                      <div class="sc-body">
                        <div class="sc-top-row">
                          <div class="cart-name">{{ i.Ten_hang }}</div>
                          <button
                            v-if="canModifyCartItem(i)"
                            type="button"
                            class="sc-remove-btn"
                            @click.stop="removeItem(i)"
                          >
                            <i class="ri-close-line"></i>
                          </button>
                        </div>

                        <div class="sc-meta-row">
                          <div class="sc-qty-unit">
                            <span class="sc-qty-badge">x{{ i.qty }}</span>
                            <span class="sc-unit-price" :class="{ discounted: i.isDiscounted }">
                              {{ formatPrice(i.unitPrice, i.Don_vi_tien_te) }}<template v-if="i.Dvt">/{{ i.Dvt }}</template>
                            </span>
                          </div>
                          <div class="sc-subtotal">
                            {{ formatPrice(i.thanhTien, i.Don_vi_tien_te) }}
                          </div>
                        </div>

                        <div v-if="i.note" class="cart-item-note">
                          <i class="ri-file-text-line"></i>
                          <span>{{ i.note }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ===== STICKY FOOTER: TỔNG CỘNG -> FREESHIP -> TRẠNG THÁI ĐƠN -> TIẾP TỤC ===== -->
        <div class="cart-sticky-footer">
          <!-- 3. TỔNG CỘNG + NÚT PHÓNG TO MODAL -->
          <div class="cart-total-row">
            <div class="cart-total">
              <span class="cart-total-label">{{ $t('cart.total') }}</span>
              <strong class="cart-total-value">{{ formatPrice(totalAmount, cartCurrency) }}</strong>
            </div>
            <button
              type="button"
              class="cart-total-expand-btn"
              :title="$t('cart.expandCart')"
              :aria-label="$t('cart.expandCart')"
              @click="showFullCartModal = true"
            >
              <i class="ri-fullscreen-line"></i>
            </button>
          </div>

          <!-- 4. MỐC ƯU ĐÃI / FREESHIP (DẠNG CHECKPOINT, KHÔNG BADGE) -->
          <div
            v-if="milestoneCheckpoints.length > 0"
            class="milestone-checkpoint-box"
            :class="{ unlocked: isAllMilestonesUnlocked }"
          >
            <div class="mcp-headline">
              <i
                :class="
                  isAllMilestonesUnlocked
                    ? 'ri-checkbox-circle-fill'
                    : nextMilestone?.type === 'GIFT'
                      ? 'ri-gift-line'
                      : 'ri-truck-line'
                "
              ></i>
              <span>{{ milestoneHeadlineText }}</span>
            </div>

            <div class="mcp-stepper">
              <div class="mcp-rail-wrap">
                <div class="mcp-rail">
                  <div
                    class="mcp-rail-fill"
                    :style="{ width: `${milestoneTrackFillPercent}%` }"
                  ></div>
                  <span
                    class="mcp-origin-dot"
                    :class="{ active: totalAmount > 0 }"
                  ></span>
                  <span
                    v-for="cp in milestoneCheckpoints"
                    :key="'sb-dot-' + cp.key"
                    class="mcp-point"
                    :class="{ 'is-unlocked': cp.unlocked, 'is-next': cp.isNext }"
                    :style="{ left: `${cp.posPct}%` }"
                    :title="`${cp.thresholdText}: ${cp.label}`"
                  ></span>
                </div>
              </div>

              <div
                class="mcp-checkpoints-grid"
                :style="{
                  gridTemplateColumns: `repeat(${milestoneCheckpoints.length}, minmax(0, 1fr))`
                }"
              >
                <div
                  v-for="cp in milestoneCheckpoints"
                  :key="'sb-lbl-' + cp.key"
                  class="mcp-cp-col"
                  :class="{ 'is-unlocked': cp.unlocked, 'is-next': cp.isNext }"
                >
                  <span class="mcp-cp-amount">{{ cp.thresholdText }}</span>
                  <span class="mcp-cp-reward">{{ cp.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. TRẠNG THÁI ĐƠN PROGRESS KIỂU GRAB (DESKTOP) -->
          <button
            v-if="!isMobile"
            type="button"
            class="grab-status-card"
            :class="[orderStatusInfo.stateClass, { 'is-cancelled': orderStatusProgress.isCancelled }]"
            @click="onOrderStatusClick"
          >
            <div class="gs-top-row">
              <span class="gs-status-main">
                <span class="gs-live-dot" :class="{ paused: orderStatusProgress.isTerminal }"></span>
                <i class="gs-main-ico" :class="orderStatusInfo.icon"></i>
                <strong class="gs-status-text">{{ orderStatusInfo.text }}</strong>
              </span>
              <span v-if="!orderStatusProgress.isCancelled" class="gs-step-count">
                {{ orderStatusProgress.activeIndex + 1 }}/{{ orderStatusProgress.steps.length }}
              </span>
            </div>

            <div v-if="!orderStatusProgress.isCancelled" class="gs-stepper">
              <div class="gs-rail">
                <div
                  class="gs-rail-fill"
                  :style="{ width: `${orderStatusProgress.fillPercent}%` }"
                ></div>
              </div>

              <div class="gs-steps-grid">
                <div
                  v-for="(st, sIdx) in orderStatusProgress.steps"
                  :key="'sb-st-' + st.key"
                  class="gs-step"
                  :class="{
                    'is-done': sIdx < orderStatusProgress.activeIndex,
                    'is-current': sIdx === orderStatusProgress.activeIndex,
                    'is-upcoming': sIdx > orderStatusProgress.activeIndex,
                    'is-shipping-active': st.key === 'shipping' && sIdx === orderStatusProgress.activeIndex
                  }"
                >
                  <div class="gs-node">
                    <span v-if="sIdx === orderStatusProgress.activeIndex && !orderStatusProgress.isTerminal" class="gs-pulse-ring"></span>
                    <i
                      :class="
                        sIdx < orderStatusProgress.activeIndex
                          ? 'ri-check-line'
                          : st.icon
                      "
                    ></i>
                  </div>
                  <span class="gs-label">{{ st.label }}</span>
                </div>
              </div>
            </div>
          </button>

          <!-- 6. NÚT TIẾP TỤC (SOLO/HOST) HOẶC HOÀN THÀNH CHỌN MÓN (GUEST 2B) -->
          <template v-if="isGroupGuest">
            <button
              v-if="isOrderLocked"
              type="button"
              class="finish-btn new-order-finish-btn"
              @click="startNewOrder"
            >
              + {{ $t('group.newOrderBtn') }}
            </button>
            <button
              v-else-if="!isMyGuestSelectionDone"
              type="button"
              class="finish-btn guest-finish-btn"
              @click="toggleGuestDone(true)"
            >
              <i class="ri-check-double-line"></i> {{ $t('group.guestFinishBtn') }}
            </button>
            <button
              v-else
              type="button"
              class="guest-edit-again-btn"
              @click="toggleGuestDone(false)"
            >
              <i class="ri-edit-line"></i> {{ $t('group.guestEditAgainBtn') }}
            </button>
          </template>

          <template v-else>
            <button
              v-if="isOrderTerminal"
              type="button"
              class="finish-btn new-order-finish-btn"
              @click="startNewOrder"
            >
              + {{ $t('group.newOrderBtn') }}
            </button>
            <button
              v-else-if="isOrderLocked"
              type="button"
              class="finish-btn view-progress-finish-btn"
              @click="onOrderStatusClick"
            >
              <i class="ri-route-line"></i>
              <span>{{ $t('cart.viewProgressBtn') }}</span>
            </button>
            <button
              v-else-if="liveStatus === 'Chờ duyệt' && hasOrderChangesAfterSubmit"
              type="button"
              class="finish-btn continue-full-btn"
              @click="onContinueToFullModal"
            >
              <span>{{ $t('cart.updateOrderBtn') }}</span>
              <i class="ri-arrow-right-line"></i>
            </button>
            <button
              v-else-if="liveStatus === 'Chờ duyệt'"
              type="button"
              class="finish-btn pending-progress-finish-btn"
              @click="onPendingProgressClick"
            >
              <i class="ri-time-line"></i>
              <span>{{ $t('cart.pendingProgressBtn') }}</span>
            </button>
            <button
              v-else
              type="button"
              class="finish-btn continue-full-btn"
              @click="onContinueToFullModal"
            >
              <span>{{ $t('cart.continueBtn') }}</span>
              <i class="ri-arrow-right-line"></i>
            </button>
          </template>
        </div>
      </div>
    </aside>

  </div>
    <button
    class="scroll-top-fab"
    v-show="showScrollTop && !showCart && !showProgressModal && !showCategoryModal && !showContactModal && !showExportModal && !showDetailSidebar"
    :title="$t('common.scrollTop')"
    aria-label="Scroll to top"
    @click="scrollToPageTop"
  >
    <i class="ri-arrow-up-line"></i>
  </button>

  <!-- ===== FLOATING LEFT TRUST & CONTACT DOCK (PA1 - DESKTOP) ===== -->
  <aside
    v-if="!isMobile && !loadingMain"
    class="left-trust-dock"
    :class="{ 'is-collapsed': leftDockCollapsed }"
    @wheel="forwardWheelToMain"
  >
    <button
      type="button"
      class="ltd-collapse-btn"
      :title="leftDockCollapsed ? $t('contact.expandDock') : $t('contact.collapseDock')"
      @click="leftDockCollapsed = !leftDockCollapsed"
    >
      <i :class="leftDockCollapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'"></i>
    </button>

    <div class="ltd-scam-group">
      <a
        v-for="item in CHECK_SCAM_LINKS"
        :key="'ltd-scam-' + item.key"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="ltd-scam-btn"
        :class="item.variant"
        :title="`${item.title} - ${item.sub}`"
      >
        <span class="ltd-scam-icon">
          <i :class="item.icon"></i>
        </span>
        <span v-if="!leftDockCollapsed" class="ltd-scam-text">
          <span class="ltd-scam-title">{{ item.title }}</span>
          <span class="ltd-scam-sub">{{ item.sub }}</span>
        </span>
        <span v-else class="ltd-scam-mini">{{ item.short }}</span>
        <i v-if="!leftDockCollapsed" class="ri-external-link-line ltd-scam-ext"></i>
      </a>
    </div>

    <div v-if="shopContactList.length" class="ltd-contact-section">
      <div v-if="!leftDockCollapsed" class="ltd-section-title">
        <i class="ri-customer-service-2-fill"></i>
        <span>{{ $t('contact.officialChannels') }}</span>
      </div>
      <div v-else class="ltd-divider"></div>

      <div class="ltd-contact-list">
        <component
          :is="c.Direct_link ? 'a' : 'div'"
          v-for="c in shopContactList"
          :key="'ltd-' + c.ID"
          :href="c.Direct_link || undefined"
          :target="c.Direct_link ? '_blank' : undefined"
          :rel="c.Direct_link ? 'noopener noreferrer' : undefined"
          class="ltd-contact-card"
          :class="{
            'is-msg-allowed': isContactMessageAllowed(c),
            'is-static': !c.Direct_link
          }"
          :title="`${c.PLATFORM_name}: ${c.INFO}`"
        >
          <div class="ltd-contact-avatar-wrap">
            <img :src="c.URL_img" class="ltd-contact-img" :alt="c.PLATFORM_name" />
            <span
              v-if="leftDockCollapsed && isContactMessageAllowed(c)"
              class="ltd-msg-dot"
            ></span>
          </div>
          <div v-if="!leftDockCollapsed" class="ltd-contact-meta">
            <div class="ltd-contact-name-row">
              <div class="ltd-contact-name">{{ c.PLATFORM_name }}</div>
              <span v-if="isContactMessageAllowed(c)" class="contact-msg-badge is-compact">
                <i class="ri-message-3-fill"></i>
                <span>{{ $t('contact.allowMessageBadge') }}</span>
              </span>
            </div>
            <div class="ltd-contact-info">{{ c.INFO }}</div>
          </div>
        </component>
      </div>
    </div>
  </aside>
  <!-- ===== MODAL CHI TIẾT SẢN PHẨM ===== -->
<!-- ===== MODAL CHI TIẾT SẢN PHẨM ===== -->
<div v-if="showDetail && !isMobile" class="modal-overlay" @click="closeDetail" >
  <div
  class="modal-card modal-wide"
  :class="{ closing: closingModal }"
  @click.stop
>

    <button class="modal-close" @click="closeDetail">✕</button>

    <div class="modal-content">
      <!-- ẢNH BÊN TRÁI -->
      <div class="modal-media" :class="{ 'no-thumbs': !hasModalThumbs }">
        <div class="modal-left">
         <img
    :src="modalImages[activeModalIndex] || selectedItem.Main_img"
    alt=""
    class="modal-img clickable"
    @click="openImageModal(modalImages[activeModalIndex] || selectedItem.Main_img)"
  />
          <button
            v-if="modalImages.length > 1"
            type="button"
            class="modal-img-nav prev"
            aria-label="Prev image"
            @click.stop="prevModalImage"
          >
            ‹
          </button>
          <button
            v-if="modalImages.length > 1"
            type="button"
            class="modal-img-nav next"
            aria-label="Next image"
            @click.stop="nextModalImage"
          >
            ›
          </button>
        </div>
        <div v-if="hasModalThumbs" class="modal-thumbs">
          <button
            v-for="(img, idx) in modalImages"
            :key="`${img}-${idx}`"
            type="button"
            class="modal-thumb"
            :class="{ active: idx === activeModalIndex }"
            @click="setActiveModalImage(idx)"
          >
            <img :src="img" alt="" />
          </button>
        </div>
      </div>

      <!-- THÔNG TIN BÊN PHẢI -->
      <div class="modal-right">
        <!-- TAG TRẠNG THÁI -->
        <div
          class="status-tag"
          :class="{
            available: selectedItem.Trang_thai === 'Còn hàng',
            out: selectedItem.Trang_thai === 'Hết hàng'
          }"
        >
          {{ $t(getStatusKey(selectedItem.Trang_thai)) }}
        </div>

        <!-- TAG DANH MỤC -->
        <div v-if="selectedItem.Danh_muc" class="meta-tag">
 {{ $t('menu.category') }}: {{ selectedItem.Danh_muc }}
        </div>

        <!-- TAG SIZE (NẾU CÓ) -->
        <div v-if="selectedItem.Size" class="meta-tag size-badge">
           Size: {{ selectedItem.Size }}
        </div>

        <h3 class="modal-title">
          {{ selectedItem.Ten_hang }}
        </h3>

        <p class="modal-desc">
          {{ selectedItem.Mo_ta || selectedItem.Ten_hang }}
        </p>

<div class="modal-price price-discount">
  <!-- GIÁ CŨ -->
  <span
    v-if="isDiscount(selectedItem)"
    class="price-old"
  >
    {{ formatPrice(selectedItem.Gia_ban, selectedItem.Don_vi_tien_te) }}
  </span>

  <!-- GIÁ SAU GIẢM -->
  <span class="price" :class="{ 'is-sale-price': isDiscount(selectedItem) }">
    {{ formatPrice(finalPrice(selectedItem), selectedItem.Don_vi_tien_te) }}
    <span v-if="selectedItem.Dvt" class="modal-unit">
      / {{ selectedItem.Dvt }}
    </span>
  </span>
</div>


<div class="qty-row modal-qty">
  <button @click="decTemp(selectedItem)">−</button>
  <input
    type="number"
    min="1"
    v-model.number="tempQty[selectedItem.Ma_hang]"
  />
  <button @click="incTemp(selectedItem)">+</button>
</div>

<div class="form-field">
  <label>{{ $t('menu.note') }}</label>
  <textarea
    rows="2"
    v-model="itemNotes[selectedItem.Ma_hang]"
    placeholder="VD: ít cay, không hành, thêm sốt..."
  ></textarea>
</div>

<button
  class="add-btn"
  :class="{ added: addedMap[selectedItem.Ma_hang] }"
  :disabled="selectedItem.Trang_thai === 'Hết hàng'"
  @click.stop="addToCartFromModal(selectedItem)"
>
  <template v-if="addedMap[selectedItem.Ma_hang]">
    <i class="ri-checkbox-circle-fill"></i>
  </template>
  <template v-else-if="selectedItem.Trang_thai === 'Hết hàng'">
    {{ $t('status.outOfStock') }}
  </template>
  <template v-else>
    {{ $t('menu.add') }}
  </template>
</button>



      </div>
    </div>
  </div>
</div>

<!-- ===== MODAL NỘI DUNG ĐƠN HÀNG (ĐỒNG BỘ TEMPLATE) ===== -->
<div
  v-if="showExportModal"
  class="modal-overlay z-top export-modal-overlay"
  @click="showExportModal = false"
>
  <div class="modal-card export-modal" @click.stop>
    <button
      type="button"
      class="modal-close exm-close-btn"
      @click="showExportModal = false"
    >
      <i class="ri-close-line"></i>
    </button>

    <div class="exm-header">
      <div class="exm-icon-badge">
        <i class="ri-file-list-3-fill"></i>
      </div>
      <div class="exm-header-text">
        <div class="exm-title-row">
          <h3 class="exm-title">{{ $t('export.title') }}</h3>
          <span v-if="activeOrderId" class="exm-code-pill">#{{ activeOrderId }}</span>
        </div>
        <p class="exm-subtitle">{{ $t('export.subtitle') }}</p>
      </div>
    </div>

    <div class="exm-summary-strip">
      <div class="exm-stat-item">
        <i class="ri-shopping-basket-2-line"></i>
        <span>{{ cartQtyTotal }} {{ $t('group.itemsCount') }}</span>
      </div>
      <span class="exm-stat-dot">•</span>
      <div class="exm-stat-item is-price">
        <strong>{{ formatPrice(totalAmount, cartCurrency) }}</strong>
      </div>
      <span class="exm-stat-dot">•</span>
      <div class="exm-stat-item">
        <i :class="hinhThucTT === 'CHUYEN_KHOAN' ? 'ri-bank-card-line' : 'ri-money-dollar-circle-line'"></i>
        <span>{{ hinhThucTT === 'CHUYEN_KHOAN' ? $t('cart.transfer') : $t('cart.cash') }}</span>
      </div>
      <span
        v-if="liveStatus && liveStatus !== 'Nháp'"
        class="exm-saved-pill"
      >
        <i class="ri-checkbox-circle-fill"></i> {{ $t('export.savedWeb') }}
      </span>
    </div>

    <div
      class="grab-status-card in-full-modal in-export-modal"
      :class="[orderStatusInfo.stateClass, { 'is-cancelled': orderStatusProgress.isCancelled }]"
    >
      <div class="gs-top-row">
        <span class="gs-status-main">
          <span class="gs-live-dot" :class="{ paused: orderStatusProgress.isTerminal }"></span>
          <i class="gs-main-ico" :class="orderStatusInfo.icon"></i>
          <strong class="gs-status-text">{{ orderStatusInfo.text }}</strong>
        </span>
        <span v-if="!orderStatusProgress.isCancelled" class="gs-step-count">
          {{ orderStatusProgress.activeIndex + 1 }}/{{ orderStatusProgress.steps.length }}
        </span>
      </div>

      <div v-if="!orderStatusProgress.isCancelled" class="gs-stepper">
        <div class="gs-rail">
          <div
            class="gs-rail-fill"
            :style="{ width: `${orderStatusProgress.fillPercent}%` }"
          ></div>
        </div>

        <div class="gs-steps-grid">
          <div
            v-for="(st, sIdx) in orderStatusProgress.steps"
            :key="'exm-st-' + st.key"
            class="gs-step"
            :class="{
              'is-done': sIdx < orderStatusProgress.activeIndex,
              'is-current': sIdx === orderStatusProgress.activeIndex,
              'is-upcoming': sIdx > orderStatusProgress.activeIndex,
              'is-shipping-active': st.key === 'shipping' && sIdx === orderStatusProgress.activeIndex
            }"
          >
            <div class="gs-node">
              <span v-if="sIdx === orderStatusProgress.activeIndex && !orderStatusProgress.isTerminal" class="gs-pulse-ring"></span>
              <i
                :class="
                  sIdx < orderStatusProgress.activeIndex
                    ? 'ri-check-line'
                    : st.icon
                "
              ></i>
            </div>
            <span class="gs-label">{{ st.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="exm-content-card">
      <div class="exm-card-bar">
        <span class="exm-card-label">
          <i class="ri-article-line"></i>
          <span>{{ $t('export.messageLabel') }}</span>
        </span>
        <button
          type="button"
          class="exm-copy-inline-btn"
          :class="{ copied }"
          @click="copy"
        >
          <i :class="copied ? 'ri-check-line' : 'ri-file-copy-line'"></i>
          <span>{{ copied ? $t('export.copied') : $t('export.copy') }}</span>
        </button>
      </div>

      <textarea
        class="exm-textarea"
        rows="9"
        readonly
        :value="exportText"
      ></textarea>
    </div>

    <div v-if="messagingContactList.length" class="exm-send-section">
      <div class="exm-send-heading">
        <i class="ri-send-plane-line"></i>
        <span>{{ $t('export.sendChannelTitle') }}</span>
      </div>

      <div
        class="exm-channels-grid"
        :class="{ 'is-single': messagingContactList.length === 1 }"
      >
        <button
          v-for="c in messagingContactList"
          :key="c.ID"
          type="button"
          class="exm-channel-btn"
          @click="sendToShop(c)"
        >
          <img v-if="c.URL_img" :src="c.URL_img" class="exm-channel-img" alt="" />
          <span class="exm-channel-label">{{ $t('export.send') }} {{ c.PLATFORM_name }}</span>
          <i class="ri-arrow-right-up-line exm-channel-arrow"></i>
        </button>
      </div>
    </div>
  </div>
</div>
<!-- ===== MODAL DANH MỤC (MOBILE) ===== -->
 <transition name="mobile-modal">
<div
  v-if="showCategoryModal"
  class="modal-overlay"
  @click="showCategoryModal = false"
>
  <div class="modal-card" @click.stop>
    <button class="modal-close" @click="showCategoryModal = false">✕</button>

    <h3 class="export-title category-modal-title">
      <i class="ri-list-check category-title-icon"></i>
      <span style="color:green;font-weight: bold;">{{ $t('modal.chooseCategory') }}</span>
      <span
        v-if="hasSale"
        class="category-sale-badge"
      >
        SALE
      </span>
    </h3>
    
    <div class="categories modal-categories">
      <div
        v-for="c in categories"
        :key="c"
        class="cat"
        :class="{
          active: c === currentCategory,
          sale: c === 'Sale'
        }"
        @click="selectCategory(c)"
        
      >
        <span class="cat-label">{{ c }}</span>

        <span
        
          v-if="c === 'Sale'"
          class="category-sale-badge cat-sale-pill"
        >
          SALE
        </span>
      </div>
    </div>
  </div>
</div>
</transition>
<!-- ===== MODAL LIÊN HỆ (MOBILE) ===== -->
 <transition name="mobile-modal">
<div
  v-if="showContactModal"
  class="modal-overlay"
  @click="showContactModal = false"
>
  <div class="modal-card" @click.stop>
    <button class="modal-close" @click="showContactModal = false">✕</button>

    <h3 class="export-title">{{ $t('contact.supportInfo') }}</h3>

    <div class="mobile-checkscam-group">
      <a
        v-for="item in CHECK_SCAM_LINKS"
        :key="'mob-scam-' + item.key"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="mobile-checkscam-card"
        :class="item.variant"
      >
        <div class="mcc-icon">
          <i :class="item.icon"></i>
        </div>
        <div class="mcc-body">
          <div class="mcc-title">{{ item.title }}</div>
          <div class="mcc-sub">{{ item.sub }}</div>
        </div>
        <i class="ri-external-link-line mcc-ext"></i>
      </a>
    </div>

    <div class="shop-contact">
      <component
        :is="c.Direct_link ? 'a' : 'div'"
        v-for="c in shopContactList"
        :key="c.ID"
        :href="c.Direct_link || undefined"
        :target="c.Direct_link ? '_blank' : undefined"
        :rel="c.Direct_link ? 'noopener' : undefined"
        class="contact-item"
        :class="{
          'is-msg-allowed': isContactMessageAllowed(c),
          'is-static': !c.Direct_link
        }"
      >
        <div class="contact-icon-wrap">
          <img :src="c.URL_img" class="contact-icon" />
        </div>

        <div class="contact-info">
          <div class="contact-name-row">
            <div class="contact-name">{{ c.PLATFORM_name }}</div>
            <span v-if="isContactMessageAllowed(c)" class="contact-msg-badge">
              <i class="ri-message-3-fill"></i>
              <span>{{ $t('contact.allowMessageBadge') }}</span>
            </span>
          </div>
          <div class="contact-desc">{{ c.INFO }}</div>
        </div>
      </component>
    </div>
  </div>
</div>
</transition>

<!-- ===== MINI CART BAR / LIVE ORDER TRACKER (MOBILE) ===== -->
<transition name="cart-bar-slide">
  <div
    v-if="
      isMobile
      && (cartItems.length > 0 || (liveStatus && liveStatus !== 'Nháp'))
      && activeMobilePanel !== 'cart'
      && activeMobilePanel !== 'progress'
    "
    class="mobile-cart-bar"
  >
    <!-- 1. ĐƠN HÀNG ĐANG TRONG TIẾN TRÌNH HOẶC ĐÃ KẾT THÚC -->
    <div
      v-if="liveStatus && liveStatus !== 'Nháp'"
      class="mcb-tracker-pill"
      :class="[orderStatusInfo.stateClass, { 'is-terminal': isOrderTerminal }]"
      @click="openMobilePanel('progress')"
    >
      <div class="mcb-tracker-main">
        <span class="mcb-tracker-ico">
          <i :class="orderStatusInfo.icon"></i>
          <span
            v-if="!isOrderTerminal"
            class="mcb-live-dot"
          ></span>
        </span>

        <div class="mcb-tracker-info">
          <div class="mcb-tracker-title">{{ orderStatusInfo.text }}</div>
          <div class="mcb-tracker-sub">
            <span v-if="activeOrderId" class="mcb-tracker-code">#{{ activeOrderId }}</span>
            <span v-if="activeOrderId && !orderStatusProgress.isCancelled">•</span>
            <span v-if="!orderStatusProgress.isCancelled">
              {{ orderStatusProgress.activeIndex + 1 }}/{{ orderStatusProgress.steps.length }}
            </span>
            <span v-if="cartItems.length > 0">• {{ formatPrice(totalAmount, cartCurrency) }}</span>
          </div>
        </div>

        <div class="mcb-tracker-actions" @click.stop>
          <button
            v-if="liveStatus === 'Chờ duyệt' && isGroupHost"
            type="button"
            class="mcb-edit-btn"
            :title="$t('mobile.editOrder')"
            :aria-label="$t('mobile.editOrder')"
            @click="openMobilePanel('cart')"
          >
            <i class="ri-shopping-bag-3-line"></i>
          </button>

          <button
            v-if="isOrderTerminal"
            type="button"
            class="mcb-action-cta is-new-order"
            @click="startNewOrder"
          >
            + {{ $t('group.newOrderBtn') }}
          </button>
          <button
            v-else
            type="button"
            class="mcb-action-cta"
            @click="openMobilePanel('progress')"
          >
            <span>{{ $t('mobile.progress') }}</span>
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>

      <div
        v-if="!orderStatusProgress.isCancelled"
        class="mcb-tracker-rail"
      >
        <div
          class="mcb-tracker-rail-fill"
          :style="{ width: `${orderStatusProgress.fillPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- 2. THÀNH VIÊN GHÉP ĐƠN ĐÃ CHỌN XONG, CHỜ TRƯỞNG NHÓM -->
    <button
      v-else-if="isGroupGuest && isMyGuestSelectionDone"
      type="button"
      class="mcb-tracker-pill is-guest-done"
      @click="openMobilePanel('cart')"
    >
      <div class="mcb-tracker-main">
        <span class="mcb-tracker-ico">
          <i class="ri-check-double-line"></i>
        </span>
        <div class="mcb-tracker-info">
          <div class="mcb-tracker-title">{{ $t('group.doneStatus') }}</div>
          <div class="mcb-tracker-sub">
            {{ cartQtyTotal }} {{ $t('group.itemsCount') }} • {{ formatPrice(totalAmount, cartCurrency) }}
          </div>
        </div>
        <span class="mcb-action-cta">
          <span>{{ $t('mobile.cart') }}</span>
          <i class="ri-arrow-right-s-line"></i>
        </span>
      </div>
    </button>

    <!-- 3. CHƯA GỬI ĐƠN (GIỎ HÀNG / THANH TOÁN MÀU ĐỎ) -->
    <div v-else class="mcb-pills-row">
      <!-- PILL TRÁI: Icon giỏ hàng + badge số lượng -->
      <div class="cart-bar-pill-left" @click="openMobilePanel('cart')">
        <i class="ri-shopping-cart-2-fill cart-bar-icon"></i>
        <span class="cart-bar-badge">{{ cartQtyTotal }}</span>
      </div>

      <!-- PILL PHẢI: Thanh toán / Hoàn thành + số tiền -->
      <button class="cart-bar-pill-right" @click="openMobilePanel('cart')">
        <span class="cart-bar-label">
          {{
            isGroupGuest
              ? $t('group.guestFinishBtn')
              : $t('mobile.checkout')
          }}
        </span>
        <span class="cart-bar-total">{{ formatPrice(totalAmount, cartCurrency) }}</span>
      </button>
    </div>
  </div>
</transition>

<div v-if="isMobile" class="mobile-bottom-bar">
  <!-- HOME -->
  <button
    :class="{ active: activeMobilePanel === 'home' }"
    @click="goHomeMobile"
  >
    <div class="btn-inner">
      <div class="btn-scale">
        <i class="ri-home-4-line"></i>
        <span class="btn-label">Home</span>
      </div>
    </div>
  </button>
  <!-- DANH MỤC -->
 <button
  :class="{ active: activeMobilePanel === 'category' }"
  @click="openMobilePanel('category')"
>
  <div class="btn-inner">
    <div class="btn-scale category-btn-wrap">
      <i class="ri-list-check"></i>

      <!--  SALE BADGE -->
      <span
        v-if="hasSale"
        class="sale-badge"
      >
        SALE
      </span>

      <span class="btn-label">
        {{ $t('mobile.category') }}
      </span>
    </div>
  </div>
</button>

  <!-- GIỎ HÀNG -->
  <button
    class="cart-btn"
    :class="{ active: activeMobilePanel === 'cart' }"
    @click="openMobilePanel('cart')"
  >
    <div class="btn-inner">
      <div class="btn-scale">
        <div class="cart-icon-wrap">
          <i class="ri-shopping-cart-2-fill" :style="{ color: activeMobilePanel === 'cart' ? '#ffffff' : '#16a34a' }"></i>

          <span
            v-if="cartItems.length && (!liveStatus || liveStatus === 'Nháp')"
            class="cart-badge"
            :class="{ bump: bumpCart }"
          >
            {{
              cartItems.reduce((sum, i) => sum + i.qty, 0)
            }}
          </span>
        </div>
        <span class="btn-label">{{ $t('mobile.cart') }}</span>
      </div>
    </div>
  </button>
  <!-- TIẾN TRÌNH ĐƠN HÀNG (NẰM BÊN PHẢI NÚT GIỎ HÀNG) -->
  <button
    type="button"
    class="progress-tab-btn"
    :class="{ active: activeMobilePanel === 'progress' }"
    @click="openMobilePanel('progress')"
  >
    <div class="btn-inner">
      <div class="btn-scale">
        <div class="progress-icon-wrap">
          <i class="ri-route-line"></i>
          <span
            v-if="liveStatus && liveStatus !== 'Nháp'"
            class="progress-live-dot"
            :class="{ paused: orderStatusProgress.isTerminal }"
          ></span>
        </div>
        <span class="btn-label">{{ $t('mobile.progress') }}</span>
      </div>
    </div>
  </button>
  <!-- LIÊN HỆ -->
  <button
    :class="{ active: activeMobilePanel === 'contact' }"
    @click="openMobilePanel('contact')"
  >
    <div class="btn-inner">
      <div class="btn-scale">
        <i class="ri-customer-service-fill"></i>
        <span class="btn-label">{{ $t('mobile.contact') }}</span>
      </div>
    </div>
  </button>



  <!-- GỬI ĐƠN (TRƯỞNG NHÓM) / HOÀN THÀNH (THÀNH VIÊN GHÉP) -->
  <button
    :class="{ active: activeMobilePanel === 'export' }"
    @click="onMobileSendTab"
  >
    <div class="btn-inner">
      <div class="btn-scale">
        <div class="send-icon-wrap">
          <i
            :class="
              isGroupGuest
                ? isMyGuestSelectionDone
                  ? 'ri-checkbox-circle-fill'
                  : 'ri-check-double-line'
                : 'ri-send-plane-fill'
            "
            :style="{ color: activeMobilePanel === 'export' ? '#ffffff' : '#16a34a' }"
          ></i>
          <span
            v-if="cartItems.length && (!liveStatus || liveStatus === 'Nháp')"
            class="send-badge"
          >
            {{ cartQtyTotal }}
          </span>
        </div>
        <span class="btn-label">
          {{
            isGroupGuest
              ? isMyGuestSelectionDone
                ? $t('group.doneStatus')
                : $t('group.mobileGuestDone')
              : $t('mobile.send')
          }}
        </span>
      </div>
    </div>
  </button>
</div>

<!-- ===== TRANG TIẾN TRÌNH ĐƠN HÀNG RIÊNG TRÊN MOBILE ===== -->
<transition name="mobile-modal">
  <div
    v-if="isMobile && showProgressModal"
    class="mobile-sheet-backdrop is-progress"
    @click="closeProgressMobile"
  ></div>
</transition>
<transition name="mobile-modal">
  <aside
    v-if="isMobile && showProgressModal"
    class="mob-progress-sheet"
    @click.stop
  >
    <div class="mps-header">
      <button
        type="button"
        class="mps-back-btn"
        :aria-label="$t('cart.back')"
        @click="closeProgressMobile"
      >
        <i class="ri-arrow-left-line"></i>
      </button>

      <div class="mps-title-wrap">
        <span class="mps-title">{{ $t('mobile.progressTitle') }}</span>
        <span v-if="activeOrderId" class="mps-code-pill">#{{ activeOrderId }}</span>
      </div>

      <button
        type="button"
        class="mps-close-btn"
        :aria-label="$t('cart.hideCart')"
        @click="closeProgressMobile"
      >
        <i class="ri-close-line"></i>
      </button>
    </div>

    <div class="mps-scroll-body">
      <!-- BÊN TRÊN: THANH TIẾN TRÌNH KIỂU GRAB -->
      <section class="mps-progress-section">
        <div
          class="grab-status-card in-progress-page"
          :class="[orderStatusInfo.stateClass, { 'is-cancelled': orderStatusProgress.isCancelled }]"
        >
          <div class="gs-top-row">
            <span class="gs-status-main">
              <span class="gs-live-dot" :class="{ paused: orderStatusProgress.isTerminal }"></span>
              <i class="gs-main-ico" :class="orderStatusInfo.icon"></i>
              <strong class="gs-status-text">{{ orderStatusInfo.text }}</strong>
            </span>
            <span v-if="!orderStatusProgress.isCancelled" class="gs-step-count">
              {{ orderStatusProgress.activeIndex + 1 }}/{{ orderStatusProgress.steps.length }}
            </span>
          </div>

          <div v-if="!orderStatusProgress.isCancelled" class="gs-stepper">
            <div class="gs-rail">
              <div
                class="gs-rail-fill"
                :style="{ width: `${orderStatusProgress.fillPercent}%` }"
              ></div>
            </div>

            <div class="gs-steps-grid">
              <div
                v-for="(st, sIdx) in orderStatusProgress.steps"
                :key="'mps-st-' + st.key"
                class="gs-step"
                :class="{
                  'is-done': sIdx < orderStatusProgress.activeIndex,
                  'is-current': sIdx === orderStatusProgress.activeIndex,
                  'is-upcoming': sIdx > orderStatusProgress.activeIndex,
                  'is-shipping-active': st.key === 'shipping' && sIdx === orderStatusProgress.activeIndex
                }"
              >
                <div class="gs-node">
                  <span v-if="sIdx === orderStatusProgress.activeIndex && !orderStatusProgress.isTerminal" class="gs-pulse-ring"></span>
                  <i
                    :class="
                      sIdx < orderStatusProgress.activeIndex
                        ? 'ri-check-line'
                        : st.icon
                    "
                  ></i>
                </div>
                <span class="gs-label">{{ st.label }}</span>
              </div>
            </div>
          </div>

          <div v-if="liveStatus && liveStatus !== 'Nháp'" class="mps-saved-row">
            <span class="exm-saved-pill">
              <i class="ri-checkbox-circle-fill"></i> {{ $t('export.savedWeb') }}
            </span>
          </div>
        </div>

        <div
          v-if="liveStatus && liveStatus !== 'Nháp'"
          class="mps-status-notice"
          :class="orderStatusInfo.stateClass"
        >
          <i :class="orderStatusInfo.icon"></i>
          <span>
            {{
              liveStatus === 'Đã hủy'
                ? $t('orderStatus.cancelledNotice')
                : liveStatus === 'Hoàn thành'
                  ? $t('orderStatus.completedNotice')
                  : liveStatus === 'Đang ship'
                    ? $t('orderStatus.shippingNotice')
                    : liveStatus === 'Đang xử lý'
                      ? $t('group.statusApproved')
                      : $t('group.statusPending')
            }}
          </span>
        </div>
      </section>

      <!-- CHƯA CÓ ĐƠN HÀNG NÀO -->
      <section
        v-if="isCartVisuallyEmpty && (!liveStatus || liveStatus === 'Nháp')"
        class="mps-card mps-empty-card"
      >
        <i class="ri-route-line mps-empty-ico"></i>
        <p class="mps-empty-text">{{ $t('mobile.progressEmptyHint') }}</p>
        <button
          type="button"
          class="finish-btn mps-browse-btn"
          @click="goHomeMobile"
        >
          <i class="ri-restaurant-line"></i>
          <span>{{ $t('mobile.browseMenu') }}</span>
        </button>
      </section>

      <!-- BÊN DƯỚI: TOÀN BỘ THÔNG TIN ĐƠN HÀNG -->
      <template v-else>
        <!-- 1. THÔNG TIN KHÁCH HÀNG & GIAO NHẬN -->
        <section class="mps-card">
          <div class="mps-card-head">
            <span class="mps-card-title">
              <i class="ri-map-pin-user-fill"></i>
              <span>{{ $t('cart.deliveryTitle') }}</span>
            </span>
            <button
              v-if="isGroupHost && !isOrderLocked"
              type="button"
              class="mps-inline-edit-btn"
              @click="openCheckoutFromProgress"
            >
              <i class="ri-edit-line"></i>
              <span>{{ $t('cart.editShort') }}</span>
            </button>
          </div>

          <div class="mps-info-list">
            <div v-if="activeOrderId" class="mps-info-row">
              <span class="mps-info-lbl">{{ $t('group.orderCode') }}</span>
              <strong class="mps-info-val is-code">#{{ activeOrderId }}</strong>
            </div>
            <div v-if="tenKhach || memberName" class="mps-info-row">
              <span class="mps-info-lbl">{{ $t('cart.name') }}</span>
              <span class="mps-info-val">{{ tenKhach || memberName }}</span>
            </div>
            <div v-if="sdt" class="mps-info-row">
              <span class="mps-info-lbl">{{ $t('cart.phone') }}</span>
              <span class="mps-info-val">{{ sdt }}</span>
            </div>
            <div v-if="diaChi" class="mps-info-row">
              <span class="mps-info-lbl">{{ $t('cart.address') }}</span>
              <span class="mps-info-val">{{ diaChi }}</span>
            </div>
            <div v-if="thoiGian" class="mps-info-row">
              <span class="mps-info-lbl">{{ $t('cart.time') }}</span>
              <span class="mps-info-val">{{ thoiGian }}</span>
            </div>
            <div class="mps-info-row">
              <span class="mps-info-lbl">{{ $t('cart.payment') }}</span>
              <span class="mps-info-val mps-pay-val">
                <span>{{ hinhThucTT === 'CHUYEN_KHOAN' ? $t('cart.transfer') : $t('cart.cash') }}</span>
                <button
                  v-if="hinhThucTT === 'CHUYEN_KHOAN' && ckList.length"
                  type="button"
                  class="qr-banking-side-btn mini"
                  @click="showCKModal = true"
                >
                  <i class="ri-qr-code-line"></i>
                  <span>QR Banking</span>
                </button>
              </span>
            </div>
            <div v-if="ghiChu" class="mps-info-row">
              <span class="mps-info-lbl">{{ $t('cart.note') }}</span>
              <span class="mps-info-val">{{ ghiChu }}</span>
            </div>
          </div>
        </section>

        <!-- 2. DANH SÁCH MÓN & TỔNG CỘNG -->
        <section class="mps-card">
          <div class="mps-card-head">
            <span class="mps-card-title">
              <i class="ri-shopping-basket-2-fill"></i>
              <span>{{ $t('mobile.orderDetailsTitle') }}</span>
            </span>
            <span class="mps-count-pill">{{ cartQtyTotal }} {{ $t('group.itemsCount') }}</span>
          </div>

          <div v-if="!activeOrderId" class="mps-items-list">
            <div
              v-for="(i, idx) in cartItems"
              :key="'mps-solo-' + i.lineId"
              class="mps-item-row"
            >
              <div class="mps-item-left">
                <img v-if="i.Main_img" :src="i.Main_img" class="mps-item-thumb" alt="" />
                <span v-else class="mps-item-idx">{{ idx + 1 }}</span>
                <div class="mps-item-meta">
                  <div class="mps-item-name">{{ i.Ten_hang }}</div>
                  <div class="mps-item-sub">
                    x{{ i.qty }} • {{ formatPrice(i.unitPrice, i.Don_vi_tien_te) }}<template v-if="i.Dvt">/{{ i.Dvt }}</template>
                  </div>
                  <div v-if="i.note" class="mps-item-note">
                    <i class="ri-file-text-line"></i> {{ i.note }}
                  </div>
                </div>
              </div>
              <strong class="mps-item-total">{{ formatPrice(i.thanhTien, i.Don_vi_tien_te) }}</strong>
            </div>
          </div>

          <div v-else class="mps-group-blocks">
            <div
              v-for="grp in cartMemberGroups"
              :key="'mps-grp-' + grp.groupKey"
              class="mps-group-block"
            >
              <div class="mps-group-hdr">
                <span class="mps-group-name">
                  <i :class="grp.role === 'host' ? 'ri-vip-crown-fill' : grp.role === 'admin' ? 'ri-store-2-fill' : 'ri-user-3-fill'"></i>
                  {{ grp.name }}
                  <span v-if="grp.isMe" class="cm-badge me">{{ $t('group.youBadge') }}</span>
                </span>
                <span class="mps-group-sub">{{ grp.totalQty }} {{ $t('group.itemsCount') }} • {{ formatPrice(grp.subtotal, cartCurrency) }}</span>
              </div>

              <div class="mps-items-list">
                <div
                  v-for="(i, idx) in grp.items"
                  :key="'mps-grp-it-' + i.lineId"
                  class="mps-item-row"
                >
                  <div class="mps-item-left">
                    <img v-if="i.Main_img" :src="i.Main_img" class="mps-item-thumb" alt="" />
                    <span v-else class="mps-item-idx">{{ idx + 1 }}</span>
                    <div class="mps-item-meta">
                      <div class="mps-item-name">{{ i.Ten_hang }}</div>
                      <div class="mps-item-sub">
                        x{{ i.qty }} • {{ formatPrice(i.unitPrice, i.Don_vi_tien_te) }}<template v-if="i.Dvt">/{{ i.Dvt }}</template>
                      </div>
                      <div v-if="i.note" class="mps-item-note">
                        <i class="ri-file-text-line"></i> {{ i.note }}
                      </div>
                    </div>
                  </div>
                  <strong class="mps-item-total">{{ formatPrice(i.thanhTien, i.Don_vi_tien_te) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div v-if="unlockedMilestones.length" class="mps-promo-earned">
            <span class="mps-promo-lbl">
              <i class="ri-gift-2-fill"></i> {{ $t('promo.earnedTitle') }}:
            </span>
            <span class="mps-promo-vals">
              {{ unlockedMilestones.map((m) => m.label).join(' + ') }}
            </span>
          </div>

          <div class="mps-grand-total">
            <span>{{ $t('cart.total') }}</span>
            <strong>{{ formatPrice(totalAmount, cartCurrency) }}</strong>
          </div>
        </section>

        <!-- 3. NỘI DUNG ĐƠN HÀNG & GỬI NHANH QUA KÊNH LIÊN HỆ -->
        <section class="mps-card">
          <div class="mps-card-head">
            <span class="mps-card-title">
              <i class="ri-article-line"></i>
              <span>{{ $t('export.messageLabel') }}</span>
            </span>
            <button
              type="button"
              class="exm-copy-inline-btn"
              :class="{ copied }"
              @click="copy"
            >
              <i :class="copied ? 'ri-check-line' : 'ri-file-copy-line'"></i>
              <span>{{ copied ? $t('export.copied') : $t('export.copy') }}</span>
            </button>
          </div>

          <textarea
            class="exm-textarea mps-export-textarea"
            rows="6"
            readonly
            :value="exportText"
          ></textarea>

          <div v-if="messagingContactList.length" class="exm-send-section mps-send-channels">
            <div class="exm-send-heading">
              <i class="ri-send-plane-line"></i>
              <span>{{ $t('export.sendChannelTitle') }}</span>
            </div>
            <div
              class="exm-channels-grid"
              :class="{ 'is-single': messagingContactList.length === 1 }"
            >
              <button
                v-for="c in messagingContactList"
                :key="'mps-ch-' + c.ID"
                type="button"
                class="exm-channel-btn"
                @click="sendToShop(c)"
              >
                <img v-if="c.URL_img" :src="c.URL_img" class="exm-channel-img" alt="" />
                <span class="exm-channel-label">{{ $t('export.send') }} {{ c.PLATFORM_name }}</span>
                <i class="ri-arrow-right-up-line exm-channel-arrow"></i>
              </button>
            </div>
          </div>
        </section>

        <!-- HÀNH ĐỘNG ĐƠN HÀNG -->
        <div class="mps-actions">
          <button
            v-if="isOrderTerminal"
            type="button"
            class="finish-btn new-order-finish-btn"
            @click="startNewOrder"
          >
            + {{ $t('group.newOrderBtn') }}
          </button>
          <template v-else-if="isOrderLocked">
            <button
              type="button"
              class="finish-btn mps-contact-shop-btn"
              @click="openLockedOrderContactPrompt"
            >
              <i class="ri-chat-3-line"></i>
              <span>{{ $t('group.messageShopBtn') }}</span>
            </button>
            <button
              type="button"
              class="mps-secondary-action-btn"
              @click="startNewOrder"
            >
              + {{ $t('group.newOrderBtn') }}
            </button>
          </template>
          <button
            v-else-if="isGroupHost && !isOrderLocked"
            type="button"
            class="mps-secondary-action-btn"
            @click="openCheckoutFromProgress"
          >
            <i class="ri-edit-box-line"></i>
            <span>{{ $t('mobile.editOrder') }}</span>
          </button>
        </div>
      </template>
    </div>
  </aside>
</transition>

<!-- ===== MODAL CHỌN NGÔN NGỮ ===== -->
<!-- ===== MODAL CHỌN NGÔN NGỮ ===== -->
<div v-if="showLangModal" class="modal-overlay">
  <div class="modal-card lang-modal">

    <!-- HEADER -->
    <div class="lang-modal-header">
      <div class="lang-title">
        {{ $t('modal.chooseLang') }}
      </div>

      <!-- NÚT TẮT -->
      <button class="lang-close-btn" @click="showLangModal = false">
        ✕
      </button>
    </div>

    <!-- LIST -->
<div class="lang-list">
  <button
    v-for="l in languages"
    :key="l.code"
    class="lang-item"
    :disabled="langLoading"
    @click="selectLanguage(l.code)"
  >
    <img :src="l.flagImg" class="lang-flag" />
    <span class="lang-label">{{ l.label }}</span>
  </button>

  <!-- LOADING OVERLAY -->
  <div v-if="langLoading" class="lang-loading">
    <div class="spinner"></div>
    <div class="loading-text">{{ $t('modal.loading') }}</div>
  </div>
</div>


  </div>
 
</div>


 <!-- ===== MODAL IMAGE PREVIEW ===== -->
<Teleport to="body">
  <div
    v-if="showImageModal"
    class="modal-overlay image-modal"
    @click="closeImageModal"
  >
    <div class="image-modal-card" @click.stop>
      <button class="modal-close" @click="closeImageModal">✕</button>

      <img
        :src="previewImage"
        class="image-preview"
        alt=""
      />
    </div>
  </div>
</Teleport>

<!-- ===== MODAL CHỈNH SỐ LƯỢNG ===== -->
<div
  v-if="showEditQtyModal"
  class="modal-overlay z-top"
  @click="closeEditQtyModal"
>

  <div class="modal-card qty-modal" @click.stop>

    <!-- close -->
    <button class="modal-close" @click="closeEditQtyModal">✕</button>


    <!-- tên hàng -->
    <div class="qty-title">
      {{ editingItem?.Ten_hang || editingItem?.name }}
    </div>

    <!-- qty control -->
    <div class="modal-qty">
      <button @click="editQty > 1 && editQty--">−</button>
      <input type="number" v-model.number="editQty" min="1" />
      <!-- DVT -->
      <span v-if="editingItem?.DVT || editingItem?.Dvt" class="qty-dvt">
        /{{ editingItem?.DVT || editingItem?.Dvt }}
      </span>
      <button @click="editQty++">+</button>
    </div>

    <!-- NGƯỜI ĐẶT -->
    <div v-if="!editingItem?.isAdminAdded" class="note-box" style="margin-bottom: 10px; width: 100%">
      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px; color:#4b5563;">
        {{ $t('group.orderedBy') }}
      </label>
      <input
        v-model="editAuthor"
        type="text"
        style="width:100%; border:1px solid #d1fae5; border-radius:8px; padding:8px; outline:none; font-size:14px;"
        :placeholder="$t('group.yourNamePlaceholder')"
      />
    </div>

    <!-- GHI CHÚ -->
    <div class="note-box" style="margin-bottom: 12px;width:100%">
      <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px; color:#4b5563;">
        {{ $t('menu.note') }}
      </label>
      <textarea
        v-model="editNote"
        rows="2"
        style="width:100%; border:1px solid #d1fae5; border-radius:8px; padding:8px; outline:none; font-size:14px;"
        placeholder="..."
      ></textarea>
    </div>

    <!-- save -->
    <button class="save-btn" @click="saveEditQty">
      {{ $t('cart.save') }}
    </button>

  </div>
</div>
<div
  v-if="showCKModal"
  class="modal-overlay z-top"
  @click="showCKModal = false"
>
  <div class="modal-card ck-modal" @click.stop>
    <button class="modal-close" @click="showCKModal = false">✕</button>

    <h3 class="export-title">
      <i class="ri-bank-card-fill"></i>
      THÔNG TIN CHUYỂN KHOẢN
    </h3>

   <div v-if="ckList.length" class="ck-list" :style="ckListStyle">
  <div v-for="c in ckList" :key="c.ID" class="ck-card">

    <!-- (1) TIÊU ĐỀ (pill góc phải) -->
    <div class="ck-title">{{ c.Tieu_de }}</div>

    <!-- (2) TÊN NCC -->
<!-- (2) TÊN NCC -->
<div class="ck-ncc-wrap">
  <img
    v-if="logo?.URL"
    :src="logo.URL"
    class="ck-ncc-logo"
    alt="logo"
  />

  <div class="ck-ncc">
    {{ logo?.Name || 'SA KITCHEN' }}
  </div>
</div>



<!--  SỐ TIỀN CHUYỂN -->
<div class="ck-amount">
  {{ soTienChuyenKhoan(c) }}
  <span class="ck-note">(Chưa tính ship)</span>
</div>



    <!-- (3) QR -->
    <div class="ck-qr-wrap" v-if="c.QR_IMG">
      <img :src="c.QR_IMG" class="ck-qr" alt="" />
    </div>

    <!-- (4) THÔNG TIN -->
    <div class="ck-info">
      {{ c.ThongTin }}
    </div>

  </div>
</div>

    <div v-else class="ck-empty">
      Chưa có thông tin chuyển khoản cho NCC này.
    </div>
  </div>
</div>
<!-- ===== 100% FULL-SCREEN 2-COLUMN CHECKOUT WORKSPACE ===== -->
<div v-if="showFullCartModal" class="modal-overlay full-cart-overlay" @click="showFullCartModal = false">
  <div class="modal-card full-checkout-modal" @click.stop>
    <!-- HEADER -->
    <div class="fcm-header" :class="{ 'is-mobile-header': isMobile }">
      <div class="fcm-header-left">
        <button
          type="button"
          class="fcm-back-menu-btn"
          @click="showFullCartModal = false"
        >
          <i class="ri-arrow-left-line"></i>
          <span>{{ $t('cart.backToMenu') }}</span>
        </button>

        <div class="fcm-title-wrap">
          <i :class="isMobile ? 'ri-map-pin-user-fill' : 'ri-shopping-basket-2-fill'"></i>
          <span>{{ isMobile ? $t('cart.deliveryTitle') : $t('cart.title') }}</span>
          <span class="fcm-count-pill">{{ cartQtyTotal }} {{ $t('group.itemsCount') }}</span>
        </div>

        <div
          v-if="!isMobile && activeOrderId"
          class="fcm-live-pill"
          :class="{
            draft: liveStatus === 'Nháp' || !liveStatus,
            pending: liveStatus === 'Chờ duyệt',
            approved: liveStatus === 'Đang xử lý',
            shipping: liveStatus === 'Đang ship',
            completed: liveStatus === 'Hoàn thành',
            cancelled: liveStatus === 'Đã hủy'
          }"
        >
          <i class="ri-radar-line"></i>
          <span>#{{ activeOrderId }}</span>
        </div>
      </div>

      <div class="fcm-header-right">
        <div
          v-if="isMobile && activeOrderId"
          class="fcm-live-pill"
          :class="{
            draft: liveStatus === 'Nháp' || !liveStatus,
            pending: liveStatus === 'Chờ duyệt',
            approved: liveStatus === 'Đang xử lý',
            shipping: liveStatus === 'Đang ship',
            completed: liveStatus === 'Hoàn thành',
            cancelled: liveStatus === 'Đã hủy'
          }"
        >
          <i class="ri-radar-line"></i>
          <span>#{{ activeOrderId }}</span>
        </div>

        <button
          type="button"
          class="group-invite-btn fcm-invite-btn"
          :disabled="creatingGroupSession"
          @click="openGroupShareModal"
        >
          <i class="ri-qr-code-line"></i>
          <span>{{ $t('group.groupOrderBtn') }}</span>
        </button>

        <button
          v-if="activeOrderId && (liveStatus === 'Nháp' || isOrderLocked)"
          type="button"
          class="lob-new-btn fcm-new-btn"
          @click="startNewOrder"
        >
          + {{ $t('group.newOrderBtn') }}
        </button>

        <button
          type="button"
          class="fcm-close-btn"
          :title="$t('cart.collapseShort')"
          @click="showFullCartModal = false"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
    </div>

    <!-- 2-COLUMN BODY (MOBILE CHỈ HIỆN THÔNG TIN GIAO NHẬN) -->
    <div class="fcm-body" :class="{ 'is-mobile-form-only': isMobile }">
      <!-- LEFT PANE: SOLO ITEMS OR COLLAPSIBLE MEMBER CATEGORIES (~60%) -->
      <div v-if="!isMobile" class="fcm-left-pane">
        <!-- GROUP TOOLBAR: TÊN CỦA BẠN + MỞ/THU GỌN TẤT CẢ (CHỈ KHI GHÉP ĐƠN) -->
        <div v-if="activeOrderId" class="fcm-group-toolbar">
          <div v-if="!isOrderLocked" class="group-member-bar fcm-member-bar">
            <i :class="isGroupHost ? (hasGroupMembers ? 'ri-vip-crown-line' : 'ri-user-3-line') : 'ri-user-3-line'"></i>
            <input
              v-model="memberName"
              type="text"
              class="group-member-input"
              :placeholder="`${$t('group.yourName')}: ${$t('group.yourNamePlaceholder')}`"
              @change="onMemberNameChange"
            />
            <span
              v-if="isGroupGuest || hasGroupMembers"
              class="gmb-role-pill"
              :class="{ host: isGroupHost, guest: isGroupGuest }"
            >
              {{ isGroupHost ? $t('group.hostBadge') : $t('group.memberBadge') }}
            </span>
          </div>

          <button
            v-if="cartMemberGroups.length > 1"
            type="button"
            class="fcm-expand-all-btn"
            @click="toggleAllModalMemberGroups"
          >
            <i :class="areAllModalMemberGroupsOpen ? 'ri-contract-up-down-line' : 'ri-expand-up-down-line'"></i>
            <span>{{ areAllModalMemberGroupsOpen ? $t('group.collapseAll') : $t('group.expandAll') }}</span>
          </button>
        </div>

        <div
          v-if="isCartVisuallyEmpty"
          class="cart-empty-placeholder fcm-empty"
        >
          <i class="ri-shopping-basket-2-line"></i>
          <span>{{ $t('group.emptyMemberItems') }}</span>
        </div>

        <!-- SOLO MODE: DANH SÁCH PHẲNG -->
        <div v-else-if="!activeOrderId" class="fcm-groups-scroll">
          <div class="cart-member-group full-modal-member-group fcm-solo-card">
            <div class="fcm-items-list">
              <div
                v-for="(i, idx) in cartItems"
                :key="'fcm-solo-' + i.lineId"
                class="fcm-item-row"
                :class="{ locked: !canModifyCartItem(i) }"
              >
                <div class="fcm-item-thumb" @click="canModifyCartItem(i) && openEditQty(i)">
                  <img v-if="i.Main_img" :src="i.Main_img" class="fcm-thumb-img" alt="" />
                  <span v-else class="fcm-thumb-idx">{{ idx + 1 }}</span>
                </div>

                <div class="fcm-item-info" @click="canModifyCartItem(i) && openEditQty(i)">
                  <div class="fcm-item-name">{{ i.Ten_hang }}</div>
                  <div class="fcm-item-price-row">
                    <span class="fcm-unit-price" :class="{ discounted: i.isDiscounted }">
                      {{ formatPrice(i.unitPrice, i.Don_vi_tien_te) }}<template v-if="i.Dvt">/{{ i.Dvt }}</template>
                    </span>
                    <button
                      v-if="canModifyCartItem(i)"
                      type="button"
                      class="fcm-edit-note-btn"
                      @click.stop="openEditQty(i)"
                    >
                      <i class="ri-edit-2-line"></i>
                      <span>{{ $t('cart.editNoteBtn') }}</span>
                    </button>
                  </div>
                  <div v-if="i.note" class="fcm-note-tag">
                    <i class="ri-file-text-line"></i>
                    <span>{{ i.note }}</span>
                  </div>
                </div>

                <div class="fcm-item-controls">
                  <div v-if="canModifyCartItem(i)" class="fcm-stepper">
                    <button
                      type="button"
                      class="fcm-step-btn"
                      @click.stop="changeCartItemQtyDirect(i, -1)"
                    >
                      <i class="ri-subtract-line"></i>
                    </button>
                    <span class="fcm-step-val">{{ i.qty }}</span>
                    <button
                      type="button"
                      class="fcm-step-btn"
                      @click.stop="changeCartItemQtyDirect(i, 1)"
                    >
                      <i class="ri-add-line"></i>
                    </button>
                  </div>
                  <span v-else class="sc-qty-badge">x{{ i.qty }}</span>

                  <div class="fcm-item-subtotal">
                    {{ formatPrice(i.thanhTien, i.Don_vi_tien_te) }}
                  </div>

                  <button
                    v-if="canModifyCartItem(i)"
                    type="button"
                    class="sc-remove-btn fcm-remove-btn"
                    @click.stop="removeItem(i)"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GROUP MODE TRONG MODAL 100%: MẶC ĐỊNH MỞ TẤT CẢ DANH MỤC CỦA TỪNG NGƯỜI -->
        <div v-else class="fcm-groups-scroll">
          <div
            v-for="grp in cartMemberGroups"
            :key="'full-' + grp.groupKey"
            class="cart-member-group full-modal-member-group"
            :class="{
              'is-host': grp.role === 'host',
              'is-admin': grp.role === 'admin',
              'is-me': grp.isMe,
              'is-collapsed': !isModalMemberGroupOpen(grp)
            }"
          >
            <div
              role="button"
              tabindex="0"
              class="cart-member-header clickable-member-header"
              @click="toggleModalMemberGroupOpen(grp)"
              @keydown.enter.space.prevent="toggleModalMemberGroupOpen(grp)"
            >
              <div class="cm-header-left">
                <i
                  class="cm-role-ico"
                  :class="
                    grp.role === 'host'
                      ? hasGroupMembers
                        ? 'ri-vip-crown-fill'
                        : 'ri-user-3-fill'
                      : grp.role === 'admin'
                        ? 'ri-store-2-fill'
                        : 'ri-user-3-fill'
                  "
                ></i>
                <span class="cm-name">{{ grp.name }}</span>
                <span v-if="grp.isMe" class="cm-badge me">{{ $t('group.youBadge') }}</span>
                <span
                  v-if="grp.role === 'admin' || hasGroupMembers"
                  class="cm-badge"
                  :class="grp.role"
                >
                  {{
                    grp.role === 'host'
                      ? $t('group.hostBadge')
                      : grp.role === 'admin'
                        ? $t('group.addedByShop')
                        : $t('group.memberBadge')
                  }}
                </span>
              </div>

              <div class="cm-header-right">
                <span
                  v-if="grp.role === 'guest' && !isOrderLocked"
                  class="cm-status-pill"
                  :class="{ done: grp.done }"
                >
                  <i :class="grp.done ? 'ri-check-line' : 'ri-time-line'"></i>
                  {{ grp.done ? $t('group.doneStatus') : $t('group.selectingStatus') }}
                </span>
                <span class="cm-summary">
                  {{ grp.totalQty }} {{ $t('group.itemsCount') }} • {{ formatPrice(grp.subtotal, cartCurrency) }}
                </span>
                <button
                  v-if="isGroupHost && !isOrderLocked && grp.role === 'guest'"
                  type="button"
                  class="cm-remove-member-btn"
                  :disabled="removingMemberKey === grp.groupKey"
                  :title="$t('group.removeMemberBtn')"
                  :aria-label="$t('group.removeMemberBtn')"
                  @click.stop="requestRemoveMember(grp)"
                >
                  <i class="ri-user-unfollow-line"></i>
                </button>
                <i
                  class="cm-chevron-ico"
                  :class="isModalMemberGroupOpen(grp) ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                ></i>
              </div>
            </div>

            <div v-show="isModalMemberGroupOpen(grp)" class="cart-member-collapse-body">
              <div v-if="!grp.items.length" class="cart-member-empty">
                {{ $t('group.emptyMemberItems') }}
              </div>

              <div v-else class="fcm-items-list">
                <div
                  v-for="(i, idx) in grp.items"
                  :key="'fcm-item-' + i.lineId"
                  class="fcm-item-row"
                  :class="{ locked: !canModifyCartItem(i) }"
                >
                  <div class="fcm-item-thumb" @click="canModifyCartItem(i) && openEditQty(i)">
                    <img v-if="i.Main_img" :src="i.Main_img" class="fcm-thumb-img" alt="" />
                    <span v-else class="fcm-thumb-idx">{{ idx + 1 }}</span>
                  </div>

                  <div class="fcm-item-info" @click="canModifyCartItem(i) && openEditQty(i)">
                    <div class="fcm-item-name">{{ i.Ten_hang }}</div>
                    <div class="fcm-item-price-row">
                      <span class="fcm-unit-price" :class="{ discounted: i.isDiscounted }">
                        {{ formatPrice(i.unitPrice, i.Don_vi_tien_te) }}<template v-if="i.Dvt">/{{ i.Dvt }}</template>
                      </span>
                      <button
                        v-if="canModifyCartItem(i)"
                        type="button"
                        class="fcm-edit-note-btn"
                        @click.stop="openEditQty(i)"
                      >
                        <i class="ri-edit-2-line"></i>
                        <span>{{ $t('cart.editNoteBtn') }}</span>
                      </button>
                    </div>
                    <div v-if="i.note" class="fcm-note-tag">
                      <i class="ri-file-text-line"></i>
                      <span>{{ i.note }}</span>
                    </div>
                  </div>

                  <div class="fcm-item-controls">
                    <div v-if="canModifyCartItem(i)" class="fcm-stepper">
                      <button
                        type="button"
                        class="fcm-step-btn"
                        @click.stop="changeCartItemQtyDirect(i, -1)"
                      >
                        <i class="ri-subtract-line"></i>
                      </button>
                      <span class="fcm-step-val">{{ i.qty }}</span>
                      <button
                        type="button"
                        class="fcm-step-btn"
                        @click.stop="changeCartItemQtyDirect(i, 1)"
                      >
                        <i class="ri-add-line"></i>
                      </button>
                    </div>
                    <span v-else class="sc-qty-badge">x{{ i.qty }}</span>

                    <div class="fcm-item-subtotal">
                      {{ formatPrice(i.thanhTien, i.Don_vi_tien_te) }}
                    </div>

                    <button
                      v-if="canModifyCartItem(i)"
                      type="button"
                      class="sc-remove-btn fcm-remove-btn"
                      @click.stop="removeItem(i)"
                    >
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANE: DELIVERY & PAYMENT FORM + CHECKOUT FOOTER (~40%) -->
      <div class="fcm-right-pane">
        <div class="fcm-form-scroll" ref="fullModalFormRef">
          <template v-if="isGroupHost">
            <div class="fcm-section-heading">
              <i class="ri-map-pin-user-fill"></i>
              <span>{{ $t('cart.deliveryTitle') }}</span>
            </div>

            <div class="fcm-form-grid cart-form">
              <div class="form-field">
                <label>{{ $t('cart.name') }}</label>
                <input
                  v-model="tenKhach"
                  :disabled="isOrderLocked"
                  :placeholder="$t('cart.namePlaceholder')"
                  @focus="isEditingMeta = true"
                  @blur="onMetaBlur"
                />
              </div>

              <div class="form-field">
                <label>{{ $t('cart.phone') }}</label>
                <input
                  v-model="sdt"
                  :disabled="isOrderLocked"
                  :placeholder="$t('cart.phonePlaceholder')"
                  @focus="isEditingMeta = true"
                  @blur="onMetaBlur"
                />
              </div>

              <div class="form-field">
                <label>{{ $t('cart.address') }}</label>
                <input
                  v-model="diaChi"
                  :disabled="isOrderLocked"
                  :placeholder="$t('cart.addressPlaceholder')"
                  @focus="isEditingMeta = true"
                  @blur="onMetaBlur"
                />
              </div>

              <div class="form-field dt24-inline-field" :class="{ 'is-mobile-dt24': isMobile }">
                <label class="dt24-inline-label">{{ $t('cart.time') }}</label>

                <div v-if="isMobile && !isOrderLocked" class="dt24-mobile-presets">
                  <button
                    type="button"
                    class="dt24-preset-chip"
                    @click="setDeliveryTimeNow(0)"
                  >
                    <i class="ri-flashlight-line"></i> {{ $t('cart.timeNowBtn') }}
                  </button>
                  <button
                    type="button"
                    class="dt24-preset-chip"
                    @click="setDeliveryTimeNow(15)"
                  >
                    {{ $t('cart.timePlus15') }}
                  </button>
                  <button
                    type="button"
                    class="dt24-preset-chip"
                    @click="setDeliveryTimeNow(30)"
                  >
                    {{ $t('cart.timePlus30') }}
                  </button>
                  <button
                    type="button"
                    class="dt24-preset-chip"
                    @click="setDeliveryTimeNow(60)"
                  >
                    {{ $t('cart.timePlus60') }}
                  </button>
                  <button
                    v-if="thoiGian"
                    type="button"
                    class="dt24-preset-chip is-clear"
                    :aria-label="$t('menu.clearFilter')"
                    @click="clearDeliveryTime"
                  >
                    <i class="ri-close-line"></i>
                  </button>
                </div>

                <div class="dt24-picker-row" :class="{ disabled: isOrderLocked }">
                  <div class="dt24-segment dt24-pill is-time">
                    <i class="ri-time-line dt24-seg-ico"></i>
                    <select
                      class="dt24-select"
                      :class="{ empty: !parsedThoiGian.hh }"
                      :value="parsedThoiGian.hh"
                      :disabled="isOrderLocked"
                      @change="onPickDateTimePart('hh', $event.target.value)"
                    >
                      <option value="" disabled>{{ $t('cart.timeHour') }}</option>
                      <option v-for="h in HOURS_24_LIST" :key="'h24-' + h" :value="h">
                        {{ h }}
                      </option>
                    </select>
                    <span class="dt24-sep">:</span>
                    <select
                      class="dt24-select"
                      :class="{ empty: !parsedThoiGian.mm }"
                      :value="parsedThoiGian.mm"
                      :disabled="isOrderLocked"
                      @change="onPickDateTimePart('mm', $event.target.value)"
                    >
                      <option value="" disabled>{{ $t('cart.timeMinute') }}</option>
                      <option v-for="m in MINUTES_60_LIST" :key="'m60-' + m" :value="m">
                        {{ m }}
                      </option>
                    </select>
                  </div>

                  <div class="dt24-segment dt24-pill is-date">
                    <i class="ri-calendar-event-line dt24-seg-ico"></i>
                    <select
                      class="dt24-select"
                      :class="{ empty: !parsedThoiGian.dd }"
                      :value="parsedThoiGian.dd"
                      :disabled="isOrderLocked"
                      @change="onPickDateTimePart('dd', $event.target.value)"
                    >
                      <option value="" disabled>{{ $t('cart.timeDay') }}</option>
                      <option v-for="d in availableDaysList" :key="'d31-' + d" :value="d">
                        {{ d }}
                      </option>
                    </select>
                    <span class="dt24-sep">/</span>
                    <select
                      class="dt24-select"
                      :class="{ empty: !parsedThoiGian.mo }"
                      :value="parsedThoiGian.mo"
                      :disabled="isOrderLocked"
                      @change="onPickDateTimePart('mo', $event.target.value)"
                    >
                      <option value="" disabled>{{ $t('cart.timeMonth') }}</option>
                      <option v-for="mo in MONTHS_12_LIST" :key="'mo12-' + mo" :value="mo">
                        {{ mo }}
                      </option>
                    </select>
                    <span class="dt24-sep">/</span>
                    <select
                      class="dt24-select dt24-year"
                      :class="{ empty: !parsedThoiGian.yyyy }"
                      :value="parsedThoiGian.yyyy"
                      :disabled="isOrderLocked"
                      @change="onPickDateTimePart('yyyy', $event.target.value)"
                    >
                      <option value="" disabled>{{ $t('cart.timeYear') }}</option>
                      <option v-for="y in availableYearsList" :key="'yr-' + y" :value="y">
                        {{ y }}
                      </option>
                    </select>
                  </div>

                  <div v-if="!isMobile && !isOrderLocked" class="dt24-quick-actions">
                    <button
                      type="button"
                      class="dt24-now-btn"
                      @click="setDeliveryTimeNow(0)"
                    >
                      <i class="ri-flashlight-line"></i> {{ $t('cart.timeNowBtn') }}
                    </button>
                    <button
                      v-if="thoiGian"
                      type="button"
                      class="dt24-clear-btn"
                      @click="clearDeliveryTime"
                    >
                      <i class="ri-close-line"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-field">
                <label>{{ $t('cart.payment') }}</label>
                <div class="cart-pay-inline-row">
                  <div class="cart-pay-toggle">
                    <button
                      type="button"
                      class="cart-pay-btn"
                      :class="{ active: hinhThucTT !== 'CHUYEN_KHOAN' }"
                      :disabled="isOrderLocked"
                      @click="setPaymentMethod('TIEN_MAT')"
                    >
                      <i class="ri-money-dollar-circle-fill"></i> {{ $t('cart.cash') }}
                    </button>
                    <button
                      type="button"
                      class="cart-pay-btn transfer"
                      :class="{ active: hinhThucTT === 'CHUYEN_KHOAN' }"
                      :disabled="isOrderLocked"
                      @click="setPaymentMethod('CHUYEN_KHOAN')"
                    >
                      <i class="ri-bank-card-fill"></i> {{ $t('cart.transfer') }}
                    </button>
                  </div>

                  <button
                    v-if="hinhThucTT === 'CHUYEN_KHOAN' && ckList.length"
                    type="button"
                    class="qr-banking-side-btn"
                    @click="showCKModal = true"
                  >
                    <i class="ri-qr-code-line"></i>
                    <span>QR Banking</span>
                  </button>
                </div>
              </div>

              <div class="form-field" style="margin-bottom: 0;">
                <label>{{ $t('cart.note') }}</label>
                <textarea
                  v-model="ghiChu"
                  rows="2"
                  :disabled="isOrderLocked"
                  :placeholder="$t('cart.notePlaceholder')"
                  @focus="isEditingMeta = true"
                  @blur="onMetaBlur"
                ></textarea>
              </div>
            </div>
          </template>

          <div v-else class="guest-info-area">
            <div
              v-if="tenKhach || sdt || diaChi || thoiGian || ghiChu"
              class="guest-delivery-preview"
            >
              <div class="gdp-title">
                <i class="ri-truck-line"></i>
                <span>{{ $t('group.guestDeliveryPreview') }}</span>
              </div>
              <div v-if="tenKhach || sdt" class="gdp-row">
                <i class="ri-user-line"></i>
                <span>{{ [tenKhach, sdt].filter(Boolean).join(' • ') }}</span>
              </div>
              <div v-if="diaChi" class="gdp-row">
                <i class="ri-map-pin-line"></i>
                <span>{{ diaChi }}</span>
              </div>
              <div v-if="thoiGian" class="gdp-row">
                <i class="ri-time-line"></i>
                <span>{{ thoiGian }}</span>
              </div>
              <div class="gdp-row">
                <i class="ri-wallet-3-line"></i>
                <span>{{ hinhThucTT === 'CHUYEN_KHOAN' ? $t('cart.transfer') : $t('cart.cash') }}</span>
                <button
                  v-if="hinhThucTT === 'CHUYEN_KHOAN' && ckList.length"
                  type="button"
                  class="qr-banking-side-btn mini"
                  @click="showCKModal = true"
                >
                  <i class="ri-qr-code-line"></i>
                  <span>QR Banking</span>
                </button>
              </div>
            </div>

            <div v-if="isMyGuestSelectionDone && !isOrderLocked" class="guest-waiting-card">
              <i class="ri-checkbox-circle-line"></i>
              <span>{{ $t('group.guestWaitingHost') }}</span>
            </div>
          </div>

          <div
            v-if="isOrderLocked"
            class="fcm-locked-box"
            :class="{
              'is-shipping': liveStatus === 'Đang ship',
              'is-completed': liveStatus === 'Hoàn thành',
              'is-cancelled': liveStatus === 'Đã hủy'
            }"
          >
            <i
              :class="
                liveStatus === 'Đã hủy'
                  ? 'ri-close-circle-line'
                  : liveStatus === 'Hoàn thành'
                    ? 'ri-checkbox-circle-line'
                    : liveStatus === 'Đang ship'
                      ? 'ri-e-bike-2-line'
                      : 'ri-lock-line'
              "
            ></i>
            <span>
              {{
                liveStatus === 'Đã hủy'
                  ? $t('orderStatus.cancelledNotice')
                  : liveStatus === 'Hoàn thành'
                    ? $t('orderStatus.completedNotice')
                    : liveStatus === 'Đang ship'
                      ? $t('orderStatus.shippingNotice')
                      : $t('group.lockedHint')
              }}
            </span>
          </div>
        </div>

        <!-- PINNED CHECKOUT FOOTER: TỔNG CỘNG -> CHECKPOINT ƯU ĐÃI -> TRẠNG THÁI ĐƠN -> GỬI ĐƠN -->
        <div class="fcm-checkout-footer">
          <div class="cart-total fcm-grand-total">
            <span>{{ $t('cart.total') }}</span>
            <strong>{{ formatPrice(totalAmount, cartCurrency) }}</strong>
          </div>

          <div
            v-if="milestoneCheckpoints.length > 0"
            class="milestone-checkpoint-box fcm-checkpoint-box"
            :class="{ unlocked: isAllMilestonesUnlocked }"
          >
            <div class="mcp-headline">
              <i
                :class="
                  isAllMilestonesUnlocked
                    ? 'ri-checkbox-circle-fill'
                    : nextMilestone?.type === 'GIFT'
                      ? 'ri-gift-line'
                      : 'ri-truck-line'
                "
              ></i>
              <span>{{ milestoneHeadlineText }}</span>
            </div>

            <div class="mcp-stepper">
              <div class="mcp-rail-wrap">
                <div class="mcp-rail">
                  <div
                    class="mcp-rail-fill"
                    :style="{ width: `${milestoneTrackFillPercent}%` }"
                  ></div>
                  <span
                    class="mcp-origin-dot"
                    :class="{ active: totalAmount > 0 }"
                  ></span>
                  <span
                    v-for="cp in milestoneCheckpoints"
                    :key="'fcm-dot-' + cp.key"
                    class="mcp-point"
                    :class="{ 'is-unlocked': cp.unlocked, 'is-next': cp.isNext }"
                    :style="{ left: `${cp.posPct}%` }"
                    :title="`${cp.thresholdText}: ${cp.label}`"
                  ></span>
                </div>
              </div>

              <div
                class="mcp-checkpoints-grid"
                :style="{
                  gridTemplateColumns: `repeat(${milestoneCheckpoints.length}, minmax(0, 1fr))`
                }"
              >
                <div
                  v-for="cp in milestoneCheckpoints"
                  :key="'fcm-lbl-' + cp.key"
                  class="mcp-cp-col"
                  :class="{ 'is-unlocked': cp.unlocked, 'is-next': cp.isNext }"
                >
                  <span class="mcp-cp-amount">{{ cp.thresholdText }}</span>
                  <span class="mcp-cp-reward">{{ cp.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="!isMobile || (liveStatus && liveStatus !== 'Nháp')"
            class="grab-status-card in-full-modal"
            :class="[orderStatusInfo.stateClass, { 'is-cancelled': orderStatusProgress.isCancelled }]"
          >
            <div class="gs-top-row">
              <span class="gs-status-main">
                <span class="gs-live-dot" :class="{ paused: orderStatusProgress.isTerminal }"></span>
                <i class="gs-main-ico" :class="orderStatusInfo.icon"></i>
                <strong class="gs-status-text">{{ orderStatusInfo.text }}</strong>
              </span>
              <span v-if="!orderStatusProgress.isCancelled" class="gs-step-count">
                {{ orderStatusProgress.activeIndex + 1 }}/{{ orderStatusProgress.steps.length }}
              </span>
            </div>

            <div v-if="!orderStatusProgress.isCancelled" class="gs-stepper">
              <div class="gs-rail">
                <div
                  class="gs-rail-fill"
                  :style="{ width: `${orderStatusProgress.fillPercent}%` }"
                ></div>
              </div>

              <div class="gs-steps-grid">
                <div
                  v-for="(st, sIdx) in orderStatusProgress.steps"
                  :key="'fcm-st-' + st.key"
                  class="gs-step"
                  :class="{
                    'is-done': sIdx < orderStatusProgress.activeIndex,
                    'is-current': sIdx === orderStatusProgress.activeIndex,
                    'is-upcoming': sIdx > orderStatusProgress.activeIndex,
                    'is-shipping-active': st.key === 'shipping' && sIdx === orderStatusProgress.activeIndex
                  }"
                >
                  <div class="gs-node">
                    <span v-if="sIdx === orderStatusProgress.activeIndex && !orderStatusProgress.isTerminal" class="gs-pulse-ring"></span>
                    <i
                      :class="
                        sIdx < orderStatusProgress.activeIndex
                          ? 'ri-check-line'
                          : st.icon
                      "
                    ></i>
                  </div>
                  <span class="gs-label">{{ st.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- UNIFIED SUBMIT VIA SOCIAL MEDIA (HOST) / GUEST READY ACTION -->
          <template v-if="isGroupHost">
            <button
              v-if="isOrderTerminal"
              type="button"
              class="finish-btn new-order-finish-btn fcm-submit-btn"
              @click="startNewOrder"
            >
              + {{ $t('group.newOrderBtn') }}
            </button>
            <button
              v-else-if="isOrderLocked"
              type="button"
              class="finish-btn view-progress-finish-btn fcm-submit-btn"
              @click="onOrderStatusClick"
            >
              <i class="ri-route-line"></i>
              <span>{{ $t('cart.viewProgressBtn') }}</span>
            </button>
            <button
              v-else-if="liveStatus === 'Chờ duyệt' && !hasOrderChangesAfterSubmit"
              type="button"
              class="finish-btn pending-progress-finish-btn fcm-submit-btn"
              @click="onPendingProgressClick"
            >
              <i class="ri-time-line"></i>
              <span>{{ $t('cart.pendingProgressBtn') }}</span>
            </button>
            <button
              v-else
              type="button"
              class="finish-btn fcm-submit-btn"
              :disabled="submittingOrder"
              @click="onFinish"
            >
              {{ finishBtnLabel }} <i class="ri-send-plane-fill"></i>
            </button>
          </template>

          <template v-else>
            <button
              v-if="isOrderLocked"
              type="button"
              class="finish-btn new-order-finish-btn fcm-submit-btn"
              @click="startNewOrder"
            >
              + {{ $t('group.newOrderBtn') }}
            </button>
            <button
              v-else-if="!isMyGuestSelectionDone"
              type="button"
              class="finish-btn guest-finish-btn fcm-submit-btn"
              @click="toggleGuestDone(true)"
            >
              <i class="ri-check-double-line"></i> {{ $t('group.guestFinishBtn') }}
            </button>
            <button
              v-else
              type="button"
              class="guest-edit-again-btn"
              @click="toggleGuestDone(false)"
            >
              <i class="ri-edit-line"></i> {{ $t('group.guestEditAgainBtn') }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ===== MODAL HƯỚNG DẪN COPY + PASTE ===== -->
<div v-if="showGuideModal" class="modal-overlay z-top" @click="showGuideModal = false">
  <div class="modal-card copy-guide-modal" @click.stop>
    <button class="modal-close" @click="showGuideModal = false">✕</button>

    <div class="guide-content">
      <!-- ICON NỀN TẢNG -->
      <img
        :src="guideData.URL_img"
        class="platform-icon"
        alt=""
      />

      <!-- TITLE -->
      <h3 class="guide-title">
        <i class="ri-smartphone-line"></i> Hướng dẫn gửi đơn qua {{ guideData.PLATFORM_name }}
      </h3>

      <!-- STEPS -->
      <div class="guide-steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-text">
            Nội dung đơn hàng đã được <strong>copy tự động</strong>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-text">
            Bấm nút <strong>"Mở {{ guideData.PLATFORM_name }}"</strong> bên dưới
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-text">
            <strong>Dán</strong> (Paste) nội dung và gửi
          </div>
        </div>
      </div>

      <!-- PREVIEW ĐƠN HÀNG -->
      <div class="order-preview">
        <div class="preview-title"><i class="ri-file-list-3-line"></i> Nội dung đã copy:</div>
        <div class="preview-text">
          {{ exportText.substring(0, 150) }}...
        </div>
      </div>

      <!-- NÚT MỞ APP -->
      <a 
        :href="guideData.Direct_link"
        target="_blank"
        class="open-app-btn"
        @click="showGuideModal = false"
      >
        <i class="ri-message-fill"></i>
        Mở {{ guideData.PLATFORM_name }} ngay
      </a>

      <!-- NÚT COPY LẠI -->
      <button class="copy-again-btn" @click="copyAgain">
        <i class="ri-file-copy-line"></i> Copy lại nội dung
      </button>
    </div>
  </div>
</div>
<!-- ===== MODAL THÔNG BÁO GIỎ HÀNG TRỐNG ===== -->
<div v-if="showEmptyCartModal" class="modal-overlay z-top" @click="showEmptyCartModal = false">
  <div class="modal-card empty-cart-modal" @click.stop>
    <button class="modal-close" @click="showEmptyCartModal = false">✕</button>
    <div class="empty-modal-content">
      <i class="ri-shopping-basket-line empty-icon"></i>
      <h3 class="empty-title">{{ $t('cart.emptyAlert') }}</h3>
      <button class="empty-close-btn" @click="showEmptyCartModal = false">
        {{ $t('common.ok') }}
      </button>
    </div>
  </div>
</div>

<!-- ===== MODAL THÔNG BÁO ĐƠN ĐANG CHUẨN BỊ / GIAO -> NHẮN TIN QUÁN ===== -->
<div
  v-if="showLockedOrderContactModal"
  class="modal-overlay z-top"
  @click="showLockedOrderContactModal = false"
>
  <div class="modal-card locked-order-contact-modal" @click.stop>
    <button
      type="button"
      class="modal-close"
      @click="showLockedOrderContactModal = false"
    >
      ✕
    </button>

    <div class="locm-head">
      <div
        class="locm-icon"
        :class="liveStatus === 'Đang ship' ? 'is-shipping' : 'is-preparing'"
      >
        <i :class="liveStatus === 'Đang ship' ? 'ri-e-bike-2-fill' : 'ri-restaurant-2-fill'"></i>
      </div>
      <h3 class="locm-title">
        {{
          liveStatus === 'Đang ship'
            ? $t('group.shippingModalTitle')
            : $t('group.preparingModalTitle')
        }}
      </h3>
      <p class="locm-desc">
        {{
          liveStatus === 'Đang ship'
            ? $t('group.shippingModalDesc', { code: activeOrderId || 'WEB' })
            : $t('group.preparingModalDesc', { code: activeOrderId || 'WEB' })
        }}
      </p>
    </div>

    <div v-if="messagingContactList.length" class="locm-channels">
      <div class="locm-channels-lbl">{{ $t('group.lockedChooseChannel') }}</div>
      <div
        class="exm-channels-grid"
        :class="{ 'is-single': messagingContactList.length === 1 }"
      >
        <button
          v-for="c in messagingContactList"
          :key="'locm-ch-' + c.ID"
          type="button"
          class="exm-channel-btn"
          @click="openShopChatOnly(c)"
        >
          <img v-if="c.URL_img" :src="c.URL_img" class="exm-channel-img" alt="" />
          <span class="exm-channel-label">{{ $t('group.messageViaChannel', { platform: c.PLATFORM_name }) }}</span>
          <i class="ri-arrow-right-up-line exm-channel-arrow"></i>
        </button>
      </div>
    </div>
    <button
      v-else
      type="button"
      class="finish-btn locm-fallback-contact-btn"
      @click="openContactFromLockedModal"
    >
      <i class="ri-customer-service-fill"></i>
      <span>{{ $t('group.messageShopBtn') }}</span>
    </button>

    <div class="locm-footer-actions">
      <button
        type="button"
        class="locm-sec-btn"
        @click="viewProgressFromLockedModal"
      >
        <i class="ri-route-line"></i>
        <span>{{ $t('cart.viewProgressBtn') }}</span>
      </button>
      <button
        type="button"
        class="locm-sec-btn is-new"
        @click="startNewOrderFromLockedModal"
      >
        + {{ $t('group.newOrderBtn') }}
      </button>
    </div>
  </div>
</div>

<!-- ===== MODAL NHẬP TÊN KHI VÀO LINK GHÉP ĐƠN ===== -->
<div v-if="showJoinGroupModal" class="modal-overlay z-top" @click="confirmJoinGroup">
  <div class="modal-card join-group-modal" @click.stop>
    <button class="modal-close" @click="confirmJoinGroup">✕</button>
    <div class="join-group-content">
      <div class="join-group-icon">
        <i class="ri-team-fill"></i>
      </div>
      <h3 class="join-group-title">{{ $t('group.joinTitle') }}</h3>
      <p class="join-group-desc">{{ $t('group.joinDesc') }}</p>
      <input
        v-model="joinNameInput"
        type="text"
        class="join-group-input"
        :placeholder="$t('group.yourNamePlaceholder')"
        @keyup.enter="confirmJoinGroup"
      />
      <button type="button" class="join-group-btn" @click="confirmJoinGroup">
        {{ $t('group.joinBtn') }} <i class="ri-arrow-right-line"></i>
      </button>
    </div>
  </div>
</div>

<!-- ===== MODAL GHÉP ĐƠN: QR CODE + LINK CHIA SẺ ===== -->
<div v-if="showGroupShareModal" class="modal-overlay z-top" @click="showGroupShareModal = false">
  <div class="modal-card group-share-modal" @click.stop>
    <button type="button" class="modal-close" @click="showGroupShareModal = false">
      <i class="ri-close-line"></i>
    </button>

    <div class="gsm-header">
      <div class="gsm-icon-badge">
        <i class="ri-team-fill"></i>
      </div>
      <div class="gsm-title-row">
        <h3 class="gsm-title">{{ $t('group.shareModalTitle') }}</h3>
        <span v-if="activeOrderId" class="gsm-code-pill">#{{ activeOrderId }}</span>
      </div>
      <p class="gsm-desc">{{ $t('group.scanQrHint') }}</p>
    </div>

    <div class="gsm-qr-wrap">
      <div v-if="creatingGroupSession || !groupShareUrl" class="gsm-qr-loading">
        <i class="ri-loader-4-line gsm-spin"></i>
      </div>
      <div v-else class="gsm-qr-frame">
        <QrcodeVue
          :value="groupShareUrl"
          :size="196"
          level="M"
          render-as="svg"
          :margin="2"
          foreground="#064e3b"
          background="#ffffff"
        />
      </div>
    </div>

    <div class="gsm-link-section">
      <div class="gsm-link-input-row">
        <input
          type="text"
          readonly
          class="gsm-link-input"
          :value="groupShareUrl"
          @focus="$event.target.select()"
        />
        <button
          type="button"
          class="gsm-copy-btn"
          :class="{ copied: inviteCopied }"
          :disabled="!groupShareUrl"
          @click="copyGroupShareLink"
        >
          <i :class="inviteCopied ? 'ri-check-line' : 'ri-file-copy-line'"></i>
          <span>{{ inviteCopied ? $t('group.copiedLink') : $t('group.copyLinkBtn') }}</span>
        </button>
      </div>
    </div>

    <div v-if="!isOrderLocked" class="gsm-name-section">
      <label class="gsm-name-label">
        <i :class="isGroupHost ? 'ri-vip-crown-line' : 'ri-user-3-line'"></i>
        <span>{{ $t('group.yourName') }}</span>
      </label>
      <input
        v-model="memberName"
        type="text"
        class="gsm-name-input"
        :placeholder="$t('group.yourNamePlaceholder')"
        @change="onMemberNameChange"
      />
    </div>

    <button
      v-if="activeOrderId && (liveStatus === 'Nháp' || isOrderLocked)"
      type="button"
      class="gsm-new-order-btn"
      @click="startNewOrder(); showGroupShareModal = false"
    >
      + {{ $t('group.newOrderBtn') }}
    </button>
  </div>
</div>

<!-- ===== MODAL BÁO THÀNH VIÊN CHƯA HOÀN THÀNH CHỌN MÓN ===== -->
<div v-if="showUnfinishedGuestsModal" class="modal-overlay z-top" @click="showUnfinishedGuestsModal = false">
  <div class="modal-card unfinished-guests-modal" @click.stop>
    <button type="button" class="modal-close" @click="showUnfinishedGuestsModal = false">
      <i class="ri-close-line"></i>
    </button>

    <div class="ugm-header">
      <div class="ugm-icon-badge">
        <i class="ri-time-line"></i>
      </div>
      <h3 class="ugm-title">{{ $t('group.unfinishedModalTitle') }}</h3>
      <p class="ugm-desc">{{ $t('group.unfinishedModalDesc') }}</p>
      <div class="ugm-nudge-note">
        <span><i class="ri-notification-3-line"></i> {{ $t('group.nudgeSentHint') }}</span>
        <button
          type="button"
          class="ugm-nudge-again-btn"
          @click="nudgeUnfinishedGuests({ showToast: true })"
        >
          <i class="ri-alarm-warning-line"></i> {{ $t('group.nudgeAgainBtn') }}
        </button>
      </div>
    </div>

    <div class="ugm-list">
      <div
        v-for="grp in unfinishedGuestMembers"
        :key="'ug-' + grp.groupKey"
        class="ugm-member-row"
      >
        <div class="ugm-member-info">
          <div class="ugm-member-avatar">
            <i class="ri-user-3-fill"></i>
          </div>
          <div class="ugm-member-text">
            <div class="ugm-member-name">{{ grp.name }}</div>
            <div class="ugm-member-meta">
              <span class="ugm-status-tag">
                <i class="ri-loader-4-line"></i> {{ $t('group.selectingStatus') }}
              </span>
              <span class="ugm-qty-price">
                {{ grp.totalQty }} {{ $t('group.itemsCount') }}
                <template v-if="grp.totalQty > 0">
                  • {{ formatPrice(grp.subtotal, cartCurrency) }}
                </template>
              </span>
            </div>
          </div>
        </div>

        <button
          v-if="isGroupHost && !isOrderLocked"
          type="button"
          class="ugm-remove-btn"
          :disabled="removingMemberKey === grp.groupKey"
          @click="requestRemoveMember(grp)"
        >
          <i class="ri-user-unfollow-line"></i>
          <span>{{ $t('group.removeMemberBtn') }}</span>
        </button>
      </div>
    </div>

    <div class="ugm-actions">
      <button
        type="button"
        class="ugm-wait-btn"
        @click="showUnfinishedGuestsModal = false"
      >
        {{ $t('group.unfinishedWaitBtn') }}
      </button>
      <button
        type="button"
        class="ugm-proceed-btn"
        @click="proceedPastUnfinishedWarning"
      >
        <span>{{ $t('group.unfinishedProceedBtn') }}</span>
        <i class="ri-arrow-right-line"></i>
      </button>
    </div>
  </div>
</div>

<!-- ===== MODAL XÁC NHẬN XÓA THÀNH VIÊN ===== -->
<div v-if="memberToRemove" class="modal-overlay z-top" @click="memberToRemove = null">
  <div class="modal-card confirm-remove-member-modal" @click.stop>
    <button type="button" class="modal-close" @click="memberToRemove = null">
      <i class="ri-close-line"></i>
    </button>

    <div class="ugm-header">
      <div class="ugm-icon-badge danger">
        <i class="ri-user-unfollow-line"></i>
      </div>
      <h3 class="ugm-title">{{ $t('group.removeMemberConfirmTitle') }}</h3>
      <p class="ugm-desc">
        {{
          $t('group.removeMemberConfirmDesc', {
            name: memberToRemove.name,
            count: memberToRemove.totalQty,
          })
        }}
      </p>
    </div>

    <div class="ugm-actions">
      <button
        type="button"
        class="ugm-wait-btn"
        @click="memberToRemove = null"
      >
        {{ $t('group.removeMemberCancelBtn') }}
      </button>
      <button
        type="button"
        class="ugm-danger-btn"
        :disabled="removingMemberKey === memberToRemove.groupKey"
        @click="executeRemoveMember(memberToRemove)"
      >
        <i class="ri-delete-bin-line"></i>
        <span>{{ $t('group.removeMemberConfirmBtn') }}</span>
      </button>
    </div>
  </div>
</div>

<!-- ===== MODAL CẢNH BÁO THÀNH VIÊN NHẤN HOÀN THÀNH ===== -->
<div v-if="showGuestNudgeModal" class="modal-overlay z-top" @click="showGuestNudgeModal = false">
  <div class="modal-card guest-nudge-modal" @click.stop>
    <button type="button" class="modal-close" @click="showGuestNudgeModal = false">
      <i class="ri-close-line"></i>
    </button>

    <div class="ugm-header">
      <div class="ugm-icon-badge nudge-pulse">
        <i class="ri-alarm-warning-fill"></i>
      </div>
      <h3 class="ugm-title">{{ $t('group.guestNudgeTitle') }}</h3>
      <p class="ugm-desc">
        {{
          myGuestItemCount > 0
            ? $t('group.guestNudgeWithItems', { count: myGuestItemCount })
            : $t('group.guestNudgeEmpty')
        }}
      </p>
    </div>

    <div class="ugm-actions">
      <template v-if="myGuestItemCount > 0">
        <button
          type="button"
          class="ugm-wait-btn"
          @click="onGuestNudgeReview"
        >
          <i class="ri-edit-line"></i>
          <span>{{ $t('group.guestNudgeReviewBtn') }}</span>
        </button>
        <button
          type="button"
          class="ugm-proceed-btn"
          @click="onGuestNudgeComplete"
        >
          <i class="ri-check-double-line"></i>
          <span>{{ $t('group.guestFinishBtn') }}</span>
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="ugm-proceed-btn"
          @click="onGuestNudgeReview"
        >
          <i class="ri-restaurant-line"></i>
          <span>{{ $t('group.guestNudgePickBtn') }}</span>
        </button>
      </template>
    </div>
  </div>
</div>

<!-- ===== MODAL THÔNG BÁO BỊ ĐÁ KHỎI ĐƠN ===== -->
<div v-if="showKickedModal" class="modal-overlay z-top" @click="startNewOrderFromKick">
  <div class="modal-card kicked-member-modal" @click.stop>
    <button type="button" class="modal-close" @click="startNewOrderFromKick">
      <i class="ri-close-line"></i>
    </button>

    <div class="ugm-header">
      <div class="ugm-icon-badge danger">
        <i class="ri-user-unfollow-fill"></i>
      </div>
      <h3 class="ugm-title">{{ $t('group.kickedModalTitle') }}</h3>
      <p class="ugm-desc">
        {{ $t('group.kickedModalDesc', { code: kickedFromOrderId }) }}
      </p>
    </div>

    <div class="ugm-actions">
      <button
        type="button"
        class="ugm-wait-btn"
        :disabled="rejoiningKickedOrder"
        @click="rejoinKickedOrder"
      >
        <i class="ri-login-box-line"></i>
        <span>{{ $t('group.rejoinOrderBtn') }}</span>
      </button>
      <button
        type="button"
        class="ugm-proceed-btn"
        @click="startNewOrderFromKick"
      >
        <i class="ri-add-circle-line"></i>
        <span>{{ $t('group.newOrderAfterKickBtn') }}</span>
      </button>
    </div>
  </div>
</div>

<!-- ===== TOAST NOTIFICATION ===== -->
<Teleport to="body">
  <transition name="sa-toast-fade">
    <div v-if="toastState.show" class="sa-live-toast" :class="toastState.type">
      <i
        :class="
          toastState.type === 'warn'
            ? 'ri-error-warning-fill'
            : toastState.type === 'info'
              ? 'ri-information-fill'
              : 'ri-checkbox-circle-fill'
        "
      ></i>
      <span>{{ toastState.message }}</span>
    </div>
  </transition>
</Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import L from 'leaflet'
import QrcodeVue from 'qrcode.vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getStorefrontSheets,
  subscribeSheet,
  subscribeLiveOrder,
  ensureLiveOrderSession,
  upsertLiveOrderMember,
  rejoinLiveOrderMember,
  removeLiveOrderMember,
  upsertLiveOrderItem,
  removeLiveOrderItem,
  updateLiveOrderMeta,
  submitCustomerOrder,
  genOrderId,
  makeLineId,
  IMGBB_KEY,
} from '@/config/api'
import {
  localizeProduct,
  productMatchesKeyword,
  resolveNoticeText,
} from '@/utils/i18nData'
const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
// ===== THÊM VÀO PHẦN KHAI BÁO REF =====
const showGuideModal = ref(false)
const guideData = ref({})

function copyTextToClipboard(rawText) {
  const val = String(rawText || '')
  if (!val) return false
  let copiedSync = false
  try {
    const ta = document.createElement('textarea')
    ta.value = val
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.left = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, val.length)
    copiedSync = document.execCommand('copy')
    document.body.removeChild(ta)
  } catch {}
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(val).catch(() => {})
  }
  return copiedSync
}

function normalizeContactHref(rawLink, platformName = '') {
  let link = String(rawLink || '').trim()
  if (!link) return ''
  const pf = String(platformName || '').toLowerCase()
  if (link.startsWith('@') && (pf.includes('tele') || !pf)) {
    link = `https://t.me/${link.slice(1)}`
  }
  link = link.replace(/^https?:\/\/(telegram\.me|telegram\.dog)\//i, 'https://t.me/')
  if (
    !/^(https?:\/\/|tg:|viber:|sms:|tel:|mailto:|weixin:|line:|kakaotalk:|zalo:)/i.test(link)
  ) {
    link = `https://${link.replace(/^\/+/, '')}`
  }
  const fbMatch = link.match(/^https?:\/\/(?:www\.|m\.)?facebook\.com\/([A-Za-z0-9._-]+)\/?$/i)
  if (
    fbMatch &&
    !['profile.php', 'messages', 'groups', 'pages', 'share'].includes(fbMatch[1].toLowerCase())
  ) {
    link = `https://m.me/${fbMatch[1]}`
  }
  return link
}

function showCopyGuideModal(contact) {
  guideData.value = {
    ...(contact || {}),
    Direct_link: normalizeContactHref(contact?.Direct_link, contact?.PLATFORM_name),
  }
  showGuideModal.value = true
}

function copyAgain() {
  copyTextToClipboard(exportText.value)
  triggerToast('Đã copy lại nội dung!', 'success')
}
const languages = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    flagImg: 'https://flagcdn.com/w40/vn.png'
  },
  {
    code: 'en',
    label: 'English',
    flagImg: 'https://flagcdn.com/w40/us.png'
  },
  {
    code: 'zh-CN',
    label: '中文',
    flagImg: 'https://flagcdn.com/w40/cn.png'
  },
  {
    code: 'fil',
    label: 'Filipino',
    flagImg: 'https://flagcdn.com/w40/ph.png'
  }
,
  {
    code: 'ko',
    label: '한국어',
    flagImg: 'https://flagcdn.com/w40/kr.png'
  }

]

const showLangModal = ref(false)
const showSearchSuggest = ref(false)
const searchWrapperRef = ref(null)
const currentLang = computed(() => route.params.lang || 'vi')
const langLoading = ref(false)
/* ===== CONFIG ===== */

const closingModal = ref(false)
const shopContacts = ref([])
const cartListRef = ref(null)
let bannerTimer = null
const BANNER_INTERVAL = 4500
const BANNER_FADE_MS = 450
const tempQty = ref({})
/* ===== STATE ===== */
const rawMenu = ref([])
const menu = computed(() =>
  rawMenu.value.map((m) => localizeProduct(m, currentLang.value))
)
const thongBao = ref([])
const banners = ref([])
const logos = ref([])
const tenKhach = ref('')
const diaChi = ref('')
const sdt = ref('')
const thoiGian = ref('')
const hinhThucTT = ref('TIEN_MAT')
const ghiChu = ref('')
const cartFormRef = ref(null)
const fullModalFormRef = ref(null)
const showDeliveryForm = ref(false)
const showContactPopover = ref(false)
const contactPopoverRef = ref(null)
const catScrollRef = ref(null)
const allCatsWrapRef = ref(null)
const showAllCatsDrawer = ref(false)

const SA_THEME_MODE_KEY = 'SA_THEME_MODE'
const themeMode = ref('light')

function toggleThemeMode() {
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(SA_THEME_MODE_KEY, themeMode.value)
  } catch {}
}

const hasRequiredContact = computed(() =>
  Boolean(
    tenKhach.value.trim() ||
      sdt.value.trim() ||
      diaChi.value.trim() ||
      memberName.value.trim(),
  ),
)

const deliverySummaryText = computed(() => {
  const recipient = tenKhach.value.trim() || memberName.value.trim()
  return [
    recipient,
    sdt.value.trim(),
    diaChi.value.trim(),
    thoiGian.value.trim(),
  ]
    .filter(Boolean)
    .join(' • ')
})

function toggleDeliveryForm() {
  showDeliveryForm.value = !showDeliveryForm.value
  if (showDeliveryForm.value) {
    nextTick(() => {
      cartFormRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
    })
  }
}

// ===== GROUP ORDER & LIVE FIREBASE SYNC STATE =====
const SA_MEMBER_ID_KEY = 'SA_MEMBER_ID'
const SA_MEMBER_NAME_KEY = 'SA_MEMBER_NAME'
const SA_ACTIVE_ORDER_KEY = 'SA_ACTIVE_ORDER_ID'
const SA_LOCAL_CART_KEY = 'SA_LOCAL_CART_V2'
const SA_CUSTOMER_FORM_KEY = 'SA_CUSTOMER_FORM'

function getOrCreateMemberId() {
  try {
    let id = localStorage.getItem(SA_MEMBER_ID_KEY)
    if (!id) {
      id = 'm_' + Math.random().toString(36).slice(2, 9)
      localStorage.setItem(SA_MEMBER_ID_KEY, id)
    }
    return id
  } catch {
    return 'm_guest'
  }
}

const memberId = getOrCreateMemberId()
const memberName = ref('')
const localCartLines = ref({})
const activeOrderId = ref('')
const liveOrderData = ref(null)
const inviteCopied = ref(false)
const submittingOrder = ref(false)
const isEditingMeta = ref(false)
const showJoinGroupModal = ref(false)
const joinNameInput = ref('')
const toastState = ref({ show: false, message: '', type: 'success' })

let unsubLiveOrder = null
let unsubHangHoaLive = null
let unsubKhuyenMaiLive = null
let metaSyncTimer = null
let toastTimer = null
let applyingRemoteMeta = false
let promptedJoinOnce = false

function triggerToast(message, type = 'success', duration = 2800) {
  toastState.value = { show: true, message, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastState.value.show = false
  }, duration)
}

function loadPersistedLocalState() {
  try {
    const savedTheme = localStorage.getItem(SA_THEME_MODE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') {
      themeMode.value = savedTheme
    } else {
      themeMode.value = 'light'
    }
    memberName.value = localStorage.getItem(SA_MEMBER_NAME_KEY) || ''
    const savedForm = JSON.parse(localStorage.getItem(SA_CUSTOMER_FORM_KEY) || 'null')
    if (savedForm && typeof savedForm === 'object') {
      if (savedForm.tenKhach) tenKhach.value = savedForm.tenKhach
      if (savedForm.sdt) sdt.value = savedForm.sdt
      if (savedForm.diaChi) diaChi.value = savedForm.diaChi
      if (savedForm.hinhThucTT) hinhThucTT.value = savedForm.hinhThucTT
    }
    const savedLines = JSON.parse(localStorage.getItem(SA_LOCAL_CART_KEY) || 'null')
    if (savedLines && typeof savedLines === 'object') {
      localCartLines.value = savedLines
    }
  } catch {}
}

function saveLocalCartLines() {
  try {
    localStorage.setItem(SA_LOCAL_CART_KEY, JSON.stringify(localCartLines.value || {}))
  } catch {}
}

function saveCustomerFormLocal() {
  try {
    localStorage.setItem(
      SA_CUSTOMER_FORM_KEY,
      JSON.stringify({
        tenKhach: tenKhach.value,
        sdt: sdt.value,
        diaChi: diaChi.value,
        hinhThucTT: hinhThucTT.value,
      }),
    )
  } catch {}
}

const liveStatus = computed(() => String(liveOrderData.value?.meta?.Trang_thai || '').trim())
const isOrderTerminal = computed(
  () => liveStatus.value === 'Hoàn thành' || liveStatus.value === 'Đã hủy',
)
const isOrderLocked = computed(() =>
  ['Đang xử lý', 'Đang ship', 'Hoàn thành', 'Đã hủy'].includes(liveStatus.value),
)
const hostMemberId = computed(() => String(liveOrderData.value?.meta?.Host_id || '').trim())
const isGroupGuest = computed(() =>
  Boolean(activeOrderId.value && hostMemberId.value && hostMemberId.value !== memberId),
)
const isGroupHost = computed(() => !isGroupGuest.value)
const myMemberRecord = computed(() =>
  (liveOrderData.value?.membersList || []).find((m) => m.id === memberId) || null,
)
const isMyGuestSelectionDone = computed(() =>
  Boolean(isGroupGuest.value && myMemberRecord.value?.done),
)
const HOURS_24_LIST = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_60_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const MONTHS_12_LIST = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

function format24hDateTimeObj(d = new Date()) {
  const p = (num) => String(num).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function parseThoiGian24h(raw) {
  const str = String(raw || '').trim()
  if (!str) return { hh: '', mm: '', dd: '', mo: '', yyyy: '' }
  const m1 = str.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m1) {
    return {
      hh: String(Math.min(23, Math.max(0, Number(m1[1])))).padStart(2, '0'),
      mm: String(Math.min(59, Math.max(0, Number(m1[2])))).padStart(2, '0'),
      dd: String(Math.min(31, Math.max(1, Number(m1[3])))).padStart(2, '0'),
      mo: String(Math.min(12, Math.max(1, Number(m1[4])))).padStart(2, '0'),
      yyyy: m1[5],
    }
  }
  const m2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/)
  if (m2) {
    return {
      hh: String(Math.min(23, Math.max(0, Number(m2[4])))).padStart(2, '0'),
      mm: String(Math.min(59, Math.max(0, Number(m2[5])))).padStart(2, '0'),
      dd: String(Math.min(31, Math.max(1, Number(m2[1])))).padStart(2, '0'),
      mo: String(Math.min(12, Math.max(1, Number(m2[2])))).padStart(2, '0'),
      yyyy: m2[3],
    }
  }
  return { hh: '', mm: '', dd: '', mo: '', yyyy: '' }
}

const parsedThoiGian = computed(() => parseThoiGian24h(thoiGian.value))

const availableYearsList = computed(() => {
  const curY = new Date().getFullYear()
  const set = new Set([String(curY), String(curY + 1), String(curY + 2)])
  if (parsedThoiGian.value.yyyy) set.add(parsedThoiGian.value.yyyy)
  return Array.from(set).sort()
})

const availableDaysList = computed(() => {
  const now = new Date()
  const y = Number(parsedThoiGian.value.yyyy || now.getFullYear())
  const mo = Number(parsedThoiGian.value.mo || now.getMonth() + 1)
  const maxDays = new Date(y, mo, 0).getDate() || 31
  return Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0'))
})

function onPickDateTimePart(part, rawVal) {
  if (isOrderLocked.value || !isGroupHost.value || !rawVal) return
  const now = new Date()
  const p = (num) => String(num).padStart(2, '0')
  const cur = { ...parsedThoiGian.value }
  cur[part] = String(rawVal)

  if (!cur.hh) cur.hh = p(now.getHours())
  if (!cur.mm) cur.mm = part === 'hh' ? '00' : p(now.getMinutes())
  if (!cur.yyyy) cur.yyyy = String(now.getFullYear())
  if (!cur.mo) cur.mo = p(now.getMonth() + 1)
  if (!cur.dd) cur.dd = p(now.getDate())

  const maxD = new Date(Number(cur.yyyy), Number(cur.mo), 0).getDate() || 31
  if (Number(cur.dd) > maxD) {
    cur.dd = p(maxD)
  }

  thoiGian.value = `${cur.hh}:${cur.mm} ${cur.dd}/${cur.mo}/${cur.yyyy}`
  scheduleSyncLiveMeta()
}

function setDeliveryTimeNow(addMinutes = 0) {
  if (isOrderLocked.value || !isGroupHost.value) return
  const offsetMin =
    typeof addMinutes === 'number' && Number.isFinite(addMinutes) ? addMinutes : 0
  const target = new Date(Date.now() + offsetMin * 60000)
  thoiGian.value = format24hDateTimeObj(target)
  scheduleSyncLiveMeta()
}

function clearDeliveryTime() {
  if (isOrderLocked.value || !isGroupHost.value) return
  thoiGian.value = ''
  scheduleSyncLiveMeta()
}

const lastSubmittedSig = ref('')

const currentOrderSignature = computed(() => {
  const itemPart = [...cartItems.value]
    .map(
      (i) =>
        `${String(i.lineId || i.Ma_hang || '')}:${Number(i.qty || 0)}:${Number(i.unitPrice || 0)}:${String(i.note || '').trim()}`,
    )
    .sort()
    .join('|')
  const recipient = String(tenKhach.value || memberName.value || '').trim()
  const metaPart = [
    recipient,
    String(sdt.value || '').trim(),
    String(diaChi.value || '').trim(),
    String(thoiGian.value || '').trim(),
    String(hinhThucTT.value || 'TIEN_MAT').trim() || 'TIEN_MAT',
    String(stripAutoPromoTag(ghiChu.value || '')).trim(),
  ].join('~')
  return `${itemPart}##${metaPart}`
})

const effectiveSubmittedSig = computed(() =>
  String(liveOrderData.value?.meta?.Submitted_sig || lastSubmittedSig.value || '').trim(),
)

const hasOrderChangesAfterSubmit = computed(() => {
  if (liveStatus.value !== 'Chờ duyệt') return false
  if (effectiveSubmittedSig.value) {
    return currentOrderSignature.value !== effectiveSubmittedSig.value
  }
  const subAt = Number(liveOrderData.value?.meta?.Submitted_at || 0)
  const updAt = Number(liveOrderData.value?.meta?.Updated_at || 0)
  return subAt > 0 && updAt > subAt + 1500
})

const finishBtnLabel = computed(() => {
  if (submittingOrder.value) return t('cart.submitting')
  if (hasOrderChangesAfterSubmit.value) return t('cart.updateOrderBtn')
  return t('cart.finish')
})

function canModifyCartItem(item) {
  if (isOrderLocked.value) return false
  if (isGroupHost.value) return true
  return !item?.isAdminAdded && String(item?.memberId || '') === memberId
}

async function toggleGuestDone(doneVal = true) {
  if (!activeOrderId.value || isOrderLocked.value) return
  if (doneVal) {
    const myCount = cartItems.value
      .filter((i) => !i.isAdminAdded && i.memberId === memberId)
      .reduce((s, i) => s + i.qty, 0)
    if (myCount <= 0) {
      showEmptyCartModal.value = true
      return
    }
  }
  const displayName = memberName.value.trim() || t('group.guestDefault')
  const res = await upsertLiveOrderMember({
    orderId: activeOrderId.value,
    memberId,
    name: displayName,
    role: 'guest',
    done: Boolean(doneVal),
  })
  if (res?.kicked) {
    handleKickedFromOrder()
    return
  }
  if (res?.closed) {
    resetClosedOrStaleOrder(true)
    return
  }
  if (res?.locked) {
    triggerToast(t('group.lockedHint'), 'warn')
    return
  }
  if (doneVal) {
    triggerToast(t('group.guestDoneToast'), 'success')
  }
}

const showUnfinishedGuestsModal = ref(false)
const showGuestNudgeModal = ref(false)
const showKickedModal = ref(false)
const kickedFromOrderId = ref('')
const kickedSavedItems = ref([])
const rejoiningKickedOrder = ref(false)
const unfinishedActionTarget = ref('fullModal')
const memberToRemove = ref(null)
const removingMemberKey = ref('')

const myGuestItemCount = computed(() =>
  cartItems.value
    .filter((i) => !i.isAdminAdded && i.memberId === memberId)
    .reduce((sum, i) => sum + Number(i.qty || 0), 0),
)

function nudgeUnfinishedGuests({ showToast = false } = {}) {
  if (!activeOrderId.value || !isGroupHost.value || isOrderLocked.value) return
  updateLiveOrderMeta({
    orderId: activeOrderId.value,
    patch: { Host_nudge_at: String(Date.now()) },
    role: 'host',
  })
    .then((res) => {
      if (showToast && res?.success) {
        triggerToast(t('group.nudgeSentToast'), 'info')
      }
    })
    .catch(() => {})
}

function onGuestNudgeReview() {
  showGuestNudgeModal.value = false
  if (myGuestItemCount.value > 0) {
    if (isMobile.value) {
      openMobilePanel('cart')
    } else {
      showCart.value = true
    }
  }
}

async function onGuestNudgeComplete() {
  await toggleGuestDone(true)
  showGuestNudgeModal.value = false
}

function requestRemoveMember(grp) {
  if (!isGroupHost.value || isOrderLocked.value || !grp || grp.role !== 'guest') return
  if (Number(grp.totalQty || 0) > 0) {
    memberToRemove.value = grp
    return
  }
  executeRemoveMember(grp)
}

async function executeRemoveMember(grp) {
  if (!activeOrderId.value || !isGroupHost.value || isOrderLocked.value || !grp || grp.role !== 'guest') {
    return
  }
  if (removingMemberKey.value) return
  removingMemberKey.value = grp.groupKey
  try {
    const res = await removeLiveOrderMember({
      orderId: activeOrderId.value,
      targetMemberId: grp.memberId || '',
      targetName: grp.name || '',
      requesterId: memberId,
    })
    if (res?.closed) {
      memberToRemove.value = null
      showUnfinishedGuestsModal.value = false
      resetClosedOrStaleOrder(true)
      return
    }
    if (res?.locked) {
      memberToRemove.value = null
      triggerToast(t('group.lockedHint'), 'warn')
      return
    }
    if (res?.success) {
      memberToRemove.value = null
      triggerToast(t('group.memberRemovedToast', { name: grp.name }), 'info')
    } else if (res?.message) {
      triggerToast(res.message, 'warn')
    }
  } catch (err) {
    console.error('Remove member failed:', err)
    triggerToast('Không thể xóa thành viên, vui lòng thử lại!', 'warn')
  } finally {
    removingMemberKey.value = ''
  }
}

async function proceedPastUnfinishedWarning() {
  const target = unfinishedActionTarget.value
  showUnfinishedGuestsModal.value = false
  if (target === 'finish') {
    await onFinish({ skipUnfinishedCheck: true })
  } else {
    showFullCartModal.value = true
  }
}

function handleKickedFromOrder(orderId = '', savedItems = []) {
  const oid = String(orderId || activeOrderId.value || '').trim()
  if (unsubLiveOrder) {
    unsubLiveOrder()
    unsubLiveOrder = null
  }
  activeOrderId.value = ''
  liveOrderData.value = null
  lastSubmittedSig.value = ''
  localCartLines.value = {}
  memberExpandedMap.value = {}
  modalMemberExpandedMap.value = {}
  showFullCartModal.value = false
  showExportModal.value = false
  showGuestNudgeModal.value = false
  showJoinGroupModal.value = false
  showGroupShareModal.value = false
  try {
    localStorage.removeItem(SA_ACTIVE_ORDER_KEY)
    localStorage.removeItem(SA_LOCAL_CART_KEY)
  } catch {}
  kickedFromOrderId.value = oid
  kickedSavedItems.value = Array.isArray(savedItems) ? savedItems : []
  showKickedModal.value = true
}

async function rejoinKickedOrder() {
  const oid = String(kickedFromOrderId.value || '').trim()
  if (!oid || rejoiningKickedOrder.value) return
  rejoiningKickedOrder.value = true
  try {
    const res = await rejoinLiveOrderMember({
      orderId: oid,
      memberId,
      name: memberName.value.trim() || t('group.guestDefault'),
      items: kickedSavedItems.value,
    })
    showKickedModal.value = false
    kickedFromOrderId.value = ''
    kickedSavedItems.value = []
    if (res?.closed) {
      resetClosedOrStaleOrder(true)
      return
    }
    if (res?.locked) {
      triggerToast(t('group.lockedHint'), 'warn')
    }
    connectLiveOrder(oid, { fromUrl: true, syncUrl: true })
  } catch (err) {
    console.error('Rejoin order failed:', err)
    showKickedModal.value = false
    kickedFromOrderId.value = ''
    kickedSavedItems.value = []
    connectLiveOrder(oid, { fromUrl: true, syncUrl: true })
  } finally {
    rejoiningKickedOrder.value = false
  }
}

function startNewOrderFromKick() {
  showKickedModal.value = false
  kickedFromOrderId.value = ''
  kickedSavedItems.value = []
  startNewOrder()
}

function stripOrderQueryParam() {
  if (!route.query?.order) return
  const { order: _ord, ...restQuery } = route.query || {}
  router.replace({ path: route.path, query: restQuery }).catch(() => {})
}

function setOrderQueryParam(orderId) {
  if (!orderId || String(route.query?.order || '') === String(orderId)) return
  router
    .replace({
      path: route.path,
      query: { ...(route.query || {}), order: orderId },
    })
    .catch(() => {})
}

function resetClosedOrStaleOrder(showNotice = false, { autoCreateNew = true } = {}) {
  if (unsubLiveOrder) {
    unsubLiveOrder()
    unsubLiveOrder = null
  }
  activeOrderId.value = ''
  liveOrderData.value = null
  lastSubmittedSig.value = ''
  localCartLines.value = {}
  memberExpandedMap.value = {}
  modalMemberExpandedMap.value = {}
  thoiGian.value = ''
  ghiChu.value = ''
  showJoinGroupModal.value = false
  showGroupShareModal.value = false
  showUnfinishedGuestsModal.value = false
  showGuestNudgeModal.value = false
  memberToRemove.value = null
  try {
    localStorage.removeItem(SA_ACTIVE_ORDER_KEY)
    localStorage.removeItem(SA_LOCAL_CART_KEY)
  } catch {}
  if (autoCreateNew) {
    ensureGroupSessionActive()
  } else {
    stripOrderQueryParam()
  }
  if (showNotice) {
    triggerToast(t('group.closedNotice'), 'info', 3600)
  }
}

function startNewOrder() {
  resetClosedOrStaleOrder(false, { autoCreateNew: true })
  if (isMobile.value && showProgressModal.value) {
    showProgressModal.value = false
    activeMobilePanel.value = 'home'
  }
}

function connectLiveOrder(orderId, { fromUrl = false, syncUrl = false } = {}) {
  const cleanId = String(orderId || '').trim()
  if (!cleanId) return
  if (activeOrderId.value === cleanId && unsubLiveOrder) {
    if (syncUrl) setOrderQueryParam(cleanId)
    return
  }

  if (unsubLiveOrder) {
    unsubLiveOrder()
    unsubLiveOrder = null
  }

  if (activeOrderId.value !== cleanId) {
    lastSubmittedSig.value = ''
  }
  activeOrderId.value = cleanId
  memberExpandedMap.value = {}
  modalMemberExpandedMap.value = {}
  try {
    localStorage.setItem(SA_ACTIVE_ORDER_KEY, cleanId)
  } catch {}
  if (syncUrl) setOrderQueryParam(cleanId)

  const connectedAt = Date.now()
  const kickStorageKey = `sa_kicked_${cleanId}_${memberId}`
  let lastHandledKickAt = 0
  try {
    lastHandledKickAt = Number(localStorage.getItem(kickStorageKey) || 0)
  } catch {}
  let seenAsMemberInSession = false
  let lastKnownMyItems = []
  let handledMissingOnce = false
  let registeredMemberOnce = false
  let seenActiveLiveSnapshot = false
  let handledClosedTransition = false
  let handledKickedTransition = false
  let switchingClosedUrlOnce = false
  let lastSeenStatus = ''
  let initializedNudgeWatch = false
  let lastSeenNudgeAt = 0

  unsubLiveOrder = subscribeLiveOrder(cleanId, async (snap) => {
    if (!snap.exists) {
      if (fromUrl && !handledMissingOnce) {
        handledMissingOnce = true
        await ensureLiveOrderSession({
          orderId: cleanId,
          hostId: memberId,
          hostName: memberName.value || tenKhach.value,
        })
      } else if (!fromUrl) {
        resetClosedOrStaleOrder(false)
      }
      return
    }

    const st = String(snap.meta?.Trang_thai || '').trim()
    if (st === 'Hoàn thành' || st === 'Đã hủy') {
      if (seenActiveLiveSnapshot) {
        const prev = liveOrderData.value
        liveOrderData.value = {
          ...snap,
          meta: {
            ...(prev?.meta || {}),
            ...(snap.meta || {}),
            Trang_thai: st,
          },
          itemsList: snap.itemsList?.length ? snap.itemsList : prev?.itemsList || [],
          itemsMap:
            snap.itemsMap && Object.keys(snap.itemsMap).length
              ? snap.itemsMap
              : prev?.itemsMap || {},
          membersList: snap.membersList?.length ? snap.membersList : prev?.membersList || [],
        }
        try {
          localStorage.removeItem(SA_ACTIVE_ORDER_KEY)
        } catch {}
        if (!handledClosedTransition) {
          handledClosedTransition = true
          if (st === 'Hoàn thành') {
            triggerToast(t('orderStatus.completedToast', { code: cleanId }), 'success', 4500)
          } else {
            triggerToast(t('orderStatus.cancelledToast', { code: cleanId }), 'warn', 4500)
          }
        }
        return
      }

      if (fromUrl && !switchingClosedUrlOnce) {
        switchingClosedUrlOnce = true
        if (unsubLiveOrder) {
          unsubLiveOrder()
          unsubLiveOrder = null
        }
        activeOrderId.value = ''
        liveOrderData.value = null
        localCartLines.value = {}
        try {
          localStorage.removeItem(SA_ACTIVE_ORDER_KEY)
          localStorage.removeItem(SA_LOCAL_CART_KEY)
        } catch {}
        try {
          const newRes = await ensureLiveOrderSession({
            hostId: memberId,
            hostName: memberName.value.trim() || tenKhach.value.trim(),
            meta: {
              Ten_khach_hang: tenKhach.value,
              So_dien_thoai: sdt.value,
              Dia_chi: diaChi.value,
              Hinh_thuc_thanh_toan: hinhThucTT.value,
            },
          })
          if (newRes?.orderId) {
            connectLiveOrder(newRes.orderId, { fromUrl: false, syncUrl: true })
            triggerToast(
              t('group.switchedNewCodeNotice', { code: newRes.orderId }),
              'info',
              4200,
            )
            return
          }
        } catch (err) {
          console.warn('Auto-switch closed group order link failed:', err)
        }
        resetClosedOrStaleOrder(true)
        return
      }

      if (!fromUrl) {
        resetClosedOrStaleOrder(false)
      }
      return
    }

    if (seenActiveLiveSnapshot && lastSeenStatus && lastSeenStatus !== st) {
      if (st === 'Đang xử lý') {
        triggerToast(t('orderStatus.preparing'), 'success', 3200)
      } else if (st === 'Đang ship') {
        triggerToast(t('orderStatus.shipping'), 'info', 3600)
      }
    }
    seenActiveLiveSnapshot = true
    lastSeenStatus = st

    liveOrderData.value = snap
    if (!route.query?.order) {
      setOrderQueryParam(cleanId)
    }

    if (!isEditingMeta.value && snap.meta) {
      applyingRemoteMeta = true
      if (snap.meta.Ten_khach_hang !== undefined) tenKhach.value = snap.meta.Ten_khach_hang || ''
      if (snap.meta.So_dien_thoai !== undefined) sdt.value = snap.meta.So_dien_thoai || ''
      if (snap.meta.Dia_chi !== undefined) diaChi.value = snap.meta.Dia_chi || ''
      if (snap.meta.Thoi_gian_nhan_hang !== undefined) {
        thoiGian.value = snap.meta.Thoi_gian_nhan_hang || ''
      }
      if (snap.meta.Hinh_thuc_thanh_toan) {
        hinhThucTT.value = snap.meta.Hinh_thuc_thanh_toan
      }
      if (snap.meta.Ghi_chu !== undefined) {
        ghiChu.value = stripAutoPromoTag(snap.meta.Ghi_chu || '')
      }
      nextTick(() => {
        applyingRemoteMeta = false
      })
    }

    const snapHostId = String(snap.meta?.Host_id || '').trim()
    const amHost = !snapHostId || snapHostId === memberId
    const myMemberRec = (snap.membersList || []).find((m) => m.id === memberId) || null
    const kickedEntry = !amHost
      ? Object.values(snap.kickedMap || {}).find((k) => String(k?.id || '') === memberId)
      : null
    const kickedAt = Number(kickedEntry?.kickedAt || 0)
    const shouldKickNow =
      !amHost &&
      kickedAt > 0 &&
      kickedAt > lastHandledKickAt &&
      (seenAsMemberInSession || kickedAt >= connectedAt - 2000)
    if (shouldKickNow) {
      if (!handledKickedTransition) {
        handledKickedTransition = true
        lastHandledKickAt = kickedAt
        try {
          localStorage.setItem(kickStorageKey, String(kickedAt))
        } catch {}
        const rawKickedItems = Array.isArray(kickedEntry?.items)
          ? kickedEntry.items
          : Object.values(kickedEntry?.items || {})
        const savedMyItems = rawKickedItems.length > 0 ? rawKickedItems : lastKnownMyItems
        handleKickedFromOrder(cleanId, savedMyItems)
      }
      return
    }
    lastKnownMyItems = (snap.itemsList || []).filter(
      (it) => it.Added_by_role !== 'admin' && String(it.Nguoi_dat_id || '') === memberId,
    )
    if (myMemberRec) {
      seenAsMemberInSession = true
    }
    const alreadyInMembers = Boolean(myMemberRec)
    const isSnapLocked = ['Đang xử lý', 'Đang ship', 'Hoàn thành', 'Đã hủy'].includes(st)

    const incomingNudgeAt = Number(snap.meta?.Host_nudge_at || 0)
    if (!initializedNudgeWatch) {
      initializedNudgeWatch = true
      lastSeenNudgeAt = incomingNudgeAt
      if (
        incomingNudgeAt > 0 &&
        Date.now() - incomingNudgeAt < 30000 &&
        !amHost &&
        !isSnapLocked &&
        !myMemberRec?.done
      ) {
        showGuestNudgeModal.value = true
      }
    } else if (incomingNudgeAt > lastSeenNudgeAt) {
      lastSeenNudgeAt = incomingNudgeAt
      if (!amHost && !isSnapLocked && !myMemberRec?.done) {
        showGuestNudgeModal.value = true
      }
    }

    if (amHost || isSnapLocked || myMemberRec?.done) {
      showGuestNudgeModal.value = false
    }

    if (!alreadyInMembers && !registeredMemberOnce && !isSnapLocked) {
      if (memberName.value.trim() || amHost) {
        registeredMemberOnce = true
        upsertLiveOrderMember({
          orderId: cleanId,
          memberId,
          name:
            memberName.value.trim() ||
            (amHost ? snap.meta?.Ten_khach_hang || tenKhach.value.trim() : '') ||
            t('group.guestDefault'),
          role: amHost ? 'host' : 'guest',
        }).catch(() => {})
      }
    }

    if (fromUrl && !amHost && !memberName.value.trim() && !isSnapLocked && !promptedJoinOnce) {
      promptedJoinOnce = true
      joinNameInput.value = ''
      showJoinGroupModal.value = true
    }
  })
}

function scheduleSyncLiveMeta() {
  if (isGroupHost.value) {
    saveCustomerFormLocal()
  }
  if (!activeOrderId.value || !isGroupHost.value || isOrderLocked.value || applyingRemoteMeta) return
  if (metaSyncTimer) clearTimeout(metaSyncTimer)
  metaSyncTimer = setTimeout(() => {
    if (!activeOrderId.value || !isGroupHost.value || isOrderLocked.value) return
    updateLiveOrderMeta({
      orderId: activeOrderId.value,
      patch: {
        Ten_khach_hang: tenKhach.value,
        So_dien_thoai: sdt.value,
        Dia_chi: diaChi.value,
        Thoi_gian_nhan_hang: thoiGian.value,
        Hinh_thuc_thanh_toan: hinhThucTT.value,
        Ghi_chu:
          liveStatus.value === 'Chờ duyệt'
            ? buildSubmittedNoteWithPromo(ghiChu.value, earnedPromoViSummary.value)
            : stripAutoPromoTag(ghiChu.value),
        ...(liveStatus.value === 'Chờ duyệt'
          ? { Khuyen_mai_dat_duoc: earnedPromoViSummary.value }
          : {}),
      },
      role: 'host',
    }).catch(() => {})
  }, 420)
}

function onMetaBlur() {
  isEditingMeta.value = false
  scheduleSyncLiveMeta()
}

function setPaymentMethod(method) {
  if (isOrderLocked.value || !isGroupHost.value) return
  hinhThucTT.value = method
  scheduleSyncLiveMeta()
}

watch([tenKhach, sdt, diaChi, thoiGian, ghiChu], () => {
  if (applyingRemoteMeta || !isGroupHost.value) return
  scheduleSyncLiveMeta()
})

async function onMemberNameChange() {
  const cleanName = memberName.value.trim()
  try {
    localStorage.setItem(SA_MEMBER_NAME_KEY, cleanName)
  } catch {}
  if (!cleanName) return

  if (activeOrderId.value && liveOrderData.value && !isOrderLocked.value) {
    await upsertLiveOrderMember({
      orderId: activeOrderId.value,
      memberId,
      name: cleanName,
      role: isGroupHost.value ? 'host' : 'guest',
    })
  } else {
    let changed = false
    Object.values(localCartLines.value).forEach((line) => {
      if (line.memberId === memberId) {
        line.memberName = cleanName
        changed = true
      }
    })
    if (changed) saveLocalCartLines()
  }
}

async function confirmJoinGroup() {
  const typed = joinNameInput.value.trim()
  if (typed) {
    memberName.value = typed
    await onMemberNameChange()
  } else if (activeOrderId.value && !isOrderLocked.value) {
    await upsertLiveOrderMember({
      orderId: activeOrderId.value,
      memberId,
      name: memberName.value.trim() || t('group.guestDefault'),
      role: isGroupHost.value ? 'host' : 'guest',
    })
  }
  showJoinGroupModal.value = false
}

const showGroupShareModal = ref(false)
const creatingGroupSession = ref(false)
const memberExpandedMap = ref({})
const modalMemberExpandedMap = ref({})

const groupShareUrl = computed(() => {
  const oid = activeOrderId.value
  if (!oid || typeof window === 'undefined') return ''
  return `${window.location.origin}${route.path}?order=${encodeURIComponent(oid)}`
})

let groupSessionPromise = null

async function ensureGroupSessionActive() {
  if (isOrderLocked.value) return activeOrderId.value
  if (groupSessionPromise) return groupSessionPromise
  if (activeOrderId.value && unsubLiveOrder) {
    setOrderQueryParam(activeOrderId.value)
    return activeOrderId.value
  }

  const targetOrderId = activeOrderId.value || genOrderId('WEB')
  activeOrderId.value = targetOrderId
  try {
    localStorage.setItem(SA_ACTIVE_ORDER_KEY, targetOrderId)
  } catch {}
  setOrderQueryParam(targetOrderId)

  creatingGroupSession.value = true
  groupSessionPromise = (async () => {
    try {
      const initialItems = Object.values(localCartLines.value).map((line) => {
        const prod = menu.value.find((m) => String(m.Ma_hang) === String(line.Ma_hang))
        return {
          lineId: line.lineId,
          Ma_hang: line.Ma_hang,
          Ten_hang: prod?.Ten_hang || line.Ten_hang || '',
          Gia_ban: prod ? finalPrice(prod) : Number(line.unitPrice || 0),
          Don_vi_tien_te: prod?.Don_vi_tien_te || 'P',
          So_luong: Number(line.qty || 1),
          Ghi_chu: line.note || '',
          Nguoi_dat:
            line.memberName ||
            memberName.value.trim() ||
            tenKhach.value.trim() ||
            t('group.guestDefault'),
          Nguoi_dat_id: line.memberId || memberId,
          Added_at: line.addedTime || Date.now(),
        }
      })

      let res = await ensureLiveOrderSession({
        orderId: targetOrderId,
        hostId: memberId,
        hostName: memberName.value.trim() || tenKhach.value.trim(),
        meta: {
          Ten_khach_hang: tenKhach.value,
          So_dien_thoai: sdt.value,
          Dia_chi: diaChi.value,
          Thoi_gian_nhan_hang: thoiGian.value,
          Hinh_thuc_thanh_toan: hinhThucTT.value,
          Ghi_chu: ghiChu.value,
        },
        initialItems,
      })

      if (res?.closed) {
        const fallbackOrderId = genOrderId('WEB')
        activeOrderId.value = fallbackOrderId
        try {
          localStorage.setItem(SA_ACTIVE_ORDER_KEY, fallbackOrderId)
        } catch {}
        setOrderQueryParam(fallbackOrderId)
        res = await ensureLiveOrderSession({
          orderId: fallbackOrderId,
          hostId: memberId,
          hostName: memberName.value.trim() || tenKhach.value.trim(),
          meta: {
            Ten_khach_hang: tenKhach.value,
            So_dien_thoai: sdt.value,
            Dia_chi: diaChi.value,
            Thoi_gian_nhan_hang: thoiGian.value,
            Hinh_thuc_thanh_toan: hinhThucTT.value,
            Ghi_chu: ghiChu.value,
          },
          initialItems,
        })
      }

      if (res?.orderId) {
        localCartLines.value = {}
        try {
          localStorage.removeItem(SA_LOCAL_CART_KEY)
        } catch {}
        connectLiveOrder(res.orderId, { fromUrl: false, syncUrl: true })
        return res.orderId
      }
    } catch (err) {
      console.warn('ensureGroupSessionActive failed:', err)
    } finally {
      creatingGroupSession.value = false
      groupSessionPromise = null
    }
    return activeOrderId.value
  })()

  return groupSessionPromise
}

async function openGroupShareModal() {
  if (isOrderTerminal.value) {
    resetClosedOrStaleOrder(false, { autoCreateNew: false })
  }
  showGroupShareModal.value = true
  await ensureGroupSessionActive()
}

async function copyGroupShareLink() {
  try {
    if (!activeOrderId.value && !isOrderLocked.value) {
      await ensureGroupSessionActive()
    }
    if (!groupShareUrl.value) return
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(groupShareUrl.value)
    }
    inviteCopied.value = true
    setTimeout(() => {
      inviteCopied.value = false
    }, 2200)
    triggerToast(t('group.copiedLink'), 'success')
  } catch (err) {
    console.warn('copyGroupShareLink failed:', err)
  }
}

async function startOrCopyGroupOrder() {
  await openGroupShareModal()
}

function isMemberGroupOpen(grp) {
  if (!grp) return false
  const explicit = memberExpandedMap.value[grp.groupKey]
  if (typeof explicit === 'boolean') return explicit
  return Boolean(grp.isMe)
}

function toggleMemberGroupOpen(grp) {
  if (!grp) return
  const current = isMemberGroupOpen(grp)
  memberExpandedMap.value = {
    ...memberExpandedMap.value,
    [grp.groupKey]: !current,
  }
}

const areAllMemberGroupsOpen = computed(
  () =>
    cartMemberGroups.value.length > 0 &&
    cartMemberGroups.value.every((grp) => isMemberGroupOpen(grp)),
)

function toggleAllMemberGroups() {
  const nextOpen = !areAllMemberGroupsOpen.value
  const nextMap = { ...memberExpandedMap.value }
  cartMemberGroups.value.forEach((grp) => {
    nextMap[grp.groupKey] = nextOpen
  })
  memberExpandedMap.value = nextMap
}

function isModalMemberGroupOpen(grp) {
  if (!grp) return false
  const explicit = modalMemberExpandedMap.value[grp.groupKey]
  if (typeof explicit === 'boolean') return explicit
  return true
}

function toggleModalMemberGroupOpen(grp) {
  if (!grp) return
  const current = isModalMemberGroupOpen(grp)
  modalMemberExpandedMap.value = {
    ...modalMemberExpandedMap.value,
    [grp.groupKey]: !current,
  }
}

const areAllModalMemberGroupsOpen = computed(
  () =>
    cartMemberGroups.value.length > 0 &&
    cartMemberGroups.value.every((grp) => isModalMemberGroupOpen(grp)),
)

function toggleAllModalMemberGroups() {
  const nextOpen = !areAllModalMemberGroupsOpen.value
  const nextMap = { ...modalMemberExpandedMap.value }
  cartMemberGroups.value.forEach((grp) => {
    nextMap[grp.groupKey] = nextOpen
  })
  modalMemberExpandedMap.value = nextMap
}

const orderStatusInfo = computed(() => {
  if (liveStatus.value === 'Đã hủy') {
    return {
      text: t('orderStatus.cancelled'),
      icon: 'ri-close-circle-fill',
      stateClass: 'is-cancelled',
    }
  }
  if (liveStatus.value === 'Hoàn thành') {
    return {
      text: t('orderStatus.completed'),
      icon: 'ri-checkbox-circle-fill',
      stateClass: 'is-completed',
    }
  }
  if (liveStatus.value === 'Đang ship') {
    return {
      text: t('orderStatus.shipping'),
      icon: 'ri-e-bike-2-fill',
      stateClass: 'is-shipping',
    }
  }
  if (liveStatus.value === 'Đang xử lý') {
    return {
      text: t('orderStatus.preparing'),
      icon: 'ri-restaurant-2-fill',
      stateClass: 'is-approved',
    }
  }
  if (liveStatus.value === 'Chờ duyệt') {
    return {
      text: t('orderStatus.pending'),
      icon: 'ri-time-fill',
      stateClass: 'is-pending',
    }
  }
  if (activeOrderId.value) {
    const g = guestMembersSummary.value
    const progressSuffix = g.totalGuests > 0 ? ` (${g.doneGuests}/${g.totalGuests})` : ''
    return {
      text: `${t('orderStatus.waitingGroup')}${progressSuffix}`,
      icon: 'ri-team-fill',
      stateClass: 'is-group',
    }
  }
  return {
    text: t('orderStatus.waitingGroup'),
    icon: cartItems.value.length > 0 ? 'ri-team-line' : 'ri-file-list-3-line',
    stateClass: cartItems.value.length > 0 ? 'is-selecting' : 'is-empty',
  }
})

const orderStatusProgress = computed(() => {
  const steps = [
    { key: 'group', label: t('orderStatus.stepShort.group'), icon: 'ri-team-fill' },
    { key: 'pending', label: t('orderStatus.stepShort.pending'), icon: 'ri-time-fill' },
    { key: 'preparing', label: t('orderStatus.stepShort.preparing'), icon: 'ri-restaurant-2-fill' },
    { key: 'shipping', label: t('orderStatus.stepShort.shipping'), icon: 'ri-e-bike-2-fill' },
    { key: 'completed', label: t('orderStatus.stepShort.completed'), icon: 'ri-checkbox-circle-fill' },
  ]
  const st = liveStatus.value
  const isCancelled = st === 'Đã hủy'
  let activeIndex = 0
  if (st === 'Chờ duyệt') activeIndex = 1
  else if (st === 'Đang xử lý') activeIndex = 2
  else if (st === 'Đang ship') activeIndex = 3
  else if (st === 'Hoàn thành') activeIndex = 4
  else if (isCancelled) activeIndex = -1

  const fillPercent =
    activeIndex <= 0 ? 0 : Math.min(100, (activeIndex / (steps.length - 1)) * 100)
  const isTerminal = isCancelled || st === 'Hoàn thành'
  return {
    steps,
    activeIndex,
    fillPercent,
    isCancelled,
    isTerminal,
  }
})

function onOrderStatusClick() {
  if (isMobile.value) {
    openMobileProgressAfterSubmit({ toast: false })
    return
  }
  const hasSubmittedState = Boolean(liveStatus.value && liveStatus.value !== 'Nháp')
  if (isCartVisuallyEmpty.value && !hasSubmittedState) {
    showEmptyCartModal.value = true
    return
  }
  showFullCartModal.value = true
}

function onPendingProgressClick() {
  if (isMobile.value) {
    openMobileProgressAfterSubmit({ toast: false })
    return
  }
  showExportModal.value = true
}

function onContinueToFullModal() {
  const hasSubmittedState = Boolean(liveStatus.value && liveStatus.value !== 'Nháp')
  if (isCartVisuallyEmpty.value && !hasSubmittedState) {
    showEmptyCartModal.value = true
    return
  }
  if (isOrderLocked.value) {
    onOrderStatusClick()
    return
  }
  if (isGroupHost.value && unfinishedGuestMembers.value.length > 0) {
    unfinishedActionTarget.value = 'fullModal'
    showUnfinishedGuestsModal.value = true
    nudgeUnfinishedGuests()
    return
  }
  showFullCartModal.value = true
}
// ===== MAP + ADDRESS AUTOCOMPLETE =====
const mapRef = ref(null)
const addressKeyword = ref('')
const addressSuggestions = ref([])
const selectedLatLng = ref(null)
const khuyenMaiInfo = ref([])
const itemNotes = ref({}) // { [Ma_hang]: 'ghi chú món' }
const showExportModal = ref(false)
let map = null
let marker = null
const priceSort = ref('all')   //  mặc định TẤT CẢ
const addedMap = ref({})
const loadingMain = ref(true)
const CACHE_VERSION = 2
const CACHE_TTL = 1000 * 60 * 10 // 10 phút
const showCategoryModal = ref(false)
const showContactModal = ref(false)
const showProgressModal = ref(false)
const activeMobilePanel = ref(null)
const isMobile = ref(false)
const closingDetailSidebar = ref(false)
const showImageModal = ref(false)
const previewImage = ref('')
// ===== THÔNG TIN CHUYỂN KHOẢN =====
const thongTinChuyenKhoan = ref([])
const showCKModal = ref(false)
const showFullCartModal = ref(false)
const showEmptyCartModal = ref(false)
const showLockedOrderContactModal = ref(false)

function openLockedOrderContactPrompt() {
  showLockedOrderContactModal.value = true
}

function viewProgressFromLockedModal() {
  showLockedOrderContactModal.value = false
  onOrderStatusClick()
}

function startNewOrderFromLockedModal() {
  showLockedOrderContactModal.value = false
  startNewOrder()
}

function openContactFromLockedModal() {
  showLockedOrderContactModal.value = false
  if (isMobile.value) {
    openMobilePanel('contact')
  } else {
    showContactPopover.value = true
  }
}

function openShopChatOnly(c) {
  if (!c) return
  const rawLink = String(c.Direct_link || '').trim()
  if (!rawLink) return
  const url = normalizeContactHref(rawLink, c.PLATFORM_name)
  showLockedOrderContactModal.value = false
  window.open(url, '_blank')
}

watch(showFullCartModal, (open) => {
  if (open) {
    modalMemberExpandedMap.value = {}
  }
})

const ckList = computed(() => thongTinChuyenKhoan.value || [])

const ckListStyle = computed(() => {
  if (isMobile.value) return { gridTemplateColumns: '1fr' }
  const count = ckList.value.length
  // Tối đa 3 cột, chiều rộng tối thiểu 300px mỗi card
  const cols = Math.min(count, 3)
  return {
    gridTemplateColumns: `repeat(${cols}, minmax(300px, 1fr))`
  }
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}
function openCartMobile() {
  if (isMobile.value) {
    showCart.value = true
  }
}
watch(isMobile, (v) => {
  if (v) {
    showCategories.value = false
  }
})

function onDocumentClick(e) {
  if (searchWrapperRef.value && !searchWrapperRef.value.contains(e.target)) {
    showSearchSuggest.value = false
  }
  if (contactPopoverRef.value && !contactPopoverRef.value.contains(e.target)) {
    showContactPopover.value = false
  }
  if (allCatsWrapRef.value && !allCatsWrapRef.value.contains(e.target)) {
    showAllCatsDrawer.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})
onMounted(() => {
  loadPersistedLocalState()

  const qOrder = String(route.query?.order || '').trim()
  if (qOrder) {
    connectLiveOrder(qOrder, { fromUrl: true, syncUrl: true })
  } else {
    let savedOrder = ''
    try {
      savedOrder = String(localStorage.getItem(SA_ACTIVE_ORDER_KEY) || '').trim()
    } catch {}
    if (savedOrder) {
      connectLiveOrder(savedOrder, { fromUrl: false, syncUrl: true })
    } else {
      ensureGroupSessionActive()
    }
  }

  unsubHangHoaLive = subscribeSheet('hang_hoa', (rows) => {
    const filtered = (rows || []).filter((m) =>
      ['Còn hàng', 'Hết hàng'].includes(m.Trang_thai),
    )
    if (filtered.length || rawMenu.value.length) {
      rawMenu.value = filtered
      filtered.forEach((m) => {
        if (!tempQty.value[m.Ma_hang]) tempQty.value[m.Ma_hang] = 1
      })
      if (selectedItem.value?.Ma_hang) {
        const updated = menu.value.find((m) => m.Ma_hang === selectedItem.value.Ma_hang)
        if (updated) selectedItem.value = updated
      }
    }
  })

  unsubKhuyenMaiLive = subscribeSheet('khuyenmai_info', (rows) => {
    khuyenMaiInfo.value = rows || []
  })

  const savedLang = localStorage.getItem('APP_LANG')

  //  CHƯA BAO GIỜ CHỌN LANG
  if (!savedLang) {
    showLangModal.value = true
    return
  }

  //  ĐÃ CÓ LANG, nhưng URL KHÁC
  if (route.params.lang !== savedLang) {
    redirectToLang(savedLang)
    return
  }

  reloadData()
})

watch(
  () => route.query?.order,
  (newOrder) => {
    const clean = String(newOrder || '').trim()
    if (clean && clean !== activeOrderId.value) {
      connectLiveOrder(clean, { fromUrl: true })
    }
  },
)

function onWindowScroll() {
  if (isMobile.value) {
    updateScrollTopVisibility()
  }
  checkLoadMoreOnScroll()
}

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  nextTick(() => {
    if (mainRef.value) {
      mainRef.value.addEventListener('scroll', updateScrollTopVisibility, { passive: true })
      updateScrollTopVisibility()
    }
    checkAndFillViewport()
  })
})


async function waitForPageLoaded() {
  await nextTick()
  await nextTick()

  if (pagedMenu.value.length === 0) {
    await nextTick()
  }

  await new Promise(r => requestAnimationFrame(r))
}
async function selectLanguage(lang) {
  langLoading.value = true

  localStorage.setItem('APP_LANG', lang)

  locale.value = lang        //  BẮT BUỘC
  redirectToLang(lang)

  await waitForPageLoaded()

  langLoading.value = false
  showLangModal.value = false
}




function redirectToLang(lang) {
  const isMobilePath = route.path.includes('/mobile')
  const { ncc: _ncc, ...cleanQuery } = route.query || {}
  const activeOrd = String(cleanQuery.order || activeOrderId.value || '').trim()
  if (activeOrd) {
    cleanQuery.order = activeOrd
  }

  router.replace({
    path: `/${lang}${isMobilePath ? '/mobile' : ''}`,
    query: cleanQuery,
  })
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  //  AUTO BẬT / TẮT GIỎ THEO THIẾT BỊ
  if (isMobile.value) {
    showCart.value = false   // mobile → tắt
  } else {
    showCart.value = true    // desktop → bật
  }
})

watch(isMobile, (val) => {
  if (val) {
    // chuyển sang mobile
    showCart.value = false
  } else {
    // chuyển sang desktop
    showCart.value = true
  }
})

async function removeItem(i) {
  if (isOrderLocked.value && !isOrderTerminal.value) {
    openLockedOrderContactPrompt()
    return
  }
  if (isOrderLocked.value) {
    triggerToast(t('group.lockedHint'), 'warn')
    return
  }
  if (activeOrderId.value) {
    const res = await removeLiveOrderItem({
      orderId: activeOrderId.value,
      lineId: i.lineId,
      role: 'guest',
    })
    if (res?.kicked) handleKickedFromOrder()
    else if (res?.closed) resetClosedOrStaleOrder(true)
    else if (res?.locked) triggerToast(t('group.lockedHint'), 'warn')
    return
  }

  if (i.lineId && localCartLines.value[i.lineId]) {
    delete localCartLines.value[i.lineId]
    localCartLines.value = { ...localCartLines.value }
    saveLocalCartLines()
  }
  delete cart.value[i.Ma_hang]
}

const INITIAL_BATCH_SIZE = 12
const LOAD_MORE_STEP = 12
const visibleCount = ref(INITIAL_BATCH_SIZE)
const loadMoreSentinelRef = ref(null)
let lazyLoadObserver = null

const keyword = ref('')
const searchInput = ref('')
const cart = ref({})
const currentCategory = ref('Tất cả')

const menuKey = computed(() => {
  return `${keyword.value}-${currentCategory.value}-${priceSort.value}`
})

const CHECK_SCAM_LINKS = computed(() => [
  {
    key: 'verify',
    url: 'https://checkscam8888.vercel.app/',
    title: t('contact.checkScamVerify'),
    sub: t('contact.checkScamVerifySub'),
    headerLabel: t('contact.checkScamVerifyHeader'),
    short: 'STK',
    icon: 'ri-shield-check-fill',
    variant: 'is-verify',
  },
  {
    key: 'shops',
    url: 'https://checkscam8888.vercel.app/shops',
    title: t('contact.checkScamShops'),
    sub: t('contact.checkScamShopsSub'),
    headerLabel: t('contact.checkScamShopsHeader'),
    short: 'QUÁN',
    icon: 'ri-store-2-fill',
    variant: 'is-shops',
  },
  {
    key: 'alerts',
    url: 'https://checkscam8888.vercel.app/alerts',
    title: t('contact.checkScamAlerts'),
    sub: t('contact.checkScamAlertsSub'),
    headerLabel: t('contact.checkScamAlertsHeader'),
    short: 'SCAM',
    icon: 'ri-alarm-warning-fill',
    variant: 'is-alerts',
  },
])
const leftDockCollapsed = ref(typeof window !== 'undefined' ? window.innerWidth < 1260 : false)
const showCategories = ref(true)
const showCart = ref(false)
const currentBannerIndex = ref(0)
const prevActiveBannerIndex = ref(-1)
const bannerTouchStartX = ref(0)
const bannerHoverPaused = ref(false)
const bannerKey = ref(0)
const mainRef = ref(null)
const scamHubRef = ref(null)
const showScrollTop = ref(false)
const showHeaderScam = ref(false)
const isBannerTransitioning = ref(false)

/* ===== LOAD ===== */
onMounted(async () => {
  nextTick(() => {
    if (mapRef.value && !map) {
      map = L.map(mapRef.value, {
        worldCopyJump: true,
      }).setView([20, 0], 2)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords
            map.setView([latitude, longitude], 12)
          },
          () => {
            map.setView([20, 0], 2)
          }
        )
    }
  }
})


})
function ensureTempQty(m) {
  if (!tempQty.value[m.Ma_hang]) {
    tempQty.value[m.Ma_hang] = 1
  }
}
function addToCartFromModal(m) {
  if (isOrderLocked.value && !isOrderTerminal.value) {
    openLockedOrderContactPrompt()
    return
  }
  addToCart(m) // dùng lại logic cũ

  // chạy animation đóng
  closingModal.value = true

  setTimeout(() => {
    closeDetail()
    closingModal.value = false
  }, 220) // khớp với thời gian animation
}

/* ===== COMPUTED ===== */
const categories = computed(() => {
  const activeLocale = String(locale.value || 'vi').trim() || 'vi'
  const uniqueSorted = [
    ...new Set(
      menu.value
        .map((m) => String(m.Danh_muc || '').trim())
        .filter((name) => name && name !== 'Tất cả' && name !== 'Sale')
    )
  ].sort((a, b) =>
    a.localeCompare(b, activeLocale, { sensitivity: 'base', numeric: true })
  )

  // kiểm tra có hàng giảm không
  const hasSale = menu.value.some((m) => isDiscount(m))

  return [
    'Tất cả',
    ...(hasSale ? ['Sale'] : []),
    ...uniqueSorted
  ]
})

const allCategoryLabel = computed(() => categories.value[0] || '')
function resetToAllCategory() {
  currentCategory.value = allCategoryLabel.value || 'Tất cả'
}

const shopContactList = computed(() => shopContacts.value || [])

function isContactMessageAllowed(c) {
  if (!c) return false
  const v = c.Allow_message
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true'
}

const messagingContactList = computed(() =>
  shopContactList.value
    .filter((c) => isContactMessageAllowed(c) && String(c.Direct_link || '').trim())
    .slice(0, 1),
)
const filteredMenu = computed(() => {
  let list = [...menu.value]

  // CATEGORY
  if (currentCategory.value === 'Sale') {
    list = list.filter(m => isDiscount(m))
  }
  else if (currentCategory.value !== allCategoryLabel.value) {
    list = list.filter(m => m.Danh_muc === currentCategory.value)
  }

  // SEARCH (matches across all 5 languages)
  if (keyword.value) {
    list = list.filter(m => productMatchesKeyword(m, keyword.value))
  }

  // SORT
  if (priceSort.value === 'asc') {
    list.sort((a, b) => finalPrice(a) - finalPrice(b))
  } 
  else if (priceSort.value === 'desc') {
    list.sort((a, b) => finalPrice(b) - finalPrice(a))
  }
  else {
    // Đã bỏ list.reverse() theo yêu cầu để đảo ngược lại vị trí mặc định từ API
    // list.reverse()
  }

  return list
})

const searchSuggestions = computed(() => {
  const kw = (searchInput.value || '').trim()
  if (!kw) return []

  return menu.value
    .filter((m) => productMatchesKeyword(m, kw))
    .slice(0, 12)
})

let sortScrollTimer = null

function resetVisibleMenu() {
  visibleCount.value = INITIAL_BATCH_SIZE
  nextTick(() => {
    checkAndFillViewport()
  })
}

function loadMoreItems() {
  if (visibleCount.value >= filteredMenu.value.length) return
  visibleCount.value = Math.min(
    filteredMenu.value.length,
    visibleCount.value + LOAD_MORE_STEP
  )
  nextTick(() => {
    checkAndFillViewport()
  })
}

function checkLoadMoreOnScroll() {
  const el = loadMoreSentinelRef.value
  if (!el || visibleCount.value >= filteredMenu.value.length) return
  const rect = el.getBoundingClientRect()
  if (rect.top <= window.innerHeight + 360) {
    loadMoreItems()
  }
}

function checkAndFillViewport() {
  const el = loadMoreSentinelRef.value
  if (!el || visibleCount.value >= filteredMenu.value.length) return
  const rect = el.getBoundingClientRect()
  if (rect.top <= window.innerHeight + 240) {
    loadMoreItems()
  }
}

watch(
  loadMoreSentinelRef,
  (el) => {
    if (lazyLoadObserver) {
      lazyLoadObserver.disconnect()
      lazyLoadObserver = null
    }
    if (!el || typeof IntersectionObserver === 'undefined') return

    lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreItems()
        }
      },
      {
        root: null,
        rootMargin: '360px 0px'
      }
    )
    lazyLoadObserver.observe(el)
    checkAndFillViewport()
  },
  { flush: 'post' }
)

watch(
  () => filteredMenu.value.length,
  () => {
    nextTick(() => {
      checkAndFillViewport()
    })
  }
)

watch(priceSort, () => {
  resetVisibleMenu()

  clearTimeout(sortScrollTimer)
  sortScrollTimer = setTimeout(() => {
    scrollToTop()
  }, 120)
})

const hasMoreItems = computed(() => visibleCount.value < filteredMenu.value.length)

const pagedMenu = computed(() => {
  return filteredMenu.value.slice(0, visibleCount.value)
})

let searchScrollTimer = null

watch(keyword, () => {
  resetVisibleMenu()
})

function applySearch() {
  keyword.value = (searchInput.value || '').trim()
  showSearchSuggest.value = false
  resetVisibleMenu()
  scrollToTop()
}

const cartItems = computed(() => {
  const menuByMa = new Map(menu.value.map((m) => [String(m.Ma_hang), m]))

  // 1) LIVE ORDER / GROUP CART MODE
  if (activeOrderId.value && liveOrderData.value) {
    return (liveOrderData.value.itemsList || []).map((li) => {
      const matched = menuByMa.get(String(li.Ma_hang || ''))
      const unitPrice = Number(
        li.Gia_ban !== undefined && li.Gia_ban !== ''
          ? li.Gia_ban
          : matched
            ? finalPrice(matched)
            : 0,
      )
      const qty = Math.max(1, Number(li.So_luong || 1))
      const isAdminAdded = li.Added_by_role === 'admin'
      const displayAuthor = isAdminAdded
        ? t('group.addedByShop')
        : String(li.Nguoi_dat || '').trim() || t('group.guestDefault')
      const baseRegularPrice = matched ? Number(matched.Gia_ban || 0) : unitPrice

      return {
        ...(matched || {}),
        lineId: li.lineId,
        Ma_hang: li.Ma_hang || matched?.Ma_hang || li.lineId,
        Ten_hang: matched ? matched.Ten_hang : li.Ten_hang,
        Dvt: matched ? matched.Dvt : li.Dvt || '',
        Main_img: matched?.Main_img || li.Main_img || '',
        Don_vi_tien_te:
          li.Don_vi_tien_te || matched?.Don_vi_tien_te || menu.value[0]?.Don_vi_tien_te || 'P',
        unitPrice,
        Gia_ban: unitPrice,
        isDiscounted: baseRegularPrice > 0 && unitPrice < baseRegularPrice,
        qty,
        thanhTien: qty * unitPrice,
        note: String(li.Ghi_chu || '').trim(),
        displayAuthor,
        rawAuthor: String(li.Nguoi_dat || '').trim(),
        memberId: li.Nguoi_dat_id || '',
        isAdminAdded,
        addedTime: Number(li.Added_at || 0),
      }
    })
  }

  // 2) SOLO LOCAL MODE
  const lines = Object.values(localCartLines.value || {})
  return lines
    .map((line) => {
      const matched = menuByMa.get(String(line.Ma_hang || ''))
      const unitPrice = matched ? finalPrice(matched) : Number(line.unitPrice || 0)
      const qty = Math.max(1, Number(line.qty || 1))
      const author =
        String(line.memberName || '').trim() ||
        memberName.value.trim() ||
        tenKhach.value.trim() ||
        ''

      return {
        ...(matched || {}),
        lineId: line.lineId,
        Ma_hang: line.Ma_hang,
        Ten_hang: matched ? matched.Ten_hang : line.Ten_hang || line.Ma_hang,
        Dvt: matched ? matched.Dvt : line.Dvt || '',
        Main_img: matched?.Main_img || line.Main_img || '',
        Don_vi_tien_te: matched?.Don_vi_tien_te || line.Don_vi_tien_te || 'P',
        unitPrice,
        Gia_ban: unitPrice,
        isDiscounted: matched ? isDiscount(matched) : false,
        qty,
        thanhTien: qty * unitPrice,
        note: String(line.note || '').trim(),
        displayAuthor: author,
        rawAuthor: author,
        memberId: line.memberId || memberId,
        isAdminAdded: false,
        addedTime: Number(line.addedTime || 0),
      }
    })
    .filter((it) => it.qty > 0)
    .sort((a, b) => a.addedTime - b.addedTime)
})

const cartCurrency = computed(
  () =>
    cartItems.value[0]?.Don_vi_tien_te ||
    liveOrderData.value?.meta?.Don_vi_tien_te ||
    menu.value[0]?.Don_vi_tien_te ||
    'P',
)

const cartQtyTotal = computed(() =>
  cartItems.value.reduce((sum, i) => sum + i.qty, 0)
)


const totalAmount = computed(() =>
  cartItems.value.reduce((sum, i) => sum + i.thanhTien, 0)
)

const cartMemberGroups = computed(() => {
  // 1) LIVE / GROUP ORDER MODE
  if (activeOrderId.value && liveOrderData.value) {
    const groupsMap = new Map()
    const hId = hostMemberId.value
    const hasGuestInLive =
      (liveOrderData.value.membersList || []).some((m) => m.role !== 'host') ||
      cartItems.value.some(
        (it) => !it.isAdminAdded && Boolean(it.memberId) && Boolean(hId) && it.memberId !== hId,
      )
    const fallbackHostLabel = hasGuestInLive ? t('group.hostBadge') : t('group.guestDefault')

    for (const m of liveOrderData.value.membersList || []) {
      const gKey = `m:${m.id}`
      const localHostName = m.id === memberId ? memberName.value.trim() || tenKhach.value.trim() : ''
      const fallbackName =
        m.role === 'host'
          ? localHostName ||
            liveOrderData.value?.meta?.Ten_khach_hang ||
            liveOrderData.value?.meta?.Host_name ||
            fallbackHostLabel
          : t('group.guestDefault')
      const resolvedName =
        m.role === 'host' &&
        (!m.name || m.name === t('group.guestDefault') || m.name === t('group.hostBadge'))
          ? fallbackName
          : m.name || fallbackName
      groupsMap.set(gKey, {
        groupKey: gKey,
        memberId: m.id,
        name: resolvedName,
        role: m.role === 'host' ? 'host' : 'guest',
        isMe: m.id === memberId,
        done: m.role === 'host' ? true : Boolean(m.done),
        totalQty: 0,
        subtotal: 0,
        items: [],
      })
    }

    for (const item of cartItems.value) {
      if (item.isAdminAdded) {
        const adminKey = '__admin__'
        if (!groupsMap.has(adminKey)) {
          groupsMap.set(adminKey, {
            groupKey: adminKey,
            memberId: '__admin__',
            name: t('group.addedByShop'),
            role: 'admin',
            isMe: false,
            done: true,
            totalQty: 0,
            subtotal: 0,
            items: [],
          })
        }
        const grp = groupsMap.get(adminKey)
        grp.items.push(item)
        grp.totalQty += item.qty
        grp.subtotal += item.thanhTien
        continue
      }

      const itemMemberId = String(item.memberId || '').trim()
      const gKey = itemMemberId
        ? `m:${itemMemberId}`
        : `name:${String(item.displayAuthor || 'guest').toLowerCase()}`

      if (!groupsMap.has(gKey)) {
        const isHostLine =
          (hId && itemMemberId === hId) || (!hId && groupsMap.size === 0)
        groupsMap.set(gKey, {
          groupKey: gKey,
          memberId: itemMemberId,
          name:
            item.rawAuthor ||
            item.displayAuthor ||
            (isHostLine ? fallbackHostLabel : t('group.guestDefault')),
          role: isHostLine ? 'host' : 'guest',
          isMe: Boolean(itemMemberId && itemMemberId === memberId),
          done: isHostLine,
          totalQty: 0,
          subtotal: 0,
          items: [],
        })
      }

      const grp = groupsMap.get(gKey)
      if ((!grp.name || grp.name === t('group.guestDefault')) && item.rawAuthor) {
        grp.name = item.rawAuthor
      }
      grp.items.push(item)
      grp.totalQty += item.qty
      grp.subtotal += item.thanhTien
    }

    const orderRank = { host: 0, guest: 1, admin: 2 }
    return Array.from(groupsMap.values()).sort(
      (a, b) => (orderRank[a.role] ?? 1) - (orderRank[b.role] ?? 1),
    )
  }

  // 2) SOLO LOCAL MODE
  if (!cartItems.value.length) return []
  const soloName =
    memberName.value.trim() || tenKhach.value.trim() || t('group.guestDefault')
  return [
    {
      groupKey: `m:${memberId}`,
      memberId,
      name: soloName,
      role: 'host',
      isMe: true,
      done: true,
      totalQty: cartQtyTotal.value,
      subtotal: totalAmount.value,
      items: cartItems.value,
    },
  ]
})

const hasGroupMembers = computed(() =>
  cartMemberGroups.value.some((g) => g.role === 'guest'),
)

const isCartVisuallyEmpty = computed(
  () => cartItems.value.length === 0 && cartMemberGroups.value.length <= 1,
)

const guestMembersSummary = computed(() => {
  const guests = cartMemberGroups.value.filter((g) => g.role === 'guest')
  return {
    totalGuests: guests.length,
    doneGuests: guests.filter((g) => g.done).length,
  }
})

const unfinishedGuestMembers = computed(() =>
  cartMemberGroups.value.filter((g) => g.role === 'guest' && !g.done),
)

watch(unfinishedGuestMembers, (list) => {
  if (showUnfinishedGuestsModal.value && list.length === 0) {
    showUnfinishedGuestsModal.value = false
    if (unfinishedActionTarget.value === 'fullModal') {
      showFullCartModal.value = true
    }
  }
})

const exportText = computed(() => {
  const headerLine = activeOrderId.value
    ? `${t('group.orderCode')}: #${activeOrderId.value}\n`
    : ''

  const groupsWithItems = cartMemberGroups.value.filter((grp) => grp.items.length > 0)
  const customerGroupsWithItems = groupsWithItems.filter((grp) => grp.role !== 'admin')
  const hasMultipleCustomers = customerGroupsWithItems.length > 1
  const hasAdminGroup = groupsWithItems.some((grp) => grp.role === 'admin')

  const formatExportItemLine = (i, indent = '  ') => {
    const notePart = i.note ? ` (${i.note})` : ''
    return `${indent}- ${i.qty}x ${i.Ten_hang} (${formatPrice(i.unitPrice, i.Don_vi_tien_te)}) = ${formatPrice(i.thanhTien, i.Don_vi_tien_te)}${notePart}`
  }

  let itemsBody = ''
  if (!hasMultipleCustomers && !hasAdminGroup) {
    // Only 1 customer ordering -> list dishes flat without "Trưởng nhóm" role header
    itemsBody = groupsWithItems
      .flatMap((grp) => grp.items.map((i) => formatExportItemLine(i, '')))
      .join('\n')
  } else {
    const groupBlocks = groupsWithItems.map((grp) => {
      const itemLines = grp.items.map((i) => formatExportItemLine(i, '  '))
      if (grp.role === 'admin') {
        return `[${t('group.addedByShop')}] (${formatPrice(grp.subtotal, cartCurrency.value)})\n${itemLines.join('\n')}`
      }
      if (!hasMultipleCustomers) {
        return `[${grp.name}] (${formatPrice(grp.subtotal, cartCurrency.value)})\n${itemLines.join('\n')}`
      }
      const roleLabel =
        grp.role === 'host' ? t('group.hostBadge') : t('group.memberBadge')
      return `[${grp.name} - ${roleLabel}] (${formatPrice(grp.subtotal, cartCurrency.value)})\n${itemLines.join('\n')}`
    })
    itemsBody = groupBlocks.join('\n\n')
  }

  const paymentLabel =
    hinhThucTT.value === 'CHUYEN_KHOAN' ? t('cart.transfer') : t('cart.cash')

  const promoLine = earnedPromoLocalSummary.value
    ? `\n${t('promo.exportEarned')}: ${earnedPromoLocalSummary.value}`
    : ''

  return `${headerLine}${itemsBody}

${t('export.total')}: ${formatPrice(totalAmount.value, cartCurrency.value)} (${paymentLabel})${promoLine}

${t('cart.name')}: ${tenKhach.value || memberName.value}
${t('export.address')}: ${diaChi.value}
${t('export.phone')}: ${sdt.value}
${t('export.time')}: ${thoiGian.value}
${t('export.note')}: ${ghiChu.value}`.trim()
})

const thongBaoList = computed(() =>
  [...(thongBao.value || [])].sort((a, b) => {
    return String(b.ID).localeCompare(String(a.ID))
  })
)

const thongBaoTexts = computed(() =>
  thongBaoList.value
    .map((item) => resolveNoticeText(item, currentLang.value))
    .filter(Boolean)
)


const bannerList = computed(() =>
  [...(banners.value || [])].sort((a, b) => {
    // ID mới (thời gian lớn hơn) lên trước
    return String(b.ID).localeCompare(String(a.ID))
  })
)

watch(bannerList, () => {
  currentBannerIndex.value = 0
  prevActiveBannerIndex.value = -1
  bannerKey.value = 0
  startBannerAuto()
})


const logo = computed(() => logos.value?.[0] || null)
watch(
  logo,
  (val) => {
    if (!val) return

    setTitleAndFavicon(
      val.Name || val.Ten_shop || 'Shop Online',
      val.URL
    )
  },
  { immediate: true }
)

function setTitleAndFavicon(name, iconUrl) {
  //  TITLE TAB
  document.title = name || 'Shop Online'

  //  FAVICON TAB
  let link =
    document.querySelector("link[rel~='icon']") ||
    document.createElement('link')

  link.rel = 'icon'
  link.type = 'image/png'
  link.href = iconUrl || '/favicon.png'

  document.head.appendChild(link)
}

/* ===== METHODS ===== */
function inc(m) {
  cart.value[m.Ma_hang] = (cart.value[m.Ma_hang] || 0) + 1
}
let searchTimer = null

async function searchAddress() {
  clearTimeout(searchTimer)

  if (addressKeyword.value.length < 3) {
    addressSuggestions.value = []
    return
  }

  searchTimer = setTimeout(async () => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
        addressKeyword.value
      )}`
    )
    addressSuggestions.value = await res.json()
  }, 150)
}

function dec(m) {
  if (!cart.value[m.Ma_hang]) return
  cart.value[m.Ma_hang]--
  if (cart.value[m.Ma_hang] <= 0) delete cart.value[m.Ma_hang]
}

const copied = ref(false)

function copy() {
  copyTextToClipboard(exportText.value)
  copied.value = true

  // optional: reset sau 2s
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function closeExportModalAfterSend() {
  showExportModal.value = false
  showLockedOrderContactModal.value = false
  if (activeMobilePanel.value === 'export') {
    activeMobilePanel.value = null
  }
}

function isCopyOnlyChannel(platform, link) {
  const pf = String(platform || '').toLowerCase()
  const url = String(link || '').toLowerCase()
  if (PLATFORMS_NEED_COPY.some((p) => pf.includes(p))) return true
  return [
    'zalo.me',
    'm.me/',
    'facebook.com',
    'fb.com',
    'messenger.com',
    'instagram.com',
    'weixin',
    'tiktok.com',
  ].some((host) => url.includes(host))
}

// ===== HÀM GỬI SHOP - LUÔN COPY SẴN ĐƠN + MỞ ĐÚNG LINK NỀN TẢNG =====
function sendToShop(c) {
  if (!isContactMessageAllowed(c)) return
  const rawLink = String(c?.Direct_link || '').trim()
  if (!rawLink) return

  const orderSummary = String(exportText.value || '').trim()
  // Luôn copy đồng bộ ngay trong click gesture để không bao giờ mất nội dung giỏ
  copyTextToClipboard(orderSummary)

  const platform = String(c.PLATFORM_name || '').toLowerCase()
  const directLink = normalizeContactHref(rawLink, platform)

  if (isCopyOnlyChannel(platform, directLink)) {
    closeExportModalAfterSend()
    showCopyGuideModal({ ...c, Direct_link: directLink })
    return
  }

  // Nền tảng có hỗ trợ prefill URL (?text=...) + vẫn đã copy clipboard dự phòng
  const url = buildSendLink({ ...c, Direct_link: directLink })
  window.open(url, '_blank')
  closeExportModalAfterSend()
  if (orderSummary) {
    triggerToast(
      t('export.openedWithCopyHint', { platform: c.PLATFORM_name || 'Chat' }),
      'success',
      4500,
    )
  }
}


function formatPrice(value, currency) {
  const price = Number(value || 0).toLocaleString('vi-VN')
  return currency ? `${price} ${currency}` : price
}

function startBannerAuto() {
  stopBannerAuto()

  if (bannerList.value.length <= 1 || bannerHoverPaused.value) return

  bannerTimer = setTimeout(() => {
    advanceBanner(1)
  }, BANNER_INTERVAL)
}

function stopBannerAuto() {
  if (bannerTimer) {
    clearTimeout(bannerTimer)
    bannerTimer = null
  }
}

function goToBanner(targetIdx) {
  const total = bannerList.value.length
  if (total <= 1) return
  const normalized = ((targetIdx % total) + total) % total
  if (normalized === currentBannerIndex.value) return

  stopBannerAuto()
  prevActiveBannerIndex.value = currentBannerIndex.value
  currentBannerIndex.value = normalized
  bannerKey.value += 1
  startBannerAuto()
}

function advanceBanner(direction = 1) {
  const total = bannerList.value.length
  if (total <= 1) return
  goToBanner(currentBannerIndex.value + direction)
}

function getBannerCardClasses(idx) {
  const total = bannerList.value.length
  if (total <= 1) return ['is-single']
  const cur = currentBannerIndex.value
  if (idx === cur) return ['is-center']

  const classes = []
  const nextIdx = (cur + 1) % total
  const prevIdx = (cur - 1 + total) % total

  if (idx === nextIdx) {
    classes.push('is-next')
  } else if (idx === prevIdx) {
    classes.push('is-prev')
  } else {
    const forwardDist = (idx - cur + total) % total
    classes.push(forwardDist <= total / 2 ? 'is-far-next' : 'is-far-prev')
  }

  if (idx === prevActiveBannerIndex.value) {
    classes.push('is-leaving')
  }

  return classes
}

function onBannerCardClick(b, idx) {
  if (idx === currentBannerIndex.value) {
    openImageModal(b.URL)
  } else {
    goToBanner(idx)
  }
}

function onBannerTouchStart(e) {
  bannerTouchStartX.value = e.changedTouches?.[0]?.clientX || 0
}

function onBannerTouchEnd(e) {
  const endX = e.changedTouches?.[0]?.clientX || 0
  const diff = endX - bannerTouchStartX.value
  if (Math.abs(diff) > 38) {
    if (diff < 0) nextBanner()
    else prevBanner()
  }
}

function onBannerMouseEnter() {
  bannerHoverPaused.value = true
  stopBannerAuto()
}

function onBannerMouseLeave() {
  bannerHoverPaused.value = false
  startBannerAuto()
}
function getStatusKey(raw) {
  if (!raw) return ''
  if (raw === 'Còn hàng') return 'status.in_stock'
  if (raw === 'Hết hàng') return 'status.out_stock'
  return raw
}

function selectAddress(place) {
  diaChi.value = place.display_name
  addressKeyword.value = place.display_name
  addressSuggestions.value = []

  const lat = Number(place.lat)
  const lon = Number(place.lon)

  selectedLatLng.value = { lat, lon }

  if (!marker) {
    marker = L.marker([lat, lon]).addTo(map)
  } else {
    marker.setLatLng([lat, lon])
  }

  map.setView([lat, lon], 16)
}

function nextBanner() {
  advanceBanner(1)
}

function prevBanner() {
  advanceBanner(-1)
}
function incTemp(m) {
  tempQty.value[m.Ma_hang]++
}


function getTempQty(m) {
  ensureTempQty(m)
  return tempQty.value[m.Ma_hang]
}

function decTemp(m) {
  if (tempQty.value[m.Ma_hang] > 1) {
    tempQty.value[m.Ma_hang]--
  }
}


const lastAdded = ref(null)

async function addToCart(m) {
  if (isOrderTerminal.value) {
    resetClosedOrStaleOrder(false, { autoCreateNew: false })
  } else if (isOrderLocked.value) {
    openLockedOrderContactPrompt()
    return
  }

  addedMap.value[m.Ma_hang] = true
  setTimeout(() => {
    addedMap.value[m.Ma_hang] = false
  }, 500)

  const qty = Math.max(1, Number(tempQty.value[m.Ma_hang] || 1))
  const typedNote = String(itemNotes.value[m.Ma_hang] || '').trim()
  const authorName =
    memberName.value.trim() || tenKhach.value.trim() || t('group.guestDefault')
  const lineKey = makeLineId(m.Ma_hang, memberId)

  lastAdded.value = lineKey
  setTimeout(() => {
    lastAdded.value = null
  }, 2000)

  itemNotes.value[m.Ma_hang] = ''
  tempQty.value[m.Ma_hang] = 1

  //  CHỈ DESKTOP MỚI AUTO MỞ GIỎ
  if (!isMobile.value) {
    showCart.value = true
  }

  if (groupSessionPromise) {
    await groupSessionPromise
  } else if (!activeOrderId.value) {
    await ensureGroupSessionActive()
  }

  if (activeOrderId.value) {
    memberExpandedMap.value = {
      ...memberExpandedMap.value,
      [`m:${memberId}`]: true,
    }
    const existingLine = liveOrderData.value?.itemsMap?.[lineKey]
    const prevNote = String(existingLine?.Ghi_chu || '').trim()
    const mergedNote =
      typedNote && prevNote && typedNote !== prevNote
        ? `${prevNote}; ${typedNote}`
        : typedNote || prevNote

    const res = await upsertLiveOrderItem({
      orderId: activeOrderId.value,
      lineId: lineKey,
      item: {
        Ma_hang: m.Ma_hang,
        Ten_hang: m.Ten_hang,
        Gia_ban: finalPrice(m),
        Don_vi_tien_te: m.Don_vi_tien_te,
        Main_img: m.Main_img,
        Ghi_chu: mergedNote,
        Nguoi_dat: authorName,
        Nguoi_dat_id: memberId,
      },
      memberId,
      memberName: authorName,
      role: 'guest',
      deltaQty: qty,
    })

    if (res?.kicked) {
      handleKickedFromOrder()
      return
    }
    if (res?.closed) {
      resetClosedOrStaleOrder(true)
      return
    }
    if (res?.locked) {
      triggerToast(t('group.lockedHint'), 'warn')
      return
    }
  } else {
    const existing = localCartLines.value[lineKey]
    const prevNote = String(existing?.note || '').trim()
    const mergedNote =
      typedNote && prevNote && typedNote !== prevNote
        ? `${prevNote}; ${typedNote}`
        : typedNote || prevNote

    localCartLines.value = {
      ...localCartLines.value,
      [lineKey]: {
        lineId: lineKey,
        Ma_hang: m.Ma_hang,
        Ten_hang: m.Ten_hang,
        Dvt: m.Dvt,
        Main_img: m.Main_img,
        Don_vi_tien_te: m.Don_vi_tien_te,
        unitPrice: finalPrice(m),
        qty: Number(existing?.qty || 0) + qty,
        note: mergedNote,
        memberName: memberName.value.trim() || tenKhach.value.trim() || '',
        memberId,
        addedTime: existing?.addedTime || Date.now(),
      },
    }
    saveLocalCartLines()
  }

  // Cuộn tới item vừa thêm
  nextTick(() => {
    const listEl = cartListRef.value?.$el || cartListRef.value
    if (listEl) {
      const itemEl =
        listEl.querySelector(`.cart-row[data-line="${lineKey}"]`) ||
        listEl.querySelector(`.cart-row[data-ma="${m.Ma_hang}"]`)
      if (itemEl) {
        itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
}



const showDetail = ref(false)
const selectedItem = ref(null)
const supplementaryImageKeys = ['img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6']
const cardImageIndex = ref({})
let cardImageTimer = null
const CARD_IMAGE_INTERVAL = 2600
const activeModalIndex = ref(0)
const modalImages = computed(() => getModalImages(selectedItem.value))
const hasModalThumbs = computed(() => modalImages.value.length > 1)
// sidebar mới (mobile)
const showDetailSidebar = ref(false)

function getItemImages(item) {
  if (!item) return []
  return [
    item.Main_img,
    ...supplementaryImageKeys.map((key) => item[key])
  ].filter(Boolean)
}

function getModalImages(item) {
  return getItemImages(item)
}

function getCardImageIndex(item) {
  const id = item?.Ma_hang
  if (!id) return 0
  return cardImageIndex.value[id] || 0
}

function getCardImage(item) {
  const images = getItemImages(item)
  if (!images.length) return ''
  const idx = getCardImageIndex(item)
  return images[idx] || images[0]
}

function getCardImageKey(item) {
  const id = item?.Ma_hang || 'item'
  return `${id}-${getCardImageIndex(item)}`
}

function resetCardImageIndex(item) {
  const id = item?.Ma_hang
  if (!id) return
  cardImageIndex.value[id] = 0
}

function advanceCardImages() {
  pagedMenu.value.forEach((item) => {
    const images = getItemImages(item)
    if (images.length <= 1) {
      resetCardImageIndex(item)
      return
    }
    const id = item.Ma_hang
    const current = cardImageIndex.value[id] || 0
    cardImageIndex.value[id] = (current + 1) % images.length
  })
}

function startCardImageAuto() {
  stopCardImageAuto()
  cardImageTimer = setInterval(() => {
    advanceCardImages()
  }, CARD_IMAGE_INTERVAL)
}

function stopCardImageAuto() {
  if (cardImageTimer) {
    clearInterval(cardImageTimer)
    cardImageTimer = null
  }
}

watch(
  () => pagedMenu.value,
  (list) => {
    if (!list || !list.length) {
      stopCardImageAuto()
      return
    }

    list.forEach((item) => {
      if (item?.Ma_hang && cardImageIndex.value[item.Ma_hang] === undefined) {
        resetCardImageIndex(item)
      }
    })

    const hasAuto = list.some(
      (item) => getItemImages(item).length > 1
    )

    if (hasAuto) {
      if (!cardImageTimer) startCardImageAuto()
    } else {
      stopCardImageAuto()
    }
  },
  { immediate: true }
)

function setActiveModalImage(index) {
  if (index >= 0 && index < modalImages.value.length) {
    activeModalIndex.value = index
  }
}

function nextModalImage() {
  const total = modalImages.value.length
  if (!total) return
  activeModalIndex.value = (activeModalIndex.value + 1) % total
}

function prevModalImage() {
  const total = modalImages.value.length
  if (!total) return
  activeModalIndex.value =
    (activeModalIndex.value - 1 + total) % total
}

function openDetail(m) {
  selectedItem.value = m
  activeModalIndex.value = 0

  if (isMobile.value) {
    //  MOBILE → mở sidebar
    showDetailSidebar.value = true
  } else {
    //  DESKTOP → mở modal như cũ
    showDetail.value = true
  }
}


function openSuggestion(m) {
  showSearchSuggest.value = false
  openDetail(m)
}

function closeDetail() {
  showDetail.value = false
  selectedItem.value = null
  activeModalIndex.value = 0
}

function clearSearchAll() {
  keyword.value = ''
  searchInput.value = ''
  showSearchSuggest.value = false
}

function closeSearchSuggest() {
  showSearchSuggest.value = false
}

function closeDetailSidebar() {
  showDetailSidebar.value = false
  selectedItem.value = null
  activeModalIndex.value = 0
}


watch(
  () => cartItems.value.length,
  async (nextLen, prevLen) => {
    if (nextLen <= (prevLen || 0)) return
    await nextTick()
    const areaEl = cartListRef.value
    if (!areaEl) return
    const rows = areaEl.querySelectorAll('.cart-row')
    const lastRow = rows.length ? rows[rows.length - 1] : null
    if (lastRow) {
      lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
)


const khuyenMaiNoiDung = computed(() =>
  [
    ...new Set(
      (khuyenMaiInfo.value || [])
        .filter((k) => k && k.Loai_km !== 'MILESTONE')
        .map((k) => resolveNoticeText(k, currentLang.value))
        .filter(Boolean)
    )
  ]
)

function stripAutoPromoTag(rawNote) {
  return String(rawNote || '')
    .replace(/\s*\[KM ĐẠT ĐƯỢC:[^\]]*\]/gi, '')
    .trim()
}

function buildSubmittedNoteWithPromo(rawNote, promoViText) {
  const cleanBase = stripAutoPromoTag(rawNote)
  const cleanPromo = String(promoViText || '').trim()
  if (!cleanPromo) return cleanBase
  const tag = `[KM ĐẠT ĐƯỢC: ${cleanPromo}]`
  return cleanBase ? `${cleanBase} ${tag}` : tag
}

function getMilestoneRewardLabel(m, langCode) {
  const customText = resolveNoticeText(m, langCode)
  if (m?.Kieu_uu_dai === 'GIFT') {
    return customText || (langCode === 'vi' ? 'Quà tặng' : t('promo.giftDefaultLabel'))
  }
  return customText || (langCode === 'vi' ? 'Freeship' : t('promo.freeshipLabel'))
}

const activeMilestones = computed(() =>
  (khuyenMaiInfo.value || [])
    .filter(
      (k) =>
        k &&
        k.Loai_km === 'MILESTONE' &&
        k.Kich_hoat !== false &&
        Number(k.Moc_tien) > 0,
    )
    .map((k) => {
      const threshold = Number(k.Moc_tien)
      const type = k.Kieu_uu_dai === 'GIFT' ? 'GIFT' : 'FREESHIP'
      return {
        ...k,
        threshold,
        type,
        label: getMilestoneRewardLabel(k, currentLang.value),
        viLabel: getMilestoneRewardLabel(k, 'vi'),
      }
    })
    .sort((a, b) => a.threshold - b.threshold),
)

const unlockedMilestones = computed(() =>
  activeMilestones.value.filter((m) => totalAmount.value >= m.threshold),
)

const nextMilestone = computed(
  () => activeMilestones.value.find((m) => totalAmount.value < m.threshold) || null,
)

const remainingToNextMilestone = computed(() =>
  nextMilestone.value ? Math.max(0, nextMilestone.value.threshold - totalAmount.value) : 0,
)

const isAllMilestonesUnlocked = computed(
  () => activeMilestones.value.length > 0 && !nextMilestone.value,
)

const milestoneProgressPercent = computed(() => {
  if (!activeMilestones.value.length) return 0
  const maxTarget = activeMilestones.value[activeMilestones.value.length - 1].threshold
  if (maxTarget <= 0) return 0
  return Math.min(100, Math.max(0, (totalAmount.value / maxTarget) * 100))
})

const milestoneTrackFillPercent = computed(() => {
  const list = activeMilestones.value
  const count = list.length
  if (!count) return 0
  const cur = Math.max(0, Number(totalAmount.value || 0))
  if (cur <= 0) return 0
  if (cur >= list[count - 1].threshold) return 100

  for (let i = 0; i < count; i++) {
    const target = list[i].threshold
    const prevTarget = i === 0 ? 0 : list[i - 1].threshold
    const startFrac = i / count
    const endFrac = (i + 1) / count
    if (cur < target) {
      const span = Math.max(1, target - prevTarget)
      const ratio = Math.min(1, Math.max(0, (cur - prevTarget) / span))
      return (startFrac + ratio * (endFrac - startFrac)) * 100
    }
  }
  return 100
})

const milestoneCheckpoints = computed(() => {
  const list = activeMilestones.value
  const count = list.length
  const nextId = nextMilestone.value?.ID
  return list.map((m, idx) => {
    const unlocked = totalAmount.value >= m.threshold
    const isNext =
      !unlocked && (nextId ? m.ID === nextId : idx === unlockedMilestones.value.length)
    const posPct = count > 0 ? ((idx + 1) / count) * 100 : 100
    return {
      key: m.ID || `ms-${idx}-${m.threshold}`,
      threshold: m.threshold,
      thresholdText: formatPrice(m.threshold, cartCurrency.value),
      label: m.label,
      type: m.type,
      unlocked,
      isNext,
      posPct,
    }
  })
})

const milestoneHeadlineText = computed(() => {
  if (!activeMilestones.value.length) return ''
  const unlockedText = unlockedMilestones.value.map((m) => m.label).join(' + ')

  if (!nextMilestone.value) {
    return t('promo.allUnlocked', { unlocked: unlockedText })
  }

  const remainFormatted = formatPrice(remainingToNextMilestone.value, cartCurrency.value)
  const targetFormatted = formatPrice(nextMilestone.value.threshold, cartCurrency.value)

  if (totalAmount.value <= 0) {
    return t('promo.orderFrom', {
      amount: targetFormatted,
      reward: nextMilestone.value.label,
    })
  }

  if (unlockedMilestones.value.length > 0) {
    return t('promo.unlockedAndNext', {
      unlocked: unlockedText,
      amount: remainFormatted,
      reward: nextMilestone.value.label,
    })
  }

  return t('promo.addMoreFor', {
    amount: remainFormatted,
    reward: nextMilestone.value.label,
    target: targetFormatted,
  })
})

const earnedPromoViSummary = computed(() =>
  unlockedMilestones.value
    .map((m) => m.viLabel)
    .filter(Boolean)
    .join(' | '),
)

const earnedPromoLocalSummary = computed(() =>
  unlockedMilestones.value
    .map((m) => m.label)
    .filter(Boolean)
    .join(' | '),
)

// ===== DANH SÁCH NỀN TẢNG CẦN COPY + PASTE (KHÔNG HỖ TRỢ ?text=) =====
const PLATFORMS_NEED_COPY = [
  'zalo',
  'wechat',
  'weixin',
  'instagram',
  'ig',
  'facebook',
  'messenger',
  'fb',
  'tiktok',
]

function appendTextParam(baseUrl, encodedText) {
  const cleanBase = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!cleanBase) return ''
  return cleanBase.includes('?')
    ? `${cleanBase}&text=${encodedText}`
    : `${cleanBase}?text=${encodedText}`
}

function buildSendLink(c) {
  const text = encodeURIComponent(exportText.value || '')
  const platform = String(c.PLATFORM_name || '').toLowerCase()
  const link = normalizeContactHref(c.Direct_link, platform)
  const lowerLink = link.toLowerCase()

  // ==========================================
  //  TELEGRAM (loại bỏ dấu / cuối để không mất ?text=)
  // ==========================================
  if (
    platform.includes('telegram') ||
    platform.includes('tele') ||
    lowerLink.includes('t.me/') ||
    lowerLink.startsWith('tg:')
  ) {
    return appendTextParam(link, text)
  }

  // ==========================================
  //  VIBER
  // ==========================================
  if (platform.includes('viber') || lowerLink.startsWith('viber:')) {
    if (lowerLink.includes('viber://')) {
      return appendTextParam(link, text)
    }
    return link
  }

  // ==========================================
  //  ZALO / FACEBOOK MESSENGER / INSTAGRAM (KHÔNG PREFILL - DÙNG COPY)
  // ==========================================
  if (
    platform.includes('zalo') ||
    platform.includes('facebook') ||
    platform.includes('messenger') ||
    platform.includes('fb') ||
    platform.includes('instagram') ||
    platform.includes('ig')
  ) {
    return link
  }

  // ==========================================
  //  SMS
  // ==========================================
  if (platform.includes('sms') || platform.includes('tin nhắn') || lowerLink.startsWith('sms:')) {
    const phone = c.INFO || String(c.Direct_link || '').replace(/^sms:/i, '')
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const separator = isIOS ? '&' : '?'

    return `sms:${phone}${separator}body=${text}`
  }

  // ==========================================
  //  WECHAT (KHÔNG PREFILL)
  // ==========================================
  if (platform.includes('wechat') || platform.includes('weixin')) {
    return `weixin://`
  }

  // ==========================================
  //  WHATSAPP
  // ==========================================
  if (
    platform.includes('whatsapp') ||
    platform.includes('wa') ||
    lowerLink.includes('wa.me/') ||
    lowerLink.includes('whatsapp.com')
  ) {
    return appendTextParam(link, text)
  }

  // ==========================================
  //  LINE
  // ==========================================
  if (platform.includes('line') || lowerLink.includes('line.me')) {
    return `https://line.me/R/msg/text/?${text}`
  }

  // ==========================================
  //  KAKAOTALK
  // ==========================================
  if (platform.includes('kakao')) {
    return `kakaotalk://send?text=${text}`
  }

  // ==========================================
  //  MẶC ĐỊNH
  // ==========================================
  return link
}
const menuRef = ref(null)

function scrollToPageTop() {
  showScrollTop.value = false
  if (isMobile.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (mainRef.value) {
    mainRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function scrollToTop() {
  nextTick(() => {
    if (!menuRef.value) return

    // Ẩn nút ngay khi click
    showScrollTop.value = false

    if (isMobile.value) {
      const rect = menuRef.value.getBoundingClientRect()
      const headerEl = document.querySelector('.mobile-header-clean')
      const searchEl = document.querySelector('.search-wrapper')
      const topOffset =
        (headerEl ? headerEl.getBoundingClientRect().height : 0) +
        (searchEl ? searchEl.getBoundingClientRect().height : 0) +
        10
      const target = Math.max(0, window.scrollY + rect.top - topOffset)
      window.scrollTo({ top: target, behavior: 'smooth' })
      return
    }

    if (!mainRef.value) return

    const rect = menuRef.value.getBoundingClientRect()
    const mainRect = mainRef.value.getBoundingClientRect()

    // nếu menu đã gần đầu viewport thì KHÔNG scroll nữa
    if (rect.top >= mainRect.top && rect.top < mainRect.top + 30) {
      return
    }

    // Ưu tiên toạ độ tương đối trong main, trừ chiều cao thanh sticky (category/search) để không che card
    const stickyEl =
      mainRef.value.querySelector('.sticky-cat-toolbar') ||
      document.querySelector('.search-wrapper')
    const searchOffset =
      stickyEl && typeof stickyEl.getBoundingClientRect === 'function'
        ? stickyEl.getBoundingClientRect().height + 14
        : 0

    const rawTarget =
      typeof menuRef.value.offsetTop === 'number'
        ? menuRef.value.offsetTop
        : mainRef.value.scrollTop + (rect.top - mainRect.top)

    const target = Math.max(0, rawTarget - searchOffset)

    mainRef.value.scrollTo({
      top: target,
      behavior: 'smooth'
    })
  })
}

function updateScrollTopVisibility() {
  if (scamHubRef.value) {
    const topEdge = isMobile.value
      ? (document.querySelector('.mobile-header-clean')?.getBoundingClientRect().bottom || 56)
      : (mainRef.value?.getBoundingClientRect().top || 0)
    const hubRect = scamHubRef.value.getBoundingClientRect()
    showHeaderScam.value = hubRect.bottom <= topEdge + 6
  } else {
    showHeaderScam.value = false
  }

  if (isMobile.value) {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0
    showScrollTop.value = scrollY > 260
    checkLoadMoreOnScroll()
    return
  }

  const mainEl = mainRef.value
  if (!mainEl) return

  const scrollY = mainEl.scrollTop
  const menuTop =
    menuRef.value && typeof menuRef.value.offsetTop === 'number'
      ? menuRef.value.offsetTop
      : Number.POSITIVE_INFINITY

  // Hiện khi đã cuộn qua phần menu
  showScrollTop.value = scrollY > menuTop + 12

  checkLoadMoreOnScroll()
}

function forwardWheelToMain(e) {
  const mainEl = mainRef.value
  if (isMobile.value || !mainEl || e.ctrlKey) return

  let dy = e.deltaY
  if (e.deltaMode === 1) dy *= 32
  else if (e.deltaMode === 2) dy *= mainEl.clientHeight

  if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return

  let node = e.target instanceof Element ? e.target : null
  const boundary = e.currentTarget instanceof Element ? e.currentTarget : null

  while (node && node !== boundary) {
    const style = window.getComputedStyle(node)
    const canScrollY =
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight + 2
    if (canScrollY) {
      const atTop = node.scrollTop <= 1
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1
      if ((dy < 0 && !atTop) || (dy > 0 && !atBottom)) {
        return
      }
    }
    node = node.parentElement
  }

  e.preventDefault()
  mainEl.scrollTop += dy
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const cache = JSON.parse(raw)

    if (cache.version !== CACHE_VERSION) return null
    if (Date.now() - cache.time > CACHE_TTL) return null

    return cache.data
  } catch (e) {
    return null
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: CACHE_VERSION,
        time: Date.now(),
        data
      })
    )
  } catch (e) {}
}


function applyData(data) {
  rawMenu.value = (data.hang_hoa || []).filter((m) =>
    ['Còn hàng', 'Hết hàng'].includes(m.Trang_thai)
  )

  rawMenu.value.forEach((m) => {
    if (!tempQty.value[m.Ma_hang]) {
      tempQty.value[m.Ma_hang] = 1
    }
  })

  banners.value = data.banner || []
  thongBao.value = data.thong_bao || []
  logos.value = data.logo || []
  shopContacts.value = data.shop_contact || []
  khuyenMaiInfo.value = data.khuyenmai_info || []
  times.value = data.time || []
  thongTinChuyenKhoan.value = data.thong_tin_chuyen_khoan || []
}

const UNIFIED_MENU_CACHE_KEY = 'MENU_CACHE_SA_UNIFIED'

const currentLangFlagImg = computed(() => {
  const found = languages.find(l => l.code === currentLang.value)
  return found ? found.flagImg : ''
})


function openLangModal() {
  showLangModal.value = true
}

const canFinish = computed(() => {
  return (
    tenKhach.value.trim() ||
    diaChi.value.trim() ||
    sdt.value.trim() ||
    thoiGian.value.trim() ||
    ghiChu.value.trim()
  )
})

async function submitOrderToWebCore({ silentToast = false } = {}) {
  if (isOrderLocked.value) {
    if (!silentToast) triggerToast(t('group.lockedHint'), 'warn')
    return false
  }
  if (isGroupGuest.value) {
    await toggleGuestDone(true)
    return true
  }
  if (cartItems.value.length === 0) {
    showEmptyCartModal.value = true
    return false
  }

  const hasContact =
    tenKhach.value.trim() || sdt.value.trim() || diaChi.value.trim() || memberName.value.trim()
  if (!hasContact) {
    showFullCartModal.value = true
    triggerToast(t('cart.missingContactAlert'), 'warn', 3500)
    nextTick(() => {
      const firstInput = fullModalFormRef.value?.querySelector?.('input')
      firstInput?.focus?.()
    })
    return false
  }

  if (submittingOrder.value) return false
  submittingOrder.value = true

  try {
    const recipientName =
      tenKhach.value.trim() || memberName.value.trim() || t('group.guestDefault')
    if (!tenKhach.value.trim()) tenKhach.value = recipientName
    if (!thoiGian.value.trim()) thoiGian.value = format24hDateTimeObj(new Date())
    const nextSubmittedSig = currentOrderSignature.value

    const payloadItems = cartItems.value.map((i) => ({
      lineId: i.lineId,
      Ma_hang: i.Ma_hang,
      Ten_hang: i.Ten_hang,
      Gia_ban: i.unitPrice,
      Don_vi_tien_te: i.Don_vi_tien_te,
      Main_img: i.Main_img,
      So_luong: i.qty,
      Ghi_chu: i.note || '',
      Nguoi_dat: i.isAdminAdded
        ? i.rawAuthor || 'Shop'
        : i.rawAuthor || memberName.value.trim() || recipientName,
      Nguoi_dat_id: i.memberId || memberId,
      Added_by_role: i.isAdminAdded
        ? 'admin'
        : (i.memberId || memberId) === memberId
          ? 'host'
          : 'guest',
      Added_at: i.addedTime || Date.now(),
    }))

    const res = await submitCustomerOrder({
      orderId: activeOrderId.value || undefined,
      hostId: memberId,
      hostName: memberName.value.trim() || recipientName,
      meta: {
        Ten_khach_hang: recipientName,
        So_dien_thoai: sdt.value.trim(),
        Dia_chi: diaChi.value.trim(),
        Thoi_gian_nhan_hang: thoiGian.value.trim(),
        Hinh_thuc_thanh_toan: hinhThucTT.value || 'TIEN_MAT',
        Ghi_chu: buildSubmittedNoteWithPromo(ghiChu.value, earnedPromoViSummary.value),
        Khuyen_mai_dat_duoc: earnedPromoViSummary.value,
        Submitted_sig: nextSubmittedSig,
        Don_vi_tien_te: cartCurrency.value,
      },
      items: payloadItems,
    })

    if (res?.locked) {
      triggerToast(t('group.lockedHint'), 'warn')
      return false
    }

    if (res?.success && res.orderId) {
      lastSubmittedSig.value = nextSubmittedSig
      saveCustomerFormLocal()
      const prevLive = liveOrderData.value || {}
      const nextItemsMap = { ...(prevLive.itemsMap || {}) }
      for (const pit of payloadItems) {
        if (pit.lineId) nextItemsMap[pit.lineId] = pit
      }
      liveOrderData.value = {
        ...prevLive,
        meta: {
          ...(prevLive.meta || {}),
          Ma_hoa_don: res.orderId,
          Trang_thai: 'Chờ duyệt',
          Ten_khach_hang: recipientName,
          So_dien_thoai: sdt.value.trim(),
          Dia_chi: diaChi.value.trim(),
          Thoi_gian_nhan_hang: thoiGian.value.trim(),
          Hinh_thuc_thanh_toan: hinhThucTT.value || 'TIEN_MAT',
          Ghi_chu: ghiChu.value,
          Submitted_sig: nextSubmittedSig,
          Submitted_at: Date.now(),
          Updated_at: Date.now(),
          Host_id: prevLive.meta?.Host_id || memberId,
          Host_name: prevLive.meta?.Host_name || memberName.value.trim() || recipientName,
        },
        itemsMap: nextItemsMap,
        itemsList: payloadItems,
        membersList: prevLive.membersList || [],
      }
      localCartLines.value = {}
      try {
        localStorage.removeItem(SA_LOCAL_CART_KEY)
      } catch {}
      connectLiveOrder(res.orderId, { fromUrl: false, syncUrl: true })
      if (!silentToast) {
        triggerToast(t('group.submittedToast'), 'success', 3500)
      }
      return true
    } else {
      triggerToast(res?.message || 'Không thể gửi đơn, vui lòng thử lại', 'warn')
      return false
    }
  } catch (err) {
    console.error('Submit customer order failed:', err)
    triggerToast('Lỗi kết nối mạng, vui lòng thử lại!', 'warn')
    return false
  } finally {
    submittingOrder.value = false
  }
}

function openMobileProgressAfterSubmit({ toast = true, keepExport = false } = {}) {
  showFullCartModal.value = false
  showCart.value = false
  if (!keepExport) {
    showExportModal.value = false
  }
  showCategoryModal.value = false
  showContactModal.value = false
  activeMobilePanel.value = 'progress'
  showProgressModal.value = true
  if (toast) {
    triggerToast(t('group.submittedToast'), 'success', 2600)
  }
}

function closeProgressMobile() {
  showProgressModal.value = false
  if (activeMobilePanel.value === 'progress') {
    activeMobilePanel.value = null
  }
}

function openCheckoutFromProgress() {
  showProgressModal.value = false
  if (activeMobilePanel.value === 'progress') {
    activeMobilePanel.value = null
  }
  showFullCartModal.value = true
}

async function onFinish(arg) {
  const skipUnfinishedCheck = Boolean(
    arg && typeof arg === 'object' && arg.skipUnfinishedCheck === true,
  )
  if (
    !skipUnfinishedCheck &&
    isGroupHost.value &&
    !isOrderLocked.value &&
    unfinishedGuestMembers.value.length > 0 &&
    cartItems.value.length > 0
  ) {
    unfinishedActionTarget.value = 'finish'
    showUnfinishedGuestsModal.value = true
    nudgeUnfinishedGuests()
    return
  }
  if (isOrderLocked.value) {
    if (isMobile.value) {
      openMobileProgressAfterSubmit({ toast: false, keepExport: true })
    }
    showExportModal.value = true
    return
  }
  if (liveStatus.value === 'Chờ duyệt' && !hasOrderChangesAfterSubmit.value) {
    if (cartItems.value.length === 0) {
      showEmptyCartModal.value = true
      return
    }
    if (isMobile.value) {
      openMobileProgressAfterSubmit({ toast: false, keepExport: true })
    }
    showExportModal.value = true
    return
  }
  if (isGroupGuest.value) {
    await submitOrderToWebCore({ silentToast: true })
    return
  }
  if (cartItems.value.length === 0) {
    showEmptyCartModal.value = true
    return
  }
  const hasContact =
    tenKhach.value.trim() || sdt.value.trim() || diaChi.value.trim() || memberName.value.trim()
  if (!hasContact) {
    showFullCartModal.value = true
    triggerToast(t('cart.missingContactAlert'), 'warn', 3500)
    nextTick(() => {
      const firstInput = fullModalFormRef.value?.querySelector?.('input')
      firstInput?.focus?.()
    })
    return
  }

  if (!tenKhach.value.trim()) {
    tenKhach.value = memberName.value.trim() || t('group.guestDefault')
  }
  if (!thoiGian.value.trim()) {
    thoiGian.value = format24hDateTimeObj(new Date())
  }

  // Cập nhật optimistic trạng thái tiến trình lên 'Chờ duyệt' ngay trong modal trước khi đợi Firebase
  const prevLiveBeforeSubmit = liveOrderData.value
  const shouldOptimisticPromote = !liveStatus.value || liveStatus.value === 'Nháp'
  if (shouldOptimisticPromote) {
    const baseLive = prevLiveBeforeSubmit || {
      itemsMap: {},
      itemsList: cartItems.value.map((i) => ({
        lineId: i.lineId,
        Ma_hang: i.Ma_hang,
        Ten_hang: i.Ten_hang,
        Gia_ban: i.unitPrice,
        Don_vi_tien_te: i.Don_vi_tien_te,
        Main_img: i.Main_img,
        So_luong: i.qty,
        Ghi_chu: i.note || '',
        Nguoi_dat: i.rawAuthor || memberName.value.trim() || tenKhach.value.trim(),
        Nguoi_dat_id: i.memberId || memberId,
        Added_by_role: (i.memberId || memberId) === memberId ? 'host' : 'guest',
      })),
      membersList: [],
    }
    liveOrderData.value = {
      ...baseLive,
      meta: {
        ...(baseLive.meta || {}),
        Trang_thai: 'Chờ duyệt',
        Ten_khach_hang: tenKhach.value.trim(),
        So_dien_thoai: sdt.value.trim(),
        Dia_chi: diaChi.value.trim(),
        Thoi_gian_nhan_hang: thoiGian.value.trim(),
        Hinh_thuc_thanh_toan: hinhThucTT.value || 'TIEN_MAT',
        Ghi_chu: ghiChu.value,
        Host_id: baseLive.meta?.Host_id || memberId,
      },
    }
  }

  // Mở modal gửi đơn MXH ngay lập tức, đồng thời gửi ngầm đơn về web ở background
  if (isMobile.value) {
    openMobileProgressAfterSubmit({ toast: false, keepExport: true })
  }
  showExportModal.value = true
  void submitOrderToWebCore({ silentToast: true }).then((ok) => {
    if (!ok && shouldOptimisticPromote && liveOrderData.value?.meta?.Trang_thai === 'Chờ duyệt') {
      liveOrderData.value = prevLiveBeforeSubmit
    }
  })
}

function onMobileSendTab() {
  if (!isMobile.value) return
  const hasSubmittedState = Boolean(liveStatus.value && liveStatus.value !== 'Nháp')
  if (isCartVisuallyEmpty.value && !hasSubmittedState) {
    showEmptyCartModal.value = true
    return
  }
  if (isOrderLocked.value) {
    openMobileProgressAfterSubmit({ toast: false })
    return
  }
  if (isGroupGuest.value) {
    if (activeMobilePanel.value !== 'cart') {
      openMobilePanel('cart')
    }
    if (!isMyGuestSelectionDone.value) {
      toggleGuestDone(true)
    }
    return
  }
  showProgressModal.value = false
  showCart.value = false
  activeMobilePanel.value = null
  showFullCartModal.value = true
  const hasContact =
    tenKhach.value.trim() || sdt.value.trim() || diaChi.value.trim() || memberName.value.trim()
  if (!hasContact) {
    triggerToast(t('cart.missingContactAlert'), 'warn', 3200)
    nextTick(() => {
      const firstInput = fullModalFormRef.value?.querySelector?.('input')
      firstInput?.focus?.()
    })
  }
}
function openMobilePanel(name) {
  if (!isMobile.value) return

  if (name === 'cart' && isOrderLocked.value) {
    name = 'progress'
  }

  if (name === 'export' && cartItems.value.length === 0) {
    showEmptyCartModal.value = true
    return
  }

  // nếu bấm lại chính nó → đóng
  activeMobilePanel.value =
    activeMobilePanel.value === name ? null : name

  // đồng bộ các state cũ
  showCategoryModal.value = activeMobilePanel.value === 'category'
  showContactModal.value  = activeMobilePanel.value === 'contact'
  showCart.value          = activeMobilePanel.value === 'cart'
  showProgressModal.value = activeMobilePanel.value === 'progress'
  showExportModal.value   = activeMobilePanel.value === 'export'
}

function closeCart() {
  showCart.value = false
  if (isMobile.value) {
    activeMobilePanel.value = null
  }
}

function scrollCategories(direction = 1) {
  const el = catScrollRef.value
  if (!el) return
  const step = Math.max(240, Math.floor(el.clientWidth * 0.65))
  el.scrollBy({
    left: direction * step,
    behavior: 'smooth'
  })
}

function selectCategory(c) {
  currentCategory.value = c
  showAllCatsDrawer.value = false
  resetVisibleMenu()

  if (c === allCategoryLabel.value) {
    keyword.value = ''
    searchInput.value = ''
    priceSort.value = 'all'
  }

  // mobile thì đóng modal danh mục
  if (isMobile.value) {
    showCategoryModal.value = false
    if (activeMobilePanel.value === 'category') {
      activeMobilePanel.value = null
    }
  }

  // đợi DOM update rồi scroll & căn pill đang chọn vào vùng nhìn thấy
  nextTick(() => {
    const activePill = catScrollRef.value?.querySelector('.sct-cat-pill.active')
    if (activePill && typeof activePill.scrollIntoView === 'function') {
      activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
    scrollToTop()
  })
}

function onAllFilter() {
  keyword.value = ''
  searchInput.value = ''
  priceSort.value = 'all'
  resetToAllCategory()
  resetVisibleMenu()
  scrollToTop()
}
const bumpCart = ref(false)

watch(
  () =>
    cartItems.value.reduce(
      (sum, i) => sum + i.qty,
      0
    ),
  (newVal, oldVal) => {
    if (newVal > oldVal) {
      bumpCart.value = true
      setTimeout(() => {
        bumpCart.value = false
      }, 300)
    }
  }
)
function closeCartMobile() {
  if (isMobile.value) {
    showCart.value = false
  }
}


async function reloadData() {
  loadingMain.value = true

  const cached = getCache(UNIFIED_MENU_CACHE_KEY)
  if (cached) {
    applyData(cached)
    loadingMain.value = false
  }

  try {
    const json = await getStorefrontSheets()
    thongTinChuyenKhoan.value = json.data.thong_tin_chuyen_khoan || []

    const freshData = {
      hang_hoa: json.data.hang_hoa || [],
      banner: json.data.banner || [],
      thong_bao: json.data.thong_bao || [],
      logo: json.data.logo || [],
      shop_contact: json.data.shop_contact || [],
      khuyenmai_info: json.data.khuyenmai_info || [],
      time: json.data.time || [],
      thong_tin_chuyen_khoan: json.data.thong_tin_chuyen_khoan || [],
    }

    setCache(UNIFIED_MENU_CACHE_KEY, freshData)
    applyData(freshData)
    loadingMain.value = false
  } catch (e) {
    if (!cached) loadingMain.value = false
  }
}

watch(
  () => route.params.lang,
  (lang) => {
    if (!lang) return

    if (locale.value !== lang) {
      locale.value = lang
    }

    resetVisibleMenu()
    keyword.value = ''
    searchInput.value = ''
    resetToAllCategory()

    if (selectedItem.value?.Ma_hang) {
      const updated = menu.value.find((m) => m.Ma_hang === selectedItem.value.Ma_hang)
      if (updated) selectedItem.value = updated
    }

    if (!rawMenu.value.length) {
      reloadData()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopBannerAuto()
  stopCardImageAuto()
  if (lazyLoadObserver) {
    lazyLoadObserver.disconnect()
    lazyLoadObserver = null
  }
  if (unsubLiveOrder) {
    unsubLiveOrder()
    unsubLiveOrder = null
  }
  if (unsubHangHoaLive) {
    unsubHangHoaLive()
    unsubHangHoaLive = null
  }
  if (unsubKhuyenMaiLive) {
    unsubKhuyenMaiLive()
    unsubKhuyenMaiLive = null
  }
  if (metaSyncTimer) clearTimeout(metaSyncTimer)
  if (toastTimer) clearTimeout(toastTimer)
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('scroll', onWindowScroll)
  document.removeEventListener('click', onDocumentClick)
  if (mainRef.value) {
    mainRef.value.removeEventListener('scroll', updateScrollTopVisibility)
  }
})
function addFromDetailSidebar() {
  if (!selectedItem.value) return
  if (isOrderLocked.value && !isOrderTerminal.value) {
    openLockedOrderContactPrompt()
    return
  }

  // 1⃣ add vào giỏ (dùng lại logic cũ)
  addToCart(selectedItem.value)

  // 2⃣ kích hoạt animation đóng
  closingDetailSidebar.value = true

  // 3⃣ đợi animation xong → đóng sidebar
  setTimeout(() => {
    showDetailSidebar.value = false
    closingDetailSidebar.value = false
    selectedItem.value = null
  }, 260) // khớp với CSS
}
function goHomeMobile() {
  // reset filter + state về ban đầu
  activeMobilePanel.value = 'home'
  showCategoryModal.value = false
  showContactModal.value = false
  showCart.value = false
  showProgressModal.value = false
  showExportModal.value = false

  keyword.value = ''
  searchInput.value = ''
  priceSort.value = 'all'
  resetToAllCategory()
  resetVisibleMenu()

  // scroll lên danh sách sản phẩm (dùng hàm cũ)
  nextTick(() => {
    scrollToTop()
  })
}
function openImageModal(src) {
  previewImage.value = src
  showImageModal.value = true
}

function closeImageModal() {
  showImageModal.value = false
  previewImage.value = ''
}
const times = ref([])



const shopTime = computed(() => {
  return times.value?.[0]?.thoi_gian_hoat_dong_shop || ''
})

const showEditQtyModal = ref(false)
const editingItem = ref(null)
const editQty = ref(1)
const editNote = ref('')
const editAuthor = ref('')

function openEditQty(item) {
  if (isOrderLocked.value && !isOrderTerminal.value) {
    openLockedOrderContactPrompt()
    return
  }
  if (isOrderLocked.value) {
    triggerToast(t('group.lockedHint'), 'warn')
    return
  }
  editingItem.value = item
  editQty.value = item.qty
  editNote.value = item.note || ''
  editAuthor.value = item.isAdminAdded
    ? ''
    : item.rawAuthor || memberName.value.trim() || tenKhach.value.trim() || ''
  showEditQtyModal.value = true
}

async function saveEditQty() {
  if (!editingItem.value) return
  if (isOrderLocked.value) {
    closeEditQtyModal()
    return
  }

  const target = editingItem.value
  const nextQty = Math.max(1, Number(editQty.value || 1))
  const nextNote = String(editNote.value || '').trim()
  const nextAuthor = target.isAdminAdded
    ? target.rawAuthor || 'Shop'
    : String(editAuthor.value || '').trim() ||
      memberName.value.trim() ||
      tenKhach.value.trim() ||
      t('group.guestDefault')

  if (!target.isAdminAdded && editAuthor.value.trim() && target.memberId === memberId) {
    memberName.value = editAuthor.value.trim()
    try {
      localStorage.setItem(SA_MEMBER_NAME_KEY, memberName.value)
    } catch {}
  }

  showEditQtyModal.value = false
  editingItem.value = null

  if (activeOrderId.value) {
    const res = await upsertLiveOrderItem({
      orderId: activeOrderId.value,
      lineId: target.lineId,
      item: {
        Ma_hang: target.Ma_hang,
        Ten_hang: target.Ten_hang,
        So_luong: nextQty,
        Ghi_chu: nextNote,
        Nguoi_dat: nextAuthor,
        Nguoi_dat_id: target.memberId || memberId,
      },
      memberId: target.memberId || memberId,
      memberName: nextAuthor,
      role: 'guest',
    })
    if (res?.kicked) handleKickedFromOrder()
    else if (res?.closed) resetClosedOrStaleOrder(true)
    else if (res?.locked) triggerToast(t('group.lockedHint'), 'warn')
  } else if (target.lineId && localCartLines.value[target.lineId]) {
    localCartLines.value = {
      ...localCartLines.value,
      [target.lineId]: {
        ...localCartLines.value[target.lineId],
        qty: nextQty,
        note: nextNote,
        memberName: nextAuthor,
      },
    }
    saveLocalCartLines()
  }
}
function closeEditQtyModal() {
  showEditQtyModal.value = false
  editingItem.value = null
}

async function changeCartItemQtyDirect(item, delta) {
  if (!item || !canModifyCartItem(item)) return
  const nextQty = Number(item.qty || 1) + Number(delta || 0)
  if (nextQty <= 0) {
    await removeItem(item)
    return
  }

  const nextAuthor = item.isAdminAdded
    ? item.rawAuthor || 'Shop'
    : item.rawAuthor ||
      memberName.value.trim() ||
      tenKhach.value.trim() ||
      t('group.guestDefault')

  if (activeOrderId.value) {
    const res = await upsertLiveOrderItem({
      orderId: activeOrderId.value,
      lineId: item.lineId,
      item: {
        Ma_hang: item.Ma_hang,
        Ten_hang: item.Ten_hang,
        Gia_ban: item.unitPrice,
        Don_vi_tien_te: item.Don_vi_tien_te,
        Main_img: item.Main_img,
        Ghi_chu: item.note || '',
        Nguoi_dat: nextAuthor,
        Nguoi_dat_id: item.memberId || memberId,
      },
      memberId: item.memberId || memberId,
      memberName: nextAuthor,
      role: 'guest',
      deltaQty: Number(delta || 0),
    })
    if (res?.kicked) handleKickedFromOrder()
    else if (res?.closed) resetClosedOrStaleOrder(true)
    else if (res?.locked) triggerToast(t('group.lockedHint'), 'warn')
  } else if (item.lineId && localCartLines.value[item.lineId]) {
    localCartLines.value = {
      ...localCartLines.value,
      [item.lineId]: {
        ...localCartLines.value[item.lineId],
        qty: nextQty,
      },
    }
    saveLocalCartLines()
  }
}
const soTienChuyenKhoan = (c) => {
  const tong = Number(totalAmount.value || 0)

  const tiGia = Number(c.Ti_gia || 1)
  const donViCK = c.Don_vi_tien_te || ''

  const sauQuyDoi = tong * tiGia

  return `${formatPrice(tong, cartCurrency.value)} ~ ${formatPrice(sauQuyDoi, donViCK)}`
}

const calcOnlyTransferAmount = (c) => {
  const tong = Number(totalAmount.value || 0)
  const tiGia = Number(c.Ti_gia || 1)
  const donViCK = c.Don_vi_tien_te || ''
  const sauQuyDoi = tong * tiGia
  return formatPrice(sauQuyDoi, donViCK)
}

function isDiscount(m) {
  return (
    Number(m.Gia_Giam) > 0 &&
    Number(m.Gia_Giam) < Number(m.Gia_ban)
  )
}

function finalPrice(m) {
  return isDiscount(m)
    ? Number(m.Gia_Giam)
    : Number(m.Gia_ban)
}

function discountPercent(m) {
  if (!isDiscount(m)) return 0

  return Math.round(
    100 - (Number(m.Gia_Giam) / Number(m.Gia_ban)) * 100
  )
}
const hasSale = computed(() =>
  menu.value.some(m => isDiscount(m))
)

</script>

<style scoped>
/* =========================================================
   THEME TOKENS: LIGHT MODE (DEFAULT) & DARK MODE
   ========================================================= */
.sa-storefront,
.sa-storefront.theme-light {
  --sa-header-h: 68px;
  --sa-bg: #f6f8fa;
  --sa-main-bg: #f6f8fa;
  --sa-top-header-bg: linear-gradient(135deg, #059669 0%, #047857 58%, #065f46 100%);
  --sa-header-bg: rgba(255, 255, 255, 0.94);
  --sa-bottom-bar-bg: rgba(255, 255, 255, 0.94);
  --sa-toolbar-bg: rgba(246, 248, 250, 0.94);
  --sa-surface: #ffffff;
  --sa-surface-2: #f1f5f9;
  --sa-surface-soft: #ecfdf5;
  --sa-img-bg: #f8fafc;
  --sa-text: #334155;
  --sa-heading: #0f172a;
  --sa-muted: #64748b;
  --sa-border: #e5e7eb;
  --sa-border-strong: #cbd5e1;
  --sa-border-green: rgba(16, 185, 129, 0.28);
  --sa-accent: #059669;
  --sa-accent-hover: #047857;
  --sa-price: #059669;
  --sa-sale: #e11d48;
  --sa-qty-bg: #f1f5f9;
  --sa-qty-text: #0f172a;
  --sa-card-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 14px rgba(15, 23, 42, 0.035);
  --sa-card-hover-shadow: 0 10px 26px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04);
  --sa-notice-bg: #fff5f5;
  --sa-notice-border: rgba(220, 38, 38, 0.22);
  --sa-notice-text: #dc2626;
  --sa-notice-icon: #dc2626;
  --sa-pill-bg: #ffffff;
  --sa-pill-text: #475569;
  --sa-pill-hover: #f8fafc;
  --sa-input-bg: #ffffff;
  --sa-input-border: #dbe2ea;

  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--sa-bg);
  color: var(--sa-text);
  min-height: 100vh;
}

.sa-storefront span,
.sa-storefront i {
  font-weight: inherit;
}

.sa-storefront strong,
.sa-storefront b {
  font-weight: 700;
}

.sa-storefront.theme-dark {
  --sa-bg: #0b0f17;
  --sa-main-bg: #0b0f17;
  --sa-top-header-bg: linear-gradient(135deg, #065f46 0%, #064e3b 55%, #022c22 100%);
  --sa-header-bg: rgba(15, 21, 33, 0.94);
  --sa-bottom-bar-bg: rgba(19, 26, 38, 0.94);
  --sa-toolbar-bg: rgba(11, 15, 23, 0.94);
  --sa-surface: #131a26;
  --sa-surface-2: #1c2536;
  --sa-surface-soft: rgba(16, 185, 129, 0.14);
  --sa-img-bg: #172030;
  --sa-text: #cbd5e1;
  --sa-heading: #f8fafc;
  --sa-muted: #94a3b8;
  --sa-border: rgba(255, 255, 255, 0.08);
  --sa-border-strong: rgba(255, 255, 255, 0.14);
  --sa-border-green: rgba(52, 211, 153, 0.28);
  --sa-accent: #10b981;
  --sa-accent-hover: #059669;
  --sa-price: #34d399;
  --sa-sale: #fb7185;
  --sa-qty-bg: #1c2536;
  --sa-qty-text: #f8fafc;
  --sa-card-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
  --sa-card-hover-shadow: 0 12px 30px rgba(0, 0, 0, 0.42);
  --sa-notice-bg: rgba(239, 68, 68, 0.12);
  --sa-notice-border: rgba(248, 113, 113, 0.3);
  --sa-notice-text: #f87171;
  --sa-notice-icon: #f87171;
  --sa-pill-bg: #131a26;
  --sa-pill-text: #94a3b8;
  --sa-pill-hover: #1c2536;
  --sa-input-bg: #0f1521;
  --sa-input-border: rgba(255, 255, 255, 0.12);
}

/* =========================================================
   DESKTOP TOP HEADER (1A) — BRAND EMERALD GREEN BAR
   ========================================================= */
.desktop-top-header {
  position: sticky;
  top: 0;
  z-index: 60;
  height: var(--sa-header-h);
  background: var(--sa-top-header-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 18px rgba(4, 120, 87, 0.18);
}

.dth-inner {
  height: 100%;
  padding: 0 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(200px, 17vw, 300px) minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.dth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex-shrink: 0;
  justify-self: start;
  user-select: none;
}

.dth-logo {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  object-fit: contain;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
}

.dth-brand-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dth-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.15px;
  line-height: 1.2;
}

.dth-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.2;
}

.dth-time .dot-online {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6ee7b7;
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  animation: none !important;
  box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.28) !important;
}

.dth-time .dot-online::before,
.dth-time .dot-online::after {
  display: none !important;
}

/* HEADER INTEGRATED SEARCH */
.dth-search-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
}

.dth-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 6px 0 14px;
  border-radius: 11px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.18s ease;
}

.sa-storefront.theme-dark .dth-search-box {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(255, 255, 255, 0.18);
}

.dth-search-box:focus-within {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.28), 0 4px 14px rgba(0, 0, 0, 0.12);
}

.dth-search-ico {
  font-size: 16px;
  color: #64748b;
  flex-shrink: 0;
}

.sa-storefront.theme-dark .dth-search-ico {
  color: #94a3b8;
}

.dth-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
  font-size: 13.5px;
  font-weight: 500;
}

.sa-storefront.theme-dark .dth-search-input {
  color: #f8fafc;
}

.dth-search-input::placeholder {
  color: #64748b;
  font-weight: 400;
}

.sa-storefront.theme-dark .dth-search-input::placeholder {
  color: #94a3b8;
}

.dth-search-clear {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.dth-search-clear:hover {
  background: rgba(225, 29, 72, 0.1);
  color: #e11d48;
}

.dth-search-submit {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: #059669;
  color: #ffffff;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.dth-search-submit:hover {
  background: #047857;
}

.search-suggest.dth-suggest {
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  transform: none;
  width: 100%;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);
  z-index: 90;
}

/* HEADER RIGHT ZONE: COMPACT CHECK SCAM + ACTIONS */
.dth-right-zone {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
}

.dth-scam-bar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-right: auto;
  animation: dthScamFadeIn 0.2s ease-out;
}

@keyframes dthScamFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dth-scam-btn {
  height: 38px;
  padding: 0 6px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  border: 1px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;
}

.dth-scam-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dth-scam-ico {
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
}

.dth-scam-label {
  font-size: 10px;
  font-weight: 700;
  line-height: 1.15;
  text-align: left;
  white-space: normal;
  max-width: 54px;
}

.dth-scam-btn.is-shops .dth-scam-label {
  max-width: 36px;
}

.dth-scam-btn.is-verify {
  background: rgba(255, 255, 255, 0.96);
  color: #065f46;
  border-color: rgba(255, 255, 255, 0.92);
}

.dth-scam-btn.is-verify .dth-scam-ico {
  color: #059669;
}

.dth-scam-btn.is-shops {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.dth-scam-btn.is-shops .dth-scam-ico {
  color: #d97706;
}

.dth-scam-btn.is-alerts {
  background: #fff1f2;
  color: #9f1239;
  border-color: #fecdd3;
}

.dth-scam-btn.is-alerts .dth-scam-ico {
  color: #e11d48;
}

.sa-storefront.theme-dark .dth-scam-btn.is-verify {
  background: rgba(6, 78, 59, 0.92);
  color: #ecfdf5;
  border-color: rgba(52, 211, 153, 0.45);
}

.sa-storefront.theme-dark .dth-scam-btn.is-verify .dth-scam-ico {
  color: #34d399;
}

.sa-storefront.theme-dark .dth-scam-btn.is-shops {
  background: rgba(120, 53, 15, 0.9);
  color: #fef3c7;
  border-color: rgba(251, 191, 36, 0.45);
}

.sa-storefront.theme-dark .dth-scam-btn.is-shops .dth-scam-ico {
  color: #fbbf24;
}

.sa-storefront.theme-dark .dth-scam-btn.is-alerts {
  background: rgba(136, 19, 55, 0.92);
  color: #ffe4e6;
  border-color: rgba(251, 113, 133, 0.48);
}

.sa-storefront.theme-dark .dth-scam-btn.is-alerts .dth-scam-ico {
  color: #fb7185;
}

@media (min-width: 769px) and (max-width: 1460px) {
  .dth-inner.has-header-scam .dth-ctrl-btn span,
  .dth-inner.has-header-scam .dth-ctrl-btn .dth-caret {
    display: none;
  }

  .dth-inner.has-header-scam .dth-ctrl-btn {
    padding: 0 9px;
    height: 36px;
  }

  .dth-inner.has-header-scam .dth-ctrl-btn.icon-only {
    width: 36px;
    padding: 0;
  }

  .dth-inner.has-header-scam .dth-cart-pill {
    height: 36px;
    padding: 0 10px;
    gap: 6px;
  }
}

@media (min-width: 769px) and (max-width: 1220px) {
  .dth-inner {
    grid-template-columns: minmax(0, 1fr) clamp(185px, 19vw, 240px) minmax(0, 1fr);
    padding: 0 14px;
    gap: 10px;
  }

  .dth-scam-btn {
    height: 36px;
    padding: 0 6px;
    gap: 4px;
  }

  .dth-scam-label {
    font-size: 10px;
    max-width: 54px;
  }

  .dth-ctrl-btn span {
    display: none;
  }
}

/* HEADER RIGHT CONTROLS */
.dth-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dth-contact-wrap {
  position: relative;
}

.dth-ctrl-btn {
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.dth-ctrl-btn:hover,
.dth-ctrl-btn.active {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.dth-ctrl-btn.icon-only {
  width: 38px;
  padding: 0;
  font-size: 17px;
}

.dth-ctrl-btn.theme-toggle-btn i {
  color: inherit;
}

.sa-storefront.theme-dark .dth-ctrl-btn.theme-toggle-btn {
  color: #fde68a;
}

.dth-ctrl-btn.lang-btn {
  width: 40px;
  padding: 0;
}

.dth-flag-img {
  width: 22px;
  height: 16px;
  border-radius: 3px;
  object-fit: cover;
  display: block;
}

.dth-caret {
  font-size: 15px;
  opacity: 0.8;
}

/* DESKTOP SUPPORT CONTACT POPOVER */
.dth-contact-popover {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 284px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: 14px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  z-index: 95;
}

.dcp-header {
  padding: 11px 14px;
  background: var(--sa-surface-2);
  border-bottom: 1px solid var(--sa-border);
  color: var(--sa-heading);
  font-size: 12.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 7px;
}

.dcp-header i {
  color: var(--sa-accent);
  font-size: 15px;
}

.dcp-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.dcp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  text-decoration: none;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.16s ease;
}

.dcp-item:hover {
  background: var(--sa-surface-2);
  border-color: var(--sa-border);
}

.dcp-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  object-fit: cover;
  background: #ffffff;
  border: 1px solid var(--sa-border);
  flex-shrink: 0;
}

.dcp-info {
  flex: 1;
  min-width: 0;
}

.dcp-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--sa-heading);
  line-height: 1.3;
}

.dcp-desc {
  font-size: 11.5px;
  color: var(--sa-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dcp-ext {
  font-size: 14px;
  color: var(--sa-muted);
}

/* HEADER CART PILL (CRISP WHITE ON EMERALD HEADER) */
.dth-cart-pill {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: #ffffff;
  color: #065f46;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.18s ease;
  white-space: nowrap;
}

.dth-cart-pill i {
  color: #059669;
  font-size: 16px;
}

.dth-cart-pill.active,
.dth-cart-pill:hover {
  background: #ecfdf5;
  border-color: #ffffff;
  color: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
}

.dth-cart-pill.bump {
  animation: cart-bump 0.3s ease;
}

.dcp-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #059669;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dcp-amount {
  font-weight: 700;
}

/* MOBILE THEME TOGGLE BUTTON */
.mh-theme-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.mh-theme-btn.no-time {
  margin-left: auto;
}

/* =========================================================
   DESKTOP STICKY HORIZONTAL CATEGORY TOOLBAR (TIER 1)
   ========================================================= */
.sticky-cat-toolbar {
  position: sticky;
  top: 0;
  z-index: 35;
  width: 100%;
  background: var(--sa-toolbar-bg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--sa-border);
}

.sct-inner {
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
  padding: 10px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
}

.sct-cat-bar {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sct-scroll-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-heading);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.sct-scroll-btn:hover {
  border-color: var(--sa-accent);
  color: var(--sa-accent);
  background: var(--sa-surface-soft);
}

.sct-cat-scroll {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px 2px;
  scroll-behavior: smooth;
}

.sct-cat-scroll::-webkit-scrollbar {
  display: none;
}

.sct-cat-pill {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--sa-border);
  background: var(--sa-pill-bg);
  color: var(--sa-pill-text);
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.sct-cat-pill:hover {
  border-color: var(--sa-border-strong);
  background: var(--sa-pill-hover);
  color: var(--sa-heading);
}

.sct-cat-pill.active {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.22);
}

.sct-cat-pill.sale {
  background: rgba(225, 29, 72, 0.08);
  border-color: rgba(225, 29, 72, 0.24);
  color: var(--sa-sale);
}

.sct-cat-pill.sale:hover,
.sct-cat-pill.sale.active {
  background: var(--sa-sale);
  border-color: var(--sa-sale);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.24);
}

/* ALL CATEGORIES DROPDOWN DRAWER */
.sct-all-cats-wrap {
  position: relative;
  flex-shrink: 0;
}

.sct-all-cats-btn {
  height: 34px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.sct-all-cats-btn:hover,
.sct-all-cats-btn.active {
  border-color: var(--sa-accent);
  color: var(--sa-accent);
  background: var(--sa-surface-soft);
}

.sct-all-cats-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(680px, calc(100vw - 64px));
  max-height: 62vh;
  overflow-y: auto;
  padding: 14px;
  border-radius: 14px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border-strong);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.22);
  z-index: 60;
}

.sct-all-cats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--sa-border);
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-heading);
}

.sct-alpha-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  color: var(--sa-accent);
  border: 1px solid var(--sa-border-green);
}

.sct-all-cats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* =========================================================
   DESKTOP FILTER & SORT BAR (TIER 2)
   ========================================================= */
.menu-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
}

.mfb-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.mfb-active-cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--sa-heading);
}

.mfb-active-cat i {
  color: var(--sa-accent);
  font-size: 15px;
}

.mfb-count-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  border: 1px solid var(--sa-border);
}

.mfb-reset-btn {
  height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid var(--sa-border-strong);
  background: transparent;
  color: var(--sa-muted);
  font-size: 11.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mfb-reset-btn:hover {
  border-color: var(--sa-sale);
  color: var(--sa-sale);
  background: rgba(225, 29, 72, 0.08);
}

/* SEGMENTED PRICE SORT CONTROL */
.sct-sort-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 3px;
  border-radius: 10px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
}

.sct-sort-btn {
  height: 28px;
  padding: 0 11px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--sa-muted);
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.sct-sort-btn:hover {
  color: var(--sa-heading);
}

.sct-sort-btn.active {
  background: var(--sa-surface);
  color: var(--sa-heading);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

/* =========================================================
   2-COLUMN STOREFRONT LAYOUT (DESKTOP > 768px)
   ========================================================= */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(336px, 24.5vw, 368px);
  min-height: calc(100vh - var(--sa-header-h));
  background: var(--sa-bg);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  transition: grid-template-columns 0.24s ease;
}

.layout.hide-right,
.layout.hide-left.hide-right {
  grid-template-columns: minmax(0, 1fr);
}

.menu {
  scroll-margin-top: 68px;
}

/* SIDEBAR LEFT */
.sidebar-left {
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  
  background: linear-gradient(
    180deg,
    #22c55e,
    #16a34a,
    #038a47
  );

  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  z-index: 20;

  box-shadow: 
    6px 0 24px rgba(0, 0, 0, 0.15);
}




.sidebar-left .sidebar-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
}


.sidebar-left .toggle-btn {
  position: absolute;
  top: 12px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  z-index: 10;
}

.logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;

  padding: 14px 10px 18px;
  margin: 8px 6px 18px;

  /* Linear gradient xanh teal + trắng */
  background: linear-gradient(
    150deg,
    #01041b 0%,
    #004581 100%
  );

  border-radius: 16px;

  /* Viền phát sáng cyan */
  border: 2px solid #004166;

  /* Glow effect */
  box-shadow:
    0 0 15px rgba(26, 154, 154, 0.4),
    0 8px 24px rgba(0, 0, 0, 0.4);
}




.logo-box img {
  width: 60px;
  height: 60px;

  border-radius: 25px;
  border: 1px solid #39FF14;



  box-shadow:
    0 8px 20px rgba(0,0,0,0.25),
    inset 0 1px 0 rgba(255,255,255,0.8);
}


.logo-name {
  max-width: 100%;
  text-align: center;
  color: #39FF14;                 /* xanh neon */
  
  font-size: 17px;
  font-weight: bold;
  
 
  
  line-height: 1.25;

  display: -webkit-box;
  -webkit-line-clamp: 2;     /*  tối đa 2 dòng */
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.logo-box:hover {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.7),
    0 14px 36px rgba(0,0,0,0.35);
  transform: translateY(-1px);
  transition: all 0.25s ease;
}

@media (min-width: 769px) {
  .logo-box {
    isolation: isolate;
  }

  .logo-box::after {
    content: '';
    position: absolute;
    inset: -45%;
    background: linear-gradient(
      135deg,
      transparent 42%,
      rgba(255, 255, 255, 0.65) 50%,
      rgba(255, 255, 255, 0.15) 58%,
      transparent 66%
    );
    transform: translate3d(-140%, -140%, 0);
    animation: logoShimmer 4s ease-in-out infinite;
    pointer-events: none;
    mix-blend-mode: screen;
  }
}

@keyframes logoShimmer {
  0% { transform: translate3d(-140%, -140%, 0); }
  55% { transform: translate3d(120%, 120%, 0); }
  100% { transform: translate3d(160%, 160%, 0); }
}

/* ===== SHOP CONTACT ===== */
.shop-contact {
  margin-top: auto;
  padding: 8px 0;
}

.contact-title {
  display: block;
  width: 100%;
  padding: 5px 14px;
  margin-bottom: 10px;
  border-radius: 12px;
  text-align: left;
  text-transform:uppercase ;
  /* Background xanh navy giống logo */
  background: linear-gradient(
    135deg,
    #001106 0%,
    #015539 100%
  );
  
  /* Chữ xanh neon */
  color: #ffffff !important;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.5px;
  
  border: 1px solid rgba(29, 194, 0, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  text-decoration: none;
  
  /* Background xanh giống box logo */
  background: linear-gradient(
    135deg,
    #0a1a30 0%,
    #0a4d80 100%
  );
  
  border: 1px solid rgba(57, 255, 20, 0.3);
  transition: all 0.2s ease;
}

.contact-item:hover {
  transform: translateX(4px);
  border-color: rgba(57, 255, 20, 0.6);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.contact-icon-wrap {
  flex-shrink: 0;
}

.contact-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
}

.contact-info {
  flex: 1;
}

.contact-name {
  color: #ffffff;
  font-weight: 800;
  font-size: 14px;
}

.contact-desc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-style: italic;
}

.categories .cat {
  padding: 10px 12px;
  margin-bottom: 6px;

  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;

  color: #ffffff;
  cursor: pointer;

  transition: all 0.2s ease;
}
/* hover */
.categories .cat:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* active */
.categories .cat.active {
  background: #ffffff;
  color: #065f46;

  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.15);
}
/* MAIN */
.main {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--sa-header-h));
  overflow-y: auto;
  background: var(--sa-main-bg);

  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  -ms-overflow-style: auto;
  overflow-x: hidden;
  min-width: 0;
  transition: background-color 0.22s ease;
}

.hero-container {
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
  padding: 16px 28px 12px;
  flex-shrink: 0;
  transition: margin-left 0.24s ease, width 0.24s ease;
}

.scam-hub-section {
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
  padding: 2px 28px 14px;
  flex-shrink: 0;
  transition: margin-left 0.24s ease, width 0.24s ease;
}

.scam-hub-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.scam-hub-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  color: #ffffff;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.scam-hub-btn.is-verify {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.28);
}

.scam-hub-btn.is-shops {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  box-shadow: 0 8px 20px rgba(217, 119, 6, 0.28);
}

.scam-hub-btn.is-alerts {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.28);
}

.scam-hub-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.22);
}

.scam-hub-btn:active {
  transform: scale(0.985);
}

.scam-hub-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #ffffff;
  font-size: 22px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.scam-hub-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scam-hub-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #ffffff;
  line-height: 1.25;
}

.scam-hub-sub {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scam-hub-ext {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.menu-container {
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 28px 44px;
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.24s ease, width 0.24s ease;
}

@media (min-width: 769px) {
  .main.dock-expanded .hero-container,
  .main.dock-expanded .scam-hub-section,
  .main.dock-expanded .sct-inner,
  .main.dock-expanded .menu-container {
    width: min(1360px, calc(100% - 218px));
    margin-left: max(218px, calc((100% - 1360px) / 2));
    margin-right: auto;
  }

  .main.dock-collapsed .hero-container,
  .main.dock-collapsed .scam-hub-section,
  .main.dock-collapsed .sct-inner,
  .main.dock-collapsed .menu-container {
    width: min(1360px, calc(100% - 78px));
    margin-left: max(78px, calc((100% - 1360px) / 2));
    margin-right: auto;
  }
}

/* =========================================================
   FLOATING LEFT TRUST & CONTACT DOCK (PA1)
   ========================================================= */
.left-trust-dock {
  position: fixed;
  left: 14px;
  top: 130px;
  width: 200px;
  max-height: calc(100vh - 148px);
  padding: 10px;
  border-radius: 20px;
  background: var(--sa-surface);
  border: 1.5px solid var(--sa-border-green);
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.1),
    0 2px 8px rgba(5, 150, 105, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 46;
  transition:
    width 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.24s ease,
    background-color 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.left-trust-dock.is-collapsed {
  width: 60px;
  padding: 10px 7px;
  align-items: center;
}

.ltd-collapse-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-accent);
  font-size: 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  z-index: 2;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;
}

.ltd-collapse-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  transform: scale(1.08);
}

/* CHECK SCAM 3 SEPARATE BUTTONS GROUP */
.ltd-scam-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--sa-border-strong);
}

.ltd-scam-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 50px;
  padding: 10px 11px;
  border-radius: 14px;
  background: var(--sa-top-header-bg);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #ffffff;
  text-decoration: none;
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.26);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.ltd-scam-btn.is-verify {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.26);
}

.ltd-scam-btn.is-shops {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  box-shadow: 0 6px 16px rgba(217, 119, 6, 0.26);
}

.ltd-scam-btn.is-alerts {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.26);
}

.ltd-scam-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.24);
}

.left-trust-dock.is-collapsed .ltd-scam-btn {
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  gap: 3px;
  padding: 8px 4px;
  border-radius: 14px;
}

.ltd-scam-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.38);
  color: #ffffff;
  font-size: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.left-trust-dock.is-collapsed .ltd-scam-icon {
  width: 30px;
  height: 30px;
  font-size: 16px;
}

.ltd-scam-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ltd-scam-title {
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #ffffff;
  line-height: 1.25;
}

.ltd-scam-sub {
  font-size: 10.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ltd-scam-mini {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: #ffffff;
  line-height: 1;
}

.ltd-scam-ext {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  flex-shrink: 0;
}

/* DOCK CONTACT CHANNELS */
.ltd-contact-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
}

.ltd-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  color: var(--sa-muted);
}

.ltd-section-title i {
  color: var(--sa-accent);
  font-size: 14px;
}

.ltd-divider {
  width: 28px;
  height: 1px;
  margin: 2px auto;
  background: var(--sa-border-strong);
}

.ltd-contact-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.ltd-contact-list::-webkit-scrollbar {
  width: 4px;
}

.ltd-contact-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.25);
  border-radius: 999px;
}

.ltd-contact-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 8px;
  border-radius: 12px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  text-decoration: none;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.ltd-contact-card:hover {
  background: var(--sa-surface-soft);
  border-color: var(--sa-accent);
  transform: translateX(2px);
  box-shadow: 0 4px 10px rgba(5, 150, 105, 0.1);
}

.left-trust-dock.is-collapsed .ltd-contact-card {
  justify-content: center;
  padding: 5px;
  border-radius: 50%;
  width: 42px;
  height: 42px;
  margin: 0 auto;
}

.left-trust-dock.is-collapsed .ltd-contact-card:hover {
  transform: scale(1.06);
}

.ltd-contact-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: #ffffff;
  border: 1px solid var(--sa-border);
  flex-shrink: 0;
}

.ltd-contact-meta {
  flex: 1;
  min-width: 0;
}

.ltd-contact-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sa-heading);
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ltd-contact-info {
  font-size: 11px;
  font-weight: 500;
  color: var(--sa-muted);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* HEADER POPOVER & MOBILE CONTACT MODAL CHECK SCAM ITEMS */
.dcp-scam-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px dashed var(--sa-border-strong);
}

.dcp-scam-item {
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  padding: 10px 12px;
  margin-bottom: 0;
  border-radius: 12px;
}

.dcp-scam-item.is-verify {
  background: rgba(5, 150, 105, 0.1);
  border-color: rgba(5, 150, 105, 0.32);
}

.dcp-scam-item.is-shops {
  background: rgba(217, 119, 6, 0.1);
  border-color: rgba(217, 119, 6, 0.32);
}

.dcp-scam-item.is-alerts {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.32);
}

.dcp-scam-item:hover {
  filter: brightness(0.98);
  transform: translateY(-1px);
}

.dcp-scam-ico {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 19px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dcp-scam-item.is-verify .dcp-scam-ico {
  background: #059669;
}

.dcp-scam-item.is-shops .dcp-scam-ico {
  background: #d97706;
}

.dcp-scam-item.is-alerts .dcp-scam-ico {
  background: #dc2626;
}

.dcp-scam-item .dcp-name {
  font-weight: 800;
  font-size: 13.5px;
  color: var(--sa-accent);
}

.dcp-scam-item.is-shops .dcp-name {
  color: #b45309;
}

.dcp-scam-item.is-alerts .dcp-name {
  color: #dc2626;
}

.sa-storefront.theme-dark .dcp-scam-item.is-shops .dcp-name {
  color: #fbbf24;
}

.sa-storefront.theme-dark .dcp-scam-item.is-alerts .dcp-name {
  color: #f87171;
}

.mobile-checkscam-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px dashed var(--sa-border-strong);
}

.mobile-checkscam-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 5px;
  min-height: 70px;
  padding: 9px 6px;
  margin-bottom: 0;
  border-radius: 12px;
  background: var(--sa-top-header-bg);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  text-decoration: none;
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.22);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.mobile-checkscam-card.is-verify {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.26);
}

.mobile-checkscam-card.is-shops {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  box-shadow: 0 8px 20px rgba(217, 119, 6, 0.26);
}

.mobile-checkscam-card.is-alerts {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.26);
}

.mobile-checkscam-card:active {
  transform: scale(0.98);
}

.mcc-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.36);
  color: #ffffff;
  font-size: 15px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mcc-body {
  width: 100%;
  min-width: 0;
}

.mcc-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1px;
  color: #ffffff;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mcc-sub,
.mcc-ext {
  display: none;
}

.main::after {
  display: none;
}

/* ===== MAIN SCROLLBAR – SLIM & SUBTLE ===== */
.main::-webkit-scrollbar {
  width: 6px;
}

.main::-webkit-scrollbar-track {
  background: transparent;
}

.main::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.28);
  border-radius: 999px;
}

.main::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.48);
}

.main {
  scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
}

.notice-list {
  margin-bottom: 12px;
}

.notice {
  background: transparent;
  border-radius: 0;
  padding: 4px 2px;
  margin-bottom: 6px;
  color: var(--sa-notice-text);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
  border: none;
  box-shadow: none;
}

/* =========================================================
   BANNER SHOWCASE: 3-CARD REVOLVING CAROUSEL + RING THUMBS
   ========================================================= */
.banner,
.banner.banner-showcase {
  position: relative;
  width: 100%;
  height: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
  background: transparent;
  border: none;
  box-shadow: none;
  overflow: visible;
}

.banner-carousel-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.banner-stage {
  position: relative;
  flex: 1;
  min-width: 0;
  width: 100%;
  height: clamp(300px, 29vw, 410px);
  overflow: hidden;
  border-radius: 26px;
}

.banner-slide-card {
  position: absolute;
  top: 6px;
  bottom: 10px;
  left: 50%;
  width: min(58%, 640px);
  border-radius: 26px;
  overflow: hidden;
  background: var(--sa-img-bg);
  border: none;
  transition:
    transform 0.52s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.42s ease,
    filter 0.42s ease,
    box-shadow 0.42s ease;
  will-change: transform, opacity;
  user-select: none;
}

.banner-slide-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 4;
  box-shadow: inset 0 0 0 2.5px var(--sa-border-strong);
  transition: box-shadow 0.32s ease;
}

.banner-slide-card.is-single {
  width: 100%;
  top: 4px;
  bottom: 6px;
  transform: translate3d(-50%, 0, 0) scale(1);
  z-index: 5;
  opacity: 1;
  box-shadow:
    0 0 0 3px rgba(5, 150, 105, 0.16),
    0 12px 28px rgba(15, 23, 42, 0.14);
  cursor: zoom-in;
}

.banner-slide-card.is-single::after {
  box-shadow: inset 0 0 0 3.5px var(--sa-accent);
}

.banner-slide-card.is-center {
  transform: translate3d(-50%, 0, 0) scale(1);
  z-index: 5;
  opacity: 1;
  filter: brightness(1);
  box-shadow:
    0 0 0 3px rgba(5, 150, 105, 0.18),
    0 14px 32px rgba(15, 23, 42, 0.16);
  cursor: zoom-in;
}

.banner-slide-card.is-center::after {
  box-shadow: inset 0 0 0 3.5px var(--sa-accent);
}

.banner-slide-card.is-prev {
  transform: translate3d(calc(-50% - 42%), 0, 0) scale(0.82);
  z-index: 2;
  opacity: 0.84;
  filter: brightness(0.93);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
  cursor: pointer;
}

.banner-slide-card.is-next {
  transform: translate3d(calc(-50% + 42%), 0, 0) scale(0.82);
  z-index: 2;
  opacity: 0.84;
  filter: brightness(0.93);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
  cursor: pointer;
}

.banner-slide-card.is-leaving {
  z-index: 3;
}

.banner-slide-card.is-far-prev {
  transform: translate3d(calc(-50% - 86%), 0, 0) scale(0.7);
  z-index: 1;
  opacity: 0;
  pointer-events: none;
}

.banner-slide-card.is-far-next {
  transform: translate3d(calc(-50% + 86%), 0, 0) scale(0.7);
  z-index: 1;
  opacity: 0;
  pointer-events: none;
}

@media (hover: hover) {
  .banner-slide-card.is-prev:hover {
    transform: translate3d(calc(-50% - 42.5%), 0, 0) scale(0.84);
    opacity: 0.97;
    filter: brightness(1);
  }

  .banner-slide-card.is-next:hover {
    transform: translate3d(calc(-50% + 42.5%), 0, 0) scale(0.84);
    opacity: 0.97;
    filter: brightness(1);
  }

  .banner-slide-card.is-prev:hover::after,
  .banner-slide-card.is-next:hover::after {
    box-shadow: inset 0 0 0 2.5px var(--sa-accent);
  }
}

.banner-backdrop {
  position: absolute;
  inset: -24px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(24px) saturate(1.18) brightness(0.92);
  opacity: 0.72;
  pointer-events: none;
  z-index: 1;
}

.banner .banner-img {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  background: transparent;
}

/* CIRCULAR STORY-RING THUMBNAIL BAR */
.banner-ring-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 8px;
  padding: 4px 10px 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.banner-ring-bar::-webkit-scrollbar {
  display: none;
}

.banner-ring-btn {
  position: relative;
  width: 54px;
  height: 54px;
  padding: 2.5px;
  border-radius: 50%;
  border: 2.5px solid var(--sa-border-strong);
  background: var(--sa-surface);
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.78;
  transform: scale(0.94);
  transition:
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.banner-ring-btn:hover {
  opacity: 1;
  transform: scale(1.04);
  border-color: var(--sa-accent);
}

.banner-ring-btn.active {
  opacity: 1;
  transform: scale(1.1);
  border-color: var(--sa-accent);
  box-shadow:
    0 0 0 3px rgba(5, 150, 105, 0.22),
    0 6px 14px rgba(5, 150, 105, 0.24);
}

.banner-ring-inner {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: var(--sa-img-bg);
}

.banner .banner-ring-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

/* ===== BANNER FADE (DESKTOP) ===== */
.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.4s ease;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}

.card-fade-enter-active,
.card-fade-leave-active {
  transition: opacity 0.3s ease;
}

.card-fade-enter-from,
.card-fade-leave-to {
  opacity: 0;
}

.search input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
}

/* DESKTOP MENU GRID (SPACIOUS, BREATHABLE CARDS) */
.menu {
  display: grid;
  gap: 20px;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  align-content: start;
}

/* ===== CARD (3B – REFINED, CLEAN ELEVATION) ===== */
.card {
  background: var(--sa-surface);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: background-color 0.22s ease;
}

.card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

/* ===== INFO ===== */
.info {
  padding: 14px 15px 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--sa-heading);
  line-height: 1.38;
  letter-spacing: -0.1px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.desc {
  font-size: 12.5px;
  font-weight: 400;
  color: var(--sa-muted);
  margin-bottom: 12px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== CARD META ROW: PRICE LEFT + DETAIL/NOTE RIGHT ===== */
.card-meta-row {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

/* ===== ROW GIÁ + SL ===== */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.price {
  font-size: 16.5px;
  font-weight: 700;
  color: var(--sa-price);
  letter-spacing: -0.2px;
}

.price.is-sale-price {
  color: var(--sa-sale);
}

/* ===== UNIFIED ACTION BAR: [- QTY +] + ADD CTA ===== */
.card-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== QTY ===== */
.qty {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qty input {
  width: 42px;
  height: 28px;
  text-align: center;
  border: 1px solid var(--sa-border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--sa-input-bg);
  color: var(--sa-text);
}

/* ===== ADD BUTTON ===== */
.add-btn {
  margin-top: 0;
  flex: 1;
  width: 100%;
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  transition: background-color 0.16s ease, transform 0.12s ease, box-shadow 0.16s ease;
  border: none;
  border-radius: 10px;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(5, 150, 105, 0.16);
}

.add-btn-ico {
  font-size: 15px;
}

.add-btn.added {
  background: #047857;
  color: #ffffff;
}

.add-btn.added i {
  font-size: 17px;
}

.add-btn:hover:not(:disabled) {
  background: var(--sa-accent-hover);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.24);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.add-btn:disabled {
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  border: 1px solid var(--sa-border);
  box-shadow: none;
  cursor: not-allowed;
}

/* PAGINATION */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin: 32px 0 16px;
}

.pagination button {
  min-width: 38px;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-text);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
}

.pagination button:hover:not(:disabled):not(.active) {
  background: var(--sa-surface-2);
  border-color: var(--sa-border-strong);
  color: var(--sa-heading);
}

.pagination button.active {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.22);
}

.pagination button:first-child,
.pagination button:last-child {
  font-size: 17px;
  padding: 0 10px;
}

.pagination button:disabled {
  background: transparent;
  color: var(--sa-muted);
  border-color: var(--sa-border);
  opacity: 0.45;
  cursor: not-allowed;
}

/* ===== LAZY LOAD SENTINEL & FOOTER CHECK SCAM BUTTON ===== */
.lazy-load-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-muted);
}

.lazy-spin-ico {
  font-size: 17px;
  color: var(--sa-accent);
  animation: lazySpin 0.85s linear infinite;
}

@keyframes lazySpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.footer-checkscam-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 28px auto 10px;
  width: 100%;
}

.footer-checkscam-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin: 0;
  padding: 12px 22px;
  border-radius: 14px;
  background: var(--sa-top-header-bg);
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: #ffffff;
  text-decoration: none;
  width: fit-content;
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.24);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.footer-checkscam-btn.is-verify {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.28);
}

.footer-checkscam-btn.is-shops {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  box-shadow: 0 6px 18px rgba(217, 119, 6, 0.28);
}

.footer-checkscam-btn.is-alerts {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.28);
}

.footer-checkscam-btn i {
  font-size: 18px;
}

.footer-checkscam-btn .footer-cs-ext {
  font-size: 15px;
  opacity: 0.9;
}

.footer-checkscam-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
}

.footer-checkscam-btn:active {
  transform: scale(0.97);
}

@media (max-width: 768px) {
  .footer-checkscam-group {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch;
    gap: 6px;
    margin: 22px auto calc(52px + env(safe-area-inset-bottom));
  }

  .footer-checkscam-btn {
    width: 100%;
    flex-direction: column;
    text-align: center;
    gap: 5px;
    padding: 9px 6px;
    font-size: 11px;
    line-height: 1.25;
    border-radius: 12px;
  }

  .footer-checkscam-btn .footer-cs-ext {
    display: none;
  }
}

/* SIDEBAR RIGHT (CLEAN DESKTOP CART) */
.sidebar-right {
  border-left: 1px solid var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-text);
  position: sticky;
  top: var(--sa-header-h);
  height: calc(100vh - var(--sa-header-h));
  overflow-y: auto;
  transition: background-color 0.22s ease, border-color 0.22s ease;
  z-index: 20;
  font-size: 13px;
  min-width: 0;
}

@media (min-width: 769px) {
  .sidebar-right.collapsed {
    display: none;
  }
}

.sidebar-right .sidebar-content {
  padding: 12px;
}

.sidebar-right .toggle-btn {
  position: absolute;
  top: 12px;
  left: auto;
  right: 12px;
  width: 24px;
  height: 24px;
  border: 1px solid #ffffff;
  background: rgb(3, 124, 19);
  color: white;
  cursor: pointer;
  z-index: 10;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

/* ===== EXPORT TEXTAREA - PRO ===== */
.export {
  width: 100%;
  margin-top: 10px;
  padding: 14px 14px;

  border-radius: 12px;
  border: 2px solid #065f46;

  background: var(--sa-input-bg);

  font-size: 13px;
  font-weight: 600;
  line-height: 1.55;

  color: var(--sa-text);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 20px rgba(15, 23, 42, 0.08);

  outline: none;
  resize: none;
}
.export:focus {
  border-color: #16a34a;
  box-shadow:
    0 0 0 3px rgba(22, 163, 74, 0.2);
}

.export::-webkit-scrollbar {
  width: 8px;
}

.export::-webkit-scrollbar-track {
  background: transparent;
  overflow: visible;
  border-radius: 999px;
}

.export::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.export::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.export {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.copy-btn {
  margin-top: 10px;
  width: 100%;
  padding: 8px;
  background: #16a34a;
  color: white;
  border: none;
}

/* FOOTER */
.footer {
  margin-top: auto;
  padding: 16px;
  background: #16a34a;
  color: white;
  font-size: 13px;
  font-weight: bold;
  border-radius: 16px;
}

.footer div {
  color: white;
  margin-bottom: 6px;
}

.sidebar-left.collapsed .sidebar-content,
.sidebar-right.collapsed .sidebar-content {
  display: none;
}

.empty-menu {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--sa-muted);
  padding: 40px 0;
}

/* ===== SEARCH WRAPPER (MOBILE) ===== */
.search-wrapper {
  position: sticky;
  top: 8px;
  z-index: 15;
  margin: 0 auto;
  width: calc(100% - 24px);
  max-width: 440px;
  padding: 6px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  overflow: visible;
}

/* ===== SEARCH BOX ===== */
.search-box {
  width: 100%;
  max-width: none;
  margin: 0;
  display: flex;
  align-items: center;
  background: var(--sa-surface);
  border-radius: 10px;
  padding: 6px;
  border: 2px solid #22c55e;
  box-shadow:
    0 0 0 1px rgba(34, 197, 94, 0.2),
    0 6px 18px rgba(22, 163, 74, 0.22);
}

.search-box:focus-within {
  border-color: #16a34a;
  box-shadow:
    0 0 0 3px rgba(22, 163, 74, 0.22),
    0 8px 22px rgba(22, 163, 74, 0.3);
}

/* SEARCH SUGGEST */
.search-suggest {
  position: absolute;
  left: 50%;
  top: 64px;
  transform: translateX(-50%);
  width: min(420px, calc(100% - 20px));
  margin: 0;
  background: var(--sa-surface);
  border-radius: 16px;
  border: 1px solid var(--sa-border-green);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
  z-index: 30;
}
.search-suggest::-webkit-scrollbar {
  width: 8px;
}

.search-suggest::-webkit-scrollbar-thumb {
  background: rgba(22, 163, 74, 0.35);
  border-radius: 999px;
}

.search-suggest::-webkit-scrollbar-track {
  background: transparent;
}

.suggest-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  overflow: visible;
  cursor: pointer;
  text-align: left;
}

.suggest-item:hover {
  background: var(--sa-pill-hover);
}

.suggest-img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--sa-img-bg);
}

.suggest-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.suggest-name {
  font-size: 13px;
  font-weight: 800;
  color: var(--sa-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggest-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-price);
}

/* INPUT */
.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 14px;
  font-size: 14px;
  border-radius: 999px;
  background: transparent;
  color: var(--sa-text);
}

.search-input::placeholder {
  color: var(--sa-muted);
}

/* BUTTON SEARCH */
.search-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #16a34a;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(22, 163, 74, 0.45);
  transition: all 0.2s ease;
}

.search-btn:hover {
  background: #15803d;
  transform: scale(1.05);
}

.search-btn:active {
  transform: scale(0.95);
}

.search-clear-btn {
  width: 32px;
  height: 32px;
  margin-right: 6px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: #ffffff;
  font-size: 16px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(239, 68, 68, 0.45);
  transition: all 0.18s ease;
}

.search-clear-btn:hover {
  transform: scale(1.05);
}

.search-clear-btn:active {
  transform: scale(0.94);
}

.search-result-line {
  grid-column: 1 / -1;
  margin: 0 4px 8px;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--sa-price);
  text-transform: uppercase;
}

.banner {
  position: relative;
}

.banner-btn {
  position: relative;
  top: auto;
  left: auto;
  right: auto;
  transform: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1.5px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-accent);
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.banner-btn.prev,
.banner-btn.next {
  left: auto;
  right: auto;
}

.banner-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  transform: scale(1.06);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.26);
}

.banner-btn:active {
  transform: scale(0.94);
}

/* PRICE ROW (LEFT-ALIGNED INSIDE .card-meta-row) */
.price-row {
  margin: 0;
  padding: 0;
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 6px;
  flex-wrap: wrap;
}

.price {
  font-size: 16.5px;
  font-weight: 700;
  color: var(--sa-price);
  letter-spacing: -0.2px;
}

.price.is-sale-price {
  color: var(--sa-sale);
}

/* FRAMELESS CIRCULAR QUANTITY STEPPER */
.qty-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0;
  margin: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  flex-shrink: 0;
}

.qty-row input {
  width: 28px;
  height: 30px;
  padding: 0;
  text-align: center;
  border-radius: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: var(--sa-heading);
  outline: none;
  -moz-appearance: textfield;
  appearance: textfield;
}

.qty-row input::-webkit-outer-spin-button,
.qty-row input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-row input:focus {
  background: transparent;
  color: var(--sa-accent);
}

.btn-qty {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-accent);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease;
}

.btn-qty:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(5, 150, 105, 0.24);
}

.btn-qty:active {
  transform: scale(0.9);
}

/* ===== STATUS TAG & FLOATING CARD STATUS PILL ===== */
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.1;
  border-radius: 999px;
  width: fit-content;
  letter-spacing: 0;
  text-transform: none;
  box-shadow: none;
  user-select: none;
}

.status-tag.available {
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  border: 1px solid var(--sa-border-green);
}

.status-tag.available::before {
  content: '';
  width: 5.5px;
  height: 5.5px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
}

.status-tag.out {
  background: rgba(15, 23, 42, 0.78);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.status-tag.out::before {
  content: '';
  width: 5.5px;
  height: 5.5px;
  border-radius: 50%;
  background: #fca5a5;
  flex-shrink: 0;
}

.card-img-wrap .card-status-pill {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  margin: 0;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.card-img-wrap .card-status-pill.available {
  background: rgba(255, 255, 255, 0.92);
  color: #047857;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.sa-storefront.theme-dark .card-img-wrap .card-status-pill.available {
  background: rgba(19, 26, 38, 0.88);
  color: #34d399;
  border-color: rgba(255, 255, 255, 0.1);
}

.card:hover {
  cursor: pointer;
}

.card:has(.status-tag.out) {
  opacity: 0.72;
}

/* ===== SUBTLE DETAIL / NOTE LINK ===== */
.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--sa-muted);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.detail-link i {
  font-size: 13px;
}

.detail-link:hover {
  color: var(--sa-accent);
  text-decoration: none;
}

/* ===== MODAL OVERLAY ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-overlay.z-top {
  z-index: 10001;
}

/* ===== MODAL CARD ===== */
.modal-card {
  background: var(--sa-surface);
  color: var(--sa-text);
  border-radius: 18px;
  position: relative;
  border: 1px solid var(--sa-border);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
}

.modal-card.export-modal {
  width: min(680px, 90vw);
  max-height: 88vh;
}

.modal-card.export-modal .export {
  min-height: 320px;
  max-height: 58vh;
}

@keyframes modalPopFast {
  from {
    transform: scale(0.97);
    opacity: 0.6;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes modalPop {
  from {
    transform: scale(0.94);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* CLOSE */
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.16s ease;
}

.modal-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}

/* MODAL IMAGE */
.modal-left {
  background: var(--sa-img-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--sa-border);
}

.modal-left .modal-img {
  width: 100%;
  height: auto;
  max-height: 340px;
  min-height: unset;
  object-fit: contain;
  background: var(--sa-img-bg);
}

/* BODY */
.modal-body {
  padding: 16px;
  text-align: center;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--sa-heading);
  margin: 4px 0 2px;
  letter-spacing: -0.2px;
}

.modal-desc {
  font-size: 14px;
  color: var(--sa-muted);
  line-height: 1.55;
  margin-bottom: 8px;
}

.modal-price {
  display: flex;
  justify-content: flex-start;
  align-items: baseline;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
  color: var(--sa-price);
  margin-top: 6px;
  margin-bottom: 10px;
}

.modal-price .is-sale-price {
  color: var(--sa-sale);
}

/* ===== MODAL CARD – WIDE (DESKTOP PRODUCT DETAIL) ===== */
.modal-card.modal-wide {
  width: 720px;
  max-width: 95%;
  border-radius: 20px;
}

.modal-content {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 16px;
}

.modal-right {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 769px) {
  .modal-card.modal-wide {
    width: min(960px, 92vw);
    max-height: 86vh;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid var(--sa-border);
    box-shadow: 0 28px 68px rgba(15, 23, 42, 0.24);
  }

  .modal-card.modal-wide .modal-content {
    grid-template-columns: 1.15fr 1fr;
    gap: 28px;
    padding: 24px;
    align-items: stretch;
    height: 100%;
  }

  .modal-card.modal-wide .modal-media {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 500px;
  }

  .modal-card.modal-wide .modal-media.no-thumbs {
    height: 460px;
  }

  .modal-card.modal-wide .modal-left {
    border-radius: 16px;
    border: 1px solid var(--sa-border);
    background: var(--sa-img-bg);
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 430px;
    position: relative;
  }

  .modal-card.modal-wide .modal-media.no-thumbs .modal-left {
    height: 460px;
  }

  .modal-card.modal-wide .modal-left .modal-img {
    width: 100%;
    height: 100%;
    max-height: none;
    object-fit: contain;
    border-radius: 12px;
    background: transparent;
    box-shadow: none;
  }

  .modal-card.modal-wide .modal-img-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid var(--sa-border);
    background: var(--sa-surface);
    color: var(--sa-heading);
    font-size: 20px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .modal-card.modal-wide .modal-img-nav.prev {
    left: 12px;
  }

  .modal-card.modal-wide .modal-img-nav.next {
    right: 12px;
  }

  .modal-card.modal-wide .modal-img-nav:hover {
    background: var(--sa-accent);
    border-color: var(--sa-accent);
    color: #ffffff;
    transform: translateY(-50%) scale(1.05);
  }

  .modal-card.modal-wide .modal-img-nav:active {
    transform: translateY(-50%) scale(0.96);
  }

  .modal-card.modal-wide .modal-thumbs {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    justify-content: flex-start;
    width: 100%;
    height: 60px;
    padding: 0 2px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
  }

  .modal-card.modal-wide .modal-thumb {
    width: 64px;
    height: 52px;
    border-radius: 10px;
    border: 1px solid var(--sa-border);
    background: var(--sa-img-bg);
    overflow: hidden;
    padding: 0;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .modal-card.modal-wide .modal-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .modal-card.modal-wide .modal-thumb:hover {
    border-color: var(--sa-border-strong);
  }

  .modal-card.modal-wide .modal-thumb.active {
    border-color: var(--sa-accent);
    box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
  }

  .modal-card.modal-wide .modal-right {
    padding: 4px 4px 8px;
    gap: 12px;
    overflow-y: auto;
  }

  .modal-card.modal-wide .modal-title {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.3px;
  }

  .modal-card.modal-wide .modal-desc {
    font-size: 14px;
    color: var(--sa-muted);
    max-height: 140px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .modal-card.modal-wide .modal-price {
    justify-content: flex-start;
    font-size: 23px;
    margin-bottom: 4px;
  }

  .modal-card.modal-wide .modal-qty {
    justify-content: flex-start;
    width: fit-content;
  }

  .modal-card.modal-wide .form-field textarea {
    background: var(--sa-input-bg);
    border-color: var(--sa-input-border);
    border-radius: 10px;
  }

  .modal-card.modal-wide .add-btn {
    margin-top: 6px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 12px;
    font-size: 14.5px;
    font-weight: 600;
  }

  .modal-card.modal-wide .modal-close {
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    background: var(--sa-surface-2);
    color: var(--sa-heading);
    border: 1px solid var(--sa-border);
    box-shadow: none;
  }

  .modal-card.modal-wide .modal-close:hover {
    background: #fee2e2;
    border-color: #fecaca;
    color: #dc2626;
  }
}

/* TAG DANH MỤC / SIZE */
.meta-tag {
  display: inline-block;
  width: fit-content;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  border: 1px solid var(--sa-border-green);
}

.meta-tag.inline {
  margin: 0;
}

.meta-tag.size-badge {
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-weight: 600;
  border: 1px solid var(--sa-border);
  box-shadow: none;
  text-shadow: none;
}

.price .unit {
  font-size: 12px;
  font-weight: 500;
  color: var(--sa-muted);
  margin-left: 2px;
}

.modal-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--sa-muted);
  margin-left: 4px;
}

/* ===== CART BOX ===== */
.cart-box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.order-count {
  margin-left: 4px;
  color: var(--sa-muted);
  font-weight: 600;
  font-size: 13px;
}

/* ===== LIST ===== */
.cart-list {
  display: flex;
  flex-direction: column;
}

/* ITEM */
.cart-row {
  position: relative;
  display: grid;
  grid-template-columns: 40px 1fr 90px 32px;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--sa-border);
  transition: background-color 0.2s ease;
}

.cart-row::before {
  display: none;
}

/* STT */
.cart-col.stt {
  text-align: center;
  font-weight: 600;
}

/* INFO (TÊN + GIÁ) */
.cart-col.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cart-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-clamp: 2;
  word-break: break-word;
}

.cart-price {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--sa-price);
}

/* QTY */
.cart-col.qty {
  text-align: center;
  font-weight: 600;
}

/* ACTION */
.cart-col.action {
  text-align: center;
}

.remove-btn {
  border: none;
  background: #fee2e2;
  color: #dc2626;
  font-size: 13px;
  cursor: pointer;
  border-radius: 8px;
}

/* ===== FORM ===== */
.cart-form input {
  width: 100%;
  margin-bottom: 6px;
  padding: 8px 11px;
  border-radius: 9px;
  border: 1px solid var(--sa-input-border);
  font-size: 13px;
}

/* COPY */
.copy-btn {
  margin-top: 8px;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.cart-col.subtotal {
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-price);
}

/* CLEAN RECEIPT SUMMARY ROW */
.cart-total {
  flex: 1;
  margin: 0;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  border-radius: 11px;
}

.cart-total span,
.cart-total-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-price);
}

.cart-total strong,
.cart-total-value {
  font-size: 17.5px;
  font-weight: 800;
  color: var(--sa-price);
  letter-spacing: -0.3px;
}

.cart-qty {
  font-size: 12px;
  color: var(--sa-muted);
  font-weight: 600;
  text-decoration: underline;
}

/* ===== FORM FIELD ===== */
.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.form-field label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 5px;
  color: var(--sa-muted);
  text-transform: none;
  letter-spacing: 0;
}

.form-field input,
.form-field textarea {
  width: 100%;
  padding: 8px 11px;
  border-radius: 9px;
  border: 1px solid var(--sa-input-border);
  font-size: 13px;
  font-weight: 400;
  color: var(--sa-heading);
  background: var(--sa-input-bg);
  outline: none;
  resize: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

/* ===== MAP ===== */
.mini-map {
  height: 160px;
  margin-top: 6px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--sa-border);
}

/* ===== ADDRESS SUGGEST ===== */
.address-suggest {
  margin-top: 4px;
  background: var(--sa-surface);
  border-radius: 9px;
  border: 1px solid var(--sa-border);
  max-height: 160px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}

.address-suggest li {
  padding: 7px 11px;
  font-size: 12.5px;
  color: var(--sa-text);
  cursor: pointer;
}

.address-suggest li:hover {
  background: var(--sa-surface-2);
}

.khuyenmai-box {
  margin: 4px 2px 8px;
  text-align: right;
}

.khuyenmai-item {
  font-size: 11px;
  font-weight: 600;
  color: var(--sa-sale);
  line-height: 1.4;
}

.cart-item-note {
  font-size: 11px;
  line-height: 1.35;
  color: #b45309;
  margin-top: 2px;
}

/* ===== MODAL QTY STEPPER (FRAMELESS CIRCULAR BUTTONS) ===== */
.modal-qty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  margin: 6px 0 10px;
}

.modal-qty input {
  width: 38px;
  height: 34px;
  text-align: center;
  border-radius: 0;
  border: none;
  background: transparent;
  font-size: 15.5px;
  font-weight: 700;
  color: var(--sa-heading);
  outline: none;
  -moz-appearance: textfield;
  appearance: textfield;
}

.modal-qty input::-webkit-outer-spin-button,
.modal-qty input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.modal-qty button {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-accent);
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease;
}

.modal-qty button:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(5, 150, 105, 0.24);
}

.modal-qty button:active {
  transform: scale(0.9);
}
/* ===== MODAL CLOSE ANIMATION ===== */
.modal-card.closing {
  animation: modalClose 0.22s ease forwards;
}

@keyframes modalClose {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.92);
    opacity: 0;
  }
}

/* ===== SHOP CONTACT ===== */
.shop-contact {
  margin-top: auto;        /*  đẩy xuống đáy */
  padding: 8px 4px;

  background: transparent;
  overflow: visible; /*  bỏ nền */
  box-shadow: none;
  border-radius: 0;
}


.contact-title {
  color: #ffffff;
  font-weight: 900;
  margin-bottom: 6px;
}

/* item */
.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 6px 8px;
  border-radius: 10px;

  color: #ffffff;
  background: transparent;
  overflow: visible;
  transition: background 0.2s ease;
}
.contact-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.contact-icon {
  width: 36px;
  height: 36px;

  border-radius: 10px;
  border: 2px solid #ffffff;
  background: #ffffff;
}


.contact-name {
  color: #fbff00;
  font-weight: 800;
}

.contact-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-style: italic;
}


.categories {
  flex: 1;                 /*  chiếm phần còn lại */
  overflow-y: auto;        /*  scroll tại đây */
  min-height: 0;           /*  fix bug flex scroll */

  margin-bottom: 12px;
  padding: 12px;

  background: #ffffff;
  border-radius: 16px;
  scrollbar-width: thin;                 /* Firefox */
  scrollbar-color: #22c55e transparent;  /* thumb | track */
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.15);
}
.categories::-webkit-scrollbar {
  width: 8px;
}

.categories::-webkit-scrollbar-track {
  background: transparent;
  overflow: visible;
  border-radius: 999px;
}

.categories::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    #22c55e,
    #16a34a
  );
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.6); /* viền sáng nhẹ */
}
.categories::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    #16a34a,
    #15803d
  );
}

.categories::-webkit-scrollbar-thumb {
  opacity: 0.6;
}

.categories:hover::-webkit-scrollbar-thumb {
  opacity: 1;
}

.categories h4 {
  color: #047857;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin: 0 0 8px;
}

.category-title-icon {
  font-size: 18px;
  color: #047857;
}

.category-sale-badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  box-shadow: 0 6px 14px rgba(239, 68, 68, 0.35);
  animation: saleGlow 2.2s ease-in-out infinite;
}

.categories .cat {
  color: #047857;
  font-weight: 700;
}

/* hover */
.categories .cat:hover {
  background: #00ff88;
}

/* active */
.categories .cat.active {
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );
  color: #ffffff;
}


/* thanh indicator bên trái */
.categories .cat.active::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);

  width: 4px;
  height: 18px;
  border-radius: 4px;
  background: #fef08a;
}
@media (min-width: 769px) {
  .sidebar-left .categories {
    padding: 16px;
    background: linear-gradient(145deg, #f8fafc 0%, #ffffff 55%, #e6f7ed 100%);
    border: 1px solid rgba(4, 120, 87, 0.12);
    box-shadow:
      0 14px 30px rgba(15, 23, 42, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.75);
  }

  .sidebar-left .categories h4 {
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: #065f46;
  }

  .sidebar-left .categories h4::before {
    content: none;
    display: none;
  }

  .sidebar-left .categories .cat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px 10px 34px;
    margin: 6px 0;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.9);
    color: #065f46;
    border: 1px solid transparent;
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
    transition:
      transform 0.16s ease,
      box-shadow 0.2s ease,
      border-color 0.16s ease,
      background 0.2s ease;
  }

  .sidebar-left .categories .cat:hover {
    transform: translateY(-1px);
    border-color: rgba(34, 197, 94, 0.25);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
    background: #f7fff9;
  }

  .sidebar-left .categories .cat::before {
    left: 14px;
    width: 10px;
    height: 10px;
    border-radius: 8px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    box-shadow:
      0 0 0 2px rgba(34, 197, 94, 0.2),
      0 6px 12px rgba(34, 197, 94, 0.25);
    animation: catPulse 1.2s ease-in-out infinite;
  }

  .sidebar-left .categories .cat.active {
    border-color: transparent;
    background: linear-gradient(135deg, #16a34a, #0f9f58);
    color: #ffffff;
    box-shadow: 0 14px 30px rgba(16, 185, 129, 0.35);
  }

  .sidebar-left .categories .cat.active::before {
    background: #fef08a;
    box-shadow:
      0 0 0 3px rgba(254, 240, 138, 0.6),
      0 10px 18px rgba(15, 23, 42, 0.15);
    animation: catPulseActive 0.9s ease-in-out infinite;
  }
}
/* KHUNG THÔNG BÁO */
.notice {
  overflow: hidden;        /*  bắt buộc */
  white-space: nowrap;
  position: relative;
}

/* KHUNG CHẠY */
.notice-marquee {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}

.notice-text {
  display: inline-block;
  white-space: nowrap;
  will-change: transform;
 animation-delay: -10s; /*  CHẠY NGAY */
  animation: notice-move 12s linear infinite;
}

/* CHẠY NGAY LẬP TỨC */
@keyframes notice-move {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes catPulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6), 0 0 8px rgba(34,197,94,0.25); }
  45% { box-shadow: 0 0 0 6px rgba(34,197,94,0.35), 0 0 12px rgba(34,197,94,0.35); }
  80% { box-shadow: 0 0 0 2px rgba(34,197,94,0.25), 0 0 6px rgba(34,197,94,0.3); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0), 0 0 0 rgba(34,197,94,0); }
}

@keyframes catPulseActive {
  0% { box-shadow: 0 0 0 0 rgba(254,240,138,0.8), 0 0 10px rgba(254,240,138,0.55); }
  40% { box-shadow: 0 0 0 7px rgba(254,240,138,0.55), 0 0 14px rgba(254,240,138,0.4); }
  75% { box-shadow: 0 0 0 10px rgba(254,240,138,0.35), 0 0 10px rgba(254,240,138,0.2); }
  100% { box-shadow: 0 0 0 0 rgba(254,240,138,0), 0 0 0 rgba(254,240,138,0); }
}

/* hover pause */
.notice-bar:hover .notice-text {
  animation-play-state: paused;
}



/* PAUSE KHI HOVER (RẤT APP) */
.notice:hover .notice-text {
  animation-play-state: paused;
}

/* ===============================
   NOTICE BAR (FRAMELESS BOLD RED TEXT)
   =============================== */
.notice-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 0;
  padding: 4px 2px;
  margin-bottom: 8px;
  background: transparent !important;
  border-radius: 0;
  border: none !important;
  box-shadow: none !important;
  overflow: hidden;
}

.notice-icon {
  font-size: 20px;
  font-weight: 700;
  color: var(--sa-notice-icon);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.notice-marquee {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}

.notice-text {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.1px;
  color: var(--sa-notice-text) !important;
  animation: notice-move 16s linear infinite;
}

.notice-bar:hover .notice-text {
  animation-play-state: paused;
}

@keyframes notice-move {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}

/* ===== CONTACT ICON ===== */
.contact-icon-wrap {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: #ffffff;
  z-index: 2;
}

/* ===== HIDE SCROLLBAR ON SIDEBAR LEFT ===== */
.sidebar-left::-webkit-scrollbar {
  display: none;
}

.sidebar-left {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* ===== PRIMARY CHECKOUT CTA ===== */
.finish-btn {
  margin-top: 10px;
  width: 100%;
  padding: 11px 14px;
  border: none;
  border-radius: 11px;
  background: var(--sa-accent);
  color: #ffffff;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
  transition: background-color 0.16s ease, transform 0.12s ease, box-shadow 0.16s ease;
  animation: none !important;
}

.finish-btn:hover:not(:disabled) {
  background: var(--sa-accent-hover);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.28);
}

.finish-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.finish-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.mobile-finish-wrap {
  position: fixed;
  left: 14px;
  right: 14px;
  bottom: 82px;
  bottom: calc(70px + 12px + env(safe-area-inset-bottom));
  z-index: 1095;
}

.mobile-finish-wrap .finish-btn {
  margin-top: 0;
}

@media (max-width: 768px) {
  .sidebar-right {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .sidebar-right .sidebar-content {
    padding-bottom: 140px;
  }
}

.export-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--sa-heading);
  text-align: center;
}

.modal-card {
  width: 360px;
  max-width: 92%;
  padding: 16px;
}

/* ===== SEND SHOP ===== */
.send-shop-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}

.send-btn {
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 11px;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  text-transform: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.22);
  transition: all 0.16s ease;
}

.send-btn:hover {
  background: var(--sa-accent-hover);
  transform: translateY(-1px);
}

.send-btn:active {
  transform: scale(0.97);
}

.send-platform-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  border-radius: 5px;
  background: #ffffff;
}

/* ===== COPY BTN ===== */
.copy-btn {
  margin-top: 10px;
  width: 50%;
  max-width: 240px;
  padding: 7px 12px;
  border-radius: 999px;
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
  font-weight: 600;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.16s ease;
}

.copy-btn.copied {
  background: #047857;
}

/* ===== CART SCROLLBAR – SUBTLE NEUTRAL ===== */
.cart-scroll-area::-webkit-scrollbar,
.cart-list::-webkit-scrollbar {
  width: 5px;
}

.cart-scroll-area::-webkit-scrollbar-track,
.cart-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 999px;
}

.cart-scroll-area::-webkit-scrollbar-thumb,
.cart-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.26);
  border-radius: 999px;
}

.cart-scroll-area::-webkit-scrollbar-thumb:hover,
.cart-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.45);
}

.cart-scroll-area,
.cart-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.28) transparent;
}

/* ===== SCROLL TO TOP BUTTON ===== */
.scroll-top-btn {
  width: 36px;
  height: 36px;
  margin-left: 6px;
  border: 1px solid var(--sa-border);
  border-radius: 50%;
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.16s ease;
}

/* ===== GLOBAL SCROLL TO TOP FAB ===== */
.scroll-top-fab {
  position: fixed;
  right: calc(clamp(336px, 24.5vw, 368px) + 20px);
  bottom: 24px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1200;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  transition: all 0.2s ease;
}

/* ===== CARD IMAGE ===== */
.card-img-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--sa-img-bg);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid var(--sa-border);
  transition: background-color 0.22s ease;
}

.card-img-wrap::after {
  display: none;
}

.card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.card:hover .card-img-wrap img {
  transform: scale(1.04);
}

.scroll-top-fab:hover {
  transform: translateY(-2px);
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  box-shadow: 0 10px 26px rgba(5, 150, 105, 0.28);
}

.scroll-top-fab:active {
  transform: scale(0.94);
}

.layout.hide-right + .scroll-top-fab,
.layout.hide-left.hide-right + .scroll-top-fab {
  right: 20px;
}

/* ===== FILTER BAR ===== */
.filter-bar {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-select {
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--sa-border);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  background: var(--sa-surface);
  color: var(--sa-text);
}

.price-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-range input {
  width: 90px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid var(--sa-border);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  text-align: center;
  background: var(--sa-surface);
  color: var(--sa-text);
}

.price-range span {
  font-weight: 700;
  color: var(--sa-price);
}

.filter-btn {
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-text);
  cursor: pointer;
  transition: all 0.16s ease;
}

.filter-btn:hover {
  background: var(--sa-surface-2);
  border-color: var(--sa-border-strong);
}

.filter-btn.active {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
}

.toggle-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-heading);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
}

.toggle-icon {
  font-size: 20px;
  line-height: 1;
  transition: transform 0.22s ease, opacity 0.2s ease;
}

.toggle-btn:hover .toggle-icon {
  transform: scale(1.1);
}

.toggle-btn:active .toggle-icon {
  transform: scale(0.92);
}

.cart-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.cart-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.cart-enter-active {
  transition: all 0.3s ease;
}

.cart-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.cart-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.cart-leave-active {
  transition: all 0.18s ease;
  position: absolute;
}

.cart-row.highlight {
  background: var(--sa-surface-soft);
  transition: background 0.8s ease;
}

/* ===== SKELETON BASE ===== */
.main-skeleton {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 28px;
}

.main-skeleton > div {
  background: linear-gradient(
    90deg,
    var(--sa-surface-2) 25%,
    var(--sa-surface) 37%,
    var(--sa-surface-2) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.2s ease infinite;
  border-radius: 14px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.sk-notice {
  height: 40px;
}

.sk-banner {
  height: 180px;
}

.sk-search {
  height: 40px;
  max-width: 420px;
  margin: 0 auto;
}

.sk-filter {
  height: 40px;
  max-width: 480px;
  margin: 0 auto;
}

.sk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  gap: 20px;
}

.sk-card {
  background: none !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk-card > div {
  background: linear-gradient(
    90deg,
    var(--sa-surface-2) 25%,
    var(--sa-surface) 37%,
    var(--sa-surface-2) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.2s ease infinite;
  border-radius: 12px;
}

.sk-img {
  height: 160px;
}

.sk-line {
  height: 14px;
}

.sk-line.short {
  width: 60%;
}

.sk-btn {
  height: 36px;
  margin-top: auto;
}

/* =========================================================
   MOBILE FIX – <= 768px
   ========================================================= */
@media (max-width: 768px) {
  .layout {
    display: block !important;
    min-height: 100vh;
    overflow: visible !important;
    overflow-x: clip !important;
  }

  .layout.hide-left,
  .layout.hide-right,
  .layout.hide-left.hide-right {
    grid-template-columns: none !important;
  }

  .main {
    width: 100% !important;
    max-width: 100% !important;
    padding-bottom: 90px;
    padding-top: 0;
    min-height: 100vh;
    height: auto;
    overflow: visible !important;
    overflow-x: clip !important;
  }

  .search-wrapper {
    position: sticky;
    top: 56px;
    z-index: 45;
    width: calc(100% + 24px);
    max-width: none;
    margin: 0 -12px 8px;
    padding: 6px 10px 7px;
    border-radius: 0 0 12px 12px;
    background: var(--sa-toolbar-bg);
    border-bottom: 1px solid var(--sa-border);
    box-shadow: 0 5px 14px rgba(15, 23, 42, 0.08);
  }

  .search-wrapper .search-box {
    padding: 3px 5px;
    border-radius: 9px;
    border-width: 1.5px;
    height: 36px;
  }

  .search-wrapper .search-input {
    padding: 4px 8px;
    font-size: 13px;
  }

  .search-wrapper .search-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .search-wrapper .search-clear-btn {
    width: 24px;
    height: 24px;
    margin-right: 4px;
    font-size: 14px;
  }

  .search-wrapper .filter-bar {
    margin-top: 6px;
    gap: 5px;
  }

  .search-wrapper .filter-btn {
    height: 28px;
    padding: 0 8px;
    font-size: 11.5px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .search-wrapper .filter-cat-btn {
    background: var(--sa-surface-soft);
    border: 1px solid var(--sa-border-green);
    color: var(--sa-accent);
    font-weight: 700;
  }

  .search-wrapper .filter-cat-btn.active {
    background: var(--sa-accent);
    border-color: var(--sa-accent);
    color: #ffffff;
  }

  .search-wrapper .filter-btn.lang-filter {
    width: 28px;
    height: 28px;
  }

  .search-wrapper .search-suggest {
    top: 44px;
  }

  .mobile-cat-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 2px 0 10px;
    margin-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-cat-strip::-webkit-scrollbar {
    display: none;
  }

  .mob-cat-pill {
    height: 32px;
    padding: 0 12px;
    font-size: 12.5px;
  }

  .hero-container {
    padding: 10px 12px 2px;
  }

  .scam-hub-section {
    padding: 6px 12px 10px;
  }

  .scam-hub-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .scam-hub-btn {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 5px;
    min-height: 70px;
    padding: 8px 6px;
    border-radius: 12px;
  }

  .scam-hub-icon {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }

  .scam-hub-text {
    align-items: center;
    width: 100%;
  }

  .scam-hub-title {
    font-size: 11px;
    line-height: 1.25;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .scam-hub-sub,
  .scam-hub-ext {
    display: none;
  }

  .menu-container {
    padding: 10px 12px 24px;
  }

  .pagination {
    margin-bottom: calc(40px + env(safe-area-inset-bottom));
  }

  .notice-bar {
    padding: 2px 2px;
    margin-bottom: 6px;
  }

  .notice-icon {
    font-size: 18px;
  }

  .notice-text {
    font-size: 15px;
    font-weight: 700;
  }

  .banner,
  .banner.banner-showcase {
    width: 100%;
    height: auto;
    aspect-ratio: auto;
    min-height: 0;
    max-height: none;
    margin: 0 auto 8px;
    border-radius: 0;
    overflow: visible;
    box-shadow: none;
    border: none;
    background: transparent;
  }

  .banner-carousel-row {
    gap: 0;
  }

  .banner-carousel-row > .banner-btn {
    display: none;
  }

  .banner-stage {
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
    min-height: 220px;
    border-radius: 20px;
  }

  .banner-slide-card {
    width: 78%;
    top: 5px;
    bottom: 7px;
    border-radius: 20px;
  }

  .banner-slide-card.is-single {
    width: 100%;
    top: 3px;
    bottom: 5px;
  }

  .banner-slide-card.is-prev {
    transform: translate3d(calc(-50% - 21%), 0, 0) scale(0.84);
  }

  .banner-slide-card.is-next {
    transform: translate3d(calc(-50% + 21%), 0, 0) scale(0.84);
  }

  .banner-btn.mobile-ring-nav {
    width: 36px;
    height: 36px;
    font-size: 19px;
  }

  .banner-ring-bar {
    gap: 10px;
    margin-top: 6px;
    padding: 3px 6px 5px;
  }

  .banner-ring-btn {
    width: 44px;
    height: 44px;
    padding: 2px;
  }

  .sidebar-left {
    position: fixed !important;
    top: 0;
    right: 0;
    bottom: 0;
    width: 85%;
    max-width: 320px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }

  .mh-time {
    margin-left: auto;
    transform: scale(0.92);
    flex-shrink: 0;
  }

  .sidebar-left:not(.collapsed) {
    transform: translateX(0);
  }

  .scroll-top-fab {
    right: 14px !important;
    bottom: 138px !important;
    width: 44px;
    height: 44px;
    z-index: 1150;
    background: var(--sa-accent);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 8px 22px rgba(5, 150, 105, 0.36);
  }

  /* =====================================================
     SIDEBAR RIGHT – GIỎ HÀNG (FULL MÀN – TỪ TRÁI)
  ===================================================== */
/* =====================================================
   SIDEBAR RIGHT – GIỎ HÀNG (FULL MÀN – TỪ PHẢI → TRÁI)
===================================================== */
.sidebar-right {
  position: fixed !important;
  top: 0;
  right: 0;          /*  neo bên phải */
  left: auto;        /*  bỏ left */
  bottom: 0;

  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  transform: translateX(100%); /*  nằm ngoài bên phải */
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  z-index: 1000;
}

.sidebar-right:not(.collapsed) {
  transform: translateX(0); /*  trượt vào từ phải */
}


  .sidebar-right .sidebar-content {
    padding-bottom: calc(140px + env(safe-area-inset-bottom)); /* chừa chỗ bottom bar + nút hoàn tất */
  }

  /* ===== MOBILE KHÔNG DÙNG display:none ===== */
  .sidebar-left.collapsed .sidebar-content,
  .sidebar-right.collapsed .sidebar-content {
    display: block;
  }

  /* ===== MENU GRID 2x2 ===== */
  .menu {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px;
  }

  /* ===== BOTTOM BAR ===== */
  .mobile-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    height: 70px;
    background: #ffffff;

    display: grid;
    grid-template-columns: repeat(6, 1fr);
    align-items: center;

    border-top: 2px solid #22c55e;
    z-index: 1100;
  }

  .mobile-bottom-bar button {
    background: none;
    border: none;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    font-size: 18px;
    font-weight: 800;
    color: #16a34a;
  }

  .mobile-bottom-bar span {
    font-size: 11px;
    margin-top: 2px;
  }
  /* giới hạn chiều cao modal */
.detail-back {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;

  background: rgb(255, 255, 255);
  color: #13a100;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 20px;
  cursor: pointer;
}

.detail-back:active {
  transform: translateY(-50%) scale(0.9);
}

  .mobile-sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .mobile-sheet-backdrop.is-cart {
    z-index: 998;
  }

  .mobile-sheet-backdrop.is-detail {
    z-index: 1998;
  }

  .modal-overlay:not(.image-modal):not(.full-cart-overlay) {
    align-items: flex-end;
    justify-content: center;
    padding: calc(48px + env(safe-area-inset-top, 0px)) 0 0;
  }

  .modal-overlay.image-modal {
    padding: calc(48px + env(safe-area-inset-top, 0px)) 12px calc(16px + env(safe-area-inset-bottom, 0px));
  }

  .modal-overlay:not(.image-modal):not(.full-cart-overlay) .modal-card {
    position: relative;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important; /* chừa khoảng trống phía trên kiểu Grab */
    border-radius: 22px 22px 0 0 !important;
    padding-top: 22px;
    padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: 0 -10px 36px rgba(15, 23, 42, 0.28);
  }

  .modal-overlay:not(.image-modal):not(.full-cart-overlay) .modal-card::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 38px;
    height: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.45);
    pointer-events: none;
    z-index: 2;
  }

  /* tiêu đề modal đứng yên */
  .modal-card .export-title {
    flex-shrink: 0;
  }

  /* KHUNG DANH MỤC SCROLL RIÊNG */
  .modal-card .categories {
    flex: 1;                /* chiếm phần còn lại */
    overflow-y: auto;       /*  scroll ở đây */
    min-height: 0;          /*  FIX flex scroll bug */

    padding: 12px;
    margin-top: 8px;

    border-radius: 14px;
    background: #f9fafb;
  }

  /* category modal header + list aligns with desktop layout */
  .category-modal-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    width: 100%;
    color: #065f46;
    font-weight: 900;
  }

  .modal-card .modal-categories {
    background: linear-gradient(145deg, #f8fafc 0%, #ffffff 55%, #ecfdf3 100%);
    border: 1px solid rgba(4, 120, 87, 0.12);
    box-shadow:
      0 12px 24px rgba(15, 23, 42, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.65);
  }

  .modal-card .modal-categories .cat {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;

    padding: 12px 12px 12px 34px;
    margin: 6px 0;

    border-radius: 14px;
    background: rgba(255, 255, 255, 0.92);
    color: #065f46;
    border: 1px solid transparent;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  }

  .modal-card .modal-categories .cat::before {
    content: '';
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);

    width: 10px;
    height: 10px;
    border-radius: 8px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    box-shadow:
      0 0 0 2px rgba(34, 197, 94, 0.2),
      0 6px 12px rgba(34, 197, 94, 0.25);
    animation: catPulse 1.2s ease-in-out infinite;
  }

  .modal-card .modal-categories .cat.active {
    border-color: transparent;
    background: linear-gradient(135deg, #16a34a, #0f9f58);
    color: #ffffff;
    box-shadow: 0 14px 30px rgba(16, 185, 129, 0.35);
  }

  .modal-card .modal-categories .cat.active::before {
    background: #fef08a;
    box-shadow:
      0 0 0 3px rgba(254, 240, 138, 0.6),
      0 10px 18px rgba(15, 23, 42, 0.15);
    animation: catPulseActive 0.9s ease-in-out infinite;
  }

  .modal-card .modal-categories .cat.sale {
    background: linear-gradient(120deg, #ef4444 0%, #b91c1c 55%, #ef4444 100%);
    color: #ffffff;
    border-color: rgba(239, 68, 68, 0.4);
    box-shadow:
      0 12px 26px rgba(239, 68, 68, 0.35),
      0 0 0 2px rgba(239, 68, 68, 0.2);
    position: relative;
    overflow: hidden;
  }

  .modal-card .modal-categories .cat.sale::before {
    background: #ffffff;
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.35);
  }

  .modal-card .modal-categories .cat.sale::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      transparent 0%,
      rgba(255, 255, 255, 0.32) 40%,
      rgba(255, 255, 255, 0.08) 55%,
      transparent 70%
    );
    transform: translateX(-120%);
    animation: saleShimmer 2.4s ease-in-out infinite;
    pointer-events: none;
  }

  .modal-card .modal-categories .cat-label {
    color: #065f46;
    font-weight: 800;
    letter-spacing: 0.25px;
  }

  .modal-card .modal-categories .cat-sale-pill {
    margin-left: auto;
    height: auto;
    padding: 0;
    display: inline-flex;
    align-items: center;
    color: #ffffff;
    font-weight: 900;
    text-transform: uppercase;
    background: none;
    border-radius: 0;
    box-shadow: none;
    letter-spacing: 0.25px;
  }

  .modal-card .modal-categories .cat.active .cat-label {
    color: #fefce8;
  }

  .modal-card .modal-categories .cat.sale .cat-label {
    color: #ffffff;
  }
  
 /* header modal */
  .modal-card .export-title {
    background: linear-gradient(
      135deg,
      #22c55e,
      #16a34a
    );

    color: #ffffff;
    font-weight: 900;

    padding: 14px 16px;
    margin: -14px -14px 10px -14px; /* ăn sát viền modal */

    border-top-left-radius: 16px;
    border-top-right-radius: 16px;

    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
  }

  /* nút đóng (X) nổi trên nền xanh */
  .modal-card .modal-close {
    top: 10px;
    right: 10px;

    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;

    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }

  .modal-card .modal-close:hover {
    background: rgba(255, 255, 255, 0.4);
  }
   /* === HEADER (TIÊU ĐỀ) === */
  .modal-card .export-title {
    background: #ffffff;
    color: #16a34a; /* xanh lá */

    font-weight: 900;
    padding: 14px 16px;

    margin: -14px -14px 0 -14px; /* ăn sát viền trên */
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-bottom: 2px solid #22c55e;
  }

  /* header ch?n danh m?c: ch? xanh ?m, d?m */
  .modal-card .export-title.category-modal-title {
    color: #065f46;
    font-weight: 900;
  }

  /* nút đóng (X) */
  .modal-card .modal-close {
    background: #16a34a;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }

  /* === PHẦN CONTENT (NỀN XANH) === */
  .modal-card .shop-contact {
    background: linear-gradient(
      135deg,
      #22c55e,
      #16a34a
    );

    padding: 16px 12px;
    margin: 0 -14px -14px -14px; /* ăn sát viền modal */

    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }

  /* từng item liên hệ */
  .modal-card .shop-contact .contact-item {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 10px 12px;
    margin-bottom: 10px;

    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* text */
  .modal-card .shop-contact .contact-name {
    color: #fef08a; /* vàng nhạt nổi */
    font-weight: 900;
  }

  .modal-card .shop-contact .contact-desc {
    color: rgba(255,255,255,0.9);
    font-size: 12px;
    font-style: italic;
  }
  .modal-card .shop-contact .contact-item {
  animation: pulse 1.2s ease infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
/* ===== MOBILE MODAL ANIMATION ===== */
.mobile-modal-enter-from {
  opacity: 0;
}
.mobile-modal-enter-to {
  opacity: 1;
}
.mobile-modal-leave-from {
  opacity: 1;
}
.mobile-modal-leave-to {
  opacity: 0;
}
.mobile-modal-enter-active,
.mobile-modal-leave-active {
  transition: opacity 0.25s ease;
}

/* CARD */
.mobile-modal-enter-from .modal-card {
  transform: translateY(36px);
  opacity: 0;
}
.mobile-modal-enter-to .modal-card {
  transform: translateY(0);
  opacity: 1;
}
.mobile-modal-leave-from .modal-card {
  transform: translateY(0);
  opacity: 1;
}
.mobile-modal-leave-to .modal-card {
  transform: translateY(36px);
  opacity: 0;
}
.mobile-modal-enter-active .modal-card,
.mobile-modal-leave-active .modal-card {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}
/* ===== CART ICON ===== */
.cart-icon-wrap {
  position: relative;
  font-size: 22px;
}

/* BADGE */
.cart-badge {
  position: absolute;
  top: -6px;
  right: -10px;

  min-width: 18px;
  height: 18px;
  padding: 0 5px;

  background: #ef4444;
  color: #ffffff;

  font-size: 11px;
  font-weight: 900;

  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}

/* BUMP ANIMATION */
.cart-badge.bump {
  animation: cart-bump 0.3s ease;
}

@keyframes cart-bump {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.35); }
  60%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
.back-btn {
  margin-top: 8px;
  width: 100%;
  padding: 11px 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  border-radius: 14px;
  border: 2px solid #22c55e;

  background: #ffffff;
  color: #16a34a;

  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.3px;

  cursor: pointer;

  transition: all 0.2s ease;
}

/* hover */
.back-btn:hover {
  background: #ecfdf5;
}
.detail-title{
  font-weight: bold;
  color: white;
  font-family: Arial, Helvetica, sans-serif;
  text-transform: uppercase;
  text-align: center;
  padding: 14px;
  width: 100%;
}
.detail-add-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);

  border: none;
  border-radius: 999px;
  padding: 6px 12px;

  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.2px;

  background: linear-gradient(180deg, #fff9cc 0%, #facc15 100%);
  color: #065f46;
  box-shadow: 0 4px 10px rgba(250, 204, 21, 0.45);
  cursor: pointer;
  overflow: hidden;
}
.detail-add-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 0%,
    rgba(255, 255, 255, 0.7) 45%,
    rgba(255, 255, 255, 0.2) 60%,
    transparent 75%
  );
  transform: translateX(-140%);
  animation: detailAddShimmer 2.2s ease-in-out infinite;
  pointer-events: none;
}
.detail-add-btn:active {
  transform: translateY(calc(-50% + 2px));
  box-shadow:
    0 0 0 8px rgba(250, 204, 21, 0.12),
    0 0 0 12px rgba(250, 204, 21, 0.08),
    0 0 0 4px rgba(250, 204, 21, 0.18),
    0 2px 6px rgba(250, 204, 21, 0.35),
    inset 0 2px 3px rgba(0, 0, 0, 0.12);
}
.detail-add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.detail-add-btn:disabled::after {
  animation: none;
}

@keyframes detailAddShimmer {
  0% { transform: translateX(-140%); }
  55% { transform: translateX(140%); }
  100% { transform: translateX(160%); }
}
/* active */
.back-btn:active {
  transform: scale(0.97);
}
/* ================= FIX NÚT X MODAL MOBILE ================= */

/* Header chỉ là nền – không che X */
.modal-card .export-title {
  position: relative;
  z-index: 1;
}

/* Ép nút X luôn nổi */
.modal-card .modal-close {
  position: absolute;
  top: 10px;
  right: 10px;

  z-index: 9999; /*  QUAN TRỌNG */

  width: 28px;
  height: 28px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #16a34a;
  color: #ffffff;

  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.detail-image-wrap {
  position: relative;
  padding-bottom: 12px;
  display: grid;
  grid-template-rows: min(320px, 45vh) auto;
}

.detail-image-main {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: min(320px, 45vh);
}

.detail-image-main::after {
  display: none;
}

/* ================= MOBILE CART BAR ================= */
.mobile-cart-bar {
  position: fixed;
  bottom: 76px;
  left: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  z-index: 1200;
}

.mcb-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mcb-promo-strip {
  background: var(--sa-surface);
  border: 1px solid rgba(16, 185, 129, 0.36);
  border-radius: 11px;
  padding: 6px 10px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14);
  cursor: pointer;
}

.mcb-promo-strip.unlocked {
  background: #ecfdf5;
  border-color: #10b981;
}

.mcb-promo-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #065f46;
  line-height: 1.35;
}

.mcb-promo-text i {
  font-size: 14px;
  color: #059669;
  flex-shrink: 0;
}

.mcb-promo-bar {
  margin-top: 5px;
  height: 4px;
  width: 100%;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.16);
  overflow: hidden;
}

.mcb-promo-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
}

.cart-bar-pill-left {
  position: relative;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 13px;
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.32);
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.cart-bar-pill-left:active {
  transform: scale(0.94);
  background: #b91c1c;
}

.cart-bar-icon {
  font-size: 22px;
  color: #ffffff;
}

.cart-bar-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: #ffffff;
  color: #dc2626;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid #dc2626;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
}

.cart-bar-pill-right {
  flex: 1;
  height: 46px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  border-radius: 13px;
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.32);
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.cart-bar-pill-right:active {
  transform: scale(0.98);
  background: #b91c1c;
}

.cart-bar-label {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-transform: none;
  letter-spacing: 0;
}

.cart-bar-total {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

/* FLOATING LIVE ORDER TRACKER (MOBILE PROGRESS STATE) */
.mcb-tracker-pill {
  position: relative;
  width: 100%;
  border-radius: 14px;
  background: var(--sa-surface);
  border: 1.5px solid var(--sa-border-green);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  padding: 0;
  font-family: inherit;
  transition: transform 0.14s ease, box-shadow 0.16s ease;
}

.mcb-tracker-pill:active {
  transform: scale(0.985);
}

.mcb-tracker-main {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 9px;
}

.mcb-tracker-ico {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--sa-surface-soft);
  color: var(--sa-accent);
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mcb-live-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--sa-surface);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
}

.mcb-tracker-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mcb-tracker-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--sa-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mcb-tracker-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--sa-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mcb-tracker-code {
  color: var(--sa-heading);
  font-weight: 700;
}

.mcb-tracker-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.mcb-edit-btn {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mcb-action-cta {
  height: 30px;
  padding: 0 10px;
  border-radius: 9px;
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  white-space: nowrap;
}

.mcb-tracker-rail {
  width: 100%;
  height: 3px;
  background: rgba(148, 163, 184, 0.2);
}

.mcb-tracker-rail-fill {
  height: 100%;
  background: var(--sa-accent);
  transition: width 0.3s ease;
}

/* STATUS VARIANTS */
.mcb-tracker-pill.is-pending {
  border-color: rgba(245, 158, 11, 0.55);
}
.mcb-tracker-pill.is-pending .mcb-tracker-ico {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}
.mcb-tracker-pill.is-pending .mcb-live-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
}
.mcb-tracker-pill.is-pending .mcb-action-cta,
.mcb-tracker-pill.is-pending .mcb-tracker-rail-fill {
  background: #d97706;
}

.mcb-tracker-pill.is-approved {
  border-color: rgba(16, 185, 129, 0.55);
}
.mcb-tracker-pill.is-approved .mcb-tracker-ico {
  background: rgba(16, 185, 129, 0.14);
  color: #059669;
}

.mcb-tracker-pill.is-shipping {
  border-color: rgba(99, 102, 241, 0.55);
}
.mcb-tracker-pill.is-shipping .mcb-tracker-ico {
  background: rgba(99, 102, 241, 0.14);
  color: #4f46e5;
}
.mcb-tracker-pill.is-shipping .mcb-live-dot {
  background: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}
.mcb-tracker-pill.is-shipping .mcb-action-cta,
.mcb-tracker-pill.is-shipping .mcb-tracker-rail-fill {
  background: #4f46e5;
}

.mcb-tracker-pill.is-completed {
  border-color: rgba(16, 185, 129, 0.55);
}
.mcb-tracker-pill.is-completed .mcb-tracker-ico {
  background: rgba(16, 185, 129, 0.14);
  color: #047857;
}

.mcb-tracker-pill.is-cancelled {
  border-color: rgba(239, 68, 68, 0.5);
}
.mcb-tracker-pill.is-cancelled .mcb-tracker-ico {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}
.mcb-tracker-pill.is-cancelled .mcb-action-cta.is-new-order {
  background: #dc2626;
}

.mcb-tracker-pill.is-guest-done .mcb-tracker-ico {
  background: rgba(16, 185, 129, 0.14);
  color: #059669;
}

.sa-storefront.theme-dark .mcb-tracker-pill {
  background: var(--sa-surface);
  box-shadow: 0 10px 26px rgba(2, 6, 23, 0.5);
}
.sa-storefront.theme-dark .mcb-tracker-pill.is-pending .mcb-tracker-ico {
  color: #fbbf24;
}
.sa-storefront.theme-dark .mcb-tracker-pill.is-shipping .mcb-tracker-ico {
  color: #a5b4fc;
}
.sa-storefront.theme-dark .mcb-tracker-pill.is-cancelled .mcb-tracker-ico {
  color: #fca5a5;
}

.cart-bar-slide-enter-active,
.cart-bar-slide-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.cart-bar-slide-enter-from,
.cart-bar-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ================= MOBILE BOTTOM BAR – CLEAN GLASS ================= */
.mobile-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 66px;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--sa-bottom-bar-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: center;
  border-top: 1px solid var(--sa-border);
  z-index: 1100;
}

.mobile-bottom-bar button {
  position: relative;
  background: transparent;
  overflow: visible;
  border: none;
  height: 100%;
  padding: 0 2px;
  cursor: pointer;
  min-width: 0;
}

.mobile-bottom-bar button::before {
  content: '';
  position: absolute;
  inset: 7px 3px;
  border-radius: 12px;
  background: var(--sa-surface-soft);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 0;
}

.mobile-bottom-bar button.active::before {
  opacity: 1;
}

.mobile-bottom-bar .btn-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-bottom-bar .btn-scale {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  transition: transform 0.18s ease;
}

.mobile-bottom-bar button i {
  font-size: 20px;
  color: var(--sa-muted);
  transition: color 0.18s ease;
  animation: none;
}

.mobile-bottom-bar .btn-label {
  font-size: 9.5px;
  margin-top: 2px;
  color: var(--sa-muted);
  transition: color 0.18s ease;
  font-weight: 600;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-bottom-bar .progress-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mobile-bottom-bar .progress-live-dot {
  position: absolute;
  top: -1px;
  right: -5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00b14f;
  border: 1.5px solid var(--sa-surface);
  box-shadow: 0 0 0 2px rgba(0, 177, 79, 0.22);
}

.mobile-bottom-bar .progress-live-dot.paused {
  background: #64748b;
  box-shadow: none;
}

.mobile-bottom-bar button.active i,
.mobile-bottom-bar button.active .btn-label {
  color: var(--sa-price);
}

.mobile-bottom-bar button:active .btn-scale {
  transform: scale(0.94);
}

.mobile-bottom-bar .cart-icon-wrap {
  position: relative;
}

.mobile-bottom-bar .cart-icon-wrap i {
  color: inherit;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--sa-sale);
  border: 1.5px solid var(--sa-surface);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
}

.cart-badge.bump {
  animation: cart-bump 0.3s ease;
}

@keyframes cart-bump {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.3); }
  60%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.mobile-bottom-bar .send-icon-wrap {
  position: relative;
}

.mobile-bottom-bar .send-icon-wrap i {
  color: inherit;
}

.send-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--sa-sale);
  border: 1.5px solid var(--sa-surface);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
}

@media (max-width: 768px) {
  .modal-card.modal-wide {
    width: 620px;
    max-width: 92%;
    border-radius: 16px;
  }

  .modal-left {
    background: var(--sa-img-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    overflow: hidden;
  }

  .modal-left .modal-img {
    width: 100%;
    height: auto;
    max-height: 340px;
    min-height: unset;
    object-fit: contain;
  }
}

  .detail-sidebar {
    --sa-mob-sheet-top: calc(48px + env(safe-area-inset-top, 0px));
    position: fixed;
    top: var(--sa-mob-sheet-top);
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 36px rgba(15, 23, 42, 0.28);
    background: var(--sa-surface);
    color: var(--sa-text);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
  }

  .detail-header {
    height: 56px;
    background: var(--sa-surface);
    color: var(--sa-heading);
    border-bottom: 1px solid var(--sa-border);
    border-radius: 20px 20px 0 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    position: sticky;
    top: 0;
    z-index: 5;
    justify-content: center;
  }

  .detail-title {
    color: var(--sa-heading);
    font-family: inherit;
    font-weight: 700;
    font-size: 15px;
    text-transform: none;
  }

  .detail-back {
    background: var(--sa-surface-2);
    color: var(--sa-heading);
    border: 1px solid var(--sa-border);
  }

  .detail-add-btn {
    background: var(--sa-accent);
    color: #ffffff;
    box-shadow: none;
    font-weight: 600;
  }

  .detail-add-btn::after {
    display: none;
  }

  .detail-body {
    flex: 0 0 auto;
    overflow: visible;
    padding: 16px;
  }

  .detail-img {
    width: 100%;
    max-height: 320px;
    object-fit: contain;
  }

  .detail-thumbs {
    display: flex;
    gap: 8px;
    padding: 10px 14px 4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .detail-thumbs::-webkit-scrollbar {
    display: none;
  }

  .detail-thumb {
    background: transparent;
    padding: 0;
    flex: 0 0 auto;
    border-radius: 10px;
    overflow: hidden;
    border: 1.5px solid var(--sa-border);
  }

  .detail-thumb img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    display: block;
  }

  .detail-thumb.active {
    border-color: var(--sa-accent);
  }

  .detail-img-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--sa-border);
    background: var(--sa-surface);
    color: var(--sa-heading);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14);
  }

  .detail-img-nav.prev { left: 8px; }
  .detail-img-nav.next { right: 8px; }
  .detail-img-nav:active {
    transform: translateY(-50%) scale(0.95);
  }

  .detail-slide-enter-from {
    transform: translateX(-100%);
  }
  .detail-slide-enter-to {
    transform: translateX(0);
  }
  .detail-slide-leave-from {
    transform: translateX(0);
  }
  .detail-slide-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }

  .detail-slide-enter-active,
  .detail-slide-leave-active {
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
  }

  .filter-bar {
    flex-wrap: nowrap !important;
    justify-content: space-between;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .filter-bar::-webkit-scrollbar {
    display: none;
  }

  .filter-btn {
    white-space: nowrap;
    padding: 6px 10px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .filter-btn.lang-filter {
    width: 36px;
    height: 36px;
    padding: 0;
    flex-shrink: 0;
  }

  .detail-sidebar .detail-body .add-btn {
    flex: 0 0 auto;
    width: 100%;
    height: 42px;
    min-height: 42px;
    font-size: 14.5px;
    font-weight: 700;
    border-radius: 12px;
    margin-top: 6px;
  }

  .detail-sidebar .add-btn.closing {
    transform: scale(0.96);
    opacity: 0.85;
  }

  /* ===== MOBILE HEADER – BRAND EMERALD GREEN BAR ===== */
  .mobile-header-clean {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 56px;
    padding: 0 12px;
    margin: 0 !important;
    background: var(--sa-top-header-bg);
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 0;
    box-shadow: 0 3px 14px rgba(4, 120, 87, 0.18);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .mobile-header-clean.has-scam {
    gap: 6px;
    padding: 0 8px;
  }

  .mobile-header-clean.has-scam .mh-logo {
    width: 30px;
    height: 30px;
  }

  .mobile-header-clean.has-scam .mh-name {
    font-size: 13px;
    flex: 1;
    min-width: 0;
  }

  .mh-scam-bar {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: auto;
    flex-shrink: 0;
    animation: dthScamFadeIn 0.2s ease-out;
  }

  .mh-scam-btn {
    height: 33px;
    padding: 0 5px;
    border-radius: 8px;
    gap: 3px;
  }

  .mh-scam-ico {
    font-size: 12px;
  }

  .mh-scam-label {
    font-size: 9px;
    line-height: 1.08;
    max-width: 46px;
  }

  .mh-scam-btn.is-shops .mh-scam-label {
    max-width: 31px;
  }

  .mobile-header-clean.has-scam .mh-theme-btn {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }

  .mh-logo {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.35);
    padding: 2px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .mh-name {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mobile-header-clean .logo-time.badge-online {
    margin-top: 0;
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.28);
  }

  .mobile-header-clean .badge-online .dot-online {
    background: #6ee7b7;
  }

  .image-modal-card {
    max-width: 92vw;
    max-height: 70vh;
    padding: 8px;
  }
}

/* NARROW MOBILE 2-COL CARD POLISH */
@media (max-width: 520px) {
  .card .info {
    padding: 10px 10px 11px;
  }

  .card .name {
    font-size: 13.5px;
  }

  .card .desc {
    font-size: 11.5px;
    margin-bottom: 8px;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .card-meta-row {
    margin-bottom: 8px;
    gap: 4px;
  }

  .price {
    font-size: 14.5px;
  }

  .detail-link {
    font-size: 11px;
  }

  .card-action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .card-action-bar .qty-row {
    width: 100%;
    justify-content: center;
    gap: 8px;
    height: 30px;
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .card-action-bar .btn-qty {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }

  .card-action-bar .qty-row input {
    flex: 0 0 32px;
    width: 32px;
    height: 28px;
    font-size: 13.5px;
    font-weight: 700;
  }

  .card-action-bar .add-btn {
    flex: 0 0 auto;
    width: 100%;
    height: 38px;
    min-height: 38px;
    padding: 0 12px;
    font-size: 13.5px;
    font-weight: 700;
    border-radius: 10px;
  }

  .card-img-wrap .card-status-pill {
    top: 6px;
    right: 6px;
    padding: 3px 7px;
    font-size: 10px;
  }

  .card-img-wrap .discount-tag {
    top: 6px;
    left: 6px;
    padding: 3px 7px;
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .menu { gap: 8px; }
  .mobile-bottom-bar { height: 60px; }
  .btn-label { font-size: 10px; }
  .mobile-bottom-bar i { font-size: 20px; }
  .sidebar-left { width: 92%; }
}
@media (min-width: 361px) and (max-width: 430px) {
  .menu { gap: 10px; }
  .mobile-bottom-bar { height: 64px; }
  .btn-label { font-size: 10.5px; }
  .mobile-bottom-bar i { font-size: 20px; }
}
@media (min-width: 431px) and (max-width: 480px) {
  .menu { gap: 10px; }
  .mobile-bottom-bar { height: 66px; }
  .mobile-bottom-bar i { font-size: 21px; }
}
@media (min-width: 481px) and (max-width: 600px) {
  .menu {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .sidebar-left { width: 75%; }
}
@media (min-width: 600px) and (max-width: 900px) and (min-aspect-ratio: 3/4) {
  .menu {
    grid-template-columns: repeat(3, 1fr);
  }
  .mobile-bottom-bar {
    height: 68px;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .mobile-bottom-bar { display: none; }

  .layout {
    grid-template-columns: minmax(0, 1fr) clamp(296px, 31vw, 326px);
  }

  .layout.hide-right,
  .layout.hide-left.hide-right {
    grid-template-columns: minmax(0, 1fr);
  }

  .dth-inner {
    padding: 0 14px;
    gap: 10px;
  }

  .dth-ctrl-btn span {
    display: none;
  }
}

@supports (height: 100dvh) {
  @media (min-width: 769px) {
    .layout {
      min-height: calc(100dvh - var(--sa-header-h));
    }
    .main {
      height: calc(100dvh - var(--sa-header-h));
    }
    .sidebar-right {
      height: calc(100dvh - var(--sa-header-h));
    }
  }
  @media (max-width: 768px) {
    .layout {
      min-height: 100dvh;
    }
    .main {
      min-height: 100dvh;
    }
    .sidebar-right {
      height: 100dvh;
    }
  }
}

.lang-modal {
  width: 320px;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
}
.lang-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.lang-title {
  font-size: 18px;
  font-weight: 900;
  color: #ffffff;
}
.lang-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}
.lang-close-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: rotate(90deg);
}
.lang-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 14px;

  padding: 12px 16px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.6);

  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;

  font-size: 15px;
  font-weight: 800;
  cursor: pointer;

  transition: all 0.2s ease;
}

.lang-flag {
  width: 26px;
  height: 18px;
  border-radius: 4px;
  object-fit: cover;
}

.lang-label {
  color: #ffffff;
  line-height: 1;
}
.lang-item:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: scale(1.03);
  font-weight: bold;
}
.flag {
  font-size: 20px;
}

.lang-switch-btn {
  margin: 8px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 8px 14px;
  border-radius: 999px;
  border: 2px solid #22c55e;

  background: #ffffff;
  color: #065f46;

  font-size: 13px;
  font-weight: 800;

  cursor: pointer;
  box-shadow: 0 4px 10px rgba(22,163,74,0.35);
  transition: all 0.2s ease;
}

.lang-switch-btn:hover {
  background: #ecfdf5;
  transform: scale(1.05);
}

.lang-switch-btn:active {
  transform: scale(0.95);
}
.flag-img {
  width: 24px;
  height: 18px;
  border-radius: 4px;
  object-fit: cover;
}
.lang-flag-only {
  font-size: 22px;
  line-height: 1;

  font-family:
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "Noto Color Emoji",
    system-ui,
    sans-serif;
}
.lang-flag-img-only {
  width: 26px;
  height: 20px;
  border-radius: 4px;
  object-fit: cover;
}
/* ===== FILTER + LANGUAGE ROW ===== */
.filter-lang-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: nowrap;
}

/* FILTER BAR giữ nguyên */
.filter-lang-row .filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

/* NÚT CỜ */
.lang-switch-btn.lang-only {
  width: 40px;
  height: 40px;

  padding: 0;
  border-radius: 50%;
  border: 2px solid #22c55e;
  background: #ffffff;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  box-shadow: 0 4px 10px rgba(22,163,74,0.35);
}

.lang-switch-btn.lang-only:hover {
  background: #ecfdf5;
  transform: scale(1.08);
}

.lang-switch-btn.lang-only:active {
  transform: scale(0.95);
}
.lang-loading {
  position: absolute;
  inset: 0;

  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  border-radius: 20px;
  z-index: 5;
}

.spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  animation: spin 0.9s linear infinite;
}

.loading-text {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
/* ===== CARD BORDER - THEME-AWARE ===== */
.card-border {
  position: relative;
  padding: 0;
  border-radius: 16px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  box-shadow: var(--sa-card-shadow);
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.card-border:hover {
  transform: translateY(-3px);
  border-color: var(--sa-border-strong);
  box-shadow: var(--sa-card-hover-shadow);
}

.card-border > .card {
  background: var(--sa-surface);
  border-radius: 15px;
  height: 100%;
}

.page-dots {
  color: var(--sa-muted);
  font-weight: 700;
  padding: 0 6px;
  user-select: none;
}

/* ===== IMAGE MODAL ===== */
.modal-overlay.image-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.image-modal-card {
  max-width: min(820px, 92vw);
  max-height: min(640px, 86vh);
  padding: 10px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
}

.image-preview {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 10px;
}

.clickable {
  cursor: zoom-in;
}

/* ===== ONLINE HOURS BADGE (CALM EMERALD PILL) ===== */
.logo-time.badge-online {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  margin-top: 4px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 600;
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  border: 1px solid var(--sa-border-green);
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
}

.dot-online,
.badge-online .dot-online {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  position: relative;
  animation: none;
  flex-shrink: 0;
}

.dot-online::before,
.dot-online::after,
.badge-online .dot-online::before,
.badge-online .dot-online::after {
  display: none;
}

@media (max-width: 360px) {
  .mh-time {
    font-size: 11px;
    padding: 3px 9px;
  }
}

/* ===== MODAL EDIT QTY ===== */
.qty-modal {
  width: 340px;
  max-width: 92%;
  padding: 20px;
  text-align: center;
}

.qty-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--sa-heading);
}

.save-btn {
  margin-top: 12px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease, transform 0.12s ease;
}

.save-btn:hover {
  background: var(--sa-accent-hover);
}

.save-btn:active {
  transform: scale(0.98);
}

.cart-inline-editor {
  margin: 6px 8px 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border-strong);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  animation: slideDown 0.2s ease;
}

.inline-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.inline-actions button {
  flex: 1;
}

.cancel-btn {
  border: 1px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-text);
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: var(--sa-surface-2);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cart-row {
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.cart-row:hover {
  background: var(--sa-surface-2);
}

.cart-row.active {
  background: var(--sa-surface-soft);
  box-shadow: inset 2px 0 0 var(--sa-accent);
}

.cart-row.highlight {
  animation: flash 0.5s ease;
}

@keyframes flash {
  0% {
    background: var(--sa-surface-soft);
  }
  100% {
    background: transparent;
  }
}

.qty-dvt {
  margin-left: -2px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-muted);
  white-space: nowrap;
}

.modal-qty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* ===== QR BANKING MODAL & INLINE TRIGGER ===== */
.ck-btn {
  width: 100%;
  margin-top: 10px;
  border: none;
  border-radius: 11px;
  padding: 11px 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--sa-accent);
  color: #ffffff;
  cursor: pointer;
}

.ck-btn:disabled {
  opacity: 0.5;
}

.ck-modal {
  width: fit-content;
  min-width: min(360px, 92vw);
  max-width: 94vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--sa-border);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  background: var(--sa-surface);
  padding: 20px;
}

.ck-modal .export-title {
  color: var(--sa-heading);
  font-size: 16.5px;
  font-weight: 700;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ck-modal .export-title i {
  color: var(--sa-accent);
}

.ck-list {
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 4px;
  margin-top: 14px;
  display: grid;
  gap: 14px;
}

.ck-card {
  position: relative;
  border-radius: 16px;
  padding: 16px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: visible;
}

.ck-card::before {
  display: none;
}

.ck-title {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 11px;
  font-weight: 700;
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  border: 1px solid var(--sa-border-green);
  padding: 3px 10px;
  border-radius: 999px;
  max-width: 68%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ck-ncc-wrap {
  margin-top: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  text-align: center;
}

.ck-ncc-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 8px;
  background: #ffffff;
  padding: 2px;
  border: 1px solid var(--sa-border);
}

.ck-ncc {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--sa-heading);
  line-height: 1.2;
  white-space: nowrap;
}

.ck-qr-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  margin: 2px 0;
  background: transparent;
}

.ck-qr {
  width: min(216px, 68vw);
  aspect-ratio: 1 / 1;
  height: auto;
  border-radius: 14px;
  background: #ffffff;
  padding: 8px;
  border: 1px solid var(--sa-border);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  transition: transform 0.2s ease;
}

.ck-qr:hover {
  transform: scale(1.02);
}

.ck-amount {
  margin: 2px auto;
  padding: 6px 14px;
  display: inline-block;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: var(--sa-accent);
  border-radius: 999px;
  white-space: nowrap;
}

.ck-note {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.ck-info {
  margin-top: auto;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--sa-text);
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: 12px;
  padding: 10px 12px;
  white-space: pre-line;
}

.ck-shop {
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-muted);
  text-align: center;
}

.ck-empty {
  padding: 14px;
  border-radius: 12px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  color: var(--sa-muted);
  font-size: 13px;
}

@media (max-width: 980px) {
  .ck-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .ck-list { grid-template-columns: 1fr; max-height: 70vh; }
}

.ck-list::-webkit-scrollbar { width: 6px; }
.ck-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 999px;
}
.ck-list::-webkit-scrollbar-track { background: transparent; }

/* ===== HÀNG NÚT QR BANKING + KHUYẾN MÃI ===== */
.cart-ck-km-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.ck-btn-inline {
  flex-shrink: 0;
  width: auto;
  border-radius: 8px;
  padding: 5px 10px;
  font-weight: 600;
  font-family: inherit;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  border: 1px solid var(--sa-border);
  box-shadow: none;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.ck-btn-inline i {
  font-size: 14px;
  color: var(--sa-accent);
}

.ck-btn-inline:hover {
  border-color: var(--sa-accent);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
}

.ck-btn-inline:active {
  transform: scale(0.98);
}

.ck-btn-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.km-inline {
  flex: 1;
  margin: 0;
  text-align: right;
  font-size: 12px;
  color: var(--sa-price);
  font-weight: 600;
}

.categories .cat {
  position: relative;
  padding-left: 26px;
}

.categories .cat::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 14px;
  border-radius: 4px;
  background: var(--sa-accent);
  opacity: 0.85;
}

.categories .cat.active::before {
  background: #ffffff;
}

/* ===== OUT OF STOCK CARD STATE ===== */
.card-border.out {
  animation: none !important;
  background: var(--sa-surface);
  border-color: var(--sa-border);
  filter: none;
  opacity: 0.72;
}

.card-border.out:hover {
  transform: none;
  box-shadow: var(--sa-card-shadow);
}

.card-border.out .card-img-wrap img {
  filter: grayscale(0.45);
}

.card-img-wrap {
  position: relative;
}

/* ===== FLOATING DISCOUNT PILL (TOP-LEFT) ===== */
.discount-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  right: auto;
  width: auto;
  height: auto;
  border: none;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--sa-sale);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
  z-index: 3;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.28);
}

.discount-tag span {
  position: static;
  transform: none;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  white-space: nowrap;
  text-shadow: none;
}

.price-discount {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.price-old {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--sa-muted);
  text-decoration: line-through;
}

.modal-price.price-discount {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}

.modal-price .price-old {
  font-size: 13.5px;
  color: var(--sa-muted);
  text-decoration: line-through;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
/* ===== SALE CATEGORY ?" SIMPLE ===== */
.cat.sale {
  background: linear-gradient(135deg, #ef4444, #b91c1c, #ef4444);
  background-size: 200% 200%;
  color: #ffffff;
  font-weight: 800;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 999px;
  padding: 6px 14px;
  line-height: 1;

  /* o" Anh `A"n ch_ */
  text-shadow:
    0 0 2px rgba(255,255,255,0.6),
    0 0 6px rgba(255,255,255,0.35);

  box-shadow:
    0 10px 24px rgba(239, 68, 68, 0.32),
    0 0 0 2px rgba(239, 68, 68, 0.18);

  animation: saleGlow 2.2s ease-in-out infinite;
}



.cat.sale:hover {
  background-position: 100% 50%;
  box-shadow:
    0 12px 28px rgba(239, 68, 68, 0.4),
    0 0 0 4px rgba(239, 68, 68, 0.22);

}

.cat.sale.active {
  outline: 2px solid #dc2626;
  outline-offset: 2px;
  box-shadow:
    0 12px 28px rgba(239, 68, 68, 0.4),
    0 0 0 4px rgba(239, 68, 68, 0.22);
}

@keyframes saleGlow {
  0% {
    background-position: 0% 50%;
    transform: translateY(0);
  }
  50% {
    background-position: 100% 50%;
    transform: translateY(-1px);
  }
  100% {
    background-position: 0% 50%;
    transform: translateY(0);
  }
}


/* SALE tag desktop: red background, white text with animated shine */
@media (min-width: 769px) {
  .sidebar-left .categories .cat.sale {
    background: linear-gradient(120deg, #ef4444 0%, #b91c1c 55%, #ef4444 100%);
    color: #ffffff;
    border-color: rgba(239, 68, 68, 0.55);
    box-shadow:
      0 12px 26px rgba(239, 68, 68, 0.35),
      0 0 0 2px rgba(239, 68, 68, 0.2);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    position: relative;
    overflow: hidden;
  }

  .sidebar-left .categories .cat.sale::before {
    background: #ffffff;
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.35);
  }

  .sidebar-left .categories .cat.sale::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      transparent 0%,
      rgba(255, 255, 255, 0.32) 40%,
      rgba(255, 255, 255, 0.08) 55%,
      transparent 70%
    );
    transform: translateX(-120%);
    animation: saleShimmer 2.4s ease-in-out infinite;
    pointer-events: none;
  }
}

@keyframes saleShimmer {
  0% { transform: translateX(-120%); }
  55% { transform: translateX(120%); }
  100% { transform: translateX(140%); }
}

/* ===== SALE BADGE (MOBILE CATEGORY) ===== */
.category-btn-wrap {
  position: relative;
}

.sale-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: var(--sa-sale);
  color: #ffffff;
  font-size: 8.5px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 999px;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(225, 29, 72, 0.25);
}

/* ===== COPY GUIDE MODAL ===== */
.copy-guide-modal {
  width: 440px;
  max-width: 92%;
  padding: 24px;
  text-align: center;
}

.guide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.platform-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.guide-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--sa-heading);
  margin: 0;
  line-height: 1.35;
}

.guide-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 11px 12px;
  background: var(--sa-surface-2);
  border-radius: 12px;
  border: 1px solid var(--sa-border);
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--sa-text);
}

.step-text strong {
  color: var(--sa-heading);
  font-weight: 700;
}

.order-preview {
  width: 100%;
  padding: 12px;
  background: var(--sa-surface-2);
  border-radius: 12px;
  border: 1px solid var(--sa-border);
}

.preview-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--sa-muted);
  margin-bottom: 6px;
  text-align: left;
}

.preview-text {
  font-size: 12.5px;
  color: var(--sa-text);
  line-height: 1.5;
  max-height: 64px;
  overflow: hidden;
  text-align: left;
}

.open-app-btn {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: #0068ff;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(0, 104, 255, 0.25);
  transition: background-color 0.16s ease, transform 0.12s ease;
}

.open-app-btn:hover {
  background: #0055d4;
}

.open-app-btn:active {
  transform: scale(0.98);
}

.copy-again-btn {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--sa-border-strong);
  border-radius: 11px;
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.copy-again-btn:hover {
  background: var(--sa-surface-2);
  border-color: var(--sa-accent);
}

/* ===== POWERED BY - MOBILE MINIMAL PILL ===== */
.powered-by-mobile-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 22px auto 8px;
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--sa-muted);
  text-shadow: none;
  text-transform: none;
  box-shadow: none;
  width: fit-content;
}

.powered-by-mobile-footer::before,
.powered-by-mobile-footer::after,
.powered-by-mobile-footer .powered-link::before,
.powered-by-mobile-footer .powered-link::after {
  display: none;
}

.powered-by-mobile-footer .powered-link {
  position: relative;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-weight: 700;
  text-decoration: none;
  font-size: 11px;
  letter-spacing: 0.03em;
  border: 1px solid var(--sa-border-green);
  box-shadow: none;
  text-shadow: none;
}

@media (min-width: 769px) {
  .powered-by-mobile-footer {
    display: none !important;
  }
}

/* EXPAND CART BTN */
.expand-cart-btn {
  background: transparent;
  border: none;
  color: var(--sa-accent);
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: background-color 0.16s ease, color 0.16s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-cart-btn:hover {
  background: var(--sa-surface-soft);
  color: var(--sa-price);
}
</style>

<style>
/* ========================================================
   SUBTLE FAST ENTRANCE (NO WATERFALL LAG)
   ======================================================== */
@keyframes slideInUpMenu {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.sidebar-right,
.mobile-header-clean,
.notice-bar,
.banner,
.menu,
.pagination {
  animation: slideInUpMenu 0.22s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  text-decoration: none;
}

.sidebar-right       { animation-delay: 0s; }
.mobile-header-clean { animation-delay: 0s; }
.notice-bar          { animation-delay: 0.02s; }
.banner              { animation-delay: 0.03s; }
.menu                { animation-delay: 0.05s; }
.pagination          { animation-delay: 0.06s; }

.main-skeleton {
  animation: none !important;
}

/* ===== MODAL GIỎ TRỐNG ===== */
.empty-cart-modal {
  max-width: 370px !important;
  text-align: center;
  padding: 28px 22px !important;
}

.empty-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  color: var(--sa-muted);
  opacity: 0.7;
}

.empty-title {
  color: var(--sa-heading);
  font-size: 16.5px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0;
}

.empty-close-btn {
  width: 100%;
  padding: 10px 14px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  border-radius: 10px;
  color: var(--sa-heading);
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease;
  margin-top: 8px;
}

.empty-close-btn:hover {
  background: var(--sa-border);
}

/* ===== REALTIME GROUP CART & RECEIPT SIDEBAR UI ===== */
.cart-header-zone {
  flex-shrink: 0;
}

.cart-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  padding-right: 0;
  flex-wrap: nowrap;
  min-height: 32px;
}

@media (max-width: 768px) {
  .cart-top-header {
    padding-right: 0;
  }
}

.cart-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cart-hdr-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.cart-hdr-icon-btn:hover {
  background: var(--sa-surface-soft);
  border-color: var(--sa-accent);
  color: var(--sa-price);
}

.cart-hdr-icon-btn.close {
  border-color: var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-muted);
}

.cart-hdr-icon-btn.close:hover {
  background: rgba(225, 29, 72, 0.1);
  border-color: rgba(225, 29, 72, 0.3);
  color: var(--sa-sale);
}

.cart-top-title,
.cart-top-title span:not(.order-count) {
  color: var(--sa-heading);
  font-weight: 700;
  font-size: 15.5px;
  letter-spacing: -0.01em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 0;
}

.cart-top-title i {
  color: var(--sa-accent);
  font-size: 17px;
}

.cart-top-title .order-count {
  margin-left: 1px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--sa-muted);
}

.group-invite-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  box-shadow: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.group-invite-btn span {
  color: inherit;
}

.group-invite-btn:hover,
.group-invite-btn.copied {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.live-order-banner {
  border-radius: 11px;
  padding: 9px 11px;
  margin-bottom: 10px;
  font-size: 12px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.live-order-banner.pending {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.32);
  color: #b45309;
}

.live-order-banner.approved {
  background: var(--sa-surface-soft);
  border-color: var(--sa-border-green);
  color: var(--sa-price);
}

.lob-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.lob-code {
  font-weight: 700;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lob-actions {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.lob-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-heading);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.lob-new-btn {
  padding: 3px 9px;
  border-radius: 6px;
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.lob-status-text {
  font-weight: 600;
  line-height: 1.35;
  display: flex;
  align-items: center;
  gap: 4px;
}

.lob-locked-hint {
  font-size: 11px;
  opacity: 0.85;
  line-height: 1.35;
}

.group-member-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  margin-bottom: 10px;
  border-radius: 10px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  transition: border-color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
}

.group-member-bar:focus-within {
  background: var(--sa-surface);
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.group-member-bar i {
  color: var(--sa-muted);
  font-size: 15px;
  flex-shrink: 0;
}

.group-member-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--sa-heading);
  background: transparent;
}

.group-member-input::placeholder {
  color: var(--sa-muted);
  font-weight: 400;
}

.cart-qty-author-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.cart-author-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-size: 11px;
  font-weight: 600;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-author-tag.shop {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.cart-row.locked {
  cursor: default;
  opacity: 0.9;
}

.cart-pay-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
}

.cart-pay-btn {
  padding: 7px 8px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--sa-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.cart-pay-btn:hover:not(.active) {
  color: var(--sa-heading);
}

.cart-pay-btn.active {
  background: var(--sa-surface);
  border-color: var(--sa-border);
  color: var(--sa-price);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.cart-pay-btn.transfer.active {
  background: var(--sa-surface);
  border-color: var(--sa-border);
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.new-order-finish-btn {
  background: #0284c7 !important;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.24) !important;
}

.chat-shop-secondary-btn {
  margin-top: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--sa-border);
  background: transparent;
  color: var(--sa-muted);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.chat-shop-secondary-btn:hover {
  background: var(--sa-surface-2);
  border-color: var(--sa-border-strong);
  color: var(--sa-heading);
}

/* ===== JOIN GROUP MODAL ===== */
.join-group-modal {
  max-width: 370px !important;
  padding: 26px 22px !important;
  text-align: center;
}

.join-group-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.join-group-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-group-title {
  margin: 4px 0 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--sa-heading);
}

.join-group-desc {
  margin: 0;
  font-size: 13px;
  color: var(--sa-muted);
  line-height: 1.5;
}

.join-group-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--sa-input-border);
  background: var(--sa-input-bg);
  color: var(--sa-heading);
  font-size: 14px;
  font-weight: 500;
  outline: none;
  text-align: center;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.join-group-input:focus {
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.join-group-btn {
  width: 100%;
  padding: 11px 14px;
  border-radius: 10px;
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.16s ease;
}

.join-group-btn:hover {
  background: var(--sa-accent-hover);
}

/* ===== LIVE TOAST ===== */
.sa-live-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10050;
  padding: 10px 18px;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.28);
  max-width: 92vw;
}

.sa-live-toast i {
  color: #34d399;
}

.sa-live-toast.warn {
  background: #92400e;
}

.sa-live-toast.warn i {
  color: #fcd34d;
}

.sa-live-toast.info {
  background: #1e3a8a;
}

.sa-live-toast.info i {
  color: #93c5fd;
}

.sa-toast-fade-enter-active,
.sa-toast-fade-leave-active {
  transition: all 0.22s ease;
}

.sa-toast-fade-enter-from,
.sa-toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* ===== MEMBER CATEGORY SECTIONS, 2-COL CART ITEMS & STICKY CHECKOUT ===== */
@media (min-width: 769px) {
  .sidebar-right:not(.collapsed) {
    overflow: hidden;
  }

  .sidebar-right .cart-box {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 15px 15px 14px;
  }

  .cart-scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 3px;
    display: flex;
    flex-direction: column;
  }

  .delivery-accordion:not(.open) {
    position: sticky;
    bottom: 0;
    z-index: 4;
    margin-top: auto;
  }
}

@media (max-width: 768px) {
  .sidebar-right {
    top: var(--sa-mob-sheet-top, calc(48px + env(safe-area-inset-top, 0px))) !important;
    right: 0 !important;
    left: auto !important;
    bottom: calc(66px + env(safe-area-inset-bottom, 0px)) !important;
    height: auto !important;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 36px rgba(15, 23, 42, 0.24);
    overflow: hidden !important;
  }

  .sidebar-right .cart-box {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 14px 14px 12px !important;
  }

  .cart-scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-right: 2px;
    display: flex;
    flex-direction: column;
  }
}

.cart-box .cart-empty-placeholder,
.cart-box .cart-empty-placeholder span {
  color: var(--sa-muted);
}

.cart-empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  margin-bottom: 10px;
  border-radius: 12px;
  border: 1px dashed var(--sa-border-strong);
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  font-size: 12.5px;
  font-weight: 500;
  text-align: center;
}

.cart-empty-placeholder i {
  font-size: 26px;
  color: var(--sa-muted);
  opacity: 0.55;
}

.gmb-role-pill {
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.gmb-role-pill.host {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.gmb-role-pill.guest {
  background: var(--sa-surface-soft);
  color: var(--sa-price);
}

.cart-member-group {
  background: var(--sa-surface);
  border: 1px solid #0f764a;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: none;
}

.cart-member-group.is-host {
  border-color: #0f764a;
}

.cart-member-group.is-admin {
  border-color: #0f764a;
}

.cart-member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 8px 11px;
  background: #0f764a;
  border-bottom: 1px solid #0b5e3b;
  color: #ffffff;
}

.sa-storefront.theme-dark .cart-member-header {
  background: #0d6841;
  border-bottom-color: #094f31;
}

.cart-member-group.is-admin .cart-member-header {
  background: #0f764a;
  border-bottom-color: #0b5e3b;
}

.cm-header-left {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.cm-role-ico {
  font-size: 14px;
  color: #ffffff;
  flex-shrink: 0;
}

.cart-member-group.is-host .cm-role-ico {
  color: #fde68a;
}

.cart-member-group.is-admin .cm-role-ico {
  color: #ffffff;
}

.cart-member-group .cm-name {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-member-group .cm-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.cart-member-group .cm-badge.me {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.cart-member-group .cm-badge.host {
  background: rgba(254, 243, 199, 0.22);
  color: #fef3c7;
}

.cart-member-group .cm-badge.guest {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.cart-member-group .cm-badge.admin {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.cm-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
}

.cart-member-group .cm-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(254, 243, 199, 0.2);
  color: #fef3c7;
  white-space: nowrap;
  flex-shrink: 0;
}

.cart-member-group .cm-status-pill.done {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.cart-member-group .cm-summary {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  background: #ffffff;
  color: #0f764a;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.cart-member-group .cart-member-empty {
  padding: 12px;
  font-size: 12px;
  color: var(--sa-muted);
  text-align: center;
  background: var(--sa-surface);
}

.cart-member-items .cart-row {
  margin-bottom: 0;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid var(--sa-border);
}

.cart-member-items .cart-row:last-child {
  border-bottom: none;
}

/* ===== 2-COLUMN SIDEBAR CART ITEM ROW ===== */
.cart-row.sidebar-cart-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px 11px;
}

.sc-thumb {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc-thumb-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--sa-border);
  background: var(--sa-img-bg);
}

.sidebar-cart-row .sc-thumb-idx {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  color: var(--sa-muted);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sc-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.sidebar-cart-row .cart-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--sa-heading);
  line-height: 1.35;
}

.sc-remove-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--sa-muted);
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.sc-remove-btn:hover {
  background: rgba(225, 29, 72, 0.12);
  color: var(--sa-sale);
}

.sc-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sc-qty-unit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex-wrap: wrap;
}

.sidebar-cart-row .sc-qty-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  color: var(--sa-heading);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.35;
}

.sidebar-cart-row .sc-unit-price {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--sa-muted);
}

.sidebar-cart-row .sc-unit-price.discounted {
  color: var(--sa-sale);
}

.sidebar-cart-row .sc-subtotal {
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-heading);
  white-space: nowrap;
  flex-shrink: 0;
}

.sidebar-cart-row .cart-item-note {
  display: inline-flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 11px;
  line-height: 1.35;
  font-style: normal;
  font-weight: 500;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 6px;
  padding: 2px 7px;
  margin-top: 2px;
  width: fit-content;
  max-width: 100%;
}

.sidebar-cart-row .cart-item-note span {
  color: inherit;
}

.sidebar-cart-row .cart-item-note i {
  flex-shrink: 0;
  margin-top: 1px;
  color: #d97706;
}

.full-modal-member-group .cm-name {
  max-width: 260px;
}

/* ===== COLLAPSIBLE DELIVERY ACCORDION (HOST) ===== */
.delivery-accordion {
  border: 1px solid var(--sa-border);
  border-radius: 12px;
  background: var(--sa-surface);
  overflow: hidden;
  box-shadow: none;
  margin-top: 6px;
  flex-shrink: 0;
}

.delivery-accordion.missing {
  border-color: rgba(245, 158, 11, 0.45);
}

.da-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 11px;
  background: var(--sa-surface-2);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.16s ease;
}

.delivery-accordion.missing .da-header {
  background: rgba(245, 158, 11, 0.08);
}

.da-header:hover {
  background: var(--sa-surface-soft);
}

.da-header-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.da-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.da-ico {
  font-size: 14px;
  color: var(--sa-accent);
  flex-shrink: 0;
}

.delivery-accordion.missing .da-ico {
  color: #d97706;
}

.delivery-accordion .da-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-heading);
  white-space: nowrap;
}

.delivery-accordion.missing .da-title {
  color: #b45309;
}

.delivery-accordion .da-pay-pill {
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  white-space: nowrap;
  flex-shrink: 0;
}

.delivery-accordion .da-pay-pill.transfer {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.delivery-accordion .da-summary {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--sa-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delivery-accordion .da-summary.placeholder {
  color: #b45309;
  font-style: normal;
  font-weight: 500;
}

.da-toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  color: var(--sa-price);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.da-toggle-pill span {
  color: inherit;
}

.delivery-accordion.missing .da-toggle-pill,
.delivery-accordion.missing .da-toggle-pill span {
  border-color: rgba(245, 158, 11, 0.4);
  color: #b45309;
}

.da-body {
  padding: 11px 11px 12px;
  border-top: 1px solid var(--sa-border);
  background: var(--sa-surface);
}

/* ===== GUEST INFO AREA & STICKY FOOTER ===== */
.guest-info-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.cart-sticky-footer {
  flex-shrink: 0;
  padding-top: 10px;
  margin-top: 8px;
  border-top: 1px solid var(--sa-border);
  background: var(--sa-surface);
}

.cart-total-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.cart-total-expand-btn {
  width: 42px;
  min-width: 42px;
  border-radius: 11px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-price);
  font-size: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 0.16s ease, border-color 0.16s ease, transform 0.12s ease;
}

.cart-total-expand-btn:hover {
  background: var(--sa-surface-soft);
  border-color: var(--sa-accent);
  color: var(--sa-price);
  transform: translateY(-1px);
}

.cart-total-expand-btn:active {
  transform: scale(0.96);
}

.cart-sticky-footer .cart-ck-km-row {
  margin-top: 8px;
  margin-bottom: 0;
}

.cart-sticky-footer .finish-btn {
  margin-top: 8px;
  padding: 11px 12px;
  font-size: 14px;
}

.cart-sticky-footer .chat-shop-secondary-btn {
  margin-top: 6px;
  padding: 7px 10px;
}

.host-members-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  margin-bottom: 8px;
  border-radius: 9px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  font-size: 12px;
  color: var(--sa-heading);
}

.host-members-progress .hmp-left,
.host-members-progress .hmp-left span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--sa-heading);
}

.host-members-progress .hmp-left i {
  color: var(--sa-accent);
}

.host-members-progress .hmp-count {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  font-size: 11px;
  font-weight: 700;
}

.host-members-progress .hmp-count.all {
  background: var(--sa-accent);
  color: #ffffff;
}

.guest-delivery-preview {
  padding: 10px 12px;
  border-radius: 11px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: var(--sa-text);
}

.guest-delivery-preview .gdp-title,
.guest-delivery-preview .gdp-title span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--sa-heading);
  margin-bottom: 2px;
}

.guest-delivery-preview .gdp-title i {
  color: var(--sa-accent);
}

.guest-delivery-preview .gdp-row,
.guest-delivery-preview .gdp-row span {
  color: var(--sa-text);
}

.gdp-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}

.gdp-row i {
  color: var(--sa-muted);
  margin-top: 1px;
}

.guest-waiting-card,
.guest-waiting-card span {
  color: var(--sa-price);
}

.guest-waiting-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.4;
}

.guest-waiting-card i {
  font-size: 17px;
  color: var(--sa-accent);
  flex-shrink: 0;
}

.guest-finish-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.guest-edit-again-btn {
  margin-top: 8px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.guest-edit-again-btn:hover {
  background: var(--sa-surface-2);
  border-color: var(--sa-accent);
}

.guest-edit-mobile-btn {
  background: #0f766e !important;
}

/* =========================================================
   100% FULL-SCREEN 2-COLUMN CHECKOUT WORKSPACE
   ========================================================= */
.modal-overlay.full-cart-overlay {
  background: var(--sa-bg);
  padding: 0 !important;
  inset: 0;
}

.modal-card.full-checkout-modal {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  max-height: 100vh !important;
  max-height: 100dvh !important;
  padding: 0;
  border-radius: 0 !important;
  border: none !important;
  background: var(--sa-bg);
  color: var(--sa-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: none;
}

.fcm-header {
  flex-shrink: 0;
  padding: 15px 22px;
  background: var(--sa-surface);
  border-bottom: 1px solid var(--sa-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.fcm-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.fcm-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--sa-heading);
}

.fcm-title-wrap i {
  color: var(--sa-accent);
  font-size: 19px;
}

.fcm-count-pill {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 12px;
  font-weight: 600;
}

.fcm-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
}

.fcm-live-pill.pending {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
  color: #b45309;
}

.fcm-live-pill.approved {
  background: var(--sa-surface-soft);
  border-color: var(--sa-border-green);
  color: var(--sa-price);
}

.fcm-live-sep {
  opacity: 0.5;
}

.fcm-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.fcm-invite-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.fcm-new-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.fcm-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.fcm-close-btn:hover {
  background: rgba(225, 29, 72, 0.1);
  border-color: rgba(225, 29, 72, 0.3);
  color: var(--sa-sale);
}

.fcm-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(340px, 1fr);
  overflow: hidden;
}

/* LEFT PANE: MEMBER CATEGORIES & ITEMS */
.fcm-left-pane {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--sa-border);
}

.fcm-member-bar {
  padding: 8px 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
  background: var(--sa-surface);
}

.fcm-empty {
  flex: 1;
  min-height: 200px;
  margin-bottom: 0;
  background: var(--sa-surface);
}

.fcm-groups-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}

.fcm-groups-scroll::-webkit-scrollbar {
  width: 5px;
}

.fcm-groups-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 999px;
}

.fcm-items-list {
  display: flex;
  flex-direction: column;
}

.fcm-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--sa-border);
  transition: background-color 0.15s ease;
}

.fcm-item-row:last-child {
  border-bottom: none;
}

.fcm-item-row:hover {
  background: var(--sa-surface-2);
}

.fcm-item-thumb {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.fcm-thumb-img {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--sa-border);
  background: var(--sa-img-bg);
}

.fcm-thumb-idx {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  color: var(--sa-muted);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fcm-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.fcm-item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--sa-heading);
  line-height: 1.35;
}

.fcm-item-price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.fcm-unit-price {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--sa-muted);
}

.fcm-unit-price.discounted {
  color: var(--sa-sale);
}

.fcm-edit-note-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.fcm-edit-note-btn:hover {
  border-color: var(--sa-accent);
  color: var(--sa-price);
  background: var(--sa-surface-soft);
}

.fcm-note-tag {
  display: inline-flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 6px;
  padding: 2px 8px;
  width: fit-content;
  max-width: 100%;
}

.fcm-item-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.fcm-stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.fcm-step-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-accent);
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease;
}

.fcm-step-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(5, 150, 105, 0.24);
}

.fcm-step-btn:active {
  transform: scale(0.9);
}

.fcm-step-val {
  min-width: 26px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-heading);
}

.fcm-item-subtotal {
  min-width: 86px;
  text-align: right;
  font-size: 14px;
  font-weight: 700;
  color: var(--sa-heading);
  white-space: nowrap;
}

.fcm-remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
}

/* RIGHT PANE: EXPANDED DELIVERY FORM + CHECKOUT FOOTER */
.fcm-right-pane {
  background: var(--sa-surface);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.fcm-form-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}

.fcm-section-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--sa-heading);
  text-transform: none;
  letter-spacing: -0.01em;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--sa-border);
}

.fcm-section-heading i {
  color: var(--sa-accent);
  font-size: 16px;
}

.fcm-form-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fcm-locked-box {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.28);
  color: #b45309;
  font-size: 12.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fcm-checkout-footer {
  flex-shrink: 0;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--sa-border);
  background: var(--sa-surface);
}

.fcm-banking-promo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.fcm-transfer-est {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-price);
}

.fcm-grand-total {
  padding: 11px 14px;
  margin: 0 0 12px;
  border-radius: 12px;
}

.fcm-submit-btn {
  margin-top: 0 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.fcm-chat-btn {
  margin-top: 8px;
}

/* RESPONSIVE FULL CHECKOUT MODAL ON MOBILE / SMALL TABLETS */
@media (max-width: 860px) {
  .modal-overlay.full-cart-overlay {
    align-items: flex-end !important;
    justify-content: center !important;
    padding: var(--sa-mob-sheet-top, calc(48px + env(safe-area-inset-top, 0px))) 0 0 !important;
    background: rgba(15, 23, 42, 0.52) !important;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .modal-card.full-checkout-modal {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100% !important;
    max-height: 100% !important;
    border-radius: 20px 20px 0 0 !important;
    box-shadow: 0 -10px 36px rgba(15, 23, 42, 0.28) !important;
  }

  .fcm-header {
    padding: 12px 14px;
    border-radius: 20px 20px 0 0;
  }

  .fcm-header.is-mobile-header {
    position: relative;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px 14px 10px;
  }

  .fcm-header.is-mobile-header .fcm-header-left {
    padding-right: 42px;
    flex-wrap: nowrap;
    gap: 8px;
  }

  .fcm-header.is-mobile-header .fcm-back-menu-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    justify-content: center;
    flex-shrink: 0;
  }

  .fcm-header.is-mobile-header .fcm-close-btn {
    position: absolute;
    top: 10px;
    right: 12px;
    width: 32px;
    height: 32px;
    z-index: 2;
  }

  .fcm-header.is-mobile-header .fcm-header-right {
    margin-left: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .fcm-header.is-mobile-header .fcm-header-right::-webkit-scrollbar {
    display: none;
  }

  .fcm-header.is-mobile-header .fcm-live-pill,
  .fcm-header.is-mobile-header .fcm-invite-btn,
  .fcm-header.is-mobile-header .fcm-new-btn {
    flex-shrink: 0;
    white-space: nowrap;
    height: 30px;
    padding: 0 11px;
    font-size: 12px;
  }

  .fcm-title-wrap {
    font-size: 15px;
    min-width: 0;
  }

  .fcm-body {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .fcm-left-pane {
    flex: 0 0 auto;
    overflow: visible;
    border-right: none;
    border-bottom: 1px solid var(--sa-border);
    padding: 12px;
  }

  .fcm-groups-scroll {
    overflow: visible;
    padding-right: 0;
  }

  .fcm-item-row {
    flex-wrap: wrap;
    padding: 10px;
  }

  .fcm-item-controls {
    width: 100%;
    justify-content: flex-end;
    padding-top: 4px;
  }

  .fcm-right-pane {
    flex: 0 0 auto;
    overflow: visible;
  }

  .fcm-form-scroll {
    overflow: visible;
    padding: 14px 12px;
  }

  .fcm-body.is-mobile-form-only {
    overflow: hidden;
  }

  .fcm-body.is-mobile-form-only .fcm-right-pane {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .fcm-body.is-mobile-form-only .fcm-form-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 14px 14px 16px;
  }

  .fcm-checkout-footer {
    position: sticky;
    bottom: 0;
    z-index: 5;
    padding: 12px 12px calc(14px + env(safe-area-inset-bottom));
    box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.08);
  }
}

/* =========================================================
   DARK MODE SEMANTIC TUNING (AMBER / BLUE PILLS & MODALS)
   ========================================================= */
.sa-storefront.theme-dark .live-order-banner.pending,
.sa-storefront.theme-dark .fcm-live-pill.pending,
.sa-storefront.theme-dark .fcm-locked-box,
.sa-storefront.theme-dark .sidebar-cart-row .cart-item-note,
.sa-storefront.theme-dark .fcm-note-tag {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.32);
}

.sa-storefront.theme-dark .gmb-role-pill.host,
.sa-storefront.theme-dark .cart-member-group .cm-badge.host,
.sa-storefront.theme-dark .cart-member-group .cm-status-pill:not(.done),
.sa-storefront.theme-dark .host-members-progress .hmp-count:not(.all) {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.16);
}

.sa-storefront.theme-dark .delivery-accordion.missing .da-title,
.sa-storefront.theme-dark .delivery-accordion .da-summary.placeholder,
.sa-storefront.theme-dark .delivery-accordion.missing .da-toggle-pill,
.sa-storefront.theme-dark .delivery-accordion.missing .da-toggle-pill span {
  color: #fbbf24;
}

.sa-storefront.theme-dark .cart-author-tag.shop,
.sa-storefront.theme-dark .cart-member-group .cm-badge.admin,
.sa-storefront.theme-dark .delivery-accordion .da-pay-pill.transfer {
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.2);
}

.sa-storefront.theme-dark .cart-pay-btn.transfer.active {
  color: #60a5fa;
}

.sa-storefront.theme-dark .modal-card:not(.lang-modal):not(.full-checkout-modal) {
  background: var(--sa-surface);
  color: var(--sa-text);
  border-color: var(--sa-border);
}

.sa-storefront.theme-dark .modal-card.modal-wide .modal-left,
.sa-storefront.theme-dark .modal-card.modal-wide .modal-left .modal-img {
  background: var(--sa-img-bg);
}

.sa-storefront.theme-dark .modal-title,
.sa-storefront.theme-dark .qty-title {
  color: var(--sa-heading);
}

.sa-storefront.theme-dark .modal-desc {
  color: var(--sa-muted);
}

.sa-storefront.theme-dark .note-box input,
.sa-storefront.theme-dark .note-box textarea {
  background: var(--sa-input-bg) !important;
  border-color: var(--sa-input-border) !important;
  color: var(--sa-text) !important;
}

.sa-storefront.theme-dark .note-box label {
  color: var(--sa-muted) !important;
}

.sa-storefront.theme-dark .mobile-bottom-bar {
  background: var(--sa-bottom-bar-bg);
  border-top-color: var(--sa-border);
}

.sa-storefront.theme-dark .detail-sidebar {
  background: var(--sa-surface);
  color: var(--sa-text);
}

/* =========================================================
   MILESTONE FREESHIP & GIFT PROGRESS PROMOTION CARDS
   ========================================================= */
.milestone-promo-card {
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.92) 0%, rgba(255, 255, 255, 0.96) 100%);
  border: 1.5px solid rgba(16, 185, 129, 0.34);
  border-radius: 14px;
  padding: 11px 14px;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.08);
  transition: border-color 0.25s ease, background 0.25s ease;
}

.milestone-promo-card.is-all-unlocked {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #059669;
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.16);
}

.menu-milestone-bar {
  margin: 0 0 14px;
}

.cart-milestone-box {
  margin-bottom: 10px;
  padding: 9px 11px;
  border-radius: 12px;
}

.fcm-milestone-box {
  margin-bottom: 10px;
}

.mpc-top-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.mpc-icon-badge {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(5, 150, 105, 0.26);
}

.mpc-icon-badge.mini {
  width: 24px;
  height: 24px;
  font-size: 13px;
}

.mpc-headline {
  font-size: 13.5px;
  font-weight: 700;
  color: #065f46;
  line-height: 1.38;
}

.cart-milestone-box .mpc-headline {
  font-size: 12.5px;
}

.mpc-progress-track {
  margin-top: 8px;
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.16);
  overflow: hidden;
}

.cart-milestone-box .mpc-progress-track {
  margin-top: 6px;
  height: 6px;
}

.mpc-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.mpc-chips-row {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mpc-chips-row.compact {
  margin-top: 6px;
  gap: 5px;
}

.mpc-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.32);
  color: #475569;
  transition: all 0.2s ease;
}

.mpc-chip.mini {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.mpc-chip i {
  font-size: 13px;
  color: #059669;
}

.mpc-chip-target {
  font-weight: 600;
}

.mpc-chip-reward {
  font-weight: 700;
  color: #0f172a;
}

.mpc-chip.unlocked {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.24);
}

.mpc-chip.unlocked i,
.mpc-chip.unlocked .mpc-chip-reward {
  color: #ffffff;
}

/* DARK MODE SUPPORT FOR MILESTONE PROMO CARDS */
.sa-storefront.theme-dark .milestone-promo-card {
  background: linear-gradient(135deg, rgba(6, 78, 59, 0.42) 0%, rgba(15, 23, 42, 0.85) 100%);
  border-color: rgba(16, 185, 129, 0.38);
}

.sa-storefront.theme-dark .milestone-promo-card.is-all-unlocked {
  background: linear-gradient(135deg, rgba(6, 95, 70, 0.62) 0%, rgba(5, 150, 105, 0.28) 100%);
  border-color: #10b981;
}

.sa-storefront.theme-dark .mpc-headline {
  color: #6ee7b7;
}

.sa-storefront.theme-dark .mpc-progress-track {
  background: rgba(148, 163, 184, 0.2);
}

.sa-storefront.theme-dark .mpc-chip {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.25);
  color: #cbd5e1;
}

.sa-storefront.theme-dark .mpc-chip-reward {
  color: #f8fafc;
}

.sa-storefront.theme-dark .mpc-chip.unlocked {
  background: #059669;
  border-color: #10b981;
  color: #ffffff;
}

.sa-storefront.theme-dark .mpc-chip.unlocked .mpc-chip-reward {
  color: #ffffff;
}

.sa-storefront.theme-dark .mcb-promo-strip {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(16, 185, 129, 0.45);
}

.sa-storefront.theme-dark .mcb-promo-strip.unlocked {
  background: rgba(6, 78, 59, 0.94);
  border-color: #10b981;
}

.sa-storefront.theme-dark .mcb-promo-text {
  color: #6ee7b7;
}

.sa-storefront.theme-dark .mcb-promo-text i {
  color: #34d399;
}

/* =========================================================
   6-LAYER SUMMARY CART, SIMPLE FREESHIP, ORDER STATUS & QR SHARE MODAL
   ========================================================= */
.cart-group-top-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  margin-bottom: 10px;
  border-radius: 11px;
  border: 1.5px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.12s ease;
}

.cart-group-top-btn:hover:not(:disabled) {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.cart-group-top-btn:active:not(:disabled) {
  transform: scale(0.985);
}

.cart-group-top-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.cart-group-top-btn .cgt-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cart-group-top-btn .cgt-left i {
  font-size: 16px;
  flex-shrink: 0;
}

.cart-group-top-btn .cgt-title {
  font-size: 13.5px;
  font-weight: 700;
  color: inherit;
  white-space: nowrap;
}

.cart-group-top-btn .cgt-code-pill {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(5, 150, 105, 0.14);
  color: inherit;
}

.cart-group-top-btn:hover:not(:disabled) .cgt-code-pill {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.cart-group-top-btn .cgt-right {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 7px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.cart-group-top-btn:hover:not(:disabled) .cgt-right {
  background: rgba(255, 255, 255, 0.95);
  border-color: transparent;
  color: #047857;
}

/* SOLO FLAT ITEMS CONTAINER */
.cart-solo-items {
  border-radius: 12px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  overflow: hidden;
}

/* COLLAPSIBLE GROUP MEMBER HEADERS (1B) */
.clickable-member-header {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--sa-border);
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.clickable-member-header:hover {
  background: #0c623d;
}

.sa-storefront.theme-dark .clickable-member-header:hover {
  background: #0a5434;
}

.cart-member-group.is-collapsed .clickable-member-header {
  border-bottom-color: transparent;
}

.cm-header-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cm-chevron-ico {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.clickable-member-header:hover .cm-chevron-ico {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  color: #ffffff;
}

.cm-remove-member-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.24);
  border: 1px solid rgba(254, 202, 202, 0.45);
  color: #ffffff;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}

.cm-remove-member-btn:hover:not(:disabled) {
  background: #dc2626;
  border-color: #fca5a5;
  transform: scale(1.05);
}

.cm-remove-member-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

/* UNFINISHED GUESTS & REMOVE MEMBER MODALS */
.unfinished-guests-modal,
.confirm-remove-member-modal,
.guest-nudge-modal,
.kicked-member-modal {
  max-width: 430px;
  width: min(94vw, 430px);
  padding: 20px 18px 18px;
  border-radius: 16px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  color: var(--sa-text);
}

.ugm-icon-badge.nudge-pulse {
  animation: ugmNudgePulse 1.5s ease-in-out infinite;
}

@keyframes ugmNudgePulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.35);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 8px rgba(217, 119, 6, 0);
  }
}

.ugm-nudge-note {
  margin-top: 10px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-size: 11.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
}

.ugm-nudge-note span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  line-height: 1.35;
}

.ugm-nudge-again-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 7px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface);
  color: var(--sa-price);
  font-size: 11px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ugm-nudge-again-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.ugm-header {
  text-align: center;
  margin-bottom: 14px;
}

.ugm-icon-badge {
  width: 46px;
  height: 46px;
  margin: 0 auto 10px;
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #d97706;
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ugm-icon-badge.danger {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.32);
  color: #dc2626;
}

.ugm-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: var(--sa-heading);
}

.ugm-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--sa-muted);
}

.ugm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.ugm-member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 11px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
}

.ugm-member-info {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex: 1;
}

.ugm-member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ugm-member-text {
  min-width: 0;
  flex: 1;
}

.ugm-member-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--sa-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ugm-member-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--sa-muted);
}

.ugm-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  font-weight: 600;
  font-size: 10.5px;
}

.sa-storefront.theme-dark .ugm-status-tag {
  color: #fbbf24;
}

.ugm-remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 9px;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.28);
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  font-size: 11.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ugm-remove-btn:hover:not(:disabled) {
  background: #dc2626;
  color: #ffffff;
}

.ugm-remove-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.sa-storefront.theme-dark .ugm-remove-btn {
  color: #fca5a5;
  border-color: rgba(248, 113, 113, 0.35);
}

.ugm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ugm-wait-btn,
.ugm-proceed-btn,
.ugm-danger-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.ugm-wait-btn {
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
}

.ugm-wait-btn:hover {
  border-color: var(--sa-border-green);
  background: var(--sa-surface-soft);
}

.ugm-proceed-btn {
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
}

.ugm-proceed-btn:hover {
  background: #047857;
}

.ugm-danger-btn {
  border: none;
  background: #dc2626;
  color: #ffffff;
}

.ugm-danger-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.ugm-danger-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

/* SIMPLE FREESHIP BAR (COMPACT & CLEAN) */
.simple-freeship-bar {
  margin-top: 8px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.simple-freeship-bar.fcm-simple-freeship {
  margin: 0 0 8px;
}

.simple-freeship-bar.unlocked {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.13);
}

.simple-freeship-bar .sfb-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--sa-price);
  line-height: 1.35;
}

.simple-freeship-bar .sfb-text i {
  font-size: 14px;
  color: var(--sa-accent);
  flex-shrink: 0;
}

.simple-freeship-bar .sfb-track {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.18);
  overflow: hidden;
}

.simple-freeship-bar .sfb-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--sa-accent);
  transition: width 0.28s ease;
}

/* ORDER STATUS BUTTON (BELOW FREESHIP, ABOVE CONTINUE) */
.order-status-btn {
  margin-top: 8px;
  width: 100%;
  padding: 8px 11px;
  border-radius: 10px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-family: inherit;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.order-status-btn:hover:not(.in-full-modal) {
  border-color: var(--sa-border-strong);
}

.order-status-btn.in-full-modal {
  margin: 0 0 10px;
  cursor: default;
}

.order-status-btn .osb-left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--sa-muted);
  font-weight: 600;
  white-space: nowrap;
}

.order-status-btn .osb-left i {
  font-size: 14px;
}

.order-status-btn .osb-right {
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  color: var(--sa-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-status-btn.is-empty .osb-right {
  color: var(--sa-muted);
  font-weight: 600;
}

.order-status-btn.is-selecting {
  border-color: var(--sa-border-strong);
}

.order-status-btn.is-selecting .osb-left i,
.order-status-btn.is-selecting .osb-right {
  color: var(--sa-price);
}

.order-status-btn.is-group {
  background: var(--sa-surface-soft);
  border-color: var(--sa-border-green);
}

.order-status-btn.is-group .osb-left,
.order-status-btn.is-group .osb-right {
  color: var(--sa-price);
}

.order-status-btn.is-pending {
  background: rgba(245, 158, 11, 0.11);
  border-color: rgba(245, 158, 11, 0.34);
}

.order-status-btn.is-pending .osb-left,
.order-status-btn.is-pending .osb-right {
  color: #b45309;
}

.order-status-btn.is-approved {
  background: rgba(16, 185, 129, 0.14);
  border-color: #10b981;
}

.order-status-btn.is-approved .osb-left,
.order-status-btn.is-approved .osb-right {
  color: #047857;
}

.continue-full-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 100% FULL MODAL ENHANCEMENTS */
.fcm-back-menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 9px;
  border: 1px solid var(--sa-border-strong);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.fcm-back-menu-btn:hover {
  background: var(--sa-surface-soft);
  border-color: var(--sa-accent);
  color: var(--sa-price);
}

.fcm-group-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.fcm-group-toolbar .fcm-member-bar {
  flex: 1;
  min-width: 200px;
  margin-bottom: 0;
}

.fcm-expand-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.fcm-expand-all-btn:hover {
  background: var(--sa-surface-soft);
  border-color: var(--sa-accent);
  color: var(--sa-price);
}

.fcm-in-form-banking {
  margin-top: 14px;
  margin-bottom: 0;
  padding-top: 12px;
  border-top: 1px dashed var(--sa-border);
}

.fcm-grand-total {
  margin: 0 0 8px !important;
}

/* GROUP ORDER SHARE MODAL (QR + LINK) */
.modal-card.group-share-modal {
  width: min(410px, 92vw);
  max-width: 92vw;
  padding: 24px 20px 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: center;
}

.group-share-modal .modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gsm-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.gsm-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-accent);
  font-size: 23px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gsm-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 2px;
}

.gsm-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 800;
  color: var(--sa-heading);
}

.gsm-code-pill {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 12px;
  font-weight: 700;
}

.gsm-desc {
  margin: 0;
  font-size: 12.5px;
  color: var(--sa-muted);
  line-height: 1.45;
}

.gsm-qr-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gsm-qr-frame {
  padding: 12px;
  border-radius: 16px;
  background: #ffffff;
  border: 1.5px solid rgba(16, 185, 129, 0.35);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gsm-qr-loading {
  width: 220px;
  height: 220px;
  border-radius: 16px;
  background: var(--sa-surface-2);
  border: 1px dashed var(--sa-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gsm-spin {
  font-size: 28px;
  color: var(--sa-accent);
  animation: lazySpin 0.85s linear infinite;
}

.gsm-link-section {
  width: 100%;
}

.gsm-link-input-row {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.gsm-link-input {
  flex: 1;
  min-width: 0;
  padding: 9px 11px;
  border-radius: 10px;
  border: 1px solid var(--sa-input-border);
  background: var(--sa-surface-2);
  color: var(--sa-text);
  font-size: 12px;
  font-weight: 500;
  outline: none;
}

.gsm-copy-btn {
  padding: 9px 13px;
  border-radius: 10px;
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.16s ease, transform 0.12s ease;
}

.gsm-copy-btn:hover:not(:disabled) {
  background: var(--sa-accent-hover);
}

.gsm-copy-btn.copied {
  background: #047857;
}

.gsm-copy-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.gsm-name-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  text-align: left;
  padding-top: 4px;
  border-top: 1px solid var(--sa-border);
}

.gsm-name-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--sa-muted);
}

.gsm-name-input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--sa-input-border);
  background: var(--sa-input-bg);
  color: var(--sa-heading);
  font-size: 13.5px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.gsm-name-input:focus {
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.gsm-new-order-btn {
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--sa-border-strong);
  background: transparent;
  color: var(--sa-muted);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.gsm-new-order-btn:hover {
  background: var(--sa-surface-2);
  color: var(--sa-heading);
}

/* =========================================================
   INLINE QR BANKING, CHECKPOINT MILESTONES & 6-STAGE STATUS
   ========================================================= */
.cart-pay-inline-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex-wrap: wrap;
}

.cart-pay-inline-row .cart-pay-toggle {
  flex: 1 1 210px;
  min-width: 0;
}

.qr-banking-side-btn {
  padding: 0 13px;
  min-height: 38px;
  border-radius: 10px;
  border: 1.5px solid rgba(37, 99, 235, 0.42);
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.24);
  transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;
}

.qr-banking-side-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.34);
  filter: brightness(1.04);
}

.qr-banking-side-btn i {
  font-size: 15px;
}

.qr-banking-side-btn.mini {
  min-height: 26px;
  padding: 2px 9px;
  font-size: 11px;
  border-radius: 7px;
  margin-left: auto;
}

/* INLINE GROUP BUTTON ON CART HEADER ROW */
.cart-inline-group-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  gap: 5px;
}

.cart-inline-group-btn i {
  font-size: 14px;
}

.cart-inline-group-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* 24H DATE-TIME PICKER (GIỜ : PHÚT NGÀY/THÁNG/NĂM, NO AM/PM/SA/CH) */
.form-field.dt24-inline-field {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.dt24-inline-label {
  margin-bottom: 0 !important;
  white-space: nowrap;
  flex-shrink: 0;
}

.dt24-picker-row {
  flex: 1 1 260px;
  min-width: 0;
  min-height: 38px;
  padding: 4px 6px;
  border-radius: 9px;
  border: 1px solid var(--sa-input-border);
  background: var(--sa-input-bg);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.dt24-picker-row:focus-within {
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.dt24-picker-row.disabled {
  opacity: 0.65;
}

.dt24-segment.dt24-pill {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 2px 6px;
  height: 28px;
  border-radius: 7px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.dt24-segment.dt24-pill:focus-within {
  background: var(--sa-surface);
  border-color: var(--sa-accent);
}

.dt24-seg-ico {
  font-size: 13px;
  color: var(--sa-accent);
  margin-right: 3px;
  flex-shrink: 0;
}

.dt24-select {
  appearance: none;
  -webkit-appearance: none;
  border: none !important;
  background: transparent !important;
  padding: 2px 4px !important;
  margin: 0 !important;
  width: auto !important;
  min-width: 26px;
  text-align: center;
  text-align-last: center;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-heading);
  cursor: pointer;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 5px;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.dt24-select.empty {
  color: var(--sa-muted);
  font-weight: 500;
}

.dt24-select:hover:not(:disabled) {
  background: var(--sa-surface-soft) !important;
  color: var(--sa-price);
}

.dt24-select:focus:not(:disabled) {
  background: var(--sa-surface-soft) !important;
  color: var(--sa-price);
}

.dt24-select.dt24-year {
  min-width: 42px;
}

.dt24-select option {
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-weight: 500;
}

.dt24-sep {
  font-size: 12px;
  font-weight: 600;
  color: var(--sa-muted);
  user-select: none;
}

.dt24-quick-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.dt24-now-btn {
  height: 28px;
  padding: 0 9px;
  border-radius: 7px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.dt24-now-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.dt24-clear-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.dt24-clear-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: #dc2626;
}

/* MOBILE-FRIENDLY DELIVERY TIME PICKER (.is-mobile-dt24) */
.form-field.dt24-inline-field.is-mobile-dt24 {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.dt24-mobile-presets {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 1px;
}

.dt24-mobile-presets::-webkit-scrollbar {
  display: none;
}

.dt24-preset-chip {
  height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.dt24-preset-chip:active {
  transform: scale(0.96);
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.dt24-preset-chip.is-clear {
  width: 32px;
  padding: 0;
  justify-content: center;
  border-color: var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  font-size: 15px;
}

.is-mobile-dt24 .dt24-picker-row {
  flex: none;
  width: 100%;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  border-radius: 12px;
}

.is-mobile-dt24 .dt24-segment.dt24-pill {
  width: 100%;
  height: 44px;
  padding: 4px 10px;
  border-radius: 10px;
  gap: 6px;
  justify-content: flex-start;
}

.is-mobile-dt24 .dt24-seg-ico {
  font-size: 16px;
  margin-right: 2px;
}

.is-mobile-dt24 .dt24-select {
  flex: 1 1 0;
  min-width: 52px;
  height: 34px;
  padding: 0 18px 0 8px !important;
  background-color: var(--sa-surface) !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 4px center !important;
  background-size: 14px 14px !important;
  border: 1px solid var(--sa-border) !important;
  border-radius: 8px;
  font-size: 14.5px;
  font-weight: 700;
  text-align: center;
}

.is-mobile-dt24 .dt24-select.dt24-year {
  flex: 1.25 1 0;
  min-width: 68px;
}

.is-mobile-dt24 .dt24-sep {
  font-size: 15px;
  font-weight: 700;
}

/* CHECKPOINT MILESTONE PROGRESS BAR (NO FRAME, NO BADGES) */
.milestone-checkpoint-box {
  margin-top: 8px;
  padding: 2px 0;
  border: none;
  border-radius: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.milestone-checkpoint-box.fcm-checkpoint-box {
  margin: 0 0 8px;
  padding: 2px 0;
}

.milestone-checkpoint-box.unlocked {
  border: none;
  background: transparent;
}

.mcp-headline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--sa-price);
  line-height: 1.3;
  min-width: 0;
}

.mcp-headline i {
  font-size: 13.5px;
  color: var(--sa-accent);
  flex-shrink: 0;
}

.mcp-stepper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.mcp-rail-wrap {
  width: 100%;
  padding: 4px 5px;
}

.mcp-rail {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.28);
}

.mcp-rail-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.mcp-origin-dot {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.55);
  z-index: 2;
}

.mcp-origin-dot.active {
  background: #10b981;
}

.mcp-point {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--sa-surface);
  border: 2px solid var(--sa-border-strong);
  z-index: 2;
  transition: all 0.2s ease;
}

.mcp-point.is-next {
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
}

.mcp-point.is-unlocked {
  background: #10b981;
  border-color: #059669;
}

.mcp-checkpoints-grid {
  display: grid;
  width: 100%;
  padding: 0 2px;
  gap: 4px;
}

.mcp-cp-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  min-width: 0;
}

.mcp-cp-amount {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--sa-heading);
  line-height: 1.2;
  white-space: nowrap;
}

.mcp-cp-reward {
  font-size: 10px;
  font-weight: 500;
  color: var(--sa-muted);
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mcp-cp-col.is-next .mcp-cp-reward {
  color: var(--sa-heading);
  font-weight: 600;
}

.mcp-cp-col.is-unlocked .mcp-cp-amount,
.mcp-cp-col.is-unlocked .mcp-cp-reward {
  color: #059669;
  font-weight: 700;
}

/* GRAB-STYLE LIVE ORDER STATUS PROGRESS */
.grab-status-card {
  margin-top: 8px;
  width: 100%;
  padding: 9px 10px 8px;
  border-radius: 12px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-family: inherit;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.grab-status-card:hover:not(.in-full-modal) {
  border-color: var(--sa-accent);
}

.grab-status-card.in-full-modal {
  margin: 0 0 10px;
  cursor: default;
}

.grab-status-card.in-export-modal {
  margin: 8px 0 12px;
}

.gs-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.gs-status-main {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.gs-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00b14f;
  flex-shrink: 0;
  position: relative;
}

.gs-live-dot:not(.paused)::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  color: inherit;
  opacity: 0.6;
  animation: grabPulseRing 1.7s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.gs-main-ico {
  font-size: 14px;
  color: #00b14f;
  flex-shrink: 0;
}

.gs-status-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gs-step-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--sa-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.gs-stepper {
  position: relative;
  width: 100%;
}

.gs-rail {
  position: absolute;
  top: 11px;
  left: 10%;
  right: 10%;
  height: 3.5px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.28);
  overflow: hidden;
  z-index: 1;
}

.gs-rail-fill {
  position: relative;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #00b14f 0%, #10b981 100%);
  transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}

.gs-rail-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(-100%);
  animation: grabRailShimmer 1.8s ease-in-out infinite;
}

.gs-steps-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 2px;
}

.gs-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  min-width: 0;
}

.gs-node {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sa-surface);
  border: 1.5px solid var(--sa-border-strong);
  color: var(--sa-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.28s ease;
}

.gs-pulse-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #00b14f;
  opacity: 0;
  pointer-events: none;
  animation: grabPulseRing 1.7s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.gs-step.is-done .gs-node {
  background: #00b14f;
  border-color: #00b14f;
  color: #ffffff;
}

.gs-step.is-current .gs-node {
  background: #00b14f;
  border-color: #059669;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(0, 177, 79, 0.3);
  transform: scale(1.06);
}

.gs-step.is-shipping-active .gs-node i {
  animation: grabBikeRide 0.9s ease-in-out infinite;
}

.gs-label {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--sa-muted);
  line-height: 1.2;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gs-step.is-done .gs-label {
  color: #059669;
}

.gs-step.is-current .gs-label {
  color: var(--sa-heading);
  font-weight: 700;
}

/* State accent variants */
.grab-status-card.is-pending .gs-live-dot,
.grab-status-card.is-pending .gs-step.is-current .gs-node {
  background: #f59e0b;
  border-color: #d97706;
}

.grab-status-card.is-pending .gs-main-ico,
.grab-status-card.is-pending .gs-status-text {
  color: #b45309;
}

.grab-status-card.is-pending .gs-pulse-ring,
.grab-status-card.is-pending .gs-live-dot:not(.paused)::after {
  border-color: #f59e0b;
}

.grab-status-card.is-pending .gs-rail-fill {
  background: linear-gradient(90deg, #00b14f 0%, #f59e0b 100%);
}

.grab-status-card.is-shipping {
  background: rgba(79, 70, 229, 0.08);
  border-color: rgba(99, 102, 241, 0.35);
}

.grab-status-card.is-shipping .gs-live-dot,
.grab-status-card.is-shipping .gs-step.is-current .gs-node {
  background: #4f46e5;
  border-color: #4338ca;
  box-shadow: 0 3px 10px rgba(79, 70, 229, 0.32);
}

.grab-status-card.is-shipping .gs-main-ico,
.grab-status-card.is-shipping .gs-status-text,
.grab-status-card.is-shipping .gs-step.is-current .gs-label {
  color: #4338ca;
}

.grab-status-card.is-shipping .gs-pulse-ring,
.grab-status-card.is-shipping .gs-live-dot:not(.paused)::after {
  border-color: #6366f1;
}

.grab-status-card.is-shipping .gs-rail-fill {
  background: linear-gradient(90deg, #00b14f 0%, #4f46e5 100%);
}

.grab-status-card.is-completed {
  background: rgba(16, 185, 129, 0.12);
  border-color: #059669;
}

.grab-status-card.is-completed .gs-main-ico,
.grab-status-card.is-completed .gs-status-text,
.grab-status-card.is-completed .gs-step.is-current .gs-label {
  color: #047857;
}

.grab-status-card.is-completed .gs-rail-fill::after {
  animation: none;
  opacity: 0;
}

.grab-status-card.is-cancelled {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.38);
}

.grab-status-card.is-cancelled .gs-live-dot {
  background: #dc2626;
}

.grab-status-card.is-cancelled .gs-main-ico,
.grab-status-card.is-cancelled .gs-status-text {
  color: #dc2626;
}

.sa-storefront.theme-dark .grab-status-card.is-pending .gs-main-ico,
.sa-storefront.theme-dark .grab-status-card.is-pending .gs-status-text {
  color: #fbbf24;
}

.sa-storefront.theme-dark .grab-status-card.is-shipping {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(129, 140, 248, 0.4);
}

.sa-storefront.theme-dark .grab-status-card.is-shipping .gs-main-ico,
.sa-storefront.theme-dark .grab-status-card.is-shipping .gs-status-text,
.sa-storefront.theme-dark .grab-status-card.is-shipping .gs-step.is-current .gs-label {
  color: #a5b4fc;
}

.sa-storefront.theme-dark .grab-status-card.is-completed .gs-main-ico,
.sa-storefront.theme-dark .grab-status-card.is-completed .gs-status-text,
.sa-storefront.theme-dark .grab-status-card.is-completed .gs-step.is-done .gs-label,
.sa-storefront.theme-dark .grab-status-card.is-completed .gs-step.is-current .gs-label {
  color: #6ee7b7;
}

.sa-storefront.theme-dark .grab-status-card.is-cancelled {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(248, 113, 113, 0.4);
}

.sa-storefront.theme-dark .grab-status-card.is-cancelled .gs-main-ico,
.sa-storefront.theme-dark .grab-status-card.is-cancelled .gs-status-text {
  color: #fca5a5;
}

.cart-live-status-notice {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  margin-bottom: 8px;
  border-radius: 12px;
  border: 1px solid rgba(22, 163, 74, 0.25);
  background: rgba(22, 163, 74, 0.08);
  color: var(--sa-heading);
  text-align: left;
  cursor: pointer;
  flex-shrink: 0;
}

.cart-live-status-notice .clsn-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  background: rgba(22, 163, 74, 0.14);
  color: #15803d;
}

.cart-live-status-notice .clsn-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cart-live-status-notice .clsn-title {
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.25;
}

.cart-live-status-notice .clsn-sub {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--sa-muted);
}

.cart-live-status-notice .clsn-arrow {
  font-size: 18px;
  color: var(--sa-muted);
  flex-shrink: 0;
}

.cart-live-status-notice.is-pending {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(217, 119, 6, 0.3);
}

.cart-live-status-notice.is-pending .clsn-icon,
.cart-live-status-notice.is-pending .clsn-title {
  color: #b45309;
}

.cart-live-status-notice.is-pending .clsn-icon {
  background: rgba(245, 158, 11, 0.18);
}

.cart-live-status-notice.is-shipping {
  background: rgba(79, 70, 229, 0.09);
  border-color: rgba(99, 102, 241, 0.32);
}

.cart-live-status-notice.is-shipping .clsn-icon,
.cart-live-status-notice.is-shipping .clsn-title {
  color: #4338ca;
}

.cart-live-status-notice.is-shipping .clsn-icon {
  background: rgba(79, 70, 229, 0.16);
}

.cart-live-status-notice.is-completed {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.cart-live-status-notice.is-completed .clsn-icon,
.cart-live-status-notice.is-completed .clsn-title {
  color: #047857;
}

.cart-live-status-notice.is-completed .clsn-icon {
  background: rgba(16, 185, 129, 0.18);
}

.cart-live-status-notice.is-cancelled {
  background: rgba(239, 68, 68, 0.09);
  border-color: rgba(239, 68, 68, 0.28);
}

.cart-live-status-notice.is-cancelled .clsn-icon,
.cart-live-status-notice.is-cancelled .clsn-title {
  color: #dc2626;
}

.cart-live-status-notice.is-cancelled .clsn-icon {
  background: rgba(239, 68, 68, 0.16);
}

.sa-storefront.theme-dark .cart-live-status-notice.is-pending .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-pending .clsn-title {
  color: #fcd34d;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-shipping .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-shipping .clsn-title {
  color: #a5b4fc;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-completed .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-completed .clsn-title {
  color: #6ee7b7;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-cancelled .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-cancelled .clsn-title {
  color: #fca5a5;
}

.finish-btn.view-progress-finish-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #ffffff;
}

.finish-btn.pending-progress-finish-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: #ffffff;
  font-size: 13.5px;
  line-height: 1.25;
  padding: 10px 14px;
}

.finish-btn.mps-contact-shop-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #ffffff;
}

.modal-card.locked-order-contact-modal {
  max-width: 440px;
  width: min(92vw, 440px);
  padding: 22px 18px 18px;
  border-radius: 20px;
}

.locm-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.locm-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.locm-icon.is-preparing {
  background: rgba(16, 185, 129, 0.14);
  color: #059669;
}

.locm-icon.is-shipping {
  background: rgba(79, 70, 229, 0.14);
  color: #4f46e5;
}

.locm-title {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--sa-heading);
  line-height: 1.3;
}

.locm-desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--sa-muted);
}

.locm-channels {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--sa-border);
}

.locm-channels-lbl {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sa-heading);
  margin-bottom: 10px;
  text-align: center;
}

.locm-fallback-contact-btn {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.locm-footer-actions {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.locm-sec-btn {
  min-height: 40px;
  padding: 8px 10px;
  border-radius: 11px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.locm-sec-btn:hover {
  border-color: var(--sa-accent);
  background: var(--sa-surface-soft);
}

.sa-storefront.theme-dark .locm-icon.is-preparing {
  color: #34d399;
}

.sa-storefront.theme-dark .locm-icon.is-shipping {
  color: #a5b4fc;
}

@keyframes grabPulseRing {
  0% {
    transform: scale(0.92);
    opacity: 0.75;
  }
  70% {
    transform: scale(1.42);
    opacity: 0;
  }
  100% {
    transform: scale(1.42);
    opacity: 0;
  }
}

@keyframes grabRailShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(180%);
  }
}

@keyframes grabBikeRide {
  0%,
  100% {
    transform: translateX(-1px) translateY(0);
  }
  50% {
    transform: translateX(2px) translateY(-1.5px);
  }
}

/* 6-STAGE ORDER STATUS COLORS (SHIPPING / COMPLETED / CANCELLED) */
.order-status-btn.is-shipping {
  background: rgba(79, 70, 229, 0.11);
  border-color: rgba(99, 102, 241, 0.42);
}

.order-status-btn.is-shipping .osb-left,
.order-status-btn.is-shipping .osb-right {
  color: #4338ca;
}

.order-status-btn.is-completed {
  background: rgba(16, 185, 129, 0.16);
  border-color: #059669;
}

.order-status-btn.is-completed .osb-left,
.order-status-btn.is-completed .osb-right {
  color: #047857;
}

.order-status-btn.is-cancelled {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.42);
}

.order-status-btn.is-cancelled .osb-left,
.order-status-btn.is-cancelled .osb-right {
  color: #dc2626;
}

.fcm-live-pill.shipping {
  background: rgba(99, 102, 241, 0.14);
  border-color: rgba(99, 102, 241, 0.4);
  color: #4338ca;
}

.fcm-live-pill.completed {
  background: rgba(16, 185, 129, 0.16);
  border-color: rgba(16, 185, 129, 0.45);
  color: #047857;
}

.fcm-live-pill.cancelled {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.42);
  color: #dc2626;
}

.fcm-locked-box.is-shipping {
  background: rgba(99, 102, 241, 0.11);
  border-color: rgba(99, 102, 241, 0.35);
  color: #4338ca;
}

.fcm-locked-box.is-completed {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.38);
  color: #047857;
}

.fcm-locked-box.is-cancelled {
  background: rgba(239, 68, 68, 0.11);
  border-color: rgba(239, 68, 68, 0.38);
  color: #dc2626;
}

.chat-shop-secondary-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* DARK MODE OVERRIDES FOR NEW COMPONENTS */
.sa-storefront.theme-dark .simple-freeship-bar .sfb-text,
.sa-storefront.theme-dark .mcp-headline,
.sa-storefront.theme-dark .mcp-cp-col.is-unlocked .mcp-cp-amount,
.sa-storefront.theme-dark .mcp-cp-col.is-unlocked .mcp-cp-reward,
.sa-storefront.theme-dark .order-status-btn.is-approved .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-approved .osb-right,
.sa-storefront.theme-dark .order-status-btn.is-completed .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-completed .osb-right,
.sa-storefront.theme-dark .fcm-live-pill.completed,
.sa-storefront.theme-dark .fcm-locked-box.is-completed {
  color: #6ee7b7;
}

.sa-storefront.theme-dark .fcm-locked-box.is-completed {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.38);
}

.sa-storefront.theme-dark .order-status-btn.is-pending {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
}

.sa-storefront.theme-dark .order-status-btn.is-pending .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-pending .osb-right {
  color: #fbbf24;
}

.sa-storefront.theme-dark .order-status-btn.is-shipping,
.sa-storefront.theme-dark .fcm-live-pill.shipping,
.sa-storefront.theme-dark .fcm-locked-box.is-shipping {
  background: rgba(99, 102, 241, 0.18);
  border-color: rgba(129, 140, 248, 0.42);
  color: #a5b4fc;
}

.sa-storefront.theme-dark .order-status-btn.is-shipping .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-shipping .osb-right {
  color: #a5b4fc;
}

.sa-storefront.theme-dark .order-status-btn.is-cancelled,
.sa-storefront.theme-dark .fcm-live-pill.cancelled,
.sa-storefront.theme-dark .fcm-locked-box.is-cancelled {
  background: rgba(239, 68, 68, 0.17);
  border-color: rgba(248, 113, 113, 0.42);
  color: #fca5a5;
}

.sa-storefront.theme-dark .order-status-btn.is-cancelled .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-cancelled .osb-right {
  color: #fca5a5;
}

@media (max-width: 480px) {
  .gsm-link-input-row {
    flex-direction: column;
  }

  .fcm-back-menu-btn span {
    display: none;
  }

  .qr-banking-side-btn {
    width: 100%;
  }
}

/* =========================================================
   UNIFIED ORDER CONTENT MODAL (.export-modal / .exm-*)
   ========================================================= */
.modal-card.export-modal {
  width: min(820px, 94vw);
  max-width: 94vw;
  height: min(760px, 88vh);
  max-height: 90vh;
  padding: 22px 24px;
  border-radius: 20px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
  text-align: left;
}

.modal-card.export-modal .exm-close-btn {
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  color: var(--sa-muted);
  box-shadow: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.modal-card.export-modal .exm-close-btn:hover {
  background: rgba(225, 29, 72, 0.1);
  border-color: rgba(225, 29, 72, 0.3);
  color: var(--sa-sale);
}

.exm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 36px;
  flex-shrink: 0;
}

.exm-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-accent);
  font-size: 21px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exm-header-text {
  min-width: 0;
  flex: 1;
}

.exm-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-card.export-modal .exm-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: var(--sa-heading);
  letter-spacing: -0.01em;
}

.modal-card.export-modal .exm-code-pill {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 12.5px;
  font-weight: 700;
}

.modal-card.export-modal .exm-subtitle {
  margin: 3px 0 0;
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--sa-muted);
}

.modal-card.export-modal .exm-summary-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  font-size: 14px;
  color: var(--sa-text);
  flex-shrink: 0;
}

.modal-card.export-modal .exm-stat-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}

.modal-card.export-modal .exm-stat-item i {
  color: var(--sa-accent);
  font-size: 16px;
}

.modal-card.export-modal .exm-stat-item.is-price strong {
  color: var(--sa-price);
  font-size: 15.5px;
  font-weight: 800;
}

.exm-stat-dot {
  color: var(--sa-muted);
  opacity: 0.6;
}

.exm-saved-pill {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 11px;
  font-weight: 700;
}

.exm-content-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  border-radius: 14px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  overflow: hidden;
}

.exm-card-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--sa-border);
  background: var(--sa-surface);
  flex-shrink: 0;
}

.exm-card-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-heading);
}

.exm-card-label i {
  color: var(--sa-accent);
  font-size: 14px;
}

.exm-copy-inline-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 8px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.exm-copy-inline-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.exm-copy-inline-btn.copied {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.exm-textarea {
  width: 100%;
  min-height: 210px;
  max-height: 44vh;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: var(--sa-text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
  resize: none;
  outline: none;
  overflow-y: auto;
}

.modal-card.export-modal .exm-card-label {
  font-size: 13.5px;
}

.modal-card.export-modal .exm-card-label i {
  font-size: 16px;
}

.modal-card.export-modal .exm-copy-inline-btn {
  padding: 6px 13px;
  font-size: 13px;
}

.modal-card.export-modal .exm-textarea {
  flex: 1;
  min-height: 240px;
  max-height: none;
  height: 100%;
  padding: 14px 16px;
  font-size: 15px;
  line-height: 1.65;
}

.exm-textarea::-webkit-scrollbar {
  width: 6px;
}

.exm-textarea::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.45);
  border-radius: 999px;
}

.exm-send-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.exm-send-heading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-muted);
}

.exm-send-heading i {
  color: var(--sa-accent);
}

.exm-channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}

.exm-channels-grid.is-single {
  grid-template-columns: 1fr;
}

.exm-channel-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 13px;
  border-radius: 12px;
  border: none;
  background: var(--sa-accent);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.22);
  transition: background-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
}

.exm-channel-btn:hover {
  background: var(--sa-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.28);
}

.exm-channel-btn:active {
  transform: scale(0.98);
}

.exm-channel-img {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  object-fit: contain;
  background: #ffffff;
  padding: 2px;
  flex-shrink: 0;
}

.exm-channel-label {
  flex: 1;
  text-align: left;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exm-channel-arrow {
  font-size: 15px;
  opacity: 0.9;
  flex-shrink: 0;
}

.modal-card.export-modal .exm-send-heading {
  font-size: 13.5px;
}

.modal-card.export-modal .exm-channel-btn {
  padding: 12px 15px;
  font-size: 15px;
}

@media (max-width: 860px) {
  .modal-overlay.export-modal-overlay {
    align-items: flex-end !important;
    justify-content: center !important;
    padding: var(--sa-mob-sheet-top, calc(48px + env(safe-area-inset-top, 0px))) 0 0 !important;
  }

  .modal-overlay.export-modal-overlay .modal-card.export-modal {
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    padding: 24px 16px calc(18px + env(safe-area-inset-bottom, 0px));
    border-radius: 22px 22px 0 0 !important;
    gap: 11px;
    overflow: hidden;
  }

  .modal-card.export-modal .exm-close-btn {
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    font-size: 18px;
  }

  .modal-card.export-modal .exm-title {
    font-size: 18px;
  }

  .modal-card.export-modal .exm-textarea {
    min-height: 180px;
    max-height: none;
    height: 100%;
    font-size: 15px;
    line-height: 1.65;
    padding: 13px 14px;
  }

  .modal-card.export-modal .exm-saved-pill {
    margin-left: 0;
  }
}

/* =========================================================
   CONTACT MESSAGE ALLOWED BADGE (.contact-msg-badge)
   ========================================================= */
.dcp-name-row,
.ltd-contact-name-row,
.contact-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dcp-item.is-static,
.ltd-contact-card.is-static,
.contact-item.is-static {
  cursor: default;
}

.ltd-contact-card.is-msg-allowed {
  border-color: var(--sa-border-green);
}

.contact-msg-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  color: var(--sa-price);
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;
}

.contact-msg-badge i {
  font-size: 11px;
}

.contact-msg-badge.is-compact {
  padding: 1px 6px;
  font-size: 10px;
}

.ltd-contact-avatar-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.ltd-msg-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--sa-surface);
}

/* =========================================================
   MOBILE DEDICATED ORDER PROGRESS SHEET (.mob-progress-sheet)
   ========================================================= */
.mobile-sheet-backdrop.is-progress {
  z-index: 1004;
}

.mob-progress-sheet {
  position: fixed;
  top: calc(48px + env(safe-area-inset-top, 0px));
  left: 0;
  right: 0;
  bottom: calc(66px + env(safe-area-inset-bottom, 0px));
  background: var(--sa-bg);
  color: var(--sa-text);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 36px rgba(15, 23, 42, 0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1005;
}

.mps-header {
  flex-shrink: 0;
  height: 54px;
  padding: 0 12px;
  background: var(--sa-surface);
  border-bottom: 1px solid var(--sa-border);
  border-radius: 20px 20px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mps-back-btn,
.mps-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.mps-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.mps-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--sa-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mps-code-pill {
  font-size: 11px;
  font-weight: 800;
  color: var(--sa-accent);
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.mps-scroll-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mps-progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grab-status-card.in-progress-page {
  margin-top: 0;
  padding: 12px 12px 11px;
  border-radius: 16px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  cursor: default;
  gap: 10px;
}

.grab-status-card.in-progress-page .gs-status-text {
  font-size: 13.5px;
}

.grab-status-card.in-progress-page .gs-node {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

.grab-status-card.in-progress-page .gs-rail {
  top: 13px;
}

.grab-status-card.in-progress-page .gs-label {
  font-size: 10px;
}

.mps-saved-row {
  display: flex;
  justify-content: flex-start;
}

.mps-status-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.28);
  color: #065f46;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.45;
}

.sa-storefront.theme-dark .mps-status-notice {
  color: #a7f3d0;
}

.mps-status-notice.is-cancelled {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.28);
  color: #b91c1c;
}

.sa-storefront.theme-dark .mps-status-notice.is-cancelled {
  color: #fca5a5;
}

.mps-status-notice i {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.mps-card {
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: 16px;
  padding: 12px 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.mps-empty-card {
  align-items: center;
  text-align: center;
  padding: 24px 16px;
}

.mps-empty-ico {
  font-size: 32px;
  color: var(--sa-accent);
}

.mps-empty-text {
  margin: 0;
  font-size: 13px;
  color: var(--sa-muted);
  line-height: 1.5;
}

.mps-browse-btn {
  width: 100%;
  max-width: 220px;
}

.mps-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mps-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--sa-heading);
}

.mps-card-title i {
  color: var(--sa-accent);
  font-size: 15px;
}

.mps-inline-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-accent);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.mps-count-pill {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sa-muted);
  background: var(--sa-surface-2);
  border-radius: 999px;
  padding: 2px 9px;
}

.mps-info-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.mps-info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--sa-border);
}

.mps-info-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.mps-info-lbl {
  color: var(--sa-muted);
  font-weight: 600;
  flex-shrink: 0;
}

.mps-info-val {
  color: var(--sa-heading);
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}

.mps-info-val.is-code {
  color: var(--sa-accent);
  font-weight: 800;
}

.mps-pay-val {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.mps-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mps-item-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--sa-border);
}

.mps-item-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.mps-item-left {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.mps-item-thumb,
.mps-item-idx {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
}

.mps-item-idx {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-muted);
}

.mps-item-meta {
  min-width: 0;
  flex: 1;
}

.mps-item-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-heading);
  line-height: 1.3;
}

.mps-item-sub {
  font-size: 11.5px;
  color: var(--sa-muted);
  margin-top: 2px;
}

.mps-item-note {
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--sa-accent);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mps-item-total {
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-price);
  white-space: nowrap;
  flex-shrink: 0;
}

.mps-group-blocks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mps-group-block {
  border: 1px solid var(--sa-border);
  border-radius: 12px;
  padding: 9px 10px;
  background: var(--sa-surface-2);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mps-group-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 12px;
}

.mps-group-name {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  color: var(--sa-heading);
}

.mps-group-sub {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sa-price);
}

.mps-promo-earned {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--sa-surface-soft);
  border: 1px solid var(--sa-border-green);
  font-size: 12px;
}

.mps-promo-lbl {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  color: var(--sa-accent);
}

.mps-promo-vals {
  font-weight: 700;
  color: var(--sa-heading);
  text-align: right;
}

.mps-grand-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--sa-border);
  font-size: 14px;
  font-weight: 700;
  color: var(--sa-heading);
}

.mps-grand-total strong {
  font-size: 17px;
  color: var(--sa-price);
}

.mps-export-textarea {
  min-height: 120px;
  max-height: 210px;
  font-size: 12px;
}

.mps-send-channels {
  margin-top: 2px;
}

.mps-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mps-secondary-action-btn {
  width: 100%;
  height: 42px;
  border-radius: 12px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface);
  color: var(--sa-accent);
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}
</style>










