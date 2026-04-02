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

  const songs = raw.map(d => ({
    track:          d["Track"],
    artist:         d["Artist"],
    spotify:        parseNum(d["Spotify Streams"]),
    tiktokPosts:    parseNum(d["TikTok Posts"]),
    tiktokViews:    parseNum(d["TikTok Views"]),
    tiktokLikes:    parseNum(d["TikTok Likes"]),
    popularity:     parseNum(d["Spotify Popularity"]),
  }));

  buildScatterplot(songs);
  buildTrendsChart(songs);
  buildTopSongsChart(songs);
  buildArtistsChart(songs);
  buildOutlierCharts(songs);
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
  expandBtn.textContent = "⛶ Expand";
  expandBtn.className = "chart-expand-btn";
  btnWrap.appendChild(expandBtn);
  container.parentElement.insertBefore(btnWrap, container);

  // Draw inline chart with animation on scroll-into-view
  const { svg, dots, x, y, iW, iH } = drawScatter("scatterplot", container.clientWidth || 580, data, slope, intercept, xDomainMin, xDomainMax, false, null, true);

  // Inline legend
  const legend = document.createElement("div");
  legend.className = "scatter-inline-legend";
  legend.innerHTML = `
    <span class="legend-item">
      <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#4a9eff" fill-opacity="0.85"/></svg>
      High popularity (70+)
    </span>
    <span class="legend-item">
      <svg width="12" height="12"><rect x="1" y="1" width="10" height="10" fill="#ff8c42" fill-opacity="0.85"/></svg>
      Mid popularity (40–70)
    </span>
    <span class="legend-item">
      <svg width="12" height="14"><polygon points="6,1 12,13 0,13" fill="#0aff94" fill-opacity="0.85"/></svg>
      Low popularity (&lt;40)
    </span>`;
  container.appendChild(legend);

  // Start invisible
  svg.style("opacity", 0);

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect(); // fire once only

    // Fade in the whole SVG
    svg.transition().duration(600).ease(d3.easeCubicOut).style("opacity", 1);

    // Animate dots from random positions to their real positions
    dots
      .attr("transform", () => `translate(${Math.random() * iW},${Math.random() * iH})`)
      .attr("fill-opacity", 0)
      .transition()
        .delay(() => 200 + Math.random() * 400)
        .duration(900)
        .ease(d3.easeElasticOut.amplitude(0.8).period(0.4))
        .attr("transform", d => `translate(${x(d.tiktokPosts)},${y(d.spotify)})`)
        .attr("fill-opacity", 0.65);
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
        <button class="chart-close-btn">✕ Close</button>
      </div>
      <div class="scatter-controls">
        <div class="scatter-search-wrap">
          <input id="scatter-search" type="text" placeholder="Search artist or song…" autocomplete="off">
          <button id="scatter-clear" class="scatter-clear hidden" aria-label="Clear search">✕</button>
          <ul id="scatter-suggestions" class="scatter-suggestions hidden"></ul>
        </div>
        <div class="scatter-filters">
          <span class="filter-label">Popularity</span>
          <button class="filter-btn active" data-tier="all">All</button>
          <button class="filter-btn" data-tier="high">High (70+)</button>
          <button class="filter-btn" data-tier="mid">Mid (40–70)</button>
          <button class="filter-btn" data-tier="low">Low (&lt;40)</button>
        </div>
        <div class="scatter-legend">
          <span class="legend-item"><svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#4a9eff" fill-opacity="0.85"/></svg> High (70+)</span>
          <span class="legend-item"><svg width="12" height="12"><rect x="1" y="1" width="10" height="10" fill="#ff8c42" fill-opacity="0.85"/></svg> Mid (40–70)</span>
          <span class="legend-item"><svg width="12" height="14"><polygon points="6,1 12,13 0,13" fill="#0aff94" fill-opacity="0.85"/></svg> Low (&lt;40)</span>
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
  let activeTier  = "all";
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
      const tierMatch = activeTier === "all" ||
        (activeTier === "high" && d.popularity >= 70) ||
        (activeTier === "mid"  && d.popularity >= 40 && d.popularity < 70) ||
        (activeTier === "low"  && d.popularity < 40);
      const q = searchQuery.toLowerCase();
      const searchMatch = q === "" ||
        d.track.toLowerCase().includes(q) ||
        d.artist.toLowerCase().includes(q);
      const matched = tierMatch && searchMatch;
      d3.select(this)
        .transition().duration(200)
        .attr("fill-opacity", matched ? 0.75 : 0.06)
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
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlay.classList.add("visible"));
  });

  // Filter buttons
  overlay.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      overlay.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTier = btn.dataset.tier;
      applyFilters();
    });
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

  // Build a unique list of "Track — Artist" entries for suggestions
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
      const label = `${d.track} <span class="suggestion-artist">— ${d.artist}</span>`;
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

  // Trend line — thick white + green glow
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

  // Trend label
  const trendLabel = chartG.append("text")
    .attr("text-anchor", "end")
    .attr("fill", "rgba(255,255,255,0.4)")
    .attr("font-size", "11px").attr("font-family", "Inter, sans-serif")
    .text("trend");

  function updateTrendLabel(xS, yS) {
    const ty1 = Math.pow(10, slope * Math.log10(xDomainMax) + intercept);
    trendLabel.attr("x", xS(xDomainMax) - 4).attr("y", yS(ty1) - 8);
  }
  updateTrendLabel(x, y);

  // Shape + color by popularity tier
  const symSize = zoomable ? 52 : 38;

  function tierOf(d) {
    if (d.popularity >= 70) return "high";
    if (d.popularity >= 40) return "mid";
    return "low";
  }

  function colorOf(d) {
    const t = tierOf(d);
    if (t === "high") return "#4a9eff";  // blue
    if (t === "mid")  return "#ff8c42";  // orange
    return "#0aff94";                    // green
  }

  function symbolOf(d) {
    const t = tierOf(d);
    if (t === "high") return d3.symbolCircle;
    if (t === "mid")  return d3.symbolSquare;
    return d3.symbolTriangle;
  }

  function pathOf(d) {
    return d3.symbol().type(symbolOf(d)).size(symSize)();
  }

  // Dots as SVG paths
  const dots = chartG.selectAll("path.dot").data(data).join("path")
    .attr("class", "dot")
    .attr("transform", d => `translate(${x(d.tiktokPosts)},${y(d.spotify)})`)
    .attr("d", d => pathOf(d))
    .attr("fill", d => colorOf(d))
    .attr("fill-opacity", 0.65)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1);
      showTooltip(event,
        `<strong style="color:${colorOf(d)}">${d.track}</strong><br>
         ${d.artist}<br>
         <span style="opacity:.7">TikTok Posts: ${siFormat(d.tiktokPosts)}</span><br>
         <span style="opacity:.7">TikTok Views: ${d.tiktokViews ? siFormat(d.tiktokViews) : "N/A"}</span><br>
         <span style="opacity:.7">Spotify Streams: ${siFormat(d.spotify)}</span><br>
         <span style="opacity:.7">Popularity: ${d.popularity ?? "N/A"}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("fill-opacity", 0.65).attr("stroke", "none");
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
      .scaleExtent([0.8, 40])
      .translateExtent([[0, 0], [iW, iH]])
      .on("zoom", (event) => {
        svg.style("cursor", event.transform.k > 1 ? "grabbing" : "grab");
        const xNew = event.transform.rescaleX(x);
        const yNew = event.transform.rescaleY(y);

        // Drop the filter while panning/zooming for performance
        trendLine.attr("filter", null);

        dots.attr("transform", d => `translate(${xNew(d.tiktokPosts)},${yNew(d.spotify)})`);
        renderAxes(xNew, yNew);
        updateTrendLine(xNew, yNew);
        updateTrendLabel(xNew, yNew);

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

  // Metrics available for toggle
  const metrics = {
    spotify:      { key: "spotify",     label: "Avg Spotify Streams",  color: "#0aff94" },
    tiktokViews:  { key: "tiktokViews", label: "Avg TikTok Views",     color: "#4a9eff" },
    tiktokLikes:  { key: "tiktokLikes", label: "Avg TikTok Likes",     color: "#ff8c42" },
  };
  let activeMetric = "spotify";

  function calcData(metricKey) {
    return bucketDefs.map(b => ({
      label: b.label,
      avg:   b.songs.length ? d3.mean(b.songs.filter(s => s[metricKey] > 0), s => s[metricKey]) || 0 : 0,
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

  // ── Metric toggle buttons ──
  const toggleWrap = document.createElement("div");
  toggleWrap.className = "trends-toggle";
  Object.entries(metrics).forEach(([key, meta]) => {
    const btn = document.createElement("button");
    btn.textContent = meta.label;
    btn.className = "trends-toggle-btn" + (key === activeMetric ? " active" : "");
    btn.dataset.metric = key;
    toggleWrap.appendChild(btn);
  });
  container.appendChild(toggleWrap);

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

  // ── Songs panel ──
  const panel = document.createElement("div");
  panel.className = "trends-songs-panel hidden";
  container.appendChild(panel);

  function showSongsPanel(d) {
    const top = d.songs
      .filter(s => s.spotify > 0)
      .sort((a, b) => b.spotify - a.spotify)
      .slice(0, 8);
    panel.innerHTML = `
      <div class="tsp-header">
        <span class="tsp-title">Top songs — <strong>${d.label}</strong> TikTok activity</span>
        <button class="tsp-close">✕</button>
      </div>
      <ul class="tsp-list">
        ${top.map(s => `
          <li>
            <span class="tsp-track">${truncate(s.track, 28)}</span>
            <span class="tsp-artist">${truncate(s.artist, 20)}</span>
            <span class="tsp-streams">${siFormat(s.spotify)}</span>
          </li>`).join("")}
      </ul>`;
    panel.classList.remove("hidden");
    panel.querySelector(".tsp-close").addEventListener("click", () => panel.classList.add("hidden"));
  }

  function redraw(metricKey, animate) {
    const data = calcData(metricKey);
    const meta = metrics[metricKey];

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

    yLabelG.text(meta.label);

    // Bars
    const bars = barsG.selectAll("rect").data(data).join("rect")
      .attr("x", d => x(d.label))
      .attr("width", x.bandwidth())
      .attr("fill", (_d, i) => barColors[i])
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8);
        const yPos = y(d.avg);
        crosshair.attr("y1", yPos).attr("y2", yPos).attr("opacity", 1);
        crosshairLabel
          .attr("x", -6).attr("y", yPos + 4)
          .text(siFormat(Math.round(d.avg))).attr("opacity", 1);
        showTooltip(event,
          `<strong style="color:${meta.color}">${d.label} TikTok activity</strong><br>
           <span style="opacity:.7">${meta.label}: ${siFormat(Math.round(d.avg))}</span><br>
           <span style="opacity:.7">Songs in group: ${d.count.toLocaleString()}</span><br>
           <span style="opacity:.6;font-size:11px">Click to see top songs</span>`
        );
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 1);
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
      bars.transition().duration(400).ease(d3.easeCubicOut)
        .attr("y", d => y(d.avg))
        .attr("height", d => iH - y(d.avg));
    }

    // Value labels
    valLabG.selectAll("text").data(data).join("text")
      .attr("x", d => x(d.label) + x.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("fill", tickFill)
      .attr("font-size", "11px")
      .attr("font-family", "Inter, sans-serif")
      .transition().duration(400)
      .attr("y", d => y(d.avg) - 8)
      .text(d => siFormat(Math.round(d.avg)));

    // Song count labels below X axis ticks
    cntLabG.selectAll("text").data(data).join("text")
      .attr("x", d => x(d.label) + x.bandwidth() / 2)
      .attr("y", iH + 46)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.25)")
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .text(d => `${d.count.toLocaleString()} songs`);
  }

  // Initial draw — bars start at 0, animate on scroll into view
  redraw(activeMetric, false);
  svg.selectAll("rect").attr("y", iH).attr("height", 0);

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    redraw(activeMetric, true);
  }, { threshold: 0.2 });
  observer.observe(container);

  // Toggle buttons
  toggleWrap.addEventListener("click", e => {
    const btn = e.target.closest(".trends-toggle-btn");
    if (!btn) return;
    activeMetric = btn.dataset.metric;
    toggleWrap.querySelectorAll(".trends-toggle-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    panel.classList.add("hidden");
    redraw(activeMetric, false);
  });
}

// ─── 3. Top Songs: Top 15 by Spotify Streams (horizontal bar) ──────────────

function buildTopSongsChart(songs) {
  const allData = songs
    .filter(d => d.spotify > 0)
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 15);

  function tiktokTierColor(d) {
    const p = d.tiktokPosts || 0;
    if (p === 0)       return "#3a4256";
    if (p <= 100000)   return "#2a6e5a";
    if (p <= 1000000)  return "#1a9e72";
    if (p <= 10000000) return "#0adf88";
    return "#ffffff";
  }

  function tiktokTierLabel(d) {
    const p = d.tiktokPosts || 0;
    if (p === 0)       return "No TikTok";
    if (p <= 100000)   return "Low";
    if (p <= 1000000)  return "Medium";
    if (p <= 10000000) return "High";
    return "Viral";
  }

  function tiktokTierKey(d) {
    const p = d.tiktokPosts || 0;
    if (p === 0)       return "none";
    if (p <= 100000)   return "low";
    if (p <= 1000000)  return "medium";
    if (p <= 10000000) return "high";
    return "viral";
  }

  const container = document.getElementById("top-songs-chart");
  const width  = container.clientWidth || window.innerWidth;
  const height = Math.round(width * 0.52);
  const m = { top: 24, right: 0, bottom: 56, left: 0 };
  const iW = width;
  const iH = height - m.top - m.bottom;

  // ── Sort toggle ──
  const sortWrap = document.createElement("div");
  sortWrap.className = "ts-sort-wrap";
  sortWrap.innerHTML = `
    <span class="ts-sort-label">Sort by</span>
    <button class="ts-sort-btn active" data-sort="streams">Streams</button>
    <button class="ts-sort-btn" data-sort="tiktok">TikTok Activity</button>`;
  container.parentElement.insertBefore(sortWrap, container);

  let activeSort  = "streams";
  let activeTier  = "all";
  let hasAnimated = false;

  const svg = d3.select("#top-songs-chart").append("svg")
    .attr("width", width).attr("height", height)
    .style("display", "block");

  const g = svg.append("g").attr("transform", `translate(0,${m.top})`);

  const x = d3.scaleBand().range([0, iW]).padding(0.08);
  const y = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d.spotify) * 1.1])
    .range([iH, 0]);

  const tickFill   = "rgba(0,0,0,0.45)";
  const axisStroke = "rgba(0,0,0,0.15)";

  // Grid
  g.append("g")
    .call(d3.axisLeft(y).ticks(4).tickSize(-iW).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", "rgba(0,0,0,0.08)"));

  // Y axis label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -iH / 2).attr("y", 14)
    .attr("text-anchor", "middle")
    .attr("fill", tickFill)
    .attr("font-size", "11px")
    .attr("font-family", "Inter, sans-serif")
    .text("Spotify Streams");

  const barsG    = g.append("g");
  const valLabG  = g.append("g");
  const xAxisG   = g.append("g").attr("transform", `translate(0,${iH})`);

  function getSortedData() {
    return [...allData].sort((a, b) =>
      activeSort === "streams"
        ? b.spotify - a.spotify
        : (b.tiktokPosts || 0) - (a.tiktokPosts || 0)
    );
  }

  function redraw(animate) {
    const data = getSortedData();
    x.domain(data.map(d => d.track));

    // X axis song labels
    xAxisG.call(d3.axisBottom(x).tickSize(3))
      .call(ax => ax.select(".domain").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
      .call(ax => ax.selectAll("text")
        .attr("fill", tickFill)
        .attr("font-size", "10px")
        .attr("font-family", "Inter, sans-serif")
        .attr("dy", "1.2em")
        .text(d => truncate(d, 14)));

    // Bars
    const bars = barsG.selectAll("rect.ts-bar").data(data, d => d.track).join(
      enter => enter.append("rect").attr("class", "ts-bar")
        .attr("y", iH).attr("height", 0)
        .attr("rx", 3),
      update => update,
      exit => exit.remove()
    )
      .attr("width", x.bandwidth())
      .attr("fill", d => tiktokTierColor(d))
      .on("mouseover", function (_event, d) {
        // Dim all others
        barsG.selectAll("rect.ts-bar").attr("fill-opacity", b => b.track === d.track ? 1 : 0.25);
        valLabG.selectAll("text.ts-val").attr("opacity", b => b.track === d.track ? 1 : 0.2);
        showTooltip(_event,
          `<strong style="color:#0aff94">${d.track}</strong><br>
           ${d.artist}<br>
           <span style="opacity:.7">Spotify Streams: ${siFormat(d.spotify)}</span><br>
           <span style="opacity:.7">TikTok Posts: ${d.tiktokPosts ? siFormat(d.tiktokPosts) : "None"}</span><br>
           <span style="opacity:.7">TikTok Tier: ${tiktokTierLabel(d)}</span>`
        );
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function () {
        applyTierFilter();
        hideTooltip();
      });

    if (animate) {
      bars.transition().duration(600).ease(d3.easeCubicOut)
        .attr("x", d => x(d.track))
        .attr("y", d => y(d.spotify))
        .attr("height", d => iH - y(d.spotify));
    } else {
      bars.attr("x", d => x(d.track))
        .attr("y", iH).attr("height", 0)
        .transition().delay((_d, i) => i * 55).duration(650).ease(d3.easeCubicOut)
        .attr("y", d => y(d.spotify))
        .attr("height", d => iH - y(d.spotify));
    }

    // Value labels
    const vals = valLabG.selectAll("text.ts-val").data(data, d => d.track).join(
      enter => enter.append("text").attr("class", "ts-val")
        .attr("y", iH + 20).attr("opacity", 0),
      update => update,
      exit => exit.remove()
    )
      .attr("text-anchor", "middle")
      .attr("fill", tickFill)
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .text(d => siFormat(d.spotify));

    if (animate) {
      vals.transition().duration(600).ease(d3.easeCubicOut)
        .attr("x", d => x(d.track) + x.bandwidth() / 2)
        .attr("y", d => y(d.spotify) - 6)
        .attr("opacity", 1);
    } else {
      vals.attr("x", d => x(d.track) + x.bandwidth() / 2)
        .transition().delay((_d, i) => i * 55 + 550).duration(300)
        .attr("y", d => y(d.spotify) - 6)
        .attr("opacity", 1);
    }
  }

  function applyTierFilter() {
    barsG.selectAll("rect.ts-bar").attr("fill-opacity", d =>
      activeTier === "all" || tiktokTierKey(d) === activeTier ? 0.82 : 0.15
    );
    valLabG.selectAll("text.ts-val").attr("opacity", d =>
      activeTier === "all" || tiktokTierKey(d) === activeTier ? 1 : 0.2
    );
  }

  // ── Legend click → tier filter ──
  const section = document.getElementById("top-songs");
  section.querySelectorAll(".ts-legend-item").forEach(item => {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      const tier = item.dataset.tier;
      activeTier = activeTier === tier ? "all" : tier;
      section.querySelectorAll(".ts-legend-item").forEach(el =>
        el.classList.toggle("ts-legend-active", el.dataset.tier === activeTier)
      );
      applyTierFilter();
    });
  });

  // ── Sort toggle ──
  sortWrap.addEventListener("click", e => {
    const btn = e.target.closest(".ts-sort-btn");
    if (!btn) return;
    activeSort = btn.dataset.sort;
    sortWrap.querySelectorAll(".ts-sort-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    redraw(true);
  });

  // ── Scroll entrance animation (once) ──
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting || hasAnimated) return;
    hasAnimated = true;
    observer.disconnect();
    redraw(false);
  }, { threshold: 0.15 });

  observer.observe(container);
}

// ─── 4. Artists: Top 15 by Spotify Streams (horizontal bar) ────────────────

function buildArtistsChart(songs) {
  const byArtist = d3.rollups(
    songs.filter(d => d.spotify > 0),
    v => d3.sum(v, d => d.spotify),
    d => d.artist
  ).map(([artist, streams]) => ({ artist, streams }))
    .sort((a, b) => b.streams - a.streams)
    .slice(0, 15);

  const container = document.getElementById("artists-chart");
  const width  = container.clientWidth || 580;
  const height = Math.round(width * 0.9);
  const m = { top: 20, right: 70, bottom: 50, left: 130 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  const svg = d3.select("#artists-chart").append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(byArtist, d => d.streams) * 1.1])
    .range([0, iW]);

  const y = d3.scaleBand()
    .domain(byArtist.map(d => d.artist))
    .range([0, iH])
    .padding(0.3);

  const axisStroke = "rgba(255,255,255,0.3)";
  const tickFill   = "rgba(255,255,255,0.45)";

  // Grid
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-iH).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", "rgba(255,255,255,0.06)"));

  // Bars
  g.selectAll("rect").data(byArtist).join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.artist))
    .attr("width", d => x(d.streams))
    .attr("height", y.bandwidth())
    .attr("fill", "#0aff94")
    .attr("fill-opacity", 0.85)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", 1);
      showTooltip(event,
        `<strong style="color:#0aff94">${d.artist}</strong><br>
         <span style="opacity:.7">Total Streams: ${siFormat(d.streams)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("fill-opacity", 0.85);
      hideTooltip();
    });

  // Value labels
  g.selectAll(".bar-label").data(byArtist).join("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.streams) + 5)
    .attr("y", d => y(d.artist) + y.bandwidth() / 2 + 4)
    .attr("fill", tickFill)
    .attr("font-size", "11px")
    .attr("font-family", "Inter, sans-serif")
    .text(d => siFormat(d.streams));

  // Y axis
  g.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
      .attr("dx", "-8")
      .text(d => truncate(d, 18)));

  // X axis
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(siFormat))
    .call(ax => ax.select(".domain").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));

  g.append("text").attr("x", iW / 2).attr("y", iH + 42)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("Total Spotify Streams");
}

