# webRTC
broadcast로 영상을 전송하기 위한 연습용 코드입니다. 한명의 teacher와 여러명의 student가 존재할 예정입니다.
teacher는 영상을 전송만하고 받지 않는다. student는 영상을 받기만하고 보내지 않습니다.

![image](https://user-images.githubusercontent.com/49871871/124053121-a2501080-da5a-11eb-9ce0-5880b7094449.png)
이름, 방번호, 역할(teacher or student)를 입력받습니다.

![image](https://user-images.githubusercontent.com/49871871/124053233-d297af00-da5a-11eb-98d2-c372769f770c.png)
한명의 teacher와 여러명의 student가 존재하고 있습니다. 현재 나오는 화면은 teacher의 화면입니다. teacher는 자신의 화면이 보이면서 영상을 서버로 송출만하고 student는 서버로부터 teacher의 영상을 받아 화면에 출력합니다.



접속할때 teacher로 접속을 하면 getUserMediaStream에서 video와 audio가 true로되어 자신의 비디오를 만들고 createSenderPeerConnection와 createSenderOffer를 하여 getSenderAnswer를 받으며 자신의 비디오를 전송합니다. 
student로 접속한경우 getUserMediaStream에서 video와 audio가 false라서 createSenderPeerConnection와 createSenderOffer를 하지않고 allUsers소켓 이벤트를 받아 영상을 보내는 사람(teacher)에 대한 createReceiverPeerConnection와 getReceiverAnswer와 getReceiverCandidate하고 createReceiverPeerConnection으로 만들어 놓은 teacher비디오에 영상을 띄웁니다.

broadcast를 연습하기위한 코드라 여기까지만 구현이 되어있고 사용자가 종료했을 경우에 대한 코드는 아직 작성하지 않았다.
