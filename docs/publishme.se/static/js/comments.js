(function() {
    if ( window.BSECommentsLoaded )
        return;

    function insertRecaptcha() {
        var script = document.createElement('script');
        script.src = '../www.google.com/recaptcha/api.js';
        var head = document.getElementsByTagName('head')[0];
        head.appendChild( script );

        var forms = document.getElementsByTagName('form'),
            captchaDiv = document.createElement('div');
        captchaDiv.className = "g-recaptcha";
        captchaDiv.setAttribute('data-sitekey', '6LeysRwUAAAAAMv-UReqhx4heaIYWmznOgW__5IH');
        for ( var i = 0; i < forms.length; i++ ) {
            if ( getField('content', forms[i]) && getField('url', forms[i]) ) {
                insertBefore(getField('submit', forms[i]), captchaDiv);

                forms[i].addEventListener("submit", function(e) {
                    if (document.getElementById('g-recaptcha-response').value == '') {
                        e.preventDefault();
                        alert("Du måste kryssa i rutan som bevisar att du inte är en robot.");
                        return false;
                    }
                });
                break;
            }
        }
    }

    // Recaptcha disabled 
    var whitelist = ['.blogg.se', '.webblogg.se'];
    for (domain in whitelist) {
        if (window.location.hostname.indexOf(whitelist[domain]) != -1) {
            insertRecaptcha();
            break;
        }
    }


    window.BSECommentsLoaded = true;
    
    var scriptFileName = 'static/js/comments.html';
    
    var scriptBase = (function() {
        var scripts = document.getElementsByTagName('script');
        for ( var i = 0, script; script = scripts[i]; i++ ) {
            if ( script.getAttribute('src') && script.getAttribute('src').indexOf(scriptFileName) !== -1 )
                return script.getAttribute('src').replace(scriptFileName, '');
        }
        return "http://publishme.se";
    })();
    
    var Config = {
        js: {
            current_user: scriptBase + '/api/current_user.jsonp'
        },
        css: scriptBase + '/static/css/bse.css?' + (new Date().getTime())
    };
    
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
    		var jsonp = "result_callback";
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
    
    function getField(name, fromForm) {
        var fields = fromForm.getElementsByTagName('*');
        for ( var i = 0, field; field = fields[i]; i++ )
            if ( field.name == name && field.form )
                return field;
        return false;
    }
    
    function addEvent( obj, type, fn ) {
        if ( ! obj )
            return false;
        
    	if (obj.addEventListener)
    		obj.addEventListener( type, fn, false );
    	else if (obj.attachEvent) {
    		obj["e"+type+fn] = fn;
    		obj[type+fn] = function() { return obj["e"+type+fn]( window.event ); };
    		obj.attachEvent( "on"+type, obj[type+fn] );
    	}
    };

    function stopEvent(e) {	
    	if ( e.stopPropogation )
    		e.stopPropogation();
    	if ( e.preventDefault )
    		e.preventDefault();
    	e.returnValue = false;
    };
    
    function insertAfter(element, context) {
        var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element.nextSibling);
    }
    
    function insertBefore(element, context) {
        var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element);
    }
    
    var submitForm = (function() {
        var forms = document.getElementsByTagName('form');
        for ( var i = 0; i < forms.length; i++ ) {
            if ( getField('content', forms[i]) && getField('url', forms[i]) )
                return forms[i];
        }
        return false;
    })();
    
    if ( ! submitForm ) {
        console.log("Could not find submitForm");
        return false;
    }
    
    var f = {
        /*name: getField('author'),
        email: getField('email'),
        url: getField('url'),
        content: getField('content'),*/
        submit: getField('submit', submitForm)
    };
    
    //addEvent(window, 'load', function() {
        addCSS(Config.css);
        fetchUser();
    //});
    
    function fetchUser() {
        JSONP.get(Config.js.current_user, {_: (new Date()).getTime()}, function(res) {
            if ( res.loggedIn )
                loggedIn(res);
            else
                notLoggedIn(res);
        });
    }
    
    function loggedIn(res) {
        makeBox(res.tpl.logged_in);
        popifyLinks();
    }
    
    function popifyLinks() {
        function checkLogin(e) {
            stopEvent(e);
            
            var href = this.getAttribute('href');
            var win = openPopup(href);
        
            var checkInterval = setInterval(function() {
                if ( win.closed ) {
                    fetchUser();
                    clearInterval(checkInterval);
                }
            }, 250);
        }
        
        var btnContainers = document.getElementsByClassName('signed-comment-button');
        for (var i=0; i++; i<btnContainers.length) {
            addEvent(btnContainers[i].getElementById('bse-what-is-this-link'), 'click', checkLogin);
            addEvent(btnContainers[i].getElementById('bse-login-to-sign'), 'click', checkLogin);
        }
    }
    
    function emptyChildren(el) {
        while (el.firstChild)
            el.removeChild(el.firstChild);
    }
    
    function openPopup(url) {
        var win = window.open(url, "bse_popup_woo", "width=490,height=500");
        return win;
    }
    
    function notLoggedIn(res) {
        makeBox(res.tpl.not_logged_in);
        
        popifyLinks();
    }
    
    function addCSS(css){
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = css;
        head.appendChild(link);
    }
    
    function getStyle(element, prop) {
    	if ( element.style[prop] )
    		return element.style[prop];

    	if ( element.currentStyle )
    		return element.currentStyle[prop];

    	return document.defaultView.getComputedStyle(element, null).getPropertyValue(prop);
    }
    
    var currentBox;
    function makeBox(html) {
//        emptyChildren(document.body);
        
        var box;
        if ( currentBox ) {
            box = currentBox;
        } else {
            box = document.createElement('div');
            with (box.style) {
                cssFloat = "left";
                styleFloat = "left";
                padding = '0';
                border = 'none';
                marginRight = '10px';
                marginBottom = '10px';
                position = 'relative';
            }
            box.style.marginTop = getStyle(f.submit, 'marginTop') || getStyle(f.submit, 'margin-top');
            box.className = "signed-comment-button";
            box.innerHTML = html;


            var forms = document.getElementsByTagName('form');
            for ( var i = 0; i < forms.length; i++ ) {
                if ( getField('content', forms[i]) && getField('url', forms[i]) )
                    insertBefore(getField('submit', forms[i]), box.cloneNode(true));
            }

            // insertBefore(f.submit, box);
        }

        currentBox = box;
//        document.body.appendChild(box);
        return box;
    }
    
})();