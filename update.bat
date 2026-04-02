@echo off
cls

:: Simple loading
set /p="Checking for updates" <nul
for /l %%i   in (1,1,5) do (
    timeout /t 1 >nul
    set /p="." <nul
)
echo.

git fetch origin >nul 2>&1
for /f %%i in ('git rev-list HEAD..origin/main --count') do set UPDATES=%%i

if %UPDATES%==0 (
    cls
    echo Open Claude Code is already up-to-date.
    pause
    exit /b
)

echo Updating Open Claude Code...
set /p="Updating" <nul
for /l %%i in (1,1,5) do (
    timeout /t 1 >nul
    set /p="." <nul
)
echo.

git reset --hard origin/main >nul 2>&1
git pull >nul 2>&1

for /f "delims=" %%i in ('git log -1 --pretty^=format:"%%s"') do set COMMIT_MSG=%%i
echo New Update: %COMMIT_MSG%

echo.
echo Building Open Claude Code...
set /p="Building" <nul
for /l %%i in (1,1,5) do (
    timeout /t 1 >nul
    set /p="." <nul
)
echo.

bun run build >nul 2>&1

echo Running CLI...
cls
bun dist/cli.js

echo.
echo Done!
pause