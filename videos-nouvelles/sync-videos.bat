@echo off
REM ============================================================
REM Mystora - Sync Videos Nouvelles -> VPS n8n
REM Double-clique ce fichier pour pousser toutes les vidéos
REM des sous-dossiers d'ambiance vers le VPS Hetzner.
REM Les vidéos uploadées sont DÉPLACÉES dans _uploaded\
REM ============================================================

setlocal EnableDelayedExpansion
set "WEBHOOK=http://77.42.83.139:5678/webhook/import-video"
set "KEY=mystora-import-ke6ngy2w05"
set "BASE=%~dp0"
set "UPLOADED=%BASE%_uploaded"

if not exist "%UPLOADED%" mkdir "%UPLOADED%"

set /a total=0
set /a ok=0
set /a ko=0

echo.
echo ============================================================
echo  MYSTORA - Sync Videos vers VPS
echo ============================================================
echo.

for %%A in (astres bougie cartes cristal horloge manuscrit miroir runes) do (
  if exist "%BASE%%%A" (
    for %%F in ("%BASE%%%A\*.mp4") do (
      set /a total+=1
      echo [!total!] Upload %%A / %%~nxF ...
      curl -sS -X POST "%WEBHOOK%" ^
        -H "x-mystora-key: %KEY%" ^
        -F "ambiance=%%A" ^
        -F "file=@%%F" -o "%TEMP%\mystora_resp.json" -w "HTTP %%{http_code}\n"
      findstr /C:"\"ok\":true" "%TEMP%\mystora_resp.json" >nul
      if !errorlevel! EQU 0 (
        set /a ok+=1
        if not exist "%UPLOADED%\%%A" mkdir "%UPLOADED%\%%A"
        move "%%F" "%UPLOADED%\%%A\" >nul
        echo     OK - file moved to _uploaded\%%A\
      ) else (
        set /a ko+=1
        echo     ECHEC:
        type "%TEMP%\mystora_resp.json"
      )
      echo.
    )
  )
)

echo ============================================================
echo  RESULTAT : !ok! OK  /  !ko! ECHEC  /  !total! TOTAL
echo ============================================================
echo.
pause
