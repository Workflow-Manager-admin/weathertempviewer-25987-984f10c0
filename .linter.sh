#!/bin/bash
cd /home/kavia/workspace/code-generation/weathertempviewer-25987-984f10c0/weather_temp_viewer
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

