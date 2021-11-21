const Discord = require('discord.js');
const Player = require('./player.js');

const client = new Discord.Client();
const player = new Player();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    if (message.author.bot) {
        return;
    }
    console.log(message);

    const args = message.content.split(' ');
    console.log(args);

    if (!message.member.voice.channel) {
        return;
    }

    switch (args[0]) {
        case ';pause':
            player.pause(message);
            break;
        case ';resume':
            player.resume(message);
            break;
        case ';skip':
            player.skip(message);
            break;
        case ';stop':
            player.stop(message);
            break;
        case ';list':
            player.list(message);
            break;
        case ';play':
            player.request(message, args[1]);
            break;
        case ';top':
            player.top(message, args[1]);
            break;
    }
});

client.login(process.env.token);
