let ontrackHandler = meetingOntrackHandler;
let allUsersHandler = meetingAllUsersHandler;
let userEnterHandler = meetingUserEnterHandler;
let userExitHandler = meetingUserExitHandler;
let startFunction = meetingStart;

let recordersName={}; //녹화자 명단

/*
document.getElementsByClassName('refusal')[0].onclick = (e) => {
    document.getElementsByClassName('chat_accept')[0].style = 'display: none;';
};
document.getElementsByClassName('accept')[0].onclick = (e) => {
    document.getElementsByClassName('chat_accept')[0].style = 'display: none;';
};
*/

// user의 카메라와 마이크에 접근하여 스트림 받은 뒤 peerconnection 객체 생성하고 offer전송(통신 시작)
function meetingStart(userName, roomId, roomLeader){
	/*navigator.getUserMedia = navigator.getUserMedia 
                        || navigator.webkitGetUserMedia 
                        || navigator.mozGetUserMedia 
                        || navigator.msGetUserMedia;

	if (navigator.getUserMedia) {*/


        // 입력 장치 정보 제공
        navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
            const deviceInfo = [];
            var i = 0;
            devices.forEach(function(device) {
                deviceInfo.push(device);
            });
            getDeviceInfo(deviceInfo);
        })
        .catch(function(err) {
            console.log(err.name + ": " + err.message);
        });


		navigator.mediaDevices
			.getUserMedia({
				audio: true,
				/*audio: {
					autoGainControl: false,
					channelCount: 2,
					echoCancellation: false,
					latency: 0,
					noiseSuppression: false,
					sampleRate: 48000,
					sampleSize: 16,
					volume: 1.0
				},*/
				video: true
				//video: {width: {exact: 320}, height: {exact: 240}}	// QVGA
				//video: {width: {exact: 640}, height: {exact: 480}}	// VGA
				//video: {width: {exact: 1280}, height: {exact: 720}}	// HD(여기서 부터 에러)
				//video: {width: {exact: 1920}, height: {exact: 1080}}	// Full HD
			})
			.then(async stream => {
				const myVideo = setNewMeetingVideo(userName, true, socket.id === roomLeader, socket.id);
				selfStream = new MediaStream(); 
				selfStream.addTrack(stream.getVideoTracks()[0]);
				selfStream.addTrack(stream.getAudioTracks()[0]);
				myVideo.srcObject = selfStream;

				userStreams['meeting']['myId'] = selfStream;
				receiveVideos['meeting']['myId'] = myVideo
				receiveVideos['meeting']['myId'].srcObject = selfStream;
				usersName['myId']=userName;
				sendPC['meeting'] = createSenderPeerConnection(stream, 'meeting', 1);
				let offer = await createSenderOffer(sendPC['meeting']);

				socket.emit("join_room", {
					senderSocketId: socket.id,
					roomId: roomId,
					userName: userName,
					purpose: 'meeting',
				});

				await socket.emit("sender_offer", {
					offer,
					senderSocketId: socket.id,
					roomId: roomId,
					userName: userName,
					purpose: 'meeting',
				});

				//captureStart(myVideo);  //내 영상 캡처
			})
			.catch(error => { //noCam인 경우
				console.error(error);
				const myVideo = setNewMeetingVideo(userName, true, socket.id === roomLeader, socket.id);
				userStreams['meeting']['myId'] = null;
				receiveVideos['meeting']['myId'] = myVideo
				receiveVideos['meeting']['myId'].srcObject = null;
				usersName['myId']=userName;

				socket.emit("join_room", {
					senderSocketId: socket.id,
					roomId: roomId,
					userName: userName,
					purpose: 'meeting',
				});
				socket.emit('noCam',{
					roomId:roomId,
					userName:userName
				});
			});
	//}
}

