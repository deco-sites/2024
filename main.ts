
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import * as uuid from 'https://jspm.dev/uuid';
import * as lodash from 'https://jspm.dev/lodash-es';

const userID = Deno.env.get('UUID') || '41446577-9ca4-4358-8082-1be0e65aace0';

const users = [
    { username: "alice", password: "password123", uuid: userID },
    { username: "bob", password: "letmein", uuid: userID },
];

function generateRandomString(length: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}


function getVlessURL(uuid: string, hostname: string, options: { ws0Rtt?: boolean } = {}) {
    let pathParam = generateRandomString(Math.floor(Math.random() * 11) + 10);
    pathParam = `&path=${encodeURIComponent(pathParam)}?ed=2048`;
    return `vless://${uuid}@${hostname}:443?encryption=none&security=tls&type=ws${pathParam || ''}#${hostname}`;
}


async function serveClient(req: Request, basePath: string) {
    
    const basicAuth = req.headers.get('Authorization') || '';
    const authString = basicAuth.split(' ')?.[1] || '';
    console.log(basePath);
    console.log(req);

    
    const pathname = new URL(req.url).pathname;
    if (pathname.startsWith('/info') && atob(authString).includes(basePath)) {
        
        const env = Deno.env.toObject();
        const responseObj = {
            message: 'hello world',
            supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
            upgradeHeader: req.headers.get('upgrade') || '',
            authString: authString,
            uuidValidate: basePath,
            method: req.method,
            environment: env,
            url: req.url,
            proto: req.proto,
            headers: Object.fromEntries(req.headers.entries()),
            body: req.body ? new TextDecoder().decode(await req.arrayBuffer()) : undefined,
        };
        const responseBody = JSON.stringify(responseObj);
        return new Response(responseBody, {
            status: 200,
            headers: {
                'content-type': 'application/json; charset=utf-8',
            },
        });
    }

    
    if (pathname.includes(basePath)) {
        const url = new URL(req.url);
        const uuid = Deno.env.get('UUID') || basePath;;
        console.log(uuid);
        const hostname = url.hostname;
        const vlessURL = getVlessURL(uuid, hostname, { ws0Rtt: true });

        const result = `
  *******************************************
  ${atob('VjItcmF5Tjo=')}
  ----------------------------
  ${vlessURL.replace('vless://,', 'vless://')}
  *******************************************
  ${atob('U2hhZG93cm9ja2V0Og==')}
  ----------------------------
  ${vlessURL.replace('vless://,', 'vless://')}
  *******************************************
  ${atob('Q2xhc2g6')}
  ----------------------------
  - {name: Argo-Vless, type: vless, server: ${hostname}, port: 443, uuid: ${uuid}, tls: true, servername: ${hostname}, skip-cert-verify: false, network: ws, ws-opts: {path: /${encodeURIComponent(generateRandomString(Math.floor(Math.random() * 11) + 10))}?ed=2048, headers: { Host: ${hostname}}}, udp: false}`;

        return new Response(result, {
            status: 200,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
            },
        });
    }
    console.log(authString);
    console.log(basicAuth);
    
    const user = users.find(user => {
        const decoded = atob(authString);
        return user.username + ':' + user.password === decoded && user.uuid === basePath;
    });
    if (pathname === '/') {
        return new Response(`ok`, {
            status: 200,
            headers: {
                'content-type': 'text/html; charset=utf-8',
            },
        });
    }

}

export {
    serveClient
};

function uuidValidate(this: void, value: string, index: number, obj: string[]): value is any {
    throw new Error('Function not implemented.');
}

