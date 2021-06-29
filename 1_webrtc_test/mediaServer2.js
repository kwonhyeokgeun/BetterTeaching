const { info } = require('console');
const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const path = require('path');
const wrtc = require('wrtc');
//var mysql = require('mysql');

app.use(express.static(__dirname));

const options = {
    key: fs.readFileSync('./keys/private.key'),
    cert: fs.readFileSync('./keys/cert.crt')
};

const server = https.createServer(options, app).listen(443, () => {
    console.log("Create HTTPS Server");
});

app.get('/', (request, response) => {
    response.setHeader('Content-Type', 'text/html');
    fs.readFile('meeting_seminar.html', (err, data) => {
        if(err) {
            console.log(err);
            response.end();
        } else {
            response.end(data);
        }
    });
});

//----------------------------------------------------

const io = require('socket.io')(server);

//접속한 user의 MediaStream을 받기 위한 RTCPeerConnection을 저장
let receivers = {};
//한 user에게 자신을 제외한 다른 user의 MediaStream을 보내기 위한 RTCPeerConnection을 저장
let senders = {};
//receiverPCs에서 연결된 RTCPeerConnection을 통해 받은 MediaStream을 user의 socketID와 함께 저장
let users = {};
//user가 어떤 room에 속해 있는 지 저장
let socketToRoom = {};
let infoOfUsers = {};

let ontrackSwitch = false;

const pc_config = {
    iceServers: [
        // {
        //   urls: 'stun:[STUN_IP]:[PORT]',
        //   'credentials': '[YOR CREDENTIALS]',
        //   'username': '[USERNAME]'
        // },
        {
            urls: "stun:edu.uxis.co.kr"
        },
        {
            urls: "turn:edu.uxis.co.kr?transport=tcp",
                    "username": "webrtc",
                    "credential": "webrtc100!"
        }
    ],
}


io.on('connection', function(socket) {
    console.log("connection");
    socket.on("senderOffer", async (message) => {
        console.log("socket senderOffer, id : ", message.senderSocketId, " in ", message.roomId)
        try {
            socketToRoom[message.senderSocketId] = message.roomId;
            
            let pc = createReceiverPeerConnection(message.senderSocketId, socket, message.roomId);  //서버측 pc생성
            await pc.setRemoteDescription(message.sdp);
            let sdp = await pc.createAnswer({   //서버측 오퍼생성
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(sdp);

            socket.join(message.roomId); //방에 입장시킴
            io.to(message.senderSocketId).emit("getSenderAnswer", { sdp }); //오퍼 보낸 client한테 answer
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("joinRoom", (message) => {
        console.log(message.userName,"socket joinRoom ",message.roomId)
        try {
            let allUsers = getOtherUsersInRoom(message.senderSocketId, message.roomId);
            io.to(message.senderSocketId).emit("allUsers", { users: allUsers });
            infoOfUsers[message.senderSocketId] = {
                userName: message.userName,
                role: message.role,
            };
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("senderCandidate", (message) => {
        console.log("socket senderCandidate, id : ",message.senderSocketId)
        try {
            let pc = receivers[message.senderSocketId];
            pc.addIceCandidate(new wrtc.RTCIceCandidate(message.candidate));
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("receiverOffer", async (message) => {
        console.log("socket receiverOffer, id: ", message.receiverSocketId," in ",message.roomId)
        try {
            let pc = createSenderPeerConnection(
                message.receiverSocketId,
                message.senderSocketId,
                socket,
                message.roomId,
            );
            await pc.setRemoteDescription(message.sdp);
            let sdp = await pc.createAnswer({
                offerToReceiveAudio: false,
                offerToReceiveVideo: false,
            });
            await pc.setLocalDescription(sdp);
            io.to(message.receiverSocketId).emit("getReceiverAnswer", {
                id: message.senderSocketId,
                sdp,
            });
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("receiverCandidate", async (message) => {
        try {
            let senderPC = senders[message.senderSocketId];
			console.log("senderPC :",senderPC);
			console.log(message.candidate);
            await senderPC[0].pc.addIceCandidate(new wrtc.RTCIceCandidate(message.candidate));
        } catch (error) {
            console.log("여긴가?" + error);
        }
    });

});

function createReceiverPeerConnection(socketId, socket, roomId) {
    let pc = new wrtc.RTCPeerConnection(pc_config);
    receivers[socketId] = pc;
    
    pc.onicecandidate = (e) => {
        io.to(socketId).emit("getSenderCandidate", {
            candidate: e.candidate,
        });
    }

    pc.oniceconnectionstatechange = (e) => {
        //console.log(e);
    }

    pc.ontrack = (e) => {
        console.log(e.streams[0]);
        if(!ontrackSwitch) {
            ontrackSwitch = true;
            return;
        }

        if(users[roomId]) {
            if(users[roomId].filter(user => user.id == socketId) == []) return;
            users[roomId].push({
                id: socketId,
                stream: e.streams[0],
            });
        } else {
            users[roomId] = [
                {
                    id: socketId,
                    stream: e.streams[0],
                }
            ];
        }
        console.log('유저확인', users[roomId], " in ",roomId);

        socket.broadcast.to(roomId).emit("userEnter", { 
            id: socketId,
            userName: infoOfUsers[socketId].userName,
            role: infoOfUsers[socketId].role,
            roomId: roomId,
        });
        ontrackSwitch = false;
    }
    return pc;
}

function createSenderPeerConnection(receiverSocketId, senderSocketId, socket, roomId) {
    let pc = new wrtc.RTCPeerConnection(pc_config);

    if(senders[senderSocketId]) {  //senders에 이미 존재하면 
        senders[senderSocketId].filter(user => user.id !== receiverSocketId)
        senders[senderSocketId].push({ id: receiverSocketId, pc: pc })
    } else {  //없으면 senders에 추가
        senders[senderSocketId] = [{
            id: receiverSocketId,
            pc: pc,
        }];
    }
    pc.onicecandidate = (e) => {
        io.to(receiverSocketId).emit("getReceiverCandidate", {
            id: senderSocketId,
            candidate: e.candidate,
        });
    }
    pc.oniceconnectionstatechange = (e) => {
        //console.log(e);
    }
    const sendUser = users[roomId].filter(user => user.id === senderSocketId);
    sendUser[0].stream.getTracks().forEach((track => {
        pc.addTrack(track, sendUser[0].stream);
    }));

    return pc;
}

function getOtherUsersInRoom(senderSocketId, roomId) {
    let allUsers = [];

    if(!users[roomId]) return allUsers;

    let len = users[roomId].length;
    for(let i=0; i<len; i++) {
        if(users[roomId][i].id === senderSocketId) continue;
        allUsers.push({
            id: users[roomId][i].id,
            role: infoOfUsers[users[roomId][i].id].role,
            userName: infoOfUsers[users[roomId][i].id].userName,
            roomId: roomId,
        });
    }
    return allUsers;  //해당 room의 모든 유저 정보 반환
}