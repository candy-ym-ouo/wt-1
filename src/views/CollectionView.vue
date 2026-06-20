<template>
  <div class="collection-view">
    <div class="tabs-section">
      <div class="tabs-wrapper">
        <button 
          :class="['tab-btn', { active: activeTab === 'collection' }]"
          @click="activeTab = 'collection'"
        >
          <span class="tab-icon">📖</span>
          <span class="tab-label">矿物图鉴</span>
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'log' }]"
          @click="activeTab = 'log'"
        >
          <span class="tab-icon">📜</span>
          <span class="tab-label">发现日志</span>
          <span class="tab-badge" v-if="gameStore.discoveryLogs.length > 0">
            {{ gameStore.discoveryLogs.length }}
          </span>
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'detector' }]"
          @click="activeTab = 'detector'"
        >
          <span class="tab-icon">🛠️</span>
          <span class="tab-label">探测器养成</span>
          <span class="tab-badge" v-if="detectorStore.canUpgrade()">!</span>
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'collection'">
      <div class="collection-header">
        <div class="header-content">
          <h1 class="page-title">矿物图鉴</h1>
          <p class="page-subtitle">探索矿物的奥秘，了解它们的特性与传说</p>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-card">
          <div class="progress-info">
            <span class="progress-label">收集进度</span>
            <span class="progress-value">{{ progress.collected }}/{{ progress.total }}</span>
          </div>
          <div class="progress-bar-large">
            <div class="progress-fill" :style="{ width: `${progress.percentage}%` }"></div>
          </div>
          <div class="progress-text">{{ progress.percentage }}% 完成</div>
        </div>
        <div class="progress-card knowledge-progress-card">
          <div class="progress-info">
            <span class="progress-label">📇 知识卡片</span>
            <span class="progress-value purple">{{ researchProgress.unlocked }}/{{ researchProgress.total }}</span>
          </div>
          <div class="progress-bar-large">
            <div
              class="progress-fill knowledge-fill"
              :style="{ width: `${researchProgress.percentage}%` }"
            ></div>
          </div>
          <div class="progress-text">
            {{ researchProgress.percentage }}% 已解锁
            <span class="research-link" @click="goToResearch">去研究院 →</span>
          </div>
        </div>
      </div>

      <div class="exchange-balance-bar">
        <div class="balance-item token-balance">
          <span class="balance-icon">{{ exchangeStore.tokenInfo.emoji }}</span>
          <div class="balance-content">
            <span class="balance-label">{{ exchangeStore.tokenInfo.name }}</span>
            <span class="balance-value">{{ exchangeStore.tokenInfo.balance }}</span>
          </div>
        </div>
        <div class="balance-item items-balance">
          <span class="balance-icon">🎒</span>
          <div class="balance-content">
            <span class="balance-label">道具库存</span>
            <span class="balance-value">{{ exchangeStore.inventoryItems.reduce((s, i) => s + i.count, 0) }} 件</span>
          </div>
        </div>
        <div class="balance-item duplicate-balance">
          <span class="balance-icon">♻️</span>
          <div class="balance-content">
            <span class="balance-label">可兑换矿物</span>
            <span class="balance-value">{{ totalDuplicateValue }} 价值</span>
          </div>
        </div>
      </div>

      <div class="search-section">
        <div class="search-box" :class="{ focused: showQuickJump }">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索矿物名 / 英文名 / 化学式...（按回车快速跳转）"
            @focus="showQuickJump = true"
            @blur="setTimeout(() => showQuickJump = false, 200)"
            @keydown="handleQuickJumpKeydown"
          />
          <kbd v-if="!searchKeyword" class="search-hint">⌘K</kbd>
          <div v-if="showQuickJump && quickJumpCandidates.length > 0" class="quick-jump-dropdown">
            <div class="quick-jump-title">⚡ 快速跳转</div>
            <div
              v-for="mineral in quickJumpCandidates"
              :key="mineral.id"
              class="quick-jump-item"
              :class="{ collected: isMineralCollected(mineral.id) }"
              @mousedown.prevent="doQuickJump(mineral)"
            >
              <span class="qj-emoji">{{ isMineralCollected(mineral.id) ? mineral.emoji : '❓' }}</span>
              <div class="qj-info">
                <span class="qj-name">{{ isMineralCollected(mineral.id) ? mineral.name : '???' }}</span>
                <span class="qj-sub">{{ isMineralCollected(mineral.id) ? `${mineral.nameEn} · ${mineral.formula}` : '未收集' }}</span>
              </div>
              <span :class="['qj-rarity', `rarity-${mineral.rarity}`]">{{ RARITY_CONFIG[mineral.rarity].name }}</span>
              <span class="qj-arrow">→</span>
            </div>
          </div>
        </div>
        <button
          :class="['advanced-filter-toggle', { active: showAdvancedFilters, 'has-active': hasActiveAdvancedFilters }]"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <span class="af-icon">🎯</span>
          <span>高级筛选</span>
          <span v-if="hasActiveAdvancedFilters" class="af-badge">●</span>
        </button>
      </div>

      <Transition name="slide-down">
        <div v-if="showAdvancedFilters" class="advanced-filters-panel">
          <div class="af-row">
            <div class="af-group">
              <label class="af-label">🌍 产地筛选</label>
              <select class="af-select" :value="advancedFilters.origin" @change="setOriginFilter($event.target.value)">
                <option v-for="f in ORIGIN_FILTERS" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
            </div>
            <div class="af-group">
              <label class="af-label">⚒️ 用途筛选</label>
              <select class="af-select" :value="advancedFilters.use" @change="setUseFilter($event.target.value)">
                <option v-for="f in USE_FILTERS" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
            </div>
          </div>
          <div class="af-row">
            <div class="af-group">
              <label class="af-label">💎 硬度等级</label>
              <div class="af-chips">
                <button
                  v-for="f in HARDNESS_FILTERS"
                  :key="f.value"
                  :class="['af-chip', { active: advancedFilters.hardness === f.value }]"
                  @click="setHardnessFilter(f.value)"
                >{{ f.label }}</button>
              </div>
            </div>
            <div class="af-group">
              <label class="af-label">📦 收集次数</label>
              <div class="af-chips">
                <button
                  v-for="f in COLLECTION_COUNT_FILTERS"
                  :key="f.value"
                  :class="['af-chip', { active: advancedFilters.count === f.value }]"
                  @click="setCountFilter(f.value)"
                >{{ f.label }}</button>
              </div>
            </div>
          </div>
          <div class="af-actions">
            <button class="btn btn-small btn-reset-af" @click="resetAdvancedFilters">
              ↺ 重置筛选
            </button>
            <span class="af-result-count">
              匹配 <strong>{{ filteredMinerals.length }}</strong> / {{ ALL_MINERALS_WITH_SEASON.length }} 种矿物
            </span>
          </div>
        </div>
      </Transition>

      <div class="filter-section">
        <div class="filter-tabs">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            :class="['filter-btn', { active: activeFilter === filter.value }]"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <div class="view-toggle">
          <button 
            :class="['toggle-btn', { active: viewMode === 'grid' }]"
            @click="updateViewMode('grid')"
          >
            网格
          </button>
          <button 
            :class="['toggle-btn', { active: viewMode === 'list' }]"
            @click="updateViewMode('list')"
          >
            列表
          </button>
        </div>
      </div>

      <div class="action-bar">
        <button class="btn btn-small warehouse-entry-btn" @click="goToWarehouse">
          <span class="btn-icon">🏭</span>
          仓储管理
        </button>
        <button class="btn btn-small research-collection-entry-btn" @click="goToResearch">
          <span class="btn-icon">🔬</span>
          矿物研究院
        </button>
        <button class="btn btn-small" @click="goToMarket">
          <span class="btn-icon">🏪</span>
          前往市场
        </button>
        <button
          class="btn btn-secondary btn-small"
          @click="openListModal"
          :disabled="gameStore.collectedMinerals.length === 0"
        >
          <span class="btn-icon">📤</span>
          上架矿物
        </button>
        <button
          class="btn btn-small exchange-entry-btn"
          @click="goToExchange"
        >
          <span class="btn-icon">🔄</span>
          交换站
        </button>
        <button
          v-if="duplicateMineralCount > 0"
          class="btn btn-small batch-exchange-btn"
          @click="openBatchExchange"
        >
          <span class="btn-icon">♻️</span>
          批量兑换 ({{ duplicateMineralCount }})
        </button>
      </div>

      <div class="rarity-legend">
        <div 
          v-for="(config, rarity) in RARITY_CONFIG" 
          :key="rarity"
          class="legend-item"
        >
          <span class="legend-dot" :style="{ background: config.color }"></span>
          <span :class="`rarity-${rarity}`">{{ config.name }}</span>
          <span class="legend-count">{{ getRarityCount(rarity) }}</span>
        </div>
      </div>

      <div class="season-specimens-section" v-if="seasonLimitedSpecimens.length > 0">
        <div class="section-header-row">
          <h2 class="section-label">🔮 赛季限定标本</h2>
          <button class="btn btn-small season-go-btn" @click="goToSeason">
            查看赛季 →
          </button>
        </div>
        <div class="season-specimens-row">
          <div
            v-for="specimen in seasonLimitedSpecimens"
            :key="specimen.id"
            class="season-specimen-card"
            :class="{ collected: isSeasonSpecimenCollected(specimen.id), [`rarity-${specimen.rarity}`]: true }"
            @click="viewSeasonSpecimen(specimen)"
          >
            <div class="specimen-exclusive-tag">限定</div>
            <span class="specimen-emoji-small">{{ specimen.emoji }}</span>
            <span class="specimen-name-small">{{ specimen.name }}</span>
            <span class="specimen-status" v-if="!isSeasonSpecimenCollected(specimen.id)">🔒</span>
            <span class="specimen-status collected-status" v-else>✓</span>
          </div>
        </div>
      </div>

      <div class="minerals-container">
        <div v-if="filteredMinerals.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <p class="empty-text">没有找到符合条件的矿物</p>
        </div>

        <div v-else-if="viewMode === 'grid'" class="minerals-grid">
          <MineralCard
            v-for="mineral in filteredMinerals"
            :key="mineral.id"
            :mineral="mineral"
            :is-collected="isMineralCollected(mineral.id)"
            :show-locked="true"
            :glow="isMineralCollected(mineral.id) && mineral.rarity === 'legendary'"
            :knowledge-card-count="getMineralUnlockedCardCount(mineral.id)"
            :total-knowledge-cards="getMineralTotalCardCount(mineral.id)"
            :is-favorite="museumStore.isFavorite(mineral.id)"
            @click="viewMineralDetail"
          />
        </div>

        <div v-else class="minerals-list">
          <div 
            v-for="mineral in filteredMinerals"
            :key="mineral.id"
            :class="['list-item', { collected: isMineralCollected(mineral.id) }]"
            @click="viewMineralDetail(mineral)"
          >
            <div class="item-emoji-wrap">
              <span class="item-emoji">{{ isMineralCollected(mineral.id) ? mineral.emoji : '❓' }}</span>
              <div
                v-if="isMineralCollected(mineral.id) && getMineralUnlockedCardCount(mineral.id) > 0"
                class="list-kb-badge"
                :title="`已解锁 ${getMineralUnlockedCardCount(mineral.id)}/${getMineralTotalCardCount(mineral.id)} 张知识卡片`"
              >
                📇 {{ getMineralUnlockedCardCount(mineral.id) }}
              </div>
            </div>
            <div class="item-content">
              <div class="item-header">
                <h3 class="item-name">{{ isMineralCollected(mineral.id) ? mineral.name : '???' }}</h3>
                <span :class="['item-rarity', `rarity-${mineral.rarity}`]">
                  {{ RARITY_CONFIG[mineral.rarity].name }}
                </span>
              </div>
              <p class="item-desc">
                {{ isMineralCollected(mineral.id) ? mineral.description.slice(0, 50) + '...' : '完成拼装解锁详情' }}
              </p>
              <div class="item-meta" v-if="isMineralCollected(mineral.id)">
                <span class="meta-item">化学式: {{ mineral.formula }}</span>
                <span class="meta-item">硬度: {{ mineral.hardness }}</span>
                <span class="meta-item">数量: {{ getMineralCount(mineral.id) }}</span>
              </div>
            </div>
            <div class="item-actions" v-if="isMineralCollected(mineral.id)" @click.stop>
              <button 
                class="btn btn-small list-btn" 
                @click="listMineral(mineral)"
                :disabled="getMineralCount(mineral.id) < 1"
              >
                📤 上架
              </button>
            </div>
            <span class="item-arrow" v-else>›</span>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'log'">
      <div class="log-header-section">
        <div class="log-header-content">
          <h1 class="page-title">📜 发现日志</h1>
          <p class="page-subtitle">记录每一次矿物发现的精彩时刻</p>
        </div>
      </div>
      <DiscoveryLog />
    </div>

    <div v-show="activeTab === 'detector'">
      <div class="detector-header">
        <h1 class="page-title">🔧 矿物探测器</h1>
        <p class="page-subtitle">升级探测器，提升矿物发现概率和品质</p>
      </div>

      <div class="coins-indicator">
        <span class="coins-icon">💰</span>
        <span class="coins-value">{{ gameStore.coins.toLocaleString() }}</span>
        <span class="coins-label">金币</span>
      </div>

      <div class="tier-selector">
        <div class="tier-scroll">
          <button
            v-for="(config, tier) in DETECTOR_TIER_CONFIG"
            :key="tier"
            :class="[
              'tier-card',
              { 
                active: detectorStore.currentTier === tier,
                unlocked: detectorStore.unlockedTiers.includes(tier),
                locked: !detectorStore.unlockedTiers.includes(tier)
              }
            ]"
            @click="handleTierClick(tier)"
          >
            <div class="tier-emoji" :style="{ background: config.gradient }">
              {{ detectorStore.unlockedTiers.includes(tier) ? config.emoji : '🔒' }}
            </div>
            <div class="tier-name">{{ config.name }}</div>
            <div class="tier-unlock" v-if="!detectorStore.unlockedTiers.includes(tier)">
              {{ config.unlockCost.toLocaleString() }} 💰
            </div>
            <div class="tier-level" v-else-if="detectorStore.currentTier === tier">
              Lv.{{ detectorStore.currentLevel }}
            </div>
          </button>
        </div>
      </div>

      <div class="detector-main-card" :style="{ borderColor: detectorStore.currentTierConfig.borderColor || 'rgba(255,255,255,0.1)' }">
        <div class="detector-top-section">
          <div class="detector-visual">
            <div class="detector-circle" :style="{ background: detectorStore.currentTierConfig.gradient }">
              <span class="detector-emoji-big">{{ detectorStore.currentTierConfig.emoji }}</span>
              <div class="scan-ring"></div>
              <div class="scan-ring delay-1"></div>
            </div>
          </div>
          <div class="detector-info">
            <h2 class="detector-name" :style="{ color: detectorStore.currentTierConfig.color }">
              {{ detectorStore.currentTierConfig.name }}
            </h2>
            <p class="detector-desc">{{ detectorStore.currentTierConfig.description }}</p>
            
            <div class="level-section">
              <div class="level-info">
                <span class="level-label">等级</span>
                <span class="level-value">
                  Lv.{{ detectorStore.currentLevel }}
                  <span class="level-max">/ {{ detectorStore.currentTierConfig.maxLevel }}</span>
                </span>
              </div>
              <div class="exp-bar-wrapper">
                <div class="exp-bar">
                  <div 
                    class="exp-fill" 
                    :style="{ 
                      width: `${detectorStore.expPercentage}%`,
                      background: detectorStore.currentTierConfig.gradient
                    }"
                  ></div>
                </div>
                <span class="exp-text">
                  {{ Math.floor(detectorStore.currentExp) }} / {{ detectorStore.expToNextLevel }} EXP
                </span>
              </div>
            </div>

            <div class="upgrade-section">
              <button 
                class="btn btn-upgrade"
                :disabled="!detectorStore.canUpgrade()"
                @click="handleUpgrade"
                :style="{ 
                  background: detectorStore.maxLevelReached 
                    ? 'linear-gradient(135deg, #6b7280, #9ca3af)' 
                    : detectorStore.currentTierConfig.gradient 
                }"
              >
                <span v-if="detectorStore.maxLevelReached">✨ 已达最高等级</span>
                <template v-else>
                  <span class="upgrade-label">⬆️ 升级</span>
                  <span class="upgrade-cost">{{ detectorStore.upgradeCostAmount.toLocaleString() }} 💰</span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3 class="section-title">📊 效果加成</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">💎</span>
              <span class="stat-name">稀有度提升</span>
            </div>
            <div class="stat-values">
              <span class="stat-base">基础 +{{ detectorStore.baseStats.rarityBonus }}</span>
              <span class="stat-arrow">→</span>
              <span class="stat-total" :style="{ color: detectorStore.currentTierConfig.color }">
                +{{ detectorStore.totalStats.rarityBonus }} 级
              </span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">🎯</span>
              <span class="stat-name">掉落率提升</span>
            </div>
            <div class="stat-values">
              <span class="stat-base">基础 +{{ detectorStore.baseStats.dropRateBonus }}%</span>
              <span class="stat-arrow">→</span>
              <span class="stat-total" :style="{ color: detectorStore.currentTierConfig.color }">
                +{{ detectorStore.totalStats.dropRateBonus }}%
              </span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">💰</span>
              <span class="stat-name">金币加成</span>
            </div>
            <div class="stat-values">
              <span class="stat-base">基础 +{{ detectorStore.baseStats.coinBonus }}%</span>
              <span class="stat-arrow">→</span>
              <span class="stat-total" :style="{ color: detectorStore.currentTierConfig.color }">
                +{{ detectorStore.totalStats.coinBonus }}%
              </span>
            </div>
          </div>
          <div class="stat-card" v-if="detectorStore.totalStats.multiDropChance > 0">
            <div class="stat-header">
              <span class="stat-icon">🎊</span>
              <span class="stat-name">多重掉落</span>
            </div>
            <div class="stat-values">
              <span class="stat-total" :style="{ color: detectorStore.currentTierConfig.color }">
                {{ detectorStore.totalStats.multiDropChance }}% 概率
              </span>
            </div>
          </div>
          <div class="stat-card" v-if="detectorStore.totalStats.expeditionBonus > 0">
            <div class="stat-header">
              <span class="stat-icon">🗺️</span>
              <span class="stat-name">探险加成</span>
            </div>
            <div class="stat-values">
              <span class="stat-total" :style="{ color: detectorStore.currentTierConfig.color }">
                +{{ detectorStore.totalStats.expeditionBonus }}%
              </span>
            </div>
          </div>
          <div 
            v-for="(bonus, rarity) in detectorStore.totalStats.specificRarityBonus" 
            :key="rarity"
            class="stat-card specific-rarity-card"
          >
            <div class="stat-header">
              <span class="stat-icon">✨</span>
              <span class="stat-name">
                {{ { rare: '珍稀', epic: '史诗', legendary: '传说' }[rarity] }}概率
              </span>
            </div>
            <div class="stat-values">
              <span class="stat-total" :style="{ color: RARITY_CONFIG[rarity].color }">
                +{{ bonus }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="affixes-section">
        <div class="affixes-header">
          <h3 class="section-title">🔮 词条系统</h3>
          <div class="affixes-count">
            {{ detectorStore.affixes.length }} / {{ detectorStore.maxAffixSlotsCount }}
          </div>
        </div>

        <div class="affixes-grid">
          <div
            v-for="affix in detectorStore.affixes"
            :key="affix.id"
            class="affix-card"
            :style="{ borderColor: AFFIX_QUALITY_CONFIG[affix.quality].color + '66' }"
          >
            <div 
              class="affix-quality-bar"
              :style="{ background: AFFIX_QUALITY_CONFIG[affix.quality].color }"
            ></div>
            <div class="affix-content">
              <div class="affix-top">
                <span 
                  class="affix-quality-tag"
                  :style="{ 
                    background: AFFIX_QUALITY_CONFIG[affix.quality].color + '22',
                    color: AFFIX_QUALITY_CONFIG[affix.quality].color 
                  }"
                >
                  {{ AFFIX_QUALITY_CONFIG[affix.quality].name }}
                </span>
                <button 
                  class="affix-reroll-btn"
                  @click="handleRerollAffix(affix.id)"
                  :disabled="!detectorStore.canRerollAffix()"
                  :title="`重铸 (${detectorStore.rerollCostAmount} 金币)`"
                >
                  🔄
                </button>
              </div>
              <div class="affix-text">{{ detectorStore.getAffixDisplay(affix) }}</div>
            </div>
          </div>

          <div
            v-for="i in detectorStore.availableAffixSlots"
            :key="'empty-' + i"
            class="affix-card empty-affix"
          >
            <div class="empty-affix-content">
              <span class="empty-affix-icon">+</span>
              <span class="empty-affix-text">升级解锁词条</span>
            </div>
          </div>
        </div>

        <div class="affix-actions">
          <button 
            class="btn btn-reroll-all"
            @click="handleRerollAllAffixes"
            :disabled="!detectorStore.canRerollAffix()"
          >
            <span>🔄 重铸最后词条</span>
            <span class="action-cost">{{ detectorStore.rerollCostAmount.toLocaleString() }} 💰</span>
          </button>
        </div>
      </div>

      <div class="detector-tips-section">
        <h3 class="section-title">💡 使用说明</h3>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-icon">🎯</span>
            <div class="tip-content">
              <strong>稀有度提升：</strong>拼装、探险、盲盒中获得更高稀有度矿物的概率提升
            </div>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🎰</span>
            <div class="tip-content">
              <strong>掉落率提升：</strong>探险时矿物掉落基础概率提升（最大95%）
            </div>
          </div>
          <div class="tip-item">
            <span class="tip-icon">💰</span>
            <div class="tip-content">
              <strong>金币加成：</strong>获得矿物和完成拼装时额外获得金币奖励
            </div>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🎊</span>
            <div class="tip-content">
              <strong>多重掉落：</strong>有概率一次获得2-3个相同矿物
            </div>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🔮</span>
            <div class="tip-content">
              <strong>词条重铸：</strong>使用金币刷新词条品质和类型，追求最佳组合
            </div>
          </div>
        </div>
      </div>

      <div class="upgrade-stats">
        <div class="upgrade-stat-item">
          <span class="stat-label">累计升级</span>
          <span class="stat-value">{{ detectorStore.totalUpgrades }} 次</span>
        </div>
        <div class="upgrade-stat-item">
          <span class="stat-label">累计重铸</span>
          <span class="stat-value">{{ detectorStore.totalRerolls }} 次</span>
        </div>
      </div>
    </div>

    <BatchExchangeModal
      :visible="showBatchExchange"
      @close="showBatchExchange = false"
    />

    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastMessage" class="detector-toast" :class="{ success: toastSuccess, error: !toastSuccess }">
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MineralCard from '@/components/MineralCard.vue'
import DiscoveryLog from '@/components/DiscoveryLog.vue'
import BatchExchangeModal from '@/components/BatchExchangeModal.vue'
import { useGameStore } from '@/stores/game'
import { useAudioStore } from '@/stores/audio'
import { useMarketStore } from '@/stores/market'
import { useSeasonStore } from '@/stores/season'
import { useDetectorStore } from '@/stores/detector'
import { useResearchStore } from '@/stores/research'
import { useMuseumStore } from '@/stores/museum'
import { useExchangeStore } from '@/stores/exchange'
import { RARITY_CONFIG, RARITY } from '@/data/rarity'
import { 
  MINERALS, 
  ORIGIN_FILTERS, 
  USE_FILTERS, 
  HARDNESS_FILTERS, 
  COLLECTION_COUNT_FILTERS,
  parseHardness
} from '@/data/minerals'
import { SEASONS } from '@/data/season'
import { getKnowledgeCardsByMineralId } from '@/data/research'
import { 
  DETECTOR_TIER_CONFIG, 
  DETECTOR_TIERS,
  AFFIX_QUALITY_CONFIG
} from '@/data/detector'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()
const marketStore = useMarketStore()
const seasonStore = useSeasonStore()
const detectorStore = useDetectorStore()
const researchStore = useResearchStore()
const museumStore = useMuseumStore()
const exchangeStore = useExchangeStore()

