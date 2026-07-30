import React from 'react'

function M({ color, hi, transparent = false, opacity = 1 }) {
  return <meshStandardMaterial color={hi ? '#ff44aa' : color} emissive={hi ? '#ff44aa' : '#000000'} emissiveIntensity={hi ? 0.35 : 0} transparent={transparent} opacity={opacity} />
}
const Box = ({ p=[0,0,0], s=[1,1,1], c='#aaa', hi=false, children }) => <mesh position={p}><boxGeometry args={s} />{children || <M color={c} hi={hi} />}</mesh>
const Cyl = ({ p=[0,0,0], r=.1, h=.1, c='#aaa', hi=false, seg=24, rot=[0,0,0] }) => <mesh position={p} rotation={rot}><cylinderGeometry args={[r,r,h,seg]} /><M color={c} hi={hi} /></mesh>

export function hasRichModel(type) {
  return new Set([
    'kitchen_counter','sink','stove','range_hood','fridge','dishwasher','kitchen_island',
    'toilet','bath_sink','bathtub','shower','bath_cabinet','washing_machine',
    'conveyor','agv','sorting_wall','four_way_shuttle','stacker_crane','robot_arm',
    'pallet_rack','shelf','forklift','hand_cart','pallet_jack','workbench'
  ]).has(type)
}

