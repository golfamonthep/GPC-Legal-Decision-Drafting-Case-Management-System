import { normalizeThaiText, chunkLegalText } from './chunking';

function testNormalization() {
  const input = "มาตรา  ๘๗   \n\n\n  ผู้ใดกระทำผิด \u200B\u200B";
  const expected = "มาตรา ๘๗\n\nผู้ใดกระทำผิด";
  const result = normalizeThaiText(input);
  if (result !== expected) {
    throw new Error(`Normalization failed. Expected "${expected}", got "${result}"`);
  }
  console.log("Normalization test passed.");
}

function testChunking() {
  const paragraph1 = "มาตรา ๘๗ ในกรณีที่ผู้ใดกระทำการอันเป็นการฝ่าฝืน...".padEnd(400, "ก");
  const paragraph2 = "พ.ศ. ๒๕๖๗ หมวด ๔ ว่าด้วยการแต่งตั้ง...".padEnd(400, "ข");
  const paragraph3 = "ข้อ ๔๘ เพื่อประโยชน์ในการพิจารณา...".padEnd(400, "ค");
  
  const text = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;
  
  const chunks = chunkLegalText(text, 1000, 700, 200);
  
  if (chunks.length === 0) {
    throw new Error("Chunking failed: empty chunks.");
  }
  
  console.log(`Generated ${chunks.length} chunks.`);
  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i} length: ${chunk.length}`);
  });
  
  console.log("Chunking test passed.");
}

try {
  testNormalization();
  testChunking();
  console.log("All chunking tests passed!");
} catch (e) {
  console.error("Test failed:", e);
  process.exit(1);
}
