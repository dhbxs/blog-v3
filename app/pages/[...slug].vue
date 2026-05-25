<script setup lang="ts">
const appConfig = useAppConfig()

const route = useRoute()

const layoutStore = useLayoutStore()
layoutStore.setAside(['toc'])

const { data: post } = await useAsyncData(
	`content:${route.path}`,
	() => queryCollection('content').path(route.path).first(),
)

const excerpt = computed(() => post.value?.description || '')

if (post.value) {
	useSeoMeta({
		title: post.value.title,
		ogType: 'article',
		ogImage: post.value.image,
		description: post.value.description,
	})
	layoutStore.setAside(post.value.meta?.aside as WidgetName[] | undefined)

	useJsonld(() => ({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		'mainEntityOfPage': {
			'@type': 'WebPage',
			'@id': `${`${appConfig.url}posts${post.value?.permalink}`}`,
		},
		'headline': `${post.value?.title}`,
		'description': `${post.value?.description}`,
		'datePublished': `${post.value?.date}`,
		'dateModified': `${post.value?.updated}`,
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
		'image': `${post.value?.image ? post.value?.image : appConfig.favicon}`,
		'url': `${`${appConfig.url}/posts/${post.value?.permalink}`}`,
		'articleSection': `${post.value?.categories}`,
	}))
}
else {
	const event = useRequestEvent()
	event && setResponseStatus(event, 404)
	route.meta.title = '404'
	layoutStore.setAside(['blog-log'])
}

if (import.meta.dev) {
	watchEffect(() => {
		layoutStore.setAside(post.value?.meta?.aside as WidgetName[] | undefined)
	})
}
</script>

<template>
<template v-if="post">
	<PostHeader v-bind="post" />
	<PostExcerpt v-if="excerpt" :excerpt />
	<!-- 使用 float-in 动画会导致搜索跳转不准确 -->
	<ContentRenderer
		class="article"
		:class="getPostTypeClassName(post?.type, { prefix: 'md' })"
		:value="post"
		tag="article"
	/>

	<PostFooter v-bind="post" />
	<PostSurround />
	<PostComment />
</template>

<ZError
	v-else
	icon="line-md:document-delete-twotone"
	title="内容为空或页面不存在"
/>
</template>
