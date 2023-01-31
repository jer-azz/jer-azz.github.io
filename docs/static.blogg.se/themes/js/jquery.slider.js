$(document).ready(function(){
	$("#content").on('click', '.slide > a', function(){$(this).toggleClass("active").closest(".slider").find(".panel").toggle("normal");return false});
});