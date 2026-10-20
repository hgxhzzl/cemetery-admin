<template>
  <!-- 安葬证设置视图字段（数据表 burial_cert）：从 gravePlotBusiness/index.vue 拆出的最自包含子视图
       （20261020 P2 S2 巨石拆分第一批）。本组件仅渲染表单字段列（多个 t-col 片段，直挂父页共享 t-row），
       数据经 inject 共享页面 formCertData（Ref 在模板自动解包，编辑即写回同一对象），提交/取消/返回/证件生成
       逻辑仍留父页与 useCertificateForm，本组件纯展示。字段布局/宽度口径与原页面完全一致。 -->
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.serialNo')" name="serialNo">
      <t-input
        v-model="formCertData.serialNo"
        disabled
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.serialNoPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :required="true" :label="$t('pages.gravePlotBusiness.certHolder')" name="certHolder">
      <t-input
        v-model="formCertData.certHolder"
        disabled
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.certHolderPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.certHolderPhone')" name="certHolderPhone">
      <t-input
        v-model="formCertData.certHolderPhone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.certHolderPhonePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <!-- 安葬者A上移至持证人电话右侧（原逝者关系位置，两框互换）20260928 修改 -->
    <t-form-item :label="$t('pages.gravePlotBusiness.deceasedA')" name="deceasedA">
      <t-input
        v-model="formCertData.deceasedA"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.deceasedPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.burialDate')" name="burialDate">
      <t-date-picker
        v-model="formCertData.burialDate"
        :style="{ width: '322px' }"
        theme="primary"
        mode="date"
        separator="/"
        :placeholder="$t('pages.gravePlotBusiness.burialDatePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <!-- 逝者关系上移至下葬日期右侧，合葬日期下移至逝者关系右侧（两框互换）20260928 修改 -->
    <t-form-item :label="$t('pages.gravePlotBusiness.deceasedRelation')" name="deceasedRelation">
      <t-input
        v-model="formCertData.deceasedRelation"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.deceasedRelationPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 安葬者B/C/D 并入一行：外层整列（span=12）自然从新行开始，内部嵌套 t-row 三个 4 列
       （span=4，1/3 行宽）等宽占满整行；C/D 去标题（控件按 label 高度下移对齐 B 输入框基线）
       分位联动显示：一分只留B，二分星C，三分全显（B始终显示）20260928 修改 -->
  <t-col :span="12">
    <t-row :gutter="[32, 5]">
      <t-col :span="4">
        <!-- 安葬者B：标题右侧分位单选框（一分/二分/三分，值1/2/3落 burial_cert.equalDivision）20260928 修改 -->
        <t-form-item name="deceasedB">
          <template #label>
            <div class="cert-deceased-b-label">
              <span>{{ $t('pages.gravePlotBusiness.deceasedB') }}</span>
              <t-radio-group v-model="formCertData.equalDivision" size="small">
                <t-radio value="1">{{ $t('pages.gravePlotBusiness.oneFen') }}</t-radio>
                <t-radio value="2">{{ $t('pages.gravePlotBusiness.twoFen') }}</t-radio>
                <t-radio value="3">{{ $t('pages.gravePlotBusiness.threeFen') }}</t-radio>
              </t-radio-group>
            </div>
          </template>
          <t-input
            v-model="formCertData.deceasedB"
            class="cert-deceased-bcd-input"
            :maxcharacter="20"
            show-limit-number
            :placeholder="$t('pages.gravePlotBusiness.deceasedPlaceholder')"
          />
        </t-form-item>
      </t-col>
      <t-col v-if="formCertData.equalDivision !== '1'" :span="4">
        <!-- 安葬者C：去标题，仅二分/三分显示（一分隐藏）20260928 修改 -->
        <t-form-item name="deceasedC" class="cert-deceased-cd-item">
          <t-input
            v-model="formCertData.deceasedC"
            class="cert-deceased-bcd-input"
            :maxcharacter="20"
            show-limit-number
            :placeholder="$t('pages.gravePlotBusiness.deceasedPlaceholder')"
          />
        </t-form-item>
      </t-col>
      <t-col v-if="formCertData.equalDivision === '3'" :span="4">
        <!-- 安葬者D：去标题，仅三分显示（一分/二分隐藏）20260928 修改 -->
        <t-form-item name="deceasedD" class="cert-deceased-cd-item">
          <t-input
            v-model="formCertData.deceasedD"
            class="cert-deceased-bcd-input"
            :maxcharacter="20"
            show-limit-number
            :placeholder="$t('pages.gravePlotBusiness.deceasedPlaceholder')"
          />
        </t-form-item>
      </t-col>
    </t-row>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.jointBurialDate')" name="jointBurialDate">
      <t-date-picker
        v-model="formCertData.jointBurialDate"
        :style="{ width: '322px' }"
        theme="primary"
        mode="date"
        separator="/"
        :placeholder="$t('pages.gravePlotBusiness.jointBurialDatePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <!-- 单位电话上移至合葬日期右侧，使工作单位与住址单独成一行（两框互换）20260928 修改 -->
    <t-form-item :label="$t('pages.gravePlotBusiness.workPhone')" name="workPhone">
      <t-input
        v-model="formCertData.workPhone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.workPhonePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 工作单位整行（span=12）单独一行，输入框宽度占满整行；住址同 20260928 修改 -->
  <t-col :span="12">
    <t-form-item :label="$t('pages.gravePlotBusiness.workplace')" name="workplace">
      <t-input
        v-model="formCertData.workplace"
        class="cert-fullrow-input"
        :maxcharacter="50"
        show-limit-number
        :placeholder="$t('pages.gravePlotBusiness.workplacePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="12">
    <t-form-item :label="$t('pages.gravePlotBusiness.homeAddress')" name="homeAddress">
      <t-input
        v-model="formCertData.homeAddress"
        class="cert-fullrow-input"
        :maxcharacter="50"
        show-limit-number
        :placeholder="$t('pages.gravePlotBusiness.homeAddressPlaceholder')"
      />
    </t-form-item>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'CertificateFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import { certificateFormDataKey } from '../useCertificateForm';

