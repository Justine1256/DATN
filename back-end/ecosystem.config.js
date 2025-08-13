module.exports = {
  apps: [{
    name: 'soketi',
    script: '/usr/bin/soketi',
    args: 'start --config /etc/soketi.json',
    cwd: '/var/www/marketo.info.vn/back-end'
  }]
}