//비디오를 6명씩 잘라서 넣음
function setNewMeetingVideo(userName, isLocal, isLeader, socketId){
    var video = document.createElement('video');
    //video.className = 'video_' + userName;
    video.className = 'video_' + socketId;
    video.autoplay = true;
	video.playsinline = true;
	if(isLocal) {
		video.muted = "muted";
	}
    

    var li = document.createElement("li");
    var v_view = document.createElement("div");
    var info_ctxt = document.createElement("div");
    var nicknm = document.createElement("div");
    var chat_1_1 = document.createElement("div");
    var div = document.createElement("div");
    var a = document.createElement("a");
	var mute_div = document.createElement("div");
    var mute = document.createElement("a");
	var cam_div = document.createElement("div");
	var cam = document.createElement("a");

    a.tabIndex = "0";
    a.innerHTML = "1 : 1 대화신청";
    a.onclick = request_1_1;
    //a.id = userName;
    a.id = socketId;
    chat_1_1.className = "chat_1_1";
    nicknm.className = "nicknm";
    info_ctxt.className = "info_ctxt";
    v_view.className = "v_view";
    //li.className = userName;
    li.className = socketId;
    nicknm.innerHTML = userName;

	mute.className = "mute_div";
	mute.onclick = totAudioMute;
	cam.className = "cam_div";
	cam.onclick = totVideoMute;



    var ul_num=document.getElementsByClassName('slick-track')[0].childElementCount; //li를 추가할 ul의 index
    if(ul_num!==1) ul_num = Math.ceil(ul_num/2);
    var li_num; //ul의 li갯수
    try{
        li_num=document.getElementsByClassName('slick-slide')[ul_num-1].childElementCount;
    }catch{
        $('.slide_box').slick("slickAdd",'<ul></ul>'); //처음 들어왔을 때 ul만들기
        ul_num++;
        li_num=0;
    }
    
    //console.log("li_num:",li_num);
    var container;
    if(li_num !== 6){  //6명이 차지 있지 않을 때
        //console.log("ul_num:",ul_num);
        container = document.getElementsByClassName('slick-slide')[ul_num-1];
    }
    else{   //6명이 차있을 때
        $('.slide_box').slick("slickAdd",'<ul></ul>'); //ul 새로 추가
        ul_num=document.getElementsByClassName('slick-track')[0].childElementCount;
        ul_num = Math.ceil(ul_num/2);  //li를 추가할 ul의 index
        //console.log("ul_num:",ul_num);
        container = document.getElementsByClassName('slick-slide')[ul_num-1];
    }
        

    div.appendChild(a);
    chat_1_1.appendChild(div);
    info_ctxt.appendChild(nicknm);
    v_view.appendChild(video);
    v_view.appendChild(info_ctxt);
    li.appendChild(v_view);
    container.appendChild(li);

	if(isLocal) {
		mute_div.appendChild(mute);
		v_view.appendChild(mute_div);
		cam_div.appendChild(cam);
		v_view.appendChild(cam_div);
	}

    //if(!isLocal) v_view.appendChild(chat_1_1); // (학생들끼리도 1:1 가능한 버전)
    
    if(socket.id === roomLeader && !isLocal) v_view.appendChild(chat_1_1);//자기가 리더고 나머지 사람들에 대한 1대1 요청버튼생성
    if(socket.id !== roomLeader && isLeader) v_view.appendChild(chat_1_1);//자기는 리더가 아닌데 리더에 대한 1대1 요청버튼생성
    if(isLeader) {  //방장인 경우 M마크 뜨게
        var info_ctxt02 = document.createElement('div');
        var label = document.createElement('div');
        info_ctxt02.className = 'info_ctxt02';
        label.className = 'label';
        label.innerHTML = 'M';
        info_ctxt02.appendChild(label);
        v_view.appendChild(info_ctxt02);
		// 방장화면은 테두리
		v_view.setAttribute('style', 'border: 3px solid #ED6353;');
    }

	// 접속자가 방장 아닐경우 화면공유 비활성화
	if(socket.id != roomLeader && isLocal) {
		document.getElementsByClassName('cc_btn')[1].setAttribute('style', 'display:none;');
		document.getElementsByClassName('h_btn')[0].setAttribute('style','display:none;');
	}

    return video;
}

