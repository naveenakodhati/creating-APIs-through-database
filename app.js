const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/players", async (request, response) => {
  const getPlayers = `SELECT * FROM player_details ;`;
  const getPlayersData = await db.all(getPlayers);
  response.send(
    getPlayersData.map((eachData) => ({
      playerId: eachData.player_id,
      playerName: eachData.player_name,
    }))
  );
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const playerObject = await db.get(getPlayer);
  response.send({
    playerId: playerObject.player_id,
    playerName: playerObject.player_name,
  });
});

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerData = `UPDATE player_details
    SET player_name='${playerName}'
     WHERE player_id=${playerId};`;
  await db.run(updatePlayerData);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const getMatch = await db.get(getMatchDetails);
  response.send({
    matchId: getMatch.match_id,
    match: getMatch.match,
    year: getMatch.year,
  });
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersMatch = `SELECT match_details.match_id,match,year FROM match_details INNER JOIN player_match_score ON 
    match_details.match_id = player_match_score.match_id 
    WHERE player_id = ${playerId};`;
  const playersMatch = await db.all(getPlayersMatch);
  response.send(
    playersMatch.map((eachData) => ({
      matchId: eachData.match_id,
      match: eachData.match,
      year: eachData.year,
    }))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayers = `SELECT * FROM player_details INNER JOIN player_match_score ON 
    player_match_score.player_id = player_details.player_id 
    WHERE match_id=${matchId};`;
  const getMatchesData = await db.all(getMatchPlayers);
  response.send(
    getMatchesData.map((eachData) => ({
      playerId: eachData.player_id,
      playerName: eachData.player_name,
    }))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerData = `SELECT player_details.player_id,player_name,SUM(score) as totalScore,SUM(fours) as totalFours,SUM(sixes) as totalSixes FROM player_details NATURAL JOIN player_match_score  

    WHERE player_details.player_id = ${playerId}; `;
  const playerData = await db.get(getPlayerData);
  response.send({
    playerId: playerData.player_id,
    playerName: playerData.player_name,
    totalScore: playerData.totalScore,
    totalFours: playerData.totalFours,
    totalSixes: playerData.totalSixes,
  });
});

module.exports = app;
