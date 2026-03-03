# SOL Meme 追踪器

分析 Solana 链上 meme 代币的共同持有者和早期买家。

## 功能

1. **共同持有者分析** - 找出同时持有多个代币的钱包地址(前200持有者)
2. **早期买家分析** - 找出多个代币的共同早期买家(前100买家)

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署到 Cloudflare Pages

1. 推送代码到 GitHub
2. 登录 Cloudflare Dashboard
3. Pages → Create a project → Connect to Git
4. 选择仓库,构建设置:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. 部署完成

## 使用说明

1. 选择分析模式(共同持有者/早期买家)
2. 输入2个或多个代币合约地址(每行一个)
3. 点击"开始分析"
4. 等待结果(约30秒内完成)

## 技术栈

- React + Vite
- TailwindCSS
- @solana/web3.js
- Helius RPC

## 注意事项

- 免费 API 有速率限制
- 早期买家分析较慢,请耐心等待
- 数据仅供参考,不构成投资建议
