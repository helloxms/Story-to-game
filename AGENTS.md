# Story-to-Game

从小说/剧本生成可玩的分支文游 JSON，并用单文件 HTML 启动器运行。没有 npm、bundler、测试框架或后端。

## 仓库地图

| 文件 | 作用 |
| --- | --- |
| `剧情游戏启动器_开发者调试版.html` | 启动器本体：CSS + DOM + vanilla JS，用浏览器直接打开 |
| `JSON剧本规则文档.md` | **当前启动器的 JSON 规范**（写作/改格式以它为准） |
| `测试案例-成人日.json` | 完整示例剧本 |
| `story-to-game.skill` | AI 改编技能包（zip）。内含 `SKILL.md`、`references/`、`scripts/validate.py` |
| `README.md` | 产品说明；其中的目录树是旧包装，仓库里没有解压后的 `story-to-game/`，也没有 `剧情游戏启动器.html` |

## 运行与校验

- 局域网服务：在仓库根目录运行 `npm start` 或 `start.bat`（`server.js` 监听 `0.0.0.0:8765`）。本机用 `http://127.0.0.1:8765/`，同一网络设备用终端打印的局域网地址。
- 也可直接用 Chrome / Edge 打开 HTML。插入 JSON，或点「示例作品」「示例作品2」。局域网访问必须走 `server.js`。
- 开发者调试：右下角 `DEV`。可跳节点、改 `val`/flags/variables、测结局和条件路由。
- 完整校验：先解压技能包，再跑

```bash
python story-to-game/scripts/validate.py 测试案例-成人日.json
```

启动器导入时的校验更弱，只查断链、死路、不可达节点、结局缺 `closing`、缺 `scene`。`validate.py` 才是 13+ 项完整检查。致命错误必须修。

PowerShell 解压技能包：

```powershell
Expand-Archive -Path story-to-game.skill -DestinationPath .
```

`.skill` 是 zip（文件头 `PK`）。改技能时改包内文件后重新打包，不要只改一份过期副本。

## 改编故事时

用户要把小说/剧本/大纲改成文游时，先读解压后的 `story-to-game/SKILL.md`，并按需查阅 `references/`。不要只凭本文件或 README 直接出 JSON。

- 标准流程九步，规划文档必须内部生成，不能跳过。
- 确认点 A 只展示方向，禁止剧透到达条件、flag、隐藏结局、角色弧光。
- 原作 < 500 字，或用户说 `--quick` / `快速` / `直接出`：走快速模式，第一条回复就落盘 JSON。
- 最高原则：选择从场景自然长出；后果被世界承接；结局用判词收束。
- 用户未指定路径时，JSON 写到仓库根目录。

## JSON 铁律

- 顶层：`meta`、`startNodeId`、`nodes`。可选 `variables`、`achievements`。不要写 `subtitle`。
- 新剧本用 `ambient`，不要写 `theme`。启动器界面只有浅色/深色，`applyTheme()` 会强制 `neutral`；旧稿的 `theme` 只当氛围关键词兼容。
- `val` 是 0–100 的体验调节器，不要做成「低 val 直接坏结局」。结局用 flag / 路径组合；`routes` 必须有 `default`。
- 结局节点：`isEnding: true`、`title`、`description`、`closing`。非 `RASH ENDING` / `BAD ENDING` 禁止从选项直跳结局，前面必须有收束节点。
- 多个选项指向同一 `next` 时，每个选项要有独立 callback 节点（不同 `segments`），不能只改 `changes`。
- 成就数应多于结局数。`chapterTitle` 只标真正的章节入口。节点 ID 用英文、数字、下划线。正文不要写 HTML。
- 技能包里的 `references/json-format-spec.md` 仍写 `theme`，与启动器现状不一致；格式冲突以仓库根目录的 `JSON剧本规则文档.md` 为准。

## 改启动器时

- 保持单文件、无依赖、`"use strict"`。不要引入框架或拆成多文件构建。
- 界面文案用中文。不要删作品信息里的 `Powered By: @山音`。
- 运行时状态在 `state`。每部作品的存档键是 `branch_story_${slug(title)}`。剧本缓存走 IndexedDB（`branch_story_cache_db` / `stories`），旧的 `localStorage.branch_story_cache` 会迁移。
- 资料库依赖 File System Access API，非 Chromium 浏览器只能「插入 JSON」。
- 改完后用浏览器打开启动器，导入 `测试案例-成人日.json`，至少走：插入 → 开始/继续 → 选项 → 回退 → 存档 → 结局 → DEV 跳转。再点一次「示例作品」，确认内置样例没坏。
- 样例剧本是 HTML 里的 `SAMPLE_STORY`。改规范时同步更新它和 `JSON剧本规则文档.md`。

## 常见坑

- README / 技能包规范 / 根目录规范三者会打架：以启动器实际行为和 `JSON剧本规则文档.md` 为准。
- `set` 是直接赋值，不做加减。数值增减用 `val` / `valSet`。
- `scene.id` 相同才不重复播转场；`type: "transient"`（以及 `passing` / `brief` / `minor`）不播大场景卡。
- 存档、成就、结局记录在浏览器本地；清缓存会丢。
