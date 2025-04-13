// place files you want to import through the `$lib` alias in this folder.
export const pcm16ToBase64 = (pcmData) => {
  // 创建一个 Uint8Array 来存储 PCM 数据
  const buffer = new Uint8Array(pcmData.buffer);
  // 将 Uint8Array 转换为二进制字符串
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  // 使用 btoa 函数将二进制字符串转换为 Base64 编码
  return btoa(binary);
};

export const base64ToPCMArrayBuffer = (base64Data) => {
  // 去除可能存在的 Base64 前缀
  const pureBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  // 对 Base64 进行解码，得到二进制字符串
  const binaryString = atob(pureBase64);
  const len = binaryString.length;
  // 创建一个 Uint8Array 来存储二进制数据
  const uint8Array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  // 返回 ArrayBuffer
  return uint8Array.buffer;
};
