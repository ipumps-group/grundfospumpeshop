@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
echo Done.
pause
