Options = chrome.extension.getBackgroundPage().Options;

Configure = {
	load: function()
	{
	    Options.load();
	    for(var i = 0; i < document.options.cancel_interval.length; i++){
	        if(document.options.cancel_interval[i].value == Options.get("cancel_interval")){
	            document.options.cancel_interval[i].selected = true;
	        }
        }
        document.options.prev_notice.checked = Options.get("prev_notice");
    },

	save: function()
	{
		Options.set('cancel_interval', document.options.cancel_interval[document.options.cancel_interval.selectedIndex].value);
        Options.set("prev_notice", document.options.prev_notice.checked);
        Options.save();
	}
};

$(function(){
    Configure.load(false);
    
    $("#save_btn").click(function(){
        Configure.save();
    });
    $("#reset_btn").click(function(){
        Configure.load();
    });
    $("#exit_btn").click(function(){
        window.close();
    });

});