const activeTab = ref('collection')
const toastMessage = ref('')
const toastSuccess = ref(true)
const showBatchExchange = ref(false)
let toastTimer = null

const showToast = (message, success = true) => {
  toastMessage.value = message
  toastSuccess.value = success
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
}

const handleTierClick = (tier) => {
  audioStore.playClick()
  if (!detectorStore.unlockedTiers.includes(tier)) {
    const result = detectorStore.unlockTier(tier)
    showToast(result.message, result.success)
    if (result.success) {
      audioStore.playSuccess?.()
    } else {
      audioStore.playError()
    }
  } else if (detectorStore.currentTier !== tier) {
    const result = detectorStore.switchTier(tier)
    if (result.success) {
      showToast(`切换至 ${DETECTOR_TIER_CONFIG[tier].name}`, true)
    }
  }
}

const handleUpgrade = () => {
  audioStore.playClick()
  const result = detectorStore.upgradeLevel()
  showToast(result.message, result.success)
  if (result.success) {
    audioStore.playSuccess?.()
  } else {
    audioStore.playError()
  }
}

const handleRerollAffix = (affixId) => {
  audioStore.playClick()
  const result = detectorStore.rerollAffix(affixId)
  showToast(result.message, result.success)
  if (result.success) {
    audioStore.playSuccess?.()
  } else {
    audioStore.playError()
  }
}

