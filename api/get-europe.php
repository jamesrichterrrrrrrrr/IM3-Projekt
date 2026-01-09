<?php
require __DIR__ . "/db.php";

$limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 12;
if ($limit < 1) $limit = 12;
if ($limit > 50) $limit = 50;

$keywords = [
  "Turkey","Greece","Italy","France","Spain","Portugal","Iceland","Norway","Sweden","Finland",
  "Romania","Bulgaria","Croatia","Serbia","Albania","Montenegro","Bosnia","Slovenia","Austria",
  "Switzerland","Germany","Poland","Czech","Slovakia","Hungary","Ukraine","Russia","UK","England",
  "Scotland","Ireland","Netherlands","Belgium","Denmark"
];

$where = [];
$params = [];
foreach ($keywords as $i => $k) {
  $where[] = "location LIKE :k$i";
  $params["k$i"] = "%$k%";
}

$sql = "
  SELECT id, magnitude, location, time_utc
  FROM earthquakes
  WHERE time_utc >= (UTC_TIMESTAMP() - INTERVAL 90 DAY)
    AND (" . implode(" OR ", $where) . ")
  ORDER BY magnitude DESC, time_utc DESC
  LIMIT :lim
";

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $val) {
  $stmt->bindValue(":$key", $val, PDO::PARAM_STR);
}
$stmt->bindValue(":lim", $limit, PDO::PARAM_INT);
$stmt->execute();

header("Content-Type: application/json");
echo json_encode($stmt->fetchAll(), JSON_PRETTY_PRINT);