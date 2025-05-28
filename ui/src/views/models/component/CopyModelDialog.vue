<template>
  <el-dialog
    :title="$t('views.models.copyModel')"
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
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click.prevent="dialogVisible = false" :loading="loading">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="submitHandle(modelFormRef)" :loading="loading">
          {{ $t('common.copy') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { MsgSuccess } from '@/utils/message'
import { t } from '@/locales'
import useStore from '@/stores'

const { model } = useStore()
const emit = defineEmits(['refresh'])

const modelFormRef = ref()
const loading = ref(false)
const dialogVisible = ref<boolean>(false)

interface ModelForm {
  name: string
  desc: string
  model_id: string
}

const modelForm = ref<ModelForm>({
  name: '',
  desc: '',
  model_id: ''
})

const rules = reactive<FormRules>({
  name: [
    {
      required: true,
      message: t('views.models.modelForm.form.modelName.placeholder'),
      trigger: 'blur'
    }
  ]
})

watch(dialogVisible, (bool) => {
  if (!bool) {
    modelForm.value = {
      name: '',
      desc: '',
      model_id: ''
    }
    modelFormRef.value?.clearValidate()
  }
})

const open = (row: any) => {
  modelForm.value = {
    name: `${row.name} - ${t('views.models.applicationForm.title.copy')}`,
    desc: row.desc,
    model_id: row.id
  }
  dialogVisible.value = true
}

const submitHandle = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      loading.value = true
      // TODO: 调用复制模型API
      // 提交的数据结构示例：
      // {
      //   name: modelForm.value.name,
      //   desc: modelForm.value.desc,
      //   model_id: modelForm.value.model_id
      // }
      setTimeout(() => {
        loading.value = false
        dialogVisible.value = false
        MsgSuccess(t('common.copySuccess'))
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
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 