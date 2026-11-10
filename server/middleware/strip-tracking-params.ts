import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

const trackingParams = ['source', 'from'] as const

export default defineEventHandler((event) => {
	const url = getRequestURL(event)
	if (!url.pathname.startsWith('/posts/'))
		return

	let hasTrackingParam = false

	for (const param of trackingParams) {
		if (url.searchParams.has(param)) {
			url.searchParams.delete(param)
			hasTrackingParam = true
		}
	}

	if (hasTrackingParam)
		return sendRedirect(event, `${url.pathname}${url.search}`, 301)
})
