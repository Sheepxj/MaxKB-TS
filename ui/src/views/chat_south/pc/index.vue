<template>
  <div
    class="chat-pc layout-bg"
    :class="classObj" 
    v-loading="loading"
    :style="{
      '--el-color-primary': applicationDetail?.custom_theme?.theme_color,
      '--el-color-primary-light-9': hexToRgba(applicationDetail?.custom_theme?.theme_color, 0.1)
    }"
  >
  <!--块chat-pc__header是聊天界面的标题栏-->
    <div class="chat-pc__header" :style="customStyle">
      <div class="flex align-center"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      >
        <div class="mr-12 ml-24 flex">
          <AppAvatar
            v-if="isAppIcon(applicationDetail?.icon)"
            shape="square"
            :size="32"
            style="background: none"
          >
            <img :src="applicationDetail?.icon" alt="" />
          </AppAvatar>
          <AppAvatar
            v-else-if="applicationDetail?.name"
            :name="applicationDetail?.name"
            pinyinColor
            shape="square"
            :size="32"
          />
        </div>
        <h4>{{ applicationDetail?.name }}</h4>

        <div class="flex justify-center align-center relative">  <!-- 添加 relative 定位 -->
          <span 
            ref="timeSeriesText" 
            class="time-series-text"
            :style="{ 
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` 
            }"
          >
            TimeSeriesForecasting
          </span>
        </div>

      </div>
    </div>

    
    <div>
      <div class="flex">
        <!-- 左侧预测记录 -->
        <div class="chat-pc__left border-r">
          <!-- 左侧预测记录列表表头 -->
          <div class="p-24 pb-0">
            <el-button class="add-button w-full primary" @click="newChat">
              <el-icon>
                <Plus />
              </el-icon>
              <span class="ml-4">{{ $t('timeSeries.createChat') }}</span>
            </el-button>
            <p class="mt-20 mb-8">{{ $t('chat.history') }}</p>
          </div>
          <!-- 存储预测记录区域，超过高度会自动添加垂直滚动条 -->
          <div class="left-height pt-0">
            <el-scrollbar>
              <div class="p-8 pt-0">
                <common-list
                  :style="{
                    '--el-color-primary': applicationDetail?.custom_theme?.theme_color,
                    '--el-color-primary-light-9': hexToRgba(
                      applicationDetail?.custom_theme?.theme_color,
                      0.1
                    )
                  }"
                  :data="chatLogData"
                  class="mt-8"
                  v-loading="left_loading"
                  :defaultActive="currentChatId"
                  @click="clickListHandle"
                  @mouseenter="mouseenter"
                  @mouseleave="mouseId = ''"
                >
                  <template #default="{ row }">
                    <div class="flex-between">
                      <auto-tooltip :content="row.abstract">
                        {{ row.abstract }}
                      </auto-tooltip>
                      <div @click.stop v-show="mouseId === row.id && row.id !== 'new'">
                        <el-dropdown trigger="click" :teleported="false">
                          <el-icon class="rotate-90 mt-4"><MoreFilled /></el-icon>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item @click.stop="editLogTitle(row)">
                                <el-icon><EditPen /></el-icon>
                                {{ $t('common.edit') }}
                              </el-dropdown-item>
                              <el-dropdown-item @click.stop="deleteLog(row)">
                                <el-icon><Delete /></el-icon>
                                {{ $t('common.delete') }}
                              </el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                  </template>

                  <template #empty>
                    <div class="text-center">
                      <el-text type="info">{{ $t('chat.noHistory') }}</el-text>
                    </div>
                  </template>
                </common-list>
              </div>
              <div v-if="chatLogData?.length" class="gradient-divider lighter mt-8">
                <span>{{ $t('timeSeries.only20history') }}</span>
              </div>
            </el-scrollbar>
          </div>
        </div>
        
        <!--整个右侧区域-->
        <div class="chat-pc__right">
          <!-- 右侧区域标题栏 -->
          <div class="right-header border-b mb-24 p-16-24 flex-between">
            <el-row :gutter="24" class="w-full">
              <el-col :span="8">
                <el-upload
                  action="#"
                  :show-file-list="false"
                  :before-upload="handleUpload"
                  accept=".csv,.xlsx,.txt"
                >
                  <el-button type="primary" plain>
                    <el-icon><Upload /></el-icon>
                    {{ $t('timeSeries.uploadData') }}
                  </el-button>
                </el-upload>
              </el-col>
              
              <el-col :span="8">
                <el-select 
                  v-model="selectedModel"
                  :placeholder="$t('timeSeries.selectModel')"
                  class="w-full"
                  @change="modelChange"
                >
                  <el-option
                    v-for="item in modelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-col>
              
              <el-col :span="8" style="display: flex; justify-content: flex-end">
                <el-button 
                  type="primary" 
                  @click="startPrediction"
                  :disabled="!selectedModel"  
                >  <!-- 未选择模型时禁用按钮条件 -->
                  <el-icon><VideoPlay /></el-icon>
                  {{ $t('timeSeries.startPrediction') }}
                </el-button>
              </el-col>
            </el-row>
          </div>
          
          <!-- 时间序列展示区域 -->
          <div class="right-height chart-container">
            <!-- 原始数据展示区 -->
            <div class="chart-top" :class="{ 'no-data': !hasData }">
              <div v-if="!hasData" class="placeholder">无数据</div>
              <div v-else ref="originalChart"></div>
            </div>

            <!-- 预测结果展示区 -->
            <div class="chart-bottom" :class="{ 'no-prediction': !hasPrediction }">
              <div v-if="!hasPrediction" class="placeholder">无预测输出</div>
              <div v-else ref="predictionChart"></div>
            </div>
          </div>
        </div>

      </div>
      <div class="collapse">
        <el-button @click="isCollapse = !isCollapse">
          <el-icon> <component :is="isCollapse ? 'Fold' : 'Expand'" /></el-icon>
        </el-button>
      </div>
    </div>

    
    <EditTitleDialog ref="EditTitleDialogRef" @refresh="refreshFieldTitle" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { marked } from 'marked'
import { saveAs } from 'file-saver'
import { isAppIcon } from '@/utils/application'
import useStore from '@/stores'
import useResize from '@/layout/hooks/useResize'
import { hexToRgba } from '@/utils/theme'
import EditTitleDialog from './EditTitleDialog.vue'
import { t } from '@/locales'
useResize()

const { user, log, common } = useStore()

const EditTitleDialogRef = ref()

const isCollapse = ref(false)

// 顶上的TimeSeriesForecasting的响应式数据
const timeSeriesText = ref<HTMLSpanElement | null>(null);
const offset = ref({ x: 0, y: 0 });

//绘图图表的响应式数据
const hasData = ref(false)
const hasPrediction = ref(false)



// 鼠标移动事件
const handleMouseMove = (event: MouseEvent) => {
  if (!timeSeriesText.value) return;
  
  const rect = timeSeriesText.value.getBoundingClientRect();
  const containerRect = event.currentTarget.getBoundingClientRect();
  
  const dx = (event.clientX - containerRect.left - rect.width / 2) * 0.2;
  const dy = (event.clientY - containerRect.top - rect.height / 2) * 0.1;
  
  offset.value = { x: dx, y: dy };
};

// 鼠标离开事件
const handleMouseLeave = () => {
  offset.value = { x: 0, y: 0 };
};



const customStyle = computed(() => {
  return {
    background: applicationDetail.value?.custom_theme?.theme_color,
    color: applicationDetail.value?.custom_theme?.header_font_color
  }
})

const classObj = computed(() => {
  return {
    mobile: common.isMobile(),
    hideLeft: !isCollapse.value,
    openLeft: isCollapse.value
  }
})

const newObj = {
  id: 'new',
  abstract: t('timeSeries.createChat')
}
const props = defineProps<{
  application_profile: any
  applicationAvailable: boolean
}>()
const AiChatRef = ref()
const loading = ref(false)
const left_loading = ref(false)

const applicationDetail = computed({
  get: () => {
    return props.application_profile
  },
  set: (v) => {}
})

const chatLogData = ref<any[]>([])

const paginationConfig = ref({
  current_page: 1,
  page_size: 20,
  total: 0
})

const currentRecordList = ref<any>([])
const currentChatId = ref('new') // 当前历史记录Id 默认为'new'
const currentChatName = ref(t('timeSeries.createChat'))
const mouseId = ref('')

function mouseenter(row: any) {
  mouseId.value = row.id
}

function editLogTitle(row: any) {
  EditTitleDialogRef.value.open(row, applicationDetail.value.id)
}
function refreshFieldTitle(chatId: string, abstract: string) {
  const find = chatLogData.value.find((item: any) => item.id == chatId)
  if (find) {
    find.abstract = abstract
  }
}
function deleteLog(row: any) {
  log.asyncDelChatClientLog(applicationDetail.value.id, row.id, left_loading).then(() => {
    if (currentChatId.value === row.id) {
      currentChatId.value = 'new'
      currentChatName.value = t('timeSeries.createChat')
      paginationConfig.value.current_page = 1
      paginationConfig.value.total = 0
      currentRecordList.value = []
    }
    getChatLog(applicationDetail.value.id)
  })
}

function handleScroll(event: any) {
  if (
    currentChatId.value !== 'new' &&
    event.scrollTop === 0 &&
    paginationConfig.value.total > currentRecordList.value.length
  ) {
    const history_height = event.dialogScrollbar.offsetHeight
    paginationConfig.value.current_page += 1
    getChatRecord().then(() => {
      event.scrollDiv.setScrollTop(event.dialogScrollbar.offsetHeight - history_height)
    })
  }
}

function newChat() {
  if (!chatLogData.value.some((v) => v.id === 'new')) {
    paginationConfig.value.current_page = 1
    paginationConfig.value.total = 0
    currentRecordList.value = []
    chatLogData.value.unshift(newObj)
  } else {
    paginationConfig.value.current_page = 1
    paginationConfig.value.total = 0
    currentRecordList.value = []
  }
  currentChatId.value = 'new'
  currentChatName.value = t('timeSeries.createChat')
  if (common.isMobile()) {
    isCollapse.value = false
  }
}

function getChatLog(id: string, refresh?: boolean) {
  const page = {
    current_page: 1,
    page_size: 20
  }

  log.asyncGetChatLogClient(id, page, left_loading).then((res: any) => {
    chatLogData.value = res.data.records
    if (refresh) {
      currentChatName.value = chatLogData.value?.[0]?.abstract
    } else {
      paginationConfig.value.current_page = 1
      paginationConfig.value.total = 0
      currentRecordList.value = []
      currentChatId.value = chatLogData.value?.[0]?.id || 'new'
      currentChatName.value = chatLogData.value?.[0]?.abstract || t('timeSeries.createChat')
      if (currentChatId.value !== 'new') {
        getChatRecord()
      }
    }
  })
}

function getChatRecord() {
  return log
    .asyncChatRecordLog(
      applicationDetail.value.id,
      currentChatId.value,
      paginationConfig.value,
      loading,
      false
    )
    .then((res: any) => {
      paginationConfig.value.total = res.data.total
      const list = res.data.records
      list.map((v: any) => {
        v['write_ed'] = true
        v['record_id'] = v.id
      })
      currentRecordList.value = [...list, ...currentRecordList.value].sort((a, b) =>
        a.create_time.localeCompare(b.create_time)
      )
      if (paginationConfig.value.current_page === 1) {
        nextTick(() => {
          // 将滚动条滚动到最下面
          AiChatRef.value.setScrollBottom()
        })
      }
    })
}

const clickListHandle = (item: any) => {
  if (item.id !== currentChatId.value) {
    paginationConfig.value.current_page = 1
    paginationConfig.value.total = 0
    currentRecordList.value = []
    currentChatId.value = item.id
    currentChatName.value = item.abstract
    if (currentChatId.value !== 'new') {
      getChatRecord()

      // 切换对话后，取消暂停的浏览器播放
      if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume()
        nextTick(() => {
          window.speechSynthesis.cancel()
        })
      }
    }
  }
  if (common.isMobile()) {
    isCollapse.value = false
  }
}

function refresh(id: string) {
  getChatLog(applicationDetail.value.id, true)
  currentChatId.value = id
}

async function exportMarkdown(): Promise<void> {
  const suggestedName: string = `${currentChatId.value}.md`
  const markdownContent: string = currentRecordList.value
    .map((record: any) => `# ${record.problem_text}\n\n${record.answer_text}\n\n`)
    .join('\n')

  const blob: Blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, suggestedName)
}