const handleRerollAllAffixes = () => {
  audioStore.playClick()
  const result = detectorStore.rerollAffix()
  showToast(result.message, result.success)
  if (result.success) {
    audioStore.playSuccess?.()
  } else {
    audioStore.playError()
  }
}

const getSeasonLimitedMinerals = () => {
  const list = []
  for (const season of SEASONS) {
    if (season.limitedSpecimens) {
      for (const specimen of season.limitedSpecimens) {
        list.push({
          ...specimen,
          seasonId: season.id,
          seasonName: season.name
        })
      }
    }
  }
  return list
}

const ALL_MINERALS_WITH_SEASON = computed(() => {
  return [...MINERALS, ...getSeasonLimitedMinerals()]
})

const VIEW_MODE_KEY = 'collection_view_mode'
const ADVANCED_FILTERS_KEY = 'collection_advanced_filters'

const loadSavedViewMode = () => {
  try {
    const saved = localStorage.getItem(VIEW_MODE_KEY)
    return saved === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

const loadSavedAdvancedFilters = () => {
  try {
    const saved = localStorage.getItem(ADVANCED_FILTERS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return {
    origin: 'all',
    use: 'all',
    hardness: 'all',
    count: 'all'
  }
}

const activeFilter = ref('all')
const viewMode = ref(loadSavedViewMode())
const showAdvancedFilters = ref(false)
const searchKeyword = ref('')
const showQuickJump = ref(false)
const quickJumpTarget = ref(null)

const advancedFilters = ref(loadSavedAdvancedFilters())

const updateViewMode = (mode) => {
  viewMode.value = mode
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {}
}

const persistAdvancedFilters = () => {
  try {
    localStorage.setItem(ADVANCED_FILTERS_KEY, JSON.stringify(advancedFilters.value))
  } catch {}
}

const resetAdvancedFilters = () => {
  advancedFilters.value = {
    origin: 'all',
    use: 'all',
    hardness: 'all',
    count: 'all'
  }
  persistAdvancedFilters()
}

const setOriginFilter = (val) => {
  advancedFilters.value.origin = val
  persistAdvancedFilters()
}
const setUseFilter = (val) => {
  advancedFilters.value.use = val
  persistAdvancedFilters()
}
const setHardnessFilter = (val) => {
  advancedFilters.value.hardness = val
  persistAdvancedFilters()
}
const setCountFilter = (val) => {
  advancedFilters.value.count = val
  persistAdvancedFilters()
}

const filters = [
  { label: '全部', value: 'all' },
  { label: '已收集', value: 'collected' },
  { label: '未收集', value: 'uncollected' },
  { label: '赛季限定', value: 'season' },
  { label: '研究解锁', value: 'has_research' },
  { label: '传说', value: RARITY.LEGENDARY },
  { label: '史诗', value: RARITY.EPIC },
  { label: '珍稀', value: RARITY.RARE }
]

const progress = computed(() => {
  const all = ALL_MINERALS_WITH_SEASON.value
  const collected = all.filter(m => gameStore.isMineralCollected(m.id)).length
  return {
    collected,
    total: all.length,
    percentage: Math.round((collected / all.length) * 100)
  }
})

const researchProgress = computed(() => researchStore.cardStats)

const getMineralUnlockedCardCount = (mineralId) => {
  return researchStore.getCardsForMineral(mineralId).length
}

const getMineralTotalCardCount = (mineralId) => {
  return getKnowledgeCardsByMineralId(mineralId).length
}

const getMineralCountFromStore = (id) => {
  const m = gameStore.collectedMinerals.find(m => m.id === id)
  return m?.count || 0
}

const matchOrigin = (originField, filterValue) => {
  if (!filterValue || filterValue === 'all') return true
  if (!originField) return false
  if (filterValue === 'other') {
    return !ORIGIN_FILTERS.slice(1, -1).some(f => originField.includes(f.value))
  }
  return originField.includes(filterValue)
}

const matchUse = (useField, filterValue) => {
  if (!filterValue || filterValue === 'all') return true
  if (!useField) return false
  const keywordMap = {
    '珠宝': ['珠宝', '首饰', '生辰石', '宝石'],
    '工业': ['工业', '磨料'],
    '光学': ['光学', '镜头'],
    '建筑': ['建筑', '水泥'],
    '装饰': ['装饰', '工艺'],
    '电子': ['电子', '压电', '钟表'],
    '冶金': ['冶金', '硫磺', '硫酸'],
    '陶瓷': ['陶瓷', '玻璃'],
    '收藏': ['收藏']
  }
  const keywords = keywordMap[filterValue] || [filterValue]
  return keywords.some(k => useField.includes(k))
}

const matchHardness = (hardnessField, filterValue) => {
  if (!filterValue || filterValue === 'all') return true
  const filterConfig = HARDNESS_FILTERS.find(f => f.value === filterValue)
  if (!filterConfig) return true
  const h = parseHardness(hardnessField)
  return h >= filterConfig.min && h <= filterConfig.max
}

const matchCount = (countValue, filterValue) => {
  if (!filterValue || filterValue === 'all') return true
  if (filterValue === '0') return countValue === 0
  if (filterValue === '1-2') return countValue >= 1 && countValue <= 2
  if (filterValue === '3-5') return countValue >= 3 && countValue <= 5
  if (filterValue === '6+') return countValue >= 6
  return true
}

const filteredMinerals = computed(() => {
  let minerals = [...ALL_MINERALS_WITH_SEASON.value].sort((a, b) => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })

  if (activeFilter.value === 'collected') {
    minerals = minerals.filter(m => gameStore.isMineralCollected(m.id))
  } else if (activeFilter.value === 'uncollected') {
    minerals = minerals.filter(m => !gameStore.isMineralCollected(m.id))
  } else if (activeFilter.value === 'season') {
    minerals = minerals.filter(m => m.seasonExclusive)
  } else if (activeFilter.value === 'has_research') {
    minerals = minerals.filter(m => {
      if (!gameStore.isMineralCollected(m.id)) return false
      return getMineralUnlockedCardCount(m.id) > 0
    })
  } else if (activeFilter.value !== 'all') {
    minerals = minerals.filter(m => m.rarity === activeFilter.value)
  }

  const af = advancedFilters.value
  minerals = minerals.filter(m => {
    if (!matchOrigin(m.origin, af.origin)) return false
    if (!matchUse(m.uses, af.use)) return false
    if (!matchHardness(m.hardness, af.hardness)) return false
    const countVal = gameStore.isMineralCollected(m.id) ? getMineralCountFromStore(m.id) : 0
    if (!matchCount(countVal, af.count)) return false
    return true
  })

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    minerals = minerals.filter(m => {
      const name = (m.name || '').toLowerCase()
      const nameEn = (m.nameEn || '').toLowerCase()
      const formula = (m.formula || '').toLowerCase()
      const desc = (m.description || '').toLowerCase()
      return name.includes(kw) || nameEn.includes(kw) || formula.includes(kw) || desc.includes(kw)
    })
  }

  return minerals
})

const hasActiveAdvancedFilters = computed(() => {
  const af = advancedFilters.value
  return af.origin !== 'all' || af.use !== 'all' || af.hardness !== 'all' || af.count !== 'all'
})

const quickJumpCandidates = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return []
  return ALL_MINERALS_WITH_SEASON.value
    .filter(m => {
      const name = (m.name || '').toLowerCase()
      const nameEn = (m.nameEn || '').toLowerCase()
      const formula = (m.formula || '').toLowerCase()
      return name.startsWith(kw) || nameEn.startsWith(kw) || formula.toLowerCase().startsWith(kw)
    })
    .slice(0, 8)
})

