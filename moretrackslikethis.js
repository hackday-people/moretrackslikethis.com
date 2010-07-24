
/*
    Title:  Spotify Recommendation via Last.fm
*/

var spotRecom = (function(){
    $(document).ready(function(){
        $('#search').bind('click submit', function() {
            // Start the search
            console.log(getLastFMSimilarData($('#track').val(), $('#artist').val()));
            spotRecom.search();
            return false;
        });
        
        $('#example_track').bind('click', function(e) {
            console.log(getLastFMSimilarData('Hey', 'Pixies'));
            spotRecom.search('Hey', 'Pixies');
            return false;
        });
    });
    
    var getLastFMSimilarURL = function(track, artist) {
        
        var track = $.trim(track);
        var artist = $.trim(artist);
        
        var url = 'http://query.yahooapis.com/v1/public/yql?q=';
        var qry = "select%20similartracks%20from%20lastfm.track.getsimilar%20where%20api_key%3D'f848f5efdbf20b9366985a24f7aed172'%20and%20artist%3D'" + encodeURIComponent(artist) + "'%20and%20track%3D'" + encodeURIComponent(track) + "'";
        var params = '&format=json&_maxage=3600000&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=?';

        return url+qry+params;
    }
    var getLastFMSimilarData = function(track, artist) {
        return $.ajax({
            url: getLastFMSimilarURL(track, artist),
            dataType: 'jsonp',
            success: callbackLastFMData,
            cache:true,
        });
    };
    var callbackLastFMData = function (data) {
        if (data.query.results) {
            var $resultEl = $('#results');
            $.each(data.query.results.lfm.similartracks.track, function(index) {
                console.log(this)
                var $el = $('<li>'+(this.artist && this.artist.name)+' - '+this.name+'</li>');
                $el.append($('<img src="'+(this.image && this.image[0].content)+ '"/>'));
                $resultEl.append($el);
            });
            getSpotifyLinks();
        } else {
            $('#results').html('<p>Sorry, there was no results for that search. Try something else.</p>');
        }
    };
    var getSpotifyLinks = function() {
        
    
    };
    
    return {
        // Define DOM element variables
        artist : $('#artist'),
        track : $('#track'),
        
        search : function(track, artist) {
            // Clear any previous results and tell the user we're searching
            $('#results').empty();
            $('#results').html('<p>Searching now...</p> ');
            
            // If track or artist was passed in then populate form fields
            if (track || artist) {
                this.track.val(track);
                this.artist.val(artist);
            }
            
            // Build the URL from passed parameters
            var url = this.buildUrl();
            
            // Make the Ajax request
            $.getJSON(url, function(data) {
                // Clear results container
                $('#results').empty();
                
                // Check if we got any results
                if (data.count <= 1) {
                    // No results so tell the user and quit
                    $('#results').html('<p>Sorry, there was no results for that search. Try something else.</p>');
                    return;
                }
                
                // Create an empty playlist
                var playlist = $('<textarea id="playlist"></textarea>');
                
                // Loop through each result and create links
                $.each(data.value.items, function(i, item) {
                    if (item.link === null ) {
                        return;
                    }
                    // Add direct link
                    $('#results').append('<p><a href="' + item.link + '">' + item.title  + ' by ' + item.author + '</a></p>');
                    
                    // Add to playlist
                    playlist.append(item.link + '\n');
                });
                
                // Add finished playlist
                $('#results').append('<p class="playlist_info">Drag &amp; Drop, or Copy &amp; Paste the links anywhere into Spotify</p>');
                $('#results').append(playlist);
            });
        },
        
        buildUrl : buildUrl
    }
    
})();

​