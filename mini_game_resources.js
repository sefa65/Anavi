var event_gen = require ("./event_gen.json");
var resources = require("./mini_game_resources.json");
var fs = require('fs');

//Contains all the IDs of the users who voted and the number of time they did, max 3.
var vote_status;

//Current weather on the village
var currentWeather;

//Contains the value to add/substract to the current resources.
var resourcesToCommit = {
	"adults": 0,
	"children": 0,
	"happiness": 0,
	"hunted_animals": 0,
	"meat": 0,
	"leather": 0,
	"water": 0,
	"wood": 0,
	"fiber": 0,
	"stone": 0,
	"weapons": 0,
	"clothes": 0,
	"houses": 0
}

//Contains all the votes for each action
var vote_actions = {
	"hunt": 0,
	"processAnimals": 0,
	"buildHouses": 0,
	"createWeapons": 0,
	"recoltFiber": 0,
	"recoltStone": 0,
	"recoltWood": 0,
	"recoltWater": 0,
	"createClothes": 0,
	"reproduce": 0
};

//Contains the interval [min, max] for each action that require a number.
//When commited, it will choose a random value between those two, except if there's only one
var interval_actions = {
	"processAnimals": [0,0],
	"buildHouses": [0,0],
	"createWeapons": [0,0],
	"recoltFiber": [0,0],
	"recoltStone": [0,0],
	"recoltWood": [0,0],
	"recoltWater": [0,0],
	"createClothes": [0,0]
};

