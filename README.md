# Eating at NTOU

> 國立海洋大學校園餐飲外送平台

此分支為 **main**，目前專案仍在開發整合階段。  
完整功能與開發紀錄請參考 [dev 分支](https://github.com/howard522/eating_at_ntou/tree/dev)。

---

## 需求文件(SRD)
- [需求文件(SRD) 連結](https://hackmd.io/@se7/r1XpZyNTge)
- [設計文件(SDD) 連結](https://hackmd.io/Uu6rbeMKRqiTpVWxje312A?view)

---

## 技術

| 類別                    | 使用技術                                                                                                              | 說明                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **前端 (Frontend)**     | **Nuxt 4** · Vue 3 · Pinia · Vuetify · TypeScript                                                                 | 採用 Nuxt 全端框架與 Composition API，結合 Vuetify 建立一致的 UI；以 TypeScript 強化型別安全。 |
| **後端 (Backend)**      | Node.js (Nitro / H3) · RESTful API · JWT (jsonwebtoken) · bcryptjs · Swagger (swagger-jsdoc / swagger-ui-express) | 使用 Nuxt 內建的 H3 伺服器撰寫 API，實作身分驗證、加密與自動生成 API 文件。                        |
| **資料庫 (Database)**    | MongoDB · Mongoose                                                                                                | 定義使用者、餐廳、訂單等資料結構並提供 ODM 操作。                                            |
| **開發流程 (Workflow)**   | TypeScript · pnpm scripts (dev / build / preview) · Git Flow · VS Code (tsconfig / linting)                        | 使用 TypeScript 強化開發流程與錯誤檢查；透過 Git Flow 維護版本一致性。                         |
| **部署規劃 (Deployment)** | vercel                                                                                                             | 採用 Vercel 進行持續整合與部署，確保應用程式穩定運行。                                        |


---

## 開發者說明
```bash
# Clone 專案
git clone https://github.com/howard522/eating_at_ntou.git

# 安裝相依套件
pnpm install

# 啟動開發伺服器
pnpm dev
```