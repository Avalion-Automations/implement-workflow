param(
  [Parameter(Mandatory = $true)]
  [string]$Command,

  [int]$Count = 3
)

$results = @()
for ($i = 1; $i -le $Count; $i++) {
  $output = & powershell -NoProfile -Command $Command 2>&1
  $results += [pscustomobject]@{
    Run = $i
    ExitCode = $LASTEXITCODE
    OutputHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData([System.Text.Encoding]::UTF8.GetBytes(($output | Out-String))))
  }
}

$results | Format-Table -AutoSize
$exitCodes = @($results | Select-Object -ExpandProperty ExitCode -Unique)
$outputHashes = @($results | Select-Object -ExpandProperty OutputHash -Unique)
if ($exitCodes.Count -gt 1 -or $outputHashes.Count -gt 1) {
  Write-Error "Repeated command was not deterministic."
  exit 1
}