function MiniGame(time, bot, channel) {

	//Internal functions
	this.isInt = isInt;
	this.getWeather = getWeather;

	//Functions used by players
	this.hunt = hunt;
	this.checkProcessAnimals = checkProcessAnimals;
	this.checkBuildHouses = checkBuildHouses;
	this.checkCreateWeapons = checkCreateWeapons;
	this.checkRecoltFiber = checkRecoltFiber;
	this.checkRecoltStone = checkRecoltStone;
	this.checkRecoltWood = checkRecoltWood;
	this.checkRecoltWater = checkRecoltWater;
	this.checkCreateClothes = checkCreateClothes;
	this.reproduce = reproduce;
	this.vote = vote;
	this.currentStatus = currentStatus;

	//Check if the time is an int between 0 and 23.
	//This part launches the game.
	if(this.isInt(time)) {

		if(time >= 0 && time <= 23) {

			var CronJob = require('cron').CronJob;

			//Creates a periodic job that launches everyday at "time". 
			//This job should print the current status of the resources, with the differences with the day before.
			//It should print the weather for the day.
			//var job = new CronJob('* * */'+time+' * * *', function() {});

			var job = new CronJob('*/10 * * * * *', function() {
				var action1;
				var action2;
				var action3;

				//Process the votes to choose the 3 preferred actions
				for(var action in vote_actions) {
					if(action3 === undefined || vote_actions[action] > vote_actions[action3]) {
						if(action2 === undefined || vote_actions[action] > vote_actions[action2]) {
							if(action1 === undefined || vote_actions[action] > vote_actions[action1]) {
								action3 = action2;
								action2 = action1;
								action1 = action;

							} else {
								action3 = action2;
								action2 = action;
							}
						} else {
							action3 = action;
						}
					}
				}


				processAction(action1);
				processAction(action2);
				processAction(action3);



				//------------------------------- CHECK WEATHER -------------------------------//
				switch(currentWeather) {


					case "Grêle":
						var checkFiberLoss = (Math.floor(Math.random()*100) < 15);
						var checkWoodLoss = (Math.floor(Math.random()*100) < 15);
						var checkMeatLoss = (Math.floor(Math.random()*100) < 15);
						var checkLeatherLoss = (Math.floor(Math.random()*100) < 15);

						if(checkFiberLoss) {
							//Chooses a number between 0 and 33
							var rand = Math.floor(Math.random()*33);
							resourcesToCommit.fiber -= resources.fiber*(rand/100);
						}

						if(checkWoodLoss) {
							//Chooses a number between 0 and 33
							var rand = Math.floor(Math.random()*33);
							resourcesToCommit.wood -= resources.wood*(rand/100);
						}

						if(checkMeatLoss) {
							//Chooses a number between 0 and 33
							var rand = Math.floor(Math.random()*33);
							resourcesToCommit.meat -= resources.meat*(rand/100);
						}

						if(checkLeatherLoss) {
							//Chooses a number between 0 and 33
							var rand = Math.floor(Math.random()*33);
							resourcesToCommit.leather -= resources.leather*(rand/100);
						}
						break;


					case "Pluvieux":
						//Augmente les ressources en eau par Adultes/3
						resourcesToCommit.water += Math.floor(resources.adults/3);
						break;


					case "Vent":
						var checkFiberLoss = (Math.floor(Math.random()*100) < 5);
						var checkLeatherLoss = (Math.floor(Math.random()*100) < 5);
						//5% de chances de perdre 0-50% Fibres
						if(checkFiberLoss) {
							var rand = Math.floor(Math.random()*50);
							resourcesToCommit.fiber -= resources.fiber*(rand/100);
						}

						//5% de chances de perdre 0-10% Cuir
						if(checkLeatherLoss) {
							var rand = Math.floor(Math.random()*10);
							resourcesToCommit.leather -= resources.leather*(rand/100);
						}
						break;


					case "Orage":
						//15% de chance de perdre 0-75% des Ressources en Bois, Fibres et Cuir
						var checkFiberLoss = (Math.floor(Math.random()*100) < 15);
						var checkWoodLoss = (Math.floor(Math.random()*100) < 15);
						var checkLeatherLoss = (Math.floor(Math.random()*100) < 15);

						if(checkFiberLoss) {
							//Chooses a number between 0 and 33
							var rand = Math.floor(Math.random()*75);
							resourcesToCommit.fiber -= resources.fiber*(rand/100);
						}

						if(checkWoodLoss) {
							//Chooses a number between 0 and 33
							var rand = Math.floor(Math.random()*75);
							resourcesToCommit.wood -= resources.wood*(rand/100);
						}

						if(checkLeatherLoss) {
							//Chooses a number between 0 and 33
							var rand = Math.floor(Math.random()*75);
							resourcesToCommit.leather -= resources.leather*(rand/100);
						}

						//Eau augmentée de Adultes/2
						resourcesToCommit.water += Math.floor(resources.adults/2);
						break;


					case "Tornade":
						//0-75% des Habitations Détruites
						//0-50% Population Adulte + Enfant tuée
						resourcesToCommit.houses -= Math.floor(resources.houses*(Math.random()*75));
						resourcesToCommit.adults -= Math.floor(resources.adults*(Math.random()*50));
						resourcesToCommit.children -= Math.floor(resources.children*(Math.random()*50));

						//3 ressources aléatoires détruites de 0-75%
						var temp_array[] = ["hunted_animals","meat", "leather", "fiber", "water", "wood", "stone", "weapons", "clothes"];
						var check = 0;
						var rand = 0;
						while(check < 3) {
							rand = Math.floor(Math.random()*temp_array.length);
							resourcesToCommit[temp_array[rand]] -= Math.floor(Math.random()*75);
							temp_array = temp_array.splice(temp_array.indexOf(rand), 1);
							check++;
						}
						break;
				}
				//---------------------------------------------------------------------------------------------------//



				//TODO : Happiness


				//TO REPLACE WITH COMMIT
				vote_actions = {
					"hunt": 0,
					"processAnimals": 0,
					"buildHouses": 0,
					"createWeapons": 0,
					"recoltFiber": 0,
					"recoltStone": 0,
					"recoltWood": 0,
					"recoltWater": 0,
					"createClothes": 0,
					"reproduce": 0
				};

				interval_actions = {
					"processAnimals": [0,0],
					"buildHouses": [0,0],
					"createWeapons": [0,0],
					"recoltFiber": [0,0],
					"recoltStone": [0,0],
					"recoltWood": [0,0],
					"recoltWater": [0,0],
					"createClothes": [0,0]
				};

				interval_actions = {
					"processAnimals": [0,0],
					"buildHouses": [0,0],
					"createWeapons": [0,0],
					"recoltFiber": [0,0],
					"recoltStone": [0,0],
					"recoltWood": [0,0],
					"recoltWater": [0,0],
					"createClothes": [0,0]
				};

				vote_status = new Array();

				//Choose a weather for the day that will impact the resources or actions
				currentWeather = getWeather();

			    /*bot.sendMessage({
			        to: channel.id,
			        message: retour
			    });*/
			}, null, true, 'Europe/Paris');

			job.start();

			console.log(resources);

			vote_status = new Array();
			currentWeather = getWeather();

		}

	}
}




