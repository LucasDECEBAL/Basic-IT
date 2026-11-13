param(
  [Parameter(Mandatory = $true)][string]$Path
)

$ErrorActionPreference = "Stop"

# msoAnimEffectFade = 10 ; msoAnimTriggerWithPrevious = 2
$FADE = 10
$WITH_PREVIOUS = 2

$app = New-Object -ComObject PowerPoint.Application
$pres = $app.Presentations.Open($Path, $false, $false, $false)

try {
  foreach ($slide in $pres.Slides) {
    $main = $slide.TimeLine.MainSequence
    # on vide d'eventuelles animations existantes
    for ($i = $main.Count; $i -ge 1; $i--) { $main.Item($i).Delete() }

    $index = 0
    foreach ($shape in $slide.Shapes) {
      $name = ""
      try { $name = [string]$shape.TextFrame.TextRange.Text } catch { }
      # on n'anime pas le pied de page (marque et numerotation)
      if ($name -eq "BASIC IT" -or $name -match '^\d+ / 15$') { continue }

      $effect = $main.AddEffect($shape, $FADE, 0, $WITH_PREVIOUS)
      $effect.Timing.Duration = 0.45
      $effect.Timing.TriggerDelayTime = [Math]::Round($index * 0.08, 2)
      $index++
    }
  }

  $pres.Save()
}
finally {
  $pres.Close()
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}

Write-Output ("animations ajoutees: " + $Path)