function meetingOntrackHandler(stream, userName, senderSocketId) { //유저가 새로 들어왔을 때 비디오 추가
    if(receiveVideos['meeting'][senderSocketId]) return;
    userStreams['meeting'][senderSocketId] = stream;
    receiveVideos['meeting'][senderSocketId] = setNewMeetingVideo(userName, false, senderSocketId === roomLeader, senderSocketId);

    if(socketId === roomLeader && stream !== null){  
        recordStart(stream,senderSocketId,usersName[senderSocketId]);  //사용자 비디오 녹화
    }
    //console.log('1:1 =',oneoneUserId1,'-',oneoneUserId2);
    if(senderSocketId == oneoneUserId1 || senderSocketId ==oneoneUserId2) setOther_come(senderSocketId);
    else receiveVideos['meeting'][senderSocketId].srcObject = stream;
    //console.log(stream);
    if(socket.id == oneoneUserId1 || socket.id == oneoneUserId2) {
	    get11MuteCome(senderSocketId);
    }
}

function meetingOutOntrackHandler(stream, userName, senderSocketId) {  //사용자가 나갔을때, 모든 비디오를 없앤거에 다시 비디오 생성
    
    if(senderSocketId === 'myId'){
        receiveVideos['meeting'][senderSocketId]=setNewMeetingVideo(userName, senderSocketId === 'myId', (senderSocketId === roomLeader ) || (socket.id === roomLeader), senderSocketId);
    }
    else{
        receiveVideos['meeting'][senderSocketId]=setNewMeetingVideo(userName, senderSocketId === 'myId', (senderSocketId === roomLeader ), senderSocketId);
    }
    if(senderSocketId == oneoneUserId1 || senderSocketId ==oneoneUserId2) receiveVideos['meeting'][senderSocketId].srcObject = stream; //setOther_come(senderSocketId);
    else receiveVideos['meeting'][senderSocketId].srcObject = stream;
    //console.log(stream);
	
}

async function meetingAllUsersHandler(message) {   //자신을 제외한 모든 유저의 receiverPc생성, 비디오 생성(처음 접속했을 때 한번만)
    try {
	    if(message.oneoneUserId){
            oneoneUserId1 = message.oneoneUserId;
            oneoneUserId2 = roomLeader;
        }    
	    
        let len = message.users.length;

        for(let i=0; i<len; i++) {
            var socketId = message.users[i].socket_id;
            var userName = message.users[i].user_name;
            var stream = message.users[i].stream;
            
            if(stream ===null){ //noCam인 경우
                usersName[socketId]=userName;
                meetingOntrackHandler(null, userName, socketId)
            }
            else{
                console.log(userName,stream);
                usersName[socketId]=userName;
                let pc = createReceiverPeerConnection(socketId, userName, 'meeting', meetingOntrackHandler);
                let offer = await createReceiverOffer(pc);
                setTimeout(500);
                receivePCs['meeting'][socketId] = pc;
        
                await socket.emit("receiver_offer", {
                    offer,
                    receiverSocketId: socket.id,
                    senderSocketId: socketId,
                    purpose: 'meeting',
                });	
            }
        }
    } catch(err) {
        console.error(err);
    }
}

async function meetingUserEnterHandler(message) {   //누군가 들어왔을 때
    if(message.stream ===null){ //noCam인 경우
        usersName[message.socketId]=message.userName;
        meetingOntrackHandler(null, message.userName, message.socketId)

        document.getElementsByClassName('c_r')[0].innerHTML = ++numOfUsers + '명';
        document.getElementById('num_user_span').innerHTML = numOfUsers + '명';
        check_enter_1_1(message.socketId); 
    }
    else{
        try {
            let pc = createReceiverPeerConnection(message.socketId, message.userName, 'meeting', meetingOntrackHandler);
            let offer = await createReceiverOffer(pc);
            usersName[message.socketId]=message.userName;
            receivePCs['meeting'][message.socketId] = pc;

            await socket.emit("receiver_offer", {
                offer,
                receiverSocketId: socket.id,
                senderSocketId: message.socketId,
                purpose: 'meeting',
            });

            document.getElementsByClassName('c_r')[0].innerHTML = ++numOfUsers + '명';
            document.getElementById('num_user_span').innerHTML = numOfUsers + '명';
            
            check_enter_1_1(message.socketId);    
            
        } catch (error) {
            console.error(error);
        }
    }
}

