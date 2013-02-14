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

        // 通知する時間帯の時間と分を設定
        for(var i = 0; i < 24; i++){
            document.options.notice_start_hour.options[i] = new Option(i, i);
            document.options.notice_end_hour.options[i] = new Option(i, i);
            if(i == Options.get("notice_start_hour")){
                document.options.notice_start_hour[i].selected = true;
            }
            if(i == Options.get("notice_end_hour")){
                document.options.notice_end_hour[i].selected = true;
            }
        }
        for(var i = 0; i < 60; i++){
            document.options.notice_start_min.options[i] = new Option(i, i);
            document.options.notice_end_min.options[i] = new Option(i, i);
            if(i == Options.get("notice_start_min")){
                document.options.notice_start_min[i].selected = true;
            }
            if(i == Options.get("notice_end_min")){
                document.options.notice_end_min[i].selected = true;
            }
        }

        // 開示を取得するタイミング
        for(var i = 0; i < document.options.notice_get_second.length; i++){
            if(document.options.notice_get_second[i].value == Options.get("notice_get_second")){
                document.options.notice_get_second[i].selected = true;
            }
        }

        document.options.prev_notice.checked = Options.get("prev_notice");
    },

	save: function()
	{
		Options.set('cancel_interval', document.options.cancel_interval[document.options.cancel_interval.selectedIndex].value);
        Options.set("prev_notice", document.options.prev_notice.checked);
        Options.set("notice_start_hour", document.options.notice_start_hour[document.options.notice_start_hour.selectedIndex].value);
        Options.set("notice_start_min", document.options.notice_start_min[document.options.notice_start_min.selectedIndex].value);
        Options.set("notice_end_hour", document.options.notice_end_hour[document.options.notice_end_hour.selectedIndex].value);
        Options.set("notice_end_min", document.options.notice_end_min[document.options.notice_end_min.selectedIndex].value);
        Options.set("notice_get_second", document.options.notice_get_second[document.options.notice_get_second.selectedIndex].value);
        Options.save();

        $("#save_result").fadeIn();
        setTimeout(function(){
            $("#save_result").fadeOut();
        }, 3000);
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

