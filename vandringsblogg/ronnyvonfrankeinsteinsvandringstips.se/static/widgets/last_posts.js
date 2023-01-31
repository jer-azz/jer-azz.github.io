(function () {
    var scriptTag = document.getElementById("last_posts_widget");
    var blogid = scriptTag.getAttribute("data-blogid");
    var entryid = scriptTag.getAttribute("data-entryid");
    var container = document.createElement("div");
    scriptTag.parentNode.insertBefore(container, scriptTag);
    $(container).load("/widgets/last_posts/" + blogid,  'entry_id=' + entryid);
})();