const doQuickJump = (mineral) => {
  if (!mineral) return
  audioStore.playClick()
  searchKeyword.value = ''
  showQuickJump.value = false
  if (gameStore.isMineralCollected(mineral.id)) {
    router.push(`/mineral/${mineral.id}`)
  }
}

const handleQuickJumpKeydown = (e) => {
  if (e.key === 'Enter') {
    const candidates = quickJumpCandidates.value
    if (candidates.length > 0) {
      doQuickJump(candidates[0])
    }
  } else if (e.key === 'Escape') {
    searchKeyword.value = ''
    showQuickJump.value = false
  }
}

const isMineralCollected = (id) => gameStore.isMineralCollected(id)

const getRarityCount = (rarity) => {
  const total = ALL_MINERALS_WITH_SEASON.value.filter(m => m.rarity === rarity).length
  const collected = ALL_MINERALS_WITH_SEASON.value.filter(m => m.rarity === rarity && gameStore.isMineralCollected(m.id)).length
  return `${collected}/${total}`
}

const viewMineralDetail = (mineral) => {
  if (!isMineralCollected(mineral.id)) {
    audioStore.playError()
    return
  }
  audioStore.playClick()
  router.push(`/mineral/${mineral.id}`)
}

const getMineralCount = (id) => {
  const m = gameStore.collectedMinerals.find(m => m.id === id)
  return m?.count || 0
}