//--------------------------------- FUNCTIONS USED BY USER ---------------------------------//

//Hunts animals for the day. Increases the "Hunted animals" resources
function hunt(userID) {
	vote_status[userID] += 1;
	vote_actions["hunt"] += 1;
	//resources.hunted_animals += (resources.adults/2)-(resources.adults*(20/100));
}



//Process animals. Increases Leather and Meat resources. Decreases the Hunted Animals resources.
function checkProcessAnimals(nbToProcess, bot, channelID, userID) {
	var check = false;

	if(nbToProcess <= resources.hunted_animals) {
		check = true;
	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez d'Animaux Chassés à découper.\n"+
			"Animaux Chassés restants : "+resources.hunted_animals);
	}

	return check;
}



//Build houses. Increases the Houses resources. Decreases the Wood, Stone and Fiber resources.
function checkBuildHouses(nbToBuild, bot, channelID, userID) {
	var checkWood = nbToBuild*30;
	var checkFiber = nbToBuild*50;
	var checkStone = nbToBuild*20;

	var check = false;

	if(resources.wood >= checkWood && resources.fiber >= checkFiber && resources.stone >= checkStone) {
		check = true;

	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez de ressources disponibles.\n"+
			"Bois restant : "+resources.wood+"\n"+
			"Fibres restantes : "+resources.fiber+"\n"+
			"Pierres restantes : "+resources.stone+"\n");
	}

	return check;
}



//Recolt fiber. Increases the Fiber resources.
function checkRecoltFiber(workers, bot, channelID, userID) {
	var check = false;

	//Workers should always be max Adults/2. This ensure that the whole village doesn't do every action.
	if(workers <= resources.adults/2) {
		check = true;

	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez de personnes disponibles.\n"+
			"Personne Disponibles = Moitié des Adultes : "+(resources.adults/2));
	}

	return check;

}



//Recolt Stone. Increases the Stone resources.
function checkRecoltStone(workers, bot, channelID, userID) {
	var check = false;

	//Workers should always be max Adults/2. This ensure that the whole village doesn't do every action.
	if(workers <= resources.adults/2) {
		check = true;

	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez de personnes disponibles.\n"+
			"Personne Disponibles = Moitié des Adultes : "+(resources.adults/2));
	}

	return check;
}



//Recolt Wood. Increases the Wood resources.
function checkRecoltWood(workers, bot, channelID, userID) {
	var check = false;

	//Workers should always be max Adults/2. This ensure that the whole village doesn't do every action.
	if(workers <= resources.adults/2) {
		check = true;

	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez de personnes disponibles.\n"+
			"Personne Disponibles = Moitié des Adultes : "+(resources.adults/2));
	}

	return check;
}



//Recolt Water. Increases the Water resources.
function checkRecoltWater(workers, bot, channelID, userID) {
	var check = false;

	//Workers should always be max Adults/2. This ensure that the whole village doesn't do every action.
	if(workers <= resources.adults/2) {
		check = true;

	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez de personnes disponibles.\n"+
			"Personne Disponibles = Moitié des Adultes : "+(resources.adults/2));
	}

	return check;
}



//Create clothes. Increases the Clothes resources. Decreases the Leather and Fiber resources.
function checkCreateClothes(nbToCreate, bot, channelID, userID) {
	var checkLeather = nbToCreate*2;
	var checkFiber = nbToCreate*5;

	var check = false;

	if(resources.leather >= checkLeather && resources.fiber >= checkFiber) {
		check = true;

	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez de ressources disponibles.\n"+
			"Cuir restant : "+resources.leather+"\n"+
			"Fibres restantes : "+resources.fiber+"\n");
	}

	return check;
}



//Create Weapons. Increases the Weapons resources. Decreases the Wood, Stone and Fiber resources.
function checkCreateWeapons(nbToCreate, bot, channelID, userID) {
	//TAG:MODIFIER
	var checkWood = nbToBuild*3;
	var checkFiber = nbToBuild*5;
	var checkStone = nbToBuild*2;

	var check = false;

	if(resources.wood >= checkWood && resources.fiber >= checkFiber && resources.stone >= checkStone) {
		check = true;

	} else {
		printError(bot, channelID, userID, "Il n'y a pas assez de ressources disponibles.\n"+
			"Bois restant : "+resources.wood+"\n"+
			"Fibres restantes : "+resources.fiber+"\n"+
			"Pierres restantes : "+resources.stone+"\n");
	}

	return check;
}



