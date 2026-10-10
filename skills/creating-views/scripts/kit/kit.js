// @ts-nocheck: this file is injected as raw text into sandboxed view documents, never imported.
/* Amp view kit: window.ui. Icons, a segmented control, number tweening, and charts that follow the
   creating-views guide (gray context, direct labels, light gridlines, crosshair tooltips). */
;(() => {
	const ICONS = '__AMP_VIEW_ICONS__'
	const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
	const easeOut = (t) => 1 - (1 - t) ** 3
	const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
	const esc = (s) =>
		String(s).replace(
			/[&<>"]/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
		)

	function icon(name, className = '') {
		const kind = name.startsWith('logo-') ? 'ui-logo' : 'ui-icon'
		return `<svg class="${kind} ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`
	}

	function format(value, options = {}) {
		const { digits, compact, unit = '', prefix = '', percent } = options
		if (percent) return `${prefix}${(value * 100).toFixed(digits ?? 0)}%`
		if (compact && Math.abs(value) >= 1000) {
			const [d, s] = Math.abs(value) >= 1e6 ? [1e6, 'M'] : [1e3, 'k']
			const n = value / d
			return `${prefix}${n.toFixed(digits ?? (Math.abs(n) < 10 ? 1 : 0)).replace(/\.0$/, '')}${s}${unit}`
		}
		const text = value.toLocaleString('en-US', {
			maximumFractionDigits: digits ?? 0,
			minimumFractionDigits: digits ?? 0,
		})
		return `${prefix}${text.replace('-', '−')}${unit}`
	}

	// Animates a number in an element's text, for readouts that follow a control.
	const tweens = new WeakMap()
	function tween(el, to, options = {}) {
		const fmt = options.format ?? ((v) => format(v, options))
		const from = tweens.get(el)?.value ?? to
		cancelAnimationFrame(tweens.get(el)?.frame)
		const duration = reduceMotion.matches ? 0 : (options.duration ?? 320)
		const start = performance.now()
		const step = (now) => {
			const t = duration ? clamp((now - start) / duration, 0, 1) : 1
			const value = from + (to - from) * easeOut(t)
			el.textContent = fmt(value)
			tweens.set(el, { value, frame: t < 1 ? requestAnimationFrame(step) : 0 })
		}
		step(start)
	}

	function niceTicks(min, max, count) {
		const span = max - min || 1
		const raw = span / count
		const pow = 10 ** Math.floor(Math.log10(raw))
		const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)
		const lo = Math.floor(min / step) * step
		const hi = Math.ceil(max / step) * step
		const ticks = []
		for (let v = lo; v <= hi + step / 1e6; v += step) ticks.push(Number(v.toFixed(10)))
		return ticks
	}

	let tipEl = null
	function tip(html, x, y, variant = '') {
		if (!tipEl) {
			tipEl = document.createElement('div')
			document.body.append(tipEl)
		}
		if (html === null) return tipEl.classList.remove('on')
		tipEl.className = `ui-tip ${variant}${tipEl.classList.contains('on') ? ' on' : ''}`
		tipEl.innerHTML = html
		const r = tipEl.getBoundingClientRect()
		tipEl.style.left = `${x + 14 + r.width > innerWidth ? x - 14 - r.width : x + 14}px`
		tipEl.style.top = `${clamp(y - r.height / 2, 4, innerHeight - r.height - 4)}px`
		tipEl.classList.add('on')
	}

	// Runs `fn` once when `el` first scrolls into view, so entrance motion is seen.
	function whenVisible(el, fn) {
		if (reduceMotion.matches || typeof IntersectionObserver === 'undefined') return fn(false)
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					io.disconnect()
					fn(true)
				}
			},
			{ threshold: 0.3 },
		)
		io.observe(el)
	}

	function measureText(text, size = 12) {
		measureText.ctx ??= document.createElement('canvas').getContext('2d')
		measureText.ctx.font = `${size}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-sans') || 'system-ui'}`
		return measureText.ctx.measureText(text).width
	}

	function seriesColors(series) {
		const highlighted = series.some((s) => s.highlight)
		let next = 1
		return series.map(
			(s) =>
				s.color ??
				(!highlighted || s.highlight ? `var(--chart-${next++})` : 'var(--chart-context)'),
		)
	}

	/**
	 * ui.line(el, { x: ['Mon', …], series: [{ name, values, highlight }], format, unit,
	 *   height = 200, min = 0, max, annotations: [{ type: 'band', from, to, label },
	 *   { type: 'rule', y, label }, { type: 'marker', at, label }, { type: 'point', series, at, label }] })
	 * Returns { update(next) } to animate to new data with the same shape.
	 */
	function line(el, options) {
		let opts = options
		let shown = opts.series.map((s) => s.values.slice())
		let hover = null
		let reveal = 1
		el.classList.add('ui-chart')
		el.tabIndex = 0
		el.setAttribute('role', 'img')
		el.setAttribute('aria-label', opts.label ?? opts.series.map((s) => s.name).join(', '))
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		el.replaceChildren(svg)

		function draw() {
			const w = el.getBoundingClientRect().width
			if (!w) return
			const H = opts.height ?? 200
			const fmt = opts.format ?? ((v) => format(v, { compact: true }))
			const colors = seriesColors(opts.series)
			const all = shown.flat()
			const min = opts.min ?? Math.min(0, ...all)
			const ticks = niceTicks(min, opts.max ?? Math.max(...all), w < 420 ? 3 : 4)
			const lo = ticks[0]
			const hi = ticks.at(-1)
			const right =
				opts.labels === false ? 4 : Math.max(...opts.series.map((s) => measureText(s.name))) + 14
			const top = 10
			const bottom = 22
			const n = opts.x.length
			const x = (i) => (i * (w - right)) / (n - 1)
			const y = (v) => top + (1 - (v - lo) / (hi - lo)) * (H - top - bottom)
			svg.setAttribute('height', H)
			svg.setAttribute('viewBox', `0 0 ${w} ${H}`)
			let s = `<defs><clipPath id="r${uid}"><rect x="-4" y="-8" width="${(w - right + 8) * reveal}" height="${H + 16}"/></clipPath></defs>`
			for (const a of opts.annotations ?? []) {
				if (a.type === 'band')
					s += `<rect x="${x(a.from)}" y="${top}" width="${x(a.to) - x(a.from)}" height="${H - top - bottom}" fill="var(--foreground)" opacity="0.045"/>`
				if (a.type === 'marker')
					s += `<line x1="${x(a.at)}" x2="${x(a.at)}" y1="${top}" y2="${H - bottom}" stroke="var(--chart-context)" stroke-dasharray="2 3"/>`
			}
			for (const t of ticks)
				s += `<line x1="0" x2="${w - right}" y1="${y(t)}" y2="${y(t)}" stroke="${t === 0 ? 'var(--border)' : 'var(--grid)'}"/>`
			for (const a of opts.annotations ?? []) {
				if (a.type === 'rule')
					s += `<line x1="0" x2="${w - right}" y1="${y(a.y)}" y2="${y(a.y)}" stroke="var(--chart-context)" stroke-dasharray="4 3"/>`
			}
			s += `<g clip-path="url(#r${uid})">`
			opts.series.forEach((series, k) => {
				const d = shown[k]
					.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
					.join('')
				const strong = series.highlight || !opts.series.some((o) => o.highlight)
				s += `<path d="${d}" fill="none" stroke="${colors[k]}" stroke-width="${strong ? 2 : 1.5}" stroke-linejoin="round" stroke-linecap="round"/>`
			})
			s += '</g>'
			// Text after lines, with halos, so labels stay readable where lines cross them.
			ticks.forEach((t, i) => {
				s += `<text class="halo" x="0" y="${y(t) - 5}">${esc(fmt(t))}${i === ticks.length - 1 && opts.unit ? ` ${esc(opts.unit)}` : ''}</text>`
			})
			const xTicks =
				opts.xTicks ??
				(w < 420 ? [0, n - 1] : [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1])
			for (const i of xTicks)
				s += `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(opts.x[i])}</text>`
			for (const a of opts.annotations ?? []) {
				if (a.type === 'band' && a.label)
					s += `<text x="${x(a.from) + 6}" y="${top + 13}">${esc(a.label)}</text>`
				if (a.type === 'marker' && a.label)
					s += `<text class="halo" x="${x(a.at) + 5}" y="${top + 13}">${esc(a.label)}</text>`
				if (a.type === 'rule' && a.label)
					s += `<text class="halo" x="${w - right}" y="${y(a.y) - 5}" text-anchor="end">${esc(a.label)}</text>`
				if (a.type === 'point') {
					const k =
						typeof a.series === 'number'
							? a.series
							: opts.series.findIndex((o) => o.name === a.series)
					const v = shown[k][a.at]
					s += `<circle cx="${x(a.at)}" cy="${y(v)}" r="3" fill="${colors[k]}" opacity="${reveal}"/>`
					s += `<text class="halo" x="${x(a.at)}" y="${y(v) - 9}" text-anchor="middle" style="fill:var(--foreground)" opacity="${reveal}">${esc(a.label ?? fmt(v))}</text>`
				}
			}
			if (opts.labels !== false) {
				// End labels, nudged apart so they never collide.
				const ends = opts.series
					.map((series, k) => ({ k, y: y(shown[k][n - 1]) }))
					.sort((a, b) => a.y - b.y)
				for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 14)
				for (let i = ends.length - 2; i >= 0; i--)
					ends[i].y = Math.min(ends[i].y, ends[i + 1].y - 14)
				for (const e of ends) {
					const series = opts.series[e.k]
					const strong = series.highlight || !opts.series.some((o) => o.highlight)
					if (strong)
						s += `<circle cx="${x(n - 1)}" cy="${y(shown[e.k][n - 1])}" r="3" fill="${colors[e.k]}" opacity="${reveal}"/>`
					s += `<text class="series-label" x="${w - right + 8}" y="${e.y + 4}" style="fill:${strong ? colors[e.k] : 'var(--muted-foreground)'}" opacity="${reveal}">${esc(series.name)}</text>`
				}
			}
			if (hover !== null) {
				s += `<line x1="${x(hover)}" x2="${x(hover)}" y1="${top}" y2="${H - bottom}" stroke="var(--border)"/>`
				opts.series.forEach((_, k) => {
					s += `<circle cx="${x(hover)}" cy="${y(shown[k][hover])}" r="3.5" fill="var(--background)" stroke="${colors[k]}" stroke-width="2"/>`
				})
			}
			svg.innerHTML = s
			geometry = { x, w, right, n, colors, fmt }
		}

		let geometry = null
		const uid = Math.random().toString(36).slice(2, 8)

		function showTip(i, clientX, clientY) {
			hover = i
			draw()
			const { fmt, colors } = geometry
			const rows = opts.series
				.map((series, k) => ({ series, k, v: shown[k][i] }))
				.sort((a, b) => b.v - a.v)
				.map(
					({ series, k, v }) =>
						`<div class="item"><i style="--c:${colors[k]}"></i>${esc(series.name)}<b>${esc(fmt(v))}${opts.unit ? ` ${esc(opts.unit)}` : ''}</b></div>`,
				)
				.join('')
			tip(
				`<div class="head">${esc(opts.tooltipTitle ? opts.tooltipTitle(i) : opts.x[i])}</div>${rows}`,
				clientX,
				clientY,
			)
		}

		svg.addEventListener('pointermove', (e) => {
			if (!geometry) return
			const r = svg.getBoundingClientRect()
			const i = clamp(
				Math.round(((e.clientX - r.left) / (geometry.w - geometry.right)) * (geometry.n - 1)),
				0,
				geometry.n - 1,
			)
			if (i !== hover) showTip(i, e.clientX, e.clientY)
			else tip(tipEl.innerHTML, e.clientX, e.clientY)
		})
		svg.addEventListener('pointerleave', () => {
			hover = null
			tip(null)
			draw()
		})
		el.addEventListener('keydown', (e) => {
			if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key) || !geometry) return
			e.preventDefault()
			if (e.key === 'Escape') {
				hover = null
				tip(null)
				return draw()
			}
			const i = clamp(
				(hover ?? geometry.n - 1) + (e.key === 'ArrowRight' ? 1 : -1),
				0,
				geometry.n - 1,
			)
			const r = svg.getBoundingClientRect()
			showTip(i, r.left + geometry.x(i), r.top + 40)
		})
		el.addEventListener('blur', () => {
			hover = null
			tip(null)
			draw()
		})

		draw()
		new ResizeObserver(draw).observe(el)
		whenVisible(el, (animate) => {
			if (!animate) return
			reveal = 0
			const start = performance.now()
			const step = (now) => {
				reveal = easeOut(clamp((now - start) / 700, 0, 1))
				draw()
				if (reveal < 1) requestAnimationFrame(step)
			}
			requestAnimationFrame(step)
		})

		let frame = 0
		return {
			update(next) {
				const from = shown.map((v) => v.slice())
				opts = { ...opts, ...next }
				const to = opts.series.map((s) => s.values)
				cancelAnimationFrame(frame)
				const start = performance.now()
				const duration = reduceMotion.matches ? 0 : 260
				const step = (now) => {
					const t = duration ? easeOut(clamp((now - start) / duration, 0, 1)) : 1
					shown = to.map((vals, k) =>
						vals.map((v, i) => (from[k]?.[i] ?? v) + (v - (from[k]?.[i] ?? v)) * t),
					)
					draw()
					if (t < 1) frame = requestAnimationFrame(step)
				}
				step(start)
			},
		}
	}

	/**
	 * ui.bars(el, { items: [{ label, value, highlight }] or [{ label, values: [a, b] }],
	 *   keys: ['TypeScript', 'Svelte'], format, sort = true, mono = false, share = false })
	 * Horizontal bars with labels on the left and values at the bar ends.
	 */
	function bars(el, options) {
		let opts = options
		el.classList.add('ui-chart')
		function render(animate) {
			const items = opts.items.map((item) => ({
				...item,
				values: item.values ?? [item.value],
				total: item.value ?? item.values.reduce((a, b) => a + b, 0),
			}))
			// Muted rows (Other, the rest) stay last.
			if (opts.sort !== false)
				items.sort(
					(a, b) => Number(Boolean(a.muted)) - Number(Boolean(b.muted)) || b.total - a.total,
				)
			const max = opts.max ?? Math.max(...items.map((i) => i.total))
			const sum = items.reduce((a, i) => a + i.total, 0)
			const fmt = opts.format ?? ((v) => format(v, { compact: true }))
			const highlighted = items.some((i) => i.highlight)
			const segColor = (k) => `var(--chart-${k + 1})`
			let html = ''
			if (opts.keys)
				html += `<div class="ui-key">${opts.keys.map((key, k) => `<span><i style="--c:${segColor(k)}"></i>${esc(key)}</span>`).join('')}</div>`
			html += `<div style="display:grid;grid-template-columns:max-content 1fr;column-gap:12px;row-gap:6px;align-items:center">`
			items.forEach((item, row) => {
				const color =
					item.color ??
					(item.muted
						? 'var(--chart-context)'
						: opts.keys
							? null
							: highlighted && !item.highlight
								? 'var(--chart-context)'
								: 'var(--chart-1)')
				const pct = (item.total / max) * 100
				const segs = item.values
					.map((v, k) =>
						v > 0 ? `<span style="flex:${v};background:${color ?? segColor(k)}"></span>` : '',
					)
					.join('')
				const value = `${fmt(item.total)}${opts.share ? `<span class="ui-muted"> ${format(item.total / sum, { percent: true })}</span>` : ''}`
				html += `<div class="${opts.mono ? 'ui-mono' : ''}" style="color:${item.muted ? 'var(--muted-foreground)' : 'inherit'};white-space:nowrap">${esc(item.label)}</div>`
				html += `<div data-row="${row}" style="position:relative;height:20px;display:flex;align-items:center"><div class="bar" style="display:flex;gap:1px;height:16px;width:${pct}%;min-width:2px;border-radius:2px;overflow:hidden;transform-origin:left;${animate ? `transform:scaleX(0);transition:transform 600ms cubic-bezier(.2,.8,.2,1) ${row * 35}ms` : ''}">${segs}</div><span class="ui-num" style="margin-left:8px;font-size:12px;white-space:nowrap;${animate ? `opacity:0;transition:opacity 200ms ease-out ${300 + row * 35}ms` : ''}">${value}</span></div>`
			})
			html += '</div>'
			el.innerHTML = html
			el.querySelectorAll('[data-row]').forEach((rowEl) => {
				const item = items[Number(rowEl.dataset.row)]
				rowEl.addEventListener('pointermove', (e) => {
					const parts = opts.keys
						? item.values
								.map(
									(v, k) =>
										`<div class="item"><i style="--c:${segColor(k)}"></i>${esc(opts.keys[k])}<b>${esc(fmt(v))}</b></div>`,
								)
								.join('')
						: ''
					tip(
						`<div class="head">${esc(item.label)}</div>${parts}<div class="item">Total<b>${esc(fmt(item.total))}</b></div>`,
						e.clientX,
						e.clientY,
					)
				})
				rowEl.addEventListener('pointerleave', () => tip(null))
			})
			if (animate) {
				requestAnimationFrame(() =>
					requestAnimationFrame(() => {
						el.querySelectorAll('.bar').forEach((b) => {
							b.style.transform = 'none'
						})
						el.querySelectorAll('[data-row] > .ui-num').forEach((v) => {
							v.style.opacity = '1'
						})
					}),
				)
			}
		}
		render(false)
		whenVisible(el, (animate) => animate && render(true))
		return {
			update(next) {
				opts = { ...opts, ...next }
				render(false)
			},
		}
	}

	/**
	 * ui.stack(el, { x: ['Jul 4', …], series: [{ name, values, icon }], percent = true, height = 200,
	 *   legend = true, format }) draws Amp's composition columns (as on /stats and /modes): one
	 * stacked column per x value, the first series at the bottom, a hover panel with every part.
	 */
	function stack(el, options) {
		const opts = { percent: true, height: 200, legend: true, ...options }
		el.classList.add('ui-chart')
		const color = (k) => opts.series[k].color ?? `var(--series-${(k % 10) + 1})`
		const n = opts.x.length
		const totals = opts.x.map((_, i) => opts.series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0))
		const max = opts.percent ? 100 : Math.max(...totals)
		const share = (k, i) =>
			opts.percent
				? ((opts.series[k].values[i] ?? 0) / (totals[i] || 1)) * 100
				: (opts.series[k].values[i] ?? 0)
		const fmt =
			opts.format ??
			((v) =>
				opts.percent ? `${v.toFixed(1).replace(/\.0$/, '')}%` : format(v, { compact: true }))
		const ticks = opts.percent ? [0, 25, 50, 75, 100] : niceTicks(0, max, 4)
		const top = ticks.at(-1)
		const every = Math.ceil(n / (el.getBoundingClientRect().width < 420 ? 5 : 10))
		let html = `<div class="ui-stack-chart" style="--h:${opts.height}px">`
		html += `<div class="ui-stack-axis">${ticks.map((t) => `<span style="bottom:${(t / top) * 100}%">${opts.percent ? `${t}%` : esc(format(t, { compact: true }))}</span>`).join('')}</div>`
		html += `<div class="ui-stack-plot">${ticks.map((t) => `<i style="bottom:${(t / top) * 100}%"></i>`).join('')}<div class="ui-stack-cols">`
		opts.x.forEach((label, i) => {
			const total = opts.percent ? 100 : totals[i]
			html += `<div class="ui-stack-col" data-i="${i}"><div class="ui-stack-bar" style="height:${(total / top) * 100}%;--d:${i * 22}ms">`
			opts.series.forEach((_, k) => {
				const v = share(k, i)
				if (v > 0) html += `<span style="flex:${v};background:${color(k)}"></span>`
			})
			html += '</div></div>'
		})
		html += '</div></div><div></div><div class="ui-stack-x">'
		opts.x.forEach((label, i) => {
			// Every nth date, plus the last one, never two labels side by side.
			const shown = i === n - 1 || (i % every === 0 && n - 1 - i >= every)
			html += `<span>${shown ? esc(label) : ''}</span>`
		})
		html += '</div></div>'
		if (opts.legend)
			html += `<div class="ui-legend">${opts.series.map((s, k) => `<span><i style="--c:${color(k)}"></i>${esc(s.name)}</span>`).join('')}</div>`
		el.innerHTML = html
		const swatch = (k) => {
			const s = opts.series[k]
			return `<span class="ui-swatch" style="background:${color(k)}">${s.icon ? icon(s.icon, 'xs') : ''}</span>`
		}
		el.querySelectorAll('.ui-stack-col').forEach((col) => {
			const i = Number(col.dataset.i)
			col.addEventListener('pointerenter', (e) => {
				el.classList.add('hovering')
				col.classList.add('on')
				const rows = opts.series
					.map((s, k) => ({ s, k, v: share(k, i) }))
					.filter((r) => r.v > 0)
					.sort((a, b) => b.v - a.v)
					.map(
						({ s, k, v }) =>
							`<div class="item">${swatch(k)}<span>${esc(s.name)}</span><b>${esc(fmt(v))}</b></div>`,
					)
					.join('')
				tip(
					`<div class="head">${esc(opts.tooltipTitle ? opts.tooltipTitle(i) : opts.x[i])}</div>${rows}`,
					e.clientX,
					e.clientY,
					'mono',
				)
			})
			col.addEventListener('pointermove', (e) => tip(tipEl.innerHTML, e.clientX, e.clientY, 'mono'))
			col.addEventListener('pointerleave', () => {
				el.classList.remove('hovering')
				col.classList.remove('on')
				tip(null)
			})
		})
		whenVisible(el, (animate) => {
			if (!animate) return
			el.classList.add('growing')
			requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('growing')))
		})
	}

	/**
	 * ui.leaderboard(el, { items: [{ name, sub, value, delta, icon, color }], format, deltaUnit = 'pts' })
	 * Amp's ranked cards: a colored block with the rank and a logo, the name and maker, the value,
	 * and the change. Items keep their order; colors follow --series-* unless given.
	 */
	function leaderboard(el, options) {
		const fmt = options.format ?? ((v) => `${format(v, { digits: v < 10 ? 1 : 0 })}%`)
		const unit = options.deltaUnit ?? 'pts'
		el.classList.add('ui-leaderboard')
		el.style.setProperty('--rows', Math.ceil(options.items.length / 2))
		el.innerHTML = options.items
			.map((item, k) => {
				const delta =
					item.delta === undefined || item.delta === null
						? '<span class="ui-caption">new</span>'
						: `<span class="ui-delta" data-tone="${item.delta >= 0 ? 'success' : 'danger'}">${icon(item.delta >= 0 ? 'arrow-up' : 'arrow-down', 'xs')}${format(Math.abs(item.delta), { digits: 1 })} ${esc(unit)}</span>`
				return `<div class="ui-leader"><span class="ui-leader-mark" style="background:${item.color ?? `var(--series-${(k % 10) + 1})`}"><span class="rank">${k + 1}</span>${item.icon ? icon(item.icon) : ''}</span><span class="ui-leader-body"><span class="name">${esc(item.name)}</span><span class="value ui-num">${esc(fmt(item.value))}</span><span class="sub">${esc(item.sub ?? '')}</span>${delta}</span></div>`
			})
			.join('')
	}

	// ui.sparkline(el, values, { color }) draws a small trend that fits a line of text.
	function sparkline(el, values, options = {}) {
		const w = options.width ?? 64
		const h = options.height ?? 18
		const lo = Math.min(...values)
		const hi = Math.max(...values)
		const x = (i) => 1 + (i * (w - 4)) / (values.length - 1)
		const y = (v) => 2 + (1 - (v - lo) / (hi - lo || 1)) * (h - 4)
		const color = options.color ?? 'var(--chart-1)'
		el.innerHTML = `<svg width="${w}" height="${h}" style="vertical-align:-4px;overflow:visible"><path d="${values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(values.length - 1)}" cy="${y(values.at(-1))}" r="2" fill="${color}"/></svg>`
	}

	// Segmented controls (.ui-seg) get a sliding thumb and emit 'change' with detail.value.
	function upgradeSeg(seg) {
		if (seg.dataset.ui) return
		seg.dataset.ui = '1'
		seg.setAttribute('role', 'tablist')
		const thumb = document.createElement('span')
		thumb.className = 'ui-seg-thumb'
		seg.prepend(thumb)
		const place = (animate) => {
			const selected =
				seg.querySelector('button[aria-selected="true"]') ?? seg.querySelector('button')
			if (!selected) return
			if (!animate) thumb.style.transition = 'none'
			thumb.style.width = `${selected.offsetWidth}px`
			thumb.style.transform = `translateX(${selected.offsetLeft}px)`
			if (!animate)
				requestAnimationFrame(() => {
					thumb.style.transition = ''
				})
		}
		seg.querySelectorAll('button').forEach((b) => {
			b.setAttribute('role', 'tab')
			if (!b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', 'false')
		})
		seg.addEventListener('click', (e) => {
			const button = e.target.closest('button')
			if (!button || button.getAttribute('aria-selected') === 'true') return
			seg
				.querySelectorAll('button')
				.forEach((b) => b.setAttribute('aria-selected', String(b === button)))
			place(true)
			seg.dispatchEvent(
				new CustomEvent('change', {
					detail: { value: button.dataset.value ?? button.textContent.trim() },
				}),
			)
		})
		new ResizeObserver(() => place(false)).observe(seg)
		place(false)
	}

	// Range sliders (.ui-range) fill their track up to the thumb.
	function upgradeRange(input) {
		if (input.dataset.ui) return
		input.dataset.ui = '1'
		const fill = () =>
			input.style.setProperty(
				'--p',
				`${((input.value - input.min) / (input.max - input.min || 1)) * 100}%`,
			)
		input.addEventListener('input', fill)
		fill()
	}

	function upgrade(root) {
		root.querySelectorAll?.('i[data-icon]').forEach((i) => {
			const style = i.getAttribute('style')
			i.outerHTML = icon(i.dataset.icon, i.className).replace(
				'<svg ',
				`<svg ${style ? `style="${esc(style)}" ` : ''}`,
			)
		})
		root.querySelectorAll?.('.ui-seg').forEach(upgradeSeg)
		root.querySelectorAll?.('.ui-range').forEach(upgradeRange)
	}

	function start() {
		document.body.insertAdjacentHTML(
			'afterbegin',
			`<svg width="0" height="0" style="position:absolute" aria-hidden="true">${ICONS}</svg>`,
		)
		upgrade(document)
		new MutationObserver((records) => {
			for (const r of records)
				for (const node of r.addedNodes)
					if (node.nodeType === 1) {
						if (node.matches('i[data-icon], .ui-seg, .ui-range'))
							upgrade(node.parentElement ?? document)
						else upgrade(node)
					}
		}).observe(document.body, { childList: true, subtree: true })
	}

	window.ui = { icon, format, tween, line, bars, stack, leaderboard, sparkline }
	if (document.body) start()
	else document.addEventListener('DOMContentLoaded', start, { once: true })
})()
