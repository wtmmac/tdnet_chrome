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
        prev_notice: false
    },

    load: function(){
        var options = localStorage.getItem("options");
        if(options){
            try{
                this.options = JSON.parse(options);
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
    console.log('fetch');
    var d = new Date();
    var year = d.getFullYear();
    var mon = d.getMonth()+1;
    mon = mon < 10 ? "0"+mon : ""+mon;
    var date = d.getDate();
    date = date < 10 ? "0"+date : ""+date;

    var url = "https://www.release.tdnet.info/inbs/I_list_"+(num < 10 ? "00"+num : "0"+num)+"_"+year+mon+date+".html";

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
    var d = new Date();
    var min = d.getMinutes();
    var sec = d.getSeconds();
    
    // 5分間隔+5秒で次の開示を確認しにいく
    var tmp = min % 10;
    var diff = tmp < 5 ? 5 - tmp : 10 - tmp;
    var msec = ((diff*60) - sec) * 1000 + 5000;
    
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