//Reproduce to get Children Population.
function reproduce(userID) {
	vote_status[userID] += 1;
	vote_actions["reproduce"] += 1;
}



//Prints the current status of resources.
function currentStatus(bot, channelID) {
	bot.sendMessage({
	    to: channelID,
	    message: "Les ressources actuelles sont les suivantes :\n"+
	    "**Population et Bonheur**\n"+
	    "Population Adulte : "+resources.adults+"\n"+
	    "Population Enfant : "+resources.children+"\n"+
	    "Bonheur : "+resources.happiness+"\n\n"+
	    "**Ressources Primaires**\n"+
	    "Animaux Chassés : "+resources.hunted_animals+"\n"+
	    "Viande : "+resources.meat+"\n"+
	    "Cuir : "+resources.leather+"\n"+
	    "Eau : "+resources.water+"\n"+
	    "Bois : "+resources.wood+"\n"+
	    "Fibres : "+resources.fiber+"\n"+
	    "Pierres : "+resources.stone+"\n\n"+
	    "**Ressources Créées**\n"+
	    "Armes : "+resources.weapons+"\n"+
	    "Vêtements : "+resources.clothes+"\n"+
	    "Habitations : "+resources.houses+"\n"
	});
}



//Used to vote. Arguments should be an array of strings.
function vote(arguments, bot, channelID, userID) {
	if(vote_status[userID] === undefined || vote_status[userID] < 3) {
		switch(arguments[0]) {



			case "chasser":
				hunt(userID);
			    break;



			case "découper":
				processVote("processAnimals", arguments[1], checkProcessAnimals, bot, channelID, userID);
				break;



			case "récolter":
				switch(arguments[1]) {
					case "fibres":
						if(currentWeather === "Neige") {
							bot.sendMessage({
						        to: channelID,
						        message: "Il neige aujourd'hui, la récolte de fibres est impossible. Votre vote n'a pas été pris en compte."
						    });
						} else {
							processVote("recoltFiber", arguments[2], checkRecoltFiber, bot, channelID, userID);
						}
						break;



					case "pierres":
						processVote("recoltStone", arguments[2], checkRecoltStone, bot, channelID, userID);
						break;



					case "bois":
						processVote("recoltWood", arguments[2], checkRecoltWood, bot, channelID, userID);
						break;



					case "eau":
						processVote("recoltWater", arguments[2], checkRecoltWater, bot, channelID, userID);
						break;



					default:
						printError(bot, channelID, userID, "Cette ressource n'existe pas.");
						break;
				}
				break;



			case "construire":
				processVote("buildHouses", arguments[1], checkBuildHouses, bot, channelID, userID);
				break;



			case "coudre":
				processVote("createClothes", arguments[1], checkCreateClothes, bot, channelID, userID);
				break;



			case "armes":
				processVote("createWeapons", arguments[1], checkCreateWeapons, bot, channelID, userID);
				break;



			case "reproduire":
				reproduce(userID);
				break;



			//Admin function to commit stuff. To delete in prod.
			case "commit": console.log(resources); commit(); break;



			case "statut": currentStatus(bot, channelID); break;



			default:
				bot.sendMessage({
			        to: channelID,
			        message: "Cette action n'existe pas.\n"+
			        "Vous pouvez essayer les commandes suivantes :\n"+
			        "```!vote chasser``` pour chasser des animaux. Cela augmente les Animaux Chassés.\n\n"+
			        "```!vote découper [NOMBRE]``` pour découper un certain nombre d'Animaux Chassés. Cela réduit les Animaux Chassés et augmente le Cuir et la Viande.\n\n"+
			        "```!vote récolter [fibres|pierres|bois|eau] [NOMBRE]``` pour récolter un certain nombre de fibres, de pierres, d'eau ou de bois. Cela augmente les Fibres, les Pierres ou le Bois.\n\n"+
			        "```!vote construire [NOMBRE]``` pour construire un certain nombre de maisons. Cela réduit de 30 le Bois, de 50 les Fibres et de 20 les Pierres par Habitation construite.\n\n"+
			        "```!vote coudre [NOMBRE]``` pour coudre un certain nombre de vêtements. Cela réduit de 2 le Cuir et de 5 les Fibres par Vêtement coud.\n\n"+
			        "```!vote armes [NOMBRE]``` pour créer un certain nombre d'armes. Cela consomme des Pierres, du Bois et des Fibres.\n\n"+
			        "```!vote reproduire``` pour que les habitants se reproduissent. Cela a une chance d'augmenter la Population Enfant."
			    });
			    break;

		}

	} else {
		bot.sendMessage({
	        to: channelID,
	        message: "<@!"+userID+"> : Vous avez déjà voté 3 fois aujourd'hui. Veuillez attendre demain."
	    });
	}
}










