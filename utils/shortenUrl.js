import axios from "axios";
import chalk from "chalk";

export default async function (url) {
  const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURI(url)}`)

  return res.status === 200 && res.data ?  res.data : url;
}