# 格斗游戏 - 美术资源清单

游戏已包含程序化生成的占位图形，以下是需要替换/补充的美术资源：

---

## 📁 资源目录结构

```
Fighting/
├── index.html          # 游戏主文件（已生成）
├── assets/
│   ├── characters/     # 角色资源
│   │   ├── ryu/
│   │   ├── ken/
│   │   ├── chunli/
│   │   ├── guile/
│   │   ├── zangief/
│   │   ├── dhalsim/
│   │   ├── honda/
│   │   └── blanka/
│   ├── backgrounds/    # 背景资源
│   ├── ui/             # UI资源
│   ├── effects/        # 特效资源
│   └── audio/          # 音效资源
```

---

## 🧑‍🎤 角色资源 (每个角色)

每个角色需要以下资源：

| 资源名 | 格式 | 尺寸 | 说明 |
|--------|------|------|------|
| `idle.png` | PNG (透明背景) | 256×256 | 站立待机动画帧 (8帧) |
| `walk.png` | PNG (透明背景) | 256×256 | 行走动画帧 (6帧) |
| `punch.png` | PNG (透明背景) | 256×256 | 出拳动画帧 (4帧) |
| `kick.png` | PNG (透明背景) | 256×256 | 踢腿动画帧 (4帧) |
| `jump.png` | PNG (透明背景) | 256×256 | 跳跃动画帧 (4帧) |
| `crouch.png` | PNG (透明背景) | 256×256 | 下蹲动画帧 (4帧) |
| `special.png` | PNG (透明背景) | 256×256 | 必杀技动画帧 (6帧) |
| `hit.png` | PNG (透明背景) | 256×256 | 受击动画帧 (3帧) |
| `ko.png` | PNG (透明背景) | 256×256 | 击倒动画帧 (4帧) |
| `portrait.png` | PNG | 200×280 | 选人界面头像 |
| `icon.png` | PNG | 64×64 | 小图标 (头像缩略) |

### 角色列表

| ID | 中文名 | 英文名 | 主色 | 特色 |
|----|--------|--------|------|------|
| `ryu` | 隆 | RYU | 白色道服+红头带 | 波动拳 |
| `ken` | 肯 | KEN | 红色道服 | 升龙拳 |
| `chunli` | 春丽 | CHUN-LI | 蓝色旗袍+白丝袜 | 百裂脚 |
| `guile` | 古烈 | GUILE | 绿色军装+飞机头 | 音速手刀 |
| `zangief` | 桑吉尔夫 | ZANGIEF | 红色短裤+大胡子 | 螺旋打桩 |
| `dhalsim` | 达尔锡 | DHALSIM | 黄色裤子+骷髅项链 | 瑜伽火焰 |
| `honda` | 本田 | E.HONDA | 绿色相扑带 | 百贯张手 |
| `blanka` | 布兰卡 | BLANKA | 绿色兽人+橙色头发 | 放电 |

---

## 🏙️ 背景资源

| 资源名 | 格式 | 尺寸 | 说明 |
|--------|------|------|------|
| `bg-street.png` | PNG/JPG | 1920×1080 | 街头场景 (主背景) |
| `bg-arena.png` | PNG/JPG | 1920×1080 | 格斗擂台 |
| `bg-rooftop.png` | PNG/JPG | 1920×1080 | 屋顶夜景 |
| `bg-temple.png` | PNG/JPG | 1920×1080 | 日式神殿 |
| `ground.png` | PNG | 1920×120 | 地面瓦片 (可平铺) |

---

## 🖼️ UI 资源

| 资源名 | 格式 | 尺寸 | 说明 |
|--------|------|------|------|
| `title-bg.png` | PNG/JPG | 1920×1080 | 标题画面背景 |
| `hp-frame.png` | PNG (透明) | 440×30 | 血条边框 |
| `hp-fill-p1.png` | PNG | 420×24 | P1血条填充 |
| `hp-fill-p2.png` | PNG | 420×24 | P2血条填充 |
| `vs-badge.png` | PNG (透明) | 200×200 | VS图标 |
| `round-banner.png` | PNG (透明) | 600×200 | "ROUND 1" 横幅 |
| `fight-banner.png` | PNG (透明) | 600×200 | "FIGHT!" 横幅 |
| `ko-banner.png` | PNG (透明) | 600×200 | "K.O.!" 横幅 |
| `win-banner.png` | PNG (透明) | 600×200 | "YOU WIN" 横幅 |
| `cursor-p1.png` | PNG (透明) | 40×40 | P1选择光标 |
| `cursor-p2.png` | PNG (透明) | 40×40 | P2选择光标 |

---

## ✨ 特效资源

| 资源名 | 格式 | 尺寸 | 说明 |
|--------|------|------|------|
| `hadouken.png` | PNG (透明) | 128×64 | 波动拳弹道 |
| `shoryuken.png` | PNG (透明) | 128×256 | 升龙拳特效 |
| `sonic-boom.png` | PNG (透明) | 128×64 | 音速手刀 |
| `electric.png` | PNG (透明) | 128×128 | 电击特效 |
| `hit-spark.png` | PNG (透明) | 64×64 | 命中火花 |
| `block-spark.png` | PNG (透明) | 64×64 | 格挡火花 |
| `ko-flash.png` | PNG (透明) | 全屏 | K.O.闪屏特效 |
| `aura-p1.png` | PNG (透明) | 256×256 | P1气场 |
| `aura-p2.png` | PNG (透明) | 256×256 | P2气场 |

---

## 🔊 音效资源

| 资源名 | 格式 | 说明 |
|--------|------|------|
| `punch.wav` | WAV/MP3 | 拳击音效 |
| `kick.wav` | WAV/MP3 | 踢腿音效 |
| `hit-heavy.wav` | WAV/MP3 | 重击音效 |
| `block.wav` | WAV/MP3 | 格挡音效 |
| `ko.wav` | WAV/MP3 | K.O.音效 |
| `select.wav` | WAV/MP3 | 选人音效 |
| `announce.wav` | WAV/MP3 | 旁白音效 |
| `bgm-title.mp3` | MP3 | 标题BGM |
| `bgm-fight.mp3` | MP3 | 战斗BGM |
| `hadouken.wav` | WAV/MP3 | 波动拳音效 |
| `shoryuken.wav` | WAV/MP3 | 升龙拳音效 |
| `jump.wav` | WAV/MP3 | 跳跃音效 |
| `wind.wav` | WAV/MP3 | 风声/挥空音效 |

---

## 📝 资源生成建议

1. **角色**: 建议使用像素风格 (16×16 或 32×32 像素) 或卡通风格
2. **背景**: 可以用 AI 工具 (Midjourney/DALL-E) 生成格斗游戏场景
3. **特效**: 用粒子系统或帧动画实现
4. **音效**: 可以从免费音效网站下载，如 Freesound.org
5. **UI**: 保持复古格斗游戏风格 (街机感)

---

## 📊 资源统计

| 类型 | 数量 |
|------|------|
| 角色动画 (8个角色 × 10种) | 80 组 |
| 角色头像+图标 | 16 张 |
| 背景 | 5 张 |
| UI元素 | 11 张 |
| 特效 | 9 张 |
| 音效 | 13 个 |
| **总计** | **~134 个资源** |
