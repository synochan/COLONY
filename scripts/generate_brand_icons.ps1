Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root "public\icons"
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

function New-Color([int]$a, [int]$r, [int]$g, [int]$b) {
  return [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function Write-SvgAsset {
  param([string]$Path)

  $svg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#2f275f"/>
      <stop offset="100%" stop-color="#140f31"/>
    </radialGradient>
    <radialGradient id="hiveGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#ffbf72" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ff7a45" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hiveFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffcf70"/>
      <stop offset="100%" stop-color="#ff9e35"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bgGlow)"/>
  <g opacity="0.18" stroke="#fff4d8" stroke-width="1">
    <path d="M64 0v512M128 0v512M192 0v512M256 0v512M320 0v512M384 0v512M448 0v512"/>
    <path d="M0 64h512M0 128h512M0 192h512M0 256h512M0 320h512M0 384h512M0 448h512"/>
  </g>
  <circle cx="266" cy="258" r="210" fill="none" stroke="#ff6b6b" stroke-opacity="0.45" stroke-width="4"/>
  <g fill="#ffd166">
    <circle cx="92" cy="150" r="8"/>
    <circle cx="132" cy="116" r="6"/>
    <circle cx="396" cy="158" r="6"/>
    <circle cx="366" cy="404" r="10"/>
    <circle cx="288" cy="114" r="9"/>
  </g>
  <g stroke="#d7923a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 256L178 224"/>
    <path d="M256 256L154 264"/>
    <path d="M256 256L208 158"/>
  </g>
  <g fill="#ffca6e" stroke="#ff9b37" stroke-width="4">
    <path d="M178 208l14 16-14 16-14-16z"/>
    <path d="M154 248l14 16-14 16-14-16z"/>
    <path d="M208 142l10 12-10 12-10-12z"/>
  </g>
  <circle cx="256" cy="256" r="52" fill="url(#hiveGlow)"/>
  <circle cx="256" cy="256" r="30" fill="url(#hiveFill)"/>
  <circle cx="246" cy="248" r="10" fill="#ff6b6b"/>
  <circle cx="260" cy="260" r="5.5" fill="#1c1738"/>
  <rect x="232" y="284" width="48" height="7" rx="3.5" fill="#ff6b6b"/>
</svg>
'@
  Set-Content -Path $Path -Value $svg -Encoding UTF8
}

function Draw-Grid {
  param($graphics, [int]$size)

  $step = [Math]::Max(8, [int]($size / 8))
  $pen = New-Object System.Drawing.Pen((New-Color 18 255 244 216), [Math]::Max(1, $size / 256))
  for ($x = 0; $x -le $size; $x += $step) {
    $graphics.DrawLine($pen, $x, 0, $x, $size)
  }
  for ($y = 0; $y -le $size; $y += $step) {
    $graphics.DrawLine($pen, 0, $y, $size, $y)
  }
  $pen.Dispose()
}

function Draw-ColonyMark {
  param($graphics, [int]$size)

  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $backgroundBrush = New-Object System.Drawing.SolidBrush((New-Color 255 26 20 64))
  $graphics.FillRectangle($backgroundBrush, 0, 0, $size, $size)
  $backgroundBrush.Dispose()

  Draw-Grid -graphics $graphics -size $size

  $centerX = $size * 0.5
  $centerY = $size * 0.5
  $ringRadius = $size * 0.41
  $ringPen = New-Object System.Drawing.Pen((New-Color 90 255 107 107), [Math]::Max(1.2, $size * 0.008))
  $graphics.DrawEllipse($ringPen, $centerX - $ringRadius, $centerY - $ringRadius, $ringRadius * 2, $ringRadius * 2)
  $ringPen.Dispose()

  $dotBrush = New-Object System.Drawing.SolidBrush((New-Color 255 255 209 102))
  $dotGlow = New-Object System.Drawing.SolidBrush((New-Color 70 255 209 102))
  $dots = @(
    [PSCustomObject]@{ X = 0.14; Y = 0.22; R = 0.018 },
    [PSCustomObject]@{ X = 0.20; Y = 0.17; R = 0.014 },
    [PSCustomObject]@{ X = 0.77; Y = 0.24; R = 0.016 },
    [PSCustomObject]@{ X = 0.71; Y = 0.79; R = 0.022 },
    [PSCustomObject]@{ X = 0.56; Y = 0.18; R = 0.020 }
  )
  foreach ($dot in $dots) {
    $x = ([double]$dot.X) * $size
    $y = ([double]$dot.Y) * $size
    $r = ([double]$dot.R) * $size
    $graphics.FillEllipse($dotGlow, $x - ($r * 1.8), $y - ($r * 1.8), $r * 3.6, $r * 3.6)
    $graphics.FillEllipse($dotBrush, $x - $r, $y - $r, $r * 2, $r * 2)
  }
  $dotGlow.Dispose()
  $dotBrush.Dispose()

  $workerPoints = @(
    [PSCustomObject]@{ X = 0.34; Y = 0.44; R = 0.023 },
    [PSCustomObject]@{ X = 0.29; Y = 0.50; R = 0.024 },
    [PSCustomObject]@{ X = 0.41; Y = 0.31; R = 0.015 }
  )
  $linePen = New-Object System.Drawing.Pen((New-Color 210 215 146 58), [Math]::Max(1.4, $size * 0.006))
  $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round

  foreach ($worker in $workerPoints) {
    $wx = ([double]$worker.X) * $size
    $wy = ([double]$worker.Y) * $size
    $graphics.DrawLine($linePen, $centerX, $centerY, $wx, $wy)
  }
  $linePen.Dispose()

  $workerBrush = New-Object System.Drawing.SolidBrush((New-Color 255 255 202 110))
  $workerPen = New-Object System.Drawing.Pen((New-Color 255 255 155 55), [Math]::Max(1, $size * 0.006))
  foreach ($worker in $workerPoints) {
    [float]$wx = ([double]$worker.X) * $size
    [float]$wy = ([double]$worker.Y) * $size
    [float]$r = ([double]$worker.R) * $size
    $poly = New-Object System.Drawing.PointF[] 4
    $poly[0] = [System.Drawing.PointF]::new($wx, ($wy - $r))
    $poly[1] = [System.Drawing.PointF]::new(($wx + $r), $wy)
    $poly[2] = [System.Drawing.PointF]::new($wx, ($wy + $r))
    $poly[3] = [System.Drawing.PointF]::new(($wx - $r), $wy)
    $graphics.FillPolygon($workerBrush, $poly)
    $graphics.DrawPolygon($workerPen, $poly)
  }
  $workerBrush.Dispose()
  $workerPen.Dispose()

  $glowRadius = $size * 0.09
  $glowBrush = New-Object System.Drawing.SolidBrush((New-Color 90 255 171 84))
  $graphics.FillEllipse($glowBrush, $centerX - ($glowRadius * 1.8), $centerY - ($glowRadius * 1.8), $glowRadius * 3.6, $glowRadius * 3.6)
  $glowBrush.Dispose()

  $hiveRect = New-Object System.Drawing.RectangleF(($centerX - ($size * 0.045)), ($centerY - ($size * 0.045)), ($size * 0.09), ($size * 0.09))
  $hiveBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($hiveRect, (New-Color 255 255 207 112), (New-Color 255 255 158 53), 45)
  $graphics.FillEllipse($hiveBrush, $hiveRect)
  $hiveBrush.Dispose()

  $highlightBrush = New-Object System.Drawing.SolidBrush((New-Color 240 255 107 107))
  $graphics.FillEllipse($highlightBrush, $centerX - ($size * 0.028), $centerY - ($size * 0.024), $size * 0.03, $size * 0.03)
  $highlightBrush.Dispose()

  $coreBrush = New-Object System.Drawing.SolidBrush((New-Color 255 28 23 56))
  $graphics.FillEllipse($coreBrush, $centerX, $centerY, $size * 0.016, $size * 0.016)
  $coreBrush.Dispose()

  $barBrush = New-Object System.Drawing.SolidBrush((New-Color 255 255 107 107))
  $barWidth = $size * 0.09
  $barHeight = [Math]::Max(2, $size * 0.012)
  $graphics.FillRectangle($barBrush, $centerX - ($barWidth / 2), $centerY + ($size * 0.06), $barWidth, $barHeight)
  $barBrush.Dispose()
}

function Save-Png {
  param([int]$Size, [string]$Path)

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Draw-ColonyMark -graphics $graphics -size $Size
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Write-Ico {
  param(
    [string]$Path,
    [string[]]$PngPaths
  )

  $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Create)
  $writer = New-Object System.IO.BinaryWriter($stream)
  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]$PngPaths.Count)

  $payloads = @()
  $offset = 6 + (16 * $PngPaths.Count)
  foreach ($pngPath in $PngPaths) {
    $bytes = [System.IO.File]::ReadAllBytes($pngPath)
    $sizeName = [int][System.IO.Path]::GetFileNameWithoutExtension($pngPath).Split('-')[-1]
    $payloads += [PSCustomObject]@{
      Size = $sizeName
      Bytes = $bytes
      Offset = $offset
    }
    $offset += $bytes.Length
  }

  foreach ($payload in $payloads) {
    $dim = if ($payload.Size -ge 256) { 0 } else { [byte]$payload.Size }
    $writer.Write([byte]$dim)
    $writer.Write([byte]$dim)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$payload.Bytes.Length)
    $writer.Write([UInt32]$payload.Offset)
  }

  foreach ($payload in $payloads) {
    $writer.Write($payload.Bytes)
  }

  $writer.Dispose()
  $stream.Dispose()
}

