<?php
require __DIR__ . "/db.php";


$quakeId = isset($_GET["quake_id"]) ? (int)$_GET["quake_id"] : 0;
if ($quakeId <= 0) {
  http_response_code(400);
  die("Missing or invalid quake_id");
}

$quakeStmt = $pdo->prepare("
SELECT id, magnitude, location, time_utc, depth_km, latitude, longitude
FROM earthquakes
WHERE id = :id
");
$quakeStmt->execute(["id" => $quakeId]);
$quake = $quakeStmt->fetch();

if (!$quake) {
  http_response_code(404);
  die("Earthquake not found");
}

$mag = (float)$quake["magnitude"];

$minutes = 20;
if ($mag >= 5.5) $minutes = 30;
if ($mag >= 6.0) $minutes = 45;

$centerTime = new DateTime($quake["time_utc"], new DateTimeZone("UTC"));

$from = (clone $centerTime)->modify("-{$minutes} minutes");
$to   = (clone $centerTime)->modify("+{$minutes} minutes");

$tracksStmt = $pdo->prepare("
  SELECT played_at_utc, title, artist, duration_ms, is_playing_now
  FROM radio_tracks
  WHERE played_at_utc BETWEEN :from AND :to
  ORDER BY played_at_utc ASC
");

$tracksStmt->execute([
  "from" => $from->format("Y-m-d H:i:s"),
  "to"   => $to->format("Y-m-d H:i:s")
]);

$tracks = $tracksStmt->fetchAll();

$mode = "strict_quake_time";
$anchorUtc = $centerTime->format("Y-m-d H:i:s");

/* If empty, fall back to nearest SRF track time */
if (count($tracks) === 0) {
  $nearestStmt = $pdo->prepare("
    SELECT played_at_utc
    FROM radio_tracks
    ORDER BY ABS(TIMESTAMPDIFF(SECOND, played_at_utc, :quake_time)) ASC
    LIMIT 1
  ");
  $nearestStmt->execute(["quake_time" => $centerTime->format("Y-m-d H:i:s")]);
  $nearest = $nearestStmt->fetch();

  if ($nearest) {
    $mode = "nearest_radio_time";
    $anchorUtc = $nearest["played_at_utc"];

    $anchor = new DateTime($anchorUtc, new DateTimeZone("UTC"));
    $from = (clone $anchor)->modify("-{$minutes} minutes");
    $to   = (clone $anchor)->modify("+{$minutes} minutes");

    $tracksStmt->execute([
      "from" => $from->format("Y-m-d H:i:s"),
      "to"   => $to->format("Y-m-d H:i:s")
    ]);

    $tracks = $tracksStmt->fetchAll();
  }
}

header("Content-Type: application/json");
echo json_encode([
  "quake" => [
    "id" => (int)$quake["id"],
    "magnitude" => $mag,
    "location" => $quake["location"],
    "time_utc" => $quake["time_utc"],
    "depth_km" => ($quake["depth_km"] !== null ? (float)$quake["depth_km"] : null),
    "latitude" => ($quake["latitude"] !== null ? (float)$quake["latitude"] : null),
    "longitude" => ($quake["longitude"] !== null ? (float)$quake["longitude"] : null)
  ],
  "playlist" => [
    "mode" => $mode,
    "anchor_time_utc" => $anchorUtc,
    "window_minutes" => $minutes,
    "from_utc" => $from->format("Y-m-d H:i:s"),
    "to_utc" => $to->format("Y-m-d H:i:s"),
    "track_count" => count($tracks)
  ],
  "tracks" => $tracks
], JSON_PRETTY_PRINT);