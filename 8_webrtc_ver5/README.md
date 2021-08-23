7과 동일하지만 녹화기능이 추가되었다.   
녹화 관련 함수를 record.js에 정리하였다. client.js에서 본인 영상의 recordStart()를 하고 meeting.js에서 새로 접속하는 사용자의 영상을 recordStart()한다. 사용자가 나가면 stop()을 하고 방을 종료할 때 download()를 실행한다.   
방장은 방의 개설과 동시에 자신의 stream과 모든 사용자의 stream을 받아와서 녹화를 시작한다.   
다른 사용자가 도중에 나가게 되면 해당 사용자의 녹화는 중단된다. 하지만 아직 다운로드는 되지 않는다.   
방장이 회의를 끝내고자 나가기 버튼을 누르면 녹화를 저장하겠냐는 창이 뜬다. 이때 네를 누르면 현재 진행중인 모든 녹화가 중지되고 중지된 녹화영상을 방장의 pc로 다운로드가 가능하게 된다.   
![image](https://user-images.githubusercontent.com/49871871/128482595-dfe2f604-7fc9-4ab7-aaca-5d2d7a4218de.png)   
 방장이 나가기 버튼을 누르면 녹화를 중지하고 저장할 지 묻는 화면이다.   
    
![image](https://user-images.githubusercontent.com/49871871/128482704-8131ab65-aaaf-4b1c-8e4e-8d0f2989ec7f.png)   
저장할지 여부를 물을 때 '확인'을 눌렀을 때 다운받을 수 있도록 창이 뜬다.   
   
![image](https://user-images.githubusercontent.com/49871871/128482897-bd5f6289-db6b-4dd0-94e9-dff6a1c134ad.png)   
잘 다운된 것을 볼 수 있다.

하지만 아니오를 누르게 되면 녹화된 영상은 다운로드 되지 않고 방을 종료한다.   


    
    
==============================================================================       
캡처 관련 함수를 capture.js에 정리하였다. meeting.js에서 비디오를 생성하고 captureStart()를 한다.   
비디오를 캡처하기 위해서 Canvas를 사용하였다. Canvas란 다양한 그림을 그릴 수 있는 공간을 제공한다. 학생들의 화면 Stream을 가지고 있는 Video요소를 Canvas의 Context에 그림을 그린 후 그린 그림을 URL로 변환하면 비디오를 캡처한 이미지 URL을 얻을 수 있다. Client에서 getContext, drawImage, toDataURL 함수들로 비디오로부터 캡처 이미지를 구하고, socket.emit을 통해 Server로 Room ID, User Name, Time, URL을 넘겨준다. Server에서는 Client로부터 전달받으면 해당 경로에 사진을 저장한다.
방장의 영상을 10초마다 캡처하여 서버의 captures/이름/id 폴더에 jpg로 저장한다.    
![image](https://user-images.githubusercontent.com/49871871/129306360-b51ca15e-4bc3-4252-ba5f-40b2f6dde8c8.png)   
해당 디렉토리에 캡처가 잘 저장된 것을 볼 수 있다.    
지금은 임시로 방장의 영상만 캡처하도록 했지만 학생들의 영상도 캡처하도록 하여 캡처  이용해 머신러닝으로 학생들의 학습도를 측정하는데 사용할 예정이다.   
captures라는 폴더가 없다면 에러가 나므로 주의해야한다.   

==============================================================================       
 서버가 stream을 주고받는 역할을 하기 때문에 사용자 수가 많아 짐에 따라 서버에 부하가 크게 올 수 있다. 실제로 실험을 해봤을 때 coturn서버의 성능이 좋지 못한 탓에 10명 정도가 접속을 하면 거의 서버가 멈춰버리는 상황이 발생했다. 그래서 서버의 부하정도를 실시간으로 확인할 수 있도록 새로운 대쉬보드를 만들었다.      
prometheus와 grafana를 이용하여 리눅스 서버의 cpu, network, ram, disk등 의 서버의 상황을 알 수 있도록 하였다. 코드는 첨부하지 않았다.   
![제목 없음](https://user-images.githubusercontent.com/49871871/130419803-3ef9c248-8d72-48cb-8e22-01617cb091af.png)   
아무도 접속하지 않았을 때의 서버의 상태이다.   
   
![cpu_dashboard2](https://user-images.githubusercontent.com/49871871/130418206-3c7acd12-ed25-47c0-af85-5caa36b2ebcc.PNG)   
7명이 접속하였을 때의 서버의 상태이다.   
시간을 기준으로 변화하는 그래프와 함께 서버의 상태를 나타내 준다.    
   
![image](https://user-images.githubusercontent.com/49871871/130418400-730bf1c3-9b05-4e74-8ac0-960a73c682ca.png)    
밑으로 스크롤을 내려보면 다양한 정보들을 나타내 준다.   
(참고영상 : https://www.youtube.com/watch?v=4WWW2ZLEg74)      



