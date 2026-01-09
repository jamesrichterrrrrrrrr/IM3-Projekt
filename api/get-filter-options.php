<?php
require __DIR__ . "/db.php";

$stmt = $pdo->query("
  SELECT
    TRIM(
      CASE
        WHEN location LIKE '%,%' THEN SUBSTRING_INDEX(location, ',', -1)
        ELSE location
      END
    ) AS loc_label,
    COUNT(*) AS cnt
  FROM earthquakes
  GROUP BY loc_label
  ORDER BY cnt DESC
  LIMIT 30
");

$locations = [];
foreach ($stmt->fetchAll() as $row) {
  if ($row["loc_label"] !== null && $row["loc_label"] !== "") {
    $locations[] = $row["loc_label"];
  }
}

header("Content-Type: application/json");
echo json_encode([
  "locations" => $locations,
  "date_ranges" => [
    ["value" => "24h", "label" => "Last 24 hours"],
    ["value" => "7d",  "label" => "Last 7 days"],
    ["value" => "30d", "label" => "Last 30 days"],
    ["value" => "90d", "label" => "Last 90 days"],
    ["value" => "all", "label" => "All time"]
  ],
  "times_of_day" => [
    ["value" => "all", "label" => "Any time"],
    ["value" => "night", "label" => "Night (00–06)"],
    ["value" => "morning", "label" => "Morning (06–12)"],
    ["value" => "afternoon", "label" => "Afternoon (12–18)"],
    ["value" => "evening", "label" => "Evening (18–24)"]
  ],
  "magnitude_mins" => [
    ["value" => "0", "label" => "Any magnitude"],
    ["value" => "5.0", "label" => "≥ 5.0"],
    ["value" => "5.5", "label" => "≥ 5.5"],
    ["value" => "6.0", "label" => "≥ 6.0"],
    ["value" => "6.5", "label" => "≥ 6.5"],
    ["value" => "7.0", "label" => "≥ 7.0"]
  ],
  "depth_ranges" => [
    ["value" => "all", "label" => "Any depth"],
    ["value" => "0-10", "label" => "0–10 km (shallow)"],
    ["value" => "10-30", "label" => "10–30 km"],
    ["value" => "30-70", "label" => "30–70 km"],
    ["value" => "70-300", "label" => "70–300 km"],
    ["value" => "300+", "label" => "> 300 km (deep)"]
  ]
], JSON_PRETTY_PRINT);