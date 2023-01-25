// eslint-disable-next-line @typescript-eslint/no-var-requires
const http = require('http')

function sendData(req, res) {
  setTimeout(() => {
    res.writeHead(200)
    res.write('Hello, World!')
    sendData(req, res)
  }, 1000)
}

const server = http.createServer((req, res) => {
  sendData(req, res)
})
server.listen(8080)
