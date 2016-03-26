(function() {

	/* UI Components */

	var isRunning = true;
	var button = document.getElementById('toggle');

	button.addEventListener('click', function(e){
		if(isRunning) {
			pubnub.unsubscribe({
				channel: channel
			});
			button.value = 'Stream Again';
			isRunning = false;
		} else {
			getData();
			button.value = 'Stop Twitter Stream!';
			isRunning = true;
		}
		
	}, false);


	/* Emotional Data */

	var tally = {};

	var democratColor = '#3143E0';
	var republicanColor = '#DA1D1D';
	var neutralColor = '#DECEB3';

	var clinton = {
		type: 'democrat',
		icon: 'clinton-face.png'
	};
	var sanders = {
		type: 'democrat',
		icon: 'sanders-face.png'
	};
	var trump = {
		type: 'republican',
		icon: 'trump-face.png'
	};
	var trump = {
		type: 'republican',
		icon: 'trump-face.png'
	};
	var kasich = {
		type: 'republican',
		icon: 'kasich-face.png'
	};
	var rubio = {
		type: 'republican',
		icon: 'rubio-face.png'
	};
	var cruz = {
		type: 'republican',
		icon: 'cruz-face.png'
	};

	var clintonWords = [
		'clinton, hillary clinton, hilary clinton, hillaryclinton, president clinton, female president, first female president, candidate clinton, hillary for america, solutions for america'
	];
	var sandersWords = [
		'sanders, bernie sanders, bernie, berniesanders, president sanders, bernie for president, feel the bern, candidate sanders, a political revolution is coming'
	];
	var trumpWords = [
		'trump, donald trump, donaldtrump, president trump, candidate trump, make america great again'
	];
	var trumpWords = [
		'trump, donald trump, donaldtrump, president trump, candidate trump, make america great again'
	];
	var kasichWords = [
		'kasich, john kasich, johnkasich, president kasich, candidate kasich, kasich for president, k for us'
	];
	var rubioWords = [
		'rubio, marco rubio, marcorubio, president rubio, candidate rubio, rubio for president, a new american century'
	];
	var cruzWords = [
		'tedcruz, ted cruz, president cruz, candidate cruz, cruz for president, reigniting the promise of america'
	];


	/* D3  */

	var width = 900;
	var height = 540;

	var projection = d3.geo.albersUsa();
		//.scale(900);

	var color = d3.scale.linear()
		.domain([0, 15])
		.range(['#5b5858', '#4f4d4d', '#454444', '#323131']);

	var svg = d3.select('#map').append('svg')
			.attr('width', width)
			.attr('height', height);

	var path = d3.geo.path()
	    .projection(projection);

	var g = svg.append('g');

	d3.json('json/us-states.json', function(error, topology) {
	    g.selectAll('path')
			.data(topojson.feature(topology, topology.objects.usStates).features)
			.enter()
			.append('path')
			.attr('class', function(d){ return 'states ' + d.properties.STATE_ABBR;} )
			.attr('d', path)
			.attr('fill', function(d, i) { return color(i); });
	});

	var faceIcon = svg.selectAll('image').data([0]);


	/* PubNub */

	var channel = 'pubnub-twitter';

	var pubnub = PUBNUB.init({
		subscribe_key: 'sub-c-78806dd4-42a6-11e4-aed8-02ee2ddab7fe'
	});

	// fetching previous 1000 data, then realtime stream
	function getData() {
		pubnub.history({
	    	channel: channel,
	    	count: 1000,
	    	callback: function(messages) {
	    		pubnub.each( messages[0], processData );
	    		getStreamData();
	    	},
	    	error: function(error) {
	    		console.log(error);
	    		if(error) {
	    			getStreamData();
	    		}
	    	}
	    });
	}

	function getStreamData() {
		pubnub.subscribe({
			channel: channel,
			callback: processData
		});
	}

	function getUserInfo(data, callback) {
		if(!data.geo) return;

		var userInfo = {};

		userInfo.lat = data.geo.coordinates[0];
		userInfo.lon = data.geo.coordinates[1];

		if(userInfo.lat === 0 && userInfo.lon === 0) return;

		var city = data.place.full_name;
		userInfo.city = city;
		userInfo.state = city.substring(city.lastIndexOf(',')+1).trim();

		userInfo.name = data.user.name;
		userInfo.screenname = data.user.screen_name;
		userInfo.avatar = data.user.profile_image_url;
		userInfo.tweet = data.text;
		userInfo.id_str = data.id_str;

		var date = new Date(parseInt(data.timestamp_ms));
		var d = date.toDateString().substr(4);
		var t = (date.getHours() > 12) ? date.getHours()-12 + ':' + date.getMinutes() + ' PM' : date.getHours() + ':' + date.getMinutes() +' AM;';

		userInfo.timestamp = t + ' - ' + d;
	
		console.log(userInfo.tweet);
		callback(userInfo);
	}

	function insertLinks(text) {            
        return text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function(url){return '<a href="'+url+'" >'+url+'</a>';});                      
    }

	function displayData(data, emotion) {

		getUserInfo(data, function(user){
			document.querySelector('.emotion').style.backgroundImage = 'url(images/'+ emotion.icon +')';

			document.querySelector('.button').href = 'https://twitter.com/' + user.screenname;
			document.querySelector('.header').style.backgroundImage = 'url('+ user.avatar +')';
			document.querySelector('.name').textContent = user.name;
			document.querySelector('.screenname').textContent = '@' + user.screenname;
			document.querySelector('.text').innerHTML = twemoji.parse(insertLinks(user.tweet));
			document.querySelector('.timestamp').textContent = user.timestamp;

			document.querySelector('.reply').href ='https://twitter.com/intent/tweet?in_reply_to=' + user.id_str;
			document.querySelector('.retweet').href = 'https://twitter.com/intent/retweet?tweet_id=' + user.id_str;
			document.querySelector('.favorite').href = 'https://twitter.com/intent/favorite?tweet_id=' + user.id_str;
			
			document.querySelector('.tweet').style.opacity = 0.9;

			if(document.querySelector('.'+user.state)) {
				tally[user.state] = (tally[user.state] || {democrat: 0, republican: 0});
				tally[user.state][emotion.type] = (tally[user.state][emotion.type] || 0) + 1;

				var stateEl = document.querySelector('.'+user.state);
				stateEl.style.fill = (tally[user.state].democrat > tally[user.state].republican) ? democratColor : ((tally[user.state].democrat < tally[user.state].republican) ? republicanColor :neutralColor); 

				stateEl.setAttribute('data-democrat', tally[user.state].democrat);
				stateEl.setAttribute('data-republican', tally[user.state].republican);
			}	

			// Place emotion icons

			var position = projection([user.lon, user.lat]);
			if(position === null) return;

			faceIcon.enter()
				.append('svg:image')
				.attr('xlink:href', 'images/'+ emotion.icon)
				.attr('width', '26').attr('height', '26')
           		.attr('transform', function(d) {return 'translate(' + position + ')';});
		});
	}

	function processData(data) {
		if(!data || !data.place || !data.lang) return; 
		if(data.place.country_code !== 'US') return;
		//if(data.lang !== 'en') return;

		if (clintonWords.some(function(v) { return data.text.toLowerCase().indexOf(v) !== -1; })) {
			displayData(data, clinton);
		} else if (sandersWords.some(function(v) { return data.text.toLowerCase().indexOf(v) !== -1; })) {
			displayData(data, sanders);
		} else if (trumpWords.some(function(v) { return data.text.toLowerCase().indexOf(v) !== -1; })) {
			displayData(data, trump);
		} else if (trumpWords.some(function(v) { return data.text.toLowerCase().indexOf(v) !== -1; })) {
			displayData(data, trump);
		} else if (kasichWords.some(function(v) { return data.text.toLowerCase().indexOf(v) !== -1; })) {
			displayData(data, kasich);
		} else if (rubioWords.some(function(v) { return data.text.toLowerCase().indexOf(v) !== -1; })) {
			displayData(data, rubio);
		} else if (cruzWords.some(function(v) { return data.text.toLowerCase().indexOf(v) !== -1; })) {
			displayData(data, cruz);
		}
	}

	getData();
	
})();