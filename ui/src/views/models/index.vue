<template>
  <div class="application-list-container p-24" style="padding-top: 16px">
    <div class="flex-between mb-16">
      <h4>{{ $t('views.models.title') }}</h4>
      <div class="flex-between">
        <el-select
            v-model="selectUserId"
            class="mr-12"
            @change="searchHandle"
            style="max-width: 240px; width: 150px"
        >
          <el-option
              v-for="item in userOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
        <el-input
            v-model="searchValue"
            @change="searchHandle"
            :placeholder="$t('views.models.searchBar.placeholder')"
            prefix-icon="Search"
            class="w-240"
            style="min-width: 240px"
            clearable
        />
      </div>
    </div>
    <div v-loading.fullscreen.lock="paginationConfig.current_page === 1 && loading">
      <InfiniteScroll
          :size="modelList.length"
          :total="paginationConfig.total"
          :page_size="paginationConfig.page_size"
          v-model:current_page="paginationConfig.current_page"
          @load="getList"
          :loading="loading"
      >
        <el-row :gutter="15">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6" class="mb-16">
            <el-card shadow="hover" class="application-card-add" style="--el-card-padding: 8px">
              <div class="card-add-button flex align-center cursor p-8" @click="openCreateDialog">
                <AppIcon iconName="app-add-application" class="mr-8"></AppIcon>
                {{ $t('views.models.createModel') }}
              </div>
              <el-divider style="margin: 8px 0"/>
              <el-upload
                  ref="elUploadRef"
                  :file-list="[]"
                  action="#"
                  multiple
                  :auto-upload="false"
                  :show-file-list="false"
                  :limit="1"
                  :on-change="(file: any, fileList: any) => importModel(file)"
                  class="card-add-button"
              >
                <div class="flex align-center cursor p-8">
                  <AppIcon iconName="app-import" class="mr-8"></AppIcon>
                  {{ $t('views.models.importModel') }}
                </div>
              </el-upload>
            </el-card>
          </el-col>
          <el-col
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
              :xl="6"
              v-for="(item, index) in modelList"
              :key="index"
              class="mb-16"
          >
            <CardBox
                :title="item.name"
                :description="item.desc"
                class="application-card cursor"
                @click="router.push({ path: `/models/${item.id}/overview` })"
            >
              <template #icon>
                <AppAvatar
                    v-if="isAppIcon(item?.icon)"
                    shape="square"
                    :size="32"
                    style="background: none"
                    class="mr-8"
                >
                  <img :src="item?.icon" alt=""/>
                </AppAvatar>
                <AppAvatar
                    v-else-if="item?.name"
                    :name="item?.name"
                    pinyinColor
                    shape="square"
                    :size="32"
                    class="mr-8"
                />
              </template>
              <template #subTitle>
                <el-text class="color-secondary" size="small">
                  <auto-tooltip :content="item.username">
                    {{ $t('common.creator') }}: {{ item.username }}
                  </auto-tooltip>
                </el-text>
              </template>
              <div class="status-tag">
                <el-tag :type="getModelTypeTag(item.model_type)" :class="getModelTypeClass(item.model_type)" style="height: 22px">
                  {{ getModelTypeLabel(item.model_type) }}
                </el-tag>
              </div>

              <template #footer>
                <div class="footer-content">
                  <div class="footer-left">
                    <el-tooltip
                        effect="dark"
                        :content="$t('views.models.setting.demo')"
                        placement="top"
                    >
                      <el-button text @click.stop="viewModelDemo(item)">
                        <AppIcon iconName="app-view"></AppIcon>
                      </el-button>
                    </el-tooltip>
                    <el-divider direction="vertical"/>
                    <el-tooltip effect="dark" :content="$t('common.setting')" placement="top">
                      <el-button text @click.stop="settingModel(item)">
                        <AppIcon iconName="Setting"></AppIcon>
                      </el-button>
                    </el-tooltip>
                    <el-divider direction="vertical"/>
                    <span @click.stop>
                      <el-dropdown trigger="click">
                        <el-button text @click.stop>
                          <el-icon><MoreFilled/></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item
                                v-if="is_show_copy_button(item)"
                                @click="copyModel(item)"
                            >
                              <AppIcon iconName="app-copy"></AppIcon>
                              {{ $t('common.copy') }}
                            </el-dropdown-item>
                            <el-dropdown-item @click.stop="exportModel(item)">
                              <AppIcon iconName="app-export"></AppIcon>
                              {{ $t('common.export') }}
                            </el-dropdown-item>
                            <el-dropdown-item icon="Delete" @click.stop="deleteModel(item)">{{
                                $t('common.delete')
                              }}</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </span>
                  </div>
                  <div class="footer-right">
                    <el-tag v-if="item.base_model" type="info" class="gold-tag" style="height: 22px">
                      {{ getBaseModelLabel(item.base_model) }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </CardBox>
          </el-col>
        </el-row>
      </InfiniteScroll>
    </div>
    <CreateModelDialog ref="CreateModelDialogRef" @refresh="getList"/>
    <CopyModelDialog ref="CopyModelDialogRef" @refresh="getList"/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import modelApi from '@/api/model'
import CreateModelDialog from './component/CreateModelDialog.vue'
import CopyModelDialog from './component/CopyModelDialog.vue'
import { MsgSuccess, MsgConfirm, MsgAlert, MsgError } from '@/utils/message'
import { isAppIcon } from '@/utils/application'
import { useRouter } from 'vue-router'
import { t } from '@/locales'
import useStore from '@/stores'

const elUploadRef = ref<any>()
const { model, user, common } = useStore()
const router = useRouter()

const CopyModelDialogRef = ref()
const CreateModelDialogRef = ref()
const loading = ref(false)

const modelList = ref<any[]>([])

const paginationConfig = reactive({
  current_page: 1,
  page_size: 30,
  total: 0
})

function getModelTypeTag(modelType: string) {
  switch (modelType) {
    case 'forecasting':
      return 'primary'
    case 'anomaly_detection':
      return 'danger'
    case 'imputation':
      return 'success'
    default:
      return 'info'
  }
}

function getModelTypeLabel(modelType: string) {
  switch (modelType) {
    case 'forecasting':
      return t('views.models.modelTypes.forecasting')
    case 'anomaly_detection':
      return t('views.models.modelTypes.anomalyDetection')
    case 'imputation':
      return t('views.models.modelTypes.imputation')
    default:
      return modelType
  }
}

function getModelTypeClass(modelType: string) {
  switch (modelType) {
    case 'forecasting':
      return 'forecasting-tag'
    case 'anomaly_detection':
      return 'anomaly-tag'
    case 'imputation':
      return 'imputation-tag'
    default:
      return ''
  }
}

interface UserOption {
  label: string
  value: string
}

const userOptions = ref<UserOption[]>([])

const selectUserId = ref('all')

const searchValue = ref('')

function copyModel(row: any) {
  model.asyncGetModel(row.id, loading).then((res: any) => {
    if (res?.data) {
      CopyModelDialogRef.value.open({...res.data})
    }
  })
}

const is_show_copy_button = (row: any) => {
  return user.userInfo ? user.userInfo.id == row.user_id : false
}

function settingModel(row: any) {
  router.push({path: `/models/${row.id}/setting`})
}

const exportModel = (model: any) => {
  modelApi.exportModel(model.id, model.name, loading).catch((e) => {
    if (e.response.status !== 403) {
      e.response.data.text().then((res: string) => {
        MsgError(`${t('views.models.tip.ExportError')}:${JSON.parse(res).message}`)
      })
    }
  })
}

const importModel = (file: any) => {
  const formData = new FormData()
  formData.append('file', file.raw, file.name)
  elUploadRef.value.clearFiles()
  modelApi
      .importModel(formData, loading)
      .then(async (res: any) => {
        if (res?.data) {
          searchHandle()
        }
      })
      .catch((e) => {
        if (e.code === 400) {
          MsgConfirm(t('common.tip'), t('views.models.tip.professionalMessage'), {
            cancelButtonText: t('common.confirm'),
            confirmButtonText: t('common.professional')
          }).then(() => {
            window.open('https://maxkb.cn/pricing.html', '_blank')
          })
        }
      })
}

function openCreateDialog() {
  if (CreateModelDialogRef.value) {
    CreateModelDialogRef.value.open()
  }
}

function viewModelDemo(model: any) {
  console.log('View model demo:', model)
}

function searchHandle() {
  if (user.userInfo) {
    localStorage.setItem(user.userInfo.id + 'model', selectUserId.value)
  }
  modelList.value = []
  paginationConfig.current_page = 1
  paginationConfig.total = 0
  getList()
}

function deleteModel(row: any) {
  MsgConfirm(
      `${t('views.models.delete.confirmTitle')}${row.name} ?`,
      t('views.models.delete.confirmMessage'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        confirmButtonClass: 'danger'
      }
  )
      .then(() => {
        modelApi.delModel(row.id, loading).then(() => {
          const index = modelList.value.findIndex((v) => v.id === row.id)
          modelList.value.splice(index, 1)
          MsgSuccess(t('common.deleteSuccess'))
        })
      })
      .catch(() => {
      })
}

function getList() {
  const params = {
    ...(searchValue.value && {name: searchValue.value}),
    ...(selectUserId.value &&
        selectUserId.value !== 'all' && {select_user_id: selectUserId.value})
  }
  modelApi.getModel(paginationConfig, params, loading).then((res) => {
    res.data.records.forEach((item: any) => {
      if (user.userInfo && item.user_id === user.userInfo.id) {
        item.username = user.userInfo.username
      } else {
        item.username = userOptions.value.find((v) => v.value === item.user_id)?.label
      }
    })
    modelList.value = [...modelList.value, ...res.data.records]
    paginationConfig.total = res.data.total
  })
}

function getUserList() {
  // 添加模拟数据用于测试
  const mockData = [
    {
      id: '1',
      username: 'user1',
      models: [
        {
          id: '1',
          name: '预测模型1',
          desc: '这是一个预测模型',
          model_type: 'forecasting',
          user_id: '1',
          username: 'user1',
          base_model: 'patchtst'
        }
      ]
    },
    {
      id: '2',
      username: 'user2',
      models: [
        {
          id: '2',
          name: '异常检测模型1',
          desc: '这是一个异常检测模型',
          model_type: 'anomaly_detection',
          user_id: '2',
          username: 'user2',
          base_model: 'deepsad'
        }
      ]
    }
  ]

  // 添加"全部"选项
  userOptions.value = [
    { label: t('全部'), value: 'all' },
    ...mockData.map((item: any) => ({
      label: item.username,
      value: item.id
    }))
  ]

  // 设置默认选中"全部"
  if (user.userInfo) {
    const selectUserIdValue = localStorage.getItem(user.userInfo.id + 'model')
    if (selectUserIdValue && userOptions.value.find((v) => v.value === selectUserIdValue)) {
      selectUserId.value = selectUserIdValue
    } else {
      selectUserId.value = 'all'
    }
  }

  // 使用模拟数据
  modelList.value = mockData.flatMap(user => user.models)
  paginationConfig.total = modelList.value.length
}

function getBaseModelLabel(baseModel: string) {
  const modelMap: Record<string, string> = {
    patchtst: 'PatchTST',
    itransformer: 'iTransformer',
    moderntcn: 'ModernTCN',
    lstm: 'LSTM',
    deepsad: 'DeepAnomaly',
    usad: 'USAD',
    dagmm: 'DAGMM',
    brits: 'BRITS',
    saits: 'SAITS',
    transformer: 'Transformer'
  }
  return modelMap[baseModel] || baseModel
}

onMounted(() => {
  getUserList()
})
</script>

<style lang="scss" scoped>
.application-card-add {
  width: 100%;
  font-size: 14px;
  min-height: var(--card-min-height);
  border: 1px dashed var(--el-border-color);
  background: var(--el-disabled-bg-color);
  border-radius: 8px;
  box-sizing: border-box;

  &:hover {
    border: 1px solid var(--el-card-bg-color);
    background-color: var(--el-card-bg-color);
  }

  .card-add-button {
    &:hover {
      border-radius: 4px;
      background: var(--app-text-color-light-1);
    }

    :deep(.el-upload) {
      display: block;
      width: 100%;
      color: var(--el-text-color-regular);
    }
  }
}

.application-card {
  .status-tag {
    position: absolute;
    right: 16px;
    top: 15px;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .footer-left {
      display: flex;
      align-items: center;
    }

    .footer-right {
      display: flex;
      align-items: center;
    }
  }
}

.ml-8 {
  margin-left: 8px;
}

.forecasting-tag {
  background: #ebf1ff !important;
  color: #3370ff !important;
  border-color: #d6e2ff !important;
}

.anomaly-tag {
  background: #fef0f0 !important;
  color: #f56c6c !important;
  border-color: #fde2e2 !important;
}

.imputation-tag {
  background: #f0f9eb !important;
  color: #67c23a !important;
  border-color: #e1f3d8 !important;
}

.gold-tag {
  background: #fdf6ec !important;
  color: #e6a23c !important;
  border-color: #faecd8 !important;
}

.dropdown-custom-switch {
  padding: 5px 11px;
  font-size: 14px;
  font-weight: 400;

  span {
    margin-right: 26px;
  }
}
</style>
