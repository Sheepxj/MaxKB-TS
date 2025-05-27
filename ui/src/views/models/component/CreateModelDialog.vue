<template>
  <el-dialog
    :title="$t('views.models.createModel')"
    v-model="dialogVisible"
    width="650"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form
      ref="modelFormRef"
      :model="modelForm"
      :rules="rules"
      label-position="top"
      require-asterisk-position="right"
      @submit.prevent
    >
      <el-form-item :label="$t('views.models.modelForm.form.modelName.label')" prop="name">
        <el-input
          v-model="modelForm.name"
          maxlength="64"
          :placeholder="$t('views.models.modelForm.form.modelName.placeholder')"
          show-word-limit
          @blur="modelForm.name = modelForm.name?.trim()"
        />
      </el-form-item>
      <el-form-item :label="$t('views.models.modelForm.form.modelDescription.label')">
        <el-input
          v-model="modelForm.desc"
          type="textarea"
          :placeholder="$t('views.models.modelForm.form.modelDescription.placeholder')"
          :rows="3"
          maxlength="256"
          show-word-limit
        />
      </el-form-item>
      <el-form-item :label="$t('views.models.modelForm.form.modelType.label')">
        <el-radio-group v-model="modelForm.model_type" class="card__radio">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-card shadow="never" :class="modelForm.model_type === 'forecasting' ? 'active' : ''">
                <el-radio value="forecasting" size="large">
                  <p class="mb-4">{{ $t('views.models.modelTypes.forecasting') }}</p>
                  <el-text type="info">{{
                    $t('views.models.modelForm.form.modelType.forecastingPlaceholder')
                  }}</el-text>
                </el-radio>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" :class="modelForm.model_type === 'anomaly_detection' ? 'active' : ''">
                <el-radio value="anomaly_detection" size="large">
                  <p class="mb-4">{{ $t('views.models.modelTypes.anomalyDetection') }}</p>
                  <el-text type="info">{{
                    $t('views.models.modelForm.form.modelType.anomalyDetectionPlaceholder')
                  }}</el-text>
                </el-radio>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" :class="modelForm.model_type === 'imputation' ? 'active' : ''">
                <el-radio value="imputation" size="large">
                  <p class="mb-4">{{ $t('views.models.modelTypes.imputation') }}</p>
                  <el-text type="info">{{
                    $t('views.models.modelForm.form.modelType.imputationPlaceholder')
                  }}</el-text>
                </el-radio>
              </el-card>
            </el-col>
          </el-row>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('views.models.modelForm.form.baseModel.label')" prop="base_model" v-if="modelForm.model_type">
        <el-select
          v-model="modelForm.base_model"
          :placeholder="$t('views.models.modelForm.form.baseModel.placeholder')"
          class="w-full"
        >
          <el-option
            v-for="model in baseModelOptions"
            :key="model.value"
            :label="model.label"
            :value="model.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click.prevent="dialogVisible = false" :loading="loading">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="submitHandle(modelFormRef)" :loading="loading">
          {{ $t('common.create') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { MsgSuccess } from '@/utils/message'
import { t } from '@/locales'

const router = useRouter()
const emit = defineEmits(['refresh'])

const modelFormRef = ref()
const loading = ref(false)
const dialogVisible = ref<boolean>(false)

interface ModelForm {
  name: string
  desc: string
  model_type: 'forecasting' | 'anomaly_detection' | 'imputation'
  base_model: string
}

const modelForm = ref<ModelForm>({
  name: '',
  desc: '',
  model_type: 'forecasting',
  base_model: ''
})

// 基础模型选项
const baseModelOptions = ref<Array<{label: string, value: string}>>([])

// 根据模型类型更新基础模型选项
watch(() => modelForm.value.model_type, (newType) => {
  modelForm.value.base_model = '' // 重置选择
  switch (newType) {
    case 'forecasting':
      baseModelOptions.value = [
        { label: 'PatchTST', value: 'patchtst' },
        { label: 'iTransformer', value: 'itransformer' },
        { label: 'ModernTCN', value: 'moderntcn' },
        { label: 'LSTM', value: 'lstm' }
      ]
      break
    case 'anomaly_detection':
      baseModelOptions.value = [
        { label: 'DeepAnomaly', value: 'deepsad' },
        { label: 'USAD', value: 'usad' },
        { label: 'DAGMM', value: 'dagmm' }
      ]
      break
    case 'imputation':
      baseModelOptions.value = [
        { label: 'BRITS', value: 'brits' },
        { label: 'SAITS', value: 'saits' },
        { label: 'Transformer', value: 'transformer' }
      ]
      break
  }
}, { immediate: true })

const rules = reactive<FormRules>({
  name: [
    {
      required: true,
      message: t('views.models.modelForm.form.modelName.placeholder'),
      trigger: 'blur'
    }
  ],
  model_type: [
    {
      required: true,
      message: t('views.models.modelForm.form.modelType.placeholder'),
      trigger: 'change'
    }
  ],
  base_model: [
    {
      required: true,
      message: t('views.models.modelForm.form.baseModel.placeholder'),
      trigger: 'change'
    }
  ]
})

watch(dialogVisible, (bool) => {
  if (!bool) {
    modelForm.value = {
      name: '',
      desc: '',
      model_type: 'forecasting',
      base_model: ''
    }
    modelFormRef.value?.clearValidate()
  }
})

const open = () => {
  dialogVisible.value = true
}

const submitHandle = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      loading.value = true
      // TODO: 调用创建模型API
      // 提交的数据结构示例：
      // {
      //   name: modelForm.value.name,
      //   desc: modelForm.value.desc,
      //   model_type: modelForm.value.model_type,
      //   base_model: modelForm.value.base_model
      // }
      setTimeout(() => {
        loading.value = false
        dialogVisible.value = false
        MsgSuccess(t('views.models.createSuccess'))
        emit('refresh')
      }, 1000)
    }
  })
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.card__radio {
  width: 100%;
  .el-card {
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s;
    &.active {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.w-full {
  width: 100%;
}
</style> 