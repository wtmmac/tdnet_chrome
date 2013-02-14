// notification.jsとやり取り
var Communicate = {
    notify: [],

    push: function(node){
        this.notify.push(node);
    },

    shift: function(){
        return this.notify.shift();
    }
}

// オプション
var Options = {
    options: {
        cancel_interval: 10, // 秒
        prev_notice: false,
        // ver0.1.1追加
        notice_start_hour: 0,
        notice_start_min: 0,
        notice_end_hour: 23,
        notice_end_min: 59,
        notice_get_second: "disable",
    },

    load: function(){
        var options = localStorage.getItem("options");
        if(options){
            try{
                this.options = JSON.parse(options);

                // ver0.1 -> 0.1.1
                if(!this.options.notice_start_hour){ this.options.notice_start_hour = 0; }
                if(!this.options.notice_start_min){ this.options.notice_start_min = 0; }
                if(!this.options.notice_end_hour){ this.options.notice_end_hour = 23; }
                if(!this.options.notice_end_min){ this.options.notice_end_min = 59; }
                if(!this.options.notice_get_second){ this.options.notice_get_second = "disable"; }
            }
            catch(e){
            }
        }
    },

    save: function()
    {
        localStorage.setItem("options", JSON.stringify(this.options));
    },

    set: function(key, value)
    {
        this.options[key] = value;
    },
    
    get: function(key)
    {
        return this.options[key];
    }
}

// デスクトップ通知管理
var TdnetNotify = {
    nodes: [],
    count: 0,
    is_enable: true,

    push: function(node){
        if(this.is_enable){
            this.nodes.push(node);
        }
    },

    notify: function(){
        // 通知できる状態にあるか
        // デスクトップ通知は最大5件？程度までっぽい
        if(this.count < 3 && this.nodes.length > 0){
            var node = this.nodes.pop();
            
            Communicate.push(node);

            var n = webkitNotifications.createHTMLNotification("notification.html");
            n.show();
            this.count++;

            n.onclose = function(){
                TdnetNotify.count--;
                TdnetNotify.notify();
            }

            setTimeout(function(){
                n.cancel();
            }, Options.get('cancel_interval')*1000);
        }
    },

    notify_all: function(){
        var i;
        for(i = this.count; i < 3; i++){
            this.notify();
        }
    },

    enable: function(){
        this.is_enable = true;
    },

    disable: function(){
        this.is_enable = false;
    }
}

// 履歴管理
var TdnetHistory = {
    data: {},

    save: function(pdf){
        this.data[pdf] = true;
    },

    exists: function(pdf){
        return this.data[pdf]
    }
}

// 適時開示取得
function tdnet_fetch(num)
{
    var d = new Date();

    // 通知可能時間内かチェック
    var hour = d.getHours();
    var min = d.getMinutes();
    var notice_now_time = hour*60 + min;
    var notice_start_time = parseInt(Options.get("notice_start_hour"))*60 + parseInt(Options.get("notice_start_min"));
    var notice_end_time = parseInt(Options.get("notice_end_hour"))*60 + parseInt(Options.get("notice_end_min"));
    if(notice_now_time < notice_start_time || notice_now_time > notice_end_time){
        // 時間外
        set_tdnet_fetch(1);
        return;
    }

    // 取得先URL作成
    var year = d.getFullYear();
    var mon = d.getMonth()+1;
    mon = mon < 10 ? "0"+mon : ""+mon;
    var date = d.getDate();
    date = date < 10 ? "0"+date : ""+date;
    var url = "https://www.release.tdnet.info/inbs/I_list_"+(num < 10 ? "00"+num : "0"+num)+"_"+year+mon+date+".html";

    // 取得開始
    var x = new XMLHttpRequest();
    // 取得成功時
    x.onload = function(res){
        if(x.status == 200){
            // DOC化
            var div = document.createElement('div');
            div.innerHTML = x.responseText;
            
            // HTML解析
            var nodes = document.evaluate('//table[@cellspacing="0"]//tr', div, null, XPathResult.ANY_TYPE, null);
            var tr = nodes.iterateNext();

            tr = nodes.iterateNext(); // 1列目は飛ばす
            while(tr){
                var td = tr.getElementsByTagName("td");
                if(td.length < 8){
                    break;
                }

                var time = td[0].innerText.replace(/^\s*|\s*$/g, "");
                var code = td[1].innerText.replace(/^\s*|\s*$/g, "").substring(0, 4);
                var name = td[2].innerText.replace(/^\s*|\s*$/g, "");
                var title = td[3].innerText.replace(/^\s*|\s*$/g, "");
                var pdf = "";
                var a = td[3].getElementsByTagName("a");
                if(a.length > 0){
                    pdf = a[0].getAttribute("href").replace(/^\s*|\s*$/g, "");
                }

                // 既に通知済みであればここで終了
                if(TdnetHistory.exists(pdf)){
                    // 全部通知
                    TdnetNotify.notify_all();
                    
                    // 呼び出し設定
                    set_tdnet_fetch(1);
                    return;
                }
                TdnetHistory.save(pdf); // 履歴保存

                // 通知してないので通知処理
                TdnetNotify.push({
                    'time': time,
                    'title': code+" "+name,
                    'message': title,
                    'url': "https://www.release.tdnet.info/inbs/"+pdf
                });
                
                tr = nodes.iterateNext();
            }

            if(num < 100){
                num++;
                tdnet_fetch(num);
            }
        }
        else{
            // 読み込み終わったので、デスクトップ通知を有効化
            TdnetNotify.enable();

            // 全部通知
            TdnetNotify.notify_all();
            
            // 呼び出し設定
            set_tdnet_fetch(1);
        }
    }
    
    // 取得失敗時
    x.onerror = function(res){
        set_tdnet_fetch(1);
    }
    
    x.open( 'GET', url, true );
    x.send(null);
}

// 取得間隔調整
function set_tdnet_fetch(num)
{
    var nsecond = parseInt(Options.get("notice_get_second"));
    var msec = 300000; // デフォルト5分後
    if(nsecond >= 0 && nsecond <= 5 ){
        // 5分区切り+n秒で次の開示を確認しにいく
        var d = new Date();
        var min = d.getMinutes();
        var sec = d.getSeconds();

        var tmp = min % 10;
        var diff = tmp < 5 ? 5 - tmp : 10 - tmp;
        msec = ((diff*60) - sec) * 1000 + nsecond*1000;
    }
    
    setTimeout(function(){
        tdnet_fetch(num);
    }, msec);
}

// オプション読み込み
Options.load();

if(!Options.get('prev_notice')){
    // 起動前に開示された情報についてはデスクトップ通知しない
    // 開示された情報を全て読み込むまで、デスクトップ通知を無効化
    TdnetNotify.disable();
}

// 実行
tdnet_fetch(1);

