#!/bin/bash

# helper script to reduce files (every other file) in case you think you recorded too much
for file in $(find ~/Musik/DawnChorus/BiotopSielsdorf24.04.2022/ -type f | awk 'NR % 2 == 0'); do
  echo "$file"
  rm "$file"
done