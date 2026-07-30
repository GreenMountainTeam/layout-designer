// V4.7 Component Catalog
export const LAYER_NAMES = {
  0: 'L0 地面层',
  1: 'L1 台面层',
  2: 'L2 顶层',
  3: 'L3 自定义高层'
}

export const CATALOG = {
  furniture: {
    label: '🪑 家具',
    items: [
      { type: 'desk', name: '桌子', w: 1400, d: 700, h: 750, color: '#86efac', layer: 0 },
      { type: 'chair', name: '椅子', w: 500, d: 500, h: 900, color: '#bef264', layer: 0 },
      { type: 'sofa', name: '沙发', w: 1800, d: 800, h: 850, color: '#a7f3d0', layer: 0 },
      { type: 'cabinet', name: '柜子', w: 1000, d: 500, h: 1800, color: '#f9a8d4', layer: 0 },
      { type: 'bed', name: '床', w: 1800, d: 2000, h: 500, color: '#fbcfe8', layer: 0 },
      { type: 'rtable', name: '圆桌', w: 1200, d: 1200, h: 750, color: '#99f6e4', layer: 0 }
    ]
  },
  kitchen: {
    label: '🍳 厨房用具',
    items: [
      { type: 'kitchen_counter', name: '厨房操作台', w: 2400, d: 600, h: 850, color: '#d6d3d1', layer: 0 },
      { type: 'sink', name: '厨房水槽', w: 900, d: 600, h: 850, color: '#bae6fd', layer: 0 },
      { type: 'stove', name: '灶台', w: 750, d: 600, h: 850, color: '#64748b', layer: 0 },
      { type: 'range_hood', name: '抽油烟机', w: 900, d: 500, h: 450, color: '#94a3b8', layer: 2 },
      { type: 'fridge', name: '冰箱', w: 900, d: 750, h: 1850, color: '#e2e8f0', layer: 0 },
      { type: 'dishwasher', name: '洗碗机', w: 600, d: 600, h: 850, color: '#cbd5e1', layer: 0 },
      { type: 'kitchen_island', name: '厨房岛台', w: 1800, d: 900, h: 900, color: '#fde68a', layer: 0 }
    ]
  },
  bathroom: {
    label: '🚿 卫生间用具',
    items: [
      { type: 'toilet', name: '马桶', w: 700, d: 400, h: 750, color: '#f8fafc', layer: 0 },
      { type: 'bath_sink', name: '洗手盆', w: 800, d: 500, h: 850, color: '#dbeafe', layer: 0 },
      { type: 'bathtub', name: '浴缸', w: 1700, d: 750, h: 600, color: '#e0f2fe', layer: 0 },
      { type: 'shower', name: '淋浴房', w: 900, d: 900, h: 2100, color: '#93c5fd', layer: 0 },
      { type: 'bath_cabinet', name: '浴室柜', w: 900, d: 450, h: 1800, color: '#ddd6fe', layer: 0 },
      { type: 'washing_machine', name: '洗衣机', w: 650, d: 650, h: 900, color: '#e2e8f0', layer: 0 }
    ]
  },
  openings: {
    label: '🚪 门窗',
    items: [
      { type: 'door', name: '门', w: 900, d: 120, h: 2100, color: '#fbbf24', layer: 0, isOpening: true },
      { type: 'double_door', name: '双开门', w: 1600, d: 120, h: 2100, color: '#f59e0b', layer: 0, isOpening: true },
      { type: 'window', name: '窗', w: 1200, d: 120, h: 1500, color: '#7dd3fc', layer: 0, isOpening: true },
      { type: 'bay_window', name: '飘窗', w: 1800, d: 300, h: 1500, color: '#38bdf8', layer: 0, isOpening: true }
    ]
  },
  warehouseAutomation: {
    label: '🤖 自动化设备',
    items: [
      { type: 'conveyor', name: '输送线', w: 3000, d: 700, h: 800, color: '#60a5fa', layer: 0 },
      { type: 'agv', name: 'AGV', w: 1100, d: 800, h: 350, color: '#f97316', layer: 0 },
      { type: 'sorting_wall', name: '分播墙', w: 2400, d: 500, h: 2200, color: '#a78bfa', layer: 0 },
      { type: 'four_way_shuttle', name: '四向穿梭车', w: 1200, d: 1200, h: 350, color: '#ef4444', layer: 0 },
      { type: 'stacker_crane', name: '堆垛机', w: 1800, d: 1200, h: 4500, color: '#0ea5e9', layer: 0 },
      { type: 'robot_arm', name: '机械臂工作站', w: 1800, d: 1800, h: 2200, color: '#facc15', layer: 0 }
    ]
  },
  warehouseEquipment: {
    label: '🏭 仓库场景设备',
    items: [
      { type: 'pallet_rack', name: '托盘货架', w: 2700, d: 1000, h: 3000, color: '#2563eb', layer: 0 },
      { type: 'shelf', name: '轻型货架', w: 2000, d: 600, h: 2000, color: '#a78bfa', layer: 0 },
      { type: 'forklift', name: '叉车', w: 2400, d: 1100, h: 2200, color: '#f59e0b', layer: 0 },
      { type: 'hand_cart', name: '小推车', w: 900, d: 600, h: 950, color: '#22c55e', layer: 0 },
      { type: 'pallet_jack', name: '手动液压车', w: 1500, d: 550, h: 1200, color: '#eab308', layer: 0 },
      { type: 'workbench', name: '包装工作台', w: 1800, d: 800, h: 900, color: '#14b8a6', layer: 0 }
    ]
  },
  cargo: {
    label: '📦 箱货与托盘',
    items: [
      { type: 'pallet1210', name: '托盘1210', w: 1200, d: 1000, h: 150, color: '#93c5fd', layer: 0 },
      { type: 'pallet1111', name: '托盘1111', w: 1100, d: 1100, h: 150, color: '#93c5fd', layer: 0 },
      { type: 'box_l', name: '纸箱大', w: 600, d: 400, h: 400, color: '#fdba74', layer: 1 },
      { type: 'box_m', name: '纸箱中', w: 400, d: 300, h: 300, color: '#fed7aa', layer: 1 },
      { type: 'box_s', name: '纸箱小', w: 300, d: 200, h: 200, color: '#fef3c7', layer: 1 }
    ]
  },
  desktop: {
    label: '🖥️ 桌面物件',
    items: [
      { type: 'pc', name: '电脑', w: 400, d: 400, h: 400, color: '#c4b5fd', layer: 1 },
      { type: 'monitor', name: '显示器', w: 600, d: 200, h: 400, color: '#a5b4fc', layer: 1 },
      { type: 'keyboard', name: '键盘', w: 450, d: 150, h: 30, color: '#ddd6fe', layer: 1 },
      { type: 'device', name: '设备', w: 800, d: 600, h: 500, color: '#fca5a5', layer: 0 }
    ]
  }
}

export const SCENES = {
  container_40hq: { label: '40HQ集装箱', w: 12032, d: 2352 },
  container_20gp: { label: '20GP集装箱', w: 5898, d: 2352 },
  room: { label: '房间', w: 5000, d: 4000 },
  desk: { label: '工作台', w: 1600, d: 800 },
  custom: { label: '自定义', w: 3000, d: 2000 }
}

export const FLOOR_COLOR = '#ffffff'
