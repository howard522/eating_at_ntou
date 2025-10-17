# eating_at_ntou

輕量 Nuxt + API 專案說明與常用開發指令。

## 前置作業
1. 安裝相依套件
```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

2. 設定環境變數（範例 .env）
```
MONGO_URI=mongodb://localhost:27017/eating_at_ntou
```
組員請將我放在DC的 `.env` 檔案下載到專案根目錄。

## 本機開發
啟動開發伺服器（預設 http://localhost:3000）
```bash
# npm
npm run dev

# 若要指定不同 port
PORT=3001 npm run dev
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

## GitHub 分支規範
- `main`：正式環境分支，在第一版release前不要動它。
- `dev` ：開發整合分支，所有功能開發完成後請先合併到這個分支。
- `feature/xxx`：功能分支，請從 `dev` 分支切出來，完成後合併回 `dev`。

## 常用 Git 指令
```bash
# 切換到 dev 分支並更新
git fetch origin
git checkout dev
git pull origin dev

# 從 dev 分支切出功能分支
git checkout -b feature/your-branch

# 提交功能分支
git add .
git commit -m "feat: add your feature"
git push origin feature/your-branch
# 發 PR 到 dev 分支:
# 請在 GitHub 上操作。
```
