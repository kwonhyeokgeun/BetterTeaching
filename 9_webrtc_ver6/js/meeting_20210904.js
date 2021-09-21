let ontrackHandler = meetingOntrackHandler;
let allUsersHandler = meetingAllUsersHandler;
let userEnterHandler = meetingUserEnterHandler;
let userExitHandler = meetingUserExitHandler;
let startFunction = meetingStart;

let recordersName={}; //��ȭ�� ���

/*
document.getElementsByClassName('refusal')[0].onclick = (e) => {
    document.getElementsByClassName('chat_accept')[0].style = 'display: none;';
};
document.getElementsByClassName('accept')[0].onclick = (e) => {
    document.getElementsByClassName('chat_accept')[0].style = 'display: none;';
};
*/

// user�� ī�޶�� ����ũ�� �����Ͽ� ��Ʈ�� ���� �� peerconnection ��ü �����ϰ� offer����(��� ����)
function meetingStart(userName, roomId, roomLeader){
	/*navigator.getUserMedia = navigator.getUserMedia 
                        || navigator.webkitGetUserMedia 
                        || navigator.mozGetUserMedia 
                        || navigator.msGetUserMedia;

	if (navigator.getUserMedia) {*/
		navigator.mediaDevices
			.getUserMedia({
				audio: true,
				//video: true,
				video: {width: {exact: 320}, height: {exact: 240}}	// QVGA
				//video: {width: {exact: 640}, height: {exact: 480}}	// VGA
				//video: {width: {exact: 1280}, height: {exact: 720}}	// HD
				//video: {width: {exact: 1920}, height: {exact: 1080}}	// Full HD
			})
			.then(async stream => {
				const myVideo = setNewMeetingVideo(userName, true, socket.id === roomLeader, socket.id);
				selfStream = new MediaStream();
				selfStream.addTrack(stream.getVideoTracks()[0]);
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

				//captureStart(myVideo);  //�� ���� ĸó
			})
			.catch(error => { //noCam�� ���
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

//������ 6��� �߶� ����
function setNewMeetingVideo(userName, isLocal, isLeader, socketId){
    var video = document.createElement('video');
    //video.className = 'video_' + userName;
    video.className = 'video_' + socketId;
    video.autoplay = true;
	video.playsinline = true;
    

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
    a.innerHTML = "1 : 1 ��ȭ��û";
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



    var ul_num=document.getElementsByClassName('slick-track')[0].childElementCount; //li�� �߰��� ul�� index
    if(ul_num!==1) ul_num = Math.ceil(ul_num/2);
    var li_num; //ul�� li����
    try{
        li_num=document.getElementsByClassName('slick-slide')[ul_num-1].childElementCount;
    }catch{
        $('.slide_box').slick("slickAdd",'<ul></ul>'); //ó�� ������ �� ul�����
        ul_num++;
        li_num=0;
    }
    
    //console.log("li_num:",li_num);
    var container;
    if(li_num !== 6){  //6���� ���� ���� ���� ��
        //console.log("ul_num:",ul_num);
        container = document.getElementsByClassName('slick-slide')[ul_num-1];
    }
    else{   //6���� ������ ��
        $('.slide_box').slick("slickAdd",'<ul></ul>'); //ul ���� �߰�
        ul_num=document.getElementsByClassName('slick-track')[0].childElementCount;
        ul_num = Math.ceil(ul_num/2);  //li�� �߰��� ul�� index
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

    //if(!isLocal) v_view.appendChild(chat_1_1); // (�л��鳢���� 1:1 ������ ����)
    
    if(socket.id === roomLeader && !isLocal) v_view.appendChild(chat_1_1);//�ڱⰡ ������ ������ ����鿡 ���� 1��1 ��û��ư����
    if(socket.id !== roomLeader && isLeader) v_view.appendChild(chat_1_1);//�ڱ�� ������ �ƴѵ� ������ ���� 1��1 ��û��ư����
    if(isLeader) {  //������ ��� M��ũ �߰�
        var info_ctxt02 = document.createElement('div');
        var label = document.createElement('div');
        info_ctxt02.className = 'info_ctxt02';
        label.className = 'label';
        label.innerHTML = 'M';
        info_ctxt02.appendChild(label);
        v_view.appendChild(info_ctxt02);
		// ����ȭ���� �׵θ�
		v_view.setAttribute('style', 'border: 3px solid #ED6353;');
    }

	// �����ڰ� ���� �ƴҰ�� ȭ����� ��Ȱ��ȭ
	if(socket.id != roomLeader && isLocal) {
		document.getElementsByClassName('cc_btn')[1].setAttribute('style', 'display:none;');
		document.getElementsByClassName('h_btn')[0].setAttribute('style','display:none;');
	}

    return video;
}

function meetingOntrackHandler(stream, userName, senderSocketId) { //������ ���� ������ �� ���� �߰�
    if(receiveVideos['meeting'][senderSocketId]) return;
    userStreams['meeting'][senderSocketId] = stream;
    receiveVideos['meeting'][senderSocketId] = setNewMeetingVideo(userName, false, senderSocketId === roomLeader, senderSocketId);

    if(socketId === roomLeader && stream !== null){  
        recordStart(stream,senderSocketId,usersName[senderSocketId]);  //����� ���� ��ȭ
    }
    //console.log('1:1 =',oneoneUserId1,'-',oneoneUserId2);
    if(senderSocketId == oneoneUserId1 || senderSocketId ==oneoneUserId2) setOther_come(senderSocketId);
    else receiveVideos['meeting'][senderSocketId].srcObject = stream;
    //console.log(stream);
    if(socket.id == oneoneUserId1 || socket.id == oneoneUserId2) {
	    get11MuteCome(senderSocketId);
    }
}

function meetingOutOntrackHandler(stream, userName, senderSocketId) {  //����ڰ� ��������, ��� ������ ���ذſ� �ٽ� ���� ����
    
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

async function meetingAllUsersHandler(message) {   //�ڽ��� ������ ��� ������ receiverPc����, ���� ����(ó�� �������� �� �ѹ���)
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
            
            if(stream ===null){ //noCam�� ���
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

async function meetingUserEnterHandler(message) {   //������ ������ ��
    if(message.stream ===null){ //noCam�� ���
        usersName[message.socketId]=message.userName;
        meetingOntrackHandler(null, message.userName, message.socketId)

        document.getElementsByClassName('c_r')[0].innerHTML = ++numOfUsers + '��';
        document.getElementById('num_user_span').innerHTML = numOfUsers + '��';
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

            document.getElementsByClassName('c_r')[0].innerHTML = ++numOfUsers + '��';
            document.getElementById('num_user_span').innerHTML = numOfUsers + '��';
            
            check_enter_1_1(message.socketId);    
            
        } catch (error) {
            console.error(error);
        }
    }
}

function meetingUserExitHandler(message) {  //������ ������ ��
    let socketId = message.id;
    let userName = message.userName;

    if(socketId === roomLeader) document.getElementById('disconnect').click();

    document.getElementsByClassName('c_r')[0].innerHTML = --numOfUsers + '��';
    document.getElementById('num_user_span').innerHTML = numOfUsers + '��';

    try{    
        //mediaRecorder[socketId].stop()  //��ȭ ���� //������ �˾Ƽ� stop()��
    }catch{
        ;
    }

    try{receivePCs[message.purpose][socketId].close();}catch(e){;}
    try{delete receivePCs[message.purpose][socketId];}catch(e){;}
    try{delete userStreams[message.purpose][socketId];}catch(e){;}
    try{delete receiveVideos[message.purpose][socketId];}catch(e){;}
    try{delete usersName[socketId];}catch(e){;}
    
    $('.slick-track').empty();  //��� ���� ���ֱ�
    for(let id in userStreams['meeting']) {  //�ϳ��� ���� ���� �����
        userName=usersName[id]
        meetingOutOntrackHandler(userStreams['meeting'][id], userName, id)

    }
    
    check_exit_1_1(socketId);
}
  

//�ڷΰ��� ���ϰ�
history.pushState(null,null,location.href);
window.onpopstate = function(event) {
    console.log("No Back");
    history.go(1);
}


function totMute() {
	if($(".mute_div").attr('class') == 'mute_div')
		$(".mute_div").attr('class','unmute_div');
	else
		$(".unmute_div").attr('class','mute_div');
	
    for(var key in usersName) {
		console.log(key);
		/*
		console.log("[totMute]"+userStreams['meeting'][key]);
		console.log("[totMute]"+userStreams['meeting'][key].getAudioTracks()[0]);
		console.log("[totMute]"+userStreams['meeting'][key].getAudioTracks());
		*/
		//try{
		//	userStreams['meeting'][key].getAudioTracks().forEach(track => track.enabled = !track.enabled);
		//}catch(e){console.error(e);}
		//console.log(userStreams['meeting'][key].getAudioTracks()[0].muted);
        //try{userStreams['meeting'][key].getAudioTracks().enabled=!userStreams['meeting'][key].getAudioTracks().enabled;}catch(e){console.error(e);}
    }
}
/*
function totUnmute() {
	console.log("unmute");
	$(".unmute_div").attr('class','mute_div');
	
    for(let key in usersName) {
		console.log(key);
		try{userStreams['meeting'][key].getAudioTracks().enabled=true;}catch(e){console.error(e);}
    }
}*/


// user�� ī�޶�� ����ũ�� �����Ͽ� ��Ʈ�� ���� �� peerconnection ��ü �����ϰ� offer����(��� ����)
function meetingRestart(userName, roomId, roomLeader){
	/*navigator.getUserMedia = navigator.getUserMedia 
                        || navigator.webkitGetUserMedia 
                        || navigator.mozGetUserMedia 
                        || navigator.msGetUserMedia;

	if (navigator.getUserMedia) {*/
	try{userStreams['meeting'][key].getVideoTracks().enabled=true;}catch(e){console.error(e);}
	/*
		navigator.mediaDevices
			.getUserMedia({
				audio: true,
				//video: true,
				video: {width: {exact: 320}, height: {exact: 240}}	// QVGA
				//video: {width: {exact: 640}, height: {exact: 480}}	// VGA
				//video: {width: {exact: 1280}, height: {exact: 720}}	// HD
				//video: {width: {exact: 1920}, height: {exact: 1080}}	// Full HD
			})
			.then(async stream => {
				const myVideo = updateMeetingVideo(userName, true, socket.id === roomLeader, socket.id);
				selfStream = new MediaStream();
				selfStream.addTrack(stream.getVideoTracks()[0]);
				myVideo.srcObject = selfStream;

				userStreams['meeting']['myId'] = selfStream;
				receiveVideos['meeting']['myId'] = myVideo
				receiveVideos['meeting']['myId'].srcObject = selfStream;
				usersName['myId']=userName;
				sendPC['meeting'] = createSenderPeerConnection(stream, 'meeting', 0);
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

				//captureStart(myVideo);  //�� ���� ĸó
			})
			.catch(error => { //noCam�� ���
				console.error(error);
				const myVideo = updateMeetingVideo(userName, true, socket.id === roomLeader, socket.id);
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
	*/
}



// �Է���ġ ������ ����� ����
function updateMeetingVideo(userName, isLocal, isLeader, socketId){
    var video = $('video.video_'+socketId)[0]; // get HTMLVideoElement
	
    return video;
}