export function ComponentModel({ o, hi=false }) {
  const w=o.w/1000, d=o.d/1000, h=(o.h||500)/1000, c=o.color||'#aaa'
  const p=[]
  if (o.type==='kitchen_counter' || o.type==='kitchen_island' || o.type==='workbench') {
    p.push(<Box key="body" p={[0,h*.42,0]} s={[w,h*.84,d]} c={c} hi={hi}/>)
    p.push(<Box key="top" p={[0,h-.025,0]} s={[w+.04,.05,d+.04]} c="#f8fafc" hi={hi}/>)
    if(o.type==='kitchen_counter') p.push(<Box key="line" p={[0,h*.55,d/2+.006]} s={[w*.9,.02,.012]} c="#64748b" hi={hi}/>)
  } else if (o.type==='sink' || o.type==='bath_sink') {
    p.push(<Box key="cab" p={[0,h*.42,0]} s={[w,h*.84,d]} c={c} hi={hi}/>)
    p.push(<Box key="rim" p={[0,h-.035,0]} s={[w,.07,d]} c="#e2e8f0" hi={hi}/>)
    p.push(<Box key="basin" p={[0,h+.005,0]} s={[w*.65,.03,d*.55]} c="#38bdf8" hi={hi}/>)
    p.push(<Cyl key="tap" p={[0,h+.14,-d*.25]} r={.025} h={.28} c="#64748b" hi={hi}/>)
  } else if (o.type==='stove') {
    p.push(<Box key="body" p={[0,h/2,0]} s={[w,h,d]} c={c} hi={hi}/>)
    ;[[-.22,-.16],[.22,-.16],[-.22,.16],[.22,.16]].forEach((q,i)=>p.push(<Cyl key={i} p={[q[0]*w,h+.015,q[1]*d]} r={Math.min(w,d)*.1} h={.03} c="#111827" hi={hi}/>))
  } else if (o.type==='range_hood') {
    p.push(<Box key="hood" p={[0,h*.3,0]} s={[w,h*.6,d]} c={c} hi={hi}/>)
    p.push(<Box key="duct" p={[0,h*.8,-d*.2]} s={[w*.35,h*.4,d*.35]} c="#cbd5e1" hi={hi}/>)
  } else if (o.type==='fridge' || o.type==='dishwasher' || o.type==='washing_machine') {
    p.push(<Box key="body" p={[0,h/2,0]} s={[w,h,d]} c={c} hi={hi}/>)
    if(o.type==='washing_machine') p.push(<Cyl key="door" p={[0,h*.52,d/2+.015]} r={w*.28} h={.03} c="#64748b" hi={hi} rot={[Math.PI/2,0,0]}/>)
    else p.push(<Box key="handle" p={[w*.32,h*.55,d/2+.015]} s={[.03,h*.35,.03]} c="#475569" hi={hi}/>)
  } else if (o.type==='toilet') {
    p.push(<Box key="tank" p={[0,h*.68,-d*.32]} s={[w*.75,h*.55,d*.28]} c={c} hi={hi}/>)
    p.push(<Cyl key="bowl" p={[0,h*.28,d*.08]} r={w*.42} h={h*.4} c={c} hi={hi}/>)
  } else if (o.type==='bathtub') {
    p.push(<Box key="outer" p={[0,h/2,0]} s={[w,h,d]} c={c} hi={hi}/>)
    p.push(<Box key="water" p={[0,h+.005,0]} s={[w*.82,.02,d*.7]} c="#38bdf8" hi={hi}/>)
  } else if (o.type==='shower') {
    p.push(<Box key="tray" p={[0,.04,0]} s={[w,.08,d]} c="#e2e8f0" hi={hi}/>)
    p.push(<Box key="glass1" p={[0,h/2,-d/2]} s={[w,.98*h,.025]} c="#7dd3fc" hi={hi}><M color="#7dd3fc" hi={hi} transparent opacity={.35}/></Box>)
    p.push(<Box key="glass2" p={[-w/2,h/2,0]} s={[.025,.98*h,d]} c="#7dd3fc" hi={hi}><M color="#7dd3fc" hi={hi} transparent opacity={.35}/></Box>)
  } else if (o.type==='bath_cabinet') {
    p.push(<Box key="body" p={[0,h/2,0]} s={[w,h,d]} c={c} hi={hi}/>)
    p.push(<Box key="mirror" p={[0,h*.72,d/2+.012]} s={[w*.75,h*.45,.02]} c="#bfdbfe" hi={hi}/>)
  } else if (o.type==='conveyor') {
    p.push(<Box key="frame" p={[0,h*.78,0]} s={[w,.12,d]} c="#475569" hi={hi}/>)
    const n=Math.max(3,Math.floor(w/.3)); for(let i=0;i<n;i++) p.push(<Cyl key={i} p={[-w/2+(i+.5)*w/n,h*.88,0]} r={d*.08} h={d*.9} c={c} hi={hi} rot={[Math.PI/2,0,0]}/>)
    ;[-w*.42,w*.42].forEach((x,i)=>p.push(<Box key={'leg'+i} p={[x,h*.38,0]} s={[.08,h*.75,.08]} c="#64748b" hi={hi}/>))
  } else if (o.type==='agv' || o.type==='four_way_shuttle') {
    p.push(<Box key="body" p={[0,h*.48,0]} s={[w,h*.75,d]} c={c} hi={hi}/>)
    ;[[-w*.32,-d*.45],[w*.32,-d*.45],[-w*.32,d*.45],[w*.32,d*.45]].forEach((q,i)=>p.push(<Cyl key={i} p={[q[0],h*.18,q[1]]} r={.09} h={.06} c="#111827" hi={hi} rot={[Math.PI/2,0,0]}/>))
    p.push(<Cyl key="lidar" p={[0,h*.92,0]} r={.09} h={.12} c="#22d3ee" hi={hi}/>)
  } else if (o.type==='sorting_wall') {
    p.push(<Box key="frame" p={[0,h/2,0]} s={[w,h,d]} c="#334155" hi={hi}/>)
    const cols=4, rows=3; for(let r=0;r<rows;r++) for(let col=0;col<cols;col++) p.push(<Box key={`${r}-${col}`} p={[-w/2+(col+.5)*w/cols,-0+h-(r+.5)*h/rows,d/2+.015]} s={[w/cols-.04,h/rows-.04,.03]} c={c} hi={hi}/>)
  } else if (o.type==='pallet_rack' || o.type==='shelf') {
    ;[-w/2+.04,w/2-.04].forEach((x,i)=>[-d/2+.04,d/2-.04].forEach((z,j)=>p.push(<Box key={`${i}-${j}`} p={[x,h/2,z]} s={[.08,h,.08]} c="#1d4ed8" hi={hi}/>)))
    const levels=o.type==='pallet_rack'?3:4; for(let i=0;i<levels;i++) p.push(<Box key={'lv'+i} p={[0,(i+.15)*h/levels,0]} s={[w,.06,d]} c={c} hi={hi}/>)
  } else if (o.type==='forklift') {
    p.push(<Box key="body" p={[-w*.1,h*.32,0]} s={[w*.55,h*.45,d]} c={c} hi={hi}/>)
    p.push(<Box key="cab" p={[-w*.22,h*.68,0]} s={[w*.35,h*.55,d*.9]} c="#fcd34d" hi={hi}/>)
    p.push(<Box key="mast1" p={[w*.28,h*.58,-d*.25]} s={[.08,h*.85,.08]} c="#334155" hi={hi}/>)
    p.push(<Box key="mast2" p={[w*.28,h*.58,d*.25]} s={[.08,h*.85,.08]} c="#334155" hi={hi}/>)
    p.push(<Box key="fork1" p={[w*.45,.08,-d*.25]} s={[w*.55,.06,.08]} c="#475569" hi={hi}/>)
    p.push(<Box key="fork2" p={[w*.45,.08,d*.25]} s={[w*.55,.06,.08]} c="#475569" hi={hi}/>)
    ;[[-w*.25,-d*.45],[-w*.25,d*.45],[w*.12,-d*.45],[w*.12,d*.45]].forEach((q,i)=>p.push(<Cyl key={i} p={[q[0],.16,q[1]]} r={.16} h={.08} c="#111827" hi={hi} rot={[Math.PI/2,0,0]}/>))
  } else if (o.type==='hand_cart' || o.type==='pallet_jack') {
    p.push(<Box key="deck" p={[0,.12,0]} s={[w*.75,.12,d]} c={c} hi={hi}/>)
    p.push(<Box key="handle" p={[-w*.42,h*.55,0]} s={[.05,h,.05]} c="#334155" hi={hi}/>)
    ;[[-w*.25,-d*.42],[-w*.25,d*.42],[w*.25,-d*.42],[w*.25,d*.42]].forEach((q,i)=>p.push(<Cyl key={i} p={[q[0],.08,q[1]]} r={.08} h={.05} c="#111827" hi={hi} rot={[Math.PI/2,0,0]}/>))
  } else if (o.type==='stacker_crane') {
    p.push(<Box key="base" p={[0,.15,0]} s={[w,.3,d]} c={c} hi={hi}/>)
    p.push(<Box key="mast" p={[0,h/2,0]} s={[.18,h,.18]} c="#0369a1" hi={hi}/>)
    p.push(<Box key="car" p={[0,h*.55,0]} s={[w*.7,.2,d*.7]} c="#f59e0b" hi={hi}/>)
  } else if (o.type==='robot_arm') {
    p.push(<Cyl key="base" p={[0,.15,0]} r={w*.18} h={.3} c="#334155" hi={hi}/>)
    p.push(<Cyl key="arm1" p={[0,h*.32,0]} r={.09} h={h*.55} c={c} hi={hi} rot={[0,0,-.35]}/>)
    p.push(<Cyl key="joint" p={[w*.1,h*.58,0]} r={.14} h={.18} c="#475569" hi={hi} rot={[Math.PI/2,0,0]}/>)
    p.push(<Cyl key="arm2" p={[w*.23,h*.72,0]} r={.07} h={h*.45} c={c} hi={hi} rot={[0,0,.55]}/>)
  } else return null
  return <>{p}</>
}
