new Vue({
  el: '#app',

  data: {
    itemCounts: { paper: 0, plastic: 0, metal: 0, general: 0 },
    bins: [],
    categoryOrder: [
      { key: 'paper', name: 'Paper', color: '#2b8aee', iconClass: 'fa-solid fa-file-lines' },
      { key: 'plastic', name: 'Plastic', color: '#f59e0b', iconClass: 'fa-solid fa-bottle-water' },
      { key: 'metal', name: 'Metal', color: '#6b7280', iconClass: 'fa-solid fa-wrench' },
      { key: 'general', name: 'General Waste', color: '#10b981', iconClass: 'fa-solid fa-trash-can' }
    ],
    historyChart: null,
    dailyTotalsChart: null,
    dailyDays: 7,
    pollInterval: 3000,
    pollTimer: null,
    compositionChart: null,
  },

  computed: {
    topLevels() {
      const src = this.bins.length ? this.bins[0].levels : {};
      return {
        paper: Number(src.paper || 0),
        plastic: Number(src.plastic || 0),
        metal: Number(src.metal || 0),
        general: Number(src.general || 0)
      };
    }
  },

   created() {
    this.loadLatest();
    this.loadCounts();
    this.loadHistory(); 
    this.loadDailyTotals(); 
    this.startPolling();
  },

  methods: {
    //starting polling
    startPolling() {
      if (this.pollTimer) clearInterval(this.pollTimer);

      this.pollTimer = setInterval(() => {
        this.loadLatest();
        this.loadCounts();
        this.loadHistory(); 
        this.loadDailyTotals();
      }, this.pollInterval);
    },

    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    //Loading latest bin data
    async loadLatest() {
      try {
        const snap = await getLatestReadings();
        if (!snap) return;

        this.bins = [{
          levels: {
            paper: Number(snap.levels?.paper ?? 0),
            plastic: Number(snap.levels?.plastic ?? 0),
            metal: Number(snap.levels?.metal ?? 0),
            general: Number(snap.levels?.general ?? 0)
          },
          isFull: snap.isFull || {},
          date: snap.date
        }];
      } catch (error) {
        console.error('loadLatest error:', error);
      }
    },
    async loadCounts() {
      try {
        const counts = await getReadingCounts();
        this.itemCounts = {
          paper: Number(counts.paper || 0),
          plastic: Number(counts.plastic || 0),
          metal: Number(counts.metal || 0),
          general: Number(counts.general || 0)
        };
        this.updateCompositionChart();
      } catch (error) {
        console.error('loadCounts error:', error);
      }
    },
    async loadHistory() {
      try {
        const rows = await getReadingsHistory(200);
        if (!rows || !rows.length) return;

        rows.sort((a, b) => new Date(a.date) - new Date(b.date));

        const labels = [];
        const paper = [];
        const plastic = [];
        const metal = [];
        const general = [];

        const current = { paper: 0, plastic: 0, metal: 0, general: 0 };

        for (const r of rows) {
          const cat = (r.category || '').toLowerCase();
          const d = new Date(r.date);
          if (isNaN(d)) continue;

          if (current.hasOwnProperty(cat)) {
            current[cat] = Number(r.level);
          }

          labels.push(d.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          }));

          paper.push(current.paper);
          plastic.push(current.plastic);
          metal.push(current.metal);
          general.push(current.general);
        }

        this.$nextTick(() => {
          const canvas = document.getElementById('historyChart');
          if (!canvas) return;

          const ctx = canvas.getContext('2d');

          const datasets = [
            { label: 'Paper', data: paper, borderColor: '#2b8aee', fill: false },
            { label: 'Plastic', data: plastic, borderColor: '#f59e0b', fill: false },
            { label: 'Metal', data: metal, borderColor: '#6b7280', fill: false },
            { label: 'General', data: general, borderColor: '#10b981', fill: false }
          ];

          if (this.historyChart) {
            this.historyChart.data.labels = labels;
            this.historyChart.data.datasets = datasets;
            this.historyChart.update();
          } else {
            this.historyChart = new Chart(ctx, {
              type: 'line',
              data: { labels, datasets },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 0, max: 105 }
                }
              }
            });
          }
        });

      } catch (error) {
        console.error('loadHistory error:', error);
      }
    },
    async loadDailyTotals() {
      try {
        const rows = await getDailyTotals(this.dailyDays);
        if (!rows || !rows.length) return;

        const labels = rows.map(r => {
          const [yyyy, mm, dd] = r.day.split('-');
          return `${dd}/${mm}`;
        });

        const categories = ['paper','plastic','metal','general'];

        const datasets = categories.map(cat => {
          const meta = this.categoryOrder.find(c => c.key === cat);
          return {
            label: meta.name,
            data: rows.map(r => r.levels?.[cat] || 0),
            backgroundColor: meta.color,
            stack: 'stack1'
          };
        });

        this.$nextTick(() => {
          const canvas = document.getElementById('dailyTotalsChart');
          if (!canvas) return;

          const ctx = canvas.getContext('2d');

          if (this.dailyTotalsChart) {
            this.dailyTotalsChart.destroy();
          }

          this.dailyTotalsChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
              }
            }
          });
        });

      } catch (e) {
        console.error('loadDailyTotals error', e);
      }
    },
    updateCompositionChart() {
      const values = [
        this.itemCounts.paper,
        this.itemCounts.plastic,
        this.itemCounts.metal,
        this.itemCounts.general
      ];

      const labels = this.categoryOrder.map(c => c.name);
      const colors = this.categoryOrder.map(c => c.color);

      this.$nextTick(() => {
        const canvas = document.getElementById('compositionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.compositionChart) {
          this.compositionChart.data.datasets[0].data = values;
          this.compositionChart.update();
        } else {
          this.compositionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [{
                data: values,
                backgroundColor: colors
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false
            }
          });
        }
      });
    }
  }
});