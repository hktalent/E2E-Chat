
var g_m = {};
var oMsg = document.getElementById("msg")
function appMsg(s){
    oMsg.innerHTML += '{"urls":"' + s + '"},<br>';
}

async function iceCallback(event,begin,doS,pc) {
    if (event.candidate) {
      if (event.candidate.candidate === '') {
        return;
      }
      const elapsed = ((window.performance.now() - begin) / 1000).toFixed(3);
      const {candidate} = event;
      let url;
      // Until url is available from the candidate, to to polyfill.
      if (['srflx', 'relay'].includes(candidate.type) && !candidate.url) {
        const stats = await pc.getStats();
        stats.forEach(report => {
          if (!url && report.type === 'local-candidate' &&
              report.address === candidate.address &&
              report.port === candidate.port) {
            url = report.url;
          }
        });
      }
      //  && ("117.176.250.29" == candidate.address || "192.168.0.107" == candidate.address)
      // if(candidate.address && candidate.port && "117.176.250.29" == candidate.address){
        if(candidate.address && candidate.port && "192.168.0.107" == candidate.address){
    //   if(candidate.address && candidate.port){
        if(g_m[doS])return;
          g_m[doS]=1;
          var a = [doS,elapsed,candidate.address,candidate.port];
          appMsg(doS)
          console.log(a);
      }
  
      // appendCell(row, candidate.type);
      // appendCell(row, candidate.foundation);
      // appendCell(row, candidate.protocol);
      // appendCell(row, candidate.address);
      // appendCell(row, candidate.port);
      // appendCell(row, formatPriority(candidate.priority));
      // appendCell(row, candidate.url || url || '');
      // appendCell(row, candidate.relayProtocol || '');
      // candidates.push(candidate);
    }
  }


const offerOptions = {offerToReceiveAudio: 1};
  
  async function doOne(one) {
      const config = {
          iceServers: [one],
          iceTransportPolicy: 'all',
      };
      let desc;
      try {
          var begin = window.performance.now();
          var pc = new RTCPeerConnection(config);
          pc.onicecandidate = function(e){
              iceCallback(e,begin,one['urls'],pc)
          };
          pc.onicegatheringstatechange = function(){
              if (pc.iceGatheringState !== 'complete') {
                  return;
              }
              pc.close();
              pc = null;
          };
        //   pc.onicecandidateerror = console.log;
          desc = await pc.createOffer(offerOptions);
      } catch (err) {
        //   console.log(err);
          return;
      }
      
      pc.setLocalDescription(desc);
      
  
      return one;
  }
  
(async function(){
  for(var x in ICE_SERVERS){
      var one = ICE_SERVERS[x];
      doOne(one);
  }
})();
