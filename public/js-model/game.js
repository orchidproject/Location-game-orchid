//model of game 

function Game(game_id){
	this.id=game_id;
	this.tasks=[];
	this.dropOffZone=[];
	this.gameArea= new GameArea();

	this.taskChanged=false;
	this.dropOffZoneChnaged=false;
	this.gameAreaChanged=false;
}

Game.prototype.loadData = function(){

}

Game.prototype.uploadData = function(){

}

//model of game area

function GameArea(){
	this.simulation=null;
	this.latitude=null;
	this.grid_size=null;
	this.update_interval=null;
}


//model of task



//modle of drop off zone



//model of player
