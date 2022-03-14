var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;



//Map Size
var mapColumns = 96;
var mapRows = 54;

//Wall Placement
var smoothness = 2;
var WallPercentChance = 42;


var tileOuterSize = canvasWidth / mapColumns
var tileSize = (canvasWidth / mapColumns)-1;

var floor = 0;
var wall = 1;

var wallColour = "black";
var floorColour = "gainsboro"

function drawMap(inputMap){
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    //Iterates through 2dArray and prints a rectangle coloured based on type.
    for(let i=0; i < mapRows; i++){
        for(let j=0; j < mapColumns; j++){
            ctx.beginPath();
            ctx.rect(j * tileOuterSize + 1, i * tileOuterSize + 1, tileSize, tileSize); 
            //console.log("Tile: {}, {}", i, j);
            if(inputMap[i][j] == 1){
                ctx.fillStyle = wallColour;
            }
            else{
                ctx.fillStyle = floorColour;
            }
            ctx.fill();
            ctx.closePath();
        }
    }
    
}

function drawEntities(entityMap){

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    //TODO print based on priority

    for(var e in entityMap){

        ctx.beginPath();
        ctx.rect(entityMap[e].position[1] * tileOuterSize + 1, 
                 entityMap[e].position[0] * tileOuterSize + 1, 
                 tileSize, tileSize);
        ctx.fillStyle = entityMap[e].colour;
        ctx.fill();
        ctx.closePath();
    }
}

function makeMap(entityMap, smoothness) {
    map = Array(mapRows).fill(0).map(x => Array(mapColumns).fill(0))
    generateNoise(map);
    addMapBorder(map);

    for(let i=0; i < smoothness; i++){
        map = smooothMap(map);
    }
    return numsToEnts(map);
}

function generateNoise(inputArray) {
    //Populates an empty map with psudo-random noise
    for(let i=0; i < mapRows; i++){
        for(let j=0; j < mapColumns; j++){
            if(Math.floor(Math.random() * 100) < WallPercentChance){
                inputArray[i][j] = wall;
            }
        }
    }
}

function addMapBorder(inputMap){
    //Populates the edge of the map with walls
    for(let i=0; i < mapColumns; i++){
        inputMap[0][i] = 1;
        inputMap[mapRows-1][i] = wall;
    }
    for(let i=0; i < mapRows; i++){
        inputMap[i][0] = 1;
        inputMap[i][mapColumns-1] = wall;
    }
}

function smooothMap(inputMap){
    //Smooths the map, by making each tile become what most of it's neighbours are.
    tempArray = Array(mapRows).fill(0).map(x => Array(mapColumns).fill(0));

    // Copy values from map into temp array
    for(let i=0; i<mapRows; i++){
        for(let j=0; j<mapColumns; j++){
            tempArray[i][j] = inputMap[i][j];
        }
    }


    //Checks number of neighbours. If Mostly walls, turn into wall.
    for(let i=1; i<mapRows-1; i++){
        for(let j=1; j<mapColumns-1; j++){
            //if currently a wall, neighborCount = 1, else 0.
            let neighborCount = inputMap[i][j];

            if(inputMap[i-1][j-1] == wall){
                neighborCount += 1;
            }
            if(inputMap[i-1][j] == wall){
                neighborCount += 1;
            }
            if(inputMap[i-1][j+1] == wall){
                neighborCount += 1;
            }
            if(inputMap[i][j+1] == wall){
                neighborCount += 1;
            }
            if(inputMap[i+1][j+1] == wall){
                neighborCount += 1;
            }
            if(inputMap[i+1][j] == wall){
                neighborCount += 1;
            }
            if(inputMap[i+1][j-1] == wall){
                neighborCount += 1;
            }
            if(inputMap[i][j-1] == wall){
                neighborCount += 1;
            }

            if(neighborCount >= 5){
                tempArray[i][j] = wall;
            }
            else{
                tempArray[i][j] = floor;
            }
        }
    }
    return tempArray;
}

function numsToEnts(inputMap){
    entityMap = new Map();
    //Converts the 1s and 0s in map gen to entities.
    for(let i=0; i<mapRows; i++){
        for(let j=0; j<mapColumns; j++){
            if(inputMap[i][j] == 1){
                thisWall = new Wall([i,j]);
                entityMap[thisWall.hash] = thisWall;
            }
            else{
                thisFloor = new Floor([i,j]);
                entityMap[thisFloor.hash] = thisFloor;
            }
        }
    } 
    return entityMap;
}

class Entity{
    constructor(pos, movWeight, col, pri=0){
        this.position = pos;
        this.movementWeight = movWeight;
        this.colour = col;
        this.priority = pri;
        this.hash = [pos, pri]
    }
    get_position(){
        return this.position;
    }
    set_position(x, y){
        this.position = [x, y];
    }
    set_position([x,y]){
        this.position = [x,y];
    }

    get_movWeight(){
        return this.movementWeight;
    }
    set_movWeight(weight){
        this.movementWeight = weight;
    }

    get_colour(){
        return this.colour;
    }
    set_colour(colString){
        this.colour = colString;
    }

    get_priority(){
        return this.priority;
    }
    set_priority(priorityVal){
        this.priority = priorityVal
    }
}

class Floor extends Entity{
    constructor(pos){
        super(pos, 1, floorColour, 0);
    }  
}

class Wall extends Entity{
    constructor(pos){
        super(pos, 100, wallColour, 2)
    }
}


//Main Script
entities = new Map();
entities = makeMap(entities, smoothness);

drawEntities(entities)

console.log(entities.size);

//setInterval(draw, 15);