const goToMarket = () => {
  audioStore.playClick()
  router.push('/market')
}

const goToExchange = () => {
  audioStore.playClick()
  router.push('/exchange')
}

const openListModal = () => {
  audioStore.playClick()
  router.push('/market')
  setTimeout(() => {
    marketStore.openListModal()
  }, 100)
}

const listMineral = (mineral) => {
  audioStore.playClick()
  router.push('/market')
  setTimeout(() => {
    marketStore.openListModal(mineral)
  }, 100)
}

const seasonLimitedSpecimens = computed(() => seasonStore.limitedSpecimens)

const isSeasonSpecimenCollected = (specimenId) => {
  return seasonStore.collectedSpecimens.includes(specimenId)
}

const goToSeason = () => {
  audioStore.playClick()
  router.push('/season')
}

const viewSeasonSpecimen = (specimen) => {
  if (!isSeasonSpecimenCollected(specimen.id)) {
    audioStore.playError()
    return
  }
  audioStore.playClick()
  router.push(`/mineral/${specimen.id}`)
}

const goToWarehouse = () => {
  audioStore.playClick()
  router.push('/warehouse')
}

const goToResearch = () => {
  audioStore.playClick()
  router.push('/research')
}

const duplicateMineralCount = computed(() => {
  return gameStore.collectedMinerals.filter(m => m.count > 1).length
})

