import type { FeedEntry } from './app/types/feed'

const basicConfig = {
	title: '灯火不休时',
	subtitle: '在代码里种诗',
	// 长 description 利好于 SEO
	description: '灯火不休时(dhbxs)的博客站点，记录前端与后端开发的技术笔记、实战经验与学习心得，分享编程日常与个人思考。一名开发者的技术成长之路，持续更新Web开发、代码优化与生活随笔。',
	author: {
		name: 'dhbxs',
		avatar: 'https://file.dhbxs.top/ylvwvjjs.jpg',
		email: 'yao@mail.dhbxs.top',
		homepage: 'https://blog.dhbxs.top/',
	},
	copyright: {
		abbr: 'CC BY-NC-ND 4.0',
		name: '署名—非商业性使用—禁止演绎 4.0 协议国际版',
		url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-hans',
	},
	favicon: 'https://file.dhbxs.top/2026/01/nllahmfi.png',
	language: 'zh-CN',
	timeEstablished: '2018-01-01',
	timeZone: 'Asia/Shanghai',
	url: 'https://blog.dhbxs.eu.org/',
	defaultCategory: '未分类',
}

// 存储 nuxt.config 和 app.config 共用的配置
// 此处为启动时需要的配置，启动后可变配置位于 app/app.config.ts
// @keep-sorted
const blogConfig = {
	...basicConfig,

	article: {
		categories: {
			[basicConfig.defaultCategory]: { icon: 'ph:folder-dotted-bold' },
			/** 实践可复用操作经验：工具/系统/部署/排障 */
			技术: { icon: 'ph:mouse-bold', color: '#33aaff' },
			/** 编程：代码实现/工程实践/开发方法 */
			开发: { icon: 'ph:code-bold', color: '#7777ff' },
			/** 安全：漏洞/CTF/恶意软件/安全事件分析 */
			安全: { icon: 'ph:bug-beetle-bold', color: '#ff7733' },
			/** 思考：观点讨论/复盘反思/行业或产品观察 */
			杂谈: { icon: 'ph:chat-bold', color: '#33bbaa' },
			/** 记录叙事：个人经历/校园家庭/日常片段 */
			生活: { icon: 'ph:shooting-star-bold', color: '#ff7777' },
		},
		defaultCategoryIcon: 'ph:folder-bold',
		/** 文章版式，首个为默认版式 */
		types: {
			tech: {},
			story: {},
		},
		/** 分类排序方式，键为排序字段，值为显示名称 */
		order: {
			date: '创建日期',
			updated: '更新日期',
			// title: '标题',
		},
		/** 使用 pnpm new 新建文章时自动生成自定义链接（permalink/abbrlink） */
		useRandomPremalink: true,
		/** 隐藏基于文件路由（不是自定义链接）的 URL /post 路径前缀 */
		hidePostPrefix: true,
		/** 禁止搜索引擎收录的路径 */
		robotsNotIndex: ['/preview', '/previews/*'],
	},

	/** 博客 Atom 订阅源 */
	feed: {
		/** 订阅源最大文章数量 */
		limit: 50,
		/** 订阅源是否启用XSLT样式 */
		enableStyle: true,
	},

	/** 向 <head> 中添加脚本 */
	scripts: [
		// 自己部署的 Umami 统计服务
		{ 'src': 'https://analysis.dhbxs.top/script.js', 'data-website-id': 'a01d90ff-913c-4d8b-bed9-b5c0f5e910df', 'defer': true },
		// 自己网站的 Cloudflare Insights 统计服务
		// { 'src': 'https://static.cloudflareinsights.com/beacon.min.js', 'data-cf-beacon': '{"token": "97a4fe32ed8240ac8284e9bffaf03962"}', 'defer': true },
		// Twikoo 评论系统
		{ src: '/assets/twikoo/twikoo-1.7.7.min.js', defer: true },
	],

	/** 自己部署的 Twikoo 服务 */
	twikoo: {
		envId: 'https://twikoo.dhbxs.top/',
		preload: 'https://twikoo.dhbxs.top/',
	},
}

/** 用于生成 OPML 和友链页面配置 */
export const myFeed: FeedEntry = {
	author: blogConfig.author.name,
	sitenick: 'dhbxs',
	title: blogConfig.title,
	desc: blogConfig.subtitle || blogConfig.description,
	link: blogConfig.url,
	feed: new URL('/atom.xml', blogConfig.url).toString(),
	icon: blogConfig.favicon,
	avatar: blogConfig.author.avatar,
	archs: ['Nuxt', 'Vercel'],
	date: blogConfig.timeEstablished,
	comment: '这是我自己',
}

export default blogConfig
