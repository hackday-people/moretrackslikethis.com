
/*
    Title:  Spotify Recommendation via Last.fm
*/

var spotRecom = (function(){

    var MAX_TRACKS_TO_RETURN = 5;

    var spotifyEls = [];  // a map of spotify queries to result elements
    var spotifyStr = '';  // a concatentation of spotify results
    var spotifyCountdown = 0;  // a counter to kick off the results display when all results are in

    $(document).ready(function(){

        // search button
        $('#search').bind('click submit', function() {
            // validation
            if (!$('#artist').val() || !$('#track').val()) {
                $('#results').html('<p>RTFM...</p> ');
            }
            
            // Start the search
            $('#results').empty();
            $('#results').html('<p>Searching now...</p> ');
            setTimeout(function() {
                getLastFMSimilarData($('#track').val(), $('#artist').val());
            }, 1000);
            $('#complete').hide();
            return false;
        });
        
        // just an example
        $('#example_track').bind('click', function(e) {
            $('#track').val('Hey');
            $('#artist').val('Pixies');
            $('#search').click();
            return false;
        });
        
        // select the text area contents if clicked, to make cutting+pasting easier
        $('#results-textarea').click(function() {
            this.select();
        });
        
        // hide the results box
        $('#complete').hide();
        
        // put the cursor in the track box to get started
        $('#track').select();
    });
    
    // prepare the lastfm url through yql
    var getLastFMSimilarURL = function(track, artist) {
        
        var track = $.trim(track);
        var artist = $.trim(artist);
        
        var url = 'http://query.yahooapis.com/v1/public/yql?q=';
        var qry = "select%20similartracks.track%20from%20lastfm.track.getsimilar%20where%20api_key%3D'f848f5efdbf20b9366985a24f7aed172'%20and%20artist%3D'" + encodeURIComponent(artist) + "'%20and%20track%3D'" + encodeURIComponent(track) + "'%20limit%20" + MAX_TRACKS_TO_RETURN;
        var params = '&format=json&_maxage=3600000&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=?';

        return url+qry+params;
    };
    
    // look up the track and artist in lastfm's similar search
    var getLastFMSimilarData = function(track, artist) {
        return $.ajax({
            url: getLastFMSimilarURL(track, artist),
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'spotRecom.callbackLastFMData',
            cache:true,
        });
    };
    
    // process the data from lastfm
    var callbackLastFMData = function (data) {
        console.log(data.query.results);
        if (data.query.results) {
            $('#results').empty();
            $('#results-table').empty();
            var $resultEl = $('#results-table');
            $.each(data.query.results.lfm, function(index) {
                var trackObj = this.similartracks.track[1];
                var artist = trackObj.artist.name || "artist";
                var track = trackObj.name || "track";

                var $rowEl = $('<tr></tr>');
                $rowEl.append($('<td><img src="'+(trackObj.image && trackObj.image[trackObj.image.length-1].content)+ '"/></td>'));
                $rowEl.append($('<td>'+ artist +'</td>'));
                $rowEl.append($('<td>'+ track +'</td>'));

                var $spotiLinkEl = $('<td></td>');
                $rowEl.append($spotiLinkEl);
                
                $resultEl.append($rowEl);
                spotifyTimeout = setTimeout(function() {
                    getSpotifyLinks($spotiLinkEl, artist, track);
                }, 500 * parseInt(index));
            });
            spotifyCountdown = data.query.results.lfm.length;
        } else {
            $('#results').html('<p>Sorry, there was no results for that search. Try something else.</p>');
        }
    };
    
    // Lookup tracks from Spotify metadata api
    var getSpotifyLinks = function($el, artist, track) {
        var url = 'http://query.yahooapis.com/v1/public/yql?q=';
        var spotifyurl = "http://ws.spotify.com/search/1/track?q=" + encodeURIComponent(artist) + "%20" + encodeURIComponent(track);
        spotifyEls[spotifyurl] = $el;
        var qry = "select%20track.href%20from%20xml%20where%20url%3D'" + encodeURIComponent(spotifyurl) + "'%20limit%201";
        var params = '&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=?';
        console.log(qry)
        return $.ajax({
            url: url+qry+params,
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'spotRecom.callbackSpotifyData',
            cache:true,
        });
        
    };
    
    // process the spotify result
    var callbackSpotifyData = function(data) {
        console.log(data);
        spotifyCountdown--;
        if (data.query.results) {
            spotifyEls[data.query.diagnostics.url.content].html('<a href="' + data.query.results.tracks.track.href + '">' + data.query.results.tracks.track.href + '</a>');
            spotifyStr += '\n' + data.query.results.tracks.track.href;
        } else {
            spotifyEls[data.query.diagnostics.url.content].html('Couldn\'t find track');
        }
        if ( spotifyCountdown<1 ) spotifyComplete();
    };
    
    // when all results are in, display the 'complete' box
    var spotifyComplete = function() {
        swfobject.embedSWF(
            "clippy.swf", "clippy", 
            "110", "14", 
            '9.0.0',
            'javascript/swfobject/expressInstall.swf', 
            {text: spotifyStr},
            {quality : "high", allowScriptAccess:"always", wmode:"transparent"},
            {id: "clippy", name: "clippy"}
            );
        $('#results-textarea').val(spotifyStr);
        $('#dragger').html(spotifyStr);
        $('#complete').fadeIn('slow');
    };
    
    // return functions that can be called from the outside world
    // These are used by jsonp callbacks.
    // We can't use closure references through jquery because the varying callback function names
    // break caching.
    return {
        callbackLastFMData: callbackLastFMData,
        callbackSpotifyData: callbackSpotifyData
    }
    
})();
