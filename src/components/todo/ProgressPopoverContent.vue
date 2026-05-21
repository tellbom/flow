<template>
  <div class="pdf">

    <!-- ══ 顶部身份栏 ══ -->
    <div class="pdf-identity">
      <div class="pi-avatar" :style="avatarStyle(form.userName)">
        {{ (form.userName || '?')[0] }}
      </div>
      <div class="pi-info">
        <div class="pi-name">{{ form.userName || '—' }}</div>
        <div class="pi-meta">
          <span v-if="form.currentPosition">{{ form.currentPosition }}</span>
          <span v-if="form.currentPosition && form.nation" class="pi-sep">·</span>
          <span v-if="form.nation">{{ form.nation }}</span>
        </div>
      </div>
      <div class="pi-tip">
        <el-icon><InfoFilled /></el-icon>
        请如实填写，信息将用于巡察组人员档案
      </div>
    </div>

    <!-- ══ Section 1：基本信息 ══ -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="pdf-form"
    >

      <div class="pdf-section">
        <div class="pdf-section-header">
          <div class="psh-num">01</div>
          <div class="psh-title">基本信息</div>
        </div>
        <div class="pdf-grid">

          <el-form-item label="民族" prop="nation">
            <el-select v-model="form.nation" placeholder="请选择" clearable style="width:100%">
              <el-option v-for="n in NATIONS" :key="n" :label="n" :value="n" />
            </el-select>
          </el-form-item>

          <el-form-item label="籍贯" prop="nativePlace">
            <el-input v-model="form.nativePlace" placeholder="如：湖北武汉" />
          </el-form-item>

          <el-form-item label="出生地" prop="birthPlace">
            <el-input v-model="form.birthPlace" placeholder="如：湖北武汉" />
          </el-form-item>

          <el-form-item label="健康状况" prop="healthStatus">
            <el-select v-model="form.healthStatus" placeholder="请选择" clearable style="width:100%">
              <el-option label="良好" value="良好" />
              <el-option label="一般" value="一般" />
              <el-option label="较差" value="较差" />
            </el-select>
          </el-form-item>

          <el-form-item label="入党时间" prop="partyJoinTime">
            <el-date-picker
              v-model="form.partyJoinTime"
              type="month"
              placeholder="请选择"
              value-format="YYYY-MM"
              style="width:100%"
            />
          </el-form-item>

          <el-form-item label="参加工作时间" prop="workStartTime">
            <el-date-picker
              v-model="form.workStartTime"
              type="month"
              placeholder="请选择"
              value-format="YYYY-MM"
              style="width:100%"
            />
          </el-form-item>

          <el-form-item label="现任职务" prop="currentPosition" class="pdf-grid-full">
            <el-input v-model="form.currentPosition" placeholder="如：组织部科员" />
          </el-form-item>

        </div>
      </div>

      <!-- ══ Section 2：专业能力 ══ -->
      <div class="pdf-section">
        <div class="pdf-section-header">
          <div class="psh-num">02</div>
          <div class="psh-title">专业能力</div>
        </div>
        <div class="pdf-grid">

          <el-form-item label="专业技术职务" prop="professionalTitle">
            <el-select v-model="form.professionalTitle" placeholder="请选择" clearable style="width:100%">
              <el-option v-for="t in PROF_TITLES" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>

          <el-form-item label="熟悉专业及专长" prop="specialty" class="pdf-grid-full">
            <el-input
              v-model="form.specialty"
              placeholder="如：信息化建设、数据治理、党政管理…"
              :maxlength="200"
              show-word-limit
            />
          </el-form-item>

        </div>
      </div>

      <!-- ══ Section 3：学历学位 ══ -->
      <div class="pdf-section">
        <div class="pdf-section-header">
          <div class="psh-num">03</div>
          <div class="psh-title">学历学位</div>
        </div>

        <!-- 全日制 -->
        <div class="pdf-edu-group">
          <div class="peg-label">
            <span class="peg-tag peg-tag--full">全日制</span>
          </div>
          <div class="pdf-grid">
            <el-form-item label="学历" prop="fullTimeEducation">
              <el-select v-model="form.fullTimeEducation" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="e in EDU_LEVELS" :key="e" :label="e" :value="e" />
              </el-select>
            </el-form-item>
            <el-form-item label="学位" prop="fullTimeDegree">
              <el-select v-model="form.fullTimeDegree" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="d in DEGREES" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
            <el-form-item label="毕业院校系及专业" prop="fullTimeGraduateSchool" class="pdf-grid-full">
              <el-input v-model="form.fullTimeGraduateSchool" placeholder="如：武汉大学信息管理学院信息管理与信息系统专业" />
            </el-form-item>
          </div>
        </div>

        <!-- 在职 -->
        <div class="pdf-edu-group">
          <div class="peg-label">
            <span class="peg-tag peg-tag--job">在职</span>
            <span class="peg-opt">（如有，可填写）</span>
          </div>
          <div class="pdf-grid">
            <el-form-item label="学历" prop="onJobEducation">
              <el-select v-model="form.onJobEducation" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="e in EDU_LEVELS" :key="e" :label="e" :value="e" />
              </el-select>
            </el-form-item>
            <el-form-item label="学位" prop="onJobDegree">
              <el-select v-model="form.onJobDegree" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="d in DEGREES" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
            <el-form-item label="毕业院校系及专业" prop="onJobGraduateSchool" class="pdf-grid-full">
              <el-input v-model="form.onJobGraduateSchool" placeholder="如：华中科技大学软件工程专业" />
            </el-form-item>
          </div>
        </div>
      </div>

      <!-- ══ Section 4：考核奖惩 ══ -->
      <div class="pdf-section">
        <div class="pdf-section-header">
          <div class="psh-num">04</div>
          <div class="psh-title">考核奖惩</div>
        </div>
        <div class="pdf-grid">

          <el-form-item label="年度考核结果" prop="annualAssessment" class="pdf-grid-full">
            <el-input
              v-model="form.annualAssessment"
              placeholder="如：近三年考核均为优秀"
              :maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="奖惩情况" prop="rewardPunishment" class="pdf-grid-full">
            <el-input
              v-model="form.rewardPunishment"
              type="textarea"
              :rows="3"
              placeholder="如获奖、处分等情况，如无请填写「无」"
              :maxlength="500"
              show-word-limit
            />
          </el-form-item>

        </div>
      </div>

      <!-- ══ Section 5：工作简历 ══ -->
      <div class="pdf-section">
        <div class="pdf-section-header">
          <div class="psh-num">05</div>
          <div class="psh-title">工作简历</div>
          <span class="psh-hint">按时间顺序填写，每行一段经历</span>
        </div>

        <!-- 简历行列表 -->
        <div class="resume-table">
          <div class="rt-head">
            <div class="rt-col rt-col--time">时间段</div>
            <div class="rt-col rt-col--org">单位 / 部门</div>
            <div class="rt-col rt-col--pos">担任职务</div>
            <div class="rt-col rt-col--del"></div>
          </div>

          <transition-group name="rt-row" tag="div" class="rt-body">
            <div
              v-for="(item, idx) in resumeRows"
              :key="item._key"
              class="rt-row"
            >
              <div class="rt-col rt-col--time">
                <el-date-picker
                  v-model="item.dateRange"
                  type="monthrange"
                  range-separator="—"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  value-format="YYYY-MM"
                  style="width:100%"
                  size="small"
                />
              </div>
              <div class="rt-col rt-col--org">
                <el-input v-model="item.org" placeholder="单位/部门名称" size="small" />
              </div>
              <div class="rt-col rt-col--pos">
                <el-input v-model="item.position" placeholder="职务" size="small" />
              </div>
              <div class="rt-col rt-col--del">
                <button
                  type="button"
                  v-if="resumeRows.length > 1 && !props.readonly"
                  class="rt-del"
                  @click="removeResumeRow(idx)"
                  title="删除"
                >
                  <el-icon><Close /></el-icon>
                </button>
              </div>
            </div>
          </transition-group>

          <button v-if="!props.readonly" type="button" class="rt-add" @click="addResumeRow">
            <el-icon><Plus /></el-icon>
            添加一段经历
          </button>
        </div>

        <!-- 校验提示 -->
        <p v-if="resumeError" class="err-msg">{{ resumeError }}</p>
      </div>

    </el-form>
  </div>
