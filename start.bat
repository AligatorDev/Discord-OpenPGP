@echo off

echo Killing Discord Instances!
taskkill /f /im Discord.exe
echo Running script!
node main.js

