const http = require("http");

const host = "localhost";
const port = 8000;

const keyvalStore = {};

const requestListener = function (req, res) {
  const plainPath = req.url.replace(/\?.*$/, "");
  console.log("request url:" + req.url);

  let bodyBuffer = "";
  req.on("data", (chunk) => {
    bodyBuffer += chunk;
  });
  req.on("end", () => {
    if (plainPath.startsWith("/keyval/set/")) {
      const keyFromPath = plainPath.replace("/keyval/set/", "");
      console.log(`Setting key: ${keyFromPath}`);

      const body = JSON.parse(bodyBuffer);
      console.log(JSON.stringify(body, null, 3));
      keyvalStore[keyFromPath] = { set_ms: Date.now(), data: body };
    }

    res.write("OK");
    res.end();
  });
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
