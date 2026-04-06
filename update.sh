#!/bin/bash
clear

# Simple loading
printf "Checking for updates"
for i in 1 2 3 4 5; do
  sleep 1
  printf "."
done
echo

git fetch origin > /dev/null 2>&1
UPDATES=$(git rev-list HEAD..origin/main --count)

if [ "$UPDATES" -eq 0 ]; then
  clear
  echo "Open Claude Code is already up-to-date."
  read -p "Press Enter to continue..."
  exit 0
fi

echo "Updating Open Claude Code..."
printf "Updating"
for i in 1 2 3 4 5; do
  sleep 1
  printf "."
done
echo

git reset --hard origin/main > /dev/null 2>&1
git pull > /dev/null 2>&1

COMMIT_MSG=$(git log -1 --pretty=format:"%s")
echo "New Update: $COMMIT_MSG"

echo
echo "Building Open Claude Code..."
printf "Building"
for i in 1 2 3 4 5; do
  sleep 1
  printf "."
done
echo

bun run build > /dev/null 2>&1

echo "Running CLI..."
clear
bun dist/cli.js

echo
echo "Done!"
read -p "Press Enter to continue..."
