//#!/usr/bin/node
var 
//--------------- MODULES ---------------//
    // import tmdb module
    tmdb = require('tmdbv3')
    // import optimist module
  , args = require('optimist').argv
    // import shelljs module
  , shell = require('shelljs')
    // import request module
  , request = require('request')
    // import cheerio module
  , cheerio = require('cheerio')

//--------------- CONSTANTS ---------------//
  , EMPTY_FN = function() {}
    // tmdb api key
  , KEY = 'efe8c33f77907e883db9a8fb44d10dfb'
    // up one directory
  , UP_DIR = '..'
    // the parent directory to be processed
  , DIR = args._[0]

//--------------- FUNCTIONS ---------------//
  , processMovie = EMPTY_FN
  , evaluateFile = EMPTY_FN
  , evaluateTitle = EMPTY_FN
  , evaluateYear = EMPTY_FN
  , processListFile = EMPTY_FN;

String.prototype.isEmpty = function() {
    return this.length === 0;
};

processMovie = function(err, res) {
    if (res.results.length === 0) { return; }
    var movie = res.results[0]

      , id = movie.id
      , title = movie.title
      , poster = movie.poster_path
      , rate = movie.vote_average;
	  
    tmdb.movie.info(id, function movieInfo(err, res) {
        var IMDB_URL = 'http://www.imdb.com/title/'+ res.imdb_id +'/';

        request(IMDB_URL, function requestCallback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $  = cheerio.load(body), imdb = {};
                $('[itemprop]').filter('span,div')
                    .each(function eachElt(i, e) {
                        var $e = $(e);

                        if ($e.is('[itemprop=ratingValue]')) {
                            imdb['rate'] = $(e).text();
                        } else if ($e.is('[itemprop=ratingCount]')) {
                            imdb['votes'] = $(e).text();
                        } else if ($e.is('[itemprop=director]')) {
                            imdb['director'] = $(e).find('[itemprop=name]').text();
                        }
                    });
                console.log(title + ' ['+IMDB_URL+'] ' + imdb.rate+'/'+imdb.votes);
                // TODO save movie details to DB
            }				
        });
    });
};  

/**
 * Evaluating movie file, search and srapping movies triggered by this function
 * @param file the file of the movie
 */  
evaluateFile = function(file) {
		
    var // extract year of the movie file
        year = file.substr(file.search(/\[[0-9]{4}\]/)+1, 4)
      , title = file.substring(0, file.search(/\([0-9-]{4,9}\)/)).trim()
      , movie = /\.(mp4|mkv|avi)$/.test(file);

    if (movie && !title.isEmpty()) {
        // search movie and scrap its information
        tmdb.search.movie(title, processMovie);
    }
};

evaluateTitle = function(title) {
		
    // enter title directory
    if (shell.test('-d', title)) {
        shell.cd(title);
        // list title directory
        shell.ls().forEach(function eachFile(file) {
            // evaluate the movie file
            evaluateFile(file);
        });

        // going back up to title directory
        shell.cd(UP_DIR);

    }
    // no title directory
    else {
        evaluateFile(title);
    }
};

evaluateYear = function(year) {
    // start from year
    if (/^[0-9-]{4,9}$/.test(year)) {
        // going into year directory
        shell.cd(year);
        // list the year directory
        shell.ls().forEach(function eachTitle(title) {
            // evaluate the movie title directory
            evaluateTitle(title);
        });
        // going back up to main directory
        shell.cd(UP_DIR);
    }
    // title or file
    else {
        // evaluate the movie title directory
        evaluateTitle(year);
    }
};

processListFile = function(file) {
    // TODO implement processing movie list file

    // read file
    // loop entry
    // filter correct lines to process
    // process valid entries using 
    // tmdb.search.movie(title, processMovie);
};

if (!DIR) {
    console.error('you didn\'t specify root directory for its contents to be procesed');
    shell.exit(1);
}

// init TMBD API
tmdb = tmdb.init(KEY);
// die on error
shell.config.fatal = true;

// process directory based movie list
if (shell.test('-d', DIR)) {
    // change to top working directory
    shell.cd(DIR);
    
    // list top working directory
    shell.ls().forEach(evaluateYear);
}
// should be file based movie list
else {
    // TODO process movie list file
    processListFile(DIR);
}
