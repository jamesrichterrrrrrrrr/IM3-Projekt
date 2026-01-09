async function loadTaylorSwiftChart() {
  try {
    const res = await fetch("api/get-taylor-swift-stats.php");
    if (!res.ok) throw new Error("Failed to load Taylor Swift stats");

    let data = await res.json();

    // Use dummy data if the dataset is empty (prototype / early scraper phase)
    if (!Array.isArray(data) || data.length === 0) {
      data = [
        { year: 2018, count: 1 },
        { year: 2019, count: 2 },
        { year: 2020, count: 4 },
        { year: 2021, count: 3 },
        { year: 2022, count: 6 },
        { year: 2023, count: 8 },
        { year: 2024, count: 5 }
      ];
    }

    const labels = data.map(d => d.year);
    const values = data.map(d => d.count);

    const canvas = document.getElementById("taylorSwiftChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Taylor Swift tracks",
            data: values,
            borderColor: "#D659B1",
            backgroundColor: "rgba(214, 89, 177, 0.25)",
            borderWidth: 3,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "#D659B1",
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} earthquakes`
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Year",
              color: "rgba(255,255,255,0.75)",
              font: { size: 14, weight: "600" },
              padding: { top: 12 }
            },
            ticks: {
              color: "#ffffff",
              font: { size: 13 }
            },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Taylor Swift tracks on SRF 1",
              color: "rgba(255,255,255,0.75)",
              font: { size: 14, weight: "600" },
              padding: { bottom: 12 }
            },
            ticks: {
              color: "#ffffff",
              precision: 0,
              stepSize: 1,
              font: { size: 13 }
            },
            grid: {
              color: "rgba(255,255,255,0.15)"
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Taylor Swift chart error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTaylorSwiftChart);