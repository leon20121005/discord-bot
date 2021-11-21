const stream = require('./ytdl-customization');
const ytdl = require('ytdl-core');

const Action = require('./action.model.js');
const Discord = require('discord.js');

class Player {
    constructor() {
        this.queues = new Map();
    }

    pause(message) {
        this.execute('pause', message, (queue) => {
            queue.dispatcher.pause();
            message.channel.send(`${queue.songs[0].title} is paused!`);
        });
    }

    resume(message) {
        this.execute('resume', message, (queue) => {
            queue.dispatcher.resume();
            message.channel.send(`${queue.songs[0].title} is resumed!`);
        });
    }

    skip(message) {
        this.execute('skip', message, (queue) => {
            queue.dispatcher.end();
            message.channel.send(`${queue.songs[0].title} is skip!`);
        });
    }

    stop(message) {
        this.execute('stop', message, (queue) => {
            queue.songs = []
            queue.dispatcher.end();
        });
    }

    list(message) {
        this.execute('list', message, (queue) => {
            var result = '';
            queue.songs.forEach((song, index) => {
                result += `[${index + 1}] ${song.title}\n`;
            });
            const embed = new Discord.MessageEmbed().setColor('#82B1FF').setDescription(result);
            message.channel.send(embed);
        });
    }

    execute(action, message, callback) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send(`There is no song I could ${action}!`);
        } else {
            callback(queue, message);
        }
    }

    async request(message, url) {
        var information;
        var song;
        try {
            information = await ytdl.getInfo(url);
            console.log(`Information: ${information}`);
            song = {
                title: information.videoDetails.title,
                url:   information.videoDetails.video_url
            };
        } catch (error) {
            console.error(error);
            return message.channel.send(error.toString());
        }
        const action = new Action({
            user_id: message.author.id,
            command: 'request',
            video_id: information.videoDetails.videoId
        })
        Action.create(action, (error, result) => {
            if (error) {
                console.error(error);
            } else {
                console.log(`Created: ${JSON.stringify(result)}`);
            }
        });
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            const queue = {
                textChannel: message.channel,
                voiceChannel: message.member.voice.channel,
                connection: null,
                songs: [],
                volume: 1,
                playing: true,
                dispatcher: null
            };
            this.queues.set(message.guild.id, queue);
            queue.songs.push(song);
            try {
                const connection = await queue.voiceChannel.join();
                queue.connection = connection;
                this.play(message.guild, queue);
            } catch (error) {
                console.error(error);
                return message.channel.send(error.toString());
            }
        } else {
            queue.songs.push(song);
            message.channel.send(`${song.title} has been added to the queue!`);
        }
    }

    async play(guild, queue) {
        if (queue.songs.length == 0) {
            queue.voiceChannel.leave();
            this.queues.delete(guild.id);
            return;
        }
        const song = queue.songs[0];
        const dispatcher = queue.connection.play(await stream(song.url, { highWaterMark: 1<<25 })).on('finish', () => {
            queue.songs.shift();
            this.play(guild, queue);
        }).on('error', error => {
            console.error(error);
            queue.textChannel.send(error.toString());
        });
        dispatcher.setVolumeLogarithmic(queue.volume / 5);
        queue.dispatcher = dispatcher;
        queue.textChannel.send(`Start playing: **${song.title}**`);
    }

    async top(message, url) {
        const information = await ytdl.getInfo(url);
        const song = {
            title: information.videoDetails.title,
            url:   information.videoDetails.video_url
        };
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
        }
        else {
            queue.songs.splice(1, 0, song);
            message.channel.send(`${song.title} has been added to the top of queue!`);
        }
        return;
    }
}

module.exports = Player;
