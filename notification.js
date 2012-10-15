$(function(){
    var Communicate = chrome.extension.getBackgroundPage().Communicate;
    var node = Communicate.shift();
    
    $("#time").text(node.time);
    $("#title").text(node.title);
    $("#message").html("<a href='"+node.url+"' target=_blank>"+node.message+"</a>");
});