const totalDuplicateValue = computed(() => {
  return exchangeStore.totalDuplicateValue || 0
})

const openBatchExchange = () => {
  audioStore.playClick()
  showBatchExchange.value = true
}
</script>

<style scoped>
.collection-view {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

.tabs-section {
  margin-bottom: 20px;
  position: sticky;
  top: -16px;
  z-index: 10;
  padding: 12px 0 8px;
  margin: -16px -16px 0;
  padding-left: 16px;
  padding-right: 16px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tabs-wrapper {
  display: flex;
  gap: 8px;
  background: var(--bg-card);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary), #ff6b6b);
  color: white;
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
  position: absolute;
  top: 4px;
  right: 12px;
  min-width: 16px;
  height: 16px;
  background: #f59e0b;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.collection-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.progress-section {
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.progress-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.knowledge-progress-card {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.08)) !important;
  border-color: rgba(168, 85, 247, 0.25) !important;
}

.knowledge-progress-card .progress-value.purple {
  color: #a855f7 !important;
}

.knowledge-progress-card .progress-fill {
  background: linear-gradient(90deg, #a855f7, #6366f1);
}

.exchange-balance-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.balance-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.balance-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.balance-label {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.2;
}

.balance-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  line-height: 1.2;
}

.token-balance {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.12), rgba(59, 130, 246, 0.06));
  border-color: rgba(96, 165, 250, 0.2);
}
.token-balance .balance-value { color: #60a5fa; }

.items-balance {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.12), rgba(139, 92, 246, 0.06));
  border-color: rgba(167, 139, 250, 0.2);
}
.items-balance .balance-value { color: #a78bfa; }

.duplicate-balance {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(251, 191, 36, 0.06));
  border-color: rgba(245, 158, 11, 0.2);
}
.duplicate-balance .balance-value { color: #f59e0b; }

.progress-value.purple {
  color: #c084fc !important;
}

.research-link {
  color: #c084fc;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;
  transition: all 0.2s ease;
}

.research-link:hover {
  color: #e9d5ff;
}

.knowledge-fill {
  background: linear-gradient(90deg, #a855f7, #6366f1, #3b82f6) !important;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-bar-large {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b6b, #ffd700);
  border-radius: 6px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  background-size: 50px 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -50px 0; }
  100% { background-position: calc(100% + 50px) 0; }
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 4px;
}

.filter-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.view-toggle {
  display: flex;
  background: var(--bg-card);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background: var(--primary);
  color: white;
}

.rarity-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-count {
  color: var(--text-secondary);
  font-size: 11px;
}

.season-specimens-section {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(139, 92, 246, 0.04));
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 14px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-label {
  font-size: 16px;
  font-weight: 700;
  color: #c084fc;
  margin: 0;
}

.season-go-btn {
  padding: 6px 14px;
  font-size: 12px;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  box-shadow: 0 2px 10px rgba(168, 85, 247, 0.3);
}

.season-specimens-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.season-specimen-card {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  padding: 14px 10px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.season-specimen-card:hover {
  transform: translateY(-2px);
}

.season-specimen-card.collected {
  border-color: rgba(168, 85, 247, 0.3);
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.1);
}

.season-specimen-card.rarity-legendary {
  border-color: rgba(245, 158, 11, 0.3);
}

.season-specimen-card.rarity-legendary.collected {
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.15);
}

