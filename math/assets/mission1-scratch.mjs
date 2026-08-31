const GUIDE_LABELS = { place: "Place-value chart", vertical: "Vertical calculation", numberline: "Number line", grid: "Area and grouping grid", tape: "Tape-diagram workspace" };

export function createScratchpad({ panel, body, toggle, canvas, clear, undo, guide }) {
  const context = canvas.getContext("2d");
  let strokes = [], current = null, guideType = "grid";

  function drawGuide(width, height) {
    context.save(); context.strokeStyle = "#dfe6ef"; context.lineWidth = Math.max(1, width / 900);
    if (guideType === "place") {
      for (let x = width / 5; x < width; x += width / 5) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
      context.beginPath(); context.moveTo(0, height * .22); context.lineTo(width, height * .22); context.stroke();
    } else if (guideType === "vertical") {
      for (let y = height / 5; y < height; y += height / 5) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
      context.setLineDash([7, 7]); context.beginPath(); context.moveTo(width * .62, 0); context.lineTo(width * .62, height); context.stroke();
    } else if (guideType === "numberline") {
      context.lineWidth = Math.max(2, width / 500); context.beginPath(); context.moveTo(width * .08, height * .52); context.lineTo(width * .92, height * .52); context.stroke();
      for (let x = width * .08; x <= width * .92; x += width * .14) { context.beginPath(); context.moveTo(x, height * .47); context.lineTo(x, height * .57); context.stroke(); }
    } else if (guideType === "tape") {
      context.lineWidth = Math.max(2, width / 500);
      context.strokeRect(width * .08, height * .3, width * .84, height * .22);
      context.beginPath(); context.moveTo(width * .5, height * .3); context.lineTo(width * .5, height * .52); context.stroke();
      context.beginPath(); context.moveTo(width * .08, height * .7); context.lineTo(width * .92, height * .7); context.stroke();
    } else {
      const step = Math.max(24, width / 12);
      for (let x = step; x < width; x += step) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
      for (let y = step; y < height; y += step) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    }
    context.restore();
  }

  function draw() {
    const width = canvas.width, height = canvas.height;
    context.clearRect(0, 0, width, height); drawGuide(width, height);
    context.lineCap = "round"; context.lineJoin = "round"; context.strokeStyle = "#17385f"; context.lineWidth = Math.max(3, width / 180);
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      context.beginPath(); context.moveTo(stroke[0].x * width, stroke[0].y * height);
      for (const point of stroke.slice(1)) context.lineTo(point.x * width, point.y * height);
      context.stroke();
    }
  }

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect(), ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * ratio)), height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    draw();
  }
  function point(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }; }
  canvas.addEventListener("pointerdown", event => { if (event.pointerType === "mouse" && event.button !== 0) return; canvas.setPointerCapture(event.pointerId); current = [point(event)]; strokes.push(current); event.preventDefault(); });
  canvas.addEventListener("pointermove", event => { if (!current) return; current.push(point(event)); draw(); event.preventDefault(); });
  canvas.addEventListener("pointerup", event => { if (current) { current.push(point(event)); draw(); } current = null; });
  canvas.addEventListener("pointercancel", () => { current = null; });
  clear.addEventListener("click", () => { strokes = []; draw(); });
  undo.addEventListener("click", () => { strokes.pop(); draw(); });
  function setOpen(open) { toggle.setAttribute("aria-expanded", String(open)); toggle.textContent = open ? "Close" : "Open"; body.hidden = !open; if (open) requestAnimationFrame(sizeCanvas); }
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  if ("ResizeObserver" in window) new ResizeObserver(sizeCanvas).observe(canvas);
  else window.addEventListener("resize", sizeCanvas);

  return { setQuestion(question) { strokes = []; guideType = question.scratch || "grid"; guide.textContent = GUIDE_LABELS[guideType] || "Scratchwork"; panel.dataset.guide = guideType; setOpen(window.matchMedia("(min-width: 800px)").matches); }, clear() { strokes = []; draw(); } };
}
