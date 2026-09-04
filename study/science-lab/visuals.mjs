const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function scaleY(value, min, max, top, height) {
  const ratio = (Number(value) - min) / Math.max(1, max - min);
  return top + height - clamp(ratio, 0, 1) * height;
}

export function graphMarkup(graph, overrideValues = null) {
  if (!graph) return '';
  const width = 640;
  const height = 320;
  const left = 58;
  const right = 22;
  const top = 24;
  const bottom = 62;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const labels = graph.xLabels || [];
  const values = overrideValues || graph.values || [];
  const numeric = values.filter(value => Number.isFinite(Number(value))).map(Number);
  const yMin = Number.isFinite(graph.yMin) ? graph.yMin : 0;
  const inferredMax = numeric.length ? Math.max(...numeric) : 1;
  const yMax = Number.isFinite(graph.yMax) ? graph.yMax : Math.max(1, inferredMax);
  const ticks = graph.yTicks || [yMin, yMax];
  const stepX = labels.length > 1 ? plotW / (labels.length - 1) : plotW;
  const barSlot = labels.length ? plotW / labels.length : plotW;
  const type = graph.type || 'line';

  const grid = ticks.map(tick => {
    const y = scaleY(tick, yMin, yMax, top, plotH);
    return `<g class="science-gridline"><line x1="${left}" y1="${y}" x2="${left + plotW}" y2="${y}"/><text x="${left - 9}" y="${y + 4}" text-anchor="end">${esc(tick)}</text></g>`;
  }).join('');

  const xLabels = labels.map((label, index) => {
    const x = type === 'bar' ? left + barSlot * index + barSlot / 2 : left + stepX * index;
    return `<text class="science-axis-label" x="${x}" y="${top + plotH + 27}" text-anchor="middle">${esc(label)}</text>`;
  }).join('');

  let marks = '';
  if (type === 'bar') {
    marks = values.map((value, index) => {
      if (!Number.isFinite(Number(value))) return '';
      const y = scaleY(value, yMin, yMax, top, plotH);
      const barWidth = Math.min(72, barSlot * 0.58);
      const x = left + barSlot * index + (barSlot - barWidth) / 2;
      return `<g class="science-bar"><rect x="${x}" y="${y}" width="${barWidth}" height="${top + plotH - y}" rx="5"/><text x="${x + barWidth / 2}" y="${Math.max(top + 14, y - 7)}" text-anchor="middle">${esc(value)}</text></g>`;
    }).join('');
  } else {
    const points = values.map((value, index) => Number.isFinite(Number(value)) ? {
      x: left + stepX * index,
      y: scaleY(value, yMin, yMax, top, plotH),
      value
    } : null);
    const segments = [];
    for (let index = 1; index < points.length; index += 1) {
      if (points[index - 1] && points[index]) segments.push(`<line x1="${points[index - 1].x}" y1="${points[index - 1].y}" x2="${points[index].x}" y2="${points[index].y}"/>`);
    }
    marks = `<g class="science-line">${segments.join('')}${points.map(point => point ? `<circle cx="${point.x}" cy="${point.y}" r="7"/><text x="${point.x}" y="${Math.max(top + 12, point.y - 12)}" text-anchor="middle">${esc(point.value)}</text>` : '').join('')}</g>`;
  }

  const label = graph.ariaLabel || graph.label || 'Science graph';
  return `<figure class="science-figure"><figcaption>${esc(graph.label || '')}</figcaption><svg class="science-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}"><line class="science-axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + plotH}"/><line class="science-axis" x1="${left}" y1="${top + plotH}" x2="${left + plotW}" y2="${top + plotH}"/>${grid}${xLabels}${marks}<text class="science-axis-title" x="17" y="${top + plotH / 2}" text-anchor="middle" transform="rotate(-90 17 ${top + plotH / 2})">${esc(graph.yLabel || '')}</text></svg></figure>`;
}

