(function () {
    // a href rewrite targets
    var targets = document.querySelectorAll('[data-mno-banner="uninitialized"]');

    // {{from}} judge method
    var from = (function () {
        var domain = location.hostname;
        var domains = {
        // domain : serviceId
        "ip-phone-smart.jp":"smr",
        "pointonline.rakuten.co.jp":"opp",
        "business-isp.rakuten.co.jp":"com",
        "24.rakuten.co.jp":"r24",
        "academy.drone.rakuten.co.jp":"rdg",
        "adsales.rakuten.co.jp":"rmp",
        "affiliate.rakuten.co.jp":"aff",
        "agriculture.rakuten.co.jp":"rgr",
        "agriculture.rakuten.net":"rgr",
        "api.music.rakuten.co.jp":"msc",
        "beauty.rakuten.co.jp":"bty",
        "biccamera.rakuten.co.jp":"rbc",
        "books.rakuten.co.jp":"bks",
        "brandavenue.rakuten.co.jp":"brn",
        "broadband.rakuten.co.jp":"brd",
        "buyback.rakuten.co.jp":"byb",
        "calendar.rakuten.co.jp":"cal",
        "campus.nikki.ne.jp":"mns",
        "car.rakuten.co.jp":"car",
        "career.rakuten.co.jp":"crr",
        "carservice.rakuten.co.jp":"crc",
        "carshare.rakuten.co.jp":"rcs",
        "cart.shashinkan.rakuten.co.jp":"shs",
        "cash.rakuten.co.jp":"edy",
        "channel.rakuten.co.jp":"rch",
        "check.rakuten.co.jp":"chk",
        "checkout.rakuten.co.jp":"cho",
        "cloud.rakuten.co.jp":"com",
        "cms.ticketstar.jp":"tck",
        "collection.rakuten.net":"rcl",
        "comm.rakuten.co.jp":"com",
        "connect.rakuten.co.jp":"com",
        "corp.media-services.rakuten.co.jp":"rml",
        "corp.rakuten.co.jp":"rcr",
        "coupon.rakuten.co.jp":"rac",
        "delivery.rakuten.co.jp":"dlv",
        "denwa.rakuten.co.jp":"rdw",
        "dev.senior.rakuten.co.jp":"snr",
        "dining.rakuten.co.jp":"dnn",
        "dream.rakuten.co.jp":"drm",
        "drone.rakuten.co.jp":"drn",
        "edy.rakuten.co.jp":"edy",
        "energy.rakuten.co.jp":"ene",
        "english.rakuten.co.jp":"rse",
        "event.gora.golf.rakuten.co.jp":"gra",
        "event.rakuten.co.jp":"ich",
        "experiences.travel.rakuten.co.jp":"txp",
        "fril.jp":"rkm",
        "gateway.drone.rakuten.co.jp":"drn",
        "giftcard.cash.rakuten.co.jp":"edy",
        "global.rakuten.com":"rgm",
        "globalexpress.rakuten.co.jp":"rgx",
        "gora.golf.rakuten.co.jp":"gra",
        "health.incubation.rakuten.co.jp":"pcr",
        "healthcare.rakuten.co.jp":"rhc",
        "hikari.rakuten.co.jp":"hkr",
        "hoken.rakuten.co.jp":"hkn",
        "in.keirin.kdreams.jp":"krn",
        "insurance.rakuten.co.jp":"ins",
        "jp.linkshare.com":"lnk",
        "kdreams.jp":"krn",
        "keiba.rakuten.co.jp":"kba",
        "keirin.kdreams.jp":"krn",
        "kidona.rakuten.co.jp":"kdn",
        "kobo-free.books.rakuten.co.jp":"kbo",
        "kuji.rakuten.co.jp":"kji",
        "leisure.tstar.jp":"rtl",
        "live.rakuten.co.jp":"lve",
        "live.tv.rakuten.co.jp":"rtv",
        "magazine.rakuten.co.jp":"mgz",
        "manager.gora.golf.rakuten.co.jp":"gra",
        "member.insight.rakuten.co.jp":"rsr",
        "member.pointmail.rakuten.co.jp":"pcl",
        "minijob.rakuten.co.jp":"mnj",
        "money.rakuten.co.jp":"mon",
        "music.rakuten.co.jp":"msc",
        "my.calendar.rakuten.co.jp":"cal",
        "my.keiba.rakuten.co.jp":"kba",
        "my.keirin.kdreams.jp":"krn",
        "my.plaza.rakuten.co.jp":"blg",
        "my.rakuten.co.jp":"grp_gmx",
        "nba.rakuten.co.jp":"nba",
        "netsuper.rakuten.co.jp":"zsu",
        "news.infoseek.co.jp":"ifn",
        "nft.rakuten.co.jp":"rnf",
        "pasha.rakuten.co.jp":"psh",
        "pay.rakuten.co.jp":"rpa",
        "plaza.rakuten.co.jp":"blg",
        "point-g.rakuten.co.jp":"pnt",
        "point.rakuten.co.jp":"pcl",
        "pointcard.rakuten.co.jp":"rpc",
        "pointmall.rakuten.co.jp":"pml",
        "product.rakuten.co.jp":"knv",
        "qa-live.tv.rakuten.co.jp":"rtv",
        "qa-sm.rakuten.co.jp":"rsn",
        "qa.channel.rakuten.co.jp":"rch",
        "qa.nba.rakuten.co.jp":"nba",
        "qa.tv.rakuten.co.jp":"rtv",
        "qa00-live.tv.rakuten.co.jp":"rtv",
        "rakuten.today":"tdy",
        "raxy.rakuten.co.jp":"rxy",
        "readee.rakuten.co.jp":"rea",
        "realestate.rakuten.co.jp":"fds",
        "recipe.rakuten.co.jp":"rcp",
        "reward.rakuten.co.jp":"rrd",
        "room.rakuten.co.jp":"rom",
        "salary.rakuten.co.jp":"slr",
        "score.rakuten.co.jp":"gra",
        "screen.rakuten.co.jp":"spp",
        "sell.car.rakuten.co.jp":"car",
        "senior.rakuten.co.jp":"snr",
        "shaken.rakuten.co.jp":"sha",
        "shashinkan.rakuten.co.jp":"shs",
        "shopping.drone.rakuten.co.jp":"drn",
        "sm.rakuten.co.jp":"rsn",
        "sp.rakuteneagles.jp":"egl",
        "sports.tv.rakuten.co.jp":"rtv",
        "stay.rakuten.co.jp":"rst",
        "t.in.keirin.kdreams.jp":"krn",
        "t.keirin.kdreams.jp":"krn",
        "t.my.keirin.kdreams.jp":"krn",
        "takarakuji.rakuten.co.jp":"tkk",
        "test.point.rakuten.co.jp":"pcl",
        "ticket.rakuten.co.jp":"tck",
        "toolbar.rakuten.co.jp":"wbs",
        "toto.rakuten.co.jp":"tto",
        "travel.rakuten.co.jp":"trv",
        "tv.rakuten.co.jp":"rtv",
        "universallink.tv.rakuten.co.jp":"rtv",
        "vacation-stay.jp":"rst",
        "viber.co.jp":"vbr",
        "web.screen.rakuten.co.jp":"spp",
        "websearch.rakuten.co.jp":"rkw",
        "winner.toto.rakuten.co.jp":"tto",
        "woman.infoseek.co.jp":"ifw",
        "www.infoseek.co.jp":"ifs",
        "www.linkshare.ne.jp":"tgl",
        "www.nikki.ne.jp":"mns",
        "www.rakuten-airmap.co.jp":"air",
        "www.rakuten-bank.co.jp":"rbn",
        "www.rakuten-card.co.jp":"rkc",
        "www.rakuten-insurance.co.jp":"hkn",
        "www.rakuten-life.co.jp":"lfe",
        "www.rakuten-sec.co.jp":"scr",
        "www.rakuten-sonpo.co.jp":"snp",
        "www.rakuten-ssi.co.jp":"pti",
        "www.rakuten-toushin.co.jp":"rts",
        "www.rakuten-wallet.co.jp":"rwt",
        "www.rakuten.co.jp":"ich",
        "www.rakuteneagles.jp":"egl",
        "www.rebates.jp":"rbt",
        "www.viber.co.jp":"vbr",
        "www.vissel-kobe.co.jp":"vis",
        "young.rakuten.co.jp":"rgw",
        "yoyakusuri.com":"yyk",
        "developers.rakuten.com":"rdv",
        "fan.books.rakuten.co.jp":"ork",
        "personal-finance.rakuten.co.jp":"per",
        "pharmacy.healthcare.rakuten.co.jp":"rhy",
        "fril.jp": "rkm",
        "point.rakuten.co.jp": "pcl",
        "screen.rakuten.co.jp": "spp",
        "order.minijob.rakuten.co.jp": "mnj",
        "senior.rakuten.co.jp": "snr",
        "web.senior.rakuten.co.jp": "snr",
        "media.senior.rakuten.co.jp": "snr",
        "event.senior.rakuten.co.jp": "snr",
        "gora.golf.rakuten.co.jp": "gra",
        "booking.gora.golf.rakuten.co.jp": "gra",
        "search.gora.golf.rakuten.co.jp": "gra",
        "netsuper.rakuten.co.jp": "zsu",
        "collection.rakuten.co.jp": "rcl",
        "browser.rakuten.co.jp": "bro",
        "pharmacy.rakuten.co.jp": "rph",
        "flyer.screen.rakuten.co.jp": "spp",
        "emagazine.rakuten.co.jp": "emg",
        "dm.rakuten.co.jp": "emg",
        "network.mobile.rakuten.co.jp": "rmb",
        "contents.api.screen.rakuten.co.jp":"spp",
        "content-central.rakuten.net":"rcc",
        "www.sports.rakuten.net":"rsd",
        "item.fril.jp":"rkm",
        "support.rakuten-card.jp":"rkc",
        // for test page 
        "kakunin.rakuten.ne.jp": "kaku",
        "enterprise-marketing.sandbox.rakuten.co.jp": "test",
        // FOr Local Test
        "127.0.0.1": "local"
        };
        // search domain in arrays
        var serviceId = domains[domain] || null;
        return serviceId;
    })();

    // var domains = {
    //     "www.rakuten-life.co.jp":"lfe",
    //     "hoken.rakuten.co.jp":"hkn",
    //     "www.rakuten-ssi.co.jp":"hkn",
    //     "insurance.rakuten.co.jp":"ins",
    //     "www.rakuten-sonpo.co.jp":"snp",
    //     "www.rakuten-bank.co.jp":"rbn",
    //     "www.rakuten-sec.co.jp":"scr",
    // }

    var fintech_key = (function(){
        var domain = location.hostname;
        var fintech_domains = [
            "www.rakuten-life.co.jp",
            "hoken.rakuten.co.jp",
            "www.rakuten-ssi.co.jp",
            "insurance.rakuten.co.jp",
            "www.rakuten-sonpo.co.jp",
            "www.rakuten-bank.co.jp",
            "www.rakuten-sec.co.jp",
            // checkç”¨
            // "kakunin.rakuten.ne.jp"
        ];
        if (fintech_domains.indexOf(domain) !== -1) {
            return "fin_";
          } else {
            return "cmo_";
          };
    })();

    // {{device}} judge method
    var getDevice = (function () {
        var ua = navigator.userAgent;
        if (
            ua.indexOf("iPhone") > 0 ||
            ua.indexOf("iPod") > 0 ||
            (ua.indexOf("Android") > 0 && ua.indexOf("Mobile") > 0)
        ) {
            return "sp"
        } else {
            return "pc";
        }
    })();

    var getUrlFromParam = function (redirectParamVal) {
        if (redirectParamVal) {
          try {
            return atob(redirectParamVal);
          } catch (_) {
            return redirectParamVal;
          }
        }
        return undefined;
    };

    function isValidURL(redirectParamVal) {
        try {
          new URL(redirectParamVal);
          return true;
        } catch (_) {
          return false;
        }
    };

    for (var i = 0; i < targets.length; i++) {
        // {{id}} judge method
        var id_value = targets[i].parentNode.id;

        //  scid replace method
        var redirectParamVal = new URLSearchParams(targets[i].href).get("redirect");
        var url = getUrlFromParam(redirectParamVal) || targets[i].href;
        var isBase64Param = !!redirectParamVal && !isValidURL(redirectParamVal);
        var scid_value = targets[i].className;
        var target_ele = scid_value;
        var scid;
        var tmpl = "scid=wi_{{from}}_rmb_{{id}}_{{key}}{{device}}_{{scid_value}}";
        scid = tmpl;
        scid = scid.replace(new RegExp("{{from}}", "gi"), from);
        scid = scid.replace(new RegExp("{{id}}", "gi"), id_value);
        scid = scid.replace(new RegExp("{{key}}", "gi"),fintech_key);
        scid = scid.replace(new RegExp("{{device}}", "gi"), getDevice);
        scid = scid.replace(new RegExp("{{scid_value}}", "gi"), scid_value);
        if (url.lastIndexOf("?") === -1) {
            scid = "?" + scid;
        } else {
            scid = "&" + scid;
        }

        scid = encodeURIComponent(scid)

        var redirect_url_tmp = "https://rd.rakuten.co.jp/rat?R2={{R2}}{{scid}}&acc=1312&aid=1&etype=click&ssc={{ssc}}&pgn={{pgn}}&ref={{refUrl}}&target_ele={{target_ele}}";

        var ssc = 'crossuse_campaign';
        var pgn = 'cmo_pitari';
        var refUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;

        var redirect_url = redirect_url_tmp
        redirect_url = redirect_url.replace(new RegExp("{{R2}}", "gi"), url);
        redirect_url = redirect_url.replace(new RegExp("{{scid}}", "gi"), scid);
        redirect_url = redirect_url.replace(new RegExp("{{ssc}}", "gi"), ssc);
        redirect_url = redirect_url.replace(new RegExp("{{pgn}}", "gi"), pgn);
        redirect_url = redirect_url.replace(new RegExp("{{target_ele}}", "gi"), target_ele);
        redirect_url = redirect_url.replace(new RegExp("{{refUrl}}", "gi"), refUrl);

        targets[i].href = targets[i].href.replace(isBase64Param ? btoa(url): url , isBase64Param ? btoa(redirect_url): redirect_url);

        targets[i].setAttribute('target', '_blank')
        targets[i].setAttribute('data-mno-banner', 'initialized');
    }
})();