$svgPath = Join-Path $iconsDir "colony-mark.svg"
Write-SvgAsset -Path $svgPath

$sizes = @(16, 32, 48, 64, 72, 96, 128, 180, 192, 256, 512, 1024)
foreach ($size in $sizes) {
  $pngPath = Join-Path $iconsDir ("colony-icon-{0}.png" -f $size)
  Save-Png -Size $size -Path $pngPath
}

$faviconPng = Join-Path $iconsDir "favicon-32.png"
Copy-Item (Join-Path $iconsDir "colony-icon-32.png") $faviconPng -Force

$applePng = Join-Path $iconsDir "apple-touch-icon.png"
Copy-Item (Join-Path $iconsDir "colony-icon-180.png") $applePng -Force

$android192 = Join-Path $iconsDir "android-chrome-192x192.png"
Copy-Item (Join-Path $iconsDir "colony-icon-192.png") $android192 -Force

$android512 = Join-Path $iconsDir "android-chrome-512x512.png"
Copy-Item (Join-Path $iconsDir "colony-icon-512.png") $android512 -Force

$faviconIco = Join-Path $iconsDir "favicon.ico"
Write-Ico -Path $faviconIco -PngPaths @(
  (Join-Path $iconsDir "colony-icon-16.png"),
  (Join-Path $iconsDir "colony-icon-32.png"),
  (Join-Path $iconsDir "colony-icon-48.png")
)

Write-Output "Generated Colony brand icons in $iconsDir"
