# cs_v4 项目记忆

## 项目概述
《方块前线 BlockFront》— 网页 3D FPS 游戏，融合 Minecraft 方块风格 + FPS 射击。
2026-07-21 全量重写过一次（旧版性能/质感差被用户否决）。

## 技术决策
- Three.js r128 (CDN)，纯原生 JS，无构建工具，file:// 直接打开
- **Chunk 合并网格**（js/world.js）：体素世界必须合并 chunk，全图仅 ~25 Mesh
- Canvas 程序化纹理图集 + WebAudio 程序化音效，零外部资源文件
- MC 风格 HUD（快捷栏、像素纹理、Minecraft 按钮样式）

## 核心文件
- js/world.js — chunk mesher、DDA 射线、AABB 碰撞（性能关键）
- js/config.js — 所有平衡性参数（方块硬度/武器伤害/波次配置）
- js/game.js — 主循环、昼夜天空、波次流程

## 注意事项
- 需联网加载 Three.js CDN
- Pointer Lock 需用户点击后锁定
- zsh heredoc 会展开 $(...)，测试脚本用 Write 写文件

