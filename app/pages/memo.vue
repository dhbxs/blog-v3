<script setup lang="ts">
const appConfig = useAppConfig()
const title = '碎碎念'
const description = '记录生活点滴，一些想法。'
const image = 'https://file.dhbxs.top/2025/10/hoaueqzs.avif'
useSeoMeta({ title, description, ogImage: image })

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])

const pageSize = ref(appConfig.memo.pageSize)
const page = useRouteQuery('page', '1', { transform: Number })

// 监听 page 变化，自动重新获取
const { data: listPaged } = await useAsyncData(
	'memos_posts',
	() => useMemoIndexOptions(page.value, pageSize.value),
	{
		default: () => [],
		watch: [page],
	},
)

const { data: count } = await useAsyncData('memos_count', () => useMemoCount(), { default: () => 0 })
const totalPages = computed(() => Math.ceil((count.value || 0) / pageSize.value))

useSeoMeta({ title: () => (page.value > 1 ? `第${page.value}页` : '') })

// ========== 模块级常量，避免重复编译 ==========
const REGEX_WHITESPACE = /\s+/g
// HTML 转纯文本，截取 200 字
function htmlToText(html: string): string {
	if (!html)
		return ''

	// 创建临时 div 解析 HTML
	const div = document.createElement('div')
	div.innerHTML = html

	// 提取纯文本
	let text = div.textContent || ''

	// 压缩空白
	text = text.replace(REGEX_WHITESPACE, ' ').trim()

	// 截取 200 字
	if (text.length > 200) {
		text = `${text.slice(0, 200)}...`
	}

	return text
}

// 生成引用格式的文本（带 > 前缀）
function getQuotedText(html: string): string {
	const text = htmlToText(html)
	if (!text)
		return ''
	return text.split('\n').map(line => `> ${line}`).join('\n')
}

// 回复评论：把引用内容填入 Artalk
function replyTalk(event: MouseEvent): void {
	// 类型守卫：检查 currentTarget 是否存在
	const btn = event.currentTarget
	if (!btn)
		return

	const memoItem = (btn as HTMLElement).closest('.memo-item')
	if (!memoItem)
		return

	const contentEl = memoItem.querySelector('.memo-content')
	if (!contentEl)
		return

	const html = contentEl.innerHTML
	const quotedText = getQuotedText(html)

	const input = document.querySelector('#artalk .atk-textarea-wrap textarea')
	if (!(input instanceof HTMLTextAreaElement))
		return

	input.value = quotedText
	input.dispatchEvent(new InputEvent('input'))

	const length = input.value.length
	input.setSelectionRange(length, length)
	input.focus()
}
</script>

<template>
<BlogHeader class="mobile-only" to="/" tag="h1" />
<ZPageBanner :title :description :image />
<UtilHydrateSafe>
	<div class="memo-list">
		<div
			v-for="(memo, index) in listPaged" :key="memo.date" class="memo-item"
			:style="{ '--delay': `${index * 0.1}s` }"
		>
			<div class="memo-meta">
				<NuxtImg class="avatar" :src="appConfig.author.avatar" :alt="appConfig.author.name" />
				<div class="info">
					<div class="nick">
						{{ appConfig.author.name }}
						<Icon class="verified" name="i-material-symbols:verified" />
					</div>
					<div class="date">
						{{ memo.date }}
					</div>
				</div>
			</div>

			<div class="memo-content">
				<ContentRenderer :value="memo.body" />
			</div>

			<div class="memo-bottom">
				<div class="tags">
					<span v-for="(tag, idx) in memo.tags" :key="idx" class="tag">
						<Icon name="ph:tag-bold" />
						<span>{{ tag }}</span>
					</span>
					<UtilLink
						v-if="memo.location" v-tip="`搜索: ${memo.location}`" class="location"
						:to="`https://bing.com/maps?q=${encodeURIComponent(memo.location)}`"
					>
						<Icon name="ph:map-pin-bold" />
						<span>{{ memo.location }}</span>
					</UtilLink>
				</div>
				<!-- 关键修改：传入当前 memo 元素 -->
				<button v-tip="'评论'" class="comment-btn" @click="replyTalk($event)">
					<Icon name="ph:chats-bold" />
				</button>
			</div>
		</div>
		<ZPagination v-model="page" sticky :total-pages="totalPages" />
	</div>
	<PostComment />
</UtilHydrateSafe>
</template>

<style lang="scss" scoped>
.memo-list {
	animation: float-in .2s backwards;
	margin: 1rem;

	.memo-item {
		animation: float-in .3s backwards;
		animation-delay: var(--delay);
		border-radius: 8px;
		box-shadow: 0 0 0 1px var(--c-bg-soft);
		display: flex;
		flex-direction: column;
		gap: .5rem;
		margin-bottom: 1rem;
		padding: 1rem;

		.memo-meta {
			align-items: center;
			display: flex;
			gap: 10px;

			.avatar {
				border-radius: 50%;
				box-shadow: 2px 4px 1rem var(--ld-shadow);
				width: 3em;

				@supports (corner-shape: squircle) {
					corner-shape: superellipse(1.2);
				}
			}

			.nick {
				align-items: center;
				display: flex;
				gap: 5px;
				font-family: 'AlimamaFangYuanTi', var(--font-basic);
			}

			.date {
				color: var(--c-text-3);
				font-family: var(--font-monospace);
				font-size: .8rem;
			}

			.verified {
				color: var(--c-primary);
				font-size: 16px;
			}
		}

		.memo-content {
			color: var(--c-text-2);
			display: flex;
			flex-direction: column;
			gap: .5rem;
			line-height: 1.6;

			:deep(figure.image) {
				display: flex;
				flex-direction: column;
				align-items: center;
			}

			:deep(figure.image img) {
				margin: 1em 0;
				max-width: 100%;
			}
		}

		.memo-bottom {
			align-items: center;
			color: var(--c-text-3);
			display: flex;
			justify-content: space-between;

			.tags {
				display: flex;
				font-size: .7rem;
				gap: 4px;
			}

			.tag,
			.location {
				display: flex;
				padding: 2px 4px;
				border-radius: 4px;
				background-color: var(--c-bg-2);
				align-items: center;
				cursor: pointer;
				transition: all .2s;

				&:hover {
					opacity: .8;
				}
			}

			.tag .i-ph\:tag-bold+* {
				margin-left: .15em;
			}

			.location {
				color: var(--c-primary);
			}
		}
	}
}
</style>
