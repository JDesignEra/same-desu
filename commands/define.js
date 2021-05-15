import axios from "axios";
import http from "http";

export const name = "define";


export const execute = async (client, message, args) => {
  http.get({
    host: "od-api.oxforddictionaries.com",
    port: "443",
    path: "/api/v2/lemmas/en/" + args[1],
    method: "GET",
    headers: {
      "app_id": process.env.OXFORD_DICT_ID,
      "app_key": process.env.OXFORD_DICT_KEY
    }
  }, (res) => {
    let body = "";

    res.on("data", d => {
      body += d;
    });

    res.on("end", () => {
      console.log(JSON.stringify(body));
    })
  });
}