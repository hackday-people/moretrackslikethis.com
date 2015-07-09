/*
    Title:  More Tracks Like This JavaScript
    File. moretracks.js
    
    Site: http://moretrackslikethis.com/
    Src: http://github.com/hackday-people/moretrackslikethis.com
    
    Created: Sat 24 Jul 2010 17:31:35 BST 
    
 Copyright (c) 2010 Kenneth Kufluk, Jon Griffiths and Andrew Mason

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 
*/

/*
    Title:  Spotify Recommendation via Last.fm
*/

var moreTracksLikeThis = (function(){

    var MAX_TRACKS_TO_RETURN = 10;

    var spotifyEls = [];  // a map of spotify queries to result elements
    var spotifyCountdown = 0;  // a counter to kick off the results display when all results are in

    $(document).ready(function(){

        // search button
        $('#search').bind('click submit', function() {
            
            // spotify uri lookup if necessary
            if ($('#lookup').val()!='') {
                getSpotifyLookup($('#lookup').val());
                return false;
            }

            // validation
            if (!$('#artist').val() || !$('#track').val()) {
                $('#messages').html('<p>Please fill in both track name and artist.</p> ');
            }
            
            // Start the search
            $('#messages').empty();
            $('#messages').show();
            $('#messages').html('<p>Searching now...</p> ');
            
            $('#results').hide();
            
            
            setTimeout(function() {
                getLastFMSimilarData(formatSearchString($('#track').val()), formatSearchString($('#artist').val()));
            }, 1000);
            $('#complete').hide();
            $('#results').show();
            $('html,body').animate({scrollTop: $('#results').offset().top}, 900);
            
            try {
                _gaq.push(['_trackEvent', $('#artist').val(), $('#track').val()]);            
            } catch (e) {}
            return false;
        });
        
        // lookup button
        $('#lookup').bind('click submit', function() {
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
        
        // handle submit actions
        $('#searchForm').submit(function() {
            $('#search').click();
            return false;
        });
        
        // do the weird text-select-drag action
        var selectDraggerText = function() {
            var div;
            if (document.selection) {
                div = document.body.createTextRange();
                div.moveToElementText($("#dragger")[0]);
                div.select();
            } else {
                div = document.createRange();
                div.setStartBefore($("#dragger")[0]);
                div.setEndAfter($("#dragger")[0]) ;
                window.getSelection().addRange(div);
            }
        };
        $('#dragger').mouseover(selectDraggerText);
        $('#dragger').mousedown(function() {
            $(this).css({'opacity':'1'});
            $(this).animate({'opacity':'0'}, 1000);
        });
        $('#dragger').mouseleave(function() {
            $(this).css({'opacity':'0'});
        });
        
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
            jsonpCallback: 'moreTracksLikeThis.callbackLastFMData',
            cache:true,
        });
    };
    
    // process the data from lastfm
    var callbackLastFMData = function (data) {
        if (data.query.results) {
            $('#messages').empty();
            $('#messages').hide('slow');
            $('#complete').hide();
            
            $('#buildingMsg').text('Building playlist...');
            $('#buildingMsg').show('slow');
            
            $('#resultsList').empty();
            var $resultEl = $('#resultsList');
            $.each(data.query.results.lfm, function(index) {
                if (!this.similartracks) return;
                var trackObj = this.similartracks.track[1];
                var artist = trackObj.artist.name || "artist";
                var track = trackObj.name || "track";

                var $rowEl = $('<li class="round"></li>');
                $rowEl.append($('<img src="'+(trackObj.image && trackObj.image[trackObj.image.length-1].content)+ '"/><span class="overlay"></span>'));
                $rowEl.append('<strong>' + track + '</strong><br />');
                $rowEl.append('by <strong>' + artist + '</strong><br />');

                var $spotiLinkEl = $('<span class="link"></span>');
                $rowEl.append($spotiLinkEl);

                var $deleteEl = $('<a href="#" class="delete">Delete</a>');
                $deleteEl.click(function() {
                    $rowEl.remove();
                    spotifyComplete();
                    return false;
                });
                $rowEl.append($deleteEl);
                

                $resultEl.append($rowEl);
                spotifyTimeout = setTimeout(function() {
                    getSpotifyLinks($spotiLinkEl, artist, track);
                }, 500 * parseInt(index));
            });
            spotifyCountdown = data.query.results.lfm.length;
        } else {
            $('#messages').html('<p>Sorry, there was no results for that search. Try something else.</p>');
        }
    };
    
    // Lookup tracks from Spotify metadata api
    var getSpotifyLinks = function($el, artist, track) {
        var url = 'http://query.yahooapis.com/v1/public/yql?q=';
        var spotifyurl = "http://ws.spotify.com/search/1/track?q=" + encodeURIComponent(artist) + "%20" + encodeURIComponent(track);
        spotifyEls[spotifyurl] = $el;
        var qry = "select%20track.href%20from%20xml%20where%20url%3D'" + encodeURIComponent(spotifyurl) + "'%20limit%201";
        var params = '&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=?';
        return $.ajax({
            url: url+qry+params,
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'moreTracksLikeThis.callbackSpotifyData',
            cache:true,
        });
        
    };
    
    // process the spotify result
    var callbackSpotifyData = function(data) {
        spotifyCountdown--;
        var $el = spotifyEls[data.query.diagnostics.url.content];
        var href = '';
        if (data.query.results) {
            href = data.query.results.tracks.track.href;
            $el.html('<a href="' + href + '">' + href + '</a>');
        } else {
            $el.html('<strong>Sorry, Spotify doesn&rsquo;t have that track</strong>');
        }

        if ( spotifyCountdown<1 ) spotifyComplete();
    };
    
    // process the spotify result
    var getSpotifyStr = function() {
        var str = '';
        $('.link a').each(function() {
            str += '\n' + this.href;
        });
        return str;
    };
    
    
    // when all results are in, display the 'complete' box
    var spotifyComplete = function() {
        swfobject.embedSWF(
            "clippy.swf", "clippy", 
            "110", "19", 
            '9.0.0',
            'javascript/swfobject/expressInstall.swf', 
            {text: getSpotifyStr()},
            {quality : "high", allowScriptAccess:"always", wmode:"transparent"},
            {id: "clippy", name: "clippy"}
            );

        $('#buildingMsg').hide('slow');

        $('#results-textarea').val(getSpotifyStr());
        var draggerContent = getSpotifyStr();
        // if firefox, use a nice drop-image.  webkit won't allow drag of text if user clicks image first
        if ($.browser.mozilla) draggerContent = '<img src="images/drag_button.png" width="166" height="163" /><br/><br/><br/><br/>' + draggerContent;
        $('#dragger').html(draggerContent);
        $('#complete').fadeIn('slow');

    };


    // Lookup spotify urls
    var getSpotifyLookup = function(lookupurl) {
        var url = 'http://query.yahooapis.com/v1/public/yql?q=';
        var spotifyurl = "http://ws.spotify.com/lookup/1/?uri=" + encodeURIComponent(lookupurl);
        var qry = "select%20artist.name,name%20from%20xml%20where%20url%3D'" + encodeURIComponent(spotifyurl) + "'%20limit%201";
        var params = '&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=?';
        return $.ajax({
            url: url+qry+params,
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'moreTracksLikeThis.callbackSpotifyLookup',
            cache:true,
        });
    };
    // process the spotify lookup
    var callbackSpotifyLookup = function(data) {
        if (data.query.results) {
            $('#track').val(data.query.results.track.name);
            $('#artist').val(data.query.results.track.artist.name);
            $('#lookup').val('');
            $('#search').click();
        } else {
            $('#messages').html('<p>Sorry, that URL didn\'t yield any useful data.</p> ');
        }
    };
    
    // Strip special characters from search string
    var formatSearchString = function(string){
        string = string.replace(/&/g,'').replace(/>/g,'').replace(/</g,'').replace(/"/g,'').replace(/'/g,'');
        return string;
    }
    
    // return functions that can be called from the outside world
    // These are used by jsonp callbacks.
    // We can't use closure references through jquery because the varying callback function names
    // break caching.
    return {
        callbackLastFMData: callbackLastFMData,
        callbackSpotifyData: callbackSpotifyData,
        callbackSpotifyLookup: callbackSpotifyLookup
    }
    
})();
