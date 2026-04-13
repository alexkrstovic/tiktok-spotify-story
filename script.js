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

  const parsed = raw.map(d => {
    const dateParts = (d["Release Date"] || "").split("/");
    const releaseYear = dateParts.length === 3 ? parseInt(dateParts[2]) : null;
    return {
      track:          d["Track"],
      artist:         d["Artist"],
      spotify:        parseNum(d["Spotify Streams"]),
      tiktokPosts:    parseNum(d["TikTok Posts"]),
      tiktokViews:    parseNum(d["TikTok Views"]),
      tiktokLikes:    parseNum(d["TikTok Likes"]),
      popularity:     parseNum(d["Spotify Popularity"]),
      releaseYear,
    };
  });

  // Deduplicate: same track+artist can appear multiple times with incomplete data.
  // Keep the entry with the highest Spotify stream count - it consistently has the most complete data.
  const deduped = Array.from(
    d3.rollup(
      parsed,
      v => v.reduce((best, d) => d.spotify > best.spotify ? d : best),
      d => `${d.track}||${d.artist}`
    ).values()
  );

  // Drop songs whose title or artist contains encoding artifacts
  // Catches both U+FFFD (replacement char) and runs of U+00FD (ý) from latin-1 misread as UTF-8
  const isGarbled = str => str.includes('\uFFFD') || (str.match(/\u00fd/g) || []).length > 2;
  const songs = deduped.filter(d => !isGarbled(d.track) && !isGarbled(d.artist));

  buildScatterplot(songs);
  buildTrendsChart(songs);
  buildNostalgiaChart(songs);
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

// ─── 3b. Nostalgia: TikTok views by release year ────────────────────────────

function buildNostalgiaChart(songs) {
  const TIKTOK_LAUNCH = 2018;
  const MIN_VIEWS = 500_000_000; // 500M minimum to keep chart readable

  const data = songs
    .filter(d => d.tiktokViews >= MIN_VIEWS && d.releaseYear && d.releaseYear >= 1985 && d.releaseYear <= 2024)
    .sort((a, b) => b.tiktokViews - a.tiktokViews);

  // Top pre-TikTok songs to label
  const toLabel = data
    .filter(d => d.releaseYear < TIKTOK_LAUNCH)
    .slice(0, 5);

  const container = document.getElementById("nostalgia-chart");
  const totalW = container.clientWidth || 520;
  const margin = { top: 20, right: 20, bottom: 48, left: 20 };
  const chartW = totalW - margin.left - margin.right;
  const chartH = 300;
  const totalH = chartH + margin.top + margin.bottom;

  const xScale = d3.scaleLinear()
    .domain([1985, 2024])
    .range([0, chartW]);

  const yScale = d3.scaleLog()
    .domain([MIN_VIEWS * 0.8, d3.max(data, d => d.tiktokViews) * 1.3])
    .range([chartH, 0]);

  const svg = d3.select("#nostalgia-chart").append("svg")
    .attr("width", totalW).attr("height", totalH);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // TikTok launch reference line
  g.append("line")
    .attr("x1", xScale(TIKTOK_LAUNCH)).attr("x2", xScale(TIKTOK_LAUNCH))
    .attr("y1", 0).attr("y2", chartH)
    .attr("stroke", "rgba(255,255,255,0.15)")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,4");

  g.append("text")
    .attr("x", xScale(TIKTOK_LAUNCH) + 6).attr("y", 12)
    .attr("fill", "rgba(255,255,255,0.25)")
    .attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif")
    .text("TikTok launches");

  // Dots
  g.selectAll(".n-dot")
    .data(data)
    .join("circle")
    .attr("class", "n-dot")
    .attr("cx", d => xScale(d.releaseYear))
    .attr("cy", d => yScale(d.tiktokViews))
    .attr("r", 5)
    .attr("fill", d => d.releaseYear < TIKTOK_LAUNCH ? "#0aff94" : "rgba(255,255,255,0.18)")
    .attr("opacity", 0)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("r", 7);
      showTooltip(event,
        `<strong style="color:#0aff94">${d.track}</strong><br>
         ${d.artist}<br>
         <span style="opacity:.7">Released: ${d.releaseYear}</span><br>
         <span style="opacity:.7">TikTok Views: ${siFormat(d.tiktokViews)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this).attr("r", 5);
      hideTooltip();
    });

  // Labels for top pre-TikTok songs
  toLabel.forEach(d => {
    g.append("text")
      .attr("x", xScale(d.releaseYear))
      .attr("y", yScale(d.tiktokViews) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("opacity", 0)
      .attr("class", "n-label")
      .text(truncate(d.track, 20));
  });

  // X axis — year ticks
  g.append("g").attr("transform", `translate(0,${chartH})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8).tickSize(0))
    .call(ax => ax.select(".domain").attr("stroke", "rgba(255,255,255,0.1)"))
    .call(ax => ax.selectAll("text")
      .attr("fill", "rgba(255,255,255,0.35)")
      .attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif")
      .attr("dy", "1.2em"));

  // Legend
  const leg = svg.append("g").attr("transform", `translate(${margin.left}, ${totalH - 12})`);
  leg.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 4).attr("fill", "#0aff94");
  leg.append("text").attr("x", 10).attr("y", 0).attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.4)").attr("font-size", "10px").attr("font-family", "Inter, sans-serif")
    .text("Released before TikTok");
  leg.append("circle").attr("cx", 155).attr("cy", 0).attr("r", 4).attr("fill", "rgba(255,255,255,0.25)");
  leg.append("text").attr("x", 165).attr("y", 0).attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.4)").attr("font-size", "10px").attr("font-family", "Inter, sans-serif")
    .text("Released after TikTok");

  // Entrance animation
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      g.selectAll(".n-dot")
        .transition().delay((_d, i) => i * 8).duration(400).ease(d3.easeCubicOut)
        .attr("opacity", 1);
      g.selectAll(".n-label")
        .transition().delay(400).duration(400)
        .attr("opacity", 1);
    }
  }, { threshold: 0.2 });
  observer.observe(container);
}

