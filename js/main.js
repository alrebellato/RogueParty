var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;



//Map Size
var mapColumns = 20;
var mapRows = Math.floor(mapColumns*9/16);

//Wall Placement
var smoothness = 2;
var WallPercentChance = 42;


var tileOuterSize = canvasWidth / mapColumns
var tileSize = (canvasWidth / mapColumns)-1;

const FLOOR = 0;
const WALL = 1;

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

    //Prints only if higher priority than previous entity

    knownPositions = new Map();


    for(var e in entityMap){
        entity = entityMap[e]
        higherPriority = false

        if(knownPositions.has(entity.pos)){
            if(entity.priority > knownPositions[entity.pos]){
                knownPositions[entity.pos] = entity.priority;
                higherPriority = true;
            }
        }
        else{
            knownPositions[entity.pos] = entity.priority;
            higherPriority = true;
        }


        if(higherPriority){
            ctx.beginPath();
            ctx.rect(entity.position[1] * tileOuterSize + 1, 
                     entity.position[0] * tileOuterSize + 1, 
                     tileSize, tileSize);
            ctx.fillStyle = entity.colour;
            ctx.fill();
            ctx.closePath();
        }

    }
}

function makeMap(smoothness) {
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
                inputArray[i][j] = WALL;
            }
        }
    }
}

function addMapBorder(inputMap){
    //Populates the edge of the map with walls
    for(let i=0; i < mapColumns; i++){
        inputMap[0][i] = 1;
        inputMap[mapRows-1][i] = WALL;
    }
    for(let i=0; i < mapRows; i++){
        inputMap[i][0] = 1;
        inputMap[i][mapColumns-1] = WALL;
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

            if(inputMap[i-1][j-1] == WALL){
                neighborCount += 1;
            }
            if(inputMap[i-1][j] == WALL){
                neighborCount += 1;
            }
            if(inputMap[i-1][j+1] == WALL){
                neighborCount += 1;
            }
            if(inputMap[i][j+1] == WALL){
                neighborCount += 1;
            }
            if(inputMap[i+1][j+1] == WALL){
                neighborCount += 1;
            }
            if(inputMap[i+1][j] == WALL){
                neighborCount += 1;
            }
            if(inputMap[i+1][j-1] == WALL){
                neighborCount += 1;
            }
            if(inputMap[i][j-1] == WALL){
                neighborCount += 1;
            }

            if(neighborCount >= 5){
                tempArray[i][j] = WALL;
            }
            else{
                tempArray[i][j] = FLOOR;
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

function buildLevel(smoothness){
    entities = new Map();
    entities = makeMap(smoothness);

    exit = new Exit([mapRows - 2, mapColumns - 2]);

    entities[exit.hash] = exit;

    return entities;
}

function placeEntranceExit(){
    //TODO
}

class Node{
    constructor(x, y, weight, distance=100000){
        this.x = x;
        this.y = y;
        this.weight = weight;
        this.distance = distance;
    }
}

function entitiesToGraph(entityList){
    graph = Array(mapRows).fill(0).map(x => Array(mapColumns).fill(0))
    for(var e in entityList){
        pos = entityList[e].position;
        x = pos[0];
        y = pos[1];

        if(!graph[x][y]){
            graph[x][y] = new Node(x, y, entityList[e].movementWeight);
        }
        else{
            graph[x][y].weight = entityList[e].movementWeight + graph[x][y].weight;
        }
    }
    return graph
}

function djikstra(entityMap, originX, originY){
    //Djikstra's weighted pathfinding algorithm.
    //NOTE: Algorithm requires ignoring border of map, meaning that origin cannot be 0
    g = entitiesToGraph(entityMap);

    currentNode = g[originX][originY]

    currentNode.distance = 0;

    unexplored = [currentNode,];

    while(unexplored.length > 0){
        //add neighbors of node to unexplored
        currentNode = unexplored.pop();
        x = currentNode.x;
        y = currentNode.y;

        neighbors = [];
        numNeighbors = 0;
        if(x > 0){
            neighbors[numNeighbors] = (g[x-1][y]);
            numNeighbors += 1;
        }
        if(x < mapRows-1){
            neighbors[numNeighbors] = (g[x+1][y]);
            numNeighbors += 1;
        }
        if(y > 0){
            neighbors[numNeighbors] = (g[x][y-1]);
            numNeighbors += 1;
        }
        if(y < mapColumns-1){
            neighbors[numNeighbors] = (g[x][y+1]);
            numNeighbors += 1;
        }

        for(i=0; i < numNeighbors; i++){
            node = neighbors[i];
            newDistance = currentNode.distance + node.weight;
            if(node.distance > newDistance){
                node.distance = newDistance;
                unexplored.push(node);
            }
        }
    }
    return g;
}


class Entity{
    constructor(pos, movWeight, col, pri=0){
        this.position = pos;
        this.movementWeight = movWeight;
        this.colour = col;
        this.priority = pri;
        this.hash = [pos, pri];
        this.distance = 100000;
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
        super(pos, 1000, wallColour, 1)
    }
}

class Exit extends Entity{
    constructor(pos){
        super(pos, 1, "orange", 3);
    }
}


//Main Script

entities = buildLevel(smoothness);
drawEntities(entities)


djikstraWeights = djikstra(entities, mapRows-1, mapColumns-1)
console.log(djikstraWeights);

//setInterval(draw, 15);
