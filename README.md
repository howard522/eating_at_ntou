# eating_at_ntou

這是dev分支的README檔案，請參考以下內容進行本機開發與Git操作。

## 前置作業
1. 安裝相依套件
```bash
# pnpm (推薦)
pnpm install

# pnpm
pnpm install

# yarn
yarn install
```

2. 設定環境變數（範例 .env）
```
MONGO_URI=mongodb://localhost:27017/eating_at_ntou
JWT_SECRET=your_jwt_secret_key
```
組員請將我放在DC的 `.env` 檔案下載到專案根目錄。

## 本機開發
啟動開發伺服器（預設 http://localhost:3000）
```bash
# pnpm (推薦)
pnpm run dev

# 若要指定不同 port
PORT=3001 pnpm run dev
```

建議：同時啟動多個 branch 時，請使用不同 `PORT` 與不同 `MONGO_URI`（避免互相影響資料）。

### 同時在本機跑多個 branch（推薦用 git worktree）
```bash
# 建立另一個工作樹並切到遠端分支
git fetch origin
git worktree add ../eating_at_ntou-feature origin/feature/your-branch

cd ../eating_at_ntou-feature
npm install
PORT=3001 MONGO_URI='mongodb://localhost:27017/eating_test' npm run dev
```

## API 文件（Swagger）
- Swagger JSON: http://localhost:3000/api/swagger.json
- Swagger UI:   http://localhost:3000/api/docs

啟動 dev server 後打開上面網址查看 API 與 Try it out。

## 常用 Git 指令
```bash
# 切換到 dev 分支並更新
git fetch origin
git checkout dev
git pull origin dev

# 從 dev 分支切出功能分支
git checkout -b feature/<memberID>-<short-desc>

# 提交功能分支
git add .
git commit -m "feat: add your feature"
git push origin feature/<memberID>-<short-desc>
# 發 PR 到 dev 分支:
# 請在 GitHub 上操作。

# 如果你的 dev 分支落後了，請先更新 dev 再合併回你的功能分支
git checkout dev
git pull origin dev
git checkout feature/<memberID>-<short-desc>
git merge dev

# 如果你忘記切回功能分支，可以先 stash 你的變更
git stash
git checkout feature/<memberID>-<short-desc>
git stash pop

```

## Git Flow 工作流程 (Branching Strategy)

本專案採用明確的 Git Flow 分支策略，以維持多人協作時的程式碼品質、穩定度與可追蹤性。

| 分支類型                             | 命名   | 功能描述                               |
| -------------------------------- | ---- | ---------------------------------- |
| `main`                           | 固定   | 部署與正式版本所在分支，僅接受從 `dev` 合併          |
| `dev`                            | 固定   | 主開發分支，用於整合所有功能與修正                  |
| `feature/<memberID>-<short-desc>` | 依需建立 | 開發新功能的分支，每個功能獨立開發、測試後再 PR 回 `dev`  |

### 開發流程 (Contributing Steps)

1. 從 `dev` 建立 feature 分支
   `git checkout -b feature/<memberID>-<short-desc>`
2. 開發並提交 Commit（需使用一致 Commit Message 標準）(見下方)
3. 開發完成後推送並建立 PR 回 `dev`
4. 通過 Code Review 後由看過的組員合併 PR 或得到lgtm 後自行合併
5. 不推薦直接 push 至 `main` 或 `dev` 分支

### Commit Message 規範

```
<type>: <short description>
```

常見 type：

* `feat`: 新功能
* `fix`: 修復 bug
* `docs`: 文件變更
* `refactor`: 重構但無功能變動
* `style`: 程式碼格式、排版
* `test`: 測試新增或調整

範例：

```
feat: 新增使用者登入功能 (#42)
fix: 修正地址轉經緯度快取錯誤 (#95)
```

### Pull Request 規範

PR 需包含以下內容：

* 變更摘要
* 心情小故事（選填）

## 專案結構 (Project Structure)

```
.
├── app/                        # 前端應用程式原始碼
│   ├── components/             # Vue 共用元件
│   ├── composable/             # 組合式函數 (Composables)
│   ├── layouts/                # 頁面佈局 (Layouts)
│   ├── pages/                  # 頁面路由 (Pages)
│   ├── plugins/                # 前端插件 (Plugins)
│   ├── types/                  # 前端 TypeScript 型別定義
│   └── utils/                  # 前端工具函數
├── public/                     # 靜態資源 (圖片、音效等)
├── server/                     # 後端 API 與伺服器邏輯
│   ├── api/                    # API 路由處理 (Nitro handlers)
│   ├── middleware/             # 伺服器中間件
│   ├── models/                 # Mongoose 資料庫模型
│   ├── routes/                 # 自定義伺服器路由 (如 WebSocket)
│   └── utils/                  # 後端工具函數與資料庫連線
├── stores/                     # Pinia 狀態管理 (State Management)
├── nuxt.config.ts              # Nuxt 專案設定檔
├── package.json                # 專案依賴與腳本設定
└── tsconfig.json               # TypeScript 設定檔
```
