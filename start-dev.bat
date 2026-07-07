@echo off
cd /d D:\WORKS\iPumps\MayRemp2
echo Starting dev server on port 3001...
start "" http://localhost:3001/haldus/ads/sync
npm run dev -- -p 3001
pause
