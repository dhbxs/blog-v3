import type { FeedGroup } from '../app/types/feed'
// 友链检测 CLI 需要使用显式导入和相对路径
/**
	import { myFeed } from '../blog.config'
	eslint-disable-next-line unused-imports/no-unused-imports
	import { getFavicon, getGithubAvatar, getGithubIcon, getOciqGroupAvatar, getOicqAvatar, OicqAvatarSize } from './utils/img'
 */
export default [
	{
		name: '向开发者致敬',
		desc: 'Clarity 博客主题开发者。',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			{
				author: '纸鹿本鹿',
				sitenick: '纸鹿摸鱼处',
				title: '纸鹿摸鱼处',
				desc: '纸鹿至麓不知路，支炉制露不止漉',
				link: 'https://blog.zhilu.site/',
				feed: 'https://blog.zhilu.site/atom.xml',
				icon: 'https://www.zhilu.site/api/avatar.png',
				avatar: 'https://www.zhilu.site/api/avatar.png',
				archs: ['Nuxt', 'Vercel'],
				date: '2023-12-23',
				comment: '主题开发者',
			},
		],
	},
	// #endregion
	// #region 网上邻居 since 2024
	{
		name: '网上邻居',
		desc: '哔——啵——电波通讯中，欢迎常来串门。',
		// @keep-sorted { "keys": ["date"] },
		entries: [
			{
				author: '张洪Heo',
				desc: '分享设计与科技生活',
				link: 'https://blog.zhheo.com/',
				feed: 'https://blog.zhheo.com/atom.xml',
				icon: 'https://blog.zhheo.com/img/favicon4.0.webp',
				avatar: 'https://blog.zhheo.com/img/favicon4.0.webp',
				archs: ['Hexo', '国内 CDN'],
				date: '2024-02-02',
				comment: '知名博主，其博客设计风格被众多人借鉴。',
			},
		],
	},
	// #endregion
] satisfies FeedGroup[]
