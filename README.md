실행방법   
-server.js 파일이 있는 위치에 uploads라는 폴더를 추가해준다.   
-ejs, epress, mysql, node-pre-gyp, node.js, socket.io, socket.io-client, wrtc, formidable 모듈을 npm 명령어로 install한다.(이미 있는경우 node_modules, package-lock.json, package.json을 삭제하고 설치한다.)   
-node server.js (또는 mediaServer.js) 명령어를 입력하면 서버가 실행된다. https://localhost에 접속하면 된다.

   
   
============================================================================   
00_beta_webrtc_test : 간단하게 만들어본 화상채팅   
0_webrtc_UI : 새로운 UI를 갖고있다.   
1_webrtc_test, 2_webrtc_test, 3_webrtc_test : 영상교육시스템을 만들기위한 연습용 코드   
4_webrtc_ver1 : 제일 처음만든 영상교육시스템, 에러가 많다.   
5_webrtc_ver2 : 대부분의 에러를 없앴다. 완성도를 높였다.   
6_webrtc_ver3 : 사용자간 1대1 대화기능 추가, 6명씩 비디오가 보이도록 수정   
7_webrtc_ver4 : 1대1 대화기능의 완성도를 높임, dashboard 기능 추가   
8_webrtc_ver5 : 녹화기능 추가, 10초마다 영상 캡처 저장 기능 추가   

============================================================================   
   
[ webRTC API ]

  웹 브라우저 간에 플러그인의 도움 없이 상대방과 실시간으로 미디어 혹은 각종 데이터들을 교환할 수 있도록 하는 API이다. 본 프로젝트에서는 방과후 학교 프로그램에 사용될 미디어 화상 챗 웹 애플리케이션을 작성해야하므로, peer간 stream교환이 가능한 webRTC API를 이용하여 개발하기로 결정했다.

[ webRTC의 동작 과정 ]