function meetingUserExitHandler(message) {  //누군가 나갔을 때
    let socketId = message.id;
    let userName = message.userName;

    if(socketId === roomLeader) document.getElementById('disconnect').click();

    document.getElementsByClassName('c_r')[0].innerHTML = --numOfUsers + '명';
    document.getElementById('num_user_span').innerHTML = numOfUsers + '명';

    try{    
        mediaRecorder[socketId].stop()  //녹화 종료 //나가면 알아서 stop()됨
    }catch{
        ;
    }

    try{receivePCs[message.purpose][socketId].close();}catch(e){;}
    try{delete receivePCs[message.purpose][socketId];}catch(e){;}
    try{delete userStreams[message.purpose][socketId];}catch(e){;}
    try{delete receiveVideos[message.purpose][socketId];}catch(e){;}
    try{delete usersName[socketId];}catch(e){;}
    
    $('.slick-track').empty();  //모든 비디오 없애기
    for(let id in userStreams['meeting']) {  //하나씩 비디오 새로 만들기
        userName=usersName[id]
        meetingOutOntrackHandler(userStreams['meeting'][id], userName, id)

    }
    
    check_exit_1_1(socketId);
}
  

//뒤로가기 못하게
history.pushState(null,null,location.href);
window.onpopstate = function(event) {
    console.log("No Back");
    history.go(1);
}



// 입력장치 변경할 사용자 비디오
function updateMeetingVideo(userName, isLocal, isLeader, socketId){
    var video = $('video.video_'+socketId)[0]; // get HTMLVideoElement
	
    return video;
}

/*
// 시계
setInterval(getTime, 1000);
function getTime(){
    const time = new Date();
    const hour = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    $('.now_clock').html(`${hour<10 ? `0${hour}`:hour}:${minutes<10 ? `0${minutes}`:minutes}:${seconds<10 ? `0${seconds}`:seconds}`);
}
*/ 



// 나의 영상 비활성화
function totVideoMute() {
	
	if($(".cam_div").attr('class') == 'cam_div')
		$(".cam_div").attr('class','uncam_div');
	else
		$(".uncam_div").attr('class','cam_div');
	
	try{
		userStreams['meeting']['myId'].getVideoTracks()[0].enabled = !userStreams['meeting']['myId'].getVideoTracks()[0].enabled;
	}catch(err){
		console.error(err);
	}
}

// 나의 오디오 비활성화
function totAudioMute() {
	if($(".mute_div").attr('class') == 'mute_div')
		$(".mute_div").attr('class','unmute_div');
	else
		$(".unmute_div").attr('class','mute_div');
	
	try{
		userStreams['meeting']['myId'].getAudioTracks()[0].enabled = !userStreams['meeting']['myId'].getAudioTracks()[0].enabled
/*
		socket.emit("audio_mute", {
			senderSocketId: socket.id,
			roomId: roomId,
			userName: userName,
			purpose: 'meeting',
		});
*/		
	}catch(err){
		console.error(err);
	}
}

