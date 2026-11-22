<template>
  <div
    class="sa-storefront"
    :class="[
      themeMode === 'dark' ? 'theme-dark' : 'theme-light',
      `sa-radius-${activeStorefrontTheme.cardRadius}`,
      `sa-surface-${activeStorefrontTheme.surfaceStyle}`,
      { 'is-mobile-view': isMobile, 'is-splash-active': showCookingSplash },
    ]"
    :style="[pcLayoutStyle, storefrontThemeVars]"
  >
    <CookingSplashIntro
      v-if="showCookingSplash"
      :logo-url="logo?.URL || '/logo-sa.jpg'"
      :shop-name="logo?.Name || 'SA KITCHEN'"
      :lang="currentLang"
      :event-id="activeStorefrontTheme.introEvent"
      :bg-id="activeStorefrontTheme.introBg"
      :effect-id="activeStorefrontTheme.introEffect"
      :transition-id="activeStorefrontTheme.introTransition"
      :primary-color="activeStorefrontTheme.primaryColor"
      :secondary-color="activeStorefrontTheme.secondaryColor"
      :custom-title="activeStorefrontTheme.introCustomTitle"
      :custom-subtitle="activeStorefrontTheme.introCustomSubtitle"
      @done="showCookingSplash = false"
    />
    <SeasonalOverlay :effect="activeStorefrontTheme.seasonalEffect" />
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
                <div class="suggest-name">
                  <template v-for="(seg, sIdx) in getSearchHighlights(m.Ten_hang, searchInput)" :key="sIdx">
                    <mark v-if="seg.match" class="suggest-hl">{{ seg.text }}</mark>
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </div>
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

          <!-- RIGHT CONTROLS: BLOG + CONTACT + THEME + LANG + CART PILL -->
          <div class="dth-actions">
          <RouterLink to="/blog" class="dth-ctrl-btn dth-blog-link" title="Blog & Cẩm nang ẩm thực">
            <i class="ri-article-line"></i>
            <span>Blog</span>
          </RouterLink>
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
              {{ cartQtyTotal > 0 ? formatPrice(customerPayableTotal, cartCurrency) : $t('mobile.cart') }}
            </span>
          </button>
          </div>
        </div>
      </div>
    </header>

    <div
      ref="layoutRef"
      class="layout"
      :class="{
        'hide-left': !showCategories,
        'hide-right': !showCart,
        'is-resizing-sidebar': isResizingSidebar
      }"
      :style="pcLayoutStyle"
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
              :key="c"
              class="cat-group-wrap"
            >
              <div
                style="text-transform: uppercase;"
                class="cat cat-tree-parent"
                :class="{
                  active: c === currentCategory && !currentSubCategory,
                  'is-parent-active': c === currentCategory && Boolean(currentSubCategory),
                  sale: c === 'Sale'
                }"
                @click="selectCategory(c)"
              >
                <span class="cat-label-text">{{ c }}</span>
                <button
                  v-if="getHierarchySubCategories(c).length"
                  type="button"
                  class="cat-chevron-btn"
                  :title="isCatParentExpanded(c) ? 'Thu gọn' : 'Mở rộng'"
                  @click.stop="toggleCatParentExpanded(c)"
                >
                  <span class="cat-sub-count">{{ getHierarchySubCategories(c).length }}</span>
                  <i :class="isCatParentExpanded(c) ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
                </button>
              </div>
              <div
                v-if="getHierarchySubCategories(c).length && isCatParentExpanded(c)"
                class="sub-cat-tree"
              >
                <button
                  type="button"
                  class="sub-cat-tree-item"
                  :class="{ active: c === currentCategory && !currentSubCategory }"
                  @click.stop="selectParentAndSub(c, '')"
                >
                  <span>{{ $t('filter.all') }}</span>
                </button>
                <button
                  v-for="sub in getHierarchySubCategories(c)"
                  :key="'side-sub-' + c + '-' + sub.label"
                  type="button"
                  class="sub-cat-tree-item"
                  :class="{ active: c === currentCategory && currentSubCategory === sub.label }"
                  @click.stop="selectParentAndSub(c, sub.label)"
                >
                  <span>{{ sub.label }}</span>
                </button>
              </div>
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
        <div
          v-if="marqueeNoticeText"
          class="notice-bar"
          :class="{ 'is-marquee': noticeOverflowing, 'is-paused': noticePaused }"
          @click="noticeOverflowing && (noticePaused = !noticePaused)"
        >
          <div class="notice-badge" :title="$t('menu.noticeLabel')" :aria-label="$t('menu.noticeLabel')">
            <i class="ri-volume-up-fill notice-badge-ico"></i>
            <span v-if="!isMobile" class="notice-badge-text">{{ $t('menu.noticeLabel') }}</span>
          </div>
          <div class="notice-marquee" ref="noticeViewportRef">
            <div class="notice-track" :style="noticeTrackStyle">
              <span class="notice-item">
                <span class="notice-text" ref="noticeMeasureRef">{{ marqueeNoticeText }}</span>
                <span v-if="noticeOverflowing" class="notice-sep" aria-hidden="true">•</span>
              </span>
              <span v-if="noticeOverflowing" class="notice-item" aria-hidden="true">
                <span class="notice-text">{{ marqueeNoticeText }}</span>
                <span class="notice-sep">•</span>
              </span>
            </div>
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
                  sale: c === 'Sale',
                  'is-parent-cat': isParentCategoryEntry(c)
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
                <span class="sct-alpha-badge">{{ displayConfig.categoryOrder.length ? 'Thứ tự' : 'A → Z' }}</span>
              </div>
              <div class="sct-all-cats-grid">
                <button
                  v-for="c in standaloneCategories"
                  :key="'drop-cat-' + c"
                  type="button"
                  class="sct-cat-pill"
                  :class="{
                    active: c === currentCategory && !currentSubCategory,
                    sale: c === 'Sale'
                  }"
                  @click="selectCategory(c)"
                >
                  <i v-if="c === 'Sale'" class="ri-fire-fill"></i>
                  <span>{{ c }}</span>
                </button>
              </div>
              <div
                v-if="parentCategoriesWithSubs.length"
                class="sct-parent-groups-wrap"
              >
                <div
                  v-for="pNode in parentCategoriesWithSubs"
                  :key="'drop-grp-' + pNode.label"
                  class="sct-parent-group-card"
                >
                  <div class="sct-parent-group-head">
                    <button
                      type="button"
                      class="sct-cat-pill sct-parent-head-pill is-parent-cat"
                      :class="{
                        active: pNode.label === currentCategory && !currentSubCategory,
                        'is-parent-active': pNode.label === currentCategory && Boolean(currentSubCategory)
                      }"
                      @click="selectParentAndSub(pNode.label, '')"
                    >
                      <i class="ri-folder-3-line"></i>
                      <span>{{ pNode.label }}</span>
                    </button>
                    <span class="sct-parent-subcount">{{ pNode.subCategories.length }}</span>
                  </div>
                  <div class="sct-all-cats-grid">
                    <button
                      v-for="sub in pNode.subCategories"
                      :key="'drop-sub-' + pNode.label + '-' + sub.label"
                      type="button"
                      class="sct-cat-pill is-sub-pill"
                      :class="{ active: pNode.label === currentCategory && currentSubCategory === sub.label }"
                      @click="selectParentAndSub(pNode.label, sub.label)"
                    >
                      <span>{{ sub.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="subCategories.length" class="sct-subcat-bar">
          <div class="sct-subcat-inner">
            <span class="sct-subcat-parent-label">
              <i class="ri-node-tree"></i>
              <span>{{ currentCategory }}:</span>
            </span>
            <div class="sct-subcat-scroll">
              <button
                type="button"
                class="sct-cat-pill is-sub-pill"
                :class="{ active: !currentSubCategory }"
                @click="selectSubCategory('')"
              >
                <span>{{ $t('filter.all') }}</span>
              </button>
              <button
                v-for="sub in subCategories"
                :key="'desk-sub-' + sub"
                type="button"
                class="sct-cat-pill is-sub-pill"
                :class="{ active: currentSubCategory === sub }"
                @click="selectSubCategory(sub)"
              >
                <span>{{ sub }}</span>
              </button>
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
              <div class="suggest-name">
                <template v-for="(seg, sIdx) in getSearchHighlights(m.Ten_hang, searchInput)" :key="sIdx">
                  <mark v-if="seg.match" class="suggest-hl">{{ seg.text }}</mark>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </div>
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
            :class="{ active: showCategoryModal || (currentCategory && currentCategory !== allCategoryLabel) || Boolean(currentSubCategory) }"
            @click="openMobilePanel('category')"
          >
            <i class="ri-apps-2-line"></i>
            <span>{{ currentSubCategory ? `${currentCategory} › ${currentSubCategory}` : (currentCategory && currentCategory !== allCategoryLabel ? currentCategory : $t('mobile.menu')) }}</span>
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
            sale: c === 'Sale',
            'is-parent-cat': isParentCategoryEntry(c)
          }"
          @click="selectCategory(c)"
        >
          <i v-if="c === 'Sale'" class="ri-fire-fill"></i>
          <span>{{ c }}</span>
        </button>
      </div>
      <div v-if="isMobile && subCategories.length" class="mobile-cat-strip is-sub-strip">
        <button
          type="button"
          class="sct-cat-pill mob-cat-pill is-sub-pill"
          :class="{ active: !currentSubCategory }"
          @click="selectSubCategory('')"
        >
          <span>{{ $t('filter.all') }}</span>
        </button>
        <button
          v-for="sub in subCategories"
          :key="'mob-sub-' + sub"
          type="button"
          class="sct-cat-pill mob-cat-pill is-sub-pill"
          :class="{ active: currentSubCategory === sub }"
          @click="selectSubCategory(sub)"
        >
          <span>{{ sub }}</span>
        </button>
      </div>

      <!-- DESKTOP FILTER & SORT BAR (TIER 2) -->
      <div v-if="!isMobile" class="menu-filter-bar">
        <div class="mfb-left">
          <span class="mfb-active-cat">
            <i v-if="currentCategory === 'Sale'" class="ri-fire-fill"></i>
            <i v-else class="ri-price-tag-3-line"></i>
            <span>{{ currentSubCategory ? `${currentCategory} › ${currentSubCategory}` : (currentCategory || allCategoryLabel) }}</span>
          </span>
          <span class="mfb-count-pill">
            {{ filteredMenu.length }} {{ $t('menu.itemsUnit') }}
          </span>
          <button
            v-if="currentCategory !== allCategoryLabel || currentSubCategory || priceSort !== 'all' || keyword"
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

      <!-- STANDALONE VIEW MODE SWITCHER (RIGHT ABOVE FIRST MENU GROUP) -->
      <div v-if="filteredMenu.length > 0" class="menu-view-bar">
        <div
          class="menu-view-switcher"
          role="group"
          :aria-label="$t('filter.viewModeLabel')"
        >
          <button
            type="button"
            class="mvs-btn"
            :class="{ active: menuViewMode === 'card' }"
            @click="setMenuViewMode('card')"
          >
            <i class="ri-layout-grid-line"></i>
            <span>{{ $t('filter.viewCard') }}</span>
          </button>
          <button
            type="button"
            class="mvs-btn"
            :class="{ active: menuViewMode === 'board' }"
            @click="setMenuViewMode('board')"
          >
            <i class="ri-flashlight-line"></i>
            <span>{{ $t('filter.viewMenu') }}</span>
          </button>
        </div>
      </div>

      <!-- MENU GRID (CARD MODE) -->
      <div
        v-if="menuViewMode === 'card' && pagedMenu.length > 0"
        class="menu"
        ref="menuRef"
        :key="menuKey"
      >
        <div v-if="keyword" class="search-result-line">
          <span>
            {{ filteredMenuMeta.usedFuzzy ? $t('search.fuzzyHint') : 'Kết quả tìm kiếm cho:' }}
            "<strong>{{ keyword }}</strong>" ({{ filteredMenu.length }})
          </span>
          <button
            v-if="searchGlobalMatchesCount > filteredMenu.length"
            type="button"
            class="srl-all-btn"
            @click="searchAcrossAllMenu"
          >
            {{ $t('search.searchAllMenu') }} ({{ searchGlobalMatchesCount }})
          </button>
        </div>
        <template v-for="(entry, entryIdx) in menuDisplayEntries" :key="entry.rowKey">
          <div
            v-if="entry.type === 'heading'"
            class="menu-group-heading"
            :style="!isMobile ? { '--card-stagger': Math.min(entryIdx % 12, 10) } : undefined"
            @click="selectParentAndSub(entry.parentLabel, entry.subLabel)"
          >
            <span class="mgh-title">
              <i class="ri-node-tree"></i>
              <span>{{ entry.headingText }}</span>
            </span>
            <span v-if="entry.subLabel" class="mgh-action">
              <i class="ri-arrow-right-s-line"></i>
            </span>
          </div>
          <div
            v-else
            class="card-border"
            :class="{ out: entry.item.Trang_thai === 'Hết hàng' }"
            :style="!isMobile ? { '--card-stagger': Math.min(entryIdx % 12, 10) } : undefined"
          >
            <div
              class="card"
              :class="{ 'is-in-cart': (cartQtyByCode[entry.item.Ma_hang] || 0) > 0 }"
              @click="openDetail(entry.item)"
            >
              <div
                class="card-img-wrap"
                :class="{ 'has-ambient': Boolean(getCardImage(entry.item)) }"
                :style="getAmbientGlassStyle(getCardImage(entry.item))"
              >
                <transition name="card-fade" mode="out-in">
                  <img
                    v-if="getCardImage(entry.item)"
                    :key="getCardImageKey(entry.item)"
                    :src="getCardImage(entry.item)"
                    loading="lazy"
                    decoding="async"
                    :alt="entry.item.Ten_hang || ''"
                    @error="onCardImgError(entry.item, getCardImage(entry.item))"
                  />
                  <div v-else :key="'fallback-' + entry.item.Ma_hang" class="card-img-name-fallback">
                    <span>{{ entry.item.Ten_hang }}</span>
                  </div>
                </transition>

                <!-- TAG GIẢM GIÁ -->
                <div
                  v-if="isDiscount(entry.item)"
                  class="discount-tag"
                >
                  <span>-{{ discountPercent(entry.item) }}%</span>
                </div>

                <!-- TAG TRẠNG THÁI TRÊN ẢNH -->
                <div
                  class="status-tag card-status-pill"
                  :class="{
                    available: entry.item.Trang_thai === 'Còn hàng',
                    out: entry.item.Trang_thai === 'Hết hàng'
                  }"
                >
                  {{ $t(getStatusKey(entry.item.Trang_thai)) }}
                </div>

                <!-- DẢI NHÃN SỐ LƯỢNG ĐANG CÓ TRONG GIỎ Ở ĐÁY ẢNH -->
                <div
                  v-if="cartQtyByCode[entry.item.Ma_hang]"
                  class="card-incart-bar"
                  :class="{ 'is-pop': addedMap[entry.item.Ma_hang] }"
                >
                  <i class="ri-shopping-cart-2-fill"></i>
                  <span>{{ $t('menu.inCartLabel') }}:</span>
                  <strong class="card-incart-num">{{ cartQtyByCode[entry.item.Ma_hang] }}</strong>
                </div>
              </div>

              <div class="info">
                <!-- TÊN -->
                <h4 class="name">{{ entry.item.Ten_hang }}</h4>

                <!-- MÔ TẢ -->
                <p v-if="String(entry.item.Mo_ta || '').trim()" class="desc">
                  {{ entry.item.Mo_ta }}
                </p>

                <!-- GIÁ + CHI TIẾT / GHI CHÚ -->
                <div class="card-meta-row">
                  <div class="price-row price-discount">
                    <span class="price" :class="{ 'is-sale-price': isDiscount(entry.item) }">
                      {{ formatPrice(finalPrice(entry.item), entry.item.Don_vi_tien_te) }}<span v-if="entry.item.Dvt" class="unit">/{{ entry.item.Dvt }}</span>
                    </span>

                    <span
                      v-if="isDiscount(entry.item)"
                      class="price-old"
                    >
                      {{ formatPrice(entry.item.Gia_ban, entry.item.Don_vi_tien_te) }}
                    </span>
                  </div>

                  <a
                    class="detail-link"
                    @click.stop.prevent="openDetail(entry.item)"
                  >
                    <i class="ri-sticky-note-line"></i>
                    <span>{{ $t('menu.detailNote') }}</span>
                  </a>
                </div>

                <!-- THANH HÀNH ĐỘNG GỘP: SỐ LƯỢNG + THÊM -->
                <div class="card-action-bar">
                  <div class="qty-row">
                    <button type="button" class="btn-qty" @click.stop="decTemp(entry.item)">
                      <i class="app-ico ri-subtract-line"></i>
                    </button>

                    <input
                      type="number"
                      min="1"
                      v-model.number="tempQty[entry.item.Ma_hang]"
                      @click.stop
                    />

                    <button type="button" class="btn-qty" @click.stop="incTemp(entry.item)">
                      <i class="app-ico ri-add-line"></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    class="add-btn"
                    :class="{ added: addedMap[entry.item.Ma_hang] }"
                    :disabled="entry.item.Trang_thai === 'Hết hàng'"
                    @click.stop="addToCart(entry.item, $event)"
                  >
                    <template v-if="addedMap[entry.item.Ma_hang]">
                      <span class="add-btn-check"><i class="ri-check-line"></i></span>
                    </template>
                    <template v-else-if="entry.item.Trang_thai === 'Hết hàng'">
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
        </template>
      </div>

      <!-- MENU BOARD (CLASSIC CATEGORY PRICE-LIST MENU MODE) -->
      <div
        v-else-if="menuViewMode === 'board' && menuBoardSections.length > 0"
        class="menu-board"
        ref="menuRef"
        :key="'board-' + menuKey"
      >
        <div v-if="keyword" class="search-result-line mb-search-line">
          <span>
            {{ filteredMenuMeta.usedFuzzy ? $t('search.fuzzyHint') : 'Kết quả tìm kiếm cho:' }}
            "<strong>{{ keyword }}</strong>" ({{ filteredMenu.length }})
          </span>
          <button
            v-if="searchGlobalMatchesCount > filteredMenu.length"
            type="button"
            class="srl-all-btn"
            @click="searchAcrossAllMenu"
          >
            {{ $t('search.searchAllMenu') }} ({{ searchGlobalMatchesCount }})
          </button>
        </div>

        <section
          v-for="(sec, secIdx) in menuBoardSections"
          :key="sec.key"
          class="mb-section"
          :style="!isMobile ? { '--card-stagger': Math.min(secIdx, 8) } : undefined"
        >
          <header
            class="mb-sec-header"
            :class="{ 'has-thumbs': sec.thumbs.length > 0 }"
            @click="selectParentAndSub(sec.parentLabel, sec.subLabel)"
          >
            <div v-if="!isMobile && sec.thumbs.length" class="mb-sec-thumbs is-left" aria-hidden="true">
              <img
                v-for="(thumb, tIdx) in sec.thumbs.slice(0, 2)"
                :key="'mb-tl-' + sec.key + '-' + tIdx"
                :src="thumb"
                loading="lazy"
                decoding="async"
                class="mb-sec-thumb"
                alt=""
              />
            </div>

            <div class="mb-sec-title-wrap">
              <div v-if="isMobile && sec.thumbs.length" class="mb-sec-thumbs is-mobile-cluster" aria-hidden="true">
                <img
                  v-for="(thumb, tIdx) in sec.thumbs.slice(0, 3)"
                  :key="'mb-tm-' + sec.key + '-' + tIdx"
                  :src="thumb"
                  loading="lazy"
                  decoding="async"
                  class="mb-sec-thumb"
                  alt=""
                />
              </div>

              <div class="mb-sec-title-texts">
                <span v-if="sec.parentTag" class="mb-sec-parent">{{ sec.parentTag }}</span>
                <h2 class="mb-sec-title">{{ sec.title }}</h2>
              </div>

              <span class="mb-sec-count">{{ sec.items.length }}</span>
            </div>

            <div v-if="!isMobile && sec.thumbs.length > 2" class="mb-sec-thumbs is-right" aria-hidden="true">
              <img
                v-for="(thumb, tIdx) in sec.thumbs.slice(2, 4)"
                :key="'mb-tr-' + sec.key + '-' + tIdx"
                :src="thumb"
                loading="lazy"
                decoding="async"
                class="mb-sec-thumb"
                alt=""
              />
            </div>
          </header>

          <div
            class="mb-items-grid"
            :class="{ 'is-single-col': sec.items.length === 1 }"
          >
            <div
              v-for="item in sec.items"
              :key="'mb-item-' + item.Ma_hang"
              class="mb-row"
              :class="{
                'is-out': item.Trang_thai === 'Hết hàng',
                'is-in-cart': (cartQtyByCode[item.Ma_hang] || 0) > 0,
              }"
              @click="openDetail(item)"
            >
              <div class="mb-name-wrap">
                <span class="mb-name">
                  <template v-if="keyword">
                    <template v-for="(seg, sIdx) in getSearchHighlights(item.Ten_hang, keyword)" :key="sIdx">
                      <mark v-if="seg.match" class="mb-hl">{{ seg.text }}</mark>
                      <template v-else>{{ seg.text }}</template>
                    </template>
                  </template>
                  <template v-else>{{ item.Ten_hang }}</template>
                </span>
                <span v-if="isDiscount(item)" class="mb-sale-tag">
                  -{{ discountPercent(item) }}%
                </span>
                <span v-if="item.Trang_thai === 'Hết hàng'" class="mb-out-tag">
                  {{ $t('status.out_stock') }}
                </span>
                <span
                  v-if="cartQtyByCode[item.Ma_hang]"
                  class="mb-incart-pill"
                  :class="{ 'is-pop': addedMap[item.Ma_hang] }"
                >
                  x{{ cartQtyByCode[item.Ma_hang] }}
                </span>
              </div>

              <span class="mb-leader" aria-hidden="true"></span>

              <div class="mb-right">
                <div class="mb-price-wrap">
                  <span v-if="isDiscount(item)" class="mb-old-price">
                    {{ formatPrice(item.Gia_ban, item.Don_vi_tien_te) }}
                  </span>
                  <div class="mb-price-line">
                    <strong class="mb-price">{{ formatPrice(finalPrice(item), item.Don_vi_tien_te) }}</strong>
                    <span v-if="item.Dvt" class="mb-unit">/{{ item.Dvt }}</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="mb-add-btn"
                  :class="{ added: addedMap[item.Ma_hang] }"
                  :disabled="item.Trang_thai === 'Hết hàng'"
                  :title="item.Trang_thai === 'Hết hàng' ? $t('status.outOfStock') : $t('menu.add')"
                  :aria-label="item.Ten_hang"
                  @click.stop="addToCart(item, $event, { overrideQty: 1 })"
                >
                  <i v-if="addedMap[item.Ma_hang]" class="ri-check-line"></i>
                  <i v-else class="ri-add-line"></i>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- EMPTY STATE -->
      <div
        v-else
        class="empty-menu"
      >
        <div class="empty-menu-title">
          {{ $t('empty.menu') }}
          <span v-if="keyword" class="empty-menu-kw">"{{ keyword }}"</span>
          <i class="ri-search-2-line"></i>
        </div>

        <div v-if="keyword" class="empty-search-actions">
          <button
            v-if="searchGlobalMatchesCount > 0"
            type="button"
            class="empty-search-btn primary"
            @click="searchAcrossAllMenu"
          >
            <i class="ri-apps-2-line"></i>
            {{ $t('search.searchAllMenu') }} ({{ searchGlobalMatchesCount }})
          </button>
          <button
            type="button"
            class="empty-search-btn"
            @click="clearSearchAll"
          >
            <i class="ri-close-circle-line"></i>
            {{ $t('search.clearSearch') }}
          </button>
        </div>

        <div v-if="keyword && quickSearchTags.length" class="empty-quick-tags">
          <span class="empty-quick-label">{{ $t('search.tryKeywords') }}</span>
          <button
            v-for="tag in quickSearchTags"
            :key="tag"
            type="button"
            class="empty-quick-chip"
            @click="applyQuickSearchTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- LAZY LOAD SENTINEL (AUTO LOAD ON SCROLL) -->
      <div
        v-if="menuViewMode === 'card' && hasMoreItems"
        ref="loadMoreSentinelRef"
        class="lazy-load-sentinel"
        aria-hidden="true"
      >
        <i class="ri-loader-4-line lazy-spin-ico"></i>
        <span>{{ pagedMenu.length }} / {{ filteredMenu.length }}</span>
      </div>

      <!-- MOBILE: SEO STOREFRONT INTRO BOX + 3 CHECKSCAM BUTTONS (UNCHANGED ON MOBILE) -->
      <section
        v-if="isMobile && (brandAssets.seoH1 || brandAssets.seoIntro)"
        class="storefront-seo-box"
        aria-label="Storefront overview"
      >
        <h1 v-if="!selectedItem && brandAssets.seoH1" class="seo-box-h1">
          {{ brandAssets.seoH1 }}
        </h1>
        <p v-else-if="brandAssets.seoH1" class="seo-box-h1">
          {{ brandAssets.seoH1 }}
        </p>
        <p v-if="brandAssets.seoIntro" class="seo-box-intro">
          {{ brandAssets.seoIntro }}
        </p>
        <div class="seo-box-links">
          <RouterLink to="/blog" class="seo-box-blog-link">
            <i class="ri-article-line"></i>
            <span>{{ $t('footer.blogLink') }} {{ brandAssets.siteName }}</span>
            <i class="ri-arrow-right-line"></i>
          </RouterLink>
        </div>
      </section>

      <div v-if="isMobile" class="footer-checkscam-group">
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

      <!-- PC WEBSITE FOOTER (3 COLUMNS + SUBTLE LINKS + LOCATION + COPYRIGHT) -->
      <footer v-if="!isMobile" class="pc-web-footer" aria-label="Site footer">
        <div class="pwf-grid">
          <!-- COL 1: BRAND, SEO H1/INTRO & LOCATION -->
          <div class="pwf-col pwf-brand-col">
            <div class="pwf-brand-head">
              <img
                v-if="logo?.URL"
                :src="logo.URL"
                :alt="brandAssets.siteName"
                class="pwf-logo"
              />
              <div class="pwf-brand-meta">
                <strong class="pwf-brand-name">{{ brandAssets.siteName }}</strong>
                <div v-if="shopTime" class="pwf-open-pill">
                  <span class="dot-online"></span>
                  <span>{{ shopTime }}</span>
                </div>
              </div>
            </div>

            <h1 v-if="!selectedItem && brandAssets.seoH1" class="pwf-seo-h1">
              {{ brandAssets.seoH1 }}
            </h1>
            <p v-else-if="brandAssets.seoH1" class="pwf-seo-h1">
              {{ brandAssets.seoH1 }}
            </p>

            <p v-if="brandAssets.seoIntro" class="pwf-seo-intro">
              {{ brandAssets.seoIntro }}
            </p>

            <div v-if="brandAssets.shopAddress" class="pwf-location-box">
              <i class="ri-map-pin-2-fill pwf-loc-ico"></i>
              <div class="pwf-loc-body">
                <span class="pwf-loc-label">{{ $t('footer.locationLabel') }}:</span>
                <span class="pwf-loc-text">{{ brandAssets.shopAddress }}</span>
                <a
                  v-if="brandAssets.mapUrl"
                  :href="brandAssets.mapUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="pwf-map-link"
                >
                  <span>{{ $t('footer.viewMap') }}</span>
                  <i class="ri-arrow-right-up-line"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- COL 2: EXPLORE QUICK LINKS & SUBTLE SAFETY LINKS -->
          <div class="pwf-col pwf-links-col">
            <strong class="pwf-col-title">{{ $t('footer.exploreTitle') }}</strong>
            <ul class="pwf-nav-list">
              <li>
                <button type="button" class="pwf-nav-link" @click="onAllFilter">
                  <i class="ri-restaurant-2-line"></i>
                  <span>{{ $t('menu.allCategories') }}</span>
                </button>
              </li>
              <li v-for="cat in footerQuickCategories" :key="'fcat-' + cat">
                <button type="button" class="pwf-nav-link" @click="selectCategory(cat)">
                  <i class="ri-arrow-right-s-line"></i>
                  <span>{{ cat }}</span>
                </button>
              </li>
              <li>
                <RouterLink to="/blog" class="pwf-nav-link is-highlight">
                  <i class="ri-article-line"></i>
                  <span>{{ $t('footer.blogLink') }}</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/welcome" class="pwf-nav-link">
                  <i class="ri-sparkling-2-line"></i>
                  <span>{{ $t('footer.welcomeLink') }}</span>
                </RouterLink>
              </li>
            </ul>

            <div class="pwf-safety-block">
              <span class="pwf-safety-title">{{ $t('footer.safetyTitle') }}</span>
              <div class="pwf-safety-links">
                <a
                  v-for="item in CHECK_SCAM_LINKS"
                  :key="'pwf-scam-' + item.key"
                  :href="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="pwf-safety-link"
                >
                  <i :class="item.icon"></i>
                  <span>{{ item.headerLabel || item.title }}</span>
                </a>
              </div>
            </div>
          </div>

          <!-- COL 3: OFFICIAL CONTACTS -->
          <div class="pwf-col pwf-contact-col">
            <strong class="pwf-col-title">{{ $t('contact.officialChannels') }}</strong>
            <div v-if="shopContactList.length" class="pwf-contact-list">
              <component
                :is="c.Direct_link ? 'a' : 'div'"
                v-for="c in shopContactList"
                :key="'pwf-ct-' + c.ID"
                :href="c.Direct_link || undefined"
                :target="c.Direct_link ? '_blank' : undefined"
                :rel="c.Direct_link ? 'noopener noreferrer' : undefined"
                class="pwf-contact-item"
                :class="{ 'is-clickable': Boolean(c.Direct_link) }"
              >
                <img v-if="c.URL_img" :src="c.URL_img" alt="" class="pwf-contact-avatar" />
                <div v-else class="pwf-contact-avatar is-fallback">
                  <i class="ri-customer-service-2-fill"></i>
                </div>
                <div class="pwf-contact-info">
                  <div class="pwf-contact-top">
                    <strong class="pwf-contact-name">{{ c.PLATFORM_name }}</strong>
                    <span v-if="isContactMessageAllowed(c)" class="pwf-msg-pill">
                      {{ $t('contact.allowMessageBadge') }}
                    </span>
                  </div>
                  <span v-if="c.INFO" class="pwf-contact-sub">{{ c.INFO }}</span>
                </div>
                <i v-if="c.Direct_link" class="ri-external-link-line pwf-contact-ext"></i>
              </component>
            </div>
            <p v-else class="pwf-contact-empty">
              {{ $t('footer.rights') }}
            </p>
          </div>
        </div>

        <div class="pwf-bottom">
          <div class="pwf-copyright">
            © {{ currentFooterYear }} <strong>{{ brandAssets.siteName }}</strong> · sakitchen.shop — {{ $t('footer.rights') }}
          </div>
          <button type="button" class="pwf-top-btn" @click="scrollToPageTop">
            <span>{{ $t('footer.backToTop') }}</span>
            <i class="ri-arrow-up-line"></i>
          </button>
        </div>
      </footer>
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
    v-if="showDetailSidebar && isMobile && selectedItem"
    class="detail-sidebar is-fullpage"
  >
    <!-- STICKY TOPBAR -->
    <header class="detail-header dp-mob-header">
      <button type="button" class="detail-back dp-mob-back" @click="closeDetailSidebar" aria-label="Back">
        <i class="ri-arrow-left-line"></i>
      </button>

      <div class="detail-title dp-mob-title">
        {{ selectedItem.Ten_hang }}
      </div>
    </header>

    <div class="dp-mob-scroll">
      <!-- HERO GALLERY -->
      <div class="dp-mob-gallery">
        <div
          class="detail-image-main dp-mob-hero"
          :class="{ 'has-ambient': Boolean(activeDetailImageUrl) }"
          :style="getAmbientGlassStyle(activeDetailImageUrl)"
        >
          <img
            v-if="activeDetailImageUrl"
            :src="activeDetailImageUrl"
            class="detail-img clickable"
            :alt="selectedItem.Ten_hang || ''"
            @click="openImageModal(activeDetailImageUrl)"
            @error="onCardImgError(selectedItem, activeDetailImageUrl)"
          />
          <div v-else class="card-img-name-fallback dp-img-name-fallback">
            <span>{{ selectedItem.Ten_hang }}</span>
          </div>
          <button
            v-if="activeDetailImageUrl"
            type="button"
            class="dp-zoom-pill"
            aria-label="Zoom image"
            @click.stop="openImageModal(activeDetailImageUrl)"
          >
            <i class="ri-zoom-in-line"></i>
            <span v-if="modalImages.length > 1">{{ activeModalIndex + 1 }}/{{ modalImages.length }}</span>
          </button>
          <button
            v-if="modalImages.length > 1"
            type="button"
            class="detail-img-nav prev dp-nav-btn"
            aria-label="Prev image"
            @click.stop="prevModalImage"
          >
            <i class="ri-arrow-left-s-line"></i>
          </button>
          <button
            v-if="modalImages.length > 1"
            type="button"
            class="detail-img-nav next dp-nav-btn"
            aria-label="Next image"
            @click.stop="nextModalImage"
          >
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>

        <div v-if="modalImages.length > 1" class="detail-thumbs dp-mob-thumbs">
          <button
            v-for="(img, idx) in modalImages"
            :key="`${img}-${idx}`"
            type="button"
            class="detail-thumb dp-thumb"
            :class="{ active: idx === activeModalIndex }"
            @click.stop="setActiveModalImage(idx)"
          >
            <img :src="img" alt="" />
          </button>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="detail-body dp-mob-sheet">
        <div class="dp-meta-line">
          <button
            v-if="selectedItem.Danh_muc_cha"
            type="button"
            class="dp-meta-link"
            @click="selectCategoryFromDetail(selectedItem.Danh_muc_cha, '')"
          >
            {{ selectedItem.Danh_muc_cha }}
          </button>
          <span v-if="selectedItem.Danh_muc_cha && selectedItem.Danh_muc && selectedItem.Danh_muc !== selectedItem.Danh_muc_cha" class="dp-meta-sep">/</span>
          <button
            v-if="selectedItem.Danh_muc && selectedItem.Danh_muc !== selectedItem.Danh_muc_cha"
            type="button"
            class="dp-meta-link"
            @click="selectCategoryFromDetail(selectedItem.Danh_muc_cha || selectedItem.Danh_muc, selectedItem.Danh_muc)"
          >
            {{ selectedItem.Danh_muc }}
          </button>
          <template v-if="selectedItem.Size">
            <span v-if="selectedItem.Danh_muc_cha || selectedItem.Danh_muc" class="dp-meta-sep">·</span>
            <span class="dp-meta-text">Size {{ selectedItem.Size }}</span>
          </template>
          <template v-if="selectedItem.Trang_thai === 'Hết hàng'">
            <span v-if="selectedItem.Danh_muc_cha || selectedItem.Danh_muc || selectedItem.Size" class="dp-meta-sep">·</span>
            <span class="dp-out-text">{{ $t(getStatusKey(selectedItem.Trang_thai)) }}</span>
          </template>
        </div>

        <h1 class="dp-title is-mobile">{{ selectedItem.Ten_hang }}</h1>

        <div class="dp-price-row">
          <span class="dp-price-current" :class="{ 'is-sale': isDiscount(selectedItem) }">
            {{ formatPrice(finalPrice(selectedItem), selectedItem.Don_vi_tien_te) }}
          </span>
          <span v-if="selectedItem.Dvt" class="dp-price-unit">/ {{ selectedItem.Dvt }}</span>
          <span v-if="isDiscount(selectedItem)" class="dp-price-old">
            {{ formatPrice(selectedItem.Gia_ban, selectedItem.Don_vi_tien_te) }}
          </span>
        </div>

        <div v-if="selectedProductVariants.length" class="dp-variant-group">
          <div class="dp-variant-label">{{ $t('menu.chooseVariant') }}</div>
          <div class="dp-variant-pills">
            <button
              v-for="v in selectedProductVariants"
              :key="'mob-var-' + v.maHang"
              type="button"
              class="dp-variant-pill"
              :class="{
                active: v.maHang === selectedItem.Ma_hang,
                'is-out': v.item.Trang_thai === 'Hết hàng'
              }"
              @click="switchDetailVariant(v.item)"
            >
              <span class="dvp-name">{{ v.label }}</span>
              <span class="dvp-price">{{ formatPrice(finalPrice(v.item), v.item.Don_vi_tien_te) }}</span>
            </button>
          </div>
        </div>

        <!-- TOPPING / GỌI THÊM (MOBILE) -->
        <div v-if="selectedProductToppings.length" class="dp-topping-group">
          <div class="dp-topping-head">
            <span class="dp-variant-label">{{ $t('menu.toppingsTitle') }}</span>
            <span v-if="selectedDetailToppingsCount > 0" class="dp-topping-sel-pill">
              {{ $t('menu.toppingsSelected') }}: {{ selectedDetailToppingsCount }}
            </span>
          </div>
          <div class="dp-topping-list">
            <div
              v-for="tp in selectedProductToppings"
              :key="'mob-tp-' + tp.maHang"
              class="dp-topping-item"
              :class="{
                active: getDetailToppingQty(tp.maHang) > 0,
                'is-out': tp.item.Trang_thai === 'Hết hàng',
              }"
              role="checkbox"
              :aria-checked="getDetailToppingQty(tp.maHang) > 0"
              @click="toggleDetailTopping(tp)"
            >
              <span class="dpt-check">
                <i
                  :class="
                    getDetailToppingQty(tp.maHang) > 0
                      ? 'ri-checkbox-fill'
                      : 'ri-checkbox-blank-line'
                  "
                ></i>
              </span>
              <img
                v-if="tp.item.Main_img"
                :src="tp.item.Main_img"
                :alt="tp.item.Ten_hang"
                class="dpt-thumb"
                loading="lazy"
              />
              <div class="dpt-info">
                <div class="dpt-name">{{ tp.item.Ten_hang }}</div>
                <div class="dpt-price">
                  <template v-if="tp.item.Trang_thai === 'Hết hàng'">
                    <span class="dpt-out-txt">{{ $t('status.outOfStock') }}</span>
                  </template>
                  <template v-else>
                    +{{ formatPrice(finalPrice(tp.item), tp.item.Don_vi_tien_te) }}
                  </template>
                </div>
              </div>
              <div
                v-if="getDetailToppingQty(tp.maHang) > 0 && tp.item.Trang_thai !== 'Hết hàng'"
                class="dpt-stepper"
                @click.stop
              >
                <button type="button" class="dpt-step-btn" @click="stepDetailTopping(tp, -1)">
                  <i class="ri-subtract-line"></i>
                </button>
                <span class="dpt-step-val">{{ getDetailToppingQty(tp.maHang) }}</span>
                <button type="button" class="dpt-step-btn" @click="stepDetailTopping(tp, 1)">
                  <i class="ri-add-line"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="String(selectedItem.Mo_ta || '').trim()" class="dp-desc-text">
          {{ selectedItem.Mo_ta }}
        </p>

        <div class="dp-controls-box">
          <div class="dp-note-card">
            <label class="dp-note-label">
              <span>{{ $t('menu.note') }}</span>
            </label>
            <textarea
              rows="2"
              v-model="itemNotes[selectedItem.Ma_hang]"
              class="dp-note-input"
              :placeholder="$t('menu.notePlaceholder')"
            ></textarea>
          </div>
        </div>

        <section v-if="relatedDetailItems.length" class="dp-related-section is-mobile">
          <h3 class="dp-related-heading">
            <span>{{ $t('menu.relatedItems') }}</span>
          </h3>
          <div class="dp-related-scroll">
            <button
              v-for="rel in relatedDetailItems"
              :key="'mob-rel-' + rel.Ma_hang"
              type="button"
              class="dp-related-card"
              @click="openDetail(rel)"
            >
              <div class="dp-rel-thumb">
                <img v-if="rel.Main_img" :src="rel.Main_img" :alt="rel.Ten_hang" loading="lazy" />
                <div v-else class="dp-rel-thumb-empty"><i class="ri-image-line"></i></div>
              </div>
              <div class="dp-rel-info">
                <div class="dp-rel-name">{{ rel.Ten_hang }}</div>
                <div class="dp-rel-price">
                  {{ formatPrice(finalPrice(rel), rel.Don_vi_tien_te) }}
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- STICKY BOTTOM BAR -->
    <div class="dp-mob-bottom-bar">
      <div class="dp-qty-line">
        <div class="qty-row dp-stepper">
          <button type="button" class="dp-qty-minus" @click="decTemp(selectedItem)" aria-label="Decrease">
            <i class="ri-subtract-line"></i>
          </button>
          <input
            type="number"
            min="1"
            v-model.number="tempQty[selectedItem.Ma_hang]"
          />
          <button type="button" class="dp-qty-plus" @click="incTemp(selectedItem)" aria-label="Increase">
            <i class="ri-add-line"></i>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="dp-cta-btn"
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
          <span>{{ $t('status.outOfStock') }}</span>
        </template>
        <template v-else>
          <i class="ri-shopping-bag-3-fill"></i>
          <span>{{ $t('menu.add') }}</span>
          <span class="dp-cta-dot">•</span>
          <span>{{ getDetailCtaTotal(selectedItem) }}</span>
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
    <div
      v-if="!isMobile"
      class="pc-sidebar-resizer"
      :class="{ active: isResizingSidebar, 'is-hidden': !showCart }"
      title="Kéo để chỉnh độ rộng giỏ hàng • Double-click để đặt lại mặc định"
      @mousedown.prevent="startSidebarResize"
      @dblclick="resetSidebarWidth"
    >
      <span class="pc-sidebar-resizer-grip"></span>
    </div>
    <aside
      class="sidebar-right"
      :class="{ collapsed: !showCart }"
      :aria-hidden="!showCart"
      @wheel="forwardWheelToMain"
    >
      <div class="sidebar-content cart-box">
        <!-- ===== LAYER 1 & 2 HEADER: ĐƠN HÀNG + GHÉP ĐƠN CÙNG HÀNG ===== -->
        <div class="cart-header-zone">
          <div class="cart-top-header">
            <div class="cart-top-title">
              <button
                v-if="isMobile"
                type="button"
                class="cart-mob-back-btn"
                :aria-label="$t('cart.back')"
                @click="closeCart"
              >
                <i class="ri-arrow-left-line"></i>
              </button>
              <i v-else class="ri-shopping-basket-2-fill"></i>
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
                <i class="ri-team-fill"></i>
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
            <TransitionGroup
              v-else-if="!activeOrderId"
              name="cart-item-slide"
              tag="div"
              class="cart-solo-items"
            >
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
            </TransitionGroup>

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

                  <TransitionGroup
                    v-else
                    name="cart-item-slide"
                    tag="div"
                    class="cart-member-items"
                  >
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
                  </TransitionGroup>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ===== STICKY FOOTER: TỔNG CỘNG -> FREESHIP -> TRẠNG THÁI ĐƠN -> TIẾP TỤC ===== -->
        <div class="cart-sticky-footer">
          <div class="cart-summary-card">
            <template v-if="syncedShippingFee > 0 || syncedAdminDiscount > 0">
              <div class="cart-items-subtotal-row">
                <span>{{ syncedItemsLabel }}</span>
                <strong>{{ formatPrice(itemsSubtotalAmount, cartCurrency) }}</strong>
              </div>
              <div v-if="syncedAdminDiscount > 0" class="cart-discount-row">
                <span>{{ syncedDiscountLabel }}</span>
                <strong>-{{ formatPrice(syncedAdminDiscount, cartCurrency) }}</strong>
              </div>
              <div v-if="syncedShippingFee > 0" class="cart-ship-row">
                <span>{{ syncedShippingLabel }}</span>
                <strong>+{{ formatPrice(syncedShippingFee, cartCurrency) }}</strong>
              </div>
              <div class="cart-summary-divider"></div>
            </template>
            <!-- 3. TỔNG CỘNG + NÚT PHÓNG TO MODAL -->
            <div class="cart-total-row">
              <div class="cart-total">
                <span class="cart-total-label">{{ $t('cart.total') }}</span>
                <strong class="cart-total-value">{{ formatPrice(customerPayableTotal, cartCurrency) }}</strong>
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
          </div>

          <!-- 4. CHECKLIST ƯU ĐÃI DỌC (NGAY BÊN DƯỚI HÀNG TỔNG CỘNG TRONG SIDEBAR) -->
          <div
            v-if="milestoneCheckpoints.length > 0"
            class="cart-promo-checklist"
            :class="{ unlocked: isAllMilestonesUnlocked }"
          >
            <div
              v-for="cp in milestoneCheckpoints"
              :key="'sb-cp-' + cp.key"
              class="mpcb-item"
              :class="{ 'is-unlocked': cp.unlocked, 'is-next': cp.isNext }"
            >
              <span class="mpcb-check" aria-hidden="true">
                <i v-if="cp.unlocked" class="ri-check-line"></i>
              </span>
              <span class="mpcb-prefix">{{ cp.actionPrefix }}</span>
              <span class="mpcb-sep">—</span>
              <span class="mpcb-reward">{{ cp.label }}</span>
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
    :class="{ show: showScrollTop, 'is-dock-hidden': isMobile && isMobileDockHidden }"
    v-show="showScrollTop && (!isMobile || !showCart) && !showProgressModal && !showCategoryModal && !showContactModal && !showExportModal && !showDetailSidebar"
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

  <!-- ===== POPUP THÔNG BÁO KHI VÀO TRANG ORDER ===== -->
  <div
    v-if="showEntryNoticePopup && activeEntryPopup"
    class="epn-overlay"
    @click="closeEntryNoticePopup"
  >
    <div
      class="epn-modal"
      :class="{ 'is-text-only': !activeEntryPopup.imageUrl }"
      @click.stop
    >
      <button
        type="button"
        class="epn-close-btn"
        :class="{ 'on-light': !activeEntryPopup.imageUrl }"
        aria-label="Close"
        @click="closeEntryNoticePopup"
      >
        <i class="ri-close-line"></i>
      </button>

      <div class="epn-scroll-body">
        <div v-if="!activeEntryPopup.imageUrl" class="epn-text-hero">
          <div class="epn-hero-ico">
            <i class="ri-notification-3-fill"></i>
          </div>
        </div>

        <component
          :is="activeEntryPopup.linkUrl ? 'a' : 'div'"
          class="epn-content-link"
          :class="{ 'is-clickable': Boolean(activeEntryPopup.linkUrl) }"
          :href="activeEntryPopup.linkUrl || undefined"
          :target="isExternalPopupLink(activeEntryPopup.linkUrl) ? '_blank' : undefined"
          :rel="isExternalPopupLink(activeEntryPopup.linkUrl) ? 'noopener noreferrer' : undefined"
          @click="handleEntryPopupLinkClick($event, activeEntryPopup)"
        >
          <div v-if="activeEntryPopup.imageUrl" class="epn-img-wrap">
            <img
              :src="activeEntryPopup.imageUrl"
              :alt="activeEntryPopup.text || 'Popup notice'"
              class="epn-img"
            />
          </div>

          <div v-if="activeEntryPopup.text" class="epn-caption">
            <h4 v-if="activeEntryPopupParts.headline" class="epn-headline">
              {{ activeEntryPopupParts.headline }}
            </h4>
            <p v-if="activeEntryPopupParts.body" class="epn-text">
              {{ activeEntryPopupParts.body }}
            </p>
          </div>
        </component>
      </div>

      <div class="epn-footer-actions">
        <button
          type="button"
          class="epn-dismiss-btn"
          @click="closeEntryNoticePopup"
        >
          <span>OKAY</span>
        </button>
      </div>

      <div v-if="popupNotices.length > 1" class="epn-pager">
        <button
          type="button"
          class="epn-pager-btn"
          aria-label="Previous"
          @click="stepEntryNoticePopup(-1)"
        >
          <i class="ri-arrow-left-s-line"></i>
        </button>
        <div class="epn-pager-dots">
          {{ entryPopupIndex + 1 }} / {{ popupNotices.length }}
        </div>
        <button
          type="button"
          class="epn-pager-btn"
          aria-label="Next"
          @click="stepEntryNoticePopup(1)"
        >
          <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- ===== MODAL CHI TIẾT SẢN PHẨM ===== -->
<!-- ===== TRANG CHI TIẾT SẢN PHẨM FULL 100% (DESKTOP) ===== -->
<div v-if="showDetail && !isMobile && selectedItem" class="modal-overlay detail-page-overlay" @click="closeDetail">
  <div
    class="modal-card modal-wide detail-page-card"
    :class="{ closing: closingModal }"
    @click.stop
  >
    <header class="detail-page-topbar">
      <div class="detail-page-topbar-inner">
        <button type="button" class="detail-page-back-btn" @click="closeDetail">
          <i class="ri-arrow-left-line"></i>
          <span>{{ $t('cart.backToMenu') }}</span>
        </button>

        <nav class="detail-breadcrumb-bar is-desktop" aria-label="Breadcrumb">
          <button type="button" class="detail-bc-link" @click="closeDetail">
            <i class="ri-store-2-line"></i>
            <span>Menu</span>
          </button>
          <template v-if="selectedItem.Danh_muc_cha || selectedItem.Danh_muc">
            <i class="ri-arrow-right-s-line detail-bc-sep"></i>
            <button
              type="button"
              class="detail-bc-link"
              @click="selectCategoryFromDetail(selectedItem.Danh_muc_cha || selectedItem.Danh_muc, '')"
            >
              {{ selectedItem.Danh_muc_cha || selectedItem.Danh_muc }}
            </button>
          </template>
          <template v-if="selectedItem.Danh_muc_cha && selectedItem.Danh_muc && selectedItem.Danh_muc !== selectedItem.Danh_muc_cha">
            <i class="ri-arrow-right-s-line detail-bc-sep"></i>
            <button
              type="button"
              class="detail-bc-link"
              @click="selectCategoryFromDetail(selectedItem.Danh_muc_cha, selectedItem.Danh_muc)"
            >
              {{ selectedItem.Danh_muc }}
            </button>
          </template>
          <i class="ri-arrow-right-s-line detail-bc-sep"></i>
          <span class="detail-bc-current">{{ selectedItem.Ten_hang }}</span>
        </nav>

        <button type="button" class="modal-close detail-page-close" @click="closeDetail" aria-label="Close">
          <i class="ri-close-line"></i>
        </button>
      </div>
    </header>

    <div class="detail-page-scroll">
      <div class="modal-content detail-page-body">
        <!-- ẢNH BÊN TRÁI -->
        <div class="dp-gallery-card" :class="{ 'no-thumbs': !hasModalThumbs }">
          <div
            class="dp-hero-frame"
            :class="{ 'has-ambient': Boolean(activeDetailImageUrl) }"
            :style="getAmbientGlassStyle(activeDetailImageUrl)"
          >
            <img
              v-if="activeDetailImageUrl"
              :src="activeDetailImageUrl"
              :alt="selectedItem.Ten_hang"
              class="modal-img clickable"
              @click="openImageModal(activeDetailImageUrl)"
              @error="onCardImgError(selectedItem, activeDetailImageUrl)"
            />
            <div v-else class="card-img-name-fallback dp-img-name-fallback">
              <span>{{ selectedItem.Ten_hang }}</span>
            </div>
            <button
              v-if="activeDetailImageUrl"
              type="button"
              class="dp-zoom-pill"
              aria-label="Zoom image"
              @click.stop="openImageModal(activeDetailImageUrl)"
            >
              <i class="ri-zoom-in-line"></i>
              <span v-if="modalImages.length > 1">{{ activeModalIndex + 1 }} / {{ modalImages.length }}</span>
            </button>
            <button
              v-if="modalImages.length > 1"
              type="button"
              class="modal-img-nav prev dp-nav-btn"
              aria-label="Prev image"
              @click.stop="prevModalImage"
            >
              <i class="ri-arrow-left-s-line"></i>
            </button>
            <button
              v-if="modalImages.length > 1"
              type="button"
              class="modal-img-nav next dp-nav-btn"
              aria-label="Next image"
              @click.stop="nextModalImage"
            >
              <i class="ri-arrow-right-s-line"></i>
            </button>
          </div>
          <div v-if="hasModalThumbs" class="dp-thumbs-rail">
            <button
              v-for="(img, idx) in modalImages"
              :key="`${img}-${idx}`"
              type="button"
              class="dp-thumb"
              :class="{ active: idx === activeModalIndex }"
              @click="setActiveModalImage(idx)"
            >
              <img :src="img" alt="" />
            </button>
          </div>
        </div>

        <!-- THÔNG TIN BÊN PHẢI (TỐI GIẢN, KHÔNG KHUNG, KHÔNG BADGE) -->
        <div class="dp-info-card">
          <div class="dp-header-group">
            <div class="dp-meta-line">
              <button
                v-if="selectedItem.Danh_muc_cha"
                type="button"
                class="dp-meta-link"
                @click="selectCategoryFromDetail(selectedItem.Danh_muc_cha, '')"
              >
                {{ selectedItem.Danh_muc_cha }}
              </button>
              <span v-if="selectedItem.Danh_muc_cha && selectedItem.Danh_muc && selectedItem.Danh_muc !== selectedItem.Danh_muc_cha" class="dp-meta-sep">/</span>
              <button
                v-if="selectedItem.Danh_muc && selectedItem.Danh_muc !== selectedItem.Danh_muc_cha"
                type="button"
                class="dp-meta-link"
                @click="selectCategoryFromDetail(selectedItem.Danh_muc_cha || selectedItem.Danh_muc, selectedItem.Danh_muc)"
              >
                {{ selectedItem.Danh_muc }}
              </button>
              <template v-if="selectedItem.Size">
                <span v-if="selectedItem.Danh_muc_cha || selectedItem.Danh_muc" class="dp-meta-sep">·</span>
                <span class="dp-meta-text">Size {{ selectedItem.Size }}</span>
              </template>
              <template v-if="selectedItem.Trang_thai === 'Hết hàng'">
                <span v-if="selectedItem.Danh_muc_cha || selectedItem.Danh_muc || selectedItem.Size" class="dp-meta-sep">·</span>
                <span class="dp-out-text">{{ $t(getStatusKey(selectedItem.Trang_thai)) }}</span>
              </template>
            </div>

            <h1 class="dp-title">
              {{ selectedItem.Ten_hang }}
            </h1>
          </div>

          <div class="dp-price-row">
            <span class="dp-price-current" :class="{ 'is-sale': isDiscount(selectedItem) }">
              {{ formatPrice(finalPrice(selectedItem), selectedItem.Don_vi_tien_te) }}
            </span>
            <span v-if="selectedItem.Dvt" class="dp-price-unit">
              / {{ selectedItem.Dvt }}
            </span>
            <span v-if="isDiscount(selectedItem)" class="dp-price-old">
              {{ formatPrice(selectedItem.Gia_ban, selectedItem.Don_vi_tien_te) }}
            </span>
          </div>

          <div v-if="selectedProductVariants.length" class="dp-variant-group">
            <div class="dp-variant-label">{{ $t('menu.chooseVariant') }}</div>
            <div class="dp-variant-pills">
              <button
                v-for="v in selectedProductVariants"
                :key="'pc-var-' + v.maHang"
                type="button"
                class="dp-variant-pill"
                :class="{
                  active: v.maHang === selectedItem.Ma_hang,
                  'is-out': v.item.Trang_thai === 'Hết hàng'
                }"
                @click="switchDetailVariant(v.item)"
              >
                <span class="dvp-name">{{ v.label }}</span>
                <span class="dvp-price">{{ formatPrice(finalPrice(v.item), v.item.Don_vi_tien_te) }}</span>
              </button>
            </div>
          </div>

          <!-- TOPPING / GỌI THÊM (DESKTOP) -->
          <div v-if="selectedProductToppings.length" class="dp-topping-group">
            <div class="dp-topping-head">
              <span class="dp-variant-label">{{ $t('menu.toppingsTitle') }}</span>
              <span v-if="selectedDetailToppingsCount > 0" class="dp-topping-sel-pill">
                {{ $t('menu.toppingsSelected') }}: {{ selectedDetailToppingsCount }}
              </span>
            </div>
            <div class="dp-topping-list">
              <div
                v-for="tp in selectedProductToppings"
                :key="'pc-tp-' + tp.maHang"
                class="dp-topping-item"
                :class="{
                  active: getDetailToppingQty(tp.maHang) > 0,
                  'is-out': tp.item.Trang_thai === 'Hết hàng',
                }"
                role="checkbox"
                :aria-checked="getDetailToppingQty(tp.maHang) > 0"
                @click="toggleDetailTopping(tp)"
              >
                <span class="dpt-check">
                  <i
                    :class="
                      getDetailToppingQty(tp.maHang) > 0
                        ? 'ri-checkbox-fill'
                        : 'ri-checkbox-blank-line'
                    "
                  ></i>
                </span>
                <img
                  v-if="tp.item.Main_img"
                  :src="tp.item.Main_img"
                  :alt="tp.item.Ten_hang"
                  class="dpt-thumb"
                  loading="lazy"
                />
                <div class="dpt-info">
                  <div class="dpt-name">{{ tp.item.Ten_hang }}</div>
                  <div class="dpt-price">
                    <template v-if="tp.item.Trang_thai === 'Hết hàng'">
                      <span class="dpt-out-txt">{{ $t('status.outOfStock') }}</span>
                    </template>
                    <template v-else>
                      +{{ formatPrice(finalPrice(tp.item), tp.item.Don_vi_tien_te) }}
                    </template>
                  </div>
                </div>
                <div
                  v-if="getDetailToppingQty(tp.maHang) > 0 && tp.item.Trang_thai !== 'Hết hàng'"
                  class="dpt-stepper"
                  @click.stop
                >
                  <button type="button" class="dpt-step-btn" @click="stepDetailTopping(tp, -1)">
                    <i class="ri-subtract-line"></i>
                  </button>
                  <span class="dpt-step-val">{{ getDetailToppingQty(tp.maHang) }}</span>
                  <button type="button" class="dpt-step-btn" @click="stepDetailTopping(tp, 1)">
                    <i class="ri-add-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p v-if="String(selectedItem.Mo_ta || '').trim()" class="dp-desc-text">
            {{ selectedItem.Mo_ta }}
          </p>

          <div class="dp-note-card dp-note-divider">
            <label class="dp-note-label">
              <span>{{ $t('menu.note') }}</span>
            </label>
            <textarea
              rows="3"
              v-model="itemNotes[selectedItem.Ma_hang]"
              class="dp-note-input"
              :placeholder="$t('menu.notePlaceholder')"
            ></textarea>
          </div>

          <div class="dp-action-group">
            <div class="dp-qty-line">
              <div class="qty-row dp-stepper">
                <button type="button" class="dp-qty-minus" @click="decTemp(selectedItem)" aria-label="Decrease">
                  <i class="ri-subtract-line"></i>
                </button>
                <input
                  type="number"
                  min="1"
                  v-model.number="tempQty[selectedItem.Ma_hang]"
                />
                <button type="button" class="dp-qty-plus" @click="incTemp(selectedItem)" aria-label="Increase">
                  <i class="ri-add-line"></i>
                </button>
              </div>
            </div>

            <button
              type="button"
              class="dp-cta-btn"
              :class="{ added: addedMap[selectedItem.Ma_hang] }"
              :disabled="selectedItem.Trang_thai === 'Hết hàng'"
              @click.stop="addToCartFromModal(selectedItem, $event)"
            >
              <template v-if="addedMap[selectedItem.Ma_hang]">
                <i class="ri-checkbox-circle-fill"></i>
              </template>
              <template v-else-if="selectedItem.Trang_thai === 'Hết hàng'">
                <span>{{ $t('status.outOfStock') }}</span>
              </template>
              <template v-else>
                <span>{{ $t('menu.add') }}</span>
                <span class="dp-cta-dot">·</span>
                <span>{{ getDetailCtaTotal(selectedItem) }}</span>
              </template>
            </button>
          </div>
        </div>
      </div>

      <!-- MÓN CÙNG DANH MỤC -->
      <section v-if="relatedDetailItems.length" class="dp-related-section">
        <div class="dp-related-header">
          <h3 class="dp-related-heading">
            <span>{{ $t('menu.relatedItems') }}</span>
          </h3>
        </div>
        <div class="dp-related-grid">
          <button
            v-for="rel in relatedDetailItems"
            :key="'desk-rel-' + rel.Ma_hang"
            type="button"
            class="dp-related-card"
            @click="openDetail(rel)"
          >
            <div class="dp-rel-thumb">
              <img v-if="rel.Main_img" :src="rel.Main_img" :alt="rel.Ten_hang" loading="lazy" />
              <div v-else class="dp-rel-thumb-empty"><i class="ri-image-line"></i></div>
              <span v-if="isDiscount(rel)" class="dp-rel-sale">-{{ discountPercent(rel) }}%</span>
            </div>
            <div class="dp-rel-info">
              <div class="dp-rel-name">{{ rel.Ten_hang }}</div>
              <div class="dp-rel-price">
                {{ formatPrice(finalPrice(rel), rel.Don_vi_tien_te) }}
              </div>
            </div>
          </button>
        </div>
      </section>
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
      <button
        v-if="isMobile"
        type="button"
        class="exm-mob-back-btn"
        :aria-label="$t('cart.back')"
        @click="showExportModal = false"
      >
        <i class="ri-arrow-left-line"></i>
      </button>
      <div v-else class="exm-icon-badge">
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

    <div class="exm-body-scroll">
      <div class="exm-summary-strip">
        <div class="exm-stat-item">
          <i class="ri-shopping-basket-2-line"></i>
          <span>{{ cartQtyTotal }} {{ $t('group.itemsCount') }}</span>
        </div>
        <span class="exm-stat-dot">•</span>
        <div class="exm-stat-item is-price">
          <strong>{{ formatPrice(customerPayableTotal, cartCurrency) }}</strong>
        </div>
        <span class="exm-stat-dot">•</span>
        <div class="exm-stat-item">
          <i :class="hinhThucTT === 'CHUYEN_KHOAN' ? 'ri-bank-card-line' : 'ri-money-dollar-circle-line'"></i>
          <span>{{ hinhThucTT === 'CHUYEN_KHOAN' ? $t('cart.transfer') : $t('cart.cash') }}</span>
        </div>
        <span
          v-if="liveStatus && liveStatus !== 'Nháp'"
          class="exm-saved-pill"
          :class="{ 'is-pop': exportProgressDropHit }"
        >
          <i class="ri-checkbox-circle-fill"></i> {{ $t('export.savedWeb') }}
        </span>
      </div>

      <div
        ref="exportProgressCardRef"
        class="grab-status-card in-full-modal in-export-modal"
        :class="[
          orderStatusInfo.stateClass,
          {
            'is-cancelled': orderStatusProgress.isCancelled,
            'is-pre-drop': exportProgressPreDrop,
            'is-drop-hit': exportProgressDropHit,
          },
        ]"
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
      <span class="category-title-text">{{ $t('modal.chooseCategory') }}</span>
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
        class="cat-group-wrap"
      >
        <div
          class="cat cat-tree-parent"
          :class="{
            active: c === currentCategory && !currentSubCategory,
            'is-parent-active': c === currentCategory && Boolean(currentSubCategory),
            sale: c === 'Sale',
            'is-parent-cat': isParentCategoryEntry(c)
          }"
          @click="selectCategory(c, { keepModalOpenIfHasSub: true })"
        >
          <span class="cat-label">{{ c }}</span>

          <span
            v-if="c === 'Sale'"
            class="category-sale-badge cat-sale-pill"
          >
            SALE
          </span>

          <button
            v-if="getHierarchySubCategories(c).length"
            type="button"
            class="cat-chevron-btn"
            @click.stop="toggleCatParentExpanded(c)"
          >
            <span class="cat-sub-count">{{ getHierarchySubCategories(c).length }}</span>
            <i :class="isCatParentExpanded(c) ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
          </button>
        </div>
        <div
          v-if="getHierarchySubCategories(c).length && isCatParentExpanded(c)"
          class="sub-cat-tree is-modal"
        >
          <button
            type="button"
            class="sub-cat-tree-item"
            :class="{ active: c === currentCategory && !currentSubCategory }"
            @click.stop="selectParentAndSub(c, '')"
          >
            <span>{{ $t('filter.all') }}</span>
          </button>
          <button
            v-for="sub in getHierarchySubCategories(c)"
            :key="'mod-sub-' + c + '-' + sub.label"
            type="button"
            class="sub-cat-tree-item"
            :class="{ active: c === currentCategory && currentSubCategory === sub.label }"
            @click.stop="selectParentAndSub(c, sub.label)"
          >
            <span>{{ sub.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</transition>
<!-- ===== MODAL LIÊN HỆ (MOBILE) ===== -->
 <transition name="mobile-modal">
<div
  v-if="showContactModal"
  class="modal-overlay z-top contact-sheet-overlay"
  @click="showContactModal = false"
>
  <div class="modal-card contact-support-sheet" @click.stop>
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
    :class="{ 'is-dock-hidden': isMobileDockHidden }"
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
            <span v-if="cartItems.length > 0">• {{ formatPrice(customerPayableTotal, cartCurrency) }}</span>
          </div>
        </div>

        <div class="mcb-tracker-actions" @click.stop>
          <button
            v-if="liveStatus === 'Chờ duyệt' && isGroupHost"
            type="button"
            class="mcb-edit-btn"
            :class="{ 'has-added-badge': addedItemsAfterSubmitCount > 0 }"
            :title="$t('mobile.editOrder')"
            :aria-label="$t('mobile.editOrder')"
            @click="openMobilePanel('cart')"
          >
            <i class="ri-shopping-bag-3-line"></i>
            <span
              v-if="addedItemsAfterSubmitCount > 0"
              class="mcb-edit-badge"
              :class="{ bump: bumpCart }"
            >
              +{{ addedItemsAfterSubmitCount }}
            </span>
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
            v-else-if="liveStatus === 'Chờ duyệt' && hasOrderChangesAfterSubmit && isGroupHost"
            type="button"
            class="mcb-action-cta is-update-red"
            @click="onContinueToFullModal"
          >
            <i class="ri-refresh-line"></i>
            <span>{{ $t('mobile.updateOrderShort') }}</span>
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
            {{ cartQtyTotal }} {{ $t('group.itemsCount') }} • {{ formatPrice(customerPayableTotal, cartCurrency) }}
          </div>
        </div>
        <span class="mcb-action-cta">
          <span>{{ $t('mobile.cart') }}</span>
          <i class="ri-arrow-right-s-line"></i>
        </span>
      </div>
    </button>

    <!-- 3. CHƯA GỬI ĐƠN (THANH TOÁN TRÁI / GIỎ HÀNG PHẢI) -->
    <div v-else class="mcb-pills-row">
      <!-- PILL TRÁI: Thanh toán / Hoàn thành + số tiền -->
      <button class="cart-bar-pill-right" @click="openMobilePanel('cart')">
        <span class="cart-bar-label">
          {{
            isGroupGuest
              ? $t('group.guestFinishBtn')
              : $t('mobile.checkout')
          }}
        </span>
        <span class="cart-bar-total">{{ formatPrice(customerPayableTotal, cartCurrency) }}</span>
      </button>

      <!-- PILL PHẢI: Icon giỏ hàng + badge số lượng -->
      <div class="cart-bar-pill-left" @click="openMobilePanel('cart')">
        <i class="ri-shopping-cart-2-fill cart-bar-icon"></i>
        <span class="cart-bar-badge">{{ cartQtyTotal }}</span>
      </div>
    </div>
  </div>
</transition>

<div
  v-if="isMobile"
  class="mobile-bottom-bar"
  :class="{ 'is-dock-hidden': isMobileDockHidden }"
>
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
        {{ $t('mobile.menu') }}
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
          <i class="ri-shopping-cart-2-fill dock-accent-ico"></i>

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
            class="dock-accent-ico"
            :class="
              isGroupGuest
                ? isMyGuestSelectionDone
                  ? 'ri-checkbox-circle-fill'
                  : 'ri-check-double-line'
                : 'ri-send-plane-fill'
            "
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
          v-if="(liveStatus && liveStatus !== 'Nháp') || liveAdminMessage"
          class="mps-status-notice"
          :class="orderStatusInfo.stateClass"
        >
          <i :class="orderStatusInfo.icon"></i>
          <div class="status-notice-body">
            <span v-if="liveStatus && liveStatus !== 'Nháp'">
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
            <div
              v-if="liveAdminMessage"
              class="status-shop-msg-box"
            >
              <strong class="status-shop-msg-lbl">{{ $t('orderStatus.shopMessageLabel') }}:</strong>
              <span>{{ liveAdminMessage }}</span>
            </div>
          </div>
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
            <div v-if="liveCreatedAt && liveStatus && liveStatus !== 'Nháp'" class="mps-info-row">
              <span class="mps-info-lbl">{{ createdAtLabel }}</span>
              <span class="mps-info-val">{{ liveCreatedAt }}</span>
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
              <span class="mps-info-val">{{ displayDeliveryTime }}</span>
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

          <div class="mps-summary-group">
            <template v-if="syncedShippingFee > 0 || syncedAdminDiscount > 0">
              <div class="mps-items-subtotal-row">
                <span>{{ syncedItemsLabel }}</span>
                <strong>{{ formatPrice(itemsSubtotalAmount, cartCurrency) }}</strong>
              </div>

              <div v-if="syncedAdminDiscount > 0" class="mps-discount-row">
                <span>{{ syncedDiscountLabel }}</span>
                <strong>-{{ formatPrice(syncedAdminDiscount, cartCurrency) }}</strong>
              </div>

              <div v-if="syncedShippingFee > 0" class="mps-ship-row">
                <span>{{ syncedShippingLabel }}</span>
                <strong>+{{ formatPrice(syncedShippingFee, cartCurrency) }}</strong>
              </div>
            </template>

            <div
              class="mps-grand-total"
              :class="{ 'has-breakdown': syncedShippingFee > 0 || syncedAdminDiscount > 0 }"
            >
              <span>{{ $t('cart.total') }}</span>
              <strong>{{ formatPrice(customerPayableTotal, cartCurrency) }}</strong>
            </div>
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
      </template>
    </div>

    <!-- STICKY FOOTER HÀNH ĐỘNG ĐƠN HÀNG -->
    <div
      v-if="
        !(isCartVisuallyEmpty && (!liveStatus || liveStatus === 'Nháp'))
        && (isOrderTerminal || isOrderLocked || (isGroupHost && !isOrderLocked))
      "
      class="mps-footer"
    >
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
            v-if="!isOrderInDeliveryProgress"
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
    </div>
  </aside>
</transition>

<!-- ===== MODAL CHỌN NGÔN NGỮ ===== -->
<!-- ===== MODAL CHỌN NGÔN NGỮ ===== -->
<div v-if="showLangModal" class="modal-overlay is-center-dialog" @click.self="showLangModal = false">
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
    <div
      class="image-modal-card"
      :class="{ 'has-link': Boolean(previewImageLink) }"
      @click.stop
    >
      <button type="button" class="modal-close" @click="closeImageModal">✕</button>

      <img
        :src="previewImage"
        class="image-preview"
        alt=""
      />

      <a
        v-if="previewImageLink"
        :href="previewImageLink"
        target="_blank"
        rel="noopener noreferrer"
        class="image-modal-link-btn"
        @click="closeImageModal"
      >
        <span>{{ $t('common.openLink') }}</span>
        <i class="ri-external-link-line"></i>
      </a>
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
    <div v-if="!editingItem?.isAdminAdded" class="note-box qty-note-box">
      <label class="qty-note-label">
        {{ $t('group.orderedBy') }}
      </label>
      <input
        v-model="editAuthor"
        type="text"
        class="qty-note-input"
        :placeholder="$t('group.yourNamePlaceholder')"
      />
    </div>

    <!-- GHI CHÚ -->
    <div class="note-box qty-note-box qty-note-box-last">
      <label class="qty-note-label">
        {{ $t('menu.note') }}
      </label>
      <textarea
        v-model="editNote"
        rows="2"
        class="qty-note-input"
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

        <span
          v-if="!isMobile && activeOrderId && liveCreatedAt && liveStatus && liveStatus !== 'Nháp'"
          class="fcm-created-pill"
          :title="createdAtLabel"
        >
          <i class="ri-calendar-check-line"></i>
          <span>{{ liveCreatedAt }}</span>
        </span>
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

        <span
          v-if="isMobile && activeOrderId && liveCreatedAt && liveStatus && liveStatus !== 'Nháp'"
          class="fcm-created-pill"
          :title="createdAtLabel"
        >
          <i class="ri-calendar-check-line"></i>
          <span>{{ liveCreatedAt }}</span>
        </span>

        <button
          type="button"
          class="group-invite-btn fcm-invite-btn"
          :disabled="creatingGroupSession"
          @click="openGroupShareModal"
        >
          <i class="ri-team-fill"></i>
          <span>{{ $t('group.groupOrderBtn') }}</span>
        </button>

        <button
          v-if="activeOrderId && (liveStatus === 'Nháp' || isOrderLocked) && !isOrderInDeliveryProgress"
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

              <div
                ref="dt24PickerWrapRef"
                class="form-field dt24-inline-field"
                :class="{ 'is-mobile-dt24': isMobile }"
                @keydown.esc="activeDt24Panel = null"
              >
                <label class="dt24-inline-label">{{ $t('cart.time') }}</label>

                <div v-if="isMobile && !isOrderLocked" class="dt24-mobile-presets">
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
                    v-if="deliveryHour || deliveryMinute || thoiGian"
                    type="button"
                    class="dt24-preset-chip is-clear"
                    :aria-label="$t('menu.clearFilter')"
                    @click="clearDeliveryTime"
                  >
                    <i class="ri-close-line"></i>
                  </button>
                </div>

                <div class="dt24-picker-row" :class="{ disabled: isOrderLocked, 'is-open': Boolean(activeDt24Panel) }">
                  <div class="dt24-segment dt24-pill is-time" :class="{ 'is-active': activeDt24Panel === 'hh' || activeDt24Panel === 'mm' }">
                    <i class="ri-time-line dt24-seg-ico"></i>
                    <div class="dt24-select-wrap">
                      <button
                        type="button"
                        class="dt24-select-btn"
                        :class="{ empty: !deliveryHour, open: activeDt24Panel === 'hh' }"
                        :disabled="isOrderLocked"
                        @click.stop="toggleDt24Panel('hh')"
                      >
                        <span>{{ deliveryHour || $t('cart.timeHour') }}</span>
                        <i class="ri-arrow-down-s-line dt24-caret"></i>
                      </button>
                      <div
                        v-if="!isOrderLocked && activeDt24Panel === 'hh'"
                        class="dt24-col-menu is-compact"
                        @click.stop
                      >
                        <button
                          v-for="h in HOURS_24_LIST"
                          :key="'h24-' + h"
                          type="button"
                          class="dt24-col-opt"
                          :class="{ selected: deliveryHour === h }"
                          @click="onSelectDeliveryHour(h)"
                        >
                          {{ h }}
                        </button>
                      </div>
                    </div>

                    <span class="dt24-sep">:</span>

                    <div class="dt24-select-wrap">
                      <button
                        type="button"
                        class="dt24-select-btn"
                        :class="{ empty: !deliveryMinute, open: activeDt24Panel === 'mm' }"
                        :disabled="isOrderLocked"
                        @click.stop="toggleDt24Panel('mm')"
                      >
                        <span>{{ deliveryMinute || $t('cart.timeMinute') }}</span>
                        <i class="ri-arrow-down-s-line dt24-caret"></i>
                      </button>
                      <div
                        v-if="!isOrderLocked && activeDt24Panel === 'mm'"
                        class="dt24-col-menu is-compact"
                        @click.stop
                      >
                        <button
                          v-for="m in MINUTES_60_LIST"
                          :key="'m60-' + m"
                          type="button"
                          class="dt24-col-opt"
                          :class="{ selected: deliveryMinute === m }"
                          @click="onSelectDeliveryMinute(m)"
                        >
                          {{ m }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="dt24-segment dt24-pill is-date" :class="{ 'is-active': activeDt24Panel === 'date' }">
                    <i class="ri-calendar-event-line dt24-seg-ico"></i>
                    <div class="dt24-select-wrap is-date-wrap">
                      <button
                        type="button"
                        class="dt24-select-btn dt24-date-btn"
                        :class="{ open: activeDt24Panel === 'date' }"
                        :disabled="isOrderLocked"
                        @click.stop="toggleDt24Panel('date')"
                      >
                        <span>{{ selectedDeliveryDateLabel }}</span>
                        <i class="ri-arrow-down-s-line dt24-caret"></i>
                      </button>
                      <div
                        v-if="!isOrderLocked && activeDt24Panel === 'date'"
                        class="dt24-col-menu is-date-menu"
                        @click.stop
                      >
                        <button
                          v-for="opt in deliveryDateOptions"
                          :key="'ddate-' + opt.value"
                          type="button"
                          class="dt24-col-opt is-date-opt"
                          :class="{ selected: deliveryDate === opt.value }"
                          @click="onSelectDeliveryDate(opt.value)"
                        >
                          <span class="dt24-date-opt-main">{{ opt.label }}</span>
                          <span v-if="opt.subDate" class="dt24-date-opt-sub">{{ opt.subDate }}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-if="!isMobile && !isOrderLocked && (deliveryHour || deliveryMinute || thoiGian)" class="dt24-quick-actions">
                    <button
                      type="button"
                      class="dt24-clear-btn"
                      :aria-label="$t('menu.clearFilter')"
                      @click.stop="clearDeliveryTime"
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
                <span>{{ displayDeliveryTime }}</span>
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
            <div class="status-notice-body">
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
              <div
                v-if="liveAdminMessage"
                class="status-shop-msg-box"
              >
                <strong class="status-shop-msg-lbl">{{ $t('orderStatus.shopMessageLabel') }}:</strong>
                <span>{{ liveAdminMessage }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="liveAdminMessage" class="fcm-locked-box">
            <i class="ri-notification-3-fill"></i>
            <div class="status-notice-body">
              <div class="status-shop-msg-box">
                <strong class="status-shop-msg-lbl">{{ $t('orderStatus.shopMessageLabel') }}:</strong>
                <span>{{ liveAdminMessage }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PINNED CHECKOUT FOOTER: TỔNG CỘNG -> CHECKPOINT ƯU ĐÃI -> TRẠNG THÁI ĐƠN -> GỬI ĐƠN -->
        <div class="fcm-checkout-footer">
          <div class="fcm-summary-card">
            <template v-if="syncedShippingFee > 0 || syncedAdminDiscount > 0">
              <div class="fcm-items-subtotal-row">
                <span>{{ syncedItemsLabel }}</span>
                <strong>{{ formatPrice(itemsSubtotalAmount, cartCurrency) }}</strong>
              </div>
              <div v-if="syncedAdminDiscount > 0" class="fcm-discount-row">
                <span>{{ syncedDiscountLabel }}</span>
                <strong>-{{ formatPrice(syncedAdminDiscount, cartCurrency) }}</strong>
              </div>
              <div v-if="syncedShippingFee > 0" class="fcm-ship-row">
                <span>{{ syncedShippingLabel }}</span>
                <strong>+{{ formatPrice(syncedShippingFee, cartCurrency) }}</strong>
              </div>
              <div class="fcm-summary-divider"></div>
            </template>
            <div class="cart-total fcm-grand-total">
              <span>{{ $t('cart.total') }}</span>
              <strong>{{ formatPrice(customerPayableTotal, cartCurrency) }}</strong>
            </div>
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
<!-- ===== MODAL THÔNG BÁO HOÀN THÀNH / HỦY ĐƠN TỪ QUÁN ===== -->
<div
  v-if="orderFinalNoticeModal.show"
  class="modal-overlay z-top ofn-overlay is-center-dialog"
  @click="closeOrderFinalNoticeModal()"
>
  <div
    class="modal-card ofn-modal-card"
    :class="orderFinalNoticeModal.status === 'Đã hủy' ? 'is-cancelled' : 'is-completed'"
    @click.stop
  >
    <button
      type="button"
      class="modal-close"
      @click="closeOrderFinalNoticeModal()"
    >
      ✕
    </button>
    <div class="ofn-content">
      <div
        class="ofn-icon-badge"
        :class="
          orderFinalNoticeModal.status === 'Đã hủy'
            ? 'is-cancelled'
            : orderFinalNoticeModal.status === 'message'
              ? 'is-message'
              : 'is-completed'
        "
      >
        <i
          :class="
            orderFinalNoticeModal.status === 'Đã hủy'
              ? 'ri-close-circle-fill'
              : orderFinalNoticeModal.status === 'message'
                ? 'ri-notification-3-fill'
                : 'ri-checkbox-circle-fill'
          "
        ></i>
      </div>
      <h3 class="ofn-title">
        {{
          orderFinalNoticeModal.status === 'Đã hủy'
            ? $t('orderStatus.finalCancelledTitle', { code: orderFinalNoticeModal.orderId || 'WEB' })
            : orderFinalNoticeModal.status === 'message'
              ? `${$t('orderStatus.shopMessageLabel')} #${orderFinalNoticeModal.orderId || 'WEB'}`
              : $t('orderStatus.finalCompletedTitle', { code: orderFinalNoticeModal.orderId || 'WEB' })
        }}
      </h3>
      <p v-if="orderFinalNoticeModal.status !== 'message'" class="ofn-desc">
        {{
          orderFinalNoticeModal.status === 'Đã hủy'
            ? $t('orderStatus.cancelledNotice')
            : $t('orderStatus.completedNotice')
        }}
      </p>

      <div v-if="orderFinalNoticeModal.adminMessage" class="ofn-shop-msg">
        <div v-if="orderFinalNoticeModal.status !== 'message'" class="ofn-shop-msg-head">
          <i class="ri-notification-3-fill"></i>
          <span>{{ $t('orderStatus.shopMessageLabel') }}</span>
        </div>
        <p class="ofn-shop-msg-text">{{ orderFinalNoticeModal.adminMessage }}</p>
      </div>

      <div class="ofn-actions-stack">
        <button
          v-if="messagingContactList.length || shopContactList.length"
          type="button"
          class="ofn-btn is-contact"
          @click="openShopChatFromFinalNotice"
        >
          <img
            v-if="messagingContactList[0]?.URL_img"
            :src="messagingContactList[0].URL_img"
            class="ofn-contact-img"
            alt=""
          />
          <i v-else class="ri-chat-3-fill"></i>
          <span>
            {{
              messagingContactList[0]?.PLATFORM_name
                ? $t('group.messageViaChannel', { platform: messagingContactList[0].PLATFORM_name })
                : $t('group.messageShopBtn')
            }}
          </span>
        </button>

        <div class="ofn-actions">
          <button
            v-if="!orderFinalNoticeModal.switchOnClose"
            type="button"
            class="ofn-btn"
            :class="orderFinalNoticeModal.status === 'message' ? 'is-primary' : 'is-secondary'"
            @click="closeOrderFinalNoticeModal()"
          >
            {{ $t('orderStatus.finalCloseBtn') }}
          </button>
          <button
            v-if="orderFinalNoticeModal.status !== 'message'"
            type="button"
            class="ofn-btn is-primary"
            @click="closeOrderFinalNoticeModal({ startNew: true })"
          >
            {{ $t('orderStatus.finalNewOrderBtn') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ===== MODAL THÔNG BÁO GIỎ HÀNG TRỐNG ===== -->
<div v-if="showEmptyCartModal" class="modal-overlay z-top is-center-dialog" @click="showEmptyCartModal = false">
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

<!-- ===== MODAL KHI ĐƠN CHỜ DUYỆT BỊ XÓA SẠCH GIỎ ===== -->
<div
  v-if="showEmptyPendingOrderModal"
  class="modal-overlay z-top is-center-dialog"
  @click="showEmptyPendingOrderModal = false"
>
  <div class="modal-card empty-pending-order-modal" @click.stop>
    <button
      type="button"
      class="modal-close"
      :disabled="emptyPendingActionBusy"
      @click="showEmptyPendingOrderModal = false"
    >
      ✕
    </button>
    <div class="epo-content">
      <div class="epo-icon-badge">
        <i class="ri-error-warning-line"></i>
      </div>
      <h3 class="epo-title">{{ emptyPendingModalCopy.title }}</h3>
      <p class="epo-desc">{{ emptyPendingModalCopy.desc }}</p>

      <div class="epo-actions">
        <button
          type="button"
          class="epo-btn is-restore"
          :disabled="emptyPendingActionBusy"
          @click="restoreEmptyPendingOrder"
        >
          <i class="ri-history-line"></i>
          <span>{{ emptyPendingModalCopy.restoreBtn }}</span>
        </button>

        <button
          type="button"
          class="epo-btn is-cancel"
          :disabled="emptyPendingActionBusy"
          @click="cancelEmptyPendingOrder"
        >
          <i class="ri-close-circle-line"></i>
          <span>{{ emptyPendingModalCopy.cancelBtn }}</span>
        </button>

        <button
          type="button"
          class="epo-btn is-pick"
          :disabled="emptyPendingActionBusy"
          @click="pickMoreFromEmptyPendingModal"
        >
          <i class="ri-add-circle-line"></i>
          <span>{{ emptyPendingModalCopy.pickBtn }}</span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ===== MODAL THÔNG BÁO ĐƠN ĐANG CHUẨN BỊ / GIAO -> NHẮN TIN QUÁN ===== -->
<div
  v-if="showLockedOrderContactModal"
  class="modal-overlay z-top is-center-dialog"
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
        v-if="!isOrderInDeliveryProgress"
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
<div v-if="showJoinGroupModal" class="modal-overlay z-top is-center-dialog" @click="confirmJoinGroup">
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
      <button
        v-if="activeOrderId"
        type="button"
        class="gsm-tg-share-btn"
        @click="shareGroupOrderViaTelegram"
      >
        <i class="ri-telegram-fill"></i>
        <span>{{ $t('group.shareTelegramBtn') }}</span>
      </button>
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
  </div>
</div>

<!-- ===== MODAL BÁO THÀNH VIÊN CHƯA HOÀN THÀNH CHỌN MÓN ===== -->
<div v-if="showUnfinishedGuestsModal" class="modal-overlay z-top is-center-dialog" @click="showUnfinishedGuestsModal = false">
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
<div v-if="memberToRemove" class="modal-overlay z-top is-center-dialog" @click="memberToRemove = null">
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
<div v-if="showGuestNudgeModal" class="modal-overlay z-top is-center-dialog" @click="showGuestNudgeModal = false">
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
<div v-if="showKickedModal" class="modal-overlay z-top is-center-dialog" @click="startNewOrderFromKick">
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

<!-- ===== PRO VIP MEDALLION -> BEZIER COMET -> PROGRESS LOCK-ON ANIMATION ===== -->
<Teleport to="body">
  <div
    v-if="exportSubmitFx.visible"
    class="sa-submit-fx-layer"
    :class="{
      'is-dark': isDarkMode,
      'is-flying': exportSubmitFx.flying,
      'is-impacting': exportSubmitFx.impacting,
    }"
  >
    <div
      class="sa-submit-fx-backdrop"
      :class="{ 'is-fading': exportSubmitFx.flying || exportSubmitFx.impacting }"
    ></div>

    <!-- Pre-pooled 60fps Bezier comet ribbon dots -->
    <span
      v-for="idx in 8"
      :key="'sfx-comet-' + idx"
      :ref="(el) => setCometDotRef(el, idx - 1)"
      class="sfx-comet-dot"
      :class="{ 'is-gold': idx % 2 === 0 }"
    ></span>

    <!-- Impact shockwave burst anchored at exact target node coordinates -->
    <div
      v-if="exportSubmitFx.impacting"
      class="sfx-impact-burst"
      :style="{
        transform: `translate3d(${exportSubmitFx.impactX}px, ${exportSubmitFx.impactY}px, 0)`,
      }"
    >
      <span class="sfx-impact-ring r1"></span>
      <span class="sfx-impact-ring r2"></span>
      <span class="sfx-impact-flash"></span>
    </div>

    <!-- Center Hero Stage (Frameless Medallion + Floating Caption) -->
    <div v-show="!exportSubmitFx.impacting" class="sfx-hero-stage">
      <div
        ref="exportSubmitFxCardRef"
        class="sfx-medallion"
        :class="{
          'is-entering': !exportSubmitFx.flying,
          'is-condensing': exportSubmitFx.flying,
        }"
      >
        <span class="sfx-aurora-halo"></span>
        <span class="sfx-sonar-ring r1"></span>
        <span class="sfx-sonar-ring r2"></span>

        <div class="sfx-sparks" aria-hidden="true">
          <span
            v-for="sp in 8"
            :key="'sfx-sp-' + sp"
            class="sfx-spark"
            :class="{ 'is-gold': sp % 2 === 0 }"
            :style="{ '--sfx-ang': `${(sp - 1) * 45}deg` }"
          ></span>
        </div>

        <span class="sfx-orbit-ring"></span>

        <div class="sfx-core-sphere">
          <svg class="sfx-check-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle
              class="sfx-svg-ring"
              cx="32"
              cy="32"
              r="27"
              stroke="rgba(255,255,255,0.42)"
              stroke-width="2.4"
            />
            <path
              class="sfx-svg-tick"
              d="M19.5 33.2L28.2 41.8L45.2 23.2"
              stroke="#ffffff"
              stroke-width="5.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <div class="sfx-float-caption" :class="{ 'is-dissolving': exportSubmitFx.flying }">
        <div class="sfx-caption-pill">
          <strong class="sfx-title">
            {{
              exportSubmitFx.isUpdate
                ? $t('export.updateSuccessTitle')
                : $t('export.submitSuccessTitle')
            }}
          </strong>
          <span v-if="exportSubmitFx.orderCode" class="sfx-code-pill">
            #{{ exportSubmitFx.orderCode }}
          </span>
        </div>
        <span class="sfx-sub">{{ $t('export.submitSuccessSub') }}</span>
      </div>
    </div>
  </div>
</Teleport>

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
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import L from 'leaflet'
import QrcodeVue from 'qrcode.vue'
import SeasonalOverlay from '@/components/SeasonalOverlay.vue'
import CookingSplashIntro from '@/components/CookingSplashIntro.vue'
import {
  buildStorefrontThemeVars,
  getStorefrontMetaThemeColor,
  loadCachedStorefrontTheme,
  saveCachedStorefrontTheme,
  applyStorefrontThemeToRoot,
  clearStorefrontThemeFromRoot,
} from '@/utils/storefrontTheme'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getStorefrontSheets,
  subscribeSheet,
  subscribeLiveOrder,
  ensureLiveOrderSession,
  upsertLiveOrderMember,
  markAllLiveOrderMembersDone,
  rejoinLiveOrderMember,
  removeLiveOrderMember,
  upsertLiveOrderItem,
  removeLiveOrderItem,
  updateLiveOrderMeta,
  restoreSubmittedLiveOrderDraft,
  submitCustomerOrder,
  dispatchAction,
  genOrderId,
  makeLineId,
} from '@/config/api'
import {
  localizeProduct,
  productMatchesKeyword,
  resolveNoticeText,
  getProductUrlParams,
  findProductByUrlParams,
} from '@/utils/i18nData'
import {
  rankProductsWithMeta,
  getAccentInsensitiveHighlights,
} from '@/utils/searchUtils'
import {
  normalizeDisplayConfig,
  sortProductsFlat,
  sortLocalizedCategories,
  buildCategoryHierarchy,
  getEffectiveParentCategory,
  getSubCategoriesForParent,
  getLinkedProductVariants,
  getLinkedProductToppings,
  sortProductsByCategoryOrder,
  DISPLAY_MODE_BY_CATEGORY,
} from '@/utils/displayOrder'
import { bindOrderBellUnlock, playOrderBell } from '@/utils/orderBell'
import {
  BANNER_CLICK_ACTIONS,
  normalizeBannerAction,
  normalizeBannerLink,
  openBannerLinkInNewTab,
} from '@/utils/bannerLink'
import {
  resolveBrandAssets,
  buildSeoJsonLdGraph,
  toFaviconAssetUrl,
  toMobileIconAssetUrl,
} from '@/utils/brandAssets'
import {
  initTelegramMiniApp,
  syncTelegramMiniAppTheme,
  setTelegramClosingConfirmation,
  isTelegramMiniApp,
  getTelegramUserProfile,
  getTelegramInitData,
  getTelegramStartOrderId,
  mapTelegramLangToAppLang,
  triggerTelegramHaptic,
  buildTelegramGroupShareAppUrl,
  openTelegramShareUrl,
} from '@/utils/telegramMiniApp'
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
const displayConfigRows = ref([])
const displayConfig = computed(() => normalizeDisplayConfig(displayConfigRows.value))

const isProductHidden = (item) =>
  item?.Is_hidden === true ||
  String(item?.Is_hidden) === 'true' ||
  String(item?.Trang_thai || '').trim() === 'Ẩn'

const menu = computed(() =>
  sortProductsFlat(
    rawMenu.value
      .filter((m) => !isProductHidden(m))
      .map((m) => localizeProduct(m, currentLang.value)),
  ),
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
const SA_INTRO_SPLASH_SESSION_KEY = 'SA_INTRO_SPLASH_SHOWN'
const cachedStorefrontTheme = ref(loadCachedStorefrontTheme())

function shouldPlayCookingSplashOnLoad() {
  if (typeof window === 'undefined') return false
  // Skip intro when entering directly via a shared group-order link (?order=...)
  if (route.query?.order) return false
  const mode = cachedStorefrontTheme.value?.introSplashMode || 'once_session'
  if (mode === 'off') return false
  if (mode === 'once_session') {
    try {
      if (sessionStorage.getItem(SA_INTRO_SPLASH_SESSION_KEY) === '1') {
        return false
      }
      sessionStorage.setItem(SA_INTRO_SPLASH_SESSION_KEY, '1')
    } catch {}
  }
  return true
}

const showCookingSplash = ref(shouldPlayCookingSplashOnLoad())
const hasRemoteDisplayConfig = computed(
  () => Array.isArray(displayConfigRows.value) && displayConfigRows.value.length > 0,
)
const activeStorefrontTheme = computed(() =>
  hasRemoteDisplayConfig.value
    ? displayConfig.value.themeConfig
    : cachedStorefrontTheme.value,
)
const themeMode = ref(activeStorefrontTheme.value.defaultColorScheme || 'light')
const SA_MENU_VIEW_MODE_KEY = 'SA_MENU_VIEW_MODE_V1'
const SA_MENU_VIEW_MODE_AT_KEY = 'SA_MENU_VIEW_MODE_AT_V1'
const menuViewMode = ref(
  activeStorefrontTheme.value.defaultMenuViewMode === 'board' ? 'board' : 'card',
)
try {
  const savedViewMode = localStorage.getItem(SA_MENU_VIEW_MODE_KEY)
  const savedViewAt = Number(localStorage.getItem(SA_MENU_VIEW_MODE_AT_KEY) || 0)
  const cachedThemeAt = Number(activeStorefrontTheme.value.updatedAt || 0)
  if (
    (savedViewMode === 'board' || savedViewMode === 'card') &&
    savedViewAt > 0 &&
    savedViewAt >= cachedThemeAt
  ) {
    menuViewMode.value = savedViewMode
  }
} catch {}

function setMenuViewMode(mode) {
  const next = mode === 'board' ? 'board' : 'card'
  menuViewMode.value = next
  try {
    localStorage.setItem(SA_MENU_VIEW_MODE_KEY, next)
    localStorage.setItem(SA_MENU_VIEW_MODE_AT_KEY, String(Date.now()))
  } catch {}
}

const storefrontThemeVars = computed(() =>
  buildStorefrontThemeVars(activeStorefrontTheme.value, themeMode.value),
)

watch(
  () => (hasRemoteDisplayConfig.value ? displayConfig.value.themeConfig : null),
  (remoteTheme) => {
    if (!remoteTheme) return
    cachedStorefrontTheme.value = remoteTheme
    saveCachedStorefrontTheme(remoteTheme)
    try {
      const userSavedMode = localStorage.getItem(SA_THEME_MODE_KEY)
      if (userSavedMode !== 'dark' && userSavedMode !== 'light') {
        themeMode.value = remoteTheme.defaultColorScheme || 'light'
      }
      const userSavedView = localStorage.getItem(SA_MENU_VIEW_MODE_KEY)
      const userSavedViewAt = Number(localStorage.getItem(SA_MENU_VIEW_MODE_AT_KEY) || 0)
      const remoteUpdatedAt = Number(remoteTheme.updatedAt || 0)
      const hasFreshUserChoice =
        (userSavedView === 'card' || userSavedView === 'board') &&
        userSavedViewAt > 0 &&
        userSavedViewAt >= remoteUpdatedAt
      if (!hasFreshUserChoice) {
        menuViewMode.value = remoteTheme.defaultMenuViewMode === 'board' ? 'board' : 'card'
      }
    } catch {
      menuViewMode.value = remoteTheme.defaultMenuViewMode === 'board' ? 'board' : 'card'
    }
  },
  { immediate: true, deep: true },
)

watch(
  [storefrontThemeVars, activeStorefrontTheme, themeMode],
  ([vars, cfg, mode]) => {
    applyStorefrontThemeToRoot(vars, getStorefrontMetaThemeColor(cfg, mode))
  },
  { immediate: true },
)

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
let unsubDisplayConfigLive = null
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
      themeMode.value = activeStorefrontTheme.value.defaultColorScheme || 'light'
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
const liveAdminMessage = computed(() =>
  String(liveOrderData.value?.meta?.Admin_message || '').trim(),
)
const liveCreatedAt = computed(() =>
  String(liveOrderData.value?.meta?.Ngay_tao_duong_lich || '').trim(),
)
const createdAtLabel = computed(() => {
  const lang = currentLang.value
  if (lang === 'en') return 'Created at'
  if (lang === 'zh') return '下单时间'
  if (lang === 'ko') return '주문 시간'
  return 'Thời gian tạo đơn'
})
const isOrderTerminal = computed(
  () => liveStatus.value === 'Hoàn thành' || liveStatus.value === 'Đã hủy',
)
const isOrderInDeliveryProgress = computed(
  () => liveStatus.value === 'Đang xử lý' || liveStatus.value === 'Đang ship',
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
function formatDateDMY(d = new Date()) {
  const p = (num) => String(num).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function getRelativeDateDMY(dayOffset = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  return formatDateDMY(d)
}

function format24hDateTimeObj(d = new Date()) {
  const p = (num) => String(num).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())} ${formatDateDMY(d)}`
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

const HOURS_24_LIST = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_60_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const dt24PickerWrapRef = ref(null)
const activeDt24Panel = ref(null) // null | 'hh' | 'mm' | 'date'
const deliveryHour = ref('')
const deliveryMinute = ref('')
const deliveryDate = ref(getRelativeDateDMY(0))

const deliveryDateOptions = computed(() => {
  const opts = []
  const seen = new Set()
  const todayLabel = t('cart.timeToday')
  const tomorrowLabel = t('cart.timeTomorrow')

  for (let offset = 0; offset < 30; offset += 1) {
    const val = getRelativeDateDMY(offset)
    seen.add(val)
    const label = offset === 0 ? todayLabel : offset === 1 ? tomorrowLabel : val
    const subDate = offset <= 1 ? val : ''
    opts.push({ value: val, label, subDate })
  }

  const cur = String(deliveryDate.value || '').trim()
  if (cur && !seen.has(cur)) {
    opts.unshift({ value: cur, label: cur, subDate: '' })
  }

  return opts
})

const selectedDeliveryDateLabel = computed(() => {
  const cur = String(deliveryDate.value || '').trim() || getRelativeDateDMY(0)
  if (cur === getRelativeDateDMY(0)) return t('cart.timeToday')
  if (cur === getRelativeDateDMY(1)) return t('cart.timeTomorrow')
  return cur
})

function syncDeliveryInputsFromThoiGian(raw) {
  const parsed = parseThoiGian24h(raw)
  if (parsed.hh && parsed.mm && parsed.dd && parsed.mo && parsed.yyyy) {
    deliveryHour.value = parsed.hh
    deliveryMinute.value = parsed.mm
    deliveryDate.value = `${parsed.dd}/${parsed.mo}/${parsed.yyyy}`
  } else if (!String(raw || '').trim()) {
    deliveryHour.value = ''
    deliveryMinute.value = ''
    deliveryDate.value = getRelativeDateDMY(0)
  }
}

function commitDeliveryTimeFromInputs({ padParts = false } = {}) {
  const rawH = String(deliveryHour.value || '').replace(/\D+/g, '')
  const rawM = String(deliveryMinute.value || '').replace(/\D+/g, '')
  const datePart = String(deliveryDate.value || '').trim() || getRelativeDateDMY(0)

  if (!rawH && !rawM) {
    thoiGian.value = ''
    return
  }

  const clampH = rawH ? String(Math.min(23, Math.max(0, Number(rawH)))).padStart(2, '0') : ''
  const clampM = rawM ? String(Math.min(59, Math.max(0, Number(rawM)))).padStart(2, '0') : ''

  if (padParts) {
    if (clampH) deliveryHour.value = clampH
    if (clampM) deliveryMinute.value = clampM
    else if (clampH) deliveryMinute.value = '00'
  }

  const finalH = clampH || String(new Date().getHours()).padStart(2, '0')
  const finalM = clampM || '00'
  thoiGian.value = `${finalH}:${finalM} ${datePart}`
}

function toggleDt24Panel(panel) {
  if (isOrderLocked.value || !isGroupHost.value) return
  activeDt24Panel.value = activeDt24Panel.value === panel ? null : panel
}

function onSelectDeliveryHour(h) {
  if (isOrderLocked.value || !isGroupHost.value) return
  deliveryHour.value = String(h).padStart(2, '0')
  commitDeliveryTimeFromInputs({ padParts: false })
  scheduleSyncLiveMeta()
  activeDt24Panel.value = deliveryMinute.value ? null : 'mm'
}

function onSelectDeliveryMinute(m) {
  if (isOrderLocked.value || !isGroupHost.value) return
  deliveryMinute.value = String(m).padStart(2, '0')
  commitDeliveryTimeFromInputs({ padParts: false })
  scheduleSyncLiveMeta()
  activeDt24Panel.value = null
}

function onSelectDeliveryDate(rawDate) {
  if (isOrderLocked.value || !isGroupHost.value || !rawDate) return
  deliveryDate.value = String(rawDate).trim() || getRelativeDateDMY(0)
  commitDeliveryTimeFromInputs({ padParts: false })
  scheduleSyncLiveMeta()
  activeDt24Panel.value = null
}

function setDeliveryTimeNow(addMinutes = 0) {
  if (isOrderLocked.value || !isGroupHost.value) return
  const offsetMin =
    typeof addMinutes === 'number' && Number.isFinite(addMinutes) ? addMinutes : 0
  const target = new Date(Date.now() + offsetMin * 60000)
  const formatted = format24hDateTimeObj(target)
  thoiGian.value = formatted
  syncDeliveryInputsFromThoiGian(formatted)
  activeDt24Panel.value = null
  scheduleSyncLiveMeta()
}

function clearDeliveryTime() {
  if (isOrderLocked.value || !isGroupHost.value) return
  deliveryHour.value = ''
  deliveryMinute.value = ''
  deliveryDate.value = getRelativeDateDMY(0)
  thoiGian.value = ''
  activeDt24Panel.value = null
  scheduleSyncLiveMeta()
}

watch(thoiGian, (val) => {
  if (isEditingMeta.value) return
  syncDeliveryInputsFromThoiGian(val)
})

const displayDeliveryTime = computed(() => {
  const raw = String(thoiGian.value || '').trim()
  if (!raw) return ''
  const parsed = parseThoiGian24h(raw)
  if (!parsed.hh || !parsed.mm || !parsed.dd || !parsed.mo || !parsed.yyyy) return raw
  const dmy = `${parsed.dd}/${parsed.mo}/${parsed.yyyy}`
  if (dmy === getRelativeDateDMY(0)) return `${parsed.hh}:${parsed.mm} ${t('cart.timeToday')}`
  if (dmy === getRelativeDateDMY(1)) return `${parsed.hh}:${parsed.mm} ${t('cart.timeTomorrow')}`
  return `${parsed.hh}:${parsed.mm} ${dmy}`
})

function ensureDeliveryTimeForSubmit() {
  if (deliveryHour.value || deliveryMinute.value) {
    commitDeliveryTimeFromInputs({ padParts: true })
  }
  if (!thoiGian.value.trim()) {
    const now = new Date()
    const p = (num) => String(num).padStart(2, '0')
    const datePart = String(deliveryDate.value || '').trim() || formatDateDMY(now)
    thoiGian.value = `${p(now.getHours())}:${p(now.getMinutes())} ${datePart}`
    syncDeliveryInputsFromThoiGian(thoiGian.value)
  }
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

const addedItemsAfterSubmitCount = computed(() => {
  if (liveStatus.value !== 'Chờ duyệt' || !liveOrderData.value) return 0
  const curList = liveOrderData.value.itemsList || []
  const subList = liveOrderData.value.submittedItemsList || []
  if (!curList.length) return 0

  const subQtyByKey = new Map()
  for (const si of subList) {
    const key =
      String(si?.lineId || '').trim() ||
      `${String(si?.Ma_hang || '').trim()}__${String(si?.Nguoi_dat_id || '').trim()}`
    if (!key) continue
    subQtyByKey.set(key, (subQtyByKey.get(key) || 0) + Math.max(0, Number(si?.So_luong || 0)))
  }

  let added = 0
  for (const ci of curList) {
    const key =
      String(ci?.lineId || '').trim() ||
      `${String(ci?.Ma_hang || '').trim()}__${String(ci?.Nguoi_dat_id || '').trim()}`
    const curQty = Math.max(0, Number(ci?.So_luong || 0))
    const prevQty = key ? subQtyByKey.get(key) || 0 : 0
    if (curQty > prevQty) {
      added += curQty - prevQty
    }
  }
  return added
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
  if (activeOrderId.value && isGroupHost.value && !isOrderLocked.value) {
    if (liveOrderData.value?.membersList) {
      liveOrderData.value = {
        ...liveOrderData.value,
        membersList: liveOrderData.value.membersList.map((m) => ({
          ...m,
          done: true,
        })),
      }
    }
    await markAllLiveOrderMembersDone({
      orderId: activeOrderId.value,
      requesterId: memberId,
    }).catch(() => {})
  }
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

const orderFinalNoticeModal = ref({
  show: false,
  orderId: '',
  status: 'Hoàn thành',
  adminMessage: '',
  switchOnClose: false,
})

function getFinalSeenStorageKey(oid) {
  return `sa_final_seen_${String(oid || '').trim()}`
}

function hasSeenFinalNotice(oid, closedAt = 0) {
  const cleanOid = String(oid || '').trim()
  if (!cleanOid) return false
  try {
    const raw = localStorage.getItem(getFinalSeenStorageKey(cleanOid))
    if (!raw) return false
    if (closedAt && raw !== String(closedAt)) return false
    return true
  } catch {
    return false
  }
}

function markFinalNoticeSeen(oid, closedAt = 0) {
  const cleanOid = String(oid || '').trim()
  if (!cleanOid) return
  try {
    localStorage.setItem(getFinalSeenStorageKey(cleanOid), String(closedAt || Date.now()))
  } catch {}
}

function openOrderFinalNoticeModal({
  orderId,
  status,
  adminMessage = '',
  closedAt = 0,
  switchOnClose = false,
}) {
  if (status !== 'message') {
    markFinalNoticeSeen(orderId, closedAt)
  }
  orderFinalNoticeModal.value = {
    show: true,
    orderId: String(orderId || '').trim(),
    status: status === 'Đã hủy' ? 'Đã hủy' : status === 'message' ? 'message' : 'Hoàn thành',
    adminMessage: String(adminMessage || '').trim(),
    switchOnClose: Boolean(switchOnClose),
  }
  playOrderBell(status === 'Đã hủy' ? 'cancel' : 'complete')
}

function closeOrderFinalNoticeModal({ startNew = false } = {}) {
  const shouldSwitch = Boolean(startNew || orderFinalNoticeModal.value.switchOnClose)
  orderFinalNoticeModal.value.show = false
  if (shouldSwitch) {
    startNewOrder()
  }
}

function openShopChatFromFinalNotice() {
  const allowedContact = messagingContactList.value?.[0] || null
  closeOrderFinalNoticeModal()
  if (allowedContact) {
    openShopChatOnly(allowedContact)
    return
  }
  if (isMobile.value) {
    openMobilePanel('contact')
  } else {
    showContactPopover.value = true
  }
}

function startNewOrder() {
  orderFinalNoticeModal.value.show = false
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
  let initializedAdminMsgWatch = false
  let lastSeenAdminMsgAt = 0
  const adminMsgSeenKey = `sa_admin_msg_seen_${cleanId}`
  let savedAdminMsgSeenAt = 0
  try {
    savedAdminMsgSeenAt = Number(localStorage.getItem(adminMsgSeenKey) || 0)
  } catch {}

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
      const adminMsg = String(snap.meta?.Admin_message || '').trim()
      const closedAt = Number(snap.meta?.Closed_at || snap.meta?.Updated_at || 0)

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
          openOrderFinalNoticeModal({
            orderId: cleanId,
            status: st,
            adminMessage: adminMsg,
            closedAt,
            switchOnClose: false,
          })
        }
        return
      }

      const canShowMissedFinalNotice =
        !hasSeenFinalNotice(cleanId, closedAt) &&
        (Boolean(adminMsg) || !closedAt || Date.now() - closedAt < 48 * 3600 * 1000)

      if (canShowMissedFinalNotice && !switchingClosedUrlOnce) {
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
        openOrderFinalNoticeModal({
          orderId: cleanId,
          status: st,
          adminMessage: adminMsg,
          closedAt,
          switchOnClose: true,
        })
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

    const isSnapLocked = ['Đang xử lý', 'Đang ship', 'Hoàn thành', 'Đã hủy'].includes(st)
    if (isSnapLocked) {
      isEditingMeta.value = false
    }

    const snapHostId = String(snap.meta?.Host_id || '').trim()
    const amHost = !snapHostId || snapHostId === memberId

    if ((!isEditingMeta.value || isSnapLocked) && snap.meta) {
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
      let needSyncTgAutofill = false
      if (amHost && !isSnapLocked && isTelegramMiniApp()) {
        const prevRemoteTen = String(snap.meta.Ten_khach_hang || '').trim()
        const prevRemoteSdt = String(snap.meta.So_dien_thoai || '').trim()
        applyTelegramProfileAutofill(getTelegramUserProfile())
        if (tenKhach.value.trim() !== prevRemoteTen || sdt.value.trim() !== prevRemoteSdt) {
          needSyncTgAutofill = true
        }
      }
      if (isSnapLocked && amHost) {
        saveCustomerFormLocal()
      }
      nextTick(() => {
        applyingRemoteMeta = false
        if (needSyncTgAutofill) {
          scheduleSyncLiveMeta()
        }
      })
    }

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

    const incomingAdminMsgAt = Number(snap.meta?.Admin_message_at || 0)
    const incomingAdminMsg = String(snap.meta?.Admin_message || '').trim()
    if (!initializedAdminMsgWatch) {
      initializedAdminMsgWatch = true
      lastSeenAdminMsgAt = Math.max(incomingAdminMsgAt, savedAdminMsgSeenAt)
      if (
        incomingAdminMsg &&
        incomingAdminMsgAt > savedAdminMsgSeenAt &&
        Date.now() - incomingAdminMsgAt < 12 * 3600 * 1000
      ) {
        try {
          localStorage.setItem(adminMsgSeenKey, String(incomingAdminMsgAt))
        } catch {}
        openOrderFinalNoticeModal({
          orderId: cleanId,
          status: 'message',
          adminMessage: incomingAdminMsg,
          switchOnClose: false,
        })
      }
    } else if (incomingAdminMsgAt > lastSeenAdminMsgAt && incomingAdminMsg) {
      lastSeenAdminMsgAt = incomingAdminMsgAt
      try {
        localStorage.setItem(adminMsgSeenKey, String(incomingAdminMsgAt))
      } catch {}
      triggerToast(`${t('orderStatus.shopMessageLabel')}: ${incomingAdminMsg}`, 'info', 4500)
      openOrderFinalNoticeModal({
        orderId: cleanId,
        status: 'message',
        adminMessage: incomingAdminMsg,
        switchOnClose: false,
      })
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
        Ghi_chu: stripAutoPromoTag(ghiChu.value),
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

async function shareGroupOrderViaTelegram() {
  try {
    if (!activeOrderId.value && !isOrderLocked.value) {
      await ensureGroupSessionActive()
    }
    const oid = activeOrderId.value
    if (!oid) return
    triggerTelegramHaptic('light')
    const tgAppUrl = buildTelegramGroupShareAppUrl(oid)
    const inviteText = `🍜 SA KITCHEN — #${oid}`
    openTelegramShareUrl(tgAppUrl || groupShareUrl.value, inviteText)
  } catch (err) {
    console.warn('shareGroupOrderViaTelegram failed:', err)
  }
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
  if (liveStatus.value === 'Chờ duyệt' && cartItems.value.length === 0 && isGroupHost.value) {
    showEmptyPendingOrderModal.value = true
    return
  }
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
  if (isMobile.value) {
    activeMobilePanel.value = null
    showCart.value = false
    showProgressModal.value = false
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
const previewImageLink = ref('')
// ===== THÔNG TIN CHUYỂN KHOẢN =====
const thongTinChuyenKhoan = ref([])
const showCKModal = ref(false)
const showFullCartModal = ref(false)
const showEmptyCartModal = ref(false)
const showEmptyPendingOrderModal = ref(false)
const emptyPendingActionBusy = ref(false)
const showLockedOrderContactModal = ref(false)
const isMobileDockHidden = ref(false)
let lastMobileScrollY = 0

const emptyPendingModalCopy = computed(() => {
  const code = activeOrderId.value ? `#${activeOrderId.value}` : ''
  const lang = currentLang.value
  if (lang === 'en') {
    return {
      title: `Pending order ${code} has no items`,
      desc: 'You removed all items from this pending order. Would you like to restore your previous items, add new items, or cancel this order?',
      restoreBtn: 'Restore previous items',
      cancelBtn: 'Cancel this order',
      pickBtn: 'Add more items',
      cancelledToast: 'Order cancelled',
      restoredToast: 'Previous order items restored',
    }
  }
  if (lang === 'zh-CN') {
    return {
      title: `待确认订单 ${code} 购物车为空`,
      desc: '您已清空该待确认订单中的全部商品。您可以恢复之前提交的商品、继续加购，或取消该订单。',
      restoreBtn: '恢复已点商品',
      cancelBtn: '取消此订单',
      pickBtn: '继续选购商品',
      cancelledToast: '已取消订单',
      restoredToast: '已恢复之前提交的商品',
    }
  }
  if (lang === 'fil') {
    return {
      title: `Walang laman ang pending order ${code}`,
      desc: 'Tinanggal mo ang lahat ng item sa pending order na ito. Gusto mo bang ibalik ang mga naunang item, magdagdag ng iba, o i-cancel ang order?',
      restoreBtn: 'Ibalik ang mga naunang item',
      cancelBtn: 'I-cancel ang order',
      pickBtn: 'Magdagdag ng item',
      cancelledToast: 'Na-cancel ang order',
      restoredToast: 'Naibalik ang mga naunang item',
    }
  }
  if (lang === 'ko') {
    return {
      title: `확인 대기 중인 주문 ${code}이 비어 있습니다`,
      desc: '대기 중인 주문의 모든 상품을 삭제했습니다. 이전 상품을 복구하거나, 새 상품을 담거나, 주문을 취소할 수 있습니다.',
      restoreBtn: '이전 주문 상품 복구',
      cancelBtn: '이 주문 취소하기',
      pickBtn: '새 상품 담기',
      cancelledToast: '주문이 취소되었습니다',
      restoredToast: '이전 주문 상품을 복구했습니다',
    }
  }
  return {
    title: `Đơn đang xác nhận ${code} chưa có món`,
    desc: 'Bạn đã xóa hết món khỏi giỏ hàng của đơn đang chờ xác nhận. Bạn muốn khôi phục lại các món đã đặt, chọn thêm món mới, hay hủy đơn này?',
    restoreBtn: 'Khôi phục món đã đặt',
    cancelBtn: 'Hủy đơn hàng này',
    pickBtn: 'Chọn thêm món mới',
    cancelledToast: 'Đã hủy đơn hàng',
    restoredToast: 'Đã khôi phục các món đã đặt trước đó',
  }
})

async function restoreEmptyPendingOrder() {
  if (!activeOrderId.value || emptyPendingActionBusy.value) return
  emptyPendingActionBusy.value = true
  try {
    const res = await restoreSubmittedLiveOrderDraft({ orderId: activeOrderId.value })
    if (!res?.success) {
      triggerToast(res?.message || 'Không thể khôi phục đơn hàng', 'warn')
      return
    }
    showEmptyPendingOrderModal.value = false
    triggerToast(emptyPendingModalCopy.value.restoredToast, 'success')
  } catch (err) {
    console.error('restoreEmptyPendingOrder error:', err)
    triggerToast('Lỗi khôi phục món, vui lòng thử lại', 'warn')
  } finally {
    emptyPendingActionBusy.value = false
  }
}

async function cancelEmptyPendingOrder() {
  if (!activeOrderId.value || emptyPendingActionBusy.value) return
  emptyPendingActionBusy.value = true
  try {
    const res = await dispatchAction({
      action: 'huyDonHang',
      Ma_hoa_don: activeOrderId.value,
    })
    if (!res?.success) {
      triggerToast(res?.message || 'Không thể hủy đơn hàng', 'warn')
      return
    }
    showEmptyPendingOrderModal.value = false
    showFullCartModal.value = false
    triggerToast(emptyPendingModalCopy.value.cancelledToast, 'success')
  } catch (err) {
    console.error('cancelEmptyPendingOrder error:', err)
    triggerToast('Lỗi hủy đơn hàng, vui lòng thử lại', 'warn')
  } finally {
    emptyPendingActionBusy.value = false
  }
}

function pickMoreFromEmptyPendingModal() {
  showEmptyPendingOrderModal.value = false
  showFullCartModal.value = false
  if (isMobile.value) {
    activeMobilePanel.value = null
    showCart.value = false
  }
}

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

const layoutRef = ref(null)
const SA_PC_SIDEBAR_W_KEY = 'sa_menu_pc_sidebar_w_v1'
const pcSidebarWidth = ref(null)
const isResizingSidebar = ref(false)
let sidebarDragState = null

try {
  const savedW = Number(localStorage.getItem(SA_PC_SIDEBAR_W_KEY))
  if (Number.isFinite(savedW) && savedW >= 280) {
    pcSidebarWidth.value = Math.round(savedW)
  }
} catch {}

const pcLayoutStyle = computed(() => {
  if (isMobile.value || pcSidebarWidth.value === null) return undefined
  return { '--pc-sidebar-w': `${Math.round(pcSidebarWidth.value)}px` }
})

function clampPcSidebarWidthToViewport() {
  if (isMobile.value || pcSidebarWidth.value === null) return
  const layoutW = layoutRef.value?.clientWidth || window.innerWidth
  const maxW = Math.min(720, Math.max(340, layoutW - 420))
  pcSidebarWidth.value = Math.round(Math.min(maxW, Math.max(280, pcSidebarWidth.value)))
}

function onSidebarResizeMove(e) {
  if (!sidebarDragState) return
  const dx = e.clientX - sidebarDragState.startX
  const maxW = Math.min(720, Math.max(340, sidebarDragState.layoutWidth - 420))
  pcSidebarWidth.value = Math.round(
    Math.min(maxW, Math.max(280, sidebarDragState.startWidth - dx)),
  )
}

function stopSidebarResize() {
  if (!sidebarDragState && !isResizingSidebar.value) return
  sidebarDragState = null
  isResizingSidebar.value = false
  window.removeEventListener('mousemove', onSidebarResizeMove)
  window.removeEventListener('mouseup', stopSidebarResize)
  try {
    if (pcSidebarWidth.value === null) {
      localStorage.removeItem(SA_PC_SIDEBAR_W_KEY)
    } else {
      localStorage.setItem(SA_PC_SIDEBAR_W_KEY, String(Math.round(pcSidebarWidth.value)))
    }
  } catch {}
}

function startSidebarResize(e) {
  if (isMobile.value || !showCart.value) return
  const layoutEl = layoutRef.value
  const sidebarEl = layoutEl?.querySelector('.sidebar-right')
  if (!layoutEl || !sidebarEl) return
  isResizingSidebar.value = true
  sidebarDragState = {
    startX: e.clientX,
    startWidth: sidebarEl.getBoundingClientRect().width,
    layoutWidth: layoutEl.clientWidth || window.innerWidth,
  }
  window.addEventListener('mousemove', onSidebarResizeMove)
  window.addEventListener('mouseup', stopSidebarResize)
}

function resetSidebarWidth() {
  pcSidebarWidth.value = null
  try {
    localStorage.removeItem(SA_PC_SIDEBAR_W_KEY)
  } catch {}
}

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
  clampPcSidebarWidthToViewport()
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
  if (dt24PickerWrapRef.value && !dt24PickerWrapRef.value.contains(e.target)) {
    activeDt24Panel.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})
function applyTelegramProfileAutofill(tgProfile) {
  if (!tgProfile) return
  const combined = String(tgProfile.displayLabel || '').trim()
  if (!combined) return

  const curTen = tenKhach.value.trim()
  // Điền mới hoặc tự nâng cấp nếu trước đó mới chỉ lưu mỗi fullName hoặc mỗi @username riêng lẻ
  if (
    !curTen ||
    (tgProfile.fullName && curTen === tgProfile.fullName && tgProfile.handle) ||
    (tgProfile.handle && curTen === tgProfile.handle && tgProfile.fullName)
  ) {
    tenKhach.value = combined
  }

  const curMember = memberName.value.trim()
  if (
    !curMember ||
    (tgProfile.fullName && curMember === tgProfile.fullName && tgProfile.handle) ||
    (tgProfile.handle && curMember === tgProfile.handle && tgProfile.fullName)
  ) {
    memberName.value = combined
  }

  // Giữ ô SĐT dành riêng cho số điện thoại (dọn nếu bản trước lỡ điền @username vào ô SĐT)
  if (tgProfile.handle && sdt.value.trim() === tgProfile.handle) {
    sdt.value = ''
  }
}

onMounted(() => {
  bindOrderBellUnlock()
  loadPersistedLocalState()

  if (isTelegramMiniApp()) {
    applyTelegramProfileAutofill(getTelegramUserProfile())
  }
  initTelegramMiniApp({
    isDark: themeMode.value === 'dark',
    onReady: (tgProfile) => {
      const beforeTen = tenKhach.value
      const beforeSdt = sdt.value
      applyTelegramProfileAutofill(tgProfile)
      if (
        (tenKhach.value !== beforeTen || sdt.value !== beforeSdt) &&
        isGroupHost.value &&
        !isOrderLocked.value
      ) {
        scheduleSyncLiveMeta()
      }
    },
  })

  const qOrder = String(route.query?.order || getTelegramStartOrderId() || '').trim()
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
      } else if (route.params.productId || route.params.productSlug) {
        syncDetailFromRoute()
      }
    }
  })

  unsubKhuyenMaiLive = subscribeSheet('khuyenmai_info', (rows) => {
    khuyenMaiInfo.value = rows || []
  })

  unsubDisplayConfigLive = subscribeSheet('display_config', (rows) => {
    displayConfigRows.value = rows || []
  })

  const savedLang = localStorage.getItem('APP_LANG')
  const hasDeepProductLink = Boolean(
    String(route.params.productId || route.params.productSlug || '').trim(),
  )

  // Nếu mở từ Telegram Mini App lần đầu chưa lưu ngôn ngữ, tự khớp ngôn ngữ Telegram của khách
  if (!savedLang && isTelegramMiniApp()) {
    const tgMatchedLang = mapTelegramLangToAppLang(getTelegramUserProfile()?.languageCode)
    if (tgMatchedLang) {
      localStorage.setItem('APP_LANG', tgMatchedLang)
      locale.value = tgMatchedLang
      if (route.params.lang !== tgMatchedLang && !hasDeepProductLink) {
        redirectToLang(tgMatchedLang)
        return
      }
      reloadData()
      return
    }
  }

  // Nếu mở trực tiếp link chi tiết sản phẩm mà chưa từng chọn ngôn ngữ, ưu tiên ngôn ngữ trên URL
  if (!savedLang && hasDeepProductLink && route.params.lang) {
    const urlLang = String(route.params.lang)
    localStorage.setItem('APP_LANG', urlLang)
    locale.value = urlLang
    reloadData()
    return
  }

  //  CHƯA BAO GIỜ CHỌN LANG
  if (!savedLang) {
    showLangModal.value = true
    reloadData()
    return
  }

  //  ĐÃ CÓ LANG, nhưng URL KHÁC (nếu vào link chia sẻ có sẵn productSlug thì giữ ngôn ngữ trên link)
  if (route.params.lang !== savedLang && !hasDeepProductLink) {
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

watch(
  () => themeMode.value,
  (mode) => {
    syncTelegramMiniAppTheme(mode === 'dark')
  },
)

watch(
  () => [cartItems.value.length, isOrderLocked.value],
  ([len, locked]) => {
    setTelegramClosingConfirmation(Number(len) > 0 && !locked)
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
  const { ncc: _ncc, ...cleanQuery } = route.query || {}
  const activeOrd = String(cleanQuery.order || activeOrderId.value || '').trim()
  if (activeOrd) {
    cleanQuery.order = activeOrd
  }

  if (selectedItem.value) {
    const { productSlug, productId } = getProductUrlParams(selectedItem.value, lang)
    router.replace({
      name: 'menu-online',
      params: {
        lang,
        productSlug,
        productId,
      },
      query: cleanQuery,
    })
    return
  }

  if (route.params.productId || route.params.productSlug) {
    router.replace({
      name: route.name === 'menu-online-legacy' ? 'menu-online-legacy' : 'menu-online',
      params: {
        ...route.params,
        lang,
      },
      query: cleanQuery,
    })
    return
  }

  router.replace({
    name: 'menu-online',
    params: { lang },
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
    if (selectedItem.value) {
      showDetail.value = false
      showDetailSidebar.value = true
    }
  } else {
    // chuyển sang desktop
    showCart.value = true
    if (selectedItem.value) {
      showDetailSidebar.value = false
      showDetail.value = true
    }
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
const currentSubCategory = ref('')

const menuKey = computed(() => {
  return `${keyword.value}-${currentCategory.value}-${currentSubCategory.value}-${priceSort.value}`
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
function addToCartFromModal(m, evt = null) {
  if (isOrderLocked.value && !isOrderTerminal.value) {
    openLockedOrderContactPrompt()
    return
  }
  addDetailWithToppings(m, evt)

  // chạy animation đóng
  closingModal.value = true

  setTimeout(() => {
    closeDetail()
    closingModal.value = false
  }, 220) // khớp với thời gian animation
}

/* ===== COMPUTED ===== */
const categoryHierarchy = computed(() => {
  const activeLocale = String(locale.value || 'vi').trim() || 'vi'
  const hasSale = menu.value.some((m) => isDiscount(m))
  return buildCategoryHierarchy(menu.value, activeLocale, displayConfig.value, hasSale)
})

const categories = computed(() => {
  const activeLocale = String(locale.value || 'vi').trim() || 'vi'
  const hasSale = menu.value.some((m) => isDiscount(m))
  return sortLocalizedCategories(
    menu.value,
    activeLocale,
    displayConfig.value,
    hasSale,
  )
})

const footerQuickCategories = computed(() =>
  categories.value.filter((c) => c && c !== 'Tất cả' && c !== 'Sale').slice(0, 4),
)
const currentFooterYear = new Date().getFullYear()

const categoryHierarchyMap = computed(() => {
  const map = new Map()
  for (const node of categoryHierarchy.value) {
    map.set(node.label, node)
  }
  return map
})

const standaloneCategories = computed(() => {
  const out = []
  if (allCategoryLabel.value) out.push(allCategoryLabel.value)
  for (const node of categoryHierarchy.value) {
    if (!node.subCategories.length) out.push(node.label)
  }
  return out
})

const parentCategoriesWithSubs = computed(() =>
  categoryHierarchy.value.filter((node) => node.subCategories.length > 0),
)

const collapsedCatParents = ref({})

function isCatParentExpanded(parentLabel) {
  return collapsedCatParents.value[parentLabel] !== true
}

function toggleCatParentExpanded(parentLabel) {
  collapsedCatParents.value = {
    ...collapsedCatParents.value,
    [parentLabel]: isCatParentExpanded(parentLabel),
  }
}

function getHierarchySubCategories(parentLabel) {
  return categoryHierarchyMap.value.get(parentLabel)?.subCategories || []
}

function isParentCategoryEntry(categoryLabel) {
  if (!categoryLabel || categoryLabel === 'Sale' || categoryLabel === allCategoryLabel.value) {
    return false
  }
  return getHierarchySubCategories(categoryLabel).length > 0
}

const allCategoryLabel = computed(() => categories.value[0] || '')
const subCategories = computed(() => {
  const activeLocale = String(locale.value || 'vi').trim() || 'vi'
  return getSubCategoriesForParent(
    menu.value,
    currentCategory.value,
    activeLocale,
    displayConfig.value,
  )
})
function resetToAllCategory() {
  currentCategory.value = allCategoryLabel.value || 'Tất cả'
  currentSubCategory.value = ''
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
const filteredMenuMeta = computed(() => {
  let list = [...menu.value]
  const activeLocale = locale.value || 'vi'

  // CATEGORY (2-LEVEL: DANH MỤC CHA -> DANH MỤC CON)
  if (currentCategory.value === 'Sale') {
    list = list.filter(m => isDiscount(m))
  }
  else if (currentCategory.value && currentCategory.value !== allCategoryLabel.value) {
    list = list.filter(
      (m) =>
        getEffectiveParentCategory(m, displayConfig.value, activeLocale) === currentCategory.value ||
        m.Danh_muc === currentCategory.value,
    )
    if (currentSubCategory.value) {
      list = list.filter((m) => m.Danh_muc === currentSubCategory.value)
    }
  }

  // SEARCH (accent-insensitive, multi-token, 5-lang, Trad->Simp, synonyms, description, price, typo fallback + relevance ranking)
  let usedFuzzy = false
  if (keyword.value) {
    const ranked = rankProductsWithMeta(list, keyword.value, {
      activeLang: activeLocale,
      preferInStock: true,
      fuzzyFallback: true,
    })
    list = ranked.items
    usedFuzzy = ranked.usedFuzzy
  }

  // SORT
  if (priceSort.value === 'asc') {
    list.sort((a, b) => finalPrice(a) - finalPrice(b))
  } 
  else if (priceSort.value === 'desc') {
    list.sort((a, b) => finalPrice(b) - finalPrice(a))
  }
  else if (
    (currentCategory.value === allCategoryLabel.value &&
      !keyword.value &&
      displayConfig.value.productSortMode === DISPLAY_MODE_BY_CATEGORY) ||
    (currentCategory.value !== allCategoryLabel.value &&
      currentCategory.value !== 'Sale' &&
      !currentSubCategory.value &&
      subCategories.value.length > 0 &&
      !keyword.value)
  ) {
    list = sortProductsByCategoryOrder(
      list,
      displayConfig.value,
      activeLocale,
    )
  }

  return { items: list, usedFuzzy }
})

const filteredMenu = computed(() => filteredMenuMeta.value.items)

const searchGlobalMatchesCount = computed(() => {
  const kw = (keyword.value || '').trim()
  if (!kw) return 0
  const isFilteredByCategory =
    currentCategory.value === 'Sale' ||
    (Boolean(currentCategory.value) && currentCategory.value !== allCategoryLabel.value) ||
    Boolean(currentSubCategory.value)
  if (!isFilteredByCategory) return 0
  return rankProductsWithMeta(menu.value, kw, {
    activeLang: locale.value || 'vi',
    preferInStock: true,
    fuzzyFallback: true,
  }).items.length
})

const quickSearchTags = computed(() => {
  const raw = String(t('search.quickTags') || '')
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
})

function getSearchHighlights(text, rawKw) {
  return getAccentInsensitiveHighlights(text, rawKw)
}

function searchAcrossAllMenu() {
  currentCategory.value = allCategoryLabel.value
  currentSubCategory.value = ''
  resetVisibleMenu()
}

function applyQuickSearchTag(tag) {
  searchInput.value = tag
  keyword.value = tag
  currentCategory.value = allCategoryLabel.value
  currentSubCategory.value = ''
  showSearchSuggest.value = false
  resetVisibleMenu()
  scrollToTop()
}

const searchSuggestions = computed(() => {
  const kw = (searchInput.value || '').trim()
  if (!kw) return []

  return rankProductsWithMeta(menu.value, kw, {
    activeLang: locale.value || 'vi',
    preferInStock: true,
    fuzzyFallback: true,
  }).items.slice(0, 12)
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

const shouldShowMenuGroupHeadings = computed(() => {
  if (keyword.value || priceSort.value !== 'all') return false
  if (
    currentCategory.value !== allCategoryLabel.value &&
    currentCategory.value !== 'Sale' &&
    !currentSubCategory.value &&
    subCategories.value.length > 0
  ) {
    return true
  }
  if (
    currentCategory.value === allCategoryLabel.value &&
    displayConfig.value.productSortMode === DISPLAY_MODE_BY_CATEGORY
  ) {
    return true
  }
  return false
})

const menuDisplayEntries = computed(() => {
  const list = pagedMenu.value || []
  if (!shouldShowMenuGroupHeadings.value) {
    return list.map((item) => ({
      type: 'item',
      rowKey: `card-${item.Ma_hang}`,
      item,
    }))
  }

  const activeLocale = locale.value || 'vi'
  const isAllView = currentCategory.value === allCategoryLabel.value
  const entries = []
  let lastGroupKey = ''

  for (const item of list) {
    const parentLabel = getEffectiveParentCategory(item, displayConfig.value, activeLocale)
    const subLabel = String(item?.Danh_muc || '').trim()
    const hasChildHeader = Boolean(subLabel && subLabel !== parentLabel)

    const headingText = isAllView
      ? hasChildHeader
        ? `${parentLabel} › ${subLabel}`
        : parentLabel || subLabel
      : subLabel || parentLabel

    const groupKey = `${parentLabel}::${subLabel}`
    if (headingText && groupKey !== lastGroupKey) {
      lastGroupKey = groupKey
      entries.push({
        type: 'heading',
        rowKey: `hdr-${groupKey}-${entries.length}`,
        headingText,
        parentLabel: parentLabel || subLabel,
        subLabel: hasChildHeader ? subLabel : '',
      })
    }

    entries.push({
      type: 'item',
      rowKey: `card-${item.Ma_hang}`,
      item,
    })
  }

  return entries
})

const menuBoardSections = computed(() => {
  const rawList = filteredMenu.value || []
  if (!rawList.length) return []

  const activeLocale = locale.value || 'vi'
  const ordered = sortProductsByCategoryOrder(rawList, displayConfig.value, activeLocale)

  const sectionMap = new Map()
  for (const item of ordered) {
    const parentLabel = getEffectiveParentCategory(item, displayConfig.value, activeLocale)
    const subLabel = String(item?.Danh_muc || '').trim()
    const hasChild = Boolean(subLabel && subLabel !== parentLabel)
    const title = hasChild ? subLabel : parentLabel || subLabel || t('menu.category')
    const parentTag = hasChild ? parentLabel : ''
    const key = `${parentLabel}::${subLabel}`

    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        key,
        title,
        parentTag,
        parentLabel: parentLabel || subLabel,
        subLabel: hasChild ? subLabel : '',
        items: [],
        thumbs: [],
      })
    }

    const sec = sectionMap.get(key)
    sec.items.push(item)
    if (sec.thumbs.length < 4) {
      const img = getCardImage(item)
      if (img && !sec.thumbs.includes(img)) {
        sec.thumbs.push(img)
      }
    }
  }

  const sections = Array.from(sectionMap.values())
  if (priceSort.value === 'asc') {
    sections.forEach((sec) => sec.items.sort((a, b) => finalPrice(a) - finalPrice(b)))
  } else if (priceSort.value === 'desc') {
    sections.forEach((sec) => sec.items.sort((a, b) => finalPrice(b) - finalPrice(a)))
  }
  return sections
})

let searchScrollTimer = null

watch(keyword, () => {
  resetVisibleMenu()
})

watch(searchInput, (val) => {
  if (!String(val || '').trim() && keyword.value) {
    keyword.value = ''
  }
})

function applySearch() {
  const nextKw = (searchInput.value || '').trim()
  keyword.value = nextKw
  showSearchSuggest.value = false

  // Escape category trap automatically when user explicitly searches and current category has 0 matches
  if (nextKw && filteredMenu.value.length === 0 && searchGlobalMatchesCount.value > 0) {
    currentCategory.value = allCategoryLabel.value
    currentSubCategory.value = ''
  }

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
      const grossLine = qty * unitPrice
      const itemDiscountAmt = Math.max(
        0,
        Number(li.Giam_gia || 0) * qty + Number(li.Tien_chiet_khau || 0),
      )
      const netLine =
        li.Thanh_tien_sau_giam !== undefined
          ? Number(li.Thanh_tien_sau_giam)
          : Math.max(0, grossLine - itemDiscountAmt)

      return {
        ...(matched || {}),
        lineId: li.lineId,
        Ma_hang: li.Ma_hang || matched?.Ma_hang || li.lineId,
        Ten_hang: matched ? matched.Ten_hang : li.Ten_hang,
        Size: li.Size || matched?.Size || '',
        Dvt: matched ? matched.Dvt : li.Dvt || '',
        Main_img: matched?.Main_img || li.Main_img || '',
        Don_vi_tien_te:
          li.Don_vi_tien_te || matched?.Don_vi_tien_te || menu.value[0]?.Don_vi_tien_te || 'P',
        unitPrice,
        Gia_ban: unitPrice,
        isDiscounted: (baseRegularPrice > 0 && unitPrice < baseRegularPrice) || itemDiscountAmt > 0,
        qty,
        thanhTien: netLine,
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


const itemsSubtotalAmount = computed(() =>
  cartItems.value.reduce((sum, i) => sum + i.thanhTien, 0),
)

const totalAmount = computed(() => {
  if (
    activeOrderId.value &&
    isOrderLocked.value &&
    liveOrderData.value?.meta?.Synced_by_admin &&
    liveOrderData.value?.meta?.Tong_cong !== undefined &&
    liveOrderData.value?.meta?.Trang_thai !== 'Hoàn thành'
  ) {
    return Math.max(0, Number(liveOrderData.value.meta.Tong_cong || 0))
  }
  return itemsSubtotalAmount.value
})

const syncedAdminDiscount = computed(() => {
  if (
    !activeOrderId.value ||
    !isOrderLocked.value ||
    !liveOrderData.value?.meta?.Synced_by_admin ||
    liveOrderData.value?.meta?.Trang_thai === 'Hoàn thành'
  ) {
    return 0
  }
  return Math.max(0, itemsSubtotalAmount.value - totalAmount.value)
})

const syncedDiscountLabel = computed(() => {
  const lang = currentLang.value
  if (lang === 'en') return 'Order discount'
  if (lang === 'zh' || lang === 'zh-CN') return '订单优惠'
  if (lang === 'ko') return '주문 할인'
  if (lang === 'fil' || lang === 'tl') return 'Order discount'
  return 'Giảm giá / CK'
})

const syncedShippingFee = computed(() => {
  if (!activeOrderId.value || liveStatus.value === 'Đã hủy') return 0
  return Math.max(0, Number(liveOrderData.value?.meta?.Phi_ship || 0))
})

const customerPayableTotal = computed(() => totalAmount.value + syncedShippingFee.value)

const syncedShippingLabel = computed(() => {
  const lang = currentLang.value
  if (lang === 'en' || lang === 'fil' || lang === 'tl') return 'Shipping fee'
  if (lang === 'zh' || lang === 'zh-CN') return '运费'
  if (lang === 'ko') return '배송비'
  return 'Phí ship'
})

const syncedItemsLabel = computed(() => {
  const lang = currentLang.value
  if (lang === 'en' || lang === 'fil' || lang === 'tl') return 'Items subtotal'
  if (lang === 'zh' || lang === 'zh-CN') return '商品金额'
  if (lang === 'ko') return '상품 금액'
  return 'Tiền hàng'
})

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
  const createdLine =
    liveCreatedAt.value && liveStatus.value && liveStatus.value !== 'Nháp'
      ? `${createdAtLabel.value}: ${liveCreatedAt.value}\n`
      : ''
  const goodsLine =
    syncedShippingFee.value > 0 || syncedAdminDiscount.value > 0
      ? `${syncedItemsLabel.value}: ${formatPrice(itemsSubtotalAmount.value, cartCurrency.value)}\n`
      : ''
  const discountLine =
    syncedAdminDiscount.value > 0
      ? `${syncedDiscountLabel.value}: -${formatPrice(syncedAdminDiscount.value, cartCurrency.value)}\n`
      : ''
  const shipLine =
    syncedShippingFee.value > 0
      ? `${syncedShippingLabel.value}: +${formatPrice(syncedShippingFee.value, cartCurrency.value)}\n`
      : ''

  return `${headerLine}${itemsBody}

${goodsLine}${discountLine}${shipLine}${t('export.total')}: ${formatPrice(customerPayableTotal.value, cartCurrency.value)} (${paymentLabel})${promoLine}

${createdLine}${t('cart.name')}: ${tenKhach.value || memberName.value}
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

const isNoticeActive = (item) =>
  item?.Kich_hoat !== false && String(item?.Kich_hoat) !== 'false'

const normalizePopupLink = (raw) => {
  const url = String(raw || '').trim()
  if (!url) return ''
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(url)) return url
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url)) return `https://${url}`
  return ''
}

const isExternalPopupLink = (url) => Boolean(url && !url.startsWith('/'))

const thongBaoTexts = computed(() =>
  thongBaoList.value
    .filter((item) => item?.Loai_thong_bao !== 'popup' && isNoticeActive(item))
    .map((item) => resolveNoticeText(item, currentLang.value))
    .filter(Boolean)
    .slice(0, 1)
)

const marqueeNoticeText = computed(() => thongBaoTexts.value.join('   •   ').trim())
const noticeViewportRef = ref(null)
const noticeMeasureRef = ref(null)
const noticeOverflowing = ref(false)
const noticePaused = ref(false)
const noticeDurationSec = ref(12)

const noticeTrackStyle = computed(() =>
  noticeOverflowing.value ? { '--notice-duration': `${noticeDurationSec.value}s` } : undefined
)

function updateNoticeOverflow() {
  const viewport = noticeViewportRef.value
  const textEl = noticeMeasureRef.value
  if (!viewport || !textEl) {
    noticeOverflowing.value = false
    return
  }
  const viewportWidth = viewport.clientWidth
  const textWidth = textEl.scrollWidth
  const shouldMarquee = viewportWidth > 0 && textWidth > viewportWidth + 2
  noticeOverflowing.value = shouldMarquee
  if (shouldMarquee) {
    const loopPx = textWidth + 52
    noticeDurationSec.value = Math.max(8, Number((loopPx / 52).toFixed(1)))
  } else {
    noticePaused.value = false
  }
}

let noticeResizeObserver = null

watch(marqueeNoticeText, () => {
  noticePaused.value = false
  nextTick(updateNoticeOverflow)
})

watch(noticeViewportRef, (el) => {
  if (noticeResizeObserver) {
    noticeResizeObserver.disconnect()
    noticeResizeObserver = null
  }
  if (el && typeof ResizeObserver !== 'undefined') {
    noticeResizeObserver = new ResizeObserver(() => {
      updateNoticeOverflow()
    })
    noticeResizeObserver.observe(el)
  }
  nextTick(updateNoticeOverflow)
})

watch([loadingMain, isMobile, leftDockCollapsed], () => {
  nextTick(updateNoticeOverflow)
}, { flush: 'post' })

const popupNotices = computed(() =>
  thongBaoList.value
    .filter((item) => item?.Loai_thong_bao === 'popup' && isNoticeActive(item))
    .map((item) => ({
      ...item,
      imageUrl: String(item?.Popup_img || '').trim(),
      text: resolveNoticeText(item, currentLang.value),
      linkUrl: normalizePopupLink(item?.Popup_link),
    }))
    .filter((item) => item.imageUrl || item.text)
    .slice(0, 1)
)

const showEntryNoticePopup = ref(false)
const entryPopupIndex = ref(0)
const hasTriggeredEntryPopup = ref(false)

const activeEntryPopup = computed(() => {
  const list = popupNotices.value
  if (!list.length) return null
  const idx = Math.min(Math.max(entryPopupIndex.value, 0), list.length - 1)
  return list[idx] || null
})

const activeEntryPopupParts = computed(() => {
  const raw = String(activeEntryPopup.value?.text || '').trim()
  if (!raw) return { headline: '', body: '' }
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length >= 2) {
    return {
      headline: lines[0],
      body: lines.slice(1).join('\n'),
    }
  }
  return {
    headline: !activeEntryPopup.value?.imageUrl ? lines[0] : '',
    body: activeEntryPopup.value?.imageUrl ? lines[0] : '',
  }
})

const closeEntryNoticePopup = () => {
  showEntryNoticePopup.value = false
}

const stepEntryNoticePopup = (delta) => {
  const total = popupNotices.value.length
  if (total <= 1) return
  entryPopupIndex.value = (entryPopupIndex.value + delta + total) % total
}

const handleEntryPopupLinkClick = (event, item) => {
  const url = item?.linkUrl
  if (!url) {
    event?.preventDefault?.()
    return
  }
  if (url.startsWith('/') && !url.startsWith('//')) {
    event?.preventDefault?.()
    closeEntryNoticePopup()
    router.push(url)
    return
  }
  closeEntryNoticePopup()
}

watch(
  [() => loadingMain.value, () => popupNotices.value.length],
  ([isLoading, total]) => {
    if (!isLoading && total > 0 && !hasTriggeredEntryPopup.value) {
      hasTriggeredEntryPopup.value = true
      entryPopupIndex.value = 0
      showEntryNoticePopup.value = true
    }
  },
  { immediate: true }
)


const parseBannerOrder = (item) => {
  const n = Number(item?.Thu_tu)
  return Number.isFinite(n) && n > 0 ? n : Number.MAX_SAFE_INTEGER
}

const bannerList = computed(() =>
  [...(banners.value || [])].sort((a, b) => {
    const orderDiff = parseBannerOrder(a) - parseBannerOrder(b)
    if (orderDiff !== 0) return orderDiff
    // Fallback: ID mới (thời gian lớn hơn) lên trước
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
const brandAssets = computed(() => resolveBrandAssets(logo.value, 'SA KITCHEN'))
watch(
  brandAssets,
  (assets) => {
    setTitleAndFavicon(assets)
  },
  { immediate: true }
)

function setMetaTagContent(selector, attrName, attrValue, content) {
  if (!content) return
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setTitleAndFavicon(brandOrName, legacyIconUrl) {
  const assets =
    brandOrName && typeof brandOrName === 'object'
      ? brandOrName
      : resolveBrandAssets({ Name: brandOrName, URL: legacyIconUrl }, 'SA KITCHEN')

  // SEO TITLE TAB (keeps full SEO Title instead of shortening to bare shop name)
  const resolvedSeoTitle = assets.seoTitle || assets.name || 'SA KITCHEN'
  const resolvedShortName = assets.shortName || assets.name || 'SA KITCHEN'
  document.title = resolvedSeoTitle

  // SYNC META DESCRIPTION, ROBOTS, CANONICAL & JSON-LD FOR SPA NAVIGATION (e.g. returning from /blog)
  const cleanCanonical = `${window.location.origin}${window.location.pathname}`
  setMetaTagContent('meta[name="description"]', 'name', 'description', assets.seoDescription)
  setMetaTagContent('meta[name="keywords"]', 'name', 'keywords', assets.seoKeywords)
  setMetaTagContent('meta[name="robots"]', 'name', 'robots', 'index, follow')
  setMetaTagContent('meta[property="og:type"]', 'property', 'og:type', 'restaurant')
  setMetaTagContent('meta[property="og:url"]', 'property', 'og:url', cleanCanonical)
  setMetaTagContent('meta[property="og:title"]', 'property', 'og:title', resolvedSeoTitle)
  setMetaTagContent(
    'meta[property="og:description"]',
    'property',
    'og:description',
    assets.seoDescription,
  )
  const canonicalLink = document.querySelector('link[rel="canonical"]')
  if (canonicalLink) {
    canonicalLink.setAttribute('href', cleanCanonical)
  }
  const jsonLdScript = document.getElementById('sa-seo-jsonld')
  if (jsonLdScript) {
    jsonLdScript.textContent = JSON.stringify(buildSeoJsonLdGraph(assets, window.location.origin))
  }

  // FAVICON TAB (prefers dedicated Favicon_URL, falls back to Logo URL)
  const verQuery = assets.updatedAt ? `?v=${encodeURIComponent(assets.updatedAt)}` : ''
  const icoLink = document.querySelector("link[rel='icon'][sizes='48x48']")
  if (icoLink) {
    icoLink.setAttribute('href', toFaviconAssetUrl(assets.faviconUrl, 48) || `/favicon.ico${verQuery}`)
  }

  let link =
    document.querySelector("link[rel='icon'][type='image/png']") ||
    document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    document.head.appendChild(link)
  }
  link.href = toFaviconAssetUrl(assets.faviconUrl, 192) || `/favicon-192.png${verQuery}`

  // IOS HOME SCREEN ICON (prefers dedicated Mobile_Icon_URL, falls back to Logo URL)
  let appleLink = document.querySelector("link[rel='apple-touch-icon']")
  if (!appleLink) {
    appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.sizes = '180x180'
    document.head.appendChild(appleLink)
  }
  appleLink.href = toMobileIconAssetUrl(assets.mobileIconUrl, 180) || `/apple-touch-icon.png${verQuery}`

  // IOS APP TITLE
  setMetaTagContent(
    "meta[name='apple-mobile-web-app-title']",
    'name',
    'apple-mobile-web-app-title',
    resolvedShortName,
  )
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

let lastBannerSwipeAt = 0

function onBannerCardClick(b, idx) {
  if (Date.now() - lastBannerSwipeAt < 320) return
  if (idx === currentBannerIndex.value) {
    const action = normalizeBannerAction(b?.Click_action)
    const linkUrl = normalizeBannerLink(b?.Link_url)
    if (action === BANNER_CLICK_ACTIONS.LINK && linkUrl) {
      openBannerLinkInNewTab(linkUrl)
      return
    }
    openImageModal(b.URL, linkUrl)
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
  if (Math.abs(diff) > 18) {
    lastBannerSwipeAt = Date.now()
  }
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
const addedTimersByCode = new Map()

const cartQtyByCode = computed(() => {
  const map = {}
  for (const item of cartItems.value || []) {
    const code = String(item?.Ma_hang || '').trim()
    if (!code) continue
    map[code] = (map[code] || 0) + Math.max(0, Number(item?.qty || 0))
  }
  return map
})

function findVisibleCartTargetEl() {
  if (typeof document === 'undefined') return null
  const selectors = isMobile.value
    ? [
        '.mcb-edit-btn',
        '.cart-bar-pill-left',
        '.mobile-bottom-bar .cart-btn .cart-icon-wrap',
        '.mobile-bottom-bar .cart-btn',
      ]
    : ['.dth-cart-pill']

  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight + 40) {
      return el
    }
  }
  return null
}

function triggerCartHitJiggle(targetEl) {
  if (!targetEl) return
  targetEl.classList.remove('sa-cart-hit-jiggle')
  void targetEl.offsetWidth
  targetEl.classList.add('sa-cart-hit-jiggle')
  setTimeout(() => {
    targetEl.classList.remove('sa-cart-hit-jiggle')
  }, 380)
}

function triggerFloatingQtyPop(btnEl, qty) {
  if (typeof document === 'undefined' || !btnEl) return
  const rect = btnEl.getBoundingClientRect()
  if (!rect || (rect.width === 0 && rect.height === 0)) return

  const pop = document.createElement('span')
  pop.className = 'sa-float-qty-pop'
  pop.textContent = `+${qty}`
  pop.style.left = `${rect.left + rect.width / 2}px`
  pop.style.top = `${rect.top + 2}px`
  document.body.appendChild(pop)

  if (typeof pop.animate === 'function') {
    const anim = pop.animate(
      [
        { transform: 'translate(-50%, 0) scale(0.75)', opacity: 0 },
        { transform: 'translate(-50%, -14px) scale(1.16)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%, -40px) scale(0.96)', opacity: 0 },
      ],
      { duration: 640, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    )
    anim.onfinish = () => pop.remove()
  } else {
    setTimeout(() => pop.remove(), 650)
  }
}

function triggerFlyToCart(item, evt) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const btnEl = evt?.currentTarget || evt?.target?.closest?.('button')
  const targetEl = findVisibleCartTargetEl()
  if (!btnEl || !targetEl) return

  const cardImg = btnEl.closest?.('.card')?.querySelector?.('.card-img-wrap img')
  const startRect = cardImg ? cardImg.getBoundingClientRect() : btnEl.getBoundingClientRect()
  const endRect = targetEl.getBoundingClientRect()
  if (!startRect.width || !endRect.width) return

  const startX = startRect.left + startRect.width / 2
  const startY = startRect.top + startRect.height / 2
  const endX = endRect.left + endRect.width / 2
  const endY = endRect.top + endRect.height / 2

  const flyer = document.createElement('div')
  flyer.className = 'sa-fly-thumb'
  const imgUrl = String(item?.Main_img || '').trim()
  if (imgUrl) {
    const img = document.createElement('img')
    img.src = imgUrl
    img.alt = ''
    flyer.appendChild(img)
  } else {
    flyer.innerHTML = '<i class="ri-restaurant-2-fill"></i>'
  }

  flyer.style.left = `${startX}px`
  flyer.style.top = `${startY}px`
  document.body.appendChild(flyer)

  const dx = endX - startX
  const dy = endY - startY
  // Parabolic arc peak above the straight midpoint
  const midX = dx * 0.45
  const arcLift = Math.min(120, Math.max(48, Math.abs(dy) * 0.24 + 44))
  const midY = Math.min(0, dy * 0.35) - arcLift

  if (typeof flyer.animate === 'function') {
    const anim = flyer.animate(
      [
        {
          transform: 'translate3d(-50%, -50%, 0) scale(1.08)',
          opacity: 0.96,
        },
        {
          transform: `translate3d(calc(-50% + ${midX}px), calc(-50% + ${midY}px), 0) scale(0.86) rotate(${dx >= 0 ? 12 : -12}deg)`,
          opacity: 0.95,
          offset: 0.46,
        },
        {
          transform: `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0) scale(0.32) rotate(${dx >= 0 ? 22 : -22}deg)`,
          opacity: 0.25,
        },
      ],
      {
        duration: 500,
        easing: 'cubic-bezier(0.25, 0.85, 0.35, 1)',
        fill: 'forwards',
      },
    )
    anim.onfinish = () => {
      flyer.remove()
      triggerCartHitJiggle(targetEl)
    }
  } else {
    flyer.remove()
    triggerCartHitJiggle(targetEl)
  }
}

function triggerAddToCartEffects(item, qty, evt) {
  // Subtle Android haptic feedback (safe no-op on unsupported browsers/iOS)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(15)
    }
  } catch {}

  const btnEl = evt?.currentTarget || evt?.target?.closest?.('button')
  if (btnEl) {
    triggerFloatingQtyPop(btnEl, qty)
    triggerFlyToCart(item, evt)
  }
}

async function addToCart(m, evt = null, opts = null) {
  if (isOrderTerminal.value) {
    resetClosedOrStaleOrder(false, { autoCreateNew: false })
  } else if (isOrderLocked.value) {
    openLockedOrderContactPrompt()
    return
  }

  const hasOverrideQty = opts && Number(opts.overrideQty) > 0
  const qty = hasOverrideQty
    ? Math.max(1, Math.floor(Number(opts.overrideQty)))
    : Math.max(1, Number(tempQty.value[m.Ma_hang] || 1))
  if (!opts?.silentEffects) {
    triggerAddToCartEffects(m, qty, evt)
    triggerTelegramHaptic('light')
  }

  // Reset and re-trigger added spring state cleanly on rapid clicks
  const prevTimer = addedTimersByCode.get(m.Ma_hang)
  if (prevTimer) clearTimeout(prevTimer)
  addedMap.value[m.Ma_hang] = false
  nextTick(() => {
    addedMap.value[m.Ma_hang] = true
  })
  addedTimersByCode.set(
    m.Ma_hang,
    setTimeout(() => {
      addedMap.value[m.Ma_hang] = false
      addedTimersByCode.delete(m.Ma_hang)
    }, 520),
  )

  const typedNote =
    opts && opts.overrideNote !== undefined
      ? String(opts.overrideNote || '').trim()
      : String(itemNotes.value[m.Ma_hang] || '').trim()
  const authorName =
    memberName.value.trim() || tenKhach.value.trim() || t('group.guestDefault')
  const lineKey = makeLineId(m.Ma_hang, memberId)

  lastAdded.value = lineKey
  setTimeout(() => {
    lastAdded.value = null
  }, 2000)

  if (!opts || opts.overrideNote === undefined) {
    itemNotes.value[m.Ma_hang] = ''
  }
  if (!hasOverrideQty) {
    tempQty.value[m.Ma_hang] = 1
  }

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
const failedCardImgUrls = reactive({})
let cardImageTimer = null
const CARD_IMAGE_INTERVAL = 2600
const activeModalIndex = ref(0)
const modalImages = computed(() => getModalImages(selectedItem.value))
const activeDetailImageUrl = computed(() => {
  const imgs = modalImages.value
  if (!imgs.length) return ''
  return imgs[activeModalIndex.value] || imgs[0] || ''
})
const hasModalThumbs = computed(() => modalImages.value.length > 1)
const selectedProductVariants = computed(() =>
  getLinkedProductVariants(
    selectedItem.value?.Ma_hang,
    displayConfig.value.productGroups,
    menu.value,
  ),
)

/* ===== LINKED TOPPINGS IN DETAIL MODAL ===== */
const selectedDetailToppings = ref({}) // { [maHang]: qty }

const selectedProductToppings = computed(() =>
  getLinkedProductToppings(
    selectedItem.value,
    displayConfig.value.toppingGroups,
    menu.value,
  ),
)

watch(
  () => selectedItem.value?.Ma_hang,
  () => {
    selectedDetailToppings.value = {}
  },
)

function getDetailToppingQty(maHang) {
  return Math.max(0, Number(selectedDetailToppings.value[maHang] || 0))
}

function toggleDetailTopping(tp) {
  if (!tp?.item || tp.item.Trang_thai === 'Hết hàng') return
  const code = tp.maHang
  const cur = getDetailToppingQty(code)
  if (cur > 0) {
    const next = { ...selectedDetailToppings.value }
    delete next[code]
    selectedDetailToppings.value = next
  } else {
    selectedDetailToppings.value = { ...selectedDetailToppings.value, [code]: 1 }
  }
}

function stepDetailTopping(tp, delta) {
  if (!tp?.item || tp.item.Trang_thai === 'Hết hàng') return
  const code = tp.maHang
  const nextQty = getDetailToppingQty(code) + delta
  if (nextQty <= 0) {
    const next = { ...selectedDetailToppings.value }
    delete next[code]
    selectedDetailToppings.value = next
  } else {
    selectedDetailToppings.value = { ...selectedDetailToppings.value, [code]: nextQty }
  }
}

const selectedDetailToppingsList = computed(() => {
  const out = []
  for (const tp of selectedProductToppings.value) {
    if (tp.item?.Trang_thai === 'Hết hàng') continue
    const qty = getDetailToppingQty(tp.maHang)
    if (qty > 0) out.push({ ...tp, qty })
  }
  return out
})

const selectedDetailToppingsCount = computed(() =>
  selectedDetailToppingsList.value.reduce((sum, tp) => sum + tp.qty, 0),
)

const selectedDetailToppingsTotal = computed(() =>
  selectedDetailToppingsList.value.reduce(
    (sum, tp) => sum + finalPrice(tp.item) * tp.qty,
    0,
  ),
)

async function addDetailWithToppings(mainItem, evt = null) {
  if (!mainItem) return
  const pickedToppings = [...selectedDetailToppingsList.value]
  selectedDetailToppings.value = {}
  const mainViName = String(mainItem._tenVi || mainItem.Ten_hang || '').trim()

  await addToCart(mainItem, evt)

  for (const tp of pickedToppings) {
    if (!tp?.item || tp.item.Trang_thai === 'Hết hàng') continue
    await addToCart(tp.item, null, {
      overrideQty: tp.qty,
      overrideNote: mainViName ? `Kèm: ${mainViName}` : '',
      silentEffects: true,
    })
  }
}

function switchDetailVariant(variantItem) {
  if (!variantItem || variantItem.Ma_hang === selectedItem.value?.Ma_hang) return
  ensureTempQty(variantItem)
  openDetail(variantItem)
}
const relatedDetailItems = computed(() => {
  const cur = selectedItem.value
  if (!cur) return []
  const curSub = String(cur.Danh_muc || '').trim()
  const curParent = String(getEffectiveParentCategory(cur) || '').trim()

  const sameSub = []
  const sameParent = []
  for (const item of menu.value) {
    if (!item || item.Ma_hang === cur.Ma_hang) continue
    if (curSub && String(item.Danh_muc || '').trim() === curSub) {
      sameSub.push(item)
    } else if (curParent && getEffectiveParentCategory(item) === curParent) {
      sameParent.push(item)
    }
  }
  return [...sameSub, ...sameParent].slice(0, 6)
})

function getDetailQty(item) {
  if (!item?.Ma_hang) return 1
  const q = Number(tempQty.value[item.Ma_hang] || 1)
  return Number.isFinite(q) && q >= 1 ? Math.floor(q) : 1
}

function getDetailCtaTotal(item) {
  if (!item) return ''
  const baseTotal = finalPrice(item) * getDetailQty(item)
  const toppingTotal =
    selectedItem.value?.Ma_hang === item.Ma_hang ? selectedDetailToppingsTotal.value : 0
  return formatPrice(baseTotal + toppingTotal, item.Don_vi_tien_te)
}

// sidebar mới (mobile)
const showDetailSidebar = ref(false)

function getCardImgFailKey(item, url) {
  return `${item?.Ma_hang || 'item'}::${url || ''}`
}

function onCardImgError(item, url) {
  if (!url) return
  failedCardImgUrls[getCardImgFailKey(item, url)] = true
}

function getItemImages(item) {
  if (!item) return []
  return [
    item.Main_img,
    ...supplementaryImageKeys.map((key) => item[key])
  ]
    .map((u) => String(u || '').trim())
    .filter(Boolean)
}

function getValidItemImages(item) {
  return getItemImages(item).filter((u) => !failedCardImgUrls[getCardImgFailKey(item, u)])
}

function getModalImages(item) {
  return getValidItemImages(item)
}

function getCardImageIndex(item) {
  const id = item?.Ma_hang
  if (!id) return 0
  return cardImageIndex.value[id] || 0
}

function getCardImage(item) {
  const images = getValidItemImages(item)
  if (!images.length) return ''
  const idx = getCardImageIndex(item) % images.length
  return images[idx] || images[0]
}

function getCardImageKey(item) {
  const id = item?.Ma_hang || 'item'
  return `${id}-${getCardImageIndex(item)}`
}

function toAmbientBlurUrl(rawUrl) {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_72,h_72,c_fill,e_blur:900,q_auto:low,f_auto/')
  }
  return url
}

function getAmbientGlassStyle(rawUrl) {
  const ambient = toAmbientBlurUrl(rawUrl)
  if (!ambient) return undefined
  const safe = ambient.replace(/["\\]/g, '\\$&')
  return { '--sa-ambient-img': `url("${safe}")` }
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

function syncUrlToProduct(item, { replace = false } = {}) {
  if (!item) return
  const activeLang = String(locale.value || route.params.lang || 'vi').trim() || 'vi'
  const { productSlug, productId } = getProductUrlParams(item, activeLang)
  if (
    route.name === 'menu-online' &&
    route.params.lang === activeLang &&
    route.params.productSlug === productSlug &&
    route.params.productId === productId
  ) {
    return
  }
  const navMethod = replace ? router.replace : router.push
  navMethod.call(router, {
    name: 'menu-online',
    params: {
      lang: activeLang,
      productSlug,
      productId,
    },
    query: route.query,
  })
}

function clearProductFromUrl() {
  if (
    !route.params.productId &&
    !route.params.productSlug &&
    !route.params.parentCategory &&
    !route.params.subCategory
  ) {
    return
  }
  const activeLang = String(locale.value || route.params.lang || 'vi').trim() || 'vi'
  router.replace({
    name: 'menu-online',
    params: { lang: activeLang },
    query: route.query,
  })
}

function syncDetailFromRoute() {
  const productId = String(route.params.productId || '').trim()
  const productSlug = String(route.params.productSlug || '').trim()
  if (!productId && !productSlug) {
    if (selectedItem.value) {
      showDetail.value = false
      showDetailSidebar.value = false
      selectedItem.value = null
      activeModalIndex.value = 0
    }
    return
  }

  if (!menu.value.length) return
  const activeLang = String(locale.value || route.params.lang || 'vi').trim() || 'vi'
  const matched = findProductByUrlParams(
    menu.value,
    {
      productId,
      productSlug,
      parentSlug: route.params.parentCategory,
      subSlug: route.params.subCategory,
    },
    activeLang,
  )

  if (matched) {
    selectedItem.value = matched
    activeModalIndex.value = 0
    if (isMobile.value) {
      showDetail.value = false
      showDetailSidebar.value = true
    } else {
      showDetailSidebar.value = false
      showDetail.value = true
    }
    syncUrlToProduct(matched, { replace: true })
  }
}

function openDetail(m, options = {}) {
  if (!m) return
  selectedItem.value = m
  activeModalIndex.value = 0

  if (isMobile.value) {
    //  MOBILE → mở trang chi tiết full
    showDetailSidebar.value = true
  } else {
    //  DESKTOP → mở trang chi tiết full
    showDetail.value = true
  }

  if (!options.skipUrlSync) {
    syncUrlToProduct(m, {
      replace: Boolean(route.params.productId || route.params.productSlug),
    })
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
  clearProductFromUrl()
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
  clearProductFromUrl()
}

function selectCategoryFromDetail(parentCat, subCat = '') {
  if (isMobile.value) {
    closeDetailSidebar()
  } else {
    closeDetail()
  }
  if (parentCat) {
    currentCategory.value = parentCat
    currentSubCategory.value = subCat || ''
    resetVisibleMenu()
    nextTick(() => scrollToTop())
  }
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
  const lang = currentLang.value
  return list.map((m, idx) => {
    const unlocked = totalAmount.value >= m.threshold
    const remaining = Math.max(0, m.threshold - totalAmount.value)
    const remainingText = formatPrice(remaining, cartCurrency.value)
    const isNext =
      !unlocked && (nextId ? m.ID === nextId : idx === unlockedMilestones.value.length)
    const posPct = count > 0 ? ((idx + 1) / count) * 100 : 100
    let actionPrefix = ''
    if (unlocked) {
      if (lang === 'en') actionPrefix = 'Unlocked'
      else if (lang === 'zh' || lang === 'zh-CN') actionPrefix = '已解锁'
      else if (lang === 'ko') actionPrefix = '달성 완료'
      else if (lang === 'fil' || lang === 'tl') actionPrefix = 'Nakuha na'
      else actionPrefix = 'Đã đạt'
    } else {
      if (lang === 'en') actionPrefix = `Add ${remainingText} more`
      else if (lang === 'zh' || lang === 'zh-CN') actionPrefix = `再买 ${remainingText}`
      else if (lang === 'ko') actionPrefix = `${remainingText} 더 담기`
      else if (lang === 'fil' || lang === 'tl') actionPrefix = `Magdagdag pa ng ${remainingText}`
      else actionPrefix = `Mua thêm ${remainingText}`
    }
    return {
      key: m.ID || `ms-${idx}-${m.threshold}`,
      threshold: m.threshold,
      thresholdText: formatPrice(m.threshold, cartCurrency.value),
      remaining,
      remainingText,
      actionPrefix,
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
    const scrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0)
    showScrollTop.value = scrollY > 260

    if (
      activeMobilePanel.value ||
      showFullCartModal.value ||
      selectedItem.value ||
      scrollY <= 36
    ) {
      isMobileDockHidden.value = false
      lastMobileScrollY = scrollY
    } else {
      const delta = scrollY - lastMobileScrollY
      if (delta > 10) {
        isMobileDockHidden.value = true
        lastMobileScrollY = scrollY
      } else if (delta < -8) {
        isMobileDockHidden.value = false
        lastMobileScrollY = scrollY
      }
    }

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
  if (data.display_config) {
    displayConfigRows.value = data.display_config
  }
  syncDetailFromRoute()
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
    ensureDeliveryTimeForSubmit()
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

    const tgProfile = isTelegramMiniApp() ? getTelegramUserProfile() : null
    const res = await submitCustomerOrder({
      orderId: activeOrderId.value || undefined,
      hostId: memberId,
      hostName: memberName.value.trim() || recipientName,
      telegramInitData: tgProfile?.initData || getTelegramInitData() || '',
      meta: {
        Ten_khach_hang: recipientName,
        So_dien_thoai: sdt.value.trim(),
        Dia_chi: diaChi.value.trim(),
        Thoi_gian_nhan_hang: thoiGian.value.trim(),
        Hinh_thuc_thanh_toan: hinhThucTT.value || 'TIEN_MAT',
        Ghi_chu: stripAutoPromoTag(ghiChu.value),
        Khuyen_mai_dat_duoc: earnedPromoViSummary.value,
        Submitted_sig: nextSubmittedSig,
        Don_vi_tien_te: cartCurrency.value,
        ...(tgProfile?.id ? { Telegram_chat_id: tgProfile.id } : {}),
        ...(tgProfile?.username ? { Telegram_username: tgProfile.username } : {}),
        ...(isTelegramMiniApp() ? { Telegram_lang: currentLang.value || 'vi' } : {}),
      },
      items: payloadItems,
    })

    if (res?.locked) {
      triggerTelegramHaptic('warning')
      triggerToast(t('group.lockedHint'), 'warn')
      return false
    }

    if (res?.success && res.orderId) {
      triggerTelegramHaptic('success')
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
          Ngay_tao_duong_lich:
            prevLive.meta?.Trang_thai &&
            prevLive.meta?.Trang_thai !== 'Nháp' &&
            prevLive.meta?.Ngay_tao_duong_lich
              ? prevLive.meta.Ngay_tao_duong_lich
              : format24hDateTimeObj(new Date()),
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
        submittedItemsMap: nextItemsMap,
        submittedItemsList: payloadItems,
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

const exportProgressCardRef = ref(null)
const exportSubmitFxCardRef = ref(null)
const exportCometDotRefs = []
const exportProgressPreDrop = ref(false)
const exportProgressDropHit = ref(false)
const exportSubmitFx = reactive({
  visible: false,
  flying: false,
  impacting: false,
  isUpdate: false,
  orderCode: '',
  impactX: 0,
  impactY: 0,
})
let exportSubmitRafId = 0
let exportSubmitPhaseTimer = null
let exportSubmitImpactTimer = null
let exportSubmitResetTimer = null

function setCometDotRef(el, idx) {
  exportCometDotRefs[idx] = el || null
}

function cleanupExportSubmitFx() {
  if (exportSubmitPhaseTimer) {
    clearTimeout(exportSubmitPhaseTimer)
    exportSubmitPhaseTimer = null
  }
  if (exportSubmitImpactTimer) {
    clearTimeout(exportSubmitImpactTimer)
    exportSubmitImpactTimer = null
  }
  if (exportSubmitResetTimer) {
    clearTimeout(exportSubmitResetTimer)
    exportSubmitResetTimer = null
  }
  if (exportSubmitRafId) {
    cancelAnimationFrame(exportSubmitRafId)
    exportSubmitRafId = 0
  }
  for (const dot of exportCometDotRefs) {
    if (dot) {
      dot.style.opacity = '0'
    }
  }
  exportSubmitFx.visible = false
  exportSubmitFx.flying = false
  exportSubmitFx.impacting = false
  exportProgressPreDrop.value = false
  exportProgressDropHit.value = false
}

watch(showExportModal, (open) => {
  if (!open) cleanupExportSubmitFx()
})

function evalQuadBezier(p0x, p0y, p1x, p1y, p2x, p2y, tVal) {
  const inv = 1 - tVal
  return {
    x: inv * inv * p0x + 2 * inv * tVal * p1x + tVal * tVal * p2x,
    y: inv * inv * p0y + 2 * inv * tVal * p1y + tVal * tVal * p2y,
  }
}

async function triggerExportSubmitAnimation({ isUpdate = false, orderCode = '' } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  cleanupExportSubmitFx()

  exportProgressPreDrop.value = true
  exportSubmitFx.isUpdate = Boolean(isUpdate)
  exportSubmitFx.orderCode = String(orderCode || '').trim()
  exportSubmitFx.flying = false
  exportSubmitFx.impacting = false
  exportSubmitFx.visible = true

  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))
  if (!showExportModal.value) {
    cleanupExportSubmitFx()
    return
  }

  exportProgressCardRef.value?.scrollIntoView?.({ block: 'nearest' })

  const triggerLockOnImpact = (hitX, hitY) => {
    exportSubmitRafId = 0
    for (const dot of exportCometDotRefs) {
      if (dot) dot.style.opacity = '0'
    }
    exportProgressPreDrop.value = false
    exportProgressDropHit.value = true

    if (hitX > 0 || hitY > 0) {
      exportSubmitFx.impactX = Math.round(hitX)
      exportSubmitFx.impactY = Math.round(hitY)
      exportSubmitFx.flying = false
      exportSubmitFx.impacting = true
      exportSubmitImpactTimer = setTimeout(() => {
        exportSubmitImpactTimer = null
        exportSubmitFx.impacting = false
        exportSubmitFx.visible = false
      }, 560)
    } else {
      exportSubmitFx.visible = false
      exportSubmitFx.flying = false
    }

    exportSubmitResetTimer = setTimeout(() => {
      exportProgressDropHit.value = false
      exportSubmitResetTimer = null
    }, 980)
  }

  exportSubmitPhaseTimer = setTimeout(() => {
    exportSubmitPhaseTimer = null
    if (!showExportModal.value || !exportSubmitFx.visible) {
      cleanupExportSubmitFx()
      return
    }

    const medallionEl = exportSubmitFxCardRef.value
    const progressCard = exportProgressCardRef.value
    const getTargetCenter = () => {
      const node =
        progressCard?.querySelector?.('.gs-step.is-current .gs-node') || progressCard
      if (!node) return null
      const r = node.getBoundingClientRect()
      if (!r.width && !r.height) return null
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }

    const initialTarget = getTargetCenter()
    if (!medallionEl || !initialTarget) {
      triggerLockOnImpact(0, 0)
      return
    }

    const startRect = medallionEl.getBoundingClientRect()
    const startX = startRect.left + startRect.width / 2
    const startY = startRect.top + startRect.height / 2

    exportSubmitFx.flying = true

    const durationMs = 620
    const t0 = performance.now()

    const stepFrame = (now) => {
      if (!showExportModal.value || !exportSubmitFx.visible) {
        cleanupExportSubmitFx()
        return
      }

      const rawP = Math.min(1, Math.max(0, (now - t0) / durationMs))
      const eased =
        rawP < 0.5
          ? 4 * rawP * rawP * rawP
          : 1 - Math.pow(-2 * rawP + 2, 3) / 2

      const liveTarget = getTargetCenter() || initialTarget
      const endX = liveTarget.x
      const endY = liveTarget.y
      const spanX = endX - startX
      const spanY = endY - startY
      const sideArc = spanX >= 0 ? Math.max(44, spanX * 0.32) : Math.min(-44, spanX * 0.32)
      const ctrlX = startX + spanX * 0.38 + sideArc
      const ctrlY = Math.min(startY, endY) - Math.max(54, Math.abs(spanY) * 0.22)

      const head = evalQuadBezier(startX, startY, ctrlX, ctrlY, endX, endY, eased)
      const orbScale = 1 - 0.72 * Math.pow(eased, 0.82)
      medallionEl.style.transform = `translate3d(${(head.x - startX).toFixed(1)}px, ${(head.y - startY).toFixed(1)}px, 0) scale(${orbScale.toFixed(3)})`

      const tailEnvelope = Math.sin(rawP * Math.PI)
      for (let i = 0; i < exportCometDotRefs.length; i++) {
        const dot = exportCometDotRefs[i]
        if (!dot) continue
        const lagT = Math.max(0, eased - (i + 1) * 0.036)
        const pt = evalQuadBezier(startX, startY, ctrlX, ctrlY, endX, endY, lagT)
        const dotScale = (1 - i * 0.095) * (0.65 + 0.35 * tailEnvelope)
        const dotOpacity = (1 - i / (exportCometDotRefs.length + 0.5)) * tailEnvelope * 0.92
        dot.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${dotScale.toFixed(2)})`
        dot.style.opacity = dotOpacity > 0.02 ? dotOpacity.toFixed(2) : '0'
      }

      if (rawP < 1) {
        exportSubmitRafId = requestAnimationFrame(stepFrame)
      } else {
        triggerLockOnImpact(endX, endY)
      }
    }

    exportSubmitRafId = requestAnimationFrame(stepFrame)
  }, 940)
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
    if (liveStatus.value === 'Chờ duyệt' && activeOrderId.value) {
      showEmptyPendingOrderModal.value = true
    } else {
      showEmptyCartModal.value = true
    }
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
  ensureDeliveryTimeForSubmit()

  const wasAlreadySubmitted = Boolean(liveStatus.value && liveStatus.value !== 'Nháp')
  const ok = await submitOrderToWebCore({ silentToast: true })
  if (!ok) return

  if (isMobile.value) {
    openMobileProgressAfterSubmit({ toast: false, keepExport: true })
  } else {
    showFullCartModal.value = false
  }
  exportProgressPreDrop.value = true
  showExportModal.value = true
  void triggerExportSubmitAnimation({
    isUpdate: wasAlreadySubmitted,
    orderCode: activeOrderId.value,
  })
}

function onMobileSendTab() {
  if (!isMobile.value) return
  if (liveStatus.value === 'Chờ duyệt' && cartItems.value.length === 0 && isGroupHost.value) {
    showEmptyPendingOrderModal.value = true
    return
  }
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
  isMobileDockHidden.value = false

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

function selectCategory(c, options = {}) {
  currentCategory.value = c
  currentSubCategory.value = ''
  resetVisibleMenu()

  if (c === allCategoryLabel.value) {
    keyword.value = ''
    searchInput.value = ''
    priceSort.value = 'all'
  }

  const nextSubCats = getSubCategoriesForParent(
    menu.value,
    c,
    String(locale.value || 'vi').trim() || 'vi',
    displayConfig.value,
  )

  if (nextSubCats.length && collapsedCatParents.value[c]) {
    collapsedCatParents.value = {
      ...collapsedCatParents.value,
      [c]: false,
    }
  }

  if (!nextSubCats.length) {
    showAllCatsDrawer.value = false
  }

  // mobile thì đóng modal danh mục nếu không có danh mục con
  if (isMobile.value && !(options.keepModalOpenIfHasSub && nextSubCats.length)) {
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

function selectSubCategory(sub) {
  currentSubCategory.value = sub || ''
  showAllCatsDrawer.value = false
  resetVisibleMenu()

  if (isMobile.value) {
    showCategoryModal.value = false
    if (activeMobilePanel.value === 'category') {
      activeMobilePanel.value = null
    }
  }

  nextTick(() => {
    scrollToTop()
  })
}

function selectParentAndSub(parentCat, sub = '') {
  const cleanParent = String(parentCat || '').trim()
  if (!cleanParent) return
  currentCategory.value = cleanParent
  currentSubCategory.value = String(sub || '').trim()
  if (collapsedCatParents.value[cleanParent]) {
    collapsedCatParents.value = {
      ...collapsedCatParents.value,
      [cleanParent]: false,
    }
  }
  showAllCatsDrawer.value = false
  resetVisibleMenu()

  if (isMobile.value) {
    showCategoryModal.value = false
    if (activeMobilePanel.value === 'category') {
      activeMobilePanel.value = null
    }
  }

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
      display_config: json.data.display_config || [],
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
      if (updated) {
        selectedItem.value = updated
        syncUrlToProduct(updated, { replace: true })
      }
    } else if (route.params.productId || route.params.productSlug) {
      syncDetailFromRoute()
    }

    if (!rawMenu.value.length) {
      reloadData()
    }
  },
  { immediate: true }
)

watch(
  () => [
    route.params.productSlug,
    route.params.productId,
    route.params.parentCategory,
    route.params.subCategory,
  ],
  () => {
    syncDetailFromRoute()
  },
)

onUnmounted(() => {
  clearStorefrontThemeFromRoot()
  for (const timer of addedTimersByCode.values()) {
    clearTimeout(timer)
  }
  addedTimersByCode.clear()
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
  if (unsubDisplayConfigLive) {
    unsubDisplayConfigLive()
    unsubDisplayConfigLive = null
  }
  if (metaSyncTimer) clearTimeout(metaSyncTimer)
  if (toastTimer) clearTimeout(toastTimer)
  cleanupExportSubmitFx()
  if (noticeResizeObserver) {
    noticeResizeObserver.disconnect()
    noticeResizeObserver = null
  }
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('scroll', onWindowScroll)
  document.removeEventListener('click', onDocumentClick)
  stopSidebarResize()
  if (mainRef.value) {
    mainRef.value.removeEventListener('scroll', updateScrollTopVisibility)
  }
})
function addFromDetailSidebar(evt = null) {
  if (!selectedItem.value) return
  if (isOrderLocked.value && !isOrderTerminal.value) {
    openLockedOrderContactPrompt()
    return
  }

  // 1⃣ add món chính + các topping đã chọn vào giỏ
  addDetailWithToppings(selectedItem.value, evt)

  // 2⃣ kích hoạt animation đóng
  closingDetailSidebar.value = true

  // 3⃣ đợi animation xong → đóng sidebar
  setTimeout(() => {
    closingDetailSidebar.value = false
    closeDetailSidebar()
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
  if (showDetailSidebar.value) {
    closeDetailSidebar()
  }

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
function openImageModal(src, linkUrl = '') {
  previewImage.value = src
  previewImageLink.value = normalizeBannerLink(linkUrl)
  showImageModal.value = true
}

function closeImageModal() {
  showImageModal.value = false
  previewImage.value = ''
  previewImageLink.value = ''
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
  const tong = Number(customerPayableTotal.value || 0)

  const tiGia = Number(c.Ti_gia || 1)
  const donViCK = c.Don_vi_tien_te || ''

  const sauQuyDoi = tong * tiGia

  return `${formatPrice(tong, cartCurrency.value)} ~ ${formatPrice(sauQuyDoi, donViCK)}`
}

const calcOnlyTransferAmount = (c) => {
  const tong = Number(customerPayableTotal.value || 0)
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
  --sa-primary: #059669;
  --sa-primary-hover: #047857;
  --sa-primary-dark: #065f46;
  --sa-primary-deep: #064e3b;
  --sa-primary-deepest: #052e16;
  --sa-primary-bright: #10b981;
  --sa-primary-light: #34d399;
  --sa-primary-pastel: #d1fae5;
  --sa-primary-soft: #ecfdf5;
  --sa-primary-soft-2: #f0fdf4;
  --sa-primary-rgb: 5, 150, 105;
  --sa-primary-bright-rgb: 16, 185, 129;
  --sa-primary-dark-rgb: 4, 120, 87;
  --sa-primary-deep-rgb: 6, 78, 59;
  --sa-on-primary: #ffffff;
  --sa-on-primary-muted: rgba(255, 255, 255, 0.86);
  --sa-secondary: #facc15;
  --sa-secondary-bright: #fde047;
  --sa-secondary-light: #fef08a;
  --sa-secondary-soft: #fefce8;
  --sa-secondary-mid: #eab308;
  --sa-secondary-dark: #d97706;
  --sa-secondary-deep: #92400e;
  --sa-secondary-rgb: 250, 204, 21;
  --sa-secondary-mid-rgb: 234, 179, 8;
  --sa-secondary-dark-rgb: 217, 119, 6;
  --sa-secondary-light-rgb: 254, 240, 138;
  --sa-on-secondary: #0f172a;
  --sa-radius-card: 14px;
  --sa-radius-btn: 10px;
  --sa-radius-sm: 8px;
  --sa-radius-panel: 16px;
  --sa-bg: #f6f8fa;
  --sa-main-bg: #f6f8fa;
  --sa-top-header-bg: linear-gradient(135deg, #059669 0%, #047857 58%, #065f46 100%);
  --sa-top-header-bg-h: linear-gradient(90deg, #059669 0%, #047857 58%, #065f46 100%);
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
  --sa-on-accent: #ffffff;
  --sa-price: #059669;
  --sa-sale: #e11d48;
  --sa-qty-bg: #f1f5f9;
  --sa-qty-text: #0f172a;
  --sa-card-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 12px 24px -6px rgba(15, 23, 42, 0.11);
  --sa-card-hover-shadow: 0 14px 30px rgba(15, 23, 42, 0.16), 0 4px 10px rgba(5, 150, 105, 0.14);
  --sa-notice-bg: linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 58%, #fefce8 100%);
  --sa-notice-border: rgba(5, 150, 105, 0.28);
  --sa-notice-text: #064e3b;
  --sa-notice-icon: #065f46;
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

.sa-storefront.sa-radius-sharp .card,
.sa-storefront.sa-radius-sharp .banner,
.sa-storefront.sa-radius-sharp .notice-bar,
.sa-storefront.sa-radius-sharp .sidebar-right {
  border-radius: var(--sa-radius-card) !important;
}

.sa-storefront.sa-radius-sharp .add-btn,
.sa-storefront.sa-radius-sharp .btn-order,
.sa-storefront.sa-radius-sharp .order-btn,
.sa-storefront.sa-radius-sharp .dth-search-box,
.sa-storefront.sa-radius-sharp .dth-cart-pill {
  border-radius: var(--sa-radius-btn) !important;
}

.sa-storefront.sa-radius-pill .card,
.sa-storefront.sa-radius-pill .banner,
.sa-storefront.sa-radius-pill .notice-bar,
.sa-storefront.sa-radius-pill .sidebar-right {
  border-radius: var(--sa-radius-card) !important;
}

.sa-storefront.sa-radius-pill .add-btn,
.sa-storefront.sa-radius-pill .btn-order,
.sa-storefront.sa-radius-pill .order-btn {
  border-radius: var(--sa-radius-btn) !important;
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
  --sa-top-header-bg-h: linear-gradient(90deg, #065f46 0%, #064e3b 55%, #022c22 100%);
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
  --sa-accent-hover: #0ea472;
  --sa-on-accent: #ffffff;
  --sa-price: #34d399;
  --sa-sale: #fb7185;
  --sa-qty-bg: #1c2536;
  --sa-qty-text: #f8fafc;
  --sa-card-shadow: 0 8px 22px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.34);
  --sa-card-hover-shadow: 0 16px 36px rgba(0, 0, 0, 0.65), 0 4px 14px rgba(16, 185, 129, 0.18);
  --sa-notice-bg: linear-gradient(90deg, rgba(6, 78, 59, 0.42) 0%, rgba(4, 120, 87, 0.24) 65%, rgba(234, 179, 8, 0.14) 100%);
  --sa-notice-border: rgba(52, 211, 153, 0.32);
  --sa-notice-text: #ecfdf5;
  --sa-notice-icon: #052e16;
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
  box-shadow: 0 4px 18px rgba(var(--sa-primary-dark-rgb), 0.18);
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
  color: var(--sa-on-primary, #ffffff);
  letter-spacing: -0.15px;
  line-height: 1.2;
}

.dth-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--sa-on-primary-muted, rgba(255, 255, 255, 0.88));
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
  background: var(--sa-primary);
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
  background: var(--sa-primary-hover);
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
  color: var(--sa-on-primary, #ffffff);
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
  color: var(--sa-secondary-light);
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
  color: var(--sa-primary-dark);
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
  color: var(--sa-primary);
  font-size: 16px;
}

.dth-cart-pill.active,
.dth-cart-pill:hover {
  background: var(--sa-primary-soft);
  border-color: #ffffff;
  color: var(--sa-primary-hover);
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
  background: var(--sa-primary);
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
  padding: 4px 2px;
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
  box-shadow: 0 2px 8px rgba(var(--sa-primary-rgb), 0.22);
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

/* Desktop & shared parent category pill (Nền vàng, chữ xanh lá cây) */
.sa-storefront .sct-cat-pill.is-parent-cat {
  background: linear-gradient(135deg, var(--sa-secondary-soft) 0%, var(--sa-secondary-light) 100%);
  border: 1.5px solid var(--sa-secondary-mid);
  color: var(--sa-primary-dark);
  font-weight: 800;
}

.sa-storefront .sct-cat-pill.is-parent-cat:not(.active):not(.is-parent-active):hover {
  background: linear-gradient(135deg, var(--sa-secondary-light) 0%, var(--sa-secondary-bright) 100%);
  border-color: var(--sa-secondary-mid);
  color: var(--sa-primary-deep);
}

.sa-storefront .sct-cat-pill.is-parent-cat.active,
.sa-storefront .sct-cat-pill.is-parent-cat.is-parent-active {
  background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
  border: 2px solid var(--sa-primary);
  color: var(--sa-primary-deep);
  box-shadow: 0 3px 10px rgba(var(--sa-secondary-mid-rgb), 0.35);
}

.sa-storefront.theme-dark .sct-cat-pill.is-parent-cat {
  background: linear-gradient(135deg, var(--sa-secondary) 0%, var(--sa-secondary-mid) 100%);
  border: 1.5px solid var(--sa-secondary-bright);
  color: var(--sa-primary-deepest);
}

.sa-storefront.theme-dark .sct-cat-pill.is-parent-cat:not(.active):not(.is-parent-active):hover {
  background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
  border-color: var(--sa-secondary-light);
  color: var(--sa-primary-deepest);
}

.sa-storefront.theme-dark .sct-cat-pill.is-parent-cat.active,
.sa-storefront.theme-dark .sct-cat-pill.is-parent-cat.is-parent-active {
  background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
  border: 2px solid var(--sa-primary-light);
  color: var(--sa-primary-deepest);
  box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.28), 0 4px 12px rgba(var(--sa-secondary-rgb), 0.32);
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
  grid-template-columns: minmax(0, 1fr) 8px var(--pc-sidebar-w, clamp(336px, 24.5vw, 368px));
  min-height: calc(100vh - var(--sa-header-h));
  background: var(--sa-bg);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  transition: grid-template-columns 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.layout.is-resizing-sidebar {
  transition: none !important;
}

.layout.is-resizing-sidebar .sidebar-right,
.layout.is-resizing-sidebar .sidebar-right .sidebar-content,
.layout.is-resizing-sidebar .pc-sidebar-resizer {
  transition: none !important;
}

.layout.is-resizing-sidebar,
.layout.is-resizing-sidebar * {
  user-select: none !important;
  cursor: col-resize !important;
}

.layout.hide-right,
.layout.hide-left.hide-right {
  grid-template-columns: minmax(0, 1fr) 0px 0px;
}

.pc-sidebar-resizer {
  position: sticky;
  top: var(--sa-header-h);
  height: calc(100vh - var(--sa-header-h));
  width: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  z-index: 25;
  background: var(--sa-bg);
  touch-action: none;
  overflow: hidden;
  transition: opacity 0.22s ease, width 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.pc-sidebar-resizer.is-hidden {
  width: 0;
  opacity: 0;
  pointer-events: none;
}

.pc-sidebar-resizer-grip {
  width: 3px;
  height: 44px;
  border-radius: 999px;
  background: var(--sa-border);
  transition: all 0.16s ease;
}

.pc-sidebar-resizer:hover .pc-sidebar-resizer-grip,
.pc-sidebar-resizer.active .pc-sidebar-resizer-grip {
  width: 4px;
  height: 76px;
  background: var(--sa-primary-bright);
  box-shadow: 0 0 10px rgba(var(--sa-primary-bright-rgb), 0.5);
}

.menu {
  scroll-margin-top: 68px;
}

/* SIDEBAR LEFT */
.sidebar-left {
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  
  background: linear-gradient(
    180deg,
    var(--sa-primary-bright),
    var(--sa-primary-bright),
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
  color: var(--sa-primary-dark);

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
  .main.dock-expanded .sct-subcat-inner,
  .main.dock-expanded .menu-container {
    width: min(1360px, calc(100% - 218px));
    margin-left: max(218px, calc((100% - 1360px) / 2));
    margin-right: auto;
  }

  .main.dock-collapsed .hero-container,
  .main.dock-collapsed .scam-hub-section,
  .main.dock-collapsed .sct-inner,
  .main.dock-collapsed .sct-subcat-inner,
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
    0 2px 8px rgba(var(--sa-primary-rgb), 0.08);
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
  box-shadow: 0 6px 16px rgba(var(--sa-primary-rgb), 0.26);
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
  box-shadow: 0 4px 10px rgba(var(--sa-primary-rgb), 0.1);
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
  gap: 8px;
  margin-top: 4px;
  padding-bottom: 14px;
  margin-bottom: 14px;
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
  box-shadow: 0 6px 16px rgba(var(--sa-primary-rgb), 0.22);
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
    0 0 0 3px rgba(var(--sa-primary-rgb), 0.16),
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
    0 0 0 3px rgba(var(--sa-primary-rgb), 0.18),
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
    0 0 0 3px rgba(var(--sa-primary-rgb), 0.22),
    0 6px 14px rgba(var(--sa-primary-rgb), 0.24);
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
  padding-top: 4px;
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

.sa-storefront .price,
.price {
  font-size: 16.5px;
  font-weight: 800;
  color: var(--sa-price);
  letter-spacing: -0.2px;
}

.sa-storefront .price.is-sale-price,
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
  position: relative;
  margin-top: 0;
  flex: 1;
  width: 100%;
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  transition:
    background 0.18s ease,
    transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease;
  border: none;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--sa-primary-bright) 0%,
    var(--sa-accent) 55%,
    var(--sa-accent-hover) 100%
  );
  color: var(--sa-on-accent, var(--sa-on-primary, #ffffff));
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  box-shadow:
    0 3px 10px rgba(var(--sa-primary-rgb), 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.add-btn-ico {
  font-size: 15px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-btn-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: saAddCheckPop 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ===== CARD IN-CART INDICATOR (SLIM BOTTOM BAR ON IMAGE + SUBTLE RING) ===== */
.card.is-in-cart {
  border-color: rgba(var(--sa-primary-rgb), 0.55);
  box-shadow:
    0 0 0 1.5px rgba(var(--sa-primary-rgb), 0.22),
    var(--sa-card-shadow);
}

.card-img-wrap .card-incart-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 10px;
  background: linear-gradient(
    90deg,
    rgba(var(--sa-primary-deep-rgb), 0.9) 0%,
    rgba(var(--sa-primary-rgb), 0.92) 100%
  );
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.2;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
  transition: background 0.2s ease;
}

.card-img-wrap .card-incart-bar i {
  font-size: 12.5px;
  color: var(--sa-secondary-bright, #fde047);
}

.card-img-wrap .card-incart-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--sa-secondary, #facc15);
  color: var(--sa-on-secondary, #0f172a);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.card-img-wrap .card-incart-bar.is-pop .card-incart-num {
  animation: saAddCountBump 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-btn.added {
  background: linear-gradient(135deg, var(--sa-accent) 0%, var(--sa-accent-hover) 100%);
  color: var(--sa-on-accent, var(--sa-on-primary, #ffffff));
  animation: saAddBtnPop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-btn.added::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 2px solid var(--sa-accent);
  pointer-events: none;
  animation: saAddBurstRing 0.46s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.add-btn.added i {
  font-size: 17px;
}

.add-btn:hover:not(:disabled) {
  filter: brightness(1.04);
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(var(--sa-primary-rgb), 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.add-btn:hover:not(:disabled) .add-btn-ico {
  transform: rotate(90deg) scale(1.08);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.91) translateY(1px);
  box-shadow: 0 1px 3px rgba(var(--sa-primary-rgb), 0.2);
  transition-duration: 0.08s;
}

@keyframes saAddBtnPop {
  0% {
    transform: scale(0.91);
  }
  48% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes saAddCheckPop {
  0% {
    transform: scale(0.4) rotate(-35deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes saAddCountBump {
  0% {
    transform: scale(0.72);
  }
  55% {
    transform: scale(1.24);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes saAddBurstRing {
  0% {
    transform: scale(1);
    opacity: 0.72;
  }
  100% {
    transform: scale(1.16, 1.48);
    opacity: 0;
  }
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
  box-shadow: 0 2px 8px rgba(var(--sa-primary-rgb), 0.22);
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
  box-shadow: 0 6px 18px rgba(var(--sa-primary-rgb), 0.24);
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
  .sidebar-right {
    overflow: hidden;
    transition:
      background-color 0.22s ease,
      border-color 0.22s ease,
      opacity 0.26s ease,
      visibility 0s linear 0s;
  }

  .sidebar-right .sidebar-content {
    width: var(--pc-sidebar-w, clamp(336px, 24.5vw, 368px));
    transition:
      transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.24s ease;
    will-change: transform, opacity;
  }

  .sidebar-right.collapsed {
    border-left-color: transparent;
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
    transition:
      background-color 0.22s ease,
      border-color 0.22s ease,
      opacity 0.22s ease,
      visibility 0s linear 0.32s;
  }

  .sidebar-right.collapsed .sidebar-content {
    transform: translateX(28px);
    opacity: 0;
  }

  .scroll-top-fab {
    transition:
      right 0.32s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.2s ease,
      background 0.2s ease,
      box-shadow 0.2s ease;
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
  border: 2px solid var(--sa-primary-dark);

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
  border-color: var(--sa-primary-bright);
  box-shadow:
    0 0 0 3px rgba(var(--sa-primary-bright-rgb), 0.2);
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
  background: var(--sa-primary-bright);
  color: white;
  border: none;
}

/* FOOTER */
.footer {
  margin-top: auto;
  padding: 16px;
  background: var(--sa-primary-bright);
  color: white;
  font-size: 13px;
  font-weight: bold;
  border-radius: 16px;
}

.footer div {
  color: white;
  margin-bottom: 6px;
}

.sidebar-left.collapsed .sidebar-content {
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
  border: 2px solid var(--sa-primary-bright);
  box-shadow:
    0 0 0 1px rgba(var(--sa-primary-bright-rgb), 0.2),
    0 6px 18px rgba(var(--sa-primary-bright-rgb), 0.22);
}

.search-box:focus-within {
  border-color: var(--sa-primary-bright);
  box-shadow:
    0 0 0 3px rgba(var(--sa-primary-bright-rgb), 0.22),
    0 8px 22px rgba(var(--sa-primary-bright-rgb), 0.3);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.35);
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
  background: var(--sa-primary-bright);
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(var(--sa-primary-bright-rgb), 0.45);
  transition: all 0.2s ease;
}

.search-btn:hover {
  background: var(--sa-primary-dark);
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
  box-shadow: 0 6px 16px rgba(var(--sa-primary-rgb), 0.26);
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

.sa-storefront .price,
.price {
  font-size: 16.5px;
  font-weight: 800;
  color: var(--sa-price);
  letter-spacing: -0.2px;
}

.sa-storefront .price.is-sale-price,
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
  box-shadow: 0 3px 8px rgba(var(--sa-primary-rgb), 0.24);
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
  background: var(--sa-primary-bright);
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
  color: var(--sa-primary-hover);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.sa-storefront.theme-dark .card-img-wrap .card-status-pill.available {
  background: rgba(19, 26, 38, 0.88);
  color: var(--sa-primary-light);
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
  .modal-overlay.detail-page-overlay {
    padding: 0;
    background: var(--sa-surface);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    align-items: stretch;
    justify-content: stretch;
  }

  .modal-card.modal-wide.detail-page-card {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    padding: 0;
    margin: 0;
    border-radius: 0;
    border: none;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--sa-surface);
  }

  .detail-page-topbar {
    background: var(--sa-top-header-bg);
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 4px 14px rgba(var(--sa-primary-rgb), 0.16);
    flex-shrink: 0;
    z-index: 10;
  }

  .detail-page-topbar-inner {
    width: 100%;
    margin: 0;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .detail-page-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 13px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    flex-shrink: 0;
  }

  .detail-page-back-btn:hover {
    background: rgba(255, 255, 255, 0.24);
    border-color: rgba(255, 255, 255, 0.45);
    color: #ffffff;
  }

  .detail-page-topbar .detail-bc-link {
    color: rgba(255, 255, 255, 0.84);
  }

  .detail-page-topbar .detail-bc-link:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.16);
  }

  .detail-page-topbar .detail-bc-sep {
    color: rgba(255, 255, 255, 0.6);
  }

  .detail-page-topbar .detail-bc-current {
    color: #ffffff;
  }

  .detail-page-topbar .detail-page-close {
    position: static;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    font-size: 18px;
    flex-shrink: 0;
  }

  .detail-page-topbar .detail-page-close:hover {
    background: rgba(255, 255, 255, 0.26);
    border-color: rgba(255, 255, 255, 0.5);
    color: #ffffff;
  }

  .detail-page-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 32px 36px 56px;
  }

  .modal-card.modal-wide.detail-page-card .modal-content.detail-page-body {
    width: min(1480px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 48px;
    padding: 0;
    align-items: stretch;
  }

  .dp-gallery-card {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: sticky;
    top: 0;
  }

  .dp-hero-frame {
    position: relative;
    isolation: isolate;
    border-radius: 20px;
    background: linear-gradient(135deg, var(--sa-surface-soft) 0%, var(--sa-img-bg) 52%, var(--sa-surface-2) 100%);
    border: 1px solid var(--sa-border);
    height: clamp(360px, 46vh, 430px);
    width: 100%;
    padding: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .dp-hero-frame .modal-img {
    position: relative;
    z-index: 2;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 14px;
    box-shadow:
      0 10px 28px rgba(15, 23, 42, 0.18),
      0 2px 6px rgba(15, 23, 42, 0.08);
    transition: transform 0.28s ease;
  }

  .sa-storefront.theme-dark .dp-hero-frame .modal-img {
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .dp-hero-frame .modal-img:hover {
    transform: scale(1.02);
  }

  .dp-thumbs-rail {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow-x: auto;
    padding: 2px;
    scrollbar-width: thin;
  }

  .dp-info-card {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 2px 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    min-height: 100%;
  }

  .dp-header-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dp-info-card .dp-title {
    font-size: 28px;
    line-height: 1.3;
  }

  .dp-info-card .dp-desc-text {
    font-size: 15px;
    line-height: 1.75;
  }

  .dp-note-divider {
    padding-top: 16px;
    border-top: 1px solid var(--sa-border);
  }

  .dp-info-card .dp-note-input {
    min-height: 76px;
  }

  .dp-action-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dp-related-section {
    width: min(1480px, 100%);
    margin: 44px auto 0;
    padding-top: 28px;
    border-top: 1px solid var(--sa-border);
  }
}

@media (min-width: 769px) and (max-width: 1080px) {
  .dp-related-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* SHARED MINIMAL DETAIL PAGE ELEMENTS */
.dp-thumb {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--sa-img-bg);
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.65;
  transition: all 0.16s ease;
}

.dp-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dp-thumb:hover {
  opacity: 1;
}

.dp-thumb.active {
  opacity: 1;
  border-color: var(--sa-accent);
}

.dp-zoom-pill {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  border: none;
  background: rgba(15, 23, 42, 0.56);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  z-index: 2;
  transition: background 0.15s ease;
}

.dp-zoom-pill:hover {
  background: rgba(15, 23, 42, 0.76);
}

.dp-nav-btn {
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
  cursor: pointer;
  z-index: 2;
  transition: all 0.16s ease;
}

.dp-nav-btn.prev { left: 12px; }
.dp-nav-btn.next { right: 12px; }

.dp-nav-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
}

.dp-meta-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--sa-muted);
}

.dp-meta-link {
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--sa-accent);
  cursor: pointer;
}

.dp-meta-link:hover {
  text-decoration: underline;
}

.dp-meta-sep {
  opacity: 0.5;
}

.dp-meta-text {
  font-weight: 500;
  color: var(--sa-muted);
}

.dp-out-text {
  font-weight: 700;
  color: var(--sa-sale);
}

.dp-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.025em;
  color: var(--sa-heading);
}

.dp-title.is-mobile {
  font-size: 22px;
}

.dp-price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.dp-price-current {
  font-size: 26px;
  font-weight: 800;
  color: var(--sa-price);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.dp-price-current.is-sale {
  color: var(--sa-sale);
}

.dp-price-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--sa-muted);
}

.dp-price-old {
  font-size: 15px;
  color: var(--sa-muted);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
  margin-left: 4px;
}

.dp-desc-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--sa-muted);
  white-space: pre-line;
}

.dp-controls-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
  margin-top: 4px;
  border-top: 1px solid var(--sa-border);
}

.dp-qty-line {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dp-stepper {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  gap: 8px;
  width: fit-content;
}

.dp-stepper button {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.15s ease, transform 0.12s ease;
}

.dp-stepper button.dp-qty-minus:hover {
  background: var(--sa-border-strong);
}

.dp-stepper button.dp-qty-plus {
  background: var(--sa-accent);
  color: #ffffff;
}

.dp-stepper button.dp-qty-plus:hover {
  background: var(--sa-accent-hover);
  color: #ffffff;
}

.dp-stepper button:active {
  transform: scale(0.94);
}

.dp-stepper input {
  width: 34px;
  text-align: center;
  border: none;
  background: transparent;
  color: var(--sa-heading);
  font-size: 15px;
  font-weight: 700;
  outline: none;
}

.dp-note-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dp-note-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--sa-muted);
}

.dp-note-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--sa-input-border);
  background: var(--sa-input-bg);
  color: var(--sa-text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.45;
  resize: vertical;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.dp-note-input:focus {
  outline: none;
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(var(--sa-primary-bright-rgb), 0.12);
}

.dp-cta-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
  font-size: 15px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.16s ease, transform 0.14s ease;
}

.dp-cta-btn:hover:not(:disabled) {
  background: var(--sa-accent-hover);
}

.dp-cta-btn:active:not(:disabled) {
  transform: scale(0.985);
}

.dp-cta-btn:disabled {
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  cursor: not-allowed;
}

.dp-cta-dot {
  opacity: 0.7;
}

.dp-related-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: var(--sa-heading);
}

.dp-related-heading i {
  color: var(--sa-accent);
}

.dp-related-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.dp-related-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.dp-related-card:hover {
  transform: translateY(-2px);
  border-color: var(--sa-accent);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.dp-rel-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  background: var(--sa-img-bg);
  overflow: hidden;
  margin-bottom: 8px;
}

.dp-rel-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dp-rel-thumb-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sa-muted);
  font-size: 22px;
}

.dp-rel-sale {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--sa-sale);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
}

.dp-rel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dp-rel-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-heading);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}

.dp-rel-price {
  font-size: 13px;
  font-weight: 800;
  color: var(--sa-price);
}

.detail-meta-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.detail-breadcrumb-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  background: var(--sa-surface-2, #f8fafc);
  border-bottom: 1px solid var(--sa-border);
}

.detail-breadcrumb-bar.is-desktop {
  flex: 1;
  background: transparent;
  border-bottom: none;
  padding: 0;
  font-size: 13.5px;
}

.detail-bc-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--sa-muted);
  font-size: inherit;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.detail-bc-link:hover {
  color: var(--sa-accent);
  background: rgba(var(--sa-primary-rgb), 0.08);
}

.detail-bc-sep {
  color: var(--sa-muted);
  font-size: 14px;
  opacity: 0.7;
}

.detail-bc-current {
  color: var(--sa-heading);
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 360px;
}

/* 2-LEVEL SUB-CATEGORY BARS */
.sct-subcat-bar {
  width: 100%;
  background: transparent;
}

.sct-subcat-inner {
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
  padding: 2px 28px 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.sct-subcat-parent-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sa-accent);
  white-space: nowrap;
  flex-shrink: 0;
}

.sct-subcat-scroll {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  overflow: visible;
}

.sct-cat-pill.is-sub-pill {
  height: auto;
  min-height: 30px;
  max-width: 100%;
  white-space: normal;
  text-align: left;
  font-size: 12.5px;
  padding: 5px 12px;
}

.mobile-cat-strip.is-sub-strip {
  flex-wrap: wrap;
  overflow-x: visible;
  gap: 6px;
  padding: 2px 0 10px;
}

.cat-group-wrap {
  display: flex;
  flex-direction: column;
}

.cat.cat-tree-parent {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cat-label-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-chevron-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2, rgba(15, 23, 42, 0.05));
  color: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.cat-sub-count {
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.85;
}

.sct-parent-groups-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--sa-border);
}

.sct-parent-group-card {
  padding: 10px;
  border-radius: 12px;
  background: var(--sa-surface-soft, rgba(15, 23, 42, 0.03));
  border: 1px solid var(--sa-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sct-parent-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sct-parent-head-pill {
  font-weight: 800;
}

.sct-parent-subcount {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  color: var(--sa-muted);
}

.menu-group-heading {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 14px;
  margin-top: 4px;
  border-radius: 12px;
  background: var(--sa-surface-soft, rgba(var(--sa-primary-bright-rgb), 0.08));
  border: 1px solid var(--sa-border-green, rgba(var(--sa-primary-bright-rgb), 0.28));
  color: var(--sa-accent, var(--sa-primary));
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.14s ease, border-color 0.14s ease;
}

.menu-group-heading:hover {
  border-color: var(--sa-accent, var(--sa-primary));
}

.mgh-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.mgh-action {
  font-size: 16px;
  opacity: 0.8;
}

/* Linked Product Variant Switcher inside Detail Modal */
.dp-variant-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ===== TOPPING / ADD-ON PICKER INSIDE DETAIL MODAL ===== */
.dp-topping-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
}

.dp-topping-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dp-topping-sel-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sa-primary-soft);
  color: var(--sa-accent);
  border: 1px solid var(--sa-border-green);
}

.dp-topping-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.dp-topping-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1.5px solid var(--sa-border, #e2e8f0);
  background: var(--sa-surface-2, #f8fafc);
  cursor: pointer;
  user-select: none;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.12s ease;
}

.dp-topping-item:active:not(.is-out) {
  transform: scale(0.985);
}

.dp-topping-item.active {
  border-color: var(--sa-accent);
  background: var(--sa-primary-soft);
}

.dp-topping-item.is-out {
  opacity: 0.55;
  cursor: not-allowed;
}

.dpt-check {
  font-size: 20px;
  line-height: 1;
  color: var(--sa-muted);
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.dp-topping-item.active .dpt-check {
  color: var(--sa-accent);
}

.dpt-thumb {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
}

.dpt-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dpt-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--sa-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dpt-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-price);
}

.dpt-out-txt {
  color: var(--sa-sale);
}

.dpt-stepper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 999px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border-green);
  flex-shrink: 0;
}

.dpt-step-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--sa-primary-soft);
  color: var(--sa-accent);
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dpt-step-btn:hover {
  background: var(--sa-accent);
  color: var(--sa-on-primary, #ffffff);
}

.dpt-step-val {
  min-width: 16px;
  text-align: center;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--sa-heading);
}

.dp-variant-label {
  font-size: 12.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--sa-muted, #64748b);
}

.dp-variant-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dp-variant-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border-radius: 12px;
  border: 1.5px solid var(--sa-border, #cbd5e1);
  background: var(--sa-surface-2, #f8fafc);
  color: var(--sa-heading, #0f172a);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.dp-variant-pill:hover {
  border-color: var(--sa-accent, var(--sa-primary-bright));
}

.dp-variant-pill.active {
  background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary));
  border-color: var(--sa-primary);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(var(--sa-primary-bright-rgb), 0.28);
}

.dp-variant-pill.is-out {
  opacity: 0.6;
}

.dvp-price {
  font-size: 12px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.sa-storefront.theme-dark .dvp-price {
  background: rgba(255, 255, 255, 0.12);
}

.dp-variant-pill.active .dvp-price {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.cat.is-parent-active {
  border-color: var(--sa-accent);
  color: var(--sa-accent);
  font-weight: 700;
}

.sub-cat-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0 8px 14px;
  margin-left: 10px;
  border-left: 2px solid var(--sa-border);
}

.sub-cat-tree.is-modal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  margin-left: 0;
  border-left: none;
  background: var(--sa-surface-2, #f8fafc);
  border-radius: 10px;
}

.sub-cat-tree-item {
  text-align: left;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--sa-text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sub-cat-tree.is-modal .sub-cat-tree-item {
  border-color: var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-text);
  border-radius: 999px;
  padding: 5px 12px;
}

.sub-cat-tree-item.active,
.sub-cat-tree.is-modal .sub-cat-tree-item.active {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  font-weight: 700;
}

.sct-all-subcats-section {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--sa-border);
}

.sct-all-cats-header.is-sub {
  margin-bottom: 8px;
  font-size: 12.5px;
  color: var(--sa-accent);
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

.sa-storefront .price .unit,
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
.cart-summary-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 2px 0 4px;
  background: transparent;
  border: none;
  border-radius: 0;
}

.cart-summary-divider {
  border-top: 1px dashed var(--sa-border);
  margin: 2px 0;
}

.cart-total {
  flex: 1;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  background: transparent;
  border: none;
  border-radius: 0;
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
  box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.12);
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
  color: var(--sa-secondary-dark);
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
  box-shadow: 0 3px 8px rgba(var(--sa-primary-rgb), 0.24);
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
  scrollbar-color: var(--sa-primary-bright) transparent;  /* thumb | track */
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
    var(--sa-primary-bright),
    var(--sa-primary-bright)
  );
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.6); /* viền sáng nhẹ */
}
.categories::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    var(--sa-primary-bright),
    var(--sa-primary-dark)
  );
}

.categories::-webkit-scrollbar-thumb {
  opacity: 0.6;
}

.categories:hover::-webkit-scrollbar-thumb {
  opacity: 1;
}

.categories h4 {
  color: var(--sa-primary-hover);
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
  color: var(--sa-primary-hover);
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
  color: var(--sa-primary-hover);
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
    var(--sa-primary-bright),
    var(--sa-primary-bright)
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
  background: var(--sa-secondary-light);
}
@media (min-width: 769px) {
  .sidebar-left .categories {
    padding: 16px;
    background: linear-gradient(145deg, #f8fafc 0%, #ffffff 55%, #e6f7ed 100%);
    border: 1px solid rgba(var(--sa-primary-dark-rgb), 0.12);
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
    color: var(--sa-primary-dark);
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
    color: var(--sa-primary-dark);
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
    border-color: rgba(var(--sa-primary-bright-rgb), 0.25);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
    background: #f7fff9;
  }

  .sidebar-left .categories .cat::before {
    left: 14px;
    width: 10px;
    height: 10px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary-bright));
    box-shadow:
      0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.2),
      0 6px 12px rgba(var(--sa-primary-bright-rgb), 0.25);
    animation: catPulse 1.2s ease-in-out infinite;
  }

  .sidebar-left .categories .cat.active {
    border-color: transparent;
    background: linear-gradient(135deg, var(--sa-primary-bright), #0f9f58);
    color: #ffffff;
    box-shadow: 0 14px 30px rgba(var(--sa-primary-bright-rgb), 0.35);
  }

  .sidebar-left .categories .cat.active::before {
    background: var(--sa-secondary-light);
    box-shadow:
      0 0 0 3px rgba(var(--sa-secondary-light-rgb), 0.6),
      0 10px 18px rgba(15, 23, 42, 0.15);
    animation: catPulseActive 0.9s ease-in-out infinite;
  }
}
@keyframes catPulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--sa-primary-bright-rgb), 0.6), 0 0 8px rgba(var(--sa-primary-bright-rgb), 0.25); }
  45% { box-shadow: 0 0 0 6px rgba(var(--sa-primary-bright-rgb), 0.35), 0 0 12px rgba(var(--sa-primary-bright-rgb), 0.35); }
  80% { box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.25), 0 0 6px rgba(var(--sa-primary-bright-rgb), 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(var(--sa-primary-bright-rgb), 0), 0 0 0 rgba(var(--sa-primary-bright-rgb), 0); }
}

@keyframes catPulseActive {
  0% { box-shadow: 0 0 0 0 rgba(var(--sa-secondary-light-rgb), 0.8), 0 0 10px rgba(var(--sa-secondary-light-rgb), 0.55); }
  40% { box-shadow: 0 0 0 7px rgba(var(--sa-secondary-light-rgb), 0.55), 0 0 14px rgba(var(--sa-secondary-light-rgb), 0.4); }
  75% { box-shadow: 0 0 0 10px rgba(var(--sa-secondary-light-rgb), 0.35), 0 0 10px rgba(var(--sa-secondary-light-rgb), 0.2); }
  100% { box-shadow: 0 0 0 0 rgba(var(--sa-secondary-light-rgb), 0), 0 0 0 rgba(var(--sa-secondary-light-rgb), 0); }
}

/* =========================================================
   NOTICE BAR (PA1 — EMERALD PILL + GOLD BADGE + SEAMLESS TICKER)
   ========================================================= */
.notice-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  margin: 0 0 10px;
  padding: 5px 12px 5px 6px;
  border-radius: 12px;
  background: var(--sa-notice-bg);
  border: 1px solid var(--sa-notice-border);
  box-shadow: 0 3px 12px rgba(var(--sa-primary-rgb), 0.08);
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.sa-storefront.theme-dark .notice-bar {
  box-shadow: 0 4px 16px rgba(2, 6, 23, 0.36);
}

.notice-bar.is-marquee {
  cursor: pointer;
}

.notice-bar.is-marquee.is-paused {
  border-color: var(--sa-accent);
}

.notice-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--sa-secondary-light) 0%, var(--sa-secondary-bright) 100%);
  border: 1px solid var(--sa-secondary-mid);
  color: var(--sa-primary-deep);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.35px;
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(var(--sa-secondary-mid-rgb), 0.2);
}

.sa-storefront.theme-dark .notice-badge {
  background: linear-gradient(135deg, var(--sa-secondary) 0%, var(--sa-secondary-mid) 100%);
  border-color: var(--sa-secondary-bright);
  color: var(--sa-primary-deepest);
}

.notice-badge-ico {
  font-size: 13.5px;
  color: var(--sa-primary);
  line-height: 1;
}

.sa-storefront.theme-dark .notice-badge-ico {
  color: var(--sa-primary-deepest);
}

.notice-marquee {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.notice-bar.is-marquee .notice-marquee {
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 10px, #000 calc(100% - 18px), transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, #000 10px, #000 calc(100% - 18px), transparent 100%);
}

.notice-track {
  display: inline-flex;
  align-items: center;
  width: max-content;
  will-change: transform;
}

.notice-bar.is-marquee .notice-track {
  animation: notice-ticker var(--notice-duration, 12s) linear infinite;
}

.notice-bar.is-marquee:hover .notice-track,
.notice-bar.is-marquee.is-paused .notice-track {
  animation-play-state: paused;
}

.notice-item {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.notice-bar.is-marquee .notice-item {
  gap: 22px;
  padding-right: 22px;
}

.notice-text {
  display: inline-block;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.1px;
  color: var(--sa-notice-text);
}

.notice-sep {
  font-size: 13px;
  font-weight: 800;
  color: var(--sa-primary);
  opacity: 0.72;
}

.sa-storefront.theme-dark .notice-sep {
  color: var(--sa-primary-light);
}

@keyframes notice-ticker {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
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
  color: var(--sa-on-accent, #ffffff);
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(var(--sa-primary-rgb), 0.2);
  transition: background-color 0.16s ease, transform 0.12s ease, box-shadow 0.16s ease;
  animation: none !important;
}

.finish-btn:hover:not(:disabled) {
  background: var(--sa-accent-hover);
  color: var(--sa-on-accent, #ffffff);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(var(--sa-primary-rgb), 0.28);
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
  box-shadow: 0 4px 12px rgba(var(--sa-primary-rgb), 0.22);
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
  background: var(--sa-primary-hover);
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
  right: calc(var(--pc-sidebar-w, clamp(336px, 24.5vw, 368px)) + 26px);
  bottom: 24px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--sa-secondary-mid), var(--sa-secondary-mid));
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1200;
  box-shadow: 0 8px 22px rgba(var(--sa-secondary-mid-rgb), 0.36);
  transition: all 0.2s ease;
}

.sa-storefront:has(.layout.is-resizing-sidebar) .scroll-top-fab {
  transition: none !important;
}

/* ===== CARD IMAGE (AMBIENT FROSTED GLASS STAGE) ===== */
.card-img-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 9px;
  background: linear-gradient(135deg, var(--sa-surface-soft) 0%, var(--sa-img-bg) 52%, var(--sa-surface-2) 100%);
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid var(--sa-border);
  transition: background-color 0.22s ease;
}

/* Layer 1: Ambient blurred color glow reflected from the dish photo itself */
.card-img-wrap.has-ambient::before,
.dp-hero-frame.has-ambient::before,
.dp-mob-hero.has-ambient::before {
  content: '';
  position: absolute;
  inset: -12%;
  z-index: 0;
  pointer-events: none;
  background-image: var(--sa-ambient-img);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(13px) saturate(1.32);
  transform: scale(1.08);
  opacity: 0.62;
  transition: opacity 0.28s ease, transform 0.35s ease;
}

.sa-storefront.theme-dark .card-img-wrap.has-ambient::before,
.sa-storefront.theme-dark .dp-hero-frame.has-ambient::before,
.sa-storefront.theme-dark .dp-mob-hero.has-ambient::before {
  opacity: 0.5;
  filter: blur(15px) saturate(1.38) brightness(0.82);
}

/* Layer 2: Frosted crystal glass sheen & specular inner border */
.card-img-wrap::after,
.dp-hero-frame::after,
.dp-mob-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.68) 0%, transparent 54%),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.48) 0%,
      rgba(255, 255, 255, 0.16) 50%,
      rgba(255, 255, 255, 0.36) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    inset 0 -1px 0 rgba(15, 23, 42, 0.05);
}

.sa-storefront.theme-dark .card-img-wrap::after,
.sa-storefront.theme-dark .dp-hero-frame::after,
.sa-storefront.theme-dark .dp-mob-hero::after {
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.14) 0%, transparent 50%),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(15, 23, 42, 0.28) 52%,
      rgba(15, 23, 42, 0.48) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.34);
}

/* Layer 3: Crisp dish image floating above frosted glass */
.card-img-wrap img {
  position: relative;
  z-index: 2;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  padding: 0;
  border-radius: 10px;
  box-shadow:
    0 6px 18px rgba(15, 23, 42, 0.14),
    0 1px 3px rgba(15, 23, 42, 0.08);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease;
}

.sa-storefront.theme-dark .card-img-wrap img {
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.44),
    0 0 0 1px rgba(255, 255, 255, 0.09);
}

.card:hover .card-img-wrap img {
  transform: scale(1.045);
}

.card:hover .card-img-wrap.has-ambient::before {
  transform: scale(1.14);
  opacity: 0.72;
}

.sa-storefront.theme-dark .card:hover .card-img-wrap.has-ambient::before {
  opacity: 0.58;
}

.card-img-name-fallback {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  padding: 28px 12px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 10px;
  background: linear-gradient(145deg, var(--sa-img-bg) 0%, var(--sa-surface-2) 100%);
}

.card-img-name-fallback span {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  color: var(--sa-heading);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.dp-img-name-fallback {
  border-radius: 12px;
  padding: 24px 20px;
}

.dp-mob-hero .dp-img-name-fallback {
  height: 260px;
}

.dp-img-name-fallback span {
  font-size: 20px;
  -webkit-line-clamp: 4;
  line-clamp: 4;
}

.scroll-top-fab:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, var(--sa-secondary-dark), var(--sa-secondary-mid));
  color: #ffffff;
  box-shadow: 0 10px 26px rgba(var(--sa-secondary-mid-rgb), 0.45);
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
  box-shadow: 0 2px 8px rgba(var(--sa-primary-rgb), 0.2);
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
    min-height: 36px;
    gap: 8px;
    padding: 4px 10px 4px 5px;
    border-radius: 11px;
    margin-bottom: 8px;
  }

  .notice-badge {
    width: 26px;
    height: 26px;
    padding: 0;
    justify-content: center;
    border-radius: 8px;
  }

  .notice-badge-text {
    display: none;
  }

  .notice-badge-ico {
    font-size: 14px;
  }

  .notice-text {
    font-size: 13.5px;
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
    bottom: calc(146px + env(safe-area-inset-bottom)) !important;
    width: 44px;
    height: 44px;
    z-index: 1150;
    background: linear-gradient(135deg, var(--sa-secondary-mid), var(--sa-secondary-mid));
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 8px 22px rgba(var(--sa-secondary-mid-rgb), 0.38);
    transition: bottom 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease, transform 0.2s ease;
  }

  .scroll-top-fab.is-dock-hidden {
    bottom: calc(78px + env(safe-area-inset-bottom)) !important;
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
    z-index: 2098;
  }

  .mobile-sheet-backdrop.is-detail {
    z-index: 1998;
  }

  .modal-overlay:not(.image-modal):not(.full-cart-overlay):not(.export-modal-overlay):not(.is-center-dialog) {
    align-items: flex-end;
    justify-content: center;
    padding: max(56px, calc(env(safe-area-inset-top, 0px) + 16px)) 0 0;
  }

  .modal-overlay.is-center-dialog {
    align-items: center;
    justify-content: center;
    padding:
      max(56px, calc(env(safe-area-inset-top, 0px) + 16px))
      16px
      max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px));
  }

  .modal-overlay.is-center-dialog .modal-card {
    width: min(100%, 420px) !important;
    max-width: 100% !important;
    max-height: calc(
      100dvh
      - max(56px, calc(env(safe-area-inset-top, 0px) + 16px))
      - max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))
    ) !important;
    border-radius: 22px !important;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .modal-overlay.image-modal {
    padding:
      max(56px, calc(env(safe-area-inset-top, 0px) + 16px))
      12px
      max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px));
  }

  .modal-overlay.image-modal .image-modal-card {
    max-height: calc(
      100dvh
      - max(56px, calc(env(safe-area-inset-top, 0px) + 16px))
      - max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))
    );
  }

  .modal-overlay:not(.image-modal):not(.full-cart-overlay):not(.export-modal-overlay):not(.is-center-dialog) .modal-card {
    position: relative;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    border-radius: 22px 22px 0 0 !important;
    padding-top: 22px;
    padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: 0 -10px 36px rgba(15, 23, 42, 0.28);
  }

  .modal-overlay:not(.image-modal):not(.full-cart-overlay):not(.export-modal-overlay):not(.is-center-dialog) .modal-card::before {
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
    color: var(--sa-primary-dark);
    font-weight: 900;
  }

  .modal-card .modal-categories {
    background: linear-gradient(145deg, #f8fafc 0%, #ffffff 55%, #ecfdf3 100%);
    border: 1px solid rgba(var(--sa-primary-dark-rgb), 0.12);
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
    color: var(--sa-primary-dark);
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
    background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary-bright));
    box-shadow:
      0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.2),
      0 6px 12px rgba(var(--sa-primary-bright-rgb), 0.25);
    animation: catPulse 1.2s ease-in-out infinite;
  }

  .modal-card .modal-categories .cat.active {
    border-color: transparent;
    background: linear-gradient(135deg, var(--sa-primary-bright), #0f9f58);
    color: #ffffff;
    box-shadow: 0 14px 30px rgba(var(--sa-primary-bright-rgb), 0.35);
  }

  .modal-card .modal-categories .cat.active::before {
    background: var(--sa-secondary-light);
    box-shadow:
      0 0 0 3px rgba(var(--sa-secondary-light-rgb), 0.6),
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
    color: var(--sa-primary-dark);
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
    color: #ffffff;
  }

  .modal-card .modal-categories .cat.sale .cat-label {
    color: #ffffff;
  }
  
  /* === HEADER (TIÊU ĐỀ BOTTOM SHEET) === */
  .modal-card .export-title {
    background: transparent;
    color: var(--sa-primary-bright);
    font-weight: 900;
    padding: 4px 38px 12px;
    margin: 0 0 12px 0;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--sa-border);
  }

  .sa-storefront.theme-dark .modal-card .export-title {
    color: var(--sa-primary-light);
  }

  /* header chọn danh mục: chữ xanh đậm */
  .modal-card .export-title.category-modal-title {
    color: var(--sa-primary-dark);
    font-weight: 900;
  }

  .sa-storefront.theme-dark .modal-card .export-title.category-modal-title {
    color: var(--sa-heading);
  }

  /* nút đóng (X) */
  .modal-card .modal-close {
    top: 16px;
    right: 14px;
    background: var(--sa-primary-bright);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  /* === BOTTOM SHEET THÔNG TIN HỖ TRỢ (MOBILE) === */
  .modal-card.contact-support-sheet {
    padding: 22px 16px calc(20px + env(safe-area-inset-bottom, 0px)) !important;
  }

  .modal-card.contact-support-sheet .export-title {
    margin: 2px 0 16px 0;
    padding: 2px 40px 12px;
    font-size: 16.5px;
    letter-spacing: 0.02em;
    border-bottom: 1px solid var(--sa-border);
  }

  .modal-card.contact-support-sheet .mobile-checkscam-group {
    margin-top: 0;
    margin-bottom: 14px;
    padding: 0 0 14px;
    gap: 8px;
  }

  /* === PHẦN CONTENT LIÊN HỆ (NỀN XANH THƯƠNG HIỆU, BO GỌN) === */
  .modal-card .shop-contact {
    background: var(--sa-top-header-bg);
    padding: 14px 12px;
    margin: 0;
    border-radius: 16px;
    box-shadow: 0 8px 22px rgba(var(--sa-primary-rgb), 0.18);
  }

  /* từng item liên hệ */
  .modal-card .shop-contact .contact-item {
    background: rgba(255, 255, 255, 0.13);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 14px;
    padding: 10px 12px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .modal-card .shop-contact .contact-item:last-child {
    margin-bottom: 0;
  }

  /* text */
  .modal-card .shop-contact .contact-name {
    color: var(--sa-secondary-light);
    font-weight: 900;
  }

  .modal-card .shop-contact .contact-desc {
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    font-style: italic;
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
  border: 2px solid var(--sa-primary-bright);

  background: #ffffff;
  color: var(--sa-primary-bright);

  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.3px;

  cursor: pointer;

  transition: all 0.2s ease;
}

/* hover */
.back-btn:hover {
  background: var(--sa-primary-soft);
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

  background: linear-gradient(180deg, #fff9cc 0%, var(--sa-secondary) 100%);
  color: var(--sa-primary-dark);
  box-shadow: 0 4px 10px rgba(var(--sa-secondary-rgb), 0.45);
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
    0 0 0 8px rgba(var(--sa-secondary-rgb), 0.12),
    0 0 0 12px rgba(var(--sa-secondary-rgb), 0.08),
    0 0 0 4px rgba(var(--sa-secondary-rgb), 0.18),
    0 2px 6px rgba(var(--sa-secondary-rgb), 0.35),
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

  background: var(--sa-primary-bright);
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
  /* Overridden by .dp-mob-hero::after ambient glass layer */
}

.dp-zoom-pill,
.dp-nav-btn,
.discount-tag {
  z-index: 3;
}

/* ================= MOBILE CART BAR ================= */
.mobile-cart-bar {
  position: fixed;
  bottom: calc(82px + env(safe-area-inset-bottom));
  left: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  z-index: 1200;
  transition: bottom 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-cart-bar.is-dock-hidden {
  bottom: calc(12px + env(safe-area-inset-bottom));
}

.mcb-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mcb-promo-strip {
  background: var(--sa-surface);
  border: 1px solid rgba(var(--sa-primary-bright-rgb), 0.36);
  border-radius: 11px;
  padding: 6px 10px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14);
  cursor: pointer;
}

.mcb-promo-strip.unlocked {
  background: var(--sa-primary-soft);
  border-color: var(--sa-primary-bright);
}

.mcb-promo-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-primary-dark);
  line-height: 1.35;
}

.mcb-promo-text i {
  font-size: 14px;
  color: var(--sa-primary);
  flex-shrink: 0;
}

.mcb-promo-bar {
  margin-top: 5px;
  height: 4px;
  width: 100%;
  border-radius: 999px;
  background: rgba(var(--sa-primary-bright-rgb), 0.16);
  overflow: hidden;
}

.mcb-promo-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--sa-primary-bright) 0%, var(--sa-primary) 100%);
  transition: width 0.3s ease;
}

.cart-bar-pill-left {
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--sa-primary-deepest) 0%, var(--sa-primary-dark) 58%, var(--sa-primary-hover) 100%);
  border: 1.5px solid rgba(163, 230, 53, 0.72);
  border-radius: 13px;
  box-shadow: 0 6px 18px rgba(var(--sa-primary-deep-rgb), 0.34);
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.cart-bar-pill-left:active {
  transform: scale(0.94);
  background: linear-gradient(135deg, var(--sa-primary-deepest) 0%, var(--sa-primary-deep) 100%);
}

.cart-bar-icon {
  font-size: 22px;
  color: #bef264;
  text-shadow: 0 1px 3px rgba(2, 44, 34, 0.45);
}

.cart-bar-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid var(--sa-secondary-light);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.24);
}

.cart-bar-pill-right {
  flex: 1;
  min-width: 0;
  height: 46px;
  padding: 0 8px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: linear-gradient(128deg, var(--sa-secondary-light) 0%, var(--sa-secondary-bright) 38%, var(--sa-secondary-mid) 78%, #ea580c 100%);
  border: 1.5px solid rgba(101, 163, 13, 0.72);
  border-radius: 13px;
  box-shadow:
    0 8px 22px rgba(234, 88, 12, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.cart-bar-pill-right:active {
  transform: scale(0.98);
  filter: brightness(0.95);
}

.cart-bar-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 800;
  color: var(--sa-primary-deepest);
  text-transform: none;
  letter-spacing: 0.2px;
}

.cart-bar-total {
  flex-shrink: 0;
  white-space: nowrap;
  padding: 5px 11px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--sa-primary-deepest) 0%, var(--sa-primary-dark) 65%, var(--sa-primary-dark) 100%);
  border: 1.5px solid #a3e635;
  font-size: 14px;
  font-weight: 800;
  color: var(--sa-secondary-bright);
  box-shadow: 0 2px 8px rgba(2, 44, 34, 0.26);
}

.sa-storefront.theme-dark .cart-bar-pill-left {
  background: linear-gradient(135deg, var(--sa-primary-deep) 0%, var(--sa-primary-dark) 58%, var(--sa-primary-hover) 100%);
  border-color: rgba(163, 230, 53, 0.8);
  box-shadow: 0 8px 22px rgba(var(--sa-primary-rgb), 0.28);
}

.sa-storefront.theme-dark .cart-bar-badge {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #ffffff;
  border-color: var(--sa-secondary-bright);
}

.sa-storefront.theme-dark .cart-bar-pill-right {
  background: linear-gradient(128deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 40%, var(--sa-secondary-mid) 78%, #ea580c 100%);
  border-color: rgba(var(--sa-secondary-light-rgb), 0.72);
  box-shadow:
    0 8px 24px rgba(var(--sa-secondary-mid-rgb), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.52);
}

.sa-storefront.theme-dark .cart-bar-total {
  background: linear-gradient(135deg, var(--sa-primary-deepest) 0%, var(--sa-primary-deep) 65%, var(--sa-primary-dark) 100%);
  border-color: #a3e635;
  color: var(--sa-secondary-bright);
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
  background: var(--sa-primary-bright);
  border: 2px solid var(--sa-surface);
  box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.25);
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
  position: relative;
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

.mcb-edit-btn.has-added-badge {
  border-color: rgba(239, 68, 68, 0.45);
  color: #dc2626;
}

.mcb-edit-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  line-height: 17px;
  text-align: center;
  border: 1.5px solid var(--sa-surface);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.45);
  pointer-events: none;
  z-index: 2;
  transition: transform 0.16s ease;
}

.mcb-edit-badge.bump {
  transform: scale(1.22);
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
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.55);
}
.mcb-tracker-pill.is-pending .mcb-tracker-ico {
  background: rgba(var(--sa-secondary-mid-rgb), 0.14);
  color: var(--sa-secondary-dark);
}
.mcb-tracker-pill.is-pending .mcb-live-dot {
  background: var(--sa-secondary-mid);
  box-shadow: 0 0 0 2px rgba(var(--sa-secondary-mid-rgb), 0.25);
}
.mcb-tracker-pill.is-pending .mcb-action-cta,
.mcb-tracker-pill.is-pending .mcb-tracker-rail-fill {
  background: var(--sa-secondary-dark);
}

.mcb-tracker-pill .mcb-action-cta.is-update-red {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: #ffffff;
  gap: 4px;
  padding: 0 11px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.36);
}

.mcb-tracker-pill .mcb-action-cta.is-update-red:active {
  background: #b91c1c !important;
  transform: scale(0.96);
}

.mcb-tracker-pill.is-approved {
  border-color: rgba(var(--sa-primary-bright-rgb), 0.55);
}
.mcb-tracker-pill.is-approved .mcb-tracker-ico {
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  color: var(--sa-primary);
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
  border-color: rgba(var(--sa-primary-bright-rgb), 0.55);
}
.mcb-tracker-pill.is-completed .mcb-tracker-ico {
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  color: var(--sa-primary-hover);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  color: var(--sa-primary);
}

.sa-storefront.theme-dark .mcb-tracker-pill {
  background: var(--sa-surface);
  box-shadow: 0 10px 26px rgba(2, 6, 23, 0.5);
}
.sa-storefront.theme-dark .mcb-tracker-pill.is-pending .mcb-tracker-ico {
  color: var(--sa-secondary-mid);
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

/* ================= MOBILE BOTTOM BAR – LIQUID GLASS DOCK ================= */
.mobile-bottom-bar {
  position: fixed;
  bottom: calc(10px + env(safe-area-inset-bottom));
  left: 10px;
  right: 10px;
  max-width: 520px;
  margin: 0 auto;
  height: 62px;
  padding: 0 8px;
  border-radius: 999px;
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.56) 0%,
    rgba(241, 245, 249, 0.28) 55%,
    rgba(255, 255, 255, 0.44) 100%
  );
  backdrop-filter: blur(26px) saturate(195%) brightness(1.06);
  -webkit-backdrop-filter: blur(26px) saturate(195%) brightness(1.06);
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 14px 36px rgba(15, 23, 42, 0.16),
    0 4px 12px rgba(15, 23, 42, 0.08),
    inset 0 1.5px 1px rgba(255, 255, 255, 0.92),
    inset 0 -1.5px 2px rgba(148, 163, 184, 0.25);
  z-index: 1100;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
  will-change: transform, opacity;
}

.mobile-bottom-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(255, 255, 255, 0.06) 44%,
    rgba(255, 255, 255, 0.14) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.mobile-bottom-bar.is-dock-hidden {
  transform: translateY(calc(100% + 28px));
  opacity: 0;
  pointer-events: none;
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
  z-index: 1;
}

.mobile-bottom-bar button::before {
  content: '';
  position: absolute;
  inset: 5px 2px;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.82) 0%,
    rgba(240, 253, 244, 0.56) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  opacity: 0;
  transform: scale(0.94);
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 0;
}

.mobile-bottom-bar button.active::before {
  opacity: 1;
  transform: scale(1);
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
  color: #0f172a;
  transition: color 0.18s ease, transform 0.18s ease;
  animation: none;
}

.mobile-bottom-bar button i.dock-accent-ico {
  color: var(--sa-primary-dark);
}

.mobile-bottom-bar .btn-label {
  font-size: 9.5px;
  margin-top: 2px;
  color: #1e293b;
  transition: color 0.18s ease;
  font-weight: 700;
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
  background: var(--sa-primary-bright);
  border: 1.5px solid var(--sa-surface);
  box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.22);
}

.mobile-bottom-bar .progress-live-dot.paused {
  background: #64748b;
  box-shadow: none;
}

.mobile-bottom-bar button.active i,
.mobile-bottom-bar button.active i.dock-accent-ico,
.mobile-bottom-bar button.active .btn-label {
  color: var(--sa-primary-hover);
  font-weight: 800;
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
    --sa-mob-sheet-top: 0px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
    box-shadow: none;
    background: var(--sa-surface);
    color: var(--sa-text);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
  }

  .detail-header.dp-mob-header {
    height: auto;
    min-height: calc(48px + max(52px, calc(env(safe-area-inset-top, 0px) + 8px)));
    padding: max(52px, calc(env(safe-area-inset-top, 0px) + 8px)) 12px 12px;
    background: var(--sa-top-header-bg);
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 4px 14px rgba(var(--sa-primary-rgb), 0.18);
    border-radius: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 10;
    justify-content: flex-start;
    flex-shrink: 0;
  }

  .detail-back.dp-mob-back {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.28);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .detail-title.dp-mob-title {
    flex: 1;
    min-width: 0;
    color: #ffffff;
    font-family: inherit;
    font-weight: 700;
    font-size: 15px;
    text-transform: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dp-mob-scroll {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--sa-surface);
  }

  .dp-mob-gallery {
    background: var(--sa-surface);
    padding: 12px 14px 4px;
  }

  .dp-mob-hero {
    position: relative;
    isolation: isolate;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--sa-surface-soft) 0%, var(--sa-img-bg) 52%, var(--sa-surface-2) 100%);
    border: 1px solid var(--sa-border);
    padding: 10px;
    overflow: hidden;
  }

  .detail-img {
    position: relative;
    z-index: 2;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 260px;
    object-fit: contain;
    display: block;
    border-radius: 12px;
    box-shadow:
      0 8px 22px rgba(15, 23, 42, 0.16),
      0 1px 4px rgba(15, 23, 42, 0.08);
  }

  .sa-storefront.theme-dark .detail-img {
    box-shadow:
      0 10px 26px rgba(0, 0, 0, 0.46),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .card-img-wrap {
    padding: 7px;
  }

  .dp-mob-thumbs {
    display: flex;
    gap: 8px;
    padding: 10px 2px 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .dp-mob-thumbs::-webkit-scrollbar {
    display: none;
  }

  .dp-mob-thumbs .dp-thumb {
    width: 56px;
    height: 56px;
    border-radius: 10px;
  }

  .dp-mob-sheet {
    position: relative;
    margin-top: 0;
    border-radius: 0;
    background: var(--sa-surface);
    padding: 16px 16px 28px;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .dp-mob-breadcrumb {
    background: transparent;
    border-bottom: none;
    padding: 0;
    font-size: 12.5px;
  }

  .dp-related-section.is-mobile {
    margin-top: 4px;
  }

  .dp-related-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .dp-related-scroll::-webkit-scrollbar {
    display: none;
  }

  .dp-related-scroll .dp-related-card {
    flex: 0 0 132px;
  }

  .dp-mob-bottom-bar {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 16px calc(14px + env(safe-area-inset-bottom, 0px));
    background: var(--sa-bottom-bar-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--sa-border);
    box-shadow: 0 -6px 20px rgba(15, 23, 42, 0.08);
  }

  .dp-mob-bottom-bar .dp-qty-line {
    width: 100%;
  }

  .dp-mob-bottom-bar .dp-stepper {
    flex-shrink: 0;
    padding: 0;
  }

  .dp-mob-bottom-bar .dp-stepper button {
    width: 32px;
    height: 32px;
  }

  .dp-mob-bottom-bar .dp-stepper input {
    width: 32px;
  }

  .dp-mob-bottom-bar .dp-cta-btn {
    width: 100%;
    height: 46px;
    border-radius: 12px;
    font-size: 14.5px;
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
    border-radius: 999px;
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
    background: var(--sa-top-header-bg-h, var(--sa-top-header-bg));
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 0;
    box-shadow: 0 3px 14px rgba(var(--sa-primary-dark-rgb), 0.18);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  /* Seamless top curtain covering exposed area above sticky header
     in iOS in-app browsers (Telegram, Messenger, Zalo) & overscroll */
  .mobile-header-clean::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% - 1px);
    height: 180px;
    background: var(--sa-top-header-bg-h, var(--sa-top-header-bg));
    pointer-events: none;
    z-index: -1;
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
    color: var(--sa-on-primary, #ffffff);
    letter-spacing: -0.15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mobile-header-clean .logo-time.badge-online {
    margin-top: 0;
    background: rgba(255, 255, 255, 0.16);
    color: var(--sa-on-primary, #ffffff);
    border: 1px solid rgba(255, 255, 255, 0.28);
  }

  .mobile-header-clean .badge-online .dot-online {
    background: #6ee7b7;
  }

  .image-modal-card {
    max-width: 92vw;
    max-height: 80vh;
    padding: 8px;
  }

  .image-modal-card.has-link .image-preview {
    max-height: calc(76vh - 64px);
  }

  .image-modal-link-btn {
    width: 100%;
    justify-content: center;
  }
}

/* PWA standalone mode: extend sticky mobile header cleanly into iOS status bar safe area */
@media (max-width: 768px) and (display-mode: standalone) {
  .mobile-header-clean {
    height: calc(56px + env(safe-area-inset-top, 0px));
    padding-top: env(safe-area-inset-top, 0px);
  }

  .search-wrapper {
    top: calc(56px + env(safe-area-inset-top, 0px));
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

  .sa-storefront .card .price,
  .price {
    font-size: 14.5px;
    font-weight: 800;
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
    border-radius: 999px;
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

  .card-img-wrap .card-incart-bar {
    padding: 4px 8px;
    font-size: 10.5px;
    gap: 4px;
  }

  .card-img-wrap .card-incart-num {
    min-width: 16px;
    height: 16px;
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .menu { gap: 8px; }
  .mobile-bottom-bar { height: 58px; left: 8px; right: 8px; }
  .btn-label { font-size: 9.5px; }
  .mobile-bottom-bar i { font-size: 19px; }
  .sidebar-left { width: 92%; }
}
@media (min-width: 361px) and (max-width: 430px) {
  .menu { gap: 10px; }
  .mobile-bottom-bar { height: 62px; }
  .btn-label { font-size: 10px; }
  .mobile-bottom-bar i { font-size: 20px; }
}
@media (min-width: 431px) and (max-width: 480px) {
  .menu { gap: 10px; }
  .mobile-bottom-bar { height: 64px; }
  .mobile-bottom-bar i { font-size: 20px; }
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
    grid-template-columns: minmax(0, 1fr) 8px var(--pc-sidebar-w, clamp(296px, 31vw, 326px));
  }

  .layout.hide-right,
  .layout.hide-left.hide-right {
    grid-template-columns: minmax(0, 1fr) 0px 0px;
  }

  .sidebar-right .sidebar-content {
    width: var(--pc-sidebar-w, clamp(296px, 31vw, 326px));
  }

  .scroll-top-fab {
    right: calc(var(--pc-sidebar-w, clamp(296px, 31vw, 326px)) + 26px);
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
  background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary-bright));
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
  border: 2px solid var(--sa-primary-bright);

  background: #ffffff;
  color: var(--sa-primary-dark);

  font-size: 13px;
  font-weight: 800;

  cursor: pointer;
  box-shadow: 0 4px 10px rgba(var(--sa-primary-bright-rgb), 0.35);
  transition: all 0.2s ease;
}

.lang-switch-btn:hover {
  background: var(--sa-primary-soft);
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
  border: 2px solid var(--sa-primary-bright);
  background: #ffffff;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  box-shadow: 0 4px 10px rgba(var(--sa-primary-bright-rgb), 0.35);
}

.lang-switch-btn.lang-only:hover {
  background: var(--sa-primary-soft);
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
  border: 1px solid var(--sa-border-strong);
  box-shadow: var(--sa-card-shadow);
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.card-border:hover {
  transform: translateY(-4px);
  border-color: var(--sa-border-green);
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
  position: relative;
  max-width: min(820px, 92vw);
  max-height: min(680px, 86vh);
  padding: 10px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
}

.image-modal-card .modal-close {
  z-index: 2;
}

.image-preview {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 10px;
  display: block;
}

.image-modal-card.has-link .image-preview {
  max-height: calc(80vh - 66px);
}

.image-modal-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 9px 20px;
  border-radius: 999px;
  background: var(--sa-top-header-bg);
  color: var(--sa-on-primary, #ffffff);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 6px 18px rgba(var(--sa-primary-dark-rgb), 0.28);
  transition: transform 0.16s ease, filter 0.16s ease;
  flex-shrink: 0;
}

.image-modal-link-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.image-modal-link-btn:active {
  transform: scale(0.98);
}

.image-modal-link-btn i {
  font-size: 16px;
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
  color: inherit;
  opacity: 0.88;
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

/* =========================================================
   MOBILE CATEGORY PARENT STYLING (LIGHT MODE & DARK MODE)
   ========================================================= */
@media (max-width: 768px) {
  .modal-card .export-title.category-modal-title .category-title-text {
    color: inherit;
    font-weight: 900;
  }

  /* Light mode parent category pills, search Danh mục button & modal cards (Nền vàng, chữ xanh) */
  .sa-storefront.theme-light .search-wrapper .filter-cat-btn {
    background: linear-gradient(135deg, var(--sa-secondary-light) 0%, var(--sa-secondary-bright) 100%);
    border: 1.5px solid var(--sa-secondary-mid);
    color: var(--sa-primary-dark);
    font-weight: 800;
  }

  .sa-storefront.theme-light .search-wrapper .filter-cat-btn.active {
    background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
    border: 1.5px solid var(--sa-primary);
    color: var(--sa-primary-deep);
    box-shadow: 0 2px 8px rgba(var(--sa-secondary-mid-rgb), 0.35);
  }

  .sa-storefront.theme-light .sub-cat-tree.is-modal {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
  }

  .sa-storefront.theme-light .sub-cat-tree.is-modal .sub-cat-tree-item {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #0f172a;
    font-weight: 600;
  }

  .sa-storefront.theme-light .sub-cat-tree.is-modal .sub-cat-tree-item.active {
    background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary));
    border-color: var(--sa-primary);
    color: #ffffff;
    font-weight: 800;
    box-shadow: 0 3px 10px rgba(var(--sa-primary-rgb), 0.28);
  }

  .sa-storefront.theme-light .mob-cat-pill.is-parent-cat {
    background: linear-gradient(135deg, var(--sa-secondary-soft) 0%, var(--sa-secondary-light) 100%);
    border: 1.5px solid var(--sa-secondary-mid);
    color: var(--sa-primary-dark);
    font-weight: 800;
  }

  .sa-storefront.theme-light .mob-cat-pill.is-parent-cat.active {
    background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
    border: 2px solid var(--sa-primary);
    color: var(--sa-primary-deep);
    box-shadow: 0 3px 10px rgba(var(--sa-secondary-mid-rgb), 0.35);
  }

  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat {
    background: linear-gradient(135deg, var(--sa-secondary-light) 0%, var(--sa-secondary-bright) 100%);
    border: 1.5px solid var(--sa-secondary-mid);
    color: var(--sa-primary-dark);
    box-shadow: 0 4px 12px rgba(var(--sa-secondary-mid-rgb), 0.24);
  }

  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat .cat-label {
    color: var(--sa-primary-dark);
    font-weight: 800;
  }

  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat::before {
    background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary));
    box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.2);
  }

  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat .cat-chevron-btn {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(var(--sa-primary-dark-rgb), 0.32);
    color: var(--sa-primary-dark);
  }

  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.active,
  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.is-parent-active {
    background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
    border: 2px solid var(--sa-primary);
    color: var(--sa-primary-deep);
    box-shadow: 0 8px 20px rgba(var(--sa-secondary-mid-rgb), 0.38);
  }

  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.active .cat-label,
  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.is-parent-active .cat-label {
    color: var(--sa-primary-deep);
  }

  .sa-storefront.theme-light .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.active::before {
    background: var(--sa-primary);
    box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.25);
  }

  /* Dark mode category modal & parent category sync (Nền vàng, chữ xanh nổi bật, không chìm màu) */
  .sa-storefront.theme-dark .search-wrapper .filter-cat-btn {
    background: linear-gradient(135deg, var(--sa-secondary) 0%, var(--sa-secondary-mid) 100%);
    border: 1.5px solid var(--sa-secondary-bright);
    color: var(--sa-primary-deepest);
    font-weight: 800;
  }

  .sa-storefront.theme-dark .search-wrapper .filter-cat-btn.active {
    background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
    border: 1.5px solid var(--sa-primary-light);
    color: var(--sa-primary-deepest);
    box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.28);
  }

  .sa-storefront.theme-dark .sub-cat-tree.is-modal {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.16);
  }

  .sa-storefront.theme-dark .sub-cat-tree.is-modal .sub-cat-tree-item {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.24);
    color: #e2e8f0;
    font-weight: 600;
  }

  .sa-storefront.theme-dark .sub-cat-tree.is-modal .sub-cat-tree-item.active {
    background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary));
    border-color: var(--sa-primary-light);
    color: #ffffff;
    font-weight: 800;
    box-shadow: 0 3px 10px rgba(var(--sa-primary-bright-rgb), 0.35);
  }

  .sa-storefront.theme-dark .modal-card .export-title.category-modal-title {
    background: #131a26;
    color: var(--sa-primary-light);
    border-bottom: 2px solid var(--sa-primary-bright);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories {
    background: linear-gradient(145deg, #0f172a 0%, #131a26 100%);
    border: 1px solid rgba(var(--sa-primary-bright-rgb), 0.22);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.48);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat:not(.sale):not(.is-parent-cat) {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.22);
    color: #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat:not(.sale):not(.is-parent-cat) .cat-label {
    color: #e2e8f0;
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat:not(.sale):not(.is-parent-cat).active {
    background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary));
    border-color: transparent;
    color: #ffffff;
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat:not(.sale):not(.is-parent-cat).active .cat-label {
    color: #ffffff;
  }

  .sa-storefront.theme-dark .mob-cat-pill.is-parent-cat {
    background: linear-gradient(135deg, var(--sa-secondary) 0%, var(--sa-secondary-mid) 100%);
    border: 1.5px solid var(--sa-secondary-bright);
    color: var(--sa-primary-deepest);
    font-weight: 800;
  }

  .sa-storefront.theme-dark .mob-cat-pill.is-parent-cat.active {
    background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
    border: 2px solid var(--sa-primary-light);
    color: var(--sa-primary-deepest);
    box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.28), 0 4px 12px rgba(var(--sa-secondary-rgb), 0.32);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat {
    background: linear-gradient(135deg, var(--sa-secondary) 0%, var(--sa-secondary-mid) 100%);
    border: 1.5px solid var(--sa-secondary-bright);
    color: var(--sa-primary-deepest);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.36);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat .cat-label {
    color: var(--sa-primary-deepest);
    font-weight: 900;
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat::before {
    background: var(--sa-primary-dark);
    box-shadow: 0 0 0 2px rgba(var(--sa-primary-dark-rgb), 0.24);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat .cat-chevron-btn {
    background: rgba(var(--sa-primary-deep-rgb), 0.14);
    border-color: rgba(var(--sa-primary-deep-rgb), 0.36);
    color: var(--sa-primary-deepest);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.active,
  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.is-parent-active {
    background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
    border: 2px solid var(--sa-primary-light);
    color: var(--sa-primary-deepest);
    box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.28), 0 8px 20px rgba(var(--sa-secondary-rgb), 0.32);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.active .cat-label,
  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.is-parent-active .cat-label {
    color: var(--sa-primary-deepest);
  }

  .sa-storefront.theme-dark .modal-card .modal-categories .cat.cat-tree-parent.is-parent-cat.active::before {
    background: var(--sa-primary-deep);
    box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.28);
  }
}

/* ===== HIGH-CONTRAST TEXT ON SOLID ACCENT BUTTONS & ACTIVE PILLS (AUTO LIGHT/DARK) ===== */
.sct-cat-pill.active,
.pagination button.active,
.filter-btn.active,
.search-wrapper .filter-cat-btn.active,
.send-btn,
.copy-btn,
.save-btn,
.ck-btn,
.mcb-action-cta,
.dp-stepper button.dp-qty-plus,
.sub-cat-tree.is-modal .sub-cat-tree-item.active {
  color: var(--sa-on-accent, #ffffff);
}

/* =========================================================
   MENU BOARD VIEW (CATEGORY PRICE-LIST MENU — STYLE 1 THEME)
   ========================================================= */
.menu-view-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 12px;
  width: 100%;
}

.menu-view-switcher {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border-strong);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.mvs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--sa-muted);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease;
}

.mvs-btn i {
  font-size: 15px;
}

.mvs-btn:hover:not(.active) {
  color: var(--sa-heading);
  background: rgba(var(--sa-primary-rgb), 0.06);
}

.mvs-btn.active {
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
  box-shadow: 0 3px 10px rgba(var(--sa-primary-rgb), 0.24);
}

.mvs-btn:active {
  transform: scale(0.97);
}

.menu-board {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  width: 100%;
}

.mb-search-line {
  margin-bottom: 0;
}

.mb-section {
  background: var(--sa-surface);
  border: 1px solid var(--sa-border-strong);
  border-radius: var(--sa-radius-card, 16px);
  box-shadow: var(--sa-card-shadow);
  overflow: hidden;
  min-width: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.mb-sec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 56px;
  padding: 9px 16px;
  background: var(--sa-top-header-bg);
  color: var(--sa-on-primary, #ffffff);
  cursor: pointer;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.mb-sec-thumbs {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.mb-sec-thumb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.92);
  background: var(--sa-img-bg);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}

.mb-sec-thumbs .mb-sec-thumb + .mb-sec-thumb {
  margin-left: -10px;
}

.mb-sec-header:hover .mb-sec-thumb {
  transform: scale(1.06);
}

.mb-sec-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.mb-sec-title-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.sa-storefront .mb-sec-parent,
.mb-sec-parent {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  opacity: 0.85;
  line-height: 1.15;
}

.mb-sec-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--sa-on-primary, #ffffff);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  line-height: 1.25;
  text-align: center;
  word-break: break-word;
}

.sa-storefront .mb-sec-count,
.mb-sec-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: var(--sa-on-primary, #ffffff);
  font-size: 11.5px;
  font-weight: 800;
  flex-shrink: 0;
}

.mb-items-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
  row-gap: 2px;
  padding: 10px 16px 12px;
}

.mb-items-grid.is-single-col {
  grid-template-columns: 1fr;
}

.mb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border-bottom: 1px dashed var(--sa-border);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  min-width: 0;
}

.mb-row:hover {
  background: var(--sa-surface-soft);
}

.mb-row.is-in-cart {
  background: rgba(var(--sa-primary-rgb), 0.06);
}

.sa-storefront.theme-dark .mb-row.is-in-cart {
  background: rgba(var(--sa-primary-bright-rgb), 0.1);
}

.mb-row.is-out {
  opacity: 0.56;
}

.mb-name-wrap {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  max-width: 60%;
}

.sa-storefront .mb-name,
.mb-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--sa-heading);
  line-height: 1.32;
  word-break: break-word;
}

.mb-row.is-out .mb-name {
  text-decoration: line-through;
}

.mb-hl {
  background: rgba(var(--sa-secondary-rgb), 0.36);
  color: inherit;
  padding: 0 2px;
  border-radius: 3px;
}

.sa-storefront .mb-sale-tag,
.mb-sale-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(225, 29, 72, 0.14);
  color: var(--sa-sale);
  font-size: 10.5px;
  font-weight: 800;
  line-height: 1.3;
  flex-shrink: 0;
}

.sa-storefront .mb-out-tag,
.mb-out-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 5px;
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.3;
  flex-shrink: 0;
}

.sa-storefront .mb-incart-pill,
.mb-incart-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
  font-size: 10.5px;
  font-weight: 800;
  line-height: 1.3;
  flex-shrink: 0;
}

.mb-incart-pill.is-pop {
  animation: saAddCountBump 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mb-leader {
  flex: 1;
  min-width: 10px;
  border-bottom: 1.5px dotted var(--sa-border-strong);
  opacity: 0.55;
  align-self: center;
  transform: translateY(2px);
}

.mb-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.mb-price-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.sa-storefront .mb-old-price,
.mb-old-price {
  font-size: 11px;
  font-weight: 500;
  color: var(--sa-muted);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
}

.mb-price-line {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  white-space: nowrap;
}

.sa-storefront .mb-price,
.mb-price {
  font-size: 14px;
  font-weight: 800;
  color: var(--sa-price);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.15px;
}

.sa-storefront .mb-unit,
.mb-unit {
  font-size: 12px;
  font-weight: 600;
  color: var(--sa-muted);
}

.mb-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(var(--sa-primary-rgb), 0.24);
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease, box-shadow 0.15s ease;
}

.mb-add-btn:hover:not(:disabled) {
  background: var(--sa-accent-hover);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(var(--sa-primary-rgb), 0.34);
}

.mb-add-btn:active:not(:disabled) {
  transform: scale(0.9);
}

.mb-add-btn.added {
  animation: saAddBtnPop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mb-add-btn:disabled {
  background: var(--sa-surface-2);
  color: var(--sa-muted);
  box-shadow: none;
  cursor: not-allowed;
}

@media (max-width: 1120px) and (min-width: 769px) {
  .mb-items-grid {
    column-gap: 14px;
    padding: 8px 12px 10px;
  }

  .mb-sec-thumb {
    width: 34px;
    height: 34px;
  }
}

@media (max-width: 768px) {
  .menu-view-bar {
    margin: 2px 0 10px;
  }

  .menu-view-switcher {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mvs-btn {
    height: 36px;
    padding: 0 10px;
    font-size: 12.5px;
  }

  .menu-board {
    gap: 13px;
  }

  .mb-sec-header {
    min-height: 48px;
    padding: 8px 12px;
    gap: 8px;
  }

  .mb-sec-title-wrap {
    justify-content: flex-start;
    gap: 8px;
  }

  .mb-sec-title-texts {
    align-items: flex-start;
    flex: 1;
  }

  .mb-sec-title {
    font-size: 14.5px;
    text-align: left;
  }

  .mb-sec-thumbs.is-mobile-cluster .mb-sec-thumb {
    width: 30px;
    height: 30px;
    border-width: 1.5px;
  }

  .mb-sec-thumbs.is-mobile-cluster .mb-sec-thumb + .mb-sec-thumb {
    margin-left: -9px;
  }

  .mb-items-grid {
    grid-template-columns: 1fr;
    padding: 6px 8px 8px;
  }

  .mb-row {
    padding: 9px 8px;
    gap: 6px;
  }

  .mb-name-wrap {
    max-width: 58%;
  }

  .sa-storefront .mb-name,
  .mb-name {
    font-size: 13.5px;
  }

  .sa-storefront .mb-price,
  .mb-price {
    font-size: 13.5px;
  }

  .sa-storefront .mb-unit,
  .mb-unit {
    font-size: 11.5px;
  }

  .mb-add-btn {
    width: 32px;
    height: 32px;
    font-size: 17px;
  }
}

/* ===== STOREFRONT BOTTOM SEO H1 & INTRO BOX ===== */
.storefront-seo-box {
  margin: 22px 0 12px;
  padding: 14px 18px;
  border-radius: var(--sa-radius-card, 14px);
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  text-align: center;
}

.seo-box-h1 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 800;
  color: var(--sa-heading);
  line-height: 1.4;
}

.seo-box-intro {
  margin: 5px auto 0;
  max-width: 680px;
  font-size: 12.5px;
  color: var(--sa-muted);
  line-height: 1.55;
}

.dth-blog-link {
  text-decoration: none;
}

.seo-box-links {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.seo-box-blog-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid var(--sa-border);
  background: var(--sa-bg-soft, var(--sa-bg));
  color: var(--sa-accent);
  font-size: 12.5px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.seo-box-blog-link:hover {
  transform: translateY(-1px);
  border-color: var(--sa-accent);
}

/* ===== PC WEBSITE FOOTER (3-COLUMN CLEAN WEB FOOTER) ===== */
.pc-web-footer {
  margin: 34px 0 10px;
  padding: 26px 28px 18px;
  border-radius: var(--sa-radius-panel, 16px);
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.pwf-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr 1.05fr;
  gap: 28px;
  align-items: start;
}

.pwf-col {
  min-width: 0;
}

.pwf-brand-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pwf-logo {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid var(--sa-border);
  flex-shrink: 0;
}

.pwf-brand-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sa-storefront .pwf-brand-name,
.pwf-brand-name {
  font-size: 16.5px;
  font-weight: 800;
  color: var(--sa-heading);
  line-height: 1.2;
}

.pwf-open-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--sa-surface-soft);
  color: var(--sa-accent);
  font-size: 11.5px;
  font-weight: 700;
}

.pwf-seo-h1 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
  color: var(--sa-heading);
  line-height: 1.45;
}

.pwf-seo-intro {
  margin: 0 0 12px;
  font-size: 12.8px;
  color: var(--sa-muted);
  line-height: 1.6;
}

.pwf-location-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 11px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  font-size: 12.5px;
  line-height: 1.45;
}

.pwf-loc-ico {
  color: var(--sa-accent);
  font-size: 16px;
  margin-top: 1px;
  flex-shrink: 0;
}

.pwf-loc-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  color: var(--sa-text);
}

.sa-storefront .pwf-loc-label {
  font-weight: 700;
  color: var(--sa-heading);
}

.pwf-map-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
  color: var(--sa-accent);
  font-weight: 700;
  text-decoration: none;
}

.pwf-map-link:hover {
  text-decoration: underline;
}

.sa-storefront .pwf-col-title,
.pwf-col-title {
  display: block;
  margin-bottom: 11px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.45px;
  color: var(--sa-heading);
}

.pwf-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pwf-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 0;
  border: none;
  background: transparent;
  color: var(--sa-text);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s ease, transform 0.15s ease;
}

.pwf-nav-link i {
  font-size: 15px;
  color: var(--sa-muted);
  transition: color 0.15s ease;
}

.pwf-nav-link.is-highlight,
.pwf-nav-link.is-highlight i {
  color: var(--sa-accent);
  font-weight: 700;
}

.pwf-nav-link:hover {
  color: var(--sa-accent);
  transform: translateX(2px);
}

.pwf-nav-link:hover i {
  color: var(--sa-accent);
}

.pwf-safety-block {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--sa-border);
}

.sa-storefront .pwf-safety-title {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--sa-muted);
  margin-bottom: 7px;
}

.pwf-safety-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
}

.pwf-safety-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--sa-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.pwf-safety-link i {
  font-size: 13.5px;
}

.pwf-safety-link:hover {
  color: var(--sa-accent);
  text-decoration: underline;
}

.pwf-contact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pwf-contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 11px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.pwf-contact-item.is-clickable:hover {
  border-color: var(--sa-accent);
  transform: translateY(-1px);
}

.pwf-contact-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.pwf-contact-avatar.is-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sa-surface-soft);
  color: var(--sa-accent);
  font-size: 16px;
}

.pwf-contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pwf-contact-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sa-storefront .pwf-contact-name,
.pwf-contact-name {
  font-size: 12.8px;
  font-weight: 700;
  color: var(--sa-heading);
}

.sa-storefront .pwf-msg-pill {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
  font-size: 10px;
  font-weight: 700;
}

.pwf-contact-sub {
  font-size: 11.8px;
  color: var(--sa-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pwf-contact-ext {
  font-size: 14px;
  color: var(--sa-muted);
  flex-shrink: 0;
}

.pwf-contact-empty {
  margin: 0;
  font-size: 12.5px;
  color: var(--sa-muted);
}

.pwf-bottom {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--sa-border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--sa-muted);
}

.pwf-copyright strong {
  color: var(--sa-heading);
  font-weight: 700;
}

.pwf-top-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface-2);
  color: var(--sa-heading);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.pwf-top-btn:hover {
  border-color: var(--sa-accent);
  color: var(--sa-accent);
}

@media (max-width: 1100px) {
  .pwf-grid {
    grid-template-columns: 1fr 1fr;
  }
  .pwf-brand-col {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .storefront-seo-box {
    margin: 16px 0 10px;
    padding: 12px 14px;
  }

  .seo-box-h1 {
    font-size: 13.5px;
  }

  .seo-box-intro {
    font-size: 12px;
  }
}
</style>

<style>
/* ========================================================
   SUBTLE FAST ENTRANCE (MOBILE) + SMOOTH STAGGERED PC ENTRANCE
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

@keyframes pcCardEnter {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.982);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pcSidebarEnter {
  0% {
    opacity: 0;
    transform: translateX(22px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.mobile-header-clean,
.notice-bar,
.banner,
.menu,
.pagination {
  animation: slideInUpMenu 0.24s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  text-decoration: none;
}

.mobile-header-clean { animation-delay: 0s; }
.notice-bar          { animation-delay: 0.02s; }
.banner              { animation-delay: 0.04s; }
.menu                { animation-delay: 0.05s; }
.pagination          { animation-delay: 0.06s; }

@media (min-width: 769px) {
  .menu {
    animation: none;
  }

  .menu .card-border,
  .menu .menu-group-heading,
  .menu-board .mb-section {
    animation: pcCardEnter 0.36s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: calc(var(--card-stagger, 0) * 26ms);
  }

  .sidebar-right {
    animation: pcSidebarEnter 0.38s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: 0.06s;
  }

  /* Hold entrance animations until CookingSplashIntro doors open */
  .sa-storefront.is-splash-active .menu .card-border,
  .sa-storefront.is-splash-active .menu .menu-group-heading,
  .sa-storefront.is-splash-active .menu-board .mb-section,
  .sa-storefront.is-splash-active .sidebar-right {
    animation: none !important;
    opacity: 0;
  }
}

/* ===== SMOOTH CART ITEM ENTER / LEAVE / REORDER ===== */
.cart-solo-items,
.cart-member-items {
  position: relative;
}

.cart-item-slide-enter-active {
  transition:
    opacity 0.26s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.cart-item-slide-leave-active {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.22s ease;
}

.cart-item-slide-move {
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}

.cart-item-slide-enter-from {
  opacity: 0;
  transform: translateX(18px) scale(0.97);
}

.cart-item-slide-leave-to {
  opacity: 0;
  transform: translateX(22px) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .menu .card-border,
  .menu .menu-group-heading,
  .menu-board .mb-section,
  .sidebar-right,
  .notice-bar,
  .banner,
  .pagination {
    animation: none !important;
  }
  .cart-item-slide-enter-active,
  .cart-item-slide-leave-active,
  .cart-item-slide-move {
    transition: none !important;
  }
}

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
  border: 1px solid var(--sa-secondary-mid);
  background: linear-gradient(135deg, var(--sa-secondary-light) 0%, var(--sa-secondary-bright) 100%);
  color: var(--sa-primary-dark);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease, transform 0.12s ease;
  box-shadow: 0 2px 6px rgba(var(--sa-secondary-mid-rgb), 0.24);
  white-space: nowrap;
  flex-shrink: 0;
}

.group-invite-btn span {
  color: inherit;
}

.group-invite-btn:hover,
.group-invite-btn.copied {
  background: linear-gradient(135deg, var(--sa-secondary-bright) 0%, var(--sa-secondary) 100%);
  border-color: var(--sa-secondary-mid);
  color: var(--sa-primary-deep);
  box-shadow: 0 3px 10px rgba(var(--sa-secondary-mid-rgb), 0.34);
}

.group-invite-btn:active {
  transform: scale(0.97);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.1);
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.32);
  color: var(--sa-secondary-dark);
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
  box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.1);
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
  box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.12);
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
  color: var(--sa-primary-light);
}

.sa-live-toast.warn {
  background: var(--sa-secondary-deep);
}

.sa-live-toast.warn i {
  color: var(--sa-secondary-light);
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
    top: 0 !important;
    right: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: hidden !important;
    z-index: 2100 !important;
    background: var(--sa-bg);
  }

  .sidebar-right .cart-box {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 !important;
    background: var(--sa-bg);
  }

  .sidebar-right .cart-header-zone {
    padding: max(52px, calc(env(safe-area-inset-top, 0px) + 8px)) 14px 12px;
    background: var(--sa-top-header-bg);
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 4px 14px rgba(var(--sa-primary-rgb), 0.18);
  }

  .sidebar-right .cart-top-header {
    margin-bottom: 0;
    min-height: 36px;
  }

  .sidebar-right .cart-mob-back-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    padding: 0;
    margin-right: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .sidebar-right .cart-mob-back-btn i {
    color: #ffffff;
    font-size: 18px;
  }

  .sidebar-right .cart-top-title,
  .sidebar-right .cart-top-title span:not(.order-count) {
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
  }

  .sidebar-right .cart-top-title .order-count {
    color: rgba(255, 255, 255, 0.85);
    font-weight: 700;
  }

  .sidebar-right .cart-hdr-icon-btn.close {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    font-size: 18px;
  }

  .sidebar-right .cart-live-status-notice {
    margin: 12px 14px 0;
  }

  .cart-scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
  }

  .sidebar-right .cart-sticky-footer {
    margin-top: 0;
    padding: 10px 14px calc(14px + env(safe-area-inset-bottom, 0px));
    background: var(--sa-surface);
    border-top: 1px solid var(--sa-border);
    box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.08);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.14);
  color: var(--sa-secondary-dark);
}

.gmb-role-pill.guest {
  background: var(--sa-surface-soft);
  color: var(--sa-price);
}

.cart-member-group {
  background: var(--sa-surface);
  border: 1px solid var(--sa-primary-dark);
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: none;
}

.cart-member-group.is-host {
  border-color: var(--sa-primary-dark);
}

.cart-member-group.is-admin {
  border-color: var(--sa-primary-dark);
}

.cart-member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 8px 11px;
  background: var(--sa-primary-dark);
  border-bottom: 1px solid #0b5e3b;
  color: #ffffff;
}

.sa-storefront.theme-dark .cart-member-header {
  background: #0d6841;
  border-bottom-color: #094f31;
}

.cart-member-group.is-admin .cart-member-header {
  background: var(--sa-primary-dark);
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
  color: var(--sa-secondary-light);
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
  color: var(--sa-primary-dark);
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
  color: var(--sa-secondary-dark);
  background: rgba(var(--sa-secondary-mid-rgb), 0.1);
  border: 1px solid rgba(var(--sa-secondary-mid-rgb), 0.25);
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
  color: var(--sa-secondary-dark);
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
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.45);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.08);
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
  color: var(--sa-secondary-dark);
}

.delivery-accordion .da-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sa-heading);
  white-space: nowrap;
}

.delivery-accordion.missing .da-title {
  color: var(--sa-secondary-dark);
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
  color: var(--sa-secondary-dark);
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
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.4);
  color: var(--sa-secondary-dark);
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
  align-items: center;
  gap: 8px;
}

.cart-total-expand-btn {
  width: 32px;
  min-width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid var(--sa-border);
  background: var(--sa-surface);
  color: var(--sa-price);
  font-size: 16px;
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.14);
  color: var(--sa-secondary-dark);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.12);
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.35);
  color: var(--sa-secondary-dark);
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
  color: var(--sa-secondary-dark);
  background: rgba(var(--sa-secondary-mid-rgb), 0.1);
  border: 1px solid rgba(var(--sa-secondary-mid-rgb), 0.25);
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
  box-shadow: 0 3px 8px rgba(var(--sa-primary-rgb), 0.24);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.1);
  border: 1px solid rgba(var(--sa-secondary-mid-rgb), 0.28);
  color: var(--sa-secondary-dark);
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

.fcm-summary-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0;
  margin: 0 0 10px;
  border-radius: 0;
  background: transparent;
  border: none;
}

.fcm-summary-divider {
  border-top: 1px dashed var(--sa-border);
  margin: 2px 0;
}

.fcm-grand-total {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  border-radius: 0;
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
    align-items: stretch !important;
    justify-content: center !important;
    padding: 0 !important;
    inset: 0;
    background: var(--sa-bg) !important;
  }

  .modal-card.full-checkout-modal {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .fcm-header {
    padding: max(52px, calc(env(safe-area-inset-top, 0px) + 8px)) 14px 12px;
    background: var(--sa-top-header-bg);
    color: #ffffff;
    border-radius: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 4px 14px rgba(var(--sa-primary-rgb), 0.18);
  }

  .fcm-header.is-mobile-header {
    position: relative;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: max(52px, calc(env(safe-area-inset-top, 0px) + 8px)) 14px 12px;
    background: var(--sa-top-header-bg);
    color: #ffffff;
    border-radius: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  }

  .fcm-header.is-mobile-header .fcm-header-left {
    padding-right: 42px;
    flex-wrap: nowrap;
    gap: 8px;
    min-height: 34px;
  }

  .fcm-header.is-mobile-header .fcm-back-menu-btn {
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    justify-content: center;
    flex-shrink: 0;
  }

  .fcm-header.is-mobile-header .fcm-back-menu-btn span {
    display: none;
  }

  .fcm-header.is-mobile-header .fcm-title-wrap,
  .fcm-header.is-mobile-header .fcm-title-wrap i {
    color: #ffffff;
  }

  .fcm-header.is-mobile-header .fcm-count-pill {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.3);
    color: #ffffff;
  }

  .fcm-header.is-mobile-header .fcm-close-btn {
    position: absolute;
    top: max(52px, calc(env(safe-area-inset-top, 0px) + 8px));
    right: 14px;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    z-index: 2;
  }

  .fcm-header.is-mobile-header .fcm-live-pill,
  .fcm-header.is-mobile-header .fcm-created-pill {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.28);
    color: #ffffff;
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
  color: var(--sa-secondary-mid);
  background: rgba(var(--sa-secondary-mid-rgb), 0.14);
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.32);
}

.sa-storefront.theme-dark .gmb-role-pill.host,
.sa-storefront.theme-dark .cart-member-group .cm-badge.host,
.sa-storefront.theme-dark .cart-member-group .cm-status-pill:not(.done),
.sa-storefront.theme-dark .host-members-progress .hmp-count:not(.all) {
  color: var(--sa-secondary-mid);
  background: rgba(var(--sa-secondary-mid-rgb), 0.16);
}

.sa-storefront.theme-dark .delivery-accordion.missing .da-title,
.sa-storefront.theme-dark .delivery-accordion .da-summary.placeholder,
.sa-storefront.theme-dark .delivery-accordion.missing .da-toggle-pill,
.sa-storefront.theme-dark .delivery-accordion.missing .da-toggle-pill span {
  color: var(--sa-secondary-mid);
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
  background: linear-gradient(
    165deg,
    rgba(30, 41, 59, 0.56) 0%,
    rgba(15, 23, 42, 0.42) 55%,
    rgba(30, 41, 59, 0.52) 100%
  );
  backdrop-filter: blur(26px) saturate(190%) brightness(1.08);
  -webkit-backdrop-filter: blur(26px) saturate(190%) brightness(1.08);
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow:
    0 16px 38px rgba(2, 6, 23, 0.58),
    inset 0 1.5px 1px rgba(255, 255, 255, 0.34),
    inset 0 -1.5px 2px rgba(0, 0, 0, 0.36);
}

.sa-storefront.theme-dark .mobile-bottom-bar::after {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.14) 0%,
    rgba(255, 255, 255, 0.02) 45%,
    rgba(255, 255, 255, 0.06) 100%
  );
}

.sa-storefront.theme-dark .mobile-bottom-bar button::before {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.22) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.sa-storefront.theme-dark .mobile-bottom-bar button i {
  color: #f8fafc;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

.sa-storefront.theme-dark .mobile-bottom-bar button i.dock-accent-ico {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .mobile-bottom-bar .btn-label {
  color: #e2e8f0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.sa-storefront.theme-dark .mobile-bottom-bar button.active i,
.sa-storefront.theme-dark .mobile-bottom-bar button.active i.dock-accent-ico,
.sa-storefront.theme-dark .mobile-bottom-bar button.active .btn-label {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .detail-sidebar {
  background: var(--sa-surface);
  color: var(--sa-text);
}

/* ===== UNIFIED LIGHT/DARK CONTRAST FIXES (CATEGORIES, TRACKERS, STATUSES, MODALS) ===== */
.qty-note-box {
  width: 100%;
  margin-bottom: 10px;
}

.qty-note-box-last {
  margin-bottom: 12px;
}

.qty-note-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--sa-muted);
}

.qty-note-input {
  width: 100%;
  border: 1px solid var(--sa-input-border);
  background: var(--sa-input-bg);
  color: var(--sa-heading);
  border-radius: 9px;
  padding: 8px 10px;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.qty-note-input:focus {
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.14);
}

.sa-storefront.theme-dark .modal-card .categories,
.sa-storefront.theme-dark .modal-card .modal-categories,
.sa-storefront.theme-dark .sidebar-left .categories {
  background: var(--sa-surface-2);
  border-color: var(--sa-border-strong);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.sa-storefront.theme-dark .sidebar-left .categories h4,
.sa-storefront.theme-dark .category-modal-title {
  color: var(--sa-heading);
}

.sa-storefront.theme-dark .modal-card .modal-categories .cat:not(.active):not(.sale),
.sa-storefront.theme-dark .sidebar-left .categories .cat:not(.active):not(.sale) {
  background: var(--sa-surface);
  color: var(--sa-heading);
  border-color: var(--sa-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.26);
}

.sa-storefront.theme-dark .sidebar-left .categories .cat:not(.active):not(.sale):hover {
  background: var(--sa-pill-hover);
  border-color: var(--sa-border-green);
}

.sa-storefront.theme-dark .modal-card .modal-categories .cat:not(.active):not(.sale) .cat-label {
  color: var(--sa-heading);
}

.sa-storefront.theme-dark .mcb-promo-text,
.sa-storefront.theme-dark .mcb-promo-text i {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .mcb-tracker-pill.is-pending .mcb-tracker-ico {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.sa-storefront.theme-dark .mcb-tracker-pill.is-approved .mcb-tracker-ico {
  background: rgba(var(--sa-primary-bright-rgb), 0.18);
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .mcb-edit-btn.has-added-badge {
  border-color: rgba(248, 113, 113, 0.48);
  color: #f87171;
}

.sa-storefront.theme-dark .cart-live-status-notice .clsn-icon {
  color: var(--sa-primary-light);
  background: rgba(var(--sa-primary-bright-rgb), 0.18);
}

.sa-storefront.theme-dark .cart-live-status-notice.is-pending {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(251, 191, 36, 0.36);
}

.sa-storefront.theme-dark .cart-live-status-notice.is-pending .clsn-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-pending .clsn-title {
  color: #fbbf24;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-shipping {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(129, 140, 248, 0.4);
}

.sa-storefront.theme-dark .cart-live-status-notice.is-shipping .clsn-icon {
  background: rgba(99, 102, 241, 0.24);
  color: #a5b4fc;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-shipping .clsn-title {
  color: #a5b4fc;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-completed .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-completed .clsn-title {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .cart-live-status-notice.is-cancelled {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(248, 113, 113, 0.38);
}

.sa-storefront.theme-dark .cart-live-status-notice.is-cancelled .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-cancelled .clsn-title {
  color: #fca5a5;
}

.sa-storefront.theme-dark .order-status-btn.is-pending .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-pending .osb-right {
  color: #fbbf24;
}

.sa-storefront.theme-dark .order-status-btn.is-approved .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-approved .osb-right {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .delivery-accordion.missing .da-ico {
  color: var(--sa-secondary-mid);
}

.sa-storefront.theme-dark .ugm-icon-badge:not(.danger),
.sa-storefront.theme-dark .epo-icon-badge {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.sa-storefront.theme-dark .ugm-icon-badge.danger {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(248, 113, 113, 0.38);
  color: #fca5a5;
}

.sa-storefront.theme-dark .epo-btn.is-cancel {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(248, 113, 113, 0.45);
  color: #fca5a5;
}

.sa-storefront.theme-dark .lang-switch-btn {
  background: var(--sa-surface);
  color: var(--sa-primary-light);
  border-color: var(--sa-border-green);
}

.sa-storefront.theme-dark .cart-member-group .cm-summary {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.24);
}

/* =========================================================
   MILESTONE FREESHIP & GIFT PROGRESS PROMOTION CARDS
   ========================================================= */
.milestone-promo-card {
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.92) 0%, rgba(255, 255, 255, 0.96) 100%);
  border: 1.5px solid rgba(var(--sa-primary-bright-rgb), 0.34);
  border-radius: 14px;
  padding: 11px 14px;
  box-shadow: 0 4px 14px rgba(var(--sa-primary-rgb), 0.08);
  transition: border-color 0.25s ease, background 0.25s ease;
}

.milestone-promo-card.is-all-unlocked {
  background: linear-gradient(135deg, var(--sa-primary-soft) 0%, var(--sa-primary-pastel) 100%);
  border-color: var(--sa-primary);
  box-shadow: 0 6px 18px rgba(var(--sa-primary-rgb), 0.16);
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
  background: linear-gradient(135deg, var(--sa-primary-bright) 0%, var(--sa-primary) 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(var(--sa-primary-rgb), 0.26);
}

.mpc-icon-badge.mini {
  width: 24px;
  height: 24px;
  font-size: 13px;
}

.mpc-headline {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--sa-primary-dark);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.16);
  overflow: hidden;
}

.cart-milestone-box .mpc-progress-track {
  margin-top: 6px;
  height: 6px;
}

.mpc-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--sa-primary-bright) 0%, var(--sa-primary) 100%);
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
  color: var(--sa-primary);
}

.mpc-chip-target {
  font-weight: 600;
}

.mpc-chip-reward {
  font-weight: 700;
  color: #0f172a;
}

.mpc-chip.unlocked {
  background: var(--sa-primary);
  border-color: var(--sa-primary);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(var(--sa-primary-rgb), 0.24);
}

.mpc-chip.unlocked i,
.mpc-chip.unlocked .mpc-chip-reward {
  color: #ffffff;
}

/* DARK MODE SUPPORT FOR MILESTONE PROMO CARDS */
.sa-storefront.theme-dark .milestone-promo-card {
  background: linear-gradient(135deg, rgba(var(--sa-primary-deep-rgb), 0.42) 0%, rgba(15, 23, 42, 0.85) 100%);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.38);
}

.sa-storefront.theme-dark .milestone-promo-card.is-all-unlocked {
  background: linear-gradient(135deg, rgba(var(--sa-primary-dark-rgb), 0.62) 0%, rgba(var(--sa-primary-rgb), 0.28) 100%);
  border-color: var(--sa-primary-bright);
}

.sa-storefront.theme-dark .mpc-headline {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .mpc-progress-track {
  background: rgba(148, 163, 184, 0.2);
}

.sa-storefront.theme-dark .mpc-chip:not(.unlocked) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.14);
  color: var(--sa-text);
}

.sa-storefront.theme-dark .mpc-chip:not(.unlocked) i {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .mpc-chip:not(.unlocked) .mpc-chip-reward {
  color: var(--sa-heading);
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
  background: var(--sa-primary);
  border-color: var(--sa-primary-bright);
  color: #ffffff;
}

.sa-storefront.theme-dark .mpc-chip.unlocked .mpc-chip-reward {
  color: #ffffff;
}

.sa-storefront.theme-dark .mcb-promo-strip {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.45);
}

.sa-storefront.theme-dark .mcb-promo-strip.unlocked {
  background: rgba(var(--sa-primary-deep-rgb), 0.94);
  border-color: var(--sa-primary-bright);
}

.sa-storefront.theme-dark .mcb-promo-text {
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .mcb-promo-text i {
  color: var(--sa-primary-light);
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
  background: rgba(var(--sa-primary-rgb), 0.14);
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
  color: var(--sa-primary-hover);
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
    box-shadow: 0 0 0 0 rgba(var(--sa-secondary-dark-rgb), 0.35);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 8px rgba(var(--sa-secondary-dark-rgb), 0);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.14);
  border: 1px solid rgba(var(--sa-secondary-mid-rgb), 0.35);
  color: var(--sa-secondary-dark);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.14);
  color: var(--sa-secondary-dark);
  font-weight: 600;
  font-size: 10.5px;
}

.sa-storefront.theme-dark .ugm-status-tag {
  color: var(--sa-secondary-mid);
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
  background: var(--sa-primary-hover);
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
  border-color: var(--sa-primary-bright);
  background: rgba(var(--sa-primary-bright-rgb), 0.13);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.18);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.11);
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.34);
}

.order-status-btn.is-pending .osb-left,
.order-status-btn.is-pending .osb-right {
  color: var(--sa-secondary-dark);
}

.order-status-btn.is-approved {
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  border-color: var(--sa-primary-bright);
}

.order-status-btn.is-approved .osb-left,
.order-status-btn.is-approved .osb-right {
  color: var(--sa-primary-hover);
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
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
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
  border: 1.5px solid rgba(var(--sa-primary-bright-rgb), 0.35);
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

.gsm-tg-share-btn {
  margin-top: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(34, 158, 217, 0.36);
  background: linear-gradient(135deg, #229ed9, #0088cc);
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 136, 204, 0.24);
  transition: transform 0.14s ease, filter 0.14s ease;
}

.gsm-tg-share-btn i {
  font-size: 17px;
}

.gsm-tg-share-btn:hover {
  filter: brightness(1.06);
}

.gsm-tg-share-btn:active {
  transform: scale(0.985);
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
  background: var(--sa-primary-hover);
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
  box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.12);
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

.dt24-picker-row:focus-within,
.dt24-picker-row.is-open {
  border-color: var(--sa-accent);
  box-shadow: 0 0 0 3px rgba(var(--sa-primary-rgb), 0.12);
}

.dt24-picker-row.disabled {
  opacity: 0.65;
}

.dt24-segment.dt24-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  height: 30px;
  border-radius: 7px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.dt24-segment.dt24-pill:focus-within,
.dt24-segment.dt24-pill.is-active {
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

.dt24-select-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--sa-heading);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.dt24-select-btn.empty {
  color: var(--sa-muted);
  font-weight: 600;
}

.dt24-select-btn:hover:not(:disabled),
.dt24-select-btn.open {
  background: var(--sa-surface-soft);
  border-color: var(--sa-border-green);
  color: var(--sa-price);
}

.dt24-select-btn:disabled {
  cursor: not-allowed;
}

.dt24-select-btn .dt24-caret {
  font-size: 13px;
  color: var(--sa-muted);
  transition: transform 0.16s ease, color 0.15s ease;
}

.dt24-select-btn.open .dt24-caret {
  transform: rotate(180deg);
  color: var(--sa-accent);
}

.dt24-date-btn {
  min-width: 78px;
  justify-content: space-between;
  padding: 0 7px;
  gap: 5px;
}

.dt24-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* COMPACT VERTICAL-COLUMN DROPDOWN (100% SYNCED WITH STOREFRONT THEME VARS) */
.dt24-col-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 80;
  padding: 4px;
  border-radius: 10px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border-green);
  box-shadow: 0 10px 26px rgba(var(--sa-primary-rgb), 0.16);
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 176px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.dt24-col-menu.is-compact {
  min-width: 58px;
}

.dt24-col-menu.is-date-menu {
  left: auto;
  right: 0;
  transform: none;
  min-width: 148px;
  max-height: 188px;
}

.dt24-col-opt {
  width: 100%;
  min-height: 28px;
  padding: 4px 8px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--sa-heading);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.dt24-col-opt:hover {
  background: var(--sa-surface-soft);
  color: var(--sa-price);
}

.dt24-col-opt.selected {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: #ffffff;
  font-weight: 700;
}

.dt24-col-opt.is-date-opt {
  justify-content: space-between;
  padding: 5px 9px;
}

.dt24-col-opt.selected .dt24-date-opt-sub {
  color: rgba(255, 255, 255, 0.85);
}

.dt24-date-opt-main {
  font-weight: 700;
}

.dt24-date-opt-sub {
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--sa-muted);
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

.is-mobile-dt24 .dt24-select-wrap {
  flex: 1 1 0;
  min-width: 0;
}

.is-mobile-dt24 .dt24-select-btn {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: 8px;
  font-size: 14px;
  justify-content: space-between;
}

.is-mobile-dt24 .dt24-select-btn.open {
  background: var(--sa-surface-soft);
  border-color: var(--sa-accent);
  color: var(--sa-price);
}

.is-mobile-dt24 .dt24-col-menu.is-compact {
  left: 0;
  right: 0;
  transform: none;
  min-width: 100%;
}

.is-mobile-dt24 .dt24-col-menu.is-date-menu {
  left: 0;
  right: 0;
  min-width: 100%;
}

.is-mobile-dt24 .dt24-col-opt {
  min-height: 34px;
  font-size: 13.5px;
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
  background: linear-gradient(90deg, var(--sa-primary-bright) 0%, var(--sa-primary) 100%);
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
  background: var(--sa-primary-bright);
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
  box-shadow: 0 0 0 2px rgba(var(--sa-primary-bright-rgb), 0.18);
}

.mcp-point.is-unlocked {
  background: var(--sa-primary-bright);
  border-color: var(--sa-primary);
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
  color: var(--sa-primary);
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
  background: var(--sa-primary-bright);
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
  color: var(--sa-primary-bright);
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
  background: linear-gradient(90deg, var(--sa-primary-bright) 0%, var(--sa-primary-bright) 100%);
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
  border: 2px solid var(--sa-primary-bright);
  opacity: 0;
  pointer-events: none;
  animation: grabPulseRing 1.7s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.gs-step.is-done .gs-node {
  background: var(--sa-primary-bright);
  border-color: var(--sa-primary-bright);
  color: #ffffff;
}

.gs-step.is-current .gs-node {
  background: var(--sa-primary-bright);
  border-color: var(--sa-primary);
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(var(--sa-primary-bright-rgb), 0.3);
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
  color: var(--sa-primary);
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
  border: 1px solid rgba(var(--sa-primary-bright-rgb), 0.25);
  background: rgba(var(--sa-primary-bright-rgb), 0.08);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  color: var(--sa-primary-dark);
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
  background: rgba(var(--sa-secondary-mid-rgb), 0.1);
  border-color: rgba(var(--sa-secondary-dark-rgb), 0.3);
}

.cart-live-status-notice.is-pending .clsn-icon,
.cart-live-status-notice.is-pending .clsn-title {
  color: var(--sa-secondary-dark);
}

.cart-live-status-notice.is-pending .clsn-icon {
  background: rgba(var(--sa-secondary-mid-rgb), 0.18);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.1);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.3);
}

.cart-live-status-notice.is-completed .clsn-icon,
.cart-live-status-notice.is-completed .clsn-title {
  color: var(--sa-primary-hover);
}

.cart-live-status-notice.is-completed .clsn-icon {
  background: rgba(var(--sa-primary-bright-rgb), 0.18);
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
  color: var(--sa-secondary-light);
}

.sa-storefront.theme-dark .cart-live-status-notice.is-shipping .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-shipping .clsn-title {
  color: #a5b4fc;
}

.sa-storefront.theme-dark .cart-live-status-notice.is-completed .clsn-icon,
.sa-storefront.theme-dark .cart-live-status-notice.is-completed .clsn-title {
  color: var(--sa-primary-light);
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
  background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary-dark));
  color: #ffffff;
}

.finish-btn.pending-progress-finish-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--sa-secondary-dark), var(--sa-secondary-mid));
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
  background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary-dark));
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
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  color: var(--sa-primary);
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
  color: var(--sa-primary-light);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.16);
  border-color: var(--sa-primary);
}

.order-status-btn.is-completed .osb-left,
.order-status-btn.is-completed .osb-right {
  color: var(--sa-primary-hover);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.16);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.45);
  color: var(--sa-primary-hover);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.12);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.38);
  color: var(--sa-primary-hover);
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
  color: var(--sa-primary-light);
}

.sa-storefront.theme-dark .fcm-locked-box.is-completed {
  background: rgba(var(--sa-primary-bright-rgb), 0.15);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.38);
}

.sa-storefront.theme-dark .order-status-btn.is-pending {
  background: rgba(var(--sa-secondary-mid-rgb), 0.15);
  border-color: rgba(var(--sa-secondary-mid-rgb), 0.35);
}

.sa-storefront.theme-dark .order-status-btn.is-pending .osb-left,
.sa-storefront.theme-dark .order-status-btn.is-pending .osb-right {
  color: var(--sa-secondary-mid);
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
  box-shadow: 0 4px 12px rgba(var(--sa-primary-rgb), 0.22);
  transition: background-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
}

.exm-channel-btn:hover {
  background: var(--sa-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(var(--sa-primary-rgb), 0.28);
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

.exm-body-scroll {
  display: contents;
}

@media (max-width: 860px) {
  .modal-overlay.export-modal-overlay {
    align-items: stretch !important;
    justify-content: center !important;
    padding: 0 !important;
    inset: 0;
    background: var(--sa-bg) !important;
  }

  .modal-overlay.export-modal-overlay .modal-card.export-modal {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    padding: 0 !important;
    border-radius: 0 !important;
    border: none !important;
    background: var(--sa-bg);
    gap: 0;
    overflow: hidden;
    box-shadow: none !important;
  }

  .modal-card.export-modal .exm-header {
    padding: max(52px, calc(env(safe-area-inset-top, 0px) + 8px)) 52px 12px 14px;
    background: var(--sa-top-header-bg);
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 4px 14px rgba(var(--sa-primary-rgb), 0.18);
    gap: 10px;
  }

  .modal-card.export-modal .exm-mob-back-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .modal-card.export-modal .exm-close-btn {
    top: max(52px, calc(env(safe-area-inset-top, 0px) + 8px));
    right: 14px;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
    font-size: 18px;
    z-index: 3;
  }

  .modal-card.export-modal .exm-title {
    font-size: 16.5px;
    color: #ffffff;
  }

  .modal-card.export-modal .exm-code-pill {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.3);
    color: #ffffff;
  }

  .modal-card.export-modal .exm-subtitle {
    color: rgba(255, 255, 255, 0.84);
    font-size: 12px;
  }

  .modal-card.export-modal .exm-body-scroll {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 12px 14px calc(16px + env(safe-area-inset-bottom, 0px));
  }

  .modal-card.export-modal .exm-body-scroll:has(+ .exm-send-section) {
    padding-bottom: 12px;
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

  .modal-card.export-modal .exm-send-section {
    padding: 12px 14px calc(14px + env(safe-area-inset-bottom, 0px));
    background: var(--sa-surface);
    border-top: 1px solid var(--sa-border);
    box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.08);
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
  background: var(--sa-primary-bright);
  border: 2px solid var(--sa-surface);
}

/* =========================================================
   MOBILE DEDICATED ORDER PROGRESS SHEET (.mob-progress-sheet)
   ========================================================= */
.mobile-sheet-backdrop.is-progress {
  z-index: 2148;
}

.mob-progress-sheet {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: var(--sa-bg);
  color: var(--sa-text);
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2150;
}

.mps-header {
  flex-shrink: 0;
  height: auto;
  min-height: calc(48px + max(52px, calc(env(safe-area-inset-top, 0px) + 8px)));
  padding: max(52px, calc(env(safe-area-inset-top, 0px) + 8px)) 14px 12px;
  background: var(--sa-top-header-bg);
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 14px rgba(var(--sa-primary-rgb), 0.18);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mps-back-btn,
.mps-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
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
  font-size: 15.5px;
  font-weight: 800;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mps-code-pill {
  font-size: 11px;
  font-weight: 800;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
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
  padding: 12px 12px calc(20px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mps-scroll-body:has(+ .mps-footer) {
  padding-bottom: 16px;
}

.mps-footer {
  flex-shrink: 0;
  padding: 12px 14px calc(14px + env(safe-area-inset-bottom, 0px));
  background: var(--sa-surface);
  border-top: 1px solid var(--sa-border);
  box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.08);
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
  background: rgba(var(--sa-primary-bright-rgb), 0.1);
  border: 1px solid rgba(var(--sa-primary-bright-rgb), 0.28);
  color: var(--sa-primary-dark);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.45;
}

.sa-storefront.theme-dark .mps-status-notice {
  color: var(--sa-primary-pastel);
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

.mps-summary-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 2px 0 0;
  border-radius: 0;
  background: transparent;
  border: none;
}

.mps-grand-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0;
  border-top: none;
  font-size: 14px;
  font-weight: 700;
  color: var(--sa-heading);
}

.mps-grand-total.has-breakdown {
  padding-top: 7px;
  border-top: 1px dashed var(--sa-border);
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

.cart-items-subtotal-row,
.mps-items-subtotal-row,
.fcm-items-subtotal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-muted, #94a3b8);
  padding-bottom: 4px;
}

.cart-discount-row,
.mps-discount-row,
.fcm-discount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: #dc2626;
  padding-bottom: 4px;
}

.sa-storefront.theme-dark .cart-discount-row,
.sa-storefront.theme-dark .mps-discount-row,
.sa-storefront.theme-dark .fcm-discount-row {
  color: #f87171;
}

.cart-ship-row,
.mps-ship-row,
.fcm-ship-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: #0284c7;
  padding-bottom: 4px;
}

.sa-storefront.theme-dark .cart-ship-row,
.sa-storefront.theme-dark .mps-ship-row,
.sa-storefront.theme-dark .fcm-ship-row {
  color: #38bdf8;
}

.fcm-created-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: var(--sa-muted);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

/* SIDEBAR PROMO CHECKLIST (VERTICAL, BELOW TOTAL ROW) */
.cart-promo-checklist {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
  padding: 2px 0;
}

.mpcb-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  font-size: 11.5px;
  color: var(--sa-muted);
  line-height: 1.3;
}

.mpcb-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 1.5px solid var(--sa-border-strong, #94a3b8);
  background: transparent;
  font-size: 11px;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
  transition: all 0.16s ease;
}

.mpcb-prefix {
  font-weight: 700;
  color: var(--sa-text);
}

.mpcb-sep {
  opacity: 0.55;
}

.mpcb-item.is-next .mpcb-check {
  border-color: var(--sa-secondary-mid);
}

.mpcb-item.is-next .mpcb-prefix,
.mpcb-item.is-next .mpcb-reward {
  color: var(--sa-heading);
  font-weight: 700;
}

.mpcb-item.is-unlocked .mpcb-check {
  background: var(--sa-primary-bright);
  border-color: var(--sa-primary-bright);
  color: #ffffff;
}

.mpcb-item.is-unlocked .mpcb-prefix,
.mpcb-item.is-unlocked .mpcb-reward {
  color: var(--sa-primary-bright);
  font-weight: 700;
}

/* ===== ENTRY NOTICE POPUP MODAL ===== */
.epn-overlay {
  position: fixed;
  inset: 0;
  z-index: 12000;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.epn-modal {
  position: relative;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e2e8f0);
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.34);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: epnPopIn 0.22s ease-out;
}

@keyframes epnPopIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.epn-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  background: rgba(15, 23, 42, 0.56);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 19px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.18s ease, transform 0.15s ease;
}

.epn-close-btn.on-light {
  background: var(--sa-surface-2, #f1f5f9);
  border-color: var(--sa-border-strong, #cbd5e1);
  color: var(--sa-heading, #0f172a);
  box-shadow: none;
}

.epn-close-btn:hover {
  transform: scale(1.06);
}

.epn-scroll-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.epn-text-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px 52px 12px;
  background: linear-gradient(180deg, rgba(var(--sa-primary-bright-rgb), 0.14) 0%, transparent 100%);
  text-align: center;
}

.epn-hero-ico {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--sa-primary-bright) 0%, var(--sa-primary) 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 10px 22px rgba(var(--sa-primary-rgb), 0.28);
}

.epn-content-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
}

.epn-content-link.is-clickable {
  cursor: pointer;
}

.epn-img-wrap {
  width: 100%;
  background: var(--sa-img-bg, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--sa-border, #e2e8f0);
}

.epn-img {
  width: 100%;
  max-height: 54vh;
  object-fit: contain;
  display: block;
}

.epn-caption {
  padding: 14px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--sa-surface, #ffffff);
}

.epn-modal.is-text-only .epn-caption {
  padding: 6px 22px 10px;
  text-align: center;
}

.epn-headline {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.45;
  color: var(--sa-price, var(--sa-primary));
  white-space: pre-line;
}

.epn-text {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--sa-price, var(--sa-primary));
  white-space: pre-line;
}

.epn-caption:hover .epn-headline,
.epn-caption:hover .epn-text,
.epn-content-link.is-clickable:hover .epn-headline,
.epn-content-link.is-clickable:hover .epn-text {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.epn-footer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px 18px;
  background: var(--sa-surface, #ffffff);
}

.epn-dismiss-btn {
  width: auto;
  min-width: 152px;
  height: 42px;
  padding: 0 26px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, var(--sa-primary-bright) 0%, var(--sa-primary-bright) 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.6px;
  box-shadow: 0 8px 20px rgba(var(--sa-primary-bright-rgb), 0.32);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.14s ease, filter 0.16s ease, box-shadow 0.16s ease;
}

.epn-dismiss-btn:hover {
  filter: brightness(1.05);
  box-shadow: 0 10px 24px rgba(var(--sa-primary-bright-rgb), 0.42);
}

.epn-dismiss-btn:active {
  transform: scale(0.97);
}

.epn-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 16px 10px;
  border-top: 1px solid var(--sa-border, #e2e8f0);
  background: var(--sa-surface, #ffffff);
}

.epn-pager-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid var(--sa-border, #cbd5e1);
  background: var(--sa-surface-2, #f8fafc);
  color: var(--sa-heading, #334155);
  font-size: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.epn-pager-btn:hover {
  filter: brightness(0.96);
}

.epn-pager-dots {
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-muted, #64748b);
}

@media (max-width: 768px) {
  .epn-overlay {
    padding:
      max(56px, calc(env(safe-area-inset-top, 0px) + 16px))
      16px
      max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px));
  }

  .epn-modal {
    max-width: 420px;
    max-height: calc(
      100dvh
      - max(56px, calc(env(safe-area-inset-top, 0px) + 16px))
      - max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))
    );
    border-radius: 20px;
  }

  .epn-footer-actions {
    padding: 10px 14px 14px;
  }
}

/* ===== EMPTY PENDING ORDER MODAL ===== */
.empty-pending-order-modal {
  max-width: 420px;
  width: 92vw;
  border-radius: 20px;
  padding: 24px 20px 20px;
  background: var(--sa-surface, #ffffff);
  color: var(--sa-heading, #0f172a);
}

.epo-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.epo-icon-badge {
  width: 54px;
  height: 54px;
  border-radius: 999px;
  background: rgba(var(--sa-secondary-mid-rgb), 0.14);
  color: var(--sa-secondary-dark);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 12px;
}

.epo-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 800;
  color: var(--sa-heading, #0f172a);
}

.epo-desc {
  margin: 0 0 18px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--sa-muted, #64748b);
}

.epo-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.epo-btn {
  width: 100%;
  height: 42px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.14s ease, opacity 0.14s ease;
}

.epo-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.epo-btn.is-restore {
  background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary));
  color: #ffffff;
}

.epo-btn.is-cancel {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.45);
  color: #dc2626;
}

.epo-btn.is-pick {
  background: var(--sa-surface-2);
  border-color: var(--sa-border-strong);
  color: var(--sa-heading);
}

.epo-btn.is-pick:hover:not(:disabled) {
  background: var(--sa-pill-hover);
  border-color: var(--sa-accent);
}

/* ===== STATUS NOTICE SHOP MESSAGE & FINAL ORDER NOTICE MODAL ===== */
.status-notice-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.status-shop-msg-box {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px dashed rgba(15, 23, 42, 0.16);
  color: #0f172a;
  font-size: 12.5px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.sa-storefront.theme-dark .status-shop-msg-box {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(148, 163, 184, 0.28);
  color: #f8fafc;
}

.status-shop-msg-lbl {
  margin-right: 4px;
  font-weight: 800;
}

.ofn-overlay {
  z-index: 99999;
}

.ofn-modal-card {
  max-width: 430px;
  width: 92vw;
  border-radius: 22px;
  padding: 26px 22px 22px;
  background: var(--sa-surface, #ffffff);
  color: var(--sa-heading, #0f172a);
}

.ofn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ofn-icon-badge {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: 12px;
}

.ofn-icon-badge.is-completed {
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  color: var(--sa-primary-bright);
}

.ofn-icon-badge.is-cancelled {
  background: rgba(239, 68, 68, 0.14);
  color: #ef4444;
}

.ofn-icon-badge.is-message {
  background: rgba(59, 130, 246, 0.14);
  color: #2563eb;
}

.ofn-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 800;
  color: var(--sa-heading, #0f172a);
}

.ofn-desc {
  margin: 0 0 14px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--sa-muted, #64748b);
}

.ofn-shop-msg {
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--sa-surface-2);
  border: 1px solid var(--sa-border-strong);
  margin-bottom: 18px;
}

.ofn-modal-card.is-cancelled .ofn-shop-msg {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.25);
}

.sa-storefront.theme-dark .ofn-modal-card.is-cancelled .ofn-shop-msg {
  background: rgba(239, 68, 68, 0.13);
  border-color: rgba(248, 113, 113, 0.35);
}

.ofn-modal-card.is-completed .ofn-shop-msg {
  background: rgba(var(--sa-primary-bright-rgb), 0.07);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.28);
}

.sa-storefront.theme-dark .ofn-modal-card.is-completed .ofn-shop-msg {
  background: rgba(var(--sa-primary-bright-rgb), 0.14);
  border-color: rgba(var(--sa-primary-bright-rgb), 0.36);
}

.ofn-shop-msg-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
  color: var(--sa-accent, var(--sa-primary));
}

.ofn-modal-card.is-cancelled .ofn-shop-msg-head {
  color: #ef4444;
}

.sa-storefront.theme-dark .ofn-modal-card.is-cancelled .ofn-shop-msg-head {
  color: #fca5a5;
}

.sa-storefront.theme-dark .ofn-icon-badge.is-cancelled {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
}

.sa-storefront.theme-dark .ofn-icon-badge.is-message {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.ofn-shop-msg-text {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--sa-heading, #0f172a);
  white-space: pre-wrap;
  word-break: break-word;
}

.ofn-actions-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ofn-actions {
  width: 100%;
  display: flex;
  gap: 10px;
}

.ofn-btn {
  flex: 1;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: transform 0.14s ease, opacity 0.14s ease;
}

.ofn-btn.is-contact {
  width: 100%;
  flex: none;
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.36);
  color: #1d4ed8;
}

.sa-storefront.theme-dark .ofn-btn.is-contact {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(96, 165, 250, 0.45);
  color: #93c5fd;
}

.ofn-contact-img {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.ofn-btn.is-secondary {
  background: var(--sa-surface-2);
  border-color: var(--sa-border-strong);
  color: var(--sa-heading);
}

.ofn-btn.is-secondary:hover {
  background: var(--sa-pill-hover);
  border-color: var(--sa-accent);
}

.sa-storefront.theme-dark .ofn-btn.is-secondary {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.22);
  color: #f8fafc;
}

.sa-storefront.theme-dark .ofn-btn.is-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--sa-accent);
}

.ofn-btn.is-primary {
  background: linear-gradient(135deg, var(--sa-primary-bright), var(--sa-primary));
  color: #ffffff;
}

/* ========================================================
   ADD-TO-CART JUICE: FLOATING +N, FLY-TO-CART THUMB & JIGGLE
   ======================================================== */
.sa-float-qty-pop {
  position: fixed;
  z-index: 9998;
  pointer-events: none;
  user-select: none;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sa-secondary, #facc15);
  color: var(--sa-on-secondary, #0f172a);
  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
  will-change: transform, opacity;
}

.sa-fly-thumb {
  position: fixed;
  z-index: 9997;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  background: var(--sa-accent, #059669);
  color: var(--sa-on-primary, #ffffff);
  border: 2.5px solid #ffffff;
  box-shadow:
    0 8px 20px rgba(15, 23, 42, 0.28),
    0 0 0 2px rgba(var(--sa-primary-rgb, 5, 150, 105), 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  will-change: transform, opacity;
}

.sa-fly-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sa-cart-hit-jiggle {
  animation: saCartHitJiggle 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

@keyframes saCartHitJiggle {
  0% {
    transform: scale(1) rotate(0deg);
  }
  28% {
    transform: scale(1.2) rotate(-8deg);
  }
  58% {
    transform: scale(0.94) rotate(6deg);
  }
  82% {
    transform: scale(1.06) rotate(-2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.suggest-hl {
  background: rgba(250, 204, 21, 0.35);
  color: inherit;
  padding: 0 2px;
  border-radius: 4px;
  font-weight: 800;
}

.empty-menu-title {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  font-weight: 600;
}

.empty-menu-kw {
  font-weight: 800;
  color: var(--sa-price);
}

.empty-search-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.empty-search-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--sa-border-strong);
  background: var(--sa-surface);
  color: var(--sa-heading);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.empty-search-btn:hover {
  background: var(--sa-surface-2);
  border-color: var(--sa-accent);
}

.empty-search-btn.primary {
  border-color: var(--sa-accent);
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
}

.empty-search-btn.primary:hover {
  background: var(--sa-accent-hover);
}

.empty-quick-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
}

.empty-quick-label {
  font-size: 12.5px;
  color: var(--sa-muted);
  font-weight: 600;
}

.empty-quick-chip {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.empty-quick-chip:hover {
  background: rgba(var(--sa-primary-bright-rgb), 0.22);
  transform: translateY(-1px);
}

.srl-all-btn {
  margin-left: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--sa-border-green);
  background: var(--sa-surface-soft);
  color: var(--sa-price);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.srl-all-btn:hover {
  background: var(--sa-accent);
  border-color: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
}

/* ===== HIGH-CONTRAST TEXT ON ACCENT SURFACES (AUTO LIGHT/DARK & ALL PRESETS) ===== */
.sct-cat-pill:not(.sale):not(.is-parent-cat).active,
.pagination button.active,
.filter-btn.active,
.search-wrapper .filter-cat-btn.active,
.sub-cat-tree.is-modal .sub-cat-tree-item.active,
.mcb-action-cta:not(.is-update-red),
.save-btn,
.ck-btn,
.ck-amount,
.send-btn,
.copy-btn,
.lob-new-btn,
.join-group-btn,
.host-members-progress .hmp-count.all,
.dp-stepper button.dp-qty-plus,
.btn-qty:hover,
.modal-qty button:hover,
.fcm-step-btn:hover,
.dpt-step-btn:hover,
.ugm-nudge-again-btn:hover,
.gsm-copy-btn,
.ugm-proceed-btn,
.exm-channel-btn,
.exm-copy-inline-btn:hover,
.exm-copy-inline-btn.copied,
.dt24-col-opt.selected,
.dt24-now-btn:hover,
.dt24-preset-chip:active {
  color: var(--sa-on-accent, #ffffff);
}

/* ===== PRO VIP MEDALLION -> BEZIER COMET -> PROGRESS LOCK-ON ANIMATION ===== */
.sa-submit-fx-layer {
  position: fixed;
  inset: 0;
  z-index: 100050;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 16px 6vh;
  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
}

.sa-submit-fx-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 44%, rgba(16, 185, 129, 0.16) 0%, transparent 42%),
    radial-gradient(circle at 50% 46%, rgba(15, 23, 42, 0.42) 0%, rgba(2, 6, 23, 0.74) 100%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  opacity: 1;
  animation: saSfxBackdropIn 0.28s ease-out;
  transition: opacity 0.48s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity;
}

.sa-submit-fx-backdrop.is-fading {
  opacity: 0;
}

.sfx-hero-stage {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.sfx-medallion {
  position: relative;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}

.sfx-medallion.is-entering {
  animation: saSfxMedallionPop 0.56s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.sfx-aurora-halo {
  position: absolute;
  inset: -26px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(16, 185, 129, 0.52) 0%,
    rgba(250, 204, 21, 0.24) 44%,
    transparent 72%
  );
  filter: blur(12px);
  animation: saSfxHaloPulse 1.1s ease-in-out infinite alternate;
}

.sfx-sonar-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.8px solid rgba(110, 231, 183, 0.75);
  opacity: 0;
  animation: saSfxSonar 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards;
}

.sfx-sonar-ring.r2 {
  border-color: rgba(250, 204, 21, 0.65);
  animation-delay: 0.22s;
}

.sfx-medallion.is-condensing .sfx-sonar-ring,
.sfx-medallion.is-condensing .sfx-sparks {
  opacity: 0;
  transition: opacity 0.14s ease;
}

.sfx-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sfx-spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 3.5px;
  margin-left: -6px;
  margin-top: -1.75px;
  border-radius: 999px;
  background: linear-gradient(90deg, #6ee7b7, #10b981);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
  opacity: 0;
  animation: saSfxSparkShoot 0.68s cubic-bezier(0.16, 1, 0.3, 1) 0.14s forwards;
}

.sfx-spark.is-gold {
  width: 9px;
  margin-left: -4.5px;
  background: linear-gradient(90deg, #fef08a, #f59e0b);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.85);
  animation-delay: 0.18s;
}

.sfx-orbit-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  padding: 2.5px;
  background: conic-gradient(
    from 0deg,
    rgba(16, 185, 129, 0.15),
    #6ee7b7,
    #fde047,
    #10b981,
    rgba(16, 185, 129, 0.15)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: saSfxOrbitSpin 1.4s linear infinite;
}

.sfx-core-sphere {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.42) 0%, transparent 42%),
    linear-gradient(145deg, #34d399 0%, #059669 54%, #047857 100%);
  border: 2px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 18px 42px rgba(5, 150, 105, 0.52),
    0 0 28px rgba(16, 185, 129, 0.45),
    inset 0 2px 6px rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.sfx-medallion.is-condensing .sfx-core-sphere {
  background:
    radial-gradient(circle at 35% 30%, #ffffff 0%, #fef08a 28%, #10b981 68%, #059669 100%);
  box-shadow:
    0 0 32px rgba(250, 204, 21, 0.85),
    0 0 54px rgba(16, 185, 129, 0.85);
}

.sfx-check-svg {
  width: 58px;
  height: 58px;
  overflow: visible;
  filter: drop-shadow(0 3px 8px rgba(4, 120, 87, 0.45));
}

.sfx-svg-ring {
  stroke-dasharray: 172;
  stroke-dashoffset: 172;
  transform-origin: 32px 32px;
  transform: rotate(-90deg);
  animation: saSfxDrawRing 0.44s cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
}

.sfx-svg-tick {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: saSfxDrawTick 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
}

/* Frameless floating glass caption */
.sfx-float-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  text-align: center;
  animation: saSfxCaptionRise 0.46s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
  transition: opacity 0.22s ease, transform 0.24s cubic-bezier(0.4, 0, 1, 1);
}

.sfx-float-caption.is-dissolving {
  opacity: 0;
  transform: translate3d(0, -20px, 0) scale(0.84);
}

.sfx-caption-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    0 14px 34px rgba(2, 6, 23, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.sfx-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(2, 6, 23, 0.45);
}

.sfx-code-pill {
  padding: 3px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.24), rgba(16, 185, 129, 0.28));
  border: 1px solid rgba(253, 224, 71, 0.55);
  color: #fef08a;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.sfx-sub {
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(241, 245, 249, 0.88);
  text-shadow: 0 2px 8px rgba(2, 6, 23, 0.65);
  letter-spacing: 0.01em;
}

/* 60fps Bezier Comet Tail Dots */
.sfx-comet-dot {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 4;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0%, #6ee7b7 45%, rgba(16, 185, 129, 0) 100%);
  box-shadow: 0 0 14px rgba(52, 211, 153, 0.9);
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
}

.sfx-comet-dot.is-gold {
  background: radial-gradient(circle, #ffffff 0%, #fde047 45%, rgba(245, 158, 11, 0) 100%);
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.9);
}

/* Exact-coordinate Impact Starburst on Progress Node */
.sfx-impact-burst {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 5;
  width: 0;
  height: 0;
  pointer-events: none;
}

.sfx-impact-ring {
  position: absolute;
  left: -32px;
  top: -32px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2.5px solid #10b981;
  animation: saSfxImpactRing 0.54s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.sfx-impact-ring.r2 {
  border-color: #facc15;
  border-width: 2px;
  animation-delay: 0.07s;
}

.sfx-impact-flash {
  position: absolute;
  left: -26px;
  top: -26px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(52, 211, 153, 0.55) 45%, transparent 72%);
  animation: saSfxImpactFlash 0.38s ease-out forwards;
}

/* Pre-drop hold & landing impact on Export Modal progress bar */
.grab-status-card.in-export-modal {
  position: relative;
  overflow: hidden;
}

.grab-status-card.in-export-modal.is-pre-drop .gs-rail-fill {
  width: 0% !important;
  transition: none !important;
}

.grab-status-card.in-export-modal.is-pre-drop .gs-step.is-current .gs-node {
  transform: scale(0.92);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.22);
}

.grab-status-card.in-export-modal.is-drop-hit {
  animation: saProgressCardCatch 0.76s cubic-bezier(0.22, 1, 0.36, 1);
  border-color: #10b981 !important;
}

.grab-status-card.in-export-modal.is-drop-hit::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    108deg,
    transparent 12%,
    rgba(52, 211, 153, 0.24) 44%,
    rgba(250, 204, 21, 0.26) 54%,
    transparent 86%
  );
  transform: translateX(-110%);
  animation: saProgressCardSweep 0.78s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  pointer-events: none;
  z-index: 3;
}

.grab-status-card.in-export-modal.is-drop-hit .gs-step.is-current .gs-node {
  animation: saProgressNodePop 0.62s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.exm-saved-pill.is-pop {
  animation: saProgressNodePop 0.54s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes saSfxBackdropIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes saSfxMedallionPop {
  0% {
    opacity: 0;
    transform: scale(0.42) translate3d(0, 18px, 0);
  }
  58% {
    opacity: 1;
    transform: scale(1.08) translate3d(0, -2px, 0);
  }
  80% {
    opacity: 1;
    transform: scale(0.97) translate3d(0, 0, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translate3d(0, 0, 0);
  }
}

@keyframes saSfxHaloPulse {
  0% {
    transform: scale(0.92);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.12);
    opacity: 1;
  }
}

@keyframes saSfxSonar {
  0% {
    transform: scale(0.88);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.88);
    opacity: 0;
  }
}

@keyframes saSfxSparkShoot {
  0% {
    opacity: 0;
    transform: rotate(var(--sfx-ang)) translateX(30px) scaleX(0.3);
  }
  28% {
    opacity: 1;
    transform: rotate(var(--sfx-ang)) translateX(52px) scaleX(1.15);
  }
  100% {
    opacity: 0;
    transform: rotate(var(--sfx-ang)) translateX(74px) scaleX(0.2);
  }
}

@keyframes saSfxOrbitSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes saSfxDrawRing {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes saSfxDrawTick {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes saSfxCaptionRise {
  0% {
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes saSfxImpactRing {
  0% {
    transform: scale(0.25);
    opacity: 1;
  }
  100% {
    transform: scale(1.65);
    opacity: 0;
  }
}

@keyframes saSfxImpactFlash {
  0% {
    transform: scale(0.35);
    opacity: 1;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

@keyframes saProgressCardCatch {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.56);
  }
  28% {
    transform: scale(1.028);
    box-shadow:
      0 12px 30px rgba(16, 185, 129, 0.26),
      0 0 0 5px rgba(16, 185, 129, 0.24);
  }
  65% {
    transform: scale(0.995);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

@keyframes saProgressCardSweep {
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(115%);
  }
}

@keyframes saProgressNodePop {
  0% {
    transform: scale(0.8);
  }
  45% {
    transform: scale(1.38);
  }
  100% {
    transform: scale(1.06);
  }
}
</style>










