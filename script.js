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
  .style("z-index", "200");

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

  const container = document.getElementById("scatterplot");
  const width  = container.clientWidth || 580;
  const height = Math.round(width * 0.72);
  const m = { top: 20, right: 20, bottom: 58, left: 68 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  const svg = d3.select("#scatterplot").append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLog()
    .domain([1, d3.max(data, d => d.tiktokPosts) * 1.2])
    .range([0, iW]);

  const y = d3.scaleLog()
    .domain([10000, d3.max(data, d => d.spotify) * 1.2])
    .range([iH, 0]);

  const gridStroke = "rgba(255,255,255,0.06)";
  const axisStroke = "rgba(255,255,255,0.3)";
  const tickFill   = "rgba(255,255,255,0.45)";

  // Grid
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-iH).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", gridStroke));

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSize(-iW).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", gridStroke));

  // Axes
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(siFormat))
    .call(ax => ax.select(".domain").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(siFormat))
    .call(ax => ax.select(".domain").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));

  // Axis labels
  g.append("text").attr("x", iW / 2).attr("y", iH + 50)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("TikTok Posts");

  g.append("text").attr("transform", "rotate(-90)").attr("x", -iH / 2).attr("y", -54)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("Spotify Streams");

  // Dots
  g.selectAll("circle").data(data).join("circle")
    .attr("cx", d => x(d.tiktokPosts))
    .attr("cy", d => y(d.spotify))
    .attr("r", 3.5)
    .attr("fill", "#0aff94")
    .attr("fill-opacity", 0.55)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 6).attr("fill-opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1);
      showTooltip(event,
        `<strong style="color:#0aff94">${d.track}</strong><br>
         ${d.artist}<br>
         <span style="opacity:.7">TikTok Posts: ${siFormat(d.tiktokPosts)}</span><br>
         <span style="opacity:.7">Spotify Streams: ${siFormat(d.spotify)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("r", 3.5).attr("fill-opacity", 0.55).attr("stroke", "none");
      hideTooltip();
    });
}

// ─── 2. Trends: Top 15 Artists by TikTok Posts (bar chart) ─────────────────

function buildTrendsChart(songs) {
  // Aggregate by artist
  const byArtist = d3.rollups(
    songs.filter(d => d.tiktokPosts > 0),
    v => d3.sum(v, d => d.tiktokPosts),
    d => d.artist
  ).map(([artist, posts]) => ({ artist, posts }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 15);

  const container = document.getElementById("trends-chart");
  const width  = container.clientWidth || 580;
  const height = Math.round(width * 0.9);
  const m = { top: 20, right: 20, bottom: 60, left: 130 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  const svg = d3.select("#trends-chart").append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(byArtist, d => d.posts) * 1.1])
    .range([0, iW]);

  const y = d3.scaleBand()
    .domain(byArtist.map(d => d.artist))
    .range([0, iH])
    .padding(0.3);

  const axisStroke = "rgba(255,255,255,0.3)";
  const tickFill   = "rgba(255,255,255,0.45)";

  // Grid
  g.append("g")
    .call(d3.axisTop(x).ticks(5).tickSize(-iH).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", "rgba(255,255,255,0.06)"));

  // Bars
  g.selectAll("rect").data(byArtist).join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.artist))
    .attr("width", d => x(d.posts))
    .attr("height", y.bandwidth())
    .attr("fill", "#0aff94")
    .attr("fill-opacity", 0.85)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", 1);
      showTooltip(event,
        `<strong style="color:#0aff94">${d.artist}</strong><br>
         <span style="opacity:.7">TikTok Posts: ${siFormat(d.posts)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("fill-opacity", 0.85);
      hideTooltip();
    });

  // Y axis (artist labels)
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

  g.append("text").attr("x", iW / 2).attr("y", iH + 50)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("Total TikTok Posts");
}

// ─── 3. Top Songs: Top 15 by Spotify Streams (horizontal bar) ──────────────

function buildTopSongsChart(songs) {
  const data = songs
    .filter(d => d.spotify > 0)
    .sort((a, b) => b.spotify - a.spotify)
    .slice(0, 15);

  const container = document.getElementById("top-songs-chart");
  const width  = container.clientWidth || 900;
  const height = Math.round(width * 0.55);
  const m = { top: 20, right: 80, bottom: 50, left: 180 };
  const iW = width  - m.left - m.right;
  const iH = height - m.top  - m.bottom;

  const svg = d3.select("#top-songs-chart").append("svg")
    .attr("width", width).attr("height", height)
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.spotify) * 1.08])
    .range([0, iW]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.track))
    .range([0, iH])
    .padding(0.3);

  const darkBg    = "#161925";
  const barColor  = darkBg;
  const tickFill  = "rgba(0,0,0,0.6)";
  const axisStroke = "rgba(0,0,0,0.2)";

  // Grid
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-iH).tickFormat(""))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("line").attr("stroke", "rgba(0,0,0,0.08)"));

  // Bars
  g.selectAll("rect").data(data).join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.track))
    .attr("width", d => x(d.spotify))
    .attr("height", y.bandwidth())
    .attr("fill", barColor)
    .attr("fill-opacity", 0.75)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill-opacity", 1);
      showTooltip(event,
        `<strong style="color:#0aff94">${d.track}</strong><br>
         ${d.artist}<br>
         <span style="opacity:.7">Streams: ${siFormat(d.spotify)}</span>`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function () {
      d3.select(this).attr("fill-opacity", 0.75);
      hideTooltip();
    });

  // Value labels on bars
  g.selectAll(".bar-label").data(data).join("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.spotify) + 6)
    .attr("y", d => y(d.track) + y.bandwidth() / 2 + 4)
    .attr("fill", tickFill)
    .attr("font-size", "11px")
    .attr("font-family", "Inter, sans-serif")
    .text(d => siFormat(d.spotify));

  // Y axis (song labels)
  g.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll("text")
      .attr("fill", tickFill).attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
      .attr("dx", "-8")
      .text(d => truncate(d, 22)));

  // X axis
  g.append("g").attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(siFormat))
    .call(ax => ax.select(".domain").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("line").attr("stroke", axisStroke))
    .call(ax => ax.selectAll("text").attr("fill", tickFill).attr("font-size", "11px").attr("font-family", "Inter, sans-serif"));

  g.append("text").attr("x", iW / 2).attr("y", iH + 42)
    .attr("text-anchor", "middle").attr("fill", tickFill)
    .attr("font-size", "12px").attr("font-family", "Inter, sans-serif")
    .text("Spotify Streams");
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