//--------------------- INTERNAL FUNCTIONS, NO ACCESS FROM USER ---------------------//

//Serializes the data to save it.
function commit() {
	var jsonString = JSON.stringify(resources);

	fs.writeFile('mini_game_resources.json', jsonString, (err) => {
		if (err) {
			console.error(err);
		}
	});

	vote_actions = {
		"hunt": 0,
		"processAnimals": 0,
		"buildHouses": 0,
		"createWeapons": 0,
		"recoltFiber": 0,
		"recoltStone": 0,
		"recoltWood": 0,
		"recoltWater": 0,
		"createClothes": 0,
		"reproduce": 0
	};

	interval_actions = {
		"processAnimals": [0,0],
		"buildHouses": [0,0],
		"createWeapons": [0,0],
		"recoltFiber": [0,0],
		"recoltStone": [0,0],
		"recoltWood": [0,0],
		"recoltWater": [0,0],
		"createClothes": [0,0]
	};

	vote_status = new Array();
}


//Check if an entry exists and if not, creates it with value 0.
function checkIfEntryExists(arr, key) {
	if(arr[key] === undefined) {
		arr[key] = 0;
	}
}


//Get a random weather for the day
function getWeather() {
	var arr = event_gen.weather;
	var arr2 = new Array();

	for(var elem in arr) {
		for(var i=0; i<arr[elem]; i++) {
			arr2.push(elem);
		}
	}

	var rand = Math.floor(Math.random()*100);

	currentWeather = arr2[rand];
	console.log(arr2[rand]);
}


//Prints an error mentionning the user in the right channel
function printError(bot, channelID, userID, message) {
	bot.sendMessage({
        to: channelID,
        message: "<@!"+userID+"> : "+message
    });
}



//Processes the vote of a user depending on the choosed action. Only for the actions who have functions with parameters.
//Hunt and Reproduce ARE NOT in this function.
function processVote(action, value, checkFunc, bot, channelID, userID) {

	if(value !== undefined && isInt(value)) {

		if(checkFunc(value, bot, channelID, userID)) {
			vote_status[userID] += 1;
			vote_actions[action] += 1;

			if(value < interval_actions[action][0]) {
				interval_actions[action][0] = value;
			}


			if(value > interval_actions[action][1]) {
				interval_actions[action][1] = value;
			}
		}

	} else {
		printError(bot, channelID, userID, "Cette valeur est incorrecte.");
	}
}



