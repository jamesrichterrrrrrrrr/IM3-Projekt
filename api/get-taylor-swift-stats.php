<?php
require __DIR__ . "/db.php";
header("Content-Type: application/json; charset=utf-8");

$sql = "
  SELECT
    YEAR(played_at_utc) AS year,
    COUNT(*) AS cnt
  FROM radio_tracks
  WHERE LOWER(artist) LIKE '%taylor swift%'
  GROUP BY YEAR(played_at_utc)
  ORDER BY year ASC
";

$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// normalize output
$out = array_map(function ($r) {
  return [
    "year"  => (int)$r["year"],
    "count" => (int)$r["cnt"]
  ];
}, $rows);

echo json_encode($out);