# 研究计划：义式手工冰淇淋电商系统功能完善

## 1. 目标
- **检查现有功能完成度**: 全面评估前端和后端代码，确定已实现和未实现的功能。
- **实现核心缺失功能**: 根据需求文档，完成购物车、订单、后台管理等核心模块的开发。
- **完善系统集成**: 确保前后端数据流暢通，并集成第三方服务（7-11 API、Telegram Bot）。
- **准备上线部署**: 更新相关文档，确保系统稳定性和可部署性。

## 2. 研究与开发分解
### 第一阶段：现状分析与环境准备
- **任务1.1: 后端代码审查**
  - 分析 `gelato-backend` 项目结构，特别是 `src/routes` 和 `src/app.js`，了解现有API路由和中间件。
  - 检查 `database/gelato.db` 的表结构，确认与功能需求的匹配度。
- **任务1.2: 前端代码审查**
  - 分析 `gelato-ecommerce` 项目结构，重点审查 `src/pages`、`src/components` 和 `src/services/api.ts`。
  - 评估现有组件（如购物车、产品列表）的可复用性和待完善之处。
- **任务1.3: 关键文件识别**
  - 列出为实现新功能需要修改或创建的核心文件清单。

### 第二阶段：后端功能强化 (Node.js + Express)
- **任务2.1: 购物车与订单API**
  - `orders.js`: 创建 `POST /api/orders/checkout` 路由，整合验证码验证、库存检查、订单生成逻辑。
  - `captcha.js` (新): 开发 `GET /api/captcha` 路由，用于生成和验证图形验证码。
- **任务2.2: 7-11 物流与金流集成 (模拟)**
  - `shipping.js` (新): 创建模拟的 `POST /api/shipping/711` 路由，用于处理7-11取货付款流程。
- **任务2.3: Telegram Bot 通知**
  - `telegram.js`: 完善 `POST /api/telegram/notify`，用于在生成新订单时发送通知。需要集成 `node-telegram-bot-api`。
- **任务2.4: 后台管理API**
  - `orders.js`: 增强 `GET /api/orders`，添加筛选、排序和分页功能。实现 `POST /api/orders/export` 路由，用于导出XLS格式的订单报表 (使用 `xlsx` 库)。
  - `products.js`: 完善产品相关的CRUD操作，特别是使用 `multer` 实现图片上传和库存管理。
  - `announcements.js`: 实现公告的CRUD API。
  - `stats.js`: 创建 `GET /api/stats/dashboard`，为后台提供数据分析图表所需的数据。

### 第三阶段：前端功能完善 (React + TypeScript)
- **任务3.1: 购物车与结账流程**
  - `ShoppingCart.tsx`: 添加验证码输入框和刷新按钮。
  - `CheckoutPage.tsx`: 集成7-11取货付款的UI流程，并在提交订单时调用后端API。
- **任务3.2: 客户订单页面**
  - `CustomerPage.tsx`: 开发订单历史记录查看功能。
- **任务3.3: 后台管理界面**
  - `OrderManagement.tsx`: 实现订单列表的多选功能，并添加“导出XLS”按钮。
  - `ProductManagement.tsx`: 添加产品图片上传界面和库存编辑字段。
  - `AnnouncementManagement.tsx`: 创建完整的公告编辑和发布界面。
  - `DashboardOverview.tsx`: 使用 `recharts` 或 `chart.js` 添加数据分析图表，可视化销售数据。

### 第四阶段：系统集成与测试
- **任务4.1: 端到端测试**
  - 模拟用户从浏览商品、加入购物车、结账到生成订单的完整流程。
  - 测试管理员从登录、管理商品、处理订单到查看统计的完整流程。
- **任务4.2: 文档更新**
  - 更新 `docs/user_manual.md` 和 `docs/deployment.md`，反映新增功能和部署变更。

## 3. 关键问题
1. **7-11 API**: 由于没有真实的API文档，将创建一个模拟API来实现其功能。重点是模拟请求和响应的数据结构。
2. **验证码实现**: 初步计划使用 `svg-captcha` 库在后端生成验证码，因为它易于集成且不依赖外部服务。
3. **图表数据**: 确定后台仪表盘需要展示哪些核心指标，例如：每日销售额、热门产品排行、订单状态分布等。

## 4. 资源策略
- **主要数据源**: 现有代码库 (`gelato-ecommerce` 和 `gelato-backend`)。
- **技术选型**:
  - **后端**: `express`, `sqlite3`, `multer` (文件上传), `xlsx` (Excel导出), `svg-captcha` (验证码), `node-telegram-bot-api` (Telegram)。
  - **前端**: `react`, `typescript`, `tailwindcss`, `axios` (API请求), `recharts` (图表)。

## 5. 验证计划
- **代码审查**: 遵循现有代码风格和规范。
- **功能测试**: 每个功能开发完成后，在本地环境进行完整的单元测试和集成测试。
- **用户验收**: 模拟最终用户和管理员的操作路径，确保流程顺畅。

## 6. 预期交付成果
- 一个功能完善、集成完毕的电商系统。
- 包含新增功能说明的最终用户手册。
- 更新后的部署文档。
- 总结开发过程和成果的最终报告。

## 7. 工作流选择
- **主要焦点**: 开发与实现 (Search-Focused)。
- **理由**: 项目的核心是基于现有框架进行新功能的开发和集成，这要求我们深入研究代码库，并根据需求进行迭代开发。
