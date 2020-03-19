const Discord = require('discord.js');
const https = require('https');

const client = new Discord.Client();

function getRandomBoolean(probability)
{
    return Math.random() >= probability;
}

function getRandomInteger(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    console.log(message);
    if (message.author.bot == false && getRandomBoolean(0.1) == false)
    {
        const url = `https://www.googleapis.com/customsearch/v1?cx=${process.env.cx}&key=${process.env.key}&q=${message.content}`;
        https.get(url, (response) => {
            let body = '';

            response.on('data', (chunk) => {
                body += chunk;
            });

            response.on('end', () => {
                try
                {
                    const json = JSON.parse(body);
                    const snippet = json.items[0].snippet.split(' ');
                    const length = snippet.length;
                    let randomReply = snippet[getRandomInteger(length)];
                    while (randomReply == message.content)
                    {
                        randomReply = snippet[getRandomInteger(length)];
                    }
                    message.reply(randomReply);
                }
                catch (error)
                {
                    console.error(error.message);
                }
            });

        }).on('error', (error) => {
            console.error(error.message);
        });
    }
});

client.login(process.env.token);
