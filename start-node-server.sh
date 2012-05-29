time=$(date +%s)
mkdir ./logs/old_$time
mv ./logs/log* ./logs/old_$time
cat socket.io.server.config main.js > main-runtime.js
node main-runtime.js 49991 8080