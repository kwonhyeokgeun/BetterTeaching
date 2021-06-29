const socket = io('https://localhost', {secure: true});

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


let sendPC;  
let receivePCs = {};
let infoOfReceivers = {};
let receiveVideos = {};

//let userId;
let roomId;
let role;

let userName;

console.log("con!!!!");
window.addEventListener('load', () => {
    userName = prompt('이름을 입력해주세요.', '');   
    roomId = prompt('방번호를 입력해주세요.', ''); 
    role = prompt('teacher or student', '');
    if (role =='')  role = 'student';

    getUserMediaStream();
});

function setVideoPosition(role, userName){
    console.log("setVideoPosition")
    var video;
    video = document.createElement('video');
    video.className = 'video_' + userName;
    video.autoplay = true;
	video.playsinline = true;
    document.getElementsByClassName('video')[0].appendChild(video);
    
    var li = document.createElement('li');
    li.className = userName;
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    var dl = document.createElement('dl');
    var txt_bubble = document.createElement('div');
    txt_bubble.className = 'txt_bubble';
    var name_txt = document.createElement('p');
    name_txt.className = 'name_txt';
    name_txt.innerText = userName;
    var id_txt = document.createElement('p');
    id_txt.className = 'id_txt';
    id_txt.innerText = userName;
        
    //var container = document.getElementsByClassName('students')[0];
        
    dd.appendChild(name_txt);
    dd.appendChild(id_txt);
    dl.appendChild(dt);
    dl.appendChild(dd);
    li.appendChild(txt_bubble);
    li.appendChild(dl);
    //container.appendChild(li);

    return video;
}

function getUserMediaStream(){
    if(role =='teacher') var torf = true;
    else if(role=='student') torf=false;
    navigator.mediaDevices
        .getUserMedia({
            audio: torf,
            video: torf,
        })
        .then((stream) => {
            const myVideo = setVideoPosition(role, userName);  //내 비디오 위치등 정보 받기
            selfStream = new MediaStream();
            selfStream.addTrack(stream.getTracks()[1]);
            myVideo.srcObject = selfStream;  //내 비디오 위치에 비디오 넣는듯
            
            localStream = stream;
            console.log("createSenderPeerConnection");
            sendPC = createSenderPeerConnection(socket, localStream);//클라이언트의 pc만듬
            console.log("createSenderOffer");
            createSenderOffer(socket); //offer를 만들고 소캣으로 보냄
            
            socket.emit("joinRoom", {
                userName: userName,
                senderSocketId: socket.id,
                roomId: roomId,
                role: role,
            });
        })
        .catch(error => {
            console.error(`getUserMedia error: ${error}`);
        		
            socket.emit("joinRoom", {
                userName: userName,
                senderSocketId: socket.id,
                roomId: roomId,
                role: role,
            });
		});
        console.log("getUserMediaStream 완료")
}

function createSenderPeerConnection(socket, stream) {
    let pc = new RTCPeerConnection(pc_config);
/*
    pc.onicecandidate = (e) =>{
        console.log("onicecandidate!");
	if(e.candidate) {
            socket.emit("senderCandidate", {
                candidate: e.candidate,
                senderSocketId: socket.id,
            });
        }
    }
*/
    pc.oniceconnectionstatechange = (e) => {
        //console.log(e);
    }

    if(stream) {
        stream.getTracks().forEach((track) => {  //track은 video와 audio를 배열로가짐, 
            pc.addTrack(track, stream);  //video와 audio를 foreach로 loop돌면서 둘다 보냄
        });
    } else {
        console.log("no localStream");
    }

    return pc;
}


socket.on("allUsers", (message) => { //이게오면 모든 유저에 대한 pc를 만들고 오퍼 보내는듯
    console.log("allUsers")
    let len = message.users.length;
    for(let i=0; i<len; i++) {  //왜 모두 다할까?? => 나중에 온사람은 이전의 모든 사람에게 pc를 만듬
        console.log("기존사람:",i+1)
        let pc = createReceiverPeerConnection(message.users[i].id, socket, message.users[i].role, message.users[i].userName);
        createReceiverOffer(pc, socket, message.users[i].id, message.users[i].roomId);
    }
});

socket.on("getSenderAnswer", (message) => {
    try {	
    	console.log("getSenderAnswer");
        sendPC.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } catch (error) {
        console.error(error);
    }
});

socket.on("getReceiverCandidate", (message) => {
    console.log("getReceiverCandidate")
    try {
        let pc = receivePCs[message.id];
        if(!message.candidate) return;
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    } catch (error) {
        console.log(error);
    }
});

socket.on("getReceiverAnswer", async (message) => {
    console.log("getReceiverAnswer")
    try {
        let pc = receivePCs[message.id];
        if(pc.signalingState === 'stable') return;
        console.log(pc.signalingState);
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } catch (error) {
        console.error(error);
    }
});

function createReceiverPeerConnection(socketId, socket, role, userName) {
    console.log("createReceiverPeerConnection")
    let pc = new RTCPeerConnection(pc_config);
    
    receivePCs[socketId] = pc;
/*
    pc.onicecandidate = (e) => {
        if(e.candidate) {
            socket.emit("receiverCandidate", {
                candidate: e.candidate,
                receiverSocketId: socket.id,
                senderSocketId: socketId,
            });
        }
    }
*/
    pc.oniceconnectionstatechange = (e) =>{
        //console.log(e);
    }

    pc.ontrack = (e) => {
        if(receiveVideos[socketId]) return;
        console.log("createReceiverPeerConnection에서, 영상 보내온 유저"+socketId+"의 비디오 만들기")
        receiveVideos[socketId] = setVideoPosition(role, userName); //영상 보내온 유저의 비디오 만들기
        receiveVideos[socketId].srcObject = e.streams[0];   //영상 보내온 유저의 영상 스트림 설정
        //console.log(e.streams[0].getTracks());
    }

    return pc;
}

async function createSenderOffer(socket){
    try {
        let sdp = await sendPC.createOffer({ //sdp는 오퍼, 오퍼 만듬
            offerToReceiveAudio: false,
            offerToReceiveVideo: false,
        });
        await sendPC.setLocalDescription(new RTCSessionDescription(sdp)); //내 오퍼를 내pc에 담기?
        socket.emit("senderOffer", {  //오퍼 보냄
            sdp,
            senderSocketId: socket.id,
            roomId: roomId,
        });
	
    	sendPC.onicecandidate = (e) =>{   //내 cd가 생기면
			console.log("onicecandidate");  
        	if(e.candidate) {
            	socket.emit("senderCandidate", {//내 cd를 보냄
                	candidate: e.candidate,
                	senderSocketId: socket.id,
            	});
        	}
    	}
    } catch(error) {
        console.log("createSenderOffer에서 에러")
        console.log(error);
    }
}

async function createReceiverOffer(pc, socket, senderSocketId, roomId) {
    try {
        let sdp = await pc.createOffer({  //오퍼 만듬
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(new RTCSessionDescription(sdp));
        socket.emit("receiverOffer", {
            sdp,
            receiverSocketId: socket.id,
            senderSocketId: senderSocketId,
            roomId: roomId,
        });
							
    	pc.onicecandidate = (e) => {
    	    if(e.candidate) {
    	        socket.emit("receiverCandidate", {
    	            candidate: e.candidate,
    	            receiverSocketId: socket.id,
    	            senderSocketId: senderSocketId,   //에러났던 부분
    	        });
    	    }
    	}
    } catch (error) {
        console.error(error);
    }
}

function show(){
    socket.emit("show")
    console.log("show emit!")
}