<?php
require __DIR__ . "/db.php";

$limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 12;
if ($limit < 1) $limit = 12;
if ($limit > 50) $limit = 50;

$stmt = $pdo->prepare("
  SELECT id, magnitude, location, time_utc
  FROM earthquakes
  ORDER BY time_utc DESC
  LIMIT :lim
");
$stmt->bindValue(":lim", $limit, PDO::PARAM_INT);
$stmt->execute();

header("Content-Type: application/json");
echo json_encode($stmt->fetchAll(), JSON_PRETTY_PRINT);