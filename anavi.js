#!/usr/bin/node
var Discordbot = require('discord.io');

var auth = require("./auth.json");

var authorizedRole = require ("./allowed.json")

var event_gen = require("./event_gen.json")

var bot = new Discordbot.Client({
	token : auth.token,
	autorun : true
});

var lastcommandtime = 0;
var timeout = 500;


const FS = require('fs');
bot.on('ready', function() {
    console.log(bot.username + " - (" + bot.id + ")\n");
	Object.keys(bot.servers).forEach(function(key) {
		var server = bot.servers[key];
		console.log( "connected to " + server.name + " - (" + server.id + ")\n");
	});
});

function userIsAuthorized(userID,serverID){
	var server = bot.servers[serverID];
	var allowed = authorizedRole[serverID];
	var userRoles = server.members[userID].roles;
	
	return (userRoles.indexOf(allowed) != -1)
}

bot.on('message', function (user, userID, channelID, message, event){
	//administration command
	if (message.substring(0,1) == "."){
		var arguments = message.substring(1).split(" ");
		var command = arguments[0];
		arguments = arguments.splice(1).join(" ");
		if (command == "timeout" && userIsAuthorized(userID)){
			timeout = arguments[0];
			console.log("Timeout set to :"+arguments[0]);
		}
	}
	
	//normal command
	if (message.substring(0, 1) == "!"){
		if ( Date.now()-lastcommandtime<timeout){
		}else{
			// lastcommandtime = Date.now();
			var arguments = message.substring(1).split(" ");
			var command = arguments[0];
			arguments = arguments.splice(1);
			var retour = "";
			
			if (command == "ping"){
				retour = ":regional_indicator_p: :regional_indicator_o: :regional_indicator_n: :regional_indicator_g: !";
			}
			
			if (command == "anavi"){
				retour = arguments.join(" ");
			}
	
			if (command == "roll" || command == "r"){
				var subargs;
				if (arguments[0]!=undefined){
					subargs = arguments[0].split("d");
				} else{
					subargs = [1,100];
				}
				var retour = "Lancement de " + subargs[0] + " dés à " + subargs[1] + " faces :\n";
				for (i=0; i<subargs[0];i++){
					retour += Math.floor((Math.random() * subargs[1]) + 1) + " ";
				}
			}
			
			if (command == "info"){
				//TODO: faire la bonne info
				var retour = "Les commandes disponibles sont :\nLe timeout entre deux commandes est de " + (timeout / 1000) + " secondes";
			}
			
			if (command == "event" && arguments[0] in event_gen){
				retour = event_gen[arguments[0]][Math.floor(Math.random() * event_gen[arguments[0]].length)];
			}	

			// send message loop
			if (retour != ""){
				bot.sendMessage({
					to: channelID,
					message: retour
				});
				lastcommandtime = Date.now();
			}
		}
	}
});
