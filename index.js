const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");

const config = require('./config');

const pstBot = function () {

    console.log('checking PST...');

    request({
        url: "https://www.pstshop.com/",
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log('request PST website fail', error);
            return;
        }
        const $ = cheerio.load(body);
        const result = [];
        $(".productCarousel-slide .card-body a").each(function (i, elem) {
            const itemName = $(this).text();
            if (itemName.toLowerCase().includes("mask")) {
                const itemLink = $(this).attr('href');
                result.push({ "link": itemLink, "name": itemName });
            }
        });

        const lastResultRawData = fs.readFileSync('result.json', 'utf-8');
        const lastResult = lastResultRawData ? JSON.parse(lastResultRawData) : [];
        // console.log(lastResult);

        // console.log(result);
        fs.writeFileSync("result.json", JSON.stringify(result));

        for (let index = 0; index < result.length; index++) {
            const itemName = result[index].name;

            let isFound = false;
            for (let j = 0; j < lastResult.length; j++) {
                const lastItemName = lastResult[j].name;
                // console.log('compare: ', lastItemName, itemName)
                if (lastItemName === itemName) {
                    isFound = true;
                    break;
                }
            }

            if (!isFound) {
                // new item found
                const itemLink = result[index].link;
                const msgText = `PST( https://www.pstshop.com/ ) Updated: ${itemName} ( ${itemLink} )`;
                console.log(msgText);

                request({
                    url: `https://api.telegram.org/bot${config.tgBotToken}/sendMessage?chat_id=${config.tgChatId}&text=${encodeURI(msgText)}`,
                    method: "GET"
                }, function (error, response, body) {
                    if (error || !body) {
                        console.log('msg send to telegram fail', error);
                        return;
                    }
                });

            }
        }
    });
};

pstBot();
// scrapy every 30s (+ 30s random time)
setInterval(pstBot, (30 + Math.floor(Math.random() * Math.floor(30))) * 1000);
