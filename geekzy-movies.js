var KEY = 'efe8c33f77907e883db9a8fb44d10dfb'
  , tmdb = require('tmdbv3').init(KEY)
  , fs = require('fs')
  , request = require('request')
  , cheerio = require('cheerio');

tmdb.search.movie('The East', function(err, res) {
	if (res.results.length === 0) { return; }
	var movie = res.results[0]
	
	  , id = movie.id
	  , title = movie.title
	  , poster = movie.poster_path
	  , rate = movie.vote_average;
	
	tmdb.configuration(function(err, config) {
		var base = config.images.base_url
		  , url_pattern = /\{url\}/
		  , size = 'w154'
		  , img_url = base + size + '{url}' + '?api_key' + KEY
		  , ext_pattern = /\.*\.(.*)$/
		  , filename = title.replace(/\s|:/g, '_') + '.' + poster.match(ext_pattern)[1]
		  , poster_url = img_url.replace(url_pattern, poster);
		  
		filename = './data/posters/' + id + '/' + filename;
		request.head(poster_url, function(err, res, body) {
			var path = '';
			// poster path not exists
			filename.split('/').forEach(function(p) {
				if (p && /^(\w|\(|\)|\s|\d)+$/.test(p)) {
					path += p + '/';
					
					if (!fs.existsSync(path)) {
						fs.mkdirSync(path);
					}
				}
			});
			
			// not exists, grab it
			if (!fs.existsSync(filename)) {
				request(poster_url).pipe(fs.createWriteStream(filename));
			} 
			// exists, display path
			else {
				console.log('Already downloaded.');
			}
		});
	});
	  
	tmdb.movie.info(movie.id, function(err, res) {
		var IMDB_URL = 'http://www.imdb.com/title/'+ res.imdb_id +'/';
		request(IMDB_URL, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var $  = cheerio.load(body);
				$('[itemprop]').filter('span,div')
					.each(function(i, e) {
						var rating = $(e).is('[itemprop=ratingValue]');
						var votes = $(e).is('[itemprop=ratingCount]');
						var director = $(e).is('[itemprop=director]');
						
						if (rating) {
							console.log('rating:' + $(e).text());
						} else if (votes) {
							console.log('votes:' + $(e).text());
						} else if (director) {
							console.log('director:' + $(e).find('[itemprop=name]').text());
						}
					});
				}
		});
	});

});
