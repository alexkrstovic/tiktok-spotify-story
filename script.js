// ─── Outlier lightbox ────────────────────────────────────────────────────────

function showOutlierLightbox(d, valueKey, barColor) {
  const lb = document.getElementById("outlier-lightbox");
  const isViews = valueKey === "tiktokViews";

  document.getElementById("olb-overtitle").textContent = isViews
    ? "Viral but understreamed"
    : "Huge on Spotify, invisible on TikTok";
  document.getElementById("olb-track").textContent  = d.track;
  document.getElementById("olb-artist").textContent = d.artist;

  const stats = isViews
    ? `<div class="olb-stat">
         <span class="olb-stat-number" style="color:${barColor}">${siFormat(d.tiktokViews)}</span>
         <span class="olb-stat-label">TikTok views</span>
       </div>
       <div class="olb-stat">
         <span class="olb-stat-number" style="color:rgba(255,255,255,0.6)">${siFormat(d.spotify)}</span>
         <span class="olb-stat-label">Spotify streams</span>
       </div>`
    : `<div class="olb-stat">
         <span class="olb-stat-number" style="color:${barColor}">${siFormat(d.spotify)}</span>
         <span class="olb-stat-label">Spotify streams</span>
       </div>
       <div class="olb-stat">
         <span class="olb-stat-number" style="color:rgba(255,255,255,0.6)">0</span>
         <span class="olb-stat-label">TikTok posts</span>
       </div>`;

  document.getElementById("olb-stats").innerHTML = stats;

  lb.classList.remove("hidden");
  requestAnimationFrame(() => lb.classList.add("visible"));
}

function hideOutlierLightbox() {
  const lb = document.getElementById("outlier-lightbox");
  lb.classList.remove("visible");
  lb.addEventListener("transitionend", () => lb.classList.add("hidden"), { once: true });
}

// Close lightbox on button or backdrop click
document.addEventListener("DOMContentLoaded", () => {
  // Outlier lightbox
  const lb = document.getElementById("outlier-lightbox");
  if (lb) {
    lb.querySelector(".outlier-lightbox-close").addEventListener("click", hideOutlierLightbox);
    lb.addEventListener("click", e => { if (e.target === lb) hideOutlierLightbox(); });
  }

  // Trends lightbox
  const tlb = document.getElementById("trends-lightbox");
  if (tlb) {
    tlb.querySelector(".outlier-lightbox-close").addEventListener("click", () => {
      tlb.classList.remove("visible");
      tlb.addEventListener("transitionend", () => tlb.classList.add("hidden"), { once: true });
    });
    tlb.addEventListener("click", e => {
      if (e.target === tlb) {
        tlb.classList.remove("visible");
        tlb.addEventListener("transitionend", () => tlb.classList.add("hidden"), { once: true });
      }
    });
  }
});

// ─── Hamburger menu ─────────────────────────────────────────────────────────

const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('nav-open');
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('nav-open');
    });
  });
}

// ─── Heavy scroll feel ───────────────────────────────────────────────────────
// Intercepts wheel events and applies a lerp so the page decelerates slowly.
// Lower lerp value = heavier feel. 0.07 is noticeably weighted but not sluggish.

