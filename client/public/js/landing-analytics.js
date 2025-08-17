// public/js/landing-analytics.js
(function () {
    const ready = () =>
      new Promise(r => (document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', r, { once: true })
        : r()));
  
    ready().then(init).catch(console.error);
  
    async function init() {
      const root = document.getElementById('analyticsRoot') || document.querySelector('.predictive-viz');
      if (!root) return;
  
      // Каркас UI
      root.innerHTML = `
        <div class="ana-wrap">
          <div class="ana-kpis">
            <div class="ana-card"><h4>Total Approved Reports</h4><div class="num" id="kpi-total">—</div></div>
            <div class="ana-card"><h4>Last 7 Days</h4><div class="num" id="kpi-week">—</div></div>
            <div class="ana-card"><h4>Top Category</h4><div class="num" id="kpi-topcat">—</div></div>
          </div>
          <div class="ana-grids">
            <div class="ana-panel"><canvas id="chartCategories"></canvas></div>
            <div class="ana-panel"><canvas id="chartTimeline"></canvas></div>
          </div>
        </div>
      `;
  
      // Данные (публично, без токена)
      let list = [];
      try {
        const res = await fetch('/api/public/landing/reports', { credentials: 'same-origin' });
        if (res.ok) list = await res.json();
      } catch (e) {
        console.error('analytics fetch error', e);
      }
  
      const reports = Array.isArray(list) ? list : [];
  
      // Подсчёты
      const total = reports.length;
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
  
      const last7 = reports.filter(r => {
        const d = r.date ? new Date(r.date) : (r.createdAt ? new Date(r.createdAt) : null);
        return d && d >= weekAgo;
      }).length;
  
      const byCategory = countBy(reports, r => r.type || r.category || 'Other');
      const topCat = Object.entries(byCategory).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
  
      // KPI в DOM
      setText('kpi-total', formatNum(total));
      setText('kpi-week', formatNum(last7));
      setText('kpi-topcat', topCat);
  
      // График: топ-категории (бар)
      const catEntries = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).slice(0,6);
      drawBar(
        document.getElementById('chartCategories'),
        catEntries.map(([k])=>k),
        catEntries.map(([,v])=>v),
        'Reports by Category (Top 6)'
      );
  
      // График: количество по дням (последние 30)
      const series = byDay(reports, 30);
      drawLine(
        document.getElementById('chartTimeline'),
        series.map(it=>it.label),
        series.map(it=>it.value),
        'Reports per Day (30d)'
      );
    }
  
    // ---- helpers ----
    function setText(id, val){ const el = document.getElementById(id); if (el) el.textContent = val; }
    function formatNum(n){ return new Intl.NumberFormat().format(n); }
  
    function countBy(arr, pick){
      const m = Object.create(null);
      for (const x of arr) {
        const k = pick(x) ?? '—';
        m[k] = (m[k] || 0) + 1;
      }
      return m;
    }
  
    function byDay(reports, days){
      const map = new Map();
      const end = new Date(); end.setHours(0,0,0,0);
      for (let i = days-1; i >= 0; i--){
        const d = new Date(end); d.setDate(end.getDate()-i);
        map.set(d.toISOString().slice(0,10), 0);
      }
      for (const r of reports){
        const d = r.date ? new Date(r.date) : (r.createdAt ? new Date(r.createdAt) : null);
        if (!d) continue;
        d.setHours(0,0,0,0);
        const key = d.toISOString().slice(0,10);
        if (map.has(key)) map.set(key, map.get(key)+1);
      }
      return Array.from(map.entries()).map(([k,v])=>({ label:k.slice(5), value:v }));
    }
  
    // Chart.js рендеры
    function drawBar(canvas, labels, data, title){
      if (!canvas || !window.Chart) return;
      new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ label: title, data }] },
        options: { plugins:{ legend:{ display:false }, title:{ display:true, text:title, color:'#fff' } },
                   scales:{ x:{ ticks:{ color:'#eee' }}, y:{ ticks:{ color:'#eee' }}} }
      });
    }
  
    function drawLine(canvas, labels, data, title){
      if (!canvas || !window.Chart) return;
      new Chart(canvas, {
        type: 'line',
        data: { labels, datasets: [{ label: title, data, tension:.3, fill:false, pointRadius:0 }] },
        options: { plugins:{ legend:{ display:false }, title:{ display:true, text:title, color:'#fff' } },
                   scales:{ x:{ ticks:{ color:'#eee' }}, y:{ ticks:{ color:'#eee' }}} }
      });
    }
  })();
  