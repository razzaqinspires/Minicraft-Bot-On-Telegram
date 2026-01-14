import bedrock from 'bedrock-protocol';
import mc from 'minecraft-protocol';

const host = '65.21.82.29';
const port = 27103;

console.log(`Checking server ${host}:${port}...`);

try {
  const javaPing = await mc.ping({ host, port: parseInt(port) });
  console.log('Java Ping Success:', javaPing.version);
} catch (err) {
  console.log('Java Ping Failed');
}

try {
  const bedrockPing = await bedrock.ping({ host, port: parseInt(port) });
  console.log('Bedrock Ping Success:', bedrockPing.version);
} catch (err) {
  console.log('Bedrock Ping Failed');
}
