sh start-server.sh &> output &

echo "kill "$!"\n" > kill.sh

sh start-node-server.sh &> output1 & 

echo "kill "$!"\n" >> kill.sh
