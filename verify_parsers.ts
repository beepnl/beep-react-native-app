import { WeightParser } from './App/Models/WeightModel';
import { AudioParser } from './App/Models/AudioModel';
import { LoRaWanStateParser } from './App/Models/LoRaWanStateModel';
import { LogFileFrameModel } from './App/Models/LogFileFrameModel';
import { Buffer } from 'buffer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertDeepEqual(a: any, b: any, path = ''): void {
  if (a === b) return;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
      assert(a.equals(b), `${path}: Buffers not equal. Expected ${b.toString('hex')}, got ${a.toString('hex')}`);
      return;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    assert(keysA.length === keysB.length, `${path}: keys length mismatch. ${JSON.stringify(keysA)} vs ${JSON.stringify(keysB)}`);
    for (const key of keysA) {
      assertDeepEqual(a[key], b[key], path ? `${path}.${key}` : key);
    }
    return;
  }
  assert(false, `${path}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

console.log('--- RUNNING PARSER VERIFICATION TESTS ---');

// ==========================================
// 1. WeightParser Tests
// ==========================================
console.log('\nRunning WeightParser tests...');

// Case A: Single channel A_GAIN128 (mask: 1), positive value: 1
{
  const payload = Buffer.from([0x01, 0x00, 0x00, 0x01]);
  const result = new WeightParser({ data: payload }).parse();
  assert(result !== undefined, 'WeightParser returned undefined');
  assertDeepEqual(result?.channels, [
    { name: 'A_GAIN128', bitmask: 1, value: 1 }
  ]);
  console.log('  [PASS] WeightParser: Single channel A_GAIN128 (positive value)');
}

// Case B: Single channel A_GAIN128 (mask: 1), negative value: -1 (0xFFFFFF)
{
  const payload = Buffer.from([0x01, 0xFF, 0xFF, 0xFF]);
  const result = new WeightParser({ data: payload }).parse();
  assert(result !== undefined, 'WeightParser returned undefined');
  assertDeepEqual(result?.channels, [
    { name: 'A_GAIN128', bitmask: 1, value: -1 }
  ]);
  console.log('  [PASS] WeightParser: Single channel A_GAIN128 (negative value)');
}

// Case C: Multi-channel A_GAIN128 and A_GAIN64 (mask: 1 | 4 = 5)
// A_GAIN128 value: 255 (0x0000FF), A_GAIN64 value: -8388608 (0x800000)
{
  const payload = Buffer.from([0x05, 0x00, 0x00, 0xFF, 0x80, 0x00, 0x00]);
  const result = new WeightParser({ data: payload }).parse();
  assert(result !== undefined, 'WeightParser returned undefined');
  assertDeepEqual(result?.channels, [
    { name: 'A_GAIN128', bitmask: 1, value: 255 },
    { name: 'A_GAIN64', bitmask: 4, value: -8388608 }
  ]);
  console.log('  [PASS] WeightParser: Multi-channel A_GAIN128 + A_GAIN64');
}

// Case D: All channels enabled (mask: 1 | 2 | 4 = 7)
// A_GAIN128: 2, B_GAIN32: 3, A_GAIN64: 4
{
  const payload = Buffer.from([0x07, 0x00, 0x00, 0x02, 0x00, 0x00, 0x03, 0x00, 0x00, 0x04]);
  const result = new WeightParser({ data: payload }).parse();
  assert(result !== undefined, 'WeightParser returned undefined');
  assertDeepEqual(result?.channels, [
    { name: 'A_GAIN128', bitmask: 1, value: 2 },
    { name: 'B_GAIN32', bitmask: 2, value: 3 },
    { name: 'A_GAIN64', bitmask: 4, value: 4 }
  ]);
  console.log('  [PASS] WeightParser: All channels enabled');
}

// Case E: Payload too short or empty
{
  const payload = Buffer.from([]);
  const result = new WeightParser({ data: payload }).parse();
  assert(result !== undefined, 'WeightParser should return WeightModel');
  assertDeepEqual(result?.channels, []);
  console.log('  [PASS] WeightParser: Empty payload handles gracefully');
}

// ==========================================
// 2. AudioParser Tests
// ==========================================
console.log('\nRunning AudioParser tests...');

// Case A: Channel IN2LP, gain=12, min6dB=false, volume=-10 (0xF6), bins=12, startBin=0, stopBin=11
{
  const payload = Buffer.from([0x01, 12, 0xF6, 12, 0, 11]);
  const result = new AudioParser({ data: payload }).parse();
  assert(result !== undefined, 'AudioParser returned undefined');
  assertDeepEqual(result?.channel, { name: 'IN2LP', bitmask: 1 });
  assert(result?.gain === 12, `Expected gain 12, got ${result?.gain}`);
  assert(result?.min6dB === false, 'Expected min6dB to be false');
  assert(result?.volume === -10, `Expected volume -10, got ${result?.volume}`);
  assert(result?.bins === 12, `Expected bins 12, got ${result?.bins}`);
  assert(result?.startBin === 0, `Expected startBin 0, got ${result?.startBin}`);
  assert(result?.stopBin === 11, `Expected stopBin 11, got ${result?.stopBin}`);
  console.log('  [PASS] AudioParser: Channel IN2LP (min6dB false)');
}

// Case B: Channel IN2RP, gain=40, min6dB=true (reg = 40 | 0x80 = 168), volume=0, bins=8, startBin=2, stopBin=9
{
  const payload = Buffer.from([0x02, 168, 0, 8, 2, 9]);
  const result = new AudioParser({ data: payload }).parse();
  assert(result !== undefined, 'AudioParser returned undefined');
  assertDeepEqual(result?.channel, { name: 'IN2RP', bitmask: 2 });
  assert(result?.gain === 40, `Expected gain 40, got ${result?.gain}`);
  assert(result?.min6dB === true, 'Expected min6dB to be true');
  assert(result?.volume === 0, `Expected volume 0, got ${result?.volume}`);
  assert(result?.bins === 8, `Expected bins 8, got ${result?.bins}`);
  assert(result?.startBin === 2, `Expected startBin 2, got ${result?.startBin}`);
  assert(result?.stopBin === 9, `Expected stopBin 9, got ${result?.stopBin}`);
  console.log('  [PASS] AudioParser: Channel IN2RP (min6dB true)');
}

// Case C: Channel OFF (AIN_OFF = 3)
{
  const payload = Buffer.from([0x03, 0, 0, 0, 0, 0]);
  const result = new AudioParser({ data: payload }).parse();
  assert(result !== undefined, 'AudioParser returned undefined');
  assertDeepEqual(result?.channel, { name: 'OFF', bitmask: 3 });
  assert(result?.gain === 0, `Expected gain 0, got ${result?.gain}`);
  assert(result?.min6dB === false, 'Expected min6dB to be false');
  assert(result?.volume === 0, `Expected volume 0, got ${result?.volume}`);
  assert(result?.bins === 0, `Expected bins 0, got ${result?.bins}`);
  assert(result?.startBin === 0, `Expected startBin 0, got ${result?.startBin}`);
  assert(result?.stopBin === 0, `Expected stopBin 0, got ${result?.stopBin}`);
  console.log('  [PASS] AudioParser: Channel OFF (AIN_OFF = 3)');
}

// Case D: Too short payload (< 6 bytes)
{
  const payload = Buffer.from([0x01, 12, 0xF6, 12, 0]);
  const result = new AudioParser({ data: payload }).parse();
  assert(result === undefined, 'AudioParser should return undefined for short payload');
  console.log('  [PASS] AudioParser: Short payload returns undefined');
}

// Case E: Exhaustive gain (0-127) and min6dB (true/false) verification
{
  let passed = true;
  for (let gain = 0; gain <= 127; gain++) {
    for (const min6dB of [false, true]) {
      const channelBitmask = 1; // IN2LP (bitmask: 1)
      const volume = -10;
      const bins = 12;
      const startBin = 0;
      const stopBin = 11;

      // Construct using writer logic (from CalibrateAudioScreen.tsx):
      const payload = Buffer.alloc(6);
      let i = 0;
      payload.writeUInt8(channelBitmask, i++);
      const gainByte = (gain & 0x7F) | (min6dB ? 0x80 : 0x00);
      payload.writeUInt8(gainByte, i++);
      payload.writeInt8(volume, i++);
      payload.writeUInt8(bins, i++);
      payload.writeUInt8(startBin, i++);
      payload.writeUInt8(stopBin, i++);

      // Parse using AudioParser:
      const result = new AudioParser({ data: payload }).parse();
      if (!result) {
        console.error(`  [FAIL] AudioParser returned undefined for gain=${gain}, min6dB=${min6dB}`);
        passed = false;
        break;
      }
      if (result.gain !== gain) {
        console.error(`  [FAIL] Gain mismatch. Expected ${gain}, got ${result.gain}`);
        passed = false;
        break;
      }
      if (result.min6dB !== min6dB) {
        console.error(`  [FAIL] min6dB mismatch. Expected ${min6dB}, got ${result.min6dB}`);
        passed = false;
        break;
      }
    }
    if (!passed) break;
  }
  if (passed) {
    console.log('  [PASS] AudioParser: Exhaustive gain (0-127) and min6dB (true/false) alignment');
  } else {
    assert(false, 'Exhaustive gain and min6dB verification failed');
  }
}

// ==========================================
// 3. LoRaWanStateParser Tests
// ==========================================
console.log('\nRunning LoRaWanStateParser tests...');

// Case A: State 0x00 -> all false, isDisabled is true
{
  const payload = Buffer.from([0x00]);
  const result = new LoRaWanStateParser({ data: payload }).parse();
  assert(result !== undefined, 'LoRaWanStateParser returned undefined');
  assert(result?.isEnabled === false, 'isEnabled mismatch');
  assert(result?.isDisabled === true, 'isDisabled mismatch');
  assert(result?.hasJoined === false, 'hasJoined mismatch');
  assert(result?.isDutyCycleLimitationEnabled === false, 'isDutyCycleLimitationEnabled mismatch');
  assert(result?.isAdaptiveDataRateEnabled === false, 'isAdaptiveDataRateEnabled mismatch');
  assert(result?.hasValidKeys === false, 'hasValidKeys mismatch');
  console.log('  [PASS] LoRaWanStateParser: All flags disabled');
}

// Case B: State 0x1F (all flags enabled: 1 | 2 | 4 | 8 | 16 = 31) -> isDisabled is false, all others true
{
  const payload = Buffer.from([0x1F]);
  const result = new LoRaWanStateParser({ data: payload }).parse();
  assert(result !== undefined, 'LoRaWanStateParser returned undefined');
  assert(result?.isEnabled === true, 'isEnabled mismatch');
  assert(result?.isDisabled === false, 'isDisabled mismatch');
  assert(result?.hasJoined === true, 'hasJoined mismatch');
  assert(result?.isDutyCycleLimitationEnabled === true, 'isDutyCycleLimitationEnabled mismatch');
  assert(result?.isAdaptiveDataRateEnabled === true, 'isAdaptiveDataRateEnabled mismatch');
  assert(result?.hasValidKeys === true, 'hasValidKeys mismatch');
  console.log('  [PASS] LoRaWanStateParser: All flags enabled');
}

// Case C: State 0x0A (Joined, ADR enabled -> 2 | 8 = 10)
{
  const payload = Buffer.from([0x0A]);
  const result = new LoRaWanStateParser({ data: payload }).parse();
  assert(result !== undefined, 'LoRaWanStateParser returned undefined');
  assert(result?.isEnabled === false, 'isEnabled mismatch');
  assert(result?.isDisabled === true, 'isDisabled mismatch');
  assert(result?.hasJoined === true, 'hasJoined mismatch');
  assert(result?.isDutyCycleLimitationEnabled === false, 'isDutyCycleLimitationEnabled mismatch');
  assert(result?.isAdaptiveDataRateEnabled === true, 'isAdaptiveDataRateEnabled mismatch');
  assert(result?.hasValidKeys === false, 'hasValidKeys mismatch');
  console.log('  [PASS] LoRaWanStateParser: Selective flags (Joined + ADR)');
}

// ==========================================
// 4. LogFileFrameModel Tests
// ==========================================
console.log('\nRunning LogFileFrameModel tests...');

// Case A: Valid frame with payload data
{
  const payload = Buffer.from([0x01, 0x02, 0xAA, 0xBB, 0xCC]);
  const result = LogFileFrameModel.parse(payload);
  assert(result !== null, 'LogFileFrameModel returned null');
  assert(result?.frame === 258, `Expected frame 258, got ${result?.frame}`);
  assert(result?.size === 3, `Expected size 3, got ${result?.size}`);
  assertDeepEqual(result?.data, Buffer.from([0xAA, 0xBB, 0xCC]));
  console.log('  [PASS] LogFileFrameModel: Valid frame and data');
}

// Case B: Too short frame (<= 2 bytes)
{
  const payload = Buffer.from([0x01, 0x02]);
  const result = LogFileFrameModel.parse(payload);
  assert(result === null, 'LogFileFrameModel should return null for 2-byte frame');
  console.log('  [PASS] LogFileFrameModel: Short frame returns null');
}

console.log('\n--- ALL PARSER TESTS COMPLETED SUCCESSFULLY ---');
