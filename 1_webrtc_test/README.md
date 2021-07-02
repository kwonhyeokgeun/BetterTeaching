# webRTC

연습삼아 작성해본 코드로 이름과 방번호를 입력하면 방에 입장한다.   
사용자가 접속하면 자신의 비디오가 가장 먼저뜨고 이전에 들어와있는 사용자의 비디오가 차례로 뜬다. 나 자신과 이미 접속해있는 사람들의 비디오를 띄우는 코드만 작성되어 있기 때문에 나 다음으로 들어오는 참가자의 비디오는 뜨지 않는다.
또한 다른 사용자가 종료했을 경우에 대한 코드를 작성하지 않은 상태이다.

(mediaServer2.js를 사용한다.)


![image](https://user-images.githubusercontent.com/49871871/124208552-b8290880-db22-11eb-9807-62428128aaec.png)   
처음 방에 접속한 사람의 화면   
   
![image](https://user-images.githubusercontent.com/49871871/124208595-cf67f600-db22-11eb-84a4-9b103623fffd.png)    
두 번쩨로 접속한 사람의 화면   

![image](https://user-images.githubusercontent.com/49871871/124208632-e6a6e380-db22-11eb-8215-0ec7beeb7044.png)    
세 번쩨로 접속한 사람의 화면   
   
모두 같은 카메라를 사용하였기 때문에 나오는 영상은 같음 하지만 처음 영상이 자신의 영상임



