# webRTC
broadcast로 영상을 전송하기 위한 연습용 코드다. 한명의 teacher와 여러명의 student가 존재할 예정이다.
teacher는 영상을 전송만하고 받지 않는다. student는 영상을 받기만하고 보내지 않는다.

접속할때 teacher로 접속을 하면 getUserMediaStream에서 video와 audio가 true로되어 자신의 비디오를 만들고 createSenderPeerConnection와 createSenderOffer를 하여 getSenderAnswer를 받으며 자신의 비디오를 전송한다. 
student로 접속한경우 getUserMediaStream에서 video와 audio가 false라서 createSenderPeerConnection와 createSenderOffer를 하지않고 allUsers를 받아 영상을 보내는 사람(teacher)의 비디오를 만들고 createReceiverPeerConnection와 getReceiverAnswer하고 createReceiverPeerConnection으로 만들어 놓은 teacher비디오에 영상을 띄운다.

여기까지만 구현이 되어있고 사용자가 종료했을 경우에 대한 코드는 아직 작성하지 않았다.
