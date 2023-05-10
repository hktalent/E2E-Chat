// ICE_SERVERS = [
//   {
//     url: 'turn:numb.viagenie.ca',
//     credential: 'muazkh',
//     username: 'webrtc@live.com'
//   },
//   {
//     url: 'turn:192.158.29.39:3478?transport=tcp',
//     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//     username: '28224511:1379330808'
//   },{
//     url: 'turn:192.158.29.39:3478?transport=udp',
//     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//     username: '28224511:1379330808'
// },
// {
//   url: 'turn:turn.bistri.com:80',
//   credential: 'homeo',
//   username: 'homeo'
// },
// {
//   url: 'turn:turn.anyfirewall.com:443?transport=tcp',
//   credential: 'webrtc',
//   username: 'webrtc'
// }
// ];
// var g_m = {};
// var oMsg = document.getElementById("msg")
// function appMsg(s){
//     oMsg.innerHTML += '{"urls":"' + s + '"},<br>';
// }

// async function iceCallback(event,begin,doS,pc) {
//     if (event.candidate) {
//       if (event.candidate.candidate === '') {
//         return;
//       }
//       const elapsed = ((window.performance.now() - begin) / 1000).toFixed(3);
//       const {candidate} = event;
//       let url;
//       // Until url is available from the candidate, to to polyfill.
//       if (['srflx', 'relay'].includes(candidate.type) && !candidate.url) {
//         const stats = await pc.getStats();
//         stats.forEach(report => {
//           if (!url && report.type === 'local-candidate' &&
//               report.address === candidate.address &&
//               report.port === candidate.port) {
//             url = report.url;
//           }
//         });
//       }
//       // console.log(candidate);
//       //  && ("117.176.250.29" == candidate.address || "192.168.0.107" == candidate.address)
//       // if(candidate.address && candidate.port && "117.176.250.29" == candidate.address){
//         if(candidate.address && candidate.port && "192.168.0.107" == candidate.address){
//     //   if(candidate.address && candidate.port){
//         if(g_m[doS])return;
//           g_m[doS]=1;
//           var a = [doS,elapsed,candidate.address,candidate.port];
//           appMsg(doS)
//           console.log(a);
//       }
  
//       // appendCell(row, candidate.type);
//       // appendCell(row, candidate.foundation);
//       // appendCell(row, candidate.protocol);
//       // appendCell(row, candidate.address);
//       // appendCell(row, candidate.port);
//       // appendCell(row, formatPriority(candidate.priority));
//       // appendCell(row, candidate.url || url || '');
//       // appendCell(row, candidate.relayProtocol || '');
//       // candidates.push(candidate);
//     }
//   }


// const offerOptions = {offerToReceiveAudio: 1};
  
//   async function doOne(one) {
//       const config = {
//           iceServers: [one],
//           iceTransportPolicy: 'all'//'relay'//'all',
//       };
//       let desc;
//       try {
//           var begin = window.performance.now();
//           var pc = new RTCPeerConnection(config);
//           pc.onicecandidate = function(e){
//               iceCallback(e,begin,one['urls'] || one['url'],pc)
//           };
//           pc.onicegatheringstatechange = function(){
//               if (pc.iceGatheringState !== 'complete') {
//                   return;
//               }
//               pc.close();
//               pc = null;
//           };
//         //   pc.onicecandidateerror = console.log;
//           desc = await pc.createOffer(offerOptions);
//       } catch (err) {
//         //   console.log(err);
//           return;
//       }
      
//       pc.setLocalDescription(desc);
      
  
//       return one;
//   }
  
// (async function(){
//   for(var x in ICE_SERVERS){
//       var one = ICE_SERVERS[x];
//       doOne(one);
//   }
// })();



function checkTURNServer(turnConfig, timeout){ 

  return new Promise(function(resolve, reject){

    setTimeout(function(){
        if(promiseResolved) return;
        resolve(false);
        promiseResolved = true;
    }, timeout || 5000);

    var promiseResolved = false
      , myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection   //compatibility for firefox and chrome
      , pc = new myPeerConnection({iceServers:[turnConfig],
        iceTransportPolicy: 'relay',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        // certificates: '',
        iceCandidatePoolSize: '0',
        sdpSemantics: 'unified-plan',
        tcpCandidatePolicy: 'disable',
        IceTransportsType: 'nohost'
      })
      , noop = function(){};
    pc.createDataChannel("");    //create a bogus data channel
    pc.createOffer(function(sdp){
      console.log(sdp.sdp);
      if(sdp.sdp.indexOf('typ relay') > -1){ // sometimes sdp contains the ice candidates...
        promiseResolved = true;
        resolve(true);
      }
      pc.setLocalDescription(sdp, noop, noop);
    }, noop);    // create offer and set local description
    pc.onicecandidate = function(ice){  //listen for candidate events
      if(promiseResolved || !ice || !ice.candidate || !ice.candidate.candidate || !(ice.candidate.candidate.indexOf('typ relay')>-1))  return;
      promiseResolved = true;
      resolve(true);
    };
  });   
}

checkTURNServer({
  urls: 'turn:65.49.208.113:3478',
  username: 'e2eu',
  realm:'chat.51pwn.com',
  credentialType: 'password',
  credential: 'e2zeuP_p'
}).then(function(bool){
  console.log('is TURN server active? ', bool? 'yes':'no');
}).catch(console.error.bind(console));