(function () {
  let target  = window.scrollY;
  let current = window.scrollY;
  let ticking = false;

  window.addEventListener('wheel', e => {
    e.preventDefault();
    if (!ticking) {
      // Sync position in case nav smooth-scroll moved the page
      current = window.scrollY;
      target  = current;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    target = Math.max(0, Math.min(max, target + e.deltaY));
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }, { passive: false });

  function tick() {
    const diff = target - current;
    if (Math.abs(diff) < 0.5) {
      current = target;
      window.scrollTo(0, current);
      ticking = false;
      return;
    }
    current += diff * 0.07;
    window.scrollTo(0, current);
    requestAnimationFrame(tick);
  }
})();

// ─── Smooth scroll with ease-in-out ────────────────────────────────────────

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();

    const start    = window.scrollY;
    const end      = target.getBoundingClientRect().top + window.scrollY;
    const distance = end - start;
    const duration = 1600;
    let startTime  = null;

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseNum(str) {
  if (!str || str.trim() === "") return null;
  const n = parseFloat(str.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function siFormat(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

// Shared tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "chart-tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("background", "#1e2333")
  .style("border", "1px solid #0aff94")
  .style("border-radius", "6px")
  .style("padding", "10px 14px")
  .style("color", "#ffffff")
  .style("font-family", "Inter, sans-serif")
  .style("font-size", "13px")
  .style("line-height", "1.5")
  .style("max-width", "240px")
  .style("z-index", "2000");

function showTooltip(event, html) {
  tooltip.style("opacity", 1).html(html);
  moveTooltip(event);
}

function moveTooltip(event) {
  tooltip
    .style("left", (event.pageX + 14) + "px")
    .style("top",  (event.pageY - 28) + "px");
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

// ─── Load data once, build all charts ──────────────────────────────────────

d3.csv("data/songs.csv").then(function (raw) {

  const parsed = raw.map(d => ({
    track:          d["Track"],
    artist:         d["Artist"],
    spotify:        parseNum(d["Spotify Streams"]),
    tiktokPosts:    parseNum(d["TikTok Posts"]),
    tiktokViews:    parseNum(d["TikTok Views"]),
    tiktokLikes:    parseNum(d["TikTok Likes"]),
    popularity:     parseNum(d["Spotify Popularity"]),
  }));

  // Deduplicate: same track+artist can appear multiple times with incomplete data.
  // Keep the entry with the highest Spotify stream count - it consistently has the most complete data.
  const deduped = Array.from(
    d3.rollup(
      parsed,
      v => v.reduce((best, d) => d.spotify > best.spotify ? d : best),
      d => `${d.track}||${d.artist}`
    ).values()
  );

  // Drop songs whose title or artist contains encoding artifacts (Unicode replacement character)
  const songs = deduped.filter(d =>
    !d.track.includes('\uFFFD') && !d.artist.includes('\uFFFD')
  );

  buildScatterplot(songs);
  buildTrendsChart(songs);
  buildTopSongsChart(songs);
  buildArtistsChart(songs);
  buildOutlierCharts(songs);
  buildSuccessSection(songs);
});

// ─── 1. Scatterplot: TikTok Posts vs Spotify Streams ───────────────────────

function buildScatterplot(songs) {
  const data = songs.filter(d => d.tiktokPosts > 0 && d.spotify > 0);

  // Pre-compute regression (reused in both inline + fullscreen)
  const logX     = data.map(d => Math.log10(d.tiktokPosts));
  const logY     = data.map(d => Math.log10(d.spotify));
  const meanX    = d3.mean(logX);
  const meanY    = d3.mean(logY);
  const slope    = d3.sum(logX.map((lx, i) => (lx - meanX) * (logY[i] - meanY))) /
                   d3.sum(logX.map(lx => (lx - meanX) ** 2));
  const intercept = meanY - slope * meanX;
  const xDomainMin = d3.min(data, d => d.tiktokPosts);
  const xDomainMax = d3.max(data, d => d.tiktokPosts);

  // Add expand button above the inline chart
  const container = document.getElementById("scatterplot");
  const btnWrap = document.createElement("div");
  btnWrap.style.cssText = "display:flex;justify-content:flex-end;margin-bottom:8px;";
  const expandBtn = document.createElement("button");
  expandBtn.textContent = "⛶ Expand to explore chart";
  expandBtn.className = "chart-expand-btn";
  btnWrap.appendChild(expandBtn);
  container.parentElement.insertBefore(btnWrap, container);

  // Draw inline chart with animation on scroll-into-view
  const { svg, dots, x, y, iW, iH } = drawScatter("scatterplot", container.clientWidth || 580, data, slope, intercept, xDomainMin, xDomainMax, false, null, true);

  // Inline legend - size key
  const legend = document.createElement("div");
  legend.className = "scatter-inline-legend";
  legend.innerHTML = `
    <div class="legend-title">Each dot is one song</div>`;
  container.appendChild(legend);

  // Start invisible
  svg.style("opacity", 0);

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();

    // Fade in the whole SVG
    svg.transition().duration(600).ease(d3.easeCubicOut).style("opacity", 1);

    // Animate dots from center outward
    dots
      .attr("cx", iW / 2).attr("cy", iH / 2)
      .attr("fill-opacity", 0)
      .transition()
        .delay(() => 200 + Math.random() * 400)
        .duration(900)
        .ease(d3.easeElasticOut.amplitude(0.8).period(0.4))
        .attr("cx", d => x(d.tiktokPosts))
        .attr("cy", d => y(d.spotify))
        .attr("fill-opacity", 0.45);
  }, { threshold: 0.2 });

  observer.observe(container);

  // Fullscreen overlay
  const overlay = document.createElement("div");
  overlay.id = "scatter-overlay";
  overlay.className = "chart-overlay hidden";
  overlay.innerHTML = `
    <div class="chart-overlay-inner">
      <div class="chart-overlay-header">
        <span class="chart-overlay-hint">Scroll to zoom &nbsp;·&nbsp; Drag to pan &nbsp;·&nbsp; Hover dots for details</span>
        <div class="chart-overlay-controls">
          <div class="scatter-zoom-wrap">
            <span class="scatter-zoom-label">Zoom</span>
            <span id="scatter-zoom-level" class="scatter-zoom-level">100%</span>
            <button id="scatter-reset-btn" class="scatter-reset-btn">Reset view</button>
          </div>
          <button class="chart-close-btn">✕ Close</button>
        </div>
      </div>
      <div class="scatter-controls">
        <div class="scatter-search-wrap">
          <input id="scatter-search" type="text" placeholder="Search artist or song…" autocomplete="off">
          <button id="scatter-clear" class="scatter-clear hidden" aria-label="Clear search">✕</button>
          <ul id="scatter-suggestions" class="scatter-suggestions hidden"></ul>
        </div>
        <div class="scatter-legend">
          <div class="legend-title">Each dot is one song - hover for details</div>
        </div>
      </div>
      <div id="scatterplot-fs"></div>
    </div>`;
  document.body.appendChild(overlay);

  // Shared filter/search/zoom state for the fullscreen chart
  let fsDotsRef = null;
  let fsSvgRef  = null;
  let fsZoomRef = null;
  let fsXRef    = null;
  let fsYRef    = null;
  let fsIWRef   = null;
  let fsIHRef   = null;
  let searchQuery = "";

  function panToSong(d) {
    if (!fsZoomRef || !fsSvgRef || !fsXRef || !fsYRef) return;
    const targetScale = 8;
    const cx = fsXRef(d.tiktokPosts);
    const cy = fsYRef(d.spotify);
    const tx = fsIWRef  / 2 - targetScale * cx;
    const ty = fsIHRef / 2 - targetScale * cy;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(targetScale);
    fsSvgRef.transition()
      .duration(900)
      .ease(d3.easeCubicInOut)
      .call(fsZoomRef.transform, transform);
  }

  function applyFilters() {
    if (!fsDotsRef) return;
    fsDotsRef.each(function(d) {
      const q = searchQuery.toLowerCase();
      const matched = q === "" ||
        d.track.toLowerCase().includes(q) ||
        d.artist.toLowerCase().includes(q);
      d3.select(this)
        .transition().duration(200)
        .attr("fill-opacity", matched ? (q === "" ? 0.45 : 0.85) : 0.06)
        .attr("stroke", (matched && q !== "") ? "#ffffff" : "none")
        .attr("stroke-width", 1);
    });
  }

  expandBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    const fsContainer = document.getElementById("scatterplot-fs");
    fsContainer.innerHTML = "";
    const fsW = Math.round(window.innerWidth  * 0.92);
    const fsH = Math.round(window.innerHeight * 0.78);
    const fsChart = drawScatter("scatterplot-fs", fsW, data, slope, intercept, xDomainMin, xDomainMax, true, fsH);
    fsDotsRef = fsChart.dots;
    fsSvgRef  = fsChart.svg;
    fsZoomRef = fsChart.zoom;
    fsXRef    = fsChart.x;
    fsYRef    = fsChart.y;
    fsIWRef   = fsChart.iW;
    fsIHRef   = fsChart.iH;
    applyFilters();

    // Reset view button
    document.getElementById("scatter-reset-btn").addEventListener("click", () => {
      fsSvgRef.transition().duration(600).ease(d3.easeCubicInOut)
        .call(fsZoomRef.transform, d3.zoomIdentity);
      document.getElementById("scatter-zoom-level").textContent = "100%";
    });

    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlay.classList.add("visible"));
  });


  // Search input + suggestions
  const searchInput    = overlay.querySelector("#scatter-search");
  const clearBtn       = overlay.querySelector("#scatter-clear");
  const suggestionsList = overlay.querySelector("#scatter-suggestions");

  function setClearVisible(visible) {
    clearBtn.classList.toggle("hidden", !visible);
  }

  clearBtn.addEventListener("mousedown", (e) => {
    e.preventDefault(); // prevent input blur before clear fires
    searchInput.value = "";
    searchQuery = "";
    setClearVisible(false);
    suggestionsList.classList.add("hidden");
    applyFilters();
    searchInput.focus();
  });

  // Build a unique list of "Track - Artist" entries for suggestions
  const suggestionPool = Array.from(
    new Map(data.map(d => [`${d.track}||${d.artist}`, d])).values()
  );

  function showSuggestions(q) {
    suggestionsList.innerHTML = "";
    if (q.length < 1) {
      suggestionsList.classList.add("hidden");
      return;
    }
    const matches = suggestionPool
      .filter(d =>
        d.track.toLowerCase().includes(q) ||
        d.artist.toLowerCase().includes(q)
      )
      .slice(0, 8);

    if (matches.length === 0) {
      suggestionsList.classList.add("hidden");
      return;
    }

    matches.forEach(d => {
      const li = document.createElement("li");
      // Bold the matching portion
      const label = `${d.track} <span class="suggestion-artist">- ${d.artist}</span>`;
      li.innerHTML = label;
      li.addEventListener("mousedown", () => {
        // mousedown fires before blur so we can set value first
        searchInput.value = d.track;
        searchQuery = d.track;
        suggestionsList.classList.add("hidden");
        applyFilters();
        panToSong(d);
      });
      suggestionsList.appendChild(li);
    });

    suggestionsList.classList.remove("hidden");
  }

  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value;
    setClearVisible(searchQuery.length > 0);
    showSuggestions(searchQuery.toLowerCase());
    applyFilters();
  });

  searchInput.addEventListener("blur", () => {
    // Small delay so mousedown on a suggestion fires first
    setTimeout(() => suggestionsList.classList.add("hidden"), 150);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.length > 0) showSuggestions(searchInput.value.toLowerCase());
  });

  // Keyboard navigation
  searchInput.addEventListener("keydown", e => {
    const items = suggestionsList.querySelectorAll("li");
    const active = suggestionsList.querySelector("li.suggestion-active");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!active) {
        items[0]?.classList.add("suggestion-active");
      } else {
        const next = active.nextElementSibling;
        active.classList.remove("suggestion-active");
        (next || items[0]).classList.add("suggestion-active");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (active) {
        const prev = active.previousElementSibling;
        active.classList.remove("suggestion-active");
        (prev || items[items.length - 1]).classList.add("suggestion-active");
      }
    } else if (e.key === "Enter") {
      if (active) {
        active.dispatchEvent(new Event("mousedown"));
      }
    } else if (e.key === "Escape") {
      suggestionsList.classList.add("hidden");
    }
  });

  overlay.querySelector(".chart-close-btn").addEventListener("click", closeOverlay);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeOverlay(); });

  function closeOverlay() {
    overlay.classList.remove("visible");
    overlay.addEventListener("transitionend", () => {
      overlay.classList.add("hidden");
      document.body.style.overflow = "";
      hideTooltip();
    }, { once: true });
  }
}

