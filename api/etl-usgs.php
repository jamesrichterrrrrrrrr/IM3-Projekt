<?php
require __DIR__ . "/db.php";

$url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&orderby=time";

function fetchJson(string $url): array
{
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
  ]);

  $response = curl_exec($ch);

  if ($response === false) {
    $err = curl_error($ch);
    curl_close($ch);
    throw new RuntimeException("cURL error: $err");
  }

  curl_close($ch);

  $data = json_decode($response, true);
  if (!is_array($data)) {
    throw new RuntimeException("Failed to decode JSON.");
  }

  return $data;
}

$checkStmt = $pdo->prepare("SELECT id FROM earthquakes WHERE usgs_id = :usgs_id LIMIT 1");

$insertStmt = $pdo->prepare("
  INSERT INTO earthquakes (usgs_id, magnitude, depth_km, latitude, longitude, location, time_utc)
  VALUES (:usgs_id, :magnitude, :depth_km, :latitude, :longitude, :location, :time_utc)
");

$updateStmt = $pdo->prepare("
  UPDATE earthquakes
  SET
    magnitude = :magnitude,
    depth_km  = :depth_km,
    latitude  = :latitude,
    longitude = :longitude,
    location  = :location,
    time_utc  = :time_utc
  WHERE usgs_id = :usgs_id
");

$inserted = 0;
$updated  = 0;
$skipped  = 0;

try {
  $data = fetchJson($url);

  if (!isset($data["features"]) || !is_array($data["features"])) {
    throw new RuntimeException("Missing features array in response.");
  }

  foreach ($data["features"] as $quake) {
    $usgsId  = $quake["id"] ?? null;
    $mag     = $quake["properties"]["mag"] ?? null;
    $place   = $quake["properties"]["place"] ?? "";
    $timeMs  = $quake["properties"]["time"] ?? null;

    $coords  = $quake["geometry"]["coordinates"] ?? null; // [lon, lat, depth_km]
    $lon     = (is_array($coords) && isset($coords[0]) && is_numeric($coords[0])) ? (float)$coords[0] : null;
    $lat     = (is_array($coords) && isset($coords[1]) && is_numeric($coords[1])) ? (float)$coords[1] : null;
    $depth   = (is_array($coords) && isset($coords[2]) && is_numeric($coords[2])) ? (float)$coords[2] : null;

    if (!$usgsId || $mag === null || !$timeMs) {
      $skipped++;
      continue;
    }

    $timeUtc = gmdate("Y-m-d H:i:s", (int)floor(((float)$timeMs) / 1000));

    $payload = [
      "usgs_id"   => $usgsId,
      "magnitude" => (float)$mag,
      "depth_km"  => $depth,
      "latitude"  => $lat,
      "longitude" => $lon,
      "location"  => $place,
      "time_utc"  => $timeUtc,
    ];

    $checkStmt->execute(["usgs_id" => $usgsId]);

    if ($checkStmt->fetch()) {
      $updateStmt->execute($payload);
      $updated++;
    } else {
      $insertStmt->execute($payload);
      $inserted++;
    }
  }

  $status = "USGS ETL finished";
} catch (Throwable $e) {
  $status = "USGS ETL stopped";
  $error  = $e->getMessage();
}

echo "<h2>{$status}</h2>";
echo "<p><strong>Inserted:</strong> {$inserted}</p>";
echo "<p><strong>Updated:</strong> {$updated}</p>";
echo "<p><strong>Skipped:</strong> {$skipped}</p>";

if (isset($error)) {
  echo "<p><strong>Error:</strong> " . htmlspecialchars($error, ENT_QUOTES, "UTF-8") . "</p>";
}