.specimen-exclusive-tag {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: #fff;
}

.specimen-emoji-small {
  font-size: 32px;
  display: block;
  margin-bottom: 6px;
}

.specimen-name-small {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}

.specimen-status {
  font-size: 14px;
}

.specimen-status.collected-status {
  color: #22c55e;
  font-weight: 700;
}

.minerals-container {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
}

.minerals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.minerals-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.list-item:hover {
  transform: translateX(4px);
  border-color: rgba(233, 69, 96, 0.3);
}

.list-item.collected {
  cursor: pointer;
}

.list-item:not(.collected) {
  opacity: 0.6;
  cursor: not-allowed;
}

.list-item:not(.collected):hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.1);
}

.item-emoji {
  font-size: 40px;
  flex-shrink: 0;
}

.item-emoji-wrap {
  position: relative;
  flex-shrink: 0;
}

.list-kb-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  padding: 1px 6px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: white;
  font-size: 9px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid rgba(192, 132, 252, 0.5);
  box-shadow: 0 2px 6px rgba(168, 85, 247, 0.4);
  white-space: nowrap;
  z-index: 1;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.item-rarity {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.item-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.item-arrow {
  font-size: 24px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.list-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-bar .btn {
  flex: 1;
}

.exchange-entry-btn {
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
}

.exchange-entry-btn:hover {
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.6);
}

.batch-exchange-btn {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
  color: #000;
  font-weight: 700;
}

.batch-exchange-btn:hover {
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
}

.research-collection-entry-btn {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.35);
}

.research-collection-entry-btn:hover {
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
}

.warehouse-entry-btn {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.warehouse-entry-btn:hover {
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
}

.btn-icon {
  margin-right: 6px;
}

.detector-header {
  margin-bottom: 16px;
  margin-top: 12px;
}

.coins-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  margin-bottom: 16px;
}

.coins-icon {
  font-size: 20px;
}

.coins-value {
  font-size: 18px;
  font-weight: 800;
  color: #fbbf24;
}

.coins-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: auto;
}

.tier-selector {
  margin-bottom: 16px;
}

.tier-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.tier-card {
  flex-shrink: 0;
  width: 90px;
  padding: 12px 8px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tier-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.tier-card.active {
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
  background: linear-gradient(180deg, rgba(251, 191, 36, 0.1), transparent);
}

.tier-card.locked {
  opacity: 0.6;
}

.tier-card.locked:hover {
  opacity: 0.8;
}

.tier-emoji {
  width: 48px;
  height: 48px;
  margin: 0 auto 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.tier-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.tier-unlock {
  font-size: 9px;
  color: #fbbf24;
  font-weight: 600;
}

.tier-level {
  font-size: 10px;
  color: var(--primary);
  font-weight: 700;
}

.detector-main-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 20px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
  position: relative;
}

.detector-top-section {
  display: flex;
  gap: 16px;
}

.detector-visual {
  flex-shrink: 0;
  position: relative;
}

.detector-circle {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.detector-emoji-big {
  font-size: 48px;
  z-index: 2;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.scan-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: scanPulse 2s ease-in-out infinite;
}

.scan-ring.delay-1 {
  animation-delay: 1s;
}

@keyframes scanPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.15);
    opacity: 0;
  }
}

