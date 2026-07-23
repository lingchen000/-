# 陵辰 · 怪异记录簿

一个零依赖、可直接部署的个人记录站。视觉采用高对比的章节式排版、斜切色块与独白感文案，站名与作者统一为“陵辰”，不公开邮箱和所在城市。

## 本地查看

直接双击根目录的 `index.html` 即可浏览。也可以在本目录启动任意静态文件服务器后访问首页。

## 设计与功能

- 章节式首页：非对称卡片、高对比色块与人物场景构图
- 数字时钟、自动月历和分时段问候
- 随机独白、音乐播放动效、本地点赞和明暗模式
- GitHub Discussions 驱动的全站评论与反应收藏，不改变原页面网格
- 全站“陵辰”研究 Agent：由 Cloudflare Worker 安全代理 DeepSeek API，支持研究计划、跨来源核验、页面上下文问答、本地聊天记录、带来源引用的中文网页搜索，以及公开 GitHub 仓库、目录、文件和 Issue/PR 检索
- 空片段档案、人物侧写与只读日常记录
- 公开日志采用只读模式，发布权限由 GitHub 仓库账号控制
- 桌面、平板和手机三档响应式布局
- 米白、纯黑、朱红与硬边几何组成的动画分镜式主题
- 本地原生播放器：茶理理《星愿 off vocal》
- RSS、站点地图、robots.txt 与 404 页面

## 内容说明

当前没有公开文章，公开档案、RSS 和站点地图中的旧文章记录均已清空。公开站点不提供写入接口，文章与日志仅由仓库所有者提交后通过 GitHub Pages 发布。

访客评论与收藏由 giscus 写入本仓库的 GitHub Discussions；这不会赋予访客修改或发布网站文章的权限。

## 发布

整个 `lingchen-blog` 文件夹可以直接部署到 GitHub Pages、Cloudflare Pages、Netlify 或 Vercel，不需要构建命令。当前公开地址为 `https://lingchen000.github.io/-/`。

智能体后端位于 `worker/`，DeepSeek 密钥仅作为 Cloudflare Secret `DEEPSEEK_API_KEY` 保存，不得写入仓库或前端代码。网页搜索使用 Tavily Search API，密钥必须仅配置为 Cloudflare Secret `TAVILY_API_KEY`；搜索结果会限制数量和体积，过滤非 HTTP(S) 链接，并要求回答标注来源。GitHub 检索默认只访问公开资源；如将来需要私有仓库，应另外配置最小只读权限的 `GITHUB_TOKEN` Secret。
