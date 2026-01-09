<?php
require __DIR__ . "/db.php";
header("Content-Type: application/json; charset=utf-8");

$total = (int)$pdo->query("SELECT COUNT(*) FROM earthquakes")->fetchColumn();

echo json_encode([
  "total" => $total
]);