function drawScatter(containerId, width, data, slope, intercept, xDomainMin, xDomainMax, zoomable, forcedHeight, _animate) {
  const height = forcedHeight || Math.round(width * 0.72);
  const m  = { top: 20, right: 24, bottom: 58, left: 72 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  const svg = d3.select(`#${containerId}`).append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "hidden")
    .style("cursor", zoomable ? "grab" : "default");

  // Defs: clip path + glow filter
  const clipId = `clip-${containerId}`;
  const filterId = `glow-${containerId}`;
  const defs = svg.append("defs");

  defs.append("clipPath").attr("id", clipId)
    .append("rect").attr("width", iW).attr("height", iH);

  const filter = defs.append("filter")
    .attr("id", filterId)
    .attr("x", "-20%").attr("y", "-20%")
    .attr("width", "140%").attr("height", "140%");
  // Tint the blur green, then merge with the original white line on top
  filter.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 4)
    .attr("result", "blur");
  filter.append("feColorMatrix")
    .attr("in", "blur")
    .attr("type", "matrix")
    // R=0, G=1, B=0.58 maps white blur → #0aff94 green
    .attr("values", "0 0 0 0 0.04  0 0 0 0 1  0 0 0 0 0.58  0 0 0 1.5 0")
    .attr("result", "greenGlow");
  filter.append("feMerge").selectAll("feMergeNode")
    .data(["greenGlow", "SourceGraphic"])
    .join("feMergeNode")
    .attr("in", d => d);

  const root = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLog()
    .domain([1, xDomainMax * 1.2])
    .range([0, iW]);

  const y = d3.scaleLog()
    .domain([10000, d3.max(data, d => d.spotify) * 1.2])
    .range([iH, 0]);

  const axisStroke = "rgba(255,255,255,0.3)";
  const tickFill   = "rgba(255,255,255,0.45)";
  const gridStroke = "rgba(255,255,255,0.06)";

  // ── Axis groups (updated on zoom) ──
  const xGridG  = root.append("g").attr("transform", `translate(0,${iH})`);
  const yGridG  = root.append("g");
  const xAxisG  = root.append("g").attr("transform", `translate(0,${iH})`);
  const yAxisG  = root.append("g");

  function renderAxes(xS, yS) {
    xGridG.call(d3.axisBottom(xS).ticks(5).tickSize(-iH).tickFormat(""))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll("line").attr("stroke", gridStroke));

    yGridG.call(d3.axisLeft(yS).ticks(5).tickSize(-iW).tickFormat(""))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll("line").attr("stroke", gridStroke));

    xAxisG.call(d3.axisBottom(xS).ticks(5).tickFormat(siFormat))
      .call(ax => ax.select(".domain").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));

    yAxisG.call(d3.axisLeft(yS).ticks(5).tickFormat(siFormat))
      .call(ax => ax.select(".domain").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));
  }

  renderAxes(x, y);

  // Axis labels
  root.append("text").attr("x", iW / 2).attr("y", iH + 50)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("TikTok Posts");

  root.append("text").attr("transform", "rotate(-90)").attr("x", -iH / 2).attr("y", -58)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("Spotify Streams");

  // Clipped group for dots + trend line
  const chartG = root.append("g").attr("clip-path", `url(#${clipId})`);

  // Trend line - thick white + green glow
  const trendLine = chartG.append("line")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2.5)
    .attr("stroke-dasharray", "8 5")
    .attr("opacity", 1)
    .attr("filter", `url(#${filterId})`);

  function updateTrendLine(xS, yS) {
    const ty0 = Math.pow(10, slope * Math.log10(xDomainMin) + intercept);
    const ty1 = Math.pow(10, slope * Math.log10(xDomainMax) + intercept);
    trendLine
      .attr("x1", xS(xDomainMin)).attr("y1", yS(ty0))
      .attr("x2", xS(xDomainMax)).attr("y2", yS(ty1));
  }
  updateTrendLine(x, y);

  // Trend label - pill background + white text
  const trendLabelG = chartG.append("g");
  const pillW = 98, pillH = 20, pillR = 10;
  trendLabelG.append("rect")
    .attr("width", pillW).attr("height", pillH)
    .attr("rx", pillR).attr("ry", pillR)
    .attr("fill", "rgba(10,12,20,0.72)")
    .attr("stroke", "rgba(255,255,255,0.18)")
    .attr("stroke-width", 1);
  trendLabelG.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.85)")
    .attr("font-size", "11px")
    .attr("font-family", "Inter, sans-serif")
    .attr("font-weight", "400")
    .attr("x", pillW / 2).attr("y", pillH / 2)
    .text("Overall trend");

  function updateTrendLabel(xS, yS) {
    const ty0 = Math.pow(10, slope * Math.log10(xDomainMin) + intercept);
    const lx  = xS(xDomainMin) + 6;
    const ly  = yS(ty0) - pillH - 18;
    trendLabelG.attr("transform", `translate(${lx},${ly})`);
  }
  updateTrendLabel(x, y);

  // Dots as circles - fixed size
  const dotR = zoomable ? 5 : 3.5;
  const dots = chartG.selectAll("circle.dot").data(data).join("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.tiktokPosts))
    .attr("cy", d => y(d.spotify))
    .attr("r", dotR)
    .attr("fill", "#0aff94")
    .attr("fill-opacity", 0.45)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1);
      showTooltip(event,
        `<strong style="color:#0aff94">${d.track}</strong><br>
         ${d.artist}<br>
         <span style="opacity:.7">Spotify Streams: ${siFormat(d.spotify)}</span><br>
         <span style="opacity:.7">TikTok Posts: ${siFormat(d.tiktokPosts)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("fill-opacity", 0.45).attr("stroke", "none");
      hideTooltip();
    });

  // ── Return handles for external use ──
  if (!zoomable) return { svg, dots, x, y, iW, iH };

  // ── Zoom & pan (fullscreen only) ──
  let zoomBehaviour = null;
  if (zoomable) {
    svg.style("cursor", "grab");
    let zoomEndTimer = null;
    zoomBehaviour = d3.zoom()
      .scaleExtent([1, 40])
      .translateExtent([[0, 0], [iW, iH]])
      .on("zoom", (event) => {
        svg.style("cursor", event.transform.k > 1 ? "grabbing" : "grab");
        const xNew = event.transform.rescaleX(x);
        const yNew = event.transform.rescaleY(y);

        // Drop the filter while panning/zooming for performance
        trendLine.attr("filter", null);

        dots.attr("cx", d => xNew(d.tiktokPosts)).attr("cy", d => yNew(d.spotify));
        renderAxes(xNew, yNew);
        updateTrendLine(xNew, yNew);
        updateTrendLabel(xNew, yNew);

        // Update zoom counter
        const k = event.transform.k;
        const zoomEl = document.getElementById("scatter-zoom-level");
        if (zoomEl) zoomEl.textContent = `${Math.round(k * 100)}%`;

        // Restore glow 300ms after interaction stops
        clearTimeout(zoomEndTimer);
        zoomEndTimer = setTimeout(() => {
          trendLine.attr("filter", `url(#${filterId})`);
        }, 300);
      });

    svg.call(zoomBehaviour);
  }

  return { svg, dots, x, y, iW, iH, zoom: zoomBehaviour };
}

