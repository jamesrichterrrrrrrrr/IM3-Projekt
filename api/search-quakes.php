<?php
require __DIR__ . "/db.php";

/**
 * Params:
 *  loc=all|Chile|Turkey|...
 *  range=24h|7d|30d|90d|all
 *  tod=all|night|morning|afternoon|evening
 *  minmag=0|5.0|5.5|...
 *  depth=all|0-10|10-30|30-70|70-300|300+
 *  limit=50
 */

$loc    = isset($_GET["loc"]) ? trim($_GET["loc"]) : "all";
$range  = isset($_GET["range"]) ? trim($_GET["range"]) : "30d";
$tod    = isset($_GET["tod"]) ? trim($_GET["tod"]) : "all";
$minmag = isset($_GET["minmag"]) ? (float)$_GET["minmag"] : 0.0;
$depth  = isset($_GET["depth"]) ? trim($_GET["depth"]) : "all";
$limit  = isset($_GET["limit"]) ? (int)$_GET["limit"] : 50;

if ($limit < 1) $limit = 50;
if ($limit > 200) $limit = 200;

$where = [];
$params = [];

$offset = isset($_GET["offset"]) ? (int)$_GET["offset"] : 0;
if ($offset < 0) $offset = 0;
if ($offset > 5000) $offset = 5000;

if ($loc !== "all" && $loc !== "") {
  $where[] = "TRIM(CASE WHEN location LIKE '%,%' THEN SUBSTRING_INDEX(location, ',', -1) ELSE location END) = :loc";
  $params["loc"] = $loc;
}

/** Date range filter */
if ($range !== "all") {
  if ($range === "24h") $where[] = "time_utc >= (UTC_TIMESTAMP() - INTERVAL 1 DAY)";
  if ($range === "7d")  $where[] = "time_utc >= (UTC_TIMESTAMP() - INTERVAL 7 DAY)";
  if ($range === "30d") $where[] = "time_utc >= (UTC_TIMESTAMP() - INTERVAL 30 DAY)";
  if ($range === "90d") $where[] = "time_utc >= (UTC_TIMESTAMP() - INTERVAL 90 DAY)";
}

/** Time of day filter */
if ($tod !== "all") {
  if ($tod === "night")     $where[] = "HOUR(time_utc) >= 0  AND HOUR(time_utc) < 6";
  if ($tod === "morning")   $where[] = "HOUR(time_utc) >= 6  AND HOUR(time_utc) < 12";
  if ($tod === "afternoon") $where[] = "HOUR(time_utc) >= 12 AND HOUR(time_utc) < 18";
  if ($tod === "evening")   $where[] = "HOUR(time_utc) >= 18 AND HOUR(time_utc) < 24";
}

/** Magnitude filter */
if ($minmag > 0) {
  $where[] = "magnitude >= :minmag";
  $params["minmag"] = $minmag;
}

/** Depth filter */
if ($depth !== "all") {
  if ($depth === "0-10")    $where[] = "depth_km >= 0 AND depth_km < 10";
  if ($depth === "10-30")   $where[] = "depth_km >= 10 AND depth_km < 30";
  if ($depth === "30-70")   $where[] = "depth_km >= 30 AND depth_km < 70";
  if ($depth === "70-300")  $where[] = "depth_km >= 70 AND depth_km < 300";
  if ($depth === "300+")    $where[] = "depth_km >= 300";
}

$sql = "
  SELECT id, magnitude, depth_km, location, time_utc
  FROM earthquakes
";

if (count($where) > 0) {
  $sql .= " WHERE " . implode(" AND ", $where);
}

$sql .= " ORDER BY time_utc DESC LIMIT :lim OFFSET :off";




$stmt = $pdo->prepare($sql);

foreach ($params as $k => $v) {
  $stmt->bindValue(":$k", $v);
}
$stmt->bindValue(":lim", $limit, PDO::PARAM_INT);
$stmt->bindValue(":off", $offset, PDO::PARAM_INT);

$stmt->execute();

header("Content-Type: application/json");
echo json_encode($stmt->fetchAll(), JSON_PRETTY_PRINT);