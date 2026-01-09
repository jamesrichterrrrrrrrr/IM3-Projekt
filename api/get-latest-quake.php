<?php
require __DIR__ . "/db.php";

$stmt = $pdo->query("
  SELECT id
  FROM earthquakes
  ORDER BY time_utc DESC
  LIMIT 1
");
$row = $stmt->fetch();

header("Content-Type: application/json");
echo json_encode([
  "quake_id" => $row ? (int)$row["id"] : null
]);