// ─── 2. Trends: Avg Spotify Streams by TikTok Activity Bucket ──────────────

function buildTrendsChart(songs) {
  const bucketDefs = [
    { label: "No TikTok",  min: 0,        max: 0,        songs: [] },
    { label: "Low",        min: 1,        max: 100000,   songs: [] },
    { label: "Medium",     min: 100001,   max: 1000000,  songs: [] },
    { label: "High",       min: 1000001,  max: 10000000, songs: [] },
    { label: "Viral",      min: 10000001, max: Infinity, songs: [] },
  ];

  songs.filter(d => d.spotify > 0).forEach(d => {
    const posts = d.tiktokPosts || 0;
    const bucket = bucketDefs.find(b => posts >= b.min && posts <= b.max);
    if (bucket) bucket.songs.push(d);
  });

  const subLabels = {
    "No TikTok": "0 posts",
    "Low":       "up to 100K posts",
    "Medium":    "100K - 1M posts",
    "High":      "1M - 10M posts",
    "Viral":     "10M+ posts",
  };

  function calcData() {
    return bucketDefs.map(b => ({
      label: b.label,
      avg:   b.songs.length ? d3.mean(b.songs.filter(s => s.spotify > 0), s => s.spotify) || 0 : 0,
      count: b.songs.length,
      songs: b.songs,
    }));
  }

  const container = document.getElementById("trends-chart");
  const width  = container.clientWidth || 580;
  const height = Math.round(width * 0.75);
  const m = { top: 40, right: 30, bottom: 80, left: 72 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  // ── Chart header: click hint only ──
  const chartHeader = document.createElement("div");
  chartHeader.className = "trends-chart-header";

  const clickHint = document.createElement("span");
  clickHint.className = "trends-click-hint";
  clickHint.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align:middle;margin-right:5px"><circle cx="6" cy="6" r="5.5" stroke="currentColor" stroke-opacity="0.5"/><path d="M4 6h4M6 4v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>Click a bar to see top songs`;

  chartHeader.appendChild(clickHint);
  container.appendChild(chartHeader);

  const svg = d3.select("#trends-chart").append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const barColors = ["#3a4256", "#2a6e5a", "#1a9e72", "#0adf88", "#0aff94"];
  const axisStroke = "rgba(255,255,255,0.3)";
  const tickFill   = "rgba(255,255,255,0.45)";
  const gridStroke = "rgba(255,255,255,0.06)";

  const x = d3.scaleBand()
    .domain(bucketDefs.map(b => b.label))
    .range([0, iW])
    .padding(0.35);

  const y = d3.scaleLinear().range([iH, 0]);

  // ── Crosshair line ──
  const crosshair = g.append("line")
    .attr("x1", 0).attr("x2", iW)
    .attr("stroke", "rgba(255,255,255,0.2)")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4 3")
    .attr("opacity", 0);

  const crosshairLabel = g.append("text")
    .attr("text-anchor", "end")
    .attr("fill", "rgba(255,255,255,0.4)")
    .attr("font-size", "11px")
    .attr("font-family", "Inter, sans-serif")
    .attr("opacity", 0);

  // ── Grid ──
  const gridG = g.append("g");
  const yAxisG = g.append("g");
  const yLabelG = g.append("text")
    .attr("transform", "rotate(-90)").attr("x", -iH / 2).attr("y", -58)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif");

  // ── Bars ──
  const barsG    = g.append("g");
  const valLabG  = g.append("g");
  const cntLabG  = g.append("g");

  // ── X axis ──
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call(ax => ax.select(".domain").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
      .attr("dy", "1.4em"));

  g.append("text").attr("x", iW / 2).attr("y", iH + 68)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("TikTok Activity Level");

  function showSongsPanel(d) {
    const top = d.songs
      .filter(s => s.spotify > 0)
      .sort((a, b) => b.spotify - a.spotify)
      .slice(0, 8);

    document.getElementById("tlb-overtitle").innerHTML =
      `Top songs - <strong style="color:#0aff94">${d.label}</strong> TikTok activity`;
    document.getElementById("tlb-list").innerHTML = top.map(s => `
      <li>
        <span class="tlb-track">${s.track}</span>
        <span class="tlb-artist">${s.artist}</span>
        <span class="tlb-streams">${siFormat(s.spotify)}</span>
      </li>`).join("");

    const lb = document.getElementById("trends-lightbox");
    lb.classList.remove("hidden");
    requestAnimationFrame(() => lb.classList.add("visible"));
  }

  function redraw(animate) {
    const data = calcData();

    y.domain([0, d3.max(data, d => d.avg) * 1.15]);

    // Grid
    gridG.call(d3.axisLeft(y).ticks(5).tickSize(-iW).tickFormat(""))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll("line").attr("stroke", gridStroke));

    // Y axis
    yAxisG.call(d3.axisLeft(y).ticks(5).tickFormat(siFormat))
      .call(ax => ax.select(".domain").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));

    yLabelG.text("Avg Spotify Streams");

    // Bars — High bar is full opacity, others slightly muted
    const bars = barsG.selectAll("rect").data(data).join("rect")
      .attr("x", d => x(d.label))
      .attr("width", x.bandwidth())
      .attr("fill", (_d, i) => barColors[i])
      .attr("fill-opacity", d => d.label === "High" ? 1 : 0.55)
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill-opacity", 1);
        const yPos = y(d.avg);
        crosshair.attr("y1", yPos).attr("y2", yPos).attr("opacity", 1);
        crosshairLabel.attr("x", -6).attr("y", yPos + 4)
          .text(siFormat(Math.round(d.avg))).attr("opacity", 1);
        showTooltip(event,
          `<strong style="color:#0aff94">${d.label} TikTok activity</strong><br>
           <span style="opacity:.7">Avg Spotify Streams: ${siFormat(Math.round(d.avg))}</span><br>
           <span style="opacity:.7">Songs in group: ${d.count.toLocaleString()}</span><br>
           <span style="opacity:.6;font-size:11px">Click to see top songs</span>`
        );
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function (_, d) {
        d3.select(this).attr("fill-opacity", d.label === "High" ? 1 : 0.55);
        crosshair.attr("opacity", 0);
        crosshairLabel.attr("opacity", 0);
        hideTooltip();
      })
      .on("click", (_event, d) => showSongsPanel(d));

    if (animate) {
      bars.attr("y", iH).attr("height", 0)
        .transition().delay((_d, i) => i * 80).duration(700).ease(d3.easeCubicOut)
        .attr("y", d => y(d.avg))
        .attr("height", d => iH - y(d.avg));
    } else {
      bars.attr("y", d => y(d.avg)).attr("height", d => iH - y(d.avg));
    }

    // Value labels
    valLabG.selectAll("text").data(data).join("text")
      .attr("x", d => x(d.label) + x.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("fill", d => d.label === "High" ? "#ffffff" : tickFill)
      .attr("font-size", d => d.label === "High" ? "13px" : "11px")
      .attr("font-weight", d => d.label === "High" ? "500" : "300")
      .attr("font-family", "Inter, sans-serif")
      .attr("y", d => y(d.avg) - 8)
      .text(d => siFormat(Math.round(d.avg)));

    // Sub-labels below tier name — what the tier actually means
    cntLabG.selectAll(".sub-label").data(data).join("text")
      .attr("class", "sub-label")
      .attr("x", d => x(d.label) + x.bandwidth() / 2)
      .attr("y", iH + 44)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.22)")
      .attr("font-size", "9px")
      .attr("font-family", "Inter, sans-serif")
      .text(d => subLabels[d.label]);

    // Clear any leftover badge from previous draws
    g.selectAll(".sweet-spot-badge").remove();
  }

  // Initial draw - bars start at 0, animate on scroll into view
  redraw(false);
  svg.selectAll("rect").attr("y", iH).attr("height", 0);

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    redraw(true);
  }, { threshold: 0.2 });
  observer.observe(container);
}

// ─── 3. Top Songs: Top 15 by Spotify Streams (horizontal bar) ──────────────

function buildTopSongsChart(songs) {
  const data = songs
    .filter(d => d.spotify > 0)
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 10);

  function tiktokTierColor(d) {
    const p = d.tiktokPosts || 0;
    if (p === 0)       return "#111118"; // No TikTok — near black
    if (p <= 100000)   return "#444455"; // Low — dark grey
    if (p <= 1000000)  return "#888899"; // Medium — mid grey
    if (p <= 10000000) return "#ccccdd"; // High — light grey
    return "#ffffff";                    // Viral — white
  }

  function tiktokTierLabel(d) {
    const p = d.tiktokPosts || 0;
    if (p === 0)       return "No TikTok";
    if (p <= 100000)   return "Low TikTok";
    if (p <= 1000000)  return "Medium TikTok";
    if (p <= 10000000) return "High TikTok";
    return "Viral on TikTok";
  }

  const container = document.getElementById("top-songs-chart");
  const totalW   = container.clientWidth || window.innerWidth;
  const mT = 24, mB = 60;
  const chartH   = 340;
  const totalH   = chartH + mT + mB;

  const barW     = totalW / data.length;
  const barGap   = Math.max(2, barW * 0.12);
  const colW     = barW - barGap;

  const maxVal   = d3.max(data, d => d.spotify);
  const yScale   = d3.scaleLinear().domain([0, maxVal]).range([chartH, 0]);

  const svg = d3.select("#top-songs-chart").append("svg")
    .attr("width", totalW)
    .attr("height", totalH);

  const g = svg.append("g").attr("transform", `translate(0,${mT})`);

  const cols = g.selectAll(".ts-col")
    .data(data)
    .join("g")
    .attr("class", "ts-col")
    .attr("transform", (_d, i) => `translate(${i * barW}, 0)`);

  // Bar background column (full height, very subtle)
  cols.append("rect")
    .attr("x", barGap / 2).attr("y", 0)
    .attr("width", colW).attr("height", chartH)
    .attr("fill", "rgba(255,255,255,0.03)")
    .attr("rx", 3);

  // Bars — start at height 0, grow up on scroll
  cols.append("rect")
    .attr("class", "ts-bar")
    .attr("x", barGap / 2)
    .attr("y", chartH)
    .attr("width", colW)
    .attr("height", 0)
    .attr("fill", d => tiktokTierColor(d))
    .attr("fill-opacity", 0.88)
    .attr("rx", 3)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", 1);
      showTooltip(event,
        `<strong style="color:#0aff94">${d.track}</strong><br>
         ${d.artist}<br>
         <span style="opacity:.7">Spotify Streams: ${siFormat(d.spotify)}</span><br>
         <span style="opacity:.7">TikTok Posts: ${d.tiktokPosts ? siFormat(d.tiktokPosts) : "None"}</span><br>
         <span style="opacity:.7">TikTok Activity: ${tiktokTierLabel(d)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("fill-opacity", 0.88);
      hideTooltip();
    });

  // Stream count above bar
  cols.append("text")
    .attr("class", "ts-val")
    .attr("x", barGap / 2 + colW / 2)
    .attr("y", chartH)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "auto")
    .attr("fill", "rgba(0,0,0,0)")
    .attr("font-size", "10px")
    .attr("font-weight", "500")
    .attr("font-family", "Inter, sans-serif")
    .text(d => siFormat(d.spotify));

  // Track name label — straight, centered under bar
  const labelX = barGap / 2 + colW / 2;
  const maxChars = Math.max(6, Math.floor(colW / 6.5));
  cols.append("text")
    .attr("x", labelX)
    .attr("y", chartH + 16)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(0,0,0,0.7)")
    .attr("font-size", "11px")
    .attr("font-weight", "500")
    .attr("font-family", "Inter, sans-serif")
    .text(d => truncate(d.track, maxChars))
    .append("title").text(d => d.track);

  // Artist label — straight, centered under track name
  cols.append("text")
    .attr("x", labelX)
    .attr("y", chartH + 31)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(0,0,0,0.42)")
    .attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif")
    .text(d => truncate(d.artist, maxChars));

  // Entrance animation
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      cols.selectAll(".ts-bar")
        .transition().delay((_d, i) => i * 45).duration(700).ease(d3.easeCubicOut)
        .attr("y", d => yScale(d.spotify))
        .attr("height", d => chartH - yScale(d.spotify));
      cols.selectAll(".ts-val")
        .transition().delay((_d, i) => i * 45 + 650).duration(250)
        .attr("y", d => yScale(d.spotify) - 5)
        .attr("fill", "rgba(0,0,0,0.55)");
    }
  }, { threshold: 0.1 });
  observer.observe(container);
}

