import Discord from 'discord.js';
import Logger from 'log4js';
import proccess from 'process';
import config from './config.js';
import AudioPlayer from './Service/AudioPlayer.js';
import AudioConverter from './Service/AudioConverter.js';
import YouTubeApi from './Service/YouTubeApi.js';

async function main() {
    config.check();
    Logger.configure(config.get().LOG_CONFIG);
    
    const logger = Logger.getLogger('main');
    const yt = new YouTubeApi(config.get().YT_DATA_TOKEN);
    const ac = new AudioConverter();
    const cl = new Discord.Client();
    const ap = new AudioPlayer(cl, yt, ac);

    await ac.init();

    cl.on('ready', () => {
        logger.info('Discord client ready');
    });
    
    // cl.on('debug', (msg: string) => {
    //     console.log('[Discord]', msg);
    // });
    
    cl.on('message', (msg: Discord.Message) => {
        if (!msg.content.startsWith('!')) {
            return;
        }
        logger.info('Got message', msg.content);

        if (msg.content.startsWith('!audio')) {
            ap.dispatch(msg);
        }
        
    });
    
    await cl.login(config.get().DIS_TOKEN);
    
    const bye = async () => {
        logger.info('Got termination signal, shutting down');
        ap.shutdown();
        cl.destroy();

        logger.info('Bye...');
        await new Promise<void>((resolve, reject) => {
            Logger.shutdown((e) => {
                if (e) {
                    reject(e);
                }
                resolve();
            });
        });
    };
    proccess.on('SIGINT', bye);
    proccess.on('SIGTERM', bye);
}

main();