</template>


<script setup>
import { ref, reactive, computed } from 'vue'
import { InfoFilled, Close, Plus } from '@element-plus/icons-vue'

// ─────────────────────────────────────────────────
//  Props（TaskApproveDrawer 传入）
// ─────────────────────────────────────────────────
const props = defineProps({
  taskInfo: { type: Object, default: null },
  readonly: { type: Boolean, default: false },
})

// ─────────────────────────────────────────────────
//  表单数据
// ─────────────────────────────────────────────────
// 只读模式从 extraData.personDetail 回填，编辑模式从 extraData 预填 userId/userName
const _pd = (props.readonly ? props.taskInfo?.extraData?.personDetail : null) ?? {}
const _ed = props.taskInfo?.extraData ?? {}

const form = reactive({
  userId:                _pd.userId                ?? _ed.userId   ?? '',
  userName:              _pd.userName              ?? _ed.userName ?? '',
  nation:                _pd.nation                ?? '',
  nativePlace:           _pd.nativePlace           ?? '',
  birthPlace:            _pd.birthPlace            ?? '',
  healthStatus:          _pd.healthStatus          ?? '',
  partyJoinTime:         _pd.partyJoinTime         ?? '',
  workStartTime:         _pd.workStartTime         ?? '',
  currentPosition:       _pd.currentPosition       ?? '',
  professionalTitle:     _pd.professionalTitle     ?? '',
  specialty:             _pd.specialty             ?? '',
  fullTimeEducation:     _pd.fullTimeEducation     ?? '',
  fullTimeDegree:        _pd.fullTimeDegree        ?? '',
  fullTimeGraduateSchool:_pd.fullTimeGraduateSchool ?? '',
  onJobEducation:        _pd.onJobEducation        ?? '',
  onJobDegree:           _pd.onJobDegree           ?? '',
  onJobGraduateSchool:   _pd.onJobGraduateSchool   ?? '',
  annualAssessment:      _pd.annualAssessment      ?? '',
  rewardPunishment:      _pd.rewardPunishment      ?? '',
})

