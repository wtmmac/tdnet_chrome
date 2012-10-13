
// デスクトップ通知処理
function tdnet_notification()
{
    var n = webkitNotifications.createNotification("", "TEST", "MESSAGE");
    n.show();
    n.onclose = function(){
        var c = webkitNotifications.createNotification("", "TEST", "CLOSE");
        c.show();
    }
    setTimeout(function(){
        n.cancel()
    }, 3000);
}

// 適時開示取得
function tdnet_fetch(num)
{
    var d = new Date();
    var year = d.getFullYear();
    var mon = d.getMonth()+1;
    mon = mon < 10 ? "0"+mon : ""+mon;
    var date = d.getDate();
    date = date < 10 ? "0"+date : ""+date;
    
    date = "12"; /* DEBUG !!! */

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
            
            tr = nodes.iterateNext(); // skip
            while(tr){
                var td = tr.getElementsByTagName("td");

                var time = td[0].innerText.replace(/^\s*|\s*$/g, "");
                var code = td[1].innerText.replace(/^\s*|\s*$/g, "");
                var name = td[2].innerText.replace(/^\s*|\s*$/g, "");
                var title = td[3].innerText.replace(/^\s*|\s*$/g, "");
                var pdf = "";
                var a = td[3].getElementsByTagName("a");
                if(a.length > 0){
                    pdf = a[0].getAttribute("href").replace(/^\s*|\s*$/g, "");
                }

                
                tr = nodes.iterateNext();
                break;
            }
            
            if(num < 1){
                num += 1
                tdnet_fetch(num);
            }
        }
        else{
            // 1分後に最初から開始
            setTimeout(function(){
                tdnet_fetch(1);
            }, 60000);
        }
    }
    
    // 取得失敗時
    x.onerror = function(res){
        // 1分後に最初から開始
        setTimeout(function(){
            tdnet_fetch(1);
        }, 60000);
    }
    
    x.open( 'GET', url, true );
    x.send(null);
}

// 実行
tdnet_fetch(1);