let vi, vq, ai, ao, mv;
// 입력장치 정보 제공
function getDeviceInfo(data) {
    $('#audioinput').children().remove();
    $('#audiooutput').children().remove();
    $('#videoinput').children().remove();
    
    //중복 미디어 제거
    let newData = data.filter((element,i) => {
        return(
            data.findIndex((item, j) =>{
                return element.groupId === item.groupId;
            }) === i
        );
    });
    
    newData.forEach(function(device){
            if(device.kind == 'audioinput') $('#audioinput').append('<option value=' + device.deviceId + ' ' + (ai === device.deviceId ? 'selected >' : '>') + device.label + '</option>' );
            if(device.kind == 'audiooutput') $('#audiooutput').append('<option value=' + device.deviceId + ' ' + (ao === device.deviceId ? 'selected >' : '>') + device.label + '</option>' );
            if(device.kind == 'videoinput') $('#videoinput').append('<option value=' + device.deviceId + ' ' + (vi === device.deviceId ? 'selected >' : '>') + device.label + '</option>' );
    });
}

// 입력장치 변경
function changeDevice(){
    /*
    const videoinput;
    const audioinput;
    const audiooutput;
    const videoQuality;*/
console.log('changeDevice')
    if (window.stream){
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    const videoinput = vi = $('#videoinput').val();
    const videoQuality = vq = $('#videoQuality').val().split('x');
    const audioinput = ai = $('#audioinput').val();
    const micVolume = mv = $('#micVolume').val();
    const audiooutput = ao = $('#audiooutput').val();

    /*
    console.log(videoinput);
    console.log(videoQuality[0]+'X'+videoQuality[1]);
    console.log(audioinput);
    console.log(micVolume);
    console.log(audiooutput);
    */
    
    const constraints = {
        audio:  {
            deviceId: audioinput ? {exact: audioinput} : undefined,
            volume: micVolume ? {exact: micVolume} : undefined,
            //이하 세개 모두 Chrome, Firefox 에서만 Default라서 강제 주입
            echoCancellation : true,            //에코 없애기
            noiseSuppression : true,            //노이즈억제
            channelCount : 1                    //1: Mono  2: Stereo
        },
        video:  {
                    deviceId: videoinput ? {exact: videoinput} : undefined,
                    width: videoQuality ? {exact: videoQuality[0]} : undefined,
                    height: videoQuality ? {exact: videoQuality[1]} : undefined
                }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(getDeviceInfo).catch(handleError);
    

}

function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function attachSinkId(){
    const element = document.querySelector('video');
    const sinkId = $('#audiooutput').val();

    if(typeof element.sinkId !== 'undefined'){
        console.log('--------------------------')
        console.log(element.sinkId)
        element.setSinkId(sinkId)
            .then(() => {
                console.log('Success, audio output device attached: ' + sinkId);
            })
            .catch(error => {
                if(error.name === "SecurityError"){
                    console.log('You need to use TTPS for selecting audio output device: ' + error);
                }
            })
    }else{
        console.warn('Browser does not support output device selection');
    }
}

function gotStream(stream) {
    
    window.stream = stream; // make stream available to console
    $('video.video_'+socketId)[0].srcObject = stream;

	console.log("=================================================");
	console.log(userStreams['meeting']['myId'].getVideoTracks()[0]);
	// console.log(userStreams['meeting']['myId'].getAudioTracks()[0]);

    try{
		userStreams['meeting']['myId'] = stream;
        receiveVideos['meeting']['myId'] = stream;

        //상대에게도 적용시키기
        PCs.forEach(function(pc){
            if(pc.getSenders() != null){
                var sender = pc.getSenders().find(function(s){
                    return s.track.kind == 'video';
                });
                sender.replaceTrack(userStreams['meeting']['myId'].getVideoTracks()[0]);
                sender.replaceTrack(userStreams['meeting']['myId'].getAudioTracks()[0]);
            }
        })
	}catch(e){
		console.log("userStream error : "+e);
	}
    
	console.log(userStreams['meeting']['myId'].getVideoTracks()[0]);
	console.log("=================================================");
    
	//console.log(userStreams['meeting']['myId'].getAudioTracks()[0]);
	/*
	userStreams['meeting']['myId'].getAudioTracks()[0].
	userStreams['meeting']['myId'].getAudioTracks()[0]
	*/

/*
	const tracks = stream.getTracks();
	tracks.forEach(function(track) {
		track.stop();
	});
*/

    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}