// ─────────────────────────────────────────────────
//  工作简历行
// ─────────────────────────────────────────────────
let _key = 0

// 只读模式：从 extraData.personDetail.resume 字符串解析回填
function parseResumeToRows(resumeStr) {
  if (!resumeStr) return [{ _key: _key++, dateRange: null, org: '', position: '' }]
  return resumeStr.split('\n').filter(Boolean).map(line => {
    // 格式：起止时间  单位  职务
    const parts = line.split(/\s{2,}/)
    return { _key: _key++, dateRange: parts[0] ?? '', org: parts[1] ?? '', position: parts[2] ?? '' }
  })
}

const resumeRows = reactive(
  props.readonly && _pd.resume
    ? parseResumeToRows(_pd.resume)
    : [{ _key: _key++, dateRange: null, org: '', position: '' }]
)
const resumeError = ref('')

function addResumeRow() {
  resumeRows.push({ _key: _key++, dateRange: null, org: '', position: '' })
}
function removeResumeRow(idx) {
  resumeRows.splice(idx, 1)
}

// 简历序列化为字符串：'YYYY-MM—YYYY-MM  单位  职务'
function buildResumeString() {
  return resumeRows
    .filter(r => r.org || r.position)
    .map(r => {
      const range = r.dateRange
        ? `${r.dateRange[0]}—${r.dateRange[1]}`
        : '（时间未填）'
      return `${range}  ${r.org || '—'}  ${r.position || '—'}`
    })
    .join('\n')
}

// ─────────────────────────────────────────────────
//  表单校验
// ─────────────────────────────────────────────────
const formRef = ref(null)
const rules = {
  nation:           [{ required: true, message: '请选择民族',       trigger: 'change' }],
  healthStatus:     [{ required: true, message: '请选择健康状况',   trigger: 'change' }],
  workStartTime:    [{ required: true, message: '请选择参加工作时间', trigger: 'change' }],
  currentPosition:  [{ required: true, message: '请填写现任职务',   trigger: 'blur'   }],
  fullTimeEducation:[{ required: true, message: '请选择全日制学历', trigger: 'change' }],
  fullTimeDegree:   [{ required: true, message: '请选择全日制学位', trigger: 'change' }],
}

