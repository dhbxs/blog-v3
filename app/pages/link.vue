<script setup lang="ts">
import { myFeed } from '~~/blog.config'
import feeds from '~/feeds'

const appConfig = useAppConfig()
const layoutStore = useLayoutStore()
const route = useRoute()
layoutStore.setAside([])

const { data: postLink } = await useAsyncData(
	'/link',
	() => queryCollection('link').path('/link').first(),
)

useSeoMeta({
	title: '友链',
	ogType: 'profile',
	description: `${appConfig.title}的友链页面，收集了添加他为友链的网站和他订阅的网站列表。`,
})

const cleanUrl = appConfig.url.endsWith('/')  ? appConfig.url.slice(0, -1) : appConfig.url

useJsonld(() => ({
   '@context': 'https://schema.org',
   '@type': 'WebPage',
   'name': `${'友链' + ' | ' + appConfig.title}`,
   'description': `${appConfig.title}的友链页面，收集了添加他为友链的网站和他订阅的网站列表。`,
   'author': {
      '@type': 'Person',
      'name': `${appConfig.author.name}`,
   },
   'publisher': {
      '@type': 'Organization',
      'name': `${appConfig.title}`,
      'logo': {
         '@type': 'ImageObject',
         'url': `${appConfig.favicon}`,
      },
   },
   'url': `${new URL(cleanUrl + route.path)}`,
   "isPartOf": {
      "@type": "WebSite",
      "url": `${appConfig.url}`
   }
}))

const copyFields = {
	博主: myFeed.author,
	标题: myFeed.title,
	介绍: myFeed.desc,
	网址: myFeed.link,
	头像: myFeed.avatar,
}
</script>

<template>
<div class="mobile-only">
	<BlogHeader to="/" suffix="友链" tag="h1" />
</div>

<FeedGroup
	v-for="group in feeds"
	:key="group.name"
	v-bind="group"
	:shuffle="appConfig.link.randomInGroup"
/>

<Tab :tabs="['我的博客信息', '申请友链']" center>
	<template #tab1>
		<div class="link-tab">
			<FeedCard v-bind="myFeed" />
			<Copy v-for="(code, prompt) in copyFields" :key="prompt" :prompt :code />
		</div>
	</template>
	<template #tab2>
		<ContentRenderer
			v-if="postLink"
			:value="postLink"
			class="article"
		/>
		<p v-else class="text-center">
			可于 link.md 配置友链补充说明。
		</p>
	</template>
</Tab>

<PostComment />
</template>

<style lang="scss" scoped>
.link-tab {
	margin: 1rem;
}
</style>
