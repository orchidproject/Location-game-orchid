sh start-server.sh &> output &

echo "kill "$!"&&" > kill.sh

sh start-node-server.sh &> output1 & 

echo "kill "$!" >> kill.sh