- SDP 협상   
![image](https://user-images.githubusercontent.com/49871871/124204348-d807fe80-db19-11eb-891c-e8b50899361f.png)    
그림 1. webRTC SDP 협상


  A와 B가 데이터를 주고 받는다고 가정했을 때, 먼저 통신을 요청하는 A가 RTCPeerConnection(이하 peerconnction)객체를 생성하여 해당 객체를 이용하여 A의 컴퓨터의 미디어 정보를 추출한다. 이 때 추출한 데이터는 이후 A와 B 양 끝단이 서로 미디어 통신을 할 수 있도록 미디어 타입과 포맷, 그리고 대역폭이나 네트워크 정보를 협상할 수 있도록 해주는 SDP(Session Description Protocol) 데이터이다. A가 생성한 SDP데이터를 Offer로 사용하여 B에게 socket을 통해 전달하면, B는 A가 전달한 Offer를 받아 자신의 peerconnection에 저장한 뒤 자신의 SDP 데이터를 Answer로 다시 A에게 전달한다. A는 이를 전달받아 자신의 peerconnection에 역시 전달한다. 아래는 해당 과정을 다이어그램으로 나타낸 것이다.

- ICE Candidate 교환
  A와 B가 webRTC 통신을 하기 전에 앞서서 두 단말이 서로 통신할 수 있는 최적의 네트워크 경로를 찾을 수 있도록 도와주는 프레임워크인 ICE를 이용한다. A와 B는 서로에게 도달할 수 있는 ice candidate가 생성될 때마다 icecandidate 이벤트를 발생시키는데, 해당 이벤트에 대한 핸들러로 socket을 이용해 상대방에게 보내는 로직을 구성하여 서로의 candiate를 교환한다.

- 미디어 교환
  마지막으로 서로의 peerconnection에 addtrack이벤트를 이용하여 입력할 스트림과 트랙을 지정하여 추가해주면 상대 단말에서 peerconnection의 ontrack 이벤트를 수신하여 스트림을 전달 받을 수 있다.


[ webRTC기반 미디어 서버 구축 ]

  앞서 살펴본 webRTC는 peer To peer 방식의 API였다. 그렇기 때문에 webRTC를 기반으로 여러 곳의 peer에서 서로 미디어를 주고 받을 수 있게 하기 위해서는 중앙에 미디어 서버를 두고 스트림을 중계해야한다. 다음은 스트림 중계 방식이다.

  1. Mesh 구조    
  아래 그림과 같이 여러명의 클라이언트는 서로의 스트림을 접속한 클라이언트의 수만큼 보내고 받는다. 그렇기 때문에 peerconnection은 각 클라이언트당 2(n-1)개가 필요하다. 서버에 클라이언트가 하나 접속할 때마다 걸리는 부하는 이미 접속하고 있는 클라이언트의 수를 n이라고 했을 때, 2n 만큼 증가하게 되고, 이는 서버에 걸리는 부하는 적지만 클라이언트에 걸리는 부하는 매우 크다.   
![image](https://user-images.githubusercontent.com/49871871/124204374-e81fde00-db19-11eb-9f74-44a163d78ab8.png)    
그림 2. Mesh 구조    

2. SFU 구조
그림 3 처럼 서버에 접속한 클라이언트들은 자신의 스트림을 서버로 한 번만 보내고 서버는 각 클라이언트들의 스트림을 저장한 뒤 나머지 클라이언트들에게 전송한다. 이렇게 되면 peerconnection 객체는 클라이언트당 n개가 필요하다. peerconnection 수로만 봤을 때 mesh 구조의 절반 가량 차이가 나고, 클라이언트에 걸리는 부하를 줄일 수 있다.

3. MCU 구조    
서버로 스트림을 보낸다는 점에서 SFU구조와 비슷하지만, MCU 구조에서는 클라이언트로 부터 수신한 스트림을 서버에서 믹싱 작업을 거쳐 클라이언트에게 전달하고, 이에 따라 클라이언트는 하나의 스트림만 받으면 되지만, 서버에 걸리는 부하는 커지게 된다.   
![image](https://user-images.githubusercontent.com/49871871/124204401-f5d56380-db19-11eb-96eb-1b7b36678eab.png)   
그림 3. SFU 구조




4. 구조 선택
 
  20~30명 가까이 접속하여 화상 회의를 하는 시스템에 있어서 Mesh 구조는 각 클라이언트에 걸리는 부하가 심각할 것으로 예상되어 제외하고, 서버가 MCU의 믹싱 처리를 감당할 만한 성능을 가지고 있지 않았기 때문에 SFU 구조를 선택하고 진행했다.



![image](https://user-images.githubusercontent.com/49871871/128993402-a3d774c0-fdee-4d75-82e7-3c60a212d78f.png)   


그림 4. 로그인 UI

![image](https://user-images.githubusercontent.com/49871871/128993581-e8942177-df2e-43d0-bd5f-da0e98a70c61.png)   

그림 4.1 방선택 UI   
왼쪽을 선택하는 것을 미팅이라고 하고 오른쪽을 선택하는 것을 세미나라고 하겠다. 둘은 다른 방식으로 영상을 처리하고 보여준다.   
    
    
 ![image](https://user-images.githubusercontent.com/49871871/128993875-81b72df3-5cb6-4cd1-8118-4c546719ca09.png)   
그림 5. 방 생성 UI   
방선택 UI에서 원하는 방식을 선택하면 나오는 화면이다. 강의명, 이름, 방번호를 입력하면 방을 개설할 수 있다.   

[ meeting ]   
![image](https://user-images.githubusercontent.com/49871871/128994311-953cffb9-6440-48ca-b05d-9a098d3052a7.png)   
   

다대다 화상회의 기능이다. 처음 접속한 사용자는 방 생성 페이지에서 방 제목과 자신의 닉네임을 입력하고 방을 생성한다. 방의 종류는 meeting과 seminar 두 종류가 있는데, 이 때 왼쪽을 고르면 meeting용 방을 생성할 수 있다. 그 중 첫번째인 meeting을 먼저 소개한다. 방은  oom_id라는r고유번호를 가지는데, 이 고유번호를 팀원들과 공유하여 같은 방에서 회의를 진행할 수 있다. 고유번호를 제공받은 사용자는 로그인 페이지에서 자신의 닉네임과 room_id를 입력함으로써 방에 입장 가능하다. 그림 4와 그림 5는 로그인과 방 생성 페이지 UI이다.










로그인, 방 생성 이후 페이지가 로드되자마자 서버와 클라이언트간 이벤트를 주고 받으며 화상 회의를 위한 협상 단계를 진행한다. 다음은 각 상황에 따른 이벤트 및 로직 설명이다.

1. room_info
페이지가 로드되자마자 클라이언트는 서버와 socket연결을 맺는다. 이후 서버에게 클라이언트가 접속한 방에 대한 정보(방 제목, 인원 수) 등을 제공받는다.


2. meetingStartFunction
서버로 부터 입장한 방의 정보를 받은 이후 startFunction을 호출한다. startFunction은 자신의 스트림을 보내기 위한 즉, sender역할을 할 peerconnection 객체를 생성하고 offer를 만들어 서버로 전달한 후 join_room 이벤트를 발신한다. 스트림을 전송할 때 보내는 스트림은 오디오와 비디오 트랙을 모두 포함시키지만 자신의 페이지에 출력할 스트림은 오디오 트랙을 제외한 비디오 트랙만을 포함시켜 전송한다. 이유는 오디오 트랙마저 자신의 페이지에 출력하게 되면 울림 현상이 발생하기 때문이다.

3. join_room
서버는 클라이언트의 startFunction에서 발신한 join_room이벤트를 수신한다. 해당 이벤트는 방에 접속한 유저목록에 접속한 클라이언트의 정보를 저장하고, 방에 접속하고 있던 유저들의 정보를 담아 all_users 이벤트를 해당 클라이언트에게 발신한다.

4. all_users
클라이언트가 방에 접속한 유저들의 정보를 함께 담아 발신된 all_users 이벤트를 수신한다. 방의 정보에서 접속한 유저들의 socketId로 구별하여 스트림을 받는 용도의 receieverPeerConnection을 생성한 후 offer를 발생시켜 서버로 전달한다.

5. ontrackHandler (server)
접속한 클라이언트로부터 스트림이 전송되어 서버에 ontrack 이벤트가 발생하면 호출된다. 서버는 방에 접속하고 있었던 다른 유저들에게 새로운 유저가 접속했음을 socket의 broadcast 기능을 이용하여 알리는 데, 이 때 user_enter 이벤트를 발신하여 새로 접속하는 클라이언트의 socketId와 userName을 전송한다.

6. user_enter
user_enter 이벤트를 수신한 접속하고 있었던 다른 유저들은 해당 이벤트를 수신한 후 receiverPeerConnection을 생성하여 새로운 유저의 스트림을 받을 준비를 한다.

7. ontrackHandler (client)
새로운 유저의 스트림이 서버에서 전송이 되면 클라이언트에서 ontrack 이벤트가 발생하게 되고, handler를 호출한다. 해당 함수는 웹 페이지에 새로운 video를 출력할 태그를 생성하고 video의 srcObject에 전달받은 스트림을 추가한다.

8. disconnect
클라이언트 측에서 페이지의 창을 닫았거나 왼쪽 메뉴안의 나가기 버튼을 클릭한 경우 disconnect 이벤트를 서버로 발신한다. 서버가 disconnect 이벤트를 수신하면 저장 중이던 peerconnection 객체를 모두 닫고 삭제하며, 해당 유저의 socketId와 userName, 방에 접속한 유저 리스트에서 삭제한 후 같은 방에 접속하고 있는 다른 클라이언트들에게 user_exit 이벤트를 broadcast 한다.



9. user_exit
같은 방에 있던 유저가 나갔다는 user_exit 이벤트를 수신하면 페이지에 올라가있던 video 태그를 remove하고, 해당 유저의 스트림을 전송 중이던 peerConnection을 닫은 후 삭제한다.   
   
위와 같은 매커니즘을 통해 meeting기능이 구현 되었고, 아래는 실제 팀원과 테스트했던 사진이다.   
![image](https://user-images.githubusercontent.com/49871871/124204454-11406e80-db1a-11eb-9cbd-f14aa77e80ba.png)    
그림 6. meeting Test   






[ seminar ]   
두 가지 회의 방식 중의 하나인 세미나는 강의*회의 와는 다른 방식을 이용한다. 강의*회의의 경우 SFU방식을 이용하여 모든 사용자의 비디오가 화면에 나타나고 모두의 오	디오를 들을 수 있다. 하지만 세미나는 이와는 달리 강사 한 사람의 비디오만 화면에 나타나고 강사의 오디오만 들린다. 다른 사용자는 화면에 이름과 이미지가 좌측 하단에 추가되어 나타난다.

강사의 경우 영상과 오디오를 서버로 전송한다. 서버는 강사의 영상과 오디오를 받고 현재 방에 접속해 있는 모든 클라이언트에게 전송한다. 클라이언트는 강사의 영상과 오디오를 받으며 화면에 나타내준다. 새로운 참가자가 들어오는 경우 강사는 새로운 사용자가 추가된 것을 인지하고 화면의 하단에 이름과 이미지가 추가되지만 영상과 오디오를 서버에게만 보내는 것은 변화가 없다. 하지만 서버는 영상과 오디오를 전송하는 클라이언트의 수가 하나 늘어나게 되고 모든 클라이언트에게 영상과 오디오를 전송하고 추가된 사용자의 정보를 보내서 모든 클라이언트의 화면에 추가된 사용자의 이름과 이미지가 화면 좌측 하단에 추가된다.   
![image](https://user-images.githubusercontent.com/49871871/128994843-074d4cee-d8b0-442c-8024-eaf80c7791cc.png)   
그림 7. seminar UI   

   
[ 채팅 ]   
오른쪽 상단의 채팅 모양 이모티콘을 클릭하면 채팅창이 화면에 나타난다. 채팅을 입력하고 전송 버튼을 누르거나 엔터를 누르면 채팅의 내용이 소켓으로 서버에 전송된다. 서버는 이 소켓 이벤트를 받게 되면 데이터베이스에 채팅의 내용을 기록한 후 같은 방에 있는 모든 클라이언트에게 채팅의 내용을 전송한다. 채팅의 내용을 전달받은 클라이언트는 새로운 채팅을 채팅창에 추가하여 사용자가 채팅을 읽을 수 있도록 해준다.                 
또한 늦게 방에 입장한 사용자는 서버에게 접속 이벤트를 보내고 서버는 이 이벤트를 	받고 해당 클라이언트에게 데이터베이스에 저장되어있던 해당 방의 대화 내용을 전송해준다. 클라이언트는 모든 대화 내용을 서버로부터 전달받게 되고 이를 채팅창에 추가하여 사용자가 해당 방에서 이루어졌던 모든 대화를 볼 수 있게된다.   

![image](https://user-images.githubusercontent.com/49871871/128994949-3bfa123b-f262-4909-9ff9-03243f5e3fe9.png)   

   

[ 화면 공유 ]   
사용자가 자신의 디스플레이 화면을 다른 사용자들에게 보여줄 수 있도록 화면 공유 기능을 구현하였다. 디스플레이 화면의 Stream 가져오는 방법은 화상 채팅에서 자신의 Local Stream을 가져오는 방법과 거의 동일하다. Web API의 MediaDevices.getDisplayMedia 함수를 이용하여	audio와 video 스트림을 받아온다. 아래와 같이 스트림을 정상적으로 받아왔을 때 비디오 태그를 이용한 화면 출력, 공유 중지 이벤트 등을 정의할 수 있고 받아오지 못했을 때 오류 출력 등을 정의할 수 있다.	   
![image](https://user-images.githubusercontent.com/49871871/128995898-34d674d0-4d78-4b27-b9ce-a336e941b8af.png)   
그림 8. 화면 공유   

  받아온 Display Stream을 다른 사람들과 공유하기 위해서, 앞의 화상 채팅 기능과 같이 PeerConnection 생성, Offer - Answer 생성, Candidate 교환, Add Track – On Track의 과정을 수행한다. 화면 공유를 원하는 사용자가 화면 공유 버튼을 누르면 같은 방안의 사용자들은 모두 한 사람의 화면을 볼 수 있도록 구현하였다. ShareStart 함수에서 getDisplayMedia로 Display Stream을 받아오고 정상적으로 받아왔을 때, stream addTrack, SenderPeerConnection, SenderOffer를 생성을 수행한다. Share 요청을 받은 다른 사용자들은 RecieverPeerConnection, RecieverPeerOffer를 생성하고, Ontrack 요청을 받으면 받은 stream을 화면에 띄워준다. 그 외에 화면을 공유한 사람의 비디오 위치- 다른 사용자들의 비디오 위치를 지정하는 함수와 화면을 중지하였을 때 공유한 사람의 화면 처리 - 다른 사용자들의 화면을 처리하는 함수 등을 정의하였다. 앞의 화면 공유와 관련된 코드는 share.js에서 작성하였고, 실제 기능을 실행하면 아래와 같다.

 
[ 1:1 대화 ]   
여러명이 한 방에 있지만 두 사용자만 1대1로 대화가 가능하게한 기능이다. 1대1 대화를 신청하여 수락받으면 1대1 대화가 시작된다. 다른 사용자는 이들의 대화를 듣거나 볼 수 없다.   
 가지고 있는 pc가 두대 뿐이라 두대로 실행해 보았다.(한 대는 두개의 창을 열어 김민수와 전호섭으로 들어왔다. 그래서 둘의 영상의 각도가 같다)
![image](https://user-images.githubusercontent.com/49871871/128483072-58e5d5cb-5b9c-4e1a-9277-4f14df44d783.png)   
비디오에 마우스를 가져다 대면 1대1 대화를 신청할 수 있는 버튼이 나타난다.

![image](https://user-images.githubusercontent.com/49871871/128483126-f9e7554a-cf1a-43ac-96f0-b350809ebb49.png)   
대화신청이 온 경우(김민수가 나에게 1대1 대화를 요청한 경우 )   
   
![image](https://user-images.githubusercontent.com/49871871/128483214-e6a6511d-0e01-4ec8-9ef6-5981df9f6ca2.png)    
1대1 대화중일 때의 화면(나의 화면이 오른쪽 상단에 작게 나오고 상대방의 화면이 크게 나타난다.)   
   
![image](https://user-images.githubusercontent.com/49871871/128485003-70848d1d-f8cd-4dc0-8602-47815f8667fe.png)    
1대1 대화중에 1대1 대화중인 두 사람중 한명이 방을 나가면 1대1대화가 종료되고 원래대로 돌아 온다.   
   
	
[ 이미지 캡처 ]   
방과 후 수업을 맞춰진 화상 강의 프로그램과 머신 러닝을 이용한 수업 흥미도 측정 구현을 목표로 하고 있다. 화상 강의를 기반으로 학생들의 화면을 통해 수업 흥미도를 알아내고자 하고, 	학생들의 화면 데이터는 수업 중의 학생들의 화상 비디오를 캡처한 이미지 형태로 구성할 필요가 있다. 화상 강의가 만들어진 시점으로부터 강의를 듣는 모든 사람들의 비디오를 일정 시간 마다 캡처하도록 한다. (일정 시간은 초단위로 하여 머신 러닝 팀의 이미지를 가져가는 속도를 감안하여 결정할 예정이다) 비디오를 캡처하기 위해서 Canvas를 사용하였다. Canvas란 다양한 그림을 그릴 수 있는 공간을 제공한다. 학생들의 화면 Stream을 가지고 있는 Video요소를 Canvas의 Context에 그림을 그린 후 그린 그림을 URL로 변환하면 비디오를 캡처한 이미지 URL을 얻을 수 있다. Client에서 getContext, drawImage, toDataURL 함수들로 비디오로부터 캡처 이미지를 구하고, socket.emit을 통해 Server로 Room ID, User Name, Time, URL을 넘겨준다. Server에서는 Client로부터 전달받으면 해당 경로에 사진을 저장한다. 앞의 작업을 아래와 같이 함수로 만들고 setInterval로 지정하여 일정 시간마다 반복적으로 수행할 수 있도록 하였다.
	
  ![image](https://user-images.githubusercontent.com/49871871/124204524-33d28780-db1a-11eb-975a-c3bb463bd1ab.png)   
	[사진] 학생들의 화면 이미지 캡처 코드

모든 사용자들의 화면 이미지를 초마다 캡처하기 때문에 구분하기 쉽도록 Capture 파일안에 Room별 디렉토리를 생성하고 파일명은 같은 시간 때의 사람들의 화면이 중요함을 고려하여 ‘이름_시간_분_초.jpg’ 로 정하였다.
   
![image](https://user-images.githubusercontent.com/49871871/124204572-4947b180-db1a-11eb-822e-6be50c772a06.png)   
[사진] Capture안 Room별 디렉토리와 그 안에 저장된 파일명   
   
[ 영상 녹화]   
MediaRecorder를 사용하여 client상에서 녹화를 하도록 하였다. 캠이 있는 사용자가 방에 접속하는 순간부터 영상녹화는 시작된다. 그러다 사용자가 종료를 하게 되면 해당 영상이 방장의 client상에서 recoredChunks에 저장이 된다. 그러다 방장이 방을 종료하려고 하면 저장된 영상을 종료하겠냐고 창이 뜬다. 아니오라고 하면 방이 종료되지만 네라고 하면 아직 종료하지 않은 사용자들의 녹화를 중지하고 영상을 저장한다. 그리고 방장의 client상에서 영상들을 다운로드 받을 수 있도록 창이 뜬다. 해당 창에는 녹화돼있는 모든 영상이 들어있다. 방장은 영상을 다운로드하고 사용을 종료할 수 있다.   
![image](https://user-images.githubusercontent.com/49871871/129307324-f2b45137-3b62-4bd6-995c-92fe1eff2ec3.png)   
![image](https://user-images.githubusercontent.com/49871871/129307338-4ce7c22a-ee66-4ed4-9189-fba41ea6daf3.png)   
![image](https://user-images.githubusercontent.com/49871871/129307355-28ab7ff0-6d4c-456c-afa0-6b927b8dc6c0.png)   
녹화 비디오가 사용자의 명을 가지고 잘 저장되는 것을 볼 수있다.   


