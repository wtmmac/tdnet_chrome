$(function(){
    var BG = chrome.extension.getBackgroundPage();
    var node = BG.notify.shift();
    
    $("#time").text(node.time);
    $("#title").text(node.title);
    $("#message").html("<a href='"+node.url+"' target=_blank>"+node.message+"</a>");
});
