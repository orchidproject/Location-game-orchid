node agent-test.js $1 > output &
echo "kill "$!"\n" > kill.sh
node agent-medic.js $1 > output &
echo "kill "$!"\n" >> kill.sh


