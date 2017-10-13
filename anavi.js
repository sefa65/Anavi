var testgame = require('./mini_game_resources.js');

var Discordbot = require('discord.io');

var auth = require("./auth.json");

var authorizedRole = require ("./allowed.json");

var event_gen = require ("./event_gen.json");

var bot = new Discordbot.Client({
	token : auth.token,
	autorun : true
});

var lastcommandtime = 0;
var timeout = 500;
var defaultChannel;
var testChannel;
var roleAdmins;
var server;

const FS = require('fs');
bot.on('ready', function() {
    console.log(bot.username + " - (" + bot.id + ")\n");
	Object.keys(bot.servers).forEach(function(key) {
		server = bot.servers[key];
		console.log( "connected to " + server.name + " - (" + server.id + ")\n");

		Object.keys(bot.channels).map(function(objectKey, index) {
			if(bot.channels[objectKey].name == "home_canal") {
				defaultChannel = bot.channels[objectKey];
			}

			if(bot.channels[objectKey].name == "ivanas-room") {
				testChannel = bot.channels[objectKey];
			}
		});

		Object.keys(server.roles).map(function(objectKey, index) {
			if(server.roles[objectKey].name == "CONTEURS") {
				roleAdmins = server.roles[objectKey];
			}
		});

		testgame.MiniGame(0, bot, testChannel);
	});
});

function userIsAuthorized(userID,serverID){
	var server = bot.servers[serverID];
	var allowed = authorizedRole[serverID];
	var userRoles = server.members[userID].roles;
	
	return (userRoles.indexOf(allowed) != -1)
}

bot.on('message', function (user, userID, channelID, message, event){
	var retour = "";

	//administration command
	if (message.substring(0,1) == "." && userIsAuthorized(userID,bot.channels[channelID].guild_id)){
		var arguments = message.substring(1).split(" ");
		var command = arguments[0];
		arguments = arguments.splice(1).join(" ");
		if (command == "timeout"){
			timeout = arguments[0];
			console.log("Timeout set to :"+arguments[0]);
		}
		/*
		if (command == "test"){
			retour = "toto";
		}
		*/
	}
	
	//normal command
	if (message.substring(0, 1) == "!"){
		if ( Date.now()-lastcommandtime<timeout){
		}else{
			// lastcommandtime = Date.now();
			var arguments = message.substring(1).split(" ");
			var command = arguments[0];
			arguments = arguments.splice(1);
			
			if (command == "ping"){
				retour = ":regional_indicator_p: :regional_indicator_o: :regional_indicator_n: :regional_indicator_g: !";
			}
			
			if (command == "anavi"){
				retour = arguments.join(" ");
				bot.deleteMessage({
					channelID: channelID,
					messageID: event.d.id
				});
			}	
			/*
			if (command == "IDs"){
				retour = "serverID => " + bot.channels[channelID].guild_id + " channelID => " + channelID + " userID => " + userID + " messageID => " +event.d.id ;
			}
			*/
			if (command == "roll" || command == "r"){
				var subargs;
				if (arguments[0]!=undefined){
					subargs = arguments[0].split("d");
				} else{
					subargs = [1,100];
				}

				var retour = "<@!"+userID+"> lance " + subargs[0] + " dés à " + subargs[1] + " faces :\n```\n";

				if(arguments[1]!=undefined) {
					var argSup = arguments[1].split(">");
					if(argSup[0].length == 0) {
						var limit = Number(argSup[1]);

						var count = 0;
						for (i=0; i<subargs[0];i++) {
							var nb = Math.floor((Math.random() * subargs[1]) + 1);
							if(nb > limit) {
								count++;
							}
							retour += nb + " ";
						}

						retour += "\n```\n**" + count + " Succès à difficulté de " +limit+ ".**";
					}

				} else {
					for (i=0; i<subargs[0];i++){
						retour += Math.floor((Math.random() * subargs[1]) + 1) + " ";
					}
					retour += "\n```";
				}

				bot.deleteMessage({
                                        channelID: channelID,
                                        messageID: event.d.id
                                });
			}
			
			if (command == "info"){
				//TODO: faire la bonne info
				var retour = "Les commandes disponibles sont :\nLe timeout entre deux commandes est de " + (timeout / 1000) + " secondes";
			}
			
			if (command == "event" && arguments[0] in event_gen){
				retour = event_gen[arguments[0]][Math.floor(Math.random() * event_gen[arguments[0]].length)];
			}
			
			if (command == "vote"){
				testgame.vote(arguments, bot, channelID, userID);
			}
		}	
	}		

	// send message loop
	if (retour != ""){
		bot.sendMessage({
			to: channelID,
			message: retour
		});
		lastcommandtime = Date.now();
	}
});

bot.on('guildMemberAdd', function(member, event) {
    bot.sendMessage({
        to: defaultChannel.id,
        message: "Bienvenue <@!"+member.id+"> sur **"+server.name+"**, le RPG sur Discord.\n"+
        "Envie de découvrir ou nous rejoindre ? N'hésite pas à contacter un des <@&"+roleAdmins.id+">.\n\n"+
        "*Une nouvelle terre pour l'Arbre de la Vie\n"+
        "Un nouveau départ pour l'humanité*"
    });
});