// ─── 3c. Top Songs ───────────────────────────────────────────────────────────

function buildTopSongsChart(songs) {
  const data = songs
    .filter(d => d.spotify > 0)
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 10);

  const container = document.getElementById("top-songs-chart");
  const totalW = container.getBoundingClientRect().width || (window.innerWidth - 80);
  const margin = { top: 20, right: 60, bottom: 80, left: 60 };
  const chartW = totalW - margin.left - margin.right;
  const chartH = 320;
  const totalH = chartH + margin.top + margin.bottom;

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.track))
    .range([0, chartW])
    .padding(0.3);

  const ySpotify = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.spotify) * 1.1])
    .range([chartH, 0]);

  const yTikTok = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.tiktokViews || 0) * 1.1])
    .range([chartH, 0]);

  const svg = d3.select("#top-songs-chart").append("svg")
    .attr("width", totalW).attr("height", totalH);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Subtle grid lines
  g.selectAll(".ts-grid")
    .data(ySpotify.ticks(5))
    .join("line")
    .attr("class", "ts-grid")
    .attr("x1", 0).attr("x2", chartW)
    .attr("y1", d => ySpotify(d)).attr("y2", d => ySpotify(d))
    .attr("stroke", "rgba(0,0,0,0.08)").attr("stroke-width", 1);

  // Spotify bars
  g.selectAll(".ts-bar")
    .data(data)
    .join("rect")
    .attr("class", "ts-bar")
    .attr("x", d => xScale(d.track))
    .attr("y", chartH)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("fill", "#001409")
    .attr("rx", 2)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill-opacity", 0.7);
      showTooltip(event,
        `<strong>${d.track}</strong><br>${d.artist}<br>
         <span style="opacity:.7">Spotify Streams: ${siFormat(d.spotify)}</span><br>
         <span style="opacity:.7">TikTok Views: ${d.tiktokViews ? siFormat(d.tiktokViews) : "None"}</span>`);
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() { d3.select(this).attr("fill-opacity", 1); hideTooltip(); });

  // TikTok line (drawn after bars so it sits on top)
  const lineGen = d3.line()
    .x(d => xScale(d.track) + xScale.bandwidth() / 2)
    .y(d => yTikTok(d.tiktokViews || 0))
    .curve(d3.curveMonotoneX);

  // Clip path to animate line left-to-right
  svg.append("defs").append("clipPath").attr("id", "ts-line-clip")
    .append("rect")
    .attr("x", 0).attr("y", -margin.top)
    .attr("width", 0)
    .attr("height", chartH + margin.top + 10);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#007A33")
    .attr("stroke-width", 2.5)
    .attr("stroke-linecap", "round")
    .attr("clip-path", "url(#ts-line-clip)")
    .attr("d", lineGen);

  // TikTok dots
  g.selectAll(".ts-dot")
    .data(data)
    .join("circle")
    .attr("class", "ts-dot")
    .attr("cx", d => xScale(d.track) + xScale.bandwidth() / 2)
    .attr("cy", d => yTikTok(d.tiktokViews || 0))
    .attr("r", 4)
    .attr("fill", "#007A33")
    .attr("stroke", "#0aff94")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("r", 6);
      showTooltip(event,
        `<strong>${d.track}</strong><br>${d.artist}<br>
         <span style="opacity:.7">TikTok Views: ${d.tiktokViews ? siFormat(d.tiktokViews) : "None"}</span>`);
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() { d3.select(this).attr("r", 4); hideTooltip(); });

  // Left Y axis — Spotify
  g.append("g")
    .call(d3.axisLeft(ySpotify).ticks(5).tickFormat(siFormat).tickSize(0))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("text")
      .attr("fill", "rgba(0,0,0,0.45)").attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif").attr("dx", "-6"));

  // Left axis label
  svg.append("text")
    .attr("transform", `translate(14, ${margin.top + chartH / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(0,0,0,0.4)").attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif")
    .text("Spotify Streams");

  // Right Y axis — TikTok
  g.append("g")
    .attr("transform", `translate(${chartW},0)`)
    .call(d3.axisRight(yTikTok).ticks(5).tickFormat(siFormat).tickSize(0))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("text")
      .attr("fill", "rgba(0,0,0,0.45)").attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif").attr("dx", "6"));

  // Right axis label
  svg.append("text")
    .attr("transform", `translate(${totalW - 14}, ${margin.top + chartH / 2}) rotate(90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(0,0,0,0.4)").attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif")
    .text("TikTok Views");

  // X axis — song names
  g.append("g")
    .attr("transform", `translate(0,${chartH})`)
    .call(d3.axisBottom(xScale).tickSize(0))
    .call(ax => ax.select(".domain").attr("stroke", "rgba(0,0,0,0.15)"))
    .call(ax => ax.selectAll("text")
      .attr("fill", "rgba(0,0,0,0.6)").attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-38) translate(-6, 0)")
      .text(d => truncate(d, 18)));

  // Legend
  const leg = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${totalH - 14})`);
  leg.append("rect").attr("x", 0).attr("y", -5)
    .attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", "#001409");
  leg.append("text").attr("x", 16).attr("y", 1)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(0,0,0,0.5)").attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif").text("Spotify Streams");
  leg.append("line").attr("x1", 120).attr("x2", 134)
    .attr("y1", 1).attr("y2", 1)
    .attr("stroke", "#007A33").attr("stroke-width", 2.5);
  leg.append("circle").attr("cx", 127).attr("cy", 1)
    .attr("r", 4).attr("fill", "#007A33").attr("stroke", "#0aff94").attr("stroke-width", 1.5);
  leg.append("text").attr("x", 140).attr("y", 1)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(0,0,0,0.5)").attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif").text("TikTok Views");

  // Entrance animation
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      g.selectAll(".ts-bar")
        .transition().delay((_d, i) => i * 55).duration(700).ease(d3.easeCubicOut)
        .attr("y", d => ySpotify(d.spotify))
        .attr("height", d => chartH - ySpotify(d.spotify));
      svg.select("#ts-line-clip rect")
        .transition().delay(300).duration(1000).ease(d3.easeCubicInOut)
        .attr("width", chartW);
      g.selectAll(".ts-dot")
        .transition().delay((_d, i) => i * 55 + 800).duration(300)
        .attr("opacity", 1);
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
  const minSpotify = 100_000;

  const withBoth = songs.filter(d => d.tiktokViews > 0 && d.spotify >= minSpotify);
  const medianTikTok  = d3.median(withBoth, d => d.tiktokViews);
  const medianSpotify = d3.median(withBoth, d => d.spotify);

  const viralLowSpotify = withBoth
    .filter(d => d.tiktokViews > medianTikTok && d.spotify < medianSpotify)
    .sort((a, b) => (b.tiktokViews / b.spotify) - (a.tiktokViews / a.spotify))
    .slice(0, 4)
    .map(d => ({ ...d, side: "left", value: d.tiktokViews }));

  const sortedSpotify = songs.filter(d => d.spotify >= minSpotify).map(d => d.spotify).sort(d3.ascending);
  const p75Spotify = d3.quantile(sortedSpotify, 0.75);
  const streamedNoTiktok = songs
    .filter(d => d.spotify > p75Spotify && (d.tiktokPosts === null || d.tiktokPosts === 0))
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 4)
    .map(d => ({ ...d, side: "right", value: d.spotify }));

  // Spotify giants on top, TikTok virals below
  buildDivergingLollipop(streamedNoTiktok, viralLowSpotify);
}

function buildDivergingLollipop(rightData, leftData) {
  const container = document.getElementById("outlier-chart-combined");
  if (!container) return;

  const totalW    = container.getBoundingClientRect().width || 800;
  const m         = { top: 72, right: 30, bottom: 24, left: 30 };
  const rowH      = 58;
  const labelColW = 220;
  const midX      = totalW / 2;
  const centerL   = midX - labelColW / 2;   // right edge of left plot
  const centerR   = midX + labelColW / 2;   // left  edge of right plot
  const leftPlotW = centerL - m.left;
  const rightPlotW = totalW - centerR - m.right;

  const nLeft  = leftData.length;   // TikTok virals  → extend left
  const nRight = rightData.length;  // Spotify giants  → extend right
  const iH     = (nLeft + nRight) * rowH;
  const svgH   = iH + m.top + m.bottom;

  const xLeft = d3.scaleLinear()
    .domain([0, d3.max(leftData,  d => d.tiktokViews) * 1.1])
    .range([0, leftPlotW]);

  const xRight = d3.scaleLinear()
    .domain([0, d3.max(rightData, d => d.spotify) * 1.1])
    .range([0, rightPlotW]);

  const leftColor  = "#ff4d6d";
  const leftStem   = "rgba(255,77,109,0.28)";
  const rightColor = "#0aff94";
  const rightStem  = "rgba(10,255,148,0.28)";
  const labelFill  = "rgba(255,255,255,0.65)";
  const valFill    = "rgba(255,255,255,0.45)";

  const svg = d3.select("#outlier-chart-combined").append("svg")
    .attr("width", totalW).attr("height", svgH)
    .style("overflow", "visible");

  // ── Column headers ──────────────────────────────────────────────────────────
  svg.append("text")
    .attr("x", centerL - 10).attr("y", m.top - 42)
    .attr("text-anchor", "end")
    .attr("fill", "rgba(255,255,255,0.32)")
    .attr("font-size", "11px").attr("font-family", "Inter, sans-serif")
    .attr("letter-spacing", "0.04em")
    .text("Viral on TikTok — ignored on Spotify");

  svg.append("text")
    .attr("x", centerR + 10).attr("y", m.top - 42)
    .attr("text-anchor", "start")
    .attr("fill", "rgba(255,255,255,0.32)")
    .attr("font-size", "11px").attr("font-family", "Inter, sans-serif")
    .attr("letter-spacing", "0.04em")
    .text("Billions of streams — zero TikTok posts");

  svg.append("text")
    .attr("x", centerL - 10).attr("y", m.top - 20)
    .attr("text-anchor", "end")
    .attr("fill", leftColor)
    .attr("font-size", "13px").attr("font-family", "Inter, sans-serif")
    .attr("font-weight", "600")
    .text("TikTok Views");

  svg.append("text")
    .attr("x", centerR + 10).attr("y", m.top - 20)
    .attr("text-anchor", "start")
    .attr("fill", rightColor)
    .attr("font-size", "13px").attr("font-family", "Inter, sans-serif")
    .attr("font-weight", "600")
    .text("Spotify Streams");

  const g = svg.append("g").attr("transform", `translate(0,${m.top})`);

  // Center spine
  g.append("line")
    .attr("x1", midX).attr("x2", midX)
    .attr("y1", 0).attr("y2", iH)
    .attr("stroke", "rgba(255,255,255,0.08)").attr("stroke-width", 1);

  // ── Left rows: TikTok virals ────────────────────────────────────────────────
  leftData.forEach((d, i) => {
    const cy = i * rowH + rowH / 2;

    // Row band
    if (i % 2 === 0) {
      g.append("rect")
        .attr("x", m.left).attr("y", i * rowH)
        .attr("width", totalW - m.left - m.right).attr("height", rowH)
        .attr("fill", "rgba(255,255,255,0.02)");
    }

    // Stem (starts at centerL, animates left)
    g.append("line")
      .attr("class", "dl-stem-left")
      .attr("x1", centerL).attr("x2", centerL)
      .attr("y1", cy).attr("y2", cy)
      .attr("stroke", leftStem).attr("stroke-width", 2);

    // Dot
    g.append("circle")
      .attr("class", "dl-dot-left")
      .attr("cx", centerL).attr("cy", cy)
      .attr("r", 8).attr("fill", leftColor).attr("fill-opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseover", function(event) {
        d3.select(this).attr("r", 10).attr("fill-opacity", 1);
        showTooltip(event,
          `<strong style="color:${leftColor}">${d.track}</strong><br>
           <span style="opacity:.7">${d.artist}</span><br>
           <span style="opacity:.6">TikTok Views: ${siFormat(d.tiktokViews)}</span><br>
           <span style="opacity:.5">Spotify Streams: ${siFormat(d.spotify)}</span>`);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function() {
        d3.select(this).attr("r", 8).attr("fill-opacity", 0.85);
        hideTooltip();
      });

    // Value label (left of dot, fades in after animation)
    g.append("text")
      .attr("class", "dl-val-left")
      .attr("x", centerL).attr("y", cy)
      .attr("dominant-baseline", "middle").attr("text-anchor", "end")
      .attr("fill", valFill).attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("dx", "-14").attr("opacity", 0)
      .text(siFormat(d.tiktokViews));

    // Song label (centered in label column)
    g.append("text")
      .attr("x", midX).attr("y", cy - 4)
      .attr("dominant-baseline", "middle").attr("text-anchor", "middle")
      .attr("fill", labelFill).attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif").attr("font-weight", "500")
      .text(truncate(d.track, 24));

    g.append("text")
      .attr("x", midX).attr("y", cy + 10)
      .attr("dominant-baseline", "middle").attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.3)").attr("font-size", "9px")
      .attr("font-family", "Inter, sans-serif")
      .text(truncate(d.artist, 24));
  });

  // Divider between the two groups
  g.append("line")
    .attr("x1", m.left + 20).attr("x2", totalW - m.right - 20)
    .attr("y1", nLeft * rowH).attr("y2", nLeft * rowH)
    .attr("stroke", "rgba(255,255,255,0.07)").attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,4");

  // ── Right rows: Spotify giants ──────────────────────────────────────────────
  rightData.forEach((d, i) => {
    const cy = (nLeft + i) * rowH + rowH / 2;

    if (i % 2 === 0) {
      g.append("rect")
        .attr("x", m.left).attr("y", (nLeft + i) * rowH)
        .attr("width", totalW - m.left - m.right).attr("height", rowH)
        .attr("fill", "rgba(255,255,255,0.02)");
    }

    g.append("line")
      .attr("class", "dl-stem-right")
      .attr("x1", centerR).attr("x2", centerR)
      .attr("y1", cy).attr("y2", cy)
      .attr("stroke", rightStem).attr("stroke-width", 2);

    g.append("circle")
      .attr("class", "dl-dot-right")
      .attr("cx", centerR).attr("cy", cy)
      .attr("r", 8).attr("fill", rightColor).attr("fill-opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseover", function(event) {
        d3.select(this).attr("r", 10).attr("fill-opacity", 1);
        showTooltip(event,
          `<strong style="color:${rightColor}">${d.track}</strong><br>
           <span style="opacity:.7">${d.artist}</span><br>
           <span style="opacity:.6">Spotify Streams: ${siFormat(d.spotify)}</span><br>
           <span style="opacity:.5">TikTok Posts: none</span>`);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function() {
        d3.select(this).attr("r", 8).attr("fill-opacity", 0.85);
        hideTooltip();
      });

    g.append("text")
      .attr("class", "dl-val-right")
      .attr("x", centerR).attr("y", cy)
      .attr("dominant-baseline", "middle").attr("text-anchor", "start")
      .attr("fill", valFill).attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("dx", "14").attr("opacity", 0)
      .text(siFormat(d.spotify));

    g.append("text")
      .attr("x", midX).attr("y", cy - 4)
      .attr("dominant-baseline", "middle").attr("text-anchor", "middle")
      .attr("fill", labelFill).attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif").attr("font-weight", "500")
      .text(truncate(d.track, 24));

    g.append("text")
      .attr("x", midX).attr("y", cy + 10)
      .attr("dominant-baseline", "middle").attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.3)").attr("font-size", "9px")
      .attr("font-family", "Inter, sans-serif")
      .text(truncate(d.artist, 24));
  });

  // ── Entrance animation ──────────────────────────────────────────────────────
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || animated) return;
    animated = true;

    g.selectAll(".dl-stem-left").each(function(_, i) {
      d3.select(this)
        .transition().delay(i * 90).duration(700).ease(d3.easeCubicOut)
        .attr("x2", centerL - xLeft(leftData[i].tiktokViews));
    });
    g.selectAll(".dl-dot-left").each(function(_, i) {
      d3.select(this)
        .transition().delay(i * 90 + 60).duration(700).ease(d3.easeCubicOut)
        .attr("cx", centerL - xLeft(leftData[i].tiktokViews));
    });
    g.selectAll(".dl-val-left").each(function(_, i) {
      d3.select(this)
        .attr("x", centerL - xLeft(leftData[i].tiktokViews))
        .transition().delay(i * 90 + 680).duration(220)
        .attr("opacity", 1);
    });

    g.selectAll(".dl-stem-right").each(function(_, i) {
      d3.select(this)
        .transition().delay(i * 90).duration(700).ease(d3.easeCubicOut)
        .attr("x2", centerR + xRight(rightData[i].spotify));
    });
    g.selectAll(".dl-dot-right").each(function(_, i) {
      d3.select(this)
        .transition().delay(i * 90 + 60).duration(700).ease(d3.easeCubicOut)
        .attr("cx", centerR + xRight(rightData[i].spotify));
    });
    g.selectAll(".dl-val-right").each(function(_, i) {
      d3.select(this)
        .attr("x", centerR + xRight(rightData[i].spotify))
        .transition().delay(i * 90 + 680).duration(220)
        .attr("opacity", 1);
    });
  }, { threshold: 0.15 });
  observer.observe(container);
}

function buildOutlierBar(containerId, data, valueKey, axisLabel) {
  const container = document.getElementById(containerId);
  const width  = container.clientWidth || 480;
  const m = { top: 10, right: 70, bottom: 50, left: 150 };
  const iW = width - m.left - m.right;
  const rowH = 44;
  const iH = data.length * rowH;
  const height = iH + m.top + m.bottom;

  const dotColor  = valueKey === "tiktokViews" ? "#ff4d6d" : "#0aff94";
  const stemColor = valueKey === "tiktokViews" ? "rgba(255,77,109,0.35)" : "rgba(10,255,148,0.35)";
  const tickFill  = "rgba(255,255,255,0.45)";

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[valueKey]) * 1.08])
    .range([0, iW]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.track))
    .range([0, iH])
    .padding(0.3);

  const svg = d3.select(`#${containerId}`).append("svg")
    .attr("width", width).attr("height", height);

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  // Subtle vertical grid lines
  g.selectAll(".o-grid")
    .data(x.ticks(4))
    .join("line")
    .attr("class", "o-grid")
    .attr("x1", d => x(d)).attr("x2", d => x(d))
    .attr("y1", 0).attr("y2", iH)
    .attr("stroke", "rgba(255,255,255,0.06)").attr("stroke-width", 1);

  // Lollipop stems (start at x=0, animate to full length)
  g.selectAll(".o-stem").data(data).join("line")
    .attr("class", "o-stem")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", d => y(d.track) + y.bandwidth() / 2)
    .attr("y2", d => y(d.track) + y.bandwidth() / 2)
    .attr("stroke", stemColor)
    .attr("stroke-width", 2);

  // Lollipop dots (start at x=0, animate to position)
  g.selectAll(".o-dot").data(data).join("circle")
    .attr("class", "o-dot")
    .attr("cx", 0)
    .attr("cy", d => y(d.track) + y.bandwidth() / 2)
    .attr("r", 8)
    .attr("fill", dotColor)
    .attr("fill-opacity", 0.85)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("r", 10).attr("fill-opacity", 1);
      const extra = valueKey === "tiktokViews"
        ? `<br><span style="opacity:.6">Spotify Streams: ${siFormat(d.spotify)}</span>`
        : `<br><span style="opacity:.6">TikTok Posts: none</span>`;
      showTooltip(event,
        `<strong style="color:${dotColor}">${d.track}</strong><br>
         <span style="opacity:.7">${d.artist}</span><br>
         <span style="opacity:.6">${axisLabel}: ${siFormat(d[valueKey])}</span>${extra}`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this).attr("r", 8).attr("fill-opacity", 0.85);
      hideTooltip();
    });

  // Value labels — appear to the right of each dot
  g.selectAll(".o-val").data(data).join("text")
    .attr("class", "o-val")
    .attr("x", 0)
    .attr("y", d => y(d.track) + y.bandwidth() / 2)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(255,255,255,0.55)")
    .attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif")
    .attr("opacity", 0)
    .text(d => siFormat(d[valueKey]));

  // Y axis — track names
  g.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif")
      .attr("dx", "-10")
      .text(d => truncate(d, 20))
      .append("title").text(d => d));

  // X axis
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(siFormat).tickSize(0))
    .call(ax => ax.select(".domain").attr("stroke", "rgba(255,255,255,0.15)"))
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif").attr("dy", "1.2em"));

  // Caption above the chart
  if (data.length > 0) {
    const top = data[0];
    const captionText = valueKey === "tiktokViews"
      ? `Top: ${siFormat(top.tiktokViews)} TikTok views - only ${siFormat(top.spotify)} Spotify streams`
      : `Top: ${siFormat(top.spotify)} Spotify streams - zero TikTok posts`;
    const caption = document.createElement("p");
    caption.className = "outlier-chart-caption";
    caption.textContent = captionText;
    container.insertBefore(caption, container.firstChild);
  }

  // Entrance animation
  let animated = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      g.selectAll(".o-stem").each(function(d, i) {
        d3.select(this)
          .transition().delay(i * 70).duration(700).ease(d3.easeCubicOut)
          .attr("x2", x(d[valueKey]));
      });
      g.selectAll(".o-dot").each(function(d, i) {
        d3.select(this)
          .transition().delay(i * 70 + 50).duration(700).ease(d3.easeCubicOut)
          .attr("cx", x(d[valueKey]));
      });
      g.selectAll(".o-val").each(function(d, i) {
        d3.select(this)
          .transition().delay(i * 70 + 650).duration(250)
          .attr("x", x(d[valueKey]) + 13)
          .attr("opacity", 1);
      });
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
`;

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