// ─── 4. Artists: Top 10 - dual horizontal bars with legend & rank ────────────

function buildArtistsChart(songs) {
  const byArtist = d3.rollups(
    songs.filter(d => d.spotify > 0),
    v => ({
      spotify: d3.sum(v, d => d.spotify),
      tiktok:  d3.sum(v, d => d.tiktokPosts)
    }),
    d => d.artist
  ).map(([artist, vals]) => ({ artist, spotify: vals.spotify, tiktok: vals.tiktok }))
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 10);

  const container = document.getElementById("artists-chart");
  const totalW   = container.clientWidth || 600;
  const labelW   = 130;
  const barAreaW = totalW - labelW;

  const barH     = 22;
  const innerGap = 4;
  const outerGap = 18;
  const rowH     = barH * 2 + innerGap + outerGap;
  const legendH  = 36;
  const topPad   = legendH + 8;
  const totalH   = byArtist.length * rowH + topPad + 16;

  const maxSpotify = d3.max(byArtist, d => d.spotify);
  const maxTikTok  = d3.max(byArtist, d => d.tiktok) || 1;
  const xS = d3.scaleLinear().domain([0, maxSpotify]).range([0, barAreaW - 4]);
  const xT = d3.scaleLinear().domain([0, maxTikTok]).range([0, barAreaW - 4]);

  const svg = d3.select("#artists-chart").append("svg")
    .attr("width", totalW)
    .attr("height", totalH);

  // ── Legend ──────────────────────────────────────────────────────────────────
  const leg = svg.append("g").attr("transform", `translate(${labelW}, 10)`);

  leg.append("rect").attr("x", 0).attr("y", 2)
    .attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", "#3d6494");
  leg.append("text").attr("x", 14).attr("y", 7)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.55)")
    .attr("font-family", "Inter, sans-serif").attr("font-size", "11px")
    .text("Spotify Streams");

  leg.append("rect").attr("x", 130).attr("y", 2)
    .attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", "#0aff94");
  leg.append("text").attr("x", 144).attr("y", 7)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.55)")
    .attr("font-family", "Inter, sans-serif").attr("font-size", "11px")
    .text("TikTok Posts");

  leg.append("text").attr("x", 260).attr("y", 7)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.25)")
    .attr("font-family", "Inter, sans-serif").attr("font-size", "10px")
    .attr("font-style", "italic")
    .text("each bar scaled independently");

  // ── Artist rows ─────────────────────────────────────────────────────────────
  const groups = svg.selectAll(".artist-group")
    .data(byArtist)
    .join("g")
    .attr("class", "artist-group")
    .attr("transform", (_d, i) => `translate(0, ${topPad + i * rowH})`);

  // Rank number
  groups.append("text")
    .attr("x", 8)
    .attr("y", barH + innerGap / 2)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.22)")
    .attr("font-family", "Inter, sans-serif")
    .attr("font-size", "10px")
    .attr("font-weight", "300")
    .text((_d, i) => `#${i + 1}`);

  // Artist name (with SVG title for full name on hover)
  groups.append("text")
    .attr("x", labelW - 14)
    .attr("y", barH + innerGap / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("fill", "#ffffff")
    .attr("font-family", "Host Grotesk, Inter, sans-serif")
    .attr("font-size", "13px")
    .attr("font-weight", "500")
    .text(d => truncate(d.artist, 18))
    .append("title").text(d => d.artist); // native tooltip for full name

  // Background tracks
  groups.append("rect")
    .attr("x", labelW).attr("y", 0)
    .attr("width", barAreaW).attr("height", barH)
    .attr("fill", "rgba(255,255,255,0.03)");

  groups.append("rect")
    .attr("x", labelW).attr("y", barH + innerGap)
    .attr("width", barAreaW).attr("height", barH)
    .attr("fill", "rgba(10,255,148,0.04)");

  // Metric micro-labels on background track
  groups.append("text")
    .attr("x", labelW + 8).attr("y", barH / 2)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.18)")
    .attr("font-family", "Inter, sans-serif").attr("font-size", "9px")
    .attr("pointer-events", "none").text("Spotify Streams");

  groups.append("text")
    .attr("x", labelW + 8).attr("y", barH + innerGap + barH / 2)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(10,255,148,0.22)")
    .attr("font-family", "Inter, sans-serif").attr("font-size", "9px")
    .attr("pointer-events", "none").text("TikTok Posts");

  // Gap indicator: dashed vertical line at end of Spotify bar through TikTok row
  // shows where TikTok would need to reach to match Spotify
  groups.append("line")
    .attr("class", "gap-line")
    .attr("x1", d => labelW + xS(d.spotify))
    .attr("x2", d => labelW + xS(d.spotify))
    .attr("y1", 0).attr("y2", barH * 2 + innerGap)
    .attr("stroke", "rgba(255,255,255,0.18)")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "2,3")
    .attr("pointer-events", "none")
    .attr("opacity", 0);

  // Spotify bars (start at 0, animate on scroll)
  groups.append("rect")
    .attr("class", "spotify-bar")
    .attr("x", labelW).attr("y", 0)
    .attr("width", 0).attr("height", barH)
    .attr("fill", "#3d6494");

  // TikTok bars
  groups.append("rect")
    .attr("class", "tiktok-bar")
    .attr("x", labelW).attr("y", barH + innerGap)
    .attr("width", 0).attr("height", barH)
    .attr("fill", "#0aff94").attr("fill-opacity", 0.85);

  // Value label - Spotify
  groups.append("text")
    .attr("class", "val-spotify")
    .attr("x", d => labelW + xS(d.spotify) - 8)
    .attr("y", barH / 2)
    .attr("text-anchor", "end").attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.7)")
    .attr("font-family", "Inter, sans-serif").attr("font-size", "11px")
    .attr("pointer-events", "none").attr("opacity", 0)
    .text(d => xS(d.spotify) > 70 ? siFormat(d.spotify) : "");

  // Value label - TikTok
  groups.append("text")
    .attr("class", "val-tiktok")
    .attr("x", d => labelW + xT(d.tiktok) - 8)
    .attr("y", barH + innerGap + barH / 2)
    .attr("text-anchor", "end").attr("dominant-baseline", "middle")
    .attr("fill", "rgba(0,0,0,0.65)")
    .attr("font-family", "Inter, sans-serif").attr("font-size", "11px")
    .attr("font-weight", "500")
    .attr("pointer-events", "none").attr("opacity", 0)
    .text(d => xT(d.tiktok) > 70 ? siFormat(d.tiktok) : "");

  // Tooltips
  groups
    .style("cursor", "default")
    .on("mouseover", function(event, d) {
      d3.select(this).select(".spotify-bar").attr("fill", "#5580b0");
      d3.select(this).select(".tiktok-bar").attr("fill-opacity", 1);
      showTooltip(event,
        `<strong style="color:#fff">${d.artist}</strong><br>
         <span style="color:rgba(255,255,255,0.55)">Spotify Streams: </span><span style="color:#fff">${siFormat(d.spotify)}</span><br>
         <span style="color:rgba(10,255,148,0.55)">TikTok Posts: </span><span style="color:#0aff94">${siFormat(d.tiktok)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this).select(".spotify-bar").attr("fill", "#3d6494");
      d3.select(this).select(".tiktok-bar").attr("fill-opacity", 0.85);
      hideTooltip();
    });

  // Entrance animation via IntersectionObserver (fires once)
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      svg.selectAll(".artist-group").each(function(d, i) {
        const grp   = d3.select(this);
        const delay = i * 55;
        grp.select(".spotify-bar")
          .transition().delay(delay).duration(900).ease(d3.easeCubicOut)
          .attr("width", xS(d.spotify));
        grp.select(".tiktok-bar")
          .transition().delay(delay + 90).duration(900).ease(d3.easeCubicOut)
          .attr("width", xT(d.tiktok));
        grp.select(".gap-line")
          .transition().delay(delay + 600).duration(400)
          .attr("opacity", 1);
        grp.select(".val-spotify")
          .transition().delay(delay + 750).duration(300)
          .attr("opacity", 1);
        grp.select(".val-tiktok")
          .transition().delay(delay + 840).duration(300)
          .attr("opacity", 1);
      });
    }
  }, { threshold: 0.1 });
  observer.observe(container);
}

// ─── 5. Outliers: two side-by-side charts ──────────────────────────────────

function buildOutlierCharts(songs) {
  // Require at least 100K Spotify streams to exclude TikTok-only sounds and garbled-title tracks
  const minSpotify = 100_000;

  const withBoth = songs.filter(d => d.tiktokViews > 0 && d.spotify >= minSpotify);
  const medianTikTok  = d3.median(withBoth, d => d.tiktokViews);
  const medianSpotify = d3.median(withBoth, d => d.spotify);

  // Chart 1: genuinely viral (tiktokViews > median) AND understreamed (spotify < median)
  // sorted by tiktokViews/spotify ratio to surface the most extreme mismatches
  const viralLowSpotify = withBoth
    .filter(d => d.tiktokViews > medianTikTok && d.spotify < medianSpotify)
    .sort((a, b) => (b.tiktokViews / b.spotify) - (a.tiktokViews / a.spotify))
    .slice(0, 8);

  // Chart 2: top-quartile Spotify streams but zero TikTok posts at all
  const sortedSpotify = songs.filter(d => d.spotify >= minSpotify).map(d => d.spotify).sort(d3.ascending);
  const p75Spotify = d3.quantile(sortedSpotify, 0.75);
  const streamedNoTiktok = songs
    .filter(d => d.spotify > p75Spotify && (d.tiktokPosts === null || d.tiktokPosts === 0))
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 8);

  buildOutlierBar("outlier-chart-1", viralLowSpotify, "tiktokViews", "TikTok Views");
  buildOutlierBar("outlier-chart-2", streamedNoTiktok, "spotify",    "Spotify Streams");
}

function buildOutlierBar(containerId, data, valueKey, axisLabel) {
  const container = document.getElementById(containerId);
  const width  = container.clientWidth || 480;
  const height = Math.round(width * 1.05);
  const m = { top: 10, right: 16, bottom: 50, left: 130 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  const svg = d3.select(`#${containerId}`).append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[valueKey]) * 1.05])
    .range([0, iW]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.track))
    .range([0, iH])
    .padding(0.28);

  const axisStroke = "rgba(255,255,255,0.15)";
  const tickFill   = "rgba(255,255,255,0.4)";
  const barColor   = valueKey === "tiktokViews" ? "#ff4d6d" : "#0aff94";

  // Grid lines
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(4).tickSize(-iH).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", "rgba(255,255,255,0.05)"));

  // Bars (start at 0 for animation)
  g.selectAll(".obar").data(data).join("rect")
    .attr("class", "obar")
    .attr("x", 0)
    .attr("y", d => y(d.track))
    .attr("width", 0)
    .attr("height", y.bandwidth())
    .attr("fill", barColor)
    .attr("fill-opacity", 0.75)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill-opacity", 1);
      const extra = valueKey === "tiktokViews"
        ? `<br><span style="color:rgba(255,255,255,0.45)">Spotify Streams: ${siFormat(d.spotify)}</span>`
        : `<br><span style="color:rgba(255,255,255,0.45)">TikTok Posts: none</span>`;
      showTooltip(event,
        `<strong style="color:${barColor}">${d.track}</strong><br>
         <span style="color:rgba(255,255,255,0.5)">${d.artist}</span><br>
         <span style="color:rgba(255,255,255,0.45)">${axisLabel}: ${siFormat(d[valueKey])}</span>${extra}`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this).attr("fill-opacity", 0.75);
      hideTooltip();
    });

  // Value labels (start hidden)
  // If bar is wide enough (>60px), place label inside at end; otherwise outside to the right
  const insideFill  = valueKey === "tiktokViews" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)";
  const outsideFill = "rgba(255,255,255,0.55)";
  g.selectAll(".obar-label").data(data).join("text")
    .attr("class", "obar-label")
    .attr("x", d => x(d[valueKey]) > 60 ? x(d[valueKey]) - 6 : x(d[valueKey]) + 6)
    .attr("y", d => y(d.track) + y.bandwidth() / 2 + 1)
    .attr("text-anchor", d => x(d[valueKey]) > 60 ? "end" : "start")
    .attr("dominant-baseline", "middle")
    .attr("fill", d => x(d[valueKey]) > 60 ? insideFill : outsideFill)
    .attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif")
    .attr("pointer-events", "none")
    .attr("opacity", 0)
    .text(d => siFormat(d[valueKey]));

  // Caption above the chart - one-line stat about the top entry
  if (data.length > 0) {
    const top = data[0];
    const captionText = valueKey === "tiktokViews"
      ? `Top entry: ${siFormat(top.tiktokViews)} TikTok views - only ${siFormat(top.spotify)} Spotify streams`
      : `Top entry: ${siFormat(top.spotify)} Spotify streams - zero TikTok posts`;
    const caption = document.createElement("p");
    caption.className = "outlier-chart-caption";
    caption.textContent = captionText;
    container.insertBefore(caption, container.firstChild);
  }

  // Y axis - track names
  g.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif")
      .attr("dx", "-8")
      .text(d => truncate(d, 18))
      .append("title").text(d => d));

  // X axis
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(siFormat))
    .call(ax => ax.select(".domain").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif"));

  g.append("text").attr("x", iW / 2).attr("y", iH + 42)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.3)")
    .attr("font-size", "11px").attr("font-family", "Inter, sans-serif")
    .text(axisLabel);

  // Entrance animation
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      g.selectAll(".obar").each(function(d, i) {
        d3.select(this)
          .transition().delay(i * 60).duration(800).ease(d3.easeCubicOut)
          .attr("width", x(d[valueKey]));
      });
      g.selectAll(".obar-label")
        .transition().delay((_, i) => i * 60 + 650).duration(250)
        .attr("opacity", 1);
      g.select(".obar-annotation")
        .transition().delay(700).duration(400)
        .attr("opacity", 1);
    }
  }, { threshold: 0.15 });
  observer.observe(container);
}

