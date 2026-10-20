<template>
  <div v-if="isFormShow">
    <t-form class="base-form" label-align="top" :label-width="120" required-mark-position="right" @submit="onSubmit">
      <div class="form-basic-container">
        <div class="form-basic-item">
          <div class="form-basic-container-title">{{ $t('pages.cardColor.title') }}</div>
          <div class="card-color-tip">{{ $t('pages.cardColor.tip') }}</div>

          <!-- 四态各一行：着色勾选 + 颜色值 + 底色矩形 + 外框矩形（外框由底色按固定步长加深，只读展示） 20261011 新增 -->
          <t-form-item
            v-for="row in formRows"
            :key="row.state"
            :label="$t(`pages.cardColor.${row.state}`)"
            :name="row.state"
          >
            <div class="card-color-row">
              <t-checkbox v-model="row.isEnabled">{{ $t('pages.cardColor.enable') }}</t-checkbox>
              <t-input
                v-model="row.color"
                :disabled="!row.isEnabled"
                :maxcharacter="7"
                :style="{ width: '140px' }"
                :placeholder="$t('pages.cardColor.colorPlaceholder')"
                @change="syncBorder(row)"
              />
              <span class="card-color-swatch" :style="{ backgroundColor: row.color }"></span>
              <span class="card-color-caption">{{ $t('pages.cardColor.border') }}</span>
              <span class="card-color-swatch" :style="{ backgroundColor: row.border }"></span>
            </div>
          </t-form-item>

          <!-- 预览：按当前编辑值直接画出四态卡面，未勾选着色的态回落白底细灰框 20261011 新增 -->
          <div class="card-color-preview">
            <div
              v-for="row in formRows"
              :key="`preview-${row.state}`"
              class="card-color-sample"
              :style="sampleStyle(row)"
            >
              {{ $t(`pages.cardColor.${row.state}`) }}
            </div>
          </div>
        </div>
      </div>

      <div class="form-submit-container">
        <div class="form-submit-sub">
          <div class="form-submit-left">
            <t-button theme="primary" class="form-submit-confirm" type="submit" :disabled="submitting">
              {{ $t('operate.confirm') }}
            </t-button>
            <!-- 重新载入：丢弃未提交的修改并回到库中当前配置 20261011 新增 -->
            <t-button theme="default" variant="base" class="form-submit-cancel" @click="loadData">
              {{ $t('operate.reset') }}
            </t-button>
          </div>
        </div>
      </div>
    </t-form>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { getCardColor, saveCardColor } from '@/api/cardColor';
import type { CardColorConfig, CardColorState } from '@/api/model/cardColorModel';
import { useSubmitGuard } from '@/hooks';
import { translate } from '@/locales';
import { CARD_COLOR_STATES, darkenColor, isHexColor, normalizeCardColors, reloadCardColors } from '@/utils/cardTheme';
import { logError } from '@/utils/logger';

defineOptions({
  name: 'CardColor',
});

// 页面行模型：状态 key 与四态字段一起铺开，便于 v-for 渲染 20261011 新增
interface CardColorRow {
  state: CardColorState;
  color: string;
  border: string;
  isEnabled: boolean;
}

const isFormShow = ref(false);
const formRows = ref<CardColorRow[]>([]);

onMounted(async () => {
  await loadData();
  setTimeout(() => {
    isFormShow.value = true;
  }, 280);
});

// 载入库中配置：无配置行/解析失败均回落到默认配色（与卡片未覆盖时的 CSS 默认值一致） 20261011 新增
const loadData = async () => {
  let config: CardColorConfig;
  try {
    const { list } = await getCardColor();
    const raw = list && list.length > 0 ? JSON.parse(list[0].configJson || '{}') : null;
    config = normalizeCardColors(raw);
  } catch (e) {
    logError(e);
    config = normalizeCardColors(null);
  }
  formRows.value = CARD_COLOR_STATES.map((state) => ({ state, ...config[state] }));
};

// 底色变化时外框按固定步长重新加深 20261011 新增
const syncBorder = (row: CardColorRow) => {
  row.border = darkenColor(row.color);
};

// 预览样卡样式：与提交后卡片实际取色一致（未着色态回默认底/框） 20261011 新增
const sampleStyle = (row: CardColorRow) => {
  if (!row.isEnabled) {
    return {
      backgroundColor: 'var(--td-bg-color-container)',
      borderColor: 'var(--td-border-level-1-color)',
      color: 'var(--td-text-color-secondary)',
    };
  }
  return {
    backgroundColor: row.color,
    borderColor: row.border,
    color: 'var(--td-text-color-primary)',
  };
};

// 确认提交防重复：沿用收据配制页的 useSubmitGuard，双击/回车不会并发发出两次写接口 20261011 新增
const { submitting, run } = useSubmitGuard();
const onSubmit = () => run(submitCore);
const submitCore = async () => {
  const invalid = formRows.value.find((row) => row.isEnabled && !isHexColor(row.color));
  if (invalid) {
    return MessagePlugin.warning(translate('pages.cardColor.invalidColor'));
  }

  const config = {} as CardColorConfig;
  formRows.value.forEach((row) => {
    config[row.state] = {
      color: row.color.toUpperCase(),
      border: row.border.toUpperCase(),
      isEnabled: row.isEnabled,
    };
  });

  try {
    await saveCardColor(config);
    // 保存成功即重新拉取并注入变量，业务页无需刷新即可看到新色 20261011 新增,
    await reloadCardColors();
    MessagePlugin.success(translate('operate.modifySuccessPrompt'));
    await loadData();
  } catch (e) {
    logError(e);
    MessagePlugin.error(translate('operate.modifyFailedPrompt'));
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>