//Process the choosed action
function processAction(action) {
	var hurt = 0;
	var interval;
	var rand = 0;

	switch(action) {

		//For each person present, there's a 0.1 chance that someone dies.
		case "hunt":
			var prob_hurt = 7.5;

			if(currentWeather === "Pluvieux") {
				prob_hurt = 15;
			}

			for(var i = 0; i < (40); i++) {
				//2% de chance par chasseur qu'il meurt ou 15% par pluie
				if( Math.floor(Math.random()*100) < prob_hurt) {
					hurt++;
				}
			}

			resourcesToCommit.adults -= hurt;

			var animalsToAdd = (resources.adults/2.5)*(75/100);

			if(currentWeather === "Ensoleillé") {
				animalsToAdd += (resources.adults/2.5)*(15/100);

			} else if(currentWeather === "Brouillard") {
				animalsToAdd = (resources.adults/2.5)*(33/100);

			} else if(currentWeather === "Orageux") {
				var hurt = 0;
				for(var i = 0; i < rand; i++) {
					if(Math.floor(Math.random()*100) < 1) {
						hurt++;
					}
				}

				resourcesToCommit.adults -= hurt;
			}

			resources.hunted_animals += animalsToAdd;
			break;



		case "processAnimals":
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			resourcesToCommit.meat += rand*2;
			resourcesToCommit.leather += rand;
			resourcesToCommit.hunted_animals -= rand;
			break;



		case "buildHouses": 
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			resourcesToCommit.wood -= rand*30;
			resourcesToCommit.fiber -= rand*50;
			resourcesToCommit.stone -= rand*20;
			resourcesToCommit.houses += rand;
			break;



		case "createWeapons":
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			//TAG:A MODIFIER
			resourcesToCommit.wood -= rand*30;
			resourcesToCommit.fiber -= rand*50;
			resourcesToCommit.stone -= rand*20;
			resourcesToCommit.houses += rand;
			break;



		case "recoltFiber":
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			var fiberToAdd = rand*3;

			if(currentWeather === "Ensoleillé") {
				fiberToAdd += fiberToAdd*(15/100);

			} else if(currentWeather === "Neige") {
				fiberToAdd = 0;

			} else if(currentWeather === "Vent") {
				fiberToAdd = rand*1.5;

			} else if(currentWeather === "Orageux") {
				var hurt = 0;
				for(var i = 0; i < rand; i++) {
					if(Math.floor(Math.random()*100) < 1) {
						hurt++;
					}
				}

				resourcesToCommit.adults -= hurt;
			}

			resourcesToCommit.fiber += fiberToAdd;
			break;



		case "recoltStone":
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			var stoneToAdd = rand*1.5;

			if(currentWeather === "Ensoleillé") {
				stoneToAdd += stoneToAdd*(15/100);

			} else if(currentWeather === "Neige") {
				stoneToAdd -= stoneToAdd*(33/100);

			} else if(currentWeather === "Orageux") {
				var hurt = 0;
				for(var i = 0; i < rand; i++) {
					if(Math.floor(Math.random()*100) < 1) {
						hurt++;
					}
				}

				resourcesToCommit.adults -= hurt;
			}

			resourcesToCommit.stone += stoneToAdd;
			break;



		case "recoltWood":
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			var woodToAdd = rand*2;

			if(currentWeather === "Ensoleillé") {
				woodToAdd += woodToAdd*(15/100);

			} else if(currentWeather === "Neige") {
				woodToAdd -= woodToAdd*(33/100);

			} else if(currentWeather === "Orageux") {
				var hurt = 0;
				for(var i = 0; i < rand; i++) {
					if(Math.floor(Math.random()*100) < 1) {
						hurt++;
					}
				}

				resourcesToCommit.adults -= hurt;
			}

			resourcesToCommit.wood += woodToAdd;
			break;



		case "recoltWater":
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			var waterToAdd = rand*2;

			if(currentWeather === "Ensoleillé") {
				waterToAdd += waterToAdd*(15/100);

			} else if(currentWeather === "Neige") {
				waterToAdd -= waterToAdd*(33/100);

			} else if(currentWeather === "Orageux") {
				var hurt = 0;
				for(var i = 0; i < rand; i++) {
					if(Math.floor(Math.random()*100) < 1) {
						hurt++;
					}
				}

				resourcesToCommit.adults -= hurt;
			}

			resourcesToCommit.water += waterToAdd;
			break;



		case "createClothes":
			interval = interval_actions[action];
			rand = Math.floor(Math.random() * (interval[1] - interval[0] + 1)) + interval[0];

			resourcesToCommit.leather -= rand*2;
			resourcesToCommit.fiber -= rand*5;
			resourcesToCommit.clothes += rand;
			break;



		case "reproduce":
			var children = 0;
			//Represents the number of valid adult couples, more or less
			var adults = ((resources.adults-(resources.adults*(25/100)))/2);

			for(var i = 0; i < adults; i++) {
				if( Math.random()*100 < 7.5 ) {
					children++;
				}
			}

			resourcesToCommit.children += children;
			break;
	}
}



//Check if value is an int
function isInt(value) {
	return !isNaN(value) && 
		parseInt(Number(value)) == value && 
		!isNaN(parseInt(value, 10));
}

module.exports.MiniGame = MiniGame;


//Brume : L'air porte un air mystérieux, c'est un signe des dieux, les villageois refusent de chasser ou récolter.