export function vlessJs(): string {
    return 'vless-js';
}
/*
定义 delay 函数，返回一个 Promise 对象，延迟指定的毫秒数
参数：ms - 毫秒数
*/
export function delay(ms: number) {
    return new Promise((resolve, rej) => {
        setTimeout(resolve, ms);
    });
}
/*

定义 processWebSocket 函数，返回一个 Promise 对象，用于处理 WebSocket
参数：一个包含 userID、webSocket、rawTCPFactory、libs 等属性的对象
userID - 用户 ID
webSocket - WebSocket 对象
rawTCPFactory - 创建一个 TCP 连接的函数，返回一个 Promise 对象
libs - 包含 uuid 和 lodash 属性的对象
*/
export async function processWebSocket({
    userID,
    webSocket,
    rawTCPFactory,
    libs: {
        uuid,
        lodash
    },
}: {
    userID: string;
    webSocket: WebSocket;
    rawTCPFactory: (port: number, hostname: string) => Promise<any>;
    libs: {
        uuid: any; lodash: any
    };
}) {
    let address = ''; 
    let portWithRandomLog = ''; 
    let remoteConnection: { 
        readable: any;
        writable: any;
        write: (arg0: Uint8Array) => any;
        close: () => void;
    } | null = null; 
    let remoteConnectionReadyResolve: Function; 
    try {
        const log = (info: string, event?: any) => {
        };
        const readableWebSocketStream = makeReadableWebSocketStream(webSocket, log); 
        let vlessResponseHeader: Uint8Array | null = null;
        
        
        readableWebSocketStream
            .pipeTo(
                new WritableStream({
                    async write(chunk, controller) {
                        const vlessBuffer = chunk; 
                        if (remoteConnection) {
                            const number = await remoteConnection.write(
                                new Uint8Array(vlessBuffer)
                            );
                            return;
                        }
                        const {
                            hasError,
                            message,
                            portRemote,
                            addressRemote,
                            rawDataIndex,
                            vlessVersion,
                        } = processVlessHeader(vlessBuffer, userID, uuid, lodash);
                        address = addressRemote || ''; 
                        portWithRandomLog = `${portRemote}--${Math.random()}`;
                        if (hasError) {
                            controller.error(`[${address}:${portWithRandomLog}] ${message} `);
                        }
                        remoteConnection = await rawTCPFactory(portRemote!, address!);
                        vlessResponseHeader = new Uint8Array([vlessVersion![0], 0]);
                        const rawClientData = vlessBuffer.slice(rawDataIndex!);
                        
                        await remoteConnection!.write(new Uint8Array(rawClientData));
                        
                        remoteConnectionReadyResolve(remoteConnection);
                    },
                    close() {
                    },
                    abort(reason) {
                    },
                })
            )
            .catch((error) => {
            });
        
        await new Promise((resolve) => (remoteConnectionReadyResolve = resolve));
        let remoteChunkCount = 0;
        let totoal = 0;
        
        
        await remoteConnection!.readable.pipeTo(
            new WritableStream({
                start() {
                    if (webSocket.readyState === webSocket.OPEN) {
                        webSocket.send(vlessResponseHeader!);
                    }
                },
                async write(chunk: Uint8Array, controller) {
                    function send2WebSocket() {
                        if (webSocket.readyState !== webSocket.OPEN) {
                            controller.error(
                                `can't accept data from remoteConnection!.readable when client webSocket is close early`
                            );
                            return;
                        }
                        webSocket.send(chunk);
                    }

                    remoteChunkCount++;
                    send2WebSocket();
                },
                close() {
                },
                abort(reason) {
                    closeWebSocket(webSocket);
                },
            })
        );
    } catch (error: any) {
        closeWebSocket(webSocket);
    }
    return;
}



export function makeReadableWebSocketStream(
    ws: WebSocket | any,
    log: Function
) {
    let readableStreamCancel = false;
    return new ReadableStream<ArrayBuffer>({
        
        start(controller) {
            ws.addEventListener('message', async (e: {
                data: ArrayBuffer
            }) => {
                const vlessBuffer: ArrayBuffer = e.data;

                controller.enqueue(vlessBuffer);
            });
            ws.addEventListener('error', (e: any) => {
                log('socket has error');
                readableStreamCancel = true;
                controller.error(e);
            });
            ws.addEventListener('close', () => {
                try {
                    log('webSocket is close');
                    if (readableStreamCancel) {
                        return;
                    }
                    controller.close();
                } catch (error) {
                    log(`websocketStream can't close DUE to `, error);
                }
            });
        },
        
        pull(controller) { },
        
        cancel(reason) {
            log(`websocketStream is cancel DUE to `, reason);
            if (readableStreamCancel) {
                return;
            }
            readableStreamCancel = true;
            closeWebSocket(ws);
        },
    });
}


export function closeWebSocket(socket: WebSocket | any) {
    if (socket.readyState === socket.OPEN) {
        socket.close();
    }
}

