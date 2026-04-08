<script setup lang="tsx">
import type { TippyComponent } from 'vue-tippy'
import Artalk from 'artalk'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'artalk/Artalk.css'

const appConfig = useAppConfig()
const colorMode = useColorMode()
const route = useRoute()

const el = ref<HTMLElement>()
const commentEl = useTemplateRef('comment')
const popoverEl = useTemplateRef<TippyComponent>('popover')
const popoverJumpTo = ref('')
const popoverInputEl = useTemplateRef('popover-input')
const showUndo = ref(false)

const popoverBind = ref<TippyComponent['$props']>({})

const showArtalk = ref(appConfig.artalk?.enable)
let artalk: Artalk
const loaded = ref(false)

/** 评论区链接守卫 */
useEventListener(commentEl, 'click', (e) => {
	if (!(e.target instanceof Element))
		return

	if (e.target.matches('.tk-avatar-img'))
		e.stopPropagation()

	const popoverTarget = e.target.closest('a[target="_blank"]')
	if (!(popoverTarget instanceof HTMLAnchorElement))
		return

	e.preventDefault()
	popoverEl.value?.hide()

	popoverJumpTo.value = safelyDecodeUriComponent(popoverTarget.href)
	popoverBind.value = {
		getReferenceClientRect: () => popoverTarget.getBoundingClientRect(),
		triggerTarget: popoverTarget,
	}

	nextTick(checkUndoable)
	popoverEl.value?.show()
}, { capture: true })

function checkUndoable() {
	showUndo.value = popoverInputEl.value?.textContent !== popoverJumpTo.value
}

function undo() {
	if (!popoverInputEl.value)
		return
	popoverInputEl.value.textContent = popoverJumpTo.value
	checkUndoable()
}

function confirmOpen() {
	window.open(popoverInputEl.value?.textContent, '_blank')
}

onMounted(() => {
	if (showArtalk.value) {
		artalk = Artalk.init({
			el: el.value, // 挂载的 DOM 元素
			pageKey: route.path, // 固定链接
			pageTitle: document.title, // 页面标题
			server: appConfig.artalk?.server, // 后端地址
			site: appConfig.title, // 站点名
			darkMode: colorMode.preference === 'dark',
		})
		artalk.on('mounted', () => {
			loaded.value = true
		})
		artalk.on('list-failed', () => {
			console.error('评论加载错误')
			showArtalk.value = false
		})
	}
})

// 更新Artalk的页面信息（路径和标题）
watch(
	() => route.path,
	(path) => {
		nextTick(() => {
			artalk?.update({
				pageKey: path,
				pageTitle: document.title,
			})
			artalk?.reload()
		})
	},
)

// 更新 Artalk 的颜色模式
watch(
	() => colorMode.preference,
	(preference) => {
		artalk?.setDarkMode(preference === 'dark')
	},
)

onBeforeUnmount(() => {
	artalk?.destroy()
	artalk = null as any
})
</script>

<template>
<section v-if="showArtalk" ref="comment" class="z-comment">
	<h3 class="text-creative">
		评论区
	</h3>

	<!-- interactive 默认会把气泡移动到 triggerTarget 的父元素上 -->
	<Tooltip
		ref="popover"
		v-bind="popoverBind"
		:append-to="() => commentEl!"
		interactive
		:aria="{ expanded: false }"
		trigger="focusin"
	>
		<template #content>
			<div class="popover-confirm">
				<span
					ref="popover-input"
					class="input"
					contenteditable="plaintext-only"
					spellcheck="false"
					@input="checkUndoable"
					@keydown.enter.prevent="confirmOpen"
					v-text="popoverJumpTo"
				/>

				<button
					v-if="showUndo"
					aria-label="恢复原始内容"
					@click="undo()"
				>
					<Icon name="ph:arrow-u-up-left-bold" />
				</button>

				<ZButton
					primary
					text="访问"
					@click="confirmOpen"
				/>
			</div>
		</template>
	</Tooltip>

	<div id="artalk" ref="el" :class="{ 'fade-in': loaded }" class="artalk">
		<p>评论加载中...</p>
	</div>
</section>
</template>

<style lang="scss" scoped>
.z-comment {
	margin: 3rem 1rem;

	> h3 {
		margin-top: 3rem;
		font-size: 1.25rem;
	}
}

:deep() > [data-tippy-root] > .tippy-box {
	padding: 0;
}

.popover-confirm {
	display: flex;
	align-items: center;
	overflow-wrap: anywhere;

	> .input {
		min-width: 0;
		padding: 0.3em 0.6em;
		outline: none;
	}

	> button {
		flex-shrink: 0;
		align-self: stretch;
		padding: 0.3em;
		border-radius: 0 0.5em 0.5em 0;
	}
}

:deep(#artalk) {
	margin: 2em 0;
	font-family: var(--font-creative);
	transition: opacity 0.5s ease;
	opacity: 0;

	&.fade-in {
		opacity: 1;
	}

	.atk-main-editor {
		border-radius: 0.8rem;

		.atk-editor-user-wrap .atk-editor-user .atk-user-btn,
		> .atk-bottom .atk-plug-btn-wrap .atk-plug-btn {
			border-radius: 0.8rem;
		}

		> .atk-bottom {
			.atk-send-btn {
				border-radius: 0.8rem;
				line-height: 30px;
			}

			> .atk-bottom-left > .atk-state-wrap {
				border-radius: .8rem;
				overflow: hidden;
			}
		}
	}

	.atk-list > .atk-list-header .atk-dropdown-wrap .atk-dropdown {
		border-radius: 0.8rem;
	}

	.atk-comment {
		> .atk-avatar img {
			corner-shape: superellipse(1.2);
			border-radius: 50%;
		}

		.atk-main .atk-header .atk-nick {
			font-family: 'AlimamaFangYuanTi', var(--font-basic);
		}
	}
}
</style>
