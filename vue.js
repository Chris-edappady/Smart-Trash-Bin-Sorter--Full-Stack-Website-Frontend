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
    ]
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
  },

  methods: {
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
      } catch (error) {
        console.error('loadCounts error:', error);
      }
    }
  }
});