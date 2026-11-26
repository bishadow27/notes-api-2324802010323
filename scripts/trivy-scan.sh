#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root. No Atlas or Supabase credentials are needed.
out="${1:-/tmp/lab04-scan}"
mkdir -p "$out"
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

sed 's/^FROM node:22-alpine$/FROM node:22/' Dockerfile > "$tmp"
docker build -t notes-api:alpine .
docker build -f "$tmp" -t notes-api:full .
docker pull aquasec/trivy:latest
docker image inspect aquasec/trivy:latest --format '{{json .RepoDigests}}' > "$out/trivy-image-digest.txt"
date -u +'%Y-%m-%dT%H:%M:%SZ' > "$out/scan-utc.txt"

for t in alpine full; do
  docker image inspect "notes-api:$t" --format '{{.Size}}' > "$out/size-$t.txt"
  docker image inspect "notes-api:$t" --format '{{.Id}}' > "$out/image-id-$t.txt"
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v lab04-trivy-cache:/root/.cache/trivy \
    aquasec/trivy:latest image --quiet --scanners vuln \
    --severity HIGH,CRITICAL --format json "notes-api:$t" > "$out/trivy-$t.json"
done

node - "$out" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2];
const rows = ['| Image | Size (MiB) | HIGH | CRITICAL |', '|---|---:|---:|---:|'];
for (const [tag, base] of [['alpine', 'node:22-alpine'], ['full', 'node:22']]) {
  const data = JSON.parse(fs.readFileSync(path.join(out, 'trivy-' + tag + '.json'), 'utf8'));
  if (!Array.isArray(data.Results)) throw new Error('Missing Trivy Results: ' + tag);
  const vulnerabilities = data.Results.flatMap(r => r.Vulnerabilities || []);
  const bytes = Number(fs.readFileSync(path.join(out, 'size-' + tag + '.txt'), 'utf8').trim());
  if (!Number.isFinite(bytes) || bytes <= 0) throw new Error('Invalid image size: ' + tag);
  const high = vulnerabilities.filter(v => v.Severity === 'HIGH').length;
  const critical = vulnerabilities.filter(v => v.Severity === 'CRITICAL').length;
  rows.push('| ' + base + ' | ' + (bytes / 1048576).toFixed(2) + ' | ' + high + ' | ' + critical + ' |');
}
const report = rows.join('\n') + '\n\nSize: Docker image inspect, 1 MiB = 1,048,576 bytes. Counts: Trivy vulnerability entries across targets (not deduplicated). Scan time UTC: ' + fs.readFileSync(path.join(out, 'scan-utc.txt'), 'utf8').trim() + '\n';
fs.writeFileSync(path.join(out, 'trivy-comparison.md'), report);
console.log(report);
NODE
echo "Evidence files: $out"
