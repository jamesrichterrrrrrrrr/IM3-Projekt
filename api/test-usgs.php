<?php

$url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&orderby=time";

// 1. Initialize cURL
$ch = curl_init();

// 2. Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// 3. Execute request
$response = curl_exec($ch);

// 4. Error handling
if ($response === false) {
    echo "cURL Error: " . curl_error($ch);
    curl_close($ch);
    exit;
}

// 5. Close cURL
curl_close($ch);

// 6. Decode JSON
$data = json_decode($response, true);

if (!$data) {
    echo "Failed to decode JSON.";
    exit;
}

// 7. Output simplified data
foreach ($data['features'] as $quake) {

    $magnitude = $quake['properties']['mag'];
    $location  = $quake['properties']['place'];
    $timestamp = $quake['properties']['time'];

    $date = date("Y-m-d H:i:s", $timestamp / 1000);

    echo "<strong>Magnitude:</strong> $magnitude<br>";
    echo "<strong>Location:</strong> $location<br>";
    echo "<strong>Time:</strong> $date<br>";
    echo "<hr>";
}