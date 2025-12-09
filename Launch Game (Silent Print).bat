@echo off
REM Santa Says - Launch with Silent Printing
REM This opens Chrome in kiosk printing mode so receipts print automatically
REM Make sure your EPSON TM-T88V is set as the DEFAULT printer in Windows

echo Starting Santa Says with silent printing enabled...
echo.
echo IMPORTANT: Your EPSON TM-T88V Receipt printer must be set as the
echo DEFAULT printer in Windows for automatic printing to work.
echo.

REM Try common Chrome installation paths
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing "%~dp0index.html"
    goto :end
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk-printing "%~dp0index.html"
    goto :end
)

if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --kiosk-printing "%~dp0index.html"
    goto :end
)

REM Try Edge if Chrome not found
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    echo Chrome not found, using Microsoft Edge...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk-printing "%~dp0index.html"
    goto :end
)

echo ERROR: Could not find Chrome or Edge browser.
echo Please install Google Chrome or open the game manually.
pause

:end

