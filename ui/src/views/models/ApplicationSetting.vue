<template>
  <LayoutContainer class="create-application">
    <template #header>
      <div class="flex-between w-full">
        <h3>
          {{ $t('common.setting') }}
        </h3>
        <el-button type="primary" @click="submit(applicationFormRef)" :disabled="loading">
          {{ $t('views.application.applicationForm.buttons.publish') }}
        </el-button>
      </div>
    </template>
    <el-row v-loading="loading">
      <el-col :span="10">
        <div class="p-24 mb-16" style="padding-bottom: 0">
          <h4 class="title-decoration-1">
            {{ $t('views.applicationOverview.appInfo.header') }}
          </h4>
        </div>
        <div class="scrollbar-height-left">
          <el-scrollbar>
            <el-form
              hide-required-asterisk
              ref="applicationFormRef"
              :model="applicationForm"
              :rules="rules"
              label-position="top"
              require-asterisk-position="right"
              class="p-24"
              style="padding-top: 0"
            >
              <el-form-item prop="name">
                <template #label>
                  <div class="flex-between">
                    <span
                      >{{ $t('views.application.applicationForm.form.appName.label') }}
                      <span class="danger">*</span></span
                    >
                  </div>
                </template>
                <el-input
                  v-model="applicationForm.name"
                  maxlength="64"
                  :placeholder="$t('views.application.applicationForm.form.appName.placeholder')"
                  show-word-limit
                  @blur="applicationForm.name = applicationForm.name?.trim()"
                />
              </el-form-item>
              <el-form-item
                :label="$t('views.application.applicationForm.form.appDescription.label')"
              >
                <el-input
                  v-model="applicationForm.desc"
                  type="textarea"
                  :placeholder="
                    $t('views.application.applicationForm.form.appDescription.placeholder')
                  "
                  :rows="3"
                  maxlength="256"
                  show-word-limit
                />
              </el-form-item>
              

            </el-form>
          </el-scrollbar>
        </div>
      </el-col>
      <el-col :span="14" class="p-24 border-l">
        <h4 class="title-decoration-1 mb-16">
          {{ $t('views.application.applicationForm.title.appTest') }}
        </h4>
        <div class="dialog-bg">
          <div class="flex align-center p-16 mb-8">
            <div
              class="edit-avatar mr-12"
              @mouseenter="showEditIcon = true"
              @mouseleave="showEditIcon = false"
            >
              <AppAvatar
                v-if="isAppIcon(applicationForm?.icon)"
                shape="square"
                :size="32"
                style="background: none"
              >
                <img :src="applicationForm?.icon" alt="" />
              </AppAvatar>
              <AppAvatar
                v-else-if="applicationForm?.name"
                :name="applicationForm?.name"
                pinyinColor
                shape="square"
                :size="32"
              />
              <AppAvatar
                v-if="showEditIcon"
                shape="square"
                class="edit-mask"
                :size="32"
                @click="openEditAvatar"
              >
                <el-icon><EditPen /></el-icon>
              </AppAvatar>
            </div>
            <h4>
              {{
                applicationForm?.name || $t('views.application.applicationForm.form.appName.label')
              }}
            </h4>
          </div>
          <div class="scrollbar-height">
            <AiChat :applicationDetails="applicationForm" :type="'debug-ai-chat'"></AiChat>
          </div>
        </div>
      </el-col>
    </el-row>

    <AIModeParamSettingDialog ref="AIModeParamSettingDialogRef" @refresh="refreshForm" />
    <TTSModeParamSettingDialog ref="TTSModeParamSettingDialogRef" @refresh="refreshTTSForm" />
    <ParamSettingDialog ref="ParamSettingDialogRef" @refresh="refreshParam" />
    <AddDatasetDialog
      ref="AddDatasetDialogRef"
      @addData="addDataset"
      :data="datasetList"
      @refresh="refresh"
      :loading="datasetLoading"
    />

    <EditAvatarDialog ref="EditAvatarDialogRef" @refresh="refreshIcon" />
    <ReasoningParamSettingDialog
      ref="ReasoningParamSettingDialogRef"
      @refresh="submitReasoningDialog"
    />
  </LayoutContainer>
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { groupBy } from 'lodash'
import AIModeParamSettingDialog from './component/AIModeParamSettingDialog.vue'
import ParamSettingDialog from './component/ParamSettingDialog.vue'
import AddDatasetDialog from './component/AddDatasetDialog.vue'
import EditAvatarDialog from '@/views/application-overview/component/EditAvatarDialog.vue'
import applicationApi from '@/api/application'
import { isAppIcon } from '@/utils/application'
import type { FormInstance, FormRules } from 'element-plus'
import type { ApplicationFormType } from '@/api/type/application'
import { relatedObject } from '@/utils/utils'
import { MsgSuccess, MsgWarning } from '@/utils/message'
import useStore from '@/stores'
import { t } from '@/locales'
import TTSModeParamSettingDialog from './component/TTSModeParamSettingDialog.vue'
import ReasoningParamSettingDialog from './component/ReasoningParamSettingDialog.vue'