/*
函数名称：processVlessHeader
函数描述：处理VLESS协议头部信息
参数：
vlessBuffer: ArrayBuffer类型，VLESS协议头部数据
userID: string类型，用户ID
uuidLib: any类型，uuid库
lodash: any类型，lodash库
返回值：
Object类型，包含以下属性：
hasError: boolean类型，表示是否存在错误
message: string类型，存在错误时的错误信息
addressRemote: string类型，远程地址
portRemote: number类型，远程端口
rawDataIndex: number类型，原始数据索引
vlessVersion: Uint8Array类型，VLESS协议版本
*/
export function processVlessHeader(
    vlessBuffer: ArrayBuffer,
    userID: string,
    uuidLib: any,
    lodash: any
) {
    if (vlessBuffer.byteLength < 24) {
        return {
            hasError: true,
            message: 'invalid data',
        };
    }
    const version = new Uint8Array(vlessBuffer.slice(0, 1));
    let isValidUser = false;
    if (uuidLib.stringify(new Uint8Array(vlessBuffer.slice(1, 17))) === userID) {
        isValidUser = true;
    }
    if (!isValidUser) {
        return {
            hasError: true,
            message: 'in valid user',
        };
    }

    const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];

    const command = new Uint8Array(
        vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
    )[0];
    if (command === 1) { } else {
        return {
            hasError: true,
            message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`,
        };
    }
    const portIndex = 18 + optLength + 1;
    const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
    const portRemote = new DataView(portBuffer).getInt16(0);

    let addressIndex = portIndex + 2;
    const addressBuffer = new Uint8Array(
        vlessBuffer.slice(addressIndex, addressIndex + 1)
    );

    const addressType = addressBuffer[0];
    let addressLength = 0;
    let addressValueIndex = addressIndex + 1;
    let addressValue = '';
    switch (addressType) {
        case 1:
            
            addressLength = 4;
            
            addressValue = new Uint8Array(
                vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
            ).join('.'); 
            break;
        case 2:
            
            addressLength = new Uint8Array(
                vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
            )[0];
            
            addressValueIndex += 1;
            
            addressValue = new TextDecoder().decode(
                vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
            );
            
            break;
        case 3:
            
            addressLength = 16;
            
            const addressChunkBy2: number[][] = lodash.chunk(
                new Uint8Array(
                    vlessBuffer.slice(
                        addressValueIndex,
                        addressValueIndex + addressLength
                    )
                ),
                2,
                null
            );
            
            addressValue = addressChunkBy2
                .map((items) =>
                    items.map((item) => item.toString(16).padStart(2, '0')).join('')
                )
                .join(':'); 
            if (addressValue) {
                addressValue = `[${addressValue}]`;
            }
            break;
        default:
    }
    if (!addressValue) {
        
        return {
            hasError: true,
            message: `addressValue is empty, addressType is ${addressType}`,
        };
    }
    
    return {
        hasError: false,
        addressRemote: addressValue,
        portRemote,
        rawDataIndex: addressValueIndex + addressLength,
        vlessVersion: version,
    };
}

let isVaildUser = uuid.validate(userID);

if (!isVaildUser) {
    console.log('not valid');
}


const handler = async (req: Request): Promise<Response> => {
    if (!isVaildUser) {
        
        const response = await fetch("https://401.deno.dev");
        
        const body = await response.text();
        
        return new Response(body, {
            status: 200
        });
        

    }
    
    const upgrade = req.headers.get('upgrade') || '';
    
    console.log(upgrade);
    
    if (upgrade.toLowerCase() != 'websocket') {
        console.log('not websocket request header get upgrade is ' + upgrade);
        return await serveClient(req, userID);
    }
    const {
        socket, 
        response 
    } = Deno.upgradeWebSocket(req); 
    socket.addEventListener('open', () => { }); 

    processWebSocket({ 
        userID,
        webSocket: socket,
        rawTCPFactory: (port: number, hostname: string) => { 
            return Deno.connect({
                port,
                hostname,
            });
        },
        libs: { 
            uuid,
            lodash
        },
    });
    return response; 
};


globalThis.addEventListener('beforeunload', (e) => {
    console.log('About to exit...');
});

globalThis.addEventListener('unload', (e) => {
    console.log('Exiting');
});


serve(handler, {
    port: 8080,
    hostname: '0.0.0.0'
});
