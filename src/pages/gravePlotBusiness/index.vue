<template>
  <div>
    <!-- 列表开始 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content gravePlotBusiness-page-content">
        <div
          class="list-common-table gravePlotBusiness-list-panel"
          :class="{ 'gravePlotBusiness-list-panel--full': hasQueried && businessCardRows.length }"
        >
          <t-form
            class="cms-card-filter-bar"
            :data="formfindData"
            :label-width="BUSINESS_BASIC_FORM_LABEL_WIDTH"
            colon
            @submit="onSubmit"
          >
            <t-row>
              <t-col :span="10">
                <!-- 筛选条件横向排列，条件之间空隙固定 24px，不随屏幕宽度变化 20260914 修改 -->
                <div class="cms-card-filter-inline">
                  <!-- 区域由墓区销售下区域三级菜单经路由下发：下拉框仅展示当前区域且不可用（不可切换）20260923 修改；
                       本页筛选行 4 项，区域/排号下拉框收窄至 120px（页面专属类），
                       204+284+204+152+间距 72≈916px < span=10 列宽约 1046px，确保排序项不窜行 20260925 修改 -->
                  <t-form-item
                    :label="$t('pages.room.region')"
                    name="region"
                    class="cms-filter-item gravePlotBusiness-filter-item-narrow"
                  >
                    <t-select
                      v-model="formfindData.region"
                      class="demo-select-base cms-filter-control gravePlotBusiness-filter-control-narrow"
                      disabled
                      :placeholder="$t('pages.room.regionPlaceholder')"
                    >
                      <t-option :value="menuRegion" :label="menuRegion">{{ menuRegion }}</t-option>
                    </t-select>
                  </t-form-item>
                  <t-form-item :label="$t('pages.room.park')" name="park" class="cms-filter-item cms-filter-item-basic">
                    <t-select
                      v-model="formfindData.park"
                      class="demo-select-base cms-filter-control"
                      :placeholder="$t('pages.room.parkPlaceholder')"
                      @change="onSelectChange"
                    >
                      <t-option
                        v-for="(item, index) in availableParkList"
                        :key="index"
                        :value="item.value"
                        :label="item.label"
                      >
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                  <t-form-item
                    :label="$t('pages.room.yNum')"
                    name="yNum"
                    class="cms-filter-item gravePlotBusiness-filter-item-narrow"
                  >
                    <t-select
                      v-model="formfindData.yNum"
                      class="demo-select-base cms-filter-control gravePlotBusiness-filter-control-narrow"
                      :placeholder="$t('pages.room.yNumSelectPlaceholder')"
                      clearable
                      @change="onSelectChange"
                    >
                      <t-option v-for="(item, index) in yNumList" :key="index" :value="item.value" :label="item.label">
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                  <!-- 排序选项：对排号升/降序展示卡片行组，默认降序；分段控件样式同首页“今天/明天”切换；
                       窄项自适应宽（不占 basic 286px），避免第 4 项携 3 个 basic 项超出筛选行宽度而窜行 20260925 修改 -->
                  <t-form-item
                    :label="$t('pages.gravePlotBusiness.sortOrder')"
                    name="sortOrder"
                    class="cms-filter-item gravePlotBusiness-filter-item-sort"
                  >
                    <t-radio-group v-model="formfindData.sortOrder" variant="default-filled" size="small">
                      <t-radio-button value="asc">{{ $t('pages.gravePlotBusiness.sortAsc') }}</t-radio-button>
                      <t-radio-button value="desc">{{ $t('pages.gravePlotBusiness.sortDesc') }}</t-radio-button>
                    </t-radio-group>
                  </t-form-item>
                </div>
              </t-col>

              <t-col :span="2" class="operation-container">
                <t-button theme="primary" type="submit">
                  {{ $t('operate.query') }}
                </t-button>
              </t-col>
            </t-row>
          </t-form>

          <!-- 查询后无数据时不展示卡片区，仅在筛选表单下方居中提示 20260827 修改 -->
          <div v-if="hasQueried && !businessCardRows.length" class="gravePlotBusiness-no-data">暂无数据</div>

          <div v-if="hasQueried && businessCardRows.length" class="gravePlotBusiness-list-body">
            <div
              ref="businessCardViewport"
              class="table-container gravePlotBusiness-card-layout"
              @scroll.passive="onCardViewportScroll"
            >
              <div v-if="businessCardRows.length" class="gravePlotBusiness-card-rows" :style="{ zoom: businessZoom }">
                <div v-for="rowGroup in businessCardRows" :key="rowGroup.yNum" class="gravePlotBusiness-card-row">
                  <div class="gravePlotBusiness-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="gravePlotBusiness-card"
                      :class="{
                        'gravePlotBusiness-card--empty': card.placeholder,
                      }"
                      @dblclick="!card.placeholder && handleClickDetail(card.row)"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 20260828 修改 -->
                        <div class="gravePlotBusiness-card__header">
                          <div class="gravePlotBusiness-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                        </div>
                        <div class="gravePlotBusiness-card__body">
                          <div class="gravePlotBusiness-card__empty-text">空位</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="gravePlotBusiness-card__header">
                          <!-- 排号改取 xyNumber 字段(自定义坐标名)，缺失时回退 yNum/xNum 拼接 20260923 修改 -->
                          <div class="gravePlotBusiness-card__serial">
                            {{ card.row.xyNumber || `${rowGroup.yNum} 排 ${card.xNum} 号` }}
                          </div>
                          <!-- 墓穴类型标题去掉，值改为胶囊标签上移至卡片第一行右侧 20260923 修改 -->
                          <span class="gravePlotBusiness-card__type">{{ $t(card.row.roomType).trim() }}</span>
                        </div>
                        <div class="gravePlotBusiness-card__body">
                          <!-- 卡片信息内容参照墓区下葬页：预定人/购买人/下葬者/联系人/期限，标签在左灰色、值在右深色两端对齐 20260923 修改 -->
                          <!-- 销售状态保留在卡片行数据 card.row.saleStatus 中（后续交互门控/背景区分等依据），仅在卡面上不渲染展示 20260923 新增 -->
                          <!-- 预定人：值为活动预定记录联查带出，有则显示人名、无预定显示“无”；按钮进入预定形态表单，已销售时禁用并恢复默认色 20260923 修改 20260924 修改 -->
                          <div class="gravePlotBusiness-card__meta">
                            <t-link
                              :disabled="isSold(card.row.saleStatus)"
                              :theme="isSold(card.row.saleStatus) ? 'default' : 'primary'"
                              @click="handleClickReserve(card.row)"
                            >
                              {{ $t('pages.gravePlotBusiness.reserver') }}
                            </t-link>
                            <!-- 预定人超过7字截断为前7字+省略号，悬停提示完整内容 20260923 新增 -->
                            <t-tooltip v-if="isOverflow(card.row.reserver)" :content="String(card.row.reserver)">
                              <span class="gravePlotBusiness-card__meta-value">{{
                                truncateText(card.row.reserver)
                              }}</span>
                            </t-tooltip>
                            <!-- 预定人无值时默认显示“无” 20260923 新增 -->
                            <span v-else class="gravePlotBusiness-card__meta-value">{{
                              card.row.reserver || $t('common.none')
                            }}</span>
                          </div>
                          <div class="gravePlotBusiness-card__meta">
                            <!-- 购买人按钮：点击进入销售形态表单（同墓位销售页样式内容：有销售信息为“修改销售”、无则为“销售墓穴”；数据仍走自有接口）20260923 修改 -->
                            <t-link theme="primary" @click="handleClickBuyer(card.row)">
                              {{ $t('pages.room.buyer') }}
                            </t-link>
                            <!-- 购买人无值时默认显示“无” 20260923 新增 -->
                            <span class="gravePlotBusiness-card__meta-value">{{
                              card.row.buyer || $t('common.none')
                            }}</span>
                          </div>
                          <div class="gravePlotBusiness-card__meta">
                            <!-- 下葬者按钮：点击进入下葬形态表单（同下葬页修改页内容，数据走自有接口读写 buried 表）20260923 修改 -->
                            <t-link theme="primary" @click="handleClickBuried(card.row)">
                              {{ $t('pages.room.buriedPerson') }}
                            </t-link>
                            <!-- 下葬者超过7字截断为前6字+4个半角点，悬停提示完整内容 20260924 修改 -->
                            <t-tooltip v-if="isOverflow(card.row.deceased)" :content="String(card.row.deceased)">
                              <span class="gravePlotBusiness-card__meta-value">{{
                                truncateBuriedText(card.row.deceased)
                              }}</span>
                            </t-tooltip>
                            <!-- 下葬者无值时默认显示“无” 20260923 新增 -->
                            <span v-else class="gravePlotBusiness-card__meta-value">
                              {{ card.row.deceased || $t('common.none') }}
                            </span>
                          </div>
                          <!-- 联系人：room 表字段，存所有联系人；标签为操作按钮，点击进入业务登记表单 20260923 修改 -->
                          <div class="gravePlotBusiness-card__meta">
                            <t-link theme="primary" @click="handleClickPerson(card.row)">
                              {{ $t('pages.room.contacts') }}
                            </t-link>
                            <!-- 联系人超过7字截断为前6字+4个半角点，悬停提示完整内容 20260923 新增 20260924 修改 -->
                            <t-tooltip v-if="isOverflow(card.row.contacts)" :content="String(card.row.contacts)">
                              <span class="gravePlotBusiness-card__meta-value">{{
                                truncateContactsText(card.row.contacts)
                              }}</span>
                            </t-tooltip>
                            <!-- 联系人无值时默认显示“无” 20260923 新增 -->
                            <span v-else class="gravePlotBusiness-card__meta-value">{{
                              card.row.contacts || $t('common.none')
                            }}</span>
                          </div>
                          <!-- 期限信息（管理费结束日期），标签用短词条避免卡片内换行，与下葬页卡片一致 20260923 新增 -->
                          <div class="gravePlotBusiness-card__meta">
                            <span class="gravePlotBusiness-card__meta-label">{{ $t('pages.adminfee.period') }}</span>
                            <!-- 期限无值时默认显示“无” 20260923 新增 -->
                            <span class="gravePlotBusiness-card__meta-value">{{
                              formatDate(card.row.endDate) || $t('common.none')
                            }}</span>
                          </div>
                          <!-- 销售/下葬状态胶囊行移除，卡片仅保留人员信息与期限；销售状态仍随行数据返回但不展示 20260923 修改 -->
                        </div>
                        <!-- 卡片操作行移除：详情/新建/修改/删除不再从卡片进入，交互方式后续调整 20260923 修改 -->
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表底部工具行：左侧记录数，右侧放大/缩小卡片列表 20260828 修改 -->
          <div v-if="hasQueried && businessCardRows.length" class="gravePlotBusiness-list-toolbar">
            <span>{{ listTotalText }}</span>
            <span class="gravePlotBusiness-list-toolbar__zoom">
              <zoom-in-icon class="gravePlotBusiness-list-toolbar__zoom-icon" @click="handleZoomIn" />
              <zoom-out-icon class="gravePlotBusiness-list-toolbar__zoom-icon" @click="handleZoomOut" />
            </span>
          </div>

          <!-- 删除二次确认弹窗随卡片操作行一并移除 20260923 修改 -->
        </div>
      </div>
    </div>
    <!-- 列表结束 -->
    <!-- 详情开始 -->
    <room-detail
      v-if="isDetailShow"
      :room="detailRoom"
      :reserve="detailReserve"
      :sale="detailSale"
      :buried="detailBuried"
      :adminfees="detailAdminfees"
      :contacts="detailContacts"
      @close="ClickDetailClose"
    />
    <!-- 详情结束 -->
    <!-- 业务登记始（独立实现：点击购买人标题进入，走 gravePlotBusiness 自有接口与 graveplotbusiness 表，不与墓位销售混用）20260923 修改 -->
    <!-- 业务登记（独立实现）：销售形态存在销售记录且非平台管理员（isAccount=0）时表单只读，管理员可操作 20260924 修改 -->
    <div v-if="isCreateShow">
      <t-form
        class="base-form"
        :data="formBusinessData"
        label-align="top"
        :label-width="100"
        :disabled="saleFormDisabled"
      >
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div class="form-basic-container-title">
              {{ formTitle }}
              <!-- 返回按钮：t-button 会注入 t-form 的 formDisabled 被 :disabled 一并禁用，
                   显式 :disabled=false 使组件级 disabled 优先于表单级，销售形态只读门控下仍可返回 20260924 修复 -->
              <t-button
                class="cms-back-btn"
                style="float: right"
                theme="default"
                variant="text"
                :disabled="false"
                @click="onBackBuriedBusiness()"
              >
                {{ $t('operate.backDetail') }}
                <rollback-icon size="16px" />
              </t-button>
            </div>

            <!-- 表单内容 -->

            <!-- 下葬形态水平 gutter 收窄至 32：半列宽恰为 322px，右列输入框右缘与容器右界（返回按钮/列表/备注）对齐；其他形态保持 62 20260923 修改 -->
            <t-row class="info-block des" :gutter="formMode === 'buried' ? [32, 5] : [62, 5]">
              <!-- 区域信息不在预定/下葬形态表单展示（同墓位预定/下葬页）20260923 修改 -->
              <t-col v-if="formMode !== 'reserve' && formMode !== 'buried'" :span="6">
                <span>{{ $t('pages.room.region') }} : {{ formRoomData.region }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.park') }} : {{ formRoomData.park }}</span>
              </t-col>
              <!-- 编号（xyNumber）：各形态均在园区行右侧展示（含下葬形态，同下葬页修改页布局）20260923 修改 -->
              <t-col :span="6">
                <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber 20260901 修改 -->
                <span>{{ $t('pages.room.xyNumber') }} : {{ formRoomData.xyNumber }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.roomType') }} : {{ t(formRoomData.roomType) }}</span>
              </t-col>
              <!-- 规格：联系人（业务登记）形态不展示（与价格同步移除）20260924 修改 -->
              <t-col v-if="formMode !== 'business'" :span="6">
                <span>{{ $t('pages.room.specs') }} : {{ formRoomData.specs }}</span>
              </t-col>
              <!-- 价格：下葬形态与联系人（业务登记）形态不展示（精简为无销售信息的纯登记信息页）20260923 修改 20260924 修改 -->
              <t-col v-if="formMode !== 'buried' && formMode !== 'business'" :span="6">
                <!-- priceString 列已删，墓位价格由数值 price 千分位格式化 20260910 修改 -->
                <span>{{ $t('pages.room.price') }} : {{ formatPrice(formRoomData.price) }}</span>
              </t-col>
              <!-- 预定形态展示预定状态（同墓位预定页），其他形态不展示 20260923 新增 -->
              <t-col v-if="formMode === 'reserve'" :span="6">
                <span>{{ $t('pages.room.reserveStatus') }} : {{ t(formRoomData.reserveStatus) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.saleStatus') }} : {{ t(formRoomData.saleStatus) }}</span>
              </t-col>
              <!-- 下葬状态：各形态统一半宽，与销售状态同行（下葬形态上移至销售状态右侧）20260923 修改 -->
              <t-col :span="6">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>
              <!-- 下葬形态：列表视图展示记录列表（含表头“新增”）；新增/修改视图不展示列表 20260924 修改 -->
              <t-col v-if="formMode === 'buried' && buriedEditMode === 'list'" :span="12">
                <t-form-item name="idBuried">
                  <t-table
                    class="buried-record-table"
                    :data="buriedRecords"
                    :columns="buriedRecordColumns"
                    row-key="idBuried"
                    :bordered="true"
                    size="small"
                    :max-height="240"
                  >
                    <!-- 下葬日期库中为 datetime，表格统一格式化为 yyyy-mm-dd 20260923 新增 -->
                    <template #burialDate="{ row }">
                      {{ formatDate(row.burialDate) }}
                    </template>
                    <!-- 操作列：修改回填表单、删除二次确认后软删该条记录 20260923 新增；
                         idSale 有值的记录由销售开单联动生成，不展示修改/删除（去销售单修改）20260925 新增 -->
                    <template #op="{ row }">
                      <div v-if="!row.idSale" class="record-op-links">
                        <t-link theme="primary" @click="onModifyBuriedRecord(row)">
                          {{ $t('operate.modify') }}
                        </t-link>
                        <t-link theme="danger" @click="onDeleteBuriedRecord(row)">
                          {{ $t('operate.delete') }}
                        </t-link>
                      </div>
                      <span v-else>-</span>
                    </template>
                  </t-table>
                </t-form-item>
              </t-col>
              <!-- 维修状态从开单页墓位信息区移除 20260901 修改 -->
              <!-- 预定形态字段（同墓位预定页：联系人/电话），数据映射 graveplotbusiness 的 payer/payerPhone 列 20260923 新增 -->
              <template v-if="formMode === 'reserve'">
                <t-col :span="6">
                  <t-form-item :required="true" :label="$t('pages.gravePlotBusiness.liaison')" name="payer">
                    <t-input
                      v-model="formBusinessData.payer"
                      :maxcharacter="20"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.liaisonPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.liaisonPhone')" name="payerPhone">
                    <t-input
                      v-model="formBusinessData.payerPhone"
                      :maxcharacter="11"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.liaisonPhonePlaceholder')"
                    />
                  </t-form-item>
                </t-col>
              </template>
              <!-- 收款人与编号字段 20260918 新增，字段顺序：编号、实收金额、付款人、付款人电话、付款人身份证号、收款人 20260918 调整；
                   预定形态不展示这些字段（同墓位预定页）；下葬形态也不展示（无销售信息的纯下葬信息页）；
                   联系人形态仅剩联系人列表管理，不再展示业务字段 20260923 修改 20260924 修改 -->
              <template v-if="formMode !== 'reserve' && formMode !== 'buried' && formMode !== 'business'">
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.serialNo')" name="serialNo">
                    <t-input
                      v-model="formBusinessData.serialNo"
                      :maxcharacter="6"
                      show-limit-number
                      :style="{ width: '312px' }"
                      :placeholder="$t('pages.gravePlotBusiness.serialNoPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.realPrice')" name="realPrice">
                    <t-input-number
                      v-model="formBusinessData.realPriceString"
                      large-number
                      max="9999999"
                      min="0"
                      theme="normal"
                      :style="{ width: '312px' }"
                      :placeholder="$t('pages.gravePlotBusiness.realPricPlaceholder')"
                      @blur="changeNumberFocus('price', formBusinessData.realPriceString)"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item
                    :required="true"
                    :label="formMode === 'sale' ? $t('pages.room.buyer') : $t('pages.gravePlotBusiness.payer')"
                    name="payer"
                  >
                    <t-input
                      v-model="formBusinessData.payer"
                      :maxcharacter="20"
                      show-limit-number
                      :style="{ width: '312px' }"
                      :placeholder="$t('pages.gravePlotBusiness.payerPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item
                    :required="true"
                    :label="
                      formMode === 'sale'
                        ? $t('pages.gravePlotBusiness.buyerPhone')
                        : $t('pages.gravePlotBusiness.phone')
                    "
                    name="payerPhone"
                  >
                    <t-input
                      v-model="formBusinessData.payerPhone"
                      :maxcharacter="11"
                      show-limit-number
                      :style="{ width: '312px' }"
                      :placeholder="$t('pages.gravePlotBusiness.phonePlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item
                    :label="
                      formMode === 'sale'
                        ? $t('pages.gravePlotBusiness.buyerIDCard')
                        : $t('pages.gravePlotBusiness.payerIDCard')
                    "
                    name="payerIDCard"
                  >
                    <t-input
                      v-model="formBusinessData.payerIDCard"
                      :maxcharacter="18"
                      show-limit-number
                      :style="{ width: '312px' }"
                      :placeholder="$t('pages.gravePlotBusiness.payerIDCardPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.payee')" name="payee">
                    <t-input
                      v-model="formBusinessData.payee"
                      :maxcharacter="20"
                      show-limit-number
                      :style="{ width: '312px' }"
                      :placeholder="$t('pages.gravePlotBusiness.payeePlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <!-- 安葬者三字段：销售形态下随开单同步 buried 表（修改时按 idSale 联查回填，无对应 buried 记录则为空）20260923 新增 -->
                <template v-if="formMode === 'sale'">
                  <t-col :span="6">
                    <t-form-item :label="$t('pages.gravePlotBusiness.deceased')" name="deceased">
                      <t-input
                        v-model="formBusinessData.deceased"
                        :maxcharacter="20"
                        show-limit-number
                        :style="{ width: '312px' }"
                        :placeholder="$t('pages.gravePlotBusiness.deceasedPlaceholder')"
                      />
                    </t-form-item>
                  </t-col>
                  <t-col :span="6">
                    <t-form-item :label="$t('pages.gravePlotBusiness.burialDate')" name="burialDate">
                      <t-date-picker
                        v-model="formBusinessData.burialDate"
                        :style="{ width: '312px' }"
                        theme="primary"
                        mode="date"
                        separator="/"
                        :placeholder="$t('pages.gravePlotBusiness.burialDatePlaceholder')"
                      />
                    </t-form-item>
                  </t-col>
                  <t-col :span="6">
                    <t-form-item :label="$t('pages.gravePlotBusiness.deceasedIDCard')" name="deceasedIDCard">
                      <t-input
                        v-model="formBusinessData.deceasedIDCard"
                        :maxcharacter="18"
                        show-limit-number
                        :style="{ width: '312px' }"
                        :placeholder="$t('pages.gravePlotBusiness.deceasedIDCardPlaceholder')"
                      />
                    </t-form-item>
                  </t-col>
                  <!-- 逝者关系：安葬者身份证号右侧同行，仅销售形态录入，保存到 buried.deceasedRelation 20260924 新增 -->
                  <t-col :span="6">
                    <t-form-item :label="$t('pages.gravePlotBusiness.deceasedRelation')" name="deceasedRelation">
                      <t-input
                        v-model="formBusinessData.deceasedRelation"
                        :maxcharacter="20"
                        show-limit-number
                        :style="{ width: '312px' }"
                        :placeholder="$t('pages.gravePlotBusiness.deceasedRelationPlaceholder')"
                      />
                    </t-form-item>
                  </t-col>
                </template>
              </template>
              <!-- 联系人形态（墓位联系人页）：列表视图展示联系人记录列表（表头“新增”入口，行内修改/删除）；
                   新增/修改视图不展示列表 20260924 新增 -->
              <t-col v-if="formMode === 'business' && contactsEditMode === 'list'" :span="12">
                <t-table
                  class="buried-record-table"
                  :data="contactsRecords"
                  :columns="contactsBusinessColumns"
                  row-key="idContacts"
                  :bordered="true"
                  size="small"
                  :max-height="240"
                >
                  <!-- 操作列：修改回填表单、删除二次确认后软删该条联系人记录 20260924 新增 -->
                  <template #op="{ row }">
                    <div class="record-op-links">
                      <t-link theme="primary" @click="onModifyContactsRecord(row)">
                        {{ $t('operate.modify') }}
                      </t-link>
                      <t-link theme="danger" @click="onDeleteContactsRecord(row)">
                        {{ $t('operate.delete') }}
                      </t-link>
                    </div>
                  </template>
                </t-table>
              </t-col>
              <!-- 联系人形态新增/修改视图：联系人编辑表单（contacts 表三字段），无列表；
                   提交保存联系人记录并停留刷新列表 20260924 新增 -->
              <template v-if="formMode === 'business' && contactsEditMode !== 'list'">
                <t-col :span="6">
                  <t-form-item :required="true" :label="$t('pages.gravePlotBusiness.contacts')" name="contacts">
                    <t-input
                      v-model="formContactsData.contacts"
                      :maxcharacter="20"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.contactsPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.contactsPhone')" name="contactsPhone">
                    <t-input
                      v-model="formContactsData.contactsPhone"
                      :maxcharacter="11"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.contactsPhonePlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.contactsIDCard')" name="contactsIDCard">
                    <t-input
                      v-model="formContactsData.contactsIDCard"
                      :maxcharacter="18"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.contactsIDCardPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
              </template>
              <template v-if="formMode === 'buried' && buriedEditMode !== 'list'">
                <t-col :span="6">
                  <t-form-item :required="true" :label="$t('pages.gravePlotBusiness.deceased')" name="deceased">
                    <t-input
                      v-model="formBusinessData.deceased"
                      :maxcharacter="20"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.deceasedPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.deceasedIDCard')" name="deceasedIDCard">
                    <t-input
                      v-model="formBusinessData.deceasedIDCard"
                      :maxcharacter="18"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.deceasedIDCardPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :required="true" :label="$t('pages.gravePlotBusiness.burialDate')" name="burialDate">
                    <t-date-picker
                      v-model="formBusinessData.burialDate"
                      :style="{ width: '322px' }"
                      theme="primary"
                      mode="date"
                      separator="/"
                      :placeholder="$t('pages.gravePlotBusiness.burialDatePlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.contacts')" name="contacts">
                    <!-- 联系人输入框右侧“选择”按钮：打开联系人选择页，选中后回填联系人三字段（同下葬页）20260923 新增 -->
                    <div style="display: flex; gap: 8px; align-items: center">
                      <!-- 联系人输入框自适应填充剩余宽度，与“选择”按钮整体右缘对齐容器右界（宽度由本页 less 控制）20260923 修改 -->
                      <t-input
                        v-model="formBusinessData.contacts"
                        class="contacts-inline-input"
                        :maxcharacter="20"
                        show-limit-number
                        :placeholder="$t('pages.gravePlotBusiness.contactsPlaceholder')"
                      />
                      <t-button
                        theme="default"
                        variant="outline"
                        style="margin-left: auto"
                        @click="handleOpenContactsSelect()"
                      >
                        {{ $t('pages.gravePlotBusiness.select') }}
                      </t-button>
                    </div>
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.contactsPhone')" name="contactsphone">
                    <t-input
                      v-model="formBusinessData.contactsphone"
                      :maxcharacter="11"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.contactsPhonePlaceholder')"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item :label="$t('pages.gravePlotBusiness.contactsIDCard')" name="contactsIDCard">
                    <t-input
                      v-model="formBusinessData.contactsIDCard"
                      :maxcharacter="18"
                      show-limit-number
                      :style="{ width: '322px' }"
                      :placeholder="$t('pages.gravePlotBusiness.contactsIDCardPlaceholder')"
                    />
                  </t-form-item>
                </t-col>
              </template>
            </t-row>
            <!-- 备注改回单行输入框，宽度与联系人电话输入框右缘对齐（实测681），字数限制50并在输入框右侧计数，同电话 20260916 修改；
                 下葬形态例外：仅新增/修改视图展示（列表视图不显示输入框），原备注行拆为两个输入框——
                 左侧逝者关系（单行，同列宽 322px），右侧备注（多行 height 124）20260923 修改 20260924 修改 20260925 修改 -->
            <div v-if="formMode === 'buried' && buriedEditMode !== 'list'" class="buried-relation-remark-row">
              <t-form-item :label="$t('pages.gravePlotBusiness.deceasedRelation')" name="deceasedRelation">
                <t-input
                  v-model="formBusinessData.deceasedRelation"
                  :maxcharacter="20"
                  show-limit-number
                  :style="{ width: '322px' }"
                  :placeholder="$t('pages.gravePlotBusiness.deceasedRelationPlaceholder')"
                />
              </t-form-item>
              <t-form-item :label="$t('pages.gravePlotBusiness.remark')" name="remark">
                <t-input
                  v-model="formBusinessData.remark"
                  :maxcharacter="50"
                  :height="124"
                  :placeholder="$t('pages.gravePlotBusiness.remarkPlaceholder')"
                />
              </t-form-item>
            </div>
            <t-form-item
              v-else-if="formMode !== 'buried' && formMode !== 'business'"
              :label="$t('pages.gravePlotBusiness.remark')"
              name="remark"
            >
              <t-input
                v-model="formBusinessData.remark"
                :maxcharacter="50"
                show-limit-number
                :style="{ width: '690px' }"
                :placeholder="$t('pages.gravePlotBusiness.remarkPlaceholder')"
              />
            </t-form-item>
          </div>
        </div>

        <!-- 提交区：下葬形态列表视图（纯列表）与联系人形态列表视图（纯联系人列表）不展示提交/取消按钮，仅新增/修改视图展示 20260924 修改 -->
        <div
          v-if="
            (formMode !== 'buried' || buriedEditMode !== 'list') &&
            (formMode !== 'business' || contactsEditMode !== 'list')
          "
          class="form-submit-container"
        >
          <div class="form-submit-sub">
            <div class="form-submit-left">
              <t-button
                theme="primary"
                class="form-submit-confirm"
                :disabled="businessSubmitted || saleFormDisabled"
                @click="ClickSubmit()"
              >
                {{ $t('operate.confirm') }}
              </t-button>

              <!-- 取消按钮：下葬形态重置表单保持当前墓位；联系人新增/修改视图退出并回列表视图 20260923 修改 20260924 修改 -->
              <t-button
                v-if="formMode === 'buried' || (formMode === 'business' && contactsEditMode !== 'list')"
                class="form-submit-cancel"
                theme="default"
                @click="onCancelBuriedOrContacts()"
              >
                {{ $t('operate.cancel') }}
              </t-button>

              <!-- 打印票据按钮：修改模式进入即显示（表单已回填可打印当前单据），新建提交成功后显示；
                   预定/下葬/联系人形态无票据（同墓位预定/下葬页；联系人页无业务单据）；
                   打印为只读操作：t-button 同样会注入 t-form 的 formDisabled 被 :disabled 一并禁用，
                   显式 :disabled=false 使组件级 disabled 优先于表单级，非管理员有销售记录时仍可打印 20260923 修改 20260924 修改 20260924 修复 -->
              <t-button
                v-if="
                  formMode !== 'reserve' &&
                  formMode !== 'buried' &&
                  formMode !== 'business' &&
                  (businessSubmitted || formBusinessData.idBusiness !== 0)
                "
                class="form-submit-cancel"
                theme="default"
                :disabled="false"
                @click="printReceipt()"
              >
                {{ $t('operate.printReceipt') }}
              </t-button>
            </div>
          </div>
        </div>
      </t-form>
    </div>
    <!-- 业务登记结束 20260923 修改 -->
    <!-- 联系人选择页（下葬形态联系人字段“选择”按钮进入）：样式同下葬页，操作列选中回填联系人三字段并返回下葬表单 20260923 新增 -->
    <div v-if="isContactsSelectShow">
      <t-form class="base-form" :data="formBusinessData" label-align="top" :label-width="100">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div class="form-basic-container-title">
              {{ $t('pages.gravePlotBusiness.selectContactTitle') }}
              <t-button
                class="cms-back-btn"
                style="float: right"
                theme="default"
                variant="text"
                @click="handleCloseContactsSelect()"
              >
                {{ $t('operate.backDetail') }}
                <rollback-icon size="16px" />
              </t-button>
            </div>

            <t-row class="info-block des" :gutter="[62, 5]">
              <t-col :span="6">
                <span>{{ $t('pages.room.park') }} : {{ formRoomData.park }}</span>
              </t-col>
              <t-col :span="6">
                <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber 20260901 修改 -->
                <span>{{ $t('pages.room.xyNumber') }} : {{ formRoomData.xyNumber }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.roomType') }} : {{ t(formRoomData.roomType) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.specs') }} : {{ formRoomData.specs }}</span>
              </t-col>
              <t-col :span="6">
                <!-- priceString 列已删，墓位价格由数值 price 千分位格式化 20260910 修改 -->
                <span>{{ $t('pages.room.price') }} : {{ formatPrice(formRoomData.price) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.saleStatus') }} : {{ t(formRoomData.saleStatus) }}</span>
              </t-col>
              <t-col :span="12">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>

              <!-- 该墓位活动联系人列表，操作列逐行“选择”按钮，点击回填下葬表单并返回 20260923 新增 -->
              <t-col :span="12">
                <t-form-item name="idContacts">
                  <t-table
                    class="buried-record-table"
                    :data="contactsRecords"
                    :columns="contactsColumns"
                    row-key="idContacts"
                    :bordered="true"
                    size="small"
                    :max-height="240"
                  >
                    <template #op="{ row }">
                      <t-link theme="primary" @click="onSelectContact(row)">
                        {{ $t('pages.gravePlotBusiness.select') }}
                      </t-link>
                    </template>
                  </t-table>
                </t-form-item>
              </t-col>
            </t-row>
          </div>
        </div>
      </t-form>
    </div>
    <!-- 联系人选择页结束 20260923 新增 -->
    <!-- 删除下葬记录二次确认弹窗（同下葬页，代码独立）20260923 新增 -->
    <t-dialog
      v-model:visible="confirmVisible"
      :header="dialogHeader"
      :body="confirmBody"
      :on-cancel="onCancel"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
<script lang="ts">
export default {
  name: 'GravePlotBusiness',
};
</script>
<script setup lang="ts">
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { Link, MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onActivated, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import type {
  GravePlotBusinessContactsModel,
  GravePlotBusinessFormType,
  GravePlotBusinessModel,
  GravePlotBusinessRoomRow,
} from '@/api/gravePlotBusiness';
import {
  deleteGravePlotBusiness,
  getGravePlotBusinessByRoom,
  getGravePlotBusinessContacts,
  getGravePlotBusinessRoomList,
  insertGravePlotBusiness,
  updateGravePlotBusiness,
} from '@/api/gravePlotBusiness';
import { getReceiptConfigForPrint } from '@/api/receiptConfig';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH } from '@/constants';
import { useCardGrid, usePageSwitch, useParkRoomFilter, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { useUserStore } from '@/store';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';
import type { ReceiptConfigData, ReceiptData } from '@/utils/receipt';
import { buildReceiptHtml } from '@/utils/receipt';

import { FIND_DATA, INITIAL_BUSINESS_DATA, INITIAL_ROOM_DATA } from './constants';

// ============================================================
// 墓位业务基础页：列表卡片（人员信息）+ 详情 + 业务登记，前后端与墓位销售完全独立 20260923 修改,
// 本页将集成销售/下葬/联系人形态的业务登记，但只读写 graveplotbusiness 自有表，不与既有功能混用（避免风险）20260923 修改,
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活、查询数据丢失的问题 20260828 修复,
useTabCacheName('GravePlotBusiness');

// 卡片操作行移除后权限门控(userInfo/usePermission)随之移除，恢复操作入口时需按 idMenu(103101) 重取权限 20260923 修改,
// 经办人字段不再展示，后端保存时仍自动写入当前登录用户 operator 20260916 修改,

// 卡片状态胶囊行已移除，状态配色函数 statusKey 随之移除 20260923 修改,
// 销售状态判定：已销售时预定人标题恢复默认灰色，不再应用主题绿 20260923 新增
const isSold = (status?: string) => status === 'statusType.saleStatusEnum.sold';
// 卡片长文本截断：下葬者/联系人超过7字显示前7字+省略号，悬停 tooltip 展示完整内容 20260923 新增
const truncateText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 7)}…` : text;
};
// 下葬者截断：超过7字时显示前6字+4个半角点（用户指定 20260924）
const truncateBuriedText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 6)}....` : text;
};
// 联系人截断：同下葬者，超过7字时显示前6字+4个半角点（用户指定 20260924）
const truncateContactsText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 6)}....` : text;
};
// 是否超过7字需要截断并显示悬停提示 20260923 新增
const isOverflow = (value?: string | null) => String(value || '').length > 7;

type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_ROOM_DATA;
type BusinessFormData = typeof INITIAL_BUSINESS_DATA;
// 提交数据排除实收金额字符串与创建日期：金额由数值字段提交，创建日期由后端审计自动写入；
// type 标识业务形态决定后端落哪张数据表（sale/reserve/默认 graveplotbusiness）20260923 修改
type BusinessSubmitData = Omit<BusinessFormData, 'realPriceString' | 'createDate'> & {
  realPrice: number;
  type?: GravePlotBusinessFormType;
};

// 三个视图互斥显示：列表 / 详情 / 新建销售开单，切换逻辑收敛于公共 usePageSwitch 20260828 梳理,
// 联系人选择页（下葬形态）：与列表/详情/登记页互斥 20260923 新增
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
const isContactsSelectShow = ref(false);
const { controlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  createModify: isCreateShow,
  contactsSelect: isContactsSelectShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由墓区销售下区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260831 新增,
const menuRegion = (useRoute().meta.region as string) || '';
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
const businessCardViewport = ref<HTMLElement | null>(null);

// ==================== 卡片区滚动位置保持（tab 切换往返） ====================
// 页面 keep-alive 保活仅保留数据：失活时组件 DOM 从文档移除，内部滚动容器 scrollTop 随之归零，
// 切回 tab 会回到顶部；改为滚动时实时记录位置，onActivated（tab 切回）时恢复到原滚动行 20260925 新增
const businessCardScrollTop = ref(0);
const onCardViewportScroll = (e: Event) => {
  businessCardScrollTop.value = (e.target as HTMLElement).scrollTop;
};

onActivated(() => {
  // 列表视图且有卡片数据时才恢复；详情/登记视图无卡片区不处理
  if (!isListShow.value || !businessCardRows.value.length) {
    return;
  }
  nextTick(() => {
    if (businessCardViewport.value) {
      businessCardViewport.value.scrollTop = businessCardScrollTop.value;
    }
  });
});

// 区域/园区下拉、园区联动、排号去重、查询二次过滤收敛于公共 useParkRoomFilter 20260914 抽取
const {
  searchRoomList,
  hasQueried,
  availableParkList,
  yNumList,
  getRegionData,
  getParkData,
  onSelectChange,
  getRoomData,
  onSubmit,
} = useParkRoomFilter<GravePlotBusinessRoomRow>(
  formfindData,
  // 墓位列表改走本模块独立接口：room 联查活动预定记录带出预定人 20260923 修改,
  (park, region) => getGravePlotBusinessRoomList(park, region),
);

// ==================== 列表：卡片行分组与缩放 ====================
// 迁出状态：已迁出。已迁出的墓位不展示（迁出为终态，其展示由迁出查询页负责）20260921 新增
const TRANSFER_OUT_OUT = 'statusType.transferOutStatusEnum.out';
// 卡片列表过滤已迁出的墓位后再进入网格补位 20260921 新增
const visibleBusinessRoomList = computed(() =>
  searchRoomList.value.filter((item) => item.transferOutStatus !== TRANSFER_OUT_OUT),
);
// 卡片网格：按排分组补位/缩放控制/记录数文案统一由 useCardGrid 提供 20260914 抽取
const {
  zoom: businessZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: rawBusinessCardRows,
  totalText: listTotalText,
} = useCardGrid(visibleBusinessRoomList);

// 排序选项：对排号 yNum 升/降序，默认降序；useCardGrid 内行组固定按排号升序分组，
// 降序时反转行组（组内序号顺序不变），升序保持原序 20260925 新增
const businessCardRows = computed(() =>
  formfindData.value.sortOrder === 'asc' ? rawBusinessCardRows.value : rawBusinessCardRows.value.slice().reverse(),
);

// ==================== 列表：查询与筛选事件 ====================
// 按园区+区域请求可售墓位，加载完成后才置 hasQueried，避免先闪现“暂无数据”再切换为卡片 20260827 修改,

onMounted(() => {
  getRegionData();
  getParkData();
  // 列表不再默认查询展示，需用户选择园区后手动查询 20260831 修改,
  setTimeout(() => {
    controlPageShow('list');
  }, 380);
});

// ==================== 详情 ====================
// 详情数据：单条墓位与活动预定/销售记录、下葬/收款/联系人记录列表，统一由 useRoomDetail 管理 20260907 修改 20260914 抽取
const {
  detailRoom,
  detailReserve,
  detailSale,
  detailBuried,
  detailAdminfees,
  detailContacts,
  loadDetail,
  clearDetail,
} = useRoomDetail();

// 双击卡片打开详情：拉取 6 类详情数据后进入详情视图（同墓位销售页 handleClickDetail）20260924 新增
const handleClickDetail = async (row: GravePlotBusinessRoomRow) => {
  try {
    await loadDetail(row.idRoom);
    controlPageShow('detail');
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表 20260907 修改,
const ClickDetailClose = () => {
  clearDetail();
  controlPageShow('list');
};

// ==================== 业务登记（独立实现，读写 graveplotbusiness 表）20260923 修改 ====================
const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formBusinessData = ref<BusinessFormData>({ ...INITIAL_BUSINESS_DATA });

// 新建提交成功后置灰确认按钮防重复提交，重新进入表单时重置 20260922 新增
const businessSubmitted = ref(false);

const resetBusinessForm = (idRoom = 0) => {
  businessSubmitted.value = false;
  formBusinessData.value = {
    ...INITIAL_BUSINESS_DATA,
    idRoom,
  };
};

// 表单模式：预定人按钮进入预定形态，购买人按钮进入销售形态，下葬者按钮进入下葬形态，
// 联系人按钮进入业务登记形态 20260923 修改
const formMode = ref<'sale' | 'business' | 'reserve' | 'buried'>('business');

// ==================== 下葬形态：记录选择表格与联系人选择（同下葬页修改页，代码独立）20260923 新增 ====================
// 该墓位全部活动下葬记录（倒序最新在前），操作列“修改”回填表单、“删除”二次确认软删
const buriedRecords = ref<GravePlotBusinessModel[]>([]);
// 下葬形态三视图：list=列表视图（墓穴信息+记录列表，无输入框）、add=新增视图（空表单，无列表）、
// modify=修改视图（数据带入，无列表）；点表头“新增”/行内“修改”进入，提交/取消/返回回列表视图 20260924 修改
const buriedEditMode = ref<'list' | 'add' | 'modify'>('list');
const buriedRecordColumns: PrimaryTableCol[] = [
  { title: translate('pages.gravePlotBusiness.deceased'), colKey: 'deceased' },
  // 安葬者身份证号列加宽至 200px，确保 18 位号码完整显示（同下葬页）
  { title: translate('pages.gravePlotBusiness.deceasedIDCard'), colKey: 'deceasedIDCard', width: 200 },
  { title: translate('pages.gravePlotBusiness.burialDate'), colKey: 'burialDate' },
  // 操作列表头改为“新增”按钮：样式与行内“修改”链接一致（t-link），点击清空表单新增下葬记录；整列内容居中 20260923 修改
  {
    colKey: 'op',
    width: 110,
    align: 'center',
    title: (h) => h(Link, { theme: 'primary', onClick: handleClickBuriedAdd }, () => translate('operate.add')),
  },
];

// ==================== 联系人形态（墓位联系人页）：记录列表与三视图（同下葬页交互，代码独立）20260924 新增 ====================
// 联系人形态三视图：list=列表视图（墓穴信息+业务字段+联系人列表）、add=新增联系人（空表单）、
// modify=修改联系人（数据带入）；点表头“新增”/行内“修改”进入，提交/取消/返回回列表视图
const contactsEditMode = ref<'list' | 'add' | 'modify'>('list');
// 联系人编辑表单数据（contacts 表字段，独立于业务登记表单）
const formContactsData = ref<{
  idContacts: number;
  idRoom: number;
  contacts: string;
  contactsPhone: string;
  contactsIDCard: string;
}>({
  idContacts: 0,
  idRoom: 0,
  contacts: '',
  contactsPhone: '',
  contactsIDCard: '',
});
// 联系人记录列表列：联系人/电话/身份证号 + 操作列（表头“新增”入口，行内修改/删除，同下葬页记录列表交互）
const contactsBusinessColumns: PrimaryTableCol[] = [
  { title: translate('pages.gravePlotBusiness.contacts'), colKey: 'contacts' },
  { title: translate('pages.gravePlotBusiness.contactsPhone'), colKey: 'contactsPhone', width: 140 },
  { title: translate('pages.gravePlotBusiness.contactsIDCard'), colKey: 'contactsIDCard', width: 180 },
  {
    colKey: 'op',
    width: 110,
    align: 'center',
    title: (h) => h(Link, { theme: 'primary', onClick: handleClickContactsAdd }, () => translate('operate.add')),
  },
];

// 表单标题随模式切换：预定/销售/下葬形态新建与修改统一固定标题（“墓位预定”/“墓穴销售”/“墓穴下葬”，同既有页面）；
// 联系人（业务登记）形态统一固定标题“墓位联系人” 20260923 修改 20260924 修改
const formTitle = computed(() => {
  if (formMode.value === 'reserve') {
    return translate('pages.gravePlotBusiness.reserveTitle');
  }
  if (formMode.value === 'sale') {
    return translate('pages.gravePlotBusiness.saleTitle');
  }
  if (formMode.value === 'buried') {
    return translate('pages.gravePlotBusiness.buriedTitle');
  }
  return translate('pages.gravePlotBusiness.contactTitle');
});

// 点击人员操作按钮（联系人）：卡片行数据即墓位全量字段（/room-list SELECT r.*）
// 直接回填墓位信息区免二次请求；有活动业务记录回填为“修改”，无则空表单为“新建”；
// 进入即回列表视图并拉取联系人记录列表 20260923 修改 20260924 修改
const handleClickPerson = async (row: GravePlotBusinessRoomRow) => {
  formMode.value = 'business';
  contactsEditMode.value = 'list';
  contactsRecords.value = [];
  await enterBusinessForm(row);
  await loadContactsRecords(row.idRoom);
};

// 点击购买人按钮：进入销售形态表单——样式内容同墓位销售页（有销售信息“修改销售”、无则“销售墓穴”），
// 但数据判定与读写仍走 graveplotbusiness 自有表，不碰 sale 20260923 新增
const handleClickBuyer = async (row: GravePlotBusinessRoomRow) => {
  formMode.value = 'sale';
  enterBusinessForm(row);
};

// 点击预定人按钮：进入预定形态表单——样式内容同墓位预定页（“墓位预定”），
// 数据判定与读写走自有接口读写 reserve 表 20260923 修改；已销售墓位不可再预定（按钮已禁用，此处兜底拦截）20260924 新增
const handleClickReserve = async (row: GravePlotBusinessRoomRow) => {
  if (isSold(row.saleStatus)) return;
  formMode.value = 'reserve';
  await enterBusinessForm(row);
  // 预定形态无金额字段（同墓位预定页），清空默认带入/回填的实收金额 20260923 新增
  formBusinessData.value.realPriceString = '';
};

// 点击下葬者按钮：进入下葬形态表单——内容同下葬页修改页（记录选择表格 + 安葬者/下葬日期/联系人等），
// 数据判定与读写走自有接口读写 buried 表（多记录时默认选中最新一条，可单选切换）20260923 修改
const handleClickBuried = async (row: GravePlotBusinessRoomRow) => {
  formMode.value = 'buried';
  // 清空上一墓位的下葬记录与联系人选择数据，避免残留；进入即回到列表视图（默认展示记录列表）20260923 修改 20260924 修改
  buriedRecords.value = [];
  contactsRecords.value = [];
  buriedEditMode.value = 'list';
  await enterBusinessForm(row);
  // 下葬形态无金额字段（同下葬页），清空默认带入/回填的实收金额 20260923 新增
  formBusinessData.value.realPriceString = '';
};

// 进入表单公共流程：重置表单 + 回填墓位信息区 + 按墓位查活动记录回填（无记录则保持新建空表单）20260923 抽取
const enterBusinessForm = async (row: GravePlotBusinessRoomRow) => {
  resetBusinessForm(row.idRoom);
  formRoomData.value = {
    ...row,
    xNum: String(row.xNum ?? ''),
    yNum: String(row.yNum ?? ''),
  };
  // 实收金额默认等于墓位价格，仍可手动修改；priceString 列已删，由数值 price 格式化 20260910 修改,
  formBusinessData.value.realPriceString = formatPrice(row.price);
  // 代码独立但数据表复用原有表：销售形态查 sale、预定形态查 reserve、下葬形态查 buried（倒序取最新一条）、默认 graveplotbusiness 20260923 修改
  const formType: GravePlotBusinessFormType | undefined =
    formMode.value === 'sale' || formMode.value === 'reserve' || formMode.value === 'buried'
      ? formMode.value
      : undefined;
  await fillBusinessForm(row.idRoom, formType);
  controlPageShow('createModify');
};

// 按墓位查询当前活动业务记录（type 决定查哪张表），回填表单可编辑字段及 idBusiness（无记录则保持新建空表单）20260923 修改
const fillBusinessForm = async (idRoom: number, type?: GravePlotBusinessFormType) => {
  try {
    const { list } = await getGravePlotBusinessByRoom(idRoom, type);
    // 下葬形态：始终用最新列表覆盖记录表格（含空列表，删除最后一条后清空表格）20260924 修改
    if (type === 'buried') {
      buriedRecords.value = list ?? [];
    }
    if (!list || list.length === 0) {
      return;
    }
    const record = list[0];
    formBusinessData.value = {
      idBusiness: record.idBusiness,
      idRoom,
      realPrice: record.realPrice ?? 0,
      // 实收金额允许为 0：真值判断会把 0 当空，改判空使 0 回填显示为 "0" 20260924 修改
      realPriceString: record.realPrice != null ? formatPrice(record.realPrice) : '',
      payer: record.payer ?? '',
      payerPhone: record.payerPhone ?? '',
      remark: record.remark ?? '',
      payerIDCard: record.payerIDCard ?? '',
      payee: record.payee ?? '',
      serialNo: record.serialNo ?? '',
      // 安葬者三字段：销售形态按 idSale 联查 buried 带出；下葬形态直接由 buried 记录带出 20260923 修改,
      deceased: record.deceased ?? '',
      burialDate: record.burialDate ?? '',
      deceasedIDCard: record.deceasedIDCard ?? '',
      // 逝者关系：销售形态联查 buried 带出（仅销售表单录入）20260924 新增,
      deceasedRelation: record.deceasedRelation ?? '',
      // 联系人三字段：下葬形态由 buried 记录带出（buried 表列名 contactsphone 全小写）20260923 新增,
      contacts: record.contacts ?? '',
      contactsphone: record.contactsphone ?? '',
      contactsIDCard: record.contactsIDCard ?? '',
      // 创建日期回填：票据编号取 yyyymmdd 前缀 20260922 新增
      createDate: record.createDate ?? '',
    };
  } catch (e) {
    logError(e);
  }
};

// 下葬形态新增/修改/删除成功后：刷新卡片与记录列表并回到列表视图（默认回填最新记录），
// 连续操作无需重新进入；点“返回”才回墓位业务列表页 20260924 修改
const refreshBuriedStay = async () => {
  await getRoomData();
  buriedEditMode.value = 'list';
  await fillBusinessForm(formRoomData.value.idRoom, 'buried');
};

// 返回按钮分级：下葬新增/修改视图先回列表视图（含列表，回填最新记录）；联系人新增/修改视图回列表视图；
// 列表视图及其他形态直接回列表页 20260924 修改
const onBackBuriedBusiness = () => {
  if (formMode.value === 'buried' && buriedEditMode.value !== 'list') {
    buriedEditMode.value = 'list';
    const record = buriedRecords.value[0];
    if (record) {
      fillBuriedFormRecord(record);
    }
    return;
  }
  if (formMode.value === 'business' && contactsEditMode.value !== 'list') {
    contactsEditMode.value = 'list';
    return;
  }
  ClickCreateClose();
};

// ==================== 下葬形态：记录单选切换与联系人选择页（同下葬页，代码独立）20260923 新增 ====================
// 用选中的下葬记录回填表单（记录表格单选切换时），修改对象随之切换，保留墓位信息与其他形态字段不重置
const fillBuriedFormRecord = (record: GravePlotBusinessModel) => {
  formBusinessData.value = {
    ...formBusinessData.value,
    idBusiness: record.idBuried ?? record.idBusiness,
    idRoom: record.idRoom,
    deceased: record.deceased ?? '',
    deceasedIDCard: record.deceasedIDCard ?? '',
    burialDate: record.burialDate ?? '',
    // 逝者关系：随下葬记录回填（同安葬者字段）20260925 新增,
    deceasedRelation: record.deceasedRelation ?? '',
    // 联系人三字段：buried 表列 contactsphone 全小写
    contacts: record.contacts ?? '',
    contactsphone: record.contactsphone ?? '',
    contactsIDCard: record.contactsIDCard ?? '',
    remark: record.remark ?? '',
  };
};

// 操作列“修改”：用该下葬记录回填表单并进入修改视图（无列表，其余与下葬页一致，数据带入）20260923 新增 20260924 修改
const onModifyBuriedRecord = (record: GravePlotBusinessModel) => {
  fillBuriedFormRecord(record);
  buriedEditMode.value = 'modify';
};

// ==================== 联系人形态：拉取/刷新/回填（同下葬页交互，代码独立）20260924 新增 ====================
// 拉取该墓位活动联系人记录列表（自有 contacts-list 接口，倒序最新在前）
const loadContactsRecords = async (idRoom: number) => {
  try {
    const { list } = await getGravePlotBusinessContacts(idRoom);
    contactsRecords.value = list ?? [];
  } catch (e) {
    logError(e);
  }
};
// 联系人新增/修改/删除成功后：刷新卡片与联系人列表并回到列表视图，连续操作无需重新进入
const refreshContactsStay = async () => {
  await getRoomData();
  contactsEditMode.value = 'list';
  await loadContactsRecords(formRoomData.value.idRoom);
};
// 用联系人记录回填编辑表单（contacts 表字段）
const fillContactsFormRecord = (record: GravePlotBusinessContactsModel) => {
  formContactsData.value = {
    idContacts: record.idContacts,
    idRoom: record.idRoom,
    contacts: record.contacts ?? '',
    contactsPhone: record.contactsPhone ?? '',
    contactsIDCard: record.contactsIDCard ?? '',
  };
};
// 操作列“修改”：回填该联系人记录并进入修改视图（无列表，数据带入）
const onModifyContactsRecord = (record: GravePlotBusinessContactsModel) => {
  fillContactsFormRecord(record);
  contactsEditMode.value = 'modify';
};
// 表头“新增”：清空联系人表单并进入新增视图（无列表），保持当前墓位
const handleClickContactsAdd = () => {
  formContactsData.value = {
    idContacts: 0,
    idRoom: formRoomData.value.idRoom,
    contacts: '',
    contactsPhone: '',
    contactsIDCard: '',
  };
  contactsEditMode.value = 'add';
};
// 取消（联系人新增/修改视图）：退出并回到列表视图（含联系人列表）
const onCancelContacts = () => {
  contactsEditMode.value = 'list';
};
// 提交区取消按钮分发：下葬形态重置表单，联系人新增/修改视图退出回列表视图 20260924 新增
const onCancelBuriedOrContacts = () => {
  if (formMode.value === 'business' && contactsEditMode.value !== 'list') {
    onCancelContacts();
    return;
  }
  onCancelBuried();
};

// ==================== 下葬形态：删除记录（操作列“删除”，二次确认弹窗）20260923 新增 ====================
// 删除二次确认弹窗：下葬记录与联系人记录共用（type 区分文案与删除参数）20260924 修改
const confirmVisible = ref(false);
const deleteTarget = ref<
  { type: 'buried'; idBuried: number; idRoom: number } | { type: 'contacts'; idContacts: number; idRoom: number } | null
>(null);
const dialogHeader = translate('operate.deleteDataCPrompt');
const confirmBody = computed(() => {
  if (!deleteTarget.value) {
    return '';
  }
  const { park, yNum, xNum } = formRoomData.value;
  const prefix = `${translate('operate.deleteDataAPrompt')}${park}${yNum}${translate('operate.row')}${xNum}`;
  return (
    prefix +
    (deleteTarget.value.type === 'contacts'
      ? translate('pages.gravePlotBusiness.deleteContactsInfoPrompt')
      : translate('pages.gravePlotBusiness.deleteBuriedInfoPrompt'))
  );
});
const onCancel = () => {
  deleteTarget.value = null;
};

// 操作列“删除”：记录待删除目标并打开二次确认 20260923 新增
const onDeleteBuriedRecord = (record: GravePlotBusinessModel) => {
  deleteTarget.value = {
    type: 'buried',
    idBuried: record.idBuried ?? record.idBusiness,
    idRoom: record.idRoom,
  };
  confirmVisible.value = true;
};

// 联系人操作列“删除”：记录待删除联系人并打开二次确认 20260924 新增
const onDeleteContactsRecord = (record: GravePlotBusinessContactsModel) => {
  deleteTarget.value = {
    type: 'contacts',
    idContacts: record.idContacts,
    idRoom: record.idRoom,
  };
  confirmVisible.value = true;
};

// 确认删除：下葬记录按 idBuried、联系人按 idContacts 软删，成功后停留本页刷新对应记录列表（连续删除无需重进）20260923 新增 20260924 修改
const onConfirmDelete = async () => {
  if (!deleteTarget.value) {
    return;
  }
  const target = deleteTarget.value;
  deleteTarget.value = null;
  confirmVisible.value = false;
  try {
    if (target.type === 'contacts') {
      await deleteGravePlotBusiness({ idRoom: target.idRoom, type: 'contacts', idContacts: target.idContacts });
    } else {
      await deleteGravePlotBusiness({ idRoom: target.idRoom, type: 'buried', idBuried: target.idBuried });
    }
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
    if (target.type === 'contacts') {
      await refreshContactsStay();
    } else {
      await refreshBuriedStay();
    }
  } catch (e) {
    logError(e);
  }
};

// 联系人选择页数据与列：该墓位活动联系人（自有 contacts-list 接口），操作列逐行“选择”回填并返回
const contactsRecords = ref<GravePlotBusinessContactsModel[]>([]);
const contactsColumns: PrimaryTableCol[] = [
  { title: translate('pages.gravePlotBusiness.contacts'), colKey: 'contacts' },
  { title: translate('pages.gravePlotBusiness.contactsPhone'), colKey: 'contactsPhone', width: 140 },
  { title: translate('pages.gravePlotBusiness.contactsIDCard'), colKey: 'contactsIDCard', width: 180 },
  { title: translate('operate.operation'), colKey: 'op', width: 90 },
];

// 打开联系人选择页：查该墓位活动联系人（自有接口），无记录提示且不跳转（同下葬页）
const handleOpenContactsSelect = async () => {
  const { idRoom } = formBusinessData.value;
  try {
    const { list } = await getGravePlotBusinessContacts(idRoom);
    if (!list || list.length === 0) {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.noContact'));
    }
    contactsRecords.value = list;
    controlPageShow('contactsSelect');
  } catch (e) {
    logError(e);
  }
};

// 选择联系人：回填联系人/电话/身份证号（contacts 表列 contactsPhone 映射表单 contactsphone），返回下葬表单
const onSelectContact = (row: GravePlotBusinessContactsModel) => {
  formBusinessData.value.contacts = row.contacts ?? '';
  formBusinessData.value.contactsphone = row.contactsPhone ?? '';
  formBusinessData.value.contactsIDCard = row.contactsIDCard ?? '';
  contactsRecords.value = [];
  controlPageShow('createModify');
};

// 关闭联系人选择页：返回下葬表单，不改动已填内容
const handleCloseContactsSelect = () => {
  contactsRecords.value = [];
  controlPageShow('createModify');
};

// 取消（下葬形态）：重置表单为空表单保持当前墓位，不返回列表（同下葬页 onReset）
const onResetBuried = () => {
  resetBusinessForm(formRoomData.value.idRoom);
  // 下葬形态无金额字段，保持实收金额为空（表单已转新建）
  formBusinessData.value.realPriceString = '';
};

// 表头“新增”：进入下葬新增视图（空表单，无列表，其余与下葬页一致），保持当前墓位 20260924 修改
const handleClickBuriedAdd = () => {
  buriedEditMode.value = 'add';
  onResetBuried();
};

// 取消（下葬形态）：新增/修改视图下退出并回填最新记录（回到含列表的下葬页）20260924 修改
const onCancelBuried = () => {
  buriedEditMode.value = 'list';
  const record = buriedRecords.value[0];
  if (record) {
    fillBuriedFormRecord(record);
  }
};

// ==================== 新建：票据打印 ====================
// 经办人显示当前登录操作员姓名，开单保存时后端同样自动写入 20260921 新增
const userStore = useUserStore();

// 销售形态只读门控：存在销售记录且操作员非平台管理员（isAccount=0）时表单内容不可操作；
// 平台管理员（isAccount=1）可修改；新建销售（无记录）不受限；打印票据按钮除外（打印属只读操作，不受门控影响）20260924 新增
const saleFormDisabled = computed(
  () => formMode.value === 'sale' && formBusinessData.value.idBusiness !== 0 && userStore.isAccount === 0,
);

// 打印票据：校验付款人与金额后，点击手势内同步打开空白新标签页（原系统页不动），
// 查询收据配制后把完整票据文档直接写入新标签页并唤起浏览器打印对话框，不经 SPA 页面加载无中间页闪现 20260922 修改
const printReceipt = async () => {
  const { realPriceString, payer } = formBusinessData.value;
  if (payer === undefined || payer.trim() === '') {
    return MessagePlugin.warning(translate('pages.gravePlotBusiness.payerPlaceholder'));
  }
  if (realPriceString === undefined || realPriceString === '') {
    return MessagePlugin.warning(translate('pages.gravePlotBusiness.realPricPlaceholder'));
  }
  const data: ReceiptData = {
    payer: String(payer).trim(),
    realPriceString: String(realPriceString),
    payee: String(formBusinessData.value.payee ?? '').trim(),
    serialNo: String(formBusinessData.value.serialNo ?? '').trim(),
    // 票据编号前缀取业务创建日期，新建未保存时为空由工具回退当天日期 20260922 新增
    createDate: String(formBusinessData.value.createDate ?? ''),
    region: String(formRoomData.value.region ?? ''),
    park: String(formRoomData.value.park ?? ''),
    yNum: String(formRoomData.value.yNum ?? ''),
    xNum: String(formRoomData.value.xNum ?? ''),
    xyNumber: String(formRoomData.value.xyNumber ?? ''),
    userName: String(userStore.userName ?? ''),
  };
  // 收据配制（标题前缀/地址/电话）：打印读取不属页面操作，失败回退空值不阻断打印 20260922 修改
  let config: ReceiptConfigData = { prefix: '', phone: '', address: '' };
  try {
    const { list } = await getReceiptConfigForPrint(data.region);
    const item = list?.[0];
    if (item) {
      config = { prefix: item.prefix ?? '', phone: item.phone ?? '', address: item.address ?? '' };
    }
  } catch (e) {
    logError(e);
  }
  // 隐藏 iframe 打印会让打印预览覆盖系统页，改回新标签页方案：
  // 打开空白新标签页（屏幕无任何内容）写入票据文档，加载完成后直接唤起打印预览，原系统页保持不变可随时切回 20260922 修改
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return MessagePlugin.warning(translate('pages.gravePlotBusiness.printBlockedPrompt'));
  }
  const printDoc = printWindow.document;
  printDoc.open();
  printDoc.write(buildReceiptHtml(data, config));
  printDoc.close();
  // 等票据文档完全加载后再唤起打印，避免打印预览因页面加载未完成而一闪即关 20260922 修改
  const triggerPrint = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 100);
  };
  if (printDoc.readyState === 'complete') {
    triggerPrint();
  } else {
    printWindow.onload = triggerPrint;
  }
};

// 成交价失焦时格式化为千分位 20260828 梳理,
const changeNumberFocus = (value: string, number: string) => {
  if (value === 'price') {
    let val = number.replace(/\D/g, '');
    val = parseInt(val, 10).toString();
    val = val.replace(/\d{1,3}(?=(\d{3})+(\.|$))/g, '$&,');
    formBusinessData.value.realPriceString = val;
  }
};

// 开单关闭：清空数据并回到列表 20260828 梳理,
// 下葬/联系人形态的记录表格与选择数据随表单关闭一并清空，三视图回默认列表视图 20260923 新增 20260924 修改
const ClickCreateClose = () => {
  formRoomData.value = { ...INITIAL_ROOM_DATA };
  resetBusinessForm();
  buriedRecords.value = [];
  contactsRecords.value = [];
  buriedEditMode.value = 'list';
  contactsEditMode.value = 'list';
  controlPageShow('list');
};

// ==================== 提交业务登记（走 gravePlotBusiness 自有接口，按形态选表）20260923 修改 ====================
const ClickSubmit = async () => {
  const {
    realPriceString,
    payer,
    payerPhone,
    remark,
    idRoom,
    idBusiness,
    payerIDCard,
    payee,
    serialNo,
    deceased,
    burialDate,
    deceasedIDCard,
    deceasedRelation,
    contacts,
    contactsphone,
    contactsIDCard,
  } = formBusinessData.value;

  // 联系人形态新增/修改视图：确认按钮保存联系人记录（contacts 表），成功后停留本页刷新联系人列表 20260924 新增
  if (formMode.value === 'business' && contactsEditMode.value !== 'list') {
    const { idContacts, contacts, contactsPhone, contactsIDCard } = formContactsData.value;
    if (contacts === undefined || contacts.trim() === '') {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.contactsPlaceholder'));
    }
    const contactsPayload = {
      idRoom,
      type: 'contacts' as const,
      contacts: contacts.trim(),
      contactsPhone: contactsPhone.trim(),
      contactsIDCard: contactsIDCard.trim(),
    };
    try {
      if (idContacts === 0) {
        await insertGravePlotBusiness(contactsPayload);
        MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      } else {
        await updateGravePlotBusiness({ ...contactsPayload, idContacts });
        MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      }
      await refreshContactsStay();
    } catch (e) {
      logError(e);
      MessagePlugin.error(
        idContacts === 0 ? translate('operate.createdFailedPrompt') : translate('operate.modifyFailedPrompt'),
      );
    }
    return;
  }

  // 预定形态仅联系人必填（同墓位预定页）；下葬形态安葬者/下葬日期必填（同下葬页），均无金额字段、金额默认 0 20260923 修改
  const isReserveMode = formMode.value === 'reserve';
  const isBuriedMode = formMode.value === 'buried';
  const skipPrice = isReserveMode || isBuriedMode;
  let realPrice = 0;
  if (!skipPrice) {
    if (realPriceString === undefined || realPriceString === '') {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.realPricPlaceholder'));
    }
    realPrice = Number(realPriceString.replace(/,/g, ''));
    // 实收金额允许为 0（如赠送/全额减免），仅拦截负数与非数字 20260924 修改
    if (Number.isNaN(realPrice) || realPrice < 0) {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.realPricPlaceholder'));
    }
  }
  if (isBuriedMode) {
    if (deceased === undefined || deceased.trim() === '') {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.deceasedPlaceholder'));
    }
    if (burialDate === undefined || burialDate === '') {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.burialDatePlaceholder'));
    }
  } else if (payer === undefined || payer.trim() === '') {
    return MessagePlugin.warning(
      isReserveMode
        ? translate('pages.gravePlotBusiness.liaisonPlaceholder')
        : translate('pages.gravePlotBusiness.payerPlaceholder'),
    );
  }
  if (!isReserveMode && !isBuriedMode && (payerPhone === undefined || payerPhone.trim() === '')) {
    return MessagePlugin.warning(translate('operate.phonePlaceholder'));
  }

  const payload: BusinessSubmitData = {
    idBusiness,
    idRoom,
    realPrice,
    payer: payer.trim(),
    payerPhone: payerPhone.trim(),
    remark,
    // 付款人扩展字段随开单提交保存 20260901 新增,
    payerIDCard: payerIDCard.trim(),
    // 收款人与编号随开单提交保存 20260918 新增,
    payee: payee.trim(),
    serialNo: serialNo.trim(),
    // 安葬者三字段：销售形态随提交同步 buried 表；下葬形态直接写入 buried 表 20260923 修改,
    deceased: deceased.trim(),
    burialDate,
    deceasedIDCard: deceasedIDCard.trim(),
    // 逝者关系：销售形态随提交保存到 buried.deceasedRelation 20260924 新增,
    deceasedRelation: deceasedRelation.trim(),
    // 联系人三字段：下葬形态直接写入 buried 表（后端其他形态清理）20260923 新增,
    contacts: contacts.trim(),
    contactsphone: contactsphone.trim(),
    contactsIDCard: contactsIDCard.trim(),
    // 业务形态标识：销售落 sale 表、预定落 reserve 表、下葬落 buried 表，后端据此选表与联动 20260923 修改
    type:
      formMode.value === 'sale' || formMode.value === 'reserve' || formMode.value === 'buried'
        ? formMode.value
        : undefined,
  };

  // 预定/下葬形态提交成功直接返回列表（无票据打印环节），卡片信息随列表刷新更新 20260923 修改
  const backToList = isReserveMode || isBuriedMode;

  if (idBusiness === 0) {
    try {
      await insertGravePlotBusiness(payload);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      // 下葬形态连续新增：停留本页刷新记录列表（点“返回”才回列表页）；预定形态直接返回列表 20260924 修改
      if (isBuriedMode) {
        await refreshBuriedStay();
        return;
      }
      await getRoomData();
      if (backToList) {
        ClickCreateClose();
        return;
      }
      // 新建提交成功不返回列表，留在表单页以便打印票据，确认按钮置灰防重复提交 20260922 修改
      businessSubmitted.value = true;
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.createdFailedPrompt'));
    }
  } else {
    // 修改：idBusiness 非0 走更新接口；提交成功不返回，留在表单页可继续调整或打印票据；
    // 预定形态提交成功直接返回列表；下葬形态停留本页刷新记录列表 20260923 修改 20260924 修改
    try {
      await updateGravePlotBusiness(payload);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      if (isBuriedMode) {
        await refreshBuriedStay();
        return;
      }
      await getRoomData();
      if (backToList) {
        ClickCreateClose();
      }
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.modifyFailedPrompt'));
    }
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>