const { model, application } = useStore()

const route = useRoute()
const {
  params: { id }
} = route as any
// @ts-ignore
const defaultPrompt = t('views.application.applicationForm.form.prompt.defaultPrompt', {
  data: '{data}',
  question: '{question}'
})

const optimizationPrompt =
  t('views.application.applicationForm.dialog.defaultPrompt1', {
    question: '{question}'
  }) +
  '<data></data>' +
  t('views.application.applicationForm.dialog.defaultPrompt2')

const AIModeParamSettingDialogRef = ref<InstanceType<typeof AIModeParamSettingDialog>>()
const ReasoningParamSettingDialogRef = ref<InstanceType<typeof ReasoningParamSettingDialog>>()
const TTSModeParamSettingDialogRef = ref<InstanceType<typeof TTSModeParamSettingDialog>>()
const ParamSettingDialogRef = ref<InstanceType<typeof ParamSettingDialog>>()

const applicationFormRef = ref<FormInstance>()
const AddDatasetDialogRef = ref()
const EditAvatarDialogRef = ref()

const loading = ref(false)
const datasetLoading = ref(false)
const applicationForm = ref<ApplicationFormType>({
  name: '',
  desc: '',
  model_id: '',
  dialogue_number: 1,
  prologue: t('views.application.applicationForm.form.defaultPrologue'),
  dataset_id_list: [],
  dataset_setting: {
    top_n: 3,
    similarity: 0.6,
    max_paragraph_char_number: 5000,
    search_mode: 'embedding',
    no_references_setting: {
      status: 'ai_questioning',
      value: '{question}'
    }
  },
  model_setting: {
    prompt: defaultPrompt,
    system: t('views.application.applicationForm.form.roleSettings.placeholder'),
    no_references_prompt: '{question}',
    reasoning_content_enable: false
  },
  model_params_setting: {},
  problem_optimization: false,
  problem_optimization_prompt: optimizationPrompt,
  stt_model_id: '',
  tts_model_id: '',
  stt_model_enable: false,
  tts_model_enable: false,
  tts_type: 'BROWSER',
  type: 'SIMPLE'
})

const rules = reactive<FormRules<ApplicationFormType>>({
  name: [
    {
      required: true,
      message: t('views.application.applicationForm.form.appName.placeholder'),
      trigger: 'blur'
    }
  ]
})
const modelOptions = ref<any>(null)
const datasetList = ref([])
const sttModelOptions = ref<any>(null)
const ttsModelOptions = ref<any>(null)
const showEditIcon = ref(false)

function submitPrologueDialog(val: string) {
  applicationForm.value.prologue = val
}
function submitPromptDialog(val: string) {
  applicationForm.value.model_setting.prompt = val
}
function submitNoReferencesPromptDialog(val: string) {
  applicationForm.value.model_setting.no_references_prompt = val
}
function submitSystemDialog(val: string) {
  applicationForm.value.model_setting.system = val
}
function submitReasoningDialog(val: any) {
  applicationForm.value.model_setting = {
    ...applicationForm.value.model_setting,
    ...val
  }
}

const submit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      application.asyncPutApplication(id, applicationForm.value, loading).then((res) => {
        MsgSuccess(t('common.saveSuccess'))
      })
    }
  })
}
const model_change = (model_id?: string) => {
  applicationForm.value.model_id = model_id
  if (model_id) {
    AIModeParamSettingDialogRef.value?.reset_default(model_id, id)
  } else {
    refreshForm({})
  }
}
const openAIParamSettingDialog = () => {
  if (applicationForm.value.model_id) {
    AIModeParamSettingDialogRef.value?.open(
      applicationForm.value.model_id,
      id,
      applicationForm.value.model_params_setting
    )
  }
}

