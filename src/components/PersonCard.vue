<template>
  <div class="person-card">

    <!-- 英雄区：头像 + 核心身份 -->
    <div class="hero">
      <div class="hero-avatar" :style="avatarGradient">
        {{ member.userName?.[0] ?? '？' }}
      </div>
      <div class="hero-info">
        <h2 class="hero-name">{{ member.userName }}</h2>
        <div class="hero-pos">{{ member.currentPosition || '职务未填写' }}</div>
        <div class="hero-tags">
          <span v-if="member.professionalTitle" class="tag tag--blue">
            {{ member.professionalTitle }}
          </span>
          <span v-if="member.healthStatus" class="tag tag--green">
            {{ member.healthStatus }}
          </span>
          <span v-if="member.nation" class="tag tag--gray">
            {{ member.nation }}
          </span>
        </div>
      </div>
    </div>

    <!-- 基本信息 -->
    <CardSection title="基本信息">
      <template #default>
        <FieldRow v-for="f in basicFields" :key="f.label" :label="f.label" :value="f.value" />
      </template>
    </CardSection>

    <!-- 专业能力 -->
    <CardSection title="专业能力">
      <template #default>
        <FieldRow label="专业技术职务" :value="member.professionalTitle" />
        <FieldRow label="熟悉专业及专长" :value="member.specialty" :full="true" />
      </template>
    </CardSection>

    <!-- 学历学位 -->
    <CardSection title="学历学位">
      <template #default>
        <div class="edu-group">
          <div class="edu-tag edu-tag--red">全日制教育</div>
          <FieldRow label="学历"        :value="member.fullTimeEducation" />
          <FieldRow label="学位"        :value="member.fullTimeDegree" />
          <FieldRow label="毕业院校专业" :value="member.fullTimeGraduateSchool" :full="true" />
        </div>
        <div class="edu-group edu-group--sep">
          <div class="edu-tag edu-tag--yellow">在职教育</div>
          <FieldRow label="学历"        :value="member.onJobEducation" />
          <FieldRow label="学位"        :value="member.onJobDegree" />
          <FieldRow label="毕业院校专业" :value="member.onJobGraduateSchool" :full="true" />
        </div>
      </template>
    </CardSection>

    <!-- 工作简历 -->
    <CardSection v-if="member.resume" title="工作简历">
      <template #default>
        <div class="resume-text">{{ member.resume }}</div>
      </template>
    </CardSection>

  </div>
</template>

<script setup>
import { computed, defineComponent, h } from 'vue'

/** 纯展示，所有数据由父级传入 */
const props = defineProps({
  member: { type: Object, required: true },
})

// ── 字段聚合 ──────────────────────────────────
const basicFields = computed(() => [
  { label: '民族',       value: props.member.nation },
  { label: '籍贯',       value: props.member.nativePlace },
  { label: '出生地',     value: props.member.birthPlace },
  { label: '入党时间',   value: props.member.partyJoinTime },
  { label: '参加工作',   value: props.member.workStartTime },
  { label: '健康状况',   value: props.member.healthStatus },
])

// ── 头像渐变（姓名首字哈希）──────────────────
const GRADS = [
  ['#c62f2f','#e04545'], ['#f5a623','#e8940f'],
  ['#27ae60','#2ecc71'], ['#3370ff','#5a8fff'],
  ['#8e44ad','#9b59b6'], ['#16a085','#1abc9c'],
]
const avatarGradient = computed(() => {
  const idx = (props.member.userName?.charCodeAt(0) ?? 0) % GRADS.length
  const [a, b] = GRADS[idx]
  return { background: `linear-gradient(135deg, ${a}, ${b})` }
})

// ── 内部子组件（不单独拆文件）────────────────
const CardSection = defineComponent({
  name: 'CardSection',
  props: { title: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'card-section' }, [
      h('div', { class: 'cs-header' }, [
        h('span', { class: 'cs-title' }, props.title),
      ]),
      h('div', { class: 'cs-body' }, slots.default?.()),
    ])
  },
})

const FieldRow = defineComponent({
  name: 'FieldRow',
  props: { label: String, value: String, full: Boolean },
  setup(props) {
    return () => h('div', { class: ['fr', props.full ? 'fr--full' : ''] }, [
      h('span', { class: 'fr-label' }, props.label),
      h('span', { class: 'fr-value' }, props.value || '—'),
    ])
  },
})
</script>

<style scoped>
.person-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

/* ── 英雄区 ─────────────────────────────────── */
.hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0f2f5;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

.hero-avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
}

.hero-info { flex: 1; }

.hero-name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1d2129;
  letter-spacing: -.3px;
}

.hero-pos {
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.tag {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 20px;
}
.tag--blue  { background: #e8f0ff; color: #3370ff; }
.tag--green { background: #e6f9ee; color: #27ae60; }
.tag--gray  { background: #f4f5f7; color: #86909c; }

/* ── 卡片段 ─────────────────────────────────── */
:deep(.card-section) {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}

:deep(.cs-header) {
  padding: 9px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f4f5f7;
}

:deep(.cs-title) {
  font-size: 11px;
  font-weight: 700;
  color: #86909c;
  text-transform: uppercase;
  letter-spacing: .8px;
}

:deep(.cs-body) {
  display: flex;
  flex-wrap: wrap;
}

/* ── 字段行 ─────────────────────────────────── */
:deep(.fr) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 16px;
  width: 50%;
  border-bottom: 1px solid #f4f5f7;
  box-sizing: border-box;
}

:deep(.fr--full) { width: 100%; }

/* 去掉最后两个子项（偶数布局）的底边框 */
:deep(.fr:last-child),
:deep(.fr:nth-last-child(2):not(.fr--full)) { border-bottom: none; }

:deep(.fr-label) {
  width: 90px;
  min-width: 90px;
  font-size: 12px;
  color: #86909c;
  flex-shrink: 0;
  padding-top: 1px;
}

:deep(.fr-value) {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
  line-height: 1.6;
  word-break: break-all;
}

/* ── 学历分组 ────────────────────────────────── */
.edu-group {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}

.edu-group--sep { border-top: 1px solid #f4f5f7; }

/* 全日制/在职标签 */
.edu-tag {
  width: 100%;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .3px;
}

.edu-tag--red {
  color: #c62f2f;
  background: linear-gradient(90deg, #fff1f0 0%, transparent 60%);
  border-left: 2.5px solid #c62f2f;
}

.edu-tag--yellow {
  color: #b7641a;
  background: linear-gradient(90deg, #fffbf0 0%, transparent 60%);
  border-left: 2.5px solid #f5a623;
}

/* 简历文本 */
.resume-text {
  width: 100%;
  padding: 14px 16px;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.9;
  white-space: pre-line;
  word-break: break-all;
}
</style>
