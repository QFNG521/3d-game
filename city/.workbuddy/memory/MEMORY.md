# 项目长期笔记（3d-game/city）

## 目录概览
- `clang-25d/`、`clang-25d-v2/`：CLANG! 2.5D 复刻；`gun-range/`、`cs-bloodstrike/`：同栈射击类（本地 three.js UMD + 单文件 HTML，file:// 可玩）。
- `cinderwatch/`：上游 kevintngo/cinderwatch 的汉化 fork 工作区（2026-11-26 克隆）。改动未 commit。

## cinderwatch 约定
- 构建：`python3 tools/build.py`（把 `src/*.js` 按文件名排序拼进 `index.html`）。**改了 `src/` 必须重新构建**，直接开 `index.html` 玩。
- 文案：一律写英文再 `T('...')`；翻译表在 `src/01-i18n.js`；改中文后跑 `python3 tools/cjkpix.py <fusion-pixel-12px-proportional-zh_hans.bdf>` + `node tools/check-i18n.js`。
- 字体：Fusion Pixel 12px（OFL），BDF 需从 GitHub release 下载（`/tmp/cjkfont/fusion12/` 是临时目录，可能已被清理）。
- 截图验证：`CHROME=/tmp/cjkfont/chrome-wrap.sh node tools/cdp.js "<hash>" 1440,900 wait:1500 shot:x`（包装脚本加 `--no-sandbox`，同样是临时文件）；手机布局用 `MOBILE=1 DPR=2`，不要用 DPR=3。
- 汉化术语表：beacon=烽火，tower=防御塔，pad=地基，footmen=步兵，flyers=飞行单位，wave=波；五地：灰烬隘口/霜落原/幽沼/烬痕地/暮色台地；标题：余烬守望。
- 汉字字形行宽 12 列，位图必须用 `Uint16Array`（`Uint8Array` 会截掉右侧 4 列）；改字体相关代码后用 canvas 像素检验字形完整性，别只靠看截图。
- HUD 边距统一走 `R.safe`（= `R.pad` 刘海区 + `R.clip` 被宿主裁掉的部分，后者由 IntersectionObserver 维护）；新加 HUD 元素用 `iL/iT/iR/iB` 或 `R.safe`，别直接贴 `W/H`。
