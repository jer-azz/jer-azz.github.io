

(function() {
    
    var scriptFileName = '/static/widgets/likes.js';
    
    var scriptBase = (function() {
        return document.location.protocol + "//" + document.location.host;
    })();
    
    var Config = {
        // js: {
        //     current_user: scriptBase + '/api/current_user.jsonp'
        // },
        css: scriptBase + '/static/widgets/likewidget.css',
        debug: false
    };

    if ( !window.BSELikes ) {
        // Setup likes object, import css and attach document/ready event handler
        window.BSELikes = {loaded: true, 
                            debug: Config.debug,
                            cache: [],
                            entries: [],
                            more_entries: function() {
                                debug_log("more_entries()");
                                fix_script_tags();
                                load_likes();
                            }
                        };

        if (window.BSEIgnoreLikeCSS != true) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = Config.css;
            head.appendChild(link);
        }

        if ( document.addEventListener ) {
            debug_log("addEventListener: DOMContentLoaded()");
            document.addEventListener( "DOMContentLoaded", function(){
                debug_log("DOMContentLoaded() fired!");
                document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
                load_likes();
            }, false);
        } else if ( document.attachEvent ) {
            debug_log("addEventListener: onreadystatechange()");
            document.attachEvent("onreadystatechange", function(){
                debug_log("addEventListener: onreadystatechange() readyState == " + document.readyState);
                if ( document.readyState === "complete" ) {
                    document.detachEvent( "onreadystatechange", arguments.callee );
                    load_likes();
                }
            });
        } else {
            window.addEventListener('load', load_likes, false )
        }

        window.onload = function() {
            debug_log("window.onload() fired!")
            load_likes();
        }
    }



    function init_container(scriptTag) {
        var container = document.createElement("div"),
            id = scriptTag.getAttribute("data-entryid");
        container.id = "like-" + scriptTag.getAttribute("data-entryid");
        container.className = "like-container";
        container.style.display = "inline-block";
        insertAfter(scriptTag, container);

        window.BSELikes.entries.push({'entryid': id, 'timestamp': scriptTag.getAttribute('data-timestamp')});

        var div = document.createElement("div"),
            theme = scriptTag.getAttribute("data-theme") ? " likebtn_theme_" + scriptTag.getAttribute("data-theme") : "",
            size = scriptTag.getAttribute("data-size") ? " likebtn_size_" + scriptTag.getAttribute("data-size") : "",
            bubblepos = scriptTag.getAttribute("data-bubblepos") ? " likebtn_pos_" + scriptTag.getAttribute("data-bubblepos") : "";
        div.className = "likebtn" + theme + size + bubblepos; // + scriptTag.className.replace('likewidget', '');
        var span = document.createElement("span");
        span.className = "likebtn__count not_loaded";
        span.innerHTML = "0";

        div.appendChild(span);

        var link = document.createElement("a");
        link.className = "likebtn__btn";
        link.setAttribute('href', '#');
        link.setAttribute('title', 'Gilla inlägget');
        link.innerHTML = "Gilla";

        div.appendChild(link);

        debug_log("Adding event listener for a-tag " + id);
        link.addEventListener('click', like_clickhandler, false);
        container.appendChild(div);
    }


    function fetchData(entries) {
        debug_log("Fetching data for entries: ", entries);
        var month_arr = {}, cached_entries = {};
        for (entry in entries) {
            var id = entries[entry].entryid,
                ts = new Date(entries[entry].timestamp*1000),
                ts_str = ts.toISOString().substr(0,4) + "/" + ts.toISOString().substr(5,2),
                cached = false;

            for (ce in window.BSELikes.cache) {
                if (window.BSELikes.cache[ce].entryid == id) {
                    debug_log("Entryid "+id+" already in cache, skipping...");
                    cached = true;
                    cached_entries[id] = window.BSELikes.cache[ce].likes;
                    break;
                }
            }
            if (!cached && (!month_arr[ ts_str ] || month_arr[ ts_str ] > entries[entry].timestamp)) {
                month_arr[ ts_str ] = entries[entry].timestamp;
            }
        }
        if (Object.keys(cached_entries).length > 0) {
            debug_log("Drawing cached likes: ", cached_entries);
            drawLikes(cached_entries);
        }

        debug_log("Months needed to fetch likes for: ", month_arr);

        for (month in month_arr) {
            debug_log('Fetching /_mobile/likes/' + month + '/' +month_arr[month]);
            loadJSON('/_mobile/likes/' + month + '/' +month_arr[month], function(data) {
                debug_log('Result from /_mobile/likes/' + month + '/' +month_arr[month] + "': " + data.count + " entries returned (last_ts: " + data.last_ts + ")");
                for (entryid in data.entries) {
                    debug_log("Caching entry => Entryid: " + entryid + ", likes: " + data.entries[entryid]);
                    window.BSELikes.cache.push({entryid: entryid, likes: data.entries[entryid]});
                }

                // We received new likes data from server, time to update browser with stuff!
                if (window.BSELikes.entries) {
                    drawLikes(data.entries);
                }
            });
        }
    }

    function drawLikes(entries) {
        // Update the entries stores in BSELikes.entries with cached result!
        for (entry in entries) {
            var entryid = entry, //entries[entry].entryid,
                likes = entries[entry];
            // if (window.BSELikes.cache[entryid]) 
            //     likes = window.BSELikes.cache[entryid].likes;

            // for (e in window.BSELikes.cache) {
            //     if (window.BSELikes.cache[e].entryid == entryid) {
            //         likes = window.BSELikes.cache[e].likes;
            //         break;
            //     }
            // }

            debug_log("DRAWING entry => entryid: " + entryid + ", likes: " + likes);
            var container = document.getElementById("like-" + entryid);
            if (container) {
                var ticker = container.getElementsByClassName("likebtn__count")[0];
                ticker.setAttribute("data-likes", likes);
                ticker.className = ticker.className.replace(" not_loaded", "");
                ticker.innerHTML = likes;
            }
        }
    }

    function like_clickhandler(e) {
        e.preventDefault();

        debug_log("Like button clicked");
        var el = e.srcElement ? e.srcElement : e.currentTarget;
        if (el.nodeName == 'A') el = el.parentNode;
        entryid = el.parentNode.getAttribute("id").replace("like-", "");
        if (el.className.indexOf('liked') == -1) {
            debug_log("Add like for entry " + entryid);
            el.className = el.className.replace(" unliked", "") + " liked";
            loadJSON('/_like/'+entryid+'/add.json', function(res) {
                if (res.success) {
                    var ticker = el.getElementsByClassName("likebtn__count")[0],
                        likes = parseInt(ticker.getAttribute("data-likes") ? ticker.getAttribute("data-likes") : 0) + 1;

                    ticker.setAttribute("data-likes", likes);
                    ticker.innerHTML = likes;
                    ticker.className = ticker.className.replace(" not_loaded", "");
                }
            });
        } else {
            debug_log("Remove like for entry " + entryid);
            el.className = el.className.replace(" liked", "") + " unliked";
            loadJSON('/_like/'+entryid+'/remove.json', function(res) {
                if (res.success) {
                    var ticker = el.getElementsByClassName("likebtn__count")[0],
                         likes = parseInt(ticker.getAttribute("data-likes") ? ticker.getAttribute("data-likes") : 0) - 1;
                    if (likes < 1) likes = 0;
                    ticker.setAttribute("data-likes", likes);
                    ticker.innerHTML = likes;
                }
            });
        }
        return false;
    }

    function fix_script_tags() {
        var scripts = document.getElementsByClassName('likewidget');
        for ( var i = scripts.length-1, script; script = scripts[i]; i-- ) {
            debug_log("Script found: " + script)
            init_container(script);
            script.className = "";
        }
    }

    function load_likes() {
        debug_log("load_likes() (loading " + window.BSELikes.entries.length + " entries)");
        // On document/ready this function executes to load likes data and populate containers.
        if (window.BSELikes.entries.length) {
            fetchData(window.BSELikes.entries);
            window.BSELikes.entries = [];
        }
    }

    fix_script_tags();



    // Some helper functions follow
    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function debug_log() {
        if (!window.BSELikes.debug) return;
        console.log("LIKES/LOG", arguments);
    }

    var JSONP = (function(){
    	var head, query, key, window = this;

    	function load(url) {
    		var script = document.createElement('script'), done = false;
    		script.src = url;
    		script.async = true;

    		script.onload = script.onreadystatechange = function() {
    			if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
    				done = true;
    				script.onload = script.onreadystatechange = null;
    				if ( script && script.parentNode ) {
    					script.parentNode.removeChild( script );
    				}
    			}
    		};
    		if ( !head )
    			head = document.getElementsByTagName('head')[0];
    		head.appendChild( script );
    	}
    	function jsonp(url, params, callback) {
    		query = "?";
    		params = params || {};
    		for ( key in params )
    			if ( params.hasOwnProperty(key) )
    				query += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
    		var jsonp = "callback_" + (((1 + Math.random()) * 0x10000) | 0).toString(32);
    		window[ jsonp ] = function(data){
    			callback(data);
    			try {
    				delete window[ jsonp ];
    			} catch (e) {}
    			window[ jsonp ] = null;
    		};

    		load(url + query + "callback=" + jsonp);
    		return jsonp;
    	}
    	return {get: jsonp};
    })();

    function loadJSON(url, callback)
    {
       var http_request = new XMLHttpRequest();
       try{
          // Opera 8.0+, Firefox, Chrome, Safari
          http_request = new XMLHttpRequest();
       }catch (e){
          // Internet Explorer Browsers
          try{
             http_request = new ActiveXObject("Msxml2.XMLHTTP");
          }catch (e) {
             try{
                http_request = new ActiveXObject("Microsoft.XMLHTTP");
             }catch (e){
                // Something went wrong
                // alert("Your browser broke!");
                return false;
             }
          }
       }
       http_request.onreadystatechange  = function(){
          if (http_request.readyState == 4  )
          {
            // Javascript function JSON.parse to parse JSON data
            var jsonObj = JSON.parse(http_request.responseText);
            callback(jsonObj);
          }
       }
       http_request.open("GET", url, true);
       http_request.send();
    }
})();