// ─── 6. What Drives Success: stat callouts + verdict chart ───────────────────

function buildSuccessSection(songs) {
  const buckets = [
    { label: "No TikTok", color: "#3a4256", min: 0,        max: 0        },
    { label: "Low",       color: "#2a6e5a", min: 1,        max: 100000   },
    { label: "Medium",    color: "#1a9e72", min: 100001,   max: 1000000  },
    { label: "High",      color: "#0adf88", min: 1000001,  max: 10000000 },
    { label: "Viral",     color: "rgba(255,255,255,0.55)", min: 10000001, max: Infinity },
  ];

  const valid = songs.filter(d => d.spotify > 0);
  buckets.forEach(b => {
    const group = valid.filter(d => {
      const p = d.tiktokPosts || 0;
      if (b.label === "No TikTok") return p === 0;
      return p >= b.min && p <= b.max;
    });
    b.avg = d3.mean(group, d => d.spotify) || 0;
  });

  // Stat callouts
  const noAvg    = buckets[0].avg;
  const highAvg  = buckets[3].avg;
  const viralAvg = buckets[4].avg;
  const multiplier = (highAvg / noAvg).toFixed(1).replace(/\.0$/, "");
  const dropPct    = Math.round((1 - viralAvg / highAvg) * 100);

  document.getElementById("success-stats").innerHTML = `
    <div class="success-stat">
      <span class="stat-number">${multiplier}×</span>
      <span class="stat-label">more streams for high TikTok activity songs compared to songs with no TikTok at all</span>
    </div>
    <div class="success-stat">
      <span class="stat-number">${dropPct}%</span>
      <span class="stat-label">drop in streams once a song crosses into full virality</span>
    </div>
    <div class="success-stat">
      <span class="stat-number">${siFormat(highAvg)}</span>
      <span class="stat-label">average streams at the peak - beyond that, more TikTok means fewer streams</span>
    </div>`;

  // Line + Area chart
  const container = document.getElementById("success-chart");
  const totalW  = container.clientWidth || 420;
  const margin  = { top: 60, right: 24, bottom: 48, left: 24 };
  const chartW  = totalW - margin.left - margin.right;
  const chartH  = 230;
  const totalH  = chartH + margin.top + margin.bottom;

  const xScale = d3.scalePoint()
    .domain(buckets.map(b => b.label))
    .range([0, chartW])
    .padding(0.35);

  const maxAvg = d3.max(buckets, b => b.avg);
  const yScale = d3.scaleLinear()
    .domain([0, maxAvg * 1.2])
    .range([chartH, 0]);

  const svg = d3.select("#success-chart").append("svg")
    .attr("width", totalW).attr("height", totalH);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Gradient fill under the line
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient")
    .attr("id", "success-area-grad")
    .attr("x1", "0").attr("y1", "0")
    .attr("x2", "0").attr("y2", "1");
  grad.append("stop").attr("offset", "0%")
    .attr("stop-color", "#0adf88").attr("stop-opacity", 0.32);
  grad.append("stop").attr("offset", "100%")
    .attr("stop-color", "#0adf88").attr("stop-opacity", 0.02);

  // Clip path - expands left-to-right during entrance animation
  defs.append("clipPath").attr("id", "success-clip")
    .append("rect")
    .attr("x", 0).attr("y", -margin.top)
    .attr("width", 0)
    .attr("height", chartH + margin.top + 20);

  // Subtle horizontal grid lines
  g.selectAll(".s-grid")
    .data(yScale.ticks(4))
    .join("line")
    .attr("class", "s-grid")
    .attr("x1", 0).attr("x2", chartW)
    .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
    .attr("stroke", "rgba(255,255,255,0.05)").attr("stroke-width", 1);

  // Area path
  const areaGen = d3.area()
    .x(d => xScale(d.label))
    .y0(chartH)
    .y1(d => yScale(d.avg))
    .curve(d3.curveCatmullRom.alpha(0.5));

  g.append("path")
    .datum(buckets)
    .attr("fill", "url(#success-area-grad)")
    .attr("clip-path", "url(#success-clip)")
    .attr("d", areaGen);

  // Line path
  const lineGen = d3.line()
    .x(d => xScale(d.label))
    .y(d => yScale(d.avg))
    .curve(d3.curveCatmullRom.alpha(0.5));

  g.append("path")
    .datum(buckets)
    .attr("fill", "none")
    .attr("stroke", "#0adf88")
    .attr("stroke-width", 2.5)
    .attr("stroke-linecap", "round")
    .attr("clip-path", "url(#success-clip)")
    .attr("d", lineGen);

  // X-axis tier labels
  g.selectAll(".s-xlabel")
    .data(buckets)
    .join("text")
    .attr("class", "s-xlabel")
    .attr("x", d => xScale(d.label))
    .attr("y", chartH + 30)
    .attr("text-anchor", "middle")
    .attr("fill", d => d.label === "High" ? "#ffffff" : "rgba(255,255,255,0.38)")
    .attr("font-family", "Inter, sans-serif")
    .attr("font-size", d => d.label === "High" ? "13px" : "11px")
    .attr("font-weight", d => d.label === "High" ? "500" : "300")
    .text(d => d.label);

  // Dots + value labels (hidden until animation)
  const dotGroup = g.selectAll(".s-dot-group")
    .data(buckets)
    .join("g")
    .attr("class", "s-dot-group")
    .attr("transform", d => `translate(${xScale(d.label)},${yScale(d.avg)})`)
    .attr("opacity", 0);

  // Outer glow ring on the peak dot
  dotGroup.filter(d => d.label === "High")
    .append("circle")
    .attr("r", 11)
    .attr("fill", "none")
    .attr("stroke", "#0aff94")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.3);

  dotGroup.append("circle")
    .attr("r", 5.5)
    .attr("fill", d => d.label === "High" ? "#0aff94" : d.color)
    .attr("stroke", "#161925")
    .attr("stroke-width", 2);

  // Value labels above each dot
  dotGroup.append("text")
    .attr("y", -16)
    .attr("text-anchor", "middle")
    .attr("fill", d => d.label === "High" ? "#ffffff" : "rgba(255,255,255,0.4)")
    .attr("font-family", "Inter, sans-serif")
    .attr("font-size", d => d.label === "High" ? "12px" : "10px")
    .attr("font-weight", d => d.label === "High" ? "500" : "300")
    .text(d => siFormat(d.avg));


  // Axis caption
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", totalH - 6)
    .attr("fill", "rgba(255,255,255,0.18)")
    .attr("font-family", "Inter, sans-serif")
    .attr("font-size", "10px")
    .text("Average Spotify streams by TikTok activity tier");

  // Entrance animation
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      // Sweep the clip path left → right to reveal line + area
      d3.select("#success-clip rect")
        .transition().duration(1300).ease(d3.easeCubicInOut)
        .attr("width", chartW + 20);
      // Dots stagger in after the line passes them
      dotGroup.each(function(_d, i) {
        d3.select(this)
          .transition().delay(400 + i * 150).duration(350)
          .attr("opacity", 1);
      });
    }
  }, { threshold: 0.2 });
  observer.observe(container);
}
