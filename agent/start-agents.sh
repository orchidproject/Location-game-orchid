node agent-1.js $1 > output &
echo "kill "$!"\n" > kill.sh
node agent-2.js $1 > output &
echo "kill "$!"\n" >> kill.sh
node agent-3.js $1 > output &
echo "kill "$!"\n" >> kill.sh
node agent-4.js $1 > output &
echo "kill "$!"\n" >> kill.sh


