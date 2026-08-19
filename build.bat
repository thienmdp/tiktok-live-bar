@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "ROOT=%~dp0"
set "PROJECT_DIR=%ROOT%UnityProject"
set "OUTPUT_EXE=%ROOT%Build\THIENMDP_Live.exe"
set "LOG_FILE=%ROOT%build_log.txt"
set "PROJECT_VERSION="

for /f "tokens=2 delims=:" %%v in ('findstr /b "m_EditorVersion:" "%PROJECT_DIR%\ProjectSettings\ProjectVersion.txt" 2^>nul') do for /f "tokens=*" %%w in ("%%v") do set "PROJECT_VERSION=%%w"

if not defined PROJECT_VERSION (
    echo [LOI] Khong doc duoc phien ban Unity tu ProjectVersion.txt.
    goto :failed
)

set "UNITY_EXE=C:\Program Files\Unity\Hub\Editor\%PROJECT_VERSION%\Editor\Unity.exe"
if not exist "%UNITY_EXE%" (
    echo [LOI] Chua cai dung Unity %PROJECT_VERSION%.
    echo Hay cai phien ban nay bang Unity Hub roi chay lai build.bat.
    goto :failed
)

echo =======================================
echo     BUILD GAME THIENMDP LIVE
echo =======================================
echo Unity: %PROJECT_VERSION%
echo Output: %OUTPUT_EXE%
echo.

if not exist "%ROOT%Build" mkdir "%ROOT%Build"
"%UNITY_EXE%" -quit -batchmode -projectPath "%PROJECT_DIR%" -buildWindows64Player "%OUTPUT_EXE%" -logFile "%LOG_FILE%"
set "BUILD_RESULT=%ERRORLEVEL%"

if not "%BUILD_RESULT%"=="0" (
    echo [LOI] Unity build that bai ^(ma loi %BUILD_RESULT%^).
    echo Xem log: %LOG_FILE%
    goto :failed
)

if not exist "%OUTPUT_EXE%" (
    echo [LOI] Unity khong tao file %OUTPUT_EXE%.
    echo Xem log: %LOG_FILE%
    goto :failed
)

if exist "%ROOT%DJ_MUSIC" (
    if not exist "%ROOT%Build\DJ_MUSIC" mkdir "%ROOT%Build\DJ_MUSIC"
    copy /Y "%ROOT%DJ_MUSIC\VOLUME.txt" "%ROOT%Build\DJ_MUSIC\" >nul 2>&1
    for %%E in (mp3 wav ogg) do copy /Y "%ROOT%DJ_MUSIC\*.%%E" "%ROOT%Build\DJ_MUSIC\" >nul 2>&1
)
if exist "%ROOT%DJ_VIDEO" (
    if not exist "%ROOT%Build\DJ_VIDEO" mkdir "%ROOT%Build\DJ_VIDEO"
    copy /Y "%ROOT%DJ_VIDEO\BPM.txt" "%ROOT%Build\DJ_VIDEO\" >nul 2>&1
    for %%E in (mp4 mov m4v webm png jpg jpeg) do copy /Y "%ROOT%DJ_VIDEO\*.%%E" "%ROOT%Build\DJ_VIDEO\" >nul 2>&1
)
if exist "%ROOT%LiveAssets" (
    if not exist "%ROOT%Build\LiveAssets" mkdir "%ROOT%Build\LiveAssets"
    xcopy /E /Y /I "%ROOT%LiveAssets\*" "%ROOT%Build\LiveAssets\" >nul 2>&1
)

echo.
echo Build thanh cong: %OUTPUT_EXE%
pause
exit /b 0

:failed
echo.
pause
exit /b 1
