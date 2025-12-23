# Bing2Go

> 國立海洋大學校園餐飲外送平台  
> NTOU Bing2Go

本專案為國立臺灣海洋大學校園餐飲外送系統，提供校內使用者進行餐廳瀏覽、下單、訂單追蹤與外送互動等功能。

此分支為 **main**，對應 **Release Version 1.0（Iteration 2）**，  
為目前功能穩定、可展示與驗收之版本。

若需查看最新開發中功能與詳細 commit 紀錄，請參考  
[dev 分支](https://github.com/howard522/eating_at_ntou/tree/dev)

---

## 專案文件（Project Documents）

- **需求文件（SRD）**  
  https://hackmd.io/@se7/r1XpZyNTge

- **系統設計文件（SDD）**  
  https://hackmd.io/Uu6rbeMKRqiTpVWxje312A

- **測試文件 (STD)）**  
  [https://hackmd.io/Uu6rbeMKRqiTpVWxje312A](https://hackmd.io/Uu6rbeMKRqiTpVWxje312A)
  
---

## 系統功能概述

目前系統已支援以下核心功能：

- 使用者註冊、登入與身分驗證（JWT）
- 餐廳與菜單瀏覽、搜尋與距離篩選
- 購物車管理（新增、修改、清空、金額自動計算）
- 訂單建立與購物車鎖定機制
- 訂單狀態流轉與外送員指派
- 使用者 / 外送員訂單查詢權限控管
- 訂單聊天室即時訊息功能
- 餐廳評論發表與查詢
- 廣告內容管理與隨機顯示

本版本可完整展示系統主要操作流程，作為專案展示與功能驗收基準。

---

## 技術架構（Tech Stack）

| 類別 | 使用技術 | 說明 |
| --- | --- | --- |
| **前端 (Frontend)** | **Nuxt 4** · Vue 3 · Pinia · Vuetify · TypeScript | 採用 Nuxt 全端框架與 Composition API，搭配 Vuetify 建立一致的 UI；使用 TypeScript 強化型別安全。 |
| **後端 (Backend)** | Node.js (Nitro / H3) · RESTful API · JWT · bcryptjs · Swagger | 使用 Nuxt 內建 H3 Server 實作 REST API，支援身分驗證、權限控管與 API 文件自動生成。 |
| **資料庫 (Database)** | MongoDB · Mongoose | 定義使用者、餐廳、訂單等資料模型，並透過 ODM 操作資料。 |
| **開發流程 (Workflow)** | TypeScript · pnpm · Git Flow | 採用 Git Flow 管理分支，並以 pnpm 進行套件與腳本管理。 |

---

## 部署狀態（Deployment）

本系統採用 **全站式 Nuxt 應用部署架構**，前後端整合於單一部署環境，  
部署設計與實作內容皆以 SDD 為準。

### 部署說明

- 系統以 **Nuxt 4 (Nitro)** 建構為單一 Web Application，同時包含前端頁面與 RESTful API。
- 採用 **ZEABUR 平台** 作為主要雲端部署環境，支援 SSR 與 Serverless API。
- 所有 API 端點統一配置於 `/api/**`，由 **Nitro Serverless Functions** 處理。
- API 透過 **JWT（JSON Web Token）** 進行身分驗證與權限控管。
- 資料庫採用雲端託管之 **MongoDB（MongoDB Atlas）**，提供可擴展的資料存取能力。
- 系統需存取第三方服務（如 Nominatim 地理編碼 API）時，皆由 Serverless API 端發起請求。
- 額外配置開發者私有 **Ubuntu Docker 主機** 作為備援與測試環境，以確保部署一致性與維運彈性。

---

## 開發與執行方式
 #### Clone 專案
`git clone https://github.com/howard522/eating_at_ntou.git`

 #### 進入專案目錄
`cd eating_at_ntou`

 #### 安裝相依套件
`pnpm install`

 #### 啟動開發伺服器
`pnpm dev`

--- 

## 流程品質與系統品質提升措施說明

本專案於開發與部署過程中，透過自動化流程與安全機制，提升整體系統品質與開發流程穩定度，說明如下。

---

### 一、流程品質提升措施（Process Quality Improvement）

#### 1. GitHub Actions 自動化流程

本專案導入 **GitHub Actions** 作為 CI/CD 與專案流程輔助工具，降低人工操作錯誤並提升團隊協作效率。

**（1）Commit / Push 即時通知（Discord）**

* 當開發者進行 commit 或 push 至指定分支時，GitHub Actions 會自動觸發。
* 系統會透過 Webhook 將事件推送至 Discord 頻道，通知團隊成員。
* 可即時掌握程式碼變動狀況，提升團隊溝通效率。

 **改善成效**：
避免未同步開發狀態造成的衝突，提升開發透明度。



**（2）部署備援節點自動化流程**

* 當程式碼更新時，GitHub Actions 會自動將專案同步至備援部署節點。
* 備援節點採用 Ubuntu + Docker 環境，與正式部署環境保持一致。
* 作為測試、維運或主要平台異常時的替代方案。

 **改善成效**：
提升系統穩定性與可維護性，降低單點故障風險。



**（3）下游 Repository 自動同步與雲端部署**

* 專案採用 **上游 / 下游 Repository 架構**。
* GitHub Actions 會定期將 upstream（主要開發 Repo）同步至 downstream Repo。
* **Zeabur 平台** 監聽 downstream Repo 的變動，並自動觸發重新部署。

 **改善成效**：

* 確保部署版本與開發版本一致
* 實現無人工介入的自動部署流程
* 減少人為操作導致部署失誤

---

### 二、系統品質提升措施（System Quality Improvement）

#### 1. JWT 身分驗證與權限控管機制

本系統全面導入 **JWT（JSON Web Token）** 作為身分驗證與授權機制。

* 使用者登入後取得 JWT Token
* API 存取需攜帶有效 Token
* 系統依據使用者角色（顧客 / 外送員 / 管理員）進行權限控管
* Token 驗證失敗時回傳適當錯誤碼（401 / 403）

 **改善成效**：

* 防止未授權存取敏感 API
* 提升整體系統安全性
* 明確區分不同角色可操作之功能



#### 2. 系統穩定性與安全性設計

* 所有密碼皆經由雜湊（bcrypt）後儲存，避免明文外洩風險
* REST API 統一由 Serverless Functions 處理，降低攻擊面
* 第三方 API 呼叫集中於後端，避免金鑰暴露於前端

 **改善成效**：
提升資料安全性，降低潛在資安風險。

---

### 三、整體成效說明

透過上述流程與系統品質提升措施，本專案已具備：

* 自動化開發與部署流程
* 明確的版本控管與回溯能力
* 基本且完整的安全驗證機制
* 可維護、可擴展的系統架構

作為 Iteration 2（Release 1.0）版本，已達可穩定展示與功能驗收之品質水準。
