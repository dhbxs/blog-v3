/**
 * 生成说说Memo查询参数，完全包装 useAsyncData 会使 SSR 行为异常，缓存 key 需要暴露
 * @see https://nuxt.com/docs/4.x/api/composables/use-async-data#usage
 * @see https://github.com/nuxt/nuxt/issues/14736
 * @todo 支持分页/分类筛选
 */
export function useMemoIndexOptions(page: number, pageSize: number) {
	const skipCount = (page - 1) * pageSize
	return queryCollection('memos')
		.where('stem', 'LIKE', 'memos/%')
		.select('categories', 'date', 'tags', 'title', 'location', 'body')
		.order('date', 'DESC')
		.skip(skipCount)
		.limit(pageSize)
		.all()
}

export async function useMemoCount(path = 'memos/%') {
	return await queryCollection('memos')
		.where('stem', 'LIKE', path)
		.count()
}