// ─────────────────────────────────────────────────
//  ★ TaskApproveDrawer 点「同意」时调用
//  返回 false → 阻断提交
//  返回 { personDetail: {...} } → merge 进 variables
// ─────────────────────────────────────────────────
async function submit() {
  if (props.readonly) return true

  // el-form 校验
  try {
    await formRef.value.validate()
  } catch {
    return false
  }

  // 简历校验：至少 1 行有内容
  const hasResume = resumeRows.some(r => r.org || r.position)
  if (!hasResume) {
    resumeError.value = '请至少填写一段工作经历'
    return false
  }
  resumeError.value = ''

  return {
    personDetail: {
      userId:                form.userId,
      userName:              form.userName,
      nation:                form.nation,
      nativePlace:           form.nativePlace,
      birthPlace:            form.birthPlace,
      healthStatus:          form.healthStatus,
      partyJoinTime:         form.partyJoinTime,
      workStartTime:         form.workStartTime,
      currentPosition:       form.currentPosition,
      professionalTitle:     form.professionalTitle,
      specialty:             form.specialty,
      fullTimeEducation:     form.fullTimeEducation,
      fullTimeDegree:        form.fullTimeDegree,
      fullTimeGraduateSchool:form.fullTimeGraduateSchool,
      onJobEducation:        form.onJobEducation  || null,
      onJobDegree:           form.onJobDegree     || null,
      onJobGraduateSchool:   form.onJobGraduateSchool || null,
      annualAssessment:      form.annualAssessment,
      rewardPunishment:      form.rewardPunishment,
      resume:                buildResumeString(),
    }
  }
}

defineExpose({ submit })

// ─────────────────────────────────────────────────
//  头像渐变
// ─────────────────────────────────────────────────
const GRADS = [
  ['#c62f2f','#e04545'], ['#f5a623','#e8940f'],
  ['#27ae60','#2ecc71'], ['#3370ff','#5a8fff'],
  ['#8e44ad','#9b59b6'], ['#16a085','#1abc9c'],
]
function avatarStyle(name) {
  // name 为空字符串时 charCodeAt(0) 返回 NaN，NaN % length 仍是 NaN
  // 用 || 0 兜底，确保 idx 始终是 0~GRADS.length-1 的合法整数
  const code = (name && name.length > 0) ? name.charCodeAt(0) : 0
  const idx  = code % GRADS.length
  const [a, b] = GRADS[idx]
  return { background: `linear-gradient(135deg,${a},${b})` }
}

// ─────────────────────────────────────────────────
//  静态选项
// ─────────────────────────────────────────────────
const NATIONS = [
  '汉族','蒙古族','回族','藏族','维吾尔族','苗族','彝族','壮族',
  '布依族','朝鲜族','满族','侗族','瑶族','白族','土家族','哈尼族',
  '哈萨克族','傣族','黎族','傈僳族','佤族','畲族','高山族','拉祜族',
  '水族','东乡族','纳西族','景颇族','柯尔克孜族','土族','达斡尔族',
  '仫佬族','羌族','布朗族','撒拉族','毛南族','仡佬族','锡伯族',
  '阿昌族','普米族','塔吉克族','怒族','乌孜别克族','俄罗斯族',
  '鄂温克族','德昂族','保安族','裕固族','京族','塔塔尔族','独龙族',
  '鄂伦春族','赫哲族','门巴族','珞巴族','基诺族',
]

const EDU_LEVELS = ['专科','本科','硕士研究生','博士研究生']
const DEGREES    = ['无学位','专科','学士','硕士','博士']
const PROF_TITLES = [
  '无','研究员','副研究员','助理研究员','研究实习员',
  '教授','副教授','讲师','助教',
  '高级工程师','工程师','助理工程师','技术员',
  '高级经济师','经济师','助理经济师',
  '高级会计师','会计师','助理会计师',
  '高级政工师','政工师','助理政工师',
]
</script>


<style scoped>
.pdf {
  --red:      #c62f2f;
  --red-lt:   #fff1f0;
  --blue:     #3370ff;
  --blue-lt:  #f0f4ff;
  --green:    #27ae60;
  --border:   #e4e7ed;
  --bg:       #f7f8fa;
  --text-1:   #1d2129;
  --text-2:   #4e5969;
  --text-3:   #86909c;
  --radius:   10px;

  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

/* ══ 身份栏 ══════════════════════════════════ */
.pdf-identity {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: linear-gradient(90deg, #fff8f8, #fafbff);
  border: 1px solid var(--border);
  border-left: 4px solid var(--red);
  border-radius: var(--radius);
}

.pi-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
}

.pi-info { flex: 1; }

.pi-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
}

