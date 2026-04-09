<script setup lang="ts">
import type { ArticleProps } from '~/types/article'

const route = useRoute()

defineOptions({ inheritAttrs: false })
defineProps<ArticleProps>()

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	title: string
}>({ inheritAttrs: false })

const appConfig = useAppConfig()

const permalink = computed(() => {
	const base = appConfig.url?.endsWith('/') ? appConfig.url.slice(0, -1) : appConfig.url
	const path = route.path.startsWith('/') ? route.path : `/${route.path}`
	return `${base}${path}`
})
</script>

<template>
<div class="post-footer">
	<DefineTemplate v-slot="{ $slots, title }">
		<section>
			<div class="title text-creative">
				{{ title }}
			</div>

			<div class="content">
				<component :is="$slots.default" />
			</div>
		</section>
	</DefineTemplate>

	<ReuseTemplate v-if="references" title="参考链接">
		<ul>
			<li v-for="{ title, link }, i in references" :key="i">
				<ProseA :href="link || ''">
					{{ title ?? link }}
				</ProseA>
			</li>
		</ul>
	</ReuseTemplate>

	<ReuseTemplate :title="meta?.slots?.copyright?.props?.title as string || '许可协议'">
		<ContentRenderer v-if="meta?.slots?.copyright" :value="meta?.slots?.copyright" />
		<p v-else>
			本文采用 
			<ProseA :href="appConfig.copyright.url">
				{{ appConfig.copyright.name }}
			</ProseA>
			许可协议，转载请注明来自
			<Badge :link="appConfig.url" :text="appConfig.title" :img="appConfig.favicon" round />
		</p>
		<div class="line"/>
		<p>
			本文永久链接：<ProseA :href="permalink" class="permalink">
				{{ permalink }}
			</ProseA>
		</p>
	</ReuseTemplate>
</div>
</template>

<style lang="scss" scoped>
.post-footer {
	margin: 2rem 0.5rem;
	border: 1px solid var(--c-border);
	border-radius: 1rem;
	background-color: var(--c-bg-2);

	.line {
		margin: 10px 0;
		border-top: 2px dashed var(--c-border);
	}

	.permalink {
		word-break: break-all;
	}
}

section {
	padding: 1rem;

	& + section {
		border-top: 1px solid var(--c-border);
	}
}

.title {
	font-weight: bold;
	color: var(--c-text);
}

.content {
	margin-top: 0.5em;
	font-size: 0.9rem;

	li {
		margin: 0.5em 0;
	}
}
</style>
