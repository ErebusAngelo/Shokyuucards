const { Client } = require('ssh2');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

console.log('Iniciando deploy del backend vía SSH2...');
const ssh = new Client();

const command = `mkdir -p shokyuucards && cd shokyuucards && git remote set-url origin https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPO} 2>/dev/null || (git init && git remote add origin https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPO}) && echo 'Bajando cambios al VPS...' && git fetch origin master && git reset --hard origin/master && echo 'Corriendo el deploy de backend...' && bash deploy_scripts/server_update.sh`;

ssh.on('ready', () => {
  console.log('Conectado al VPS exitosamente.');
  ssh.exec(command, (err, stream) => {
    if (err) {
        console.error('Error al ejecutar comando:', err);
        ssh.end();
        return;
    }
    stream.on('close', (code, signal) => {
      console.log('Proceso BASH finalizado con código ' + code);
      ssh.end();
    }).on('data', (data) => {
      process.stdout.write('OUT: ' + data);
    }).stderr.on('data', (data) => {
      process.stderr.write('ERR: ' + data);
    });
  });
}).on('error', (err) => {
    console.error('Error de conexión SSH:', err);
}).connect({
  host: process.env.VPS_HOST,
  port: parseInt(process.env.VPS_PORT, 10),
  username: process.env.VPS_USER,
  password: process.env.VPS_PASS,
  readyTimeout: 30000
});
