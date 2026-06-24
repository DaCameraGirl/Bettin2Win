# Creates a "Bettin2Win" shortcut on your Desktop with a generated app icon.
# Run this once:  powershell -ExecutionPolicy Bypass -File scripts\install-desktop-icon.ps1
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$icoPath = Join-Path $PSScriptRoot "bettin2win.ico"

# --- 1. Draw a 256x256 brand badge and save it as a (PNG-backed) .ico ---
$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# rounded-square background
$radius = 52
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $radius, $radius, 180, 90)
$path.AddArc($size - $radius, 0, $radius, $radius, 270, 90)
$path.AddArc($size - $radius, $size - $radius, $radius, $radius, 0, 90)
$path.AddArc(0, $size - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()

$rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
$green = [System.Drawing.Color]::FromArgb(74, 222, 128)
$cyan = [System.Drawing.Color]::FromArgb(34, 211, 238)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $green, $cyan, 45)
$g.FillPath($brush, $path)

# A simple white "ball" up top for a sporty feel
$ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(7, 18, 11))
$ballD = 86
$ballX = ($size - $ballD) / 2
$ballY = 30
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.FillEllipse($white, $ballX, $ballY, $ballD, $ballD)
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(7, 18, 11)), 5
$g.DrawEllipse($pen, $ballX, $ballY, $ballD, $ballD)
# a few seams so it reads as a ball, not a dot
$cx = $ballX + $ballD / 2; $cy = $ballY + $ballD / 2
$g.DrawLine($pen, $cx, $cy, $cx, ($ballY + 6))
$g.DrawLine($pen, $cx, $cy, ($ballX + 8), ($ballY + $ballD - 18))
$g.DrawLine($pen, $cx, $cy, ($ballX + $ballD - 8), ($ballY + $ballD - 18))

# "B2W" wordmark, single line, sized to fit
$font = New-Object System.Drawing.Font("Segoe UI", 52, [System.Drawing.FontStyle]::Bold)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
$fmt.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
$textRect = New-Object System.Drawing.RectangleF 0, 138, $size, 92
$g.DrawString("B2W", $font, $ink, $textRect, $fmt)
$g.Dispose()

# Extract pixels (BGRA, top-down) so we can write a classic BMP/DIB icon —
# the most compatible ICO format (renders in Explorer and old GDI+ alike).
$dim = $size
$lockRect = New-Object System.Drawing.Rectangle 0, 0, $dim, $dim
$bd = $bmp.LockBits($lockRect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $bd.Stride
$px = New-Object byte[] ($stride * $dim)
[System.Runtime.InteropServices.Marshal]::Copy($bd.Scan0, $px, 0, $px.Length)
$bmp.UnlockBits($bd)

$xorSize = $dim * $dim * 4
$andSize = $dim * ($dim / 8)   # 1bpp mask, rows already 32-bit aligned at 256px
$dibSize = 40 + $xorSize + $andSize

$ico = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $ico
# ICONDIR
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]1)
# ICONDIRENTRY (0x0 width/height => 256)
$bw.Write([Byte]0); $bw.Write([Byte]0); $bw.Write([Byte]0); $bw.Write([Byte]0)
$bw.Write([UInt16]1); $bw.Write([UInt16]32)
$bw.Write([UInt32]$dibSize); $bw.Write([UInt32]22)
# BITMAPINFOHEADER (height doubled: XOR + AND mask)
$bw.Write([UInt32]40); $bw.Write([Int32]$dim); $bw.Write([Int32]($dim * 2))
$bw.Write([UInt16]1); $bw.Write([UInt16]32); $bw.Write([UInt32]0)
$bw.Write([UInt32]0); $bw.Write([Int32]0); $bw.Write([Int32]0)
$bw.Write([UInt32]0); $bw.Write([UInt32]0)
# XOR pixels, bottom-up
for ($y = $dim - 1; $y -ge 0; $y--) { $bw.Write($px, $y * $stride, $stride) }
# AND mask, all-zero (alpha channel handles transparency)
$bw.Write((New-Object byte[] $andSize))
$bw.Flush()
[System.IO.File]::WriteAllBytes($icoPath, $ico.ToArray())
Write-Host "Icon written to $icoPath" -ForegroundColor Green

# --- 2. Create the Desktop shortcut ---
$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath("Desktop")
$lnkPath = Join-Path $desktop "Bettin2Win.lnk"
$lnk = $ws.CreateShortcut($lnkPath)
$openLive = "C:\Users\enter\OneDrive\Projects\links\scripts\open-live.ps1"
$liveUrl = "https://dacameragirl.github.io/Bettin2Win/"
$lnk.TargetPath = (Get-Command powershell).Source
$lnk.Arguments = "-ExecutionPolicy Bypass -NoProfile -File `"$openLive`" -Url `"$liveUrl`""
$lnk.WorkingDirectory = $root
$lnk.IconLocation = "$icoPath,0"
$lnk.Description = "Open Bettin2Win live - same link as Angela's Projects hub"
$lnk.WindowStyle = 1
$lnk.Save()
Write-Host "Desktop shortcut created: $lnkPath" -ForegroundColor Green
Write-Host "Double-click 'Bettin2Win' on your desktop to start the app." -ForegroundColor Cyan
