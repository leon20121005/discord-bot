const ytdl = require('ytdl-core');

class Player {
    constructor() {
        this.queues = new Map();
    }

    pause(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could pause!');
        }
        else {
            queue.dispatcher.pause();
            message.channel.send(`${queue.songs[0].title} is paused!`);
        }
        return;
    }

    resume(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could resume!');
        }
        else {
            queue.dispatcher.resume();
            message.channel.send(`${queue.songs[0].title} is resumed!`);
        }
        return;
    }

    skip(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could skip!');
        }
        else {
            queue.dispatcher.end();
            message.channel.send(`${queue.songs[0].title} is skip!`);
        }
        return;
    }

    list(message) {
        const queue = this.queues.get(message.guild.id);
        if (!queue) {
            message.channel.send('There is no song I could list!');
        }
        else {
            var result = '';
            queue.songs.forEach((song, index) => {
                result += `[${index + 1}] ${song.title}\n`;
            });
            message.channel.send(result);
        }
        return;
    }

    async request(message, url) {
        const information = await ytdl.getInfo(url);
        const song = {
            title: information.videoDetails.title,
            url:   information.videoDetails.video_url
        }
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
            }
            this.queues.set(message.guild.id, queue);
            queue.songs.push(song);
            try {
                const connection = await queue.voiceChannel.join();
                queue.connection = connection;
                this.play(message.guild, queue);
            }
            catch (error) {
                console.log(error);
                return message.channel.send(error);
            }
        }
        else {
            queue.songs.push(song);
            message.channel.send(`${song.title} has been added to the queue!`);
        }
    }

    play(guild, queue) {
        if (queue.songs.length == 0) {
            queue.voiceChannel.leave();
            this.queues.delete(guild.id);
            return;
        }
        const song = queue.songs[0];
        const dispatcher = queue.connection.play(ytdl(song.url)).on('finish', () => {
            queue.songs.shift();
            this.play(guild, queue);
        }).on('error', error => {
            console.error(error)
        });
        dispatcher.setVolumeLogarithmic(queue.volume / 5);
        queue.dispatcher = dispatcher;
        queue.textChannel.send(`Start playing: **${song.title}**`);
    }
}

module.exports = Player;