async function exportHTML(): Promise<void> {
  const suggestedName: string = `${currentChatId.value}.html`
  const markdownContent: string = currentRecordList.value
    .map((record: any) => `# ${record.problem_text}\n\n${record.answer_text}\n\n`)
    .join('\n')
  const htmlContent: any = marked(markdownContent)

  const blob: Blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  saveAs(blob, suggestedName)
}

/**
 *初始化历史对话记录
 */
const init = () => {
  if (
    (applicationDetail.value.show_history || !user.isEnterprise()) &&
    props.applicationAvailable
  ) {
    getChatLog(applicationDetail.value.id)
  }
}
onMounted(() => {
  init()
})
</script>
<style lang="scss">
.chat-pc {
  overflow: hidden;

  &__header {
    background: var(--app-header-bg-color);
    position: fixed;
    width: 100%;
    left: 0;
    top: 0;
    z-index: 100;
    height: var(--app-header-height);
    line-height: var(--app-header-height);
    box-sizing: border-box;
    border-bottom: 1px solid var(--el-border-color);
  }

  &__left {
    padding-top: calc(var(--app-header-height) - 8px);
    background: #ffffff;
    width: 280px;

    .add-button {
      border: 1px solid var(--el-color-primary);
    }

    .left-height {
      height: calc(100vh - var(--app-header-height) - 135px);
    }
  }

  &__right {
    width: calc(100% - 280px);
    padding-top: calc(var(--app-header-height));
    overflow: hidden;
    position: relative;
    box-sizing: border-box;

    .right-header {
      background: #ffffff;
      box-sizing: border-box;
    }

    .right-height {
      height: calc(100vh - var(--app-header-height) * 2 - 24px);
    }
  }

  .gradient-divider {
    position: relative;
    text-align: center;
    color: var(--el-color-info);

    ::before {
      content: '';
      width: 17%;
      height: 1px;
      background: linear-gradient(90deg, rgba(222, 224, 227, 0) 0%, #dee0e3 100%);
      position: absolute;
      left: 16px;
      top: 50%;
    }

    ::after {
      content: '';
      width: 17%;
      height: 1px;
      background: linear-gradient(90deg, #dee0e3 0%, rgba(222, 224, 227, 0) 100%);
      position: absolute;
      right: 16px;
      top: 50%;
    }
  }

  .collapse {
    display: none;
  }
}
// 适配移动端
.mobile {
  .chat-pc {
    &__right {
      width: 100%;
    }
    &__left {
      display: none;
      width: 0;
    }
  }
  .collapse {
    display: block;
    position: fixed;
    bottom: 90px;
    z-index: 99;
  }
  &.openLeft {
    .chat-pc {
      &__left {
        display: block;
        position: fixed;
        width: 100%;
        z-index: 99;
        height: calc(100vh - var(--app-header-height) + 6px);
      }
    }
    .collapse {
      display: block;
      position: absolute;
      bottom: 90px;
      right: 0;
      z-index: 99;
    }
  }
}

.chat-width {
  max-width: 80%;
  margin: 0 auto;
}
@media only screen and (max-width: 1000px) {
  .chat-width {
    max-width: 100% !important;
    margin: 0 auto;
  }
}

.time-series-text {
  font-size: 24px; /* 炫酷字体大小 */
  font-family: 'Arial Black', sans-serif; /* 炫酷字体类型 */
  color: #333; /* 基础颜色 */
  opacity: 0.2; /* 透明度50% */
  position: absolute;  // 改为绝对定位
  left: 50%;           // 水平居中基准
  top: 50%;            // 垂直居中基准
  transform: translate(-50%, -50%); // 初始居中定位
  pointer-events: none; // 防止鼠标事件被文本元素拦截
  transition: transform 1.5s ease; /* 平滑移动动画 */
  margin-left: 8px; /* 与前文间距 */
}

/* 分割容器样式 */
.chart-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-top, .chart-bottom {
  flex: 1;
  position: relative;
  border-bottom: 1px solid #e4e7ed;
}

.chart-bottom {
  border-bottom: none;
}

/* 提示信息样式 */
.placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #999;
}

/* 状态类 */
.no-data .placeholder,
.no-prediction .placeholder {
  display: block;
}

.no-data > div:not(.placeholder),
.no-prediction > div:not(.placeholder) {
  display: none;
}

</style>
