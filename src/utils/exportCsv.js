// 导出布局清单为 CSV(纯字符串,零依赖,Excel 可直接打开)
// 含:明细表 + 按 类型|尺寸 的数量汇总。BOM 头保证中文不乱码。

function csvEscape(v) {
  const s = String(v == null ? '' : v)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function buildLayoutCsv(objects, area, sceneKey) {
  const lines = []
  lines.push(`区域(mm),${area.w} x ${area.d},场景,${sceneKey}`)
  lines.push('')
  // 明细
  const head = ['序号', '名称', '类型', '门窗', '长w(mm)', '宽d(mm)', '高h(mm)', 'X(mm)', 'Y(mm)', '旋转(°)', '层']
  lines.push(head.map(csvEscape).join(','))
  objects.forEach((o, i) => {
    lines.push([
      i + 1, o.name, o.type, o.isOpening ? '是' : '',
      Math.round(o.w), Math.round(o.d), Math.round(o.h || 0),
      Math.round(o.x), Math.round(o.y), Math.round(o.rotation || 0), o.layer || 0
    ].map(csvEscape).join(','))
  })
  lines.push('')
  // 汇总:按 类型+尺寸 分组
  lines.push('数量汇总')
  lines.push(['类型', '尺寸(长x宽x高)', '数量'].map(csvEscape).join(','))
  const map = new Map()
  objects.forEach((o) => {
    if (o.isOpening) return
    const key = `${o.type}|${Math.round(o.w)}x${Math.round(o.d)}x${Math.round(o.h || 0)}`
    map.set(key, (map.get(key) || 0) + 1)
  })
  ;[...map.entries()].forEach(([k, n]) => {
    const [type, size] = k.split('|')
    lines.push([type, size, n].map(csvEscape).join(','))
  })
  return '\uFEFF' + lines.join('\n')
}

export function downloadCsv(text, filename) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename || `layout_${Date.now()}.csv`
  a.click()
}