export function graphBuilderMarkup(spec, response = {}) {
  const values = (spec.xLabels || []).map((_label, index) => Number.isFinite(Number(response[index])) ? Number(response[index]) : null);
  const graph = graphMarkup({ ...spec, type: 'line', label: spec.graphLabel || 'Your graph', ariaLabel: spec.ariaLabel || 'Graph being constructed by the learner' }, values);
  const controls = (spec.xLabels || []).map((label, index) => `<fieldset class="plot-control"><legend>${esc(label)}</legend><div>${(spec.allowedValues || []).map(value => `<button type="button" data-plot-x="${index}" data-plot-y="${esc(value)}" aria-pressed="${Number(response[index]) === Number(value)}" class="plot-value${Number(response[index]) === Number(value) ? ' selected' : ''}">${esc(value)}${spec.unit ? ` ${esc(spec.unit)}` : ''}</button>`).join('')}</div></fieldset>`).join('');
  return `<section class="graph-builder" aria-label="Build the graph">${graph}<div class="plot-controls">${controls}</div><p class="select-note">Choose one value for each ${esc(spec.xName || 'position')}. Your graph updates as you work.</p></section>`;
}

export function graphBuildComplete(spec, response = {}) {
  return (spec?.xLabels || []).every((_label, index) => Number.isFinite(Number(response[index])));
}

export function graphBuildCorrect(spec, response = {}) {
  if (!graphBuildComplete(spec, response)) return false;
  return (spec.expected || []).every((value, index) => Number(response[index]) === Number(value));
}

export function particleModelMarkup(model) {
  if (!model) return '';
  const panels = model.panels || [];
  const panelWidth = 260;
  const panelHeight = 190;
  const gap = 26;
  const width = panels.length * panelWidth + Math.max(0, panels.length - 1) * gap;
  const height = 245;
  const bodies = panels.map((panel, panelIndex) => {
    const x0 = panelIndex * (panelWidth + gap);
    const particles = (panel.particles || []).map((particle, index) => {
      const x = x0 + 22 + Number(particle.x || 0) * (panelWidth - 44);
      const y = 36 + Number(particle.y || 0) * (panelHeight - 50);
      const kind = esc(particle.kind || 'matter');
      return `<circle class="particle ${kind}" cx="${x}" cy="${y}" r="${particle.r || 8}"><title>${esc(particle.label || `particle ${index + 1}`)}</title></circle>`;
    }).join('');
    return `<g><text class="model-panel-title" x="${x0 + panelWidth / 2}" y="18" text-anchor="middle">${esc(panel.label || '')}</text><rect class="particle-container" x="${x0 + 8}" y="28" width="${panelWidth - 16}" height="${panelHeight}" rx="16"/>${particles}</g>`;
  }).join('');
  return `<figure class="science-figure"><figcaption>${esc(model.label || '')}</figcaption><svg class="particle-model" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(model.ariaLabel || model.label || 'Particle model')}">${bodies}</svg>${model.legend ? `<p class="model-legend">${model.legend.map(entry => `<span><i class="particle-key ${esc(entry.kind)}"></i>${esc(entry.label)}</span>`).join('')}</p>` : ''}</figure>`;
}

export function systemModelMarkup(model) {
  if (!model) return '';
  const width = 640;
  const height = 300;
  const nodeById = new Map((model.nodes || []).map(node => [node.id, node]));
  const arrows = (model.arrows || []).map(arrow => {
    const from = nodeById.get(arrow.from);
    const to = nodeById.get(arrow.to);
    if (!from || !to) return '';
    const x1 = Number(from.x) * width;
    const y1 = Number(from.y) * height;
    const x2 = Number(to.x) * width;
    const y2 = Number(to.y) * height;
    return `<g class="system-arrow"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#science-arrow)"/>${arrow.label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle">${esc(arrow.label)}</text>` : ''}</g>`;
  }).join('');
  const nodes = (model.nodes || []).map(node => {
    const x = Number(node.x) * width;
    const y = Number(node.y) * height;
    const w = Number(node.w || 0.22) * width;
    const h = 54;
    return `<g class="system-node"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="14"/><text x="${x}" y="${y + 5}" text-anchor="middle">${esc(node.label)}</text></g>`;
  }).join('');
  return `<figure class="science-figure"><figcaption>${esc(model.label || '')}</figcaption><svg class="system-model" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(model.ariaLabel || model.label || 'System model')}"><defs><marker id="science-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z"/></marker></defs>${arrows}${nodes}</svg></figure>`;
}

export function visualStimulusMarkup(stimulus) {
  if (!stimulus) return '';
  if (stimulus.graph) return graphMarkup(stimulus.graph);
  if (stimulus.particleModel) return particleModelMarkup(stimulus.particleModel);
  if (stimulus.systemModel) return systemModelMarkup(stimulus.systemModel);
  return '';
}