// 安葬证设置表单数据：由父页 provide 的 Ref（页面持有，useCertificateForm 管理），模板自动解包后按字段 v-model 编辑；
// 提交/返回/证件生成逻辑留父页，本组件不做任何业务处理 20261020 P2 S2 拆分
const formCertData = inject(certificateFormDataKey)!;
</script>
<style lang="less" scoped>
// 证书视图专属布局样式：原位于页面 index.less，因目标元素（.cert-deceased-b-label / .cert-deceased-cd-item）
// 随字段迁入本组件（scoped 末位选择器带本组件 data-v，父页 scoped 不再命中），故一并迁入。
// 输入框宽度覆盖（.cert-fullrow-input / .cert-deceased-bcd-input）仍留父页 .form-basic-container :deep（祖先带父页 scope、
// :deep 穿透深层元素，照常命中本组件内元素），不随迁以免重复。

// 安葬者B标题行（标题文字 + 分位单选框同行，单选靠右）：label 插槽内容与输入框同列宽，单选框贴该列右缘；
// 单选组禁止内部换行并收窄选项间距，确保窄列（1/3 行宽）内标题与三个单选一行放下 20260928 修改
.cert-deceased-b-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  // 标题与单选组间距拉开：space-between 在窄列下单选组紧贴标题，固定 gap 充裕间隔 20260928 修改
  gap: 24px;

  :deep(.t-radio-group) {
    flex-wrap: nowrap;
  }

  // small 单选字号 12px：与表单 label 字号一致不撑高标题行；间距收窄至 8px 20260928 修改
  :deep(.t-radio) {
    font: var(--td-font-body-small);
    margin-right: 8px;
  }

  :deep(.t-radio:last-child) {
    margin-right: 0;
  }
}

// 安葬者C/D 无 label：控件上移会高于安葬者B输入框基线，
// 按label-top 同高（--td-comp-margin-xxxl）下移控件，使三个输入框同行同高 20260928 新增
.cert-deceased-cd-item {
  :deep(.t-form__controls) {
    margin-top: var(--td-comp-margin-xxxl);
  }
}
</style>
