// 组件库定义。isOpening:true 的条目(门/窗)会吸附到墙上并渲染成"开口"
export const LAYER_NAMES = { 0: 'L0 地面层', 1: 'L1 台面层', 2: 'L2 顶层', 3: 'L3 自定义高层' }

export const CATALOG = {
  furniture: {
    label: '🪑 家具模块',
    items: [
      { type: 'desk',    name: '桌子', w: 1400, d: 700,  h: 750,  color: '#86efac', layer: 0 },
      { type: 'chair',   name: '椅子', w: 500,  d: 500,  h: 900,  color: '#bef264', layer: 0 },
      { type: 'sofa',    name: '沙发', w: 1800, d: 800,  h: 850,  color: '#a7f3d0', layer: 0 },
      { type: 'cabinet', name: '柜子', w: 1000, d: 500,  h: 1800, color: '#f9a8d4', layer: 0 },
      { type: 'bed',     name: '床',   w: 1800, d: 2000, h: 500,  color: '#fbcfe8', layer: 0 },
      { type: 'rtable',  name: '圆桌', w: 1200, d: 1200, h: 750,  color: '#99f6e4', layer: 0 }
    ]
  },
  openings: {
    label: '🚪 门窗模块 (拖到墙上)',
    items: [
      { type: 'door',        name: '门',     w: 900,  d: 120, h: 2100, color: '#fbbf24', layer: 0, isOpening: true },
      { type: 'double_door', name: '双开门', w: 1600, d: 120, h: 2100, color: '#f59e0b', layer: 0, isOpening: true },
      { type: 'window',      name: '窗',     w: 1200, d: 120, h: 1500, color: '#7dd3fc', layer: 0, isOpening: true },
      { type: 'bay_window',  name: '飘窗',   w: 1800, d: 300, h: 1500, color: '#38bdf8', layer: 0, isOpening: true }
    ]
  },
  cargo: {
    label: '📦 箱货模块',
    items: [
      { type: 'pallet1210', name: '托盘1210', w: 1200, d: 1000, h: 150,  color: '#93c5fd', layer: 0 },
      { type: 'pallet1111', name: '托盘1111', w: 1100, d: 1100, h: 150,  color: '#93c5fd', layer: 0 },
      { type: 'shelf',      name: '货架',     w: 2000, d: 600,  h: 2000, color: '#a78bfa', layer: 0 },
      { type: 'box_l',      name: '纸箱大',   w: 600,  d: 400,  h: 400,  color: '#fdba74', layer: 1 },
      { type: 'box_m',      name: '纸箱中',   w: 400,  d: 300,  h: 300,  color: '#fed7aa', layer: 1 },
      { type: 'box_s',      name: '纸箱小',   w: 300,  d: 200,  h: 200,  color: '#fef3c7', layer: 1 }
    ]
  },
  desktop: {
    label: '🖥️ 桌面物件',
    items: [
      { type: 'pc',       name: '电脑',   w: 400, d: 400, h: 400, color: '#c4b5fd', layer: 1 },
      { type: 'monitor',  name: '显示器', w: 600, d: 200, h: 400, color: '#a5b4fc', layer: 1 },
      { type: 'keyboard', name: '键盘',   w: 450, d: 150, h: 30,  color: '#ddd6fe', layer: 1 },
      { type: 'device',   name: '设备',   w: 800, d: 600, h: 500, color: '#fca5a5', layer: 0 }
    ]
  }
}

export const SCENES = {
  container_40hq: { label: '40HQ集装箱', w: 12032, d: 2352 },
  container_20gp: { label: '20GP集装箱', w: 5898,  d: 2352 },
  room:           { label: '房间',       w: 5000,  d: 4000 },
  desk:           { label: '工作台',     w: 1600,  d: 800  },
  custom:         { label: '自定义',     w: 3000,  d: 2000 }
}

export const FLOOR_COLOR = '#ffffff'