.pi-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 3px;
  display: flex;
  gap: 6px;
}
.pi-sep { color: var(--border); }

.pi-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-3);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
.pi-tip .el-icon { color: var(--blue); font-size: 13px; }

/* ══ Section 块 ══════════════════════════════ */
.pdf-section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: #fff;
}

.pdf-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.psh-num {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: var(--red);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  letter-spacing: -0.5px;
}

.psh-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1);
  flex: 1;
}

.psh-hint {
  font-size: 11px;
  color: var(--text-3);
}

/* ══ 双列 Grid ════════════════════════════════ */
.pdf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 16px;
}

.pdf-grid > .el-form-item {
  margin: 0;
  padding: 8px 10px;
}

.pdf-grid-full {
  grid-column: 1 / -1;
}

/* el-form-item label 样式 */
.pdf-form :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  padding-bottom: 4px;
  line-height: 1.4;
}

.pdf-form :deep(.el-input__wrapper),
.pdf-form :deep(.el-textarea__inner),
.pdf-form :deep(.el-select .el-input__wrapper) {
  border-radius: 7px;
  border-color: var(--border);
  box-shadow: 0 0 0 1px var(--border) inset;
  font-size: 13px;
}

.pdf-form :deep(.el-input__wrapper:hover),
.pdf-form :deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.pdf-form :deep(.el-input__wrapper.is-focus),
.pdf-form :deep(.el-select .el-input__wrapper.is-focus),
.pdf-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px var(--red) inset !important;
  border-color: var(--red) !important;
}

.pdf-form :deep(.el-form-item__error) {
  font-size: 11px;
}

/* ══ 学历分组 ══════════════════════════════════ */
.pdf-edu-group {
  padding: 14px 16px 6px;
  border-bottom: 1px dashed var(--border);
}
.pdf-edu-group:last-child { border-bottom: none; }

.peg-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.peg-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.peg-tag--full { background: var(--red-lt);  color: var(--red);  }
.peg-tag--job  { background: var(--blue-lt); color: var(--blue); }

.peg-opt { font-size: 11px; color: var(--text-3); }

/* ══ 工作简历表格 ══════════════════════════════ */
.resume-table {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rt-head, .rt-row {
  display: grid;
  grid-template-columns: 220px 1fr 140px 32px;
  gap: 8px;
  align-items: center;
}

.rt-head {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  padding: 0 2px 4px;
  border-bottom: 1px solid var(--border);
}

.rt-body { display: flex; flex-direction: column; gap: 6px; }

.rt-row {
  padding: 6px 6px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #fafafa;
  transition: border-color .12s, box-shadow .12s;
}
.rt-row:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

/* 覆盖行内 input size=small 样式 */
.rt-row :deep(.el-input__wrapper) {
  border-radius: 6px;
  border-color: transparent;
  box-shadow: none;
  background: transparent;
  font-size: 13px;
}
.rt-row :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border) inset;
  background: #fff;
}
.rt-row :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--red) inset !important;
  background: #fff;
}

/* date-range picker 在行内 */
.rt-row :deep(.el-date-editor .el-input__wrapper) {
  border-radius: 6px;
  box-shadow: none;
  border-color: transparent;
  background: transparent;
  font-size: 12px;
  padding: 0 6px;
}
.rt-row :deep(.el-date-editor .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border) inset;
  background: #fff;
}

.rt-del {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: none;
  background: #f0f2f5;
  color: var(--text-3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 10px;
  transition: background .1s, color .1s;
}
.rt-del:hover { background: var(--red-lt); color: var(--red); }

.rt-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: 1.5px dashed var(--border);
  background: transparent;
  color: var(--text-3);
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color .12s, color .12s, background .12s;
  align-self: flex-start;
  margin-top: 4px;
}
.rt-add:hover {
  border-color: var(--red);
  color: var(--red);
  background: var(--red-lt);
}

/* ══ 错误提示 ═════════════════════════════════ */
.err-msg {
  font-size: 12px;
  color: var(--red);
  margin: 4px 0 0;
}

/* ══ 过渡 ════════════════════════════════════ */
.rt-row-enter-active { transition: all .16s ease; }
.rt-row-leave-active { transition: all .12s ease; }
.rt-row-enter-from   { opacity: 0; transform: translateY(-6px); }
.rt-row-leave-to     { opacity: 0; transform: translateX(10px); }
</style>