// ─── 5. Outliers: two side-by-side charts ──────────────────────────────────

function buildOutlierCharts(songs) {
  // Chart 1: Viral on TikTok but low Spotify streams
  // High tiktokViews, spotify < median
  const withBoth = songs.filter(d => d.tiktokViews > 0 && d.spotify > 0);
  const medianSpotify = d3.median(withBoth, d => d.spotify);

  const viralLowSpotify = withBoth
    .filter(d => d.spotify < medianSpotify)
    .sort((a, b) => b.tiktokViews - a.tiktokViews)
    .slice(0, 10);

  // Chart 2: High Spotify streams but no TikTok presence
  const streamedNoTiktok = songs
    .filter(d => d.spotify > 0 && (d.tiktokPosts === null || d.tiktokPosts === 0))
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 10);

  buildOutlierBar("outlier-chart-1", viralLowSpotify, "tiktokViews", "TikTok Views", "Viral but understreamed");
  buildOutlierBar("outlier-chart-2", streamedNoTiktok, "spotify",    "Spotify Streams", "Streamed but not viral");
}

function buildOutlierBar(containerId, data, valueKey, axisLabel, subtitle) {
  const container = document.getElementById(containerId);
  const width  = container.clientWidth || 480;
  const height = Math.round(width * 1.1);
  const m = { top: 30, right: 70, bottom: 50, left: 130 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  const svg = d3.select(`#${containerId}`).append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "visible");

  // Subtitle
  svg.append("text")
    .attr("x", m.left)
    .attr("y", 18)
    .attr("fill", "rgba(255,255,255,0.4)")
    .attr("font-size", "12px")
    .attr("font-family", "Inter, sans-serif")
    .text(subtitle);

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[valueKey]) * 1.1])
    .range([0, iW]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.track))
    .range([0, iH])
    .padding(0.3);

  const axisStroke = "rgba(255,255,255,0.3)";
  const tickFill   = "rgba(255,255,255,0.45)";
  const barColor   = valueKey === "tiktokViews" ? "#ff4d6d" : "#0aff94";

  // Grid
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(4).tickSize(-iH).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", "rgba(255,255,255,0.06)"));

  // Bars
  g.selectAll("rect").data(data).join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.track))
    .attr("width", d => x(d[valueKey]))
    .attr("height", y.bandwidth())
    .attr("fill", barColor)
    .attr("fill-opacity", 0.8)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", 1);
      showTooltip(event,
        `<strong style="color:${barColor}">${d.track}</strong><br>
         ${d.artist}<br>
         <span style="opacity:.7">${axisLabel}: ${siFormat(d[valueKey])}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("fill-opacity", 0.8);
      hideTooltip();
    });

  // Value labels
  g.selectAll(".bar-label").data(data).join("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d[valueKey]) + 5)
    .attr("y", d => y(d.track) + y.bandwidth() / 2 + 4)
    .attr("fill", tickFill)
    .attr("font-size", "10px")
    .attr("font-family", "Inter, sans-serif")
    .text(d => siFormat(d[valueKey]));

  // Y axis
  g.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif")
      .attr("dx", "-8")
      .text(d => truncate(d, 18)));

  // X axis
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(siFormat))
    .call(ax => ax.select(".domain").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));

  g.append("text").attr("x", iW / 2).attr("y", iH + 42)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text(axisLabel);
}
