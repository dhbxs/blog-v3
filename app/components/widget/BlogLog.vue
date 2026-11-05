<script setup lang="ts">
const { timeEstablished } = useAppConfig()

const blogLog = [
	{ label: '2026-11-05', value: '没想到升级了Artalk后端后前端没有同步更新，导致评论不能用了，现已修复，Artalk又带来了一些Breaking Change ￣Д￣'},
	{ label: '2026-04-16', value: '正式切换到Nuxt4 + Nuxt Content v3博客' },
	{ label: '2026-04-05', value: '准备从Halo切换到由Nuxt4 + Nuxt Content v3开发的博客系统' },
	{ label: timeEstablished, value: '发布第一篇文章' },
]
</script>

<template>
<BlogWidget card title="更新日志">
	<ZDlGroup size="large" :items="blogLog" />
</BlogWidget>
</template>
