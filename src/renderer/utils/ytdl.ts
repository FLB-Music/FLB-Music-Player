/* eslint-disable indent-legacy */
import axios from 'axios';

interface AudioQualities {
    '320kbs': string;
    '256kbs': string;
    '192kbs': string;
    '128kbs': string;

}
interface Format {
    size: string;
    f: string;
    q: string;
    k: string;
}

interface Mp3 {
    'auto': Format;
    '320': Format;
    '256': Format;
    '192': Format;
    '128': Format;
    '96': Format;
    '64': Format;
}

interface Links {
    mp3: Mp3;
}

interface _9CloudResponse {
    data: {
        status: string;
        mess: string;
        p: string;
        vid: string;
        title: string;
        t: number;
        a: string;
        links: Links;
    };
}

export interface DownloadResponse {
    data: {
        status: string;
        mess: string;
        c_status: string;
        vid: string;
        title: string;
        ftype: string;
        fquality: string;
        dlink: string;
    }
}

export async function getDownloadLink(ytLink: string, quality = '128kbs'): Promise<DownloadResponse | null> {

    let videoID: string;
    const URLEncodedLink = encodeURI(ytLink);
    const data = `query=${URLEncodedLink}&vt=mp3`;

    const config: any = {
        method: 'post',
        url: 'https://9convert.com/api/ajaxSearch/index',
        data
    };

    const response: _9CloudResponse = await axios(config);
    try {
        const qualities: AudioQualities | any = {
            '320kbs': response.data.links.mp3['320'].k,
            '256kbs': response.data.links.mp3['256'].k,
            '192kbs': response.data.links.mp3['192'].k,
            '128kbs': response.data.links.mp3['128'].k
        };
        videoID = response.data.vid;
        return linkInfo(videoID, qualities[quality]);
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function linkInfo(videoID: string, _9ConvertID: string): Promise<DownloadResponse | null> {
    let data = `vid=${videoID}&k=0%2${_9ConvertID}%3D`;
    data = data.replace('0+', 'B').replace('=%', '%');
    const config: any = {
        method: 'post',
        url: 'https://9convert.com/api/ajaxConvert/convert',
        data
    };
    try {
        const response: DownloadResponse = (await axios(config)).data;
        return response;
    } catch (error) {
        console.log(error);
        return null;
    }
}
