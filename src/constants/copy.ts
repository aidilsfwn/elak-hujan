export const copy = {
  appName: "ElakHujan",
  appTagline: "Perancang Hujan untuk Rider",

  nav: {
    weekly: "Mingguan",
    leave: "Masa Balik",
    settings: "Tetapan",
  },

  onboarding: {
    stepOf: (current: number, total: number) =>
      `Langkah ${current} daripada ${total}`,
    next: "Seterusnya",
    back: "Kembali",
    finish: "Selesai",

    location: {
      title: "Lokasi Anda",
      subtitle:
        "Tetapkan lokasi rumah dan pejabat untuk ramalan cuaca yang tepat.",
      homeLabel: "Rumah",
      homePlaceholder: "Cari lokasi rumah...",
      officeLabel: "Pejabat",
      officePlaceholder: "Cari lokasi pejabat...",
      stateLabel: "Negeri",
      statePlaceholder: "Pilih negeri",
      searching: "Mencari...",
      noResults: "Tiada keputusan. Cuba carian lain.",
      selectResult: "Pilih lokasi daripada senarai.",
    },

    commute: {
      title: "Waktu Perjalanan",
      subtitle: "Berapa lama masa perjalanan anda ke dan dari pejabat?",
      morningLabel: "Perjalanan Pagi",
      eveningLabel: "Perjalanan Petang",
      startLabel: "Mula",
      endLabel: "Tamat",
    },

    days: {
      title: "Hari Pejabat",
      subtitle: "Berapa hari anda pergi ke pejabat setiap minggu?",
      daysPerWeekLabel: "Bilangan hari seminggu",
      preferredDaysLabel: "Hari yang diutamakan",
      days: {
        monday: "Isn",
        tuesday: "Sel",
        wednesday: "Rab",
        thursday: "Kha",
        friday: "Jum",
      },
    },
  },

  settings: {
    title: "Tetapan",
    sectionLocation: "Lokasi",
    sectionCommute: "Waktu Perjalanan",
    sectionOfficeDays: "Hari Pejabat",
    sectionRisk: "Had Risiko Hujan",
    rainThresholdHelper: (value: number) =>
      `Perjalanan dianggap berisiko apabila kebarangkalian hujan melebihi ${value}%.`,
    saveButton: "Simpan Tetapan",
    saved: "Disimpan!",
    resetTitle: "Set Semula Aplikasi",
    resetButton: "Padam semua data",
    resetConfirm:
      "Ini akan memadam semua tetapan anda dan kembali ke skrin persediaan. Teruskan?",
  },

  about: {
    sectionTitle: "Tentang",
    dataSourcesLabel: "Sumber Data",
    sources: [
      {
        name: "Open-Meteo",
        desc: "Ramalan cuaca jam-per-jam (open-meteo.com)",
      },
      { name: "MET Malaysia / data.gov.my", desc: "Amaran cuaca rasmi" },
      { name: "OpenStreetMap Nominatim", desc: "Carian & koordinat lokasi" },
    ],
    accuracyLabel: "Ketepatan & Had",
    accuracyNotes: [
      "Ramalan cuaca menggunakan koordinat tepat lokasi rumah dan pejabat — bukan peringkat negeri.",
      "Open-Meteo menggunakan model global ECMWF IFS (~27 km grid) untuk Malaysia. Model resolusi tinggi 1–2 km hanya tersedia untuk Eropah dan Amerika Syarikat.",
      "Hujan konvektif petang (ribut petir tempatan) sukar diramal oleh mana-mana model NWP, termasuk model profesional seperti ECMWF — sistem ini terbentuk dan hilang dalam masa 1–2 jam.",
      "Nilai yang dipaparkan ialah kebarangkalian hujan (%), bukan jumlah hujan sebenar (mm). Nilai 40% bermaksud model menjangka peluang 40% hujan berlaku — bukan intensiti.",
      "Amaran MET Malaysia adalah pada peringkat negeri sahaja.",
    ],
    disclaimer:
      "Gunakan sebagai panduan perancangan sahaja. Semak ramalan terkini sebelum bertolak.",
    tagline: "kita merancang, tuhan menentukan :p",
    credit: "vibe-coded by aidil safwan",
    github: "https://github.com/aidilsfwn",
    linkedin: "https://www.linkedin.com/in/aidilsafwan/",
  },

  errors: {
    weatherFetch: "Gagal mendapatkan data cuaca. Cuba lagi.",
    locationSearch: "Gagal mencari lokasi. Cuba lagi.",
  },

  weekly: {
    title: "Rancangan Minggu Ini",
    recommended: "Disyorkan",
    officeDay: "Hari Pejabat",
    loading: "Memuatkan ramalan cuaca...",
    errorFetch: "Gagal memuatkan cuaca. Cuba lagi.",
    staleData: "Data tidak dapat dikemas kini — menunjukkan ramalan lama.",
    morning: "Pagi",
    evening: "Petang",
    updatedNow: "Baru dikemas kini",
    updatedAgo: (m: number) => `Dikemas kini ${m} min lalu`,
    nowWidget: {
      title: "Sekarang",
      safe: "Selamat Keluar",
      caution: "Berhati-hati",
      wait: "Tunggu Dahulu",
      probLabel: (p: number) => `${p}% hujan`,
    },
  },

  leaveAdvisor: {
    title: "Masa Terbaik Balik",
    panelLabel: "Terbaik bertolak",
    recommendedSlot: "Masa yang disyorkan",
    noDryWindow:
      "Tiada tetingkap kering — pilih masa dengan risiko paling rendah.",
    scanWindowTitle: "Tetingkap petang",
    rollingTitle: "Dari sekarang",
    refresh: "Muat semula",
    loading: "Mengira masa terbaik...",
    noOfficeWeather: "Data cuaca pejabat tidak tersedia.",
    metForecastTitle: "Ramalan MET Hari Ini",
    rideabilityLabel: "Skor Perjalanan",
    rideabilityScores: {
      selamat: "SELAMAT",
      baik: "BAIK",
      berhatiHati: "BERHATI-HATI",
      berisiko: "BERISIKO",
      bahaya: "BAHAYA",
    },
    gearCheck: {
      title: "Tips Perjalanan",
      tips: {
        low: ["Cuaca baik — selamat bertolak! 🌤️"],
        medium: [
          "Sediakan baju hujan sebelum bertolak",
          "Berhati-hati di selekoh basah",
        ],
        high: [
          "Pakai baju hujan",
          "Kurangkan kelajuan",
          "Elak kawasan rendah & banjir",
        ],
      },
    },
    tempLabel: (t: number) => `${t}°C`,
  },

  dayDetail: {
    loading: "Memuatkan data cuaca...",
    noData: "Data cuaca tidak tersedia untuk hari ini.",
    morningSection: "Perjalanan Pagi",
    eveningSection: "Perjalanan Petang",
    chartTitle: "Ramalan Hujan Sehari Penuh",
    legendMorning: "Pagi",
    legendEvening: "Petang",
    homeNote: "Lokasi Rumah",
    officeNote: "Lokasi Pejabat",
    bestSlot: "Masa terbaik balik",
  },
};