.detector-info {
  flex: 1;
  min-width: 0;
}

.detector-name {
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 4px;
}

.detector-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 12px;
  line-height: 1.4;
}

.level-section {
  margin-bottom: 14px;
}

.level-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.level-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.level-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.level-max {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
}

.exp-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exp-bar {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease;
}

.exp-text {
  font-size: 10px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.upgrade-section {
  margin-top: 4px;
}

.btn-upgrade {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.btn-upgrade:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.btn-upgrade:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.upgrade-label {
  font-weight: 700;
}

.upgrade-cost {
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  font-size: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-section .section-title {
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.stat-icon {
  font-size: 16px;
}

.stat-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.stat-values {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-base {
  font-size: 11px;
  color: #6b7280;
  text-decoration: line-through;
}

.stat-arrow {
  font-size: 11px;
  color: var(--text-secondary);
}

.stat-total {
  font-size: 15px;
  font-weight: 800;
}

.specific-rarity-card {
  grid-column: span 2;
}

.affixes-section {
  margin-bottom: 20px;
}

.affixes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.affixes-count {
  padding: 4px 12px;
  background: var(--bg-card);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.affixes-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.affix-card {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}

.affix-quality-bar {
  height: 3px;
  width: 100%;
}

.affix-content {
  padding: 10px 12px;
}

.affix-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.affix-quality-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.affix-reroll-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.affix-reroll-btn:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.4);
  transform: rotate(180deg);
}

.affix-reroll-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.affix-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-affix {
  border-style: dashed;
  background: transparent;
}

.empty-affix-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.5;
}

.empty-affix-icon {
  font-size: 24px;
  color: var(--text-secondary);
  font-weight: 300;
}

.empty-affix-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.affix-actions {
  display: flex;
  justify-content: center;
}

.btn-reroll-all {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.15));
  color: #fbbf24;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-reroll-all:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.25));
  transform: translateY(-1px);
}

.btn-reroll-all:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-cost {
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  font-size: 11px;
}

.detector-tips-section {
  margin-bottom: 20px;
}

.detector-tips-section .section-title {
  margin-bottom: 12px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tip-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.tip-content {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tip-content strong {
  color: var(--text-primary);
  font-weight: 700;
}

.upgrade-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.upgrade-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upgrade-stat-item .stat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.upgrade-stat-item .stat-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}

.detector-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  z-index: 5000;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 90%;
  text-align: center;
}

.detector-toast.success {
  background: rgba(34, 197, 94, 0.95);
  color: white;
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.detector-toast.error {
  background: rgba(239, 68, 68, 0.95);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.toast-enter-active {
  animation: toastIn 0.3s ease;
}

.toast-leave-active {
  animation: toastOut 0.3s ease;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

@media (min-width: 600px) {
  .minerals-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .specific-rarity-card {
    grid-column: span 1;
  }
}

@media (min-width: 900px) {
  .minerals-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .exchange-balance-bar {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .balance-item {
    padding: 10px 12px;
    gap: 10px;
  }
  .balance-icon { font-size: 24px; }
  .balance-value { font-size: 16px; }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-tabs {
    justify-content: flex-start;
  }
  
  .view-toggle {
    justify-content: center;
  }
  
  .rarity-legend {
    gap: 8px;
  }

  .detector-top-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .specific-rarity-card {
    grid-column: span 1;
  }

  .progress-section {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-wrap: wrap;
  }

  .action-bar .btn {
    flex: 1 0 45%;
  }
}

.log-header-section {
  margin-bottom: 20px;
}

.log-header-content {
  text-align: center;
  padding: 20px 0;
}

@media (max-width: 480px) {
  .tabs-wrapper {
    overflow-x: auto;
    padding-bottom: 2px;
  }
  
  .tab-btn {
    flex-shrink: 0;
  }
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0 14px;
  transition: all 0.2s ease;
}

.search-box.focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.15);
}

.search-icon {
  font-size: 16px;
  margin-right: 10px;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  padding: 12px 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.search-hint {
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  font-family: inherit;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-jump-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  z-index: 100;
  max-height: 360px;
  overflow-y: auto;
}

.quick-jump-title {
  padding: 8px 10px 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-jump-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-jump-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.quick-jump-item:not(.collected) {
  opacity: 0.55;
}

.qj-emoji {
  font-size: 26px;
  flex-shrink: 0;
}

.qj-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qj-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.qj-sub {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.qj-rarity {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.qj-arrow {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0.5;
}

.advanced-filter-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
}

.advanced-filter-toggle:hover {
  border-color: rgba(168, 85, 247, 0.4);
  color: var(--text-primary);
}

.advanced-filter-toggle.active {
  border-color: #a855f7;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1));
  color: #c084fc;
}

.advanced-filter-toggle.has-active .af-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 8px;
  color: #22c55e;
}

.af-icon {
  font-size: 14px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 500px;
}

.advanced-filters-panel {
  background: var(--bg-card);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(99, 102, 241, 0.04));
}

.af-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 14px;
}

.af-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.af-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.af-select {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.af-select:hover {
  border-color: rgba(168, 85, 247, 0.4);
}

.af-select:focus {
  border-color: #a855f7;
}

.af-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.af-chip {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.af-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.af-chip.active {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 10px rgba(168, 85, 247, 0.35);
}

.af-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-reset-af {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
}

.btn-reset-af:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.af-result-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.af-result-count strong {
  color: #a855f7;
  font-weight: 800;
  font-size: 14px;
  margin: 0 2px;
}

@media (max-width: 600px) {
  .search-section {
    flex-direction: column;
  }
  .advanced-filter-toggle {
    width: 100%;
    justify-content: center;
  }
  .af-row {
    grid-template-columns: 1fr;
  }
}
</style>
