'use strict';
const {dialogflow, BasicCard} = require('actions-on-google');
const app = dialogflow({debug: true});

const https = require('https');
const functions = require('firebase-functions');
const api = 'de9f98a92751f0fa8ceec687802f64f0';
var ssml = require('ssml');
var ssmlDoc = new ssml();
var googleResponse = ''; // the response from stimulator

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((req, res) => {

	var artist = req.body.queryResult.parameters['artist'];
	var song = req.body.queryResult.parameters['song'];
	
	callMusicApi(artist, song).then((output) => {
			
	res.json({
    "fulfillmentText": "This is a text response",
    "fulfillmentMessages": [],
    "payload": {
        "google": {
            "expectUserResponse": true,
            "richResponse": {
                "items": [
                    {
                    		"simpleResponse": {
							"textToSpeech": "Alright, I'll go first!" + '\n',
                        }
                    },
					{
						"simpleResponse": {
							"textToSpeech": googleResponse
					}
					},
                    {
                        "basicCard": {
                            "title": "Lyrics",
							"subtitle": "Read the bold lines",
							"formattedText": output                        }
                    }
                ]
            }
        }
    }	
	});
	}).catch(() => {
		res.json({ 'fulfillmentText': `I am not familiar with that.` });
	});
});

function callMusicApi(artist, song) {
		
	var options = {
		host: 'https://api.musixmatch.com/ws/1.1',
		path: '/matcher.lyrics.get?q_track=' + encodeURIComponent(song) + '&q_artist=' + encodeURIComponent(artist) + '&apikey=' + api + '&format=json&f_has_lyrics=1',
		headers: {
        'Accept': 'application/json'
    	}
	};  
	
	return new Promise((resolve, reject) => { 
		
		console.log('API Request: ' + options.host + options.path);
		var url = 'https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=' + encodeURIComponent(song) + '&q_artist=' + encodeURIComponent(artist) + '&apikey=' + api + '&format=json&f_has_lyrics=1';
				
		https.get('https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=' + encodeURIComponent(song) + '&q_artist=' + encodeURIComponent(artist) + '&apikey=' + api + '&format=json&f_has_lyrics=1', (res) => {
						
			let body = ''; 
			res.on('data', (d) => { body += d; });
			res.on('end', () => {

				let response = JSON.parse(body);
				var lyrics = response["message"]["body"]["lyrics"]["lyrics_body"];
				var i = 0;
				var x = 0;
				var next = lyrics[i];
				var line = []; //lines will be read by stimulator
				var newLine = []; //lines will be read by user
				var output = '';
				
				for (var y = 0; y < 5; y++) {
					
					var addLine = '';
										
					while (next == '\n') { 

						next = lyrics[++i];

					}
															
					while (next != '\n') {

						addLine += next;
						next = lyrics[++i];

					}
					
					line[x] = addLine;
					addLine = '';
						
					while (next == '\n') { 

						next = lyrics[++i];

					}
						
					while (next != '\n') {

						addLine += next;
						next = lyrics[++i];
					}
					
					newLine[x] = addLine;
					x++;
				}	
				
		//resets output between calls
		ssmlDoc = new ssml();
				
		//for display
		for (var p = 0; p < 5; p++) {
			
			output += (line[p] + '\n  \n') + ("**" + newLine[p] + "**" + '\n  \n');

		}
		
		//adds volume
		googleResponse = ssmlDoc.say(line[0]) 
			.prosody({
				volume: 'silent'})
			.say(newLine[0] + "\n") //silent
			.prosody({
				volume: 'default'})
			.say(line[1] + "\n")
			.prosody({
		        volume: 'silent'})
			.say(newLine[1] + "\n") //silent
			.prosody({
				volume: 'default'})
				.say(line[2] + "\n")
			.prosody({
				volume: 'silent'})
			.say(newLine[2] + "\n") //silent
			.prosody({
				volume: 'default'})
			.say(line[3] + "\n")
			.prosody({
				volume: 'silent'})
			.say(newLine[3] + "\n") //silent
			.prosody({
				volume: 'default'})
			.say(line[4] + "\n")
			.prosody({
				volume: 'silent'})
			.say(newLine[4] + "\n") //silent
			.prosody({
				volume: 'default'})
			.say('Do you want to sing another song?' + '  \n')
			.toString();
				
			resolve(output);
			
			});
			
      	res.on('error', (error) => {
			console.log(`Error calling the API: ${error}`)
			reject();
      	});
    });
  });
}
