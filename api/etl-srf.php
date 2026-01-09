<?php
require __DIR__ . "/db.php";

$channelId = "69e8ac16-4327-4af4-b873-fd5cd6e895a7";
$maxPages  = 3;

$url = "https://il.srgssr.ch/integrationlayer/2.0/srf/songList/radio/byChannel/$channelId";

$insertStmt = $pdo->prepare("
  INSERT INTO radio_tracks (channel_id, played_at_utc, title, artist, duration_ms, is_playing_now)
  VALUES (:channel_id, :played_at_utc, :title, :artist, :duration_ms, :is_playing_now)
");

function fetchJson(string $url): array
{
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => ["Accept: application/json"],
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
    throw new RuntimeException("Bad JSON response");
  }

  return $data;
}

$inserted = 0;
$skipped  = 0;
$page     = 0;

try {
  while ($url && $page < $maxPages) {
    $page++;

    $data = fetchJson($url);

    if (!isset($data["songList"]) || !is_array($data["songList"])) {
      throw new RuntimeException("Missing songList on page $page");
    }

    foreach ($data["songList"] as $song) {
      $dateStr = $song["date"] ?? null; // e.g. 2026-01-05T19:33:16+01:00
      $title   = trim($song["title"] ?? "");
      $artist  = trim($song["artist"]["name"] ?? "");
      $durMs   = isset($song["duration"]) ? (int)$song["duration"] : null;
      $isNow   = !empty($song["isPlayingNow"]) ? 1 : 0;

      if (!$dateStr || $title === "" || $artist === "") {
        $skipped++;
        continue;
      }

      try {
        $dt = new DateTime($dateStr);
        $dt->setTimezone(new DateTimeZone("UTC"));
        $playedUtc = $dt->format("Y-m-d H:i:s");
      } catch (Exception $e) {
        $skipped++;
        continue;
      }

      try {
        $insertStmt->execute([
          "channel_id"     => $channelId,
          "played_at_utc"  => $playedUtc,
          "title"          => $title,
          "artist"         => $artist,
          "duration_ms"    => $durMs,
          "is_playing_now" => $isNow,
        ]);
        $inserted++;
      } catch (PDOException $e) {
        // duplicates (or any insert failure) are treated as "skipped" (same behavior as before)
        $skipped++;
      }
    }

    $url = $data["next"] ?? null;
  }

  $status = "SRF ETL finished";
} catch (Throwable $e) {
  $status = "SRF ETL stopped";
  $error  = $e->getMessage();
}

echo "<h2>{$status}</h2>";
echo "<p><strong>Pages fetched:</strong> {$page}</p>";
echo "<p><strong>Inserted:</strong> {$inserted}</p>";
echo "<p><strong>Skipped:</strong> {$skipped}</p>";

if (isset($error)) {
  echo "<p><strong>Error:</strong> " . htmlspecialchars($error, ENT_QUOTES, "UTF-8") . "</p>";
}