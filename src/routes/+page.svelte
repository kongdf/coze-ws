<script>
  import { pcm16ToBase64, base64ToPCMArrayBuffer } from "$lib/index";
  import PCMAudioPlayer from "$lib/audio_player.js";

  var coze_socket = null;
  var audioStream = null;
  var player = new PCMAudioPlayer(24000);

  let status = $state("null");
  let items = $state([]);

  function initWebsocket() {
    let botid = " ";
    let token = " ";
    const url = `wss://ws.coze.cn/v1/chat?bot_id=${botid}&authorization=Bearer ${token}`;
    coze_socket = new WebSocket(url);

    coze_socket.onopen = () => {
      status = "connected";
    };
    coze_socket.onmessage = (message) => {
      let data = JSON.parse(message.data);
      console.log(data);
      items.push(data);
      if (data.event_type == "conversation.audio.delta") {
        player.pushPCM(base64ToPCMArrayBuffer(data.data.content));
      }
    };

    coze_socket.onclose = (e) => {
      status = "disconnected";
    };
  }
  function chat_update() {
    let config = {
      id: "event_id_1",
      event_type: "chat.update",
      data: {
        chat_config: {
          auto_save_history: true, // 保存历史记录。默认 true
          user_id: "1001", // 标识当前与智能体的用户，由使用方自行定义、生成与维护。user_id 用于标识对话中的不同用户，不同的 user_id，其对话的上下文消息、数据库等对话记忆数据互相隔离。如果不需要用户数据隔离，可将此参数固定为一个任意字符串
        },
        input_audio: {
          // 输入音频格式
          format: "pcm", // 输入音频格式，支持 pcm/wav/ogg。默认 wav
          codec: "pcm", // 输入音频编码。 pcm/opus。默认 pcm
          sample_rate: 48000, // 采样率
          channel: 1, // 通道数
          bit_depth: 16, // 位深
        },
        output_audio: {
          // 输出音频格式
          codec: "pcm",
          pcm_config: {
            sample_rate: 24000, // 默认  24000
            frame_size_ms: 50,
            limit_config: {
              period: 1,
              max_frame_num: 22,
            },
          },
          speech_rate: 0, // 回复的语速，取值范围 [-50, 100]，默认为 0，-50 表示 0.5 倍速，100 表示 2 倍速
          voice_id: null, // 语音合成的音色，默认空字符串表示使用默认音色
        },
        turn_detection: {
          type: "server_vad",
        },
      },
    };
    coze_socket.send(JSON.stringify(config));
  }
  async function getAudio() {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioInput = audioContext.createMediaStreamSource(audioStream);
    // 创建ScriptProcessorNode来处理音频数据
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
    scriptProcessor.onaudioprocess = (event) => {
      if (status == "closed") {
        audioInput.disconnect(scriptProcessor);
        scriptProcessor.disconnect(audioContext.destination);
        player.stop();
        scriptProcessor.close();
      } else {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        const inputData16 = new Int16Array(inputData.length);

        // 将音频数据转换为PCM 16-bit格式
        for (let i = 0; i < inputData.length; i++) {
          inputData16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }
        const customEvent = {
          id: "event_id_" + new Date().getTime(),
          event_type: "input_audio_buffer.append",
          data: {
            delta: pcm16ToBase64(inputData16),
          },
        };
        coze_socket.send(JSON.stringify(customEvent));
      }
    };
    // 将音频流连接到ScriptProcessorNode
    audioInput.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);
    player.connect();
  }
  const stopAudio = () => {
    status = "closed";
    if (audioStream) {
      const tracks = audioStream.getTracks();
      tracks.forEach((track) => track.stop()); // 停止音频流的所有轨道
    }
  };
</script>

<h1>Welcome to coze-websocket-demo</h1>
<div style="display: flex;">
  <p>websocketStatus:{status}</p>
  <button onclick={initWebsocket} class="mr10">1.openWebsocket</button>
  <button onclick={chat_update} class="mr10">2.chat_update</button>
  <button onclick={getAudio}>3.getAudio</button>
  <button onclick={stopAudio}>4.stopAudio</button>
</div>
<div class="warp">
  {#each items as item}
    <li>event_type:{item.event_type}</li>
  {/each}
</div>

<style>
  div * {
    margin-right: 10px;
  }
  .warp {
    width: 600px;
    height: 600px;
    overflow-y: auto;
  }
</style>