const openReasoningParamSettingDialog = () => {
  ReasoningParamSettingDialogRef.value?.open(applicationForm.value.model_setting)
}

const openTTSParamSettingDialog = () => {
  if (applicationForm.value.tts_model_id) {
    TTSModeParamSettingDialogRef.value?.open(
      applicationForm.value.tts_model_id,
      id,
      applicationForm.value.tts_model_params_setting
    )
  }
}

const openParamSettingDialog = () => {
  ParamSettingDialogRef.value?.open(applicationForm.value)
}

function refreshParam(data: any) {
  applicationForm.value = { ...applicationForm.value, ...data }
}

function refreshForm(data: any) {
  applicationForm.value.model_params_setting = data
}

function refreshTTSForm(data: any) {
  applicationForm.value.tts_model_params_setting = data
}

function removeDataset(id: any) {
  if (applicationForm.value.dataset_id_list) {
    applicationForm.value.dataset_id_list.splice(
      applicationForm.value.dataset_id_list.indexOf(id),
      1
    )
  }
}

function addDataset(val: Array<string>) {
  applicationForm.value.dataset_id_list = val
}

function openDatasetDialog() {
  AddDatasetDialogRef.value.open(applicationForm.value.dataset_id_list)
}

function getDetail() {
  application.asyncGetApplicationDetail(id, loading).then((res: any) => {
    applicationForm.value = res.data
    applicationForm.value.model_id = res.data.model
    applicationForm.value.stt_model_id = res.data.stt_model
    applicationForm.value.tts_model_id = res.data.tts_model
    applicationForm.value.tts_type = res.data.tts_type
    applicationForm.value.model_setting.no_references_prompt =
      res.data.model_setting.no_references_prompt || '{question}'
    application.asyncGetAccessToken(id, loading).then((res: any) => {
      applicationForm.value = { ...applicationForm.value, ...res.data }
    })
  })
}

function getDataset() {
  application.asyncGetApplicationDataset(id, datasetLoading).then((res: any) => {
    datasetList.value = res.data
  })
}

function getModel() {
  loading.value = true
  applicationApi
    .getApplicationModel(id)
    .then((res: any) => {
      modelOptions.value = groupBy(res?.data, 'provider')
      loading.value = false
    })
    .catch(() => {
      loading.value = false
    })
}

function getSTTModel() {
  loading.value = true
  applicationApi
    .getApplicationSTTModel(id)
    .then((res: any) => {
      sttModelOptions.value = groupBy(res?.data, 'provider')
      loading.value = false
    })
    .catch(() => {
      loading.value = false
    })
}

function getTTSModel() {
  loading.value = true
  applicationApi
    .getApplicationTTSModel(id)
    .then((res: any) => {
      ttsModelOptions.value = groupBy(res?.data, 'provider')
      loading.value = false
    })
    .catch(() => {
      loading.value = false
    })
}

function ttsModelChange() {
  if (applicationForm.value.tts_model_id) {
    TTSModeParamSettingDialogRef.value?.reset_default(applicationForm.value.tts_model_id, id)
  } else {
    refreshTTSForm({})
  }
}

function ttsModelEnableChange() {
  if (!applicationForm.value.tts_model_enable) {
    applicationForm.value.tts_model_id = ''
    applicationForm.value.tts_type = 'BROWSER'
  }
}

function sttModelEnableChange() {
  if (!applicationForm.value.stt_model_enable) {
    applicationForm.value.stt_model_id = ''
  }
}

function openEditAvatar() {
  EditAvatarDialogRef.value.open(applicationForm.value)
}
function refreshIcon() {
  getDetail()
}

function refresh() {
  getDataset()
}

onMounted(() => {
  getModel()
  getDataset()
  getDetail()
  getSTTModel()
  getTTSModel()
})
</script>
<style lang="scss" scoped>
.create-application {
  .relate-dataset-card {
    color: var(--app-text-color);
  }

  .dialog-bg {
    border-radius: 8px;
    background: var(--dialog-bg-gradient-color);
    overflow: hidden;
    box-sizing: border-box;
  }

  .scrollbar-height-left {
    height: calc(var(--app-main-height) - 64px);
  }

  .scrollbar-height {
    height: calc(var(--app-main-height) - 166px);
  }
}

.prologue-md-editor {
  height: 150px;
}

:deep(.el-form-item__label) {
  display: block;
}
</style>
