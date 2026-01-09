<?php
require __DIR__ . "/db.php";

$id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
if ($id <= 0) {
  http_response_code(400);
  header("Content-Type: application/json");
  echo json_encode(["error" => "Missing id"]);
  exit;
}

$stmt = $pdo->prepare("
  SELECT id, magnitude, depth_km, latitude, longitude, location, time_utc
  FROM earthquakes
  WHERE id = :id
  LIMIT 1
");
$stmt->execute(["id" => $id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  http_response_code(404);
  header("Content-Type: application/json");
  echo json_encode(["error" => "Not found"]);
  exit;
}

header("Content-Type: application/json");
echo json_encode($row, JSON_PRETTY_PRINT);