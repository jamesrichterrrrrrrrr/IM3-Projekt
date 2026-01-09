<?php
// api/etl-usgs-cron.php
require __DIR__ . "/db.php";

$url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&orderby=time";

// Fetch via cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
curl_close($ch);

if (!$response) {
    exit;
}

$data = json_decode($response, true);
if (!isset($data["features"])) {
    exit;
}

$checkStmt = $pdo->prepare("SELECT id FROM earthquakes WHERE usgs_id = :usgs_id LIMIT 1");
$insertStmt = $pdo->prepare("
    INSERT INTO earthquakes (usgs_id, magnitude, location, time_utc)
    VALUES (:usgs_id, :magnitude, :location, :time_utc)
");

foreach ($data["features"] as $quake) {
    $usgs_id = $quake["id"] ?? null;
    $mag     = $quake["properties"]["mag"] ?? null;
    $place   = $quake["properties"]["place"] ?? "";
    $time_ms = $quake["properties"]["time"] ?? null;

    if (!$usgs_id || $mag === null || !$time_ms) {
        continue;
    }

    $time_utc = gmdate("Y-m-d H:i:s", (int) round($time_ms / 1000));

    $checkStmt->execute(["usgs_id" => $usgs_id]);
    if ($checkStmt->fetch()) {
        continue;
    }

    $insertStmt->execute([
        "usgs_id" => $usgs_id,
        "magnitude" => $mag,
        "location" => $place,
        "time_utc" => $time_utc
    ]);
}