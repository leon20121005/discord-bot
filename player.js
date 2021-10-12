const stream = require('./ytdl-customization.js');
const ytdl = require('ytdl-core');

const Action = require('./action.model.js');

class Player {
    constructor() {
        this.queues = new Map();
    }

    pause(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could pause!');
        } else {
            queue.dispatcher.pause();
            message.channel.send(`${queue.songs[0].title} is paused!`);
        }
        return;
    }

    resume(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could resume!');
        } else {
            queue.dispatcher.resume();
            message.channel.send(`${queue.songs[0].title} is resumed!`);
        }
        return;
    }

    skip(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could skip!');
        } else {
            queue.dispatcher.end();
            message.channel.send(`${queue.songs[0].title} is skip!`);
        }
        return;
    }

    list(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could list!');
        } else {
            var result = '';
            queue.songs.forEach((song, index) => {
                result += `[${index + 1}] ${song.title}\n`;
            });
            message.channel.send(result);
        }
        return;
    }

    async request(message, url) {
        var song;
        await this.getSong(url, (error, result) => {
            if (!error) {
                song = result;
            }
        });
        if (!song) {
            return;
        }
        const action = new Action({
            user_id: message.author.id,
            command: 'request',
            video_id: song.id
        })
        Action.create(action, (error, result) => {
            if (!error) {
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
        var song;
        await this.getSong(url, (error, result) => {
            if (!error) {
                song = result;
            }
        });
        if (!song) {
            return;
        }
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
        }
        else {
            queue.songs.splice(1, 0, song);
            message.channel.send(`${song.title} has been added to the top of queue!`);
        }
        return;
    }

    async getSong(url, callback) {
        try {
            const information = await ytdl.getInfo(url);
            const song = {
                title: information.videoDetails.title,
                id:    information.videoDetails.videoId,
                url:   information.videoDetails.video_url
            };
            console.log(`Information: ${information}`);
            callback(null, song);
        } catch (error) {
            console.error(error);
            callback(error, null);
        }
    }
}

module.exports = Player;
